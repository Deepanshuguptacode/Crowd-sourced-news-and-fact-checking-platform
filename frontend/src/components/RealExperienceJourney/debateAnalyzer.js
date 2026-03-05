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
  if (!groupCard || !textPrefix) {
    console.warn('[findCommentInGroup] Missing params:', { groupCard: !!groupCard, textPrefix: !!textPrefix });
    return null;
  }
  
  console.log('[findCommentInGroup] Searching for:', textPrefix.slice(0, 40));
  
  // Look for expanded comments section - try both AdvancedDebateRoom and DebateRoom structures
  let commentsDiv = groupCard.querySelector('.mt-3.space-y-2'); // AdvancedDebateRoom structure
  if (!commentsDiv) {
    // DebateRoom structure: div.block > div.divide-y > div.p-4 (comments)
    const blockDiv = groupCard.querySelector('div.block, div:not(.hidden)');
    if (blockDiv) {
      commentsDiv = blockDiv.querySelector('.divide-y');
    }
  }
  
  if (!commentsDiv) {
    console.warn('[findCommentInGroup] Comments container not found');
    return null;
  }
  
  const comments = Array.from(commentsDiv.children);
  console.log('[findCommentInGroup] Found', comments.length, 'comments to check');

  const normalizedPrefix = textPrefix.slice(0, 40).trim();

  for (let i = 0; i < comments.length; i++) {
    const c = comments[i];
    // Strategy 1: look for any <p> whose text starts with our prefix
    const allPs = c.querySelectorAll('p');
    for (const p of allPs) {
      const t = p.textContent?.trim() || '';
      if (t && t.startsWith(normalizedPrefix) && t.length > 20) {
        console.log('[findCommentInGroup] Found via <p> at index', i, ':', t.slice(0, 50));
        return c;
      }
    }
    // Strategy 2: full card text contains prefix
    const fullText = c.textContent?.trim() || '';
    if (fullText && fullText.includes(normalizedPrefix) && normalizedPrefix.length >= 20) {
      console.log('[findCommentInGroup] Found via fullText at index', i, ':', fullText.slice(0, 50));
      return c;
    }
  }

  console.warn('[findCommentInGroup] No matching comment found. Prefix was:', normalizedPrefix);
  return null;
};

/**
 * Find an off-topic / ungrouped comment by text prefix (global search).
 */
export const findOffTopic = (textPrefix) => {
  if (!textPrefix) {
    console.warn('[findOffTopic] No text prefix provided');
    return null;
  }
  
  const normalizedPrefix = textPrefix.slice(0, 50).trim();
  console.log('[findOffTopic] Searching for:', normalizedPrefix.slice(0, 40));
  
  const allBorderL4 = document.querySelectorAll('.border-l-4');
  console.log('[findOffTopic] Found', allBorderL4.length, 'potential off-topic elements');
  
  for (let i = 0; i < allBorderL4.length; i++) {
    const el = allBorderL4[i];
    // Pass 1: Try specific p selector (most accurate)
    const commentTextP = el.querySelector('p.text-gray-700.text-sm.mb-3, p.text-sm.mb-3, p.text-sm');
    if (commentTextP) {
      const t = commentTextP.textContent?.trim() || '';
      if (t && t.startsWith(normalizedPrefix)) {
        console.log('[findOffTopic] Found (specific p) at index', i, ':', t.slice(0, 50));
        return el;
      }
    }
    // Pass 2: Full card text search as fallback
    const fullText = el.textContent?.trim() || '';
    if (fullText && fullText.includes(normalizedPrefix)) {
      console.log('[findOffTopic] Found (full-text fallback) at index', i);
      return el;
    }
  }
  
  console.warn('[findOffTopic] No matching off-topic element found');
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
  if (!groupsContainer) {
    console.warn('[Analyzer] No groups container found!');
    return result;
  }

  // Step 1: Collect all group cards
  const allGroupCards = Array.from(groupsContainer.querySelectorAll('.mb-6'));
  console.log('[Analyzer] Found', allGroupCards.length, 'group cards');

  // SPECIAL CASE: No groups exist, only ungrouped comments
  if (allGroupCards.length === 0) {
    console.warn('[Analyzer] No groups found, extracting from ungrouped comments instead');
    const offTopicCards = document.querySelectorAll('.border-l-4');
    console.log('[Analyzer] Found', offTopicCards.length, 'ungrouped comments');
    
    // Mark as ungrouped-only mode
    result.isUngroupedOnly = true;
    
    // Separate by stance: need 2 "for", 1 "against", 1 off-topic/neutral
    const forComments = [];
    const againstComments = [];
    const otherComments = [];
    
    offTopicCards.forEach((card) => {
      const isFor = card.classList.contains('border-green-500');
      const isAgainst = card.classList.contains('border-red-500');
      const isGray = card.classList.contains('border-gray-500');
      
      if (isFor) {
        forComments.push(card);
      } else if (isAgainst) {
        againstComments.push(card);
      } else if (isGray) {
        otherComments.push(card);
      } else {
        // Fallback: if no color detected, categorize as other
        otherComments.push(card);
      }
    });
    
    console.log('[Analyzer] Stance breakdown - For:', forComments.length, 'Against:', againstComments.length, 'Other:', otherComments.length);
    
    // Combine all available comments for flexible extraction
    const allAvailable = [...forComments, ...againstComments, ...otherComments];
    
    // Extract comments intelligently based on availability
    // Priority: Use "for" comments first, then "against", then "other"
    let extracted = 0;
    
    // 1. Multi-comment: Try to use first "for" comment
    if (forComments.length >= 1 && extracted < allAvailable.length) {
      const card = forComments[0];
      const textP = card.querySelector('p.text-gray-700.text-sm.mb-3, p.text-sm.mb-3');
      const text = textP?.textContent?.trim() || '';
      if (text && text.length >= 30) {
        result.multiGroupCommentText = text;
        result.multiGroupCommentTextPrefix = text.slice(0, 60);
        sessionStorage.setItem('tour_multiCommentText', text);
        console.log('[Analyzer] Using FOR comment for multi-comment:', text.slice(0, 80));
        extracted++;
      }
    }
    
    // 2. Single-group: Try second "for", otherwise use first "against" or "other"
    if (extracted < allAvailable.length) {
      let card = null;
      let label = '';
      
      if (forComments.length >= 2) {
        card = forComments[1];
        label = 'FOR';
      } else if (againstComments.length >= 1) {
        card = againstComments[0];
        label = 'AGAINST';
      } else if (otherComments.length >= 1) {
        card = otherComments[0];
        label = 'OTHER';
      }
      
      if (card) {
        const textP = card.querySelector('p.text-gray-700.text-sm.mb-3, p.text-sm.mb-3');
        const text = textP?.textContent?.trim() || '';
        if (text && text.length >= 30) {
          result.singleGroupCommentText = text;
          result.singleGroupTextPrefix = text.slice(0, 60);
          sessionStorage.setItem('tour_singleGroupText', text);
          console.log(`[Analyzer] Using ${label} comment for single-group:`, text.slice(0, 80));
          extracted++;
        }
      }
    }
    
    // 3. Counter-argument: Must use "against" comment if available
    if (againstComments.length >= 1) {
      // Use first "against" if not already used, otherwise second
      const idx = (result.singleGroupCommentText && againstComments.length >= 2 && 
                   result.singleGroupTextPrefix === againstComments[0].querySelector('p')?.textContent?.slice(0, 60)) ? 1 : 0;
      
      if (againstComments[idx]) {
        const card = againstComments[idx];
        const textP = card.querySelector('p.text-gray-700.text-sm.mb-3, p.text-sm.mb-3');
        const text = textP?.textContent?.trim() || '';
        if (text && text.length >= 30) {
          result.counterGroupCommentText = text;
          result.counterGroupTextPrefix = text.slice(0, 60);
          sessionStorage.setItem('tour_counterGroupText', text);
          console.log('[Analyzer] Using AGAINST comment for counter:', text.slice(0, 80));
          extracted++;
        }
      }
    }
    
    // 4. Off-topic: Use any "other" comment not already used
    if (otherComments.length >= 1) {
      const card = otherComments[0];
      console.log('[Analyzer] Off-topic card found:', card);
      console.log('[Analyzer] Card HTML:', card.innerHTML?.slice(0, 200));
      
      // Try multiple strategies to find the text
      let textP = card.querySelector('p.text-sm.mb-3');
      if (!textP) textP = card.querySelector('p.text-sm');
      if (!textP) textP = card.querySelector('p[class*="text-gray"]');
      if (!textP) {
        const allPs = card.querySelectorAll('p');
        // Find the longest paragraph (likely the comment text, not metadata)
        textP = Array.from(allPs).reduce((longest, p) => {
          const text = p.textContent?.trim() || '';
          const currentLongest = longest?.textContent?.trim() || '';
          return text.length > currentLongest.length ? p : longest;
        }, null);
      }
      
      console.log('[Analyzer] Off-topic paragraph element:', textP);
      const text = textP?.textContent?.trim() || '';
      console.log('[Analyzer] Off-topic text extracted:', text?.slice(0, 100), 'Length:', text?.length);
      if (text) {
        result.offTopicCommentText = text;
        result.offTopicTextPrefix = text.slice(0, 60);
        sessionStorage.setItem('tour_offTopicText', text);
        console.log('[Analyzer] ✓ Using OTHER comment for off-topic:', text.slice(0, 80));
        extracted++;
      } else {
        console.warn('[Analyzer] ✗ Off-topic text empty, falling back to mock');
      }
    }
    
    console.log('[Analyzer] Extracted', extracted, 'comments from', allAvailable.length, 'available');
    
    // Fallback to mock for any missing texts
    if (!result.multiGroupCommentText) {
      sessionStorage.setItem('tour_multiCommentText', DEBATE_MOCK.similar);
    }
    if (!result.singleGroupCommentText) {
      sessionStorage.setItem('tour_singleGroupText', DEBATE_MOCK.newGroup);
    }
    if (!result.counterGroupCommentText) {
      sessionStorage.setItem('tour_counterGroupText', DEBATE_MOCK.counter);
    }
    if (!result.offTopicCommentText) {
      sessionStorage.setItem('tour_offTopicText', DEBATE_MOCK.offTopic);
    }
    
    console.log('[Analyzer] Ungrouped-only mode results:', result);
    return result;
  }

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
    
    // Try both structures for expanded comments
    let expandedComments = innerCard.querySelector('.mt-3.space-y-2'); // AdvancedDebateRoom
    if (!expandedComments) {
      // DebateRoom structure: look for sibling of innerCard
      const blockDiv = card.querySelector('div.block, div:not(.hidden)');
      if (blockDiv) {
        expandedComments = blockDiv.querySelector('.divide-y');
      }
    }
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

  console.log('[Analyzer] forGroups:', forGroups.length, 'againstGroups:', againstGroups.length);
  console.log('[Analyzer] singleCommentGroups:', singleCommentGroups.length, 'multiCommentGroups:', multiCommentGroups.length);
  console.log('[Analyzer] All groups:', allGroups.map(g => ({ title: g.title, count: g.commentCount, stance: g.stance })));

  // Step 4: Pick a multi-comment group + one comment to hide
  if (multiCommentGroups.length > 0) {
    const picked = multiCommentGroups[0];
    result.multiGroupTitle = picked.title;
    result.multiGroupStance = picked.stance;

    // Pick a comment (prefer index 1 if available)
    const idx = Math.min(1, picked.comments.length - 1);
    const commentEl = picked.comments[idx] || picked.comments[0];
    if (commentEl) {
      // Target the SPECIFIC p tag with comment text
      const commentTextP = commentEl.querySelector('p.text-gray-700.text-sm.mb-3, p.text-sm.mb-3');
      const fullText = commentTextP?.textContent?.trim() || '';
      
      if (!fullText || fullText.length < 30) {
        console.warn('[Analyzer] No valid text found in multi-comment, using mock');
      } else {
        console.log('[Analyzer] Found multi-comment text:', fullText.slice(0, 80));
      }
      result.multiGroupCommentText = fullText || DEBATE_MOCK.similar;
      // Store in sessionStorage for autoType
      sessionStorage.setItem('tour_multiCommentText', result.multiGroupCommentText);
      // Store prefix for re-querying (first 60 chars)
      result.multiGroupCommentTextPrefix = fullText.slice(0, 60);
    }
  } else if (allGroups.length > 0) {
    // FALLBACK: Use any available group for multi-comment
    console.warn('[Analyzer] No multi-comment groups found, using first available group as fallback');
    const picked = allGroups[0];
    result.multiGroupTitle = picked.title;
    result.multiGroupStance = picked.stance;
    
    const commentEl = picked.comments[0];
    if (commentEl) {
      const commentTextP = commentEl.querySelector('p.text-gray-700.text-sm.mb-3, p.text-sm.mb-3');
      const fullText = commentTextP?.textContent?.trim() || '';
      
      if (fullText && fullText.length >= 30) {
        console.log('[Analyzer] Fallback multi-comment text:', fullText.slice(0, 80));
        result.multiGroupCommentText = fullText;
        sessionStorage.setItem('tour_multiCommentText', result.multiGroupCommentText);
        result.multiGroupCommentTextPrefix = fullText.slice(0, 60);
      } else {
        console.warn('[Analyzer] Fallback text too short, using mock');
        result.multiGroupCommentText = DEBATE_MOCK.similar;
        sessionStorage.setItem('tour_multiCommentText', result.multiGroupCommentText);
      }
    }
  } else {
    // NO GROUPS AT ALL - use mock
    console.warn('[Analyzer] No groups found, using DEBATE_MOCK');
    sessionStorage.setItem('tour_multiCommentText', DEBATE_MOCK.similar);
  }

  // Step 5: Pick a single-comment group to hide entirely
  if (singleCommentGroups.length > 0) {
    const picked = singleCommentGroups[0];
    result.singleGroupTitle = picked.title;
    result.singleGroupStance = picked.stance;
    if (picked.comments[0]) {
      // Target the SPECIFIC p tag with comment text
      const commentTextP = picked.comments[0].querySelector('p.text-gray-700.text-sm.mb-3, p.text-sm.mb-3');
      const fullText = commentTextP?.textContent?.trim() || '';
      
      if (!fullText || fullText.length < 30) {
        console.warn('[Analyzer] No valid text found in single-group, using mock');
        result.singleGroupCommentText = DEBATE_MOCK.newGroup;
      } else {
        console.log('[Analyzer] Found single-group text:', fullText.slice(0, 80));
        result.singleGroupCommentText = fullText;
      }
      sessionStorage.setItem('tour_singleGroupText', result.singleGroupCommentText);
    } else {
      result.singleGroupCommentText = DEBATE_MOCK.newGroup;
      sessionStorage.setItem('tour_singleGroupText', result.singleGroupCommentText);
    }
  } else if (allGroups.length > 1) {
    // FALLBACK: Use second available group
    console.warn('[Analyzer] No single-comment groups found, using second group as fallback');
    const picked = allGroups[1];
    result.singleGroupTitle = picked.title;
    result.singleGroupStance = picked.stance;
    if (picked.comments[0]) {
      const commentTextP = picked.comments[0].querySelector('p.text-gray-700.text-sm.mb-3, p.text-sm.mb-3');
      const fullText = commentTextP?.textContent?.trim() || '';
      result.singleGroupCommentText = (fullText && fullText.length >= 30) ? fullText : DEBATE_MOCK.newGroup;
    } else {
      result.singleGroupCommentText = DEBATE_MOCK.newGroup;
    }
    sessionStorage.setItem('tour_singleGroupText', result.singleGroupCommentText);
  } else {
    console.warn('[Analyzer] Not enough groups for single-group, using mock');
    sessionStorage.setItem('tour_singleGroupText', DEBATE_MOCK.newGroup);
  }

  // Step 6: Off-topic / ungrouped comments (global search)
  const offTopicCards = document.querySelectorAll('.border-l-4');
  if (offTopicCards.length > 0) {
    const picked = offTopicCards[0];
    result.offTopicStance = picked.classList.contains('border-l-green-500')
      ? 'for'
      : 'against';
    // Target the SPECIFIC p tag with comment text
    const commentTextP = picked.querySelector('p.text-gray-700.text-sm.mb-3, p.text-sm.mb-3');
    const fullText = commentTextP?.textContent?.trim() || '';
    
    if (!fullText || fullText.length < 30) {
      console.warn('[Analyzer] No valid text found in off-topic, using mock');
      result.offTopicCommentText = DEBATE_MOCK.offTopic;
    } else {
      console.log('[Analyzer] Found off-topic text:', fullText.slice(0, 80));
      result.offTopicCommentText = fullText;
    }
    sessionStorage.setItem('tour_offTopicText', result.offTopicCommentText);
    result.offTopicTextPrefix = fullText.slice(0, 60);
  } else {
    console.warn('[Analyzer] No off-topic comments found, using mock');
    sessionStorage.setItem('tour_offTopicText', DEBATE_MOCK.offTopic);
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
      // Extract counter comment text properly
      if (picked.comments[0]) {
        const commentTextP = picked.comments[0].querySelector('p.text-gray-700.text-sm.mb-3, p.text-sm.mb-3');
        const fullText = commentTextP?.textContent?.trim() || '';
        
        if (!fullText || fullText.length < 30) {
          console.warn('[Analyzer] No valid text found in counter-group, using mock');
          result.counterGroupCommentText = DEBATE_MOCK.counter;
        } else {
          console.log('[Analyzer] Found counter-group text:', fullText.slice(0, 80));
          result.counterGroupCommentText = fullText;
        }
        sessionStorage.setItem('tour_counterGroupText', result.counterGroupCommentText);
      } else {
        result.counterGroupCommentText = DEBATE_MOCK.counter;
        sessionStorage.setItem('tour_counterGroupText', result.counterGroupCommentText);
      }
    } else {
      console.warn('[Analyzer] No counter-group pool, using mock');
      sessionStorage.setItem('tour_counterGroupText', DEBATE_MOCK.counter);
    }
  } else {
    console.warn('[Analyzer] No single-group to find counter for, using mock');
    sessionStorage.setItem('tour_counterGroupText', DEBATE_MOCK.counter);
  }

  return result;
};
