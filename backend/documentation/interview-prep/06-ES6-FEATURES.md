# 06 — ES6+ Modern JavaScript Features

## Why This File Exists
ES6 (2015) completely transformed JavaScript. Every modern codebase uses these features heavily, and interviewers expect you to know them cold. This document covers every important ES6+ feature with C++ comparisons where applicable.

---

## Destructuring

### Array Destructuring

```javascript
// In C++ you'd do:
// int a = arr[0]; int b = arr[1];

// In JS — elegant shorthand
const [a, b, c] = [1, 2, 3];
console.log(a, b, c); // 1 2 3

// Skip elements
const [first, , third] = [1, 2, 3];
console.log(first, third); // 1 3

// With default values
const [x = 10, y = 20] = [5];
console.log(x, y); // 5 20 (y uses default)

// Swap variables — no temp needed!
let p = 1, q = 2;
[p, q] = [q, p];
console.log(p, q); // 2 1

// Rest element
const [head, ...tail] = [1, 2, 3, 4, 5];
console.log(head); // 1
console.log(tail); // [2, 3, 4, 5]

// Nested destructuring
const [[a1, a2], [b1, b2]] = [[1, 2], [3, 4]];
console.log(a1, a2, b1, b2); // 1 2 3 4
```

### Object Destructuring

```javascript
const user = { name: "Alice", age: 25, city: "Mumbai" };

// Basic
const { name, age } = user;

// Rename
const { name: userName, age: userAge } = user;
console.log(userName); // "Alice"

// Default values
const { name: n, country = "India" } = user;
console.log(country); // "India"

// Nested
const person = {
  name: "Alice",
  address: { city: "Mumbai", zip: "400001" }
};
const { address: { city } } = person;
console.log(city); // "Mumbai"

// In function parameters
function greet({ name, age = 0 }) {
  return `${name} is ${age}`;
}
greet({ name: "Alice", age: 25 }); // "Alice is 25"

// Rest
const { name: nm, ...rest } = user;
console.log(rest); // { age: 25, city: "Mumbai" }
```

---

## Spread Operator (`...`)

### In Arrays

```javascript
// C++ analogy: combining vectors, inserting elements
// In JS:

const arr1 = [1, 2, 3];
const arr2 = [4, 5, 6];

// Combine arrays
const combined = [...arr1, ...arr2]; // [1, 2, 3, 4, 5, 6]

// Clone array (shallow)
const clone = [...arr1]; // [1, 2, 3]

// Insert in middle
const withMiddle = [...arr1, 10, 20, ...arr2]; // [1, 2, 3, 10, 20, 4, 5, 6]

// Convert iterable to array
const str = "hello";
const chars = [...str]; // ["h", "e", "l", "l", "o"]

// Spread into function call
function sum(a, b, c) { return a + b + c; }
const nums = [1, 2, 3];
sum(...nums); // 6 — same as sum(1, 2, 3)

// Math.max with array
Math.max(...[1, 5, 3, 2]); // 5
```

### In Objects

```javascript
const defaults = { theme: "dark", lang: "en" };
const userPrefs = { lang: "fr", fontSize: 14 };

// Merge objects (later properties win)
const config = { ...defaults, ...userPrefs };
// { theme: "dark", lang: "fr", fontSize: 14 }

// Clone object (shallow)
const copy = { ...defaults };

// Add/override properties
const updated = { ...user, age: 26 }; // same as Object.assign
```

## Rest Parameters (`...`)

```javascript
// Collect remaining arguments into array
function sum(...numbers) {
  return numbers.reduce((a, b) => a + b, 0);
}
sum(1, 2, 3, 4, 5); // 15

// Must be LAST parameter
function log(level, ...messages) {
  messages.forEach(msg => console.log(`[${level}]`, msg));
}
log("INFO", "Server started", "Port: 3000");
```

**Spread vs Rest:**
- **Spread:** "Expands" an iterable into individual elements (`...arr` → `1, 2, 3`)
- **Rest:** "Collects" individual arguments into an array (`1, 2, 3` → `...numbers`)

---

## Template Literals

```javascript
const name = "Alice";
const age = 25;

// Basic interpolation
`Hello, ${name}!`       // "Hello, Alice!"
`${name} is ${age}`     // "Alice is 25"

// Expressions
`2 + 2 = ${2 + 2}`     // "2 + 2 = 4"
`${age >= 18 ? "adult" : "minor"}` // "adult"

// Multi-line (no \n needed)
const html = `
  <div>
    <h1>${name}</h1>
    <p>Age: ${age}</p>
  </div>
`;

// Tagged templates (advanced — used in libraries like styled-components)
function highlight(strings, ...values) {
  return strings.reduce((result, str, i) =>
    result + str + (values[i] ? `<b>${values[i]}</b>` : ""), "");
}
const msg = highlight`Hello ${name}, you are ${age} years old`;
// "Hello <b>Alice</b>, you are <b>25</b> years old"
```

---

## Arrow Functions (Quick Reference)

```javascript
// Various forms
const add = (a, b) => a + b;          // Implicit return
const greet = name => `Hello ${name}`; // Single param, no ()
const getObj = () => ({ key: "val" }); // Returning object literal — needs ()
const heavy = (x) => {                 // Multiple statements — needs {}
  const result = x * 2;
  return result;
};

// Key behaviors:
// 1. No own `this` — inherits from enclosing scope
// 2. No `arguments` object
// 3. Cannot be used as constructor (`new` throws error)
// 4. No `prototype` property
```

---

## Enhanced Object Literals

```javascript
const name = "Alice";
const age = 25;

// Shorthand property (if key name = variable name)
const user = { name, age };    // Same as { name: name, age: age }

// Shorthand method
const obj = {
  greet() {                    // Same as greet: function() {}
    return "Hello";
  }
};

// Computed property names
const key = "dynamicKey";
const dynamic = {
  [key]: "value",               // { dynamicKey: "value" }
  [`${key}Upper`]: "VALUE"      // { dynamicKeyUpper: "VALUE" }
};
```

---

## Classes (Quick Reference — Detailed in 03)

```javascript
class Animal {
  #name;                        // Private field (ES2022)

  constructor(name) {
    this.#name = name;
  }

  get name() { return this.#name; }  // Getter

  speak() {                          // Instance method
    return `${this.#name} speaks`;
  }

  static create(name) {              // Static method
    return new Animal(name);
  }
}

class Dog extends Animal {
  constructor(name, breed) {
    super(name);
    this.breed = breed;
  }

  speak() {
    return `${super.speak()} (woof!)`;
  }
}
```

---

## Modules — `import` / `export`

### Named Exports

```javascript
// math.js
export const PI = 3.14159;
export function add(a, b) { return a + b; }
export function multiply(a, b) { return a * b; }

// Can also export at bottom
const subtract = (a, b) => a - b;
export { subtract };

// Rename on export
export { subtract as minus };
```

### Default Export

```javascript
// logger.js
export default class Logger {
  log(msg) { console.log(msg); }
}
// Only ONE default export per file
```

### Importing

```javascript
// Named imports (must match export names)
import { add, multiply } from "./math.js";
import { subtract as sub } from "./math.js"; // Rename on import

// Import all named exports as namespace
import * as Math from "./math.js";
Math.add(1, 2);

// Default import (any name you want)
import Logger from "./logger.js";
import MyLogger from "./logger.js"; // Same — default has no name

// Combined
import Logger, { add, PI } from "./module.js";

// Side-effect only import
import "./polyfill.js";
```

### Dynamic Imports (ES2020)

```javascript
// Import on demand (lazy loading)
async function loadModule() {
  const module = await import("./heavy-module.js");
  module.doWork();
}

// Conditional import
if (condition) {
  const { feature } = await import("./feature.js");
}
```

---

## Optional Chaining (`?.`) — ES2020

```javascript
// In C++ you'd check each step:
// if (user && user.address && user.address.city) { ... }

// In JS with optional chaining:
const city = user?.address?.city;      // undefined if any step is null/undefined

// With methods
user?.greet?.();                        // Call if both user and greet exist

// With arrays
const first = arr?.[0];                // undefined if arr is null/undefined

// Combining with nullish coalescing
const city = user?.address?.city ?? "Unknown";
```

---

## Nullish Coalescing (`??`) — ES2020

```javascript
// Returns right side ONLY if left side is null or undefined
// (Unlike || which triggers for any falsy value)

null ?? "default"       // "default"
undefined ?? "default"  // "default"
0 ?? "default"          // 0  ← THIS is the difference from ||
"" ?? "default"         // "" ← Same here
false ?? "default"      // false

// vs || operator
0 || "default"          // "default" (0 is falsy!)
"" || "default"         // "default" ("" is falsy!)

// Real use case:
const count = getCount() ?? 0;    // 0 only if null/undefined — not if count is 0
const name = getName() || "Anonymous"; // "Anonymous" if empty string too (maybe unwanted)
```

---

## Logical Assignment Operators — ES2021

```javascript
// ||= — assign if left is falsy
let a = null;
a ||= "default";   // a = "default" (null is falsy)

let b = 0;
b ||= 10;          // b = 10 (0 is falsy)

// &&= — assign if left is truthy
let c = "hello";
c &&= "world";     // c = "world" (c was truthy)

let d = null;
d &&= "world";     // d = null (d was falsy, no assignment)

// ??= — assign if left is null/undefined
let e = null;
e ??= "default";   // e = "default"

let f = 0;
f ??= 10;          // f = 0 (0 is not null/undefined)
```

---

## Symbols

```javascript
// Unique identifiers — no two symbols are equal
const id1 = Symbol("id");
const id2 = Symbol("id");
console.log(id1 === id2); // false

// Use case: object property keys that can't clash
const ID = Symbol("id");
const user = {
  [ID]: 123,         // Won't show up in for...in or Object.keys()
  name: "Alice"
};
console.log(user[ID]);    // 123
console.log(Object.keys(user));  // ["name"] — Symbol not included

// Well-known symbols (used to customize built-in behavior)
class MyArray {
  [Symbol.iterator]() { /* make iterable */ }
}
```

---

## Iterators and Generators

### Iterators

An iterable is anything that has a `[Symbol.iterator]` method returning an iterator. Arrays, strings, Maps, Sets are all iterable.

```javascript
// Making a custom iterable
const range = {
  from: 1,
  to: 5,
  [Symbol.iterator]() {
    let current = this.from;
    const last = this.to;
    return {
      next() {
        if (current <= last) {
          return { value: current++, done: false };
        }
        return { value: undefined, done: true };
      }
    };
  }
};

for (const n of range) {
  console.log(n); // 1, 2, 3, 4, 5
}
console.log([...range]); // [1, 2, 3, 4, 5]
```

### Generators

A function that can pause and resume execution — yields values one at a time.

```javascript
function* numberGenerator() {
  yield 1;
  yield 2;
  yield 3;
}

const gen = numberGenerator();
console.log(gen.next()); // { value: 1, done: false }
console.log(gen.next()); // { value: 2, done: false }
console.log(gen.next()); // { value: 3, done: false }
console.log(gen.next()); // { value: undefined, done: true }

// Use in for...of
for (const n of numberGenerator()) {
  console.log(n); // 1, 2, 3
}

// Infinite generator
function* infiniteCounter(start = 0) {
  while (true) {
    yield start++;
  }
}
const counter = infiniteCounter(5);
console.log(counter.next().value); // 5
console.log(counter.next().value); // 6
```

---

## `for...of` vs `for...in`

```javascript
const arr = [10, 20, 30];
const obj = { a: 1, b: 2, c: 3 };

// for...of — iterates VALUES of iterables (arrays, strings, Maps, Sets)
for (const value of arr) {
  console.log(value); // 10, 20, 30
}

for (const char of "hello") {
  console.log(char); // h, e, l, l, o
}

// for...in — iterates KEYS of objects (and array indices)
for (const key in obj) {
  console.log(key);      // "a", "b", "c"
  console.log(obj[key]); // 1, 2, 3
}

// for...in on array (AVOID — includes prototype props)
for (const index in arr) {
  console.log(index);    // "0", "1", "2" (strings! not numbers)
}
// Use for...of or forEach for arrays

// for...in is designed for plain objects, for...of for iterables
```

---

## Map and Set

### `Map` — Key-Value Store with Any Key Type

```javascript
// Unlike plain objects, Map allows ANY key type (objects, functions, etc.)
const map = new Map();

map.set("name", "Alice");       // String key
map.set(1, "one");              // Number key
map.set(true, "yes");           // Boolean key
const keyObj = {};
map.set(keyObj, "object key");  // Object key!

map.get("name");    // "Alice"
map.has("name");    // true
map.delete("name");
map.size;           // Number of entries (not .length)

// Iterate
for (const [key, value] of map) {
  console.log(key, value);
}

map.keys();    // Iterator of keys
map.values();  // Iterator of values
map.entries(); // Iterator of [key, value] pairs

// Create from array of pairs
const map2 = new Map([["a", 1], ["b", 2]]);

// Map vs Object:
// Map: any key type, ordered, has .size, better for frequent add/delete
// Object: string/symbol keys, slightly faster for small data, JSON-serializable
```

### `Set` — Unique Value Collection

```javascript
const set = new Set([1, 2, 3, 2, 1]); // Duplicates removed
console.log(set.size); // 3

set.add(4);
set.has(2);     // true
set.delete(2);

// Iterate
for (const value of set) {
  console.log(value);
}

// Convert to array
[...set]              // [1, 3, 4]
Array.from(set)       // [1, 3, 4]

// Remove duplicates from array — most common use
const unique = [...new Set([1, 2, 2, 3, 3, 3])]; // [1, 2, 3]

// Set operations
const setA = new Set([1, 2, 3, 4]);
const setB = new Set([3, 4, 5, 6]);

// Union
const union = new Set([...setA, ...setB]); // {1,2,3,4,5,6}

// Intersection
const intersection = new Set([...setA].filter(x => setB.has(x))); // {3,4}

// Difference
const difference = new Set([...setA].filter(x => !setB.has(x)));  // {1,2}
```

### `WeakMap` and `WeakSet`

```javascript
// Weak versions — keys (WeakMap) or values (WeakSet) must be objects
// They hold "weak" references — if the object has no other references, it can be garbage collected

const wm = new WeakMap();
let obj = { name: "Alice" };
wm.set(obj, "metadata");
obj = null; // obj can be GC'd, WeakMap entry will be removed automatically

// Use case: private data for objects without preventing garbage collection
const privateData = new WeakMap();
class MyClass {
  constructor() {
    privateData.set(this, { secret: 42 });
  }
  getSecret() {
    return privateData.get(this).secret;
  }
}
```

---

## Interview Questions

### Q1: What is the difference between `spread` and `rest`?
<details>
<summary>Answer</summary>

Both use `...` syntax but in opposite contexts:
- **Spread**: Expands an iterable into individual elements. Used when calling functions or creating arrays/objects: `fn(...arr)`, `[...arr]`, `{...obj}`
- **Rest**: Collects multiple elements into an array. Used in function parameters or destructuring: `function fn(...args)`, `const [first, ...rest] = arr`
</details>

### Q2: What's the output?
```javascript
const { a: x, b: y = 10 } = { a: 1 };
console.log(x, y);
```
<details>
<summary>Answer</summary>

`1 10`

`a` is renamed to `x` and has value `1`. `b` doesn't exist in the object, so `y` gets the default value `10`.
</details>

### Q3: What's the difference between `Map` and a plain object `{}`?
<details>
<summary>Answer</summary>

| Feature | `Map` | `Object` |
|---------|-------|---------|
| Key types | Any type (objects, functions, primitives) | Strings and Symbols only |
| Order | Insertion order guaranteed | Generally insertion order (modern) |
| Size | `.size` property | `Object.keys(obj).length` |
| Iteration | Directly iterable with `for...of` | Need `Object.entries()` |
| Performance | Better for frequent add/delete | Better for small static data |
| JSON | Not serializable by default | `JSON.stringify()` works |

Use `Map` when keys are non-strings or when you need frequent additions/deletions.
</details>

### Q4: What is optional chaining and why is it useful?
<details>
<summary>Answer</summary>

Optional chaining (`?.`) safely accesses nested properties without throwing errors when intermediate values are `null` or `undefined`. Instead of throwing, it short-circuits and returns `undefined`.

```javascript
// Without optional chaining:
const city = user && user.address && user.address.city;

// With optional chaining:
const city = user?.address?.city; // Same result, much cleaner

// Also works for methods and array access:
user?.getName?.();
arr?.[0];
```
</details>

### Q5: When should you use `??` over `||`?
<details>
<summary>Answer</summary>

Use `??` (nullish coalescing) when you want to provide a default only for `null` or `undefined`, NOT for other falsy values like `0`, `""`, or `false`.

```javascript
const count = 0;
count || 10;   // 10 — wrong! 0 is valid, shouldn't be replaced
count ?? 10;   // 0  — correct! 0 is not null/undefined
```
</details>

---

## Exercises

### Exercise 1: Destructuring Challenge

```javascript
// Extract these values from the nested object in one line:
const data = {
  user: {
    name: "Alice",
    scores: [90, 85, 92]
  },
  timestamp: "2024-01-01"
};

// Extract: name, firstScore, timestamp
// Expected: name = "Alice", firstScore = 90, timestamp = "2024-01-01"
```

<details>
<summary>Solution</summary>

```javascript
const { user: { name, scores: [firstScore] }, timestamp } = data;
console.log(name, firstScore, timestamp); // "Alice" 90 "2024-01-01"
```
</details>

### Exercise 2: Implement a `zip` Function

```javascript
// zip([1,2,3], ['a','b','c']) → [[1,'a'], [2,'b'], [3,'c']]
function zip(...arrays) {
  // Your code here
}
```

<details>
<summary>Solution</summary>

```javascript
function zip(...arrays) {
  const length = Math.min(...arrays.map(a => a.length));
  return Array.from({ length }, (_, i) => arrays.map(arr => arr[i]));
}

console.log(zip([1,2,3], ['a','b','c'])); // [[1,'a'], [2,'b'], [3,'c']]
```
</details>

### Exercise 3: Deep Merge Two Objects

```javascript
function deepMerge(target, source) {
  // Merge source into target (nested objects merged recursively)
  // Arrays should be replaced, not merged
}

const a = { x: 1, y: { a: 1, b: 2 } };
const b = { y: { b: 3, c: 4 }, z: 5 };
deepMerge(a, b); // { x: 1, y: { a: 1, b: 3, c: 4 }, z: 5 }
```

<details>
<summary>Solution</summary>

```javascript
function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] instanceof Object &&
      !Array.isArray(source[key]) &&
      key in target &&
      target[key] instanceof Object &&
      !Array.isArray(target[key])
    ) {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}
```
</details>
