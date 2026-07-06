# 01 — JavaScript Fundamentals

## Why This File Exists
If you're coming from C++, you already know what variables, types, and operators are. But JavaScript handles them **very differently**. This document explains JS fundamentals by comparing them with what you already know, so you can avoid the common traps that catch C++ developers.

---

## Variable Declarations

### In C++ (What You Know)

```cpp
int x = 5;          // integer, fixed type
string name = "JS"; // string, fixed type
const int MAX = 100; // cannot be changed
```

In C++, you declare the type explicitly. Once `int x`, it's always an `int`.

### In JavaScript (What's Different)

JavaScript has **three** ways to declare variables, and **no type keyword** — the type is figured out automatically.

```javascript
var x = 5;          // OLD WAY — avoid in modern code
let y = 10;         // MODERN WAY — can be reassigned
const z = 15;       // MODERN WAY — cannot be reassigned
```

### `var` vs `let` vs `const` — The Complete Breakdown

| Feature | `var` | `let` | `const` |
|---------|-------|-------|---------|
| Scope | Function-scoped | Block-scoped | Block-scoped |
| Reassignable | Yes | Yes | No |
| Hoisted | Yes (initialized as `undefined`) | Yes (NOT initialized — TDZ) | Yes (NOT initialized — TDZ) |
| Can redeclare same name | Yes | No (SyntaxError) | No (SyntaxError) |

#### What is Scope?

```javascript
// var is function-scoped — ignores {} blocks
if (true) {
  var x = 10;
}
console.log(x); // 10 — x "leaked" out of the if block!

// let/const are block-scoped — respect {} blocks
if (true) {
  let y = 20;
  const z = 30;
}
console.log(y); // ReferenceError: y is not defined
console.log(z); // ReferenceError: z is not defined
```

**C++ comparison:** `let` and `const` behave like C++ variables declared inside `{}` — they don't exist outside. `var` is weird — it ignores blocks and only respects function boundaries.

```javascript
// var only respects function boundaries
function test() {
  if (true) {
    var a = 1;  // exists everywhere inside test()
  }
  console.log(a); // 1 — works!
}
test();
console.log(a);   // ReferenceError — a is inside function only
```

#### What is Hoisting?

Hoisting means JavaScript **moves declarations to the top** of their scope during compilation (before code runs).

```javascript
// var hoisting
console.log(a); // undefined (NOT an error — var is hoisted with default value)
var a = 5;
// JavaScript sees this as:
// var a;           ← declaration moved to top
// console.log(a);  // undefined
// a = 5;           ← assignment stays in place

// let/const hoisting (Temporal Dead Zone)
console.log(b); // ReferenceError: Cannot access 'b' before initialization
let b = 10;
// The variable IS hoisted, but it's in a "dead zone" until the actual line
// This dead zone = Temporal Dead Zone (TDZ)
```

**C++ comparison:** In C++, using a variable before declaration is a **compile error**. In JS, `var` silently gives you `undefined`, and `let/const` throw a `ReferenceError`. Neither is like C++.

#### `const` Doesn't Mean "Immutable Object"

```javascript
const name = "Alice";
name = "Bob"; // TypeError: Assignment to constant variable

const arr = [1, 2, 3];
arr.push(4);   // WORKS! arr is now [1, 2, 3, 4]
arr[0] = 99;   // WORKS! arr is now [99, 2, 3, 4]
arr = [5, 6];  // TypeError: Assignment to constant variable

const obj = { x: 1 };
obj.x = 2;     // WORKS! obj is now { x: 2 }
obj.y = 3;     // WORKS! obj is now { x: 2, y: 3 }
obj = { x: 5 }; // TypeError
```

**Key insight:** `const` prevents **reassignment** (pointing to a new value), but does NOT prevent **mutation** (changing the contents of an object/array).

**C++ comparison:** Think of `const` in JS like a `const` pointer in C++:
```cpp
int* const ptr = &arr;  // ptr can't point elsewhere, but *ptr can change
// Same idea: const arr in JS can't point to a new array, but can modify elements
```

#### Rule of Thumb
- Use `const` by default
- Use `let` only when you need to reassign (counters, accumulators)
- Never use `var` in modern code

---

## Data Types

### In C++ (What You Know)

```cpp
int x = 5;           // integer
double y = 3.14;     // floating point
char c = 'A';        // single character
string s = "hello";  // string
bool b = true;       // boolean
```

Each type is explicit and fixed. An `int` can never become a `string`.

### In JavaScript (What's Different)

JavaScript has **8 data types**, divided into **primitives** and **objects**.

#### Primitive Types (7)

| Type | Example | C++ Equivalent |
|------|---------|----------------|
| `Number` | `42`, `3.14`, `NaN`, `Infinity` | `int` + `double` combined (JS has no separate int type) |
| `String` | `"hello"`, `'world'`, `` `template` `` | `std::string` |
| `Boolean` | `true`, `false` | `bool` |
| `undefined` | `undefined` | No equivalent — means "declared but not assigned" |
| `null` | `null` | `nullptr` — means "intentionally empty" |
| `BigInt` | `9007199254740991n` | `long long` / `bigint` |
| `Symbol` | `Symbol('id')` | No equivalent — unique identifier |

#### Object Type (1)

| Type | Example | C++ Equivalent |
|------|---------|----------------|
| `Object` | `{ name: "Alice" }`, arrays, functions, dates | `struct` / `class` / `std::map` |

**Key difference:** In C++, `int` and `double` are separate types. In JS, they're both `Number` (64-bit floating point). There's no integer type for normal numbers.

```javascript
console.log(typeof 42);        // "number"
console.log(typeof 3.14);      // "number" — same type!
console.log(typeof 9007199254740991n); // "bigint" — only with 'n' suffix
```

#### `undefined` vs `null` — A Common Interview Question

```javascript
let a;
console.log(a);      // undefined — declared but no value assigned
console.log(typeof a); // "undefined"

let b = null;
console.log(b);       // null — intentionally set to "nothing"
console.log(typeof b); // "object" — THIS IS A BUG IN JS (historic mistake)

// Comparison
console.log(null == undefined);  // true  (loose equality — they're "equal")
console.log(null === undefined); // false (strict equality — different types)
```

**C++ comparison:** Think of `undefined` as an uninitialized variable in C++ (contains garbage), and `null` as `nullptr` (explicitly set to nothing).

#### Why Two "Nothing" Values?

- `undefined` = the system/default "no value" — JS assigns this automatically
- `null` = the developer's "no value" — you explicitly set it

```javascript
function greet(name) {
  console.log(name); // undefined if caller didn't pass an argument
}

let data = null; // I'm explicitly saying "no data yet, but I'll add some later"
```

---

## Type Coercion — The Biggest JS Trap

### In C++ (What You Know)

```cpp
int x = 3.14;  // x = 3 (implicit conversion, truncates decimal)
string s = 5;   // COMPILE ERROR — can't assign int to string
```

C++ does some implicit conversions but is generally strict. You can't accidentally turn a number into a string.

### In JavaScript (What's Different)

JavaScript **automatically converts types** all the time. This is called **type coercion**, and it's the source of many interview questions.

#### Implicit Coercion (JavaScript Does It Automatically)

```javascript
// String concatenation — number becomes string
console.log("5" + 3);     // "53"  (not 8!)
console.log("Hello" + 5); // "Hello5"

// Arithmetic — string becomes number
console.log("5" - 3);     // 2  (subtraction forces numeric conversion)
console.log("5" * "3");   // 15
console.log("10" / 2);    // 5

// Comparison — weird results
console.log(0 == false);       // true  (false → 0)
console.log("" == false);      // true  ("" → 0, false → 0)
console.log(null == undefined); // true (special rule)
console.log("1" == 1);         // true  ("1" → 1)
```

#### The `==` vs `===` Rule

```javascript
// == (loose equality) — converts types before comparing
console.log(5 == "5");   // true
console.log(0 == "");    // true
console.log(0 == false); // true

// === (strict equality) — NO type conversion, must match type AND value
console.log(5 === "5");   // false
console.log(0 === "");    // false
console.log(0 === false); // false
```

**Rule: ALWAYS use `===` in interviews and real code.** `==` is a trap.

**C++ comparison:** C++ has no `===`. In C++, `5 == "5"` wouldn't even compile. JS's `==` tries to "help" by converting types, but it creates more bugs than it solves.

#### Coercion Rules Table (Memorize for Interviews)

| Expression | Result | Why |
|-----------|--------|-----|
| `"" + 0` | `"0"` | Number → String for `+` |
| `"" - 0` | `0` | String → Number for `-` |
| `true + true` | `2` | `true` → `1` |
| `true + false` | `1` | `true` → `1`, `false` → `0` |
| `false > null` | `false` | Both → `0`, `0 > 0` is false |
| `false >= null` | `true` | Both → `0`, `0 >= 0` is true |
| `"b" + "a" + +"a" + "a"` | `"baNaNa"` | `+"a"` → `NaN`, then `"NaN" + "a"` |
| `[] + []` | `""` | Arrays → `""` via `.toString()` |
| `{} + []` | `0` | `{}` is empty block, `+[]` → `0` |
| `[] + {}` | `"[object Object]"` | `[]` → `""`, `{}` → `"[object Object]"` |

#### Explicit Coercion (You Do It Intentionally)

```javascript
// To String
String(123);        // "123"
(123).toString();   // "123"
String(true);       // "true"
String(null);       // "null"
String(undefined);  // "undefined"
String([1,2,3]);    // "1,2,3"

// To Number
Number("42");       // 42
Number("3.14");     // 3.14
Number("");         // 0
Number(" ");        // 0
Number("hello");    // NaN
Number(true);       // 1
Number(false);      // 0
Number(null);       // 0
Number(undefined);  // NaN

// Shortcut: Unary plus
+"42";    // 42
+true;    // 1
+null;    // 0
+undefined; // NaN
+"hello"; // NaN

// To Boolean
Boolean(0);         // false
Boolean("");        // false
Boolean(null);      // false
Boolean(undefined); // false
Boolean(NaN);       // false
Boolean(1);         // true
Boolean("hello");   // true
Boolean([]);        // true — empty array is truthy!
Boolean({});        // true — empty object is truthy!

// Shortcut: Double NOT
!!0;        // false
!!"hello";  // true
!!null;     // false
```

#### Falsy Values (Memorize These)

Only these 7 values are falsy in JavaScript:
```javascript
false, 0, -0, 0n, "", null, undefined, NaN
```

**Everything else is truthy**, including:
```javascript
"0"          // string with "0" is truthy!
"false"      // string with "false" is truthy!
[]           // empty array is truthy!
{}           // empty object is truthy!
function(){} // empty function is truthy!
Infinity     // truthy
-Infinity    // truthy
```

**C++ comparison:** In C++, `0`, `nullptr`, and `false` are falsy. In JS, there are 7 falsy values, and some surprising things are truthy (like `[]` and `{}`).

---

## Operators

### Comparison Operators

```javascript
// Relational
5 > 3       // true
5 >= 5      // true
3 < 5       // true
3 <= 3      // true

// Equality
5 == "5"    // true  (loose — type coercion)
5 === "5"   // false (strict — no coercion)
5 != "5"    // false (loose inequality)
5 !== "5"   // true  (strict inequality)
```

### Logical Operators

```javascript
// AND, OR, NOT
true && true    // true
true && false   // false
true || false   // true
!true           // false

// Short-circuit evaluation (IMPORTANT for interviews)
const name = user && user.name;  // if user is null, returns null (not error)
const value = input || "default"; // if input is falsy, returns "default"

// && returns the first FALSY value or the LAST value
console.log(1 && 2 && 3);       // 3 (all truthy → returns last)
console.log(1 && 0 && 3);       // 0 (0 is falsy → returns it)
console.log(1 && null && 3);    // null

// || returns the first TRUTHY value or the LAST value
console.log(0 || "" || "hello"); // "hello" (first truthy)
console.log(0 || "" || false);   // false (all falsy → returns last)
console.log(1 || 2 || 3);        // 1 (first truthy)
```

**C++ comparison:** In C++, `&&` and `||` return `bool`. In JS, they return **the actual value** that determined the result. This is called **short-circuit evaluation** and is heavily used in JS.

```javascript
// Practical uses of short-circuit
// Default values (before ?? existed)
const port = config.port || 3000;

// Conditional execution
isLoggedIn && showDashboard();  // only runs if isLoggedIn is truthy

// Nullish coalescing (ES2020) — better than || for defaults
const count = 0 || 10;    // 10 (0 is falsy, so || skips it)
const count2 = 0 ?? 10;   // 0  (0 is NOT null/undefined, so ?? keeps it)
const name = null ?? "Anonymous"; // "Anonymous"
const name2 = undefined ?? "Guest"; // "Guest"
```

### Ternary Operator

```javascript
// condition ? valueIfTrue : valueIfFalse
const status = age >= 18 ? "adult" : "minor";

// Nested (avoid — hard to read)
const tier = score > 90 ? "A" : score > 80 ? "B" : score > 70 ? "C" : "F";
```

### `typeof` Operator

```javascript
typeof 42           // "number"
typeof "hello"      // "string"
typeof true         // "boolean"
typeof undefined    // "undefined"
typeof null         // "object"     ← BUG (historic, can't be fixed)
typeof {}           // "object"
typeof []           // "object"     ← arrays are objects!
typeof function(){} // "function"
typeof Symbol()     // "symbol"
typeof 10n          // "bigint"

// How to check for array
Array.isArray([1,2,3])  // true
Array.isArray("hello")  // false
```

### `instanceof` Operator

```javascript
[] instanceof Array    // true
{} instanceof Object   // true
function(){} instanceof Function  // true
new Date() instanceof Date       // true

// Doesn't work with primitives
"hello" instanceof String  // false (primitive string, not String object)
42 instanceof Number       // false
```

---

## Type Conversion — Complete Reference

### `Number()` Function

Converts any value to a number.

```javascript
Number("123")       // 123
Number("12.5")      // 12.5
Number("0xFF")      // 255 (hex)
Number("0o17")      // 15 (octal)
Number("0b1010")    // 10 (binary)
Number("")           // 0
Number(" ")          // 0
Number("123abc")     // NaN
Number(true)         // 1
Number(false)        // 0
Number(null)         // 0
Number(undefined)    // NaN
Number([1])          // 1
Number([1,2])        // NaN
Number({})           // NaN
```

### `parseInt()` and `parseFloat()` Functions

```javascript
// parseInt(string, radix) — converts string to integer
parseInt("42");       // 42
parseInt("42px");     // 42 (stops at non-numeric)
parseInt("3.14");     // 3 (truncates at decimal)
parseInt("0xFF", 16); // 255 (hex with radix 16)
parseInt("111", 2);   // 7 (binary with radix 2)
parseInt("08");       // 8 (in modern JS; was 0 in old JS)
parseInt("hello");    // NaN

// parseFloat(string) — converts string to floating point
parseFloat("3.14");     // 3.14
parseFloat("3.14abc");  // 3.14
parseFloat("0.001");    // 0.001
parseFloat("42");       // 42
parseFloat("hello");    // NaN
```

### `String()` Function

```javascript
String(123)          // "123"
String(3.14)         // "3.14"
String(true)         // "true"
String(false)        // "false"
String(null)         // "null"
String(undefined)    // "undefined"
String([1,2,3])      // "1,2,3"
String({})           // "[object Object]"
```

### `Boolean()` Function

```javascript
Boolean(0)           // false
Boolean(-0)          // false
Boolean("")          // false
Boolean(null)        // false
Boolean(undefined)   // false
Boolean(NaN)         // false
Boolean(false)       // false

// Everything else is true:
Boolean(1)           // true
Boolean(-1)          // true
Boolean("0")         // true
Boolean("false")     // true
Boolean([])          // true
Boolean({})          // true
Boolean(Infinity)    // true
```

---

## `NaN` — Not a Number (But It Is a Number)

```javascript
typeof NaN;          // "number" — yes, NaN's type is "number"!

// NaN results from failed numeric conversions
Number("hello");     // NaN
0 / 0;              // NaN
Math.sqrt(-1);      // NaN
parseInt("abc");     // NaN

// NaN is NOT equal to itself!
NaN === NaN;         // false  ← THIS IS UNIQUE

// How to check for NaN
Number.isNaN(NaN);           // true
Number.isNaN("hello");       // false (string is not NaN)
isNaN("hello");              // true  (global isNaN converts first — misleading!)
Number.isFinite(42);         // true
Number.isFinite(Infinity);   // false
Number.isFinite(NaN);        // false
```

**C++ comparison:** In C++, NaN also exists for floating point, and `NaN != NaN` is also true. But C++ doesn't have the confusing `isNaN()` vs `Number.isNaN()` distinction.

---

## Interview Questions

### Q1: What's the output?
```javascript
console.log(typeof typeof 1);
```
<details>
<summary>Answer</summary>

`"string"`

Explanation: `typeof 1` returns `"number"` (a string). Then `typeof "number"` returns `"string"`. `typeof` always returns a string.
</details>

### Q2: What's the output?
```javascript
console.log(0.1 + 0.2 === 0.3);
```
<details>
<summary>Answer</summary>

`false`

Explanation: Floating point precision issue. `0.1 + 0.2` = `0.30000000000000004`, not `0.3`. This happens in C++ too with `double`. Fix: `Math.abs(0.1 + 0.2 - 0.3) < Number.EPSILON`
</details>

### Q3: What's the output?
```javascript
var a = 10;
function test() {
  console.log(a);
  var a = 20;
}
test();
```
<details>
<summary>Answer</summary>

`undefined`

Explanation: `var` is hoisted inside the function, so `var a;` moves to the top. At `console.log(a)`, `a` exists but hasn't been assigned yet → `undefined`.
</details>

### Q4: What's the output?
```javascript
let a = 5;
let b = 10;
[a, b] = [b, a];
console.log(a, b);
```
<details>
<summary>Answer</summary>

`10 5`

Explanation: This is destructuring assignment used for swapping. No temp variable needed!
</details>

### Q5: What's the output?
```javascript
console.log([] == ![]);
```
<details>
<summary>Answer</summary>

`true`

Explanation: `![]` → `false` (arrays are truthy, `!` makes it false). Then `[] == false` → `"" == 0` → `0 == 0` → `true`. Multiple coercion steps!
</details>

### Q6: What's the output?
```javascript
const a = { x: 1 };
const b = { x: 1 };
console.log(a == b);
console.log(a === b);
```
<details>
<summary>Answer</summary>

`false`, `false`

Explanation: Objects are compared by **reference**, not by value. `a` and `b` point to different objects in memory, even though they look the same.
</details>

### Q7: What's the difference between `null` and `undefined`?
<details>
<summary>Answer</summary>

- `undefined` means a variable has been declared but not assigned a value (or a function parameter wasn't provided, or a function returns nothing)
- `null` is an explicit assignment meaning "this variable intentionally has no value"
- `typeof undefined` is `"undefined"`, `typeof null` is `"object"` (JS bug)
- `null == undefined` is `true`, `null === undefined` is `false`
</details>

### Q8: Why does `typeof null` return `"object"`?
<details>
<summary>Answer</summary>

This is a historic bug in JavaScript from the first implementation. In the original JS engine, values were stored as a type tag + value. The type tag for objects was `0`, and `null` was represented as the NULL pointer (all zeros), so it had the same type tag as objects. This bug can't be fixed because it would break existing code.
</details>

### Q9: What's the output?
```javascript
console.log(1 + "2" + "2");
console.log(1 + +"2" + "2");
console.log(1 + -"1" + "2");
console.log("A" - "B" + "2");
console.log("A" - "B" + 2);
```
<details>
<summary>Answer</summary>

```
"122"   — 1 + "2" = "12" (string concat), "12" + "2" = "122"
"32"    — +"2" = 2 (unary plus), 1 + 2 = 3, 3 + "2" = "32"
"02"    — -"1" = -1, 1 + (-1) = 0, 0 + "2" = "02"
"NaN2"  — "A" - "B" = NaN, NaN + "2" = "NaN2"
NaN     — "A" - "B" = NaN, NaN + 2 = NaN (numeric context)
```
</details>

### Q10: What is the Temporal Dead Zone?
<details>
<summary>Answer</summary>

The Temporal Dead Zone (TDZ) is the period between entering a scope where a `let` or `const` variable is declared and the actual declaration line. During this period, accessing the variable throws a `ReferenceError`. Unlike `var` which is hoisted with `undefined`, `let`/`const` are hoisted but remain uninitialized until the declaration is reached.

```javascript
{
  // TDZ starts here for 'x'
  console.log(x); // ReferenceError
  // TDZ ends here
  let x = 5;
}
```
</details>

---

## Exercises

### Exercise 1: Variable Swap Without Temp
Swap two variables without using a third variable.

```javascript
let a = 5, b = 10;
// Your code here
console.log(a); // 10
console.log(b); // 5
```

<details>
<summary>Solution</summary>

```javascript
// Method 1: Destructuring
[a, b] = [b, a];

// Method 2: Arithmetic
a = a + b;  // a = 15
b = a - b;  // b = 5
a = a - b;  // a = 10

// Method 3: XOR (works with integers)
a = a ^ b;
b = a ^ b;
a = a ^ b;
```
</details>

### Exercise 2: Deep Type Check
Write a function that returns the "real" type of any value, handling `null` and arrays correctly.

```javascript
function realType(value) {
  // Your code here
}

console.log(realType(null));      // "null"
console.log(realType([1,2]));     // "array"
console.log(realType({}));        // "object"
console.log(realType(42));       // "number"
console.log(realType("hi"));     // "string"
```

<details>
<summary>Solution</summary>

```javascript
function realType(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}
```
</details>

### Exercise 3: Falsy Value Filter
Write a function that removes all falsy values from an array.

```javascript
function removeFalsy(arr) {
  // Your code here
}

console.log(removeFalsy([0, 1, false, 2, "", 3, null, "hello", undefined, NaN]));
// [1, 2, 3, "hello"]
```

<details>
<summary>Solution</summary>

```javascript
function removeFalsy(arr) {
  return arr.filter(Boolean);
}

// How it works:
// Boolean is a function: Boolean(0) → false, Boolean(1) → true
// filter keeps elements where callback returns truthy
// So filter(Boolean) keeps only truthy values
```
</details>

### Exercise 4: Predict the Output
What does each line output?

```javascript
console.log(2 + 3 + "4");
console.log("2" + 3 + 4);
console.log(2 + "3" + 4);
console.log(true + false);
console.log("5" - 3);
console.log("5" + 3);
```

<details>
<summary>Solution</summary>

```
"54"   — 2+3=5 (numbers), 5+"4"="54" (string concat)
"234"  — "2"+3="23", "23"+4="234" (all string concat from left)
"234"  — 2+"3"="23", "23"+4="234"
1      — true→1, false→0, 1+0=1
2      — "5"→5, 5-3=2 (subtraction forces numeric)
"53"   — "5"+3="53" (addition with string = concat)
```
</details>

### Exercise 5: Safe Math Operation
Write a function that safely adds two values, returning `0` if either is not a valid number.

```javascript
function safeAdd(a, b) {
  // Your code here
}

console.log(safeAdd(5, 3));       // 8
console.log(safeAdd("5", 3));     // 8
console.log(safeAdd("abc", 3));   // 0
console.log(safeAdd(null, 3));    // 0
console.log(safeAdd(NaN, 3));     // 0
```

<details>
<summary>Solution</summary>

```javascript
function safeAdd(a, b) {
  const numA = Number(a);
  const numB = Number(b);
  if (Number.isNaN(numA) || Number.isNaN(numB)) return 0;
  return numA + numB;
}

// Note: We use Number.isNaN() not isNaN() because:
// isNaN("abc") → true (converts first, then checks)
// Number.isNaN("abc") → false ("abc" is not NaN, it's a string)
// But after Number("abc") → NaN, Number.isNaN(NaN) → true ✓
```
</details>

---

## Next Steps
Now that you understand JS fundamentals, move on to [02 — Functions, Scope & Closures](02-FUNCTIONS-SCOPE-CLOSURES.md) to learn about the most-asked interview topic: closures.
