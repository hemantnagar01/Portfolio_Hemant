/**
 * utils.js — Shared Utilities
 * Pure functions used across all JS modules.
 * No side effects, no DOM access at module level.
 */

/**
 * Linear interpolation between two values.
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Interpolation factor (0–1)
 * @returns {number}
 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Clamp a value between min and max.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Returns a debounced version of fn that delays invoking it
 * until after `wait` ms have elapsed since the last call.
 * @param {Function} fn
 * @param {number} wait - Milliseconds
 * @returns {Function}
 */
export function debounce(fn, wait) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}

/**
 * Splits a text node's content into individual character spans.
 * Wraps each character in <span class="char"> with a data-char attribute.
 * Spaces are wrapped in <span class="char space">.
 * @param {HTMLElement} el - Target element whose textContent will be split
 * @returns {HTMLElement[]} - Array of created span elements
 */
export function splitText(el) {
  const text = el.textContent;
  el.textContent = '';
  el.setAttribute('aria-label', text);
  el.setAttribute('role', 'text');

  const spans = [];
  for (const char of text) {
    const span = document.createElement('span');
    span.classList.add('char');
    if (char === ' ') {
      span.classList.add('space');
      span.innerHTML = '&nbsp;';
    } else {
      span.textContent = char;
    }
    span.dataset.char = char;
    el.appendChild(span);
    spans.push(span);
  }
  return spans;
}

/**
 * EaseOutQuad — used for counter animation.
 * @param {number} t - Progress 0–1
 * @returns {number}
 */
export function easeOutQuad(t) {
  return 1 - (1 - t) * (1 - t);
}

/**
 * Animate a numeric value from start to end over duration ms.
 * Calls onUpdate(value) each frame, onComplete() when done.
 * @param {object} opts
 * @param {number} opts.from
 * @param {number} opts.to
 * @param {number} opts.duration - ms
 * @param {Function} opts.easing - (t: 0–1) => number
 * @param {Function} opts.onUpdate
 * @param {Function} [opts.onComplete]
 * @returns {Function} cancel — call to abort animation
 */
export function animateValue({ from, to, duration, easing, onUpdate, onComplete }) {
  let startTime = null;
  let rafId;

  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = clamp(elapsed / duration, 0, 1);
    const easedProgress = easing(progress);
    const current = from + (to - from) * easedProgress;
    onUpdate(current);

    if (progress < 1) {
      rafId = requestAnimationFrame(step);
    } else {
      if (onComplete) onComplete();
    }
  }

  rafId = requestAnimationFrame(step);

  return function cancel() {
    cancelAnimationFrame(rafId);
  };
}

/**
 * Detect if the current device is touch-only.
 * @returns {boolean}
 */
export function isTouchDevice() {
  return navigator.maxTouchPoints > 0;
}

/**
 * Get the current theme from the html element.
 * @returns {string} 'void' | 'ivory' | 'signal'
 */
export function getCurrentTheme() {
  return document.documentElement.getAttribute('data-theme') || 'void';
}
