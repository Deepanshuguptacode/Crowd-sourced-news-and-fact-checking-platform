# 09 — Advanced Functions

## Why This File Exists

Higher-order functions, currying, and memoization are senior-level topics. Interviewers test your functional programming knowledge with these patterns.

---

## Higher-Order Functions

Functions that take or return functions.

```javascript
// Function as argument
function operate(a, b, operation) {
  return operation(a, b);
}
operate(5, 3, (x, y) => x + y);  // 8

// Function as return value
function multiplyBy(factor) {
  return function(number) {
    return number * factor;
  };
}
const double = multiplyBy(2);
double(5);  // 10
```

---

## Currying

Transform function with multiple args into sequence of single-arg functions.

```javascript
// Normal function
function add(a, b, c) {
  return a + b + c;
}

// Curried version
function curryAdd(a) {
  return function(b) {
    return function(c) {
      return a + b + c;
    };
  };
}
const add5 = curryAdd(5);
const add5And3 = add5(3);
add5And3(2);  // 10

// Generic curry function
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    }
    return function(...next) {
      return curried.apply(this, args.concat(next));
    };
  };
}

const curriedAdd = curry((a, b, c) => a + b + c);
curriedAdd(1)(2)(3);  // 6
curriedAdd(1, 2)(3);  // 6
curriedAdd(1)(2, 3);  // 6
```

---

## Memoization

Cache function results to avoid recomputation.

```javascript
function memoize(fn) {
  const cache = new Map();
  return function(...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      console.log('Cache hit!');
      return cache.get(key);
    }
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

const fib = memoize(function(n) {
  if (n < 2) return n;
  return fib(n - 1) + fib(n - 2);
});
```

---

## Debounce & Throttle

```javascript
// Debounce: delay execution until pause
function debounce(fn, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Throttle: limit execution rate
function throttle(fn, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Usage
window.addEventListener('resize', debounce(() => {
  console.log('Resized!');
}, 250));
```

---

## Function Composition

```javascript
const compose = (...fns) => x => fns.reduceRight((v, f) => f(v), x);
const pipe = (...fns) => x => fns.reduce((v, f) => f(v), x);

const add1 = x => x + 1;
const double = x => x * 2;

compose(double, add1)(5);  // 12 (5+1=6, 6*2=12)
pipe(add1, double)(5);     // 12 (5+1=6, 6*2=12)
```

---

## Next Steps

Move to [10 — DOM & Browser APIs](10-DOM-BROWSER-APIs.md).
