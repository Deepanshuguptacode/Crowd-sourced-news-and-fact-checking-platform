# 10 — News Components: NewsFeed & NewsCard Deep-Dive

## Table of Contents
1. [The News Display Architecture](#1-the-news-display-architecture)
2. [NewsFeed Component — The Data Orchestrator](#2-newsfeed-component--the-data-orchestrator)
3. [NewsCard Component — The Visual Unit](#3-newscard-component--the-visual-unit)
4. [Data Flow: Backend → NewsFeed → NewsCard](#4-data-flow-backend--newsfeed--newscard)
5. [Voting System](#5-voting-system)
6. [Image Handling and Pagination](#6-image-handling-and-pagination)
7. [AI Analysis Display](#7-ai-analysis-display)
8. [PropTypes — Runtime Type Checking](#8-proptypes--runtime-type-checking)
9. [Interview Q&A](#9-interview-qa)

---

## 1. The News Display Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  HomePage                                                                   │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  Header                                                               │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  NewsFeed (data fetcher + state manager)                              │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │  NewsCard (post #1)                                             │  │  │
│  │  │    ├── Author info + Status badge                               │  │  │
│  │  │    ├── Content (text, read more/less)                           │  │  │
│  │  │    ├── Images (paginated grid)                                  │  │  │
│  │  │    ├── AI Analysis (expandable)                                 │  │  │
│  │  │    ├── AIVerdictSection (expert-only feature)                   │  │  │
│  │  │    ├── Voting buttons (upvote / downvote)                       │  │  │
│  │  │    └── CommentSection (expandable)                              │  │  │
│  │  ├─────────────────────────────────────────────────────────────────┤  │  │
│  │  │  NewsCard (post #2) ...                                         │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  Footer                                                               │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. NewsFeed Component — The Data Orchestrator

### 2.1 — Responsibilities

NewsFeed does NOT render any visible UI itself (except loading/error states). Its job is to:
1. **Fetch** all news posts from the backend on mount
2. **Process** the raw data (normalize comments, fix image URLs)
3. **Pass** processed data to individual NewsCard components
4. **Handle** user actions (vote, comment, delete) and update local state

### 2.2 — State

```jsx
const [news, setNews] = useState([]);        // Array of news post objects
const [loading, setLoading] = useState(true); // Show spinner on first load
const [error, setError] = useState('');        // Error message string

const { isAuthenticated, userType } = useContext(UserContext);
// Used to check if user can vote
```

### 2.3 — Data Fetching (useEffect)

```jsx
useEffect(() => {
  const fetchNews = async () => {
    try {
      setLoading(true);
      const response = await newsAPI.getAllPosts();
      // GET /api/news → { news: [{ _id, title, description, ... }, ...] }
      setNews(response.news || []);
    } catch (error) {
      setError('Failed to fetch news data.');
      toast.error('Failed to load news feed');
    } finally {
      setLoading(false);
    }
  };
  fetchNews();
}, []);  // Empty dependency array = fetch once on mount
```

### 2.4 — Data Processing Functions

NewsFeed transforms backend data before passing to NewsCard:

```jsx
// ── processComments: Unify community + expert comments into one array ──
const processComments = (comments) => [
  ...((comments?.community || []).map(c => ({
    text: c.comment,
    type: 'community',
    username: c.commenter?.username || 'Anonymous',
    _id: c._id,
    stance: c.stance,
    evidenceLinks: c.evidenceLinks || [],
    // ... more fields
  }))),
  ...((comments?.expert || []).map(c => ({
    text: c.comment,
    type: 'expert',
    username: c.expert?.username || 'Expert',
    // ... similar transformation
  }))),
];
// Backend stores community and expert comments separately.
// NewsCard expects a single flat array — this function merges them.

// ── processImageUrls: Ensure all URLs are absolute ──
const processImageUrls = (screenshots) =>
  (screenshots || []).map(screenshot =>
    (screenshot.startsWith('http://') || screenshot.startsWith('https://'))
      ? screenshot                              // Already absolute
      : `${config.BASE_URL}${screenshot}`       // Prepend backend URL
  );
// Backend may return relative paths like "/uploads/image.jpg"
// Browser needs absolute: "http://localhost:3000/uploads/image.jpg"
```

### 2.5 — Handler Functions (Passed to NewsCard as Callbacks)

```jsx
// ── handleVote: Called when user clicks upvote/downvote in NewsCard ──
const handleVote = async (postId, voteType) => {
  // Guard: check auth
  if (!isAuthenticated || userType === 'guest') {
    toast.error('Please login to vote');
    return;
  }

  const response = await newsAPI.voteNews(postId, voteType);

  // Update the specific post in the news array immutably:
  setNews(prevNews => prevNews.map(post =>
    post._id === postId
      ? { ...post, upvotes: response.data.upvotes, downvotes: response.data.downvotes }
      : post
  ));
};

// ── handleCommentAdded: Called when a new comment is posted ──
const handleCommentAdded = (postId, newComment, commentType, username) => {
  setNews(prevNews => prevNews.map(post => {
    if (post._id !== postId) return post;
    const updated = { ...post };
    const comments = updated.comments || { community: [], expert: [] };
    const newObj = { text: newComment, type: commentType, username };
    comments[commentType] = [newObj, ...comments[commentType]];
    updated.comments = comments;
    return updated;
  }));
};

// ── handlePostDeleted: Remove post from local state ──
const handlePostDeleted = (postId) => {
  setNews(prevNews => prevNews.filter(post => post._id !== postId));
};
```

### 2.6 — Rendering

```jsx
return (
  <div className="divide-y divide-gray-200 dark:divide-gray-700">
    {news.length === 0 ? (
      <p>No news articles available.</p>
    ) : (
      news.map((item) => (
        <NewsCard
          key={item._id}
          postId={item._id}
          title={item.title}
          content={item.description}
          factStatus={item.status}
          upvotes={item.upvotes}
          downvotes={item.downvotes}
          comments={processComments(item.comments)}
          imageUrl={processImageUrls(item.screenshots)}
          username={item.uploadedBy?.username || 'Anonymous'}
          onVote={handleVote}
          onCommentAdded={handleCommentAdded}
          onPostDeleted={handlePostDeleted}
          // ... more props
        />
      ))
    )}
  </div>
);
```

---

## 3. NewsCard Component — The Visual Unit

### 3.1 — Props It Receives

| Prop | Type | Purpose |
|---|---|---|
| `postId` | string | Unique ID for API calls |
| `title` | string | News headline |
| `content` | string | Article body |
| `factStatus` | string | "Verified", "Pending", or "Fake" |
| `upvotes` | number | Count of upvotes |
| `downvotes` | number | Count of downvotes |
| `comments` | array | Processed comments from NewsFeed |
| `imageUrl` | array | Array of image URLs |
| `username` | string | Author's display name |
| `uploadedById` | string | Author's user ID (for delete permission) |
| `aiReview` | string | "REAL", "FAKE", or "PENDING" |
| `confidence` | number | 0–1 confidence score |
| `onVote` | function | Callback → NewsFeed.handleVote |
| `onCommentAdded` | function | Callback → NewsFeed.handleCommentAdded |
| `onPostDeleted` | function | Callback → NewsFeed.handlePostDeleted |

### 3.2 — Internal State

```jsx
const [upvotes, setUpvotes] = useState(initialUpvotes);
const [downvotes, setDownvotes] = useState(initialDownvotes);
const [comments, setComments] = useState(initialComments);
const [showComments, setShowComments] = useState(false);
const [currentPage, setCurrentPage] = useState(1);      // Image pagination
const [showAiAnalysis, setShowAiAnalysis] = useState(false);
const [showFullText, setShowFullText] = useState(false); // Expand/collapse content
const [deleting, setDeleting] = useState(false);
```

### 3.3 — Visual Layout

```
┌─────────────────────────────────────────────────────┐
│  ┌──┐  Username            [Delete] [Status Badge]  │ ← Author row
│  └──┘  Community Member                              │
├─────────────────────────────────────────────────────┤
│  Article content text...                             │ ← Content
│  [Read more]                                         │
├─────────────────────────────────────────────────────┤
│  ┌────────────┐ ┌────────────┐                      │ ← Image grid
│  │   Image 1  │ │   Image 2  │                      │
│  └────────────┘ └────────────┘                      │
│           [← Page 1/3 →]                             │ ← Image pagination
├─────────────────────────────────────────────────────┤
│  [🤖 AI Analysis ▼]                                 │ ← Expandable
│    Detection: Likely Authentic                       │
│    Confidence: ████████░░ 80%                        │
├─────────────────────────────────────────────────────┤
│  [AIVerdictSection]                                  │ ← Expert AI verdict
├─────────────────────────────────────────────────────┤
│  [👍 12]  [👎 3]                    [💬 5 Comments]  │ ← Actions bar
├─────────────────────────────────────────────────────┤
│  [CommentSection] (if showComments)                  │ ← Expandable
└─────────────────────────────────────────────────────┘
```

---

## 4. Data Flow: Backend → NewsFeed → NewsCard

```
Backend Database
    │
    ▼
GET /api/news  →  { news: [ { _id, title, description, screenshots, 
                                comments: { community: [...], expert: [...] },
                                uploadedBy: { username, _id },
                                upvotes, downvotes, status, aiReview } ] }
    │
    ▼
NewsFeed.fetchNews()  →  setNews(response.news)
    │
    ▼
processComments(): Flatten community + expert into single array
processImageUrls(): Convert relative paths to absolute URLs
    │
    ▼
<NewsCard
  title="Breaking News: X"
  content="The full article text..."
  comments=[{ text, type, username, _id }, ...]
  imageUrl=["http://localhost:3000/uploads/img1.jpg", ...]
  onVote={handleVote}
/>
    │
    ▼
NewsCard renders the visual representation
    │
    ▼
User clicks upvote → NewsCard.handleVotes('upvote')
                      → calls props.onVote(postId, 'upvote')
                      → NewsFeed.handleVote(postId, 'upvote')
                      → newsAPI.voteNews(postId, 'upvote')
                      → setNews(updated)
                      → Re-render all cards with new data
```

---

## 5. Voting System

```jsx
// In NewsCard:
const handleVotes = (voteType) => {
  onVote(postId, voteType);
  // Delegates to NewsFeed's handleVote (which does the API call)
};

// In NewsFeed:
const handleVote = async (postId, voteType) => {
  if (!isAuthenticated || userType === 'guest') {
    toast.error('Please login to vote');
    return;
  }
  const response = await newsAPI.voteNews(postId, voteType);
  // POST /api/news/{postId}/vote  { voteType: "upvote" }
  // Server tracks which user voted (from JWT) and returns updated counts

  setNews(prev => prev.map(post =>
    post._id === postId
      ? { ...post, upvotes: response.data.upvotes, downvotes: response.data.downvotes }
      : post
  ));
};
```

---

## 6. Image Handling and Pagination

```jsx
// Constants:
const imagesPerPage = 4;

// Pagination math:
const indexOfLastImage = currentPage * imagesPerPage;    // Page 1: 4
const indexOfFirstImage = indexOfLastImage - imagesPerPage; // Page 1: 0
const currentImages = imageUrl.slice(indexOfFirstImage, indexOfLastImage);
// Shows images [0,1,2,3] on page 1, [4,5,6,7] on page 2, etc.

// Grid layout adapts to count:
// 1 image → single column
// 2 images → 2 columns on desktop, 1 on mobile
// 3+ images → 2 columns grid

// Each image has:
// - onError handler: hides broken image, shows placeholder
// - onLoad handler: adjusts aspect ratio dynamically
// - Hover effect: slight scale-up with overlay
```

---

## 7. AI Analysis Display

NewsCard shows two types of AI analysis:

### 7.1 — ML-Based Analysis (aiReview prop)

```jsx
// Built into NewsCard itself:
{aiReview && aiReview !== "PENDING" && (
  <button onClick={() => setShowAiAnalysis(!showAiAnalysis)}>
    AI Analysis
    {aiReview === "REAL" ? "Likely Real" : "Potential Misinformation"}
  </button>
)}

// Expanded view shows:
// - Detection result text
// - Confidence bar (visual progress bar)
```

### 7.2 — Gemini AI Verdict (AIVerdictSection component)

```jsx
// Separate component embedded in NewsCard:
<AIVerdictSection
  newsId={postId}
  onVerdictUpdate={(verdictData) => console.log('Updated:', verdictData)}
/>
// This is the expert-only deep analysis feature (covered in doc 12)
```

---

## 8. PropTypes — Runtime Type Checking

```jsx
import PropTypes from 'prop-types';

NewsCard.propTypes = {
  postId: PropTypes.string.isRequired,         // Must be a string, required
  title: PropTypes.string.isRequired,
  upvotes: PropTypes.number,                   // Optional number
  comments: PropTypes.arrayOf(                 // Array of objects with shape:
    PropTypes.shape({
      text: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      username: PropTypes.string.isRequired,
    })
  ),
  onVote: PropTypes.func,                      // Optional function
};

NewsCard.defaultProps = {
  upvotes: 0,                // Default if prop not passed
  downvotes: 0,
  comments: [],
  imageUrl: [],
  aiReview: "PENDING",
  confidence: 0,
};
```

PropTypes provide runtime warnings (in development only) when a component receives props of the wrong type. They are not enforced in production builds.

---

## 9. Interview Q&A

**Q: Why does NewsFeed process comments before passing them to NewsCard?**
A: The backend stores community and expert comments in separate arrays. NewsCard expects a single unified array for display. Processing in NewsFeed keeps NewsCard simpler — it only needs to render what it receives without knowing the backend structure.

**Q: What is the "lifting state up" pattern shown here?**
A: The news array lives in NewsFeed (parent), not in individual NewsCards (children). When a child needs to modify the data (vote, comment, delete), it calls a callback function passed via props. The parent updates its state, which triggers re-renders of all children. This ensures a single source of truth.

**Q: Why use `prevNews.map(post => post._id === postId ? {...post, upvotes} : post)` for state updates?**
A: The `.map()` creates a new array (immutability). For the matching post, it creates a new object with updated votes using the spread operator. For all other posts, it returns the original objects unchanged. React compares old and new arrays and only re-renders the changed NewsCard.

---

**Next → [11-COMMENT-COMPONENTS.md](./11-COMMENT-COMPONENTS.md)** — The comment system with expert voting and AI grouping.
