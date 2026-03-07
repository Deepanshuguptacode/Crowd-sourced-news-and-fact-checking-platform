/**
 * DOM helper utilities for the tour system.
 */

export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** Poll for a DOM element to appear (useful after navigation). */
export const waitForElement = (selector, timeoutMs = 10000) =>
  new Promise((resolve) => {
    const el = document.querySelector(selector);
    if (el) { resolve(el); return; }
    const interval = setInterval(() => {
      const found = document.querySelector(selector);
      if (found) { clearInterval(interval); clearTimeout(timer); resolve(found); }
    }, 100);
    const timer = setTimeout(() => { clearInterval(interval); resolve(null); }, timeoutMs);
  });

export const scrollToTarget = (selector) =>
  new Promise((resolve) => {
    const el =
      typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(resolve, 600);
    } else resolve();
  });

export const typeIntoInput = (selector, text, speed = 35) =>
  new Promise((resolve) => {
    const el =
      typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!el) {
      resolve();
      return;
    }
    el.focus();
    let i = 0;
    const isTextarea = el.tagName === 'TEXTAREA';
    const proto = isTextarea
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
    const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (!nativeSetter) {
      resolve();
      return;
    }
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

export const clearInput = (selector) => {
  const el =
    typeof selector === 'string' ? document.querySelector(selector) : selector;
  if (!el) return;
  const proto =
    el.tagName === 'TEXTAREA'
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
  const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  if (nativeSetter) {
    nativeSetter.call(el, '');
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }
};
