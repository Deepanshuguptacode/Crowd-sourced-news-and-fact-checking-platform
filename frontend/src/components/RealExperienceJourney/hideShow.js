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

// ─── Expand a group (click chevron if collapsed) ────────────────────────────

export const expandGroup = async (groupCard) => {
  if (!groupCard) return;
  const innerCard = groupCard.querySelector('.rounded-lg.p-4.border');
  if (!innerCard) return;
  // Already expanded?
  const commentsDiv = innerCard.querySelector('.mt-3.space-y-2');
  if (commentsDiv) return;
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

// ─── Select stance (click For/Against button in comment form) ───────────────

export const selectStance = async (stance) => {
  const form = document.querySelector('[data-tour="debate-room-comment-input"]');
  if (!form) return;
  const stanceButtons = form.querySelectorAll('button[type="button"]');
  const target = Array.from(stanceButtons).find((btn) => {
    const text = btn.textContent?.toLowerCase() || '';
    if (stance === 'for') return text.includes('for');
    if (stance === 'against') return text.includes('against');
    return false;
  });
  if (target) {
    target.click();
    await wait(300);
  }
};
