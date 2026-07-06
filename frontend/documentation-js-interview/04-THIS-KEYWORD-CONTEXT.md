# 04 — The `this` Keyword & Execution Context

## Why This File Exists

`this` is one of the most confusing parts of JavaScript. Interviewers love testing your understanding of how `this` gets its value — it's determined by **how a function is called**, not where it's defined.

---

## The Four Rules of `this`

### Rule 1: Default Binding (Global)
```javascript
function sayName() {
  console.log(this.name);
}

const name = 'Global';
sayName();  // 'Global' (in non-strict mode)
// In strict mode: undefined (no global fallback)

// In browser, `this` is window
// In Node.js, `this` is global object
```

### Rule 2: Implicit Binding (Object Method)
```javascript
const person = {
  name: 'Alice',
  sayName: function() {
    console.log(this.name);
  }
};

person.sayName();  // 'Alice' — `this` is the object before the dot

// BUT: loses binding when referenced
const say = person.sayName;
say();  // 'Global' or undefined — implicit binding lost!
```

### Rule 3: Explicit Binding (call, apply, bind)
```javascript
function introduce(greeting) {
  console.log(`${greeting}, I'm ${this.name}`);
}

const alice = { name: 'Alice' };
const bob = { name: 'Bob' };

// call — invoke with specific this, arguments as list
introduce.call(alice, 'Hello');  // 'Hello, I'm Alice'

// apply — same, but arguments as array
introduce.apply(bob, ['Hi']);    // 'Hi, I'm Bob'

// bind — returns new function with this permanently set
const aliceIntro = introduce.bind(alice);
aliceIntro('Hey');  // 'Hey, I'm Alice'

// bind with partial application
const greetAlice = introduce.bind(alice, 'Good morning');
greetAlice();  // 'Good morning, I'm Alice'
```

### Rule 4: `new` Binding (Constructor)
```javascript
function Person(name) {
  // When called with `new`:
  // 1. New empty object created
  // 2. `this` bound to that object
  // 3. Prototype linked
  // 4. Object returned (unless explicit return)
  this.name = name;
}

const alice = new Person('Alice');
console.log(alice.name);  // 'Alice'

// With ES6 classes (same mechanics)
class PersonClass {
  constructor(name) {
    this.name = name;
  }
}
```

---

## Arrow Functions and `this`

### Arrow Functions DON'T Have Their Own `this`

They inherit `this` from the **enclosing lexical scope** (where written, not where called).

```javascript
const person = {
  name: 'Alice',
  
  // Regular function — this = person
  sayNameRegular: function() {
    console.log(this.name);  // 'Alice'
  },
  
  // Arrow function — this = outer scope (global/undefined)
  sayNameArrow: () => {
    console.log(this.name);  // 'Global' or undefined
  },
  
  // Common pattern: arrow in nested function
  delayedGreeting: function() {
    setTimeout(() => {
      console.log(`Hi, ${this.name}`);  // 'Alice' — inherits from delayedGreeting
    }, 100);
  }
};

// Pre-arrow workaround (var self = this;)
delayedGreetingOld: function() {
  var self = this;  // Capture this
  setTimeout(function() {
    console.log(`Hi, ${self.name}`);  // 'Alice'
  }, 100);
}
```

### Arrow Function Gotchas
```javascript
// ❌ Arrow function as method (loses object context)
const badPerson = {
  name: 'Bad',
  greet: () => {
    console.log(this.name);  // undefined, not 'Bad'!
  }
};

// ✅ Regular function as method
const goodPerson = {
  name: 'Good',
  greet: function() {
    console.log(this.name);  // 'Good'
  }
};

// ✅ Arrow function in callback (preserves this)
const bestPerson = {
  name: 'Best',
  friends: ['Alice', 'Bob'],
  showFriends: function() {
    this.friends.forEach(friend => {
      console.log(`${this.name} is friends with ${friend}`);
      // 'this.name' works because arrow inherits from showFriends
    });
  }
};
```

---

## Explicit Binding in Practice

### Borrowing Methods
```javascript
const alice = {
  name: 'Alice',
  introduce: function() {
    console.log(`I'm ${this.name}`);
  }
};

const bob = { name: 'Bob' };

// Borrow introduce method
alice.introduce.call(bob);  // 'I'm Bob'

// Real-world: Array methods on array-like objects
const arrayLike = { 0: 'a', 1: 'b', length: 2 };
const realArray = Array.prototype.slice.call(arrayLike);  // ['a', 'b']
// Modern: Array.from(arrayLike)
```

### `bind` for Event Handlers
```javascript
class Button {
  constructor(label) {
    this.label = label;
    // Without bind, `this` would be the button element
    this.handleClick = this.handleClick.bind(this);
  }
  
  handleClick() {
    console.log(`Clicked: ${this.label}`);
  }
}

const myButton = new Button('Submit');
document.getElementById('btn').addEventListener('click', myButton.handleClick);

// Alternative: arrow function property (class field)
class ModernButton {
  constructor(label) {
    this.label = label;
  }
  
  // Class field with arrow — no bind needed!
  handleClick = () => {
    console.log(`Clicked: ${this.label}`);
  };
}
```

---

## Common Interview Scenarios

### Q: What's the output?
```javascript
const obj = {
  value: 42,
  getValue: function() {
    return this.value;
  }
};

const fn = obj.getValue;
console.log(obj.getValue());  // 42
console.log(fn());            // undefined (or global value)
```

### Q: Fix the context issue
```javascript
const user = {
  name: 'John',
  greet: function() {
    console.log(`Hello, ${this.name}`);
  }
};

// Problem
setTimeout(user.greet, 100);  // 'Hello, undefined'

// Solutions:
// 1. Wrapper function
setTimeout(() => user.greet(), 100);

// 2. Bind
setTimeout(user.greet.bind(user), 100);

// 3. Arrow function in object (if class)
const user2 = {
  name: 'John',
  greet: () => console.log(`Hello, ${this.name}`)  // Would need outer this
};
```

### Q: What's logged?
```javascript
function Foo() {
  this.value = 42;
  
  setTimeout(function() {
    console.log(this.value);  // undefined
  }, 100);
  
  setTimeout(() => {
    console.log(this.value);  // 42
  }, 100);
}

new Foo();
```

### Q: Implement `call`
```javascript
Function.prototype.myCall = function(context, ...args) {
  // Handle null/undefined context
  context = context || globalThis;
  
  // Create unique property to avoid conflicts
  const fnSymbol = Symbol('fn');
  context[fnSymbol] = this;
  
  // Execute with context
  const result = context[fnSymbol](...args);
  
  // Cleanup
  delete context[fnSymbol];
  
  return result;
};

// Usage
function greet(greeting) {
  return `${greeting}, ${this.name}`;
}

const person = { name: 'Alice' };
greet.myCall(person, 'Hello');  // 'Hello, Alice'
```

---

## Execution Context Summary

```javascript
// Global Execution Context
// └─ Global Object (window/global)
// └─ this = global object

// Function Execution Context (created when function called)
// └─ Variable Environment (var declarations)
// └─ Lexical Environment (let/const + outer reference)
// └─ this binding (determined by call site)

class MyClass {
  method() {
    // Function context created
    // this = instance (due to method call)
  }
}
```

---

## Next Steps

Move to [05 — Prototypes & Inheritance](05-PROTOTYPES-INHERITANCE.md) to understand JavaScript's object model.
