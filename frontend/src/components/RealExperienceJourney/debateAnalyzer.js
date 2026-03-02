/**
 * Async Debate Room Analyzer — v3
 *
 * Key improvements over v2:
 * 1. Expands ALL collapsed groups behind loading screen to read actual text
 * 2. Stores identifying info (title, stance, textPrefix) — NOT DOM refs
 * 3. Provides re-query helpers: findGroup(), findCommentInGroup(), findOffTopic()
 */

import { wait } from './domHelpers';
import { expandGroup } from './hideShow';
import { DEBATE_MOCK } from './constants';

// ─── Re-query helpers (robust against React re-renders) ─────────────────────

/**
 * Find a group card by its title text and stance color.
 */
export const findGroup = (title, stance) => {
  const container = document.querySelector('[data-tour="debate-room-groups"]');
  if (!container) return null;
  const allCards = container.querySelectorAll('.mb-6');
  for (const card of allCards) {
    const innerCard = card.querySelector('.rounded-lg.p-4.border');
    if (!innerCard) continue;
    const h3 = innerCard.querySelector('h3');
    if (!h3) continue;
    const cardTitle = h3.textContent?.trim() || '';
    // Match by title
    if (cardTitle !== title) continue;
    // Verify stance via badge
    const badge = card.querySelector('.rounded-full');
    const badgeText = badge?.textContent?.toLowerCase() || '';
    if (stance === 'for' && !badgeText.includes('for')) continue;
    if (stance === 'against' && !badgeText.includes('against')) continue;
    return card;
  }
  return null;
};

/**
 * Find a comment element inside an expanded group by matching text prefix.
 */
export const findCommentInGroup = (groupCard, textPrefix) => {
  if (!groupCard || !textPrefix) return null;
  const innerCard = groupCard.querySelector('.rounded-lg.p-4.border');
  if (!innerCard) return null;
  const commentsDiv = innerCard.querySelector('.mt-3.space-y-2');
  if (!commentsDiv) return null;
  const comments = Array.from(commentsDiv.children);
  for (const c of comments) {
    const p = c.querySelector('p');
    const t = p?.textContent?.trim() || '';
    if (t.startsWith(textPrefix)) return c;
  }
  return null;
};

/**
 * Find an off-topic / ungrouped comment by text prefix (global search).
 */
export const findOffTopic = (textPrefix) => {
  if (!textPrefix) return null;
  const allBorderL4 = document.querySelectorAll('.border-l-4');
  for (const el of allBorderL4) {
    const p = el.querySelector('p.text-sm') || el.querySelector('p');
    const t = p?.textContent?.trim() || '';
    if (t.startsWith(textPrefix)) return el;
  }
  return null;
};

// ─── Main async analyzer ────────────────────────────────────────────────────

/**
 * Analyzes the debate room page. MUST be awaited.
 * Expands all groups to read actual comment text.
 * Returns metadata (titles, stances, text prefixes) for re-querying.
 */
export const analyzeDebateRoom = async () => {
  const result = {
    // Single-comment group: hide the ENTIRE group card
    singleGroupTitle: '',
    singleGroupStance: null,
    singleGroupCommentText: '',
    // Multi-comment group: hide ONE comment inside
    multiGroupTitle: '',
    multiGroupStance: null,
    multiGroupCommentTextPrefix: '',
    multiGroupCommentText: '',
    // Counter group: opposite stance, hide ENTIRE group
    counterGroupTitle: '',
    counterGroupStance: null,
    counterGroupCommentText: '',
    // Off-topic: ungrouped comment
    offTopicTextPrefix: '',
    offTopicCommentText: '',
    offTopicStance: null,
  };

  const groupsContainer = document.querySelector(
    '[data-tour="debate-room-groups"]',
  );
  if (!groupsContainer) return result;

  // Step 1: Collect all group cards
  const allGroupCards = Array.from(groupsContainer.querySelectorAll('.mb-6'));

  // Step 2: Expand ALL collapsed groups
  for (const card of allGroupCards) {
    await expandGroup(card);
  }
  await wait(300);

  // Step 3: Categorize by stance
  const forGroups = [];
  const againstGroups = [];

  for (const card of allGroupCards) {
    const stanceBadge = card.querySelector('.rounded-full');
    const badgeText = stanceBadge?.textContent || '';
    const isFor = badgeText.includes('For');
    const isAgainst = badgeText.includes('Against');

    const innerCard = card.querySelector('.rounded-lg.p-4.border');
    if (!innerCard) continue;

    const title = innerCard.querySelector('h3')?.textContent?.trim() || '';
    const expandedComments = innerCard.querySelector('.mt-3.space-y-2');
    const commentEls = expandedComments
      ? Array.from(expandedComments.children)
      : [];

    // Count from badge text or from DOM
    const countSpan = innerCard.querySelector('.text-xs.text-gray-500');
    const countText = countSpan?.textContent || '';
    const countMatch = countText.match(/(\d+)/);
    const commentCount = countMatch
      ? parseInt(countMatch[1], 10)
      : commentEls.length;

    const hasCounter = innerCard.innerHTML.includes('Linked');

    const groupInfo = {
      element: card,
      title,
      commentCount,
      comments: commentEls,
      hasCounter,
    };

    if (isFor) forGroups.push({ ...groupInfo, stance: 'for' });
    else if (isAgainst) againstGroups.push({ ...groupInfo, stance: 'against' });
  }

  const allGroups = [...forGroups, ...againstGroups];
  const singleCommentGroups = allGroups.filter((g) => g.commentCount <= 1);
  const multiCommentGroups = allGroups.filter((g) => g.commentCount > 1);

  // Step 4: Pick a multi-comment group + one comment to hide
  if (multiCommentGroups.length > 0) {
    const picked = multiCommentGroups[0];
    result.multiGroupTitle = picked.title;
    result.multiGroupStance = picked.stance;

    // Pick a comment (prefer index 1 if available)
    const idx = Math.min(1, picked.comments.length - 1);
    const commentEl = picked.comments[idx] || picked.comments[0];
    if (commentEl) {
      const p = commentEl.querySelector('p');
      const fullText = p?.textContent?.trim() || '';
      result.multiGroupCommentText = fullText || DEBATE_MOCK.similar;
      // Store prefix for re-querying (first 60 chars)
      result.multiGroupCommentTextPrefix = fullText.slice(0, 60);
    }
  }

  // Step 5: Pick a single-comment group to hide entirely
  if (singleCommentGroups.length > 0) {
    const picked = singleCommentGroups[0];
    result.singleGroupTitle = picked.title;
    result.singleGroupStance = picked.stance;
    if (picked.comments[0]) {
      const p = picked.comments[0].querySelector('p');
      result.singleGroupCommentText =
        p?.textContent?.trim() || DEBATE_MOCK.newGroup;
    } else {
      result.singleGroupCommentText = DEBATE_MOCK.newGroup;
    }
  }

  // Step 6: Off-topic / ungrouped comments (global search)
  const offTopicCards = document.querySelectorAll('.border-l-4');
  if (offTopicCards.length > 0) {
    const picked = offTopicCards[0];
    result.offTopicStance = picked.classList.contains('border-l-green-500')
      ? 'for'
      : 'against';
    const textEl = picked.querySelector('p.text-sm') || picked.querySelector('p');
    const fullText = textEl?.textContent?.trim() || '';
    result.offTopicCommentText = fullText || DEBATE_MOCK.offTopic;
    result.offTopicTextPrefix = fullText.slice(0, 60);
  }

  // Step 7: Counter group — opposite stance to singleGroup
  if (result.singleGroupTitle) {
    const oppositePool =
      result.singleGroupStance === 'for' ? againstGroups : forGroups;
    const pool = oppositePool.filter(
      (g) =>
        g.title !== result.multiGroupTitle &&
        g.title !== result.singleGroupTitle,
    );
    if (pool.length > 0) {
      const picked = pool.find((g) => g.hasCounter) || pool[0];
      result.counterGroupTitle = picked.title;
      result.counterGroupStance = picked.stance;
      result.counterGroupCommentText =
        picked.comments[0]?.querySelector('p')?.textContent?.trim() ||
        DEBATE_MOCK.counter;
    }
  }

  return result;
};
