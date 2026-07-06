# 08 — Arrays, Objects & Methods

## Why This File Exists

Manipulating arrays and objects is the bread-and-butter of JavaScript interviews. You will be asked to implement `map`, `filter`, `reduce`, deep clone, flatten arrays, and more.

---

## Array Methods

### map, filter, reduce
```javascript
const numbers = [1, 2, 3, 4, 5];

// map: transform each element
const doubled = numbers.map(n => n * 2);  // [2, 4, 6, 8, 10]

// filter: keep matching
const evens = numbers.filter(n => n % 2 === 0);  // [2, 4]

// reduce: aggregate
const sum = numbers.reduce((acc, n) => acc + n, 0);  // 15

// Interview: Implement map
Array.prototype.myMap = function(fn) {
  const result = [];
  for (let i = 0; i < this.length; i++) {
    result[i] = fn(this[i], i, this);
  }
  return result;
};
```

### find, some, every, sort
```javascript
const users = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];

const alice = users.find(u => u.name === 'Alice');
const hasBob = users.some(u => u.name === 'Bob');
const allHaveNames = users.every(u => u.name);

// Sort (mutates!)
const sorted = [...users].sort((a, b) => a.name.localeCompare(b.name));
```

### flat, flatMap
```javascript
const nested = [1, [2, 3], [4, [5, 6]]];
nested.flat(2);  // [1, 2, 3, 4, 5, 6]

['a b', 'c d'].flatMap(s => s.split(' '));  // ['a','b','c','d']
```

---

## Object Methods

```javascript
const obj = { a: 1, b: 2 };

Object.keys(obj);     // ['a', 'b']
Object.values(obj);   // [1, 2]
Object.entries(obj);  // [['a',1], ['b',2]]

const copy = { ...obj };  // Shallow clone
const merged = Object.assign({}, obj, { c: 3 });
```

---

## Common Interview Tasks

### Deep Clone
```javascript
function deepClone(obj, hash = new WeakMap()) {
  if (Object(obj) !== obj) return obj;
  if (hash.has(obj)) return hash.get(obj);
  if (obj instanceof Date) return new Date(obj);
  
  const result = Array.isArray(obj) ? [] : {};
  hash.set(obj, result);
  
  for (const key of Reflect.ownKeys(obj)) {
    result[key] = deepClone(obj[key], hash);
  }
  return result;
}
```

### Flatten Array
```javascript
function flatten(arr) {
  return arr.reduce((acc, val) => 
    Array.isArray(val) ? [...acc, ...flatten(val)] : [...acc, val], []
  );
}
// Or: arr.flat(Infinity)
```

### Remove Duplicates
```javascript
const unique = [...new Set(arr)];
// Or: arr.filter((item, index) => arr.indexOf(item) === index);
```

### Group By
```javascript
function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const group = item[key];
    acc[group] = acc[group] || [];
    acc[group].push(item);
    return acc;
  }, {});
}
```

---

## Next Steps

Move to [09 — Advanced Functions](09-FUNCTIONS-ADVANCED.md) for currying, memoization, and higher-order functions.
