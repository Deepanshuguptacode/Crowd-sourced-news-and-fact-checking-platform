# JavaScript Interview Preparation Documentation

## Navigation Hub

Welcome to the **JavaScript Interview Preparation** documentation. This guide covers every JavaScript concept you need to crack frontend/backend JS interviews — from fundamentals to advanced patterns, with code examples, interview questions, and practical explanations.

---

## Topics at a Glance

```
┌─────────────────────────────────────────────────────────────────┐
│                    JavaScript Interview Prep                     │
├─────────────────────────────────────────────────────────────────┤
│  Core Language → Async → Browser → Patterns → System Design    │
│                                                                 │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐ │
│  │ Variables  │  │ Promises   │  │ Event Loop │  │ Closure  │ │
│  │ Data Types │  │ Async/Await│  │ DOM API    │  │ Prototype│ │
│  │ Functions  │  │ Callbacks  │  │ Fetch API  │  │ Patterns │ │
│  └────────────┘  └────────────┘  └────────────┘  └──────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Three pillars of JS interviews:**
- **Core Language** — How JS works under the hood (scope, closures, prototypes, event loop)
- **Practical Coding** — Array/object manipulation, async flows, DOM handling
- **System Design** — Module patterns, performance, security, architecture decisions

---

## Documentation Files

### Foundation (Start Here)
| # | File | What You'll Learn |
|---|------|-------------------|
| 01 | [JavaScript Fundamentals](01-JS-FUNDAMENTALS.md) | Variables, let/const/var, truthy/falsy, operators, strict mode |
| 02 | [Data Types & Type Coercion](02-DATA-TYPES-TYPE-COERCION.md) | Primitives vs references, type checking, coercion rules, `==` vs `===` |
| 03 | [Scope, Hoisting & Closures](03-SCOPE-HOISTING-CLOSURES.md) | Lexical scope, hoisting mechanics, closure patterns, private variables |
| 04 | [The `this` Keyword & Execution Context](04-THIS-KEYWORD-CONTEXT.md) | `this` binding rules, call/apply/bind, arrow functions, implicit vs explicit |
| 05 | [Prototypes & Inheritance](05-PROTOTYPES-INHERITANCE.md) | Prototype chain, `__proto__`, class syntax, inheritance patterns |

### Async & Browser
| # | File | What You'll Learn |
|---|------|-------------------|
| 06 | [Asynchronous JavaScript](06-ASYNC-JAVASCRIPT.md) | Callbacks, Promises, async/await, Promise.all/race, error handling |
| 07 | [ES6+ Modern Features](07-ES6-FEATURES.md) | Destructuring, spread/rest, template literals, modules, optional chaining |
| 08 | [Arrays, Objects & Methods](08-ARRAYS-OBJECTS-METHODS.md) | map/filter/reduce, object methods, immutability, deep clone |
| 09 | [Advanced Functions](09-FUNCTIONS-ADVANCED.md) | Higher-order functions, currying, memoization, debounce/throttle, composition |
| 10 | [DOM & Browser APIs](10-DOM-BROWSER-APIs.md) | DOM manipulation, event delegation, localStorage, Fetch API, Web APIs |
| 11 | [Event Loop & Concurrency](11-EVENT-LOOP-CONCURRENCY.md) | Call stack, task queue, microtasks, macrotasks, setTimeout precision |

### Design & Architecture
| # | File | What You'll Learn |
|---|------|-------------------|
| 12 | [Design Patterns in JS](12-DESIGN-PATTERNS.md) | Singleton, Factory, Observer, Module, MVC — when and why to use each |
| 13 | [Error Handling & Debugging](13-ERROR-HANDLING-DEBUGGING.md) | Try/catch, custom errors, debugging strategies, console methods |
| 14 | [Modules & Bundlers](14-MODULES-BUNDLERS.md) | CommonJS vs ES Modules, webpack/vite basics, tree shaking |
| 15 | [Testing JavaScript](15-TESTING-JAVASCRIPT.md) | Unit tests, Jest basics, mocking, TDD patterns, async testing |
| 16 | [Performance Optimization](16-PERFORMANCE-OPTIMIZATION.md) | Memory leaks, repaints/reflows, lazy loading, code splitting, caching |
| 17 | [Security Best Practices](17-SECURITY-BEST-PRACTICES.md) | XSS, CSRF, CSP, input sanitization, secure cookies, HTTPS |

### Interview Specific
| # | File | What You'll Learn |
|---|------|-------------------|
| 18 | [Coding Interview Patterns](18-CODING-INTERVIEW-PATTERNS.md) | Two pointers, sliding window, recursion, DP basics in JS |
| 19 | [Top 50 Interview Questions](19-COMMON-INTERVIEW-QUESTIONS.md) | Most asked JS questions with detailed answers and code |
| 20 | [Machine Coding Rounds](20-MACHINE-CODING-ROUNDS.md) | Build X in 30 mins — approach, structure, common assignments |

---

## Recommended Reading Order

**If you're preparing for a frontend interview:**
```
01 → 02 → 03 → 04 → 05
(then) 06 → 07 → 08 → 09 → 10 → 11
(then) 12 → 13 → 14 → 15 → 16 → 17
(then) 18 → 19 → 20
```

**If you want to master a specific topic:**
- **"How does the event loop work?"** → 06, 11
- **"Explain closures with examples"** → 03
- **"What is `this` in different contexts?"** → 04
- **"How do prototypes work?"** → 05
- **"How to handle async operations?"** → 06, 11
- **"Common coding patterns"** → 09, 12, 18

---

## Key Concepts Index

| Concept | Where It's Covered | Interview Frequency |
|---------|-------------------|---------------------|
| Closures | 03 | Very High |
| Event Loop | 06, 11 | Very High |
| `this` keyword | 04 | Very High |
| Prototypes / Classes | 05 | High |
| Promises / Async-Await | 06 | Very High |
| Scope / Hoisting | 03 | High |
| Debounce / Throttle | 09 | High |
| Deep Clone / Flatten | 08 | Medium |
| Currying | 09 | Medium |
| Polyfills | 08, 09 | Medium |
| Memory Leaks | 16 | Medium |
| XSS / Security | 17 | Medium |

---

## How to Use This Guide

1. **Read sequentially** if you're starting from scratch
2. **Jump to specific topics** using the index above
3. **Practice code** — every file has runnable examples. Copy them to a JS file and experiment.
4. **Mock interviews** — use file 19 as a self-test quiz. Read the question, answer out loud, then check the answer.
