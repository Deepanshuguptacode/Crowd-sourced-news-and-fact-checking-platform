# 12 — Debate Rooms

> **Files**: `controllers/DebateRoomController.js` (613 lines), `models/DebateRoom.js`, `routes/debateRoomRoute.js`  
> **Prerequisites**: [05 — Authentication System](./05-AUTHENTICATION-SYSTEM.md), [08 — Pinecone Vector Database](./08-PINECONE-VECTOR-DATABASE.md)

---

## Purpose

Debate Rooms are structured discussion spaces where users take opposing stances on a topic. Unlike news comments (which are about verifying facts), debate rooms are about **arguing positions** — users join a room, pick a stance ("for" or "against"), and post comments that get automatically grouped into argument themes.

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                   DebateRoom                          │
│  ┌─────────────┐  ┌────────────────────┐             │
│  │ title       │  │ participants[]     │             │
│  │ description │  │ ├── userId         │             │
│  │ topic       │  │ └── userModel      │             │
│  │ creator     │  │ maxParticipants:50 │             │
│  │ creatorModel│  └────────────────────┘             │
│  │ tags[]      │                                      │
│  │ isActive    │                                      │
│  └─────────────┘                                      │
│       │                                               │
│       ├── DebateGroup (stance: 'for')                │
│       │     ├── comment 1                             │
│       │     ├── comment 2                             │
│       │     └── counterGroupId → DebateGroup(against) │
│       │                                               │
│       ├── DebateGroup (stance: 'against')            │
│       │     ├── comment 3                             │
│       │     └── counterGroupId → DebateGroup(for)     │
│       │                                               │
│       └── Ungrouped/Off-topic comments               │
└──────────────────────────────────────────────────────┘
```

---

## Creating a Room

```javascript
const createDebateRoom = async (req, res) => {
  const { title, description, topic, maxParticipants, tags } = req.body;

  // Determine creator model from user type
  const creatorModel = req.userType === 'normal' ? 'NormalUser'
    : req.userType === 'community' ? 'CommunityUser' : 'ExpertUser';

  const debateRoom = new DebateRoom({
    title,
    description,
    topic,
    creator: req.user._id,
    creatorModel,
    maxParticipants: maxParticipants || 50,
    tags: tags || [],
    participants: [{
      userId: req.user._id,
      userModel: creatorModel,
    }],
  });
  await debateRoom.save();
};
```

**Key design decisions**:
- The creator is automatically added as the first participant
- `creatorModel` uses the polymorphic reference pattern (see [04 — Data Models](./04-DATA-MODELS.md))
- Off-topic detection is handled at comment-posting time by the LLM, not at room creation

---

## Listing Rooms

```javascript
const getAllDebateRooms = async (req, res) => {
  const { page = 1, limit = 10, isActive = true, search } = req.query;

  const query = { isActive };
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { topic: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } },
    ];
  }

  // Uses raw MongoDB driver instead of Mongoose model
  const debateRooms = await mongoose.connection.db.collection('debaterooms')
    .find(query)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .toArray();
};
```

**Why raw MongoDB?** The controller uses `mongoose.connection.db.collection('debaterooms')` instead of `DebateRoom.find()`. This is a workaround for Mongoose validation issues with legacy participant data that may have missing `userModel` fields. The raw driver bypasses Mongoose schema validation.

**Enrichment**: Each room gets `participantCount` and `commentCount` added via `DebateComment.countDocuments()`.

---

## Joining and Leaving

### Join

```javascript
const joinDebateRoom = async (req, res) => {
  const debateRoom = await DebateRoom.findById(roomId);

  // Validations:
  // 1. Room exists and is active
  // 2. User not already a participant
  // 3. Room not at max capacity

  debateRoom.participants.push({ userId, userModel });
  debateRoom.participants = debateRoom.participants.map(p => ({
    userId: p.userId,
    userModel: p.userModel || 'NormalUser',  // Backfill missing field
  }));
  await debateRoom.save();
};
```

**Participant cleanup**: Before saving, all participants are normalised to ensure they have a `userModel` field. This repairs legacy data where the field may be missing.

### Leave

```javascript
const leaveDebateRoom = async (req, res) => {
  debateRoom.participants = debateRoom.participants.filter(
    p => p.userId.toString() !== userId.toString()
  );
  await debateRoom.save();
};
```

---

## Updating a Room

Only the creator can update a room. Protected fields are explicitly excluded:

```javascript
delete updates.creator;
delete updates.creatorModel;
delete updates.participants;
delete updates.createdAt;

Object.assign(debateRoom, updates);
await debateRoom.save();
```

---

## Deleting a Room — Full Cascade

Deletion is the most complex operation. Everything related to the room must be cleaned up:

```javascript
const deleteDebateRoom = async (req, res) => {
  // Auth: Only creator or admin
  const isCreator = debateRoom.creator.toString() === userId.toString();
  const isAdmin = req.userType === 'admin';

  // 1. Collect group IDs for vector cleanup
  const groups = await DebateGroup.find({ debateRoomId: roomId }).select('_id').lean();
  const groupIds = groups.map(g => g._id.toString());

  // 2. Delete Pinecone vectors (fire-and-forget)
  vectorService.deleteMany(groupIds, NAMESPACES.DEBATE_GROUPS).catch(...);
  vectorService.deleteVector(roomId, NAMESPACES.DEBATE_TOPICS).catch(...);

  // 3. Delete all MongoDB documents
  await DebateComment.deleteMany({ debateRoomId: roomId });
  await DebateGroup.deleteMany({ debateRoomId: roomId });
  await DebateRoom.findByIdAndDelete(roomId);
};
```

**Cascade order**: Vectors → Comments → Groups → Room. This ensures no orphaned references.

**Note**: Ideal counter vectors are NOT explicitly deleted here. They persist in Pinecone's `ideal-counters` namespace as orphans. This is acceptable since they're only returned when filtered by `roomId`, which no longer exists.

---

## Group Content Regeneration

```javascript
const regenerateGroupContent = async (req, res) => {
  const group = await DebateGroup.findById(groupId).populate('commentIds');
  if (group.commentIds.length === 0) → error

  const { title, description } = await llmService.generateGroupContent(group.commentIds);

  await DebateGroup.findByIdAndUpdate(groupId, { title, description, updatedAt: new Date() });

  // Sync Pinecone
  vectorService.storeDebateGroup(groupId, title, description, roomId, group.stance);
};
```

---

## Relinking Groups

Re-evaluates counter-group matchings for the entire room:

```javascript
const relinkGroups = async (req, res) => {
  const forGroups = await DebateGroup.find({ debateRoomId: roomId, stance: 'for' });
  const againstGroups = await DebateGroup.find({ debateRoomId: roomId, stance: 'against' });

  // For each "for" group → find best "against" match
  for (const forGroup of forGroups) {
    const groupEmbedding = await vectorService.generateEmbedding(`${forGroup.title}. ${forGroup.description}`);
    const match = await vectorService.findCounterByIdealMatch(forGroup._id, groupEmbedding, roomId, 'against');
    if (match?.passesThreshold) {
      await DebateGroup.findByIdAndUpdate(forGroup._id, {
        counterGroupId: match.counterGroupId,
        counterMatchScore: match.bestScore,
      });
    }
  }

  // Same for "against" groups → find best "for" match
};
```

---

## Debug Endpoint

```javascript
const getDebugCounterStatus = async (req, res) => {
  // Returns all groups with their counter-links, titles, stances, comment counts
  // Used for development/debugging the counter-matching system
};
```

---

## API Endpoints

### Room Management

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/debate-rooms` | Any User | Create room |
| GET | `/api/debate-rooms` | Any User | List rooms (paginated, search) |
| GET | `/api/debate-rooms/:roomId` | Any User | Get room details |
| POST | `/api/debate-rooms/:roomId/join` | Any User | Join room |
| POST | `/api/debate-rooms/:roomId/leave` | Any User | Leave room |
| PUT | `/api/debate-rooms/:roomId` | Creator only | Update room |
| DELETE | `/api/debate-rooms/:roomId` | Creator/Admin | Delete room + cascade |

### Advanced Management

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| PUT | `/api/debate-rooms/:roomId/groups/:groupId/regenerate` | Any User | Regenerate group LLM content |
| POST | `/api/debate-rooms/:roomId/relink-all` | Any User | Re-evaluate all counter-links |
| GET | `/api/debate-rooms/:roomId/debug/counter-status` | Any User | Debug counter status |

### Test Routes (No Auth)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/debate-rooms/test/:roomId/groups` | Test group listing |
| GET | `/api/debate-rooms/test/:roomId/comments` | Test comment listing |

---

**Next**: [13 — Debate Groups & Counters](./13-DEBATE-GROUPS-COUNTERS.md) — How argument groups are managed and counter-matched
