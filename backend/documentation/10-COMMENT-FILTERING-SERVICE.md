# 10 — Comment Filtering Service

> **File**: `services/commentFilteringService.js` (473 lines)  
> **Pattern**: Singleton class — `module.exports = new CommentFilteringService()`  
> **Prerequisites**: [08 — Pinecone Vector Database](./08-PINECONE-VECTOR-DATABASE.md), [09 — Gemini LLM Service](./09-GEMINI-LLM-SERVICE.md), [04 — Data Models](./04-DATA-MODELS.md)

---

## Purpose

When a user comments on a news article, the comment needs to be **automatically grouped** with similar comments. This service orchestrates the entire pipeline:

1. Try to find a matching group via **vector similarity** (fast)
2. If no confident match, fall back to **LLM classification** (slower but smarter)
3. If the LLM says it's a new topic, **create a new group**
4. Save the `CommentFilter` record and link it to the group
5. Auto-regenerate group names when groups grow

The result is the **News Page Grouped Comments** feature — instead of a flat list of comments, users see comments organised by theme.

---

## Architecture

```
                    New Comment
                         │
                         ▼
              ┌─────────────────────┐
              │  processComment()   │
              └──────────┬──────────┘
                         │
          ┌──────────────┴──────────────┐
          ▼                             ▼
   vectorService                 (if vector miss)
   .matchNewsComment()           llmService
          │                      .classifyComment()
          │                             │
    score ≥ 0.74?              matched? │ new?
     ╱         ╲                ╱           ╲
   YES          NO          Finds        Creates new
    │            │          existing      CommentGroup
    │            └────┐     group         + Pinecone
    │                 │       │              │
    ▼                 ▼       ▼              ▼
  ┌─────────────────────────────────────────────┐
  │  Save CommentFilter with groupId            │
  │  Push to group.comments array               │
  │  If 3+ comments → background regeneration   │
  └─────────────────────────────────────────────┘
```

---

## The Core Pipeline: `processComment()`

```javascript
async processComment(commentText, originalCommentId, commentType, newsId) {
  let group = null;

  // ── Step 1: Fast vector match ──────────────────────────────
  const vecMatch = await vectorService.matchNewsComment(commentText, newsId);
  if (vecMatch) {
    group = await CommentGroup.findById(vecMatch.groupId);
  }

  // ── Step 2: LLM fallback when vector misses ───────────────
  if (!group) {
    const existingGroups = await CommentGroup.find({ newsId }).lean();
    const labels = existingGroups.map(g => g.label);

    const classification = await llmService.classifyComment(commentText, labels);

    if (classification.matchedGroup) {
      group = await CommentGroup.findOne({ label: classification.matchedGroup, newsId });
    }

    if (!group && classification.shouldCreateNew) {
      const description = await llmService.generateGroupDescription(commentText);
      group = new CommentGroup({
        label: classification.newLabel,
        description: description || `Group discussing: ${classification.newLabel}`,
        newsId,
        comments: [],
      });
      await group.save();

      // Store in Pinecone (fire-and-forget)
      vectorService.storeNewsGroup(
        group._id.toString(), group.label, group.description, newsId
      ).catch(err => console.error('Pinecone storeNewsGroup error:', err.message));
    }
  }

  // ── Step 3: Save CommentFilter record ──────────────────────
  const commentFilter = new CommentFilter({
    text: commentText,
    originalCommentId,      // Links back to CommunityComment or ExpertComment
    commentType,            // 'community' or 'expert'
    newsId,
    groupId: group?._id || null,
  });
  await commentFilter.save();

  // ── Step 4: Link to group ──────────────────────────────────
  if (group) {
    group.comments.push(commentFilter._id);
    await group.save();

    // Auto-regenerate label when 3+ comments
    if (group.comments.length >= 3) {
      this._regenerateInBackground(group);
    }
  }

  return { success: true, commentFilter, group };
}
```

### Step-by-Step Breakdown

**Step 1 — Vector Match**: Queries Pinecone's `news-groups` namespace for the comment's embedding against all groups for this `newsId`. If the best match scores ≥ 0.74, we trust it and retrieve the `CommentGroup` from MongoDB.

**Step 2 — LLM Fallback**: Only runs if Step 1 found no confident match. Loads all existing group labels for this news article and asks Gemini to classify. Two outcomes:
- Gemini matches an existing label → find that `CommentGroup` in MongoDB
- Gemini says "new group" → create a new `CommentGroup` with LLM-generated description, store its embedding in Pinecone

**Step 3 — CommentFilter**: Regardless of grouping outcome, a `CommentFilter` document is created. This is the bridge between the original comment (`CommunityComment`/`ExpertComment`) and its group.

**Step 4 — Group Membership**: The `CommentFilter._id` is pushed into `group.comments[]`. When the group reaches 3+ comments, a background task regenerates the group name and description to better reflect all comments (not just the first one).

### Fire-and-Forget Pattern

```javascript
// Pinecone storage — don't await, don't block the response
vectorService.storeNewsGroup(...).catch(err => console.error(...));

// Background regeneration — same pattern
this._regenerateInBackground(group);
```

These operations are non-critical. If Pinecone storage fails, the next comment can still use LLM fallback. If regeneration fails, the group keeps its current name.

---

## Read Operations

### `getGroupedComments(newsId)`

The most complex read operation. Returns all groups for a news article with their comments, handling **two data formats**:

**Legacy Format** (old backend): `CommentGroup.comments[]` stored `CommunityComment`/`ExpertComment` IDs directly.

**Current Format**: `CommentGroup.comments[]` stores `CommentFilter` IDs, each linking to an original comment via `originalCommentId`.

```javascript
async getGroupedComments(newsId) {
  const groups = await CommentGroup.find({ newsId }).sort({ createdAt: -1 }).lean();
  const groupIds = groups.map(g => g._id);

  // Fetch new-style CommentFilter entries
  const newStyleFilters = await CommentFilter.find({ groupId: { $in: groupIds } }).lean();

  // For each group:
  return await Promise.all(groups.map(async (group) => {
    const comments = [];
    const seenOrigIds = new Set();

    // A. Legacy path: try to find CommunityComment/ExpertComment by ID
    for (const rawId of group.comments) {
      let doc = await CommunityComment.findById(rawId).populate('commenter').lean();
      if (!doc) doc = await ExpertComment.findById(rawId).populate('expert').lean();
      if (doc) {
        seenOrigIds.add(rawId.toString());
        comments.push(/* formatted comment */);
      }
    }

    // B. New-style: CommentFilter → original comment
    for (const cf of newStyleFilters.filter(cf => cf.groupId == group._id)) {
      if (seenOrigIds.has(cf.originalCommentId.toString())) continue; // Dedup
      // Look up original CommunityComment or ExpertComment
      comments.push(/* formatted comment */);
    }

    return { _id: group._id, label, description, comments, commentCount };
  }));
}
```

**Deduplication**: The `seenOrigIds` Set prevents the same comment from appearing twice when it exists in both legacy and new-style data.

**Background Description Regeneration**: If a group has no description (or has the stale "Group discussing: ..." pattern), the read operation triggers background regeneration:

```javascript
if (!desc && comments.length > 0) {
  llmService.generateGroupDescription(texts.join(' | '))
    .then(newDesc => {
      CommentGroup.findByIdAndUpdate(group._id, { description: newDesc }).exec();
      vectorService.storeNewsGroup(group._id.toString(), group.label, newDesc, newsId);
    })
    .catch(() => {});
}
```

This is a "lazy migration" pattern — descriptions are generated on-demand the first time a group is read without one.

### `getAllFilteredComments(newsId)`

Simple flat list of all CommentFilter documents for a news article:

```javascript
async getAllFilteredComments(newsId) {
  return await CommentFilter.find({ newsId })
    .populate('groupId')
    .sort({ createdAt: -1 })
    .lean();
}
```

### `getCommentsByGroup(groupId)`

All comments within a specific group, with populated user info:

```javascript
async getCommentsByGroup(groupId) {
  const group = await CommentGroup.findById(groupId).populate('comments').lean();
  // For each comment, look up the original CommunityComment or ExpertComment
  // Return with user info populated
}
```

### `getFilteringSummary(newsId)`

Statistics about filtering for a news article:

```javascript
async getFilteringSummary(newsId) {
  return {
    totalGroups: groups.length,
    totalComments,
    ungroupedComments,   // Comments with no group (groupId: null)
    groups: [{ _id, label, commentCount, createdAt }],
  };
}
```

---

## Mutation Operations

### `updateGroupLabel(groupId, newLabel)`

Updates the label in MongoDB and syncs to Pinecone:

```javascript
async updateGroupLabel(groupId, newLabel) {
  const group = await CommentGroup.findByIdAndUpdate(groupId, { label: newLabel }, { new: true });
  if (group) {
    vectorService.storeNewsGroup(group._id.toString(), group.label, group.description, group.newsId)
      .catch(() => {});
  }
  return group;
}
```

### `updateGroupDescription(groupId, newDescription)`

Same pattern — update MongoDB, sync Pinecone embedding.

### `deleteGroup(groupId)`

```javascript
async deleteGroup(groupId) {
  // Unlink all CommentFilters from this group (don't delete them)
  await CommentFilter.updateMany({ groupId }, { $unset: { groupId: 1 } });
  // Delete the group document
  await CommentGroup.findByIdAndDelete(groupId);
  // Remove from Pinecone
  vectorService.deleteVector(groupId, NAMESPACES.NEWS_GROUPS).catch(() => {});
}
```

Comments are NOT deleted — they become "ungrouped" and can be re-grouped later.

---

## Auto-Regeneration

### Single Group Regeneration

Triggered when a group reaches 3+ comments:

```javascript
async regenerateGroupNameAndDescriptionIfNeeded(group) {
  const g = await CommentGroup.findById(group._id).populate('comments').lean();
  if (!g || g.comments.length < 3) return;

  const texts = g.comments.map(c => c.text).filter(Boolean);

  const [newName, newDesc] = await Promise.all([
    llmService.regenerateGroupName(texts, g.label),
    llmService.generateGroupDescription(texts.join(' | ')),
  ]);

  const update = {};
  if (newName && newName !== g.label) update.label = newName;
  if (newDesc && newDesc !== g.description) update.description = newDesc;

  if (Object.keys(update).length) {
    await CommentGroup.findByIdAndUpdate(g._id, update);
    vectorService.storeNewsGroup(g._id.toString(), update.label || g.label,
      update.description || g.description, g.newsId).catch(() => {});
  }
}
```

**Why 3 comments?** With only 1-2 comments, the label from the initial LLM classification is usually good enough. At 3+, there's enough data for meaningful regeneration and the original label might be too narrow.

### Bulk Regeneration

```javascript
async regenerateAllGroupNames(newsId) {
  const groups = await CommentGroup.find({ newsId }).populate('comments').lean();

  for (const g of groups) {
    if (g.comments.length < 2) continue;  // Need at least 2
    // Same regeneration logic as above
  }

  return { success: true, updatedGroups: results, totalGroupsProcessed: groups.length };
}
```

---

## Data Flow Summary

```
User Posts Comment on News Article
          │
          ▼
CommentsController.addCommunityComment()
          │
          ▼
commentFilteringService.processComment()
          │
          ├── vectorService.matchNewsComment()  →  Pinecone query
          │       │
          │       ├── Match (≥0.74) → Use existing group
          │       │
          │       └── No match → llmService.classifyComment()
          │                           │
          │                     ┌─────┴─────┐
          │                     │           │
          │                  Matched     New group
          │                  existing    created
          │                     │           │
          │                     └─────┬─────┘
          │                           │
          ▼                           ▼
     Save CommentFilter ← linked to → CommentGroup
          │
          └── If 3+ comments → background: regenerate name + description
```

---

## Models Used

This service works with two models from `models/CommentFilter.js`:

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `CommentFilter` | Individual filtered comment | `text`, `originalCommentId`, `commentType`, `newsId`, `groupId` |
| `CommentGroup` | Theme group containing comments | `label`, `description`, `newsId`, `comments[]` |

See [04 — Data Models](./04-DATA-MODELS.md) for full schema details.

---

**Next**: [11 — AI Verdict System](./11-AI-VERDICT-SYSTEM.md) — How the platform generates credibility scores for news articles
