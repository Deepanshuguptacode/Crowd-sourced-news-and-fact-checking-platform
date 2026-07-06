# 11 — Event Loop & Concurrency

## Why This File Exists

The event loop is the most asked JavaScript interview topic. Understanding call stack, task queue, and microtasks is essential for predicting code execution order.

---

## Event Loop Components

```
┌─────────────────────────────────────────┐
│              Call Stack                 │  ← Synchronous code runs here
│   (LIFO: Last In, First Out)            │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  Microtask Queue (Promises, queueMicrotask) │  ← Higher priority
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  Task Queue/Macrotasks (setTimeout, etc) │  ← Lower priority
└─────────────────────────────────────────┘
```

---

## Execution Order

```javascript
console.log('1');                    // Sync → 1
setTimeout(() => console.log('2'), 0);  // Macrotask → 2
Promise.resolve().then(() => {
  console.log('3');                  // Microtask → 3
});
console.log('4');                    // Sync → 4

// Output: 1, 4, 3, 2
// Microtasks run before next macrotask!
```

---

## Macrotasks vs Microtasks

```javascript
setTimeout(() => console.log('timeout 1'), 0);  // Macrotask
Promise.resolve().then(() => console.log('promise 1'));  // Microtask
setTimeout(() => console.log('timeout 2'), 0);  // Macrotask
Promise.resolve().then(() => console.log('promise 2'));  // Microtask

// Output: promise 1, promise 2, timeout 1, timeout 2
// All microtasks execute before any macrotask
```

---

## Common Interview Question

```javascript
console.log('Start');
setTimeout(() => console.log('Timeout 1'), 0);
Promise.resolve().then(() => {
  console.log('Promise 1');
  Promise.resolve().then(() => console.log('Promise 2'));
});
console.log('End');

// Output:
// Start
// End
// Promise 1
// Promise 2  (microtasks are processed until queue is empty)
// Timeout 1
```

---

## Next Steps

Move to [12 — Design Patterns in JS](12-DESIGN-PATTERNS.md).
