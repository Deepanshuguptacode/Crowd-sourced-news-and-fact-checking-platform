# 04 — Arrays & Strings — Complete Method Reference

## Why This File Exists
Array methods (`map`, `filter`, `reduce`) are asked in ~60% of JavaScript interviews. String manipulation is equally common. This document is your complete reference — every method, how it works, when to use it, and interview patterns.

---

## Arrays

### In C++ (What You Know)

```cpp
// Fixed-size array
int arr[5] = {1, 2, 3, 4, 5};

// Dynamic array (vector)
vector<int> vec = {1, 2, 3};
vec.push_back(4);  // Add element
vec.size();        // Get size
```

### In JavaScript (What's Different)

```javascript
// Arrays are dynamic, heterogeneous, and object-based
const arr = [1, "hello", true, { key: "value" }, [1, 2, 3]];

// Arrays can grow/shrink dynamically
arr.push(4);        // Add to end
arr.pop();          // Remove from end
arr.unshift(0);     // Add to beginning
arr.shift();        // Remove from beginning
```

---

## Array Methods — Complete Reference

### Adding/Removing Elements (Mutating Methods)

#### `push(...items)` — Add to end
```javascript
const arr = [1, 2];
arr.push(3);           // Returns new length: 3
arr.push(4, 5);        // Can add multiple
console.log(arr);      // [1, 2, 3, 4, 5]
```

#### `pop()` — Remove from end
```javascript
const arr = [1, 2, 3];
const last = arr.pop(); // Returns: 3
console.log(arr);       // [1, 2]
console.log(last);      // 3
```

#### `unshift(...items)` — Add to beginning
```javascript
const arr = [2, 3];
arr.unshift(1);        // Returns new length: 3
arr.unshift(-1, 0);    // Can add multiple
console.log(arr);      // [-1, 0, 1, 2, 3]
// Note: O(n) operation — shifts all elements
```

#### `shift()` — Remove from beginning
```javascript
const arr = [1, 2, 3];
const first = arr.shift(); // Returns: 1
console.log(arr);          // [2, 3]
// Note: O(n) operation — shifts all elements
```

#### `splice(start, deleteCount, ...items)` — Swiss Army Knife
```javascript
const arr = ["a", "b", "c", "d"];

// Remove elements
arr.splice(1, 2);      // From index 1, remove 2 elements
// arr is now ["a", "d"]
// Returns: ["b", "c"] (removed elements)

// Insert elements
arr.splice(1, 0, "x", "y");  // At index 1, remove 0, insert "x", "y"
// arr is now ["a", "x", "y", "d"]

// Replace elements
arr.splice(1, 2, "z");  // At index 1, remove 2, insert "z"
// arr is now ["a", "z", "d"]
```

**Parameters:**
- `start`: Index to start at (negative counts from end)
- `deleteCount`: How many to remove (0 = none)
- `...items`: Elements to insert (optional)

**Returns:** Array of removed elements

---

### Non-Mutating Methods (Return New Arrays)

#### `slice(start, end)` — Extract portion
```javascript
const arr = [1, 2, 3, 4, 5];

arr.slice(1, 3);     // [2, 3] — elements at index 1 and 2 (end is exclusive)
arr.slice(2);        // [3, 4, 5] — from index 2 to end
arr.slice(-2);       // [4, 5] — last 2 elements
arr.slice();         // [1, 2, 3, 4, 5] — shallow copy
```

**Use for:** Copying arrays, extracting subarrays

**Important:** Creates shallow copy. Nested objects/arrays are still shared references.

#### `concat(...arrays)` — Combine arrays
```javascript
const arr1 = [1, 2];
const arr2 = [3, 4];
const arr3 = arr1.concat(arr2, [5, 6]);  // [1, 2, 3, 4, 5, 6]
// arr1 is unchanged!
```

Modern alternative: spread operator `[...arr1, ...arr2]`

---

### Iteration Methods (Functional Programming)

These methods are the bread and butter of JavaScript interviews.

#### `forEach(callback)` — Execute for each element
```javascript
const arr = [1, 2, 3];
arr.forEach((item, index, array) => {
  console.log(`${index}: ${item}`);
});
// 0: 1
// 1: 2
// 2: 3

// Cannot break out of forEach (no return, no break)
// Use for...of or regular for loop if you need to break
```

**Returns:** `undefined`

**Cannot break/return early.** Use `for...of` or `some`/`every` if you need early exit.

#### `map(callback)` — Transform each element
```javascript
const numbers = [1, 2, 3];
const doubled = numbers.map(n => n * 2);
// doubled: [2, 4, 6]
// numbers unchanged: [1, 2, 3]
```

**Callback parameters:** `(currentValue, index, array)`

**Returns:** New array of same length with transformed values

**Common use cases:**
```javascript
// Extract property from objects
const users = [{ name: "Alice" }, { name: "Bob" }];
const names = users.map(u => u.name);  // ["Alice", "Bob"]

// Transform data
const celsius = [0, 10, 20];
const fahrenheit = celsius.map(c => c * 9/5 + 32);  // [32, 50, 68]
```

#### `filter(callback)` — Keep elements that pass test
```javascript
const numbers = [1, 2, 3, 4, 5];
const evens = numbers.filter(n => n % 2 === 0);  // [2, 4]

// Remove falsy values
const mixed = [0, 1, false, 2, "", 3, null];
const truthy = mixed.filter(Boolean);  // [1, 2, 3]

// Filter objects
const users = [
  { name: "Alice", active: true },
  { name: "Bob", active: false }
];
const activeUsers = users.filter(u => u.active);
```

**Returns:** New array with elements where callback returned truthy

**If nothing matches:** Returns empty array `[]`

#### `reduce(callback, initialValue)` — Reduce to single value
```javascript
const numbers = [1, 2, 3, 4, 5];
const sum = numbers.reduce((accumulator, current) => {
  return accumulator + current;
}, 0);  // initialValue = 0
// sum: 15
```

**Callback parameters:** `(accumulator, currentValue, index, array)`

**Returns:** Single value (any type)

**Common patterns:**
```javascript
// Sum / Product
const product = [1, 2, 3].reduce((a, b) => a * b, 1);  // 6

// Flatten array
const nested = [[1, 2], [3, 4], [5, 6]];
const flat = nested.reduce((acc, curr) => acc.concat(curr), []);
// [1, 2, 3, 4, 5, 6]

// Count occurrences
const fruits = ["apple", "banana", "apple", "orange", "banana", "apple"];
const count = fruits.reduce((acc, fruit) => {
  acc[fruit] = (acc[fruit] || 0) + 1;
  return acc;
}, {});
// { apple: 3, banana: 2, orange: 1 }

// Group by property
const users = [
  { name: "Alice", role: "admin" },
  { name: "Bob", role: "user" },
  { name: "Carol", role: "admin" }
];
const grouped = users.reduce((acc, user) => {
  (acc[user.role] = acc[user.role] || []).push(user);
  return acc;
}, {});
// { admin: [Alice, Carol], user: [Bob] }

// Find max
const max = [3, 1, 4, 1, 5, 9].reduce((max, n) => n > max ? n : max);
// 9
```

**⚠️ No initialValue = first element becomes initialValue:**
```javascript
const arr = [];
arr.reduce((a, b) => a + b);     // TypeError: Reduce of empty array
arr.reduce((a, b) => a + b, 0);  // 0 (safe!)
```

#### `reduceRight(callback, initialValue)` — Reduce from right
```javascript
const arr = ["a", "b", "c"];
arr.reduce((acc, curr) => acc + curr);      // "abc"
arr.reduceRight((acc, curr) => acc + curr); // "cba"

// Useful for: flattening right-to-left, certain string operations
```

#### `find(callback)` — Find first matching element
```javascript
const users = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" }
];
const user = users.find(u => u.id === 2);  // { id: 2, name: "Bob" }
const notFound = users.find(u => u.id === 999);  // undefined
```

**Returns:** First matching element or `undefined`

**vs `filter`:** `find` returns one element, `filter` returns array

#### `findIndex(callback)` — Find index of first match
```javascript
const arr = [10, 20, 30, 40];
arr.findIndex(n => n > 25);  // 2 (index of 30)
arr.findIndex(n => n > 100); // -1 (not found)
```

#### `some(callback)` — At least one matches?
```javascript
const arr = [1, 2, 3, 4, 5];
arr.some(n => n > 3);   // true (4 and 5 are > 3)
arr.some(n => n > 10);  // false
```

**Returns:** `true` if ANY element passes test, `false` otherwise

**Stops early** when match is found (unlike `forEach`)

#### `every(callback)` — Do ALL match?
```javascript
const arr = [2, 4, 6, 8];
arr.every(n => n % 2 === 0);  // true (all even)
arr.every(n => n > 5);        // false (2 and 4 are not > 5)
```

**Returns:** `true` if ALL elements pass test, `false` otherwise

**Stops early** when mismatch is found

---

### Search Methods

#### `indexOf(searchElement, fromIndex)` — Find first occurrence
```javascript
const arr = ["a", "b", "c", "b"];
arr.indexOf("b");       // 1
arr.indexOf("b", 2);    // 3 (start searching from index 2)
arr.indexOf("z");       // -1 (not found)
```

#### `lastIndexOf(searchElement, fromIndex)` — Find last occurrence
```javascript
arr.lastIndexOf("b");   // 3
arr.lastIndexOf("b", 2); // 1 (start from index 2, go backwards)
```

#### `includes(searchElement, fromIndex)` — Is element present?
```javascript
[1, 2, 3].includes(2);     // true
[1, 2, 3].includes(5);     // false
[NaN].includes(NaN);       // true (unlike indexOf!)
```

**Important:** Uses `===` comparison, but `NaN` is found (unlike `indexOf`)

#### `find()` vs `indexOf()` vs `includes()`

| Method | Use When | Returns |
|--------|----------|---------|
| `find()` | Need the actual element | Element or `undefined` |
| `findIndex()` | Need the position | Index or `-1` |
| `indexOf()` | Searching for primitive value | Index or `-1` |
| `includes()` | Just need to know if it exists | `true`/`false` |
| `some()` | Complex condition | `true`/`false` |

---

### Ordering Methods

#### `sort(compareFunction)` — Sort in place
```javascript
// Default: converts to string and sorts by Unicode
[10, 2, 1].sort();  // [1, 10, 2] — WRONG for numbers!

// Numeric sort
[10, 2, 1].sort((a, b) => a - b);  // [1, 2, 10] — ascending
[10, 2, 1].sort((a, b) => b - a);  // [10, 2, 1] — descending

// Sort objects
const users = [
  { name: "Bob", age: 30 },
  { name: "Alice", age: 25 }
];
users.sort((a, b) => a.age - b.age);  // Sort by age
users.sort((a, b) => a.name.localeCompare(b.name));  // Sort by name

// Sort strings case-insensitive
["Banana", "apple"].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
```

**Compare function:**
- Returns negative: `a` comes before `b`
- Returns positive: `b` comes before `a`
- Returns 0: order unchanged

**Mutates original array!** Use `toSorted()` (ES2023) or `[...arr].sort()` to avoid mutation.

#### `reverse()` — Reverse in place
```javascript
const arr = [1, 2, 3];
arr.reverse();  // [3, 2, 1]
// arr is now [3, 2, 1] — mutated!
```

---

### Other Array Methods

#### `flat(depth)` — Flatten nested arrays
```javascript
const nested = [1, [2, 3], [4, [5, 6]]];
nested.flat();        // [1, 2, 3, 4, [5, 6]] — depth 1
nested.flat(2);       // [1, 2, 3, 4, 5, 6] — depth 2
nested.flat(Infinity); // Flatten all levels
```

#### `flatMap(callback)` — Map then flatten (depth 1)
```javascript
const sentences = ["Hello world", "Goodbye moon"];
const words = sentences.flatMap(s => s.split(" "));
// ["Hello", "world", "Goodbye", "moon"]

// Equivalent to: sentences.map(...).flat()
// But more efficient (doesn't create intermediate array)
```

#### `fill(value, start, end)` — Fill with value
```javascript
const arr = new Array(5).fill(0);  // [0, 0, 0, 0, 0]
[1, 2, 3, 4, 5].fill(0, 2, 4);     // [1, 2, 0, 0, 5]
```

#### `at(index)` — Access element (supports negative)
```javascript
const arr = [1, 2, 3, 4, 5];
arr.at(0);    // 1
arr.at(-1);   // 5 (last element)
arr.at(-2);   // 4 (second to last)
```

**Modern alternative to `arr[arr.length - 1]`**

---

### Array.from() and Array.of()

#### `Array.from(iterable, mapFn)` — Create array from iterable
```javascript
// From array-like object
const nodeList = document.querySelectorAll('div');  // Array-like
const divs = Array.from(nodeList);  // Real array

// From string
Array.from("hello");  // ["h", "e", "l", "l", "o"]

// With mapping function
Array.from([1, 2, 3], x => x * 2);  // [2, 4, 6]

// Create array with sequence
Array.from({ length: 5 }, (_, i) => i);  // [0, 1, 2, 3, 4]
```

#### `Array.of(...elements)` — Create array from arguments
```javascript
Array.of(1, 2, 3);      // [1, 2, 3]
Array.of(5);            // [5] — NOT [undefined, undefined, undefined, undefined, undefined]

// vs new Array(5) creates [undefined, undefined, undefined, undefined, undefined]
```

---

## Strings

### In C++ (What You Know)

```cpp
string s = "hello";
s.length();           // Get length
s.substr(0, 2);       // Extract substring
s.find("l");          // Find first occurrence
```

### In JavaScript (What's Different)

Strings in JS are **immutable** (like in C++ with `const string`). Methods return new strings.

---

## String Methods — Complete Reference

### Basic Properties

#### `length` — String length
```javascript
"hello".length;  // 5
"".length;       // 0
"  ".length;      // 2 (spaces count!)
```

### Accessing Characters

#### `charAt(index)` — Character at position
```javascript
"hello".charAt(0);   // "h"
"hello".charAt(10);  // "" (empty string if out of bounds)
```

#### Bracket notation (preferred)
```javascript
"hello"[0];      // "h"
"hello"[10];     // undefined (not empty string!)
"hello".at(-1);  // "o" (ES2022, supports negative index)
```

### Searching

#### `indexOf(searchString, position)` — Find substring
```javascript
"hello world".indexOf("world");   // 6
"hello world".indexOf("o");        // 4
"hello world".indexOf("o", 5);     // 7 (start from position 5)
"hello world".indexOf("z");        // -1
```

#### `lastIndexOf(searchString, position)` — Find from end
```javascript
"hello world".lastIndexOf("o");   // 7
"hello world".lastIndexOf("o", 5); // 4 (search backwards from 5)
```

#### `includes(searchString, position)` — Contains substring?
```javascript
"hello world".includes("world");  // true
"hello world".includes("World");  // false (case-sensitive)
"hello world".includes("o", 5);   // true ("o" at position 7)
```

#### `startsWith(searchString, position)` — Begins with?
```javascript
"hello world".startsWith("hello");  // true
"hello world".startsWith("world");  // false
"hello world".startsWith("world", 6); // true (position 6 is "w")
```

#### `endsWith(searchString, length)` — Ends with?
```javascript
"hello world".endsWith("world");  // true
"hello world".endsWith("hello");  // false
"hello world".endsWith("hello", 5); // true (first 5 chars: "hello")
```

### Extracting Substrings

#### `slice(start, end)` — Extract substring
```javascript
"hello world".slice(0, 5);   // "hello" (end is exclusive)
"hello world".slice(6);      // "world" (to end)
"hello world".slice(-5);    // "world" (last 5 chars)
"hello world".slice(0, -6);  // "hello" (exclude last 6)
```

#### `substring(start, end)` — Similar but less flexible
```javascript
"hello".substring(0, 2);   // "he"
"hello".substring(2, 0);   // "he" (swaps if start > end)
"hello".substring(-3);     // "hello" (negative becomes 0)
// Generally prefer slice()
```

#### `substr(start, length)` — Deprecated but common
```javascript
"hello".substr(0, 2);   // "he"
"hello".substr(-3);     // "llo" (last 3 chars)
// Deprecated, avoid in new code
```

### Case Conversion

```javascript
"Hello World".toLowerCase();  // "hello world"
"Hello World".toUpperCase();  // "HELLO WORLD"

// Locale-aware versions
"i".toLocaleUpperCase("tr");  // "İ" (Turkish)
```

### Trimming

```javascript
"  hello  ".trim();         // "hello"
"  hello  ".trimStart();     // "hello  "
"  hello  ".trimEnd();       // "  hello"
```

### Padding

```javascript
"5".padStart(3, "0");   // "005"
"5".padStart(3);        // "  5" (space padding)
"hello".padEnd(10, "."); // "hello....."
```

### Splitting and Joining

#### `split(separator, limit)` — Split into array
```javascript
"a,b,c".split(",");           // ["a", "b", "c"]
"hello world".split(" ");      // ["hello", "world"]
"hello".split("");            // ["h", "e", "l", "l", "o"]
"a,b,c".split(",", 2);        // ["a", "b"] (limit results)

// Split with regex
"hello1world2test".split(/\d/); // ["hello", "world", "test"]
```

#### `join(separator)` — Array method to combine
```javascript
["a", "b", "c"].join(",");    // "a,b,c"
["a", "b", "c"].join("");      // "abc"
["a", "b", "c"].join("-");     // "a-b-c"
```

### Replacing

#### `replace(pattern, replacement)` — First occurrence only
```javascript
"hello world".replace("world", "JS");   // "hello JS"
"aaa".replace("a", "b");                  // "baa" (only first!)
```

#### `replaceAll(pattern, replacement)` — All occurrences
```javascript
"aaa".replaceAll("a", "b");  // "bbb"

// With regex (g flag for global)
"hello world".replace(/l/g, "L");  // "heLLo worLd"
```

#### Replacement patterns
```javascript
"$100".replace(/\$(\d+)/, "USD $1");  // "USD 100" ($1 = first capture group)

const date = "2024-05-01";
date.replace(/(\d{4})-(\d{2})-(\d{2})/, "$2/$3/$1");  // "05/01/2024"
```

### Matching and Searching with Regex

#### `match(regex)` — Find matches
```javascript
"hello123world".match(/\d+/);     // ["123"] (first match)
"hello123world456".match(/\d+/g);  // ["123", "456"] (all with g flag)

// With capture groups
"hello world".match(/(\w+) (\w+)/);  // ["hello world", "hello", "world"]
// Index 0: full match, Index 1: first group, Index 2: second group
```

#### `matchAll(regex)` — Iterator of all matches (ES2020)
```javascript
const str = "hello1world2test";
const matches = [...str.matchAll(/\d/g)];
// Each match includes capture groups and index info
```

#### `search(regex)` — Find index of match
```javascript
"hello world".search(/world/);  // 6
"hello world".search(/z/);      // -1
```

#### `test()` — Regex method (on RegExp, not String)
```javascript
/\d+/.test("hello123");  // true
/\d+/.test("hello");      // false
```

### Repeat and Templates

#### `repeat(count)` — Repeat string
```javascript
"*".repeat(5);       // "*****"
"ha".repeat(3);     // "hahaha"
"abc".repeat(0);    // "" (empty)
```

#### Template literals (preferred over concatenation)
```javascript
const name = "Alice";
const age = 25;

// Old way
const old = "Name: " + name + ", Age: " + age;

// Template literal
const modern = `Name: ${name}, Age: ${age}`;

// Multi-line
const html = `
  <div>
    <h1>${name}</h1>
    <p>Age: ${age}</p>
  </div>
`;

// Expressions inside ${}
const sum = `2 + 3 = ${2 + 3}`;  // "2 + 3 = 5"
```

---

## Common Interview Patterns

### Pattern 1: Flatten Array (without flat())
```javascript
function flatten(arr) {
  return arr.reduce((acc, val) =>
    acc.concat(Array.isArray(val) ? flatten(val) : val), []);
}

// Or with flat()
arr.flat(Infinity);
```

### Pattern 2: Remove Duplicates
```javascript
// Set method (simplest)
[...new Set(arr)];
Array.from(new Set(arr));

// Filter method
arr.filter((item, index) => arr.indexOf(item) === index);

// Reduce method
arr.reduce((acc, curr) => acc.includes(curr) ? acc : [...acc, curr], []);
```

### Pattern 3: Chunk Array
```javascript
function chunk(arr, size) {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

// [[1,2], [3,4], [5]]
chunk([1, 2, 3, 4, 5], 2);
```

### Pattern 4: Deep Clone (shallow)
```javascript
// Shallow clone (one level)
const clone = [...arr];
const clone2 = arr.slice();
const clone3 = Array.from(arr);

// Deep clone (nested)
const deep = JSON.parse(JSON.stringify(arr));
// Note: loses functions, undefined, Dates, Maps, Sets, circular refs
```

### Pattern 5: Intersection of Arrays
```javascript
const a = [1, 2, 3, 4];
const b = [3, 4, 5, 6];
const intersection = a.filter(x => b.includes(x));  // [3, 4]
```

---

## Interview Questions

### Q1: Implement your own `map()` function
<details>
<summary>Answer</summary>

```javascript
Array.prototype.myMap = function(callback) {
  const result = [];
  for (let i = 0; i < this.length; i++) {
    result.push(callback(this[i], i, this));
  }
  return result;
};
```
</details>

### Q2: Implement `filter()` without using built-in filter
<details>
<summary>Answer</summary>

```javascript
Array.prototype.myFilter = function(callback) {
  const result = [];
  for (let i = 0; i < this.length; i++) {
    if (callback(this[i], i, this)) {
      result.push(this[i]);
    }
  }
  return result;
};
```
</details>

### Q3: What's the difference between `forEach` and `map`?
<details>
<summary>Answer</summary>

- `forEach` executes a function for each element, returns `undefined`
- `map` creates a new array with transformed values, returns the new array
- `forEach` is for side effects (logging, modifying external state)
- `map` is for transforming data
</details>

### Q4: How do you flatten a deeply nested array?
<details>
<summary>Answer</summary>

```javascript
// Method 1: flat with Infinity
nested.flat(Infinity);

// Method 2: recursive reduce
function flatten(arr) {
  return arr.reduce((acc, val) =>
    acc.concat(Array.isArray(val) ? flatten(val) : val), []);
}

// Method 3: toString (trick, converts to string first)
arr.toString().split(',').map(Number);
```
</details>

### Q5: Reverse a string in JavaScript
<details>
<summary>Answer</summary>

```javascript
function reverseString(str) {
  return str.split('').reverse().join('');
}

// Or with spread
const reversed = [...str].reverse().join('');

// Or with reduce
const reversed = str.split('').reduce((acc, char) => char + acc, '');
```
</details>

---

## Next Steps
Now that you know arrays and strings, move on to [05 — Asynchronous JavaScript](05-ASYNC-JS.md) to understand Promises, async/await, and the event loop.
