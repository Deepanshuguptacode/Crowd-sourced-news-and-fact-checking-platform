# Guided Tour System - Quick Reference

## Quick Start

The tour system is fully configured and ready to use! Tours will automatically appear when users visit pages for the first time.

## Files Created/Modified

### New Files Created:
```
frontend/src/
  ├── components/TourProvider.jsx
  └── tours/
      ├── tourTargets.js
      ├── landingPageTour.js
      ├── homePageTour.js
      ├── newsSubmissionTour.js
      ├── profilePageTour.js
      ├── expertsPageTour.js
      └── debateRoomsTour.js
```

### Modified Files:
- `frontend/src/App.jsx` - Added TourProvider
- `frontend/src/pages/LandingPage.jsx` - Added data-tour attributes
- `frontend/src/pages/HomePage.jsx` - Added data-tour attributes
- `frontend/src/pages/NewsSubmissionForm.jsx` - Added data-tour attributes
- `frontend/src/pages/ProfilePage.jsx` - Added data-tour attributes
- `frontend/src/pages/ExpertsPage.jsx` - Added data-tour attributes
- `frontend/src/pages/DebateRoomsList.jsx` - Added data-tour attributes
- `frontend/src/components/NavBar.jsx` - Added data-tour attributes
- `frontend/src/components/HeroSection.jsx` - Added data-tour attributes
- `frontend/src/components/Header.jsx` - Added data-tour attributes
- `frontend/src/components/RightBar.jsx` - Added data-tour attributes
- `frontend/src/components/NewsFeed.jsx` - Added data-tour attributes

## Tour Routes

| Route | Tour Name | Description |
|-------|-----------|-------------|
| `/` | Landing Page Tour | Introduces platform features |
| `/home` | Home Page Tour | Shows news feed navigation |
| `/submit-news` | News Submission Tour | Guides through news submission form |
| `/profile` | Profile Page Tour | Explains profile management |
| `/experts` | Experts Page Tour | Shows how to find experts |
| `/debate-rooms` | Debate Rooms Tour | Explains debate room features |

## How to Test Tours

1. **Start the development server:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Clear browser localStorage (optional for testing):**
   - Open browser console (F12)
   - Run: `localStorage.clear()`
   - Reload the page

3. **Navigate to any page from the list above**
   - Tour will automatically start after 0.5 seconds
   - Follow the tour steps using Next/Back buttons
   - Skip tour at any time

4. **Test on different devices:**
   - Desktop: Full experience
   - Mobile: Responsive tooltips

## Common Commands

### Reset all tours:
```javascript
// In browser console:
localStorage.clear();
```

### Reset specific tour:
```javascript
// In browser console:
localStorage.removeItem('tour_completed_home');
localStorage.removeItem('tour_completed_');
localStorage.removeItem('tour_completed_profile');
// etc.
```

### Check tour completion status:
```javascript
// In browser console:
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key.startsWith('tour_completed_')) {
    console.log(key, ':', localStorage.getItem(key));
  }
}
```

## Customization

### Change tour colors:
Edit `frontend/src/components/TourProvider.jsx`, line ~90:

```javascript
styles={{
  options: {
    primaryColor: "#3b82f6",  // Change primary color
    textColor: "#1f2937",     // Change text color
    // ...
  }
}}
```

### Add new tour step:
Edit the relevant tour file in `frontend/src/tours/`:

```javascript
{
  target: '[data-tour="element-name"]',
  content: "Your explanation here",
  placement: "bottom",
}
```

### Disable specific tour:
In `frontend/src/components/TourProvider.jsx`, comment out the case:

```javascript
const getSteps = () => {
  switch (location.pathname) {
    case "/":
      return landingPageTour;
    // case "/home":  // Commented out - tour disabled
    //   return homePageTour;
    // ...
  }
};
```

## Data Tour Attributes Reference

### Landing Page:
- `data-tour="landing-hero"`
- `data-tour="landing-get-started"`
- `data-tour="landing-features"`
- `data-tour="landing-about"`
- `data-tour="landing-how-it-works"`
- `data-tour="landing-team"`
- `data-tour="landing-login"`
- `data-tour="landing-signup"`

### Home Page:
- `data-tour="home-header"`
- `data-tour="home-news-feed"`
- `data-tour="home-first-news-card"`
- `data-tour="home-quick-actions"`
- `data-tour="home-submit-news"`
- `data-tour="home-menu-toggle"`

### News Submission:
- `data-tour="submit-form-container"`
- `data-tour="submit-title"`
- `data-tour="submit-description"`
- `data-tour="submit-link"`
- `data-tour="submit-image-toggle"`
- `data-tour="submit-image-upload"`
- `data-tour="submit-image-url"`
- `data-tour="submit-button"`

### Profile Page:
- `data-tour="profile-container"`
- `data-tour="profile-edit-btn"`
- `data-tour="profile-photo"`
- `data-tour="profile-name"`
- `data-tour="profile-bio"`
- `data-tour="profile-save-btn"`
- `data-tour="profile-password-btn"`

### Experts Page:
- `data-tour="experts-container"`
- `data-tour="experts-search"`
- `data-tour="experts-filter"`
- `data-tour="experts-card"`
- `data-tour="experts-verified"`

### Debate Rooms:
- `data-tour="debate-rooms-container"`
- `data-tour="debate-create-btn"`
- `data-tour="debate-search"`
- `data-tour="debate-room-list"`
- `data-tour="debate-room-card"`
- `data-tour="debate-join-btn"`

## Troubleshooting

### Problem: Tour doesn't start
**Solution:** 
1. Clear localStorage
2. Check console for errors
3. Verify element has `data-tour` attribute
4. Make sure you're on a supported route

### Problem: Tour targets wrong element
**Solution:**
1. Inspect DOM to verify `data-tour` attribute
2. Check for duplicates
3. Ensure selector matches in `tourTargets.js`

### Problem: Tour breaks on mobile
**Solution:**
1. Test element visibility
2. Adjust tooltip placement in tour file
3. Ensure responsive design works

## Production Considerations

Before deploying to production:

1. ✅ Test all tours on multiple devices
2. ✅ Verify localStorage persistence
3. ✅ Check performance impact (minimal)
4. ✅ Test with slow network connections
5. ✅ Ensure tours work with dark mode

## Package Installed

```json
"react-joyride": "^2.8.2"
```

Already installed via: `npm install react-joyride`

## Next Steps

1. **Test the tours** - Visit each page and complete the tours
2. **Customize content** - Update tour step messages to match your needs
3. **Add more tours** - Follow the pattern for new pages
4. **Gather feedback** - Ask users if tours are helpful
5. **Iterate** - Improve based on user feedback

---

## Support

For detailed documentation, see: `TOUR_SYSTEM_DOCUMENTATION.md`

For questions or issues, refer to the main documentation file or check the implementation in `frontend/src/tours/` and `frontend/src/components/TourProvider.jsx`.
