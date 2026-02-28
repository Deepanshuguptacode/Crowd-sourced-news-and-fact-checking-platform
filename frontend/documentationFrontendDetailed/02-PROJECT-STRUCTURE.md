# 02 — Project Structure: Every Folder and File Explained

## Table of Contents
1. [Why Project Structure Matters](#1-why-project-structure-matters)
2. [The Mental Model: How a React Project Is Organized](#2-the-mental-model-how-a-react-project-is-organized)
3. [Complete Folder Tree — Annotated](#3-complete-folder-tree--annotated)
4. [Root-Level Files — The Configuration Layer](#4-root-level-files--the-configuration-layer)
5. [The `src/` Directory — All Source Code](#5-the-src-directory--all-source-code)
6. [The `components/` Folder — 33 Reusable Building Blocks](#6-the-components-folder--33-reusable-building-blocks)
7. [The `pages/` Folder — 13 Full-Page Components](#7-the-pages-folder--13-full-page-components)
8. [The `services/` Folder — API Communication Layer](#8-the-services-folder--api-communication-layer)
9. [The `context/` Folder — Global State](#9-the-context-folder--global-state)
10. [The `utils/` and `assets/` Folders](#10-the-utils-and-assets-folders)
11. [The `public/` Folder — Static Assets](#11-the-public-folder--static-assets)
12. [File Naming Conventions](#12-file-naming-conventions)
13. [How Files Import Each Other — The Dependency Graph](#13-how-files-import-each-other--the-dependency-graph)
14. [Pages vs Components — What's the Difference?](#14-pages-vs-components--whats-the-difference)
15. [Interview Q&A](#15-interview-qa)

---

## 1. Why Project Structure Matters

### 1.1 — The Problem With No Structure

Imagine a 10,000-line application where every component, every API call, and every style is in a single file. Finding anything would be like looking for a specific sentence in a library with no catalog.

### 1.2 — The Solution: Convention-Based Organization

A well-organized project structure provides:

| Benefit | How It Helps |
|---------|-------------|
| **Findability** | Need the header? Look in `components/Header.jsx`. Need the login page? Look in `pages/LoginForm.jsx`. |
| **Separation of Concerns** | UI rendering (`components/`) is separate from data fetching (`services/`) which is separate from state management (`context/`). |
| **Scalability** | Adding a new feature (e.g., a polls system) means adding files to existing folders, not restructuring everything. |
| **Team Collaboration** | Every developer knows where to put new code and where to find existing code. |
| **Testing** | Isolated files are easier to test independently. |

---

## 2. The Mental Model: How a React Project Is Organized

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CONCEPTUAL LAYERS                                        │
└─────────────────────────────────────────────────────────────────────────────┘

  LAYER 1: ENTRY POINT
  ─────────────────────
  index.html → main.jsx → App.jsx
  "How does the application start?"

  LAYER 2: ROUTING
  ─────────────────
  App.jsx defines URL → Component mappings
  "/" → LandingPage, "/home" → HomePage, "/login" → LoginForm
  "Which page shows for which URL?"

  LAYER 3: PAGES
  ───────────────
  pages/ folder — one file per route/screen
  HomePage.jsx, LoginForm.jsx, DebateRoom.jsx
  "What does each screen look like?"

  LAYER 4: COMPONENTS
  ────────────────────
  components/ folder — reusable UI pieces used across pages
  Header.jsx, NewsCard.jsx, CommentSection.jsx
  "What are the building blocks each page is made of?"

  LAYER 5: SERVICES
  ──────────────────
  services/ folder — API communication functions
  api.js (authAPI, newsAPI, commentsAPI, etc.)
  "How does the frontend talk to the backend?"

  LAYER 6: STATE
  ──────────────
  context/ folder — global application state
  userContext.jsx (user auth, login/logout)
  "What data is shared across the entire app?"

  LAYER 7: CONFIGURATION
  ──────────────────────
  Root files — build tool config, CSS setup, linting
  vite.config.js, tailwind.config.js, package.json
  "How is the project built and configured?"
```

---

## 3. Complete Folder Tree — Annotated

```
frontend/
│
│  ╔═══════════════════════════════════════════════════════════════════════╗
│  ║  ROOT-LEVEL FILES — Configuration, build settings, deployment       ║
│  ╚═══════════════════════════════════════════════════════════════════════╝
│
├── index.html              ← THE entry point. The ONLY HTML file.
│                              Contains <div id="root"></div> where React mounts.
│                              Also has <script type="module" src="/src/main.jsx">
│                              which tells Vite where to find the JavaScript entry.
│
├── package.json            ← Project "identity card": name, version, dependencies,
│                              and NPM scripts (dev, build, lint, preview).
│                              Running `npm install` reads this file and installs
│                              everything listed under "dependencies" and "devDependencies".
│
├── vite.config.js          ← Vite build tool configuration.
│                              Defines plugins (React), dev server port (5173),
│                              build output settings, and path aliases.
│
├── tailwind.config.js      ← Tailwind CSS customization.
│                              Dark mode strategy ('class'), content paths to scan,
│                              custom colors (teal, gold, charcoal), custom fonts
│                              (Sigmar, Kanit), custom animations (spin-slow).
│
├── postcss.config.js       ← PostCSS plugin configuration.
│                              Lists tailwindcss and autoprefixer as plugins.
│                              PostCSS processes CSS files, and Tailwind is
│                              implemented as a PostCSS plugin.
│
├── eslint.config.js        ← ESLint rules for code quality.
│                              Catches unused variables, missing imports,
│                              React-specific issues. Runs during development.
│
├── vercel.json             ← Deployment config for Vercel hosting.
│                              Defines rewrite rules so all routes serve index.html
│                              (required for SPA client-side routing).
│
│  ╔═══════════════════════════════════════════════════════════════════════╗
│  ║  public/ — Static assets served directly without processing          ║
│  ╚═══════════════════════════════════════════════════════════════════════╝
│
├── public/
│   └── vite.svg            ← Default Vite favicon. Files here are served
│                              at the root URL (http://localhost:5173/vite.svg).
│                              NO JavaScript processing — raw file serving.
│
│  ╔═══════════════════════════════════════════════════════════════════════╗
│  ║  src/ — ALL application source code                                  ║
│  ╚═══════════════════════════════════════════════════════════════════════╝
│
└── src/
    │
    ├── main.jsx            ← JavaScript entry point. Called by index.html.
    │                          Creates React root, wraps App in providers
    │                          (StrictMode, UserProvider, ToastContainer).
    │
    ├── App.jsx             ← Root component. Defines ALL routes using
    │                          React Router. Maps URLs to page components.
    │                          Wraps protected routes in <ProtectedRoute>.
    │
    ├── config.js           ← Runtime configuration object.
    │                          BASE_URL: backend API URL (localhost:3000 / production)
    │                          FACE_AUTH_URL: face auth service URL (localhost:5000)
    │                          Uses import.meta.env for environment variables.
    │
    ├── index.css           ← Global CSS file. Contains Tailwind directives:
    │                          @tailwind base; @tailwind components; @tailwind utilities;
    │                          Plus any custom global styles.
    │
    │  ┌─────────────────────────────────────────────────────────────────┐
    │  │  context/ — Global state management (React Context)             │
    │  └─────────────────────────────────────────────────────────────────┘
    │
    ├── context/
    │   └── userContext.jsx  ← THE global state for authentication.
    │                          Provides: userType, userInfo, isAuthenticated,
    │                          loading, login(), logout(), updateUserInfo().
    │                          Every component can access these via useContext.
    │
    │  ┌─────────────────────────────────────────────────────────────────┐
    │  │  services/ — API communication layer (Axios HTTP calls)         │
    │  └─────────────────────────────────────────────────────────────────┘
    │
    ├── services/
    │   ├── api.js              ← Main API file. Creates Axios instance with
    │   │                          base URL, interceptors (JWT token, logging).
    │   │                          Exports: authAPI, newsAPI, commentsAPI,
    │   │                          commentFilterAPI, aiVerdictAPI, apiUtils.
    │   │
    │   ├── debateRoomAPI.js    ← Debate room specific API calls.
    │   │                          getDebateRooms, createDebateRoom,
    │   │                          getDebateComments, likeComment, etc.
    │   │
    │   └── trendingNewsService.js ← Trending news API calls.
    │                                getTrendingNews, getTrendingByCategory.
    │
    │  ┌─────────────────────────────────────────────────────────────────┐
    │  │  components/ — Reusable UI building blocks (33 files)           │
    │  └─────────────────────────────────────────────────────────────────┘
    │
    ├── components/
    │   │
    │   │  ── LAYOUT COMPONENTS ──
    │   ├── Header.jsx              ← Top navigation bar. Logo, nav links,
    │   │                              search, theme toggle, user menu.
    │   ├── Footer.jsx              ← Page footer with links and credits.
    │   ├── FooterNew.jsx           ← Updated footer design variant.
    │   ├── NavBar.jsx              ← Landing page navigation (different from Header).
    │   ├── NavigationHeader.jsx    ← Simple header with back button + title.
    │   ├── Sidebar.jsx             ← Left sidebar component.
    │   ├── RightBar.jsx            ← Right sidebar component.
    │   ├── AnimatedLogo.jsx        ← The animated VoxVeritas brand logo.
    │   │
    │   │  ── AUTH & ROUTING COMPONENTS ──
    │   ├── ProtectedRoute.jsx      ← Route guard: checks authentication and
    │   │                              user type before allowing access.
    │   ├── FaceCapture.jsx         ← Webcam face capture for biometric auth.
    │   │                              Camera access, face detection, preview.
    │   ├── Login.jsx               ← Legacy login component (kept for compat).
    │   ├── ErrorBoundary.jsx       ← Catches React rendering errors gracefully.
    │   │
    │   │  ── NEWS COMPONENTS ──
    │   ├── NewsFeed.jsx            ← Fetches all news, renders NewsCard list.
    │   │                              Handles voting, comment updates.
    │   ├── NewsCard.jsx            ← Single news article card. Title, content,
    │   │                              images, votes, comments, AI verdict.
    │   ├── NewsSubmissionForm.jsx  ← Form for submitting new news (component ver).
    │   ├── TrendingNewsCard.jsx    ← Card variant for trending news display.
    │   ├── RepostCard.jsx          ← Card for reposted/shared news articles.
    │   │
    │   │  ── COMMENT COMPONENTS ──
    │   ├── CommentSection.jsx      ← Comment list + add comment form.
    │   │                              Handles community & expert comments,
    │   │                              stances, evidence links, AI grouping.
    │   ├── GroupedComments.jsx     ← Displays AI-grouped comment clusters.
    │   ├── EvidenceLinksSection.jsx← Input fields for adding evidence URLs.
    │   ├── EvidenceDisplay.jsx     ← Renders evidence link cards.
    │   ├── ExpertVotingSection.jsx ← Expert upvote/downvote on individual comments.
    │   │
    │   │  ── AI COMPONENTS ──
    │   ├── AIVerdictSection.jsx    ← AI credibility verdict display.
    │   │                              Score (0-100), reasoning, confidence level.
    │   │
    │   │  ── DEBATE COMPONENTS ──
    │   ├── AdvancedDebateRoom.jsx  ← Enhanced debate room with AI features.
    │   ├── CounterChatView.jsx     ← Side-by-side counter-argument view.
    │   │
    │   │  ── LANDING PAGE SECTIONS ──
    │   ├── HeroSection.jsx         ← Landing page hero banner with CTA.
    │   ├── About.jsx               ← Landing page about section.
    │   ├── WhySection.jsx          ← "Why VoxVeritas matters" section.
    │   ├── HowItWorks.jsx          ← Step-by-step how the platform works.
    │   ├── KeyFeature.jsx          ← Individual feature card component.
    │   ├── TeamSection.jsx         ← Team member cards.
    │   │
    │   │  ── UTILITY COMPONENTS ──
    │   ├── ApiDebugger.jsx         ← Development tool for debugging API calls.
    │   └── SimpleNewsCardTest.jsx  ← Test/demo component for NewsCard.
    │
    │  ┌─────────────────────────────────────────────────────────────────┐
    │  │  pages/ — Full-page components (one per route, 13 files)        │
    │  └─────────────────────────────────────────────────────────────────┘
    │
    ├── pages/
    │   ├── LandingPage.jsx         ← "/" — Public marketing page.
    │   ├── LoginForm.jsx           ← "/login" — Authentication page.
    │   ├── SignupForm.jsx          ← "/signup" — Registration page.
    │   ├── AdminLogin.jsx          ← "/admin/login" — Admin authentication.
    │   ├── AdminSignup.jsx         ← "/admin/signup" — Admin registration.
    │   ├── HomePage.jsx            ← "/home" — Main news feed (protected).
    │   ├── ProfilePage.jsx         ← "/profile" — User profile (protected).
    │   ├── NewsSubmissionForm.jsx  ← "/submit-news" — Submit news (protected).
    │   ├── DebateRoomsList.jsx     ← "/debate-rooms" — All debates (protected).
    │   ├── DebateRoom.jsx          ← "/debate-room/:roomId" — Single debate.
    │   ├── ExpertsPage.jsx         ← "/experts" — Expert dashboard (protected).
    │   ├── TrendingPage.jsx        ← "/trending" — Trending news (protected).
    │   └── TestAccuracy.jsx        ← Testing/admin utility page.
    │
    │  ┌─────────────────────────────────────────────────────────────────┐
    │  │  utils/ and assets/ — Helpers and static media                  │
    │  └─────────────────────────────────────────────────────────────────┘
    │
    ├── utils/
    │   └── debugConfig.js          ← Debug output configuration. Controls
    │                                  console.log verbosity in development.
    │
    └── assets/                     ← Images, fonts, and static media files
                                       imported by components.
```

---

## 4. Root-Level Files — The Configuration Layer

### 4.1 — `index.html` — The Single HTML File

**Theory:** In a traditional multi-page website, every page has its own HTML file (`index.html`, `about.html`, `contact.html`). In a Single Page Application (SPA) like VoxVeritas, there is **only ONE HTML file**. JavaScript dynamically swaps the content based on the URL.

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>VoxVeritas</title>
  </head>
  <body>
    <div id="root"></div>
    <!--
      This empty div is the "mounting point" for React.
      React will inject the ENTIRE application UI inside this div.
      Before React loads, the user sees a blank page.
    -->
    <script type="module" src="/src/main.jsx"></script>
    <!--
      This script tag tells the browser:
      1. Load /src/main.jsx
      2. type="module" means use ES Module syntax (import/export)
      3. Vite intercepts this in development and serves processed code
    -->
  </body>
</html>
```

### 4.2 — `package.json` — Project Identity Card

**Theory:** `package.json` is a standard Node.js file that describes the project: its name, version, dependencies, and scripts. Running `npm install` reads this file and downloads every listed dependency into the `node_modules/` folder.

Key sections:
- **`dependencies`**: Libraries needed at runtime (React, Axios, Tailwind)
- **`devDependencies`**: Libraries needed only during development (Vite, ESLint)
- **`scripts`**: Shortcut commands you run with `npm run <name>`

### 4.3 — `config.js` — Runtime Configuration

**The Journey:** The frontend needs to know where the backend API lives. This address differs between development (localhost:3000) and production (api.voxveritas.me). The `config.js` file handles this with environment detection.

```javascript
const config = {
    BASE_URL: import.meta.env.VITE_API_BASE_URL || 
              (import.meta.env.DEV ? "http://localhost:3000" : "https://api.voxveritas.me"),
    FACE_AUTH_URL: import.meta.env.VITE_FACE_AUTH_URL || 
                   (import.meta.env.DEV ? "http://127.0.0.1:5000" : "https://api.voxveritas.me/face-auth"),
};
export default config;
```

**Line-by-line:**
- `import.meta.env.VITE_API_BASE_URL` — Vite's way of reading environment variables (from `.env` files). If this is set, use it.
- `import.meta.env.DEV` — A boolean that Vite automatically sets to `true` during `npm run dev` and `false` during `npm run build`.
- `||` (logical OR) — If the first value is undefined/null, use the second value.

---

## 5. The `src/` Directory — All Source Code

Everything inside `src/` gets processed by Vite during the build:
- `.jsx` files are compiled (JSX → JavaScript, imports resolved)
- `.css` files are processed by PostCSS + Tailwind (generate only used classes)
- Images can be imported directly into components

**The four critical files at the `src/` root:**

| File | Role | Analogy |
|------|------|---------|
| `main.jsx` | Entry point — boots the entire React app | The ignition key of a car |
| `App.jsx` | Route definitions — URL → Component mapping | The GPS/navigation system |
| `config.js` | Runtime settings — backend URLs | The car's address book |
| `index.css` | Global Tailwind CSS directives | The car's paint job |

---

## 6. The `components/` Folder — 33 Reusable Building Blocks

### 6.1 — Why a Separate Components Folder?

Components are pieces of UI that are **used by multiple pages** or used **multiple times on a single page**. Keeping them in a dedicated folder avoids duplication.

### 6.2 — Component Categories

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  COMPONENT CATEGORIES IN VOXVERITAS                                         │
└─────────────────────────────────────────────────────────────────────────────┘

  LAYOUT (8 files)         — Structural elements visible on every page
  ────────────────
  Header, Footer, NavBar, NavigationHeader, Sidebar, RightBar,
  AnimatedLogo, FooterNew

  NEWS (5 files)           — News article display and interaction
  ──────────────
  NewsFeed, NewsCard, NewsSubmissionForm, TrendingNewsCard, RepostCard

  COMMENTS (5 files)       — Comment system components
  ─────────────────
  CommentSection, GroupedComments, EvidenceLinksSection,
  EvidenceDisplay, ExpertVotingSection

  AUTH & ROUTING (4 files) — Authentication and access control
  ────────────────────────
  ProtectedRoute, FaceCapture, Login, ErrorBoundary

  AI (1 file)              — AI-powered analysis
  ───────────
  AIVerdictSection

  DEBATE (2 files)         — Debate room UI
  ─────────────────
  AdvancedDebateRoom, CounterChatView

  LANDING PAGE (5 files)   — Marketing/landing page sections
  ────────────────────────
  HeroSection, About, WhySection, HowItWorks, KeyFeature, TeamSection

  UTILITY (2 files)        — Development/testing
  ──────────────────
  ApiDebugger, SimpleNewsCardTest
```

---

## 7. The `pages/` Folder — 13 Full-Page Components

### 7.1 — Pages vs Components — The Key Difference

A **page** is a component that represents an entire screen/view. It corresponds to a URL route. A page typically composes multiple smaller components.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PAGE vs COMPONENT                                                          │
└─────────────────────────────────────────────────────────────────────────────┘

  PAGE (HomePage.jsx):
  ├── Header component
  ├── NewsFeed component
  │   ├── NewsCard component (many instances)
  │   │   ├── CommentSection component
  │   │   └── AIVerdictSection component
  │   └── ... more NewsCard instances
  └── Footer component

  The PAGE is the "composer" — it arranges components together.
  COMPONENTS are the "instruments" — each plays one role.
```

### 7.2 — Route Mapping

| URL Path | Page File | Access Level |
|---------|-----------|-------------|
| `/` | `LandingPage.jsx` | Public |
| `/login` | `LoginForm.jsx` | Public |
| `/signup` | `SignupForm.jsx` | Public |
| `/admin/login` | `AdminLogin.jsx` | Public |
| `/admin/signup` | `AdminSignup.jsx` | Public |
| `/home` | `HomePage.jsx` | All authenticated |
| `/profile` | `ProfilePage.jsx` | All authenticated |
| `/trending` | `TrendingPage.jsx` | All authenticated |
| `/submit-news` | `NewsSubmissionForm.jsx` | Community + Expert + Admin |
| `/debate-rooms` | `DebateRoomsList.jsx` | All authenticated |
| `/debate-room/:roomId` | `DebateRoom.jsx` | All authenticated |
| `/experts` | `ExpertsPage.jsx` | All authenticated |

---

## 8. The `services/` Folder — API Communication Layer

### 8.1 — Why a Services Layer?

Instead of writing Axios HTTP calls directly inside components (which would duplicate code everywhere), all API calls are centralized in the `services/` folder. Components import and call these service functions.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  WITHOUT SERVICES LAYER (Bad):                                              │
│                                                                             │
│  NewsCard.jsx:  axios.get('http://localhost:3000/news/posts')              │
│  HomePage.jsx:  axios.get('http://localhost:3000/news/posts')  ← DUPLICATE │
│  TrendingPage:  axios.get('http://localhost:3000/news/posts')  ← REPEAT   │
│                                                                             │
│  If the URL changes → update EVERY file!                                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  WITH SERVICES LAYER (Good):                                                │
│                                                                             │
│  api.js:        newsAPI.getAllPosts = () => api.get('/news/posts')          │
│  NewsCard.jsx:  newsAPI.getAllPosts()  ← One line                          │
│  HomePage.jsx:  newsAPI.getAllPosts()  ← Same function                     │
│  TrendingPage:  newsAPI.getAllPosts()  ← Same function                     │
│                                                                             │
│  If the URL changes → update ONE place!                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 — The Three Service Files

| File | Contains | # of Functions |
|------|---------|---------------|
| `api.js` | Axios instance + authAPI, newsAPI, commentsAPI, commentFilterAPI, aiVerdictAPI, apiUtils | ~40+ |
| `debateRoomAPI.js` | All debate room operations | ~10 |
| `trendingNewsService.js` | Trending news queries | ~5 |

---

## 9. The `context/` Folder — Global State

### 9.1 — Why Context?

Authentication data (who is logged in, what type they are) is needed by dozens of components: `Header` shows the username, `ProtectedRoute` checks if authenticated, `CommentSection` checks user type, `NewsCard` checks if user can delete.

Passing this data through props at every level would be impractical. The `context/` folder provides a global data store that any component can access directly.

### 9.2 — One File, Entire Auth System

`userContext.jsx` provides:
- `userType` — "normal", "community", "expert", "guest", or "admin"
- `userInfo` — Object with name, email, ID
- `isAuthenticated` — Boolean
- `loading` — True during initial localStorage read
- `login(userData, token)` — Store credentials
- `logout()` — Clear everything
- `updateUserInfo(newInfo)` — Partial update

Full deep dive: [06-CONTEXT-API.md](./06-CONTEXT-API.md)

---

## 10. The `utils/` and `assets/` Folders

### `utils/` — Helper Functions

Currently minimal (just `debugConfig.js`), but this is where pure utility functions belong:
- Date formatting
- String manipulation
- Validation helpers
- Constants

### `assets/` — Static Media

Images, SVGs, fonts that components import directly:

```jsx
import logo from '../assets/logo.png';  // Vite processes this import
<img src={logo} alt="Logo" />           // Vite replaces with optimized URL
```

**Key difference from `public/`:** Files in `assets/` are **processed** by Vite (optimized, hashed filenames for caching). Files in `public/` are served **as-is**.

---

## 11. The `public/` Folder — Static Assets

Files in `public/` are served at the root URL without any processing:
- `public/vite.svg` → accessible at `http://localhost:5173/vite.svg`
- No Vite processing (no bundling, no optimization)
- Used for favicons, `robots.txt`, and files that must keep their exact filename

---

## 12. File Naming Conventions

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  NAMING RULES IN VOXVERITAS                                                 │
└─────────────────────────────────────────────────────────────────────────────┘

  REACT COMPONENTS:        PascalCase.jsx
  ─────────────────
  Header.jsx, NewsCard.jsx, AIVerdictSection.jsx, CommentSection.jsx
  WHY: React requires component names to start with uppercase.
  The filename matches the component name for easy finding.

  SERVICES/UTILITIES:      camelCase.js
  ─────────────────────
  api.js, debateRoomAPI.js, trendingNewsService.js, debugConfig.js
  WHY: These export functions/objects, not React components.
  camelCase is the JavaScript convention for non-component files.

  CONTEXT FILES:           camelCase.jsx
  ────────────────
  userContext.jsx
  WHY: Exports both a component (UserProvider) and an object (UserContext).
  Uses .jsx extension because it contains JSX.

  CONFIGURATION:           camelCase.js
  ────────────────
  config.js, vite.config.js, tailwind.config.js
  WHY: Standard JavaScript config file convention.

  FILE EXTENSIONS:
  ────────────────
  .jsx  — Contains JSX (HTML-like syntax). Any file with React components.
  .js   — Pure JavaScript. No JSX. Config files, services, utilities.
  .css  — Stylesheets (just index.css with Tailwind directives).
  .html — Just index.html.
  .json — Data files (package.json, vercel.json).
```

---

## 13. How Files Import Each Other — The Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  WHO IMPORTS WHOM?                                                          │
└─────────────────────────────────────────────────────────────────────────────┘

  index.html
    └── imports → main.jsx
                    └── imports → App.jsx
                    │               └── imports → ALL pages (13 files)
                    │               └── imports → ProtectedRoute
                    │               └── imports → UserProvider (context)
                    │
                    └── imports → userContext.jsx
                                   └── imports → api.js (apiUtils)

  PAGES import → COMPONENTS + SERVICES + CONTEXT
  ─────────────────────────────────────────────────
  HomePage.jsx
    └── imports → Header, NewsFeed, Footer

  NewsFeed.jsx
    └── imports → NewsCard, newsAPI, UserContext, config

  NewsCard.jsx
    └── imports → CommentSection, AIVerdictSection, newsAPI, UserContext

  CommentSection.jsx
    └── imports → commentsAPI, commentFilterAPI, UserContext,
                  EvidenceLinksSection, EvidenceDisplay, ExpertVotingSection

  SERVICES import → config.js (for BASE_URL)
  ──────────────────────────────────────────
  api.js
    └── imports → config.js → uses config.BASE_URL
```

---

## 14. Pages vs Components — What's the Difference?

| Aspect | Page | Component |
|--------|------|-----------|
| **Location** | `src/pages/` | `src/components/` |
| **Purpose** | Represents an entire screen/route | A reusable piece of UI |
| **Used where?** | In `App.jsx` route definitions | Inside pages or other components |
| **How many instances?** | Usually one (one route = one page) | Often many (multiple NewsCards) |
| **Data fetching?** | Often yes (the page fetches its data) | Sometimes (NewsFeed fetches, NewsCard doesn't) |
| **Example** | `HomePage` composes Header + NewsFeed + Footer | `NewsCard` displays one news article |

---

## 15. Interview Q&A

**Q: Why does VoxVeritas keep API calls in a `services/` folder instead of inside components?**
A: Separation of concerns. Components handle UI, services handle data fetching. This prevents code duplication (multiple components need the same API), makes testing easier (mock the service, not HTTP calls), and centralizes URL management (change once, affects everywhere).

**Q: What's the difference between `public/` and `src/assets/`?**
A: Files in `public/` are served as-is with no processing. Files in `src/assets/` are processed by Vite — they get optimized, bundled, and given hashed filenames for cache-busting. Use `public/` for files that must keep their exact name (favicons, robots.txt). Use `assets/` for images and media imported by components.

**Q: Why is there only one Context file (`userContext.jsx`)? Isn't that a bottleneck?**
A: For VoxVeritas's scale, a single context for auth state is sufficient. Auth data (userType, userInfo, isAuthenticated) is small and doesn't change frequently. If the app grew to need independent state domains (e.g., shopping cart, chat messages), you'd create additional contexts. Over-splitting context adds complexity without benefit for small apps.

---

**Next → [03-VITE-AND-BUILD.md](./03-VITE-AND-BUILD.md)** — How Vite builds and serves the application.
