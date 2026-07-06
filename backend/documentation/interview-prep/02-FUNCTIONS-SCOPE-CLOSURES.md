# 02 — Functions, Scope & Closures

## Why This File Exists
Closures are the **#1 most-asked** JavaScript interview topic. Scope and hoisting are right behind. If you understand functions, scope, and closures deeply, you can answer ~40% of all JS interview questions. This document covers everything from basic function declarations to the trickiest closure puzzles.

---

## Function Types — The 4 Ways to Create Functions

### In C++ (What You Know)

```cpp
int add(int a, int b) { return a + b; }           // regular function
auto multiply = [](int a, int b) { return a * b; }; // lambda
```

### In JavaScript (What's Different)

JavaScript has **4 ways** to create functions:

#### 1. Function Declaration

```javascript
function greet(name) {
  return "Hello, " + name;
}
console.log(greet("Alice")); // "Hello, Alice"
```

**Key property:** Hoisted entirely — you can call it before it's defined.

```javascript
console.log(greet("Alice")); // "Hello, Alice" — works!
function greet(name) {
  return "Hello, " + name;
}
```

#### 2. Function Expression

```javascript
const greet = function(name) {
  return "Hello, " + name;
};
console.log(greet("Alice")); // "Hello, Alice"
```

**Key property:** NOT hoisted — calling before definition gives an error.

```javascript
console.log(greet("Alice")); // ReferenceError: Cannot access 'greet' before initialization
const greet = function(name) {
  return "Hello, " + name;
};
```

#### 3. Arrow Function (ES6)

```javascript
// Full syntax
const greet = (name) => {
  return "Hello, " + name;
};

// Short syntax (single expression — implicit return)
const greet = (name) => "Hello, " + name;

// Single parameter — no parentheses needed
const double = x => x * 2;

// No parameters
const sayHi = () => "Hi!";

// Returning an object literal (wrap in parentheses)
const createUser = (name) => ({ name: name, active: true });
```

**Key differences from regular functions:**
1. No `this` binding (inherits `this` from surrounding scope)
2. No `arguments` object
3. Cannot be used as constructors (no `new` keyword)
4. No `prototype` property

#### 4. Method Shorthand (ES6)

```javascript
const obj = {
  name: "Alice",
  // Method shorthand
  greet() {
    return "Hello, " + this.name;
  }
  // Same as: greet: function() { ... }
};
```

### Arrow vs Regular — The `this` Difference (CRITICAL)

```javascript
const obj = {
  name: "Alice",

  regularFunc: function() {
    console.log(this.name); // "Alice" — `this` = obj
  },

  arrowFunc: () => {
    console.log(this.name); // undefined — `this` = outer scope (window/global)
  }
};

obj.regularFunc(); // "Alice"
obj.arrowFunc();   // undefined
```

**Why?** Arrow functions don't have their own `this`. They inherit `this` from the **lexical scope** (where they were defined). Regular functions get `this` from **how they're called**.

```javascript
// Practical problem — arrow function in a method
class Timer {
  constructor() {
    this.seconds = 0;
  }

  // BROKEN — arrow function loses `this`
  startBroken() {
    setInterval(function() {
      this.seconds++;       // `this` = window/global, NOT Timer
      console.log(this.seconds); // NaN or undefined
    }, 1000);
  }

  // FIXED — arrow function inherits `this`
  startFixed() {
    setInterval(() => {
      this.seconds++;       // `this` = Timer instance ✓
      console.log(this.seconds);
    }, 1000);
  }
}
```

---

## Scope — Where Variables Live

### In C++ (What You Know)

```cpp
int x = 10;           // global scope
void func() {
  int y = 20;         // function scope
  if (true) {
    int z = 30;       // block scope
  }
  // z not accessible here
}
// y not accessible here
```

### In JavaScript (What's Different)

JavaScript has **3 levels of scope**:

#### 1. Global Scope

```javascript
const globalVar = "I'm global";

function test() {
  console.log(globalVar); // "I'm global" — accessible everywhere
}
test();
console.log(globalVar);   // "I'm global"
```

In browser: `var` globals become properties of `window`. `let`/`const` globals do NOT.

```javascript
var x = 10;
console.log(window.x); // 10 (var attaches to window)

let y = 20;
console.log(window.y); // undefined (let does NOT attach to window)
```

#### 2. Function Scope

```javascript
function test() {
  var funcVar = "I'm function-scoped";
  let funcLet = "Me too";
  const funcConst = "Me three";
}
console.log(funcVar);   // ReferenceError
console.log(funcLet);   // ReferenceError
console.log(funcConst); // ReferenceError
```

All variables inside a function are inaccessible from outside, regardless of `var`/`let`/`const`.

#### 3. Block Scope (New in ES6)

```javascript
if (true) {
  var x = 10;    // function-scoped — leaks out!
  let y = 20;    // block-scoped — stays inside
  const z = 30;  // block-scoped — stays inside
}
console.log(x); // 10
console.log(y); // ReferenceError
console.log(z); // ReferenceError

// Blocks include: if, for, while, switch, try/catch, and standalone {}
{
  let blockScoped = "inside";
}
console.log(blockScoped); // ReferenceError
```

#### The Loop Problem (Classic Interview Question)

```javascript
// PROBLEM with var
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// Output: 3, 3, 3 (not 0, 1, 2!)

// Why? var is function-scoped. There's only ONE `i` variable.
// By the time setTimeout runs, i = 3 (loop finished).

// FIX 1: Use let (block-scoped — creates a new `i` per iteration)
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// Output: 0, 1, 2 ✓

// FIX 2: IIFE (Immediately Invoked Function Expression)
for (var i = 0; i < 3; i++) {
  (function(j) {
    setTimeout(() => console.log(j), 100);
  })(i);
}
// Output: 0, 1, 2 ✓

// FIX 3: Use setTimeout's third argument
for (var i = 0; i < 3; i++) {
  setTimeout(function(j) {
    console.log(j);
  }, 100, i);
}
// Output: 0, 1, 2 ✓
```

---

## Lexical Scope — How JavaScript Finds Variables

JavaScript uses **lexical scoping** — the scope is determined by where functions are **defined**, not where they're **called**.

```javascript
let x = "global";

function outer() {
  let x = "outer";

  function inner() {
    console.log(x); // "outer" — looks in the scope where inner was DEFINED
  }

  inner();
}
outer();
```

**C++ comparison:** Same as C++ — variables are resolved based on where the code is written (static scoping), not where the function is called from.

### Scope Chain

When JavaScript needs a variable, it searches in this order:
1. **Current scope** (local variables)
2. **Outer scope** (enclosing function/block)
3. **Outer-outer scope** (keep going up)
4. **Global scope**
5. If not found → `ReferenceError`

```javascript
let a = "global-a";
let b = "global-b";

function outer() {
  let b = "outer-b";
  let c = "outer-c";

  function inner() {
    let c = "inner-c";
    console.log(a); // "global-a" — not in inner or outer, found in global
    console.log(b); // "outer-b" — not in inner, found in outer
    console.log(c); // "inner-c" — found in inner
  }

  inner();
}
outer();
```

---

## Closures — The Most Important Concept

### What Is a Closure?

A closure is a function that **remembers** the variables from the scope where it was created, even after that scope has finished executing.

### In C++ (What You Know)

C++ has lambdas that can capture variables:

```cpp
int x = 10;
auto closure = [x]() { return x; };
// The lambda captures x by value
```

### In JavaScript (What's Different)

In JS, closures capture by **reference**, not by value. And they work automatically — every function creates a closure.

```javascript
function outer() {
  let count = 0;  // This variable is "closed over"

  function inner() {
    count++;       // inner remembers `count` even after outer returns
    return count;
  }

  return inner;    // We return the function (not the value)
}

const counter = outer(); // outer() finishes, but `count` lives on!
console.log(counter());  // 1
console.log(counter());  // 2
console.log(counter());  // 3
```

**What happened:**
1. `outer()` runs and creates `count = 0`
2. `outer()` returns the `inner` function
3. `outer()`'s execution context is destroyed, BUT `count` survives because `inner` has a reference to it
4. Each call to `counter()` (which is `inner`) accesses and modifies the same `count`

### Why Do We Need Closures?

1. **Data privacy / encapsulation**
2. **Stateful functions (counters, accumulators)**
3. **Partial application / currying**
4. **Callback functions that need access to outer variables**
5. **Module pattern**

### Closure Pattern 1: Private Variables

```javascript
function createUser(name) {
  let loginCount = 0;  // Private — can't be accessed directly

  return {
    getName: () => name,
    login: () => {
      loginCount++;
      return `${name} logged in (${loginCount} times)`;
    },
    getLoginCount: () => loginCount
  };
}

const user = createUser("Alice");
console.log(user.login());        // "Alice logged in (1 times)"
console.log(user.login());        // "Alice logged in (2 times)"
console.log(user.getLoginCount()); // 2
console.log(user.loginCount);     // undefined — private!
console.log(user.name);           // undefined — private!
```

### Closure Pattern 2: Function Factory

```javascript
function multiplier(factor) {
  return (number) => number * factor;
}

const double = multiplier(2);
const triple = multiplier(3);

console.log(double(5));  // 10
console.log(triple(5));  // 15
```

### Closure Pattern 3: Memoization

```javascript
function memoize(fn) {
  const cache = {};
  return function(...args) {
    const key = JSON.stringify(args);
    if (cache[key]) {
      console.log("Cache hit!");
      return cache[key];
    }
    console.log("Computing...");
    const result = fn(...args);
    cache[key] = result;
    return result;
  };
}

const slowAdd = (a, b) => {
  // Simulate expensive computation
  return a + b;
};

const fastAdd = memoize(slowAdd);
console.log(fastAdd(2, 3)); // Computing... 5
console.log(fastAdd(2, 3)); // Cache hit! 5
```

### Closure Pattern 4: Currying

```javascript
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn(...args);
    }
    return function(...moreArgs) {
      return curried(...args, ...moreArgs);
    };
  };
}

function add(a, b, c) {
  return a + b + c;
}

const curriedAdd = curry(add);
console.log(curriedAdd(1)(2)(3));   // 6
console.log(curriedAdd(1, 2)(3));   // 6
console.log(curriedAdd(1)(2, 3));   // 6
```

### Closure Pattern 5: Debounce

```javascript
function debounce(fn, delay) {
  let timerId;
  return function(...args) {
    clearTimeout(timerId);
    timerId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

const handleSearch = debounce((query) => {
  console.log("Searching for:", query);
}, 300);

// User types "hello" quickly — only one search happens
handleSearch("h");
handleSearch("he");
handleSearch("hel");
handleSearch("hell");
handleSearch("hello"); // Only this one fires after 300ms
```

---

## Hoisting — Complete Deep Dive

### What Gets Hoisted?

| Declaration Type | Hoisted? | Initialized? |
|-----------------|----------|--------------|
| `var` | Yes | Yes (as `undefined`) |
| `let` | Yes | No (TDZ) |
| `const` | Yes | No (TDZ) |
| Function declaration | Yes | Yes (with the full function) |
| Function expression | Variable hoisted, function NOT | Depends on `var`/`let`/`const` |
| Arrow function | Variable hoisted, function NOT | Depends on `var`/`let`/`const` |
| Class | Yes | No (TDZ) |

### Function Hoisting Examples

```javascript
// Function declaration — fully hoisted
console.log(greet("Alice")); // "Hello, Alice" — works!
function greet(name) {
  return "Hello, " + name;
}

// Function expression with var — only variable hoisted
console.log(greet2("Alice")); // TypeError: greet2 is not a function
var greet2 = function(name) {
  return "Hello, " + name;
};
// greet2 is undefined at this point, calling undefined() → TypeError

// Function expression with let — TDZ
console.log(greet3("Alice")); // ReferenceError: Cannot access 'greet3' before initialization
let greet3 = function(name) {
  return "Hello, " + name;
};
```

### Hoisting Order — Function Declarations Override Variable Declarations

```javascript
var foo = 1;
function foo() { return 2; }

console.log(typeof foo); // "number"
console.log(foo);        // 1

// Why? Function declarations are hoisted FIRST, then variable declarations.
// But if a var has the same name as a function, the var assignment wins
// because it happens after the function declaration is hoisted.

// JavaScript sees this as:
// function foo() { return 2; }  ← hoisted first
// var foo;                      ← hoisted but ignored (name already taken)
// foo = 1;                      ← assignment runs, overwrites function
```

---

## IIFE — Immediately Invoked Function Expression

### What Is It?

An IIFE is a function that runs as soon as it's defined.

```javascript
// Basic IIFE
(function() {
  console.log("I run immediately!");
})();

// Arrow IIFE
(() => {
  console.log("I also run immediately!");
})();

// IIFE with return value
const result = (function() {
  let x = 10;
  return x * 2;
})();
console.log(result); // 20

// IIFE with parameters
(function(name) {
  console.log("Hello, " + name);
})("Alice");
```

### Why Do We Need IIFEs?

1. **Avoid polluting the global scope** (before `let`/`const` and modules existed)
2. **Create private scope** for variables
3. **Async/await at top level** (before top-level await existed)

```javascript
// Problem: var leaks to global scope
var globalCount = 0;
for (var i = 0; i < 5; i++) {
  globalCount++;
}
console.log(globalCount); // 5
console.log(i);           // 5 — leaked!

// Fix with IIFE
(function() {
  var localCount = 0;
  for (var i = 0; i < 5; i++) {
    localCount++;
  }
  console.log(localCount); // 5
})();
// console.log(localCount); // ReferenceError — not accessible
```

---

## The `arguments` Object

Regular functions (not arrow) have an `arguments` object that holds all passed arguments.

```javascript
function sum() {
  let total = 0;
  for (let i = 0; i < arguments.length; i++) {
    total += arguments[i];
  }
  return total;
}

console.log(sum(1, 2, 3, 4, 5)); // 15

// arguments is NOT an array!
function test() {
  console.log(Array.isArray(arguments)); // false
  console.log(typeof arguments);         // "object"
  // arguments.slice is NOT a function

  // Convert to real array
  const args = Array.from(arguments);
  // or: const args = [...arguments];
  // or: const args = Array.prototype.slice.call(arguments);
}
```

### Rest Parameters (Modern Alternative)

```javascript
function sum(...numbers) {
  return numbers.reduce((total, n) => total + n, 0);
}

console.log(sum(1, 2, 3, 4, 5)); // 15

// `numbers` is a REAL array, not arguments-like object
// Rest parameters must be the LAST parameter
function log(level, ...messages) {
  messages.forEach(msg => console.log(`[${level}] ${msg}`));
}
log("INFO", "Server started", "Port 3000");
```

---

## Default Parameters

```javascript
// Old way (before ES6)
function greet(name) {
  name = name || "World";
  return "Hello, " + name;
}

// ES6 way
function greet(name = "World") {
  return "Hello, " + name;
}

console.log(greet());        // "Hello, World"
console.log(greet("Alice")); // "Hello, Alice"

// Default parameters work with undefined, not null
console.log(greet(undefined)); // "Hello, World"
console.log(greet(null));      // "Hello, null"

// Can use previous parameters in defaults
function createUser(name, role = "user", id = generateId()) {
  return { name, role, id };
}

// Can use expressions as defaults
function calcArea(width = 10, height = width * 2) {
  return width * height;
}
console.log(calcArea());     // 200 (10 * 20)
console.log(calcArea(5));    // 50 (5 * 10)
```

---

## Interview Questions

### Q1: What is a closure? Give an example.
<details>
<summary>Answer</summary>

A closure is a function that retains access to variables from its outer (enclosing) scope even after the outer function has finished executing. Every function in JavaScript creates a closure.

```javascript
function outer() {
  let count = 0;
  return function inner() {
    count++;
    return count;
  };
}
const counter = outer();
counter(); // 1
counter(); // 2 — `count` is preserved between calls
```
</details>

### Q2: What's the output?
```javascript
for (var i = 0; i < 3; i++) {
  setTimeout(function() { console.log(i); }, 1000);
}
```
<details>
<summary>Answer</summary>

`3, 3, 3`

Explanation: `var` is function-scoped, so there's only one `i` variable shared by all iterations. By the time the setTimeout callbacks execute (after 1 second), the loop has finished and `i = 3`. Fix: use `let` instead of `var`.
</details>

### Q3: What's the output?
```javascript
function createFunctions() {
  var result = [];
  for (var i = 0; i < 3; i++) {
    result.push(function() { return i; });
  }
  return result;
}

var funcs = createFunctions();
console.log(funcs[0]());
console.log(funcs[1]());
console.log(funcs[2]());
```
<details>
<summary>Answer</summary>

`3, 3, 3`

Same problem as Q2. All three functions share the same `i` variable (which is 3 when the loop ends). Fix with `let` or IIFE.
</details>

### Q4: What's the output?
```javascript
let a = 10;
function outer() {
  let b = 20;
  function inner() {
    let c = 30;
    console.log(a, b, c);
  }
  inner();
}
outer();
```
<details>
<summary>Answer</summary>

`10 20 30`

`inner` can access `c` (own scope), `b` (outer scope), and `a` (global scope) through the scope chain.
</details>

### Q5: What's the output?
```javascript
var x = 1;
function foo() {
  console.log(x);
  var x = 2;
}
foo();
```
<details>
<summary>Answer</summary>

`undefined`

`var x` inside `foo` is hoisted to the top of the function, shadowing the global `x`. At `console.log(x)`, the local `x` exists but hasn't been assigned yet → `undefined`.
</details>

### Q6: What's the output?
```javascript
function foo() {
  return
  {
    name: "Alice"
  };
}
console.log(foo());
```
<details>
<summary>Answer</summary>

`undefined`

JavaScript's automatic semicolon insertion (ASI) adds a semicolon after `return`, making it `return;`. The object literal on the next line is never reached. Fix: put `{` on the same line as `return`.
</details>

### Q7: What's the difference between a function declaration and a function expression?
<details>
<summary>Answer</summary>

| Feature | Function Declaration | Function Expression |
|---------|---------------------|-------------------|
| Syntax | `function name() {}` | `const name = function() {}` |
| Hoisting | Fully hoisted (can call before definition) | Only variable hoisted (not the function) |
| Name | Required | Optional (can be anonymous) |
| Scope | Hoisted to top of function/global scope | Depends on `var`/`let`/`const` |
</details>

### Q8: What's the output?
```javascript
function greet() {
  console.log("Hello");
}
var greet = function() {
  console.log("Hi");
};
greet();
```
<details>
<summary>Answer</summary>

`"Hi"`

The function expression assigned to `var greet` overwrites the function declaration. The `var greet` declaration is hoisted, but the assignment `= function() { ... }` happens at runtime, replacing the original function.
</details>

### Q9: Implement a function that counts how many times it's been called.
<details>
<summary>Answer</summary>

```javascript
function createCounter() {
  let count = 0;
  return function() {
    count++;
    return count;
  };
}

const counter = createCounter();
console.log(counter()); // 1
console.log(counter()); // 2
console.log(counter()); // 3
```
</details>

### Q10: Implement a once() function that allows a function to be called only once.
<details>
<summary>Answer</summary>

```javascript
function once(fn) {
  let called = false;
  let result;
  return function(...args) {
    if (!called) {
      called = true;
      result = fn(...args);
      return result;
    }
    return result; // Return cached result on subsequent calls
  };
}

const initialize = once(() => {
  console.log("Initializing...");
  return "done";
});

console.log(initialize()); // "Initializing..." → "done"
console.log(initialize()); // "done" (no log — function not called again)
```
</details>

---

## Exercises

### Exercise 1: Private Counter with Methods
Create a counter that has `increment()`, `decrement()`, and `getCount()` methods. The count should be private.

```javascript
function createCounter(start = 0) {
  // Your code here
}

const counter = createCounter(10);
console.log(counter.getCount());  // 10
counter.increment();
counter.increment();
console.log(counter.getCount());  // 12
counter.decrement();
console.log(counter.getCount());  // 11
```

<details>
<summary>Solution</summary>

```javascript
function createCounter(start = 0) {
  let count = start;  // Private variable

  return {
    increment: () => ++count,
    decrement: () => --count,
    getCount: () => count
  };
}
```
</details>

### Exercise 2: Throttle Function
Implement a `throttle(fn, limit)` function that only allows `fn` to be called at most once every `limit` milliseconds.

```javascript
function throttle(fn, limit) {
  // Your code here
}

const log = throttle(() => console.log("called"), 1000);
log(); // "called"
log(); // ignored (less than 1000ms since last call)
```

<details>
<summary>Solution</summary>

```javascript
function throttle(fn, limit) {
  let lastCall = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      return fn(...args);
    }
  };
}
```
</details>

### Exercise 3: Make a Function Callable + Newable
Create a function that works both when called normally and when called with `new`.

```javascript
function Person(name) {
  // Your code here
}

const p1 = Person("Alice");    // called normally
const p2 = new Person("Bob");  // called with new
console.log(p1.name); // "Alice"
console.log(p2.name); // "Bob"
```

<details>
<summary>Solution</summary>

```javascript
function Person(name) {
  // When called with new, `this` is a new object
  // When called without new, `this` is the global object (or undefined in strict mode)
  if (!(this instanceof Person)) {
    return new Person(name);
  }
  this.name = name;
}
```
</details>

### Exercise 4: Predict the Output
```javascript
var x = 10;
function foo() {
  console.log(x);
  var x = 20;
  console.log(x);
}
foo();
console.log(x);
```

<details>
<summary>Solution</summary>

```
undefined  — var x is hoisted inside foo, shadows global x
20         — x is now 20
10         — global x is still 10
```
</details>

### Exercise 5: Implement a Rate Limiter
Create a function that limits how many times a function can be called within a time window.

```javascript
function rateLimit(fn, maxCalls, timeWindow) {
  // Your code here
}

const limited = rateLimit(() => console.log("executed"), 3, 1000);
limited(); // "executed"
limited(); // "executed"
limited(); // "executed"
limited(); // "Rate limit exceeded" (4th call within 1000ms)
```

<details>
<summary>Solution</summary>

```javascript
function rateLimit(fn, maxCalls, timeWindow) {
  const calls = [];

  return function(...args) {
    const now = Date.now();
    // Remove calls outside the time window
    while (calls.length > 0 && calls[0] <= now - timeWindow) {
      calls.shift();
    }

    if (calls.length < maxCalls) {
      calls.push(now);
      return fn(...args);
    } else {
      console.log("Rate limit exceeded");
    }
  };
}
```
</details>

---

## Next Steps
Now that you understand functions, scope, and closures, move on to [03 — Objects & Prototypes](03-OBJECTS-PROTOTYPES.md) to learn about JavaScript's object system and the `this` keyword.
