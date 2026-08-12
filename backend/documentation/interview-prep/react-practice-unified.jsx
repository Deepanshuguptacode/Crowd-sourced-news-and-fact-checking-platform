/*
  UNIFIED REACT PRACTICE FILE
  ----------------------------
  Practice typing this ENTIRE file from scratch every day (no copy-paste)
  until you can write it without looking. It covers, in one place:

  - useState, useEffect, useRef, useContext, useReducer, useMemo, useCallback
  - Custom Hook
  - Controlled form
  - Conditional rendering
  - List rendering with keys
  - React.memo + child component
  - Fetch API call inside useEffect
  - Error Boundary (class component)
  - Basic class component with lifecycle methods

  Goal: build "muscle memory" for the syntax interviewers expect you
  to write live on a whiteboard or shared editor.
*/

import React, {
  useState,
  useEffect,
  useRef,
  useContext,
  useReducer,
  useMemo,
  useCallback,
  createContext,
} from 'react';

/* -------------------------------------------------------
   1. CONTEXT SETUP (avoids prop drilling)
------------------------------------------------------- */
const ThemeContext = createContext('light');

/* -------------------------------------------------------
   2. REDUCER for useReducer (like a mini Redux)
------------------------------------------------------- */
function counterReducer(state, action) {
  switch (action.type) {
    case 'increment':
      return { count: state.count + 1 };
    case 'decrement':
      return { count: state.count - 1 };
    case 'reset':
      return { count: 0 };
    default:
      throw new Error('Unknown action type');
  }
}

/* -------------------------------------------------------
   3. CUSTOM HOOK - reusable fetch logic
------------------------------------------------------- */
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch(url)
      .then((res) => res.json())
      .then((json) => {
        if (isMounted) {
          setData(json);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      });

    // cleanup: avoid setting state on an unmounted component
    return () => {
      isMounted = false;
    };
  }, [url]);

  return { data, loading, error };
}

/* -------------------------------------------------------
   4. CHILD COMPONENT wrapped in React.memo
      (only re-renders when its own props change)
------------------------------------------------------- */
const ChildButton = React.memo(function ChildButton({ onClick, label }) {
  console.log('ChildButton rendered:', label);
  return <button onClick={onClick}>{label}</button>;
});

/* -------------------------------------------------------
   5. ERROR BOUNDARY (must be a class component)
------------------------------------------------------- */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.log('Error caught by boundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return <h2>Something went wrong.</h2>;
    }
    return this.props.children;
  }
}

/* -------------------------------------------------------
   6. SIMPLE CLASS COMPONENT (lifecycle demo)
------------------------------------------------------- */
class LifecycleDemo extends React.Component {
  componentDidMount() {
    console.log('LifecycleDemo mounted');
  }

  componentWillUnmount() {
    console.log('LifecycleDemo will unmount');
  }

  render() {
    return <p>I am a class component demonstrating lifecycle methods.</p>;
  }
}

/* -------------------------------------------------------
   7. MAIN APP - ties everything together
------------------------------------------------------- */
function App() {
  // useState - simple local state
  const [name, setName] = useState('');
  const [submittedName, setSubmittedName] = useState('');

  // useReducer - complex state logic
  const [state, dispatch] = useReducer(counterReducer, { count: 0 });

  // useRef - DOM access without re-render
  const inputRef = useRef(null);

  // useContext - read theme value
  const theme = useContext(ThemeContext);

  // custom hook usage
  const { data, loading, error } = useFetch(
    'https://jsonplaceholder.typicode.com/users'
  );

  // useMemo - cache an expensive calculation
  const doubledCount = useMemo(() => {
    console.log('Recalculating doubledCount...');
    return state.count * 2;
  }, [state.count]);

  // useCallback - cache a function so ChildButton (memoized) doesn't
  // re-render unnecessarily
  const handleIncrement = useCallback(() => {
    dispatch({ type: 'increment' });
  }, []);

  // useEffect - runs once on mount
  useEffect(() => {
    console.log('App mounted');
    return () => console.log('App unmounted');
  }, []);

  // controlled form submit handler
  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmittedName(name);
  };

  const focusInput = () => {
    inputRef.current.focus();
  };

  return (
    <ThemeContext.Provider value="dark">
      <ErrorBoundary>
        <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
          <h1>Unified React Practice</h1>
          <p>Current theme from context: {theme}</p>

          {/* ---- Controlled Form ---- */}
          <form onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
            />
            <button type="submit">Submit</button>
            <button type="button" onClick={focusInput}>
              Focus Input
            </button>
          </form>

          {/* ---- Conditional Rendering ---- */}
          {submittedName ? (
            <p>Hello, {submittedName}!</p>
          ) : (
            <p>No name submitted yet.</p>
          )}

          {/* ---- useReducer counter + useMemo + useCallback + React.memo ---- */}
          <h2>Counter (useReducer): {state.count}</h2>
          <p>Doubled (useMemo): {doubledCount}</p>
          <ChildButton onClick={handleIncrement} label="Increment" />
          <button onClick={() => dispatch({ type: 'decrement' })}>
            Decrement
          </button>
          <button onClick={() => dispatch({ type: 'reset' })}>Reset</button>

          {/* ---- List rendering with keys ---- */}
          <h2>Users (from custom useFetch hook)</h2>
          {loading && <p>Loading users...</p>}
          {error && <p>Error: {error}</p>}
          {data && (
            <ul>
              {data.slice(0, 5).map((user) => (
                <li key={user.id}>{user.name}</li>
              ))}
            </ul>
          )}

          {/* ---- Class component lifecycle demo ---- */}
          <LifecycleDemo />
        </div>
      </ErrorBoundary>
    </ThemeContext.Provider>
  );
}

export default App;

/*
  DAILY PRACTICE CHECKLIST - can you write these from memory?
  [ ] useState syntax
  [ ] useEffect with cleanup function
  [ ] useContext + createContext + Provider
  [ ] useReducer + reducer function + dispatch
  [ ] useRef for DOM focus
  [ ] useMemo for expensive calculation
  [ ] useCallback to prevent child re-render
  [ ] Custom hook (useFetch pattern)
  [ ] React.memo on a child component
  [ ] Controlled form with onChange + onSubmit
  [ ] Conditional rendering (ternary + &&)
  [ ] List rendering with .map() and key
  [ ] Class component with componentDidMount/componentWillUnmount
  [ ] Error Boundary class component
*/
