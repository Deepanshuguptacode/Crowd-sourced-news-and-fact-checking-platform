# 10 — DOM & Browser APIs

## Why This File Exists

Frontend interviews often include DOM manipulation questions: selecting elements, handling events, localStorage, and the Fetch API.

---

## DOM Selection & Manipulation

```javascript
// Selection
document.getElementById('id');
document.querySelector('.class');
document.querySelectorAll('.items');  // Returns NodeList

// Manipulation
element.textContent = 'New text';
element.innerHTML = '<span>HTML</span>';
element.setAttribute('data-id', '123');
element.classList.add('active');
element.classList.toggle('hidden');

// Create & append
const div = document.createElement('div');
parent.appendChild(div);
parent.removeChild(div);
```

---

## Event Handling

```javascript
// Add listener
element.addEventListener('click', function(event) {
  console.log(event.target);  // Element that triggered event
  console.log(event.currentTarget);  // Element listener is on
  event.preventDefault();  // Stop default behavior
  event.stopPropagation(); // Stop bubbling
});

// Event delegation (efficient for many items)
document.getElementById('list').addEventListener('click', function(e) {
  if (e.target.matches('.item')) {
    console.log('Item clicked:', e.target.dataset.id);
  }
});

// Remove listener (needs same reference)
const handler = () => console.log('click');
element.addEventListener('click', handler);
element.removeEventListener('click', handler);
```

---

## localStorage / sessionStorage

```javascript
// Storage (persists across sessions)
localStorage.setItem('key', JSON.stringify(data));
const data = JSON.parse(localStorage.getItem('key'));
localStorage.removeItem('key');
localStorage.clear();

// sessionStorage (clears when tab closes)
sessionStorage.setItem('temp', 'value');
```

---

## Fetch API

```javascript
// Basic fetch
fetch('/api/users')
  .then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  })
  .then(data => console.log(data))
  .catch(err => console.error(err));

// POST with JSON
fetch('/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Alice' })
});

// Abort controller (cancel request)
const controller = new AbortController();
fetch('/api/slow', { signal: controller.signal });
controller.abort();  // Cancels the request
```

---

## Next Steps

Move to [11 — Event Loop & Concurrency](11-EVENT-LOOP-CONCURRENCY.md).
