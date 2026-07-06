# 05 — Asynchronous JavaScript

## Why This File Exists
Async JS is the **#2 most-asked** interview topic (~75%). If you understand the event loop, callbacks, Promises, and async/await deeply, you'll ace the hardest async interview questions. This is also where JS differs most dramatically from C++.

---

## The Problem: Why Async at All?

### In C++ (What You Know)

```cpp
// C++ can use threads for concurrent work
#include <thread>
void fetchData() { /* network call — blocks this thread */ }
thread t(fetchData);  // Run in background thread
t.join();             // Wait for it
```

C++ is multi-threaded — you can literally run multiple things at the same time.

### In JavaScript (What's Different)

**JavaScript is single-threaded.** There is only ONE thread, and it runs your code. If JS ever truly "waited" for a network call (like C++ does synchronously), the entire page would freeze — no clicks, no scrolling, nothing.

The solution: **non-blocking async operations** + the **Event Loop**.

```javascript
// Synchronous (BLOCKING) — bad
const data = fetch("https://api.example.com"); // Would freeze page!

// Asynchronous (NON-BLOCKING) — good
fetch("https://api.example.com").then(data => {
  console.log(data); // Runs LATER, when data arrives
});
console.log("This runs IMMEDIATELY after starting fetch");
```

---

## The Event Loop — JavaScript's Secret Weapon

### Mental Model

Think of JavaScript's runtime as having 4 parts:

```
┌─────────────────────────────────────┐
│           CALL STACK                │
│   (Where your code actually runs)   │
│                                     │
│   [ main() ]                        │
│   [ setTimeout callback ]           │
│   [ Promise callback ]              │
└────────────────┬────────────────────┘
                 │ picks from
    ┌────────────▼────────────────────┐
    │         EVENT LOOP              │
    │  (Constantly checks both queues)│
    └─────────┬───────────────────────┘
              │
    ┌─────────▼─────────────────────────────────────┐
    │  MICROTASK QUEUE         MACROTASK QUEUE       │
    │  (High priority)         (Lower priority)      │
    │  - Promise .then()       - setTimeout          │
    │  - queueMicrotask()      - setInterval         │
    │  - MutationObserver      - setImmediate        │
    │                          - I/O events          │
    └───────────────────────────────────────────────┘
```

### How the Event Loop Works (Step by Step)

1. Run the current synchronous code (fills call stack)
2. When the call stack is empty:
   - **First:** Empty the entire Microtask queue (Promises)
   - **Then:** Take ONE task from the Macrotask queue
   - **Then:** Empty Microtask queue again
   - **Repeat**

### Classic Event Loop Question

```javascript
console.log("1");                           // Sync

setTimeout(() => console.log("2"), 0);     // Macrotask (even with 0ms!)

Promise.resolve().then(() => console.log("3")); // Microtask

console.log("4");                           // Sync

// Output: 1, 4, 3, 2
// Explanation:
// Sync runs first: "1", "4"
// Call stack empty → check microtasks: "3"
// Microtask queue empty → take one macrotask: "2"
```

### Advanced Event Loop Question

```javascript
console.log("start");

setTimeout(() => {
  console.log("timeout 1");
  Promise.resolve().then(() => console.log("promise inside timeout"));
}, 0);

setTimeout(() => {
  console.log("timeout 2");
}, 0);

Promise.resolve().then(() => {
  console.log("promise 1");
}).then(() => {
  console.log("promise 2");
});

console.log("end");

// Output:
// start
// end
// promise 1
// promise 2
// timeout 1
// promise inside timeout   ← microtask runs before next macrotask!
// timeout 2
```

**Key rule:** After each macrotask, drain the entire microtask queue before the next macrotask.

---

## Callbacks — The Original Solution

### What Is a Callback?

A callback is a function passed to another function to be called **later** (when an async operation completes).

```javascript
// C++ analogy: function pointer passed to another function
// void doWork(void (*callback)(int result)) { callback(42); }

// JS equivalent:
function doWork(callback) {
  setTimeout(() => {
    callback(42); // Call when done
  }, 1000);
}

doWork((result) => {
  console.log("Got:", result); // "Got: 42" after 1 second
});
```

### Callback Hell — The Problem

```javascript
// Nested callbacks become unreadable
getUser(userId, function(user) {
  getProfile(user.id, function(profile) {
    getPosts(profile.id, function(posts) {
      getComments(posts[0].id, function(comments) {
        // Pyramid of doom!
        console.log(comments);
      }, handleError);
    }, handleError);
  }, handleError);
}, handleError);
```

**Problems with callbacks:**
1. Hard to read (pyramid of doom)
2. Error handling is painful (each level needs its own error callback)
3. Hard to compose/combine operations
4. Can't use `try/catch` for async errors

---

## Promises — The Modern Solution

### What Is a Promise?

A Promise represents a value that may not be available yet but will be at some point. It's like a "receipt" for an async operation.

```javascript
// Think of it like ordering food:
// You get a receipt (Promise) immediately
// The food (value) comes later
const receipt = restaurant.order("pizza");
// ...do other things while waiting...
receipt.then(food => eat(food)); // Called when pizza is ready
```

### Creating a Promise

```javascript
const promise = new Promise((resolve, reject) => {
  // Do async work here
  setTimeout(() => {
    const success = true;
    if (success) {
      resolve("Data loaded!");  // Fulfill with value
    } else {
      reject(new Error("Failed to load")); // Reject with error
    }
  }, 1000);
});
```

**Promise States:**
| State | Description | Can transition to |
|-------|-------------|-------------------|
| `pending` | Initial state | `fulfilled` or `rejected` |
| `fulfilled` | Operation succeeded | (final state) |
| `rejected` | Operation failed | (final state) |

### Using a Promise — `.then()`, `.catch()`, `.finally()`

```javascript
fetch("https://api.example.com/users")
  .then(response => response.json())         // Called if fetch succeeds
  .then(data => console.log(data))           // Called with parsed JSON
  .catch(error => console.error(error))      // Called if ANY step fails
  .finally(() => console.log("Done!"));      // Always called

// .then() can take two arguments: onFulfilled, onRejected
promise.then(
  value => console.log("Success:", value),
  error => console.log("Error:", error)
);
// But .catch() is preferred for errors
```

### Promise Chaining

```javascript
// Each .then() returns a NEW Promise
fetch("/api/user/1")
  .then(response => {
    if (!response.ok) throw new Error("HTTP error " + response.status);
    return response.json();        // Returns a value → next .then() gets it
  })
  .then(user => {
    return fetch(`/api/posts/${user.id}`); // Returns a Promise → chained!
  })
  .then(response => response.json())
  .then(posts => console.log(posts))
  .catch(error => console.error("Anywhere in chain:", error));
```

### Static Promise Methods — Critical for Interviews

#### `Promise.resolve(value)` and `Promise.reject(reason)`

```javascript
// Create immediately resolved/rejected promises
const p1 = Promise.resolve(42);         // Already fulfilled
const p2 = Promise.reject(new Error("oops")); // Already rejected

p1.then(v => console.log(v));  // 42
p2.catch(e => console.log(e)); // Error: oops
```

#### `Promise.all(iterable)` — All or Nothing

```javascript
const p1 = fetch("/api/users");
const p2 = fetch("/api/posts");
const p3 = fetch("/api/comments");

Promise.all([p1, p2, p3])
  .then(([users, posts, comments]) => {
    // ALL three succeeded — runs when ALL are done
    console.log(users, posts, comments);
  })
  .catch(error => {
    // ANY one failed — rejects immediately
    console.error("One failed:", error);
  });
```

**Use when:** You need ALL results and can't proceed if ANY fails.

#### `Promise.allSettled(iterable)` — Wait for All (ES2020)

```javascript
Promise.allSettled([p1, p2, failingPromise])
  .then(results => {
    results.forEach(result => {
      if (result.status === "fulfilled") {
        console.log("Success:", result.value);
      } else {
        console.log("Failed:", result.reason);
      }
    });
  });
// Never rejects — always gives you all results
```

**Use when:** You want results of ALL operations, even if some fail.

#### `Promise.race(iterable)` — First One Wins

```javascript
const timeout = new Promise((_, reject) =>
  setTimeout(() => reject(new Error("Timeout")), 5000)
);

Promise.race([fetch("/api/data"), timeout])
  .then(result => console.log("Got data:", result))
  .catch(err => console.log("Timed out or failed:", err));
```

**Use when:** You want the FIRST result (for timeouts, racing requests).

#### `Promise.any(iterable)` — First SUCCESS (ES2021)

```javascript
Promise.any([
  fetch("https://server1.com"),
  fetch("https://server2.com"),
  fetch("https://server3.com")
])
  .then(result => console.log("First to succeed:", result))
  .catch(err => console.log("ALL failed:", err)); // AggregateError
```

**Use when:** You want the first SUCCESS (ignores failures).

**Comparison Table:**

| Method | Resolves when | Rejects when |
|--------|---------------|--------------|
| `all` | ALL succeed | ANY fails |
| `allSettled` | ALL complete (any result) | Never |
| `race` | FIRST completes | FIRST fails |
| `any` | FIRST succeeds | ALL fail |

---

## Async/Await — Syntactic Sugar for Promises

### What Is It?

`async/await` is syntax that makes Promise-based code look synchronous. Under the hood, it's still Promises.

```javascript
// Promise version
function getUser(id) {
  return fetch(`/api/users/${id}`)
    .then(res => res.json())
    .then(user => user)
    .catch(err => { throw err; });
}

// Async/await version (SAME thing, just cleaner)
async function getUser(id) {
  const response = await fetch(`/api/users/${id}`);
  const user = await response.json();
  return user;
}
```

### Rules of `async/await`

1. `async` functions **always return a Promise**
2. `await` can only be used **inside `async` functions**
3. `await` pauses the function (not the entire thread!) until the Promise resolves
4. If the Promise rejects, `await` throws — use `try/catch`

```javascript
async function example() {
  // This returns a Promise, even if you return a plain value
  return 42;
}

example().then(v => console.log(v)); // 42

// await unwraps the Promise
const value = await example(); // 42
```

### Error Handling with Async/Await

```javascript
// Using try/catch (recommended)
async function fetchUser(id) {
  try {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    const user = await response.json();
    return user;
  } catch (error) {
    console.error("Failed to fetch user:", error);
    throw error; // Re-throw if caller needs to know
  }
}

// Calling async functions
async function main() {
  try {
    const user = await fetchUser(1);
    console.log(user);
  } catch (err) {
    console.log("Caught in main:", err);
  }
}
```

### Sequential vs Parallel Async

```javascript
// SEQUENTIAL — takes 2 seconds total (wasteful if independent)
async function sequential() {
  const user = await fetchUser(1);     // Wait 1s
  const posts = await fetchPosts(1);   // THEN wait 1s
  return { user, posts };
}

// PARALLEL — takes ~1 second total (both run simultaneously)
async function parallel() {
  const [user, posts] = await Promise.all([
    fetchUser(1),     // Start both at same time
    fetchPosts(1)     // Run simultaneously
  ]);
  return { user, posts };
}
```

**Interview insight:** Always prefer `Promise.all` when fetches are independent.

### Common Async/Await Mistakes

#### Mistake 1: Forgetting `await`

```javascript
async function bad() {
  const response = fetch("/api/data"); // FORGOT await — response is a Promise!
  const json = response.json();        // TypeError: response.json is not a function
}

async function good() {
  const response = await fetch("/api/data"); // ✓
  const json = await response.json();        // ✓
}
```

#### Mistake 2: `await` in non-async function

```javascript
// SyntaxError
function bad() {
  const data = await fetch("/api"); // Error: await is only valid in async functions
}

async function good() {
  const data = await fetch("/api"); // ✓
}
```

#### Mistake 3: Not handling errors

```javascript
// Unhandled rejection — bad
async function bad() {
  const data = await fetch("https://will-fail.com"); // Unhandled if fails!
}

// Always use try/catch or .catch()
async function good() {
  try {
    const data = await fetch("https://will-fail.com");
  } catch (err) {
    console.error(err);
  }
}
```

#### Mistake 4: Awaiting in loops (sequential when could be parallel)

```javascript
// SLOW — each request waits for previous
async function slow(ids) {
  const results = [];
  for (const id of ids) {
    const user = await fetchUser(id); // Sequential!
    results.push(user);
  }
  return results;
}

// FAST — all requests run simultaneously
async function fast(ids) {
  return Promise.all(ids.map(id => fetchUser(id)));
}
```

---

## Timers — `setTimeout` and `setInterval`

```javascript
// setTimeout — run once after delay
const timerId = setTimeout(() => {
  console.log("Runs after 2 seconds");
}, 2000);

clearTimeout(timerId); // Cancel it

// setInterval — run repeatedly
const intervalId = setInterval(() => {
  console.log("Runs every second");
}, 1000);

clearInterval(intervalId); // Stop it

// Recursive setTimeout (better than setInterval for variable timing)
function repeat() {
  doWork();
  setTimeout(repeat, 1000); // Schedule next only after current completes
}
repeat();
```

### `setTimeout(fn, 0)` — Defer to Next Iteration

```javascript
console.log("1");
setTimeout(() => console.log("2"), 0); // 0ms delay — still async!
console.log("3");
// Output: 1, 3, 2
// Even with 0ms, setTimeout is a macrotask — runs after sync code
```

---

## Interview Questions

### Q1: What's the output?
```javascript
console.log("A");

setTimeout(() => console.log("B"), 0);

Promise.resolve().then(() => console.log("C"));

console.log("D");
```
<details>
<summary>Answer</summary>

`A, D, C, B`

Sync runs first (A, D). Then microtask queue is drained (Promise → C). Then macrotask queue (setTimeout → B).
</details>

### Q2: What's the output?
```javascript
async function foo() {
  console.log("1");
  await Promise.resolve();
  console.log("2");
}

console.log("3");
foo();
console.log("4");
```
<details>
<summary>Answer</summary>

`3, 1, 4, 2`

- "3" runs (sync)
- `foo()` called: "1" runs, hits `await` → suspends foo, schedules resume as microtask
- "4" runs (sync continues)
- Call stack empty → microtask runs → "2"
</details>

### Q3: What is the difference between `Promise.all` and `Promise.allSettled`?
<details>
<summary>Answer</summary>

- `Promise.all`: Resolves when ALL promises resolve; **rejects immediately** if ANY promise rejects. Returns array of values.
- `Promise.allSettled`: Waits for ALL promises to settle (resolve or reject). **Never rejects**. Returns array of `{status, value/reason}` objects.

Use `all` when you need all or nothing. Use `allSettled` when you want partial results even if some fail.
</details>

### Q4: How do you convert a callback-based function to Promise-based?
<details>
<summary>Answer</summary>

```javascript
// Original callback style
function readFile(path, callback) {
  // callback(error, data)
}

// Promisified version (this is what util.promisify does in Node.js)
function readFilePromise(path) {
  return new Promise((resolve, reject) => {
    readFile(path, (error, data) => {
      if (error) reject(error);
      else resolve(data);
    });
  });
}

// Usage
const data = await readFilePromise("./file.txt");
```
</details>

### Q5: What's wrong with this code?
```javascript
async function fetchAll(ids) {
  const results = [];
  for (const id of ids) {
    const data = await fetch(`/api/${id}`);
    results.push(data);
  }
  return results;
}
```
<details>
<summary>Answer</summary>

It's sequential — each fetch waits for the previous one to complete. For N items, it takes N × (average request time). Fix with `Promise.all`:

```javascript
async function fetchAll(ids) {
  return Promise.all(ids.map(id => fetch(`/api/${id}`)));
}
```
</details>

### Q6: What is the Event Loop?
<details>
<summary>Answer</summary>

The event loop is JavaScript's mechanism for handling asynchronous operations in a single-threaded environment. It works by:

1. Running all synchronous code first (call stack)
2. When the stack is empty, processing all microtasks (Promise callbacks)
3. Then processing one macrotask (setTimeout, setInterval, I/O)
4. Then microtasks again, then next macrotask — repeating forever

This allows JS to be non-blocking without using multiple threads.
</details>

### Q7: What's the difference between `async/await` and Promises?
<details>
<summary>Answer</summary>

They're the same thing — `async/await` is syntactic sugar built on Promises:
- `async function` always returns a Promise
- `await` pauses the async function and waits for a Promise to settle
- `await` turns a rejected Promise into a thrown exception (caught by `try/catch`)
- Promises use `.then()/.catch()` chaining; async/await looks synchronous

Both have the same capabilities; async/await is generally more readable.
</details>

---

## Exercises

### Exercise 1: Implement `Promise.all` from Scratch

```javascript
function myPromiseAll(promises) {
  // Your code here
}

// Test
myPromiseAll([
  Promise.resolve(1),
  Promise.resolve(2),
  Promise.resolve(3)
]).then(console.log); // [1, 2, 3]
```

<details>
<summary>Solution</summary>

```javascript
function myPromiseAll(promises) {
  return new Promise((resolve, reject) => {
    const results = [];
    let completed = 0;

    if (promises.length === 0) {
      resolve([]);
      return;
    }

    promises.forEach((promise, index) => {
      Promise.resolve(promise).then(value => {
        results[index] = value;  // Preserve order!
        completed++;
        if (completed === promises.length) {
          resolve(results);
        }
      }).catch(reject); // Any rejection rejects all
    });
  });
}
```
</details>

### Exercise 2: Add Timeout to a Promise

```javascript
function withTimeout(promise, ms) {
  // Return a promise that rejects if `promise` takes longer than `ms`
}

// Test
const slowFetch = new Promise(resolve => setTimeout(() => resolve("data"), 5000));
withTimeout(slowFetch, 1000)
  .then(console.log)
  .catch(e => console.log(e.message)); // "Timeout after 1000ms"
```

<details>
<summary>Solution</summary>

```javascript
function withTimeout(promise, ms) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
}
```
</details>

### Exercise 3: Retry on Failure

```javascript
async function retry(fn, attempts, delay) {
  // Retry fn up to `attempts` times with `delay`ms between retries
}

// Test
let count = 0;
const unstable = () => new Promise((resolve, reject) => {
  count++;
  if (count < 3) reject(new Error("fail"));
  else resolve("success");
});

retry(unstable, 5, 100).then(console.log); // "success"
```

<details>
<summary>Solution</summary>

```javascript
async function retry(fn, attempts, delay) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === attempts - 1) throw err; // Last attempt — rethrow
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```
</details>

### Exercise 4: Predict the Output (Tricky)

```javascript
const p = new Promise((resolve) => {
  resolve(1);
  resolve(2);   // What happens?
  resolve(3);
});

p.then(v => console.log(v));
```

<details>
<summary>Solution</summary>

Output: `1`

A Promise can only be resolved once. Once `resolve(1)` is called, the Promise is settled (fulfilled). Subsequent `resolve(2)` and `resolve(3)` calls are silently ignored.
</details>
