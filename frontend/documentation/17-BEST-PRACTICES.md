# 17 - Best Practices: Code Organization and Patterns

## What You'll Learn
- File and folder organization patterns
- Component design principles
- State management best practices
- Performance optimization techniques
- Error handling patterns
- Code quality guidelines

---

## File Organization Patterns

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    RECOMMENDED STRUCTURE                                    │
└─────────────────────────────────────────────────────────────────────────────┘

src/
├── components/          # Reusable UI components
│   ├── common/          # Truly generic (Button, Input, Modal)
│   ├── layout/          # Layout components (Header, Footer, Sidebar)
│   └── features/        # Feature-specific (NewsCard, CommentItem)
│
├── pages/               # Route components (one per route)
│   ├── HomePage.jsx
│   └── LoginForm.jsx
│
├── context/             # React Context providers
│   └── userContext.jsx
│
├── services/            # API calls and external services
│   └── api.js
│
├── hooks/               # Custom React hooks
│   └── useAuth.js       # (optional - custom hooks)
│
├── utils/               # Helper functions
│   └── formatDate.js    # (optional - utility functions)
│
├── config.js            # Environment configuration
├── App.jsx              # Root component with routes
└── main.jsx             # Entry point
```

### Naming Conventions

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  NAMING PATTERNS                                                            │
└─────────────────────────────────────────────────────────────────────────────┘

COMPONENTS:
─────────────────────────────────────
✅ PascalCase for component files: NewsCard.jsx, UserProfile.jsx
✅ PascalCase for component names: export const NewsCard = () => {}
✅ Match filename to component name

UTILITIES/SERVICES:
─────────────────────────────────────
✅ camelCase for utilities: api.js, formatDate.js
✅ camelCase for function names: fetchNews(), formatDate()

FOLDERS:
─────────────────────────────────────
✅ lowercase with hyphens: user-profile/, api-services/
   OR lowercase: components/, services/

CONSTANTS:
─────────────────────────────────────
✅ SCREAMING_SNAKE_CASE: const BASE_URL = '...'

STATE VARIABLES:
─────────────────────────────────────
✅ Descriptive: const [isLoading, setIsLoading] = useState(false)
✅ Boolean prefix: isLoading, hasError, canSubmit
```

---

## Component Design Principles

### Single Responsibility

```jsx
// ❌ BAD: Component does too much
const NewsPage = () => {
  // Fetches data, renders list, handles voting, shows comments...
  // 500+ lines of code
};

// ✅ GOOD: Split into focused components
const NewsPage = () => {
  return (
    <div>
      <NewsFeed />  {/* Fetches and lists news */}
    </div>
  );
};

const NewsFeed = () => {
  return news.map(item => (
    <NewsCard key={item._id} news={item} />  {/* Renders single item */}
  ));
};

const NewsCard = ({ news }) => {
  return (
    <div>
      <VotingButtons news={news} />     {/* Handles voting */}
      <CommentSection newsId={news._id} /> {/* Handles comments */}
    </div>
  );
};
```

### Props Interface

```jsx
// ✅ Document expected props with destructuring
const NewsCard = ({
  news,           // Object: { _id, title, content, ... }
  onVote,         // Function: (newsId, voteType) => void
  showComments = false,  // Boolean with default
}) => {
  // Component logic
};

// ✅ Use descriptive prop names
<Button
  onClick={handleSubmit}  // What happens
  isLoading={loading}     // Current state
  disabled={!isValid}     // Condition
  variant="primary"       // Style variant
>
  Submit
</Button>
```

### Composition Over Prop Drilling

```jsx
// ❌ Prop drilling through many levels
<App user={user}>
  <Layout user={user}>
    <Header user={user}>
      <UserMenu user={user} />
    </Header>
  </Layout>
</App>

// ✅ Use Context for deeply shared data
const UserContext = createContext();

const App = () => {
  const [user, setUser] = useState(null);
  return (
    <UserContext.Provider value={{ user }}>
      <Layout>
        <Header>
          <UserMenu />  {/* Gets user from context */}
        </Header>
      </Layout>
    </UserContext.Provider>
  );
};

const UserMenu = () => {
  const { user } = useContext(UserContext);
  return <span>{user.name}</span>;
};
```

---

## State Management Patterns

### Local vs Global State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  WHEN TO USE WHAT                                                           │
└─────────────────────────────────────────────────────────────────────────────┘

LOCAL STATE (useState):
─────────────────────────────────────
✅ Form input values
✅ UI state (open/closed, loading, hover)
✅ Data fetched for this component only
✅ Temporary values (search query, filter)

CONTEXT (Global State):
─────────────────────────────────────
✅ User authentication (who's logged in)
✅ Theme preference (dark/light mode)
✅ Data needed by many unrelated components
✅ User settings/preferences

DON'T OVERUSE CONTEXT:
─────────────────────────────────────
❌ Don't put everything in global state
❌ Don't use context for form data
❌ Don't store derived data (calculate from source)
```

### Loading States

```jsx
// ✅ GOOD: Track loading, error, and data states
const NewsFeed = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await newsAPI.getAllNews();
        setNews(response.data);
      } catch (err) {
        setError(err.message || 'Failed to fetch news');
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  // Render based on state
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (news.length === 0) return <EmptyState message="No news yet" />;
  
  return news.map(item => <NewsCard key={item._id} news={item} />);
};
```

---

## API Call Patterns

### Centralize API Calls

```jsx
// ✅ GOOD: API calls in service files
// services/api.js
export const newsAPI = {
  getAllNews: () => api.get('/news'),
  getNewsById: (id) => api.get(`/news/${id}`),
  uploadNews: (data) => api.post('/news', data),
  voteNews: (id, voteType) => api.post(`/news/${id}/vote`, { voteType }),
};

// Component uses service
import { newsAPI } from '../services/api';

const NewsFeed = () => {
  const fetchNews = async () => {
    const response = await newsAPI.getAllNews();  // Clean!
    setNews(response.data);
  };
};

// ❌ BAD: Raw axios/fetch in components
const NewsFeed = () => {
  const fetchNews = async () => {
    const response = await axios.get('http://localhost:3000/news', {
      headers: { Authorization: `Bearer ${token}` }
    });
    // Messy! Repeated everywhere!
  };
};
```

### Error Handling Pattern

```jsx
// ✅ GOOD: Consistent error handling
const handleSubmit = async () => {
  try {
    setLoading(true);
    await authAPI.login(credentials);
    toast.success('Login successful!');
    navigate('/home');
  } catch (error) {
    // Extract message from response or use fallback
    const message = error.response?.data?.message 
      || error.message 
      || 'Something went wrong';
    toast.error(message);
  } finally {
    setLoading(false);
  }
};
```

---

## Performance Optimization

### Avoid Unnecessary Re-renders

```jsx
// ❌ BAD: Creates new function every render
<button onClick={() => handleDelete(id)}>Delete</button>

// ✅ BETTER for lists: Use callback with id
const handleDelete = (id) => {
  // delete logic
};
<button onClick={() => handleDelete(id)}>Delete</button>
// This is actually fine in most cases

// ✅ BEST for expensive components: Use useCallback
const handleDelete = useCallback((id) => {
  // delete logic
}, [/* dependencies */]);
```

### Conditional Rendering

```jsx
// ✅ GOOD: Short-circuit evaluation
{loading && <Spinner />}
{error && <ErrorMessage message={error} />}
{data && <DataDisplay data={data} />}

// ✅ GOOD: Ternary for either/or
{isLoggedIn ? <UserMenu /> : <LoginButton />}

// ✅ GOOD: Early return for cleaner code
const NewsCard = ({ news }) => {
  if (!news) return null;  // Guard clause
  
  return (
    <div>
      <h2>{news.title}</h2>
      {news.content}
    </div>
  );
};
```

### Key Prop for Lists

```jsx
// ❌ BAD: Using index as key
{items.map((item, index) => (
  <Item key={index} data={item} />  // Breaks on reorder/delete
))}

// ✅ GOOD: Using unique identifier
{items.map((item) => (
  <Item key={item._id} data={item} />  // Stable identity
))}
```

---

## Form Best Practices

### Controlled Inputs

```jsx
// ✅ GOOD: React controls the input
const [value, setValue] = useState('');
<input 
  value={value} 
  onChange={(e) => setValue(e.target.value)} 
/>

// ❌ BAD: Mix of controlled and uncontrolled
<input 
  value={value}   // Controlled
  // Missing onChange - React warns!
/>
```

### Form Submission

```jsx
// ✅ GOOD: Handle form submission properly
const handleSubmit = (e) => {
  e.preventDefault();  // Always prevent default!
  
  // Validate
  if (!email || !password) {
    toast.error('Please fill all fields');
    return;
  }
  
  // Submit
  submitForm();
};

<form onSubmit={handleSubmit}>
  {/* inputs */}
  <button type="submit">Submit</button>
</form>
```

### Disable During Submission

```jsx
// ✅ Prevent double-submit
<button 
  type="submit" 
  disabled={loading}
  className={loading ? 'opacity-50 cursor-not-allowed' : ''}
>
  {loading ? 'Submitting...' : 'Submit'}
</button>
```

---

## Error Boundaries

```jsx
// Error boundaries catch JavaScript errors in components

// ErrorBoundary.jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Error caught:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}

// Usage in App.jsx
<ErrorBoundary>
  <Routes>
    <Route path="/home" element={<HomePage />} />
  </Routes>
</ErrorBoundary>
```

---

## Clean Code Guidelines

### Comments

```jsx
// ❌ BAD: Obvious comments
const [loading, setLoading] = useState(false); // Set loading to false

// ✅ GOOD: Explain WHY, not WHAT
// Delay to prevent flash of loading state for fast responses
setTimeout(() => setLoading(true), 200);

// ✅ GOOD: Document complex logic
// Calculate credibility score: weighted average of
// expert votes (60%) and community votes (40%)
const score = (expertVotes * 0.6) + (communityVotes * 0.4);
```

### DRY (Don't Repeat Yourself)

```jsx
// ❌ BAD: Repeated code
<button className="bg-blue-500 px-4 py-2 rounded" onClick={handleSave}>Save</button>
<button className="bg-blue-500 px-4 py-2 rounded" onClick={handleSubmit}>Submit</button>

// ✅ GOOD: Extract reusable component
const Button = ({ children, onClick, variant = 'primary' }) => (
  <button 
    className="bg-blue-500 px-4 py-2 rounded"
    onClick={onClick}
  >
    {children}
  </button>
);

<Button onClick={handleSave}>Save</Button>
<Button onClick={handleSubmit}>Submit</Button>
```

### Early Returns

```jsx
// ❌ BAD: Deeply nested
const Component = ({ user, data }) => {
  if (user) {
    if (data) {
      if (data.length > 0) {
        return <DataList data={data} />;
      } else {
        return <EmptyState />;
      }
    } else {
      return <Loading />;
    }
  } else {
    return <LoginPrompt />;
  }
};

// ✅ GOOD: Early returns flatten the code
const Component = ({ user, data }) => {
  if (!user) return <LoginPrompt />;
  if (!data) return <Loading />;
  if (data.length === 0) return <EmptyState />;
  
  return <DataList data={data} />;
};
```

---

## Security Best Practices

### Never Store Sensitive Data in Frontend

```jsx
// ❌ BAD: API keys in frontend code
const API_KEY = 'sk-1234567890';  // Anyone can see this!

// ✅ GOOD: Use environment variables (still visible, but configurable)
const API_URL = import.meta.env.VITE_API_URL;

// ✅ BEST: Keep secrets on backend only
// Frontend calls backend → Backend calls external API with secret
```

### Sanitize User Input

```jsx
// ❌ DANGEROUS: Rendering raw HTML
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ SAFE: React escapes by default
<div>{userInput}</div>  // Safe - HTML is escaped
```

### Validate on Backend Too

```jsx
// ❌ BAD: Frontend-only validation
if (password.length < 6) {
  return toast.error('Password too short');
}
// Malicious users can bypass frontend!

// ✅ GOOD: Validate both frontend AND backend
// Frontend: Better UX with immediate feedback
// Backend: Security - never trust client input
```

---

## Summary Checklist

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  BEFORE SHIPPING CHECKLIST                                                  │
└─────────────────────────────────────────────────────────────────────────────┘

ORGANIZATION:
☐ Components have single responsibility
☐ API calls centralized in services
☐ Consistent file/folder naming
☐ Related code grouped together

STATE MANAGEMENT:
☐ Local state for component-specific data
☐ Context for truly global state
☐ Loading states handled
☐ Error states handled

FORMS:
☐ Controlled inputs
☐ e.preventDefault() on submit
☐ Validation before submission
☐ Submit button disabled during loading

PERFORMANCE:
☐ Unique keys for list items
☐ Avoid unnecessary re-renders
☐ No memory leaks (cleanup in useEffect)

SECURITY:
☐ No secrets in frontend code
☐ Backend validation for all inputs
☐ Proper error messages (no sensitive info)

USER EXPERIENCE:
☐ Loading indicators
☐ Error messages are user-friendly
☐ Success feedback (toasts)
☐ Responsive design tested
```

---

## Interview Questions & Answers

### Q1: What is the difference between props and state?

**Answer:** Props are passed from parent to child and are read-only - the child cannot modify them. State is owned and managed by the component itself - it can be modified using setState/setter functions. Props flow down, state changes trigger re-renders.

### Q2: Why should you centralize API calls?

**Answer:**
1. **DRY**: Avoid repeating URL, headers, error handling
2. **Single source**: Change API once, affects whole app
3. **Easier testing**: Mock one service module
4. **Consistency**: Same error handling everywhere
5. **Maintainability**: Easier to find and update API logic

### Q3: What causes unnecessary re-renders?

**Answer:**
1. Creating new objects/arrays inline: `prop={{ key: value }}`
2. Creating new functions inline: `onClick={() => doThing()}`
3. Parent re-render triggers child re-render
4. Context changes affecting many components

Solutions: `useMemo`, `useCallback`, `React.memo`, proper state placement.

### Q4: How do you handle loading states properly?

**Answer:**
```jsx
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

// In useEffect:
try {
  setLoading(true);
  const result = await fetchData();
  setData(result);
} catch (e) {
  setError(e.message);
} finally {
  setLoading(false);
}

// In render:
if (loading) return <Spinner />;
if (error) return <Error message={error} />;
return <DataDisplay data={data} />;
```

### Q5: What is the purpose of key prop in lists?

**Answer:** Keys help React identify which items changed, were added, or removed. Using stable, unique keys (like `_id`) allows React to efficiently update only changed items. Using array index breaks when items are reordered or deleted, causing bugs and performance issues.

---

## 🎉 Congratulations!

You've completed the VoxVeritas Frontend Documentation! You now understand:

- ✅ React fundamentals (JSX, components, hooks)
- ✅ Project structure and build tools
- ✅ Routing and navigation
- ✅ Global state with Context API
- ✅ API communication with Axios
- ✅ Authentication flows
- ✅ All major components and pages
- ✅ Styling with Tailwind CSS
- ✅ Best practices for production code

**Go back to: [00-README.md](./00-README.md)** for the complete documentation index.
