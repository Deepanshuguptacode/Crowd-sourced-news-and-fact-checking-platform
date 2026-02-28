# 06 — Context API: Global State Management Deep-Dive

## Table of Contents
1. [The Problem: Prop Drilling](#1-the-problem-prop-drilling)
2. [What Is Context?](#2-what-is-context)
3. [The Three Steps of Context](#3-the-three-steps-of-context)
4. [VoxVeritas UserContext — Complete Walkthrough](#4-voxveritas-usercontext--complete-walkthrough)
5. [How Components Consume Context](#5-how-components-consume-context)
6. [The Provider Pattern](#6-the-provider-pattern)
7. [Context vs Props — When to Use Which](#7-context-vs-props--when-to-use-which)
8. [Interview Q&A](#8-interview-qa)

---

## 1. The Problem: Prop Drilling

### 1.1 — What Is Prop Drilling?

When multiple nested components need the same data, you must pass it through every intermediate component as props — even if those intermediate components don't use the data themselves:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PROP DRILLING PROBLEM                                                      │
└─────────────────────────────────────────────────────────────────────────────┘

  App (has user data)
    │
    └── passes user ──▶ Layout (doesn't use user — just forwards it)
                          │
                          └── passes user ──▶ Header (doesn't use user)
                                                │
                                                └── passes user ──▶ UserMenu (actually needs user!)

  // App.jsx
  <Layout user={user} />           ← Passing through

  // Layout.jsx
  <Header user={props.user} />     ← Passing through (Layout doesn't even use user!)

  // Header.jsx
  <UserMenu user={props.user} />   ← Passing through

  // UserMenu.jsx
  <p>{props.user.name}</p>         ← Finally used!
```

This is bad because:
- Intermediate components are cluttered with props they don't use
- Adding a new piece of shared data means editing every component in the chain
- Hard to maintain and refactor

### 1.2 — The Solution: Context

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CONTEXT SOLUTION                                                           │
└─────────────────────────────────────────────────────────────────────────────┘

  UserProvider (wraps everything, holds user data)
    │
    ├── Layout (no props needed)
    │     │
    │     └── Header (no props needed)
    │           │
    │           └── UserMenu ──▶ useContext(UserContext) → gets user directly!
    │
    ├── ProtectedRoute ──▶ useContext(UserContext) → gets isAuthenticated
    │
    └── NewsCard ──▶ useContext(UserContext) → gets userType

  ANY component, at ANY nesting level, can access the data directly.
  No props passed through intermediaries.
```

---

## 2. What Is Context?

React **Context** provides a way to share values between components without explicitly passing props through every level of the tree.

Think of it as a **broadcast system**:
- A **Provider** component broadcasts data
- Any **Consumer** component anywhere in the tree can tune in to receive it

---

## 3. The Three Steps of Context

### Step 1: CREATE the Context

```jsx
import { createContext } from 'react';

export const UserContext = createContext();
// Creates a Context object. This is like creating a radio channel.
// The default value (undefined here) is used if a component reads this
// context but no Provider exists above it in the tree.
```

### Step 2: PROVIDE the Context (wrap components)

```jsx
const UserProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState(null);
  // ... more state and functions

  return (
    <UserContext.Provider value={{ userInfo, setUserInfo }}>
      {children}    {/* All child components can now access this value */}
    </UserContext.Provider>
  );
};
```

### Step 3: CONSUME the Context (read the data)

```jsx
import { useContext } from 'react';
import { UserContext } from '../context/userContext';

const SomeComponent = () => {
  const { userInfo } = useContext(UserContext);
  // Now you have direct access — no props needed!
  return <p>{userInfo?.name}</p>;
};
```

---

## 4. VoxVeritas UserContext — Complete Walkthrough

### 4.1 — The Journey Before the Code

The UserContext is the **single source of truth** for authentication in VoxVeritas. Here is what it must manage:

1. **State**: Who is the current user? What type? Are they authenticated? Is auth still loading?
2. **Persistence**: On page refresh, don't lose the session (use localStorage)
3. **Actions**: Login (save user), Logout (clear everything), Update profile
4. **Broadcasting**: Make all of this available to every component in the app

### 4.2 — Full Annotated Source Code

```jsx
// ═══════════════════════════════════════════════════════════════════════════
// FILE: src/context/userContext.jsx
// PURPOSE: Global authentication state management
// ═══════════════════════════════════════════════════════════════════════════

import { createContext, useState, useEffect } from 'react';
import { apiUtils } from '../services/api';

// ─── Step 1: Create the Context ───────────────────────────────────────────
export const UserContext = createContext();
// This creates a "channel". Components will subscribe to this channel
// using useContext(UserContext).

// ─── Step 2: Create the Provider Component ────────────────────────────────
export const UserProvider = ({ children }) => {
  // children = everything wrapped inside <UserProvider>...</UserProvider>

  // ─── State Definitions ──────────────────────────────────────────────────
  const [userType, setUserType] = useState('');
  // Possible values: '', 'guest', 'normal', 'community', 'expert', 'admin'
  // Empty string = not set yet

  const [userInfo, setUserInfo] = useState(null);
  // The full user object: { _id, username, email, userType, ... }
  // null = no user logged in

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // false = not logged in, true = logged in (including guest)

  const [loading, setLoading] = useState(true);
  // true = still checking localStorage for saved session
  // Important: ProtectedRoute shows a spinner while this is true

  // ─── Initialization: Restore Session on Mount ──────────────────────────
  useEffect(() => {
    // This runs ONCE when the app first loads (empty dependency array)
    const initializeAuth = () => {
      try {
        const savedUserInfo = apiUtils.getCurrentUser();
        // apiUtils.getCurrentUser() reads from localStorage:
        //   JSON.parse(localStorage.getItem('userInfo'))

        const token = localStorage.getItem('token');

        if (savedUserInfo && token) {
          // Found saved session — restore it
          setUserInfo(savedUserInfo);
          setUserType(savedUserInfo.userType || '');
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('userInfo');
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
        // Whether successful or not, stop showing the loading spinner
      }
    };

    initializeAuth();
  }, []);  // [] = run only on mount

  // ─── Login Function ────────────────────────────────────────────────────
  const login = (userData, token) => {
    // Called after successful API login response

    if (userData?.userType === 'guest') {
      // Guest users don't have a real account
      setUserType('guest');
      setUserInfo({ userType: 'guest', username: 'Guest' });
      setIsAuthenticated(true);
      return;  // No token or localStorage for guests
    }

    // Regular user login:
    setUserType(userData.userType || '');
    setUserInfo(userData);
    setIsAuthenticated(true);

    // Persist to localStorage so session survives page refresh:
    if (token) {
      localStorage.setItem('token', token);
    }
    if (userData) {
      localStorage.setItem('userInfo', JSON.stringify(userData));
    }
  };

  // ─── Logout Function ──────────────────────────────────────────────────
  const logout = () => {
    // Clear all state:
    setUserType('');
    setUserInfo(null);
    setIsAuthenticated(false);

    // Clear localStorage:
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
  };

  // ─── Update User Info Function ─────────────────────────────────────────
  const updateUserInfo = (newUserInfo) => {
    setUserInfo(newUserInfo);
    localStorage.setItem('userInfo', JSON.stringify(newUserInfo));
  };

  // ─── The Value Object — everything consumers can access ────────────────
  const contextValue = {
    userType,          // 'guest', 'normal', 'community', 'expert', 'admin'
    userInfo,          // { _id, username, email, userType, ... }
    isAuthenticated,   // true/false
    loading,           // true during initialization
    login,             // function(userData, token)
    logout,            // function()
    updateUserInfo,    // function(newUserInfo)
  };

  // ─── Step 2b: Provide the value to all children ───────────────────────
  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};
```

### 4.3 — Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  APP STARTUP — Session Restoration                                          │
└─────────────────────────────────────────────────────────────────────────────┘

  1. App loads → UserProvider mounts
  2. State initialized: loading=true, isAuthenticated=false
  3. useEffect fires → reads localStorage
  4. Token found? userInfo found?
       │                        │
       ├── YES ──────────────── ├── Set state from saved data
       │                        └── loading = false
       │
       └── NO ── loading = false (nothing to restore)

┌─────────────────────────────────────────────────────────────────────────────┐
│  LOGIN FLOW                                                                 │
└─────────────────────────────────────────────────────────────────────────────┘

  LoginForm calls authAPI.login(credentials)
       │
       ▼
  Server returns { token, user: { _id, username, userType, ... } }
       │
       ▼
  LoginForm calls context.login(user, token)
       │
       ▼
  UserProvider.login():
    • setUserType(user.userType)
    • setUserInfo(user)
    • setIsAuthenticated(true)
    • localStorage.setItem('token', token)
    • localStorage.setItem('userInfo', JSON.stringify(user))
       │
       ▼
  All components using useContext(UserContext) re-render with new data
    • ProtectedRoute → isAuthenticated=true → renders children
    • Header → shows username and logout button
    • NewsCard → enables vote/comment based on userType

┌─────────────────────────────────────────────────────────────────────────────┐
│  LOGOUT FLOW                                                                │
└─────────────────────────────────────────────────────────────────────────────┘

  Header's logout button calls context.logout()
       │
       ▼
  UserProvider.logout():
    • setUserType('')
    • setUserInfo(null)
    • setIsAuthenticated(false)
    • localStorage.removeItem('token')
    • localStorage.removeItem('userInfo')
       │
       ▼
  All consumers re-render:
    • ProtectedRoute → isAuthenticated=false → <Navigate to="/login" />
```

---

## 5. How Components Consume Context

### 5.1 — Pattern Used Everywhere in VoxVeritas

```jsx
import { useContext } from 'react';
import { UserContext } from '../context/userContext';

const AnyComponent = () => {
  // Destructure only what you need from context:
  const { userInfo, userType, isAuthenticated, logout } = useContext(UserContext);

  // Now use it:
  if (!isAuthenticated) return <p>Please log in</p>;

  return (
    <div>
      <p>Welcome, {userInfo.username}!</p>
      <p>Role: {userType}</p>
      <button onClick={logout}>Sign Out</button>
    </div>
  );
};
```

### 5.2 — Components That Consume UserContext

| Component | What It Reads | Why |
|---|---|---|
| `ProtectedRoute` | `isAuthenticated`, `userType`, `loading` | Guard routes |
| `Header` | `userInfo`, `userType`, `logout` | Display name, role, logout button |
| `LoginForm` | `login` | Call login after API success |
| `SignupForm` | `login` | Auto-login after signup |
| `NewsCard` | `userInfo`, `userType` | Check if user can delete/vote |
| `CommentSection` | `userInfo`, `userType`, `isAuthenticated` | Auth check before commenting |
| `NewsFeed` | `userType`, `isAuthenticated` | Check permissions for voting |
| `AIVerdictSection` | `userInfo`, `userType` | Only experts can generate verdicts |
| `DebateRoom` | `userInfo`, `userType` | Check commenting permissions |

---

## 6. The Provider Pattern

### 6.1 — Where UserProvider Wraps the App

```jsx
// In main.jsx:
import { UserProvider } from './context/userContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <UserProvider>      {/* ← Wraps EVERYTHING */}
      <App />           {/* ← App and all its children can use UserContext */}
      <ToastContainer />
    </UserProvider>
  </StrictMode>
);
```

### 6.2 — Why It Must Be Outside App

`App.jsx` contains `<ProtectedRoute>` which calls `useContext(UserContext)`. If `UserProvider` were inside `App`, the routes would try to access context before it's provided. By placing it in `main.jsx` above `App`, every component inside `App` has access to the context.

---

## 7. Context vs Props — When to Use Which

| Scenario | Use Props | Use Context |
|---|---|---|
| Parent passes data to direct child | ✅ | ❌ Overkill |
| Data needed by 2+ levels deep | ❌ Prop drilling | ✅ |
| Data changes rarely (auth, theme) | ❌ | ✅ |
| Data changes frequently (form input) | ✅ | ❌ Performance |
| Shared by many unrelated components | ❌ | ✅ |

**VoxVeritas approach:** Only authentication/user data lives in Context. Everything else (news data, comments, form state) is passed via props or managed locally with `useState`.

---

## 8. Interview Q&A

**Q: What triggers a re-render when context changes?**
A: When the `value` prop of `<Context.Provider>` changes, **every** component that calls `useContext(ThatContext)` re-renders, even if it only uses a portion of the value object.

**Q: How do you avoid unnecessary re-renders with Context?**
A: Split context into multiple smaller contexts (e.g., `AuthContext` for auth, `ThemeContext` for theme). Or use `useMemo` on the value object. VoxVeritas uses a single context since auth data changes infrequently (only on login/logout).

**Q: Why does VoxVeritas store auth in both state and localStorage?**
A: State (`useState`) is for React to reactively update the UI. localStorage is for **persistence** — when the user refreshes the page, React state is lost, but localStorage survives. On mount, the `useEffect` reads localStorage to restore the React state.

**Q: What happens if you call useContext outside a Provider?**
A: You get the default value passed to `createContext()`. In VoxVeritas, `createContext()` was called with no argument, so the default is `undefined`. This would cause errors when trying to destructure properties from `undefined`.

---

**Next → [07-AXIOS-AND-API-SERVICES.md](./07-AXIOS-AND-API-SERVICES.md)** — How VoxVeritas communicates with the backend.
