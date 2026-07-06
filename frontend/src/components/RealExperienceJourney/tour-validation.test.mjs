#!/usr/bin/env node
/**
 * Tour Validation — Hardcore Tests for known bugs
 * Run:  node tour-validation.test.mjs
 *
 * BUG-1  Step 4: AI verdict NOT hidden, votes/comments NOT zeroed, badge NOT Pending
 * BUG-2  Step 9: Comment posted for real (should be visual-only, zero API calls)
 * BUG-3  Step 10: Tour stuck because BUG-2 detaches the hidden comment DOM nodes
 *
 * These tests check the SOURCE CODE (not runtime). They fail when the bugs are
 * present and pass when the bugs are fixed.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));

// ─── File loading ─────────────────────────────────────────────────────────────

function readSrc(rel) {
  const abs = join(__dir, rel);
  try { return readFileSync(abs, 'utf-8'); }
  catch (e) { console.error(`\nFATAL: Cannot read ${abs}\n  ${e.message}`); process.exit(2); }
}

const stepsSource = readSrc('newsSteps.js');
const indexSource = readSrc('index.jsx');
const newsCardSrc = readSrc('../NewsCard.jsx');
const commentSrc  = readSrc('../CommentSection.jsx');
const newsFeedSrc = readSrc('../NewsFeed.jsx');

// ─── Test harness ─────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function test(label, fn) {
  try {
    fn();
    console.log(`  ✅  ${label}`);
    passed++;
  } catch (err) {
    console.log(`  ❌  ${label}`);
    console.log(`       → ${err.message}`);
    failed++;
  }
}
function assert(cond, msg)          { if (!cond) throw new Error(msg); }
function assertContains(src, s, m)  { assert(src.includes(s), m ?? `Expected to find: "${s}"`); }
function assertExcludes(src, s, m)  { assert(!src.includes(s), m ?? `Must NOT contain: "${s}"`); }

/** Slice src starting at first occurrence of anchor, up to maxLen chars. */
function sliceFrom(src, anchor, maxLen = 3000) {
  const idx = src.indexOf(anchor);
  assert(idx !== -1, `Anchor not found in source: ${anchor}`);
  return src.slice(idx, idx + maxLen);
}

/** Return all captured groups matched by a global regex. */
function matchAll(src, rx) {
  const out = [];
  for (const m of src.matchAll(rx)) out.push(m[1]);
  return out;
}

// =============================================================================
// A.  BUG-1 — showNewsCardClean: all three elements hidden, counts 0, badge Pending
// =============================================================================
console.log('\n🐛  BUG-1 — Step 4: showNewsCardClean must produce a clean slate');

const cleanBlock = sliceFrom(indexSource, "action === 'showNewsCardClean'", 3000);

test('[BUG-1-1] showNewsCardClean queries home-ai-verdict', () => {
  assertContains(cleanBlock, 'home-ai-verdict',
    'showNewsCardClean must look up [data-tour="home-ai-verdict"]');
});

test('[BUG-1-2] showNewsCardClean hides ai-verdict via hideElement()', () => {
  assertContains(cleanBlock, 'hideElement(aiVerdict)',
    'showNewsCardClean must call hideElement(aiVerdict) so AI panel is invisible in step 4');
});

test('[BUG-1-3] showNewsCardClean pushes aiVerdict to hiddenElementsRef', () => {
  assertContains(cleanBlock, 'hiddenElementsRef.current.push(aiVerdict)',
    'aiVerdict must be tracked so it can be restored on tour exit');
});

test('[BUG-1-4] showNewsCardClean hides home-voting-buttons via hideElement()', () => {
  assertContains(cleanBlock, 'home-voting-buttons');
  assertContains(cleanBlock, 'hideElement(votingBtns)',
    'voting buttons must be hidden at step-4 start');
});

test('[BUG-1-5] showNewsCardClean hides home-comments-btn via hideElement()', () => {
  assertContains(cleanBlock, 'home-comments-btn');
  assertContains(cleanBlock, 'hideElement(commentsBtn)',
    'comments button must be hidden at step-4 start');
});

test('[BUG-1-6] showNewsCardClean sets upvote count to "0"', () => {
  assertContains(cleanBlock, 'home-upvote-count');
  // Must assign textContent = '0' after querying the span
  assertContains(cleanBlock, "upSpan.textContent = '0'",
    'upvote count span must be overridden to "0"');
});

test('[BUG-1-7] showNewsCardClean sets downvote count to "0"', () => {
  assertContains(cleanBlock, 'home-downvote-count');
  assertContains(cleanBlock, "downSpan.textContent = '0'",
    'downvote count span must be overridden to "0"');
});

test('[BUG-1-8] showNewsCardClean sets comment count to "0 Comments"', () => {
  assertContains(cleanBlock, 'home-comments-count');
  assertContains(cleanBlock, "'0 Comments'",
    'comment count span must be overridden to "0 Comments"');
});

test('[BUG-1-9] showNewsCardClean rewrites badge text to "Pending"', () => {
  assertContains(cleanBlock, 'home-status-badge',
    'must query [data-tour="home-status-badge"]');
  assertContains(cleanBlock, "'Pending'",
    'badge text must be set to "Pending"');
});

test('[BUG-1-10] showNewsCardClean saves original badge text for restoration', () => {
  assertContains(cleanBlock, 'tourOriginalBadgeText',
    'original badge text must be saved in dataset.tourOriginalBadgeText so it can be restored');
});

test('[BUG-1-11] showNewsCardClean applies yellow styling to badge', () => {
  assertContains(cleanBlock, 'rgb(254,249,195)',
    'badge background must become yellow-100 so it visually reads as "Pending"');
  assertContains(cleanBlock, 'rgb(161,98,7)',
    'badge text color must become yellow-700');
});

test('[BUG-1-12] step 4 description does NOT promise AI panel is visible', () => {
  const block = sliceFrom(stepsSource, "id: 'news-appeared'", 1500);
  assertExcludes(block, 'AI Analysis panel is already visible',
    'Step 4 description must not say the AI panel is visible — it is hidden in step 4');
});

// =============================================================================
// B.  BUG-2 — hideCommentsAndFillInput: ZERO real API calls (visual demo only)
// =============================================================================
console.log('\n🐛  BUG-2 — Step 9: hideCommentsAndFillInput must NOT post to the API');

const fillBlock = sliceFrom(indexSource, "action === 'hideCommentsAndFillInput'", 3000);

test('[BUG-2-1] hideCommentsAndFillInput does NOT call .click() on any button', () => {
  assertExcludes(fillBlock, '.click()',
    '.click() triggers handleAddComment → real API POST. Must be removed entirely.');
});

test('[BUG-2-2] hideCommentsAndFillInput does NOT reference postBtn', () => {
  assertExcludes(fillBlock, 'postBtn',
    'postBtn variable must not exist — no button interaction at all in step 9');
});

test('[BUG-2-3] hideCommentsAndFillInput does NOT reference nextElementSibling for clicking', () => {
  // nextElementSibling was used ONLY to find the Post button before calling .click()
  assertExcludes(fillBlock, 'nextElementSibling',
    'nextElementSibling was only used to find the Post button. Remove it with the click.');
});

test('[BUG-2-4] hideCommentsAndFillInput calls clearInput() to clean up after typing', () => {
  assertContains(fillBlock, 'clearInput',
    'clearInput() must be called after typeIntoInput so the input is blank when advancing — visual demo only, no submit possible');
});

test('[BUG-2-5] hideCommentsAndFillInput hides existing comment cards before typing', () => {
  assertContains(fillBlock, 'hideElement(c)',
    'each existing comment card must be hidden so the stream animation in step 10 can re-reveal them');
});

test('[BUG-2-6] hideCommentsAndFillInput pushes cards to hiddenElementsRef', () => {
  assertContains(fillBlock, 'hiddenElementsRef.current.push(c)',
    'cards must be tracked so streamComments and tour-exit can restore them');
});

test('[BUG-2-7] hideCommentsAndFillInput uses typeIntoInput for visual typing effect', () => {
  assertContains(fillBlock, 'typeIntoInput',
    'typeIntoInput provides the character-by-character visual — keep it');
});

test('[BUG-2-8] step 9 description does NOT mention "auto-submitted"', () => {
  const block = sliceFrom(stepsSource, "id: 'news-type-comment'", 1200);
  assertExcludes(block, 'auto-submitted',
    'Step 9 subtitle/description must not promise auto-submission — the comment is NOT posted');
});

// =============================================================================
// C.  BUG-3 — streamComments: no 1500ms API buffer, just restore hidden cards
// =============================================================================
console.log('\n🐛  BUG-3 — Step 10: streamComments must only restore hidden cards (no API wait)');

const streamBlock = sliceFrom(indexSource, "action === 'streamComments'", 2200);

test('[BUG-3-1] streamComments does NOT have a 1500ms wait at the start', () => {
  // The 1500ms was added to wait for the real comment POST to return.
  // Since we no longer post, this delay must be removed (causes perceived "stuck").
  const blockStart = streamBlock.slice(0, 300);
  assertExcludes(blockStart, '1500',
    'await wait(1500) must be removed — it was only needed for real API response timing and causes step 10 to appear frozen');
});

test('[BUG-3-2] streamComments queries comment cards to restore them', () => {
  assertContains(streamBlock, 'querySelectorAll',
    'streamComments must query the card elements to animate them back in');
});

test('[BUG-3-3] streamComments calls showElement() to restore tour-hidden cards', () => {
  assertContains(streamBlock, 'showElement(cards[i])',
    'showElement must be called to restore cards from tourHidden state set by step 9');
});

test('[BUG-3-4] streamComments animates cards in with opacity/transform', () => {
  assertContains(streamBlock, "opacity = '1'",
    'cards must be animated to opacity 1');
  assertContains(streamBlock, "transform = 'translateX(0)'",
    'cards must be animated to translateX(0)');
});

// =============================================================================
// D.  newsSteps.js — structural sanity
// =============================================================================
console.log('\n📋  newsSteps.js — structure');

const EXPECTED_IDS = [
  'news-welcome', 'news-goto-submit', 'news-fill-form', 'news-submit-form',
  'news-appeared', 'news-status-badge', 'news-vote', 'news-open-comments',
  'news-stance', 'news-type-comment', 'news-comments-stream', 'news-evidence-link',
  'news-expert-voting', 'news-expert-rules', 'news-group-comments',
  'news-show-grouped', 'news-ai-verdict', 'news-verdict-rules', 'news-complete',
];
const stepIds = matchAll(stepsSource, /id:\s*['"]([^'"]+)['"]/g);

test('Has exactly 19 steps', () => {
  assert(stepIds.length === 19, `Expected 19, got ${stepIds.length}: [${stepIds.join(', ')}]`);
});

test('All 19 expected IDs present', () => {
  const missing = EXPECTED_IDS.filter(id => !stepIds.includes(id));
  assert(missing.length === 0, `Missing: [${missing.join(', ')}]`);
});

test('No duplicate step IDs', () => {
  const seen = new Set(); const dupes = stepIds.filter(id => seen.has(id) ? true : (seen.add(id), false));
  assert(dupes.length === 0, `Duplicates: [${dupes.join(', ')}]`);
});

test('No leftover waitForClick: post-comment', () => {
  assertExcludes(stepsSource, "'post-comment'",
    'post-comment waitForClick was the original stuck cause — must stay removed');
});

test('No highlightSendBtn in any step', () => {
  assertExcludes(stepsSource, 'highlightSendBtn',
    'highlightSendBtn was tied to the now-removed post-click flow');
});

test('Step news-appeared → action showNewsCardClean', () => {
  const b = sliceFrom(stepsSource, "id: 'news-appeared'", 800);
  assertContains(b, 'showNewsCardClean');
});

test('Step news-type-comment → action hideCommentsAndFillInput', () => {
  const b = sliceFrom(stepsSource, "id: 'news-type-comment'", 800);
  assertContains(b, 'hideCommentsAndFillInput');
});

test('Step news-comments-stream → action streamComments', () => {
  const b = sliceFrom(stepsSource, "id: 'news-comments-stream'", 800);
  assertContains(b, 'streamComments');
});

test('Step news-ai-verdict has waitForClick: generate-verdict', () => {
  const b = sliceFrom(stepsSource, "id: 'news-ai-verdict'", 800);
  assertContains(b, 'generate-verdict');
});

// =============================================================================
// E.  index.jsx — all action handlers must exist
// =============================================================================
console.log('\n⚙️   index.jsx — action handlers');

[
  'hideNewsCard', 'showNewsCardClean', 'highlightStatusBadge', 'revealVotingZero',
  'revealCommentsBtn', 'highlightStance', 'hideCommentsAndFillInput', 'streamComments',
  'highlightEvidenceLink', 'animateExpertVote', 'highlightGroupedView',
  'revealAiVerdict', 'unhideAllNewsData', 'autoFillNewsForm',
].forEach(action => {
  test(`Handler block for: ${action}`, () => {
    assertContains(indexSource, `currentStep.action === '${action}'`,
      `Missing if-block for action '${action}'`);
  });
});

['navigate-submit', 'navigate-home', 'vote', 'open-comments', 'group-comments', 'generate-verdict'].forEach(wa => {
  test(`waitForClick handler: ${wa}`, () => {
    assert(indexSource.includes(`=== '${wa}'`) || indexSource.includes(`"${wa}"`),
      `No handler for waitAction: ${wa}`);
  });
});

// =============================================================================
// F.  Badge + count restoration on tour exit
// =============================================================================
console.log('\n🔄  Restoration — badge + counts must be restored on tour exit');

test('unhideAllNewsData restores tourOriginalBadgeText', () => {
  const b = sliceFrom(indexSource, "action === 'unhideAllNewsData'", 3000);
  assertContains(b, 'tourOriginalBadgeText',
    'unhideAllNewsData must restore the original badge text');
});

test('handleClose restores tourOriginalBadgeText', () => {
  const b = sliceFrom(indexSource, 'const handleClose', 4000);
  assertContains(b, 'tourOriginalBadgeText',
    'handleClose must restore the badge even if user exits mid-tour');
});

test('unhideAllNewsData restores upvote count', () => {
  const b = sliceFrom(indexSource, "action === 'unhideAllNewsData'", 3000);
  assertContains(b, 'home-upvote-count');
  assertContains(b, 'tourOriginalText',
    'vote counts must be restored from dataset.tourOriginalText');
});

// =============================================================================
// G.  Data-tour attributes — NewsCard / CommentSection / NewsFeed
// =============================================================================
console.log('\n🏷️   data-tour attributes');

[
  ['NewsCard.jsx', newsCardSrc, [
    'home-status-badge', 'home-voting-buttons', 'home-upvote-count',
    'home-downvote-count', 'home-comments-btn', 'home-comments-count',
    'home-ai-analysis', 'home-ai-verdict',
  ]],
  ['CommentSection.jsx', commentSrc, [
    'home-comment-section', 'home-group-comments', 'home-comment-card',
    'home-stance-selector', 'home-comment-input',
  ]],
  ['NewsFeed.jsx', newsFeedSrc, ['home-first-news-card']],
].forEach(([file, src, attrs]) => {
  attrs.forEach(attr => {
    test(`${file} has data-tour="${attr}"`, () => {
      assertContains(src, `"${attr}"`, `Missing data-tour="${attr}" in ${file}`);
    });
  });
});

test('home-status-badge gated by isFirst', () => {
  const idx = newsCardSrc.indexOf('"home-status-badge"');
  assertContains(newsCardSrc.slice(Math.max(0, idx - 80), idx + 20), 'isFirst');
});

test('home-ai-verdict gated by isFirst', () => {
  const idx = newsCardSrc.indexOf('"home-ai-verdict"');
  assertContains(newsCardSrc.slice(Math.max(0, idx - 80), idx + 20), 'isFirst');
});

test('home-first-news-card gated by index === 0', () => {
  const idx = newsFeedSrc.indexOf('"home-first-news-card"');
  assertContains(newsFeedSrc.slice(Math.max(0, idx - 80), idx + 20), 'index === 0');
});

// =============================================================================
// Summary
// =============================================================================
const total = passed + failed;
console.log(`\n${'─'.repeat(58)}`);
console.log(`Results: ${passed}/${total} passed, ${failed} failed`);
if (failed === 0) {
  console.log('🎉  All tests passed! Tour is correctly configured.\n');
} else {
  console.log('⚠️   Failures above indicate code that still needs fixing.\n');
  process.exit(1);
}
