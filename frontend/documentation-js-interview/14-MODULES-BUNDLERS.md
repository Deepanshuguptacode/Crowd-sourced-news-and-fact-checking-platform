# 14 — Modules & Bundlers

## Why This File Exists

Modern JavaScript relies on modules and bundlers. Interviewers expect you to understand ES Modules vs CommonJS, tree shaking, and basic bundler concepts.

---

## ES Modules vs CommonJS

```javascript
// CommonJS (Node.js default)
const utils = require('./utils');
module.exports = { foo };

// ES Modules (modern standard)
import { foo } from './utils.js';
export { foo };
export default mainFunction;

// Key differences:
// - ES modules are static (analyzed at parse time)
// - CommonJS is dynamic (require can be anywhere)
// - ES modules support tree shaking
// - ES modules use 'import.meta.url' for file path
```

---

## Tree Shaking

```javascript
// utils.js
export function used() { return 'important'; }
export function unused() { return 'ignored'; }

// main.js
import { used } from './utils.js';
console.log(used());

// Bundler (webpack/vite) will:
// - Include 'used' function
// - Remove 'unused' function from bundle (tree shaking!)
```

---

## Dynamic Imports

```javascript
// Load code on demand (code splitting)
async function loadFeature() {
  if (userNeedsFeature) {
    const module = await import('./heavy-feature.js');
    module.initialize();
  }
}
```

---

## Next Steps

Move to [15 — Testing JavaScript](15-TESTING-JAVASCRIPT.md).
