# RealExperienceJourney — Complete Feature Documentation

> Version 3 · Interactive Live Tour System  
> Location: `frontend/src/components/RealExperienceJourney/`

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

---

## 1. What Is This Feature?

**RealExperienceJourney** is a fully interactive, page-aware guided tour system. Instead of showing screenshots or popups with generic text, it operates on the **live, real application data** while the user watches.

It does three things simultaneously:

| Layer | What happens |
|---|---|
| **Visual** | Dims the whole page. A spotlight cutout highlights the exact element being discussed. A floating panel explains what's happening. |
| **Automation** | Types real text into inputs, clicks buttons, expands accordions, navigates between pages — all without user effort. |
| **Narrative** | Tells the user a story: "this comment was typed → AI grouped it here → look at the result". |

There are **two separate tours** served by the same component:

- **Debate Room Tour** — demonstrates AI comment grouping, counter-linking, ideal counter suggestions, and off-topic moderation.
- **News Feed Tour** — walks through the full news lifecycle: submission → voting → commenting → AI grouping → AI verdict.

---

## 2. Why We Built It

### The Problem

The platform is technically complex. A new user landing on the News Feed or a Debate Room sees buttons, badges, and sections that require explanation. Traditional "tooltip overlays" tell users *where* things are, but never *show* why they matter.

### The Solution

We needed a tour that:

1. **Uses real data** — not mocked screenshots. If the debate room has actual comments, we extract their text and replay the exact action.
2. **Teaches by doing** — the user watches a comment being typed character by character, then sees the AI instantly group it. The cause→effect is undeniable.
3. **Works on the live DOM** — hiding existing results, then revealing them as if they just happened teaches the UI patterns without needing a sandbox environment.
4. **Does not break the app** — every element hidden during the tour is perfectly restored on close.

---

## 3. Architecture Overview

```
RealExperienceJourney/
├── index.jsx              ← Main React component (controller)
├── constants.js           ← Static data: AI verdict rules, mock fallback text
├── debateAnalyzer.js      ← Async analyzer: reads live DOM, expands groups
├── newsAnalyzer.js        ← Synchronous analyzer: reads first news card
├── debateSteps.js         ← Step definitions for debate tour (12 steps)
├── newsSteps.js           ← Step definitions for news tour (14 steps)
├── hideShow.js            ← DOM visual utilities: hide, show, highlight, expand
├── domHelpers.js          ← Low-level DOM: wait, scroll, typeIntoInput, clearInput
├── panelPosition.js       ← Panel placement calculator (4-direction fit algorithm)
└── VerdictRulesPanel.jsx  ← React sub-component for AI verdict rules display
```

### Dependency Graph

```
index.jsx
  ├── debateAnalyzer.js   (uses domHelpers + hideShow + constants)
  ├── newsAnalyzer.js     (uses constants)
  ├── debateSteps.js      (uses constants)
  ├── newsSteps.js        (uses constants)
  ├── hideShow.js         (uses domHelpers)
  ├── domHelpers.js
  ├── panelPosition.js
  └── VerdictRulesPanel.jsx (uses constants)
```

---

## 4. File-by-File Breakdown

---

### 4.1 `index.jsx` — The Main Controller

**Purpose:** The brain of the entire system. It manages state, executes step actions, controls the visual overlay, handles user interactions, and orchestrates navigation.

#### Props

```jsx
<RealExperienceJourney
  isOpen={boolean}       // Mount/unmount the tour
  onClose={function}     // Called when tour ends
  currentPath={string}   // e.g. '/home', '/debate-room/123', '/submit-news'
/>
```

#### Key State Variables

| State | Type | Purpose |
|---|---|---|
| `currentStepIndex` | number | Which step in the tour is active |
| `spotlightRect` | object\|null | `{left, top, width, height}` of the highlighted element |
| `panelPos` | object | CSS position for the floating panel |
| `actionRunning` | boolean | True while async step action is executing |
| `waitingForUser` | boolean | True when user must click a highlighted element |
| `waitAction` | string\|null | Which action to perform when user clicks (`'send'`, `'vote'`, `'navigate-submit'`, …) |
| `stepsReady` | boolean | Whether analyzer has finished and steps are built |

#### Key Refs

| Ref | Purpose |
|---|---|
| `hiddenElementsRef` | Array of all DOM elements hidden during the tour (for cleanup) |
| `clearedInputsRef` | Array of input selectors that were auto-typed (for cleanup) |
| `analysisRef` | Stores the result from `analyzeDebateRoom()` or `analyzeNewsFeed()` |
| `stepsRef` | The array of step objects (kept in a ref to avoid dependency loops) |
| `tourPhaseRef` | `'debate'` / `'news-home'` / `'news-submit'` / `'news-back'` |
| `animFrameRef` | `requestAnimationFrame` handle for spotlight tracking loop |

#### The Three Core `useEffect` Hooks

**Hook 1: Page Analysis (`[isOpen, currentPath]`)**

Fires 600 ms after `isOpen` becomes `true` (giving React time to finish rendering before reading the DOM).

```
if debate page → await analyzeDebateRoom() → buildDebateSteps(analysis)
if home/submit  → analyzeNewsFeed() → buildNewsSteps(analysis)
→ setStepsReady(true)
```

Why 600 ms delay? The DOM—especially grouped comments from an API—may not be rendered yet. A small delay ensures selectors will find their targets.

**Hook 2: Spotlight Tracking (`[isOpen, currentStep]`)**

Runs a `requestAnimationFrame` loop that continuously re-measures the target element's bounding rect and updates `spotlightRect`. This keeps the spotlight perfectly positioned even when the page scrolls or re-renders.

Why continuous tracking instead of one-time measurement? The page height changes as comments load, accordions expand, etc. Continuous tracking ensures the spotlight never drifts.

**Hook 3: Step Action Executor (`[isOpen, currentStepIndex, stepsReady]`)**

The heaviest hook. Each time the step index changes, it runs an async function `exec()` that:

1. Resets highlights.
2. Scrolls to the step's `target` selector.
3. Reads `currentStep.action` and performs the matching DOM manipulation.
4. Runs stance selection, auto-type, send-button highlight.
5. Sets `waitingForUser = true` if the step requires a user click.

The hook returns a `cancelled` flag cleanup — if the user skips the step before `exec()` finishes, all async operations stop gracefully.

---

### 4.2 `constants.js` — Static Data

**Purpose:** Single source of truth for two types of data:

#### `AI_VERDICT_RULES`

An object with five arrays used by the `VerdictRulesPanel`. It describes:
- `scoring` — credibility score ranges (0–100) with color codes
- `topCommentSelection` — how AI picks which comments to analyze
- `credibilityFactors` — how expert votes are weighted
- `aiEvaluation` — what dimensions Gemini evaluates
- `verificationThresholds` — voting thresholds for community verdict

These rules are surfaced in the `news-verdict-rules` step of the news tour so the user understands the exact algorithm.

#### `DEBATE_MOCK` / `NEWS_MOCK`

Fallback text used **only** when live DOM extraction fails. For example, if the debate room has no groups at all (brand new room), the typed comments still look realistic because they fall back to carefully-written example text. This guarantees the tour never shows empty inputs.

---

### 4.3 `debateAnalyzer.js` — Debate Room DOM Analyzer

**Purpose:** Reads the live debate room DOM, expands all collapsed comment groups, and extracts enough metadata to drive 12 tour steps.

#### Why it's async

The analyzer must expand group accordions (each `expandGroup()` call fires a click and waits 400 ms for the animation) before it can read the comment text inside them. This makes it inherently async. It's `await`ed behind a loading screen in `index.jsx`.

#### What it extracts

The analyzer categorizes groups by stance (`for` / `against`) and comment count:

```
multiCommentGroup  → group with > 1 comment (pick one comment to hide/retype)
singleCommentGroup → group with ≤ 1 comment (hide the WHOLE group card)
counterGroup       → opposite-stance group to singleGroup (shows counter-linking)
offTopicElement    → ungrouped ".border-l-4" comment (demonstrates moderation)
```

For each target it stores **text-based identifiers** (title, stance, 60-char text prefix) — not DOM references. This is critical because React unmounts and remounts components between API calls, making stored DOM refs stale.

#### `isUngroupedOnly` mode

If the debate room has zero groups (only ungrouped comments), the analyzer activates a fallback path. It categorizes the ungrouped `.border-l-4` comment cards by border color (green = "for", red = "against", gray = "neutral") and assigns roles accordingly. The tour still works; it just hides/shows ungrouped comment cards instead of group cards.

#### Re-query helpers

**Why?** After the user sends a comment, React re-renders the entire group list. Any DOM reference stored before the post is now dead. The three helper functions are pure DOM queries called at render time — they always find the fresh node.

```javascript
findGroup(title, stance)
// Walks [data-tour="debate-room-groups"] > .mb-6, matches by h3 text + badge text

findCommentInGroup(groupCard, textPrefix)
// Inside a group card's expanded comment list, matches the p.text-sm.mb-3 text

findOffTopic(textPrefix)
// Searches all .border-l-4 elements globally, matches by the p tag text
```

---

### 4.4 `newsAnalyzer.js` — News Feed DOM Analyzer

**Purpose:** Synchronously reads the first news card's content before hiding it, so the form-fill step can type the **exact same title, description, and link** that was already in the feed.

Why? The tour demo creates a sense of "you submitted this exact article". If the tour typed random mock text and then the same article appeared in the feed, it would look fake. By extracting the real data, the submitted article title matches the card that appears.

#### Selectors used

```javascript
firstCard.querySelector('h3 a')          // title + link
firstCard.querySelector('.prose p')       // description (tries 3 fallback selectors)
```

Falls back to `NEWS_MOCK` if the DOM hasn't loaded yet.

---

### 4.5 `debateSteps.js` — Debate Step Definitions

**Purpose:** Returns an array of 12 step objects that define the debate tour narrative.

#### Step Object Schema

```javascript
{
  id: string,               // unique step identifier
  icon: string,             // emoji shown in panel header
  title: string,            // bold panel title
  subtitle: string,         // muted subtitle
  description: string,      // narrative text (supports \n for line breaks)
  gradient: string,         // Tailwind gradient classes (progress bar + icon bg changes per step)
  target: string | null,    // CSS selector for spotlight + panel positioning
  action: string,           // key that index.jsx matches to run DOM code
  stanceToSelect: 'for' | 'against', // auto-select radio in debate comment form
  autoType: { selector, text },       // auto-type config
  highlightSendBtn: boolean,          // highlight the form submit button
  highlightClickTarget: boolean,      // highlight the target element
  waitForClick: string,               // pause tour, wait for user click
  isRulesStep: boolean,               // render VerdictRulesPanel instead of description text
}
```

Not every step uses every field. `index.jsx` checks each field independently with `if (currentStep.X)` guards.

#### The 12 Debate Steps at a Glance

| # | Step ID | What happens |
|---|---|---|
| 1 | `debate-welcome` | Intro card, no target |
| 2 | `debate-type-similar` | Hide existing multi-comment → select "For" → type similar text → wait for send |
| 3 | `debate-show-clubbed` | Re-query group → expand it → pop-highlight the freshly added comment |
| 4 | `debate-type-new` | Hide single-comment group → select "For" → type unique text → wait for send |
| 5 | `debate-show-new-group` | Re-query and reveal the single group with animation |
| 6 | `debate-click-ideal-counter` | Highlight "Ideal counters" button → wait for user click |
| 7 | `debate-type-counter` | Hide counter group → select "Against" → type counter text → wait for send |
| 8 | `debate-show-counter` | Reveal counter group → highlight counter-link badges |
| 9 | `debate-counter-chat` | Highlight "Counter Chat View" toggle → wait for user click |
| 10 | `debate-type-offtopic` | Hide off-topic comment → select "For" → type off-topic text → wait for send |
| 11 | `debate-show-offtopic` | Reveal the off-topic card in the ungrouped section |
| 12 | `debate-complete` | Summary card listing all 6 AI features demonstrated |

---

### 4.6 `newsSteps.js` — News Step Definitions

**Purpose:** Returns an array of 14 step objects for the full news verification lifecycle.

#### The 14 News Steps at a Glance

| # | Step ID | What happens |
|---|---|---|
| 1 | `news-welcome` | Intro card; hides the first news card (`hideNewsCard`) |
| 2 | `news-goto-submit` | Highlight "Submit News" button → wait for user; navigate to `/submit-news` |
| 3 | `news-fill-form` | Auto-type title, description, link into the submission form |
| 4 | `news-submit-form` | Highlight submit button → wait; navigate back to `/home` |
| 5 | `news-appeared` | Reveal card WITHOUT engagement (voting/comments/verdict still hidden) |
| 6 | `news-vote` | Reveal voting buttons → highlight → wait for user click (auto-clicks upvote) |
| 7 | `news-open-comments` | Reveal comments button → highlight → wait (auto-clicks it) |
| 8 | `news-type-comment` | Auto-type evidence comment into comment input → wait for post |
| 9 | `news-comments-stream` | Animate existing comments sliding in from the left |
| 10 | `news-expert-voting` | Highlight the first comment card → explain expert voting |
| 11 | `news-group-comments` | Highlight "Group by Topic" → wait (auto-clicks it) |
| 12 | `news-ai-verdict` | Reveal AI verdict section → highlight → wait (auto-clicks generate) |
| 13 | `news-verdict-rules` | Show `VerdictRulesPanel` with full scoring algorithm |
| 14 | `news-complete` | Summary listing entire 3-tier verification stack |

---

### 4.7 `hideShow.js` — Visual DOM Utilities

**Purpose:** All functions that visually manipulate elements by directly writing inline CSS styles.

#### `hideElement(el)`

```javascript
el.dataset.tourOriginalDisplay = computedDisplay;  // save original
el.dataset.tourHidden = 'true';                    // mark for cleanup
el.style.display = 'none';
```

Why save `tourOriginalDisplay`? Elements may have `display: flex` or `display: grid`, not just `block`. Restoring to `block` would break their layout. This preserves the original value.

Why `data-tour-hidden="true"`? Enables a DOM-wide cleanup query: `document.querySelectorAll('[data-tour-hidden="true"]')`. Even if the `hiddenElementsRef` array is stale (e.g., React replaced the node), the attribute cleanup catches everything.

#### `showElement(el, displayVal)` / `showWithAnimation(el, displayVal)`

`showElement` : immediate restore without animation.

`showWithAnimation` : uses CSS `cubic-bezier(0.34,1.56,0.64,1)` spring animation — element drops in from above with a slight bounce. Used for the "reveal" steps to make the appearance feel like real-time AI output.

#### `pulseElement(el, duration)`

Applies a blue `box-shadow` glow for `duration` ms. Used to draw attention to newly added comments inside a group.

#### `highlightResult(el)` / `highlightAction(el)` / `popHighlight(el)`

Three tiers of emphasis:
- `highlightResult` — green glow. "This is the result of the AI operation."
- `highlightAction` — yellow glow. "Click this."
- `popHighlight` — green glow + scale(1.04) + translateY(-6px) spring bounce + green outline. "This just appeared!"

#### `unhighlightAll()`

Queries all `[style]` elements and strips box-shadow from any that have a glow color matching the tour's color palette (blue `59,130,246`, green `34,197,94`, yellow `234,179,8`). Called at the start of every step to prevent glow-accumulation.

#### `expandGroup(groupCard, force)`

Finds the chevron button inside a group's inner card (`.rounded-lg.p-4.border`) and clicks it if the group is collapsed. Waits 400 ms for the animation before returning. Used by the analyzer to expand all groups before reading comment text.

#### `selectStance(stance)`

Finds the `input[type="radio"][value="for"|"against"]` inside `[data-tour="debate-room-comment-input"]`, clicks it, and applies a colored glow to the label so the user sees which stance was selected.

---

### 4.8 `domHelpers.js` — Low-Level DOM Utilities

**Purpose:** Primitive building blocks used by everything else.

#### `wait(ms)`

```javascript
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));
```

Simple promisified `setTimeout`. Used throughout for:
- Waiting for React to re-render after an API call.
- Staggering animations so they're visible.
- Waiting for CSS transitions to complete.

#### `scrollToTarget(selector)`

Calls `el.scrollIntoView({ behavior: 'smooth', block: 'center' })` and resolves after 600 ms to ensure the scroll is complete before the next action runs.

#### `typeIntoInput(selector, text, speed = 35)`

The most technically subtle function. React controls `<input>` and `<textarea>` values — you cannot simply set `el.value =` because React's virtual DOM will overwrite it. The correct technique:

```javascript
const nativeSetter = Object.getOwnPropertyDescriptor(
  HTMLTextAreaElement.prototype, 'value'
).set;

nativeSetter.call(el, text.slice(0, i));           // Bypass React's setter
el.dispatchEvent(new Event('input', { bubbles: true })); // Trigger React onChange
```

Why `nativeSetter`? React wraps native `<input>` elements with synthetic event handlers. Setting `el.value` directly bypasses React because React has already stored its own setter reference. By invoking the native prototype setter (the one React itself used to subscribe to), we correctly trigger React's `onChange` → state update cycle.

The function types one character at a time on a `setInterval(speed)` timer. The default speed is 35 ms/char. The tour uses 6–10 ms for longer texts (description fields) to avoid making the user wait.

#### `clearInput(selector)`

The reverse of `typeIntoInput`. Sets value to `''` and fires an `input` event. Called after the user clicks Send, so the comment form is empty ready for the next step.

---

### 4.9 `panelPosition.js` — Smart Panel Placement

**Purpose:** Positions the floating guide panel so it never overlaps the spotlit element. Tries four positions in priority order.

```
Priority 1: Right of target (if room exists)
Priority 2: Left of target
Priority 3: Below target
Priority 4: Above target
Fallback:   Bottom-right corner
```

For each candidate it checks: `targetRect edge ± GAP(16px) ± panelW/H < viewport size - 16px margin`.

Why this matters: On mobile or when a target element is wide (like a full-width news card), "right of target" has no room. The calculator ensures the panel always fits without clipping.

---

### 4.10 `VerdictRulesPanel.jsx` — AI Rules UI Component

**Purpose:** A pure presentational component rendered inside the guide panel at the `news-verdict-rules` step. It replaces the normal `description` text with a structured, scrollable breakdown of the AI verdict algorithm.

Reads all data from `AI_VERDICT_RULES` in `constants.js`, rendering five sections:

1. **Credibility Score Ranges** — colored squares + numeric ranges
2. **Top Comment Selection** — how comments are chosen for AI input
3. **Comment Credibility** — expert voting weight system
4. **AI Evaluation Criteria** — five dimensions Gemini analyzes
5. **Voting Thresholds** — when community verdict changes status

Why a separate component? The rules panel has its own scroll container (`max-h-60 overflow-y-auto`) and complex markup. Keeping it isolated keeps `index.jsx` clean and makes the rules easy to update independently.

---

## 5. Complete Tour Flow — Debate Room

### Entry Condition

The user opens the tour while on a URL matching `/debate-room/*`.

### Phase 0: Analysis (behind loading screen)

```
analyzeDebateRoom() [async, ~1-2 seconds]
  └─ expandGroup() × N groups         [clicks chevrons, waits 400ms each]
  └─ categorize into for/against
  └─ pick multi, single, counter, offTopic
  └─ store text in sessionStorage
  └─ return metadata object
→ buildDebateSteps(analysis) → 12 step objects
→ setStepsReady(true) → loading screen unmounts
```

### Step-by-Step Walkthrough

#### Step 1 — Intro Card
- No target, no action.
- Shows welcome message explaining what the tour will demonstrate.
- User presses Next →.

#### Step 2 — Type Similar Comment → "Post a Similar Comment"
- **Before typing (action: `hideMultiComment`)**: The tour hides the existing comment that the user is about to "re-post". This makes the next step's reveal meaningful — the comment was gone, now it's back.
- **Why hide it beforehand?** If the comment was already visible, the "showClubbedComment" reveal step would have no impact. Hiding first creates the before/after contrast.
- Stance "For" is auto-selected via `selectStance('for')`.
- `typeIntoInput` types the extracted (or mock) comment text at ~8 ms/char.
- The Send button is highlighted with `highlightAction`.
- `waitingForUser = true`, `waitAction = 'send'`.
- The spotlight passes clicks through to the actual send button (a transparent div is overlaid on the spotlit area).

#### Step 3 — Show Clubbed Comment → "Comment Clubbed Into Group!"
- **Action: `showClubbedComment`**: Waits 1,200 ms for the API + React re-render.
- Fresh-queries the group with `findGroup(title, stance)`.
- Expands it if collapsed.
- Finds the specific comment with `findCommentInGroup(group, textPrefix)`.
- If the comment was still hidden by `display: none`: calls `showWithAnimation()`.
- If React re-rendered it fresh (display is not none): skips show, just highlights.
- Applies `popHighlight` (spring bounce) + `pulseElement` to nearby comments.
- Scrolls the comment into view.

#### Step 4 — Type Unique Comment → "Post a Unique Comment"
- **Action: `hideSingleComment`**: Hides the entire single-comment group card (not just one comment). This group will reappear as if "newly created" in the next step.
- Stance "For", type unique text, highlight send, wait for user.

#### Step 5 — Show New Group → "New Group Created!"
- **Action: `showNewGroup`**: Fresh-queries the group, calls `showWithAnimation` (spring drop-in).
- This teaches the user: unique comment → AI auto-creates group with title + description.

#### Step 6 — Ideal Counter Button → "Ideal Counter-Arguments"
- **Action: `highlightIdealCounterBtn`**: Finds `[data-tour="debate-ideal-counter-btn"]`, scrolls to first one, applies purple glow + scale(1.12).
- `waitForClick: 'idealCounterBtn'` → tour pauses.
- When user clicks the spotlit area, `handleUserAction` programmatically clicks the button via `idealBtn.click()` and advances.
- This teaches: each group has AI-generated guidance on what opposing arguments should address.

#### Step 7 — Type Counter-Argument → "Post a Counter-Argument"
- **Action: `hideCounterComment`**: Hides the counter group (opposite stance to the single group).
- Stance "Against" (important — the AI needs an opposing stance signal).
- Types counter-argument text, highlights send, waits.

#### Step 8 — Show Counter-Link → "Counter-Link Established!"
- **Action: `showCounterGroup`**: Reveals the counter group with animation.
- After reveal, finds `[data-tour="debate-room-counter-links"]` buttons and applies an orange glow to them — teaching the user to look for the "Linked" badge.
- This teaches: the AI pair-linked two opposing groups with a match percentage.

#### Step 9 — Counter Chat View → "Counter Chat View"
- **Action: `highlightCounterChatBtn`**: Finds `[data-tour="debate-counter-chat-btn"]`, applies blue glow, scrolls to top.
- `waitForClick: 'counterChatBtn'` → user must click it.
- `handleUserAction` calls `counterChatBtn.click()` then waits 600 ms for the view toggle to animate.
- This teaches: a special layout shows for/against arguments side-by-side.

#### Step 10 — Type Off-Topic Comment → "Post an Off-Topic Comment"
- **Action: `hideOffTopicComment`**: Hides the existing off-topic ungrouped comment.
- Stance "For", types unrelated comment, highlights send, waits.

#### Step 11 — Show Off-Topic → "Off-Topic Detected!"
- **Action: `showOffTopic`**: Reveals the comment via `findOffTopic(textPrefix)`.
- Also scrolls to `[data-tour="debate-room-ungrouped"]` and highlights the whole section.
- This teaches: off-topic comments don't pollute the main debate — they're isolated but preserved.

#### Step 12 — Debate Tour Complete
- Summary card. User presses Finish ✓.
- `handleClose()` runs full cleanup.

---

## 6. Complete Tour Flow — News Feed

### Entry Condition

User opens tour while on `/home` or `/submit-news`.

### Phase 0: Analysis (synchronous)

```
analyzeNewsFeed()
  └─ read first news card's h3 > a (title + link)
  └─ read p.text-gray-700 (description)
  └─ return { newsTitle, newsDescription, newsLink }
→ buildNewsSteps(analysis) → 14 step objects
→ setStepsReady(true)
```

### Page Navigation Lifecycle

The news tour involves **two page navigations**:

```
/home (Step 1) → /submit-news (Steps 3–4) → /home (Steps 5–14)
```

`tourPhaseRef` tracks this:
- `'news-home'` — initial home page analysis
- `'news-submit'` — after navigating to submit page
- `'news-back'` — after returning home

When `isOpen` and `currentPath` change together (navigation), the `useEffect` for analysis checks `tourPhaseRef` to decide whether to skip re-analysis (the steps are already built).

### Step-by-Step Walkthrough

#### Step 1 — Welcome + Hide Card
- **Action: `hideNewsCard`**: Finds `[data-tour="home-first-news-card"]` and hides it.
- **Also injects a `<style>` tag**: `[data-tour="home-first-news-card"] { display: none !important; }` — this CSS persists through React re-renders and navigation changes, ensuring the card stays hidden even after route transitions.
- Why both? The `hideElement()` call sets inline `display:none`. But navigating away and back causes React to unmount/remount the component, clearing inline styles. The injected CSS survives.

#### Step 2 — Navigate to Submit
- Highlight `[data-tour="home-submit-news"]`.
- `waitForClick: 'navigate-submit'` → user clicks.
- `handleUserAction` calls `navigate('/submit-news')` and advances after 800 ms.

#### Step 3 — Auto-Fill Form
- **Action: `autoFillNewsForm`**: Types title (8 ms/char), description (6 ms/char), link (10 ms/char) into the three form inputs.
- Uses **the real extracted text** from the analyzer, so the submitted article matches the card on home.

#### Step 4 — Submit Form → Navigate Home
- Highlight `[data-tour="submit-button"]`.
- `waitForClick: 'navigate-home'` → user clicks.
- `handleUserAction` clears typed inputs, re-injects the CSS hide rule, calls `navigate('/home')`, advances after 1,000 ms.

#### Step 5 — Card Appeared (Without Engagement)
- **Action: `showNewsCardWithoutEngagement`**:
  1. Removes the injected CSS style tag.
  2. Hides voting buttons, comments button, AI verdict section (pushes them to `hiddenElementsRef`).
  3. Calls `showWithAnimation(card)` → card springs in.
  4. Applies `highlightResult` + `pulseElement`.
- Why hide engagement elements? Showing a card with voting buttons already there would be confusing. The tour reveals them one by one in the next three steps, teaching what each element does.

#### Step 6 — Vote
- **Action: `revealVoting`**: `showWithAnimation` on voting buttons.
- `waitForClick: 'vote'` → `handleUserAction` programmatically clicks the first (upvote) button via `upBtn.click()` then advances without requiring an actual user click on the button. The spotlight click area acts as the trigger.
- Explains: ≥5 votes needed, threshold rules.

#### Step 7 — Open Comments
- **Action: `revealCommentsBtn`**: `showWithAnimation` on comments button.
- `waitForClick: 'open-comments'` → `handleUserAction` calls `commentsBtn.click()` → waits 600 ms for comment section to mount.

#### Step 8 — Type Comment
- `typeIntoInput` with `NEWS_MOCK.comment` at default 35 ms/char.
- Highlights the post button.
- `waitForClick: 'post-comment'` → advances.

#### Step 9 — Stream Comments
- **Action: `streamComments`**: Queries all `.p-3.bg-gray-50` comment cards, sets them all to `opacity: 0; transform: translateX(-20px)`, then iterates through them 280 ms apart, animating each in.
- This gives a visual impression of engagement arriving in real time.

#### Step 10 — Expert Voting
- **Action: `highlightExpertVoting`**: Highlights `[data-tour="home-comment-card"]`.
- Explains the expert scoring formula: expert upvotes − downvotes.

#### Step 11 — Group Comments
- Highlight `[data-tour="home-group-comments"]`.
- `waitForClick: 'group-comments'` → `handleUserAction` calls `groupBtn.click()`.
- This actually invokes the real AI grouping API. Comments cluster in real time.

#### Step 12 — AI Verdict
- **Action: `revealAiVerdict`**: `showWithAnimation` on the AI verdict section.
- `waitForClick: 'generate-verdict'` → `handleUserAction` finds the button inside the section and clicks it.
- The real Gemini 2.5 Flash API call runs and the verdict renders live.

#### Step 13 — Verdict Rules
- `isRulesStep: true` renders `<VerdictRulesPanel />` instead of description text.
- No action, no wait. User reads and presses Next →.

#### Step 14 — Complete
- Summary card. User presses Finish ✓.

---

## 7. Core Logic Systems

### 7.1 The Hide → Type → Reveal Pattern

Every "posting a comment" sequence in the debate tour follows this 3-step pattern:

```
Step N:   hideElement(existing comment)
          selectStance()
          typeIntoInput()                ← types the same text as the hidden comment
          ── user clicks Send ──

Step N+1: await wait(1200ms)             ← wait for API + React re-render
          freshElement = findGroup() / findOffTopic()
          showWithAnimation(freshElement)
          popHighlight(freshElement)
```

**The magic**: The hidden comment and the typed text are identical. When the user sends it and the AI groups it, the hidden element is revealed in the correct position — giving the illusion that the comment "appeared" because of the posting action. In reality, it was always there; we hid it, retypes its text, and let the real API process it.

### 7.2 Re-Query Pattern (Stale Reference Problem)

React unmounts and remounts components after every API response. Any DOM reference stored before the API call (`const el = document.querySelector(...)` stored in a variable) points to a detached, garbage-collected node after the re-render.

**Solution**: Never store DOM element references across async boundaries. Instead, store only:
- The group's `title` (text string)
- The group's `stance` (`'for'` / `'against'`)
- The comment's `textPrefix` (first 60 chars)

Then call `findGroup(title, stance)` or `findCommentInGroup(group, prefix)` immediately before any DOM operation.

### 7.3 SessionStorage for Step Definitions

Step definitions are built **once** in the `useEffect` and stored in `stepsRef.current`. But `autoType.text` inside those step objects reads from `sessionStorage.getItem('tour_multiCommentText')` **at build time** (not at execution time).

Since step objects are plain JavaScript objects (not reactive), the text must be written to `sessionStorage` by the analyzer before `buildDebateSteps()` is called. The analyzer does this:

```javascript
sessionStorage.setItem('tour_multiCommentText', result.multiGroupCommentText);
```

And the step definition reads it at build time:

```javascript
autoType: { text: sessionStorage.getItem('tour_multiCommentText') || DEBATE_MOCK.similar }
```

This is also why debateSteps.js initializes each `autoType.text` lazily — the `sessionStorage` key will have been set by the time the file is evaluated after `analyzeDebateRoom()` resolves.

---

## 8. State Management

The component uses **React local state only** — no Redux, no Context. This is intentional: the tour is self-contained and should not affect the rest of the application.

### State → DOM Flow

```
currentStepIndex changes
  → useEffect (step executor) runs exec()
  → exec() modifies DOM directly (hideElement, highlightAction, typeIntoInput, …)
  → exec() sets actionRunning, waitingForUser, waitAction
  → render updates panel content + spotlight + buttons based on those states
```

The component deliberately bypasses React's virtual DOM for the visual effects. React would require expensive re-renders and `ref` forwarding into child components (news card, debate groups) that are completely outside this component's tree. Direct DOM manipulation is the only viable option at this architectural level.

### Cancellation Pattern

Every `exec()` function creates a local `let cancelled = false` flag. The `useEffect` cleanup returns `() => { cancelled = true; }`. Every `await` inside `exec()` checks `if (cancelled) return` before proceeding. This prevents:
- Race conditions when the user skips steps quickly
- Stale DOM mutations on an already-advanced step
- Memory leaks from dangling animation timers

---

## 9. DOM Interaction Techniques

### 9.1 Native Prototype Setter (React Input Hack)

The most important technique in the codebase. Standard `el.value = 'text'` does not trigger React's `onChange`:

```javascript
// WRONG — React doesn't see this:
el.value = 'hello';
el.dispatchEvent(new Event('input'));

// CORRECT — uses the native setter React subscribed to:
const nativeSetter = Object.getOwnPropertyDescriptor(
  HTMLTextAreaElement.prototype, 'value'
).set;
nativeSetter.call(el, newValue);
el.dispatchEvent(new Event('input', { bubbles: true }));
```

React stores its own reference to the native setter when it mounts the element. Calling `el.value = 'text'` in user code invokes a synthetic wrapper that React has hooked — but this wrapper only fires if the value comes from React's own event system. By calling the **prototype setter directly**, we invoke the exact same path React uses internally, so `onChange` fires correctly.

### 9.2 SVG Mask Spotlight

```jsx
<svg className="fixed inset-0 w-full h-full">
  <defs>
    <mask id="real-exp-mask">
      <rect width="100%" height="100%" fill="white" />  {/* start: everything visible */}
      <rect x y width height rx="12" fill="black" />    {/* cut out: spotlight area */}
    </mask>
  </defs>
  <rect fill="rgba(0,0,0,0.55)" mask="url(#real-exp-mask)" />  {/* semi-transparent overlay */}
</svg>
```

SVG mask: white = transparent overlay (visible), black = opaque overlay (hidden). The outer rect fills everything black (full overlay), then the inner rect punches a hole at the spotlight position. The effect: everything is dimmed except the spotlit element.

### 9.3 Passthrough Click Div

When `waitingForUser = true` and a spotlight exists:

```jsx
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
```

This transparent div sits exactly over the spotlit element and intercepts clicks. Why not just let clicks pass through to the real element? Because the semi-transparent overlay SVG above would also receive the click. The transparent div solves this by calling `handleUserAction()` first (which may programmatically click the real element or navigate), then `stopPropagation` prevents bubbling to the overlay.

### 9.4 CSS Injection for Navigation Persistence

When navigating between routes, React unmounts the current page component. All inline styles set by `hideElement()` are lost. The tour injects a persistent `<style>` tag:

```html
<style data-tour-style="hide-first-card">
  [data-tour="home-first-news-card"] { display: none !important; }
</style>
```

This tag lives in `<head>` and survives React route changes. It's removed explicitly in `handleClose()` and when the reveal step runs.

---

## 10. Visual Layer — Spotlight, Panel, Overlay

### Spotlight Tracking

A `requestAnimationFrame` loop continuously re-measures `currentStep.target`'s bounding rect and updates `spotlightRect`. The SVG mask redraws every frame, keeping the cutout pixel-perfect even during scroll or content changes.

The spotlight rect is padded by 8px on each side (`left - 8`, `top - 8`, `width + 16`, `height + 16`) to give a comfortable visual margin.

A second element (the pulsing ring) is a plain div with `box-shadow` using the same coordinates:
```css
box-shadow: 0 0 0 3px rgba(59,130,246,0.5), 0 0 20px rgba(59,130,246,0.3);
animation: pulse-ring 2s ease-in-out infinite;
```

### Panel Positioning

`calcPanelPosition(targetRect)` runs during the spotlight tracking loop and updates `panelPos`. The panel CSS uses:

```javascript
transition: 'top 0.4s ease, left 0.4s ease, bottom 0.4s ease, right 0.4s ease'
```

So when the target changes (step advance) the panel smoothly slides to its new position.

### Panel Content States

| State | Panel Content |
|---|---|
| Normal | Icon + title + subtitle + description text |
| `isRulesStep` | `<VerdictRulesPanel />` replaces description |
| `actionRunning` | Spinning indicator + "Working..." |
| `waitingForUser` | Bouncing "👆 Click the highlighted element!" badge |
| `show*` action | "✨ Result highlighted!" badge |
| Minimized | Single round icon button (just the step emoji) |

### Progress Indicator

The top progress bar width = `((currentStepIndex + 1) / steps.length) * 100%`.

Below the navigation buttons: a dot-strip where each dot represents a step. The active step dot is wide (`w-4`) and uses the current gradient. Completed steps are small blue dots; upcoming are gray.

---

## 11. Cleanup & Resilience

### `handleClose()` — Complete Cleanup

Called on Escape key, X button, Finish button. Does all of:

1. Query `[data-tour-hidden="true"]` globally → `showElement` each → clear inline transition/boxShadow/opacity/transform.
2. Iterate `hiddenElementsRef.current` as fallback (catches elements where the attribute may have been stripped by React).
3. Clear typed inputs via `clearedInputsRef.current`.
4. Remove all tour SessionStorage keys.
5. Run `unhighlightAll()` to strip glow styles.
6. Remove `[data-tour-style]` injected `<style>` tags.
7. Reset comment stream animation styles.
8. If currently on `/submit-news`, navigate back to `/home`.
9. Scroll to top.
10. Reset all state to initial values.

### Why Two Cleanup Paths?

React may re-render components during the tour (API responses, state updates) which causes DOM nodes to be replaced. The `hiddenElementsRef` holds references to the **original** nodes. Post re-render, those refs point to detached/garbage-collected nodes.

The `[data-tour-hidden="true"]` attribute query always finds the **current live** nodes, because even if React replaced the component, the new render picks up the analysis data and may still have hidden elements.

### `cancelled` Flag in Exec

Every step's async `exec()` function respects this flag:

```javascript
let cancelled = false;
const exec = async () => {
  await wait(1200);
  if (cancelled) return;  // ← checked after every await
  // ... more work ...
  if (cancelled) return;
};
return () => { cancelled = true; };  // cleanup
```

Without this, if the user rapidly clicks Next → multiple times, multiple `exec()` functions would race, mutating the DOM in unpredictable order.

---

## 12. Key Design Decisions (The "Why")

### Why Direct DOM Manipulation Instead of React State?

The elements being manipulated (debate groups, news cards, voting buttons) are rendered by **completely separate React components** (`DebateRoom.jsx`, `NewsCard.jsx`, etc.). RealExperienceJourney has no access to their props or state. The only cross-component API available is the DOM itself.

### Why `data-tour="..."` Attributes on Target Elements?

CSS class-based selectors (`.mb-6.border.rounded-lg`) are fragile — a Tailwind utility class change breaks the selector. `data-tour` attributes are semantic, stable, and explicitly mark elements as "this is targeted by the tour."

### Why Text Prefix Matching Instead of Index-Based?

```javascript
// FRAGILE — breaks if a new comment is posted above
container.children[1]

// ROBUST — finds the correct comment regardless of position
Array.from(container.children).find(el => el.textContent.startsWith(prefix))
```

The AI grouping API may insert newly posted comments at any position in the list. Index-based access is brittle. Text prefix matching (first 60 chars) uniquely identifies the correct element even after re-ordering.

### Why is the Analyzer Async?

Reading comment text from collapsed groups requires first expanding them. `expandGroup()` clicks a DOM button and then waits 400 ms for an animation. Multiple groups = multiple sequential async operations. This makes the analyzer inherently async, which is why it runs behind a "Analyzing Page..." loading screen.

### Why SessionStorage for Analyzed Texts?

Step objects are plain JavaScript objects built once during the analysis phase. The `autoType.text` field is evaluated at step-build time. By storing extracted texts in `sessionStorage`, they're available synchronously at step-build time even though they were discovered asynchronously. This avoids complex dependency passing from the analyzer into the step builder.

---

*End of RealExperienceJourney Documentation*
