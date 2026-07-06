# 18 — Coding Interview Patterns

## Why This File Exists

Many interviews include algorithmic challenges. This file covers common patterns using JavaScript.

---

## Two Pointers

```javascript
// Find pair that sums to target
function twoSum(sorted, target) {
  let left = 0, right = sorted.length - 1;
  
  while (left < right) {
    const sum = sorted[left] + sorted[right];
    if (sum === target) return [left, right];
    if (sum < target) left++;
    else right--;
  }
  return null;
}

twoSum([1, 2, 3, 4, 5], 7);  // [1, 4] (2+5=7)
```

---

## Sliding Window

```javascript
// Max sum of subarray of size k
function maxSubarraySum(arr, k) {
  let max = 0, sum = 0;
  
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i];
    if (i >= k - 1) {
      max = Math.max(max, sum);
      sum -= arr[i - k + 1];  // Slide window
    }
  }
  return max;
}

maxSubarraySum([1, 2, 3, 4, 5], 3);  // 12 (3+4+5)
```

---

## Recursion

```javascript
// Factorial
function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

// Fibonacci with memoization
function fib(n, memo = {}) {
  if (n <= 1) return n;
  if (memo[n]) return memo[n];
  memo[n] = fib(n - 1, memo) + fib(n - 2, memo);
  return memo[n];
}
```

---

## Hash Map Pattern

```javascript
// Find first non-repeating character
function firstUnique(str) {
  const count = {};
  for (const char of str) {
    count[char] = (count[char] || 0) + 1;
  }
  for (const char of str) {
    if (count[char] === 1) return char;
  }
  return null;
}
```

---

## Next Steps

Move to [19 — Top 50 Interview Questions](19-COMMON-INTERVIEW-QUESTIONS.md).
