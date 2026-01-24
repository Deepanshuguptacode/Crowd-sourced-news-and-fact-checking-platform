# 05 - React Router: Navigation and Route Protection

## What You'll Learn
- What React Router is and why it's needed
- How routing works in single-page apps
- Route configuration patterns
- Protected routes for authentication
- Navigation methods (links, programmatic)
- URL parameters and query strings

---

## What is React Router?

React builds **Single-Page Applications (SPAs)**. The browser loads one HTML page, and JavaScript handles all navigation. React Router makes this work:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    TRADITIONAL vs SPA NAVIGATION                            │
└─────────────────────────────────────────────────────────────────────────────┘

TRADITIONAL (Multiple HTML pages):
┌────────────────────────────────────────────────────────────────────┐
│  /home   → Server sends home.html   → Full page load              │
│  /about  → Server sends about.html  → Full page load              │
│  /login  → Server sends login.html  → Full page load              │
└────────────────────────────────────────────────────────────────────┘

SPA (Single HTML page + React Router):
┌────────────────────────────────────────────────────────────────────┐
│  /home   → React shows <HomePage />  → No server request          │
│  /about  → React shows <AboutPage /> → Instant transition         │
│  /login  → React shows <Login />     → State preserved            │
└────────────────────────────────────────────────────────────────────┘
```

---

## Core Concepts

### BrowserRouter

Wraps your app and enables routing:

```jsx
import { BrowserRouter as Router } from 'react-router-dom';

function App() {
  return (
    <Router>
      {/* All routes go inside */}
    </Router>
  );
}
```

### Routes and Route

Define which component shows for which URL:

```jsx
import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        {/*  path="/..."      element={<Component />} */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<HomePage />} />
      </Routes>
    </Router>
  );
}
```

### How Matching Works

```
URL: /home

<Routes>
  <Route path="/" element={<LandingPage />} />    ← No match (exact)
  <Route path="/login" element={<Login />} />     ← No match
  <Route path="/home" element={<HomePage />} />   ← MATCH! Renders this
</Routes>
```

---

## Navigation Methods

### Method 1: Link Component

For declarative navigation (user clicks):

```jsx
import { Link } from 'react-router-dom';

function NavBar() {
  return (
    <nav>
      {/* Like <a> but doesn't reload page */}
      <Link to="/">Home</Link>
      <Link to="/login">Login</Link>
      <Link to="/profile">Profile</Link>
    </nav>
  );
}
```

### Method 2: useNavigate Hook

For programmatic navigation (after form submit, etc.):

```jsx
import { useNavigate } from 'react-router-dom';

function LoginForm() {
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await authAPI.login(credentials);
      
      // Navigate to home after successful login
      navigate('/home');
      
      // Or replace history (can't go back)
      navigate('/home', { replace: true });
      
    } catch (error) {
      toast.error('Login failed');
    }
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Method 3: Navigate Component

For redirects in JSX:

```jsx
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useContext(UserContext);
  
  if (!isAuthenticated) {
    // Redirect to login
    return <Navigate to="/login" replace />;
  }
  
  return children;
}
```

---

## URL Parameters

For dynamic routes like `/debate-room/123`:

```jsx
// ═══════════════════════════════════════════════════════════════════════════
// ROUTE DEFINITION - :roomId is a parameter
// ═══════════════════════════════════════════════════════════════════════════

<Route path="/debate-room/:roomId" element={<DebateRoom />} />

// Matches:
//   /debate-room/123     → roomId = "123"
//   /debate-room/abc456  → roomId = "abc456"
//   /debate-room/        → No match (parameter required)

// ═══════════════════════════════════════════════════════════════════════════
// ACCESSING THE PARAMETER - useParams hook
// ═══════════════════════════════════════════════════════════════════════════

import { useParams } from 'react-router-dom';

function DebateRoom() {
  // Extract roomId from URL
  const { roomId } = useParams();
  
  useEffect(() => {
    // Use roomId to fetch data
    fetchDebateRoom(roomId);
  }, [roomId]);
  
  return <h1>Debate Room: {roomId}</h1>;
}
```

### Multiple Parameters

```jsx
// Route with multiple params
<Route path="/user/:userId/post/:postId" element={<PostDetail />} />

// Component
function PostDetail() {
  const { userId, postId } = useParams();
  // userId and postId available
}
```

---

## Query Strings

For optional parameters like `/search?q=react&page=2`:

```jsx
import { useSearchParams } from 'react-router-dom';

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Read query params
  const query = searchParams.get('q');        // "react"
  const page = searchParams.get('page') || 1; // "2" or default 1
  
  // Update query params
  const handleSearch = (newQuery) => {
    setSearchParams({ q: newQuery, page: 1 });
  };
  
  return (
    <div>
      <p>Searching for: {query}</p>
      <p>Page: {page}</p>
    </div>
  );
}
```

---

## Protected Routes (Authentication)

The `ProtectedRoute` component guards routes that require login:

```jsx
// frontend/src/components/ProtectedRoute.jsx

import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { UserContext } from '../context/userContext';

const ProtectedRoute = ({ children, allowedUserTypes = [] }) => {
  // ═══════════════════════════════════════════════════════════════════════
  // GET AUTH STATE FROM CONTEXT
  // ═══════════════════════════════════════════════════════════════════════
  const { isAuthenticated, userType, loading } = useContext(UserContext);
  const location = useLocation();  // Current URL

  // ═══════════════════════════════════════════════════════════════════════
  // SHOW LOADING WHILE CHECKING AUTH
  // ═══════════════════════════════════════════════════════════════════════
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // REDIRECT TO LOGIN IF NOT AUTHENTICATED
  // ═══════════════════════════════════════════════════════════════════════
  if (!isAuthenticated) {
    // Save attempted location for redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CHECK USER TYPE PERMISSIONS
  // ═══════════════════════════════════════════════════════════════════════
  if (allowedUserTypes.length > 0 && !allowedUserTypes.includes(userType)) {
    // User is logged in but wrong type
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-gray-300">
            You don't have permission to access this page.
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Required: {allowedUserTypes.join(', ')} users
          </p>
          <p className="text-sm text-gray-400">
            Your role: {userType}
          </p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ALL CHECKS PASSED - RENDER THE PAGE
  // ═══════════════════════════════════════════════════════════════════════
  return children;
};

export default ProtectedRoute;
```

### Using ProtectedRoute

```jsx
// Any authenticated user
<Route 
  path="/home" 
  element={
    <ProtectedRoute>
      <HomePage />
    </ProtectedRoute>
  } 
/>

// Only specific user types
<Route 
  path="/submit-news" 
  element={
    <ProtectedRoute allowedUserTypes={['normal', 'community', 'expert']}>
      <NewsSubmissionForm />
    </ProtectedRoute>
  } 
/>
```

### Protection Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PROTECTED ROUTE FLOW                                     │
└─────────────────────────────────────────────────────────────────────────────┘

User navigates to /home
          │
          ▼
┌─────────────────────────┐
│   ProtectedRoute        │
│   checks auth state     │
└─────────────────────────┘
          │
          ├── loading? → Show spinner
          │
          ├── not authenticated? → Redirect to /login
          │
          ├── wrong userType? → Show "Access Denied"
          │
          └── all passed? → Render <HomePage />
```

---

## useLocation Hook

Access current URL information:

```jsx
import { useLocation } from 'react-router-dom';

function CurrentPage() {
  const location = useLocation();
  
  console.log(location.pathname);  // "/home"
  console.log(location.search);    // "?tab=news"
  console.log(location.state);     // { from: previousLocation }
  console.log(location.hash);      // "#section1"
  
  return <p>Current path: {location.pathname}</p>;
}
```

---

## Redirect After Login Pattern

```jsx
// 1. ProtectedRoute saves attempted URL
<Navigate to="/login" state={{ from: location }} replace />

// 2. LoginForm retrieves and redirects back
function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleLogin = async () => {
    await authAPI.login(credentials);
    
    // Get the page they tried to visit, or default to /home
    const from = location.state?.from?.pathname || '/home';
    
    // Redirect back to where they were going
    navigate(from, { replace: true });
  };
}
```

---

## Catch-All Route

Handle unknown URLs:

```jsx
<Routes>
  <Route path="/" element={<LandingPage />} />
  <Route path="/home" element={<HomePage />} />
  {/* ... other routes ... */}
  
  {/* Must be last - catches anything not matched above */}
  <Route path="*" element={<Navigate to="/" replace />} />
  
  {/* Or show a 404 page */}
  <Route path="*" element={<NotFoundPage />} />
</Routes>
```

---

## Navigation with State

Pass data between pages:

```jsx
// Sending state
navigate('/details', { state: { newsItem: selectedNews } });

// Or with Link
<Link to="/details" state={{ newsItem: selectedNews }}>View Details</Link>

// Receiving state
function DetailsPage() {
  const location = useLocation();
  const { newsItem } = location.state || {};
  
  return <h1>{newsItem?.title}</h1>;
}
```

---

## Real Example: Complete Navigation Flow

```jsx
// ═══════════════════════════════════════════════════════════════════════════
// 1. USER CLICKS LOGIN LINK
// ═══════════════════════════════════════════════════════════════════════════
// In some component:
<Link to="/login">Login</Link>

// ═══════════════════════════════════════════════════════════════════════════
// 2. ROUTER MATCHES ROUTE
// ═══════════════════════════════════════════════════════════════════════════
// In App.jsx:
<Route path="/login" element={<Login />} />

// ═══════════════════════════════════════════════════════════════════════════
// 3. LOGIN COMPONENT RENDERS
// ═══════════════════════════════════════════════════════════════════════════
// Login.jsx renders LoginForm:
const Login = () => <div><LoginForm /></div>;

// ═══════════════════════════════════════════════════════════════════════════
// 4. USER SUBMITS FORM
// ═══════════════════════════════════════════════════════════════════════════
// In LoginForm.jsx:
const handleSubmit = async (e) => {
  e.preventDefault();
  const response = await authAPI.login(userType, credentials);
  login(response.user, response.token);  // Update context
  navigate('/home');                      // Navigate to home
};

// ═══════════════════════════════════════════════════════════════════════════
// 5. ROUTER MATCHES /home
// ═══════════════════════════════════════════════════════════════════════════
<Route path="/home" element={
  <ProtectedRoute>
    <HomePage />
  </ProtectedRoute>
} />

// ═══════════════════════════════════════════════════════════════════════════
// 6. PROTECTEDROUTE CHECKS AUTH
// ═══════════════════════════════════════════════════════════════════════════
// isAuthenticated is now true (from context)
// Renders <HomePage />

// ═══════════════════════════════════════════════════════════════════════════
// 7. HOMEPAGE RENDERS
// ═══════════════════════════════════════════════════════════════════════════
// Shows NewsFeed, Header, etc.
```

---

## Interview Questions & Answers

### Q1: Difference between Link and anchor tag `<a>`?

**Answer:**
- `<a href="/page">` causes full page reload, loses React state
- `<Link to="/page">` uses JavaScript navigation, no reload, state preserved

Link prevents the default browser navigation and uses the History API instead.

### Q2: When would you use useNavigate vs Link?

**Answer:**
- **Link**: For declarative navigation (user clicks, shows in UI)
- **useNavigate**: For programmatic navigation (after form submit, conditions, timeouts)

```jsx
// Link - UI element
<Link to="/home">Go Home</Link>

// useNavigate - code-triggered
const onSuccess = () => navigate('/home');
```

### Q3: How do you handle "back to previous page" after login?

**Answer:**
1. Store the attempted URL in route state before redirecting to login
2. After successful login, read the state and navigate there

```jsx
// Before redirect
<Navigate to="/login" state={{ from: location }} />

// After login
const from = location.state?.from?.pathname || '/home';
navigate(from, { replace: true });
```

### Q4: What's the difference between `replace` and regular navigation?

**Answer:**
- Regular: Adds to history stack (back button goes to previous)
- Replace: Replaces current entry (back button skips this page)

Use `replace: true` for:
- Login redirects (shouldn't go back to login after logging in)
- Form submission confirmations
- Any flow where going "back" doesn't make sense

---

## Summary

| Concept | Purpose |
|---------|---------|
| **BrowserRouter** | Enables routing in app |
| **Routes/Route** | Define URL → Component mapping |
| **Link** | Declarative navigation (clicking) |
| **useNavigate** | Programmatic navigation (code) |
| **Navigate** | Redirect component |
| **useParams** | Access URL parameters (`:id`) |
| **useLocation** | Access current URL info |
| **ProtectedRoute** | Guard routes requiring auth |

---

**Next: [06-CONTEXT-API.md](./06-CONTEXT-API.md)** - Global state management with Context →
