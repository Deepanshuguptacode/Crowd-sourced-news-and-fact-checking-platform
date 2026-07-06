# 05 — Prototypes & Inheritance

## Why This File Exists

JavaScript uses prototypal inheritance, not classical inheritance. Understanding `__proto__`, `prototype`, and the prototype chain is essential for senior interviews. ES6 `class` is syntactic sugar over this system.

---

## The Prototype Chain

### Every Object Has a Prototype
```javascript
const obj = {};
console.log(obj.__proto__);           // Object.prototype
console.log(Object.getPrototypeOf(obj)); // Same, modern syntax

// Object.prototype is the root — its __proto__ is null
console.log(Object.prototype.__proto__);  // null
```

### Property Lookup Chain
```javascript
const animal = {
  eats: true
};

const dog = {
  barks: true
};

// Set dog's prototype to animal
Object.setPrototypeOf(dog, animal);
// Or when creating: const dog = Object.create(animal, { barks: true })

console.log(dog.barks);  // true — own property
console.log(dog.eats);   // true — found on prototype!
console.log(dog.toString);  // function — found on Object.prototype!

// Lookup chain: dog → animal → Object.prototype → null
```

---

## `prototype` vs `__proto__`

### `prototype` — Property of Functions
Only function objects have a `prototype` property. It becomes the `__proto__` of objects created with `new`.

```javascript
function Dog(name) {
  this.name = name;
}

Dog.prototype.bark = function() {
  return `${this.name} says woof!`;
};

const rover = new Dog('Rover');

// What `new` does:
// 1. Create empty object: obj = {}
// 2. Set obj.__proto__ = Dog.prototype
// 3. Call Dog with this = obj
// 4. Return obj

console.log(rover.__proto__ === Dog.prototype);  // true
console.log(rover.bark());  // 'Rover says woof!' (found on prototype)
```

### `__proto__` — Hidden Link in Every Object
Points to the object's prototype. Used for property lookup.

```javascript
const arr = [];
arr.__proto__ === Array.prototype;  // true

const fn = function(){};
fn.__proto__ === Function.prototype;  // true
```

---

## Creating Objects with Different Prototypes

### Object.create()
```javascript
const personPrototype = {
  greet() {
    return `Hello, I'm ${this.name}`;
  }
};

const alice = Object.create(personPrototype);
alice.name = 'Alice';

console.log(alice.greet());  // 'Hello, I'm Alice'
console.log(Object.getPrototypeOf(alice) === personPrototype);  // true
```

### Constructor Functions
```javascript
function Person(name) {
  // Instance properties (each object gets its own copy)
  this.name = name;
}

// Shared methods (one copy for all instances)
Person.prototype.greet = function() {
  return `Hello, I'm ${this.name}`;
};

Person.prototype.walk = function() {
  return `${this.name} is walking`;
};

const bob = new Person('Bob');
const charlie = new Person('Charlie');

// Both share same greet method via prototype
console.log(bob.greet === charlie.greet);  // true (same function reference!)
```

---

## Classical Inheritance Pattern

### Constructor Function Inheritance
```javascript
// Parent
function Animal(name) {
  this.name = name;
  this.isAlive = true;
}

Animal.prototype.eat = function() {
  return `${this.name} is eating`;
};

// Child
function Dog(name, breed) {
  // Call parent constructor with child's this
  Animal.call(this, name);
  this.breed = breed;
}

// Inherit from Animal's prototype
Dog.prototype = Object.create(Animal.prototype);

// Fix constructor pointer
Dog.prototype.constructor = Dog;

// Child-specific methods
Dog.prototype.bark = function() {
  return `${this.name} barks!`;
};

const rover = new Dog('Rover', 'Labrador');
rover.eat();   // 'Rover is eating' (inherited)
rover.bark();  // 'Rover barks!' (own)
```

---

## ES6 Class Syntax (Syntactic Sugar)

### Same Mechanics, Nicer Syntax
```javascript
class Animal {
  constructor(name) {
    this.name = name;
  }
  
  eat() {
    return `${this.name} is eating`;
  }
  
  // Static method — on class, not instances
  static isAnimal(obj) {
    return obj instanceof Animal;
  }
}

class Dog extends Animal {
  constructor(name, breed) {
    super(name);  // Call parent constructor
    this.breed = breed;
  }
  
  bark() {
    return `${this.name} barks!`;
  }
  
  // Override parent method
  eat() {
    return `${this.name} the ${this.breed} is eating`;
  }
}

const rover = new Dog('Rover', 'Labrador');
console.log(rover.eat());  // Uses overridden version

// Under the hood: same prototype chain as constructor function version!
console.log(rover.__proto__ === Dog.prototype);  // true
console.log(Dog.prototype.__proto__ === Animal.prototype);  // true
```

### Class Gotchas
```javascript
// Classes are NOT hoisted
const obj = new MyClass();  // ReferenceError
class MyClass {}  // Classes not hoisted like functions

// Class methods are non-enumerable (unlike object methods)
class Foo {
  method() {}
}
const foo = new Foo();
console.log(Object.keys(foo));  // [] — no enumerable keys

// 'this' in class methods can be lost
class Button {
  constructor(label) {
    this.label = label;
  }
  handleClick() {
    console.log(this.label);
  }
}

const btn = new Button('Click me');
const fn = btn.handleClick;
fn();  // TypeError: Cannot read property 'label' of undefined

// Fix: Bind in constructor or use class fields
class FixedButton {
  constructor(label) {
    this.label = label;
    this.handleClick = this.handleClick.bind(this);
  }
  handleClick() {
    console.log(this.label);
  }
}
// Or use arrow function class field
class ModernButton {
  label = 'Click me';  // Class field
  handleClick = () => {  // Arrow binds to instance
    console.log(this.label);
  };
}
```

---

## Checking Prototype Relationships

```javascript
const arr = [];

// instanceof — checks prototype chain
arr instanceof Array;       // true
arr instanceof Object;      // true (chain goes up)

// isPrototypeOf
Array.prototype.isPrototypeOf(arr);  // true
Object.prototype.isPrototypeOf(arr); // true

// Object.getPrototypeOf
Object.getPrototypeOf(arr) === Array.prototype;  // true

// hasOwnProperty — only own properties, not inherited
arr.hasOwnProperty('length');  // true
arr.hasOwnProperty('map');     // false (inherited from Array.prototype)
```

---

## Common Interview Questions

### Q: What's the prototype chain of `[]`?
```javascript
const arr = [];
arr.__proto__ === Array.prototype;     // true
Array.prototype.__proto__ === Object.prototype;  // true
Object.prototype.__proto__ === null;     // true

// Chain: [] → Array.prototype → Object.prototype → null
```

### Q: Implement `instanceof`
```javascript
function myInstanceOf(obj, constructor) {
  let proto = Object.getPrototypeOf(obj);
  
  while (proto !== null) {
    if (proto === constructor.prototype) {
      return true;
    }
    proto = Object.getPrototypeOf(proto);
  }
  
  return false;
}

myInstanceOf([], Array);    // true
myInstanceOf([], Object);   // true
myInstanceOf({}, Array);    // false
```

### Q: Difference between `__proto__` and `prototype`?
- `__proto__`: The actual prototype of an object (internal link, all objects have it)
- `prototype`: A property on constructor functions, used as prototype for new instances

### Q: How to create an object without prototype?
```javascript
const pure = Object.create(null);
console.log(pure.__proto__);  // undefined
console.log(pure.toString);   // undefined (no Object.prototype!)

// Use case: safe dictionary (no inherited properties)
const dict = Object.create(null);
dict['toString'] = 'value';  // No conflict with Object.prototype.toString
```

### Q: Explain the output
```javascript
function A() {}
function B() {}

B.prototype = Object.create(A.prototype);
const b = new B();

console.log(b instanceof B);  // true
console.log(b instanceof A);  // true (in prototype chain)
console.log(b.constructor);   // A! (B.prototype.constructor is A)
// Fix: B.prototype.constructor = B;
```

---

## Next Steps

Move to [06 — Asynchronous JavaScript](06-ASYNC-JAVASCRIPT.md) — the most practical and frequently-tested topic.
