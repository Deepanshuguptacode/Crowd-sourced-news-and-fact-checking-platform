# 02 — Data Types & Type Coercion

## Why This File Exists

Interviewers love testing your understanding of type coercion — `[] + []`, `typeof null`, and `[] == ![]` are classic traps. This file explains primitives vs references, coercion rules, and how to avoid type-related bugs.

---

## Primitive vs Reference Types

### Primitives (7 types, immutable, stored by value)
```javascript
string      'hello'
number      42, 3.14, NaN, Infinity
boolean     true, false
undefined   undefined
null        null
symbol      Symbol('desc')
bigint      9007199254740991n
```

### Reference Types (objects, mutable, stored by reference)
```javascript
object      { name: 'Alice' }
array       [1, 2, 3]  (special type of object)
function    function(){}  (callable object)
date        new Date()
regexp      /pattern/
map, set    new Map(), new Set()
```

### The Critical Difference

```javascript
// Primitives — copied BY VALUE
let a = 5;
let b = a;      // b gets a COPY of 5
b = 10;
console.log(a); // 5 (unchanged!)

// References — copied BY REFERENCE
let obj1 = { value: 5 };
let obj2 = obj1;  // obj2 points to SAME object
obj2.value = 10;
console.log(obj1.value); // 10 (changed!)

// Same with arrays
let arr1 = [1, 2, 3];
let arr2 = arr1;
arr2.push(4);
console.log(arr1); // [1, 2, 3, 4] — both changed!
```

**Interview trap:**
```javascript
const x = { a: 1 };
const y = x;
y.a = 2;
// What's x.a? 2! const doesn't make objects immutable, just prevents reassignment
```

---

## Immutability of Primitives

```javascript
let str = 'hello';
str.toUpperCase();  // Returns 'HELLO' but str is still 'hello'
console.log(str);    // 'hello' — strings are immutable!

// To "change" a string, you create a new one
str = str.toUpperCase();  // Now str is 'HELLO'

// Compare to arrays (mutable)
let arr = [1, 2];
arr.push(3);  // Modifies arr in place
console.log(arr); // [1, 2, 3]
```

---

## Type Coercion Rules

### String Coercion (ToPrimitive hint "string")
```javascript
String(123)         // '123'
String(true)        // 'true'
String(null)        // 'null'
String(undefined)   // 'undefined'
String({})          // '[object Object]'
String([1, 2, 3])   // '1,2,3'

// Implicit string coercion with +
'5' + 3             // '53' (number becomes string)
5 + '3'             // '53'
5 + 3 + '2'         // '82' (5+3=8, then '8'+'2'='82')
```

### Number Coercion (ToPrimitive hint "number")
```javascript
Number('5')         // 5
Number('')          // 0 (empty string → 0!)
Number('   ')       // 0 (whitespace → 0!)
Number('hello')     // NaN
Number(true)        // 1
Number(false)       // 0
Number(null)        // 0
Number(undefined)   // NaN
Number([])          // 0
Number([1])         // 1 (single element array → that element)
Number([1, 2])      // NaN
Number({})          // NaN
```

### Boolean Coercion
```javascript
Boolean('')         // false
Boolean('hello')    // true
Boolean(0)          // false
Boolean(1)          // true
Boolean(-1)         // true (any non-zero number)
Boolean(null)       // false
Boolean(undefined)  // false
Boolean(NaN)        // false
Boolean({})         // true (any object!)
Boolean([])         // true (even empty array!)
```

---

## The `==` Coercion Matrix (What Interviewers Test)

```javascript
// Number + String: string converts to number
5 == '5'        // true
0 == ''         // true

// Boolean + Anything: boolean converts to number
1 == true       // true (true → 1)
0 == false      // true (false → 0)
'1' == true     // true ('1' → 1, true → 1)

// null and undefined (special case)
null == undefined   // true (only equals each other!)
null == 0           // false
undefined == 0      // false

// Objects + Primitives: object calls ToPrimitive
[1, 2] == '1,2'     // true (array → '1,2')
{} == '[object Object]'  // true (object → '[object Object]')

// Arrays (ToPrimitive calls join)
[] == ''            // true ([] → '')
[] == 0             // true ([] → '' → 0)
[] == false         // true ([] → '' → 0 → false)

// The famous gotcha
[] == ![]           // true
// Breakdown: ![] is false (array is truthy, negated)
// [] == false → [] → '' → 0, false → 0, so 0 == 0 ✓
```

**Golden rule for interviews:** Always explain that `===` avoids all this confusion by checking both type and value.

---

## Object to Primitive Conversion

```javascript
// Objects convert to primitives via:
// 1. valueOf()  2. toString()

const obj = {
  valueOf() { return 42; },
  toString() { return 'custom'; }
};

String(obj);   // 'custom' (hint 'string' → toString)
Number(obj);   // 42 (hint 'number' → valueOf)

obj + '';      // '42' (hint 'default' → valueOf first)

// Arrays: valueOf returns array (not primitive), falls back to toString
[1,2].valueOf()   // [1, 2] — not primitive, use toString
[1,2].toString()  // '1,2'
```

---

## Safe Type Checking Patterns

```javascript
// Check if value is actually a number (not NaN, not Infinity)
function isValidNumber(value) {
  return typeof value === 'number' && 
         !isNaN(value) && 
         isFinite(value);
}

// Check for null OR undefined
function isNullish(value) {
  return value == null;  // catches both null and undefined
  // or: value === null || value === undefined
}

// Check for empty (null, undefined, '', [], {})
function isEmpty(value) {
  if (value == null) return true;
  if (typeof value === 'string' || Array.isArray(value)) {
    return value.length === 0;
  }
  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }
  return false;
}

// Safe array check
function isArray(value) {
  return Array.isArray(value);
  // NOT: typeof value === 'object' && value.length !== undefined
  // (that would catch {length: 0} objects too!)
}
```

---

## Common Interview Questions

### Q: What's the output?
```javascript
console.log(typeof null);        // 'object' (known bug)
console.log(typeof NaN);         // 'number' (NaN IS a number type!)
console.log(NaN === NaN);        // false (NaN never equals itself)
console.log(isNaN('hello'));     // true (converts to number first!)
console.log(Number.isNaN('hello')); // false (no coercion)
```

### Q: Fix this type bug
```javascript
// User input comes as string
const input = '5';
const result = input + 10;  // '510' not 15!

// Fix: explicit conversion
const result = Number(input) + 10;  // 15
// or: const result = +input + 10; (unary plus)
// or: const result = parseInt(input, 10) + 10;
```

### Q: Explain `[] + {}` vs `{} + []`
```javascript
[] + {}     // '[object Object]' (array→'', object→'[object Object]')
{} + []     // 0 in some contexts! Why?

// In statement position, {} is block, not object
// So {} + [] becomes: empty block, then +[]
// +[] coerces [] to number → 0

// But in expression: ({} + []) → '[object Object]'
```

### Q: Deep clone an object (interview coding task)
```javascript
// Shallow clone (wrong for nested objects)
const shallow = { ...obj };  // or Object.assign({}, obj)

// Deep clone approaches:
// 1. Structured clone (modern browsers)
const deep1 = structuredClone(obj);

// 2. JSON method (loses functions, dates, undefined, circular refs)
const deep2 = JSON.parse(JSON.stringify(obj));

// 3. Manual recursive (handles most cases)
function deepClone(obj, hash = new WeakMap()) {
  if (Object(obj) !== obj) return obj;  // primitive
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof RegExp) return new RegExp(obj);
  if (hash.has(obj)) return hash.get(obj);  // circular reference
  
  const result = Array.isArray(obj) ? [] : {};
  hash.set(obj, result);
  
  for (const key of Reflect.ownKeys(obj)) {
    result[key] = deepClone(obj[key], hash);
  }
  return result;
}
```

---

## Next Steps

Move to [03 — Scope, Hoisting & Closures](03-SCOPE-HOISTING-CLOSURES.md) — the most important JS concept for interviews.
