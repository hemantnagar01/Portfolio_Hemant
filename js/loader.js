/**
 * loader.js — Preloader Sequence
 * Runs once per browser session (sessionStorage flag).
 * Injects full loader HTML into body, runs timed animation sequence,
 * then removes the loader and dispatches 'loaderComplete' event.
 *
 * Timeline:
 *   0ms    — Loader injected, SVG stroke begins
 *   400ms  — Counter starts (0 → 100 over 1200ms, easeOutQuad)
 *   800ms  — Progress bar dashes fill (staggered 80ms each)
 *   1800ms — Counter reaches 100
 *   2000ms — Curtain split exit begins
 *   2700ms — Loader removed, 'loaderComplete' dispatched
 */

import { animateValue, easeOutQuad, getCurrentTheme } from './utils.js';

const SESSION_KEY = 'portfolio-loader-shown';
const DASH_COUNT = 10;
const COUNTER_START = 0;
const COUNTER_END = 100;
const COUNTER_DELAY = 400;
const COUNTER_DURATION = 1400;
const BAR_DELAY = 800;
const BAR_STAGGER = 80;
const EXIT_START = 2000;
const EXIT_DURATION = 700;
const REMOVE_DELAY = 2700;

/**
 * Check if prefers-reduced-motion is active.
 * @returns {boolean}
 */
function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Pad a number to 3 digits with leading zeros.
 * @param {number} n
 * @returns {string}
 */
function padCounter(n) {
  return String(Math.floor(n)).padStart(3, '0');
}

/**
 * Scramble counter effect for Signal theme.
 * Cycles randomly through digits then locks to final value.
 * @param {HTMLElement} el
 * @param {number} finalValue
 * @param {Function} onDone
 */
function scrambleCounter(el, finalValue, onDone) {
  const SCRAMBLE_INTERVAL = 40;
  const SCRAMBLE_DURATION = COUNTER_DURATION;
  let elapsed = 0;

  const digits = el.textContent.split('');

  const interval = setInterval(() => {
    elapsed += SCRAMBLE_INTERVAL;
    const progress = elapsed / SCRAMBLE_DURATION;
    const lockedDigits = Math.floor(progress * 3); // lock digits L→R

    const target = padCounter(Math.round(finalValue * easeOutQuad(progress)));
    const result = target.split('').map((char, i) => {
      if (i < lockedDigits || progress >= 1) return char;
      return String(Math.floor(Math.random() * 10));
    });

    el.textContent = result.join('');

    if (elapsed >= SCRAMBLE_DURATION) {
      clearInterval(interval);
      el.textContent = padCounter(finalValue);
      if (onDone) onDone();
    }
  }, SCRAMBLE_INTERVAL);
}

/**
 * Build and inject the loader DOM.
 * @returns {{ loader, top, bottom, initials, counter, dashes }}
 */
function buildLoader() {
  const loader = document.createElement('div');
  loader.id = 'loader';
  loader.setAttribute('role', 'status');
  loader.setAttribute('aria-label', 'Loading portfolio');

  const top = document.createElement('div');
  top.id = 'loader-top';

  const bottom = document.createElement('div');
  bottom.id = 'loader-bottom';

  const content = document.createElement('div');
  content.id = 'loader-content';

  // ── SVG Initials ──────────────────────────────────────────
  const initialsWrapper = document.createElement('div');
  initialsWrapper.id = 'loader-initials';

  initialsWrapper.innerHTML = `
    <svg
      viewBox="0 0 140 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <!-- H — two vertical stems + centered crossbar -->
      <line x1="12" y1="12" x2="12" y2="78" stroke-linecap="round"/>
      <line x1="12" y1="45" x2="42" y2="45" stroke-linecap="round"/>
      <line x1="42" y1="12" x2="42" y2="78" stroke-linecap="round"/>
      <!-- S — smooth double-curve, optically balanced, tapered terminals -->
      <path
        d="M88 26
           C88 17 102 12 112 16
           C122 20 124 28 116 34
           C108 40  94 42  88 49
           C82 56  82 65  92 71
           C102 77 118 74 122 66"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  `;

  // ── Counter ───────────────────────────────────────────────
  const counter = document.createElement('div');
  counter.id = 'loader-counter';
  counter.className = 't-mono';
  counter.textContent = '000';
  counter.setAttribute('aria-live', 'polite');
  counter.setAttribute('aria-atomic', 'true');

  // ── Progress Bar ──────────────────────────────────────────
  const bar = document.createElement('div');
  bar.id = 'loader-bar';
  bar.setAttribute('role', 'progressbar');
  bar.setAttribute('aria-valuenow', '0');
  bar.setAttribute('aria-valuemin', '0');
  bar.setAttribute('aria-valuemax', '100');

  const dashes = [];
  for (let i = 0; i < DASH_COUNT; i++) {
    const dash = document.createElement('div');
    dash.className = 'loader-dash';
    bar.appendChild(dash);
    dashes.push(dash);
  }

  content.appendChild(initialsWrapper);
  content.appendChild(counter);
  content.appendChild(bar);

  loader.appendChild(top);
  loader.appendChild(bottom);
  loader.appendChild(content);

  // Insert at very beginning of body
  document.body.insertBefore(loader, document.body.firstChild);

  return { loader, top, bottom, initials: initialsWrapper, counter, dashes, bar };
}

/**
 * Dispatch the loader complete event and mark content interactive.
 */
function dispatchComplete() {
  document.body.classList.add('loader-complete');
  document.dispatchEvent(new CustomEvent('loaderComplete'));
}

/**
 * Run the instant (reduced-motion) version.
 * @param {HTMLElement} loader
 */
function runInstant(loader) {
  loader.remove();
  dispatchComplete();
}

/**
 * Run the full animated sequence.
 */
function runFullSequence({ loader, top, bottom, initials, counter, dashes, bar }) {
  const isSignal = getCurrentTheme() === 'signal';

  // ── Step 1 (0ms): Begin SVG stroke draw
  initials.classList.add('drawing');
  counter.classList.add('visible');

  // ── Step 2 (400ms): Start counter
  const counterTimer = setTimeout(() => {
    if (isSignal) {
      scrambleCounter(counter, COUNTER_END, null);
    } else {
      animateValue({
        from: COUNTER_START,
        to: COUNTER_END,
        duration: COUNTER_DURATION,
        easing: easeOutQuad,
        onUpdate: (val) => {
          counter.textContent = padCounter(val);
          bar.setAttribute('aria-valuenow', String(Math.floor(val)));
        },
      });
    }
  }, COUNTER_DELAY);

  // ── Step 3 (800ms): Fill progress bar dashes staggered
  const barTimer = setTimeout(() => {
    dashes.forEach((dash, i) => {
      setTimeout(() => {
        dash.classList.add('filled');
      }, i * BAR_STAGGER);
    });
  }, BAR_DELAY);

  // ── Step 4 (2000ms): Curtain split exit
  const exitTimer = setTimeout(() => {
    top.classList.add('exiting');
    bottom.classList.add('exiting');
  }, EXIT_START);

  // ── Step 5 (2700ms): Remove loader
  const removeTimer = setTimeout(() => {
    loader.remove();
    dispatchComplete();
  }, REMOVE_DELAY);

  // Store timers for cleanup (in case of early teardown)
  loader._timers = [counterTimer, barTimer, exitTimer, removeTimer];
}

/**
 * Main initialization function.
 */
function initLoader() {
  // Skip on repeat visits within same session
  if (sessionStorage.getItem(SESSION_KEY)) {
    dispatchComplete();
    return;
  }

  sessionStorage.setItem(SESSION_KEY, '1');

  const elements = buildLoader();

  if (prefersReducedMotion()) {
    // Tiny delay so CSS is parsed
    setTimeout(() => runInstant(elements.loader), 50);
  } else {
    runFullSequence(elements);
  }
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLoader);
} else {
  initLoader();
}
