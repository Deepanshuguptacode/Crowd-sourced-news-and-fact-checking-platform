/**
 * Hide, show, highlight, and expand utilities for DOM elements.
 */

import { wait } from './domHelpers';

// ─── Hide / Show ────────────────────────────────────────────────────────────

export const hideElement = (el) => {
  if (!el) return;
  // Store original display value before hiding
  const computedDisplay = window.getComputedStyle(el).display;
  el.dataset.tourOriginalDisplay = computedDisplay !== 'none' ? computedDisplay : 'block';
  el.dataset.tourHidden = 'true';
  el.style.display = 'none';
};

export const showElement = (el, displayVal = '') => {
  if (!el) return;
  delete el.dataset.tourHidden;
  // Restore original display value or use provided value
  el.style.display = displayVal || el.dataset.tourOriginalDisplay || 'block';
  delete el.dataset.tourOriginalDisplay;
};

export const showWithAnimation = (el, displayVal = '') => {
  if (!el) return;
  delete el.dataset.tourHidden;
  // Restore original display value or use provided value
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

// ─── Pulse / Highlight ──────────────────────────────────────────────────────

export const pulseElement = (el, duration = 3000) => {
  if (!el) return;
  el.style.transition = 'box-shadow 0.3s ease';
  el.style.boxShadow =
    '0 0 0 4px rgba(59,130,246,0.55), 0 0 28px rgba(59,130,246,0.35)';
  el.style.borderRadius = el.style.borderRadius || '8px';
  setTimeout(() => {
    if (el) el.style.boxShadow = '';
  }, duration);
};

export const highlightResult = (el) => {
  if (!el) return;
  el.style.transition = 'all 0.4s ease';
  el.style.boxShadow =
    '0 0 0 3px rgba(34,197,94,0.7), 0 0 24px rgba(34,197,94,0.35)';
  el.style.transform = 'scale(1.02)';
  el.style.position = 'relative';
  el.style.zIndex = '99997';
};

export const highlightAction = (el) => {
  if (!el) return;
  el.style.transition = 'all 0.3s ease';
  el.style.boxShadow =
    '0 0 0 3px rgba(234,179,8,0.7), 0 0 24px rgba(234,179,8,0.35)';
  el.style.transform = 'scale(1.03)';
  el.style.position = 'relative';
  el.style.zIndex = '99997';
};

export const unhighlight = (el) => {
  if (!el) return;
  el.style.boxShadow = '';
  el.style.transform = '';
  el.style.zIndex = '';
};

export const unhighlightAll = () => {
  document.querySelectorAll('[style]').forEach((el) => {
    if (
      el.style.boxShadow &&
      (el.style.boxShadow.includes('234,179,8') ||
        el.style.boxShadow.includes('34,197,94') ||
        el.style.boxShadow.includes('59,130,246'))
    ) {
      unhighlight(el);
    }
  });
};

// ─── Pop-highlight: bright "just revealed" treatment ────────────────────────

export const popHighlight = (el) => {
  if (!el) return;
  el.style.transition = 'all 0.5s cubic-bezier(0.34,1.56,0.64,1)';
  el.style.boxShadow =
    '0 0 0 4px rgba(34,197,94,0.85), 0 16px 48px rgba(34,197,94,0.45), 0 4px 20px rgba(0,0,0,0.18)';
  el.style.transform = 'scale(1.04) translateY(-6px)';
  el.style.position = 'relative';
  el.style.zIndex = '99997';
  el.style.outline = '2px solid rgba(34,197,94,0.7)';
  el.style.outlineOffset = '3px';
  // Settle back to scale(1) after pop but keep glow
  setTimeout(() => {
    if (el) {
      el.style.transform = 'scale(1)';
    }
  }, 800);
};

// ─── Expand a group (click chevron if collapsed) ────────────────────────────

/**
 * Expand a group accordion.
 * @param {Element} groupCard  - the group root element
 * @param {boolean} force      - if true, click the chevron even if already expanded
 */
export const expandGroup = async (groupCard, force = false) => {
  if (!groupCard) return;
  const innerCard = groupCard.querySelector('.rounded-lg.p-4.border');
  if (!innerCard) return;
  // Already expanded? (skip this guard when force=true)
  if (!force) {
    const commentsDiv = innerCard.querySelector('.mt-3.space-y-2');
    if (commentsDiv) return;
  }
  // Find the chevron button
  const buttons = innerCard.querySelectorAll('button');
  const chevronBtn = Array.from(buttons).find(
    (b) =>
      b.querySelector('svg.h-4.w-4') ||
      b.querySelector('[class*="ChevronDown"]'),
  );
  if (chevronBtn) {
    chevronBtn.click();
    await wait(400);
  }
};

// ─── Select stance (click For/Against radio in comment form) ────────────────

export const selectStance = async (stance) => {
  const form = document.querySelector('[data-tour="debate-room-comment-input"]');
  if (!form) return;
  // Use the radio input directly
  const radio = form.querySelector(`input[type="radio"][value="${stance}"]`);
  if (radio) {
    radio.click();
    await wait(300);
    // Also visually highlight the label
    const label = radio.closest('label') || radio.parentElement;
    if (label) {
      label.style.transition = 'all 0.3s ease';
      label.style.boxShadow =
        stance === 'for'
          ? '0 0 0 3px rgba(34,197,94,0.7), 0 0 16px rgba(34,197,94,0.35)'
          : '0 0 0 3px rgba(239,68,68,0.7), 0 0 16px rgba(239,68,68,0.35)';
      label.style.borderRadius = '6px';
      label.style.padding = '4px 8px';
      setTimeout(() => {
        if (label) label.style.boxShadow = '';
      }, 2000);
    }
  }
};
