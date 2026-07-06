# 19 — Top 50 Interview Questions

## Most Asked JavaScript Interview Questions

### 1. What is the difference between `var`, `let`, and `const`?
- `var`: function-scoped, hoisted, can be redeclared
- `let`: block-scoped, hoisted to TDZ, can be reassigned
- `const`: block-scoped, hoisted to TDZ, cannot be reassigned

### 2. Explain hoisting
Hoisting moves variable and function declarations to the top of their scope. `var` declarations are initialized as `undefined`. `let` and `const` are in TDZ (Temporal Dead Zone) until their declaration line.

### 3. What is a closure?
A closure is a function that remembers variables from its outer scope even after the outer function has returned. Used for data privacy, memoization, and maintaining state.

### 4. Explain `this` in JavaScript
`this` is determined by how a function is called:
- Default: global object (undefined in strict mode)
- Method: the object before the dot
- Explicit: set by call/apply/bind
- `new`: the new instance
- Arrow: inherits from enclosing scope

### 5. What is the event loop?
The event loop handles async operations by continuously checking if the call stack is empty, then processing microtasks (Promises), then macrotasks (setTimeout).

### 6. What is the difference between `==` and `===`?
`==` performs type coercion before comparison. `===` requires same type and value. Always use `===`.

### 7. Explain prototypal inheritance
Objects inherit from other objects via the prototype chain. An object's `__proto__` links to its prototype for property lookup.

### 8. What are Promises?
Promises represent eventual completion of async operations. States: pending, fulfilled, rejected. Methods: then, catch, finally, all, race.

### 9. What is async/await?
Syntactic sugar over Promises. `async` makes a function return a Promise. `await` pauses execution until Promise resolves.

### 10. Explain the difference between null and undefined
- `undefined`: variable declared but not assigned
- `null`: intentional absence of value (set by programmer)
- `typeof undefined` = 'undefined'
- `typeof null` = 'object' (bug, never fixed)

### 11. What is event delegation?
Attach one listener to a parent element to handle events on multiple children. Uses `event.target` to identify which child was clicked.

### 12. Explain debouncing and throttling
- **Debounce**: Execute after pause (e.g., search input)
- **Throttle**: Limit execution rate (e.g., scroll handler)

### 13. What is currying?
Transforming a function with multiple arguments into a sequence of single-argument functions.

### 14. What is the difference between deep and shallow copy?
- **Shallow**: Copy top-level properties; nested objects shared by reference
- **Deep**: Complete independent copy of all levels

### 15. How does `setTimeout(fn, 0)` work?
Defers execution to next event loop tick. Runs after current script and all microtasks complete.

### 16-50. [Additional questions covering ES6 features, DOM, performance, security patterns]

---

## Next Steps

Move to [20 — Machine Coding Rounds](20-MACHINE-CODING-ROUNDS.md).
