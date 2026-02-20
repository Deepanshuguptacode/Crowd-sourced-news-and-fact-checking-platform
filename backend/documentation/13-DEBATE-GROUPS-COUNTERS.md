# 13 — Debate Groups & Counters

> **File**: `controllers/DebateGroupController.js` (321 lines), `models/DebateGroup.js`  
> **Prerequisites**: [12 — Debate Rooms](./12-DEBATE-ROOMS.md), [08 — Pinecone Vector Database](./08-PINECONE-VECTOR-DATABASE.md)

---

## Purpose

When users post debate comments, similar arguments are automatically clustered into **DebateGroups**. Each group represents a distinct argument theme (e.g., "Job Market Disruption Concerns" or "AI Accountability Arguments"). The most powerful feature is **counter-group linking** — the system automatically identifies which "for" argument group directly opposes which "against" argument group.

---

## Group Structure

```javascript
// DebateGroup Model
{
  debateRoomId:     ObjectId,         // Which room this group belongs to
  label:            String,           // Short 2-5 word category label
  title:            String,           // 6-12 word descriptive title
  description:      String,           // 40-80 word detailed summary
  stance:           'for' | 'against',
  commentIds:       [ObjectId],       // Array of DebateComment references
  idealCounters:    [String],         // 2 AI-generated counter-argument texts

  // Counter-group linking (many-to-many)
  counterGroups:    [{
    groupId:        ObjectId,         // Linked counter-group
    matchScore:     Number,           // Similarity score when linked
    linkedAt:       Date,             // When the link was created
  }],

  // Legacy (1-to-1, backward compatibility)
  counterGroupId:   ObjectId,         // First/best counter-group
  counterMatchScore: Number,          // Score of that match

  displayOrder:     Number,           // Sort position within stance
}
```

---

## Counter-Group Linking System

This is the most sophisticated feature in the debate system. Here's how it works:

### The Ideal Counter Approach

When a DebateGroup is created or updated:

1. **LLM generates two "ideal counter-arguments"** — 30-50 word texts describing what the perfect opposing argument would sound like
2. **These are embedded and stored in Pinecone** (namespace: `ideal-counters`)
3. When a comment arrives for the **opposing stance**, its embedding is compared against these ideal counters
4. If similarity exceeds 0.62 (combined threshold), the groups are linked as counter-arguments

```
FOR Group: "AI Creates New Job Opportunities"
  ├── idealCounter1: "AI automation destroys far more jobs than it creates.
  │    Manufacturing and service industries have shed millions..."
  └── idealCounter2: "The jobs AI supposedly creates are inaccessible
       to most displaced workers. These positions require advanced..."
       
AGAINST Group: "AI Causes Mass Unemployment"
  └── A new comment: "Automation has replaced 3 million factory jobs..."
       This comment's embedding matches idealCounter1 above (score: 0.71)
       → LINK these two groups as counter-arguments!
```

### Many-to-Many Linking

Groups can link to **multiple** counter-groups. Links are **permanent** — once created, they are never removed. This is intentional:

```javascript
// counterGroups array stores all links
counterGroups: [
  { groupId: 'group_A', matchScore: 0.75, linkedAt: '2024-01-15' },
  { groupId: 'group_B', matchScore: 0.68, linkedAt: '2024-01-16' },
]
```

The `counterGroupId` field (singular) is maintained for backward compatibility with the frontend — it stores the first or best match.

---

## Controller Methods

### `getDebateGroups(roomId, ?stance)`

Fetches all groups for a debate room, optionally filtered by stance.

```javascript
const getDebateGroups = async (req, res) => {
  const { roomId } = req.params;
  const { stance } = req.query;

  if (stance) {
    // Single stance
    const groups = await DebateGroup.find({ debateRoomId: roomId, stance })
      .populate('commentIds')
      .populate('counterGroupId')
      .populate('counterGroups.groupId')
      .sort({ displayOrder: 1 })
      .lean();
    return res.json({ success: true, data: groups });
  }

  // Both stances
  const [forGroups, againstGroups] = await Promise.all([
    DebateGroup.find({ debateRoomId: roomId, stance: 'for' })
      .populate('commentIds').populate('counterGroupId').populate('counterGroups.groupId')
      .sort({ displayOrder: 1 }).lean(),
    DebateGroup.find({ debateRoomId: roomId, stance: 'against' })
      .populate('commentIds').populate('counterGroupId').populate('counterGroups.groupId')
      .sort({ displayOrder: 1 }).lean(),
  ]);

  res.json({ success: true, data: { for: forGroups, against: againstGroups } });
};
```

**Population chain**: Each group populates its `commentIds`, `counterGroupId` (legacy), and `counterGroups.groupId` (many-to-many) — giving the frontend all related data in one call.

**Sorting**: `displayOrder` determines the visual position. Counter-matched groups are positioned adjacent to each other (see relinking).

### `createDebateGroup(roomId, body)`

Manual group creation (usually groups are auto-created by the comment pipeline):

```javascript
const group = new DebateGroup({
  debateRoomId: roomId,
  label,
  title: title || label,
  description: description || 'A new discussion group.',
  stance,
  commentIds: [],
});
await group.save();

// Store in Pinecone (fire-and-forget)
vectorService.storeDebateGroup(group._id, group.title, group.description, roomId, stance);
```

### `regenerateDebateGroup(roomId, groupId)`

Regenerates a group's title and description from its comments:

```javascript
const group = await DebateGroup.findOne({ _id: groupId, debateRoomId: roomId }).populate('commentIds');
if (group.commentIds.length === 0) → error

const { title, description } = await llmService.generateGroupContent(group.commentIds);

await DebateGroup.findByIdAndUpdate(groupId, { title, description, updatedAt: new Date() });

// Sync Pinecone embedding
vectorService.storeDebateGroup(groupId, title, description, roomId, group.stance);
```

### `getCounterAnalysis(roomId, groupId)`

Returns detailed counter-group analysis for a specific group:

```javascript
const getCounterAnalysis = async (req, res) => {
  const group = await DebateGroup.findOne({ _id: groupId, debateRoomId: roomId })
    .populate('commentIds').lean();

  let counterAnalysis = null;

  if (group.counterGroupId) {
    const counterGroup = await DebateGroup.findById(group.counterGroupId)
      .populate('commentIds').lean();

    // Re-evaluate the match to check if it's still valid
    const groupEmbedding = await vectorService.generateEmbedding(`${group.title}. ${group.description}`);
    const match = await vectorService.findCounterByIdealMatch(groupId, groupEmbedding, roomId, opposingStance);

    counterAnalysis = {
      counterGroup,
      confidence: match?.score ?? 0,
      isStillValid: match?.counterGroupId === group.counterGroupId.toString(),
    };
  }

  res.json({ success: true, data: { group, counterAnalysis } });
};
```

The `isStillValid` field tells the frontend whether the counter-link is still the best match (groups evolve as new comments arrive).

---

## Relinking — Global Optimal Matching

`relinkDebateGroups()` re-evaluates ALL counter-group links for a room using a **greedy optimal matching** algorithm:

```
Step 1: Clear ALL existing counter-group links in this room

Step 2: For each FOR group → find best AGAINST match
         For each AGAINST group → find best FOR match
         Result: candidateLinks = [{ forId, againstId, score }]

Step 3: Sort candidateLinks by score (descending)
         Greedy assignment:
         - Take highest-scoring pair → assign
         - If either group already assigned → skip
         - Continue until no more valid pairs

Step 4: Write bidirectional links
         FOR_A.counterGroupId  = AGAINST_B
         AGAINST_B.counterGroupId = FOR_A
         Sync display orders so matched pairs appear adjacent
```

```javascript
// Greedy optimal matching
candidateLinks.sort((a, b) => b.score - a.score);

const usedFor = new Set();
const usedAgainst = new Set();
const finalPairs = [];

for (const link of candidateLinks) {
  if (!usedFor.has(link.forId) && !usedAgainst.has(link.againstId)) {
    finalPairs.push(link);
    usedFor.add(link.forId);
    usedAgainst.add(link.againstId);
  }
}
```

**Why greedy?** True optimal matching (Hungarian algorithm) would be more precise but much more complex. Greedy works well here because:
- The number of groups per room is small (typically < 20)
- The highest-scoring pairs are almost always correct
- Speed matters for user experience

**Display order sync**: After linking, the against-group's display position is set to `forGroup.displayOrder + 0.5`, so linked pairs appear side-by-side in the UI.

---

## API Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/debate-rooms/:roomId/groups` | Any User | Get groups (optionally by stance) |
| POST | `/api/debate-rooms/:roomId/groups` | Any User | Create a group manually |
| GET | `/api/debate-rooms/:roomId/groups/:groupId` | Any User | Get a specific group |
| PUT | `/api/debate-rooms/:roomId/groups/:groupId/regenerate` | Any User | Regenerate group content |
| POST | `/api/debate-rooms/:roomId/groups/relink` | Any User | Global optimal relink |
| GET | `/api/debate-rooms/:roomId/groups/:groupId/counter-analysis` | Any User | Counter-analysis details |

---

## How Groups Are Created (Automatic)

Groups are NOT usually created through the manual endpoint. Instead, the **debate comment pipeline** (doc 14) creates them automatically:

1. New comment arrives → embedding generated
2. Vector search matches against existing groups
3. If match (score ≥ 0.74) → comment added to existing group
4. If no match → LLM classifies → creates new group with:
   - AI-generated title, description
   - 2 ideal counter-arguments 
   - Stored in Pinecone for future matching

---

**Next**: [14 — Debate Comments Pipeline](./14-DEBATE-COMMENTS-PIPELINE.md) — The complete comment processing pipeline including off-topic detection, group assignment, and counter-matching
