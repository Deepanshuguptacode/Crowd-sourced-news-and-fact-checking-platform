# Guided Tour System Documentation

## Overview

This project implements a clean, scalable, multi-page guided tour system using **React**, **Tailwind CSS**, **react-joyride**, and **React Router**. The tour system helps new users understand the platform's features by providing interactive step-by-step walkthroughs on different pages.

## Architecture

### Key Principles

✅ **Modular & Maintainable** - Tour logic is separated from UI components
✅ **Data Attributes** - Uses `data-tour` attributes for targeting elements
✅ **Centralized Selectors** - All selectors are defined in one place
✅ **Route-Based** - Tours load automatically based on the current route
✅ **Persistent State** - Uses localStorage to prevent repeat tours

### Directory Structure

```
frontend/src/
├── components/
│   └── TourProvider.jsx          # Global tour provider
├── tours/
│   ├── tourTargets.js            # Centralized selectors
│   ├── landingPageTour.js        # Landing page tour steps
│   ├── homePageTour.js           # Home page tour steps
│   ├── newsSubmissionTour.js     # News submission tour steps
│   ├── profilePageTour.js        # Profile page tour steps
│   ├── expertsPageTour.js        # Experts page tour steps
│   └── debateRoomsTour.js        # Debate rooms tour steps
└── App.jsx                       # Tour provider mounted here
```

## Implementation Details

### 1. Tour Targets (`tourTargets.js`)

Centralized file containing all tour selectors using data attributes:

```javascript
export const TOUR_TARGETS = {
  LANDING: {
    HERO_SECTION: '[data-tour="landing-hero"]',
    GET_STARTED_BTN: '[data-tour="landing-get-started"]',
    // ...
  },
  HOME: {
    NEWS_FEED: '[data-tour="home-news-feed"]',
    SUBMIT_NEWS_BTN: '[data-tour="home-submit-news"]',
    // ...
  },
  // ... other pages
};
```

### 2. Tour Files

Each page has its own tour file defining the steps:

```javascript
import { TOUR_TARGETS } from "./tourTargets";

export const homePageTour = [
  {
    target: TOUR_TARGETS.HOME.HEADER,
    content: "Welcome to your dashboard!",
    placement: "bottom",
    disableBeacon: true,
  },
  // ... more steps
];
```

### 3. Tour Provider Component

The `TourProvider.jsx` component:

- Detects the current route
- Loads the appropriate tour steps
- Manages tour state (run, stepIndex)
- Handles tour completion and persistence
- Returns null when no tour is available for the route

### 4. Data Attributes in UI Components

UI elements are tagged with `data-tour` attributes:

```jsx
<button data-tour="home-submit-news" onClick={handleSubmit}>
  Submit News
</button>
```

## Available Tours

### 1. **Landing Page Tour** (`/`)
- Hero section introduction
- Get Started button
- Features overview
- How It Works section
- Team section
- Login/Signup buttons

### 2. **Home Page Tour** (`/home`)
- Navigation header
- News feed overview
- First news card interaction
- Quick actions sidebar
- Submit news button
- Mobile menu toggle

### 3. **News Submission Tour** (`/submit-news`)
- Form container
- Title input
- Description textarea
- Source link input
- Image toggle (upload vs URL)
- Image upload section
- Submit button

### 4. **Profile Page Tour** (`/profile`)
- Profile container
- Photo upload
- Edit button
- Name and bio fields
- Change password button
- Save button

### 5. **Experts Page Tour** (`/experts`)
- Page container
- Search input
- Profession filter
- Expert cards
- Verified badge

### 6. **Debate Rooms Tour** (`/debate-rooms`)
- Page container
- Create room button
- Search input
- Room list
- Room cards
- Join button

## How Tours Work

### Initialization Flow

1. User navigates to a page (e.g., `/home`)
2. `TourProvider` detects route change via `useLocation`
3. `getSteps()` function returns appropriate tour steps
4. System checks localStorage for completion status
5. If not completed, tour starts after 500ms delay (ensures DOM is ready)
6. Tour guides user through each step
7. On completion/skip, status is saved to localStorage

### Tour State Management

```javascript
const [run, setRun] = useState(false);           // Controls tour execution
const [stepIndex, setStepIndex] = useState(0);   // Current step index
```

### Persistence

Tours are tracked per route using localStorage:

```javascript
const tourKey = `tour_completed_${routePath}`;
localStorage.setItem(tourKey, "true");
```

## Customization

### Styling

Tour appearance is customized in `TourProvider.jsx`:

```javascript
styles={{
  options: {
    zIndex: 10000,
    primaryColor: "#3b82f6",
    backgroundColor: "#ffffff",
    // ...
  },
  tooltip: {
    borderRadius: 12,
    padding: 20,
  },
  // ... more styles
}}
```

### Adding a New Tour

**Step 1:** Add selectors to `tourTargets.js`

```javascript
NEW_PAGE: {
  ELEMENT_KEY: '[data-tour="new-page-element"]',
}
```

**Step 2:** Create tour file `newPageTour.js`

```javascript
import { TOUR_TARGETS } from "./tourTargets";

export const newPageTour = [
  {
    target: TOUR_TARGETS.NEW_PAGE.ELEMENT_KEY,
    content: "Description of this element",
    placement: "bottom",
  },
];
```

**Step 3:** Import and add route mapping in `TourProvider.jsx`

```javascript
import { newPageTour } from "../tours/newPageTour";

const getSteps = () => {
  switch (location.pathname) {
    // ... existing routes
    case "/new-page":
      return newPageTour;
    default:
      return [];
  }
};
```

**Step 4:** Add `data-tour` attributes to UI elements

```jsx
<div data-tour="new-page-element">
  {/* Your content */}
</div>
```

## Tour Controls

Users can interact with tours using:

- **Next** - Proceed to next step
- **Back** - Go to previous step
- **Skip Tour** - Exit tour (saves completion)
- **Finish** - Complete tour on last step

## Resetting Tours

To reset tours for testing:

```javascript
// In browser console:
localStorage.clear(); // Clears all tours
// Or specific tour:
localStorage.removeItem('tour_completed_home');
```

## Best Practices

### ✅ DO:
- Use semantic `data-tour` attribute names
- Keep tour steps concise (2-3 sentences max)
- Test tours on mobile and desktop
- Ensure target elements are visible
- Add descriptive content for each step

### ❌ DON'T:
- Use random IDs or class selectors
- Create tours for hidden elements
- Add tour logic inside UI components
- Duplicate selectors across files
- Make steps too verbose

## Performance Considerations

- Tours only load for specific routes
- 500ms delay prevents DOM issues
- `disableBeacon: true` on first step for smooth start
- Tour skipping is instant (no animations)
- localStorage prevents repeated tours

## Responsive Design

Tours automatically adjust for:
- Mobile devices (smaller tooltips)
- Desktop screens (optimal positioning)
- Dark/Light mode (inherits from theme)

## Dependencies

```json
{
  "react-joyride": "^2.8.2",
  "react-router-dom": "^7.2.0"
}
```

## Troubleshooting

### Tour doesn't appear
1. Check if element has correct `data-tour` attribute
2. Verify route mapping in `TourProvider`
3. Clear localStorage for that route
4. Ensure element is rendered (not conditional)

### Tour targets wrong element
1. Verify selector in `tourTargets.js`
2. Check for duplicate `data-tour` attributes
3. Inspect DOM to confirm attribute exists

### Tour breaks on mobile
1. Test element visibility on mobile
2. Adjust tooltip placement
3. Ensure scrollToFirstStep is enabled

## Future Enhancements

Potential improvements:
- [ ] Admin panel to manage tours
- [ ] A/B testing different tour flows
- [ ] Analytics to track tour completion
- [ ] Multi-language support
- [ ] Video tutorials in tours
- [ ] Progress indicators
- [ ] Interactive quizzes

## Support

For issues or questions:
1. Check console for errors
2. Verify all data attributes are present
3. Test in incognito mode (fresh localStorage)
4. Review this documentation

---

**Version:** 1.0.0  
**Last Updated:** February 28, 2026  
**Maintained by:** VoxVeritas Development Team
