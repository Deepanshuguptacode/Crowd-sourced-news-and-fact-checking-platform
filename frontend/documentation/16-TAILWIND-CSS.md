# 16 - Tailwind CSS: Utility-First Styling

## What You'll Learn
- Utility-first CSS concept
- Tailwind class naming patterns
- Responsive design breakpoints
- Dark mode implementation
- Custom theme configuration
- Common patterns in the project

---

## What is Tailwind CSS?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    TRADITIONAL CSS vs TAILWIND                              │
└─────────────────────────────────────────────────────────────────────────────┘

TRADITIONAL CSS:
┌─────────────────────────────────────────────────────────────────────────────┐
│  // styles.css                                                              │
│  .btn-primary {                                                             │
│    background-color: blue;                                                  │
│    color: white;                                                            │
│    padding: 8px 16px;                                                       │
│    border-radius: 4px;                                                      │
│  }                                                                          │
│                                                                             │
│  // Component.jsx                                                           │
│  <button className="btn-primary">Click</button>                            │
└─────────────────────────────────────────────────────────────────────────────┘

TAILWIND (Utility-First):
┌─────────────────────────────────────────────────────────────────────────────┐
│  // No separate CSS file needed!                                            │
│  <button className="bg-blue-500 text-white px-4 py-2 rounded">            │
│    Click                                                                    │
│  </button>                                                                  │
│                                                                             │
│  Each class does ONE thing:                                                 │
│  bg-blue-500 → background-color: #3b82f6                                   │
│  text-white  → color: white                                                │
│  px-4        → padding-left: 1rem; padding-right: 1rem                     │
│  py-2        → padding-top: 0.5rem; padding-bottom: 0.5rem                 │
│  rounded     → border-radius: 0.25rem                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Project Configuration

```javascript
// frontend/tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  // ═══════════════════════════════════════════════════════════════════════════
  // DARK MODE STRATEGY
  // ═══════════════════════════════════════════════════════════════════════════
  darkMode: 'class',  // Use 'class' strategy - adds .dark to <html>
                      // Alternative: 'media' (uses system preference)
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CONTENT - Where to scan for class names
  // ═══════════════════════════════════════════════════════════════════════════
  content: [
    "./index.html",               // Root HTML
    "./src/**/*.{js,ts,jsx,tsx}", // All source files
  ],
  // Tailwind scans these files, finds class names, and only generates CSS
  // for classes actually used (tree-shaking)
  
  // ═══════════════════════════════════════════════════════════════════════════
  // THEME - Customizations and extensions
  // ═══════════════════════════════════════════════════════════════════════════
  theme: {
    extend: {
      // Custom fonts
      fontFamily: {
        sigmar: ['Sigmar', 'serif'],  // Usage: font-sigmar
        kanit: ['Kanit', 'serif'],    // Usage: font-kanit
      },
      
      // Custom colors - brand colors
      colors: {
        teal: "#2E8B94",      // Usage: bg-teal, text-teal
        gold: "#D4AF37",      // Usage: bg-gold, text-gold
        charcoal: "#2D3748",  // Usage: bg-charcoal
        offwhite: "#F8F9FA"   // Usage: bg-offwhite
      },
      
      // Custom animations
      animation: {
        'spin-slow': 'spin 10s linear infinite',  // Usage: animate-spin-slow
      }
    },
  },
  
  plugins: [],
};
```

---

## Common Utility Classes

### Spacing (Margin & Padding)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SPACING SCALE                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

Size │ Value   │ Example
─────┼─────────┼─────────────────────────────────
0    │ 0       │ p-0 (padding: 0)
1    │ 0.25rem │ m-1 (margin: 0.25rem = 4px)
2    │ 0.5rem  │ p-2 (padding: 0.5rem = 8px)
3    │ 0.75rem │ m-3 (margin: 12px)
4    │ 1rem    │ p-4 (padding: 16px)
6    │ 1.5rem  │ m-6 (margin: 24px)
8    │ 2rem    │ p-8 (padding: 32px)
10   │ 2.5rem  │ m-10 (margin: 40px)
12   │ 3rem    │ p-12 (padding: 48px)

DIRECTION PREFIXES:
─────────────────────────────────────
p-4   → padding all sides
px-4  → padding left & right (x-axis)
py-4  → padding top & bottom (y-axis)
pt-4  → padding-top
pr-4  → padding-right
pb-4  → padding-bottom
pl-4  → padding-left

m-4   → margin all sides
mx-4  → margin left & right
my-4  → margin top & bottom
mt-4  → margin-top
mb-4  → margin-bottom
ml-4  → margin-left
mr-4  → margin-right

SPECIAL VALUES:
─────────────────────────────────────
mx-auto → margin: 0 auto (center horizontally)
space-x-4 → gap between horizontal flex children
space-y-4 → gap between vertical flex children
gap-4     → gap in flex/grid
```

### Typography

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  TEXT UTILITIES                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

FONT SIZE:
─────────────────────────────────────
text-xs    → 0.75rem (12px)
text-sm    → 0.875rem (14px)
text-base  → 1rem (16px)
text-lg    → 1.125rem (18px)
text-xl    → 1.25rem (20px)
text-2xl   → 1.5rem (24px)
text-3xl   → 1.875rem (30px)
text-4xl   → 2.25rem (36px)

FONT WEIGHT:
─────────────────────────────────────
font-light    → 300
font-normal   → 400
font-medium   → 500
font-semibold → 600
font-bold     → 700

TEXT ALIGNMENT:
─────────────────────────────────────
text-left   → text-align: left
text-center → text-align: center
text-right  → text-align: right

TEXT COLOR:
─────────────────────────────────────
text-gray-500  → medium gray
text-gray-700  → dark gray
text-gray-900  → near black
text-white     → white
text-red-500   → red
text-green-500 → green
text-blue-500  → blue
text-teal      → custom brand color
```

### Background & Borders

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  BACKGROUND & BORDER UTILITIES                                              │
└─────────────────────────────────────────────────────────────────────────────┘

BACKGROUND COLOR:
─────────────────────────────────────
bg-white       → white
bg-gray-100    → light gray
bg-gray-800    → dark gray
bg-black       → black
bg-blue-500    → blue
bg-teal        → custom brand teal

OPACITY:
─────────────────────────────────────
bg-opacity-50 → 50% opacity
bg-black/50   → black at 50% opacity (shorthand)

BORDERS:
─────────────────────────────────────
border        → 1px solid
border-2      → 2px solid
border-4      → 4px solid
border-0      → no border

BORDER COLOR:
─────────────────────────────────────
border-gray-200 → light gray border
border-gray-700 → dark gray border
border-blue-500 → blue border

BORDER RADIUS:
─────────────────────────────────────
rounded       → border-radius: 0.25rem
rounded-md    → 0.375rem
rounded-lg    → 0.5rem
rounded-xl    → 0.75rem
rounded-2xl   → 1rem
rounded-full  → 9999px (circular)
```

### Flexbox

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  FLEXBOX UTILITIES                                                          │
└─────────────────────────────────────────────────────────────────────────────┘

CONTAINER:
─────────────────────────────────────
flex         → display: flex
flex-col     → flex-direction: column
flex-row     → flex-direction: row (default)
flex-wrap    → flex-wrap: wrap

ALIGNMENT (Main Axis - justify):
─────────────────────────────────────
justify-start   → items at start
justify-end     → items at end
justify-center  → items centered
justify-between → space between items
justify-around  → space around items

ALIGNMENT (Cross Axis - items):
─────────────────────────────────────
items-start   → align to top
items-end     → align to bottom
items-center  → align to center
items-stretch → stretch to fill

CHILD SIZING:
─────────────────────────────────────
flex-1     → flex: 1 1 0% (grow and shrink equally)
flex-grow  → flex-grow: 1
flex-shrink → flex-shrink: 1
flex-none  → flex: none (don't grow/shrink)

EXAMPLE:
<div className="flex items-center justify-between">
  <span>Left</span>
  <span>Right</span>
</div>

┌─────────────────────────────────────┐
│ Left                         Right  │
└─────────────────────────────────────┘
```

### Width & Height

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SIZE UTILITIES                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

FIXED WIDTH:
─────────────────────────────────────
w-4      → width: 1rem (16px)
w-8      → width: 2rem (32px)
w-16     → width: 4rem (64px)
w-32     → width: 8rem (128px)
w-64     → width: 16rem (256px)

PERCENTAGE WIDTH:
─────────────────────────────────────
w-1/2    → width: 50%
w-1/3    → width: 33.333%
w-2/3    → width: 66.666%
w-1/4    → width: 25%
w-full   → width: 100%

SCREEN WIDTH:
─────────────────────────────────────
w-screen → width: 100vw

HEIGHT:
─────────────────────────────────────
h-4      → height: 1rem
h-full   → height: 100%
h-screen → height: 100vh

MIN/MAX:
─────────────────────────────────────
min-h-screen → min-height: 100vh
max-w-md     → max-width: 28rem
max-w-lg     → max-width: 32rem
max-w-xl     → max-width: 36rem
max-w-7xl    → max-width: 80rem
```

---

## Dark Mode Implementation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DARK MODE FLOW                                           │
└─────────────────────────────────────────────────────────────────────────────┘

1. Config: darkMode: 'class' in tailwind.config.js

2. HTML: <html class="dark">...</html> or <html class="">...</html>

3. CSS Classes: dark: prefix

<div className="bg-white dark:bg-gray-900">
               │              │
               │              └── When .dark on parent: dark gray
               └── Light mode: white
```

### Dark Mode Prefix Examples

```jsx
// Text color
<p className="text-gray-900 dark:text-gray-100">
  Dark in light mode, light in dark mode
</p>

// Background
<div className="bg-white dark:bg-gray-900">
  White in light, dark gray in dark
</div>

// Border
<div className="border border-gray-200 dark:border-gray-700">
  Light border in light, darker border in dark
</div>

// Complete card example
<div className="
  bg-white dark:bg-gray-800
  text-gray-900 dark:text-white
  border border-gray-200 dark:border-gray-700
  rounded-lg shadow
">
  Card content
</div>
```

### Theme Toggle Implementation

```jsx
// ThemeProvider.jsx pattern

const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  
  // Check localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);
  
  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
    setIsDark(!isDark);
  };
  
  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Toggle button
const ThemeToggle = () => {
  const { isDark, toggleTheme } = useContext(ThemeContext);
  
  return (
    <button onClick={toggleTheme}>
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
};
```

---

## Responsive Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    BREAKPOINTS                                              │
└─────────────────────────────────────────────────────────────────────────────┘

Prefix │ Min-Width │ CSS
───────┼───────────┼──────────────────────────
(none) │ 0px       │ Mobile first (default)
sm     │ 640px     │ @media (min-width: 640px)
md     │ 768px     │ @media (min-width: 768px)
lg     │ 1024px    │ @media (min-width: 1024px)
xl     │ 1280px    │ @media (min-width: 1280px)
2xl    │ 1536px    │ @media (min-width: 1536px)

MOBILE-FIRST APPROACH:
─────────────────────────────────────
Write mobile styles first, then add breakpoint prefixes for larger screens.
```

### Responsive Examples

```jsx
// Grid that changes columns at breakpoints
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* 1 column mobile, 2 columns tablet, 3 columns desktop */}
  <Card />
  <Card />
  <Card />
</div>

// Padding that increases on larger screens
<div className="px-4 md:px-8 lg:px-16">
  Content
</div>

// Hide on mobile, show on desktop
<div className="hidden md:block">
  Only visible on tablet and up
</div>

// Show on mobile, hide on desktop
<div className="block md:hidden">
  Only visible on mobile
</div>

// Text size responsive
<h1 className="text-2xl md:text-4xl lg:text-6xl">
  Responsive Heading
</h1>

// Flex direction: column on mobile, row on desktop
<div className="flex flex-col md:flex-row">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

---

## State Variants

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  HOVER, FOCUS, AND OTHER STATES                                            │
└─────────────────────────────────────────────────────────────────────────────┘

hover:    → on mouse hover
focus:    → on focus (keyboard/click)
active:   → while being pressed
disabled: → when disabled
```

### State Examples

```jsx
// Button with hover and focus states
<button className="
  bg-blue-500 hover:bg-blue-600 
  focus:ring-2 focus:ring-blue-300
  active:bg-blue-700
  disabled:opacity-50 disabled:cursor-not-allowed
  transition-colors duration-200
">
  Click Me
</button>

// Input with focus ring
<input className="
  border border-gray-300 
  focus:border-blue-500 focus:ring-2 focus:ring-blue-200
  focus:outline-none
" />

// Link with hover underline
<a className="text-blue-500 hover:underline">
  Learn more
</a>

// Card with hover shadow
<div className="
  shadow-md hover:shadow-xl 
  transition-shadow duration-300
">
  Card content
</div>
```

---

## Common Patterns in the Project

### Card Pattern

```jsx
<div className="
  bg-white dark:bg-gray-800
  rounded-lg shadow-md
  border border-gray-200 dark:border-gray-700
  p-6
  hover:shadow-lg transition-shadow
">
  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
    Card Title
  </h3>
  <p className="text-gray-600 dark:text-gray-300 mt-2">
    Card description...
  </p>
</div>
```

### Button Pattern

```jsx
// Primary button
<button className="
  bg-blue-600 hover:bg-blue-700
  text-white font-medium
  px-4 py-2 rounded-lg
  transition-colors duration-200
  disabled:opacity-50
">
  Primary
</button>

// Secondary button
<button className="
  bg-gray-200 hover:bg-gray-300
  dark:bg-gray-700 dark:hover:bg-gray-600
  text-gray-900 dark:text-white
  px-4 py-2 rounded-lg
">
  Secondary
</button>

// Icon button
<button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
  <Heart className="w-5 h-5" />
</button>
```

### Input Pattern

```jsx
<input className="
  w-full
  border border-gray-300 dark:border-gray-600
  bg-white dark:bg-gray-800
  text-gray-900 dark:text-white
  px-4 py-2 rounded-lg
  focus:ring-2 focus:ring-blue-500 focus:border-transparent
  placeholder-gray-400
" />
```

### Layout Container

```jsx
// Centered content with max-width
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  Content here is centered and responsive
</div>

// Full-height page
<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
  Page content
</div>
```

---

## Combining Classes

```jsx
// Long class strings are common - use template literals for readability
<div
  className={`
    flex items-center justify-between
    bg-white dark:bg-gray-800
    border border-gray-200 dark:border-gray-700
    rounded-lg shadow-md
    p-4 mb-4
    hover:shadow-lg transition-shadow
    ${isActive ? 'ring-2 ring-blue-500' : ''}
    ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
  `}
>
  Content
</div>
```

---

## Custom Brand Colors Usage

```jsx
// Using project's custom colors from tailwind.config.js

// Teal - Primary brand color
<div className="bg-teal text-white">
  Teal background
</div>
<span className="text-teal">Teal text</span>

// Gold - Accent/highlight color
<div className="bg-gold">Gold background</div>
<span className="text-gold">Gold text</span>

// Charcoal - Dark text/background
<div className="bg-charcoal text-white">
  Charcoal background
</div>

// Offwhite - Light background
<div className="bg-offwhite">
  Light background
</div>
```

---

## Interview Questions & Answers

### Q1: What is utility-first CSS?

**Answer:** Instead of writing custom CSS classes with multiple properties, utility-first uses small, single-purpose classes. Each class does one thing (e.g., `bg-blue-500` sets only background color). You compose these utilities in HTML to build any design without leaving your markup.

### Q2: How does Tailwind handle dark mode?

**Answer:** Using the `dark:` prefix. Configure `darkMode: 'class'` in config, then toggle a `.dark` class on the `<html>` element. Classes like `dark:bg-gray-900` apply only when dark mode is active.

### Q3: How does Tailwind's responsive design work?

**Answer:** Mobile-first with breakpoint prefixes. Write default styles for mobile, then add `md:`, `lg:`, etc. for larger screens. Example: `text-sm md:text-lg lg:text-xl` starts small and increases at each breakpoint.

### Q4: How does Tailwind reduce CSS file size?

**Answer:** Tailwind scans files in `content` config for class names and only generates CSS for classes actually used. Unused utilities are removed (tree-shaking), resulting in small production CSS files.

### Q5: How do you add custom colors to Tailwind?

**Answer:** In `tailwind.config.js`, add to `theme.extend.colors`:
```javascript
theme: {
  extend: {
    colors: {
      teal: "#2E8B94",
    }
  }
}
```
Then use as `bg-teal`, `text-teal`, `border-teal`.

---

**Next: [17-BEST-PRACTICES.md](./17-BEST-PRACTICES.md)** - Code Organization and Best Practices →
