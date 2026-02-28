# 09 — Layout Components: Header, Footer & AnimatedLogo Deep-Dive

## Table of Contents
1. [What Are Layout Components?](#1-what-are-layout-components)
2. [The Page Layout Pattern in VoxVeritas](#2-the-page-layout-pattern-in-voxveritas)
3. [Header Component — Complete Walkthrough](#3-header-component--complete-walkthrough)
4. [Footer Component](#4-footer-component)
5. [AnimatedLogo Component](#5-animatedlogo-component)
6. [ErrorBoundary Component](#6-errorboundary-component)
7. [Interview Q&A](#7-interview-qa)

---

## 1. What Are Layout Components?

**Layout components** are the reusable structural pieces that appear on most or all pages. They wrap page-specific content, providing a consistent look and feel:

```
┌──────────────────────────────────────────────────────────┐
│  Header (Logo, Nav, Search, Theme Toggle, User Menu)     │  ← Layout
├──────────────────────────────────────────────────────────┤
│                                                          │
│                     Page Content                         │  ← Changes per route
│              (HomePage / DebateRoom / etc)                │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  Footer (Copyright, Links)                               │  ← Layout
└──────────────────────────────────────────────────────────┘
```

In VoxVeritas, each page includes Header and Footer explicitly rather than using a shared layout wrapper. This gives each page control over whether to include them.

---

## 2. The Page Layout Pattern in VoxVeritas

```jsx
// Typical page structure (e.g., HomePage.jsx):
const HomePage = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Header />              {/* Always at top */}
      <main className="...">  
        <NewsFeed />           {/* Page-specific content */}
      </main>
      <Footer />              {/* Always at bottom */}
    </div>
  );
};

// Pages that DON'T use Header/Footer:
// - LandingPage: has its own custom header/hero
// - LoginForm: no navigation needed
// - SignupForm: no navigation needed
```

---

## 3. Header Component — Complete Walkthrough

### 3.1 — What It Provides

The Header handles **six responsibilities**:
1. Brand display (AnimatedLogo)
2. Navigation links (Home, Trending, Experts, Debate Rooms)
3. Search bar (expandable on mobile)
4. Dark/Light theme toggle
5. User info display (name, role)
6. User dropdown menu (Profile, Submit News, Logout)

### 3.2 — Internal Sub-Components

The Header file defines two helper components before the main Header:

```jsx
// ═══════════════════════════════════════════════════════════════════════════
// HELPER 1: Icon — Renders an SVG path as an icon
// ═══════════════════════════════════════════════════════════════════════════
const Icon = ({ path, className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor"
       strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);
// Used for the user avatar icon (generic person silhouette)

// ═══════════════════════════════════════════════════════════════════════════
// HELPER 2: SearchInput — Reusable search field
// ═══════════════════════════════════════════════════════════════════════════
const SearchInput = ({ value, onChange, autoFocus }) => (
  <div className="relative">
    <input
      type="text"
      placeholder="Search news..."
      value={value}
      onChange={onChange}
      autoFocus={autoFocus}
      className="w-full pl-10 pr-4 py-2 bg-gray-100/80 dark:bg-gray-800/50 ..."
    />
    {/* Magnifying glass icon positioned inside input */}
    <Icon path="..." className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
  </div>
);
```

### 3.3 — State Management

```jsx
const Header = () => {
  // ─── State ──────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  // Persisted to localStorage so it survives page refresh

  const [showSearch, setShowSearch] = useState(false);
  // Mobile: toggles search bar visibility

  const [searchTerm, setSearchTerm] = useState('');
  // The text in the search input

  const [showUserMenu, setShowUserMenu] = useState(false);
  // Toggles the dropdown menu (Profile, Logout, etc.)

  // ─── Context ────────────────────────────────────────────────────────────
  const { userInfo, userType, isAuthenticated, logout } = useContext(UserContext);
  const navigate = useNavigate();
```

### 3.4 — Dark Mode Toggle

```jsx
  // ─── Theme Effect ──────────────────────────────────────────────────────
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      // Adds class="dark" to <html> element
      // Tailwind's dark: variants activate when <html> has class="dark"
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
    // Persist so theme is remembered after refresh
  }, [theme]);  // Runs whenever theme changes
```

How Tailwind dark mode works:
```
Theme = 'light':
  <html>                              ← No "dark" class
    bg-white                          ← "bg-white" applies
    dark:bg-gray-900                  ← Ignored (no dark class)

Theme = 'dark':
  <html class="dark">                 ← "dark" class present
    bg-white                          ← Overridden by dark variant
    dark:bg-gray-900                  ← Activates!
```

### 3.5 — Click-Outside to Close Menu

```jsx
  useEffect(() => {
    const handleClickOutside = (event) => {
      // If user clicks anywhere and the menu is open, close it
      if (showUserMenu) setShowUserMenu(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
    // Cleanup: remove listener when component unmounts or effect re-runs
  }, [showUserMenu]);
```

### 3.6 — Navigation Items

```jsx
  const navItems = [
    { to: '/home', label: 'Home' },
    { to: '/trending', label: 'Trending' },
    { to: '/experts', label: 'Experts' },
    { to: '/debate-rooms', label: 'Debate Rooms' },
  ];
  // Rendered as buttons (not Links) — useNavigate() handles navigation

  const userTypeLabels = {
    normal: 'Onlooker', community: 'Community', expert: 'Expert', admin: 'Admin',
  };
```

### 3.7 — Conditional Rendering in Header

```
  isAuthenticated?
      │
      ├── YES:
      │     ├── Show user name + role label
      │     ├── Show avatar button (opens dropdown)
      │     └── Dropdown: Profile, Submit News (if role allows), Logout
      │
      └── NO:
            ├── Show "Login" button
            └── Show "Sign Up" button
```

---

## 4. Footer Component

A simple, clean footer with copyright and navigation links:

```jsx
const Footer = () => {
  // Link definitions — data-driven rendering
  const links = [
    { href: '/about', label: 'About' },
    { href: '/privacy', label: 'Privacy' },
    { href: '/terms', label: 'Terms' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <footer className="w-full bg-white/95 dark:bg-[#0D1117] ...">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          {/* Left side: Logo + Copyright */}
          <div className="flex items-center space-x-3">
            <img src={logoTransparent} alt="Logo" className="w-10 h-10"
              onError={(e) => { e.target.style.display = 'none'; }}
              // If image fails to load, hide it gracefully
            />
            <div>
              <p>© {new Date().getFullYear()} VoxVeritas. All rights reserved.</p>
              {/* new Date().getFullYear() = always shows current year */}
              <p>Empowering truth through community verification</p>
            </div>
          </div>

          {/* Right side: Nav links */}
          <div className="flex items-center space-x-6">
            {links.map(link => (
              <a key={link.href} href={link.href}>{link.label}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
```

**Note:** Footer uses `<a href>` (not React Router `<Link>`) for its navigation links. This means clicking these links triggers a full page reload. These are typically external/static pages.

---

## 5. AnimatedLogo Component

### 5.1 — What It Does

The AnimatedLogo alternates between showing the VoxVeritas logo image and the brand name text, creating a subtle cycling animation.

### 5.2 — How It Works

```jsx
const AnimatedLogo = ({ size, brandName = 'VoxVeritas', showBrand = true, isDarkMode }) => {
  const [showLogo, setShowLogo] = useState(true);

  useEffect(() => {
    // Toggle showLogo every 2.5 seconds
    const interval = setInterval(() => {
      setShowLogo(prev => !prev);
    }, 2500);
    return () => clearInterval(interval);  // Cleanup on unmount
  }, []);

  return (
    <div className={`relative ${size}`}>
      {/* Logo Image — visible when showLogo=true */}
      <div className={`transition-all duration-700 ${
        showLogo ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}>
        <img src={logoTransparent} alt="Logo" />
      </div>

      {/* Brand Name — visible when showLogo=false */}
      {showBrand && (
        <div className={`transition-all duration-700 ${
          !showLogo ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}>
          <span className="font-sigmar">{brandName}</span>
        </div>
      )}
    </div>
  );
};
```

The cycling works because:
- `opacity-100` / `opacity-0` — fades in/out
- `scale-100` / `scale-95` — slight zoom effect
- `transition-all duration-700` — smooth 0.7s CSS transition
- `setInterval` flips `showLogo` every 2.5 seconds

---

## 6. ErrorBoundary Component

### 6.1 — Theory

React components can crash from runtime errors (e.g., accessing a property of `undefined`). Without an ErrorBoundary, the entire app goes blank with a white screen.

An **ErrorBoundary** catches errors in its child components and shows a fallback UI instead of crashing the whole app.

### 6.2 — How ErrorBoundaries Work

```jsx
// ErrorBoundary is a CLASS component (required — hooks can't catch render errors)
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    // Called when a child component throws during rendering
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error for debugging
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;  // Render children normally
  }
}

// Usage:
<ErrorBoundary>
  <NewsCard />  {/* If NewsCard crashes, ErrorBoundary shows fallback */}
</ErrorBoundary>
```

---

## 7. Interview Q&A

**Q: Why does VoxVeritas include Header/Footer in each page instead of a layout wrapper?**
A: This gives each page control over which layout elements to include. The LandingPage has its own custom header, and LoginForm/SignupForm have no header/footer at all. A shared layout wrapper would require complex conditional logic to handle these cases.

**Q: Why is dark mode stored in localStorage AND applied via a class on `<html>`?**
A: localStorage provides **persistence** across page refreshes. The `<html>` class provides the **mechanism** — Tailwind's `dark:` prefix only activates when an ancestor has the `dark` class. Both are needed: localStorage remembers the preference, the class makes it work.

**Q: Why is ErrorBoundary a class component instead of a function component?**
A: React does not provide a hook equivalent for `getDerivedStateFromError` or `componentDidCatch`. Error boundaries can only be class components. This is one of the few remaining use cases for class components in modern React.

---

**Next → [10-NEWS-COMPONENTS.md](./10-NEWS-COMPONENTS.md)** — NewsFeed, NewsCard, and the news display system.
