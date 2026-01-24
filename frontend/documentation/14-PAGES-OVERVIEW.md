# 14 - Pages Overview: All Application Pages Explained

## What You'll Learn
- Complete list of all pages in the application
- Purpose and features of each page
- Component composition for each page
- Route mapping and access control

---

## Pages Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    APPLICATION PAGES                                        │
└─────────────────────────────────────────────────────────────────────────────┘

frontend/src/pages/
├── LandingPage.jsx      ── Public entry point
├── LoginForm.jsx        ── Authentication
├── SignupForm.jsx       ── Registration
├── HomePage.jsx         ── Main news feed (protected)
├── ProfilePage.jsx      ── User profile (protected)
├── NewsSubmissionForm.jsx── Submit news (protected)
├── DebateRoomsList.jsx  ── List of debates (protected)
├── DebateRoom.jsx       ── Single debate (protected)
├── ExpertsPage.jsx      ── Expert directory (protected)
├── TrendingPage.jsx     ── Trending news (protected)
└── TestAccuracy.jsx     ── Admin/testing page
```

---

## Page Routes and Access

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ROUTE CONFIGURATION                                      │
└─────────────────────────────────────────────────────────────────────────────┘

┌────────────────────┬────────────────────────┬──────────────────────────────┐
│ PATH               │ PAGE                   │ ACCESS                       │
├────────────────────┼────────────────────────┼──────────────────────────────┤
│ /                  │ LandingPage            │ Public                       │
│ /login             │ LoginForm              │ Public                       │
│ /signup            │ SignupForm             │ Public                       │
├────────────────────┼────────────────────────┼──────────────────────────────┤
│ /home              │ HomePage               │ All authenticated users     │
│ /profile           │ ProfilePage            │ All authenticated users     │
│ /trending          │ TrendingPage           │ All authenticated users     │
├────────────────────┼────────────────────────┼──────────────────────────────┤
│ /submit-news       │ NewsSubmissionForm     │ Community + Expert          │
│ /debate-rooms      │ DebateRoomsList        │ Community + Expert          │
│ /debate/:roomId    │ DebateRoom             │ Community + Expert          │
├────────────────────┼────────────────────────┼──────────────────────────────┤
│ /experts           │ ExpertsPage            │ Expert only                 │
└────────────────────┴────────────────────────┴──────────────────────────────┘
```

---

## 1. Landing Page

**File:** `LandingPage.jsx`  
**Route:** `/`  
**Access:** Public

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    LANDING PAGE STRUCTURE                                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  NavBar (with scroll-to-section buttons)                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  HERO SECTION                                                        │   │
│  │  - Platform tagline                                                  │   │
│  │  - Call-to-action buttons                                            │   │
│  │  - Animated background                                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ABOUT SECTION                                                       │   │
│  │  - Platform description                                              │   │
│  │  - Mission statement                                                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  FEATURES SECTION                                                    │   │
│  │  - Feature cards with icons                                          │   │
│  │  - Community verification                                            │   │
│  │  - AI analysis                                                       │   │
│  │  - Expert reviews                                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  PROBLEM SECTION                                                     │   │
│  │  - Why this platform exists                                          │   │
│  │  - Fake news statistics                                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  TEAM SECTION                                                        │   │
│  │  - Developer information                                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  Footer                                                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key Features:**
- Smooth scroll navigation
- Theme toggle (dark/light)
- Animated sections
- "Get Started" button leads to login

---

## 2. Login Page

**File:** `LoginForm.jsx`  
**Route:** `/login`  
**Access:** Public

**Features:**
- Email/password login
- Face authentication option
- User type selection (Normal/Community/Expert)
- Guest login option
- Link to signup

---

## 3. Signup Page

**File:** `SignupForm.jsx`  
**Route:** `/signup`  
**Access:** Public

**Features:**
- Full registration form
- Face capture for authentication
- Duplicate face detection
- User type selection
- Password confirmation
- Profession field (experts only)

---

## 4. Home Page (Main Feed)

**File:** `HomePage.jsx`  
**Route:** `/home`  
**Access:** All authenticated users

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    HOME PAGE STRUCTURE                                      │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  Header (with user menu, search, theme toggle)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  NEWS FEED (NewsFeed component)                                     │    │
│  │                                                                      │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │  NewsCard #1                                                 │    │    │
│  │  │  - Title, content, images                                    │    │    │
│  │  │  - Voting buttons                                            │    │    │
│  │  │  - Comments section                                          │    │    │
│  │  │  - AI verdict                                                │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  │                                                                      │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │  NewsCard #2                                                 │    │    │
│  │  │  ...                                                         │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  │                                                                      │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  Footer                                                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key Components:**
- Header with navigation
- NewsFeed (fetches and displays news)
- Multiple NewsCard instances
- Each NewsCard has CommentSection and AIVerdictSection

---

## 5. Profile Page

**File:** `ProfilePage.jsx`  
**Route:** `/profile`  
**Access:** All authenticated users

**Features:**
- View user information
- Edit profile details
- Update profile picture
- View activity statistics
- Change password
- Manage face authentication

---

## 6. News Submission Form

**File:** `NewsSubmissionForm.jsx`  
**Route:** `/submit-news`  
**Access:** Community + Expert users

**Features:**
- Title input
- Content/description textarea
- Source URL field
- Image upload (multiple)
- Submit for verification

---

## 7. Debate Rooms List

**File:** `DebateRoomsList.jsx`  
**Route:** `/debate-rooms`  
**Access:** Community + Expert users

**Features:**
- List of all active debate rooms
- Search/filter debates
- Create new debate room (experts)
- View participant count
- Navigate to individual rooms

---

## 8. Single Debate Room

**File:** `DebateRoom.jsx`  
**Route:** `/debate/:roomId`  
**Access:** Community + Expert users

**Features:**
- Two-column FOR/AGAINST layout
- Add arguments with stance
- Like/dislike comments
- AI grouping and summarization
- Counter-argument view

---

## 9. Experts Page

**File:** `ExpertsPage.jsx`  
**Route:** `/experts`  
**Access:** Expert users only

**Features:**
- Expert-only dashboard
- Pending verifications
- Expert tools
- Analytics for experts

---

## 10. Trending Page

**File:** `TrendingPage.jsx`  
**Route:** `/trending`  
**Access:** All authenticated users

**Features:**
- Most discussed news
- Trending topics
- High-engagement posts
- Popular debates

---

## Component Composition

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PAGE COMPONENT HIERARCHY                                 │
└─────────────────────────────────────────────────────────────────────────────┘

HomePage
├── Header
│   ├── AnimatedLogo
│   ├── SearchBar
│   ├── ThemeToggle
│   └── UserMenu
│
├── NewsFeed
│   ├── NewsCard
│   │   ├── ImageGallery
│   │   ├── VoteButtons
│   │   ├── CommentSection
│   │   │   ├── CommentInput
│   │   │   ├── StanceSelector
│   │   │   ├── EvidenceLinksSection
│   │   │   ├── CommentList
│   │   │   │   ├── EvidenceDisplay
│   │   │   │   └── ExpertVotingSection
│   │   │   └── GroupedCommentsView
│   │   │
│   │   └── AIVerdictSection
│   │
│   ├── NewsCard (repeated)
│   └── ...
│
└── Footer
```

---

## Route Protection Pattern

```jsx
// In App.jsx

<Routes>
  {/* Public Routes */}
  <Route path="/" element={<LandingPage />} />
  <Route path="/login" element={<LoginForm />} />
  <Route path="/signup" element={<SignupForm />} />

  {/* Protected Routes - All authenticated users */}
  <Route path="/home" element={
    <ProtectedRoute allowedUserTypes={['normal', 'community', 'expert', 'guest']}>
      <HomePage />
    </ProtectedRoute>
  } />

  {/* Protected Routes - Community + Expert only */}
  <Route path="/submit-news" element={
    <ProtectedRoute allowedUserTypes={['community', 'expert']}>
      <NewsSubmissionForm />
    </ProtectedRoute>
  } />

  {/* Protected Routes - Expert only */}
  <Route path="/experts" element={
    <ProtectedRoute allowedUserTypes={['expert']}>
      <ExpertsPage />
    </ProtectedRoute>
  } />
</Routes>
```

---

## Interview Questions & Answers

### Q1: How is route protection implemented?

**Answer:** Using `ProtectedRoute` component wrapper that:
1. Checks `isAuthenticated` from UserContext
2. Checks if `userType` is in `allowedUserTypes` prop
3. Redirects to `/login` if not authenticated
4. Shows "Access Denied" if user type not allowed

### Q2: What's the difference between pages and components?

**Answer:**
- **Pages**: Full screen views, rendered by routes, compose multiple components
- **Components**: Reusable pieces, used across multiple pages
- Pages import and arrange components to build the full UI

### Q3: Why separate DebateRoomsList and DebateRoom?

**Answer:** Different purposes:
- **List**: Overview of all debates, discovery
- **Single**: Deep interaction with one debate
Using dynamic routing (`:roomId`), one component handles any debate room

### Q4: How does the landing page scroll navigation work?

**Answer:**
1. Each section has a `ref` created with `useRef()`
2. NavBar receives scroll functions as props
3. Clicking "About" calls `scrollToAbout()`
4. Function uses `ref.current.scrollIntoView({ behavior: 'smooth' })`

---

**Next: [15-FORMS-AND-VALIDATION.md](./15-FORMS-AND-VALIDATION.md)** - Form handling and input validation →
