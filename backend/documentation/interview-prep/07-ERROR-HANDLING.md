# 07 — Error Handling

## Why This File Exists
Every production application deals with errors. Knowing how to handle them properly — especially in async code — is a key interview topic. This document covers all error types, patterns, and best practices.

---

## The `try/catch/finally` Block

### In C++ (What You Know)

```cpp
try {
  int result = divide(a, 0);
} catch (std::runtime_error& e) {
  std::cerr << e.what();
} catch (...) {
  std::cerr << "Unknown error";
}
```

### In JavaScript (What's Different)

```javascript
try {
  // Code that might throw
  const result = JSON.parse("invalid json");
} catch (error) {
  // `error` is whatever was thrown
  console.error(error.message); // "Unexpected token i..."
  console.error(error.name);    // "SyntaxError"
} finally {
  // Always runs — even if no error, even after return
  console.log("This always runs");
}
```

**Key difference from C++:** JS has only ONE `catch` block. You check the error type inside:

```javascript
try {
  riskyOperation();
} catch (error) {
  if (error instanceof TypeError) {
    console.log("Type error:", error.message);
  } else if (error instanceof RangeError) {
    console.log("Range error:", error.message);
  } else {
    throw error; // Re-throw unknown errors!
  }
}
```

### `finally` — Always Executes

```javascript
function readFile() {
  let fileHandle = null;
  try {
    fileHandle = openFile("data.txt");
    return fileHandle.read(); // Return inside try — finally still runs!
  } catch (error) {
    console.error("Failed:", error);
    return null;
  } finally {
    if (fileHandle) fileHandle.close(); // Cleanup always happens
    console.log("finally ran");
  }
}
```

---

## Error Types

JavaScript has 7 built-in error types:

| Error Type | When it Occurs |
|-----------|----------------|
| `Error` | Base class for all errors |
| `SyntaxError` | Invalid JavaScript syntax (`JSON.parse` of bad JSON) |
| `TypeError` | Wrong type used (`null.property`, `undefined()`) |
| `ReferenceError` | Using undeclared variable |
| `RangeError` | Number out of valid range (`new Array(-1)`) |
| `URIError` | Malformed URI (`decodeURIComponent("%")`) |
| `EvalError` | Error from `eval()` function (rare) |

```javascript
// Examples:
null.property;             // TypeError: Cannot read property 'property' of null
undeclaredVar;             // ReferenceError: undeclaredVar is not defined
new Array(-1);             // RangeError: Invalid array length
JSON.parse("{bad json}");  // SyntaxError: Unexpected token b

// Checking error type
try {
  null.property;
} catch (e) {
  console.log(e instanceof TypeError);  // true
  console.log(e.name);                  // "TypeError"
  console.log(e.message);               // "Cannot read properties of null"
  console.log(e.stack);                 // Stack trace string
}
```

---

## The `Error` Object

```javascript
const err = new Error("Something went wrong");
console.log(err.name);     // "Error"
console.log(err.message);  // "Something went wrong"
console.log(err.stack);    // "Error: Something went wrong\n  at ..."

// Creating specific error types
const typeErr = new TypeError("Expected a number");
const rangeErr = new RangeError("Value must be between 0 and 100");

// Throwing non-Error values (bad practice, but JS allows it)
throw "string error";   // You can throw anything
throw 42;               // But Error objects are best practice
throw { code: 404 };    // (No stack trace for non-Error throws)
```

---

## Custom Errors — Best Practice

```javascript
// Create custom error by extending Error
class AppError extends Error {
  constructor(message, code, statusCode = 500) {
    super(message);          // Call parent constructor
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    
    // Fix prototype chain (important in TypeScript/transpiled environments)
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

class NotFoundError extends AppError {
  constructor(resource, id) {
    super(`${resource} with id ${id} not found`, "NOT_FOUND", 404);
    this.name = "NotFoundError";
    this.resource = resource;
    this.resourceId = id;
  }
}

class ValidationError extends AppError {
  constructor(field, message) {
    super(message, "VALIDATION_ERROR", 400);
    this.name = "ValidationError";
    this.field = field;
  }
}

// Usage
function findUser(id) {
  const user = db.find(id);
  if (!user) throw new NotFoundError("User", id);
  return user;
}

try {
  findUser(999);
} catch (error) {
  if (error instanceof NotFoundError) {
    console.log(`${error.resource} not found!`);
    // Send 404 response
  } else if (error instanceof ValidationError) {
    console.log(`Validation failed for field: ${error.field}`);
    // Send 400 response
  } else {
    throw error; // Unknown — re-throw
  }
}
```

---

## Error Handling in Asynchronous Code

### With Callbacks (Old Way)

```javascript
// "Error-first callback" — Node.js convention
fs.readFile("file.txt", function(error, data) {
  if (error) {
    console.error("Error:", error);
    return;  // Must return to stop execution
  }
  console.log("Data:", data);
});
```

### With Promises

```javascript
// .catch() handles rejections
fetch("/api/data")
  .then(response => response.json())
  .then(data => process(data))
  .catch(error => {
    // Catches ANY rejection in the chain
    console.error("Failed:", error);
  });

// Catching specific errors
fetch("/api/data")
  .catch(error => {
    if (error instanceof NetworkError) {
      return fetchFromCache(); // Fallback
    }
    throw error; // Re-throw others
  });
```

### With Async/Await

```javascript
// try/catch is the clean way
async function loadData() {
  try {
    const response = await fetch("/api/data");
    if (!response.ok) {
      throw new AppError(`HTTP ${response.status}`, "HTTP_ERROR", response.status);
    }
    return await response.json();
  } catch (error) {
    if (error instanceof AppError) {
      console.error(`App error: ${error.code}`);
    } else {
      console.error("Unexpected error:", error);
    }
    throw error; // Re-throw so caller knows it failed
  }
}

// Helper: wrap async function to handle errors inline
function tryCatch(fn) {
  return fn().then(data => [null, data]).catch(err => [err, null]);
}

// Cleaner calling pattern (Go-style error handling)
const [error, data] = await tryCatch(() => loadData());
if (error) {
  console.error("Failed:", error);
} else {
  console.log("Got:", data);
}
```

### Global Error Handlers

```javascript
// In browser — catch uncaught errors
window.onerror = function(message, source, line, col, error) {
  console.error("Uncaught:", message);
  return true; // Prevents default browser error logging
};

// Better: addEventListener
window.addEventListener("error", (event) => {
  console.error("Uncaught:", event.error);
});

// Catch unhandled Promise rejections
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled rejection:", event.reason);
  event.preventDefault(); // Suppress default console error
});

// In Node.js
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1); // IMPORTANT: exit after uncaught exception!
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
```

---

## Error Handling Patterns

### Pattern 1: Fail Fast

```javascript
function divide(a, b) {
  if (typeof a !== "number" || typeof b !== "number") {
    throw new TypeError("Both arguments must be numbers");
  }
  if (b === 0) {
    throw new RangeError("Cannot divide by zero");
  }
  return a / b;
}
```

### Pattern 2: Result Object (No Exceptions)

```javascript
function safeDivide(a, b) {
  if (b === 0) {
    return { success: false, error: "Division by zero" };
  }
  return { success: true, value: a / b };
}

const result = safeDivide(10, 0);
if (result.success) {
  console.log(result.value);
} else {
  console.error(result.error);
}
```

### Pattern 3: Guard Clauses

```javascript
// Avoid deep nesting with early returns
function processUser(user) {
  if (!user) throw new TypeError("User is required");
  if (!user.name) throw new ValidationError("name", "Name is required");
  if (user.age < 0) throw new RangeError("Age cannot be negative");

  // Main logic — only reached if all guards pass
  return {
    id: generateId(),
    name: user.name.trim(),
    age: user.age
  };
}
```

### Pattern 4: Retry with Exponential Backoff

```javascript
async function fetchWithRetry(url, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      if (attempt === maxRetries) throw error; // Last attempt
      const delay = Math.pow(2, attempt) * 100; // 200ms, 400ms, 800ms
      console.log(`Attempt ${attempt} failed. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

---

## Interview Questions

### Q1: What's the difference between `throw` and `return` in error handling?
<details>
<summary>Answer</summary>

- `return` exits a function normally with a value — no error state
- `throw` exits a function with an exception — unwinds the call stack until caught by a `try/catch`. Everything after `throw` in that scope is skipped.

Best practice: `throw` when you can't recover locally and want to signal failure to callers.
</details>

### Q2: What's the output?
```javascript
function test() {
  try {
    return 1;
  } finally {
    return 2;
  }
}
console.log(test());
```
<details>
<summary>Answer</summary>

`2`

The `finally` block always runs, and if it has a `return`, it **overrides** the `return` in `try`. This is a known gotcha — avoid `return` in `finally`.
</details>

### Q3: How do you handle errors in async/await?
<details>
<summary>Answer</summary>

Use `try/catch`:

```javascript
async function fetchData() {
  try {
    const response = await fetch("/api/data");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error:", error);
    throw error; // Re-throw if callers need to know
  }
}
```

Or use `.catch()` on the returned Promise:
```javascript
const data = await fetchData().catch(err => null); // null on failure
```
</details>

### Q4: What is an "unhandled promise rejection"?
<details>
<summary>Answer</summary>

An unhandled promise rejection occurs when a Promise is rejected but no `.catch()` handler or `try/catch` around `await` is provided. In modern Node.js (v15+), unhandled rejections crash the process. In browsers, they fire the `unhandledrejection` event.

```javascript
// Creates unhandled rejection:
async function bad() {
  throw new Error("Oops"); // No one catches this!
}
bad();

// Fixed:
bad().catch(err => console.error(err));
```
</details>

### Q5: Why should you extend `Error` for custom errors?
<details>
<summary>Answer</summary>

Custom errors extending `Error` give you:
1. `instanceof` checks work (`error instanceof MyError`)
2. Proper stack trace
3. `.name`, `.message`, `.stack` properties
4. Can add custom properties (`code`, `statusCode`, etc.)
5. Semantic meaning — callers can distinguish error types

Throwing plain strings or objects means no stack trace and no `instanceof` checking.
</details>

---

## Exercises

### Exercise 1: Safe JSON Parse

```javascript
function safeJSONParse(str, fallback = null) {
  // Return parsed JSON, or fallback value on any error
}

console.log(safeJSONParse('{"a": 1}')); // { a: 1 }
console.log(safeJSONParse("bad json")); // null
console.log(safeJSONParse("bad", []));  // []
```

<details>
<summary>Solution</summary>

```javascript
function safeJSONParse(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}
```
</details>

### Exercise 2: Promise Error Aggregator

```javascript
// Run all promises and collect ALL errors (not just the first)
async function runAll(fns) {
  // fns = array of async functions
  // Return { results, errors }
}
```

<details>
<summary>Solution</summary>

```javascript
async function runAll(fns) {
  const settled = await Promise.allSettled(fns.map(fn => fn()));
  const results = [];
  const errors = [];

  settled.forEach((result, i) => {
    if (result.status === "fulfilled") {
      results.push({ index: i, value: result.value });
    } else {
      errors.push({ index: i, error: result.reason });
    }
  });

  return { results, errors };
}
```
</details>

### Exercise 3: Create an `AppError` Hierarchy

```javascript
// Create:
// - AppError (base, with statusCode and code)
// - NotFoundError (404)
// - UnauthorizedError (401)
// - ValidationError (400, with fieldErrors: Map)
// - RateLimitError (429, with retryAfter: number)
```

<details>
<summary>Solution</summary>

```javascript
class AppError extends Error {
  constructor(message, code, statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

class NotFoundError extends AppError {
  constructor(resource) {
    super(`${resource} not found`, "NOT_FOUND", 404);
  }
}

class UnauthorizedError extends AppError {
  constructor(reason = "Unauthorized") {
    super(reason, "UNAUTHORIZED", 401);
  }
}

class ValidationError extends AppError {
  constructor(fieldErrors) {
    super("Validation failed", "VALIDATION_ERROR", 400);
    this.fieldErrors = fieldErrors; // { fieldName: "error message" }
  }
}

class RateLimitError extends AppError {
  constructor(retryAfter) {
    super("Too many requests", "RATE_LIMIT", 429);
    this.retryAfter = retryAfter; // seconds
  }
}

// Usage
try {
  throw new ValidationError({ email: "Invalid email", age: "Must be positive" });
} catch (error) {
  if (error instanceof ValidationError) {
    console.log("Status:", error.statusCode);     // 400
    console.log("Fields:", error.fieldErrors);    // { email: "...", age: "..." }
  }
}
```
</details>
