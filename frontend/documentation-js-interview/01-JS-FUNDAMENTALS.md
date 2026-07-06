# 01 — JavaScript Fundamentals

## Why This File Exists

Every JS interview starts here. You need to explain the basics clearly before diving into closures and async. This file covers variables, strict mode, truthy/falsy, and operators — the foundation everything else builds on.

---

## Variables: `var`, `let`, and `const`

### The Interview Question
> "What's the difference between `var`, `let`, and `const`?"

### The Answer

```javascript
// var — function-scoped, hoisted, can be redeclared
var name = 'Alice';
var name = 'Bob';  // ✓ No error (problematic!)

// let — block-scoped, NOT hoisted (TDZ), can be reassigned
let age = 25;
age = 26;          // ✓ Allowed
let age = 30;      // ✗ Error: already declared

// const — block-scoped, NOT hoisted, CANNOT be reassigned
const PI = 3.14;
PI = 3.15;         // ✗ Error: assignment to constant
```

### Block Scope vs Function Scope

```javascript
function test() {
  if (true) {
    var oldVar = 'I leak outside';
    let blocked = 'I stay inside';
    const alsoBlocked = 'Me too';
  }
  console.log(oldVar);         // ✓ 'I leak outside'
  console.log(blocked);        // ✗ ReferenceError
}
```

**Why `var` leaks:** It uses function scope, not block scope. `let` and `const` respect `{}` blocks.

### Temporal Dead Zone (TDZ)

```javascript
console.log(x);  // ✗ ReferenceError: Cannot access 'x' before initialization
let x = 5;

// vs var (hoisted with undefined)
console.log(y);  // ✓ undefined (then prints 10 after declaration)
var y = 10;
```

**TDZ explained:** Variables declared with `let`/`const` exist in a "dead zone" from the start of the block until their declaration. Accessing them throws an error, not `undefined`.

---

## Strict Mode

```javascript
'use strict';

// 1. Prevents accidental global variables
function oops() {
  x = 10;  // ✗ ReferenceError: x is not defined
}

// 2. Makes this undefined in regular functions (not window)
function showThis() {
  console.log(this);  // undefined (not window object)
}

// 3. Prevents duplicate parameter names
function bad(a, a, b) {  // ✗ SyntaxError
  return a + b;
}

// 4. Throws error on deleting undeletable properties
delete Object.prototype;  // ✗ TypeError
```

**Always use strict mode.** It catches silent errors and makes optimization easier for engines.

---

## Truthy and Falsy Values

### Falsy Values (Only These 6)
```javascript
// All of these become false in conditions:
false
0
-0
0n (BigInt zero)
'' (empty string)
null
undefined
NaN

document.all  // (legacy browser quirk, also falsy)
```

### Truthy Values (Everything Else)
```javascript
// Even these surprising ones:
'0'           // truthy (non-empty string!)
'false'       // truthy (non-empty string!)
[]            // truthy (empty array)
{}            // truthy (empty object)
function(){}  // truthy (empty function)
```

### Common Interview Trap
```javascript
// Which will print?
const items = [];

if (items) {
  console.log('Has items?');  // ✓ Prints! [] is truthy
}

if (items.length) {
  console.log('Length check');  // ✗ Doesn't print (0 is falsy)
}

// Correct check for empty array:
if (items && items.length > 0) {
  // or simply: if (items.length)
}
```

---

## Operators: `==` vs `===`

### The Rule
```javascript
// == allows type coercion (AVOID THIS)
5 == '5'        // true  (string converted to number)
0 == false      // true  (false converts to 0)
null == undefined  // true  (special case)

// === requires same type AND value (ALWAYS USE THIS)
5 === '5'       // false (different types)
0 === false     // false
true === 1      // false
true == 1       // true (avoid!)
```

### Weird Coercion Examples (Interview Gotchas)
```javascript
[] == ![]       // true  ([] → '', ![] → false, '' == false)
'' == false     // true
null == undefined  // true
NaN == NaN      // false  (NaN never equals anything, even itself!)
{} == {}        // false (different object references)
```

### The Safe Pattern
```javascript
// Always use === and !==
if (userInput !== null && userInput !== undefined) {
  // Safe to use userInput
}

// Or use optional chaining (ES2020)
if (userInput?.length) {
  // Safe nullish check
}
```

---

## Short-Circuit Evaluation

```javascript
// && returns first falsy value, or last truthy
const result1 = true && 'hello';   // 'hello'
const result2 = false && 'hello';  // false
const result3 = 5 && 0 && 'world'; // 0 (stops at first falsy)

// || returns first truthy value, or last falsy
const result4 = '' || 'default';   // 'default'
const result5 = 'hi' || 'default'; // 'hi'
const result6 = 0 || false || null;  // null (all falsy, returns last)

// ?? (nullish coalescing) — only null/undefined trigger fallback
const result7 = 0 ?? 'default';    // 0 (0 is not nullish!)
const result8 = null ?? 'default'; // 'default'
const result9 = undefined ?? 100;  // 100
```

### Practical Uses
```javascript
// Default values (ES6+ use parameter defaults instead)
function greet(name) {
  name = name || 'Guest';  // '' would also become 'Guest'
  // Better: name = name ?? 'Guest' (only null/undefined)
  // Best:  function greet(name = 'Guest') {}
}

// Conditional execution
isReady && runFunction();  // Only run if isReady is truthy

// Nullish coalescing for real defaults
const userTheme = settings.theme ?? 'light';  // '' or 0 preserved
```

---

## Type Checking

```javascript
// typeof — works for primitives, fails for null and objects
typeof 'hello'      // 'string'
typeof 42           // 'number'
typeof true         // 'boolean'
typeof undefined    // 'undefined'
typeof Symbol()     // 'symbol'
typeof 10n          // 'bigint'
typeof function(){} // 'function'

typeof null         // 'object' ← KNOWN BUG, never fixed for compat
typeof []           // 'object'
typeof {}           // 'object'
typeof new Date()   // 'object'

// instanceof — checks prototype chain (for objects)
[] instanceof Array           // true
new Date() instanceof Date    // true

// Array.isArray — reliable array check
Array.isArray([])             // true
Array.isArray({})             // false

// Object.prototype.toString — most reliable for all types
Object.prototype.toString.call([]);       // '[object Array]'
Object.prototype.toString.call(null);     // '[object Null]'
Object.prototype.toString.call(new Date); // '[object Date]'
```

---

## Template Literals (ES6)

```javascript
const name = 'Alice';
const age = 30;

// Old way
const oldGreeting = 'Hello ' + name + ', you are ' + age + ' years old';

// Template literal (backticks)
const newGreeting = `Hello ${name}, you are ${age} years old`;

// Multi-line strings
const html = `
  <div class="user">
    <h1>${name}</h1>
    <p>Age: ${age}</p>
  </div>
`;

// Expressions inside ${}
const price = 100;
const tax = 0.08;
const total = `Total: $${(price * (1 + tax)).toFixed(2)}`;  // Total: $108.00
```

---

## Ternary Operator

```javascript
// Instead of:
let status;
if (age >= 18) {
  status = 'adult';
} else {
  status = 'minor';
}

// Use:
const status = age >= 18 ? 'adult' : 'minor';

// Chained (use sparingly — can hurt readability)
const category = age < 13 ? 'child' :
                 age < 20 ? 'teen' :
                 age < 65 ? 'adult' : 'senior';
```

---

## Common Interview Questions

### Q: What happens here?
```javascript
console.log(a);
var a = 1;
console.log(b);
let b = 2;
```
**Answer:**
- First logs `undefined` (var hoisted, initialized as undefined)
- Then throws `ReferenceError` (let in TDZ, not initialized)

### Q: What's logged?
```javascript
const obj = { a: 1 };
const arr = [1, 2];

console.log(typeof obj);   // 'object'
console.log(typeof arr);   // 'object' (arrays are objects!)
console.log(Array.isArray(arr));  // true
```

### Q: Fix this code
```javascript
// Bug: empty string becomes 'Guest'
function greet(name) {
  return `Hello, ${name || 'Guest'}!`;
}
greet('');  // 'Hello, Guest!' — but user might want empty name

// Fix: only default on null/undefined
function greet(name) {
  return `Hello, ${name ?? 'Guest'}!`;
}
```

---

## Next Steps

Move to [02 — Data Types & Type Coercion](02-DATA-TYPES-TYPE-COERCION.md) to understand how JavaScript handles different types and the weird coercion rules that trip up interviews.
