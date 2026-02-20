# 14 — Debate Comments Pipeline

> **File**: `controllers/DebateCommentController.js` (958 lines)  
> **Prerequisites**: [12 — Debate Rooms](./12-DEBATE-ROOMS.md), [13 — Debate Groups & Counters](./13-DEBATE-GROUPS-COUNTERS.md), [08 — Pinecone](./08-PINECONE-VECTOR-DATABASE.md), [09 — Gemini LLM](./09-GEMINI-LLM-SERVICE.md)

---

## Purpose

This is the most complex controller in the entire platform. When a user posts a debate comment, a multi-stage pipeline runs:

1. **Off-topic detection** (LLM-based)
2. **Embedding generation** (one API call, reused everywhere)
3. **Group matching** (vector similarity → LLM fallback → new group)
4. **Background processing** (regenerate group content + counter-matching)

The pipeline is optimised for speed — the user gets a response after steps 1-3, while step 4 runs in the background.

---

## Performance Budget

```
Best case:  1 embedding call, 0 LLM calls  ~300 ms
Worst case: 1 embedding call, 2 LLM calls  ~1.3 s

Breakdown:
  LLM off-topic detection              → 1 LLM call    (~500 ms) [ALWAYS]
  Embedding generation                  → 1 embed call  (~200 ms) [ALWAYS]
  Vector match found (score ≥ 0.74)     → 0 LLM calls   (~50 ms)
  Vector miss → classifyAndGenerate     → 1 LLM call    (~1 s)
  Background (non-blocking):
    generateGroupContent                → 1 LLM call    (~1 s)
    storeDebateGroup                    → 1 embed call
    storeIdealCounters                  → 2 embed calls
    findCounterByCombinedMatch          → 0 embed calls (reuses)
```

---

## Concurrency Control

The `withRoomLock` function prevents race conditions when multiple comments in the same room process simultaneously:

```javascript
const _roomLocks = new Map();

async function withRoomLock(roomId, fn) {
  const key = String(roomId);
  while (_roomLocks.get(key)) {
    await _roomLocks.get(key);      // Wait for current lock holder
  }
  let resolve;
  const promise = new Promise(r => { resolve = r; });
  _roomLocks.set(key, promise);      // Acquire lock
  try {
    return await fn();
  } finally {
    _roomLocks.delete(key);           // Release lock
    resolve();                        // Wake up waiters
  }
}
```

**Why is this needed?** Without locking, two comments arriving simultaneously could both try to create counter-links for the same group, resulting in duplicate or conflicting links.

---

## The Full Pipeline: `createDebateComment()`

### Step 1: Verify Room & Participation

```javascript
const debateRoom = await DebateRoom.findById(roomId);
if (!debateRoom) → 404

const isParticipant = debateRoom.participants.some(
  p => p.userId.toString() === author.toString()
);
if (!isParticipant) → 403 "You must join the debate room to post comments"
```

### Step 2: LLM Off-Topic Detection

```javascript
// Fetch last 5 comments for context
const recentComments = await DebateComment.find({ debateRoomId: roomId })
  .sort({ createdAt: -1 }).limit(5).select('text stance').lean();

const offTopic = await llmService.analyzeCommentRelevance(
  text,
  debateRoom.title,
  debateRoom.description || '',
  recentComments.reverse()  // Chronological order
);
// Returns: { isOffTopic, label, reason, confidence }
```

### Step 3: Generate Embedding (Once)

```javascript
const commentEmbedding = await vectorService.generateEmbedding(text);
geminiKeyRotation.advanceKey();  // Switch to next API key
```

This single embedding is reused for:
- Group matching (step 5)
- Counter-matching (background step)

### Step 4: Save Comment

```javascript
const comment = new DebateComment({
  debateRoomId: roomId,
  text,
  stance,                         // 'for' or 'against'
  author,                         // User ObjectId
  authorModel,                    // 'NormalUser' | 'CommunityUser' | 'ExpertUser'
  authorName,
  isOffTopic:          offTopic.isOffTopic,
  offTopicReason:      offTopic.reason,
  topicRelevanceLabel: offTopic.label,     // 'Relevant' | 'Tangential' | 'Off-Topic'
});
await comment.save();
```

**If off-topic**: Return immediately with the comment data. Skip all group matching and counter-linking. The comment exists in the database but is not assigned to any group.

```javascript
if (offTopic.isOffTopic) {
  return res.json({
    success: true,
    message: 'Comment posted (marked as off-topic)',
    data: {
      comment: { ...comment.toObject(), groupId: null },
      isOffTopic: true,
      relevanceLabel: offTopic.label,
      relevanceConfidence: offTopic.confidence,
      relevanceReason: offTopic.reason,
    },
  });
}
```

### Step 5: Group Matching

```javascript
// Try vector match first (fast path)
const vectorMatch = await vectorService.matchDebateComment(
  text, roomId, stance, commentEmbedding
);

if (vectorMatch) {
  // ── EXISTING GROUP MATCH ──────────────────────────────
  group = await DebateGroup.findById(vectorMatch.groupId);
  group.commentIds.push(comment._id);
  await group.save();

  // Background: refresh group content + counter-match
  background(() => backgroundRefreshGroup(group, roomId, stance, debateRoom, commentEmbedding));
}

if (!vectorMatch) {
  // ── NO VECTOR MATCH → LLM CLASSIFICATION ──────────────
  const groups = await DebateGroup.find({ debateRoomId: roomId, stance });
  const labels = groups.map(g => g.label);

  // Single combined call: classify + generate title/desc/idealCounters
  const result = await llmService.classifyAndGenerateContent(text, labels);

  if (!result.shouldCreateNew && result.matchedGroup) {
    // LLM matched an existing group
    group = await DebateGroup.findOne({ label: result.matchedGroup, debateRoomId: roomId, stance });
    group.commentIds.push(comment._id);
    await group.save();
    background(() => backgroundRefreshGroup(group, roomId, stance, debateRoom, commentEmbedding));
  } else {
    // CREATE NEW GROUP
    group = new DebateGroup({
      debateRoomId: roomId,
      label: result.newLabel,
      title: result.title,
      description: result.description,
      stance,
      commentIds: [comment._id],
      idealCounters: result.idealCounters,
      displayOrder: /* next available order */,
    });
    await group.save();

    // AWAIT Pinecone store (must be visible for future queries)
    await vectorService.storeDebateGroup(group._id, result.title, result.description, roomId, stance);

    // Background: store ideal counters + find counter-match
    background(async () => {
      await vectorService.storeIdealCounters(group._id, result.idealCounters, roomId, stance);
      const counterMatch = await vectorService.findCounterByCombinedMatch(
        group._id, commentEmbedding, roomId, opposingStance
      );
      if (counterMatch?.passesThreshold) {
        await withRoomLock(roomId, async () => {
          const freshGroup = await DebateGroup.findById(group._id);
          await addCounterLink(freshGroup, counterMatch.counterGroupId, counterMatch.bestScore);
        });
      }
    });
  }
}

// Link comment to its group
comment.groupId = group._id;
await comment.save();
```

---

## Background Refresh: `backgroundRefreshGroup()`

Runs after every comment is assigned to a group:

```javascript
async function backgroundRefreshGroup(group, roomId, stance, debateRoom, commentEmbedding) {
  // 1. Fetch ALL comments in this group
  const allComments = await DebateComment.find({ _id: { $in: group.commentIds } });

  // 2. Regenerate title/description/idealCounters from ALL comments
  geminiKeyRotation.advanceKey();
  const llmResult = await llmService.generateGroupContent(allComments);
  group.title = llmResult.title;
  group.description = llmResult.description;
  group.idealCounters = llmResult.idealCounters || [];
  await group.save();

  // 3. Update Pinecone with new group embedding
  await vectorService.storeDebateGroup(group._id, llmResult.title, llmResult.description, roomId, stance);

  // 4. Update ideal counter embeddings in Pinecone
  if (llmResult.idealCounters?.length > 0) {
    geminiKeyRotation.advanceKey();
    await vectorService.storeIdealCounters(group._id, llmResult.idealCounters, roomId, stance);
  }

  // 5. Find counter-group using combined matching
  if (commentEmbedding) {
    geminiKeyRotation.advanceKey();
    const counterMatch = await vectorService.findCounterByCombinedMatch(
      group._id, commentEmbedding, roomId, opposingStance
    );

    if (counterMatch?.passesThreshold) {
      await withRoomLock(roomId, async () => {
        const freshGroup = await DebateGroup.findById(group._id);
        await addCounterLink(freshGroup, counterMatch.counterGroupId, counterMatch.bestScore);
      });
    }
  }
}
```

**Key**: Groups continuously improve as more comments arrive. Each new comment triggers a full regeneration of the group's content and a re-evaluation of counter-matches.

---

## Counter-Linking: `addCounterLink()`

Creates bidirectional, permanent links between opposing groups:

```javascript
async function addCounterLink(group, newCounterId, score) {
  // 1. Check if link already exists
  const existingLink = group.counterGroups?.find(
    link => link.groupId?.toString() === newCounterId
  );
  if (existingLink) return false;  // Already linked

  // 2. Verify counter group exists
  const counterGroup = await DebateGroup.findById(newCounterId);
  if (!counterGroup) return false;

  // 3. Add link to current group
  await DebateGroup.findByIdAndUpdate(group._id, {
    $push: {
      counterGroups: { groupId: newCounterId, matchScore: score, linkedAt: new Date() },
    },
    // Update legacy field if first link
    $set: !group.counterGroupId ? {
      counterGroupId: newCounterId,
      counterMatchScore: score,
    } : {},
  });

  // 4. Add reciprocal link to counter group
  await DebateGroup.findByIdAndUpdate(newCounterId, {
    $push: {
      counterGroups: { groupId: group._id, matchScore: score, linkedAt: new Date() },
    },
    $set: !counterGroup.counterGroupId ? {
      counterGroupId: group._id,
      counterMatchScore: score,
    } : {},
  });

  return true;  // New link created
}
```

**Design principle**: Links are **never removed**. Even if a group evolves and the match score drops, the historical link is preserved. This prevents confusing UI state where counter-links appear and disappear.

---

## Reading Comments

### `getDebateComments(roomId, ?stance)`

Returns groups with populated comments, plus ungrouped/off-topic comments:

```javascript
const [forGroups, againstGroups, ungroupedComments] = await Promise.all([
  DebateGroup.find({ debateRoomId: roomId, stance: 'for' })
    .populate({ path: 'commentIds', populate: { path: 'author', select: 'name username _id' } })
    .populate('counterGroupId')
    .sort({ displayOrder: 1 }).lean(),
  DebateGroup.find({ debateRoomId: roomId, stance: 'against' })
    .populate({ path: 'commentIds', populate: { path: 'author', select: 'name username _id' } })
    .populate('counterGroupId')
    .sort({ displayOrder: 1 }).lean(),
  DebateComment.find({ debateRoomId: roomId, groupId: null })
    .populate('author', 'name username _id')
    .sort({ createdAt: -1 }).lean(),
]);
```

**Nested population**: `commentIds` are populated, and within each comment, the `author` field is also populated — two levels deep.

---

## Like / Dislike

Toggle-style voting using `$addToSet` and `$pull`:

```javascript
// Like: add to likes, remove from dislikes (if present)
await DebateComment.findByIdAndUpdate(commentId, {
  $addToSet: { likes: { userId, userModel } },
  $pull:     { dislikes: { userId } },
});

// Dislike: add to dislikes, remove from likes (if present)
await DebateComment.findByIdAndUpdate(commentId, {
  $addToSet: { dislikes: { userId, userModel } },
  $pull:     { likes: { userId } },
});
```

**Mutual exclusion**: A user can either like OR dislike, never both. `$pull` removes the opposite reaction atomically.

---

## Undo Comment (30-Second Window)

```javascript
const undoDebateComment = async (req, res) => {
  const comment = await DebateComment.findOne({ _id: commentId, debateRoomId: roomId });

  // Check ownership
  if (comment.author.toString() !== userId.toString()) → 403

  // Check time window
  const timeDifference = Date.now() - comment.createdAt.getTime();
  const undoWindow = 30 * 1000;  // 30 seconds

  if (timeDifference > undoWindow) {
    → 400 "Undo window expired"
  }

  // Same cleanup as delete: remove from group, delete empty groups
  if (comment.groupId) {
    await DebateGroup.findByIdAndUpdate(comment.groupId, { $pull: { commentIds: commentId } });
    const group = await DebateGroup.findById(comment.groupId);
    if (group && group.commentIds.length === 0) {
      // Delete empty group + vectors (but preserve counter-links)
      await vectorService.deleteVector(group._id, NAMESPACES.DEBATE_GROUPS);
      await vectorService.deleteIdealCounters(group._id);
      await DebateGroup.findByIdAndDelete(comment.groupId);
    }
  }

  await DebateComment.findByIdAndDelete(commentId);
};
```

**Counter-links preserved**: When an empty group is deleted, its counter-links are intentionally NOT cleaned up. This may leave orphaned references in other groups' `counterGroups` arrays, but that's by design.

---

## Delete Comment

Similar to undo but without the time restriction. Allowed for the comment author or admin.

```javascript
// Remove from group
if (comment.groupId) {
  await DebateGroup.findByIdAndUpdate(comment.groupId, { $pull: { commentIds: commentId } });

  // Clean up empty groups
  const group = await DebateGroup.findById(comment.groupId);
  if (group && group.commentIds.length === 0) {
    await vectorService.deleteVector(group._id, NAMESPACES.DEBATE_GROUPS);
    await vectorService.deleteIdealCounters(group._id);
    await DebateGroup.findByIdAndDelete(comment.groupId);
  }
}

await DebateComment.findByIdAndDelete(commentId);
```

---

## API Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/debate-rooms/:roomId/comments` | Any User | Create comment (full pipeline) |
| GET | `/api/debate-rooms/:roomId/comments` | Any User | Get all comments (grouped) |
| GET | `/api/debate-rooms/:roomId/groups/:groupId/comments` | Any User | Get comments in a group |
| DELETE | `/api/debate-rooms/:roomId/comments/:commentId` | Author/Admin | Delete comment |
| POST | `/api/debate-rooms/:roomId/comments/:commentId/undo` | Author | Undo within 30s |
| POST | `/api/debate-rooms/:roomId/comments/:commentId/like` | Any User | Like toggle |
| POST | `/api/debate-rooms/:roomId/comments/:commentId/dislike` | Any User | Dislike toggle |
| GET | `/api/debate-rooms/:roomId/comments/debug/counter-status` | Any User | Debug info |
| GET | `/api/debate-rooms/:roomId/test/anti-scores` | Any User | Test counter scores |

---

## Complete Pipeline Diagram

```
POST /debate-rooms/:roomId/comments
  body: { text, stance }
         │
         ▼
  1. Verify room + participation
         │
         ▼
  2. LLM off-topic check (with 5 recent comments as context)
         │
         ├── OFF-TOPIC → Save comment (groupId: null) → Return early
         │
         └── ON-TOPIC → Continue
                │
                ▼
  3. Generate embedding (one call, reused everywhere)
         │
         ▼
  4. Save comment to MongoDB
         │
         ▼
  5. Vector match against existing groups (score ≥ 0.74?)
         │
         ├── MATCH → Add to existing group
         │              │
         │              └── Background: regenerate + counter-match
         │
         └── NO MATCH → LLM classifyAndGenerateContent
                           │
                  ┌────────┴────────┐
                  │                 │
              LLM matched       Create new
              existing          DebateGroup
                  │                 │
                  └────────┬────────┘
                           │
                     Link comment → group
                           │
                     Background:
                     ├── Store ideal counters in Pinecone
                     ├── findCounterByCombinedMatch
                     └── addCounterLink (if threshold met)
                           │
                           ▼
                  Return { comment, group, isNewGroup }
```

---

**Next**: [15 — Trending News Scraping](./15-TRENDING-NEWS-SCRAPING.md) — Web scraping NDTV for trending news
