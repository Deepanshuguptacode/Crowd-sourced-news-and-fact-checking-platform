# 03 - Vite and Build Tools: Development to Production

## What You'll Learn
- What Vite is and why it's used
- How the development server works
- Building for production
- Environment variables
- Configuration options

---

## What is Vite?

**Vite** (French for "fast") is a modern build tool that provides:
- ⚡ Instant development server startup
- 🔥 Hot Module Replacement (HMR) - see changes instantly
- 📦 Optimized production builds
- 🔧 Easy configuration

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    VITE vs TRADITIONAL BUILD TOOLS                          │
└─────────────────────────────────────────────────────────────────────────────┘

TRADITIONAL (Webpack):
┌────────────────────────────────────────────────────────────────────┐
│  1. Bundle ENTIRE app first                                        │
│  2. Then start server                                              │
│  3. Slow startup (minutes for large apps)                          │
│  4. Any change → rebuild                                           │
└────────────────────────────────────────────────────────────────────┘

VITE:
┌────────────────────────────────────────────────────────────────────┐
│  1. Start server immediately                                       │
│  2. Load modules on-demand                                         │
│  3. Fast startup (seconds)                                         │
│  4. Change → update only that module                               │
└────────────────────────────────────────────────────────────────────┘
```

---

## NPM Scripts

Defined in `package.json`:

```json
{
  "scripts": {
    "dev": "vite",            // Start development server
    "build": "vite build",    // Create production build
    "lint": "eslint .",       // Check code quality
    "preview": "vite preview" // Preview production build locally
  }
}
```

### Running Scripts

```bash
# Start development server
npm run dev

# Output:
#   VITE v6.0.5  ready in 300 ms
#   ➜  Local:   http://localhost:5173/
#   ➜  Network: http://192.168.1.100:5173/
#   ➜  press h + enter to show help

# Build for production
npm run build

# Output:
#   vite v6.0.5 building for production...
#   ✓ 1234 modules transformed.
#   dist/index.html               0.47 kB
#   dist/assets/index-abc123.js   234.56 kB

# Preview production build
npm run preview
```

---

## Development Server

When you run `npm run dev`:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DEVELOPMENT FLOW                                         │
└─────────────────────────────────────────────────────────────────────────────┘

                    npm run dev
                         │
                         ▼
              ┌─────────────────────┐
              │   Vite Dev Server   │
              │  (localhost:5173)   │
              └─────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
    Serve HTML     Process JSX     Watch Files
         │               │               │
         ▼               ▼               ▼
    ┌─────────┐   ┌─────────────┐  ┌──────────┐
    │ Browser │   │ Transform   │  │  HMR     │
    │ Loads   │   │ on-demand   │  │ Updates  │
    └─────────┘   └─────────────┘  └──────────┘
```

### Hot Module Replacement (HMR)

When you save a file:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    HOT MODULE REPLACEMENT                                   │
└─────────────────────────────────────────────────────────────────────────────┘

1. You edit NewsCard.jsx
         │
         ▼
2. Vite detects the change
         │
         ▼
3. Vite sends update to browser
         │
         ▼
4. Browser updates ONLY NewsCard
   (Page doesn't reload, state preserved)
         │
         ▼
5. You see change instantly (~100ms)
```

---

## Vite Configuration

```javascript
// vite.config.js

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // ═══════════════════════════════════════════════════════════════════════
  // PLUGINS
  // ═══════════════════════════════════════════════════════════════════════
  plugins: [
    react()  // Enable React support (JSX transform, fast refresh)
  ],

  // ═══════════════════════════════════════════════════════════════════════
  // DEVELOPMENT SERVER
  // ═══════════════════════════════════════════════════════════════════════
  server: {
    port: 5173,           // Port number
    open: true,           // Auto-open browser
    host: true,           // Allow network access
    
    // Proxy API requests to backend
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════════════
  // BUILD OPTIONS
  // ═══════════════════════════════════════════════════════════════════════
  build: {
    outDir: 'dist',        // Output folder
    sourcemap: false,      // Generate source maps (for debugging)
    minify: 'terser',      // Minify code
    
    rollupOptions: {
      output: {
        // Split vendor code into separate chunk
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom']
        }
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════════════
  // RESOLVE ALIASES
  // ═══════════════════════════════════════════════════════════════════════
  resolve: {
    alias: {
      '@': '/src',               // @ = src folder
      '@components': '/src/components',
      '@pages': '/src/pages',
    }
  }
})
```

---

## Environment Variables

Environment variables let you configure different values for development vs production.

### Creating Environment Files

```bash
frontend/
├── .env                 # All environments (default)
├── .env.local          # Local overrides (ignored by git)
├── .env.development    # Development only
└── .env.production     # Production only
```

### Defining Variables

```bash
# .env (development)
VITE_API_BASE_URL=http://localhost:3000
VITE_FACE_AUTH_URL=http://127.0.0.1:5000

# .env.production
VITE_API_BASE_URL=https://api.voxveritas.me
VITE_FACE_AUTH_URL=https://api.voxveritas.me/face-auth
```

**IMPORTANT:** Variables must start with `VITE_` to be exposed to the client!

### Using in Code

```javascript
// src/config.js

const config = {
  // Access environment variables
  BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
  
  // Check if in development mode
  isDev: import.meta.env.DEV,
  
  // Check if in production mode
  isProd: import.meta.env.PROD,
  
  // Current mode string
  mode: import.meta.env.MODE,  // 'development' or 'production'
};

// Usage in components:
console.log(import.meta.env.VITE_API_BASE_URL);

// ═══════════════════════════════════════════════════════════════════════════
// CONDITIONAL LOGIC BASED ON ENVIRONMENT
// ═══════════════════════════════════════════════════════════════════════════

const config = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 
            (import.meta.env.DEV 
              ? "http://localhost:3000"      // Development fallback
              : "https://api.voxveritas.me"), // Production fallback
};
```

### Built-in Variables

| Variable | Description |
|----------|-------------|
| `import.meta.env.MODE` | 'development' or 'production' |
| `import.meta.env.DEV` | true in development |
| `import.meta.env.PROD` | true in production |
| `import.meta.env.SSR` | true during server-side rendering |

---

## Production Build

When you run `npm run build`:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PRODUCTION BUILD PROCESS                                 │
└─────────────────────────────────────────────────────────────────────────────┘

              npm run build
                    │
                    ▼
    ┌───────────────────────────────┐
    │  1. Bundle all modules        │
    │  2. Transform JSX → JS        │
    │  3. Minify code               │
    │  4. Extract CSS               │
    │  5. Optimize assets           │
    │  6. Generate HTML             │
    └───────────────────────────────┘
                    │
                    ▼
              dist/ folder
    ┌───────────────────────────────┐
    │ index.html                    │
    │ assets/                       │
    │   ├── index-abc123.js         │ ← Bundled JavaScript
    │   ├── index-def456.css        │ ← Bundled CSS
    │   └── logo-ghi789.png         │ ← Optimized images
    └───────────────────────────────┘
```

### Build Output

```bash
npm run build

# Output:
vite v6.0.5 building for production...
✓ 1234 modules transformed.
dist/index.html                    0.47 kB │ gzip:  0.30 kB
dist/assets/index-BxHt4N.css      45.23 kB │ gzip: 10.45 kB
dist/assets/vendor-D3xK9m.js     145.67 kB │ gzip: 47.89 kB
dist/assets/index-A2bC3d.js      234.56 kB │ gzip: 78.23 kB
✓ built in 12.34s
```

### Understanding the Output

```
dist/
├── index.html           ← Entry HTML (references assets)
└── assets/
    ├── index-[hash].js  ← Your application code
    ├── vendor-[hash].js ← Third-party libraries (React, etc.)
    ├── index-[hash].css ← All CSS combined
    └── [images]         ← Optimized images

[hash] = Content hash for cache busting
         Changes only when content changes
```

---

## Tailwind CSS Integration

Vite processes Tailwind CSS through PostCSS:

### Configuration Files

```javascript
// tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  // Which files to scan for Tailwind classes
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",  // All source files
  ],
  
  // Dark mode configuration
  darkMode: 'class',  // Enable class-based dark mode
  
  theme: {
    extend: {
      // Custom colors, fonts, etc.
    },
  },
  
  plugins: [],
}
```

```javascript
// postcss.config.js

export default {
  plugins: {
    tailwindcss: {},   // Process Tailwind
    autoprefixer: {},  // Add vendor prefixes
  },
}
```

```css
/* src/index.css */

/* Import Tailwind's base styles */
@tailwind base;

/* Import Tailwind's component classes */
@tailwind components;

/* Import Tailwind's utility classes */
@tailwind utilities;

/* Your custom CSS goes here */
```

---

## Common Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Check code quality
npm run lint

# Install a new package
npm install package-name

# Install dev dependency
npm install -D package-name
```

---

## Troubleshooting

### Port Already in Use

```bash
# Error: Port 5173 is already in use

# Solution 1: Kill the process
npx kill-port 5173

# Solution 2: Use different port
npm run dev -- --port 3001
```

### Module Not Found

```bash
# Error: Cannot find module 'package-name'

# Solution: Install the package
npm install package-name
```

### Build Errors

```bash
# Clear cache and rebuild
rm -rf node_modules/.vite
npm run build
```

---

## Interview Questions & Answers

### Q1: What is Vite and why use it over Webpack?

**Answer:** Vite is a modern build tool that provides:
- Faster development server (native ES modules, no bundling during dev)
- Instant Hot Module Replacement
- Optimized production builds using Rollup
- Simpler configuration

Webpack bundles everything upfront, which is slower for development.

### Q2: How does HMR work?

**Answer:** Hot Module Replacement allows updating modules in the browser without a full page refresh:
1. Developer saves a file
2. Vite detects the change
3. Vite sends a WebSocket message to browser
4. Browser updates only the changed module
5. Component state is preserved

### Q3: Why must environment variables start with VITE_?

**Answer:** For security. Only variables prefixed with `VITE_` are exposed to client-side code. This prevents accidental exposure of sensitive server-side variables (database passwords, API keys) in the browser-accessible bundle.

### Q4: What's the purpose of content hashes in build filenames?

**Answer:** Content hashes (like `index-abc123.js`) enable aggressive caching:
- Browser caches file indefinitely
- When content changes, hash changes
- New filename means browser fetches fresh version
- Unchanged files continue to be cached

---

## Summary

| Concept | Purpose |
|---------|---------|
| **Vite** | Fast development server and build tool |
| **npm run dev** | Start development server with HMR |
| **npm run build** | Create optimized production bundle |
| **Environment Variables** | Configure different values per environment |
| **VITE_** prefix | Required for client-side env vars |
| **dist/** folder | Production build output |

---

**Next: [04-APP-ENTRY-POINT.md](./04-APP-ENTRY-POINT.md)** - Understand how the React app starts →
