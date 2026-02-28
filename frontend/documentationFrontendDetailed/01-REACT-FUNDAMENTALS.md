# 01 — React Fundamentals: A Complete Deep-Dive from Zero

## Table of Contents
1. [Why Does React Exist? — The Problem It Solves](#1-why-does-react-exist--the-problem-it-solves)
2. [What Is React? — The Core Idea](#2-what-is-react--the-core-idea)
3. [The Virtual DOM — React's Secret Weapon](#3-the-virtual-dom--reacts-secret-weapon)
4. [What Is JSX? — Writing HTML Inside JavaScript](#4-what-is-jsx--writing-html-inside-javascript)
5. [JSX Rules — The Five Laws You Must Follow](#5-jsx-rules--the-five-laws-you-must-follow)
6. [What Is a Component? — The Building Block of React](#6-what-is-a-component--the-building-block-of-react)
7. [Function Components — The Modern Way](#7-function-components--the-modern-way)
8. [Props — Passing Data to Components](#8-props--passing-data-to-components)
9. [State — Data That Changes Over Time](#9-state--data-that-changes-over-time)
10. [The useState Hook — Managing State](#10-the-usestate-hook--managing-state)
11. [The useEffect Hook — Side Effects](#11-the-useeffect-hook--side-effects)
12. [The useContext Hook — Accessing Global Data](#12-the-usecontext-hook--accessing-global-data)
13. [The useRef Hook — DOM References](#13-the-useref-hook--dom-references)
14. [Event Handling in React](#14-event-handling-in-react)
15. [Conditional Rendering — Showing/Hiding UI](#15-conditional-rendering--showinghiding-ui)
16. [Lists and Keys — Rendering Arrays](#16-lists-and-keys--rendering-arrays)
17. [Component Lifecycle — Mount, Update, Unmount](#17-component-lifecycle--mount-update-unmount)
18. [How VoxVeritas Uses These Fundamentals](#18-how-voxveritas-uses-these-fundamentals)
19. [Interview Q&A](#19-interview-qa)
20. [Glossary](#20-glossary)

---

## 1. Why Does React Exist? — The Problem It Solves

### 1.1 — The Old Way: Vanilla JavaScript + DOM Manipulation

Before React, developers built web pages by directly manipulating the **DOM** (Document Object Model). The DOM is the browser's internal tree-structure representation of your HTML page.

**Imagine a simple counter button:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  VANILLA JAVASCRIPT APPROACH                                                │
└─────────────────────────────────────────────────────────────────────────────┘

HTML file:
  <p id="count">0</p>
  <button id="btn">Click Me</button>

JavaScript file:
  const countEl = document.getElementById('count');   // Find the element
  const btnEl = document.getElementById('btn');       // Find the button
  let count = 0;                                      // Track state manually

  btnEl.addEventListener('click', () => {             // Listen for clicks
    count++;                                          // Update our variable
    countEl.textContent = count;                      // Manually update the DOM
  });
```

This works fine for a counter. But what happens when you have:
- 50 news cards on a page, each with comments, votes, and AI verdicts?
- A dark mode toggle that must update every single element's colors?
- User login state that affects what every component shows?

**The problems multiply:**

| Problem | Description |
|---------|------------|
| **Manual DOM updates** | Every time data changes, you must find every affected element and manually update it. |
| **No structure** | There's no natural way to organize a 10,000-line app. Everything is spaghetti code. |
| **State synchronization** | If the count variable changes, you must remember to update EVERY element that displays it. Forget one? Bug. |
| **No reusability** | If you need the same counter in 3 places, you copy-paste all the DOM manipulation code 3 times. |

### 1.2 — React's Solution: Declare What You Want, React Handles the How

React flips the approach: instead of telling the browser "find this element and change its text to 5", you simply **declare** what the UI should look like based on the current data, and React figures out the minimum changes needed to update the DOM.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  COMPARISON                                                                 │
└─────────────────────────────────────────────────────────────────────────────┘

  IMPERATIVE (Vanilla JS):  "Step 1: Find element. Step 2: Change text. Step 3..."
  DECLARATIVE (React):      "When count is 5, the screen should show 5."

  ANALOGY:
  Imperative = Giving turn-by-turn driving directions
  Declarative = Giving the destination address to GPS
```

---

## 2. What Is React? — The Core Idea

**React** is a JavaScript **library** (not a framework) created by Facebook (now Meta) in 2013 for building user interfaces.

### 2.1 — Library vs Framework

| | Library | Framework |
|--|---------|----------|
| **Control** | You call the library when you need it | The framework calls your code |
| **Flexibility** | Mix with other tools freely | Must follow framework rules |
| **Size** | Focused on one job | Covers everything |
| **React is** | ✅ A library for UI rendering | |
| **Angular is** | | ✅ A full framework |

React only handles the **view layer** — what the user sees. For routing, state management, and API calls, you add separate libraries (React Router, Axios, etc.). VoxVeritas combines all of these.

### 2.2 — React's Three Core Ideas

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    REACT'S THREE PILLARS                                    │
└─────────────────────────────────────────────────────────────────────────────┘

  1. COMPONENTS — Break UI into small, reusable pieces
     ┌─────────┐  ┌─────────┐  ┌─────────┐
     │ Header  │  │NewsCard │  │ Footer  │   Each is independent
     └─────────┘  └─────────┘  └─────────┘

  2. DECLARATIVE UI — Describe WHAT the screen should look like
     "If user is logged in, show Dashboard. Else show Login."
     React handles all the DOM updates.

  3. UNIDIRECTIONAL DATA FLOW — Data flows DOWN from parent to child
     Parent  ──props──►  Child
     Data always goes one direction, making bugs easy to trace.
```

---

## 3. The Virtual DOM — React's Secret Weapon

### 3.1 — The Problem with Direct DOM Manipulation

Every time you change the real DOM (e.g., `element.textContent = "new text"`), the browser must:
1. Recalculate CSS styles
2. Recalculate layout (positions and sizes)
3. Repaint pixels on the screen

This is **expensive**. If you update 100 elements one by one, the browser does 100 recalculations.

### 3.2 — React's Solution: The Virtual DOM

React keeps a lightweight **copy** of the DOM in memory — the **Virtual DOM**. It's just a JavaScript object, not a real browser element.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    VIRTUAL DOM PROCESS                                       │
└─────────────────────────────────────────────────────────────────────────────┘

  STEP 1: State changes (e.g., user clicks upvote)
           │
           ▼
  STEP 2: React creates a NEW Virtual DOM tree reflecting the new state
           │
           ▼
  STEP 3: React COMPARES (diffs) the new Virtual DOM with the previous one
           │
           ▼
  STEP 4: React identifies the MINIMUM changes needed
           (e.g., only the vote count text changed)
           │
           ▼
  STEP 5: React applies ONLY those minimal changes to the real DOM
           (one surgical update instead of rebuilding everything)
```

**Analogy:** Instead of tearing down an entire building to change one room, React takes a photo of the desired building, compares it with the current building, and only renovates the rooms that differ.

---

## 4. What Is JSX? — Writing HTML Inside JavaScript

### 4.1 — The Theory

**JSX** stands for **JavaScript XML**. It's a syntax extension that allows you to write HTML-like code directly inside JavaScript files.

**Why does it exist?** Because React components return UI descriptions. Without JSX, you'd have to write:

```jsx
// Without JSX — verbose and hard to read
React.createElement('div', { className: 'card' },
  React.createElement('h3', null, 'Hello'),
  React.createElement('p', null, 'World')
);

// With JSX — intuitive and readable
<div className="card">
  <h3>Hello</h3>
  <p>World</p>
</div>
```

JSX is **not valid JavaScript**. Before the browser can run it, a tool called **Babel** (built into Vite) transforms JSX into `React.createElement()` calls. You never see this — it happens automatically during the build process.

### 4.2 — JSX Can Embed JavaScript

The magic of JSX: inside curly braces `{}`, you can write any JavaScript expression:

```jsx
const username = "Alice";
const isLoggedIn = true;

return (
  <div>
    <h1>Hello, {username}!</h1>           {/* Outputs: Hello, Alice! */}
    <p>2 + 2 = {2 + 2}</p>                {/* Outputs: 2 + 2 = 4 */}
    <p>{isLoggedIn ? "Welcome" : "Login"}</p>  {/* Conditional */}
    <p>Today: {new Date().toLocaleDateString()}</p>
  </div>
);
```

**Rule:** Only **expressions** (things that produce a value) go inside `{}`. Statements like `if/else` or `for` loops do NOT work directly inside JSX. Use ternary operators or `.map()` instead.

---

## 5. JSX Rules — The Five Laws You Must Follow

### Rule 1: Return a Single Root Element

Every component must return **one** wrapping element. Multiple sibling elements cause a syntax error.

```jsx
// ❌ ERROR — Two root elements
return (
  <h1>Title</h1>
  <p>Subtitle</p>
);

// ✅ SOLUTION A — Wrap in a <div>
return (
  <div>
    <h1>Title</h1>
    <p>Subtitle</p>
  </div>
);

// ✅ SOLUTION B — Use a React Fragment (adds no extra DOM element)
return (
  <>
    <h1>Title</h1>
    <p>Subtitle</p>
  </>
);
```

**Why?** A JavaScript function can only `return` one value. JSX compiles to one `React.createElement()` call, which creates one element.

### Rule 2: Use `className` Instead of `class`

In HTML you write `class="my-class"`. In JSX you write `className="my-class"`.

```jsx
// ❌ HTML way (won't work in JSX — 'class' is a reserved JavaScript keyword)
<div class="card">

// ✅ JSX way
<div className="card">
```

**Why?** In JavaScript, `class` is a reserved keyword (used for class definitions). React uses `className` to avoid conflicts.

### Rule 3: Close All Tags

HTML allows some tags to be self-closing (like `<br>` or `<img>`). JSX requires **every** tag to be explicitly closed.

```jsx
// ❌ ERROR — unclosed tags
<img src="photo.jpg">
<br>
<input type="text">

// ✅ CORRECT — self-closing tags
<img src="photo.jpg" />
<br />
<input type="text" />
```

### Rule 4: Use `htmlFor` Instead of `for`

The HTML `<label for="email">` attribute becomes `htmlFor` in JSX:

```jsx
// ❌ HTML way
<label for="email">Email</label>

// ✅ JSX way
<label htmlFor="email">Email</label>
```

**Why?** Same reason as `className` — `for` is a reserved JavaScript keyword (used in for loops).

### Rule 5: CamelCase for Event Handlers

HTML event attributes are lowercase. JSX uses camelCase:

```jsx
// ❌ HTML way
<button onclick="handleClick()">

// ✅ JSX way — camelCase, and pass a FUNCTION REFERENCE, not a string
<button onClick={handleClick}>
```

---

## 6. What Is a Component? — The Building Block of React

### 6.1 — The Theory

A **component** is a self-contained, reusable piece of UI. Think of it like a LEGO brick — you build complex structures by combining simple, modular pieces.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    COMPONENT THINKING                                       │
└─────────────────────────────────────────────────────────────────────────────┘

  The VoxVeritas Home Page is made of components:

  ┌───────────────────────────────────────────────────────┐
  │  <Header />                                           │  ← Component
  ├───────────────────────────────────────────────────────┤
  │  <NewsFeed />                                         │  ← Component
  │    ┌─────────────────────────────────────────────┐    │
  │    │  <NewsCard />                               │    │  ← Component
  │    │    <CommentSection />                       │    │  ← Component
  │    │    <AIVerdictSection />                     │    │  ← Component
  │    └─────────────────────────────────────────────┘    │
  │    ┌─────────────────────────────────────────────┐    │
  │    │  <NewsCard />  (Another instance)           │    │  ← Same component,
  │    └─────────────────────────────────────────────┘    │     different data
  ├───────────────────────────────────────────────────────┤
  │  <Footer />                                           │  ← Component
  └───────────────────────────────────────────────────────┘
```

**Key insight:** `<NewsCard />` is used multiple times, each showing different news article data. You write the component **once** and reuse it with different **props** (data inputs).

### 6.2 — Component Naming Convention

In React, components MUST start with an **uppercase letter**:

```jsx
// ✅ React component (uppercase)
const NewsCard = () => { ... };
<NewsCard />

// ❌ NOT a component (lowercase — React treats it as an HTML element)
const newscard = () => { ... };
<newscard />  // React looks for an HTML element called "newscard" — ERROR
```

**Why?** This is how React distinguishes between custom components (`<Header>`) and native HTML elements (`<header>`).

---

## 7. Function Components — The Modern Way

### 7.1 — The Theory

There are two types of React components: **class components** (old way, from 2013-2018) and **function components** (modern way, post-2019). VoxVeritas uses **function components exclusively**.

A function component is literally a JavaScript function that:
1. Optionally receives **props** (input data) as its argument
2. Returns **JSX** (the UI description)

### 7.2 — The Anatomy of a Function Component

**The Journey:** First, we import what we need. Then we define a function. Inside that function, we may declare state variables and handlers. Finally, we return JSX.

```jsx
// ═══════════════════════════════════════════════════════════════════════════
// STEP 1: IMPORTS — Bring in tools we need
// ═══════════════════════════════════════════════════════════════════════════
import { useState } from 'react';       // Hook for managing state

// ═══════════════════════════════════════════════════════════════════════════
// STEP 2: DEFINE THE COMPONENT — A function that returns JSX
// ═══════════════════════════════════════════════════════════════════════════
const Counter = () => {
  // ═════════════════════════════════════════════════════════════════════════
  // STEP 3: DECLARE STATE — Data that changes over time
  // ═════════════════════════════════════════════════════════════════════════
  const [count, setCount] = useState(0);   // count starts at 0

  // ═════════════════════════════════════════════════════════════════════════
  // STEP 4: DEFINE HANDLERS — Functions that respond to user actions
  // ═════════════════════════════════════════════════════════════════════════
  const handleIncrement = () => {
    setCount(count + 1);  // Update state → React re-renders the component
  };

  // ═════════════════════════════════════════════════════════════════════════
  // STEP 5: RETURN JSX — Describe what the UI should look like
  // ═════════════════════════════════════════════════════════════════════════
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={handleIncrement}>+1</button>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// STEP 6: EXPORT — Make this component available to other files
// ═══════════════════════════════════════════════════════════════════════════
export default Counter;
```

### 7.3 — Arrow Function Syntax

VoxVeritas uses **arrow function** syntax for all components. Here's the breakdown:

```jsx
// Traditional function:
function Counter() { return <div>...</div>; }

// Arrow function (same thing, shorter):
const Counter = () => { return <div>...</div>; };

// Arrow function with implicit return (even shorter, for simple components):
const Counter = () => (
  <div>...</div>
);
```

**Why arrow functions?** They're shorter, and they don't create their own `this` context (which avoids a whole class of bugs that plagued class components).

---

## 8. Props — Passing Data to Components

### 8.1 — The Theory

**Props** (short for "properties") are the mechanism for passing data from a **parent** component to a **child** component. Think of props like function arguments — the parent calls the child and gives it data.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DATA FLOW WITH PROPS                                     │
└─────────────────────────────────────────────────────────────────────────────┘

  Parent Component (NewsFeed)
  │
  │  Has data: { title: "Breaking News", upvotes: 42 }
  │
  │  Passes it down as props:
  │  <NewsCard title="Breaking News" upvotes={42} />
  │
  ▼
  Child Component (NewsCard)
  │
  │  Receives props: { title: "Breaking News", upvotes: 42 }
  │  Uses them: <h3>{props.title}</h3>  →  Renders "Breaking News"
```

### 8.2 — Props Are Read-Only

**Critical rule:** A child component can NEVER modify its props. Props flow one way (parent → child). If the child needs to change something, it must tell the parent (usually via a callback function prop).

```jsx
// ❌ NEVER DO THIS — props are read-only
const NewsCard = (props) => {
  props.title = "Hacked!";  // ERROR: Cannot modify props
};

// ✅ CORRECT — read props, don't modify them
const NewsCard = (props) => {
  return <h3>{props.title}</h3>;  // Just use the value
};
```

### 8.3 — Destructuring Props

Instead of writing `props.title`, `props.upvotes`, etc., we **destructure** the props object:

```jsx
// Without destructuring:
const NewsCard = (props) => {
  return <h3>{props.title}</h3>;
};

// With destructuring (clean, preferred):
const NewsCard = ({ title, upvotes, onVote }) => {
  return <h3>{title}</h3>;
};
```

**Why destructure?** It immediately shows what data the component expects, making the code self-documenting.

### 8.4 — VoxVeritas Example: NewsCard Props

In VoxVeritas, the `NewsCard` component receives many props from `NewsFeed`:

```jsx
<NewsCard
  key={news._id}                    // Unique identifier for React's list optimization
  postId={news._id}                 // The MongoDB document ID
  title={news.title}                // News article title string
  content={news.content}            // Article body text
  factStatus={news.status}          // "Real", "Fake", or "Pending"
  upvotes={news.upvotes}            // Number of upvotes
  downvotes={news.downvotes}        // Number of downvotes
  comments={processComments(...)}   // Processed array of comments
  imageUrl={processImageUrls(...)}  // Array of image URLs
  username={news.postedBy?.username} // Who posted this
  uploadedById={news.postedBy?._id}  // Poster's ID (for delete permission)
  link={news.link}                  // Source article URL
  onVote={handleVote}               // Callback function for voting
  onCommentAdded={handleCommentAdded}// Callback when a comment is added
  onPostDeleted={handlePostDeleted}  // Callback when post is deleted
/>
```

---

## 9. State — Data That Changes Over Time

### 9.1 — The Theory

**State** is data that a component **owns and can change**. When state changes, React **re-renders** the component (recalculates the JSX and updates the DOM).

**The difference between props and state:**

| | Props | State |
|--|-------|-------|
| **Who owns it?** | Parent component | This component |
| **Can it change?** | No (read-only for the child) | Yes (via setter function) |
| **What happens on change?** | Parent re-renders → child re-renders | This component re-renders |
| **Analogy** | Arguments to a function | Local variables inside a function |

### 9.2 — Why Can't We Use Regular Variables for State?

```jsx
// ❌ THIS DOES NOT WORK
const Counter = () => {
  let count = 0;

  const handleClick = () => {
    count++;           // Variable changes...
    console.log(count); // Shows 1, 2, 3...
  };

  return <p>Count: {count}</p>;  // BUT THE SCREEN NEVER UPDATES!
};
```

**Why?** React doesn't know the variable changed. React only re-renders when you call a **state setter function** (`setCount`). Regular variables don't trigger re-renders.

---

## 10. The useState Hook — Managing State

### 10.1 — What Is a Hook?

A **Hook** is a special function provided by React that lets function components access React features (state, lifecycle, context). Hooks always start with `use`:
- `useState` — manage local state
- `useEffect` — perform side effects (API calls, timers)
- `useContext` — access global context data
- `useRef` — reference DOM elements or persistent values

**Rules of Hooks:**
1. Only call hooks at the **top level** of a component (not inside loops, conditions, or nested functions)
2. Only call hooks inside **React function components** (not regular JavaScript functions)

### 10.2 — useState: The Journey

**What we want:** A way to store data that, when changed, automatically updates the UI.

**How we do it:** Call `useState(initialValue)`. It returns an array with two items:
1. The **current value** of the state
2. A **setter function** to update the value

```jsx
// ═══════════════════════════════════════════════════════════════════════════
// THE useState JOURNEY
// ═══════════════════════════════════════════════════════════════════════════

// Step 1: Import useState from React
import { useState } from 'react';

const Counter = () => {
  // Step 2: Call useState with an initial value
  // useState(0) returns [currentValue, setterFunction]
  // We use array destructuring to name them whatever we want
  const [count, setCount] = useState(0);
  //     ─────  ────────          ─
  //     current setter     initial value
  //     value   function

  // Step 3: Use the current value in JSX
  // Step 4: Call the setter function to update
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
};
```

### 10.3 — State with Objects

VoxVeritas frequently uses **object state** for forms with multiple fields:

```jsx
// Instead of one useState per field:
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [userType, setUserType] = useState('normal');

// VoxVeritas uses ONE state object:
const [formData, setFormData] = useState({
  email: '',
  password: '',
  userType: 'normal'
});

// Update one field while keeping others:
const handleInputChange = (e) => {
  const { id, value } = e.target;     // Get field name and new value
  setFormData({
    ...formData,    // SPREAD: copy all existing fields
    [id]: value     // OVERRIDE: update only the changed field
  });
};
```

**Why `...formData`?** React state updates must be **immutable** — you never modify the existing object, you create a new one. The spread operator (`...`) copies all properties, then the `[id]: value` overrides just the one that changed.

### 10.4 — Multiple useState Calls in VoxVeritas

The `NewsCard` component uses multiple pieces of state:

```jsx
const [upvotes, setUpvotes] = useState(initialUpvotes || 0);    // Vote count
const [downvotes, setDownvotes] = useState(initialDownvotes || 0);
const [comments, setComments] = useState(initialComments || []); // Comment list
const [showComments, setShowComments] = useState(false);         // UI toggle
const [currentPage, setCurrentPage] = useState(1);               // Image pagination
const [showAiAnalysis, setShowAiAnalysis] = useState(false);     // AI section toggle
const [showFullText, setShowFullText] = useState(false);         // Read more / less
const [deleting, setDeleting] = useState(false);                 // Delete in progress
```

Each `useState` call is independent. Updating `showComments` does NOT affect `upvotes`.

---

## 11. The useEffect Hook — Side Effects

### 11.1 — What Is a Side Effect?

A **side effect** is anything a component does beyond rendering UI:
- Fetching data from an API
- Setting up a timer or interval
- Adding/removing event listeners
- Reading from localStorage
- Updating the document title

### 11.2 — Why useEffect Exists

React components are functions. Functions should be **pure** — given the same inputs (props + state), they should return the same output (JSX). Side effects break this purity, so React provides `useEffect` to safely handle them.

### 11.3 — useEffect Syntax and Behavior

```jsx
useEffect(() => {
  // This code runs AFTER the component renders to the screen
  // (not during rendering — that would block the UI)
}, [dependencies]);
```

**The dependency array** controls WHEN the effect runs:

```jsx
// Pattern 1: Run on EVERY render (no array)
useEffect(() => {
  console.log('I run after every render');
});

// Pattern 2: Run ONCE on mount (empty array)
useEffect(() => {
  console.log('I run once when component first appears');
  fetchNews();  // Perfect place for initial API calls
}, []);

// Pattern 3: Run when specific values change
useEffect(() => {
  console.log('roomId changed! Fetching new data...');
  fetchDebateRoom();
}, [roomId]);  // Runs whenever roomId changes
```

### 11.4 — Cleanup Function

Some effects need cleanup (e.g., removing event listeners, stopping timers):

```jsx
// From Header.jsx — click-outside handler
useEffect(() => {
  // SETUP: Add event listener when component mounts
  const handleClickOutside = (event) => {
    if (showUserMenu && !event.target.closest('.user-menu-container')) {
      setShowUserMenu(false);
    }
  };
  document.addEventListener('mousedown', handleClickOutside);

  // CLEANUP: Remove listener when component unmounts or before re-running
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, [showUserMenu]);
```

**Why cleanup?** Without it, every re-render would add another listener, causing memory leaks and duplicate handler calls.

### 11.5 — VoxVeritas Example: Fetching News on Mount

```jsx
// From NewsFeed.jsx
useEffect(() => {
  const fetchNews = async () => {
    try {
      setLoading(true);                          // Show loading spinner
      const response = await newsAPI.getAllPosts(); // Call backend API
      setNews(response.news || []);               // Store data in state
    } catch (error) {
      setError("Failed to fetch news data.");     // Show error message
      toast.error("Failed to load news feed");    // Pop-up notification
    } finally {
      setLoading(false);                          // Hide loading spinner
    }
  };
  fetchNews();  // Call the async function
}, []);  // Empty array = run once on mount
```

---

## 12. The useContext Hook — Accessing Global Data

### 12.1 — The Problem: Prop Drilling

Imagine you need the logged-in user's name in a deeply nested component:

```
App → Layout → Header → UserMenu → UserName
```

Without Context, you'd pass `user` as a prop through EVERY level — even levels that don't need it. This is called **prop drilling**.

### 12.2 — The Solution: Context

Context creates a "broadcast channel" that any component can tune into, regardless of depth:

```jsx
// Step 1: Create context
const UserContext = createContext();

// Step 2: Provide value at the top level
<UserContext.Provider value={{ user, login, logout }}>
  <App />
</UserContext.Provider>

// Step 3: Consume anywhere with useContext
const UserMenu = () => {
  const { user, logout } = useContext(UserContext);
  return <span>{user.name}</span>;
};
```

Full details in [06-CONTEXT-API.md](./06-CONTEXT-API.md).

---

## 13. The useRef Hook — DOM References

### 13.1 — What It Does

`useRef` creates a **persistent reference** that survives re-renders without causing them. Two main uses:

1. **Reference DOM elements** directly (like `document.getElementById` in vanilla JS)
2. **Store mutable values** that don't trigger re-renders

### 13.2 — Example from FaceCapture.jsx

```jsx
const videoRef = useRef(null);     // Will reference the <video> element
const canvasRef = useRef(null);    // Will reference the <canvas> element
const fileInputRef = useRef(null); // Will reference the file input

// Later, in JSX:
<video ref={videoRef} autoPlay />    // React assigns the DOM element to videoRef.current
<canvas ref={canvasRef} />

// Access the DOM element:
const video = videoRef.current;      // Now you have the actual <video> DOM element
video.play();                        // Call native DOM methods on it
```

**Why not just useState?** Changing a `useRef` value does NOT trigger a re-render. Changing `useState` does. For DOM references, you don't want re-renders — you just need to access the element.

---

## 14. Event Handling in React

### 14.1 — The Theory

Events are user actions: clicks, typing, scrolling, form submissions. React wraps native browser events in **SyntheticEvents** for cross-browser consistency.

### 14.2 — Key Patterns

```jsx
// Pattern 1: Simple click handler
<button onClick={handleClick}>Click Me</button>

// Pattern 2: Passing arguments to handler
<button onClick={() => handleVote(postId, 'upvote')}>▲</button>

// Pattern 3: Preventing default form submission (page would refresh)
const handleSubmit = (e) => {
  e.preventDefault();  // Stop the browser from refreshing the page
  // ... handle form submission
};
<form onSubmit={handleSubmit}>

// Pattern 4: Getting input value from event
const handleInput = (e) => {
  const { id, value } = e.target;  // e.target = the input element
  setFormData({ ...formData, [id]: value });
};
<input onChange={handleInput} />
```

### 14.3 — Common Events in VoxVeritas

| JSX Attribute | Triggers When | Example Use |
|--------------|---------------|-------------|
| `onClick` | Element is clicked | Vote buttons, toggle comments |
| `onChange` | Input value changes | Form fields, search box |
| `onSubmit` | Form is submitted | Login, signup, comment forms |
| `onMouseDown` | Mouse button pressed | Click-outside detection |
| `onFocus` | Element gains focus | Search input activation |

---

## 15. Conditional Rendering — Showing/Hiding UI

### 15.1 — The Theory

In React, you control what appears on screen by using JavaScript conditions inside JSX.

### 15.2 — Three Patterns

```jsx
// Pattern 1: Ternary Operator (if/else in JSX)
{isLoading ? <LoadingSpinner /> : <NewsFeed />}

// Pattern 2: Logical AND (show or nothing)
{showComments && <CommentSection />}

// Pattern 3: Early Return (skip entire render)
if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage />;
return <ActualContent />;
```

### 15.3 — VoxVeritas Example: Loading/Error/Content Pattern

```jsx
// From NewsFeed.jsx — the standard three-state rendering pattern
if (loading) {
  return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
    </div>
  );
}

if (error) return <p className="text-red-500 text-center">{error}</p>;

// Only reached if not loading and no error — render the actual news
return (
  <div>{news.map(item => <NewsCard key={item._id} {...item} />)}</div>
);
```

---

## 16. Lists and Keys — Rendering Arrays

### 16.1 — The Theory

To display a list of items (news articles, comments, etc.), you map an array to JSX elements using `.map()`:

```jsx
const fruits = ['Apple', 'Banana', 'Cherry'];

return (
  <ul>
    {fruits.map((fruit, index) => (
      <li key={index}>{fruit}</li>
    ))}
  </ul>
);
```

### 16.2 — Why Keys Matter

React uses `key` to identify which items changed, were added, or were removed. Without keys, React may unnecessarily re-render the entire list.

```jsx
// ❌ BAD — using index as key (causes issues with reordering)
{news.map((item, index) => <NewsCard key={index} ... />)}

// ✅ GOOD — using unique ID as key
{news.map(item => <NewsCard key={item._id} ... />)}
```

**Rule:** Keys must be unique among siblings and stable across re-renders. MongoDB `_id` values are perfect.

---

## 17. Component Lifecycle — Mount, Update, Unmount

### 17.1 — The Three Phases

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    COMPONENT LIFECYCLE                                       │
└─────────────────────────────────────────────────────────────────────────────┘

  MOUNTING (Component appears on screen)
  ──────────────────────────────────────
  1. Component function runs
  2. JSX is returned → DOM is updated
  3. useEffect(() => {...}, []) runs (after paint)

  UPDATING (State or props change)
  ────────────────────────────────
  1. State setter called (e.g., setCount(5))
  2. Component function runs again with new values
  3. React diffs Virtual DOM → updates real DOM
  4. useEffect runs if dependencies changed

  UNMOUNTING (Component removed from screen)
  ──────────────────────────────────────────
  1. useEffect cleanup functions run
  2. Component removed from DOM
  3. Memory freed
```

---

## 18. How VoxVeritas Uses These Fundamentals

| Fundamental | Where It's Used in VoxVeritas |
|------------|------------------------------|
| **Components** | 33+ components in `/components/`, 13 pages in `/pages/` |
| **JSX** | Every `.jsx` file — mixing HTML-like syntax with JavaScript logic |
| **Props** | `NewsFeed` passes news data down to `NewsCard` via props |
| **useState** | Form data, loading states, UI toggles, vote counts |
| **useEffect** | API calls on mount, theme initialization, event listeners |
| **useContext** | `UserContext` — auth state accessed by Header, ProtectedRoute, CommentSection |
| **useRef** | `FaceCapture.jsx` — video/canvas DOM references for webcam |
| **Events** | Click handlers for voting, form submissions, dark mode toggle |
| **Conditional Rendering** | Loading spinners, error messages, role-based button visibility |
| **Lists + Keys** | News feed (mapping news array), comments (mapping comment array) |

---

## 19. Interview Q&A

**Q: What is the Virtual DOM and why does React use it?**
A: The Virtual DOM is a lightweight JavaScript copy of the real DOM. React uses it to minimize expensive DOM operations. When state changes, React builds a new Virtual DOM, diffs it against the previous one, and applies only the minimal changes to the real DOM (a process called "reconciliation").

**Q: What's the difference between props and state?**
A: Props are read-only inputs passed from parent to child. State is data owned by the component that can change, triggering re-renders. Props flow down, state is local.

**Q: Why must you use `setCount(count + 1)` instead of `count++`?**
A: Direct mutation (`count++`) doesn't trigger a re-render. React only knows state changed when you call the setter function from `useState`. The setter also ensures immutability — React compares old and new values to decide if re-render is needed.

**Q: What happens if you call useState inside an `if` statement?**
A: React breaks. Hooks rely on call order — React tracks hooks by their position. Conditional calls change the order between renders, corrupting the internal state tracking. This is why the Rules of Hooks say: only call hooks at the top level.

**Q: Explain useEffect's dependency array.**
A: The array tells React WHEN to re-run the effect. Empty array `[]` = run once on mount. `[roomId]` = run when `roomId` changes. No array = run after every render. React compares previous and current dependency values to decide.

---

## 20. Glossary

| Term | Definition |
|------|-----------|
| **Arrow Function** | `const fn = () => {}` — a shorter function syntax that doesn't bind its own `this` |
| **Component** | A function that returns JSX — a reusable piece of UI |
| **Declarative** | Describing WHAT should happen, not HOW (React handles the how) |
| **Destructuring** | Extracting values from objects/arrays: `const { name } = props` |
| **DOM** | Document Object Model — the browser's tree representation of the HTML page |
| **Hook** | A React function (starting with `use`) that enables state, effects, context in function components |
| **Immutable** | Never modifying data directly; always creating a new copy with changes |
| **JSX** | JavaScript XML — HTML-like syntax in JavaScript, compiled by Babel |
| **Key** | A special prop that helps React identify list items for efficient updates |
| **Props** | Read-only data passed from parent to child component |
| **Re-render** | React re-executing the component function and updating the DOM if needed |
| **Side Effect** | Any operation beyond pure rendering — API calls, timers, DOM manipulation |
| **Spread Operator** | `...obj` — copies all properties from an object into a new one |
| **State** | Component-owned data that triggers re-renders when updated |
| **Virtual DOM** | React's in-memory copy of the DOM used for efficient diffing |

---

**Next → [02-PROJECT-STRUCTURE.md](./02-PROJECT-STRUCTURE.md)** — Understand every folder and file in the project.
