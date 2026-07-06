# 12 — Design Patterns in JS

## Why This File Exists

Design patterns are recurring solutions to common problems. Interviewers test your knowledge of patterns to assess your architectural thinking.

---

## Singleton

Ensure only one instance exists.

```javascript
// ES6 Class approach
class Singleton {
  constructor() {
    if (Singleton.instance) {
      return Singleton.instance;
    }
    Singleton.instance = this;
    this.data = [];
  }
}

const s1 = new Singleton();
const s2 = new Singleton();
console.log(s1 === s2);  // true
```

---

## Module Pattern

Encapsulate private and public members.

```javascript
const CounterModule = (function() {
  let count = 0;  // Private
  
  return {
    increment() { return ++count; },
    decrement() { return --count; },
    getCount() { return count; }
  };
})();

CounterModule.increment();  // 1
```

---

## Factory Pattern

Create objects without specifying exact class.

```javascript
class User {}
class Admin extends User {}
class Guest extends User {}

function createUser(type) {
  switch(type) {
    case 'admin': return new Admin();
    case 'guest': return new Guest();
    default: return new User();
  }
}
```

---

## Observer Pattern

Subscribe to events.

```javascript
class EventEmitter {
  constructor() {
    this.events = {};
  }
  
  on(event, callback) {
    this.events[event] = this.events[event] || [];
    this.events[event].push(callback);
  }
  
  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(cb => cb(data));
    }
  }
}

const emitter = new EventEmitter();
emitter.on('data', console.log);
emitter.emit('data', 'Hello');
```

---

## Next Steps

Move to [13 — Error Handling & Debugging](13-ERROR-HANDLING-DEBUGGING.md).
