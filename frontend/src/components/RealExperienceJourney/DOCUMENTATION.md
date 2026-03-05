# RealExperienceJourney — Complete Developer Documentation

> Version 4 · Interactive Live Tour System  
> Location: `frontend/src/components/RealExperienceJourney/`  
> Last updated: March 2026

---

## Table of Contents

1. [What Is This Feature?](#1-what-is-this-feature)
2. [Why We Built It](#2-why-we-built-it)
3. [Architecture Overview](#3-architecture-overview)
4. [File-by-File Breakdown](#4-file-by-file-breakdown)
5. [Complete Tour Flow — Debate Room](#5-complete-tour-flow--debate-room)
6. [Complete Tour Flow — News Feed](#6-complete-tour-flow--news-feed)
7. [Core Logic Systems](#7-core-logic-systems)
8. [State Management](#8-state-management)
9. [DOM Interaction Techniques](#9-dom-interaction-techniques)
10. [Visual Layer — Spotlight, Panel, Overlay](#10-visual-layer--spotlight-panel-overlay)
11. [Cleanup & Resilience](#11-cleanup--resilience)
12. [Key Design Decisions (The "Why")](#12-key-design-decisions-the-why)
13. [Advanced Patterns Deep-Dive](#13-advanced-patterns-deep-dive)
14. [Integration Points & data-tour Contracts](#14-integration-points--data-tour-contracts)
15. [Edge Cases & Error Handling](#15-edge-cases--error-handling)
16. [Debugging Guide](#16-debugging-guide)

---

## 1. What Is This Feature?

**RealExperienceJourney** is a fully interactive, page-aware guided tour system. Instead of showing screenshots or popups with generic text, it operates on the **live, real application data** while the user watches.

It does three things simultaneously:

| Layer | What happens |
|---|---|
| **Visual** | Dims the whole page with a semi-transparent SVG mask overlay. A spotlight cutout highlights the exact element being discussed. A floating guide panel explains what's happening. A pulsing ring animates around the spotlit element. |
| **Automation** | Types real text into inputs character-by-character, clicks buttons programmatically, expands accordions, selects radio buttons, navigates between routes — all without user effort. |
| **Narrative** | Tells the user a story: "this comment was typed → AI grouped it here → look at the result". Each step builds on the previous one. |

There are **two separate tours** served by the same component:

- **Debate Room Tour (14 steps)** — demonstrates AI comment grouping, new group creation, ideal counter suggestions, counter-argument linking with match %, counter chat side-by-side view, and off-topic moderation.
- **News Feed Tour (16 steps)** — walks through the full news lifecycle: submission → voting → commenting → evidence links → expert voting → AI comment grouping → AI verdict generation → scoring rules.

### How It Feels to the User

1. They open the tour on a debate page or news feed
2. A loading screen appears ("Analyzing Page...") while the system reads the actual page content
3. A floating panel appears with step instructions
4. The page dims, and specific elements light up via spotlight
5. Text types itself into inputs, buttons highlight with colored glows
6. The user clicks highlighted elements when prompted
7. Results animate into view with spring-bounce effects
8. At the end, all hidden data is restored perfectly

---

## 2. Why We Built It

### The Problem

The platform is technically complex. A new user landing on the News Feed or a Debate Room sees buttons, badges, and sections that require explanation. Traditional "tooltip overlays" tell users *where* things are, but never *show* why they matter.

Key challenges:
- Users don't understand the 3-tier verification system (Community → Experts → AI)
- The AI grouping, counter-linking, and verdict features are invisible until they're triggered
- No sandbox environment exists — users need to learn on real data
- The debate room's collapsed comment groups hide the most interesting AI behavior

### The Solution

We needed a tour that:

1. **Uses real data** — not mocked screenshots. If the debate room has actual comments, we extract their text and replay the exact action.
2. **Teaches by doing** — the user watches a comment being typed character by character, then sees the AI instantly group it. The cause→effect is undeniable.
3. **Works on the live DOM** — hiding existing results, then revealing them as if they just happened teaches the UI patterns without needing a sandbox environment.
4. **Does not break the app** — every element hidden during the tour is perfectly restored on close.
5. **Handles edge cases** — if no groups exist, if groups are collapsed, if React re-renders mid-tour, if the user navigates between routes, if DOM refs go stale.

---

## 3. Architecture Overview

```
RealExperienceJourney/
├── index.jsx              ← Main React component (controller + renderer, ~1650 lines)
├── constants.js           ← Static data: AI verdict rules, mock fallback text
├── debateAnalyzer.js      ← Async analyzer: expands groups, reads DOM, re-query helpers (~560 lines)
├── debateAnalyzerNew.js   ← Alternative analyzer (v4, direct DOM ref approach - experimental)
├── newsAnalyzer.js        ← Synchronous analyzer: reads first news card content (~30 lines)
├── debateSteps.js         ← Step definitions for debate tour (14 steps)
├── newsSteps.js           ← Step definitions for news tour (16 steps)
├── hideShow.js            ← DOM visual utilities: hide, show, highlight, expand, stance (~180 lines)
├── domHelpers.js          ← Low-level DOM: wait, scroll, typeIntoInput, clearInput (~65 lines)
├── panelPosition.js       ← Panel placement calculator (4-direction fit algorithm, ~35 lines)
└── VerdictRulesPanel.jsx  ← React sub-component for AI verdict rules display
```

### Dependency Graph

```
index.jsx (main controller)
  ├── react, react-router-dom        (React hooks, useNavigate)
  ├── domHelpers.js                  (wait, scrollToTarget, typeIntoInput, clearInput)
  ├── hideShow.js                    (hideElement, showElement, showWithAnimation, pulseElement,
  │                                   highlightResult, highlightAction, popHighlight,
  │                                   unhighlightAll, expandGroup, selectStance)
  ├── debateAnalyzer.js              (analyzeDebateRoom, findGroup, findCommentInGroup, findOffTopic)
  ├── newsAnalyzer.js                (analyzeNewsFeed)
  ├── debateSteps.js                 (buildDebateSteps)
  ├── newsSteps.js                   (buildNewsSteps)
  ├── panelPosition.js               (calcPanelPosition)
  ├── constants.js                   (NEWS_MOCK)
  └── VerdictRulesPanel.jsx          (React component)

debateAnalyzer.js
  ├── domHelpers.js                  (wait)
  ├── hideShow.js                    (expandGroup)
  └── constants.js                   (DEBATE_MOCK)

hideShow.js
  └── domHelpers.js                  (wait)

newsAnalyzer.js
  └── constants.js                   (NEWS_MOCK)

debateSteps.js
  └── constants.js                   (DEBATE_MOCK)

VerdictRulesPanel.jsx
  └── constants.js                   (AI_VERDICT_RULES)
```

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  index.jsx                                                  │
│                                                             │
│  1. isOpen=true → analyze page                              │
│     ┌────────────────────┐    ┌─────────────────────┐       │
│     │ debateAnalyzer.js  │ OR │ newsAnalyzer.js     │       │
│     │ (async, expands    │    │ (sync, reads first  │       │
│     │  all groups,       │    │  news card content) │       │
│     │  reads comment     │    └─────────┬───────────┘       │
│     │  text, categorizes)│              │                   │
│     └────────┬───────────┘              │                   │
│              │                          │                   │
│              ▼                          ▼                   │
│     ┌────────────────────┐    ┌─────────────────────┐       │
│     │ buildDebateSteps() │ OR │ buildNewsSteps()    │       │
│     │ → 14 step objects  │    │ → 16 step objects   │       │
│     └────────┬───────────┘    └─────────┬───────────┘       │
│              │                          │                   │
│              ▼                          ▼                   │
│  2. stepsReady=true → step executor useEffect               │
│     ┌──────────────────────────────────────────────┐        │
│     │ For each step:                                │        │
│     │  • scroll to target                          │        │
│     │  • execute action (hide/show/type/highlight) │        │
│     │  • select stance if needed                   │        │
│     │  • auto-type if needed                       │        │
│     │  • highlight send/click targets              │        │
│     │  • set waitingForUser if needed              │        │
│     └──────────────────────────────────────────────┘        │
│                                                             │
│  3. User clicks highlighted element → handleUserAction()     │
│     ┌──────────────────────────────────────────────┐        │
│     │ • Clear input if send action                 │        │
│     │ • Navigate if route change needed            │        │
│     │ • Programmatic click if needed               │        │
│     │ • Advance to next step                       │        │
│     └──────────────────────────────────────────────┘        │
│                                                             │
│  4. Render: SVG overlay + pulsing ring + panel + buttons    │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. File-by-File Breakdown

---

### 4.1 `index.jsx` — The Main Controller (~1650 lines)

**Purpose:** The brain of the entire system. It manages state, executes step actions, controls the visual overlay, handles user interactions, orchestrates navigation, and renders the full UI.

#### Props

```jsx
<RealExperienceJourney
  isOpen={boolean}       // Mount/unmount the tour
  onClose={function}     // Called when tour ends
  currentPath={string}   // e.g. '/home', '/debate-room/123', '/submit-news'
/>
```

#### Key Imports

```javascript
import { wait, scrollToTarget, typeIntoInput, clearInput } from './domHelpers';
import {
  hideElement, showElement, showWithAnimation, pulseElement,
  highlightResult, highlightAction, popHighlight, unhighlightAll,
  expandGroup, selectStance,
} from './hideShow';
import { analyzeDebateRoom, findGroup, findCommentInGroup, findOffTopic } from './debateAnalyzer';
import { analyzeNewsFeed } from './newsAnalyzer';
import { buildDebateSteps } from './debateSteps';
import { buildNewsSteps } from './newsSteps';
import { calcPanelPosition } from './panelPosition';
import { NEWS_MOCK } from './constants';
import VerdictRulesPanel from './VerdictRulesPanel';
```

**Why so many imports?** Each concern is in its own file: DOM manipulation, analysis, step definitions, positioning. The controller only *orchestrates*; it doesn't implement the low-level logic.

#### Key State Variables

| State | Type | Purpose |
|---|---|---|
| `currentStepIndex` | number | Which step in the tour is active (0-based) |
| `spotlightRect` | object\|null | `{left, top, width, height}` of the highlighted element's bounding rect, padded by 8px |
| `panelPos` | object | CSS position for the floating panel (`{position, top/bottom, left/right}`) |
| `actionRunning` | boolean | `true` while an async step action is executing — disables Next/Back buttons |
| `panelMinimized` | boolean | `true` when user collapses panel to a floating icon |
| `waitingForUser` | boolean | `true` when user must click a highlighted element to proceed |
| `waitAction` | string\|null | Which action to perform when user clicks (`'send'`, `'vote'`, `'navigate-submit'`, `'expandClubbedGroup'`, `'idealCounterBtn'`, `'counterChatBtn'`, `'groupViewBtn'`, …) |
| `stepsReady` | boolean | Whether analyzer has finished and steps are built |

#### Key Refs

```javascript
const hiddenElementsRef = useRef([]);       // DOM elements hidden during tour (for cleanup)
const clearedInputsRef = useRef([]);        // Input selectors that were auto-typed (for cleanup)
const analysisRef = useRef(null);           // Result from analyzeDebateRoom() or analyzeNewsFeed()
const animFrameRef = useRef(null);          // requestAnimationFrame handle for spotlight tracking
const stepsRef = useRef([]);                // Array of step objects (avoids re-render dependency loops)
const tourPhaseRef = useRef('');            // 'debate' | 'news-home' | 'news-submit' | 'news-back'
const currentStepHiddenRef = useRef(null);  // Track what was hidden for the current step
const observerRef = useRef(null);           // MutationObserver for showClubbedComment expand detection
const clubbedGroupDataRef = useRef(null);   // { groupCard, innerCard, searchPrefix } for skip fallback
```

**Why refs instead of state?** These values are consumed by async `exec()` functions and cleanup handlers. State would cause unnecessary re-renders. Refs are mutable containers that don't trigger re-renders and survive across async boundaries.

#### Page Detection Logic

```javascript
const isDebate = currentPath?.startsWith('/debate-room/');
const isHome = currentPath === '/home';
const isSubmitPage = currentPath === '/submit-news';
const isActiveTourPage = isDebate || isHome || isSubmitPage;
```

**Why?** The tour only works on three page types. On any other route it shows a "Navigate First" dialog. `isActiveTourPage` gates the entire tour rendering.

#### The Four Core `useEffect` Hooks

---

**Hook 1: Page Analysis** — deps: `[isOpen, currentPath]`

```javascript
useEffect(() => {
  if (!isOpen) return;
  const timer = setTimeout(async () => {
    if (isDebate) {
      const analysis = await analyzeDebateRoom();
      analysisRef.current = analysis;
      stepsRef.current = buildDebateSteps(analysis);
      tourPhaseRef.current = 'debate';
    } else if (isHome || isSubmitPage) {
      // Skip re-analysis if already mid-tour navigating between pages
      if (tourPhaseRef.current === 'news-submit' && isSubmitPage) {
        setStepsReady(true);
        return;
      }
      if (tourPhaseRef.current === 'news-back' && isHome) {
        setStepsReady(true);
        return;
      }
      const analysis = analyzeNewsFeed();
      analysisRef.current = analysis;
      stepsRef.current = buildNewsSteps(analysis);
      tourPhaseRef.current = 'news-home';
    }
    setStepsReady(true);
  }, 600);
  return () => clearTimeout(timer);
}, [isOpen, currentPath]);
```

**Why 600ms `setTimeout`?** The DOM — especially API-loaded comment groups — may not be rendered yet when the effect fires. The delay gives React time to commit its render before selectors run.

**Why check `tourPhaseRef.current`?** During the news tour, the user navigates `/home` → `/submit-news` → `/home`. Each route change triggers this effect. Without the phase check, navigating would re-analyze and rebuild steps, wiping the current step index. The phase check says "I'm mid-tour on this phase, just continue with existing steps."

---

**Hook 2: Spotlight Tracking** — deps: `[isOpen, updateSpotlight]`

```javascript
useEffect(() => {
  if (!isOpen) return;
  const loop = () => {
    updateSpotlight();
    animFrameRef.current = requestAnimationFrame(loop);
  };
  animFrameRef.current = requestAnimationFrame(loop);
  return () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
  };
}, [isOpen, updateSpotlight]);
```

The `updateSpotlight` callback re-measures the target element every frame:

```javascript
const updateSpotlight = useCallback(() => {
  if (!currentStep?.target) {
    setSpotlightRect(null);
    setPanelPos({ position: 'fixed', bottom: 24, right: 24 });
    return;
  }
  const el = document.querySelector(currentStep.target);
  if (el) {
    const rect = el.getBoundingClientRect();
    setSpotlightRect({
      left: rect.left - 8,     // ← 8px padding on each side
      top: rect.top - 8,
      width: rect.width + 16,
      height: rect.height + 16,
    });
    setPanelPos(calcPanelPosition(rect));
  } else {
    setSpotlightRect(null);
    setPanelPos({ position: 'fixed', bottom: 24, right: 24 });
  }
}, [currentStep]);
```

**Why `requestAnimationFrame` loop?** The page height changes as comments load, accordions expand, and the user scrolls. Continuous tracking (~60 FPS) keeps the spotlight pixel-perfect. A one-time measurement on step change would drift from the element whenever layout shifts.

---

**Hook 3: Step Action Executor** — deps: `[isOpen, currentStepIndex, stepsReady]`

The heaviest and most important hook. On each step change:

```javascript
useEffect(() => {
  if (!isOpen || !currentStep || !stepsReady) return;
  let cancelled = false;

  const exec = async () => {
    setActionRunning(true);
    setWaitingForUser(false);
    setWaitAction(null);
    unhighlightAll();    // ← Strip all glows from previous step

    const analysis = analysisRef.current;

    // 1) Scroll to the step's target element
    if (currentStep.target) {
      await scrollToTarget(currentStep.target);
      await wait(300);
    }

    // 2) Execute the step-specific action (details in Section 5 & 6)
    //    Each action block checks: if (currentStep.action === 'xxx' && ...)

    // 3) Common operations that run on many steps:
    if (currentStep.stanceToSelect && !cancelled) await selectStance(currentStep.stanceToSelect);
    if (currentStep.autoType && !cancelled) { /* type into input */ }
    if (currentStep.highlightSendBtn && !cancelled) { /* glow the send button */ }
    if (currentStep.highlightClickTarget && currentStep.target && !cancelled) { /* glow target */ }

    // 4) Set waiting state if user interaction needed
    if (currentStep.waitForClick && !cancelled) {
      setWaitingForUser(true);
      setWaitAction(currentStep.waitForClick);
    }

    if (!cancelled) setActionRunning(false);
  };

  exec();
  return () => { cancelled = true; };  // ← cleanup: cancels all pending awaits
}, [isOpen, currentStepIndex, stepsReady]);
```

**Why `cancelled` flag?** If the user rapidly clicks Next, multiple async `exec()` invocations would race. The cleanup function for effect N sets `cancelled = true` before effect N+1's `exec()` starts. Every `await` is followed by `if (cancelled) return`.

---

**Hook 4: Keyboard Handler** — deps: `[isOpen, goNext, goPrev, waitingForUser]`

```javascript
useEffect(() => {
  if (!isOpen) return;
  const handler = (e) => {
    if (e.key === 'Escape') handleClose();
    if (waitingForUser) return;  // arrows blocked while waiting
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNext();
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goPrev();
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, [isOpen, goNext, goPrev, waitingForUser]);
```

**Why block arrows during `waitingForUser`?** Steps that require user action (clicking Send, voting, etc.) can't be skipped with keyboard arrows. The Skip button (which calls `handleUserAction`) is the only escape.

---

#### The `handleUserAction` Callback

Handles every possible user interaction. The `waitAction` string determines what happens:

| waitAction | What `handleUserAction` does |
|---|---|
| `'send'` / `'post-comment'` | Clear textarea, advance to next step |
| `'navigate-submit'` | Set phase, call `navigate('/submit-news')`, advance after 800ms |
| `'navigate-home'` | Clear inputs, re-inject CSS, call `navigate('/home')`, advance after 1000ms |
| `'vote'` | Click upvote button, set count to "1", advance |
| `'open-comments'` | Click comments button, advance after 600ms |
| `'group-comments'` | Click "Group by Topic" button, advance after 600ms |
| `'generate-verdict'` | Click generate button inside AI verdict section, advance |
| `'expandClubbedGroup'` | Disconnect MutationObserver, programmatically expand group, find+highlight comment, advance |
| `'idealCounterBtn'` | Click first ideal counter button, advance |
| `'counterChatBtn'` | Click Counter Chat View toggle, advance after 600ms |
| `'groupViewBtn'` | Click Groups View toggle, advance after 600ms |

**Why programmatic clicks?** The spotlight overlay blocks direct DOM clicks. When the user clicks the transparent passthrough div over the spotlight area, `handleUserAction` programmatically calls `.click()` on the real button underneath. This fires the actual React event handlers and API calls.

---

#### Navigation Functions

```javascript
const goNext = useCallback(() => {
  if (actionRunning || waitingForUser || currentStepIndex >= steps.length - 1) return;
  setCurrentStepIndex((i) => i + 1);
}, [actionRunning, waitingForUser, currentStepIndex, steps.length]);

const goPrev = useCallback(() => {
  if (actionRunning || waitingForUser || currentStepIndex <= 0) return;
  setCurrentStepIndex((i) => i - 1);
}, [actionRunning, waitingForUser, currentStepIndex]);
```

**Guards:** Cannot advance while `actionRunning` (prevents double-execution). Cannot advance while `waitingForUser`. Cannot exceed bounds.

---

#### The Render Section

When `isOpen`, the component renders:

1. **Not on supported page?** → "Navigate First" dialog (modal)
2. **Not ready?** → "Analyzing Page..." loading screen (spinning indicator)
3. **Main tour UI** (all rendered in a `pointer-events: none` full-screen container):
   - **SVG overlay** — full-screen mask with spotlight cutout
   - **Pulsing ring** — animated div around spotlight area
   - **Click passthrough** — transparent div over spotlight when `waitingForUser`
   - **Floating panel** — guide card with header, content, status badges, navigation buttons
   - **CSS keyframes** — `pulse-ring` animation injected via `<style>`

---

### 4.2 `constants.js` — Static Data

**Purpose:** Single source of truth for two types of data.

#### `AI_VERDICT_RULES`

```javascript
export const AI_VERDICT_RULES = {
  scoring: [
    { range: '81–100', meaning: 'Highly credible and verified', color: 'bg-green-500' },
    { range: '61–80', meaning: 'Likely true with minor concerns', color: 'bg-green-400' },
    { range: '41–60', meaning: 'Uncertain / mixed evidence', color: 'bg-yellow-500' },
    { range: '21–40', meaning: 'Likely false or misleading', color: 'bg-red-400' },
    { range: '0–20', meaning: 'Definitely fake / misinformation', color: 'bg-red-600' },
  ],
  topCommentSelection: [
    'Comments split by stance: "In Favor" vs "Against" (General excluded)',
    'If AI groups exist → highest-scored comment from each group (ensures diversity)',
    'Fallback → top comments by raw score (upvotes − downvotes)',
    'Up to 8 supporting + 8 opposing = max 16 sent to AI',
  ],
  credibilityFactors: [...],    // How expert votes are weighted
  aiEvaluation: [...],          // What dimensions Gemini evaluates
  verificationThresholds: [...] // Voting thresholds for community verdict
};
```

**Why centralize?** These rules are the actual scoring algorithm. One file means all references update together.

#### `DEBATE_MOCK` / `NEWS_MOCK`

```javascript
export const DEBATE_MOCK = {
  similar: 'AI moderation can efficiently handle the massive scale...',
  newGroup: 'The economic impact of AI moderation on the content...',
  counter: 'While AI speed is impressive, it frequently misunderstands...',
  offTopic: 'I think blockchain technology is more important...',
};

export const NEWS_MOCK = {
  title: 'Study: Global Renewable Energy Capacity Surpasses Coal for First Time',
  description: "A landmark report by the International Energy Agency...",
  link: 'https://www.iea.org/news/renewable-capacity-milestone',
  comment: 'This aligns with recent data from Bloomberg NEF...',
};
```

**Why mocks exist:** Analyzers try to extract real text from the DOM. But if the debate room is empty, or the comment paragraph has a different CSS class, or the card hasn't loaded yet — the mocks are a safety net. Every extraction has `|| DEBATE_MOCK.xxx` fallbacks. They're realistic-sounding so the tour never shows empty inputs.

---

### 4.3 `debateAnalyzer.js` — Debate Room DOM Analyzer (~560 lines)

**Purpose:** Reads the live debate room DOM, expands all collapsed groups, extracts metadata for 14 tour steps, and provides re-query functions for finding elements after React re-renders.

#### Why Async

Each `expandGroup()` clicks a DOM button and waits ~500ms for the animation + React state update. With N groups, that's N sequential async operations. This is why it runs behind a loading screen.

#### The Result Object

```javascript
const result = {
  // Multi-comment group: hide ONE comment inside it
  multiGroupTitle: '',              // e.g. "Economic Impact Analysis"
  multiGroupStance: null,           // 'for' | 'against'
  multiGroupCommentTextPrefix: '',  // First 60 chars of comment text
  multiGroupCommentText: '',        // Full comment text

  // Single-comment group: hide ENTIRE group card
  singleGroupTitle: '',
  singleGroupStance: null,
  singleGroupCommentText: '',

  // Counter group: opposite stance, hide ENTIRE group
  counterGroupTitle: '',
  counterGroupStance: null,
  counterGroupCommentText: '',

  // Off-topic: ungrouped comment
  offTopicTextPrefix: '',
  offTopicCommentText: '',
  offTopicStance: null,

  // Special flag
  isUngroupedOnly: false,  // true when no AI groups exist
};
```

**Why text-based identifiers, not DOM refs?** After the user posts a comment, the API responds and React re-renders ALL groups. Stored DOM references point to detached garbage-collected nodes. Text strings survive re-renders.

#### The `isUngroupedOnly` Mode

When the debate room has zero AI groups (only ungrouped `.border-l-4` comments):

```javascript
if (allGroupCards.length === 0) {
  result.isUngroupedOnly = true;

  // Categorize by border color
  offTopicCards.forEach((card) => {
    const isFor = card.classList.contains('border-green-500');
    const isAgainst = card.classList.contains('border-red-500');
    const isGray = card.classList.contains('border-gray-500');
    if (isFor) forComments.push(card);
    else if (isAgainst) againstComments.push(card);
    else otherComments.push(card);
  });

  // Role assignment:
  // 1st "for" comment → multiComment (for hide→retype→reveal)
  // 2nd "for" comment → singleGroup
  // 1st "against" comment → counter
  // 1st "other/gray" comment → offTopic
}
```

**Why does this exist?** Brand new debate rooms have no AI groups yet. The tour must still function. This fallback hides/shows ungrouped comment cards instead of group cards.

#### Main Analysis Flow (Normal Mode with Groups)

```
Step 1: Find all .mb-6 group cards inside [data-tour="debate-room-groups"]
Step 2: Expand ALL collapsed groups → expandGroup(card) + wait(300)
Step 3: Categorize into forGroups[] and againstGroups[] by badge text
Step 4: Pick multi-comment group (commentCount > 1, prefer forGroups[0])
        → Extract one comment's text via: commentEl.querySelector('p.text-gray-700.text-sm.mb-3')
        → Store prefix: text.slice(0, 60)
        → Save to sessionStorage: 'tour_multiCommentText'
Step 5: Pick single-comment group (commentCount ≤ 1, same stance)
        → Store full group card's comment text
        → Save to sessionStorage: 'tour_singleGroupText'
Step 6: Find off-topic .border-l-4 elements → extract text
        → Save to sessionStorage: 'tour_offTopicText'
Step 7: Pick counter group (opposite stance to single, different from multi/single)
        → Save to sessionStorage: 'tour_counterGroupText'
```

**Why `p.text-gray-700.text-sm.mb-3`?** Each comment element contains multiple `<p>` tags (username, timestamp, vote counts, actual text). This specific Tailwind class combo targets the comment body paragraph. The comma fallback `p.text-sm.mb-3` handles slight class variations.

#### Re-Query Helper Functions

These are called **at execution time** (not analysis time) to find fresh DOM nodes after React re-renders:

**`findGroup(title, stance)`** — Find a group card by its title + stance badge:

```javascript
export const findGroup = (title, stance) => {
  const container = document.querySelector('[data-tour="debate-room-groups"]');
  const allCards = container.querySelectorAll('.mb-6');
  for (const card of allCards) {
    const h3 = card.querySelector('.rounded-lg.p-4.border h3');
    if (h3?.textContent?.trim() !== title) continue;
    const badge = card.querySelector('.rounded-full');
    const badgeText = badge?.textContent?.toLowerCase() || '';
    if (stance === 'for' && !badgeText.includes('for')) continue;
    if (stance === 'against' && !badgeText.includes('against')) continue;
    return card;
  }
  return null;
};
```

**Why match both title AND stance?** Two groups could theoretically share a title but differ in stance. Matching both guarantees uniqueness.

**`findCommentInGroup(groupCard, textPrefix)`** — Find a specific comment inside a group:

```javascript
export const findCommentInGroup = (groupCard, textPrefix) => {
  // Try AdvancedDebateRoom structure
  let commentsDiv = groupCard.querySelector('.mt-3.space-y-2');
  if (!commentsDiv) {
    // Try original DebateRoom structure
    const blockDiv = groupCard.querySelector('div.block, div:not(.hidden)');
    if (blockDiv) commentsDiv = blockDiv.querySelector('.divide-y');
  }

  const normalizedPrefix = textPrefix.slice(0, 40).trim();
  for (const c of commentsDiv.children) {
    // Strategy 1: match <p> text prefix
    for (const p of c.querySelectorAll('p')) {
      if (p.textContent?.trim()?.startsWith(normalizedPrefix) && p.textContent.length > 20)
        return c;
    }
    // Strategy 2: full card text contains prefix
    if (c.textContent?.includes(normalizedPrefix) && normalizedPrefix.length >= 20)
      return c;
  }
  return null;
};
```

**Why two comment container strategies?** The codebase has two debate room implementations with different DOM structures. The double-try handles both.

**Why `textPrefix.slice(0, 40)`?** 40 chars uniquely identifies a comment. A shorter prefix is more resilient to minor AI text reformatting.

**`findOffTopic(textPrefix)`** — Find an ungrouped comment globally by text:

```javascript
export const findOffTopic = (textPrefix) => {
  const normalizedPrefix = textPrefix.slice(0, 50).trim();
  const allBorderL4 = document.querySelectorAll('.border-l-4');
  for (const el of allBorderL4) {
    const commentTextP = el.querySelector('p.text-gray-700.text-sm.mb-3, p.text-sm.mb-3, p.text-sm');
    if (commentTextP?.textContent?.trim()?.startsWith(normalizedPrefix)) return el;
    if (el.textContent?.includes(normalizedPrefix)) return el;  // full-text fallback
  }
  return null;
};
```

**Why `.border-l-4`?** All ungrouped/off-topic comments have a colored left border (green/red/gray). This CSS selector catches them all.

---

### 4.4 `newsAnalyzer.js` — News Feed DOM Analyzer (~30 lines)

```javascript
export const analyzeNewsFeed = () => {
  const result = { newsTitle: '', newsDescription: '', newsLink: '' };
  const firstCard = document.querySelector('[data-tour="home-first-news-card"]');
  if (!firstCard) return result;

  const titleEl = firstCard.querySelector('h3 a');
  result.newsTitle = titleEl?.textContent?.trim() || NEWS_MOCK.title;
  result.newsLink = titleEl?.getAttribute('href') || NEWS_MOCK.link;

  const descEl =
    firstCard.querySelector('.prose p') ||
    firstCard.querySelector('p.text-gray-700') ||
    firstCard.querySelector('p.text-gray-600');
  result.newsDescription = descEl?.textContent?.trim() || NEWS_MOCK.description;
  return result;
};
```

**Why synchronous?** No accordions to expand. The news card is already rendered.

**Why extract real data?** The tour types this text into the submit form. When the card "appears" afterward, its title matches what was typed — creating the illusion that "you submitted this exact article."

**Why three description selectors?** The paragraph varies: `.prose p` (prose mode), `p.text-gray-700` (standard), `p.text-gray-600` (alternative). The cascade handles all cases.

---

### 4.5 `debateSteps.js` — Debate Step Definitions

#### Step Object Schema

```javascript
{
  id: string,                          // unique identifier
  icon: string,                        // emoji for panel header
  title: string,                       // bold title
  subtitle: string,                    // muted subtitle
  description: string,                 // narrative text (\n for line breaks)
  gradient: string,                    // Tailwind gradient classes
  target: string | null,               // CSS selector for spotlight
  action: string,                      // action key for exec() in index.jsx
  stanceToSelect: 'for' | 'against',   // auto-select radio
  autoType: { selector, text },         // auto-type config
  highlightSendBtn: boolean,            // highlight submit button
  highlightClickTarget: boolean,        // highlight target element
  waitForClick: string,                 // pause, wait for user
  isRulesStep: boolean,                 // render VerdictRulesPanel
}
```

**How `autoType.text` gets its value:**

```javascript
// debateAnalyzer.js writes to sessionStorage BEFORE buildDebateSteps() is called:
sessionStorage.setItem('tour_multiCommentText', result.multiGroupCommentText);

// debateSteps.js reads at build time:
autoType: {
  selector: '[data-tour="debate-room-comment-input"] textarea',
  text: sessionStorage.getItem('tour_multiCommentText') || DEBATE_MOCK.similar,
},
```

**Why sessionStorage?** Step objects are plain JS objects built synchronously. The text was extracted asynchronously. SessionStorage bridges the gap.

#### The 14 Debate Steps

| # | Step ID | Action | What happens |
|---|---|---|---|
| 0 | `debate-welcome` | — | Intro panel, no target |
| 1 | `debate-type-similar` | `hideMultiComment` | Hide comment → "For" → type → wait Send |
| 2 | `debate-show-clubbed` | `showClubbedComment` | MutationObserver → expand → pop-highlight |
| 3 | `debate-type-new` | `hideSingleComment` | Hide group → "For" → type → wait Send |
| 4 | `debate-show-new-group` | `showNewGroup` | Re-query → spring-reveal |
| 5 | `debate-click-ideal-counter` | `highlightIdealCounterBtn` | Purple-glow button → wait click |
| 6 | `debate-type-counter` | `hideCounterComment` | Hide counter → "Against" → type → wait Send |
| 7 | `debate-show-counter` | `showCounterGroup` | Reveal → orange counter-link badges |
| 8 | `debate-counter-chat` | `highlightCounterChatBtn` | Blue-glow toggle → wait click |
| 9 | `debate-counter-pair` | `highlightCounterPairInChat` | Find pair thread → highlight both sides |
| 10 | `debate-back-to-groups` | `highlightGroupViewBtn` | Blue-glow "Groups View" → wait click |
| 11 | `debate-type-offtopic` | `hideOffTopicComment` | Hide off-topic → "For" → type → wait Send |
| 12 | `debate-show-offtopic` | `showOffTopic` | Reveal in ungrouped section |
| 13 | `debate-complete` | — | Summary of all features |

---

### 4.6 `newsSteps.js` — News Step Definitions

#### The 16 News Steps

| # | Step ID | Action | What happens |
|---|---|---|---|
| 0 | `news-welcome` | `hideNewsCard` | Hide card + inject CSS |
| 1 | `news-goto-submit` | — | Highlight "Submit News" → navigate |
| 2 | `news-fill-form` | `autoFillNewsForm` | Type title(8ms), desc(6ms), link(10ms) |
| 3 | `news-submit-form` | — | Highlight submit → navigate home |
| 4 | `news-appeared` | `showNewsCardClean` | Remove CSS, hide engagement, reveal card |
| 5 | `news-vote` | `revealVotingZero` | Show voting (0 counts) → wait vote |
| 6 | `news-open-comments` | `revealCommentsBtn` | Show comments btn → wait click |
| 7 | `news-type-comment` | `hideCommentsAndFillInput` | Hide comments, type one → wait Post |
| 8 | `news-comments-stream` | `streamComments` | Slide-in animation, 280ms apart |
| 9 | `news-evidence-link` | `highlightEvidenceLink` | Highlight/click evidence link button |
| 10 | `news-expert-voting` | `animateExpertVote` | Dynamic "Expert analyzing..." badge |
| 11 | `news-group-comments` | — | Highlight "Group by Topic" → click |
| 12 | `news-show-grouped` | `highlightGroupedView` | Highlight grouped sections |
| 13 | `news-ai-verdict` | `revealAiVerdict` | Show verdict section → click generate |
| 14 | `news-verdict-rules` | — | `isRulesStep` → VerdictRulesPanel |
| 15 | `news-complete` | `unhideAllNewsData` | Restore everything |

---

### 4.7 `hideShow.js` — Visual DOM Utilities (~180 lines)

#### `hideElement(el)` — Hide and mark

```javascript
export const hideElement = (el) => {
  if (!el) return;
  const computedDisplay = window.getComputedStyle(el).display;
  el.dataset.tourOriginalDisplay = computedDisplay !== 'none' ? computedDisplay : 'block';
  el.dataset.tourHidden = 'true';
  el.style.display = 'none';
};
```

Three things happen:
1. **Save original display** — `getComputedStyle` returns actual rendered value (`flex`, `grid`, etc.), stored in `data-tour-original-display`
2. **Mark as hidden** — `data-tour-hidden="true"` is queryable for cleanup
3. **Hide** — `display: none`

**Why save display?** Without it, restoring defaults to `block`. But `flex` elements restored as `block` would break layout.

#### `showElement` / `showWithAnimation`

```javascript
export const showWithAnimation = (el, displayVal = '') => {
  delete el.dataset.tourHidden;
  el.style.display = displayVal || el.dataset.tourOriginalDisplay || 'block';
  delete el.dataset.tourOriginalDisplay;
  el.style.transition = 'all 0.6s cubic-bezier(0.34,1.56,0.64,1)';
  el.style.opacity = '0';
  el.style.transform = 'translateY(-12px) scale(0.95)';
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0) scale(1)';
    }),
  );
};
```

**Double `requestAnimationFrame`:** Single rAF might batch the display change and transform into one paint, skipping the transition. Double rAF guarantees: Frame 1 renders `opacity:0; translateY(-12px)`, Frame 2 triggers `opacity:1; translateY(0)`, and the CSS transition animates between them.

**`cubic-bezier(0.34,1.56,0.64,1)`:** A "spring overshoot" curve — the element slightly overshoots then settles. Feels like it "popped" into existence.

#### Three Highlight Tiers

| Function | Color | Meaning | Scale |
|---|---|---|---|
| `highlightResult(el)` | Green (34,197,94) | "AI produced this result" | 1.02 |
| `highlightAction(el)` | Yellow (234,179,8) | "Click this" | 1.03 |
| `popHighlight(el)` | Green + bounce | "This just appeared!" | 1.04 → settles to 1.0 |

#### `unhighlightAll()`

```javascript
export const unhighlightAll = () => {
  document.querySelectorAll('[style]').forEach((el) => {
    if (el.style.boxShadow &&
      (el.style.boxShadow.includes('234,179,8') ||   // yellow
       el.style.boxShadow.includes('34,197,94') ||    // green
       el.style.boxShadow.includes('59,130,246')))     // blue
    {
      unhighlight(el);
    }
  });
};
```

**Why color-matching?** Only strip tour-related glows. If another component has `shadow-lg` (Tailwind), we must not touch it.

#### `expandGroup(groupCard, force = false)`

```javascript
export const expandGroup = async (groupCard, force = false) => {
  const innerCard = groupCard.querySelector('.rounded-lg.p-4.border');
  if (!force) {
    const commentsDiv = innerCard.querySelector('.mt-3.space-y-2');
    if (commentsDiv) return;  // already expanded
  }
  let chevronBtn =
    innerCard.querySelector('[data-tour="group-expand-btn"]') ??
    Array.from(innerCard.querySelectorAll('button.p-1')).find((b) => !b.title) ??
    Array.from(innerCard.querySelectorAll('button')).at(-1);
  if (chevronBtn) { chevronBtn.click(); await wait(500); }
};
```

Three button-finding strategies (most specific → most generic). **`force` parameter:** Used by `showClubbedComment` to toggle a group closed after confirming the comment is inside it.

#### `selectStance(stance)`

Clicks the `input[type="radio"][value="for"|"against"]` in the comment form and applies a colored glow to the label (green for "for", red for "against"). The glow fades after 2000ms.

---

### 4.8 `domHelpers.js` — Low-Level DOM Utilities (~65 lines)

#### `wait(ms)` — Promisified setTimeout

```javascript
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));
```

#### `scrollToTarget(selector)` — Smooth scroll + 600ms delay

Accepts both CSS selector strings and DOM element references. Uses `scrollIntoView({ behavior: 'smooth', block: 'center' })`. The 600ms delay is a safe estimate for scroll completion.

#### `typeIntoInput(selector, text, speed = 35)` — THE CRITICAL TECHNIQUE

```javascript
export const typeIntoInput = (selector, text, speed = 35) =>
  new Promise((resolve) => {
    const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!el) { resolve(); return; }
    el.focus();
    let i = 0;
    const isTextarea = el.tagName === 'TEXTAREA';
    const proto = isTextarea
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
    const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (!nativeSetter) { resolve(); return; }

    const interval = setInterval(() => {
      i++;
      nativeSetter.call(el, text.slice(0, i));
      el.dispatchEvent(new Event('input', { bubbles: true }));
      if (i >= text.length) {
        clearInterval(interval);
        setTimeout(resolve, 300);
      }
    }, speed);
  });
```

**The Problem:** React controls input values. `el.value = 'text'` doesn't trigger `onChange`. The component state doesn't update.

**The Solution:**
```javascript
// WRONG:
el.value = 'hello';  // React doesn't detect this

// CORRECT:
const nativeSetter = Object.getOwnPropertyDescriptor(
  HTMLTextAreaElement.prototype, 'value'
).set;
nativeSetter.call(el, 'hello');                        // Native path
el.dispatchEvent(new Event('input', { bubbles: true })); // React sees it
```

React stores a reference to the native `value` setter when it mounts. By calling the **prototype setter directly**, we invoke the same internal path React uses, making `onChange` fire.

`{ bubbles: true }` is required because React uses event delegation at the root container — the event must bubble up to reach it.

**Character-by-character:** `text.slice(0, i)` with `i` incrementing. Speed 35ms = normal, 6-10ms = fast for long texts.

#### `clearInput(selector)` — Same technique, sets to `''`

---

### 4.9 `panelPosition.js` — Smart Panel Placement (~35 lines)

```javascript
export const calcPanelPosition = (targetRect, panelW = 420, panelH = 340) => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const GAP = 16;

  // Try: Right → Left → Below → Above → Fallback bottom-right
  if (targetRect.right + GAP + panelW < vw - 16) return { /* right */ };
  if (targetRect.left - GAP - panelW > 16) return { /* left */ };
  if (targetRect.bottom + GAP + panelH < vh - 16) return { /* below */ };
  if (targetRect.top - GAP - panelH > 16) return { /* above */ };
  return { position: 'fixed', bottom: 24, right: 24 };
};
```

**Why four directions?** Different target shapes: wide news card → right/below; bottom input → above; narrow button → left. Ensures the panel never overlaps the spotlit element.

**Clamping:** `Math.max(16, Math.min(targetRect.top, vh - panelH - 16))` keeps the panel within 16px of viewport edges.

---

### 4.10 `VerdictRulesPanel.jsx` — AI Rules UI

Renders five sections from `AI_VERDICT_RULES` in a scrollable container:

```jsx
<div className="max-h-60 overflow-y-auto pr-1 space-y-3 text-xs">
  {/* Credibility Score Ranges — colored squares + ranges */}
  {/* Top Comment Selection — blue bullet points */}
  {/* Comment Credibility — purple bullets */}
  {/* AI Evaluation Criteria — amber bullets */}
  {/* Voting Thresholds — green bullets */}
</div>
```

**Key design:** `max-h-60 overflow-y-auto` scrolls within the panel without expanding it. `text-xs` base keeps it compact.

---

### 4.11 `debateAnalyzerNew.js` — Experimental v4

An alternative implementation that stores direct DOM element refs instead of re-querying. Has a syntax error (missing closing brace). Production uses `debateAnalyzer.js`.

---

## 5. Complete Tour Flow — Debate Room

### Entry Condition

User opens the tour while on `/debate-room/*`.

### Phase 0: Analysis (behind loading screen)

```
analyzeDebateRoom() [async, ~1-2 seconds]
  └─ expandGroup() × N groups         [clicks chevrons, waits 500ms each]
  └─ categorize into for/against
  └─ pick multi, single, counter, offTopic
  └─ store text in sessionStorage
  └─ return metadata object
→ buildDebateSteps(analysis) → 14 step objects
→ setStepsReady(true) → loading screen unmounts
```

### Step-by-Step Walkthrough

#### Step 0 — Welcome
- No target, no action. Shows intro message. User presses Next →.

#### Step 1 — Type Similar Comment (`hideMultiComment`)

**Before typing:** The tour hides the existing comment that's about to be "re-posted". If `isUngroupedOnly`, it uses `findOffTopic(prefix)` to find the ungrouped card. Otherwise, it uses `findGroup(title, stance)` → `expandGroup()` → `findCommentInGroup(group, prefix)` → `hideElement()`.

**Why hide beforehand?** The next step's reveal would have no impact if the comment was already visible. Hiding creates the before/after contrast.

Then: `selectStance('for')` → `typeIntoInput(textarea, text, ~8ms/char)` → `highlightAction(sendButton)` → `waitForClick: 'send'`.

The spotlight illuminates the comment input, and a transparent passthrough div catches the user's click.

#### Step 2 — Show Clubbed Comment (`showClubbedComment`)

The most complex action in the codebase. Full details in [Section 13.1](#131-the-mutationobserver-pattern-showclubbedcomment).

Summary: Wait 1500ms for API + React re-render. Scan all groups to find which one contains the comment. Collapse it. Style its expand button with a green halo. Arm a MutationObserver. When the USER expands it, the observer fires → find comment → `popHighlight` → advance.

#### Step 3 — Type Unique Comment (`hideSingleComment`)

Hides the ENTIRE single-comment group card (not just a comment inside it). Types a unique comment text. Waits for Send.

#### Step 4 — Show New Group (`showNewGroup`)

Re-queries with `findGroup(title, stance)`. Calls `showWithAnimation()` (spring bounce). `popHighlight` on the revealed group.

Teaches: unique comment → AI auto-creates a new group with title + description.

#### Step 5 — Ideal Counter Button (`highlightIdealCounterBtn`)

Finds `[data-tour="debate-ideal-counter-btn"]`, scrolls to it, applies purple glow + scale(1.12). `waitForClick: 'idealCounterBtn'`.

When clicked, `handleUserAction` programmatically clicks the button (opening the ideal counter modal) and advances.

#### Step 6 — Type Counter-Argument (`hideCounterComment`)

Hides the counter group. Selects "Against" stance. Types counter text. Waits for Send.

#### Step 7 — Show Counter Group (`showCounterGroup`)

Reveals the counter group with animation. Then finds counter-link badges inside (`[data-tour="debate-room-counter-links"] button`) and applies orange glow:

```javascript
counterLinkBtns.forEach((btn) => {
  btn.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.8), 0 0 18px rgba(249,115,22,0.45)';
  btn.style.transform = 'scale(1.08)';
});
```

Teaches: AI pair-linked two opposing groups with a match percentage.

#### Step 8 — Counter Chat View Toggle (`highlightCounterChatBtn`)

Highlights `[data-tour="debate-counter-chat-btn"]` with blue glow. User clicks to switch to side-by-side counter chat layout.

#### Step 9 — Highlight Counter Pair in Chat (`highlightCounterPairInChat`)

Waits 1200ms for counter chat render. Scans all `[data-tour="counter-chat-thread"]` elements. For each, checks `[data-group-id]` cards inside by:
1. Matching counter group title via `h3` text
2. Matching comment text prefix in the comments section

When found: scrolls to the thread, applies pink glow, expands "Show N comments" buttons on both sides, `popHighlight` both cards.

#### Step 10 — Back to Groups (`highlightGroupViewBtn`)

Highlights the "Groups View" toggle button, waits for user click to switch back.

#### Step 11 — Type Off-Topic Comment (`hideOffTopicComment`)

Hides the off-topic comment. Types an unrelated comment. Waits for Send.

#### Step 12 — Show Off-Topic (`showOffTopic`)

Re-queries with `findOffTopic(prefix)`. Reveals with animation. Also scrolls to `[data-tour="debate-room-ungrouped"]` and highlights the whole section.

Teaches: off-topic comments are isolated but preserved, keeping the main debate focused.

#### Step 13 — Tour Complete

Summary card listing all 6 AI features. User presses Finish → `handleClose()`.

---

## 6. Complete Tour Flow — News Feed

### Entry Condition

User opens tour on `/home` or `/submit-news`.

### Page Navigation Lifecycle

The news tour involves **two route changes**:

```
/home (Steps 0-1) → /submit-news (Steps 2-3) → /home (Steps 4-15)
```

`tourPhaseRef` tracks this: `'news-home'` → `'news-submit'` → `'news-back'`.

### Step-by-Step Walkthrough

#### Step 0 — Welcome + Hide Card (`hideNewsCard`)

Finds `[data-tour="home-first-news-card"]`, calls `hideElement()`, AND injects a `<style>` tag:

```html
<style data-tour-style="hide-first-card">
  [data-tour="home-first-news-card"] { display: none !important; }
</style>
```

**Why both?** `hideElement()` sets inline `display:none`. But navigating away causes React to unmount/remount, clearing inline styles. The injected CSS in `<head>` survives route changes.

#### Step 1 — Navigate to Submit

Highlight `[data-tour="home-submit-news"]`. User clicks. `navigate('/submit-news')`. Advance after 800ms.

#### Step 2 — Auto-Fill Form (`autoFillNewsForm`)

```javascript
if (titleInput) await typeIntoInput(titleInput, newsTitle, 8);   // 8ms/char
if (descInput)  await typeIntoInput(descInput, newsDesc, 6);     // 6ms/char (faster)
if (linkInput)  await typeIntoInput(linkInput, newsLink, 10);    // 10ms/char
```

Types the **real extracted text** from the analyzer. The submitted article will match the card.

#### Step 3 — Submit + Navigate Home

User clicks submit. `handleUserAction` clears inputs, re-injects CSS hide rule, `navigate('/home')`.

#### Step 4 — Card Appeared Clean (`showNewsCardClean`)

1. Remove injected `<style>` tag
2. **Before showing card:** hide voting buttons, comments button, AI verdict inside the card
3. Override vote counts to "0" and comment count to "0 Comments"
4. `showWithAnimation(card)` → spring bounce
5. `highlightResult(card)` + `pulseElement(card, 4000)`

**Why hide engagement?** Showing everything at once is overwhelming. Revealing piece-by-piece teaches each element's purpose.

#### Step 5 — Vote (`revealVotingZero`)

`showWithAnimation` on voting buttons. Re-override counts to "0" (React may have re-rendered). User clicks spotlight → `handleUserAction` clicks `upBtn.click()` → sets count to "1".

#### Step 6 — Open Comments (`revealCommentsBtn`)

Show comments button. User clicks. `handleUserAction` calls `commentsBtn.click()` to mount the comment section.

#### Step 7 — Type Comment (`hideCommentsAndFillInput`)

1. Query all visible comment cards in `[data-tour="home-comment-section"]`
2. Grab text from the first card → use as the typed comment
3. Hide ALL comment cards → `hideElement` each
4. Type the extracted text into `[data-tour="home-comment-input"]` at 8ms/char
5. Wait for Post click

#### Step 8 — Stream Comments (`streamComments`)

```javascript
cards.forEach((c) => {
  c.style.opacity = '0';
  c.style.transform = 'translateX(-20px)';
});
for (let i = 0; i < cards.length; i++) {
  if (cards[i].dataset.tourHidden === 'true') showElement(cards[i]);
  cards[i].style.transition = 'all 0.4s cubic-bezier(0.34,1.56,0.64,1)';
  cards[i].style.opacity = '1';
  cards[i].style.transform = 'translateX(0)';
  await wait(280);
}
```

Each comment slides in from the left, 280ms apart —  impression of engagement streaming in real-time.

#### Step 9 — Evidence Links (`highlightEvidenceLink`)

Searches for a button containing "Evidence Link" text. Clicks it open to show the evidence URL input section. Highlights both the button and the expanded section.

#### Step 10 — Expert Voting Animation (`animateExpertVote`)

The most visually elaborate action. Creates a temporary DOM element:

```javascript
const badge = document.createElement('div');
badge.className = 'tour-expert-badge';
badge.style.cssText =
  'position:absolute;top:-36px;left:50%;transform:translateX(-50%);' +
  'background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;' +
  'padding:6px 16px;border-radius:20px;font-size:12px;font-weight:700;' +
  'box-shadow:0 4px 15px rgba(245,158,11,0.4);z-index:99999;white-space:nowrap;' +
  'animation:pulse-ring 1.5s infinite;';
badge.textContent = '🔍 Expert is analysing this comment...';
expertSection.appendChild(badge);
```

After 2000ms:
```javascript
badge.style.background = 'linear-gradient(135deg,#22c55e,#16a34a)';
badge.textContent = '👍 Expert Upvoted! Credibility score +1';
// Bump the upvote count
upEl.textContent = String(original + 1);
```

After 2000ms more, fade out and remove the badge. Teaches: experts evaluate comments, their votes affect credibility scores.

#### Step 11 — Group Comments

Highlight `[data-tour="home-group-comments"]`. User clicks. `handleUserAction` auto-clicks the button. **This triggers the real AI grouping API call.** Comments cluster in real time.

#### Step 12 — Highlighted Grouped View (`highlightGroupedView`)

After 800ms wait for group API + render:
```javascript
const groupFrames = section.querySelectorAll('.mb-4 .bg-blue-50, .mb-4');
groupFrames.forEach((frame, i) => {
  setTimeout(() => pulseElement(frame, 3000), i * 400);  // staggered pulse
});
```

#### Step 13 — AI Verdict (`revealAiVerdict`)

`showWithAnimation` on AI verdict section. User clicks → `handleUserAction` clicks the Generate button → **real Gemini 2.5 Flash API call** fires.

#### Step 14 — Verdict Rules

`isRulesStep: true` renders `<VerdictRulesPanel />` instead of description text. No action, user reads and advances.

#### Step 15 — Complete + Restore All (`unhideAllNewsData`)

```javascript
// 1. Restore all hidden elements
document.querySelectorAll('[data-tour-hidden="true"]').forEach((el) => showElement(el));
hiddenElementsRef.current.forEach((el) => showElement(el));

// 2. Restore original counts
if (upSpan?.dataset.tourOriginalText) upSpan.textContent = upSpan.dataset.tourOriginalText;
// same for downvote count, comment count

// 3. Cleanup
document.querySelectorAll('[data-tour-style]').forEach((s) => s.remove());
document.querySelectorAll('.tour-expert-badge').forEach((b) => b.remove());
unhighlightAll();
```

---

## 7. Core Logic Systems

### 7.1 The Hide → Type → Reveal Pattern

Every "posting a comment" sequence follows:

```
Step N:   hideElement(existing comment)
          selectStance()
          typeIntoInput()                ← types the SAME text as the hidden comment
          ── user clicks Send ──

Step N+1: await wait(1200ms)             ← wait for API + React re-render
          freshElement = findGroup() / findOffTopic()
          showWithAnimation(freshElement)
          popHighlight(freshElement)
```

**The magic:** The hidden comment and the typed text are identical. When the API processes it and the AI groups it, the hidden element is revealed in the correct group — giving the illusion that the comment "appeared" because of the posting action. In reality, it was always there.

### 7.2 Re-Query Pattern (Stale Reference Solution)

**Problem:** React re-renders after API responses → all stored DOM refs go stale.

**Solution:** Store only text identifiers. Re-query immediately before each DOM operation:

```javascript
// STORED during analysis:
{ multiGroupTitle: 'Economic Impact', multiGroupStance: 'for', multiGroupCommentTextPrefix: 'AI moderation can...' }

// RE-QUERIED during execution:
const group = findGroup('Economic Impact', 'for');            // fresh DOM node
const comment = findCommentInGroup(group, 'AI moderation can'); // fresh DOM node
```

### 7.3 SessionStorage Bridge

```
analyzeDebateRoom() [async] → sessionStorage.setItem('tour_multiCommentText', text)
                            ↓
buildDebateSteps() [sync]   → sessionStorage.getItem('tour_multiCommentText')
                            ↓
stepsRef.current = steps    → autoType.text = "AI moderation can efficiently..."
```

Step objects are plain JS objects built synchronously. The text was discovered asynchronously. SessionStorage is the synchronous bridge. Cleaned up in `handleClose()`:

```javascript
sessionStorage.removeItem('tour_multiCommentText');
sessionStorage.removeItem('tour_singleGroupText');
sessionStorage.removeItem('tour_counterGroupText');
sessionStorage.removeItem('tour_offTopicText');
```

---

## 8. State Management

### Why Local State Only

The component uses `useState` + `useRef` — no Redux, no Context. This is intentional:
- The tour is self-contained and must not affect the rest of the application
- Direct DOM manipulation bypasses React's VDOM anyway
- No other component needs to read tour state

### State → DOM Flow

```
currentStepIndex changes
  → useEffect (step executor) fires exec()
  → exec() modifies DOM directly (hideElement, highlightAction, typeIntoInput…)
  → exec() sets actionRunning, waitingForUser, waitAction
  → React re-renders panel content + spotlight + buttons based on those states
```

**Critical distinction:** The tour manipulates elements OUTSIDE its own component tree (news cards, debate groups, voting buttons). These are rendered by separate React components. The only cross-component API available is the DOM itself. That's why direct DOM manipulation is necessary here, not an anti-pattern.

### Cancellation Pattern

```javascript
let cancelled = false;
const exec = async () => {
  await wait(1200);
  if (cancelled) return;    // ← checked after EVERY await
  doSomething();
  await wait(500);
  if (cancelled) return;    // ← checked again
  doMoreStuff();
};
return () => { cancelled = true; };  // ← effect cleanup
```

Without this, skipping steps rapidly causes multiple `exec()` functions to race, producing unpredictable DOM mutations.

---

## 9. DOM Interaction Techniques

### 9.1 Native Prototype Setter (React Input Hack)

Covered in detail in the `typeIntoInput` section (4.8). The key insight:

```javascript
// React wraps the native 'value' property with its own getter/setter.
// Setting el.value = 'text' goes through React's wrapper, which MAY NOT trigger onChange.
// The native prototype setter bypasses React's wrapper and triggers the correct path.
const nativeSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
nativeSetter.call(el, newValue);
el.dispatchEvent(new Event('input', { bubbles: true }));
```

### 9.2 SVG Mask Spotlight

```jsx
<svg className="fixed inset-0 w-full h-full">
  <defs>
    <mask id="real-exp-mask">
      <rect width="100%" height="100%" fill="white" />    {/* everything visible */}
      {spotlightRect && (
        <rect x y width height rx="12" fill="black" />    {/* cut out spotlight */}
      )}
    </mask>
  </defs>
  <rect fill="rgba(0,0,0,0.55)" mask="url(#real-exp-mask)" />  {/* dark overlay */}
</svg>
```

**How SVG masks work:** White = visible through the overlay (shows the dark tint). Black = hidden from the overlay (transparent, reveals the page). The outer `fill="white"` makes the entire page dimmed. The inner `fill="black"` punches a hole at the spotlight coords.

**Why SVG instead of CSS box-shadow or clip-path?** SVG masks can be smoothly animated, support rounded corners (`rx="12"`), and work identically across browsers. CSS alternatives have performance issues or require complex border/shadow hacks.

### 9.3 Passthrough Click Div

```jsx
{spotlightRect && waitingForUser && (
  <div
    style={{
      position: 'fixed',
      left: spotlightRect.left,
      top: spotlightRect.top,
      width: spotlightRect.width,
      height: spotlightRect.height,
      background: 'transparent',
      pointerEvents: 'auto',
      zIndex: 99999,
    }}
    onClick={(e) => { e.stopPropagation(); handleUserAction(); }}
  />
)}
```

**Why?** The SVG overlay covers the entire screen with `pointerEvents: 'auto'`. Clicks on the spotlit area hit the overlay, not the element underneath. The transparent passthrough div sits at z-99999 exactly over the spotlight hole. When clicked, it calls `handleUserAction()` which programmatically clicks the real element.

`e.stopPropagation()` prevents the click from reaching the overlay's dismiss handler.

### 9.4 CSS Injection for Navigation Persistence

```javascript
const style = document.createElement('style');
style.setAttribute('data-tour-style', 'hide-first-card');
style.textContent = '[data-tour="home-first-news-card"] { display: none !important; }';
document.head.appendChild(style);
```

**Why `!important`?** React may set inline `display: block` on re-mount. `!important` in a `<style>` tag overrides inline styles.

**Why `data-tour-style` attribute?** Makes cleanup trivial:
```javascript
document.querySelectorAll('[data-tour-style]').forEach((s) => s.remove());
```

---

## 10. Visual Layer — Spotlight, Panel, Overlay

### Spotlight Tracking

The `requestAnimationFrame` loop calls `el.getBoundingClientRect()` ~60 times/second. The SVG mask rect updates every frame. Result: the spotlight tracks the element perfectly even during scroll or layout shift.

The pulsing ring is a plain div with the same coordinates:
```css
box-shadow: 0 0 0 3px rgba(59,130,246,0.5), 0 0 20px rgba(59,130,246,0.3);
animation: pulse-ring 2s ease-in-out infinite;
```

### Panel Positioning

`calcPanelPosition(targetRect)` runs in the rAF loop. The panel CSS uses:
```javascript
transition: 'top 0.4s ease, left 0.4s ease, bottom 0.4s ease, right 0.4s ease'
```
So when the target changes, the panel smoothly slides to its new position.

### Panel Content States

| Condition | Content |
|---|---|
| Normal | Icon + title + subtitle + description |
| `isRulesStep` | `<VerdictRulesPanel />` replaces description |
| `actionRunning` | Spinning indicator + "Working..." |
| `waitingForUser` | Bouncing badge: "👆 Click the highlighted element!" |
| `show*` action | Green badge: "✨ Result highlighted!" |
| `panelMinimized` | Single round emoji button |

### Progress Indicator

```javascript
const progress = ((currentStepIndex + 1) / steps.length) * 100;
```

- **Top bar**: gradient fill at `width: progress%`
- **Bottom dots**: active = wide (`w-4`), completed = small blue, upcoming = small gray

---

## 11. Cleanup & Resilience

### `handleClose()` — the 10-Step Cleanup

```javascript
const handleClose = useCallback(() => {
  // 1. Restore all hidden elements (attribute query — catches React re-mounts)
  document.querySelectorAll('[data-tour-hidden="true"]').forEach((el) => {
    showElement(el);
    el.style.opacity = ''; el.style.transform = ''; el.style.transition = ''; el.style.boxShadow = '';
  });

  // 2. Fallback: iterate ref array (catches elements where attribute was stripped)
  hiddenElementsRef.current.forEach((el) => { if (el) showElement(el); });
  hiddenElementsRef.current = [];

  // 3. Clear typed inputs
  clearedInputsRef.current.forEach((s) => clearInput(s));
  clearedInputsRef.current = [];

  // 4. Remove sessionStorage keys
  sessionStorage.removeItem('tour_multiCommentText');
  // ... all four keys

  // 5. Strip all highlight glows
  unhighlightAll();

  // 6. Disconnect MutationObserver
  if (observerRef.current) { observerRef.current.disconnect(); observerRef.current = null; }
  clubbedGroupDataRef.current = null;

  // 7. Remove injected <style> tags
  document.querySelectorAll('[data-tour-style]').forEach((s) => s.remove());

  // 8. Restore original vote/comment counts
  ['home-upvote-count', 'home-downvote-count', 'home-comments-count'].forEach((attr) => {
    const span = card?.querySelector(`[data-tour="${attr}"]`);
    if (span?.dataset.tourOriginalText) {
      span.textContent = span.dataset.tourOriginalText;
      delete span.dataset.tourOriginalText;
    }
  });

  // 9. Remove dynamic badges, reset animation styles
  document.querySelectorAll('.tour-expert-badge').forEach((b) => b.remove());
  document.querySelectorAll('[data-tour="home-comment-section"] .p-3').forEach((c) => {
    c.style.opacity = ''; c.style.transform = ''; c.style.transition = '';
  });

  // 10. Navigate home if on /submit-news, scroll to top, reset all state
  if (window.location.pathname === '/submit-news') navigate('/home');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  setCurrentStepIndex(0);
  setStepsReady(false);
  analysisRef.current = null;
  stepsRef.current = [];
  tourPhaseRef.current = '';
  onClose();
}, [onClose, navigate]);
```

### Dual Cleanup Strategy

| Strategy | Catches | Misses |
|---|---|---|
| `[data-tour-hidden="true"]` query | Elements React re-mounted with the attribute | Elements where React stripped data attributes |
| `hiddenElementsRef` array iteration | Original DOM nodes hidden by the tour | Stale refs to unmounted nodes (no-op on null) |

Both together guarantee complete restoration.

---

## 12. Key Design Decisions (The "Why")

### Why Direct DOM Manipulation?

The elements being manipulated (debate groups, news cards, voting buttons) are rendered by **separate React components**. `RealExperienceJourney` has no access to their props or state. The DOM is the only cross-component API.

### Why `data-tour="..."` Instead of CSS Classes?

```html
<!-- FRAGILE — breaks on any Tailwind change -->
<div class="mb-6 border rounded-lg p-4">

<!-- STABLE — explicitly marks tour targets -->
<div data-tour="debate-room-groups" class="mb-6 border rounded-lg p-4">
```

### Why Text Prefix Matching Instead of Index?

```javascript
// FRAGILE — breaks if a new comment is inserted above
container.children[1]

// ROBUST — survives re-ordering
Array.from(container.children).find(el => el.textContent.startsWith(prefix))
```

The AI may insert new comments at any position after grouping.

### Why Async Analyzer?

Reading collapsed groups requires expanding them first. Each expand is a click + 500ms wait. Sequential clicks × N groups = must be async.

### Why SessionStorage?

Step objects are built synchronously. Analyzed text is discovered asynchronously. SessionStorage is the synchronous bridge that's available at step-build time.

### Why `requestAnimationFrame` for Spotlight?

Layout shifts (scrolling, expanding, loading) would desync a one-time measurement. Continuous tracking (~60 FPS) keeps the spotlight perfectly aligned.

---

## 13. Advanced Patterns Deep-Dive

### 13.1 The MutationObserver Pattern (`showClubbedComment`)

This is the most complex action in the codebase. Here's the full flow:

```javascript
if (currentStep.action === 'showClubbedComment' && analysis) {
  // 1. Disconnect any previous observer
  if (observerRef.current) { observerRef.current.disconnect(); }

  // 2. Wait for API + React re-render after the comment post
  await wait(1500);

  const searchPrefix = (analysis.multiGroupCommentTextPrefix || '').slice(0, 40).trim();

  // 3. Define a helper to find the comment inside a container
  const findInContainer = (container) => {
    for (const child of Array.from(container.children)) {
      for (const p of child.querySelectorAll('p')) {
        const t = p.textContent?.trim() || '';
        if (t.startsWith(searchPrefix) && t.length > 20) return child;
      }
    }
    return null;
  };

  // 4. Scan EVERY group: expand temporarily, check if our comment is inside
  const allGroupCards = groupsContainer.querySelectorAll('.mb-6');
  let targetInnerCard = null;
  let targetExpandBtn = null;

  for (const groupCard of allGroupCards) {
    const innerCard = groupCard.querySelector('.rounded-lg.p-4.border');
    const wasOpen = !!innerCard?.querySelector('.mt-3.space-y-2');

    // Open if closed
    if (!wasOpen) { await expandGroup(groupCard); await wait(400); }

    const container = innerCard?.querySelector('.mt-3.space-y-2');
    if (container && findInContainer(container)) {
      targetInnerCard = innerCard;
      clubbedGroupDataRef.current = { groupCard, innerCard, searchPrefix };

      // 5. COLLAPSE the group — we want the USER to expand it
      await expandGroup(groupCard, true);  // force toggle
      await wait(350);

      // Re-query the button after collapse re-render
      targetExpandBtn = innerCard.querySelector('[data-tour="group-expand-btn"]');
      break;
    } else {
      // Not here — collapse it back if we opened it
      if (!wasOpen) { await expandGroup(groupCard, true); await wait(200); }
    }
  }

  if (targetInnerCard) {
    // 6. Style expand button with green halo
    if (targetExpandBtn) {
      targetExpandBtn.style.boxShadow = '0 0 0 5px rgba(34,197,94,0.9), 0 0 22px rgba(34,197,94,0.6)';
      targetExpandBtn.style.transform = 'scale(1.6)';
      targetExpandBtn.style.borderRadius = '50%';
      targetExpandBtn.style.background = 'rgba(34,197,94,0.15)';
    }

    // 7. Arm MutationObserver — waits for user to click expand
    observerRef.current = new MutationObserver(() => {
      const commentsContainer = targetInnerCard.querySelector('.mt-3.space-y-2');
      if (!commentsContainer) return;

      observerRef.current?.disconnect();  // fire only once

      setTimeout(() => {
        const foundComment = findInContainer(commentsContainer);
        if (foundComment) {
          if (foundComment.style.display === 'none') showWithAnimation(foundComment);
          popHighlight(foundComment);
          scrollToTarget(foundComment);
          Array.from(commentsContainer.children).forEach((c) => pulseElement(c, 3000));
          highlightResult(targetInnerCard);
        }
        // Auto-advance the tour
        setWaitingForUser(false);
        setWaitAction(null);
        setCurrentStepIndex((prev) => Math.min(prev + 1, stepsRef.current.length - 1));
      }, 400);
    });

    observerRef.current.observe(targetInnerCard, { childList: true, subtree: true });
  }
}
```

**The key idea:** The tour doesn't expand the group automatically. It collapses it, glows the expand button, and waits for the USER to expand it. A `MutationObserver` watches for the comments div to appear (`childList: true, subtree: true`). When it does — the user clicked expand — the observer fires and the tour auto-advances with highlighting.

**Skip fallback (`expandClubbedGroup` in handleUserAction):** If the user presses Skip instead of clicking the expand button, `handleUserAction` disconnects the observer and programmatically expands + highlights the group.

### 13.2 The CSS Navigation Persistence Pattern

During the news tour, the first news card must stay hidden across two route changes:

```
/home (card hidden) → /submit-news (card unmounted) → /home (card re-mounted)
```

Inline `display: none` is lost when the component unmounts. Solution:

```javascript
// On hide:
const style = document.createElement('style');
style.setAttribute('data-tour-style', 'hide-first-card');
style.textContent = '[data-tour="home-first-news-card"] { display: none !important; }';
document.head.appendChild(style);

// On reveal:
document.querySelectorAll('[data-tour-style]').forEach((s) => s.remove());
```

The `<style>` tag lives in `<head>`. React can't touch it. `!important` overrides any inline styles React applies on re-mount.

### 13.3 The Expert Vote Animation Pattern

Creates a temporary DOM element that's NOT React-managed:

```javascript
const badge = document.createElement('div');
badge.textContent = '🔍 Expert is analysing this comment...';
badge.style.cssText = 'position:absolute;top:-36px;left:50%;transform:translateX(-50%);...'
expertSection.appendChild(badge);

// Phase 2: success state
await wait(2000);
badge.style.background = 'linear-gradient(135deg,#22c55e,#16a34a)';
badge.textContent = '👍 Expert Upvoted! Credibility score +1';

// Phase 3: bump the count
const upEl = expertSection.querySelector('span.font-medium');
upEl.textContent = String(parseInt(upEl.textContent) + 1);

// Phase 4: fade out
await wait(2000);
badge.style.opacity = '0';
setTimeout(() => badge.remove(), 500);
```

The badge is absolutely positioned relative to `expertSection`. It floats above the comment, changes from amber to green, bumps the upvote count, then fades out. Cleanup: `document.querySelectorAll('.tour-expert-badge').forEach(b => b.remove())`.

### 13.4 The Counter Pair Matching in Chat View

When the user switches to Counter Chat View, the tour needs to find the specific paired thread:

```javascript
const threads = document.querySelectorAll('[data-tour="counter-chat-thread"]');
for (const thread of threads) {
  const groupCards = thread.querySelectorAll('[data-group-id]');
  for (const card of groupCards) {
    // Match by title
    const titleText = card.querySelector('h3')?.textContent?.trim();
    if (counterTitle && titleText === counterTitle) { matchedThread = thread; break; }

    // Match by comment text prefix
    const commentsSection = card.querySelector('.comments-section');
    for (const p of commentsSection?.querySelectorAll('p') || []) {
      if (p.textContent?.trim()?.startsWith(counterPrefix)) { matchedThread = thread; break; }
    }
  }
}
```

Once found, both cards in the thread get `popHighlight()`, and their "Show N comments" buttons are auto-clicked.

---

## 14. Integration Points & data-tour Contracts

The tour system depends on `data-tour` attributes placed on elements in other components. Here's the complete list:

### Debate Room Components

| Attribute | Component | Element |
|---|---|---|
| `data-tour="debate-room-groups"` | DebateRoom | Groups container div |
| `data-tour="debate-room-comment-input"` | DebateRoom | Comment form (contains textarea + radio buttons) |
| `data-tour="group-expand-btn"` | GroupCard | Chevron expand button |
| `data-tour="debate-ideal-counter-btn"` | GroupCard | "Ideal counters" button |
| `data-tour="debate-room-counter-links"` | GroupCard | Counter-link badges container |
| `data-tour="debate-counter-chat-btn"` | DebateRoom | Counter Chat View toggle |
| `data-tour="debate-room-view-toggle"` | DebateRoom | View toggle (Group/Counter Chat) |
| `data-tour="debate-room-ungrouped"` | DebateRoom | Off-topic/ungrouped section |
| `data-tour="counter-chat-thread"` | CounterChatView | Each paired thread |

### News Feed Components

| Attribute | Component | Element |
|---|---|---|
| `data-tour="home-first-news-card"` | NewsFeed | First news card |
| `data-tour="home-submit-news"` | NewsFeed | Submit News button |
| `data-tour="home-voting-buttons"` | NewsCard | Voting button container |
| `data-tour="home-upvote-count"` | NewsCard | Upvote count span |
| `data-tour="home-downvote-count"` | NewsCard | Downvote count span |
| `data-tour="home-comments-btn"` | NewsCard | Comments button |
| `data-tour="home-comments-count"` | NewsCard | Comments count span |
| `data-tour="home-comment-section"` | CommentSection | Comment section root |
| `data-tour="home-comment-card"` | CommentCard | Individual comment card |
| `data-tour="home-comment-input"` | CommentSection | Comment input textarea |
| `data-tour="home-group-comments"` | CommentSection | "Group by Topic" button |
| `data-tour="home-ai-verdict"` | NewsCard | AI verdict section |

### Submit Page

| Attribute | Component | Element |
|---|---|---|
| `data-tour="submit-form-container"` | SubmitNews | Form container |
| `data-tour="submit-title"` | SubmitNews | Title input |
| `data-tour="submit-description"` | SubmitNews | Description textarea |
| `data-tour="submit-link"` | SubmitNews | Link input |
| `data-tour="submit-button"` | SubmitNews | Submit button |

**Contract rule:** If any of these attributes are renamed or removed in the target components, the corresponding tour step breaks silently (element not found, action skipped).

---

## 15. Edge Cases & Error Handling

### No Groups Exist (Brand New Debate Room)

`isUngroupedOnly = true` activates. Ungrouped `.border-l-4` comments are categorized by border color and assigned roles. The tour works entirely with individual comment cards instead of groups.

### Not Enough Comments for All Roles

The analyzer has fallback cascades:
- Multi-comment: try `forGroups[0]`, then `allGroups[0]`, then DEBATE_MOCK.similar
- Single-comment: try `singleCommentGroups[0]`, then `allGroups[1]`, then DEBATE_MOCK.newGroup
- Counter: try opposite-stance pool, then DEBATE_MOCK.counter
- Off-topic: try `.border-l-4`, then DEBATE_MOCK.offTopic

### React Re-renders During Tour

Two safeguards:
1. `data-tour-hidden="true"` attribute survives re-renders (React preserves data attributes)
2. Re-query helpers (`findGroup`, `findCommentInGroup`, `findOffTopic`) always get fresh DOM nodes

### User Closes Tour Mid-Step

`handleClose()` runs the full 10-step cleanup. The `cancelled` flag in the running `exec()` prevents further DOM mutations.

### Page Loads Slowly

The 600ms analysis delay gives the DOM time to render. If elements still aren't found, the analyzer returns empty strings and mock fallbacks are used.

### User Rapidly Clicks Next

The `cancelled` flag pattern prevents race conditions. Only one `exec()` function can be active at a time.

### Target Element Not Found

```javascript
const el = document.querySelector(currentStep.target);
if (el) {
  // spotlight + position
} else {
  setSpotlightRect(null);  // no spotlight, panel goes to default position
}
```

The tour continues with the panel in the bottom-right corner. The step's action may skip silently.

---

## 16. Debugging Guide

### Common Issues

**"Spotlight is in the wrong position"**
- Check if `data-tour` attribute exists on the target element
- Check if the element is inside a scrollable container (spotlight tracks `getBoundingClientRect` which handles scroll)
- Check if another element with the same `data-tour` attribute exists above it

**"Text isn't typing into the input"**
- Check if the input is a `<textarea>` or `<input>` (the native setter differs)
- Check if the input has the correct `data-tour` attribute
- Check browser DevTools console for `nativeSetter` being null (would mean the prototype descriptor doesn't exist in this browser)

**"Hidden element isn't restored on close"**
- Check if `data-tour-hidden="true"` attribute is present on the element in DevTools
- Check if React re-rendered the component (the attribute may have been stripped if React replaced the element entirely)
- The ref array fallback should catch it

**"MutationObserver never fires (showClubbedComment stuck)"**
- Check console logs: `[DBG showClubbedComment]` traces show exactly what happened
- Verify the comment was found during scanning: "✓ comment is in group: ..."
- Verify the observer was armed: "MutationObserver armed on innerCard ✓"
- If the group was already open, the observer won't fire (no mutation). User should use Skip.

**"Tour breaks after navigating between pages"**
- Check `tourPhaseRef.current` — should be `'news-submit'` on `/submit-news`, `'news-back'` on `/home`
- Check if the CSS `<style>` tag with `data-tour-style="hide-first-card"` exists in `<head>`
- The analysis `useEffect` should skip re-analysis when the phase is mid-tour

### Console Logging

Every action logs to the console with prefixes:
- `[Tour]` — general tour events
- `[Action]` — step action execution
- `[Analyzer]` — debate/news analyzer
- `[DBG showClubbedComment]` — detailed MutationObserver debugging
- `[DBG highlightIdealCounterBtn]` — ideal counter button debugging
- `[DBG highlightCounterPairInChat]` — counter pair matching debugging
- `[findGroup]` / `[findCommentInGroup]` / `[findOffTopic]` — re-query helpers

In Chrome DevTools, filter by these prefixes to isolate specific subsystems.

---

*End of RealExperienceJourney Documentation — v4*
