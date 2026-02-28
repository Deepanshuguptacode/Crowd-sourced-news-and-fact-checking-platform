# 11 — Comment Components: CommentSection, Evidence & AI Grouping Deep-Dive

## Table of Contents
1. [The Comment System Architecture](#1-the-comment-system-architecture)
2. [CommentSection Component — Full Walkthrough](#2-commentsection-component--full-walkthrough)
3. [Adding a Comment — The Complete Flow](#3-adding-a-comment--the-complete-flow)
4. [Stance System — In Favor / Against / General](#4-stance-system--in-favor--against--general)
5. [Evidence Links — Supporting Claims](#5-evidence-links--supporting-claims)
6. [AI-Powered Comment Grouping](#6-ai-powered-comment-grouping)
7. [Expert Voting on Comments](#7-expert-voting-on-comments)
8. [Delete Comment Logic](#8-delete-comment-logic)
9. [Interview Q&A](#9-interview-qa)

---

## 1. The Comment System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  NewsCard                                                                   │
│  └── CommentSection (expandable, shown when user clicks "Comments")         │
│        │                                                                    │
│        ├── View Toggle: Regular View ↔ AI Grouped View                      │
│        │                                                                    │
│        ├── Regular View:                                                    │
│        │     ├── Comment #1 (Community - username, stance badge, text)       │
│        │     │     ├── EvidenceDisplay (linked sources)                      │
│        │     │     └── ExpertVotingSection (expert upvote/downvote)          │
│        │     ├── Comment #2 (Expert - username, stance, text)               │
│        │     └── ...                                                        │
│        │                                                                    │
│        ├── Grouped View (AI-organized):                                     │
│        │     ├── Group 1: "Safety Concerns" (3 comments)                    │
│        │     ├── Group 2: "Economic Impact" (5 comments)                    │
│        │     └── [Improve Groups] button                                    │
│        │                                                                    │
│        ├── Stance Selection (radio: In Favor / Against / General)           │
│        ├── Comment Input + Post Button                                      │
│        ├── Evidence Links Section (expandable)                              │
│        └── [Show Grouped Comments] button                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. CommentSection Component — Full Walkthrough

### 2.1 — Props

| Prop | Type | Purpose |
|---|---|---|
| `comments` | array | Pre-processed comments from NewsFeed |
| `onAddComment` | function | Callback to NewsCard when comment posted |
| `onClose` | function | Closes the comment section |
| `newsId` | string | The news article ID (for API calls) |
| `onCommentDeleted` | function | Callback when a comment is deleted |

### 2.2 — State

```jsx
const [newComment, setNewComment] = useState('');          // Input text
const [evidenceLinks, setEvidenceLinks] = useState([]);    // Array of URL strings
const [loading, setLoading] = useState(false);             // Posting spinner
const [showGroupedComments, setShowGroupedComments] = useState(false);
const [groupedComments, setGroupedComments] = useState([]); // AI groups
const [loadingGrouped, setLoadingGrouped] = useState(false);
const [regeneratingGroups, setRegeneratingGroups] = useState(false);
const [showEvidenceSection, setShowEvidenceSection] = useState(false);
const [selectedStance, setSelectedStance] = useState('general');
const [deletingCommentId, setDeletingCommentId] = useState(null);

const { userType, userInfo, isAuthenticated } = useContext(UserContext);
```

---

## 3. Adding a Comment — The Complete Flow

```
User types comment + selects stance + (optionally) adds evidence links
       │
       ▼
Clicks "Post" → handleAddComment()
       │
       ├── Guard: isAuthenticated?  → If not: toast.error("Please login")
       ├── Guard: userType allowed? → Guests and normal users cannot comment
       ├── Guard: newComment empty?  → If empty: return
       │
       ▼
Build commentData object:
  {
    comment: "I think this is true because...",
    stance: "in_favor",          // or "against" or "general"
    evidenceLinks: ["https://example.com/source"]
  }
       │
       ▼
Determine commentType from userType:
  community user → commentsAPI.addCommunityComment(newsId, commentData)
  expert user → commentsAPI.addExpertComment(newsId, commentData)
       │
       ▼
API returns success → toast.success("Comment added!")
       │
       ▼
Call onAddComment(commentText, commentType, username) → parent updates
       │
       ▼
Reset form: setNewComment(''), setEvidenceLinks([]), setSelectedStance('general')
```

### 3.1 — Actual Code

```jsx
const handleAddComment = async () => {
  if (!isAuthenticated) {
    toast.error("Please login to comment");
    return;
  }
  if (userType === 'guest' || userType === 'normal') {
    toast.error("Only community and expert users can comment");
    return;
  }
  if (!newComment.trim()) return;

  setLoading(true);
  try {
    const commentData = {
      comment: newComment,
      stance: selectedStance,
      evidenceLinks: evidenceLinks.filter(link => link.trim() !== ''),
    };

    if (userType === 'community') {
      await commentsAPI.addCommunityComment(newsId, commentData);
    } else if (userType === 'expert' || userType === 'admin') {
      await commentsAPI.addExpertComment(newsId, commentData);
    }

    toast.success('Comment added!');
    onAddComment(newComment, userType === 'expert' ? 'expert' : 'community',
                 userInfo?.username);

    // Reset form
    setNewComment('');
    setEvidenceLinks([]);
    setSelectedStance('general');
    setShowEvidenceSection(false);
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed to post comment');
  } finally {
    setLoading(false);
  }
};
```

---

## 4. Stance System — In Favor / Against / General

Each comment has a **stance** — the commenter's position on the news article's truthfulness:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Stance Options (radio buttons)                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  ○ 👍 In Favor    — "I believe this news is credible"                      │
│  ○ 👎 Against     — "I believe this news is false/misleading"              │
│  ● 💬 General     — "I have a neutral observation" (default)               │
└─────────────────────────────────────────────────────────────────────────────┘
```

Stances are displayed as color-coded badges next to each comment:
- `in_favor` → green badge
- `against` → red badge
- `general` → gray badge

Only `community` and `expert` users see the stance selection. The stance radio buttons are conditionally rendered:

```jsx
{isAuthenticated && (userType === 'community' || userType === 'expert') && (
  <div>
    <label>Your stance on this news:</label>
    <input type="radio" name="stance" value="in_favor"
      checked={selectedStance === 'in_favor'}
      onChange={(e) => setSelectedStance(e.target.value)} />
    {/* ... similar for "against" and "general" */}
  </div>
)}
```

---

## 5. Evidence Links — Supporting Claims

Community and expert users can attach up to 3 source URLs to support their claims:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [🔗 Add Evidence Links]  (toggle button)                                   │
│                                                                             │
│  Evidence Link 1: [https://reuters.com/article/...     ] [Remove]          │
│  Evidence Link 2: [https://nytimes.com/fact-check/...  ] [Remove]          │
│  [+ Add another link]  (max 3)                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

The `EvidenceLinksSection` sub-component manages adding/removing links. The `EvidenceDisplay` sub-component renders links next to comments:

```jsx
// In each comment display:
{item.evidenceLinks && item.evidenceLinks.length > 0 && (
  <EvidenceDisplay evidenceLinks={item.evidenceLinks} />
  // Renders clickable links with external link icons
)}
```

---

## 6. AI-Powered Comment Grouping

### 6.1 — Theory

When a news article has many comments, it's hard to identify themes. The backend uses an AI model to automatically group comments by topic, generating a label and description for each group.

### 6.2 — The Flow

```
User clicks "Show Grouped Comments"
       │
       ▼
handleShowGroupedComments()
       │
       ├── If already showing → toggle off
       │
       ├── Call commentFilterAPI.getGroupedComments(newsId)
       │     GET /api/comment-filter/{newsId}/groups
       │
       ▼
Server response:
  [
    {
      label: "Safety Concerns",
      description: "Comments discussing public safety implications",
      commentCount: 3,
      comments: [
        { text: "This could endanger...", username: "alice", stance: "against" },
        { text: "Safety protocols are...", username: "bob", stance: "general" },
      ]
    },
    {
      label: "Economic Impact",
      description: "Comments about financial consequences",
      commentCount: 5,
      comments: [...]
    }
  ]
       │
       ▼
setGroupedComments(response.data)
setShowGroupedComments(true)
       │
       ▼
UI switches from flat comment list to grouped view
```

### 6.3 — Grouped View UI

```
┌─────────────────────────────────────────────────────┐
│  Group 1: Safety Concerns                            │  ← Blue header
│  "Comments discussing public safety implications"    │  ← Description
│  3 comments • Created Dec 15                         │
├─────────────────────────────────────────────────────┤
│  │ Community - alice  👎 Against                     │  ← Blue left border
│  │ "This could endanger the public..."               │
│  │───────────────────────────────                    │
│  │ Community - bob  💬 General                       │
│  │ "Safety protocols are insufficient"               │
└─────────────────────────────────────────────────────┘

[Improve Groups] ← Calls regenerateGroupNames to get better labels
```

### 6.4 — Improve Groups

```jsx
const handleRegenerateGroups = async () => {
  setRegeneratingGroups(true);
  try {
    await commentFilterAPI.regenerateGroupNames(newsId);
    // POST /api/comment-filter/{newsId}/regenerate-names
    // AI re-analyzes all comments and creates better groupings

    // Refresh the groups
    const response = await commentFilterAPI.getGroupedComments(newsId);
    setGroupedComments(response.data || []);
    toast.success('Groups improved!');
  } catch (error) {
    toast.error('Failed to improve groups');
  } finally {
    setRegeneratingGroups(false);
  }
};
```

---

## 7. Expert Voting on Comments

Expert users can upvote or downvote individual comments to signal quality/accuracy:

```
┌─────────────────────────────────────────────────────┐
│  Community - alice  👍 In Favor                      │
│  "I verified this claim through official records..." │
│                                                      │
│  Expert Evaluation: [👍 2] [👎 0]                    │  ← ExpertVotingSection
└─────────────────────────────────────────────────────┘
```

The `ExpertVotingSection` embedded in each comment handles:
- Displaying current expert vote counts
- Only allowing expert/admin users to vote
- Calling `commentsAPI.expertVoteOnCommunityComment()` or `expertVoteOnExpertComment()`

---

## 8. Delete Comment Logic

### 8.1 — Who Can Delete?

```jsx
// A comment can be deleted by:
// 1. Admin (can delete any comment)
// 2. The comment's author (owner)

const canDelete = (comment) => {
  return userType === 'admin' ||
    (comment.commenterId && userInfo?._id?.toString() === comment.commenterId?.toString());
};
```

### 8.2 — Delete Flow

```jsx
const handleDeleteComment = async (commentId, commentType) => {
  setDeletingCommentId(commentId);  // Show spinner on that comment
  try {
    if (commentType === 'community') {
      await commentsAPI.deleteCommunityComment(commentId);
    } else {
      await commentsAPI.deleteExpertComment(commentId);
    }
    toast.success('Comment deleted');
    onCommentDeleted?.(commentId);  // Notify parent to update its state
  } catch (error) {
    toast.error('Failed to delete');
  } finally {
    setDeletingCommentId(null);
  }
};
```

---

## 9. Interview Q&A

**Q: Why are community and expert comments stored separately on the backend but merged on the frontend?**
A: The backend separates them because they have different schemas (community comments have `commenter`, expert comments have `expert` field). The frontend merges them into a single array for a unified timeline view, but preserves the `type` field so each can be styled differently.

**Q: What is the AI comment grouping powered by?**
A: The backend uses the Gemini AI API to analyze comment text, identify themes, and cluster them into labeled groups. The frontend simply displays the results. The "Improve Groups" button triggers the AI to re-analyze with potentially better prompts.

**Q: Why use `deletingCommentId` state instead of a boolean?**
A: Multiple comments are displayed simultaneously. A boolean `deleting` would show spinners on ALL delete buttons. By storing the specific `commentId` being deleted, only that one comment's button shows a spinner: `disabled={deletingCommentId === item._id}`.

---

**Next → [12-AI-COMPONENTS.md](./12-AI-COMPONENTS.md)** — The AIVerdictSection for expert-driven credibility analysis.
