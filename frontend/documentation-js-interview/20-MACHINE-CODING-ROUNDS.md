# 20 — Machine Coding Rounds

## Why This File Exists

Machine coding rounds (30-60 minutes) require building functional components. This file covers common assignments and approach strategies.

---

## Common Assignments

### 1. Auto-complete/Typeahead
```javascript
// Build a search with suggestions
// Features: debounced input, keyboard navigation, API integration
class Autocomplete {
  constructor(input, suggestionsList) {
    this.input = input;
    this.list = suggestionsList;
    this.debouncedSearch = this.debounce(this.search.bind(this), 300);
    this.input.addEventListener('input', this.debouncedSearch);
  }
  
  debounce(fn, delay) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }
  
  async search() {
    const query = this.input.value;
    const results = await fetch(`/api/search?q=${query}`).then(r => r.json());
    this.render(results);
  }
}
```

### 2. Infinite Scroll
```javascript
// Load more content as user scrolls
class InfiniteScroll {
  constructor(container, fetchFn) {
    this.container = container;
    this.fetchFn = fetchFn;
    this.page = 1;
    this.loading = false;
    
    window.addEventListener('scroll', () => {
      if (this.shouldLoad()) this.loadMore();
    });
  }
  
  shouldLoad() {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    return scrollTop + clientHeight >= scrollHeight - 100;
  }
  
  async loadMore() {
    if (this.loading) return;
    this.loading = true;
    
    const items = await this.fetchFn(this.page++);
    this.container.append(...items.map(i => this.createElement(i)));
    
    this.loading = false;
  }
}
```

### 3. Modal/Dialog Component
```javascript
// Accessible modal with focus management
class Modal {
  constructor(trigger, content) {
    this.trigger = trigger;
    this.modal = this.createModal(content);
    this.focusable = 'button, [href], input, select, textarea';
    
    trigger.addEventListener('click', () => this.open());
    this.modal.addEventListener('click', e => {
      if (e.target === this.modal) this.close();
    });
  }
  
  open() {
    this.modal.classList.add('active');
    this.previousFocus = document.activeElement;
    this.modal.querySelector(this.focusable).focus();
    document.addEventListener('keydown', this.handleKey);
  }
  
  close() {
    this.modal.classList.remove('active');
    this.previousFocus?.focus();
    document.removeEventListener('keydown', this.handleKey);
  }
  
  handleKey = (e) => {
    if (e.key === 'Escape') this.close();
    // Handle Tab trapping for accessibility
  };
}
```

---

## Interview Strategy

### Time Allocation (30 min round)
```
0-5 min:  Understand requirements, ask clarifying questions
5-10 min: Plan structure, decide on state management
10-25 min: Code core functionality
25-30 min: Test, handle edge cases, explain code
```

### Tips
- Start with basic working version, then add features
- Use clear variable names
- Handle loading and error states
- Make it accessible (keyboard navigation, ARIA labels)
- Optimize performance (debounce, memoize if needed)

---

## Congratulations!

You've completed the JavaScript Interview Preparation documentation. Good luck with your interviews!
