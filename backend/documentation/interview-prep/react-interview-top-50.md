# Top 50 React Interview Questions (Simple Language + Code)

Each question has: **simple explanation** + **code example**. Some also have "**Interviewers often ask you to write this**" — practice writing that code by hand.

---

## SECTION 1: React Basics

### 1. What is React?
React is a JavaScript library to build user interfaces. It lets you build small reusable pieces called **components** and combine them to make a full webpage.

### 2. What is JSX?
JSX lets you write HTML-like code inside JavaScript. Browsers don't understand JSX directly — a tool called Babel converts it into normal JavaScript.

```jsx
const element = <h1>Hello, World!</h1>;
// Babel converts this to:
const element2 = React.createElement('h1', null, 'Hello, World!');
```

### 3. What is the Virtual DOM?
It's a lightweight copy of the real DOM kept in memory. When data changes, React first updates the Virtual DOM, compares (diffs) it with the old version, and only updates the real DOM where something actually changed. This makes updates fast.

### 4. Difference between Real DOM and Virtual DOM?
| Real DOM | Virtual DOM |
|---|---|
| Slow to update | Fast, it's just JS objects |
| Updates the whole tree | Updates only changed parts |
| Direct manipulation | Manipulation happens first in memory |

### 5. What are Components?
Components are independent, reusable building blocks of a UI. Two types: **Functional** and **Class** components.

```jsx
// Functional Component
function Welcome() {
  return <h1>Hello!</h1>;
}

// Class Component
class Welcome2 extends React.Component {
  render() {
    return <h1>Hello!</h1>;
  }
}
```

### 6. Functional vs Class Components?
Functional components are plain JS functions that return JSX and use **Hooks** for state/lifecycle. Class components use `this.state` and lifecycle methods like `componentDidMount`. Functional + Hooks is the modern standard.

### 7. What are Props?
Props (properties) are how you pass data from a parent component to a child component. They are **read-only** — a child cannot change its own props.

```jsx
function Greeting(props) {
  return <h1>Hello, {props.name}</h1>;
}
// Usage
<Greeting name="Deepanshu" />
```

### 8. What is State?
State is data that belongs to a component and can change over time. When state changes, the component re-renders.

```jsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>Count: {count}</button>;
}
```

### 9. Props vs State?
| Props | State |
|---|---|
| Passed from parent | Managed inside the component |
| Read-only | Can be changed with setState/useState |
| Makes component reusable | Makes component dynamic |

### 10. What is a key in lists, and why is it needed?
A `key` is a unique identifier React uses to track which list items changed, were added, or removed. Without keys, React may re-render items incorrectly.

```jsx
const items = ['Apple', 'Banana', 'Mango'];
function List() {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}
```
**Tip:** Never use array `index` as key if the list order can change — use a unique `id` instead.

---

## SECTION 2: Hooks

### 11. What are Hooks?
Hooks are special functions (like `useState`, `useEffect`) that let functional components use state and other React features without writing a class.

### 12. Rules of Hooks?
1. Only call Hooks at the top level (not inside loops, conditions, or nested functions).
2. Only call Hooks from React function components or custom Hooks.

### 13. What is useState?
Lets a functional component have state.
```jsx
const [name, setName] = useState('Deepanshu');
```

### 14. What is useEffect? (Very commonly asked to write)
Runs "side effects" — code that runs after render, like fetching data, setting timers, or subscriptions.

```jsx
import { useState, useEffect } from 'react';

function Timer() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);

    // cleanup function - runs when component unmounts
    return () => clearInterval(interval);
  }, []); // empty array = runs only once (on mount)

  return <h1>{seconds} seconds passed</h1>;
}
```

### 15. What does the dependency array in useEffect mean?
- `[]` — run once, after first render.
- `[value]` — run again whenever `value` changes.
- No array at all — runs after **every** render.

### 16. What is useContext?
Lets you share data (like theme, logged-in user) across many components without passing props manually at every level ("prop drilling").

```jsx
import { createContext, useContext } from 'react';

const ThemeContext = createContext('light');

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Toolbar />
    </ThemeContext.Provider>
  );
}

function Toolbar() {
  const theme = useContext(ThemeContext);
  return <div>Current theme: {theme}</div>;
}
```

### 17. What is useRef?
Gives you a mutable box (`.current`) that persists across renders without causing a re-render when changed. Commonly used to access DOM elements directly.

```jsx
function TextInput() {
  const inputRef = useRef(null);

  const focusInput = () => {
    inputRef.current.focus();
  };

  return (
    <>
      <input ref={inputRef} type="text" />
      <button onClick={focusInput}>Focus Input</button>
    </>
  );
}
```

### 18. useState vs useRef?
`useState` causes a re-render when updated. `useRef` does NOT cause a re-render — good for storing values you need but don't want to trigger UI updates (like timers, previous values, DOM nodes).

### 19. What is useReducer?
An alternative to `useState` for complex state logic (multiple sub-values or state that depends on previous state). Works like Redux's reducer pattern.

```jsx
function reducer(state, action) {
  switch (action.type) {
    case 'increment': return { count: state.count + 1 };
    case 'decrement': return { count: state.count - 1 };
    default: return state;
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, { count: 0 });
  return (
    <>
      <p>Count: {state.count}</p>
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
      <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
    </>
  );
}
```

### 20. What is useMemo?
Caches (remembers) the **result of a calculation** so it's not recalculated on every render — used for performance, when a calculation is expensive.

```jsx
const expensiveResult = useMemo(() => {
  return slowCalculation(number);
}, [number]); // only recalculates when 'number' changes
```

### 21. What is useCallback?
Caches a **function** itself, so a new function isn't created on every render. Useful when passing callbacks to child components wrapped in `React.memo`.

```jsx
const handleClick = useCallback(() => {
  console.log('Clicked', count);
}, [count]);
```

### 22. useMemo vs useCallback?
`useMemo` returns a memoized **value**. `useCallback` returns a memoized **function**. In fact, `useCallback(fn, deps)` is basically `useMemo(() => fn, deps)`.

### 23. What is a Custom Hook? (Often asked to write one)
A custom Hook is your own reusable function that starts with `use` and can call other Hooks inside it.

```jsx
// Custom hook to fetch data
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      });
  }, [url]);

  return { data, loading };
}

// Usage
function Users() {
  const { data, loading } = useFetch('https://api.example.com/users');
  if (loading) return <p>Loading...</p>;
  return <p>{JSON.stringify(data)}</p>;
}
```

### 24. What is useLayoutEffect? How is it different from useEffect?
Same as `useEffect`, but it runs **synchronously right after DOM updates, before the browser paints**. Use it when you need to measure or change the DOM before the user sees it (e.g., measuring an element's size).

---

## SECTION 3: Component Lifecycle

### 25. What are the phases of a component's lifecycle?
1. **Mounting** – component is created and inserted into the DOM.
2. **Updating** – component re-renders due to props/state change.
3. **Unmounting** – component is removed from the DOM.

### 26. Class component lifecycle methods?
```jsx
class MyComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = { count: 0 };
  }

  componentDidMount() {
    // runs once after component is added to DOM (like useEffect(fn, []))
    console.log('Mounted');
  }

  componentDidUpdate(prevProps, prevState) {
    // runs after every re-render (like useEffect(fn, [dep]))
    console.log('Updated');
  }

  componentWillUnmount() {
    // cleanup before component is removed (like useEffect's return function)
    console.log('Unmounting');
  }

  render() {
    return <h1>{this.state.count}</h1>;
  }
}
```

### 27. How do Hooks replicate lifecycle methods?
| Class Method | Hook Equivalent |
|---|---|
| componentDidMount | `useEffect(() => {...}, [])` |
| componentDidUpdate | `useEffect(() => {...}, [dep])` |
| componentWillUnmount | `useEffect(() => { return () => {...} }, [])` |

---

## SECTION 4: Events, Forms & Conditional Rendering

### 28. How does event handling work in React?
React wraps native browser events in a "SyntheticEvent" for cross-browser consistency. You pass a function, not a string.

```jsx
function Button() {
  const handleClick = (e) => {
    console.log('Button clicked', e);
  };
  return <button onClick={handleClick}>Click Me</button>;
}
```

### 29. What is a Controlled Component? (Very common to write)
An input whose value is controlled by React state — the "single source of truth" is state, not the DOM.

```jsx
function Form() {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Submitted: ${name}`);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### 30. What is an Uncontrolled Component?
An input that manages its own state internally in the DOM; you access its value using a `ref` instead of state.

```jsx
function UncontrolledForm() {
  const inputRef = useRef();
  const handleSubmit = (e) => {
    e.preventDefault();
    alert(inputRef.current.value);
  };
  return (
    <form onSubmit={handleSubmit}>
      <input ref={inputRef} defaultValue="Deepanshu" />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### 31. How do you do conditional rendering?
```jsx
function Greeting({ isLoggedIn }) {
  if (isLoggedIn) {
    return <h1>Welcome back!</h1>;
  }
  return <h1>Please sign in.</h1>;
}

// Using ternary
function Status({ isOnline }) {
  return <p>{isOnline ? 'Online' : 'Offline'}</p>;
}

// Using && (only renders if condition is true)
function Notification({ count }) {
  return <div>{count > 0 && <span>{count} new messages</span>}</div>;
}
```

### 32. How do you handle lists and map()?
Already shown in Q10 — use `.map()` to loop and return JSX for each item, always with a unique `key`.

---

## SECTION 5: Advanced Concepts

### 33. What is Prop Drilling and how do you avoid it?
Prop drilling is passing props through many nested components that don't need them, just to reach a deeply nested child. Avoid it using **Context API** or state management libraries (Redux, Zustand).

### 34. What is Lifting State Up?
When two sibling components need to share the same data, you move ("lift") the state to their closest common parent, then pass it down via props.

```jsx
function Parent() {
  const [value, setValue] = useState('');
  return (
    <>
      <InputBox value={value} setValue={setValue} />
      <Display value={value} />
    </>
  );
}
```

### 35. What is React.memo?
A Higher Order Component that prevents a component from re-rendering if its props haven't changed — used for performance optimization.

```jsx
const MyComponent = React.memo(function MyComponent({ name }) {
  console.log('Rendered!');
  return <p>{name}</p>;
});
```

### 36. What is a Higher-Order Component (HOC)?
A function that takes a component and returns a new, enhanced component. Used to reuse logic across components.

```jsx
function withLoading(Component) {
  return function WrappedComponent({ isLoading, ...props }) {
    if (isLoading) return <p>Loading...</p>;
    return <Component {...props} />;
  };
}

const UserListWithLoading = withLoading(UserList);
```

### 37. What are Render Props?
A pattern where a component takes a **function as a prop** and calls it to decide what to render — used to share logic between components.

```jsx
function MouseTracker({ render }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  return (
    <div onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}>
      {render(pos)}
    </div>
  );
}

// Usage
<MouseTracker render={(pos) => <h1>{pos.x}, {pos.y}</h1>} />
```

### 38. What are Fragments?
`<React.Fragment>` (or `<>...</>`) lets you group multiple elements without adding an extra node to the DOM.

```jsx
function Table() {
  return (
    <>
      <td>Hello</td>
      <td>World</td>
    </>
  );
}
```

### 39. What is Error Boundary? (Often asked to write)
A class component that catches JavaScript errors in its child component tree and shows a fallback UI instead of crashing the whole app. (Only class components can be error boundaries.)

```jsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.log('Error caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}
```

### 40. What is code-splitting / React.lazy?
Code-splitting loads parts of your app only when needed, reducing initial bundle size. `React.lazy` lets you dynamically import a component.

```jsx
import React, { lazy, Suspense } from 'react';

const Profile = lazy(() => import('./Profile'));

function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <Profile />
    </Suspense>
  );
}
```

### 41. What is Reconciliation?
The algorithm React uses to compare the new Virtual DOM with the previous one (diffing) and update only the changed parts of the real DOM efficiently.

### 42. What is the significance of keys in Reconciliation?
Keys help React identify which items changed/moved/were removed during reconciliation, so it can reuse existing DOM elements instead of recreating them — this is why unstable keys (like array index with reordering) cause bugs.

### 43. What is Strict Mode?
`<React.StrictMode>` is a development-only tool that highlights potential problems (like unsafe lifecycle methods) by intentionally double-invoking certain functions. It doesn't render any visible UI and has no effect in production.

### 44. What is the difference between `useEffect` cleanup and `componentWillUnmount`?
Both let you clean up (remove event listeners, clear timers). `useEffect`'s cleanup function runs before the *next* effect AND on unmount; `componentWillUnmount` only runs once, on unmount.

### 45. What is Server-Side Rendering (SSR) in React?
SSR renders React components to HTML on the server first (instead of purely in the browser), sending ready-made HTML to the client for faster initial load and better SEO. Frameworks like **Next.js** provide this.

---

## SECTION 6: Ecosystem (Router, Redux, Testing)

### 46. How does React Router work? (Basic setup often asked)
```jsx
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### 47. What is Redux and its 3 core principles?
Redux is a state management library. Core principles:
1. **Single source of truth** – all state lives in one store.
2. **State is read-only** – only way to change it is dispatching an action.
3. **Changes via pure functions** – reducers take state + action, return new state.

```jsx
// Simple reducer
function counterReducer(state = { count: 0 }, action) {
  switch (action.type) {
    case 'INCREMENT': return { count: state.count + 1 };
    default: return state;
  }
}
```

### 48. Redux vs Context API?
Context API is built into React and good for simple, low-frequency updates (like theme, auth user). Redux is better for large apps with complex state, frequent updates, middleware needs (like logging, async calls), and dev tools for debugging.

### 49. How do you test a React component? (basic example using React Testing Library)
```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import Counter from './Counter';

test('increments counter on click', () => {
  render(<Counter />);
  const button = screen.getByText(/count: 0/i);
  fireEvent.click(button);
  expect(screen.getByText(/count: 1/i)).toBeInTheDocument();
});
```

### 50. What is the difference between `React.createElement` and JSX?
JSX is just syntax sugar — every JSX tag is compiled down to a `React.createElement()` call at build time. Writing JSX is easier to read; both produce the exact same result.

```jsx
// These two are identical after compilation:
const a = <h1 className="title">Hi</h1>;
const b = React.createElement('h1', { className: 'title' }, 'Hi');
```

---

## Quick-Revision Cheat Table

| Concept | One-line meaning |
|---|---|
| JSX | HTML-like syntax inside JS |
| Virtual DOM | In-memory copy of real DOM for fast diffing |
| Props | Read-only data passed from parent to child |
| State | Component's own changeable data |
| useState | Hook for local state |
| useEffect | Hook for side effects (fetch, timers, subscriptions) |
| useContext | Hook to access Context without prop drilling |
| useRef | Hook for mutable value / DOM access, no re-render |
| useReducer | Hook for complex state logic |
| useMemo | Caches a computed value |
| useCallback | Caches a function reference |
| React.memo | Skips re-render if props unchanged |
| HOC | Function that wraps a component to add logic |
| Render Props | Function-as-prop pattern to share logic |
| Error Boundary | Class component that catches render errors |
| Reconciliation | React's diffing algorithm |
| Keys | Unique id to help React track list items |

---

*A separate "unified practice" code file is attached — it combines most of the above concepts into one runnable component you can practice typing from memory every day.*
