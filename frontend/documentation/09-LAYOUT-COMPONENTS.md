# 09 - Layout Components: Header, NavBar, Footer, and Page Structure

## What You'll Learn
- How layout components create consistent UI structure
- Header component with user menu and theme toggle
- NavBar component for landing page navigation
- Footer component with links
- Theme management (dark/light mode)
- Responsive design patterns

---

## Layout Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PAGE LAYOUT ARCHITECTURE                                 │
└─────────────────────────────────────────────────────────────────────────────┘

                    Full Page Structure
          ┌───────────────────────────────────────┐
          │            HEADER                     │  ← Fixed top, always visible
          │  ┌────────┬──────────┬──────────────┐ │
          │  │ Logo   │  Search  │ User/Theme   │ │
          │  └────────┴──────────┴──────────────┘ │
          ├───────────────────────────────────────┤
          │                                       │
          │                                       │
          │            MAIN CONTENT               │  ← Scrollable area
          │                                       │
          │  (Pages render their content here)    │
          │                                       │
          │                                       │
          ├───────────────────────────────────────┤
          │            FOOTER                     │  ← Bottom links
          │  ┌────────┬──────────┬──────────────┐ │
          │  │ Logo   │  Links   │ Social       │ │
          │  └────────┴──────────┴──────────────┘ │
          └───────────────────────────────────────┘
```

---

## Header Component

The Header is the top navigation bar that appears on authenticated pages.

```jsx
// frontend/src/components/Header.jsx

import React, { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserContext } from '../context/userContext'
import { toast } from 'react-toastify'
import AnimatedLogo from './AnimatedLogo'

const Header = ({ onMenuToggle }) => {
  // ═══════════════════════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Theme state - persisted to localStorage
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')
  
  // Search UI state
  const [showSearch, setShowSearch] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  // User dropdown menu state
  const [showUserMenu, setShowUserMenu] = useState(false)
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CONTEXT AND NAVIGATION
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Get user data and logout function from context
  const { userType, userInfo, isAuthenticated, logout } = useContext(UserContext)
  const navigate = useNavigate()

  // ═══════════════════════════════════════════════════════════════════════════
  // LOGOUT HANDLER
  // ═══════════════════════════════════════════════════════════════════════════
  
  const handleLogout = () => {
    setShowUserMenu(false)    // Close menu
    logout()                   // Clear session (from context)
    toast.success('Logged out successfully')
    navigate('/login')         // Redirect to login
  }
```

### Theme Management

```jsx
  // ═══════════════════════════════════════════════════════════════════════════
  // THEME EFFECT
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Apply theme changes to document
  useEffect(() => {
    if (theme === 'dark') {
      // Add 'dark' class to <html> element
      document.documentElement.classList.add('dark')
    } else {
      // Remove 'dark' class from <html> element
      document.documentElement.classList.remove('dark')
    }
    // Persist theme preference
    localStorage.setItem('theme', theme)
  }, [theme])

  // Toggle between light and dark
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')
```

### Why Theme Works This Way

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DARK MODE MECHANISM                                      │
└─────────────────────────────────────────────────────────────────────────────┘

User clicks theme toggle
        │
        ▼
setTheme('dark') or setTheme('light')
        │
        ▼
useEffect runs (depends on [theme])
        │
        ▼
┌───────────────────────────────────────────────────────────────────────────┐
│ document.documentElement.classList.add('dark')                             │
│                                                                            │
│ This adds 'dark' class to: <html class="dark">                            │
└───────────────────────────────────────────────────────────────────────────┘
        │
        ▼
Tailwind CSS recognizes 'dark' class
        │
        ▼
All 'dark:' prefixed classes activate:
  - dark:bg-[#0D1117]     → Dark background
  - dark:text-white        → White text
  - dark:border-gray-700   → Dark borders
```

### Click Outside to Close Menu

```jsx
  // ═══════════════════════════════════════════════════════════════════════════
  // CLICK OUTSIDE HANDLER
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click was outside the menu container
      if (showUserMenu && !event.target.closest('.user-menu-container')) {
        setShowUserMenu(false)
      }
    }
    
    // Add listener when menu is shown
    document.addEventListener('mousedown', handleClickOutside)
    
    // Cleanup: remove listener when component unmounts
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showUserMenu])
```

### Header JSX Structure

```jsx
  return (
    <div className="w-full">
      <header className="w-full bg-white/95 dark:bg-[#0D1117] backdrop-blur-lg 
                         text-gray-800 dark:text-white shadow-lg 
                         border-b border-gray-200/50 dark:border-gray-700/50 
                         transition-all duration-300">
        <div className="max-w-7xl px-2 sm:px-2 lg:px-2">
          <div className="flex justify-between items-center h-16 gap-4">
            
            {/* ─────────────────────────────────────────────────────────────
                LEFT SIDE - Mobile menu button + Logo
            ───────────────────────────────────────────────────────────── */}
            <div className="flex items-center space-x-12">
              {/* Mobile hamburger menu - only shows on mobile (lg:hidden) */}
              <button 
                onClick={onMenuToggle} 
                className="text-2xl lg:hidden focus:outline-none p-2 
                           rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                ☰
              </button>
              
              {/* Logo */}
              <div className="flex">
                <AnimatedLogo 
                  size="w-10 h-10" 
                  brandName="VoxVeritas" 
                  showBrand={true} 
                />
              </div>

              {/* Desktop Navigation - hidden on mobile (hidden md:flex) */}
              <nav className="hidden md:flex items-center space-x-3">
                {/* Navigation links here */}
              </nav>
            </div>

            {/* ─────────────────────────────────────────────────────────────
                RIGHT SIDE - Search, Theme, Notifications, User
            ───────────────────────────────────────────────────────────── */}
            <div className="flex items-center space-x-4">
              {/* Search button */}
              <button onClick={() => setShowSearch(!showSearch)}>
                <SearchIcon />
              </button>

              {/* Theme toggle */}
              <button onClick={toggleTheme}>
                {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
              </button>

              {/* Notifications */}
              <button>
                <BellIcon />
              </button>

              {/* User menu dropdown */}
              <div className="user-menu-container relative">
                <button onClick={() => setShowUserMenu(!showUserMenu)}>
                  <UserIcon />
                </button>
                
                {/* Dropdown menu - conditionally rendered */}
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 
                                  bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                    <button onClick={() => navigate('/profile')}>
                      Profile
                    </button>
                    <button onClick={handleLogout}>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
    </div>
  )
```

---

## NavBar Component (Landing Page)

NavBar is different from Header - it's used on the landing page before login.

```jsx
// frontend/src/components/NavBar.jsx

import React, { useState, useEffect, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom'; 
import AnimatedLogo from './AnimatedLogo'; 

// ═══════════════════════════════════════════════════════════════════════════
// THEME CONTEXT - Separate from UserContext
// ═══════════════════════════════════════════════════════════════════════════

// Create a context for theme
const ThemeContext = createContext();

// Custom hook to use theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme Provider component
export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);  // Default to dark
  
  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme ? savedTheme === 'dark' : true;
    setIsDarkMode(isDark);
    
    // Apply to document
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Toggle function
  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    
    // Update document class immediately
    if (newTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

### Theme Toggle Button Component

```jsx
// Theme toggle button with animated icons
const ThemeToggle = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`relative p-2.5 rounded-full transition-all duration-300 ${
        isDarkMode 
          ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400' 
          : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
      }`}
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5">
        {/* Sun Icon - visible in light mode */}
        <svg
          className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${
            isDarkMode 
              ? 'rotate-90 scale-0 opacity-0'      // Hidden in dark mode
              : 'rotate-0 scale-100 opacity-100'    // Visible in light mode
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          {/* Sun path */}
        </svg>
        
        {/* Moon Icon - visible in dark mode */}
        <svg
          className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${
            isDarkMode 
              ? 'rotate-0 scale-100 opacity-100'    // Visible in dark mode
              : '-rotate-90 scale-0 opacity-0'       // Hidden in light mode
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          {/* Moon path */}
        </svg>
      </div>
    </button>
  );
};
```

### NavBar Main Component

```jsx
export default function NavBar({ 
  scrollToHero,      // Function to scroll to Hero section
  scrollToAbout,     // Function to scroll to About section
  scrollToFeatures,  // Function to scroll to Features section
  scrollToProblem,   // Function to scroll to Problem section
  scrollToTeam       // Function to scroll to Team section
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  // Navigation items with scroll handlers
  const navItems = [
    { label: 'Hero', onClick: scrollToHero },
    { label: 'About', onClick: scrollToAbout },
    { label: 'Features', onClick: scrollToFeatures },
    { label: 'Problem', onClick: scrollToProblem },
    { label: 'Team', onClick: scrollToTeam },
  ];

  const handleNavClick = (onClick) => {
    onClick();                      // Execute scroll function
    setIsMobileMenuOpen(false);     // Close mobile menu
  };

  return (
    <nav className={`${
      isDarkMode 
        ? 'bg-[#0D1117]/95 border-gray-700' 
        : 'bg-white/95 border-gray-200'
    } backdrop-blur-lg border-b sticky top-0 z-50 shadow-2xl`}>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-24">
          
          {/* Left - Logo */}
          <div className="flex items-center group cursor-pointer 
                          hover:scale-105 transition-transform duration-300">
            <AnimatedLogo size="w-16 h-16" isDarkMode={isDarkMode} />
          </div>

          {/* Center - Navigation Links (Desktop only) */}
          <div className="hidden lg:flex justify-center items-center space-x-2">
            {navItems.map((item, index) => (
              <button
                key={index}
                onClick={item.onClick}
                className={`relative px-5 py-2.5 text-base font-semibold 
                           rounded-xl transition-all duration-300 ${
                  isDarkMode
                    ? 'text-[#C9D1D9] hover:text-sky-400'
                    : 'text-gray-700 hover:text-sky-600'
                }`}
              >
                <span className="relative z-10">{item.label}</span>
                {/* Animated background on hover */}
                <div className={`absolute inset-0 bg-gradient-to-r rounded-xl 
                                scale-0 group-hover:scale-100 
                                transition-transform duration-300 ${
                  isDarkMode
                    ? 'from-sky-500/20 to-emerald-400/20'
                    : 'from-sky-500/10 to-emerald-400/10'
                }`}></div>
              </button>
            ))}
          </div>

          {/* Right - Theme Toggle + Get Started */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <button
              onClick={() => navigate("/login")}
              className="bg-gradient-to-r from-sky-500 to-emerald-500 
                         text-white px-8 py-3 rounded-full font-bold 
                         hover:shadow-xl hover:shadow-sky-500/25 
                         hover:scale-105 transition-all duration-300"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
```

---

## Footer Component

```jsx
// frontend/src/components/Footer.jsx

import React from 'react'

const Footer = () => {
  return (
    <footer className="w-full bg-white/95 dark:bg-[#0D1117] backdrop-blur-lg 
                       border-t border-gray-200/50 dark:border-gray-700/50 
                       transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-center 
                        space-y-3 sm:space-y-0">
          
          {/* Left - Logo and Copyright */}
          <div className="flex items-center space-x-3">
            {/* Mini logo */}
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 
                            rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" 
                   viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                © 2025 TruthCheck. All rights reserved.
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Empowering truth through community verification
              </p>
            </div>
          </div>

          {/* Center - Quick Links */}
          <div className="flex items-center space-x-6 text-sm">
            <a href="/about" 
               className="text-gray-600 dark:text-gray-400 
                          hover:text-blue-600 dark:hover:text-blue-400 
                          transition-colors">
              About
            </a>
            <a href="/privacy" 
               className="text-gray-600 dark:text-gray-400 
                          hover:text-blue-600 dark:hover:text-blue-400 
                          transition-colors">
              Privacy
            </a>
            <a href="/terms" 
               className="text-gray-600 dark:text-gray-400 
                          hover:text-blue-600 dark:hover:text-blue-400 
                          transition-colors">
              Terms
            </a>
            <a href="/contact" 
               className="text-gray-600 dark:text-gray-400 
                          hover:text-blue-600 dark:hover:text-blue-400 
                          transition-colors">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
```

---

## Responsive Design Patterns

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    RESPONSIVE CLASSES                                       │
└─────────────────────────────────────────────────────────────────────────────┘

Tailwind responsive prefixes:
┌────────────┬───────────────────┬────────────────────────────────────────────┐
│  Prefix    │  Breakpoint       │  Usage                                     │
├────────────┼───────────────────┼────────────────────────────────────────────┤
│  (none)    │  0px (mobile)     │  Default styles for mobile                 │
│  sm:       │  640px            │  Small tablets                             │
│  md:       │  768px            │  Tablets                                   │
│  lg:       │  1024px           │  Laptops                                   │
│  xl:       │  1280px           │  Desktops                                  │
│  2xl:      │  1536px           │  Large screens                             │
└────────────┴───────────────────┴────────────────────────────────────────────┘

Examples from Header:
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│  className="text-2xl lg:hidden"                                            │
│             ─────────  ─────────                                           │
│                 │         │                                                │
│                 │         └─ Hidden on screens ≥ 1024px (desktop)          │
│                 └─ Text size on mobile                                     │
│                                                                            │
│  className="hidden md:flex"                                                │
│             ──────  ───────                                                │
│                │       │                                                   │
│                │       └─ Display as flex on screens ≥ 768px               │
│                └─ Hidden on mobile                                         │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    LAYOUT COMPONENTS HIERARCHY                              │
└─────────────────────────────────────────────────────────────────────────────┘

App.jsx
├── Landing Page (/) 
│   └── NavBar (landing page navigation)
│       ├── AnimatedLogo
│       ├── ThemeProvider + ThemeToggle
│       └── Navigation buttons (scroll to sections)
│
├── Authenticated Pages (/home, /profile, etc.)
│   ├── Header (top bar)
│   │   ├── AnimatedLogo
│   │   ├── Search
│   │   ├── Theme Toggle
│   │   ├── Notifications
│   │   └── User Menu (dropdown)
│   │
│   ├── Main Content (varies by page)
│   │   ├── HomePage → NewsFeed → NewsCard
│   │   ├── ProfilePage → ProfileForm
│   │   └── DebateRoom → DebateComments
│   │
│   └── Footer
│       ├── Logo
│       └── Quick Links
│
└── Auth Pages (/login, /signup)
    └── No header/footer (full-screen forms)
```

---

## Interview Questions & Answers

### Q1: How do you implement dark mode in React with Tailwind?

**Answer:**
1. Add `darkMode: 'class'` to `tailwind.config.js`
2. Toggle `'dark'` class on `<html>` element using `document.documentElement.classList`
3. Use `dark:` prefix for dark mode styles: `bg-white dark:bg-black`
4. Store preference in localStorage for persistence

### Q2: What's the difference between Header and NavBar?

**Answer:**
- **NavBar**: Used on landing page before login. Has section scroll navigation and "Get Started" button.
- **Header**: Used on authenticated pages. Has user menu, notifications, search, and logout.

### Q3: How do you handle click outside to close dropdowns?

**Answer:**
1. Add mousedown listener to document
2. Check if click target is inside the dropdown container using `closest()`
3. If outside, close the dropdown
4. Use useEffect cleanup to remove listener when component unmounts

### Q4: What is `backdrop-blur-lg`?

**Answer:** A Tailwind class that applies CSS `backdrop-filter: blur()`. It blurs content behind a semi-transparent element, creating a glass/frosted effect. Common in modern UI headers.

### Q5: Why use `sticky top-0 z-50` on navigation?

**Answer:**
- `sticky`: Element sticks to viewport when scrolling
- `top-0`: Sticks at the top
- `z-50`: High z-index ensures nav stays on top of other content

---

**Next: [10-NEWS-COMPONENTS.md](./10-NEWS-COMPONENTS.md)** - NewsFeed, NewsCard, and news display components →
