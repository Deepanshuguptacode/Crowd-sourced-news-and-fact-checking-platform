# 03 — Objects, Prototypes & The `this` Keyword

## Why This File Exists
JavaScript's object system is fundamentally different from C++. While C++ uses class-based inheritance with compile-time definitions, JavaScript uses **prototypal inheritance** with objects linked at runtime. Understanding prototypes and `this` is essential for interviews — this is one of the top 3 most-asked topics.

---

## Objects — The Basics

### In C++ (What You Know)

```cpp
struct Person {
    string name;
    int age;
    void greet() { cout << "Hello " << name; }
};

Person p = {"Alice", 25};  // Object creation
p.greet();                  // Method call
```

### In JavaScript (What's Different)

```javascript
// Object literal (most common)
const person = {
  name: "Alice",
  age: 25,
  greet: function() {
    console.log("Hello " + this.name);
  }
};

// Accessing properties
dot notation:    person.name     // "Alice"
bracket notation: person["name"]  // "Alice"

// Adding new properties
person.city = "NYC";
person["country"] = "USA";

// Deleting properties
delete person.age;

// Checking if property exists
"name" in person        // true
person.hasOwnProperty("name")  // true
person.hasOwnProperty("toString") // false (inherited from prototype)
```

### Bracket Notation vs Dot Notation

```javascript
const obj = { name: "Alice", age: 25 };

// Dot notation — use when you know the property name
obj.name;  // "Alice"

// Bracket notation — use when property name is dynamic
const key = "name";
obj[key];  // "Alice"

// Bracket notation also needed for property names with special characters
const weird = {
  "first name": "Alice",     // space in name
  "123": "numeric key",       // numeric string
  [Symbol()]: "symbol key"    // symbol key
};

weird["first name"];  // "Alice"
weird["123"];         // "numeric key"
// weird.123 would be syntax error
```

---

## The `this` Keyword — The Most Confusing Part of JS

### In C++ (What You Know)

```cpp
class Person {
    string name;
public:
    void greet() {
        cout << "Hello " << this->name;  // this always points to the object
    }
};
```

In C++, `this` always refers to the current object instance. It's predictable.

### In JavaScript (What's Different)

JavaScript's `this` is **dynamic** — it depends on **how the function is called**, not where it's defined.

#### Rule 1: Global Context (Default)

```javascript
console.log(this);  // In browser: window object
                    // In Node.js: global object (or {} in modules)

function showThis() {
  console.log(this);  // In browser: window (non-strict mode)
                      // undefined (strict mode)
}
showThis();
```

#### Rule 2: Object Method — `this` = The Object

```javascript
const person = {
  name: "Alice",
  greet: function() {
    console.log(this.name);  // "Alice" — this = person object
  }
};
person.greet();
```

#### Rule 3: Arrow Functions — `this` = Outer Scope

```javascript
const person = {
  name: "Alice",
  greet: () => {
    console.log(this.name);  // undefined — this = outer scope (window/global)
  }
};
person.greet();
```

Arrow functions **do not have their own `this`**. They inherit `this` from where they were defined.

```javascript
// Practical example with nested function
const person = {
  name: "Alice",
  friends: ["Bob", "Carol"],

  // WRONG — regular function loses `this`
  greetFriendsWrong: function() {
    this.friends.forEach(function(friend) {
      console.log(this.name + " says hi to " + friend);  // ERROR: this.name undefined
    });
  },

  // CORRECT — arrow function preserves `this`
  greetFriendsRight: function() {
    this.friends.forEach(friend => {
      console.log(this.name + " says hi to " + friend);  // "Alice says hi to Bob"
    });
  }
};
```

#### Rule 4: Constructor Functions — `this` = New Instance

```javascript
function Person(name) {
  this.name = name;  // this = the new object being created
}

const alice = new Person("Alice");
console.log(alice.name);  // "Alice"
```

#### Rule 5: Explicit Binding — `call`, `apply`, `bind`

```javascript
function greet() {
  console.log("Hello " + this.name);
}

const person1 = { name: "Alice" };
const person2 = { name: "Bob" };

// call — invoke with specific `this` and arguments
greet.call(person1);           // "Hello Alice"
greet.call(person2, "morning"); // "Hello Bob" (args after this)

// apply — invoke with specific `this` and array of arguments
greet.apply(person1);          // "Hello Alice"
greet.apply(person2, ["morning"]); // "Hello Bob"

// bind — return a new function with fixed `this`
const greetAlice = greet.bind(person1);
greetAlice();  // "Hello Alice" — always bound to Alice
```

#### Summary Table: What is `this`?

| Context | `this` Value |
|---------|-------------|
| Global (non-strict) | `window` (browser) / `global` (Node) |
| Global (strict mode) | `undefined` |
| Function call (non-strict) | `window` |
| Function call (strict mode) | `undefined` |
| Object method | The object |
| Arrow function | `this` from outer scope |
| Constructor (`new`) | The new instance |
| Event handler | The element that triggered event |
| `call`/`apply`/`bind` | Explicitly set |

---

## Prototypes — JavaScript's Inheritance System

### What is a Prototype?

Every JavaScript object has a hidden link to another object called its **prototype**. When you access a property that doesn't exist on the object, JavaScript looks at the prototype.

```
myObject → prototype → prototype's prototype → ... → null
```

This chain is called the **prototype chain**.

```javascript
const animal = {
  eats: true,
  walk: function() {
    console.log("Animal walks");
  }
};

const rabbit = {
  jumps: true
};

// Set animal as rabbit's prototype
Object.setPrototypeOf(rabbit, animal);

console.log(rabbit.jumps);  // true — own property
console.log(rabbit.eats);   // true — inherited from prototype
rabbit.walk();              // "Animal walks" — inherited method

// Check prototype
console.log(Object.getPrototypeOf(rabbit) === animal);  // true
```

### The `__proto__` Property (Deprecated but Useful for Understanding)

```javascript
const obj = {};
console.log(obj.__proto__ === Object.prototype);  // true

// Every object inherits from Object.prototype
// That's why all objects have toString(), valueOf(), etc.
```

### Creating Objects with Specific Prototype

```javascript
// Method 1: Object.create()
const animal = { eats: true };
const rabbit = Object.create(animal);
console.log(rabbit.eats);  // true

// Method 2: Object.setPrototypeOf() (less common, slower)
const cat = {};
Object.setPrototypeOf(cat, animal);

// Method 3: Constructor functions with `new`
function Animal(name) {
  this.name = name;
}
Animal.prototype.eat = function() {
  console.log(this.name + " eats");
};

const dog = new Animal("Rex");
dog.eat();  // "Rex eats" — found on Animal.prototype

// Check the prototype chain
console.log(dog.__proto__ === Animal.prototype);     // true
console.log(Animal.prototype.__proto__ === Object.prototype);  // true
console.log(Object.prototype.__proto__);  // null — end of chain
```

### How `new` Works (Step by Step)

```javascript
function Person(name) {
  this.name = name;
}
Person.prototype.greet = function() {
  console.log("Hi, I'm " + this.name);
};

const alice = new Person("Alice");

// Behind the scenes, `new` does this:
// 1. Create empty object: const obj = {};
// 2. Set prototype: obj.__proto__ = Person.prototype;
// 3. Call constructor with `this` = obj: Person.call(obj, "Alice");
// 4. Return obj (unless constructor returns an object)
```

### Constructor Functions vs ES6 Classes

```javascript
// Old way (pre-ES6)
function Animal(name) {
  this.name = name;
}
Animal.prototype.speak = function() {
  console.log(this.name + " makes a sound");
};

function Dog(name, breed) {
  Animal.call(this, name);  // Call parent constructor
  this.breed = breed;
}
Dog.prototype = Object.create(Animal.prototype);  // Set up inheritance
Dog.prototype.constructor = Dog;  // Fix constructor reference
Dog.prototype.speak = function() {
  console.log(this.name + " barks");
};

// ES6 way (syntactic sugar over prototypes)
class Animal {
  constructor(name) {
    this.name = name;
  }
  speak() {
    console.log(this.name + " makes a sound");
  }
}

class Dog extends Animal {
  constructor(name, breed) {
    super(name);  // Call parent constructor
    this.breed = breed;
  }
  speak() {
    console.log(this.name + " barks");
  }
}
```

**Important:** ES6 classes are just "syntactic sugar" — they still use prototypes underneath.

### Checking Prototype Relationships

```javascript
const dog = new Dog("Rex", "Golden Retriever");

// Check if dog inherits from Dog.prototype
dog instanceof Dog;        // true
dog instanceof Animal;     // true
dog instanceof Object;     // true

// Check if property is own or inherited
dog.hasOwnProperty("name");   // true — own property
dog.hasOwnProperty("speak");  // false — inherited

// Get the prototype
dog.__proto__ === Dog.prototype;           // true
Dog.prototype.__proto__ === Animal.prototype; // true

// Get all own property names
Object.keys(dog);          // ["name", "breed"] (own properties only)
Object.getOwnPropertyNames(dog);  // same

// Get all properties including inherited
for (let key in dog) {
  console.log(key);  // name, breed, speak, constructor...
}
```

### Property Shadowing

```javascript
const animal = {
  name: "Animal",
  speak: function() {
    console.log(this.name + " speaks");
  }
};

const dog = Object.create(animal);
dog.name = "Rex";  // Shadow the prototype's name
dog.speak = function() {
  console.log(this.name + " barks");  // Shadow the prototype's speak
};

console.log(dog.name);   // "Rex" — own property
console.log(animal.name); // "Animal" — unchanged
dog.speak();             // "Rex barks"
```

---

## Object Methods Reference

### Creating Objects

```javascript
// Object literal
const obj1 = { a: 1, b: 2 };

// Object.create() — specify prototype
const obj2 = Object.create(null);  // No prototype at all!
const obj3 = Object.create(obj1);  // obj3 inherits from obj1

// Object.assign() — copy properties
const obj4 = Object.assign({}, obj1, { c: 3 });  // { a: 1, b: 2, c: 3 }

// Object.fromEntries() — from array of [key, value] pairs
const obj5 = Object.fromEntries([["a", 1], ["b", 2]]);  // { a: 1, b: 2 }

// Object.defineProperty() — create property with descriptors
const obj6 = {};
Object.defineProperty(obj6, "readOnly", {
  value: 42,
  writable: false,    // Cannot be changed
  enumerable: true,   // Shows up in for...in loops
  configurable: true  // Can be deleted or reconfigured
});
```

### Reading Properties

```javascript
const obj = { a: 1, b: 2 };

// Get keys (own enumerable properties)
Object.keys(obj);      // ["a", "b"]

// Get values
Object.values(obj);    // [1, 2]

// Get entries [key, value]
Object.entries(obj);   // [["a", 1], ["b", 2]]

// Get own property names (including non-enumerable)
Object.getOwnPropertyNames(obj);  // ["a", "b"]

// Get own property symbols
Object.getOwnPropertySymbols(obj);  // []

// Check if property exists (anywhere in prototype chain)
"toString" in obj;     // true

// Check if own property
obj.hasOwnProperty("toString");  // false
obj.hasOwnProperty("a");         // true

// Get property descriptor
Object.getOwnPropertyDescriptor(obj, "a");
// { value: 1, writable: true, enumerable: true, configurable: true }
```

### Modifying Objects

```javascript
const obj = { a: 1, b: 2 };

// Freeze — make immutable (shallow)
Object.freeze(obj);
obj.a = 10;  // Silently fails (or throws in strict mode)

// Seal — prevent adding/removing properties, but allow changing values
Object.seal(obj);
delete obj.a;  // Fails
obj.a = 10;    // Works

// Prevent extensions — only prevent adding new properties
Object.preventExtensions(obj);
obj.c = 3;  // Fails (silently or throws)

// Check status
Object.isFrozen(obj);
Object.isSealed(obj);
Object.isExtensible(obj);
```

---

## Interview Questions

### Q1: What's the output?
```javascript
const obj = {
  value: 42,
  getValue: function() {
    return this.value;
  }
};
const fn = obj.getValue;
console.log(fn());
```
<details>
<summary>Answer</summary>

`undefined` (or error in strict mode)

When `getValue` is extracted and called as `fn()`, it's no longer called on `obj`. In non-strict mode, `this` becomes `window` (which doesn't have `value`). Fix: `fn.call(obj)` or `obj.getValue()`.
</details>

### Q2: What's the output?
```javascript
function Foo() {}
Foo.prototype.bar = 42;
const foo = new Foo();
Foo.prototype.bar = 100;
console.log(foo.bar);
```
<details>
<summary>Answer</summary>

`100`

The prototype is shared. When you change `Foo.prototype.bar`, all instances that inherit from it see the change.
</details>

### Q3: What's the output?
```javascript
function Foo() {}
const foo = new Foo();
foo.bar = 42;
Foo.prototype.bar = 100;
console.log(foo.bar);
```
<details>
<summary>Answer</summary>

`42`

When you set `foo.bar`, it creates an **own property** on the instance, which shadows the prototype property. Own properties are checked before the prototype chain.
</details>

### Q4: Implement your own `instanceof` operator.
<details>
<summary>Answer</summary>

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

// Test
function Animal() {}
function Dog() {}
Dog.prototype = Object.create(Animal.prototype);

const dog = new Dog();
console.log(myInstanceOf(dog, Dog));     // true
console.log(myInstanceOf(dog, Animal));  // true
console.log(myInstanceOf(dog, Object));  // true
```
</details>

### Q5: What's the difference between `Object.create()` and `new`?
<details>
<summary>Answer</summary>

```javascript
// Object.create(prototype) — creates object with specified prototype, no constructor call
const obj1 = Object.create(Animal.prototype);

// new Constructor() — creates object, sets prototype, calls constructor
const obj2 = new Animal();

// Key difference: new runs the constructor function, Object.create does not
```
</details>

### Q6: What's the output?
```javascript
const obj = {
  a: 1,
  b: 2,
  c: 3
};
for (const key in obj) {
  console.log(key);
}
```
<details>
<summary>Answer</summary>

`a`, `b`, `c` (and any inherited enumerable properties)

`for...in` iterates over all enumerable properties, including those on the prototype chain. Use `hasOwnProperty` to filter:

```javascript
for (const key in obj) {
  if (obj.hasOwnProperty(key)) {
    console.log(key);
  }
}
```
</details>

### Q7: How does `class` syntax differ from constructor functions?
<details>
<summary>Answer</summary>

Classes are syntactic sugar over prototypes:

| Feature | Class | Constructor Function |
|---------|-------|-------------------|
| Methods | Defined in `class` block | Added to `.prototype` |
| Inheritance | `extends` + `super()` | Manual prototype chaining |
| Hoisting | NOT hoisted (like `let`) | Hoisted |
| Must use `new` | Yes (throws without) | Works without `new` |
| `typeof` | "function" | "function" |

Under the hood, they use the same prototype system.
</details>

---

## Exercises

### Exercise 1: Create a Class-like System Using Prototypes
Implement a `createClass` function that works like ES6 classes but uses prototypes.

```javascript
const Animal = createClass({
  constructor: function(name) {
    this.name = name;
  },
  speak: function() {
    console.log(this.name + " speaks");
  }
});

const Dog = createClass(Animal, {
  constructor: function(name, breed) {
    Animal.constructor.call(this, name);
    this.breed = breed;
  },
  speak: function() {
    console.log(this.name + " barks");
  }
});

const dog = new Dog("Rex", "Golden");
dog.speak();  // "Rex barks"
```

<details>
<summary>Solution</summary>

```javascript
function createClass(SuperClass, methods) {
  // Handle case where no superclass is provided
  if (arguments.length === 1) {
    methods = SuperClass;
    SuperClass = null;
  }

  function Constructor(...args) {
    if (methods.constructor) {
      methods.constructor.apply(this, args);
    }
  }

  // Set up inheritance
  if (SuperClass) {
    Constructor.prototype = Object.create(SuperClass.prototype);
    Constructor.prototype.constructor = Constructor;
  }

  // Add methods
  Object.assign(Constructor.prototype, methods);

  return Constructor;
}
```
</details>

### Exercise 2: Implement a Mixin Pattern
Create a function that mixes multiple objects into a target object.

```javascript
const canSwim = {
  swim: function() { console.log(this.name + " swims"); }
};

const canFly = {
  fly: function() { console.log(this.name + " flies"); }
};

function Duck(name) {
  this.name = name;
}

// Mix in capabilities
mixin(Duck.prototype, canSwim, canFly);

const duck = new Duck("Donald");
duck.swim();  // "Donald swims"
duck.fly();   // "Donald flies"
```

<details>
<summary>Solution</summary>

```javascript
function mixin(target, ...sources) {
  sources.forEach(source => {
    Object.keys(source).forEach(key => {
      target[key] = source[key];
    });
  });
  return target;
}
```
</details>

### Exercise 3: Predict the Output
```javascript
function Person(name) {
  this.name = name;
}
Person.prototype.greet = function() {
  return "Hello, I'm " + this.name;
};

const alice = new Person("Alice");
const bob = { name: "Bob" };

console.log(alice.greet());
console.log(Person.prototype.greet.call(bob));
```

<details>
<summary>Solution</summary>

```
"Hello, I'm Alice"
"Hello, I'm Bob"

The second call uses `.call(bob)` to explicitly set `this` to the bob object.
```
</details>

---

## Next Steps
Now that you understand objects, prototypes, and `this`, move on to [04 — Arrays & Strings](04-ARRAYS-STRINGS.md) to learn about every array and string method you'll need in interviews.
