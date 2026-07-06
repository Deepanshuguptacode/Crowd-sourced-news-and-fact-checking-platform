# 07 — ES6+ Modern Features

## Why This File Exists

ES6 (2015) and later versions transformed JavaScript. Interviewers expect you to know destructuring, spread/rest, template literals, modules, and newer features like optional chaining. This file covers the most important ones with practical examples.

---

## Destructuring

### Array Destructuring
```javascript
const numbers = [1, 2, 3];

// Basic
const [a, b, c] = numbers;  // a=1, b=2, c=3

// Skip elements
const [first, , third] = numbers;  // first=1, third=3

// Default values
const [x = 0, y = 0, z = 0, w = 99] = [1, 2];  // x=1, y=2, z=0, w=99

// Rest pattern
const [head, ...tail] = [1, 2, 3, 4];  // head=1, tail=[2,3,4]

// Swapping variables
let a1 = 5, b1 = 10;
[a1, b1] = [b1, a1];  // a1=10, b1=5
```

### Object Destructuring
```javascript
const user = {
  name: 'Alice',
  age: 30,
  email: 'alice@example.com',
  address: { city: 'NYC', zip: '10001' }
};

// Basic
const { name, age } = user;  // name='Alice', age=30

// Rename variables
const { name: userName, age: userAge } = user;
// userName='Alice', userAge=30

// Default values
const { name, role = 'user' } = user;  // role='user' (not in object)

// Nested destructuring
const { address: { city, zip } } = user;  // city='NYC', zip='10001'

// Rest object
const { name, ...rest } = user;  // rest = { age: 30, email: '...', address: {...} }
```

### Function Parameter Destructuring
```javascript
// Old way
function displayUser(user) {
  console.log(user.name, user.age);
}

// Destructured
function displayUser({ name, age, email = 'N/A' }) {
  console.log(name, age, email);
}

displayUser({ name: 'Alice', age: 30 });  // Alice 30 N/A

// Nested destructuring in params
function getZip({ address: { zip } = {} }) {
  return zip;
}
```

---

## Spread and Rest Operators

### Spread (`...`) — Expands
```javascript
// Arrays
const arr1 = [1, 2, 3];
const arr2 = [4, 5, 6];
const combined = [...arr1, ...arr2, 7];  // [1,2,3,4,5,6,7]

// Copy array (shallow!)
const copy = [...arr1];

// Strings
const chars = [...'hello'];  // ['h','e','l','l','o']

// Objects
const obj1 = { a: 1, b: 2 };
const obj2 = { c: 3 };
const merged = { ...obj1, ...obj2, d: 4 };  // {a:1, b:2, c:3, d:4}

// Copy object (shallow!)
const copyObj = { ...obj1 };

// Override properties (later wins)
const updated = { ...obj1, b: 20 };  // {a:1, b:20}

// Function arguments
const nums = [1, 2, 3];
Math.max(...nums);  // 3 (same as Math.max(1, 2, 3))

// Convert array-like to real array
const args = [...arguments];
```

### Rest (`...`) — Collects
```javascript
// Function parameters
function sum(...numbers) {
  return numbers.reduce((a, b) => a + b, 0);
}
sum(1, 2, 3, 4);  // 10

// Must be last parameter
function log(first, ...rest) {
  console.log('First:', first);
  console.log('Rest:', rest);
}
log('a', 'b', 'c');  // First: a, Rest: ['b','c']

// Array destructuring rest (must be last)
const [x, ...y] = [1, 2, 3, 4];  // x=1, y=[2,3,4]

// Object destructuring rest (must be last)
const { a, ...others } = { a: 1, b: 2, c: 3 };  // others = {b:2, c:3}
```

---

## Template Literals

```javascript
const name = 'Alice';
const age = 30;

// Multi-line strings
const message = `Hello ${name},
You are ${age} years old.`;

// Expression evaluation
const total = `Price: $${(price * (1 + tax)).toFixed(2)}`;

// Tagged template literals
function highlight(strings, ...values) {
  return strings.reduce((result, str, i) => {
    const value = values[i] ? `<b>${values[i]}</b>` : '';
    return result + str + value;
  }, '');
}

const name2 = 'Alice';
const age2 = 30;
const output = highlight`Name: ${name2}, Age: ${age2}`;
// "Name: <b>Alice</b>, Age: <b>30</b>"
```

---

## Arrow Functions

```javascript
// Short syntax
const double = x => x * 2;
const add = (a, b) => a + b;
const greet = () => 'Hello';

// With block body (explicit return needed)
const multiply = (a, b) => {
  const result = a * b;
  return result;
};

// No `this` binding (inherits from outer scope)
const obj = {
  value: 42,
  // ❌ Arrow loses object context
  bad: () => console.log(this.value),  // undefined (inherits global/undefined)
  
  // ✅ Regular function binds to object
  good: function() {
    console.log(this.value);  // 42
  }
};

// Best use: callbacks where you need outer `this`
const betterObj = {
  items: ['a', 'b', 'c'],
  logItems() {
    this.items.forEach(item => {
      console.log(`${this} has ${item}`);  // `this` is betterObj
    });
  }
};

// Cannot be used as constructor
const Foo = () => {};
new Foo();  // TypeError: Foo is not a constructor

// No `arguments` object
const showArgs = () => console.log(arguments);  // Uses outer scope's arguments
const showArgs2 = function() { console.log(arguments); };  // Own arguments
```

---

## Default Parameters

```javascript
function greet(name = 'Guest', greeting = 'Hello') {
  return `${greeting}, ${name}!`;
}

greet();              // 'Hello, Guest!'
greet('Alice');       // 'Hello, Alice!'
greet('Alice', 'Hi'); // 'Hi, Alice!'

// Default can be expression or function call
function fetchUser(id = getCurrentUserId()) {
  // getCurrentUserId() only called if id not provided
}

// Previous params as default for later
function createUrl(domain, path = '/users', protocol = 'https://') {
  return `${protocol}${domain}${path}`;
}
```

---

## Modules (Import/Export)

### Named Exports
```javascript
// utils.js
export const PI = 3.14;
export function sum(a, b) {
  return a + b;
}

// Can also export at end
export { PI, sum };
```

### Named Imports
```javascript
import { PI, sum } from './utils.js';

// With alias
import { sum as add } from './utils.js';

// Import all
import * as utils from './utils.js';
utils.sum(1, 2);
```

### Default Export
```javascript
// math.js
export default function calculate() {
  // ...
}

// Or export expression
export default { name: 'math' };

// Import default
import calculate from './math.js';

// Mixed
import calculate, { PI } from './math.js';
```

### Dynamic Import (Code Splitting)
```javascript
async function loadModule() {
  const module = await import('./heavy-module.js');
  module.default();
}

// Conditional loading
if (userNeedsFeature) {
  const { feature } = await import('./feature.js');
  feature.run();
}
```

---

## Optional Chaining (`?.`)

```javascript
const user = {
  profile: {
    name: 'Alice',
    address: null
  }
};

// Old way (verbose)
const city = user && user.profile && user.profile.address && user.profile.address.city;

// With optional chaining
const city = user?.profile?.address?.city;  // undefined (no error!)

// Works with arrays
const firstFriend = user?.friends?.[0];

// Works with function calls
const result = user?.getName?.();  // undefined if getName doesn't exist

// Combine with nullish coalescing
const userCity = user?.profile?.address?.city ?? 'Unknown';  // 'Unknown'
```

---

## Nullish Coalescing (`??`)

```javascript
// || treats 0, '', false as falsy (wrong for defaults)
const count = 0;
const displayCount = count || 'N/A';  // 'N/A' — 0 is falsy!

// ?? only treats null/undefined as missing
const displayCount2 = count ?? 'N/A';  // 0 — preserved!

// Common pattern: API response with possible null
const userName = response?.data?.user?.name ?? 'Anonymous';
```

---

## Other ES6+ Features

### For...of (Iterables)
```javascript
const arr = ['a', 'b', 'c'];

// Old: forEach (can't break/return)
arr.forEach(item => console.log(item));

// New: for...of (can break, continue)
for (const item of arr) {
  if (item === 'b') break;
  console.log(item);  // 'a'
}

// Works with any iterable: arrays, strings, Maps, Sets, generators
for (const char of 'hello') {
  console.log(char);
}
```

### Map and Set
```javascript
// Map — key-value, any type of key
const userMap = new Map();
userMap.set('alice', { age: 30 });
userMap.set(document.body, { clicked: true });  // object as key!

userMap.get('alice');     // { age: 30 }
userMap.has('alice');     // true
userMap.delete('alice');
userMap.size;             // count

// Set — unique values only
const unique = new Set([1, 2, 2, 3, 3, 3]);
console.log([...unique]);  // [1, 2, 3]
```

### Symbol
```javascript
const id = Symbol('id');  // Unique, even with same description
const id2 = Symbol('id');
console.log(id === id2);  // false

// Use as unique object keys
const user = {
  name: 'Alice',
  [Symbol('password')]: 'secret'  // Hidden from for...in, Object.keys
};

// Well-known symbols
const iterator = {
  [Symbol.iterator]: function* () {
    yield 1; yield 2; yield 3;
  }
};
```

---

## Common Interview Questions

### Q: What's the difference between `??` and `||`?
- `||`: Returns right side if left is ANY falsy value (0, '', false, null, undefined, NaN)
- `??`: Returns right side ONLY if left is null or undefined

### Q: Destructure this nested object
```javascript
const data = {
  user: {
    profile: {
      name: 'Alice',
      contacts: { email: 'a@b.com', phone: '555-1234' }
    }
  }
};

const { user: { profile: { name, contacts: { email } } } } = data;
// name='Alice', email='a@b.com'
```

### Q: Merge two objects, override conflicts
```javascript
const defaults = { theme: 'light', lang: 'en' };
const settings = { theme: 'dark' };

const merged = { ...defaults, ...settings };  // { theme: 'dark', lang: 'en' }
// Settings override defaults because spread order matters (later wins)
```

### Q: Implement a simple tagged template
```javascript
function sql(strings, ...values) {
  return strings.reduce((query, str, i) => {
    // Sanitize and interpolate
    const safeValue = typeof values[i] === 'string'
      ? `"${values[i].replace(/"/g, '\\"')}"`
      : values[i];
    return query + str + (safeValue || '');
  }, '');
}

const name = 'Alice\'s';
const age = 30;
const query = sql`SELECT * FROM users WHERE name = ${name} AND age > ${age}`;
```

---

## Next Steps

Move to [08 — Arrays, Objects & Methods](08-ARRAYS-OBJECTS-METHODS.md) for practical data manipulation techniques.
