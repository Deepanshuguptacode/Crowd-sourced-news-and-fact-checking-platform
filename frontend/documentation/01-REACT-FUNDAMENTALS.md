# 01 - React Fundamentals: Building Blocks of the Frontend

## What You'll Learn
- What React is and why it's used
- JSX syntax explained
- Components: the building blocks
- Props: passing data to components
- State: making components interactive
- Hooks: useState, useEffect, useContext

---

## What is React?

**React** is a JavaScript library for building user interfaces. Instead of manipulating the DOM directly (like with vanilla JavaScript), React lets you describe what the UI should look like, and it efficiently updates the page.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    TRADITIONAL vs REACT APPROACH                            │
└─────────────────────────────────────────────────────────────────────────────┘

TRADITIONAL (Vanilla JavaScript):
┌────────────────────────────────────────────────────────────────────┐
│  Developer manually:                                                │
│  1. document.getElementById('element')                             │
│  2. element.innerHTML = 'New Content'                              │
│  3. Repeat for every change                                        │
│  4. Track all DOM nodes manually                                   │
└────────────────────────────────────────────────────────────────────┘

REACT (Declarative):
┌────────────────────────────────────────────────────────────────────┐
│  Developer describes:                                               │
│  1. "Here's what the UI should look like"                          │
│  2. React figures out what changed                                 │
│  3. React updates only what's necessary                            │
│  4. You never touch the DOM directly                               │
└────────────────────────────────────────────────────────────────────┘
```

### Why Use React?

| Feature | Benefit |
|---------|---------|
| **Component-Based** | Build encapsulated pieces, compose them together |
| **Declarative** | Describe what you want, not how to do it |
| **Virtual DOM** | Fast updates, React calculates minimal changes |
| **One-Way Data Flow** | Predictable, easier to debug |
| **Large Ecosystem** | Tons of libraries and community support |

---

## JSX: JavaScript + HTML

**JSX** (JavaScript XML) lets you write HTML-like syntax inside JavaScript. It's not actually HTML—it gets converted to JavaScript function calls.

### Basic JSX Example

```jsx
// This is JSX:
const element = <h1>Hello, World!</h1>;

// React converts it to:
const element = React.createElement('h1', null, 'Hello, World!');
```

### JSX Rules

```jsx
// ═══════════════════════════════════════════════════════════════════════════
// RULE 1: Must return ONE parent element
// ═══════════════════════════════════════════════════════════════════════════

// ❌ WRONG - Two elements at root level
return (
  <h1>Title</h1>
  <p>Paragraph</p>
);

// ✅ CORRECT - Wrapped in a parent
return (
  <div>
    <h1>Title</h1>
    <p>Paragraph</p>
  </div>
);

// ✅ ALSO CORRECT - Use Fragment (no extra DOM element)
return (
  <>
    <h1>Title</h1>
    <p>Paragraph</p>
  </>
);

// ═══════════════════════════════════════════════════════════════════════════
// RULE 2: Use className instead of class
// ═══════════════════════════════════════════════════════════════════════════

// ❌ WRONG - HTML class attribute
<div class="container">Content</div>

// ✅ CORRECT - React uses className
<div className="container">Content</div>

// WHY? "class" is a reserved word in JavaScript

// ═══════════════════════════════════════════════════════════════════════════
// RULE 3: All tags must be closed
// ═══════════════════════════════════════════════════════════════════════════

// ❌ WRONG - Unclosed tag
<img src="photo.jpg">
<input type="text">
<br>

// ✅ CORRECT - Self-closing tags
<img src="photo.jpg" />
<input type="text" />
<br />

// ═══════════════════════════════════════════════════════════════════════════
// RULE 4: JavaScript expressions use curly braces
// ═══════════════════════════════════════════════════════════════════════════

const name = "John";
const isLoggedIn = true;

return (
  <div>
    {/* Variable */}
    <h1>Hello, {name}!</h1>
    
    {/* Expression */}
    <p>2 + 2 = {2 + 2}</p>
    
    {/* Conditional */}
    <p>{isLoggedIn ? "Welcome back!" : "Please login"}</p>
    
    {/* Function call */}
    <p>Uppercase: {name.toUpperCase()}</p>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// RULE 5: Comments in JSX
// ═══════════════════════════════════════════════════════════════════════════

return (
  <div>
    {/* This is a JSX comment */}
    <p>Content</p>
  </div>
);
```

---

## Components: The Building Blocks

A **component** is a reusable piece of UI. Think of it like a custom HTML tag that you define.

### Function Components

Modern React uses **function components** (not class components):

```jsx
// ═══════════════════════════════════════════════════════════════════════════
// BASIC COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

// A component is just a function that returns JSX
function Greeting() {
  return <h1>Hello, World!</h1>;
}

// Arrow function syntax (common in this codebase)
const Greeting = () => {
  return <h1>Hello, World!</h1>;
};

// Using the component (like a custom HTML tag)
function App() {
  return (
    <div>
      <Greeting />
      <Greeting />  {/* Reusable! */}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT NAMING RULES
// ═══════════════════════════════════════════════════════════════════════════

// ✅ CORRECT - PascalCase (starts with capital)
const MyComponent = () => { ... };
const NewsCard = () => { ... };
const UserProfile = () => { ... };

// ❌ WRONG - lowercase (React thinks it's HTML)
const myComponent = () => { ... };
const newscard = () => { ... };
```

### Real Example from Codebase

```jsx
// From: frontend/src/components/Login.jsx

import React from "react";
import LoginForm from "../pages/LoginForm";  // Import another component

// Simple component that wraps LoginForm
const Login = () => {
  return (
    <div>
      <LoginForm />  {/* Use imported component */}
    </div>
  );
};

export default Login;  // Make available to other files

// ═══════════════════════════════════════════════════════════════════════════
// LINE-BY-LINE BREAKDOWN:
// ═══════════════════════════════════════════════════════════════════════════
// Line 1: import React - Get React library
// Line 2: import LoginForm - Get the LoginForm component from pages folder
// Line 4: const Login = () => {...} - Define a function component named Login
// Line 5-7: return (...) - Return JSX to render
// Line 6: <LoginForm /> - Render the imported LoginForm component
// Line 10: export default Login - Allow other files to import this component
```

---

## Props: Passing Data to Components

**Props** (properties) are how you pass data from a parent component to a child component. They're like function arguments.

```jsx
// ═══════════════════════════════════════════════════════════════════════════
// PASSING PROPS
// ═══════════════════════════════════════════════════════════════════════════

// Parent component passes props
function App() {
  return (
    <div>
      {/* Pass props like HTML attributes */}
      <Greeting name="Alice" age={25} isAdmin={true} />
      <Greeting name="Bob" age={30} isAdmin={false} />
    </div>
  );
}

// Child component receives props as an object
function Greeting(props) {
  return (
    <div>
      <h1>Hello, {props.name}!</h1>
      <p>Age: {props.age}</p>
      <p>{props.isAdmin ? "Admin User" : "Regular User"}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DESTRUCTURING PROPS (preferred pattern in this codebase)
// ═══════════════════════════════════════════════════════════════════════════

// Instead of props.name, props.age, etc.
function Greeting({ name, age, isAdmin }) {
  return (
    <div>
      <h1>Hello, {name}!</h1>
      <p>Age: {age}</p>
      <p>{isAdmin ? "Admin User" : "Regular User"}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT PROPS
// ═══════════════════════════════════════════════════════════════════════════

// Provide default values if prop isn't passed
function Greeting({ name = "Guest", age = 0 }) {
  return <h1>Hello, {name} (age {age})!</h1>;
}

<Greeting />              // Output: "Hello, Guest (age 0)!"
<Greeting name="Alice" /> // Output: "Hello, Alice (age 0)!"
```

### Real Example from Codebase

```jsx
// From: frontend/src/components/NewsCard.jsx (simplified)

const NewsCard = ({
  postId,           // Unique ID for this news post
  title,            // News headline
  content,          // News body text
  factStatus,       // "Verified", "Pending", or "Fake"
  upvotes: initialUpvotes,    // Rename prop to initialUpvotes
  downvotes: initialDownvotes,
  comments: initialComments,
  imageUrl,
  username,
  link,
  onVote,           // Function passed from parent
  onCommentAdded,   // Function passed from parent
}) => {
  // Component uses these props
  return (
    <div className="news-card">
      <h3>{title}</h3>
      <p>{content}</p>
      <span>Status: {factStatus}</span>
      <span>Posted by: {username}</span>
    </div>
  );
};

// Parent (NewsFeed.jsx) passes props:
<NewsCard
  postId={news._id}
  title={news.title}
  content={news.content}
  factStatus={news.status}
  upvotes={news.upvotes}
  downvotes={news.downvotes}
  comments={news.comments}
  imageUrl={news.screenshots}
  username={news.uploadedBy.username}
  link={news.link}
  onVote={handleVote}
  onCommentAdded={handleCommentAdded}
/>
```

### Props Flow Visualization

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATA FLOWS DOWN (Props)                             │
└─────────────────────────────────────────────────────────────────────────────┘

                        ┌─────────────┐
                        │   Parent    │
                        │ (NewsFeed)  │
                        └──────┬──────┘
                               │
              ┌────────────────┼────────────────┐
              │ props          │ props          │ props
              ▼                ▼                ▼
        ┌───────────┐    ┌───────────┐    ┌───────────┐
        │ NewsCard  │    │ NewsCard  │    │ NewsCard  │
        │ (Child 1) │    │ (Child 2) │    │ (Child 3) │
        └───────────┘    └───────────┘    └───────────┘

IMPORTANT:
- Props are READ-ONLY (child cannot modify them)
- Data flows ONE direction: parent → child
- To send data up, parent passes a function prop
```

---

## State: Making Components Interactive

**State** is data that can change over time, causing the component to re-render.

### useState Hook

```jsx
import { useState } from 'react';  // Import the hook

function Counter() {
  // useState returns [currentValue, setterFunction]
  // Initial value is 0
  const [count, setCount] = useState(0);
  
  //   ↑        ↑                   ↑
  // state  setter function    initial value
  
  const increment = () => {
    setCount(count + 1);  // Update state
    // Component re-renders with new value
  };
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>Add 1</button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MULTIPLE STATE VARIABLES
// ═══════════════════════════════════════════════════════════════════════════

function LoginForm() {
  const [email, setEmail] = useState("");       // String state
  const [password, setPassword] = useState(""); // String state
  const [loading, setLoading] = useState(false); // Boolean state
  const [errors, setErrors] = useState([]);     // Array state
  const [user, setUser] = useState(null);       // Object state (null = empty)
  
  return (
    <form>
      <input 
        value={email} 
        onChange={(e) => setEmail(e.target.value)} 
      />
      <input 
        value={password} 
        onChange={(e) => setPassword(e.target.value)} 
      />
      <button disabled={loading}>
        {loading ? 'Loading...' : 'Login'}
      </button>
    </form>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STATE WITH OBJECTS
// ═══════════════════════════════════════════════════════════════════════════

function UserForm() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    userType: "normal"
  });
  
  // Update one field in the object
  const handleChange = (e) => {
    setFormData({
      ...formData,              // Keep all existing fields
      [e.target.id]: e.target.value  // Update just this one
    });
  };
  
  return (
    <input 
      id="email" 
      value={formData.email} 
      onChange={handleChange} 
    />
  );
}
```

### Real Example from Codebase

```jsx
// From: frontend/src/pages/LoginForm.jsx (simplified)

import { useState } from "react";

const LoginForm = () => {
  // Multiple state variables for the form
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    userType: "normal"
  });
  const [showPassword, setShowPassword] = useState(false);  // Toggle password visibility
  const [loading, setLoading] = useState(false);            // Show loading spinner
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' or 'face'
  const [faceImage, setFaceImage] = useState(null);         // Face auth image

  // Handler to update form fields
  const handleInputChange = (e) => {
    const { id, value } = e.target;  // Destructure event target
    setFormData({
      ...formData,      // Spread existing data
      [id]: value,      // Update the changed field
    });
  };

  // Handler for form submission
  const handleSubmit = async (e) => {
    e.preventDefault();       // Prevent page reload
    setLoading(true);         // Show loading state
    
    try {
      // API call here...
    } finally {
      setLoading(false);      // Hide loading state
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        id="email"
        value={formData.email}
        onChange={handleInputChange}
      />
      {/* More form fields... */}
    </form>
  );
};
```

---

## useEffect: Side Effects

**useEffect** runs code after the component renders. Used for:
- Fetching data from API
- Setting up subscriptions
- Updating the document title
- Any "side effect" outside React

```jsx
import { useState, useEffect } from 'react';

function DataFetcher() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // useEffect(callback, dependencies)
  useEffect(() => {
    // This code runs AFTER the component renders
    
    const fetchData = async () => {
      const response = await fetch('/api/data');
      const result = await response.json();
      setData(result);
      setLoading(false);
    };
    
    fetchData();
    
  }, []);  // Empty array = run only ONCE when component mounts
  
  //    ↑
  // Dependency array

  if (loading) return <p>Loading...</p>;
  return <ul>{data.map(item => <li key={item.id}>{item.name}</li>)}</ul>;
}

// ═══════════════════════════════════════════════════════════════════════════
// DEPENDENCY ARRAY EXPLAINED
// ═══════════════════════════════════════════════════════════════════════════

// NO array: Runs after EVERY render (rarely wanted)
useEffect(() => {
  console.log("Runs after every render");
});

// EMPTY array []: Runs only ONCE when component mounts
useEffect(() => {
  console.log("Runs once on mount");
}, []);

// WITH dependencies: Runs when any dependency changes
useEffect(() => {
  console.log(`User ID changed to: ${userId}`);
  fetchUserData(userId);
}, [userId]);  // Runs when userId changes

// CLEANUP function: Runs when component unmounts or before re-run
useEffect(() => {
  const timer = setInterval(() => console.log("tick"), 1000);
  
  return () => {
    clearInterval(timer);  // Cleanup when component unmounts
  };
}, []);
```

### Real Example from Codebase

```jsx
// From: frontend/src/components/NewsFeed.jsx

import { useState, useEffect, useContext } from "react";
import { newsAPI } from "../services/api";

const NewsFeed = () => {
  const [news, setNews] = useState([]);       // Store fetched news
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState("");     // Error message

  // Fetch news when component mounts
  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const response = await newsAPI.getAllPosts();  // API call
        setNews(response.news || []);                  // Update state
      } catch (error) {
        setError("Failed to fetch news data.");       // Handle error
        console.error("Fetch news error:", error);
      } finally {
        setLoading(false);                            // Always stop loading
      }
    };

    fetchNews();  // Call the async function
  }, []);  // Empty array = run once on mount

  // Render based on state
  if (loading) {
    return <div className="animate-spin">Loading...</div>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div>
      {news.map(post => (
        <NewsCard key={post._id} {...post} />
      ))}
    </div>
  );
};
```

---

## Interview Questions & Answers

### Q1: What is JSX?

**Answer:** JSX is a syntax extension for JavaScript that looks like HTML. It allows you to write HTML-like code in JavaScript files. React transforms JSX into `React.createElement()` calls. JSX makes code more readable and intuitive compared to writing createElement calls manually.

### Q2: What's the difference between props and state?

**Answer:**
- **Props**: Passed from parent to child, read-only, child cannot modify
- **State**: Managed within the component, can be changed, causes re-render when updated

Think of props like function arguments and state like local variables that can change.

### Q3: Why do we need keys when rendering lists?

**Answer:** Keys help React identify which items have changed, been added, or removed. They should be unique among siblings and stable (don't use array index if items can reorder). This enables efficient DOM updates.

```jsx
// Good: unique, stable ID
{items.map(item => <li key={item.id}>{item.name}</li>)}

// Bad: index can change if items reorder
{items.map((item, index) => <li key={index}>{item.name}</li>)}
```

### Q4: What does useEffect with an empty dependency array do?

**Answer:** It runs the effect only once when the component mounts (similar to `componentDidMount` in class components). This is commonly used for:
- Initial data fetching
- Setting up event listeners
- One-time initializations

### Q5: Why can't you modify props directly?

**Answer:** React follows a "one-way data flow" pattern. Props are read-only to ensure predictable data flow and make debugging easier. If a child needs to change data, it should call a function prop passed by the parent, which then updates its own state.

---

## Summary

| Concept | Purpose |
|---------|---------|
| **JSX** | HTML-like syntax in JavaScript |
| **Components** | Reusable UI building blocks |
| **Props** | Pass data from parent to child |
| **State** | Component's internal changeable data |
| **useState** | Hook to create state in function components |
| **useEffect** | Hook for side effects (data fetching, etc.) |

---

**Next: [02-PROJECT-STRUCTURE.md](./02-PROJECT-STRUCTURE.md)** - Understand how the codebase is organized →
