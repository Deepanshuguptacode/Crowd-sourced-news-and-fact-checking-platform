# 00 — VoxVeritas Frontend Documentation — Complete Navigation Hub

## Table of Contents
1. [What Is This Documentation?](#1-what-is-this-documentation)
2. [Who Is This For?](#2-who-is-this-for)
3. [The VoxVeritas Platform — Big Picture](#3-the-voxveritas-platform--big-picture)
4. [What Is a "Frontend"?](#4-what-is-a-frontend)
5. [Technology Stack — Every Tool Explained](#5-technology-stack--every-tool-explained)
6. [High-Level Architecture Diagram](#6-high-level-architecture-diagram)
7. [Complete Frontend Folder Structure](#7-complete-frontend-folder-structure)
8. [Documentation Map — All 18 Files](#8-documentation-map--all-18-files)
9. [Learning Paths — Choose Your Journey](#9-learning-paths--choose-your-journey)
10. [How Every Documentation File Is Structured](#10-how-every-documentation-file-is-structured)
11. [Quick-Start: Running the Frontend Locally](#11-quick-start-running-the-frontend-locally)
12. [Key Concepts You Will Encounter](#12-key-concepts-you-will-encounter)
13. [Application Architecture — Data Flow](#13-application-architecture--data-flow)
14. [Tips for Absolute Beginners](#14-tips-for-absolute-beginners)
15. [Glossary of Terms](#15-glossary-of-terms)

---

## 1. What Is This Documentation?

This is the **master navigation hub** for the VoxVeritas frontend codebase. It serves as your starting point — a **table of contents** for everything inside these 18 documentation files (**00** through **17**).

**The Goal:** Whether you have never seen a line of JavaScript in your life, or you are a seasoned developer reviewing this project, every concept, every function, every React hook, every API call is explained from scratch — starting with **theory** ("Why does this exist?"), continuing with **strategy** ("How are we going to solve this?"), and ending with **annotated code** ("Here is the exact implementation, line by line").

---

## 2. Who Is This For?

| Audience | What you'll get |
|----------|----------------|
| **Complete beginner** (never coded) | Every concept explained from zero. No prior knowledge assumed. |
| **JavaScript developer new to React** | Deep explanations of React patterns, hooks, component lifecycle. |
| **React developer studying this project** | Architecture decisions, data flow diagrams, API integration details. |
| **Interviewer / Evaluator** | Comprehensive proof of understanding — every "why" is answered. |
| **Future maintainer** | A living reference for every component, every service, every route. |

---

## 3. The VoxVeritas Platform — Big Picture

### 3.1 — What Problem Does VoxVeritas Solve?

In the modern world, **misinformation** — commonly called "fake news" — spreads faster than verified facts. Social media accelerates this problem because anyone can post anything without verification.

**VoxVeritas** (Latin for "Voice of Truth") is a **crowd-sourced news fact-checking platform** that tackles this by combining three verification layers:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    THE THREE VERIFICATION PILLARS                           │
└─────────────────────────────────────────────────────────────────────────────┘

  PILLAR 1: COMMUNITY VERIFICATION
  ─────────────────────────────────
  Regular users read news articles, provide evidence links,
  vote on credibility, and leave structured comments
  with stances (in-favor / against / general).

  PILLAR 2: EXPERT ANALYSIS
  ─────────────────────────
  Verified domain experts provide professional analysis,
  evaluate community comments, and add authoritative opinions.

  PILLAR 3: AI-POWERED ANALYSIS
  ─────────────────────────────
  Google Gemini AI reads the news, analyzes all comments,
  checks source metadata, and generates a credibility score
  (0-100) with detailed reasoning — effectively acting as
  a third "judge" alongside community and expert voices.
```

### 3.2 — User Roles in the Platform

| Role | Internal Name | What They Can Do |
|------|--------------|------------------|
| **Onlooker** | `normal` | View news, browse the feed, see verdicts. Cannot comment or vote. |
| **Guest** | `guest` | Temporary browsing. Cannot vote, comment, or submit news. Session is memory-only (nothing saved to localStorage). |
| **Community Member** | `community` | Everything an Onlooker can do, PLUS: submit news, vote, leave comments with evidence links, participate in debate rooms. |
| **Expert** | `expert` | Everything a Community Member can do, PLUS: provide expert-level analysis, verify community claims, generate AI verdicts. |
| **Admin** | `admin` | Full platform control. Manage users, delete content. |

---

## 4. What Is a "Frontend"?

Before we dive in, let's clarify what "frontend" means in the context of a web application:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    WEB APPLICATION ARCHITECTURE                             │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────┐         ┌─────────────────────┐
    │     FRONTEND        │  HTTP   │     BACKEND         │
    │   (This codebase)   │◄──────►│   (Node.js/Express) │
    │                     │ (JSON)  │                     │
    │  • React components │         │  • REST API routes  │
    │  • User interface   │         │  • Business logic   │
    │  • Runs in browser  │         │  • Database queries  │
    │  • HTML/CSS/JS      │         │  • Authentication   │
    └─────────────────────┘         └──────────┬──────────┘
                                               │
                                    ┌──────────▼──────────┐
                                    │     DATABASE        │
                                    │   (MongoDB Atlas)   │
                                    │                     │
                                    │  • Users            │
                                    │  • News articles    │
                                    │  • Comments         │
                                    │  • Debate rooms     │
                                    └─────────────────────┘
```

**The frontend** is what the user **sees and interacts with** — buttons, forms, news cards, navigation. It runs entirely in the user's web browser (Chrome, Firefox, etc.).

**The backend** is the invisible server that **stores data, processes requests, and runs AI analysis**. The frontend talks to the backend using HTTP requests (specifically REST API calls) that send and receive JSON data.

---

## 5. Technology Stack — Every Tool Explained

### 5.1 — Core Technologies

| Technology | Version | What It Is | Why We Use It |
|-----------|---------|-----------|---------------|
| **React** | 18.x | A JavaScript library for building user interfaces using reusable "components" | Industry standard. Component model makes complex UIs manageable. |
| **Vite** | 6.0.5 | A build tool and development server | Extremely fast. Hot Module Replacement (HMR) refreshes changes in milliseconds vs. seconds with Webpack. |
| **React Router DOM** | 7.2.0 | A routing library for Single Page Applications (SPAs) | Allows navigation between "pages" without full page reloads. |
| **Axios** | 1.7.9 | An HTTP client library for making API requests | Better error handling, request/response interceptors, and automatic JSON parsing compared to native `fetch`. |
| **Tailwind CSS** | 3.4.17 | A utility-first CSS framework | Write styles directly in HTML/JSX using short class names like `bg-blue-500`, `text-white`, `rounded-lg`. No separate CSS files needed. |

### 5.2 — Supporting Libraries

| Library | Purpose | Example Use |
|---------|---------|-------------|
| **react-toastify** | Pop-up notification messages (toasts) | `toast.success("Login successful!")` shows a green message in the corner |
| **lucide-react** | Icon components (SVG icons as React components) | `<Eye />`, `<Mail />`, `<Lock />` — renders an eye/mail/lock icon |
| **@heroicons/react** | Additional icon set from the Tailwind team | Used in debate room components for arrows, thumbs up/down |
| **framer-motion** | Animation library for React | Smooth page transitions, animated blobs on the login page |
| **prop-types** | Runtime type-checking for component props | Warns in console if a component receives wrong data types |

### 5.3 — Development Tools

| Tool | Purpose |
|------|---------|
| **ESLint** | Catches code quality issues and enforces consistent style |
| **PostCSS** | Processes Tailwind CSS into standard CSS |
| **Autoprefixer** | Adds browser-specific CSS prefixes automatically |

---

## 6. High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BROWSER                                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           index.html                                        │
│            The ONLY HTML file. Vite injects React here.                     │
│            Contains <div id="root"></div> — the mounting point.             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           main.jsx                                          │
│                                                                             │
│   ┌──────────────┐  ┌───────────────┐  ┌─────────────┐  ┌──────────────┐  │
│   │  StrictMode   │→ │ UserProvider  │→ │    App      │  │ToastContainer│  │
│   │ (Dev checks)  │  │ (Auth state)  │  │  (Routes)   │  │ (Notifs)     │  │
│   └──────────────┘  └───────────────┘  └─────────────┘  └──────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼──────────────────┐
                    ▼               ▼                  ▼
            ┌───────────┐   ┌─────────────┐   ┌─────────────┐
            │   PAGES   │   │ COMPONENTS  │   │  SERVICES   │
            │ (Routes)  │   │ (Reusable)  │   │   (API)     │
            │           │   │             │   │             │
            │ HomePage  │   │ Header      │   │ authAPI     │
            │ LoginForm │   │ NewsFeed    │   │ newsAPI     │
            │ SignupForm│   │ NewsCard    │   │ commentsAPI │
            │ DebateRoom│   │ CommentSect.│   │ aiVerdictAPI│
            │ ...       │   │ AIVerdict   │   │ debateAPI   │
            └───────────┘   └─────────────┘   └─────────────┘
                                                      │
                                              ┌───────▼───────┐
                                              │  Axios HTTP   │
                                              │  Instance     │
                                              │  (interceptors│
                                              │   + JWT token)│
                                              └───────┬───────┘
                                                      │
                                              ┌───────▼───────┐
                                              │   BACKEND     │
                                              │  (Express.js) │
                                              │  Port 3000    │
                                              └───────────────┘
```

---

## 7. Complete Frontend Folder Structure

```
frontend/
│
├── index.html                    ← The single HTML file (SPA entry point)
├── package.json                  ← Dependencies & NPM scripts
├── vite.config.js                ← Vite build tool configuration
├── tailwind.config.js            ← Tailwind CSS customization
├── postcss.config.js             ← PostCSS plugins (Tailwind + Autoprefixer)
├── eslint.config.js              ← Code quality rules
├── vercel.json                   ← Deployment configuration for Vercel
│
├── public/                       ← Static assets (served as-is, not processed)
│   └── vite.svg                  ← Default Vite favicon
│
├── src/                          ← ALL SOURCE CODE lives here
│   ├── main.jsx                  ← Entry point — mounts React to DOM
│   ├── App.jsx                   ← Root component — defines all routes
│   ├── config.js                 ← Backend URL & Face Auth URL configuration
│   ├── index.css                 ← Global styles (Tailwind directives)
│   │
│   ├── context/                  ← Global state management
│   │   └── userContext.jsx       ← User auth state (login, logout, userType)
│   │
│   ├── services/                 ← API communication layer
│   │   ├── api.js                ← Main Axios instance + all API modules
│   │   ├── debateRoomAPI.js      ← Debate room-specific API calls
│   │   └── trendingNewsService.js← Trending news API calls
│   │
│   ├── components/               ← Reusable UI building blocks (33 files)
│   │   ├── Header.jsx            ← Top navigation bar
│   │   ├── Footer.jsx            ← Page footer
│   │   ├── NavBar.jsx            ← Landing page navigation
│   │   ├── AnimatedLogo.jsx      ← Animated VoxVeritas logo
│   │   ├── NavigationHeader.jsx  ← Simple back-navigation header
│   │   ├── ProtectedRoute.jsx    ← Route guard (auth + role check)
│   │   ├── ErrorBoundary.jsx     ← Catches React rendering errors
│   │   ├── NewsFeed.jsx          ← Fetches & displays news list
│   │   ├── NewsCard.jsx          ← Single news article card
│   │   ├── CommentSection.jsx    ← Comment list + add comment form
│   │   ├── AIVerdictSection.jsx  ← AI credibility analysis display
│   │   ├── GroupedComments.jsx   ← AI-grouped comment clusters
│   │   ├── EvidenceLinksSection.jsx ← Add evidence URL inputs
│   │   ├── EvidenceDisplay.jsx   ← Render evidence link cards
│   │   ├── ExpertVotingSection.jsx ← Expert upvote/downvote on comments
│   │   ├── FaceCapture.jsx       ← Webcam face capture for biometric auth
│   │   ├── AdvancedDebateRoom.jsx← Enhanced debate room component
│   │   ├── CounterChatView.jsx   ← Counter-argument side-by-side view
│   │   ├── TrendingNewsCard.jsx  ← Card for trending news items
│   │   ├── RepostCard.jsx        ← Reposted news card
│   │   ├── Sidebar.jsx           ← Left sidebar component
│   │   ├── RightBar.jsx          ← Right sidebar component
│   │   ├── HeroSection.jsx       ← Landing page hero banner
│   │   ├── About.jsx             ← Landing page about section
│   │   ├── WhySection.jsx        ← Landing page "why this matters" section
│   │   ├── HowItWorks.jsx        ← Landing page how-it-works section
│   │   ├── KeyFeature.jsx        ← Landing page feature cards
│   │   ├── TeamSection.jsx       ← Landing page team members
│   │   ├── Login.jsx             ← Legacy login component
│   │   └── ...
│   │
│   ├── pages/                    ← Full-page components (one per route)
│   │   ├── LandingPage.jsx       ← Public marketing/landing page
│   │   ├── LoginForm.jsx         ← Login page (password + face auth)
│   │   ├── SignupForm.jsx        ← Registration page
│   │   ├── HomePage.jsx          ← Main news feed (authenticated users)
│   │   ├── ProfilePage.jsx       ← User profile management
│   │   ├── NewsSubmissionForm.jsx← Submit new news articles
│   │   ├── DebateRoomsList.jsx   ← List of all debate rooms
│   │   ├── DebateRoom.jsx        ← Single debate room view
│   │   ├── ExpertsPage.jsx       ← Expert-only features
│   │   ├── TrendingPage.jsx      ← Trending/popular news
│   │   ├── TestAccuracy.jsx      ← Admin/testing page
│   │   ├── AdminLogin.jsx        ← Admin login page
│   │   └── AdminSignup.jsx       ← Admin registration
│   │
│   ├── utils/                    ← Utility/helper functions
│   │   └── debugConfig.js        ← Debug output configuration
│   │
│   └── assets/                   ← Images, fonts, static media
│
├── documentation/                ← Original documentation (18 files)
└── documentationFrontendDetailed/ ← THIS detailed documentation
```

---

## 8. Documentation Map — All 18 Files

### Part 1: Foundation (Files 00–03)

| # | File | What It Covers |
|---|------|---------------|
| **00** | [00-README.md](./00-README.md) | **You are here.** Navigation hub, tech stack, architecture overview. |
| **01** | [01-REACT-FUNDAMENTALS.md](./01-REACT-FUNDAMENTALS.md) | What is React? Components, JSX, props, state, hooks — all from scratch. |
| **02** | [02-PROJECT-STRUCTURE.md](./02-PROJECT-STRUCTURE.md) | Every folder and file in the project explained. Why this structure? |
| **03** | [03-VITE-AND-BUILD.md](./03-VITE-AND-BUILD.md) | What is Vite? How builds work. Development vs production. HMR. |

### Part 2: Core Concepts (Files 04–06)

| # | File | What It Covers |
|---|------|---------------|
| **04** | [04-APP-ENTRY-POINT.md](./04-APP-ENTRY-POINT.md) | Bootstrap flow: `index.html` → `main.jsx` → `App.jsx`. Every line explained. |
| **05** | [05-REACT-ROUTER.md](./05-REACT-ROUTER.md) | SPA routing, BrowserRouter, Routes, ProtectedRoute, URL parameters. |
| **06** | [06-CONTEXT-API.md](./06-CONTEXT-API.md) | The prop-drilling problem, Context API, UserContext deep dive. |

### Part 3: API Integration (Files 07–08)

| # | File | What It Covers |
|---|------|---------------|
| **07** | [07-AXIOS-AND-API-SERVICES.md](./07-AXIOS-AND-API-SERVICES.md) | Axios setup, interceptors, service layer, every API module. |
| **08** | [08-AUTHENTICATION-FLOW.md](./08-AUTHENTICATION-FLOW.md) | Login, signup, face auth, JWT tokens, session management. |

### Part 4: UI Components (Files 09–13)

| # | File | What It Covers |
|---|------|---------------|
| **09** | [09-LAYOUT-COMPONENTS.md](./09-LAYOUT-COMPONENTS.md) | Header, Footer, NavBar, theme toggle, navigation. |
| **10** | [10-NEWS-COMPONENTS.md](./10-NEWS-COMPONENTS.md) | NewsFeed, NewsCard, voting, image pagination. |
| **11** | [11-COMMENT-COMPONENTS.md](./11-COMMENT-COMPONENTS.md) | CommentSection, evidence links, expert voting, AI grouping. |
| **12** | [12-AI-COMPONENTS.md](./12-AI-COMPONENTS.md) | AIVerdictSection, credibility scores, Gemini AI integration. |
| **13** | [13-DEBATE-COMPONENTS.md](./13-DEBATE-COMPONENTS.md) | DebateRoom, for/against stances, counter-arguments, like/dislike. |

### Part 5: Pages & Forms (Files 14–15)

| # | File | What It Covers |
|---|------|---------------|
| **14** | [14-PAGES-OVERVIEW.md](./14-PAGES-OVERVIEW.md) | Every page component, route mapping, access control. |
| **15** | [15-FORMS-AND-VALIDATION.md](./15-FORMS-AND-VALIDATION.md) | Controlled components, form state, validation patterns. |

### Part 6: Styling & Patterns (Files 16–17)

| # | File | What It Covers |
|---|------|---------------|
| **16** | [16-TAILWIND-CSS.md](./16-TAILWIND-CSS.md) | Utility-first CSS, dark mode, responsive design, the config file. |
| **17** | [17-BEST-PRACTICES.md](./17-BEST-PRACTICES.md) | Code organization, component design, performance, error handling. |

---

## 9. Learning Paths — Choose Your Journey

### Path A: Complete Frontend (Start to Finish) — Recommended
```
01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10 → 11 → 12 → 13 → 14 → 15 → 16 → 17
```
Follow every file in order. Each builds on the previous.

### Path B: "I Know React, Show Me the Architecture"
```
02 → 04 → 07 → 08 → 14
```
Project structure → Entry point → API layer → Auth flow → All pages.

### Path C: "I Only Care About Components"
```
09 → 10 → 11 → 12 → 13
```
Layout → News → Comments → AI → Debates.

### Path D: "I Need to Understand Authentication"
```
06 → 07 → 08
```
Context (where auth state lives) → API service (how requests work) → Auth flow (login/signup/face).

### Path E: "I'm Styling This App"
```
16 → 17
```
Tailwind CSS deep dive → Best practices and patterns.

---

## 10. How Every Documentation File Is Structured

Every file in this documentation follows a consistent pedagogical pattern:

```
┌──────────────────────────────────────────────────────────┐
│  SECTION 1 — THEORY: What Is This?                       │
│  • The problem being solved                              │
│  • The concept explained from zero                       │
│  • Real-world analogies                                  │
├──────────────────────────────────────────────────────────┤
│  SECTION 2 — WHY: Design Decisions                       │
│  • Why this approach over alternatives?                  │
│  • What are the trade-offs?                              │
│  • What would happen without this?                       │
├──────────────────────────────────────────────────────────┤
│  SECTION 3 — THE JOURNEY (Before Any Code)               │
│  • Step-by-step verbal walkthrough                       │
│  • "First we create X, then we call Y method,            │
│    which does Z because..."                              │
│  • Diagrams showing data flow                            │
├──────────────────────────────────────────────────────────┤
│  SECTION 4 — THE CODE (Annotated Line-by-Line)           │
│  • Every import explained                                │
│  • Every function annotated                              │
│  • Every hook usage justified                            │
│  • Every variable named and reasoned                     │
├──────────────────────────────────────────────────────────┤
│  SECTION 5 — HOW IT ALL CONNECTS                         │
│  • Diagrams showing component relationships              │
│  • Data flow from user action → screen update            │
│  • Connection to backend APIs                            │
├──────────────────────────────────────────────────────────┤
│  SECTION 6 — INTERVIEW Q&A                               │
│  • Common questions about this topic                     │
│  • Answers that demonstrate understanding                │
└──────────────────────────────────────────────────────────┘
```

---

## 11. Quick-Start: Running the Frontend Locally

### Prerequisites
1. **Node.js** (version 18 or higher) — Download from [nodejs.org](https://nodejs.org)
2. **npm** — Comes bundled with Node.js
3. **A code editor** — VS Code recommended
4. **The backend server running** — The frontend needs the backend API to function

### Step-by-Step

```bash
# Step 1: Navigate to the frontend folder
cd frontend

# Step 2: Install all dependencies listed in package.json
npm install

# Step 3: Start the development server
npm run dev

# Step 4: Open your browser to:
# http://localhost:5173
```

### What Happens When You Run `npm run dev`?

1. Vite reads `vite.config.js` for settings
2. Vite starts a development server on port **5173**
3. Vite reads `index.html` as the entry point
4. `index.html` has a `<script>` tag pointing to `src/main.jsx`
5. Vite processes `main.jsx` → `App.jsx` → all imported components
6. Your browser displays the running application
7. **HMR** (Hot Module Replacement): Any file you edit is instantly reflected in the browser without a full reload

---

## 12. Key Concepts You Will Encounter

| Concept | What It Is | Where Explained |
|---------|-----------|----------------|
| **Component** | A reusable piece of UI (like a "news card" or "header") | Doc 01 |
| **JSX** | HTML-like syntax inside JavaScript | Doc 01 |
| **Props** | Data passed from parent to child component | Doc 01 |
| **State** | Data that changes over time (triggers re-renders) | Doc 01 |
| **Hook** | Special React functions (`useState`, `useEffect`, `useContext`) | Docs 01, 04, 06 |
| **SPA** | Single Page Application — one HTML file, JavaScript changes the view | Doc 05 |
| **Route** | A URL path mapped to a component (e.g., `/home` → `HomePage`) | Doc 05 |
| **Context** | A way to share data globally without passing through every component | Doc 06 |
| **Interceptor** | Code that runs before every API request or after every response | Doc 07 |
| **JWT** | JSON Web Token — a secure string proving you're logged in | Doc 08 |
| **Protected Route** | A route that requires authentication to access | Doc 05 |
| **Tailwind Class** | A short CSS utility like `bg-blue-500` that sets one style property | Doc 16 |

---

## 13. Application Architecture — Data Flow

### What Happens When a User Visits VoxVeritas

```
STEP 1: User opens http://localhost:5173
        ↓
STEP 2: Browser loads index.html (the only HTML file)
        ↓
STEP 3: index.html loads main.jsx (JavaScript entry point)
        ↓
STEP 4: main.jsx mounts <App /> inside the "root" div
         Wraps everything in:
         • StrictMode (catches React mistakes in development)
         • UserProvider (makes auth data available everywhere)
         • ToastContainer (enables pop-up notifications)
        ↓
STEP 5: App.jsx checks the URL path
         Matches "/" → shows LandingPage
         Matches "/login" → shows LoginForm
         Matches "/home" → checks auth → shows HomePage or redirects to /login
        ↓
STEP 6: Component renders, may call API:
         newsAPI.getAllPosts() → Axios HTTP GET → Backend → MongoDB → JSON response
        ↓
STEP 7: Component receives data, updates state, React re-renders the UI
```

### The Login Flow (Simplified)

```
User fills in email + password → Clicks "Sign In"
        ↓
LoginForm.jsx calls authAPI.login(userType, credentials)
        ↓
Axios sends POST /users/{userType}/login to backend
        ↓
Backend verifies credentials → Returns JWT token + user data
        ↓
LoginForm calls context.login(userData, token)
        ↓
UserContext stores: userType, userInfo, isAuthenticated = true
Token is saved to localStorage (survives page refresh)
        ↓
navigate("/home") → React Router shows HomePage
        ↓
Every future API call: Axios interceptor reads token from localStorage
and adds "Authorization: Bearer <token>" header automatically
```

---

## 14. Tips for Absolute Beginners

1. **Run the project first** — Before reading any documentation, run `npm run dev` and click around. See what the app looks like.
2. **Install React DevTools** — A browser extension that lets you inspect React component trees and state values.
3. **Use the Network tab** — In your browser's DevTools (F12), the Network tab shows every API request the frontend makes to the backend.
4. **Add `console.log()`** — If a concept is unclear, add `console.log(variableName)` inside a component to see what value it holds.
5. **Read one doc at a time** — Don't rush through all 17 files. Read one, then explore the corresponding source code.
6. **Break things on purpose** — Change a component's code, see what error appears. Understanding errors accelerates learning.
7. **Draw the tree** — Sketch the component hierarchy on paper: `App → HomePage → Header + NewsFeed → NewsCard[]`

---

## 15. Glossary of Terms

| Term | Definition |
|------|-----------|
| **API** | Application Programming Interface — a set of rules for how software communicates. Here: HTTP endpoints the frontend calls. |
| **Axios** | A JavaScript library for making HTTP requests (GET, POST, PUT, DELETE). |
| **Component** | A self-contained piece of UI. In React, it's a function that returns JSX. |
| **Context** | A React feature for sharing data globally across components without prop-drilling. |
| **CRUD** | Create, Read, Update, Delete — the four basic database operations. |
| **DOM** | Document Object Model — the browser's internal representation of the page structure. |
| **Hooks** | React functions (starting with `use`) that let components manage state and side effects. |
| **HMR** | Hot Module Replacement — Vite updates your running app without a full page reload. |
| **Interceptor** | Middleware that runs before/after every Axios request/response. |
| **JSX** | JavaScript XML — a syntax that lets you write HTML-like code inside JavaScript files. |
| **JWT** | JSON Web Token — a compact, URL-safe token for securely transmitting user identity. |
| **localStorage** | Browser storage that persists data even after closing the tab. |
| **Props** | Properties — read-only data passed from a parent component to a child component. |
| **REST** | Representational State Transfer — an API design pattern using HTTP methods (GET, POST, etc.). |
| **Route** | A URL path mapped to a specific component. `/home` renders `HomePage`. |
| **SPA** | Single Page Application — one HTML page; JavaScript dynamically swaps content. |
| **State** | Data within a component that can change over time, triggering UI re-renders. |
| **Tailwind** | A utility-first CSS framework where you style by adding classes like `bg-blue-500`. |
| **Vite** | A fast build tool for modern web projects (pronounced "veet", French for "fast"). |

---

**Now begin your journey! Start with → [01-REACT-FUNDAMENTALS.md](./01-REACT-FUNDAMENTALS.md)**
