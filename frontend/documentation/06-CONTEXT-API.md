# 06 - Context API: Global State Management

## What You'll Learn
- What Context API is and why it's needed
- The problem it solves (prop drilling)
- How to create and use contexts
- The UserContext implementation
- Best practices for context usage

---

## The Problem: Prop Drilling

Without Context, you'd pass data through every component level:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PROP DRILLING PROBLEM                                    │
└─────────────────────────────────────────────────────────────────────────────┘

App (has userInfo)
  │
  └── props → Header (needs userInfo to show username)
        │
        └── props → NavBar (needs userInfo)
              │
              └── props → UserAvatar (needs userInfo)

PROBLEM:
- Header doesn't use userInfo, just passes it down
- Every component in the chain needs the prop
- Adding a new prop requires changing ALL components
- Messy, error-prone, hard to maintain
```

---

## The Solution: Context API

Context lets you pass data through the component tree without props:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CONTEXT SOLUTION                                         │
└─────────────────────────────────────────────────────────────────────────────┘

<UserContext.Provider value={userInfo}>
  │
  ├── App
  │     └── Header (can access userInfo directly!)
  │           └── NavBar (can access userInfo directly!)
  │                 └── UserAvatar (can access userInfo directly!)
  │
  └── Footer (can also access userInfo!)

SOLUTION:
- Any component can access context directly
- No prop passing through intermediate components
- Add new data to context, all subscribers get it
- Clean, maintainable
```

---

## Context Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CONTEXT ARCHITECTURE                                     │
└─────────────────────────────────────────────────────────────────────────────┘

1. CREATE CONTEXT
   const UserContext = createContext();

2. CREATE PROVIDER (wraps app, holds state)
   <UserContext.Provider value={{...}}>
     <App />
   </UserContext.Provider>

3. CONSUME IN COMPONENTS
   const { userInfo } = useContext(UserContext);
```

---

## The UserContext Implementation

Let's analyze the actual implementation:

```jsx
// frontend/src/context/userContext.jsx

import { createContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { apiUtils } from "../services/api";

// ═══════════════════════════════════════════════════════════════════════════
// STEP 1: CREATE THE CONTEXT
// ═══════════════════════════════════════════════════════════════════════════
// This creates a Context object
// Components will subscribe to this context
const UserContext = createContext();

// ═══════════════════════════════════════════════════════════════════════════
// STEP 2: CREATE THE PROVIDER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
// This component wraps the app and provides the context value
const UserProvider = ({ children = "" }) => {
  // ─────────────────────────────────────────────────────────────────────────
  // STATE VARIABLES
  // ─────────────────────────────────────────────────────────────────────────
  const [userType, setUserType] = useState("");     // "normal", "community", "expert"
  const [userInfo, setUserInfo] = useState(null);   // Full user object
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);     // True until we check storage

  // ─────────────────────────────────────────────────────────────────────────
  // INITIALIZE FROM LOCALSTORAGE ON APP START
  // ─────────────────────────────────────────────────────────────────────────
  // When app loads, check if user was previously logged in
  useEffect(() => {
    const initializeUser = () => {
      // Get saved data from localStorage
      const token = apiUtils.getAuthToken();
      const savedUserInfo = apiUtils.getUserInfo();
      const savedUserType = apiUtils.getUserType();

      // If all exist, restore the session
      if (token && savedUserInfo && savedUserType) {
        setUserType(savedUserType);
        setUserInfo(savedUserInfo);
        setIsAuthenticated(true);
      }
      
      // Done checking, stop loading
      setLoading(false);
    };

    initializeUser();
  }, []);  // Empty array = run once on mount

  // ─────────────────────────────────────────────────────────────────────────
  // LOGIN FUNCTION
  // ─────────────────────────────────────────────────────────────────────────
  // Called when user successfully logs in
  const login = (userData, token) => {
    // Special handling for guest login
    if (userData.userType === 'guest') {
      setUserType('guest');
      setUserInfo({ 
        name: 'Guest User',
        email: 'guest@example.com',
        userType: 'guest'
      });
      setIsAuthenticated(true);
      // Don't store guest session in localStorage
      return;
    }
    
    // Regular login: save to localStorage and state
    apiUtils.setAuthToken(token);
    apiUtils.setUserInfo(userData);
    setUserType(userData.userType);
    setUserInfo(userData);
    setIsAuthenticated(true);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // LOGOUT FUNCTION
  // ─────────────────────────────────────────────────────────────────────────
  // Called when user logs out
  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('userType');
    
    // Clear state
    setUserType("");
    setUserInfo(null);
    setIsAuthenticated(false);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // UPDATE USER INFO FUNCTION
  // ─────────────────────────────────────────────────────────────────────────
  // For updating profile info without full re-login
  const updateUserInfo = (newUserInfo) => {
    const updatedInfo = { ...userInfo, ...newUserInfo };
    setUserInfo(updatedInfo);
    apiUtils.setUserInfo(updatedInfo);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // CONTEXT VALUE
  // ─────────────────────────────────────────────────────────────────────────
  // Everything we want to share with consuming components
  const contextValue = {
    // State
    userType,
    userInfo,
    isAuthenticated,
    loading,
    
    // Functions
    setUserType,
    setUserInfo: updateUserInfo,
    login,
    logout,
    updateUserInfo,
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER PROVIDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

// PropTypes for TypeScript-like checking
UserProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// Export both for use
export { UserContext, UserProvider };
```

---

## Using Context in Components

### Step 1: Wrap App with Provider

```jsx
// main.jsx
import { UserProvider } from "./context/userContext";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <UserProvider>    {/* Wrap everything */}
      <App />
    </UserProvider>
  </StrictMode>,
)
```

### Step 2: Consume in Any Component

```jsx
// Any component anywhere in the tree
import { useContext } from 'react';
import { UserContext } from '../context/userContext';

function Header() {
  // Access context values
  const { userInfo, isAuthenticated, logout } = useContext(UserContext);
  
  return (
    <header>
      {isAuthenticated ? (
        <>
          <span>Welcome, {userInfo.name}!</span>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <a href="/login">Login</a>
      )}
    </header>
  );
}
```

---

## Real Examples from the Codebase

### Example 1: LoginForm Uses login()

```jsx
// pages/LoginForm.jsx

import { useContext } from "react";
import { UserContext } from "../context/userContext";

const LoginForm = () => {
  const { login } = useContext(UserContext);  // Get login function
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await authAPI.login(userType, credentials);
      
      // Use context's login function
      login({
        ...response.user,
        userType: formData.userType
      }, response.token);
      
      navigate("/home");
    } catch (error) {
      toast.error("Login failed!");
    }
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
};
```

### Example 2: ProtectedRoute Checks isAuthenticated

```jsx
// components/ProtectedRoute.jsx

import { useContext } from 'react';
import { UserContext } from '../context/userContext';

const ProtectedRoute = ({ children, allowedUserTypes = [] }) => {
  // Get auth state from context
  const { isAuthenticated, userType, loading } = useContext(UserContext);
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (allowedUserTypes.length > 0 && !allowedUserTypes.includes(userType)) {
    return <AccessDenied />;
  }
  
  return children;
};
```

### Example 3: CommentSection Checks userType

```jsx
// components/CommentSection.jsx

import { useContext } from "react";
import { UserContext } from "../context/userContext";

const CommentSection = ({ newsId }) => {
  const { userType, isAuthenticated } = useContext(UserContext);

  const handleAddComment = async () => {
    // Check permissions
    if (!isAuthenticated || userType === 'guest') {
      toast.error("Please login to comment");
      return;
    }

    if (userType !== 'community' && userType !== 'expert') {
      toast.error("Only community and expert users can comment");
      return;
    }

    // Add comment...
  };
  
  return <div>...</div>;
};
```

### Example 4: NewsFeed Checks Permissions for Voting

```jsx
// components/NewsFeed.jsx

import { useContext } from "react";
import { UserContext } from "../context/userContext";

const NewsFeed = () => {
  const { isAuthenticated, userType } = useContext(UserContext);

  const handleVote = async (postId, voteType) => {
    if (!isAuthenticated || userType === 'guest') {
      toast.error(
        userType === 'guest' 
          ? "Guests cannot vote. Please create an account." 
          : "Please login to vote"
      );
      return;
    }

    // Proceed with vote...
  };
  
  return <div>...</div>;
};
```

---

## Context Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    USER CONTEXT DATA FLOW                                   │
└─────────────────────────────────────────────────────────────────────────────┘

                    UserProvider (holds state)
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
    LoginForm          Header          CommentSection
    uses: login()    uses: userInfo   uses: userType
                     uses: logout()   uses: isAuthenticated

    ┌──────────┐
    │  Login   │ ─────────────────────────────────────────┐
    │  Button  │                                          │
    └──────────┘                                          │
          │                                               │
          │ User submits login                            │
          ▼                                               ▼
    ┌──────────────────────┐                    ┌──────────────────────┐
    │ authAPI.login()      │                    │ login(userData,      │
    │ returns user + token │  ───────────────▶  │       token)         │
    └──────────────────────┘                    └──────────────────────┘
                                                          │
                                                          │ Updates state
                                                          ▼
                                       ┌────────────────────────────────────┐
                                       │ All components using context       │
                                       │ automatically re-render with       │
                                       │ new isAuthenticated = true         │
                                       └────────────────────────────────────┘
```

---

## LocalStorage Persistence

The context syncs with localStorage for persistence across page refreshes:

```jsx
// ═══════════════════════════════════════════════════════════════════════════
// ON APP START - Check localStorage
// ═══════════════════════════════════════════════════════════════════════════

useEffect(() => {
  const token = apiUtils.getAuthToken();      // localStorage.getItem('authToken')
  const savedUserInfo = apiUtils.getUserInfo(); // localStorage.getItem('userInfo')
  
  if (token && savedUserInfo) {
    // Restore session
    setIsAuthenticated(true);
    setUserInfo(savedUserInfo);
  }
}, []);

// ═══════════════════════════════════════════════════════════════════════════
// ON LOGIN - Save to localStorage
// ═══════════════════════════════════════════════════════════════════════════

const login = (userData, token) => {
  apiUtils.setAuthToken(token);   // localStorage.setItem('authToken', token)
  apiUtils.setUserInfo(userData); // localStorage.setItem('userInfo', JSON.stringify(userData))
  // Update state...
};

// ═══════════════════════════════════════════════════════════════════════════
// ON LOGOUT - Clear localStorage
// ═══════════════════════════════════════════════════════════════════════════

const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userInfo');
  localStorage.removeItem('userType');
  // Clear state...
};
```

---

## Best Practices

### 1. Keep Context Focused

```jsx
// ✅ GOOD - Focused context
const UserContext = createContext();  // Only user auth stuff
const ThemeContext = createContext(); // Only theme stuff

// ❌ BAD - Everything in one context
const AppContext = createContext();  // user, theme, settings, cart...
```

### 2. Memoize Context Value (for performance)

```jsx
import { useMemo } from 'react';

const UserProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState(null);
  
  // Memoize to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    userInfo,
    setUserInfo,
    login,
    logout,
  }), [userInfo]);  // Only recreate when userInfo changes
  
  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};
```

### 3. Create Custom Hook for Cleaner Usage

```jsx
// In userContext.jsx, add:
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

// In components:
import { useUser } from '../context/userContext';

function MyComponent() {
  const { userInfo, login } = useUser();  // Cleaner!
}
```

---

## Interview Questions & Answers

### Q1: What problem does Context API solve?

**Answer:** Context API solves "prop drilling" - the need to pass props through many component levels just to reach a deeply nested component. Instead of passing props through every intermediate component, any component can access context values directly.

### Q2: When should you use Context vs props?

**Answer:**
- **Props**: For data that only one or two levels need
- **Context**: For truly global data (auth, theme, language) that many components need

Overusing context can make components less reusable and harder to test.

### Q3: Why store auth data in both context and localStorage?

**Answer:**
- **Context**: For React components to reactively update when auth changes
- **localStorage**: For persistence across page refreshes (React state is lost on refresh)

On app start, we restore context from localStorage. This gives us both reactivity and persistence.

### Q4: What happens when context value changes?

**Answer:** All components that use `useContext(SomeContext)` will re-render with the new value. This is why it's important to:
- Split contexts by concern
- Memoize context values when appropriate
- Not put rapidly changing values in context

---

## Summary

| Concept | Purpose |
|---------|---------|
| **createContext()** | Create a context object |
| **Provider** | Component that provides context value |
| **useContext()** | Hook to consume context in components |
| **UserContext** | Stores auth state (userInfo, isAuthenticated) |
| **login()** | Function to set auth state |
| **logout()** | Function to clear auth state |
| **localStorage** | Persist auth across page refreshes |

---

**Next: [07-AXIOS-AND-API-SERVICES.md](./07-AXIOS-AND-API-SERVICES.md)** - HTTP requests and API layer →
