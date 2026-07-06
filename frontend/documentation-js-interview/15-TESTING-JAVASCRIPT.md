# 15 — Testing JavaScript

## Why This File Exists

Testing is a critical skill. Interviewers may ask about unit tests, mocking, or have you write testable code.

---

## Jest Basics

```javascript
// test.js
const sum = (a, b) => a + b;

// Test cases
describe('sum', () => {
  test('adds 1 + 2 to equal 3', () => {
    expect(sum(1, 2)).toBe(3);
  });
  
  test('works with negatives', () => {
    expect(sum(-1, -2)).toBe(-3);
  });
});

// Matchers
expect(value).toBe(exact);           // === for primitives
expect(value).toEqual(object);       // Deep equality for objects
expect(value).toBeTruthy();
expect(value).toContain(item);       // Array/string contains
expect(fn).toThrow();                // Function throws error
```

---

## Async Testing

```javascript
test('fetches user data', async () => {
  const user = await fetchUser(1);
  expect(user).toEqual({ id: 1, name: 'Alice' });
});

test('handles fetch error', async () => {
  await expect(fetchUser(999)).rejects.toThrow('Not found');
});
```

---

## Mocking

```javascript
// Mock function
const mockFn = jest.fn();
mockFn('arg');
expect(mockFn).toHaveBeenCalledWith('arg');
expect(mockFn).toHaveBeenCalledTimes(1);

// Mock module
jest.mock('./api', () => ({
  fetchUser: jest.fn(() => Promise.resolve({ id: 1 }))
}));
```

---

## Next Steps

Move to [16 — Performance Optimization](16-PERFORMANCE-OPTIMIZATION.md).
