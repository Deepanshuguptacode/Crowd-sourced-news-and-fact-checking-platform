# RealExperience — Home Page Tour Plan (v6)
> Complete interactive tour for the News Feed page  
> Covers: News display → Status → Voting → Commenting → Stances → Evidence → Expert Review → AI Grouping → AI Verdict  
> **19 steps** — implemented in `newsSteps.js`, actions in `index.jsx`

---

## Tour Flow (19 Steps)

| # | ID | Title | Action | Wait | Elements Hidden / Shown |
|---|---|---|---|---|---|
| 0 | `news-welcome` | Interactive News Tour | `hideNewsCard` | — | Hides entire first card + injects CSS |
| 1 | `news-goto-submit` | Submit a News Article | highlight | `navigate-submit` | Highlights Submit News nav button |
| 2 | `news-fill-form` | Filling the Form | `autoFillNewsForm` | — | Auto-types title, description, link |
| 3 | `news-submit-form` | Submit the Article! | highlight | `navigate-home` | Highlights submit button, navigates home |
| 4 | `news-appeared` | News Article Published! | `showNewsCardClean` | — | **Votes hidden (0), Comments hidden (0), AI verdict hidden, status → Pending** |
| 5 | `news-status-badge` | Verification Status | `highlightStatusBadge` | — | Green glow on Pending badge |
| 6 | `news-vote` | Cast Your Vote! | `revealVotingZero` | `vote` | Reveals voting buttons with counts at 0 |
| 7 | `news-open-comments` | Open the Comments | `revealCommentsBtn` | `open-comments` | Reveals comments toggle button |
| 8 | `news-stance` | Choose Your Stance | `highlightStance` | — | Green/red/gray glow per stance label |
| 9 | `news-type-comment` | Post a Comment | `hideCommentsAndFillInput` | — (auto-posts) | Hides cards, types text, auto-clicks Post button |
| 10 | `news-comments-stream` | Engagement Streaming In | `streamComments` | — | Waits 1500ms for re-render, then streams cards back |
| 11 | `news-evidence-link` | Evidence Links | `highlightEvidenceLink` | — | Clicks evidence toggle open, highlights section |
| 12 | `news-expert-voting` | Expert Voting System | `animateExpertVote` | — | Injects animated expert badge, bumps upvote count |
| 13 | `news-expert-rules` | Expert Scoring Rules | — (info panel) | — | Text panel only — no DOM changes |
| 14 | `news-group-comments` | AI Comment Grouping | highlight | `group-comments` | Highlights Group by Topic button |
| 15 | `news-show-grouped` | Grouped Comments View | `highlightGroupedView` | — | Pulses each group frame, highlights section |
| 16 | `news-ai-verdict` | Generate AI Verdict | `revealAiVerdict` | `generate-verdict` | Shows AI verdict section if hidden |
| 17 | `news-verdict-rules` | AI Verdict Scoring Rules | `isRulesStep` | — | Renders `<VerdictRulesPanel />` |
| 18 | `news-complete` | News Verification Complete! | `unhideAllNewsData` | — | Restores all hidden elements + original counts |

---

## Step Details

### Step 0 — Interactive News Tour
- **Target:** none (floating panel, no spotlight)
- **Action:** `hideNewsCard` — hides the first news card element and injects a persistent `<style>` tag (`display: none !important`) so it stays hidden even after the React route changes to `/submit-news` and back.
- **Teaches:** Platform intro. "Community → Experts → AI work together. You're about to watch all three in action."
- **What user sees:** Intro panel in blue-indigo gradient. The card below the fold is already removed.

---

### Step 1 — Submit a News Article
- **Target:** `[data-tour="home-submit-news"]` (Submit News nav button)
- **Action:** `highlightClickTarget` — yellow glow on the nav button.
- **Wait:** `navigate-submit` → `navigate('/submit-news')` after click, advances step.
- **Teaches:** News enters the system through user submission. Anyone with an account can submit.

---

### Step 2 — Filling the Form
- **Target:** `[data-tour="submit-form-container"]`
- **Action:** `autoFillNewsForm`
  - Waits 800ms for page to render.
  - Reads extracted `newsTitle`, `newsDescription`, `newsLink` from the first home card (captured before hide).
  - Types into `[data-tour="submit-title"]` at 8ms/char.
  - Types into `[data-tour="submit-description"]` at 6ms/char.
  - Types into `[data-tour="submit-link"]` at 10ms/char.
- **Teaches:** Article requires a title, description, and source link. The content matches the actual first card — making the demo feel real.

---

### Step 3 — Submit the Article!
- **Target:** `[data-tour="submit-button"]`
- **Action:** `highlightClickTarget` — yellow glow on the submit button.
- **Wait:** `navigate-home`
  - Clears all filled inputs.
  - Re-injects CSS hide rule for the card.
  - Navigates to `/home` after 1000ms.
- **Teaches:** Submitting publishes the article into Pending status. It immediately enters the news feed.

---

### Step 4 — News Article Published!
- **Target:** `[data-tour="home-first-news-card"]`
- **Action:** `showNewsCardClean`
  - Removes injected `<style>` tags.
  - **Hides:** `home-voting-buttons`, `home-comments-btn`, `home-ai-verdict` (all pushed to `hiddenElementsRef`)
  - **Overrides counts to zero:** upvote count → `"0"`, downvote count → `"0"`, comment count → `"0 Comments"`
  - **Forces status badge to Pending:** finds the first non-whitespace text node inside `[data-tour="home-status-badge"]`, stores original in `badge.dataset.tourOriginalBadgeText`, sets text to `'Pending'`. Applies inline yellow styles (`background: rgb(254,249,195)`, `color: rgb(161,98,7)`) via `markTourStyled` so `cleanupAllTourStyles()` can reset them later.
  - `showWithAnimation` on the card (spring reveal).
  - `highlightResult` + `pulseElement` for 4s.
  - Scrolls to card.
- **Teaches:** The article just entered the feed with a fresh blank slate — zero engagement, Pending status. Everything is hidden until the tour reveals each feature step by step.

---

### Step 5 — Verification Status
- **Target:** `[data-tour="home-status-badge"]` (the Pending/Verified/Fake badge)
- **Action:** `highlightStatusBadge` — `highlightResult` (green glow) + `pulseElement` for 4s.
- **Teaches:**
  - Every article starts as **Pending** ⏳
  - Status changes when the community hits the voting threshold:
    - ≥ 5 total votes needed
    - > 50% upvotes → **Verified** ✅
    - > 50% downvotes → **Fake** ❌
    - 50/50 split → remains **Pending**
  - The badge updates in real-time as votes come in.

---

### Step 6 — Cast Your Vote!
- **Target:** `[data-tour="home-voting-buttons"]`
- **Action:** `revealVotingZero`
  - `showWithAnimation` on the voting buttons section.
  - Re-overrides upvote and downvote counts to `"0"` (in case React re-rendered).
- **Wait:** `vote`
  - Programmatically clicks the first (upvote) button.
  - Sets upvote count to `"1"` immediately for clean-slate narrative.
  - Advances step.
- **Teaches:** Click 👍 = you believe it's credible. Click 👎 = you believe it's fake. Each vote moves the article toward the 5-vote threshold.

---

### Step 7 — Open the Comments
- **Target:** `[data-tour="home-comments-btn"]`
- **Action:** `revealCommentsBtn` — `showWithAnimation` on the comments toggle button.
- **Wait:** `open-comments`
  - Programmatically `.click()` the button.
  - Waits 600ms for the `CommentSection` to mount.
  - Advances step.
- **Teaches:** The comment section is where detailed analysis happens. Comments are the primary input for expert review and AI verdict.

---

### Step 8 — Choose Your Stance
- **Target:** `[data-tour="home-stance-selector"]`
- **Action:** `highlightStance`
  - `highlightResult` (green glow) on the entire stance selector.
  - Queries all `<label>` elements inside and applies stance-specific glows:
    - "In Favor" labels → green shadow `rgba(34,197,94,0.7)`
    - "Against" labels → red shadow `rgba(239,68,68,0.7)`
    - "General" labels → gray shadow `rgba(156,163,175,0.7)`
  - `pulseElement` for 4s.
- **Teaches:**
  - 👍 **In Favor** — you believe the news is accurate
  - 👎 **Against** — you believe it's false or misleading
  - 💬 **General** — neutral observation or question
  - Only In Favor and Against comments are counted in the AI verdict scoring algorithm. General comments are excluded.

---

### Step 9 — Post a Comment
- **Target:** `[data-tour="home-comment-input"]`
- **Action:** `hideCommentsAndFillInput` (no `waitForClick` — auto-submits)
  - Waits 600ms for comments to load.
  - Queries all `.p-3.bg-gray-50`, `.p-3.bg-gray-700`, and `[data-tour="home-comment-card"]` elements.
  - Extracts text from the first card's `p.text-gray-800` element.
  - Hides all existing comment cards (pushed to `hiddenElementsRef`).
  - Fallback text: `newsDescription.slice(0, 120)` or `NEWS_MOCK.comment`.
  - `typeIntoInput(textarea, pickedText, 8ms/char)` — text appears character by character.
  - Waits 1200ms so the user can read the typed comment.
  - Finds `input.nextElementSibling` (the Post button), applies green glow + scale, waits 500ms.
  - Calls `postBtn.click()` — fires the real React `handleAddComment` → **API POST**.
  - Waits 400ms, then `setActionRunning(false)` → Next button enables.
- **Why auto-post instead of `waitForClick`:** The tour overlay SVG covers elements outside the spotlight. The Post button is adjacent to the input (outside spotlight) so the overlay would have blocked clicks. Auto-posting removes the confusion and ensures the API always fires.

---

### Step 10 — Engagement Streaming In
- **Target:** `[data-tour="home-comment-section"]`
- **Action:** `streamComments`
  - **Waits 1500ms** at the start (re-render buffer): after the step 9 auto-post, the React API call may still be in flight. This buffer ensures the comment list state update + DOM re-render is complete before querying.
  - Re-queries all comment cards (same selector as hide step).
  - Sets `opacity: 0` and `transform: translateX(-20px)` on any still-hidden or visible-but-fresh cards.
  - Waits 400ms.
  - Loops through each card with 280ms gap: restores from `tourHidden` if needed, animates `opacity: 1`, `transform: translateX(0)` with cubic-bezier spring.
- **Teaches:** Multiple community members comment with different stances. Each card shows: author, timestamp, stance badge (In Favor / Against / General), comment text, evidence links (if any), and expert voting scores.

---

### Step 11 — Evidence Links
- **Action:** `highlightEvidenceLink`
  - Searches all `<button>` elements in the comment section for one containing "Evidence Link" text.
  - Scrolls to it, `highlightAction` (yellow glow) + `pulseElement` for 4s.
  - Programmatically `.click()` to expand the evidence section.
  - After 600ms, `highlightResult` on the expanded section.
  - Fallback: highlights the comment input area.
- **Teaches:**
  - Users can attach up to **3 source URLs** per comment.
  - Each link needs a URL + explanation text.
  - Evidence links **increase the weight** of that comment in the AI verdict.
  - Expert Upvotes + Evidence Count both raise the comment's priority score.

---

### Step 12 — Expert Voting System
- **Target:** `[data-tour="home-comment-card"]`
- **Action:** `animateExpertVote`
  - Scrolls to and `highlightResult` on the first comment card.
  - Finds the `border-t.border-gray-200` expert voting section inside it.
  - Injects `<div class="tour-expert-badge">` absolutely positioned above the section:
    - Phase 1 (0–2000ms): amber gradient, "🔍 Expert is analysing this comment..."
    - Phase 2 (2000–4000ms): green gradient, "👍 Expert Upvoted! Credibility score +1"
    - Bumps the first `span.font-medium` count by +1 with green scale animation.
    - Phase 3: badge fades out and is removed.
- **Teaches:** Verified domain experts can upvote or downvote any comment. Their votes determine whether a comment reaches the AI verdict. Expert votes carry more weight than community votes.

---

### Step 13 — Expert Scoring Rules
- **Target:** `[data-tour="home-comment-card"]` (spotlight stays on first comment)
- **Action:** none — info panel only
- **Teaches (shown as formatted description):**
  - 📊 **Score = Expert Upvotes − Expert Downvotes**
  - 👨‍🔬 Only verified domain experts can vote on comments
  - ⚖️ Expert comments are weighted more heavily than community
  - 🔗 Evidence links boost a comment's priority score
  - Higher-scored comments get selected as "top comments" and are sent to Gemini for the final verdict
  - Max 8 supporting + 8 opposing = **16 comments total sent to AI**

---

### Step 14 — AI Comment Grouping
- **Target:** `[data-tour="home-group-comments"]`
- **Action:** `highlightClickTarget` — yellow glow on the Group by Topic button.
- **Wait:** `group-comments`
  - Programmatically `.click()` the button.
  - Real Gemini API call fires in the background.
  - Waits 600ms, advances step.
- **Teaches:** Clicking "Group by Topic" sends all comments to Google Gemini. It semantically clusters them into themed groups — each with an AI-written label and description. This also enables the diversity-first top comment selection for the verdict.

---

### Step 15 — Grouped Comments View
- **Target:** `[data-tour="home-comment-section"]`
- **Action:** `highlightGroupedView`
  - Waits 800ms for the API and React re-render.
  - Queries `.mb-4 .bg-blue-50, .mb-4` group frames.
  - `highlightResult` on the section, then `pulseElement` on each group frame with 400ms stagger.
  - Fallback: just highlights the whole section.
- **Teaches:** Comments are now organized by theme (e.g., "Source Credibility", "Safety Concerns"). Each group has a label, description, and comment count. The top-scored comment from each group gets selected for the AI verdict — ensuring **thematic diversity** rather than picking all top comments from a single theme.

---

### Step 16 — Generate AI Verdict
- **Target:** `[data-tour="home-ai-verdict"]`
- **Action:** `revealAiVerdict` — `showWithAnimation` on the AI verdict section.
- **Wait:** `generate-verdict`
  - Finds the first `<button>` inside the verdict section.
  - Programmatically `.click()` — **real Gemini 2.5 Flash API call fires**.
  - Immediately advances step.
- **Teaches:** The AI verdict is the final layer. Gemini 2.5 Flash receives:
  - The article title + description
  - Top-scored In Favor comments (up to 8)
  - Top-scored Against comments (up to 8)
  - Grouped view labels if available
- **Returns:** `verdict` text (max 250 words), `score` (0–100), `confidence` (0–1), `keyFactors` (3–5 strings), `riskLevel` (LOW / MEDIUM / HIGH)

---

### Step 17 — AI Verdict Scoring Rules
- **Target:** `[data-tour="home-ai-verdict"]`
- **Action:** `isRulesStep: true` — renders `<VerdictRulesPanel />` component in the panel body
- **VerdictRulesPanel shows:**

  | Score | Meaning |
  |---|---|
  | 81–100 | Highly credible and verified |
  | 61–80 | Likely true with minor concerns |
  | 41–60 | Uncertain / mixed evidence |
  | 21–40 | Likely false or misleading |
  | 0–20 | Definitely fake / misinformation |

  **Top Comment Selection Algorithm:**
  - Split by stance: In Favor vs Against (General excluded)
  - If AI groups exist → highest-scored comment per group (ensures diversity)
  - Fallback → top comments by raw score
  - Max 8 supporting + 8 opposing = **16 comments sent to AI**

  **AI Evaluates:** source quality, evidence in comments, expert vs community consensus, consistency, potential harm.

---

### Step 18 — News Verification Complete!
- **Target:** none (outro card)
- **Action:** `unhideAllNewsData`
  - `document.querySelectorAll('[data-tour-hidden="true"]')` → restores all.
  - Iterates `hiddenElementsRef.current` → restores all.
  - Resets `opacity`, `transform`, `transition`, `boxShadow` on each.
  - Restores original vote counts from `data-tour-original-text` attributes.
  - Removes all injected `<style data-tour-style>` tags.
  - Calls `cleanupAllTourStyles()` to clear all visual highlights.
  - Removes `.tour-expert-badge` elements.
  - Scrolls to and `pulseElement` on the fully-restored card.
- **Summary shown in panel:**
  - 📝 News Submission (title, description, source)
  - 🗳️ Community Voting (≥5 votes, >50% threshold)
  - 🏷️ Verification Status (Pending → Verified / Fake)
  - 💬 Stance-based Commenting (In Favor / Against / General)
  - 📎 Evidence Link Attachment (max 3 per comment)
  - ⭐ Expert Comment Voting (score = up − down)
  - 📂 AI Semantic Comment Grouping (Gemini)
  - 🤖 AI Verdict Generation (0–100 credibility score)

---

## New Steps vs Previous (16-step) Tour

| Change | Detail |
|---|---|
| **+Step 5** Status Badge | Dedicated step spotlighting the Pending badge + full verification threshold rules |
| **+Step 8** Stance Selector | Separate step highlighting all three stance options with colored glows |
| **+Step 13** Expert Rules | Info-only panel explaining Score = Up − Down, expert-only, evidence weighting |
| **Step 4 fix** | AI verdict hidden; votes/comments hidden; status badge forced to Pending via text node override + yellow inline styles |
| **Step 9 fix** | Removed `waitForClick: 'post-comment'` (Post button was blocked by overlay); now auto-posts programmatically after typing |
| **Step 10 fix** | Added 1500ms re-render buffer so `streamComments` waits for POST API response + React re-render before querying cards |
| Steps 0–3, 6–7, 11–12, 14–18 | Same flow with improved descriptions |

---

## Data-Tour Attributes

| Attribute | Component | Status |
|---|---|---|
| `home-first-news-card` | NewsFeed.jsx | ✅ exists |
| `home-status-badge` | NewsCard.jsx | ✅ added |
| `home-voting-buttons` | NewsCard.jsx | ✅ exists |
| `home-upvote-count` | NewsCard.jsx | ✅ exists |
| `home-downvote-count` | NewsCard.jsx | ✅ exists |
| `home-comments-btn` | NewsCard.jsx | ✅ exists |
| `home-comments-count` | NewsCard.jsx | ✅ exists |
| `home-ai-analysis` | NewsCard.jsx | ✅ exists |
| `home-ai-verdict` | NewsCard.jsx | ✅ exists |
| `home-comment-section` | CommentSection.jsx | ✅ exists |
| `home-group-comments` | CommentSection.jsx | ✅ exists |
| `home-comment-card` | CommentSection.jsx | ✅ exists |
| `home-stance-selector` | CommentSection.jsx | ✅ exists |
| `home-comment-input` | CommentSection.jsx | ✅ exists |
| `home-submit-news` | Navbar | ✅ exists |
| `submit-form-container` | SubmitNews | ✅ exists |
| `submit-title` | SubmitNews | ✅ exists |
| `submit-description` | SubmitNews | ✅ exists |
| `submit-link` | SubmitNews | ✅ exists |
| `submit-button` | SubmitNews | ✅ exists |
