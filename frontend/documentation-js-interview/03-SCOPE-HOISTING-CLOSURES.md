# 03 — Scope, Hoisting & Closures

## Why This File Exists

Closures are the #1 most-asked JavaScript interview topic. Combined with scope and hoisting, this trio separates junior developers from seniors. This file explains the mechanics with real code examples.

---

## Scope

### Global Scope
```javascript
const globalVar = 'I am everywhere';

function foo() {
  console.log(globalVar);  // Can access global
}

// Problem: variables without declaration become global
function oops() {
  accidental = 'Oops!';  // No var/let/const → becomes global!
}
oops();
console.log(accidental);  // 'Oops!' — leaked to global scope
```

### Function Scope
```javascript
function outer() {
  const secret = 'hidden';
  
  function inner() {
    console.log(secret);  // ✓ Can access outer's variable
  }
  inner();
}

console.log(secret);  // ✗ ReferenceError — not accessible outside
```

### Block Scope (ES6)
```javascript
if (true) {
  const blockScoped = 'inside block';
  let alsoBlocked = 'me too';
  var functionScoped = 'I leak out';
}

console.log(functionScoped);   // ✓ 'I leak out'
console.log(blockScoped);        // ✗ ReferenceError
console.log(alsoBlocked);        // ✗ ReferenceError

// Same with for loops
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);  // 0, 1, 2
}

for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);  // 3, 3, 3 (all share same i!)
}
```

### Lexical Scope

**Lexical = "where written" not "where called"**

```javascript
const outerVar = 'I am outside';

function outer() {
  const middleVar = 'I am middle';
  
  function inner() {
    const innerVar = 'I am inside';
    console.log(outerVar, middleVar, innerVar);  // All accessible!
  }
  
  return inner;
}

const innerFn = outer();  // outer() has finished executing
innerFn();  // Still has access to middleVar!
// Output: 'I am outside', 'I am middle', 'I am inside'
```

**Key point:** Scope is determined at write-time, not run-time. JavaScript looks up the scope chain (inside → outer → global).

---

## Hoisting

### Variable Hoisting
```javascript
// What you write:
console.log(x);
var x = 5;

// What JavaScript sees (conceptually):
var x;          // Declaration hoisted
console.log(x);  // undefined
x = 5;          // Assignment stays here

// Output: undefined
```

### Function Hoisting
```javascript
// Function declarations are fully hoisted
sayHello();  // ✓ Works!

function sayHello() {
  console.log('Hello!');
}

// Function expressions are NOT hoisted (only variable is)
sayGoodbye();  // ✗ TypeError: sayGoodbye is not a function

var sayGoodbye = function() {
  console.log('Goodbye!');
};

// Arrow functions same as expressions
greet();  // ✗ TypeError
const greet = () => console.log('Hi');
```

### `let` and `const` Hoisting (TDZ)
```javascript
// They ARE hoisted, but in "Temporal Dead Zone"
console.log(a);  // undefined (var)
var a = 1;

console.log(b);  // ReferenceError (TDZ!)
let b = 2;

// TDZ extends from start of block to declaration
{
  // TDZ starts here
  console.log(c);  // ReferenceError
  let c = 3;       // TDZ ends here
}
```

---

## Closures

### What is a Closure?

A closure is a function that **remembers** the variables from its outer scope even after the outer function has finished executing.

```javascript
function makeCounter() {
  let count = 0;  // This variable is "enclosed"
  
  return {
    increment: function() {
      count++;           // Still has access to count!
      return count;
    },
    decrement: function() {
      count--;
      return count;
    },
    getCount: function() {
      return count;
    }
  };
}

const counter = makeCounter();
console.log(counter.getCount());  // 0
console.log(counter.increment()); // 1
console.log(counter.increment()); // 2
console.log(counter.decrement()); // 1

// count is private — cannot be accessed directly!
console.log(counter.count);  // undefined
```

### Closure Use Cases

#### 1. Data Privacy (Module Pattern)
```javascript
const bankAccount = (function() {
  let balance = 0;  // Private
  
  return {
    deposit: function(amount) {
      if (amount > 0) {
        balance += amount;
        return balance;
      }
    },
    withdraw: function(amount) {
      if (amount <= balance) {
        balance -= amount;
        return balance;
      }
      return 'Insufficient funds';
    },
    getBalance: function() {
      return balance;
    }
  };
})();

bankAccount.deposit(100);
console.log(bankAccount.getBalance());  // 100
// balance is completely hidden from outside
```

#### 2. Factory Functions
```javascript
function createMultiplier(factor) {
  // factor is captured in closure
  return function(number) {
    return number * factor;
  };
}

const double = createMultiplier(2);
const triple = createMultiplier(3);

console.log(double(5));  // 10
console.log(triple(5));  // 15
// Each has its own 'factor' in closure
```

#### 3. Event Handlers with Preserved State
```javascript
function setupButtonHandlers() {
  for (let i = 1; i <= 3; i++) {
    const button = document.getElementById(`btn-${i}`);
    button.addEventListener('click', function() {
      console.log(`Button ${i} clicked`);  // i captured in closure
    });
  }
}

// Common interview bug (with var instead of let):
function brokenSetup() {
  for (var i = 1; i <= 3; i++) {
    document.getElementById(`btn-${i}`)
      .addEventListener('click', function() {
        console.log(`Button ${i} clicked`);  // Always 'Button 4'!
      });
  }
}

// Fix 1: Use let (block scope, new i each iteration)
// Fix 2: IIFE to create new scope
for (var i = 1; i <= 3; i++) {
  (function(capturedI) {
    document.getElementById(`btn-${capturedI}`)
      .addEventListener('click', function() {
        console.log(`Button ${capturedI} clicked`);
      });
  })(i);
}
```

#### 4. Memoization
```javascript
function memoize(fn) {
  const cache = {};  // Private cache in closure
  
  return function(...args) {
    const key = JSON.stringify(args);
    
    if (key in cache) {
      console.log('Cache hit!');
      return cache[key];
    }
    
    console.log('Computing...');
    const result = fn.apply(this, args);
    cache[key] = result;
    return result;
  };
}

const slowFib = memoize(function fib(n) {
  if (n < 2) return n;
  return fib(n - 1) + fib(n - 2);
});

console.log(slowFib(35));  // Computing...
console.log(slowFib(35));  // Cache hit!
```

---

## Scope Chain Lookup

```javascript
const global = 'global';

function outer() {
  const outer = 'outer';
  
  function middle() {
    const middle = 'middle';
    
    function inner() {
      const inner = 'inner';
      console.log(global, outer, middle, inner);  // All found!
    }
    
    inner();
  }
  
  middle();
}

// Lookup order: inner → middle → outer → global
```

---

## Common Interview Questions

### Q: What's logged?
```javascript
var x = 10;

function foo() {
  console.log(x);  // undefined, not 10!
  var x = 20;
}

foo();
```
**Answer:** `undefined`. The local `var x` is hoisted to top of `foo`, shadowing the global `x`. At the `console.log`, it's declared but not assigned yet.

### Q: What's logged?
```javascript
let x = 10;

function foo() {
  console.log(x);  // ReferenceError!
  let x = 20;
}

foo();
```
**Answer:** ReferenceError. `let` is hoisted into TDZ. You cannot access it before declaration, even though a global `x` exists.

### Q: Create a closure-based private counter
```javascript
function createCounter() {
  let count = 0;
  
  return {
    increment: () => ++count,
    decrement: () => --count,
    getCount: () => count,
    reset: () => { count = 0; return count; }
  };
}
```

### Q: Fix the closure loop problem
```javascript
// Problem: All log "5"
for (var i = 0; i < 5; i++) {
  setTimeout(() => console.log(i), 100);
}

// Solution 1: Use let (block scope)
for (let i = 0; i < 5; i++) {
  setTimeout(() => console.log(i), 100);
}

// Solution 2: Pass i as argument
for (var i = 0; i < 5; i++) {
  setTimeout((j) => console.log(j), 100, i);
}

// Solution 3: IIFE
for (var i = 0; i < 5; i++) {
  (function(captured) {
    setTimeout(() => console.log(captured), 100);
  })(i);
}
```

### Q: What does this output?
```javascript
const add = (function() {
  let counter = 0;
  return function() {
    counter += 1;
    return counter;
  }
})();

console.log(add());  // 1
console.log(add());  // 2
console.log(add());  // 3
```
**Explanation:** The IIFE runs once, returning the inner function which closes over `counter`. Each call to `add()` uses the same `counter` variable.

---

## Next Steps

Move to [04 — The `this` Keyword & Execution Context](04-THIS-KEYWORD-CONTEXT.md) — the second most confusing JS concept after closures.
