# 13 — Debate Components: DebateRoom System Deep-Dive

## Table of Contents
1. [What Is the Debate Room?](#1-what-is-the-debate-room)
2. [Architecture Overview](#2-architecture-overview)
3. [DebateRoom Page — Complete Walkthrough](#3-debateroom-page--complete-walkthrough)
4. [The Two-Column FOR/AGAINST Layout](#4-the-two-column-foragainst-layout)
5. [Comment Submission with Undo](#5-comment-submission-with-undo)
6. [AI-Powered Group Management](#6-ai-powered-group-management)
7. [Counter-Chat View](#7-counter-chat-view)
8. [Like/Dislike System](#8-likedislike-system)
9. [Related Components](#9-related-components)
10. [Interview Q&A](#10-interview-qa)

---

## 1. What Is the Debate Room?

A **Debate Room** is created from a news article to facilitate structured discussion. Users post comments that are automatically categorized as **FOR** (supporting the article's claims) or **AGAINST** (opposing them). The backend AI groups similar comments and can generate counter-arguments.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  DEBATE ROOM: "Is Climate Change Accelerating?"                             │
├──────────────────────────────┬──────────────────────────────────────────────┤
│  FOR (Supporting)             │  AGAINST (Opposing)                          │
│                               │                                              │
│  Group 1: Scientific Evidence │  Group 1: Data Interpretation                │
│  ├── "NASA data shows..."     │  ├── "The data is cherry-picked..."          │
│  └── "IPCC report confirms.." │  └── "Natural cycles explain..."             │
│                               │                                              │
│  Group 2: Observable Changes  │  Group 2: Economic Concerns                  │
│  ├── "Glaciers are melting.." │  ├── "Green policies are costly..."          │
│  └── "Sea levels rising..."   │  └── "Jobs would be lost..."                │
├──────────────────────────────┴──────────────────────────────────────────────┤
│  Stance: ○ For  ● Against     [Comment input...              ] [Send]       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Route: /debate-room/:roomId                                                │
│                                                                             │
│  DebateRoom (page)                                                          │
│  ├── NavigationHeader (back button + room title)                            │
│  ├── Room Info Card (topic, creator, rules)                                 │
│  ├── View Mode Toggle: [Groups View] [Counter-Chat View]                    │
│  │                                                                          │
│  ├── Groups View (default):                                                 │
│  │     ├── FOR Column                                                       │
│  │     │     ├── Group (AI-labeled, with comments)                          │
│  │     │     └── [Regenerate Group]                                         │
│  │     └── AGAINST Column                                                   │
│  │           └── ... same structure                                         │
│  │                                                                          │
│  ├── Counter-Chat View (alternative):                                       │
│  │     └── CounterChatView component                                        │
│  │                                                                          │
│  └── Comment Input Form (stance selector + text + submit)                   │
│                                                                             │
│  Services: debateRoomAPI (separate from main api.js)                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. DebateRoom Page — Complete Walkthrough

### 3.1 — URL Parameters

```jsx
const { roomId } = useParams();
// From route: /debate-room/:roomId
// e.g., /debate-room/abc123 → roomId = "abc123"
```

### 3.2 — State

```jsx
const [debateRoom, setDebateRoom] = useState(null);
// Room metadata: { topic, description, creator, createdAt, rules }

const [groups, setGroups] = useState({ for: [], against: [] });
// Two arrays: comments grouped by AI on each side
// groups.for = [{ label, comments: [...] }, ...]
// groups.against = [{ label, comments: [...] }, ...]

const [newComment, setNewComment] = useState('');
const [selectedStance, setSelectedStance] = useState('for');
const [submittingComment, setSubmittingComment] = useState(false);
const [viewMode, setViewMode] = useState('groups'); // 'groups' or 'counter'
const [recentComments, setRecentComments] = useState(new Map());
// Map of commentId → data, for 30-second undo feature
```

### 3.3 — Data Fetching on Mount

```jsx
useEffect(() => {
  fetchDebateRoom();   // Load room info
  fetchComments();      // Load grouped comments
}, [roomId]);           // Re-fetch if roomId changes

const fetchDebateRoom = async () => {
  const response = await debateRoomAPI.getDebateRoom(roomId);
  setDebateRoom(response.data);
  // If room doesn't exist → navigate('/debate-rooms')
};

const fetchComments = async () => {
  setLoading(true);
  const response = await debateRoomAPI.getDebateComments(roomId);
  setGroups(response.data);
  // response.data = { for: [...groups], against: [...groups] }
  setLoading(false);
};
```

---

## 4. The Two-Column FOR/AGAINST Layout

```
┌────────────────────────────┬────────────────────────────┐
│  FOR (Green theme)          │  AGAINST (Red theme)        │
│                             │                             │
│  ┌────────────────────────┐│  ┌──────────────────────────┐│
│  │ Group: "Safety Data"   ││  │ Group: "Industry Impact" ││
│  │ ├── Comment by alice   ││  │ ├── Comment by dave      ││
│  │ │   [👍 3] [👎 1]      ││  │ │   [👍 2] [👎 0]       ││
│  │ └── Comment by bob     ││  │ └── Comment by eve       ││
│  │ [🔄 Regenerate Group]  ││  │ [🔄 Regenerate Group]   ││
│  └────────────────────────┘│  └──────────────────────────┘│
│                             │                             │
│  ┌────────────────────────┐│  ┌──────────────────────────┐│
│  │ Group: "Expert Views"  ││  │ Group: "Cost Analysis"   ││
│  │ └── ...                ││  │ └── ...                  ││
│  └────────────────────────┘│  └──────────────────────────┘│
└────────────────────────────┴────────────────────────────┘
```

The layout uses a CSS grid with two columns. Each column maps over its respective array:

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* FOR column */}
  <div>
    <h3 className="text-green-600">FOR</h3>
    {groups.for.map(group => (
      <GroupCard key={group._id} group={group} stance="for" />
    ))}
  </div>

  {/* AGAINST column */}
  <div>
    <h3 className="text-red-600">AGAINST</h3>
    {groups.against.map(group => (
      <GroupCard key={group._id} group={group} stance="against" />
    ))}
  </div>
</div>
```

---

## 5. Comment Submission with Undo

### 5.1 — The Submit Flow

```
User selects stance (for/against) + types comment + clicks Send
       │
       ▼
handleSubmitComment(e)
       │
       ├── e.preventDefault()
       ├── Guard: newComment.trim() empty? → return
       │
       ├── POST /debate-rooms/{roomId}/comments
       │   Body: { text: "My argument...", stance: "for" }
       │
       ├── Backend:
       │     1. Save comment to database
       │     2. AI assigns comment to a group (or creates new group)
       │     3. Background: run counter-matching (find opposing arguments)
       │
       ├── On success:
       │     ├── Clear input
       │     ├── Add to recentComments Map (for undo tracking)
       │     ├── Set 30-second timer to remove from undo tracking
       │     ├── Show toast with "Undo" button
       │     ├── fetchComments() immediately
       │     └── setTimeout(() => fetchComments(), 6000)
       │         ↑ Delayed refresh: counter-matching runs in background
       │           and takes 2-5 seconds to complete
```

### 5.2 — Undo Feature

```jsx
// Track recent comments in a Map (commentId → data)
const [recentComments, setRecentComments] = useState(new Map());

// After posting, add to tracking:
setRecentComments(prev => {
  const updated = new Map(prev);
  updated.set(comment._id, { ...comment, postedAt: Date.now() });
  return updated;
});

// Auto-expire after 30 seconds:
setTimeout(() => {
  setRecentComments(prev => {
    const updated = new Map(prev);
    updated.delete(comment._id);
    return updated;
  });
}, 30000);

// Toast with undo button:
toast.success(
  <div>
    <span>Comment posted!</span>
    <button onClick={() => handleUndoComment(comment._id)}>Undo</button>
  </div>,
  { autoClose: 30000 }
);

// Undo handler:
const handleUndoComment = async (commentId) => {
  await debateRoomAPI.undoDebateComment(roomId, commentId);
  // DELETE the comment from the server
  fetchComments(); // Refresh
};
```

---

## 6. AI-Powered Group Management

### 6.1 — What Groups Are

The backend AI clusters comments with similar arguments into labeled groups. Each group has:
- A **label** (e.g., "Scientific Evidence", "Economic Concerns")
- A **description** (brief summary of the theme)
- An array of **comments** belonging to that group

### 6.2 — Regenerate Group

```jsx
const handleRegenerateGroup = async (groupId) => {
  await debateRoomAPI.regenerateGroup(roomId, groupId);
  // AI re-analyzes the comments in this group
  // May split, merge, or relabel groups
  toast.success('Group content regenerated!');
  fetchComments(); // Refresh to show updated groups
};
```

---

## 7. Counter-Chat View

### 7.1 — What It Is

The Counter-Chat view is an alternative way to see debate comments. Instead of two separate columns, it shows **matched pairs** — a FOR comment and its AI-identified AGAINST counterpart side by side.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Counter-Argument Pairs                                                     │
│                                                                             │
│  FOR: "Studies show vaccines are 95% effective"                             │
│  ↕ COUNTER                                                                  │
│  AGAINST: "The 95% figure doesn't account for long-term effects"            │
│                                                                             │
│  FOR: "GDP grew 3% this quarter"                                            │
│  ↕ COUNTER                                                                  │
│  AGAINST: "Growth is driven by unsustainable debt"                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

The `CounterChatView` component is a separate React component that receives the grouped data and renders it in this paired format.

### 7.2 — View Mode Toggle

```jsx
const [viewMode, setViewMode] = useState('groups');

// Toggle buttons:
<button onClick={() => setViewMode('groups')}>Groups View</button>
<button onClick={() => setViewMode('counter')}>Counter Chat</button>

// Render:
{viewMode === 'groups' ? (
  <GroupsView groups={groups} />
) : (
  <CounterChatView roomId={roomId} />
)}
```

---

## 8. Like/Dislike System

```jsx
const handleLikeComment = async (commentId) => {
  await debateRoomAPI.likeComment(roomId, commentId);
  fetchComments(); // Refresh to show updated counts
};

const handleDislikeComment = async (commentId) => {
  await debateRoomAPI.dislikeComment(roomId, commentId);
  fetchComments();
};

// Icons use @heroicons/react (outline for unselected, solid for selected):
// HandThumbUpIcon (outline) → not yet liked
// HandThumbUpIconSolid → already liked by this user
```

---

## 9. Related Components

| Component | File | Purpose |
|---|---|---|
| `DebateRoom` | `pages/DebateRoom.jsx` | Main debate page |
| `AdvancedDebateRoom` | `components/AdvancedDebateRoom.jsx` | Enhanced version |
| `CounterChatView` | `components/CounterChatView.jsx` | Paired counter-argument view |
| `NavigationHeader` | `components/NavigationHeader.jsx` | Back button + title |
| `DebateRoomsList` | `pages/DebateRoomsList.jsx` | List of all debate rooms |

---

## 10. Interview Q&A

**Q: Why fetch comments twice after posting (immediately + 6 seconds later)?**
A: Comment posting is synchronous, but the backend runs AI counter-matching asynchronously in the background. The immediate fetch shows the new comment. The delayed fetch (6 seconds) catches the counter-matching results, which take 2-5 seconds to complete.

**Q: Why use a Map for tracking recent comments instead of an array?**
A: `Map` provides O(1) lookup and deletion by key (commentId). An array would require `.find()` (O(n)) for lookups. Since we need to quickly check if a comment is "undoable" and remove it when the timer expires, Map is more efficient.

**Q: How does the undo feature work with the toast?**
A: The toast includes a clickable "Undo" button rendered as a React component inside the toast content. Clicking it calls `handleUndoComment`, which sends a DELETE request to the server. The 30-second timer matches the toast's `autoClose` duration, so the undo option disappears when the toast closes.

---

**Next → [14-PAGES-OVERVIEW.md](./14-PAGES-OVERVIEW.md)** — Complete walkthrough of all pages in VoxVeritas.
