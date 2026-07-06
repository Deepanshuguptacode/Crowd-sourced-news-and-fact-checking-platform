# JavaScript Interview Preparation — Documentation Hub

## Navigation Hub

Welcome to the **JavaScript Interview Preparation** series. This documentation is designed for developers who already understand programming concepts (especially C++) and want to master JavaScript for interviews. Each document explains concepts in simple language, covers every method/function, and includes interview questions with exercises and solutions.

---

## Who Is This For?

You already know programming — variables, loops, functions, OOP — probably from C++. This series **bridges the gap** between what you know and what JavaScript does differently. Wherever possible, we compare JS with C++ so you can map your existing knowledge.

---

## How to Use These Docs

1. **Read in order** if you're learning JS from scratch (with C++ background)
2. **Jump to any topic** if you need a refresher before an interview
3. **Solve every exercise** — they're modeled after real interview questions
4. **Review the interview questions** at the end of each doc before your interview

---

## Documentation Files

### Foundation (Start Here)
| # | File | What You'll Learn |
|---|------|-------------------|
| 01 | [JS Fundamentals](01-JS-FUNDAMENTALS.md) | Variables (`var/let/const`), data types, type coercion, operators — C++ vs JS |
| 02 | [Functions, Scope & Closures](02-FUNCTIONS-SCOPE-CLOSURES.md) | Function types, scope chain, closures, hoisting, IIFE |
| 03 | [Objects & Prototypes](03-OBJECTS-PROTOTYPES.md) | Objects, `this` keyword, prototypes, inheritance, classes vs constructor functions |

### Core JavaScript
| # | File | What You'll Learn |
|---|------|-------------------|
| 04 | [Arrays & Strings](04-ARRAYS-STRINGS.md) | Every array method (`map`, `filter`, `reduce`, etc.), string methods, common patterns |
| 05 | [Asynchronous JavaScript](05-ASYNC-JS.md) | Event loop, callbacks, Promises, `async/await`, microtasks vs macrotasks |
| 06 | [ES6+ Features](06-ES6-FEATURES.md) | Destructuring, spread/rest, template literals, modules, optional chaining |

### Advanced Topics
| # | File | What You'll Learn |
|---|------|-------------------|
| 07 | [Error Handling](07-ERROR-HANDLING.md) | Try/catch, custom errors, error types, async error handling, debugging |
| 08 | [DOM & Events](08-DOM-EVENTS.md) | DOM manipulation, event handling, event delegation, browser APIs |
| 09 | [DSA in JavaScript](09-DSA-IN-JS.md) | Stacks, queues, linked lists, trees, graphs, sorting — all in JS |

### Quick Reference
| # | File | What You'll Learn |
|---|------|-------------------|
| 10 | [Interview Cheat Sheet](10-INTERVIEW-CHEAT-SHEET.md) | Quick patterns, tricky outputs, common gotchas, last-minute revision |

---

## Recommended Reading Order

**If you're new to JavaScript (coming from C++):**
```
01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10
```

**If you have 2 days before an interview:**
```
04 → 05 → 02 → 03 → 10
(Focus on arrays, async, closures, and the cheat sheet)
```

**If you want to practice coding problems:**
```
09 → 04 → 10
(DSA in JS, Array/String methods, Cheat sheet)
```

---

## C++ vs JavaScript — Quick Mental Model

| Concept | C++ | JavaScript |
|---------|-----|------------|
| Variable declaration | `int x = 5;` | `let x = 5;` (type inferred) |
| Memory management | Manual (`new`/`delete`) | Automatic (Garbage Collection) |
| OOP | Classes, inheritance | Prototypal inheritance + ES6 classes |
| Async | Threads, mutex | Single-threaded event loop |
| Strings | `std::string` | Primitive + String object |
| Arrays | Fixed size / `std::vector` | Dynamic, heterogeneous |
| Functions | Strict signatures | Flexible, first-class citizens |
| Compilation | Compiled ahead of time | JIT compiled at runtime |
| Type system | Static (compile-time) | Dynamic (runtime) |

---

## Key Interview Topics by Frequency

Based on real interview data from top companies:

1. **Closures** — asked in ~80% of JS interviews
2. **Event Loop** — asked in ~70% of JS interviews
3. **`this` keyword** — asked in ~65% of JS interviews
4. **Promises / async-await** — asked in ~75% of JS interviews
5. **Array methods** (`map`, `filter`, `reduce`) — asked in ~60% of JS interviews
6. **Prototypal Inheritance** — asked in ~50% of JS interviews
7. **Hoisting** — asked in ~45% of JS interviews
8. **Scope & Variable Shadowing** — asked in ~40% of JS interviews
9. **ES6 Features** — asked in ~55% of JS interviews
10. **DOM Manipulation** — asked in ~35% of JS interviews
