# 13 — Error Handling & Debugging

## Why This File Exists

Robust error handling and debugging skills are essential. Interviewers ask about try/catch patterns, custom errors, and debugging strategies.

---

## Try/Catch/Finally

```javascript
try {
  riskyOperation();
} catch (error) {
  console.error('Error:', error.message);
  // Handle or re-throw
} finally {
  // Always runs (cleanup)
  closeConnection();
}

// Works with async
async function fetchData() {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    console.error('Fetch failed:', err);
    throw err;  // Re-throw for caller to handle
  }
}
```

---

## Custom Errors

```javascript
class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

throw new ValidationError('Invalid email', 'email');

// Check error type
try {
  validateInput(data);
} catch (err) {
  if (err instanceof ValidationError) {
    showFieldError(err.field, err.message);
  } else {
    showGenericError(err.message);
  }
}
```

---

## Debugging

```javascript
// console methods
console.log('Value:', value);
console.table(arrayOfObjects);
console.dir(domElement);
console.trace();  // Print stack trace

// Breakpoint
debugger;  // Pauses execution in dev tools

// Conditional breakpoint
if (user.id === 123) debugger;
```

---

## Next Steps

Move to [14 — Modules & Bundlers](14-MODULES-BUNDLERS.md).
