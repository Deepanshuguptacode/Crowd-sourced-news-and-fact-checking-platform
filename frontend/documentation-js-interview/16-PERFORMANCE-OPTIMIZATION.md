# 16 — Performance Optimization

## Why This File Exists

Performance questions test your understanding of browser rendering, memory management, and optimization techniques.

---

## Memory Leaks

```javascript
// Leak 1: Unremoved event listeners
element.addEventListener('click', handler);
// Later: element still in DOM but not removed, handler keeps closure alive

// Fix: Remove listener when done
element.removeEventListener('click', handler);

// Leak 2: Closures capturing large objects
function createLeakyFunction() {
  const hugeArray = new Array(1000000).fill('data');
  return function() {
    console.log('Function created');
    // hugeArray captured but never used
  };
}

// Leak 3: Global variables
function leak() {
  accidentallyGlobal = 'This is global!';  // No var/let/const
}
```

---

## DOM Performance

```javascript
// Bad: Multiple reflows
for (let i = 0; i < 100; i++) {
  list.appendChild(document.createElement('li'));  // Reflow each time
}

// Good: Use DocumentFragment
const fragment = document.createDocumentFragment();
for (let i = 0; i < 100; i++) {
  fragment.appendChild(document.createElement('li'));
}
list.appendChild(fragment);  // Single reflow

// Better: Use innerHTML for large inserts
list.innerHTML = Array(100).fill('<li></li>').join('');
```

---

## Lazy Loading

```javascript
// Lazy load images
<img loading="lazy" src="image.jpg" alt="Description">

// Lazy load components
const HeavyComponent = React.lazy(() => import('./HeavyComponent.js'));
```

---

## Next Steps

Move to [17 — Security Best Practices](17-SECURITY-BEST-PRACTICES.md).
