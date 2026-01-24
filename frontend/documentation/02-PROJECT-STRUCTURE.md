# 02 - Project Structure: Understanding the Codebase Organization

## What You'll Learn
- Why projects need structure
- How the frontend folders are organized
- What each file and folder does
- Naming conventions used
- How to find what you're looking for

---

## Why Structure Matters

A well-organized project structure helps you:
- **Find files quickly** - Know where to look
- **Understand relationships** - See how pieces connect
- **Scale the project** - Add features without chaos
- **Onboard teammates** - Everyone knows where things go

---

## Complete Folder Structure

```
frontend/
│
├── 📄 index.html              ← HTML entry point
├── 📄 package.json            ← Dependencies & scripts
├── 📄 vite.config.js          ← Vite build configuration
├── 📄 tailwind.config.js      ← Tailwind CSS settings
├── 📄 postcss.config.js       ← PostCSS for Tailwind
├── 📄 eslint.config.js        ← Code linting rules
├── 📄 .env                    ← Environment variables
├── 📄 .env.production         ← Production environment
│
├── 📁 public/                 ← Static assets (copied as-is)
│   └── (images, favicon, etc.)
│
├── 📁 dist/                   ← Build output (generated)
│   └── (production files)
│
├── 📁 node_modules/           ← Installed packages (auto-generated)
│
└── 📁 src/                    ← SOURCE CODE (main development folder)
    │
    ├── 📄 main.jsx            ← React entry point
    ├── 📄 App.jsx             ← Main app with routing
    ├── 📄 App.css             ← Global styles
    ├── 📄 index.css           ← Tailwind imports
    ├── 📄 config.js           ← API URL configuration
    │
    ├── 📁 components/         ← Reusable UI pieces
    ├── 📁 pages/              ← Full page components
    ├── 📁 context/            ← Global state (Context API)
    ├── 📁 services/           ← API calls
    ├── 📁 utils/              ← Helper functions
    └── 📁 assets/             ← Images, fonts, etc.
```

---

## Root Files Explained

### index.html - The HTML Entry Point

```html
<!-- frontend/index.html -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>VoxVeritas</title>
  </head>
  <body>
    <div id="root"></div>                     <!-- React renders here -->
    <script type="module" src="/src/main.jsx"></script>  <!-- Entry point -->
  </body>
</html>
```

**Why?** This is the single HTML file. React takes over the `<div id="root">` and renders the entire app inside it.

### package.json - Project Configuration

```json
{
  "name": "something",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  
  "scripts": {
    "dev": "vite",            // npm run dev → Start development server
    "build": "vite build",    // npm run build → Create production build
    "lint": "eslint .",       // npm run lint → Check code quality
    "preview": "vite preview" // npm run preview → Preview production build
  },
  
  "dependencies": {
    "react": "^18.3.1",           // Core React library
    "react-dom": "^18.3.1",       // React DOM rendering
    "react-router-dom": "^7.2.0", // Page routing
    "axios": "^1.8.4",            // HTTP requests
    "react-toastify": "^11.0.5",  // Toast notifications
    "lucide-react": "^0.525.0",   // Icon components
    "framer-motion": "^12.23.6",  // Animations
    // ... more
  },
  
  "devDependencies": {
    "vite": "^6.0.5",            // Build tool
    "tailwindcss": "^3.4.17",    // CSS framework
    "@vitejs/plugin-react": "^4.3.4", // Vite React plugin
    "eslint": "^9.17.0",         // Code linting
    // ... more
  }
}
```

**Why?** Defines what packages the project needs and what commands are available.

### vite.config.js - Build Tool Configuration

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],     // Enable React support
  server: {
    port: 5173,           // Development server port
  },
  build: {
    outDir: 'dist',       // Output folder for production build
  }
})
```

**Why?** Configures Vite (the build tool) for React development.

### config.js - API URLs

```javascript
// frontend/src/config.js

const config = {
  // Backend API URL
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 
            (import.meta.env.DEV 
              ? "http://localhost:3000"      // Development
              : "https://api.voxveritas.me"), // Production
  
  // Face authentication URL
  FACE_AUTH_URL: import.meta.env.VITE_FACE_AUTH_URL || 
                 (import.meta.env.DEV 
                   ? "http://127.0.0.1:5000" 
                   : "https://api.voxveritas.me/face-auth"),
};

export default config;
```

**Why?** Centralizes API URLs. Easy to switch between development and production.

---

## The src/ Folder (Source Code)

This is where you'll spend 99% of your time. Let's break it down:

### Entry Files

```
src/
├── main.jsx      ← React attaches to DOM here
├── App.jsx       ← Main component with all routes
├── index.css     ← Global CSS (Tailwind imports)
└── App.css       ← App-specific styles
```

### main.jsx - The Starting Point

```jsx
// This file is loaded by index.html
// It renders the React app into the DOM

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'              // Global styles
import App from './App.jsx'       // Main App component
import { UserProvider } from "./context/userContext"  // Global state
import { ToastContainer } from "react-toastify"       // Notifications
import "react-toastify/dist/ReactToastify.css"

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <UserProvider>                         {/* Wrap entire app with context */}
      <App />                              {/* Main application */}
      <ToastContainer position="top-right" autoClose={3000} />
    </UserProvider>
  </StrictMode>,
)
```

### App.jsx - The Route Controller

```jsx
// Defines all the routes (pages) in the application

import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LandingPage from './pages/LandingPage';
import Login from './components/Login';
// ... more imports

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<HomePage />} />
        {/* ... more routes */}
      </Routes>
    </Router>
  );
}
```

---

## Components vs Pages

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    COMPONENTS vs PAGES                                      │
└─────────────────────────────────────────────────────────────────────────────┘

COMPONENTS (src/components/)
├── Reusable pieces
├── Used in multiple places
├── Smaller, focused
├── Examples:
│   ├── Header.jsx        → Used on every page
│   ├── Footer.jsx        → Used on every page
│   ├── NewsCard.jsx      → Used in feeds, lists
│   └── CommentSection.jsx → Used wherever comments appear

PAGES (src/pages/)
├── Full page layouts
├── Mapped to routes (URLs)
├── Combine multiple components
├── Examples:
│   ├── HomePage.jsx      → /home route
│   ├── LandingPage.jsx   → / route
│   ├── LoginForm.jsx     → Used by /login route
│   └── ProfilePage.jsx   → /profile route
```

### Components Folder (33 files)

```
src/components/
│
├── 🔷 Layout Components
│   ├── Header.jsx           ← Top navigation bar
│   ├── Footer.jsx           ← Bottom bar (old)
│   ├── FooterNew.jsx        ← Updated footer
│   ├── NavBar.jsx           ← Navigation with theme toggle
│   ├── Sidebar.jsx          ← Side navigation
│   └── RightBar.jsx         ← Quick actions sidebar
│
├── 🔷 News Components
│   ├── NewsFeed.jsx         ← Fetches and displays news
│   ├── NewsCard.jsx         ← Single news item display
│   ├── NewsSubmissionForm.jsx ← Upload news form
│   ├── TrendingNewsCard.jsx  ← External news card
│   └── RepostCard.jsx       ← Reposted news display
│
├── 🔷 Comment Components
│   ├── CommentSection.jsx   ← Display & add comments
│   ├── GroupedComments.jsx  ← AI-grouped comments
│   ├── EvidenceDisplay.jsx  ← Show evidence links
│   ├── EvidenceLinksSection.jsx ← Add evidence links
│   └── ExpertVotingSection.jsx ← Expert voting UI
│
├── 🔷 AI Components
│   └── AIVerdictSection.jsx  ← Show AI analysis
│
├── 🔷 Debate Components
│   ├── AdvancedDebateRoom.jsx ← Full debate interface
│   └── CounterChatView.jsx   ← Counter argument view
│
├── 🔷 Auth Components
│   ├── Login.jsx            ← Login wrapper
│   ├── ProtectedRoute.jsx   ← Route protection
│   └── FaceCapture.jsx      ← Face recognition capture
│
├── 🔷 Landing Page Components
│   ├── HeroSection.jsx      ← Hero banner
│   ├── About.jsx            ← About section
│   ├── HowItWorks.jsx       ← How it works section
│   ├── KeyFeature.jsx       ← Features section
│   ├── WhySection.jsx       ← Why use us section
│   ├── TeamSection.jsx      ← Team members
│   └── AnimatedLogo.jsx     ← Animated logo
│
├── 🔷 Utility Components
│   ├── ErrorBoundary.jsx    ← Error handling wrapper
│   ├── NavigationHeader.jsx ← Page headers
│   └── ApiDebugger.jsx      ← Debug API calls
│
└── 🔷 Test Components
    └── SimpleNewsCardTest.jsx ← Testing component
```

### Pages Folder (11 files)

```
src/pages/
│
├── 📄 LandingPage.jsx       ← Public landing page (/)
├── 📄 HomePage.jsx          ← Main feed page (/home)
├── 📄 LoginForm.jsx         ← Login page (/login)
├── 📄 SignupForm.jsx        ← Registration (/signup)
├── 📄 ProfilePage.jsx       ← User profile (/profile)
├── 📄 TrendingPage.jsx      ← Trending news (/trending)
├── 📄 ExpertsPage.jsx       ← Expert users list (/experts)
├── 📄 DebateRoomsList.jsx   ← All debate rooms (/debate-rooms)
├── 📄 DebateRoom.jsx        ← Single debate room (/debate-room/:id)
├── 📄 NewsSubmissionForm.jsx ← Submit news (/submit-news)
└── 📄 TestAccuracy.jsx      ← Testing page (/test-accuracy)
```

---

## Services Folder (API Layer)

```
src/services/
│
├── 📄 api.js              ← Main API with all endpoints
├── 📄 debateRoomAPI.js    ← Debate room specific APIs
└── 📄 trendingNewsService.js ← Trending news APIs
```

**Why separate?** Keeps API logic out of components. Components call services, services make HTTP requests.

```
Component → Service → Backend
          ↑         ↓
        Response  Request
```

---

## Context Folder (Global State)

```
src/context/
│
└── 📄 userContext.jsx     ← User authentication state
```

**Why?** Stores data that many components need (like logged-in user info). Avoids "prop drilling" (passing props through many levels).

---

## File Naming Conventions

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    NAMING CONVENTIONS                                       │
└─────────────────────────────────────────────────────────────────────────────┘

COMPONENTS & PAGES: PascalCase
├── NewsCard.jsx       ✅
├── CommentSection.jsx ✅
├── HomePage.jsx       ✅
└── newsCard.jsx       ❌

SERVICES & UTILITIES: camelCase
├── api.js             ✅
├── debateRoomAPI.js   ✅
├── trendingNewsService.js ✅
└── DebateRoomAPI.js   ❌

CSS FILES: Match component
├── App.jsx → App.css
├── index.css (global)

FOLDERS: lowercase
├── components/        ✅
├── pages/             ✅
├── services/          ✅
└── Components/        ❌
```

---

## Finding What You Need

### "I need to change the login form"
→ `src/pages/LoginForm.jsx`

### "I need to change how news is displayed"
→ `src/components/NewsCard.jsx`

### "I need to change API calls"
→ `src/services/api.js`

### "I need to change global state"
→ `src/context/userContext.jsx`

### "I need to add a new route"
→ `src/App.jsx`

### "I need to change the header"
→ `src/components/Header.jsx`

### "I need to change styling"
→ Either inline Tailwind classes in components, or `src/index.css`

---

## How Files Connect

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FILE RELATIONSHIPS                                       │
└─────────────────────────────────────────────────────────────────────────────┘

index.html
    ↓ loads
main.jsx
    ↓ renders
App.jsx (with Router)
    ↓ routes to
Pages (HomePage, LoginForm, etc.)
    ↓ use
Components (NewsCard, Header, etc.)
    ↓ call
Services (api.js)
    ↓ talk to
Backend Server

    ↑↓ shared by all via
Context (userContext.jsx)
```

---

## Interview Questions & Answers

### Q1: Why separate components and pages?

**Answer:** 
- **Components** are reusable UI pieces used in multiple places
- **Pages** are route-specific, combining components into full layouts
- This separation follows the Single Responsibility Principle
- Makes code more maintainable and scalable

### Q2: Why use a services folder for API calls?

**Answer:**
- Centralizes all API logic in one place
- Components stay clean and focused on UI
- Easy to modify API endpoints without touching components
- Can add request/response handling (interceptors) in one place
- Better testability - can mock services

### Q3: What's the difference between public/ and src/assets/?

**Answer:**
- **public/**: Files copied as-is to build, not processed by Vite
- **src/assets/**: Files processed by Vite, can be imported in code
- Use public/ for static files that don't need processing (favicons, robots.txt)
- Use assets/ for images/fonts that need optimization or imports

### Q4: Why use .jsx extension instead of .js?

**Answer:**
- `.jsx` explicitly indicates the file contains JSX syntax
- Helps editors and tools provide better syntax highlighting
- Makes it clear which files are React components
- Some teams use `.js` for everything - both work with proper config

---

## Summary

| Folder | Contains | Purpose |
|--------|----------|---------|
| `src/components/` | Reusable UI pieces | Building blocks |
| `src/pages/` | Full page layouts | Route targets |
| `src/services/` | API call functions | Backend communication |
| `src/context/` | Global state | Shared data |
| `src/utils/` | Helper functions | Utilities |
| `src/assets/` | Static files | Images, fonts |
| `public/` | Unprocessed files | Favicon, etc. |

---

**Next: [03-VITE-AND-BUILD.md](./03-VITE-AND-BUILD.md)** - Understand the build tool and development server →
