/**
 * cursor.js — Custom Cursor System
 * Two-part cursor: dot (1:1) + ring (lerp).
 * Disabled entirely on touch devices.
 * Responds to data-cursor="hover|view|drag" on any element.
 */

import { lerp, isTouchDevice } from './utils.js';

const LERP_FACTOR = 0.1;
const RING_STATES = ['state-hover', 'state-view', 'state-drag'];

let dot;
let ring;
let cursorLabel;

// Current mouse position (instant)
let mouseX = -100;
let mouseY = -100;

// Ring's interpolated position
let ringX = -100;
let ringY = -100;

let rafId = null;
let isHidden = true;

/**
 * Update ring position via lerp each animation frame.
 */
function tick() {
  ringX = lerp(ringX, mouseX, LERP_FACTOR);
  ringY = lerp(ringY, mouseY, LERP_FACTOR);

  dot.style.transform = `translate(calc(${mouseX}px - 50%), calc(${mouseY}px - 50%))`;
  ring.style.transform = `translate(calc(${ringX}px - 50%), calc(${ringY}px - 50%))`;

  rafId = requestAnimationFrame(tick);
}

/**
 * Clear all ring state classes and reset to default.
 */
function resetRingState() {
  RING_STATES.forEach(cls => {
    ring.classList.remove(cls);
    dot.classList.remove(cls);
  });
  cursorLabel.textContent = '';
}

/**
 * Apply a cursor state based on data-cursor value.
 * @param {string} state
 * @param {HTMLElement} target
 */
function applyCursorState(state, target) {
  resetRingState();
  switch (state) {
    case 'hover':
      ring.classList.add('state-hover');
      dot.classList.add('state-hover');
      break;
    case 'view':
      ring.classList.add('state-view');
      dot.classList.add('state-view');
      cursorLabel.textContent = 'VIEW';
      break;
    case 'drag':
      ring.classList.add('state-drag');
      dot.classList.add('state-drag');
      cursorLabel.textContent = '⇔';
      break;
  }
}

/**
 * Attach cursor-state listeners to a single element.
 * @param {HTMLElement} el
 */
function attachCursorListeners(el) {
  const state = el.dataset.cursor;
  if (!state) return;

  el.addEventListener('mouseenter', () => applyCursorState(state, el));
  el.addEventListener('mouseleave', resetRingState);
}

/**
 * Observe DOM changes to attach listeners to newly added elements.
 */
function observeNewElements() {
  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== 1) continue;
        if (node.dataset?.cursor) attachCursorListeners(node);
        node.querySelectorAll?.('[data-cursor]').forEach(attachCursorListeners);
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

/**
 * Initialize the cursor system.
 */
export function initCursor() {
  // Touch devices: add class and abort
  if (isTouchDevice()) {
    document.body.classList.add('touch-device');
    return;
  }

  dot = document.getElementById('cursor-dot');
  ring = document.getElementById('cursor-ring');

  if (!dot || !ring) return;

  // Create the inner label span
  cursorLabel = document.createElement('span');
  cursorLabel.className = 'cursor-label';
  ring.appendChild(cursorLabel);

  // Hide native cursor
  document.body.style.cursor = 'none';

  // Show cursors when mouse enters viewport
  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (isHidden) {
      isHidden = false;
      dot.classList.remove('cursor-hidden');
      ring.classList.remove('cursor-hidden');

      // Snap ring to mouse on first move
      ringX = mouseX;
      ringY = mouseY;

      if (!rafId) rafId = requestAnimationFrame(tick);
    }
  }, { passive: true });

  // Hide cursors when mouse leaves viewport
  document.addEventListener('mouseleave', () => {
    isHidden = true;
    dot.classList.add('cursor-hidden');
    ring.classList.add('cursor-hidden');
  });

  // Attach state listeners to existing elements
  document.querySelectorAll('[data-cursor]').forEach(attachCursorListeners);

  // Watch for future elements
  observeNewElements();

  // Initially hidden until mouse moves
  dot.classList.add('cursor-hidden');
  ring.classList.add('cursor-hidden');
}

// Auto-initialize on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCursor);
} else {
  initCursor();
}
