# 14 — Pages Overview: All VoxVeritas Pages Deep-Dive

## Table of Contents
1. [Pages vs Components — The Difference](#1-pages-vs-components--the-difference)
2. [Complete Route Table](#2-complete-route-table)
3. [LandingPage — First Impression](#3-landingpage--first-impression)
4. [LoginForm and SignupForm](#4-loginform-and-signupform)
5. [HomePage — The Main Dashboard](#5-homepage--the-main-dashboard)
6. [ProfilePage — User Settings](#6-profilepage--user-settings)
7. [NewsSubmissionForm — Uploading News](#7-newssubmissionform--uploading-news)
8. [TrendingPage — Popular Content](#8-trendingpage--popular-content)
9. [ExpertsPage — Expert Directory](#9-expertspage--expert-directory)
10. [DebateRoomsList — Room Browser](#10-debateroomslist--room-browser)
11. [DebateRoom — Active Debate](#11-debateroom--active-debate)
12. [Admin Pages](#12-admin-pages)
13. [Page Composition Patterns](#13-page-composition-patterns)
14. [Interview Q&A](#14-interview-qa)

---

## 1. Pages vs Components — The Difference

| Aspect | Page | Component |
|---|---|---|
| **Location** | `src/pages/` | `src/components/` |
| **Purpose** | Represents an entire screen/route | Reusable building block |
| **Route** | Mapped to a URL in App.jsx | Not directly routable |
| **Composition** | Assembles multiple components | May use other components |
| **Examples** | `HomePage`, `LoginForm` | `Header`, `NewsCard`, `Footer` |

```
  Route → Page → Components
  /home → HomePage → Header + NewsFeed → NewsCard[] + Footer
```

---

## 2. Complete Route Table

| Route Path | Page Component | Access | Purpose |
|---|---|---|---|
| `/` | `LandingPage` | Public | Marketing/intro page |
| `/login` | `LoginForm` | Public | User login |
| `/signup` | `SignupForm` | Public | User registration |
| `/admin/login` | `AdminLogin` | Public | Admin login |
| `/admin/signup` | `AdminSignup` | Public | Admin registration |
| `/home` | `HomePage` | Protected | Main news feed |
| `/profile` | `ProfilePage` | Protected | User profile/settings |
| `/submit-news` | `NewsSubmissionForm` | Protected (roles) | Upload news article |
| `/trending` | `TrendingPage` | Protected | Popular/trending news |
| `/experts` | `ExpertsPage` | Protected | Expert directory |
| `/debate-rooms` | `DebateRoomsList` | Protected | Browse debate rooms |
| `/debate-room/:roomId` | `DebateRoom` | Protected | Active debate |
| `/advanced-debate-room/:roomId` | `AdvancedDebateRoom` | Protected | Enhanced debate |
| `*` | Redirect to `/` | — | Catch-all 404 → home |

---

## 3. LandingPage — First Impression

The public marketing page seen by unauthenticated visitors.

### 3.1 — Sections

```
┌──────────────────────────────────────────────┐
│  Hero Section                                 │
│  "VoxVeritas — The Voice of Truth"            │
│  [Get Started] [Learn More]                   │
├──────────────────────────────────────────────┤
│  About Section                                │
│  What is VoxVeritas? Mission statement        │
├──────────────────────────────────────────────┤
│  Features Section                             │
│  ├── Community Verification                   │
│  ├── Expert Analysis                          │
│  └── AI-Powered Detection                     │
├──────────────────────────────────────────────┤
│  Problem Section                              │
│  Why fake news is dangerous                   │
├──────────────────────────────────────────────┤
│  Team Section                                 │
│  Developer profiles                           │
└──────────────────────────────────────────────┘
```

### 3.2 — Key Feature: Section Components

The LandingPage imports individual section components from `src/components/`:
- `About.jsx` — About section
- `Features.jsx` — Feature cards
- `ProblemSection.jsx` — Problem statement
- `TeamSection.jsx` — Team members

Each section is a standalone component, making the LandingPage a **composition** of smaller pieces.

---

## 4. LoginForm and SignupForm

See [08-AUTHENTICATION-FLOW.md](./08-AUTHENTICATION-FLOW.md) for detailed coverage.

### 4.1 — LoginForm Summary

```
┌──────────────────────────────────────────────┐
│  Two-column layout                            │
│  ┌──────────────┬───────────────────────────┐ │
│  │ Left Column  │ Right Column               │ │
│  │ Role info    │ Login form                 │ │
│  │ - Features   │ - Account type dropdown    │ │
│  │ - Benefits   │ - Email input              │ │
│  │              │ - [Password] [Face ID] tabs│ │
│  │              │ - Submit / Guest buttons    │ │
│  │              │ - Create account link       │ │
│  └──────────────┴───────────────────────────┘ │
└──────────────────────────────────────────────┘
```

### 4.2 — SignupForm Summary

Similar two-column layout with:
- Username, email, password, confirm password fields
- Account type selection (normal/community/expert)
- Optional face registration (FaceCapture component)
- Expert users may have additional fields (credentials, specialization)

---

## 5. HomePage — The Main Dashboard

```jsx
const HomePage = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <NewsFeed />
        {/* NewsFeed handles ALL data fetching and renders NewsCard components */}
      </main>
      <Footer />
    </div>
  );
};
```

HomePage is intentionally minimal — it's a container that assembles Header, NewsFeed, and Footer. All complexity lives in NewsFeed and its children.

---

## 6. ProfilePage — User Settings

Allows users to:
- View their profile information
- Update username, email, bio
- Upload a profile picture (`profileAPI.updateProfile` with multipart/form-data)
- Change password (`profileAPI.changePassword`)
- Register or update face authentication data

---

## 7. NewsSubmissionForm — Uploading News

### 7.1 — Access Control

```jsx
// In App.jsx:
<Route path="/submit-news" element={
  <ProtectedRoute allowedUserTypes={['normal', 'community', 'expert', 'admin']}>
    <NewsSubmissionForm />
  </ProtectedRoute>
} />
// Guests cannot submit news
```

### 7.2 — Form Fields

| Field | Type | Required | Description |
|---|---|---|---|
| Title | text | ✅ | News headline |
| Description | textarea | ✅ | Full article content |
| Link | URL | ✅ | Source URL |
| Screenshots | file (multiple) | ❌ | Supporting images |

### 7.3 — Submission Flow

```
User fills form → clicks Submit
       │
       ▼
Build FormData object:
  formData.append('title', title)
  formData.append('description', description)
  formData.append('link', sourceUrl)
  selectedFiles.forEach(f => formData.append('images', f))
       │
       ▼
newsAPI.uploadNews(formData)
  → POST /api/news/upload (multipart/form-data)
       │
       ▼
Backend:
  1. Saves text fields to database
  2. Saves images to /uploads/ directory
  3. Runs ML model for initial REAL/FAKE classification
  4. Sets status = "Pending"
  5. Returns the created post
       │
       ▼
toast.success('News submitted!') → navigate('/home')
```

---

## 8. TrendingPage — Popular Content

Displays news articles sorted by engagement (votes, comments). Uses `newsAPI.getCombinedFeed()` with sorting parameters.

---

## 9. ExpertsPage — Expert Directory

```jsx
// Fetches all approved experts:
useEffect(() => {
  const fetchExperts = async () => {
    const data = await expertAPI.getAllExperts();
    setExperts(data);
  };
  fetchExperts();
}, []);

// Renders expert cards with:
// - Name, credentials, specialization
// - Number of articles reviewed
// - Profile link
```

---

## 10. DebateRoomsList — Room Browser

Lists all available debate rooms. Users can:
- Browse existing rooms
- See room topics and participant counts
- Click to enter a specific room → navigates to `/debate-room/:roomId`

---

## 11. DebateRoom — Active Debate

See [13-DEBATE-COMPONENTS.md](./13-DEBATE-COMPONENTS.md) for detailed coverage.

---

## 12. Admin Pages

### AdminLogin / AdminSignup

Separate authentication flows for admin users:
- Route: `/admin/login`, `/admin/signup`
- Uses `authAPI.adminLogin()`, `authAPI.adminSignup()`
- Admin portal has elevated permissions (delete any content, manage users)

---

## 13. Page Composition Patterns

### 13.1 — The Standard Page Template

```jsx
const StandardPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page-specific content */}
      </main>
      <Footer />
    </div>
  );
};
```

### 13.2 — Pages WITHOUT Header/Footer

| Page | Why No Header/Footer |
|---|---|
| `LandingPage` | Has its own custom navigation/hero |
| `LoginForm` | Clean, focused login experience |
| `SignupForm` | Clean, focused signup experience |
| `AdminLogin` | Separate admin interface |
| `AdminSignup` | Separate admin interface |

### 13.3 — Data Flow Pattern

Every page that fetches data follows the same pattern:
```jsx
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  const fetchData = async () => {
    try {
      const result = await someAPI.getData();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);

if (loading) return <Spinner />;
if (error) return <ErrorMessage />;
return <DataDisplay data={data} />;
```

---

## 14. Interview Q&A

**Q: Why are pages in a separate folder from components?**
A: Pages represent entire screens mapped to routes; components are reusable building blocks. This separation makes it clear which files are route endpoints (pages) and which are shared pieces (components). When debugging a URL, you know to look in `pages/`.

**Q: Why does VoxVeritas have both `/debate-room/:roomId` and `/advanced-debate-room/:roomId`?**
A: `DebateRoom` is the standard implementation. `AdvancedDebateRoom` is an enhanced version with additional features (likely more AI features, better UI). Having both allows gradual migration — the standard one can be deprecated once the advanced version is stable.

**Q: What is the catch-all route `*` and why redirect to `/`?**
A: The `*` wildcard matches any URL not matched by previous routes. Instead of showing a 404 error page, VoxVeritas redirects users to the landing page. This is a common SPA pattern — since there's only one HTML file, any server-side URL resolves to the same `index.html`, so React Router handles the redirect client-side.

---

**Next → [15-FORMS-AND-VALIDATION.md](./15-FORMS-AND-VALIDATION.md)** — Controlled inputs, form state, and validation patterns.
