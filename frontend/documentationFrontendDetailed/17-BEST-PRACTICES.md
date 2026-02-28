# 17 — Best Practices: Code Quality & Patterns in VoxVeritas

## Table of Contents
1. [Why Best Practices Matter](#1-why-best-practices-matter)
2. [File & Folder Organization](#2-file--folder-organization)
3. [Naming Conventions](#3-naming-conventions)
4. [Component Design Principles](#4-component-design-principles)
5. [State Management Guidelines](#5-state-management-guidelines)
6. [The Loading → Error → Data Pattern](#6-the-loading--error--data-pattern)
7. [API & Data Fetching Patterns](#7-api--data-fetching-patterns)
8. [Error Handling](#8-error-handling)
9. [Security Practices](#9-security-practices)
10. [Performance Patterns](#10-performance-patterns)
11. [Code Style & Readability](#11-code-style--readability)
12. [Interview Q&A](#12-interview-qa)

---

## 1. Why Best Practices Matter

A codebase is read far more often than it is written. Best practices exist to:
- Make code **predictable** — any developer can find what they need
- Reduce **bugs** — consistent patterns prevent common mistakes
- Enable **collaboration** — shared conventions mean less confusion
- Simplify **maintenance** — code written today must be understood months later

---

## 2. File & Folder Organization

### 2.1 — Group by Feature, Not by Type

```
✅ VoxVeritas approach:
src/
  components/     ← All visual building blocks
  pages/          ← All route-level views
  services/       ← All API calls
  context/        ← All global state
  utils/          ← All helper functions

❌ Anti-pattern:
src/
  buttons/        ← All buttons from every feature
  forms/          ← All forms
  hooks/          ← All hooks
```

### 2.2 — One Component Per File

Every React component lives in its own file. The file name matches the component name.

```
✅ Header.jsx → exports Header
✅ NewsCard.jsx → exports NewsCard
❌ utils.jsx → exports Header, Footer, Sidebar (too many things)
```

### 2.3 — Index Files Not Used

VoxVeritas imports components directly by their file path rather than using barrel `index.js` files. This keeps imports explicit and traceable:

```jsx
// Direct import (VoxVeritas pattern):
import Header from '../components/Header';
import NewsCard from '../components/NewsCard';
```

---

## 3. Naming Conventions

| What | Convention | Example |
|---|---|---|
| Components | PascalCase | `NewsCard`, `CommentSection` |
| Component files | PascalCase.jsx | `NewsCard.jsx`, `LoginForm.jsx` |
| Functions/variables | camelCase | `fetchNews`, `userInfo` |
| Constants | UPPER_SNAKE | `BASE_URL`, `API_URL` |
| Boolean state | `is/has/can` prefix | `isAuthenticated`, `hasVoted`, `canGenerate` |
| Event handlers | `handle` prefix | `handleSubmit`, `handleVote`, `handleDelete` |
| API functions | verb + noun | `getNews`, `createComment`, `deleteVerdict` |
| CSS classes | Tailwind utilities | `bg-white`, `text-lg`, `rounded-xl` |

### 3.1 — Boolean Naming

```jsx
// ✅ Clear intent:
const [isLoading, setIsLoading] = useState(false);
const [hasVoted, setHasVoted] = useState(false);
const [canGenerate, setCanGenerate] = useState(true);
const [showComments, setShowComments] = useState(false);

// ❌ Ambiguous:
const [loading, setLoading] = useState(false);  // Is it a noun or adjective?
const [vote, setVote] = useState(false);         // Is it a boolean or a value?
```

### 3.2 — Handler Naming

```jsx
// ✅ Consistent:
const handleSubmit = () => { ... };
const handleVote = (direction) => { ... };
const handleDeleteComment = (commentId) => { ... };

// ❌ Inconsistent:
const submit = () => { ... };
const onVoteClick = () => { ... };
const removeComment = (id) => { ... };
```

---

## 4. Component Design Principles

### 4.1 — Smart vs Dumb Components

```
Smart (Container)          Dumb (Presentational)
─────────────────          ─────────────────────
• Fetches data             • Receives props
• Manages state            • Renders UI
• Calls APIs               • No side effects
• Passes data down         • Reusable

VoxVeritas examples:
  Smart: NewsFeed, DebateRoom, HomePage
  Dumb: NewsCard, Footer, AnimatedLogo
```

### 4.2 — Single Responsibility

Each component should do ONE thing well.

```jsx
// ✅ VoxVeritas: NewsFeed fetches, NewsCard displays
<NewsFeed>                    // Fetches news, manages state
  <NewsCard news={item} />   // Displays one news item
</NewsFeed>

// ❌ Anti-pattern: one component does everything
<NewsFeedAndCardAndComments />  // Fetches, displays, handles comments
```

### 4.3 — Props as the Interface

Props are a component's public API. Document them with PropTypes:

```jsx
// NewsCard.jsx
NewsCard.propTypes = {
  news: PropTypes.object.isRequired,
  onVote: PropTypes.func.isRequired,
  onComment: PropTypes.func,
  userType: PropTypes.string,
};
```

### 4.4 — Composition Over Prop Drilling

```jsx
// ✅ Use Context for deeply shared data:
const { userType } = useContext(UserContext);

// ❌ Avoid passing through many layers:
<App userType={userType}>
  <Page userType={userType}>
    <Section userType={userType}>
      <Card userType={userType} />
    </Section>
  </Page>
</App>
```

---

## 5. State Management Guidelines

### 5.1 — Where to Put State

```
Question                          Answer
────────                          ──────
Used by one component only?  →    Local state (useState)
Used by parent + children?   →    Lift to parent, pass as props
Used across unrelated parts? →    Context (useContext)
```

### 5.2 — State Placement in VoxVeritas

| State | Location | Why |
|---|---|---|
| `userInfo`, `isAuthenticated` | UserContext | Needed everywhere (Header, pages, API calls) |
| `news[]` array | NewsFeed component | Only NewsFeed and its children need it |
| `showComments` | NewsCard component | Only that card needs it |
| `newComment` text | CommentSection | Only the input field needs it |
| `theme` (dark/light) | Header + localStorage | Toggle in Header, persisted across visits |

### 5.3 — Minimize State

```jsx
// ✅ Derive values from existing state:
const isAdmin = userType === 'admin';
const commentCount = comments.length;
const hasComments = comments.length > 0;

// ❌ Redundant state:
const [isAdmin, setIsAdmin] = useState(false);
const [commentCount, setCommentCount] = useState(0);
// Now you must keep these in sync manually — bug-prone!
```

---

## 6. The Loading → Error → Data Pattern

Almost every data-fetching component in VoxVeritas follows this three-state pattern:

```jsx
function MyComponent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.getData();
        setData(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);  // Always runs, even on error
      }
    };
    fetchData();
  }, []);

  // ─── Render in priority order ─────────────────────
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!data) return <EmptyState />;
  return <DataView data={data} />;
}
```

### Where This Pattern Appears

| Component | Data | Loading State | Error State |
|---|---|---|---|
| NewsFeed | `news[]` | Spinner | Toast |
| DebateRoom | `debateRoom`, `comments` | Spinner | Error message |
| AIVerdictSection | `verdict` | Loading indicator | Error display |
| ProfilePage | `userProfile` | Skeleton | Error message |
| ExpertsPage | `experts[]` | Spinner | Error message |

---

## 7. API & Data Fetching Patterns

### 7.1 — Centralized API Calls

All API calls live in `src/services/api.js`, not in components:

```jsx
// ✅ VoxVeritas pattern:
// api.js
export const newsAPI = {
  getAllNews: () => api.get('/news'),
  getNewsById: (id) => api.get(`/news/${id}`),
};

// Component simply calls:
const response = await newsAPI.getAllNews();

// ❌ Anti-pattern: API URLs scattered in components
const response = await axios.get('http://localhost:3000/api/news');
```

### 7.2 — Fetch in useEffect, Not in Render

```jsx
// ✅ Correct — fetch on mount:
useEffect(() => {
  fetchData();
}, []);

// ❌ Wrong — fetch on every render:
function Component() {
  fetchData();  // Called every time component re-renders!
  return <div>...</div>;
}
```

### 7.3 — Optimistic Updates vs Refetch

VoxVeritas uses **refetch after mutation** — after creating/updating/deleting, it re-fetches the data from the server:

```jsx
const handleVote = async (newsId, direction) => {
  await newsAPI.voteNews(newsId, direction);  // Send vote
  fetchNews();  // Re-fetch to get updated counts
};
```

This is simpler than optimistic updates (updating the UI immediately and reverting on error) but adds a brief delay.

---

## 8. Error Handling

### 8.1 — Try-Catch in Async Functions

```jsx
const handleSubmit = async () => {
  try {
    await authAPI.login(email, password);
    toast.success("Logged in!");
    navigate('/home');
  } catch (error) {
    // API interceptor logs the error
    // Show user-friendly message:
    toast.error(error.response?.data?.message || "Login failed");
  }
};
```

### 8.2 — The Optional Chaining Pattern

```jsx
error.response?.data?.message || "Something went wrong"
//    ?.              ?.
// If response is undefined, don't crash — return undefined
// || provides a fallback string
```

### 8.3 — Toast Notifications for User Feedback

VoxVeritas uses `react-toastify` for non-blocking notifications:

```jsx
import { toast } from 'react-toastify';

toast.success("Comment posted!");      // Green
toast.error("Failed to delete");       // Red
toast.info("Loading results...");      // Blue
toast.warn("You must be logged in");   // Yellow
```

---

## 9. Security Practices

### 9.1 — JWT Storage

```jsx
// VoxVeritas stores JWT in localStorage:
localStorage.setItem('token', token);

// The Axios request interceptor attaches it to every request:
config.headers.Authorization = `Bearer ${token}`;
```

### 9.2 — Protected Routes

```jsx
// ProtectedRoute checks authentication before rendering:
if (!isAuthenticated) return <Navigate to="/login" />;
if (requiredRole && userType !== requiredRole) return <Navigate to="/" />;
return children;
```

### 9.3 — Input Handling

React automatically escapes JSX expressions, preventing XSS:

```jsx
// Safe — React escapes the string:
<p>{userInput}</p>

// ⚠️ Dangerous — bypasses React's escaping:
<div dangerouslySetInnerHTML={{ __html: userInput }} />
// VoxVeritas avoids this pattern
```

---

## 10. Performance Patterns

### 10.1 — Conditional Rendering (Not Hidden)

```jsx
// ✅ VoxVeritas: component doesn't exist until needed
{showComments && <CommentSection newsId={id} />}

// ❌ Hidden but still rendered (wastes memory):
<div style={{ display: showComments ? 'block' : 'none' }}>
  <CommentSection newsId={id} />
</div>
```

### 10.2 — Key Prop in Lists

```jsx
// ✅ Stable unique key — React can track each item:
{news.map(item => <NewsCard key={item._id} news={item} />)}

// ❌ Array index as key — breaks on reorder/delete:
{news.map((item, index) => <NewsCard key={index} news={item} />)}
```

### 10.3 — Cleanup in useEffect

```jsx
useEffect(() => {
  const interval = setInterval(tick, 3000);
  return () => clearInterval(interval);  // Cleanup on unmount
  //     ──────────────────────────────
  //     Without this, the interval keeps running after
  //     the component is removed → memory leak
}, []);
```

### 10.4 — Lazy Loading (Future Improvement)

React supports code splitting with `React.lazy()`:

```jsx
const DebateRoom = React.lazy(() => import('./pages/DebateRoom'));
// Only loads DebateRoom code when the user navigates to it
// VoxVeritas currently imports everything upfront
```

---

## 11. Code Style & Readability

### 11.1 — Destructure Props

```jsx
// ✅ Clear what the component receives:
function NewsCard({ news, onVote, onComment, userType }) {

// ❌ Opaque — must read the body to know what's used:
function NewsCard(props) {
  const title = props.news.title;  // Buried
```

### 11.2 — Early Returns

```jsx
// ✅ Handle edge cases first, then the happy path:
if (loading) return <Spinner />;
if (error) return <Error />;
if (!data) return null;

// Main render (not nested inside conditions):
return (
  <div>
    <h1>{data.title}</h1>
    ...
  </div>
);
```

### 11.3 — Ternary for Simple Conditions, && for Presence

```jsx
// ✅ Ternary for either/or:
{isAuthenticated ? <LogoutButton /> : <LoginButton />}

// ✅ && for show/hide:
{hasComments && <CommentSection />}

// ❌ Nested ternaries (hard to read):
{isAdmin ? <AdminView /> : isExpert ? <ExpertView /> : <UserView />}
// Better: use a function or a lookup object
```

### 11.4 — Consistent Formatting

VoxVeritas follows standard React conventions:
- 2-space indentation
- Single quotes for strings (except JSX attributes)
- Trailing commas in arrays/objects
- Arrow functions for handlers
- `async/await` over `.then()` chains

---

## 12. Interview Q&A

**Q: What is the most important React best practice?**
A: Keep components small and focused (single responsibility). A component that fetches data, manages complex state, and renders a large UI tree is hard to test, debug, and reuse. Split it into a smart container that fetches data and dumb presentational components that render it.

**Q: Why use Context instead of prop drilling?**
A: When data like authentication status is needed by components at many different levels of the tree (Header, ProtectedRoute, NewsCard, CommentSection), passing it through every intermediate component creates coupling and boilerplate. Context provides a direct channel from provider to consumer, regardless of depth.

**Q: What's the difference between `useEffect` with `[]` and without?**
A: `useEffect(() => {}, [])` runs once on mount. `useEffect(() => {})` with no dependency array runs after every render — almost always a bug. `useEffect(() => {}, [value])` runs when `value` changes.

**Q: Why centralize API calls in a service file?**
A: If the backend URL changes, you update one file instead of fifty components. If you need to add authentication headers, you configure one Axios instance. If you want to add caching or retry logic, you add it in one place. Centralization is the single most impactful architectural decision for maintainability.

---

**← [16-TAILWIND-CSS.md](./16-TAILWIND-CSS.md)** | **[Back to README](./00-README.md)**
