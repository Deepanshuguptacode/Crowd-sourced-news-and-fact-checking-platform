# 05 — React Router: Single Page Application Navigation Deep-Dive

## Table of Contents
1. [The Problem: Traditional Navigation vs SPA](#1-the-problem-traditional-navigation-vs-spa)
2. [What Is React Router?](#2-what-is-react-router)
3. [BrowserRouter — The Foundation](#3-browserrouter--the-foundation)
4. [Routes and Route — URL-to-Component Mapping](#4-routes-and-route--url-to-component-mapping)
5. [Navigation Methods — Link, useNavigate, Navigate](#5-navigation-methods--link-usenavigate-navigate)
6. [URL Parameters — Dynamic Routes](#6-url-parameters--dynamic-routes)
7. [The ProtectedRoute Component — Authentication Guard](#7-the-protectedroute-component--authentication-guard)
8. [useLocation — Accessing Current URL Info](#8-uselocation--accessing-current-url-info)
9. [The Complete Routing Flow in VoxVeritas](#9-the-complete-routing-flow-in-voxveritas)
10. [Interview Q&A](#10-interview-qa)

---

## 1. The Problem: Traditional Navigation vs SPA

### 1.1 — How Traditional Websites Work

In a traditional multi-page website, every link click triggers a **full page reload**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  TRADITIONAL NAVIGATION (Multi-Page Application)                            │
└─────────────────────────────────────────────────────────────────────────────┘

  User clicks "About Us" link
       │
       ▼
  Browser sends HTTP request: GET /about.html
       │
       ▼
  Server returns about.html (entire new HTML document)
       │
       ▼
  Browser destroys current page completely
       │
       ▼
  Browser parses new HTML, loads new CSS, loads new JavaScript
       │
       ▼
  User sees a white flash, then the new page loads

  PROBLEMS:
  • Full page reload for every navigation (500ms-2s delay)
  • White flash between pages (jarring user experience)
  • All JavaScript state lost (form data, scroll position)
  • Redundant data transfer (header/footer HTML sent again)
```

### 1.2 — How SPA Navigation Works

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SPA NAVIGATION (Single Page Application — what VoxVeritas uses)            │
└─────────────────────────────────────────────────────────────────────────────┘

  User clicks "Home" link
       │
       ▼
  JavaScript intercepts the click (prevents full page load)
       │
       ▼
  URL bar updates to /home (using History API)
       │
       ▼
  React Router checks the new URL against route definitions
       │
       ▼
  Matching component (HomePage) renders in place of the old one
       │
       ▼
  Only the changed portion of the page updates

  BENEFITS:
  • Instant navigation (no server roundtrip)
  • No white flash (smooth transitions)
  • State preserved (Header stays, scroll position kept)
  • Less data transfer (only fetch actual data via API calls)
```

---

## 2. What Is React Router?

**React Router** is a library that enables client-side routing in React applications. VoxVeritas uses version **7.2.0** (`react-router-dom`).

The `react-router-dom` package (the "dom" suffix means it's for web browsers) provides components and hooks for:
- Defining routes (URL → Component mappings)
- Navigating between routes (without page reloads)
- Reading URL parameters
- Protecting routes (requiring authentication)
- Redirecting users

### 2.1 — Key Exports Used in VoxVeritas

```jsx
import {
  BrowserRouter,    // Main router — wraps entire app, uses browser's History API
  Routes,           // Container for Route definitions — renders first matching Route
  Route,            // A single URL → Component mapping
  Navigate,         // Component that redirects to a different URL on render
  Link,             // <a> replacement that navigates without page reload
  useNavigate,      // Hook that returns a navigation function
  useParams,        // Hook to read URL parameters (e.g., :roomId)
  useLocation,      // Hook to access current URL info
} from 'react-router-dom';
```

---

## 3. BrowserRouter — The Foundation

### 3.1 — Theory

`BrowserRouter` (aliased as `Router` in VoxVeritas) uses the browser's **History API** (`window.history.pushState`) to change the URL without triggering a page reload.

### 3.2 — Where It Lives

```jsx
// In App.jsx
import { BrowserRouter as Router } from 'react-router-dom';

function App() {
  return (
    <Router>          {/* Everything inside can use routing features */}
      <Routes>
        {/* Route definitions */}
      </Routes>
    </Router>
  );
}
```

**Rule:** There must be exactly ONE `BrowserRouter` wrapping any components that use routing features. In VoxVeritas, it's in `App.jsx`, wrapping all routes.

---

## 4. Routes and Route — URL-to-Component Mapping

### 4.1 — Theory

- `<Routes>` is a container that evaluates all child `<Route>` elements and renders **only the first one** that matches the current URL.
- `<Route>` defines a single mapping: "When the URL matches this `path`, render this `element`."

### 4.2 — Three Types of Routes in VoxVeritas

```jsx
// ═══════════════════════════════════════════════════════════════════════════
// TYPE 1: STATIC PUBLIC ROUTES
// ═══════════════════════════════════════════════════════════════════════════
// URL is exact, no auth required

<Route path="/" element={<LandingPage />} />
//     ───────              ────────────
//     URL to match         Component to render

<Route path="/login" element={<LoginForm />} />
<Route path="/signup" element={<SignupForm />} />

// ═══════════════════════════════════════════════════════════════════════════
// TYPE 2: PROTECTED ROUTES
// ═══════════════════════════════════════════════════════════════════════════
// Wrapped in ProtectedRoute — must be authenticated

<Route path="/home" element={
  <ProtectedRoute>              {/* Checks: is user logged in? */}
    <HomePage />                {/* Only renders if authenticated */}
  </ProtectedRoute>
} />

// With role restriction:
<Route path="/submit-news" element={
  <ProtectedRoute allowedUserTypes={['normal', 'community', 'expert', 'admin']}>
    <NewsSubmissionForm />
  </ProtectedRoute>
} />

// ═══════════════════════════════════════════════════════════════════════════
// TYPE 3: DYNAMIC ROUTES (URL contains a variable)
// ═══════════════════════════════════════════════════════════════════════════
// :roomId is a placeholder that matches any value

<Route path="/debate-room/:roomId" element={
  <ProtectedRoute>
    <DebateRoom />
  </ProtectedRoute>
} />
// /debate-room/abc123 → matches, roomId = "abc123"
// /debate-room/xyz789 → matches, roomId = "xyz789"

// ═══════════════════════════════════════════════════════════════════════════
// CATCH-ALL ROUTE (wildcard)
// ═══════════════════════════════════════════════════════════════════════════
<Route path="*" element={<Navigate to="/" />} />
// Any URL that doesn't match above routes → redirect to landing page
```

---

## 5. Navigation Methods — Link, useNavigate, Navigate

### 5.1 — Method 1: `<Link>` — Declarative Navigation (In JSX)

```jsx
import { Link } from 'react-router-dom';

// Instead of <a href="/login"> which would cause a full page reload:
<Link to="/login">Sign In</Link>

// Link renders an <a> tag but intercepts the click,
// uses History API to change URL, and React Router renders the new route.
```

### 5.2 — Method 2: `useNavigate()` — Programmatic Navigation (In Handlers)

```jsx
import { useNavigate } from 'react-router-dom';

const LoginForm = () => {
  const navigate = useNavigate();  // Returns a navigation function

  const handleSubmit = async () => {
    const response = await authAPI.login(userType, credentials);
    if (response.token) {
      login(response.user, response.token);
      navigate("/home");  // Programmatically redirect after login
    }
  };

  const handleGuestLogin = () => {
    login({ userType: 'guest' });
    navigate("/home");  // Redirect guest to home page
  };

  return (
    <button onClick={() => navigate(-1)}>Go Back</button>
    // navigate(-1) = go back one page in history
    // navigate(1) = go forward one page
  );
};
```

**When to use which:**
- `<Link>` — For navigation the user triggers by clicking a visible link/button in JSX
- `useNavigate()` — For navigation triggered by code logic (after form submission, after API call, on error)

### 5.3 — Method 3: `<Navigate>` — Component-Level Redirect

```jsx
import { Navigate } from 'react-router-dom';

// Renders nothing visible — immediately redirects
// Used in ProtectedRoute:
if (!isAuthenticated) {
  return <Navigate to="/login" state={{ from: location }} replace />;
}
// "replace" means the redirect won't be added to browser history
// (pressing Back won't return to the protected page)

// state={{ from: location }} passes the original URL so that after login,
// the user can be redirected back to where they were trying to go
```

---

## 6. URL Parameters — Dynamic Routes

### 6.1 — Theory

URL parameters let you create routes where part of the URL is a **variable**. This is how VoxVeritas renders different debate rooms using a single component.

### 6.2 — Defining Dynamic Routes

```jsx
// In App.jsx:
<Route path="/debate-room/:roomId" element={<DebateRoom />} />
//                         ───────
//                         Parameter name (prefixed with :)
```

### 6.3 — Reading URL Parameters with `useParams()`

```jsx
// In DebateRoom.jsx:
import { useParams } from 'react-router-dom';

const DebateRoom = () => {
  const { roomId } = useParams();
  // If URL is /debate-room/abc123, then roomId = "abc123"
  // If URL is /debate-room/xyz789, then roomId = "xyz789"

  useEffect(() => {
    fetchDebateRoom(roomId);  // Use the parameter to fetch data
  }, [roomId]);               // Re-fetch if roomId changes

  return <h1>Debate Room: {roomId}</h1>;
};
```

---

## 7. The ProtectedRoute Component — Authentication Guard

### 7.1 — Theory: Why Protected Routes?

Some pages should only be visible to logged-in users. Without route protection, anyone could type `/home` in the URL bar and see the news feed, even without authentication.

### 7.2 — The Journey Before the Code

ProtectedRoute needs to:
1. Check if the user is authenticated (from UserContext)
2. If authentication state is still loading → show a spinner
3. If NOT authenticated → redirect to `/login`
4. If authenticated but wrong user type → show "Access Denied"
5. If all checks pass → render the child component

### 7.3 — The Actual Code (from `ProtectedRoute.jsx`)

```jsx
import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { UserContext } from '../context/userContext';

const ProtectedRoute = ({ children, allowedUserTypes = [] }) => {
  // ─── Step 1: Get auth state from Context ───
  const { isAuthenticated, userType, loading } = useContext(UserContext);
  const location = useLocation();  // Current URL (for redirect-back feature)

  // ─── Step 2: Still loading? Show spinner ───
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500">
        </div>
      </div>
    );
  }

  // ─── Step 3: Not authenticated? Redirect to login ───
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
    // state={{ from: location }} — saves where they were trying to go
    // After login, we could redirect them back (not implemented yet)
  }

  // ─── Step 4: Check user type if specific types are required ───
  if (allowedUserTypes.length > 0 && !allowedUserTypes.includes(userType)) {
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
          <p className="text-sm text-gray-400">Your role: {userType}</p>
        </div>
      </div>
    );
  }

  // ─── Step 5: All checks passed — render the child component ───
  return children;
};
```

### 7.4 — How It's Used

```jsx
// Any authenticated user:
<ProtectedRoute>
  <HomePage />
</ProtectedRoute>
// allowedUserTypes defaults to [] (empty) → no type restriction

// Only specific user types:
<ProtectedRoute allowedUserTypes={['community', 'expert', 'admin']}>
  <NewsSubmissionForm />
</ProtectedRoute>
// allowedUserTypes.includes(userType) must be true
```

### 7.5 — The Decision Tree

```
User visits /home
      │
      ▼
ProtectedRoute renders
      │
      ├── loading === true?
      │     └── YES → Show spinning loader
      │
      ├── isAuthenticated === false?
      │     └── YES → <Navigate to="/login" />
      │
      ├── allowedUserTypes specified AND userType NOT in list?
      │     └── YES → Show "Access Denied" message
      │
      └── All checks passed → Render <HomePage />
```

---

## 8. useLocation — Accessing Current URL Info

### 8.1 — What It Returns

```jsx
const location = useLocation();
// location = {
//   pathname: "/debate-room/abc123",   // The URL path
//   search: "?tab=comments",           // Query string
//   hash: "#section-2",                // URL hash
//   state: { from: "/home" },          // Data passed via navigate()
//   key: "default"                     // Unique key for this location
// }
```

### 8.2 — Used in ProtectedRoute

```jsx
const location = useLocation();

// When redirecting to login, pass the current location:
<Navigate to="/login" state={{ from: location }} replace />

// After login, the login form could read:
const location = useLocation();
const from = location.state?.from?.pathname || "/home";
navigate(from);  // Go back to where the user was trying to go
```

---

## 9. The Complete Routing Flow in VoxVeritas

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  USER TYPES & ACCESSIBLE ROUTES                                             │
└─────────────────────────────────────────────────────────────────────────────┘

  UNAUTHENTICATED USER:
  ─────────────────────
  Can access:  /, /login, /signup, /admin/login, /admin/signup
  All other URLs → Redirected to /login

  GUEST (userType = "guest"):
  ──────────────────────────
  Can access:  /home, /profile, /trending, /experts, /debate-rooms
  Can view: News feed, trending page
  Cannot: Vote, comment, submit news

  NORMAL / ONLOOKER (userType = "normal"):
  ────────────────────────────────────────
  Can access:  /home, /profile, /trending, /experts, /submit-news
  Can view: Everything
  Cannot: Comment, but some routes allow submission

  COMMUNITY (userType = "community"):
  ──────────────────────────────────
  Can access:  All protected routes
  Can do: Submit news, vote, comment, join debate rooms

  EXPERT (userType = "expert"):
  ────────────────────────────
  Can access:  All protected routes
  Can do: Everything community can + expert verdicts, AI generation

  ADMIN (userType = "admin"):
  ──────────────────────────
  Can access:  All routes including /admin/*
  Can do: Everything + delete any content, manage users
```

---

## 10. Interview Q&A

**Q: What is the difference between `<Link>` and `<a href>`?**
A: `<a href>` triggers a full page reload — the browser fetches a new HTML document from the server. `<Link>` uses the History API to change the URL without reloading, and React Router renders the matching component. State, scroll position, and running JavaScript are preserved.

**Q: What happens if two Routes have the same path?**
A: `<Routes>` renders only the **first** matching Route. Order matters in route definitions.

**Q: Why does ProtectedRoute check `loading` before `isAuthenticated`?**
A: On app startup, `UserProvider` reads localStorage to restore the session. During this read, `loading` is true and `isAuthenticated` is false (default). Without the loading check, the user would briefly see a redirect to login before the session is restored. The spinner prevents this flash.

**Q: What does the `replace` prop on `<Navigate>` do?**
A: Without `replace`, the redirect is pushed onto the browser history stack. With `replace`, it replaces the current entry. So pressing the Back button skips the protected page entry. Without it, hitting Back would loop: protected page → login → protected page → login...

---

**Next → [06-CONTEXT-API.md](./06-CONTEXT-API.md)** — The prop drilling problem and VoxVeritas's global state solution.
