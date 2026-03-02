# Live Experience Feature — Complete Implementation Plan

## Overview

The **Live Experience** (aka "Real Experience Journey") is an interactive hide/show tour that lets users experience VoxVeritas platform features in real time. It overlays the actual page, hides specific elements, types comments live, and reveals results with animations — simulating the full lifecycle of AI-powered debate grouping and news verification.

**Component:** `frontend/src/components/RealExperienceJourney/` (modular folder)  
**Triggered from:** TourProvider.jsx → "Live Experience" button in RightBar  
**Active on:** `/debate-room/:id` (Debate Tour) and `/home` + `/submit-news` (News Tour)

---

## Architecture

```
TourProvider.jsx
 └── RealExperienceJourney/
      ├── index.jsx           — Main component (state, effects, render)
      ├── constants.js        — AI_VERDICT_RULES, DEBATE_MOCK, NEWS_MOCK
      ├── domHelpers.js       — wait, scrollToTarget, typeIntoInput, clearInput
      ├── hideShow.js         — hide/show/highlight/pulse/expand/selectStance
      ├── debateAnalyzer.js   — Async analyzeDebateRoom + findGroup/findComment/findOffTopic
      ├── newsAnalyzer.js     — analyzeNewsFeed (extracts actual card content)
      ├── debateSteps.js      — buildDebateSteps (with stanceToSelect)
      ├── newsSteps.js        — buildNewsSteps (engagement reveal order)
      ├── panelPosition.js    — calcPanelPosition
      └── VerdictRulesPanel.jsx — AI verdict rules display component
```

### Key Design Principles
1. **Guide panel flows** — positioned near the highlighted element, not fixed
2. **Results highlighted** — green glow after each reveal
3. **Content matches** — typed text is the ACTUAL text of the hidden element
4. **No hidden/show language** — feels like a natural guided experience
5. **Robust DOM re-querying** — elements found by title+stance, not stored refs

---

## Debate Room Tour — Complete Flow

### Analysis Phase (behind loading screen)
1. Find `[data-tour="debate-room-groups"]` container
2. Query all `.mb-6` group cards
3. **Expand ALL collapsed groups** (click chevron buttons) to access comment text
4. Wait for DOM to update
5. Categorize groups by stance (For/Against) from `.rounded-full` badge text
6. Pick candidates:
   - **multiGroup**: group with ≥2 comments → will hide ONE comment inside
   - **singleGroup**: group with 1 comment → will hide ENTIRE group card
   - **counterGroup**: opposite stance, preferably with counter-link → hide ENTIRE group
   - **offTopic**: first `.border-l-4` ungrouped comment → hide it
7. Extract ACTUAL text from each element for live typing

### Steps

| # | ID | Type | What Happens |
|---|---|---|---|
| 1 | debate-welcome | Auto | Silently hides multiGroupComment, singleGroup, counterGroup, offTopicComment |
| 2 | debate-type-similar | Type+Click | Selects stance, types ACTUAL multiGroupCommentText, user clicks Send |
| 3 | debate-show-clubbed | Auto | Expands multiGroup, reveals comment with animation + green highlight |
| 4 | debate-type-new | Type+Click | Selects stance, types ACTUAL singleGroupCommentText, user clicks Send |
| 5 | debate-show-new-group | Auto | Reveals entire singleGroup with animation + green highlight |
| 6 | debate-click-ideal-counter | Click | Highlights ideal counter description, user clicks it |
| 7 | debate-explain-ideal-counter | Info | Explains AI-generated ideal counter-argument system |
| 8 | debate-type-counter | Type+Click | Selects opposite stance, types ACTUAL counterGroupCommentText, user clicks Send |
| 9 | debate-show-counter | Auto | Reveals counterGroup with animation + highlights Linked/View Counter badges |
| 10 | debate-type-offtopic | Type+Click | Types ACTUAL offTopicCommentText, user clicks Send |
| 11 | debate-show-offtopic | Auto | Reveals offTopicComment with animation + green highlight, scrolls to ungrouped section |
| 12 | debate-complete | Info | Summary of all features demonstrated |

### DOM Selectors Used (Debate)
- Groups container: `[data-tour="debate-room-groups"]`
- Group cards: `.mb-6` (direct children of grid columns)
- Inner card: `.rounded-lg.p-4` (inside .mb-6)
- Stance badge: `.rounded-full` (text: "For" or "Against")
- Comments area: `.mt-3.space-y-2` (inside inner card, only when expanded)
- Expand button: `button` with `svg.h-4` child and `.p-1` class
- Comment form: `[data-tour="debate-room-comment-input"]`
- Textarea: `[data-tour="debate-room-comment-input"] textarea`
- Submit button: `[data-tour="debate-room-comment-input"] button[type="submit"]`
- Stance buttons: `button[type="button"]` containing "For" or "Against" text
- Ideal counter: `[data-tour="debate-room-ideal-counters"]`
- Off-topic: `.border-l-4` (in ungrouped section)
- Counter badges: Buttons containing "Linked" or "View Counter" text

---

## News Feed Tour — Complete Flow

### Analysis Phase
1. Find `[data-tour="home-first-news-card"]` 
2. Extract ACTUAL content:
   - Title from `h3 > a` text
   - Description from `.prose p` text
   - Link from `h3 > a` href attribute
3. Store for form filling

### Steps

| # | ID | Type | What Happens |
|---|---|---|---|
| 1 | news-welcome | Auto | Extracts content, hides entire first news card |
| 2 | news-goto-submit | Click | Highlights "Submit News" button → navigates to /submit-news |
| 3 | news-fill-form | Auto | Fast-types ACTUAL hidden news title, description, link into form |
| 4 | news-submit-form | Click | User clicks Submit → navigates back to /home |
| 5 | news-appeared | Auto | Shows card WITHOUT engagement (hides voting, comments btn, AI verdict) |
| 6 | news-vote | Click | Reveals voting buttons → user clicks upvote/downvote |
| 7 | news-open-comments | Click | Reveals comments button → user clicks → programmatically opens comments |
| 8 | news-type-comment | Type+Click | Types evidence-backed comment → user clicks Post |
| 9 | news-stream-comments | Auto | Animates existing comments appearing one by one |
| 10 | news-expert-voting | Auto | Highlights first comment, explains expert voting system |
| 11 | news-group-comments | Click | User clicks "Group by Topic" → programmatically triggers it |
| 12 | news-ai-verdict | Auto+Click | Reveals AI verdict section → user clicks "Generate AI Verdict" |
| 13 | news-verdict-rules | Info | Complete scoring rules panel (score ranges, top comment selection, thresholds) |
| 14 | news-complete | Info | Summary of 3-tier verification |

### Engagement Reveal Order
The first news card's engagement elements are hidden when the card appears and revealed step by step:
1. Card body (title, description, image) — shown first
2. `[data-tour="home-voting-buttons"]` — revealed at vote step
3. `[data-tour="home-comments-btn"]` — revealed at comments step
4. Comment section opens via `toggleComments()` click
5. `[data-tour="home-ai-verdict"]` — revealed at AI verdict step

### DOM Selectors Used (News)
- First card wrapper: `[data-tour="home-first-news-card"]`
- Title: `h3 > a` (text content + href attribute)
- Description: `.prose p` or `p.text-gray-700`
- Submit News button: `[data-tour="home-submit-news"]` (in RightBar)
- Form container: `[data-tour="submit-form-container"]`
- Title input: `[data-tour="submit-title"]`
- Description textarea: `[data-tour="submit-description"]`
- Link input: `[data-tour="submit-link"]`
- Submit button: `[data-tour="submit-button"]`
- Voting buttons: `[data-tour="home-voting-buttons"]`
- Comments button: `[data-tour="home-comments-btn"]`
- AI verdict: `[data-tour="home-ai-verdict"]`
- Comment section: `[data-tour="home-comment-section"]`
- Comment input: `[data-tour="home-comment-input"]` (type="text", NOT textarea)
- Post button: sibling button of `[data-tour="home-comment-input"]`
- Group by Topic: `[data-tour="home-group-comments"]`
- First comment: `[data-tour="home-comment-card"]`

---

## AI Verdict Scoring Rules (displayed in tour)

| Score Range | Meaning | Color |
|---|---|---|
| 81–100 | Highly credible and verified | Green |
| 61–80 | Likely true with minor concerns | Light Green |
| 41–60 | Uncertain / mixed evidence | Yellow |
| 21–40 | Likely false or misleading | Light Red |
| 0–20 | Definitely fake / misinformation | Red |

### Top Comment Selection Algorithm
- Comments split by stance: "In Favor" vs "Against"
- If AI groups exist → highest-scored comment per group (ensures diversity)
- Fallback → top comments by raw score (upvotes − downvotes)
- Max 8 supporting + 8 opposing = 16 sent to AI

### Verification Thresholds
- Needs ≥5 total community votes to change status
- >50% upvotes → Status: "Verified"
- >50% downvotes → Status: "Fake"
- 50/50 split → Status remains "Pending"

---

## Technical Implementation Details

### Content Matching Strategy
**Problem:** Groups start collapsed → comments not in DOM → can't read text  
**Solution:** During analysis (behind loading screen), programmatically expand all groups by clicking chevron buttons. This triggers React state updates. Comments render in DOM. Text is extracted. Groups stay expanded for the tour.

### Robust Element Re-querying
**Problem:** DOM references go stale after React re-renders  
**Solution:** Store identifying info (title, stance, text prefix) instead of DOM refs. Re-query elements by `findGroup(title, stance)` and `findCommentInGroup(group, textPrefix)` each time an action needs to interact with an element.

### News Card Hide on Navigation
**Problem:** Navigating away unmounts NewsFeed. On return, fresh DOM → hidden card refs stale.  
**Solution:** Inject `<style>` tag with `[data-tour="home-first-news-card"] { display:none !important }` before navigating back. Card stays invisible while feed loads. Remove style tag when ready to reveal.

### Input Handling
- Debate Room: `<textarea>` → use `HTMLTextAreaElement.prototype` value setter
- News Comment: `<input type="text">` → use `HTMLInputElement.prototype` value setter
- Both dispatch `new Event('input', { bubbles: true })` for React state sync

### Cleanup
On tour close:
1. Find ALL `[data-tour-hidden="true"]` elements → restore display
2. Clear all typed inputs (debate textarea + news inputs)
3. Remove all highlight styles (box-shadow, transform, z-index)
4. Remove injected `<style>` tags
5. Reset comment animation styles
6. Navigate home if on /submit-news
7. Reset all component state

---

## Known Issues Fixed in v3

| Issue | Root Cause | Fix |
|---|---|---|
| For group hides but never shows | Analysis couldn't read collapsed group content; stale DOM ref | Async analysis expands groups; re-query by title+stance |
| Against group never hides | Analysis picked groups inconsistently | Expanded scanning finds all groups properly |
| Off-topic doesn't hide | Selector may miss if ungrouped section is outside groups container | Use `document.querySelectorAll('.border-l-4')` globally |
| Typed text ≠ hidden content | Groups collapsed → comments not in DOM → mock fallback | Expand groups first, extract actual text |
| Results not highlighting | Stale DOM refs after show/hide | Re-query elements, apply highlightResult() to fresh refs |
| Ideal counter not interactive | Step didn't feel like click-to-interact | highlightClickTarget + waitForClick pattern |
| Counter view not shown | No view mode switch implemented | Highlight Linked/View Counter badges, explain feature |
| News form uses mock text | Hardcoded NEWS_MOCK | Extract actual card content before hiding |
| News typing too slow | Speed params 12-25 | Reduced to 8-15 for faster typing |
| Engagement visible on appear | Card shown with all engagement | Hide voting/comments/verdict, reveal step by step |
| Comments section won't open | Only highlighted, not clicked | Programmatically click button in handleUserAction |
| Vote click doesn't register | Overlay blocks real click | Programmatic click in handleUserAction |

---

## File Dependencies

```
RealExperienceJourney/
 ├── index.jsx
 │    ├── react (useState, useEffect, useCallback, useRef)
 │    ├── react-router-dom (useNavigate)
 │    ├── ./domHelpers.js
 │    ├── ./hideShow.js
 │    ├── ./debateAnalyzer.js
 │    ├── ./newsAnalyzer.js
 │    ├── ./debateSteps.js
 │    ├── ./newsSteps.js
 │    ├── ./panelPosition.js
 │    └── ./VerdictRulesPanel.jsx
 └── Reads DOM from:
      ├── AdvancedDebateRoom.jsx (debate groups, comments, form)
      ├── NewsCard.jsx (news content, engagement)
      ├── CommentSection.jsx (comment input, grouping)
      ├── AIVerdictSection.jsx (verdict generation)
      ├── NewsFeed.jsx (card wrapper)
      └── RightBar.jsx (submit news button)
```

---

## Status: Implementation Complete (v3)
- [x] Plan documented
- [x] v3 component rewritten — modular folder with 10 files (~950 lines total)
- [x] Build tested — passes with 0 errors (vite build, 2862 modules)
- [x] Plan updated with final state

### v3 Changelog
- **Modular architecture**: Split monolithic 1511-line file into 10 focused modules under `RealExperienceJourney/`
- **Async analyzeDebateRoom()**: Expands ALL groups behind loading screen to read actual comment text
- **Re-query pattern**: Elements found by `findGroup(title, stance)` / `findCommentInGroup(grp, textPrefix)` / `findOffTopic(textPrefix)` instead of stored DOM refs
- **Stance selection**: `selectStance()` clicks the For/Against button before typing each comment (via `stanceToSelect` step property)
- **Content matching**: All typed text comes from actual hidden element content (no mock mismatch)
- **News content extraction**: `analyzeNewsFeed()` reads title, description, link from first card before hiding
- **Faster form typing**: Speed reduced to 6-10ms per character (was 12-25)
- **Engagement hiding**: Card appears WITHOUT voting/comments/verdict; each revealed via `revealVoting`, `revealCommentsBtn`, `revealAiVerdict` actions
- **Programmatic clicks**: `handleUserAction` clicks real buttons for open-comments, vote, group-comments, generate-verdict, ideal-counter
- **CSS injection for nav**: `<style data-tour-style>` hides first card during /submit-news → /home navigation to prevent flash
- **Robust cleanup**: Queries `[data-tour-hidden="true"]` to restore ALL hidden elements regardless of stale refs; also removes injected `<style>` tags
- **Counter badge highlight**: Orange glow on Linked/View Counter badges after counter group reveal
