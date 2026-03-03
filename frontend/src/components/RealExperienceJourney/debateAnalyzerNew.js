/**
 * Debate Room Analyzer - SIMPLIFIED v4
 * 
 * Core principle: Store direct DOM element references instead of re-querying.
 * Extract text from visible elements before hiding them.
 * Show stored elements directly on user action.
 */

import { wait } from './domHelpers';
import { DEBATE_MOCK } from './constants';

/**
 * Helper: Click expand button if group is collapsed
 */
const expandGroup = async (groupCard) => {
  if (!groupCard) return;
  const expandButton = groupCard.querySelector('button');
  const buttonText = expandButton?.textContent?.toLowerCase() || '';
  if (buttonText.includes('expand')) {
    expandButton.click();
    await wait(300);
  }
};

/**
 * Helper: Extract actual comment text from a comment element
 */
const extractCommentText = (commentEl, label = 'comment') => {
  console.log(`[extractCommentText:${label}] Starting extraction...`);
  
  if (!commentEl) {
    console.warn(`[extractCommentText:${label}] No element provided!`);
    return '';
  }
  
  // Try multiple selector strategies
  const selectors = [
    'p.text-sm.mb-3',
    'p.text-gray-700',
    'p[class*="text-sm"]',
    'p'
  ];
  
  for (const selector of selectors) {
    const textP = commentEl.querySelector(selector);
    if (textP) {
      const text = textP.textContent?.trim() || '';
      console.log(`[extractCommentText:${label}] Found with '${selector}':`, text.slice(0, 60));
      
      // Verify it's actual comment content (not just metadata)
      if (text.length > 20 && !text.includes('ago') && !text.match(/^\d+\s+(comment|like)/)) {
        console.log(`[extractCommentText:${label}] ✅ Valid text extracted`);
        return text;
      }
    }
  }
  
  // Last resort: try all p tags
  const allPs = commentEl.querySelectorAll('p');
  console.log(`[extractCommentText:${label}] Trying all p tags (${allPs.length} found)...`);
  
  for (const p of allPs) {
    const text = p.textContent?.trim() || '';
    console.log(`[extractCommentText:${label}] Checking p:`, text.slice(0, 40));
    if (text.length > 20 && !text.includes('ago') && !text.match(/^\d+\s+(comment|like)/)) {
      console.log(`[extractCommentText:${label}] ✅ Valid text from all p tags`);
      return text;
    }
  }
  
  console.warn(`[extractCommentText:${label}] ❌ No valid text found!`);
  return '';
};

/**
 * Main analyzer: Find and prepare elements to hide.
 * Returns direct element references + extracted text.
 */
export const analyzeDebateRoom = async () => {
  console.log('[DebateAnalyzer] Starting analysis...');
  
  const result = {
    // Multi-comment group: hide ONE comment inside
    multiGroupElement: null,
    multiCommentElement: null,
    multiCommentText: '',
    
    // Single-comment group: hide ENTIRE group
    singleGroupElement: null,
    singleGroupText: '',
    
    // Counter group: hide ENTIRE group
    counterGroupElement: null,
    counterGroupText: '',
    
    // Off-topic comment: hide ENTIRE comment
    offTopicElement: null,
    offTopicText: '',
  };

  const container = document.querySelector('[data-tour="debate-room-groups"]');
  if (!container) {
    console.warn('[DebateAnalyzer] Groups container not found');
    return result;
  }

  // Step 1: Find all group cards
  const allGroupCards = Array.from(container.querySelectorAll('.mb-6'));
  console.log('[DebateAnalyzer] Found', allGroupCards.length, 'group cards');

  // Step 2: Expand all groups to access comments
  for (const card of allGroupCards) {
    await expandGroup(card);
  }
  await wait(300);

  // Step 3: Categorize groups
  const groups = [];
  for (const card of allGroupCards) {
    const title = card.querySelector('h3')?.textContent?.trim() || '';
    const badge = card.querySelector('.rounded-full');
    const badgeText = badge?.textContent?.toLowerCase() || '';
    const stance = badgeText.includes('for') ? 'for' : 'against';
    
    // Find comments container (try both structures)
    let commentsContainer = card.querySelector('.mt-3.space-y-2');
    if (!commentsContainer) {
      const blockDiv = card.querySelector('div.block, div:not(.hidden)');
      if (blockDiv) {
        commentsContainer = blockDiv.querySelector('.divide-y');
      }
    }
    
    const comments = commentsContainer ? Array.from(commentsContainer.children) : [];
    const hasCounter = card.innerHTML.includes('counter-link') || card.innerHTML.includes('Linked');
    
    groups.push({
      element: card,
      title,
      stance,
      comments,
      commentCount: comments.length,
      hasCounter
    });
  }

  const multiCommentGroups = groups.filter(g => g.commentCount > 1);
  const singleCommentGroups = groups.filter(g => g.commentCount === 1);

  // Step 4: Pick a multi-comment group and one comment to hide
  if (multiCommentGroups.length > 0) {
    const picked = multiCommentGroups[0];
    result.multiGroupElement = picked.element;
    console.log('[DebateAnalyzer] Multi-group picked:', picked.title, '- comments:', picked.comments.length);
    
    // Pick second comment if available, otherwise first
    const commentIndex = Math.min(1, picked.comments.length - 1);
    const commentEl = picked.comments[commentIndex];
    
    if (commentEl) {
      result.multiCommentElement = commentEl;
      console.log('[DebateAnalyzer] Multi-comment element:', commentEl);
      const text = extractCommentText(commentEl, 'multiComment');
      result.multiCommentText = text || DEBATE_MOCK.similar;
      
      if (!text) {
        console.error('[DebateAnalyzer] ❌ FAILED to extract multi-comment text - using MOCK');
      } else {
        console.log('[DebateAnalyzer] ✅ Multi-comment text extracted:', text.slice(0, 80));
      }
    console.log('[DebateAnalyzer] Single-group picked:', picked.title);
    
    if (picked.comments[0]) {
      const text = extractCommentText(picked.comments[0], 'singleGroup');
      result.singleGroupText = text || DEBATE_MOCK.newGroup;
      
      if (!text) {
        console.error('[DebateAnalyzer] ❌ FAILED to extract single-group text - using MOCK');
      } else {
        console.log('[DebateAnalyzer] ✅ Single-group text extracted:', text.slice(0, 80));
      }
    }
  } else {
    console.warn('[DebateAnalyzer] No single-comment groups found!');
  }

  // Step 6: Pick counter group (opposite stance from single, has counter link)
  if (result.singleGroupElement) {
    const singleStance = groups.find(g => g.element === result.singleGroupElement)?.stance;
    const oppositeStance = singleStance === 'for' ? 'against' : 'for';
    
    const counterCandidates = groups.filter(g => 
      g.stance === oppositeStance && 
      g.element !== result.multiGroupElement &&
      g.element !== result.singleGroupElement
    );
    
    const picked = counterCandidates.find(g => g.hasCounter) || counterCandidates[0];
    
    if (picked) {
      result.counterGroupElement = picked.element;
      if (picked.comments[0]) {
        const text = extractCommentText(picked.comments[0]);
        result.counterGroupText = text || DEBATE_MOCK.counter;
        console.log('[DebateAnalyzer] Counter-group text:', text.slice(0, 60));
      }
    }
  }

  // Step 7: Find off-topic comments (ungrouped, border-l-4)
  const offTopicElements = document.querySelectorAll('.border-l-4');
  if (offTopicElements.length > 0) {
    const picked = offTopicElements[0];
    result.offTopicElement = picked;
    const text = extractCommentText(picked);
    result.offTopicText = text || DEBATE_MOCK.offTopic;
    console.log('[DebateAnalyzer] Off-topic text:', text.slice(0, 60));
  }

  console.log('[DebateAnalyzer] Analysis complete:', {
    hasMultiComment: !!result.multiCommentElement,
    hasSingleGroup: !!result.singleGroupElement,
    hasCounterGroup: !!result.counterGroupElement,
    hasOffTopic: !!result.offTopicElement
  });

  return result;
};
