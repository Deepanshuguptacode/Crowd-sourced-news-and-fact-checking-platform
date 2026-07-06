# 06 — Asynchronous JavaScript

## Why This File Exists

Async programming is core to modern JS. Interviewers test callbacks, Promises, async/await, and error handling. Understanding the event loop (covered in file 11) is crucial to answering "What order do these log?" questions.

---

## Callbacks

### The Foundation
```javascript
function fetchData(url, callback) {
  // Simulating async operation
  setTimeout(() => {
    const data = { id: 1, name: 'Alice' };
    callback(null, data);  // Node.js style: error first
  }, 100);
}

fetchData('/api/user', (err, data) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  console.log('Data:', data);
});
```

### Callback Hell
```javascript
// Nested callbacks become unreadable
getData(function(a) {
  getMoreData(a, function(b) {
    getMoreData(b, function(c) {
      getMoreData(c, function(d) {
        console.log(d);
      });
    });
  });
});
```

---

## Promises

### Creating Promises
```javascript
const promise = new Promise((resolve, reject) => {
  // Async operation
  setTimeout(() => {
    const success = true;
    
    if (success) {
      resolve('Success!');  // Promise fulfilled
    } else {
      reject('Error!');     // Promise rejected
    }
  }, 100);
});
```

### Consuming Promises
```javascript
promise
  .then(result => {
    console.log(result);  // 'Success!'
    return result + ' Extra';  // Pass to next then
  })
  .then(result => {
    console.log(result);  // 'Success! Extra'
    throw new Error('Oops');  // Rejects the chain
  })
  .catch(err => {
    console.error(err.message);  // 'Oops'
    return 'Recovered';  // Can recover and continue
  })
  .then(result => {
    console.log(result);  // 'Recovered'
  })
  .finally(() => {
    console.log('Always runs');  // Cleanup
  });
```

### Promise Chaining
```javascript
// Each then returns a new Promise
fetch('/api/user')
  .then(response => response.json())  // Returns parsed JSON
  .then(user => fetch(`/api/posts/${user.id}`))  // Returns new fetch Promise
  .then(response => response.json())
  .then(posts => console.log(posts))
  .catch(err => console.error('Failed:', err));
```

---

## Promise Static Methods

### Promise.all — All or Nothing
```javascript
// Waits for ALL to succeed, or rejects on FIRST failure
const promises = [
  fetch('/api/users'),
  fetch('/api/posts'),
  fetch('/api/comments')
];

Promise.all(promises)
  .then(responses => {
    // All succeeded, responses is array of results
    console.log('All loaded!');
  })
  .catch(err => {
    // First to reject triggers this
    console.error('One failed:', err);
  });

// With values
const urls = ['/api/a', '/api/b', '/api/c'];
Promise.all(urls.map(url => fetch(url)))
  .then(responses => Promise.all(responses.map(r => r.json())))
  .then(data => console.log(data));
```

### Promise.allSettled — All Complete (Success or Fail)
```javascript
// Never rejects, waits for all to settle
Promise.allSettled([
  Promise.resolve('success'),
  Promise.reject('error'),
  Promise.resolve('another success')
])
.then(results => {
  console.log(results);
  // [
  //   { status: 'fulfilled', value: 'success' },
  //   { status: 'rejected', reason: 'error' },
  //   { status: 'fulfilled', value: 'another success' }
  // ]
});
```

### Promise.race — First to Settle
```javascript
// Resolves/rejects as soon as FIRST promise settles
Promise.race([
  new Promise((_, reject) => setTimeout(reject, 100, 'timeout')),
  fetch('/api/data')
])
.then(result => console.log('Got data:', result))
.catch(err => console.error('Request too slow or failed'));
```

### Promise.any — First to Succeed
```javascript
// Resolves with first SUCCESS, rejects only if ALL fail
Promise.any([
  fetch('https://unreliable-server.com'),
  fetch('https://backup-server.com'),
  fetch('https://another-backup.com')
])
.then(response => console.log('First success:', response))
.catch(err => console.error('All failed:', err.errors));
```

---

## Async/Await

### The Modern Syntax
```javascript
// Instead of:
fetchUser()
  .then(user => fetchPosts(user.id))
  .then(posts => console.log(posts))
  .catch(err => console.error(err));

// Use:
async function loadUserData() {
  try {
    const user = await fetchUser();
    const posts = await fetchPosts(user.id);
    console.log(posts);
  } catch (err) {
    console.error(err);
  }
}
```

### Parallel Execution with Async/Await
```javascript
// ❌ Sequential (slow)
async function slow() {
  const users = await fetchUsers();      // 1s
  const posts = await fetchPosts();      // 1s
  const comments = await fetchComments(); // 1s
  // Total: 3s
}

// ✅ Parallel (fast)
async function fast() {
  const [users, posts, comments] = await Promise.all([
    fetchUsers(),
    fetchPosts(),
    fetchComments()
  ]);
  // Total: ~1s
}
```

### Error Handling Patterns
```javascript
// try/catch with async/await
async function fetchData() {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (err) {
    console.error('Fetch failed:', err);
    throw err;  // Re-throw or return default
  }
}

// Multiple operations with individual error handling
async function loadDashboard() {
  const results = await Promise.allSettled([
    fetchUser(),
    fetchPosts(),
    fetchNotifications()
  ]);
  
  const [userResult, postsResult, notifResult] = results;
  
  if (userResult.status === 'fulfilled') {
    renderUser(userResult.value);
  } else {
    renderUserError(userResult.reason);
  }
  // ... handle others
}
```

---

## Converting Callbacks to Promises

```javascript
// Node-style callback: (err, result) => {}
const fs = require('fs');

// Wrap in Promise
function readFileAsync(path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf8', (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

// Modern: util.promisify (Node.js)
const { promisify } = require('util');
const readFilePromise = promisify(fs.readFile);

// Or use built-in promises where available
import { readFile } from 'fs/promises';
const data = await readFile('file.txt', 'utf8');
```

---

## Common Interview Questions

### Q: What's the output?
```javascript
console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
console.log('4');
```
**Answer:** `1 4 3 2`
- `1` and `4` are synchronous
- `3` is a microtask (Promise), runs before next event loop tick
- `2` is a macrotask (setTimeout), runs after microtasks

### Q: Implement a sleep function
```javascript
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function demo() {
  console.log('Start');
  await sleep(1000);
  console.log('After 1 second');
}
```

### Q: Create a promise that resolves after N seconds
```javascript
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Usage
await delay(2000);
console.log('2 seconds passed');
```

### Q: Handle multiple promises with individual errors
```javascript
async function fetchWithFallback(urls) {
  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (response.ok) return await response.json();
    } catch (err) {
      console.log(`Failed: ${url}`);
    }
  }
  throw new Error('All sources failed');
}
```

### Q: Implement Promise.all
```javascript
function myPromiseAll(promises) {
  return new Promise((resolve, reject) => {
    const results = [];
    let completed = 0;
    
    if (promises.length === 0) {
      resolve([]);
      return;
    }
    
    promises.forEach((promise, index) => {
      Promise.resolve(promise)
        .then(result => {
          results[index] = result;
          completed++;
          if (completed === promises.length) {
            resolve(results);
          }
        })
        .catch(reject);  // First rejection rejects all
    });
  });
}
```

---

## Next Steps

Move to [07 — ES6+ Modern Features](07-ES6-FEATURES.md) to see the modern syntax that makes JS development cleaner.
