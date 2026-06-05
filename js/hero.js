/**
 * hero.js — Hero Section: Canvas, Role Cycling, Parallax, Scroll Indicator
 *
 * Depends on:
 *   - utils.js  (lerp, clamp)
 *   - loader.js (dispatches 'loaderComplete' CustomEvent)
 *   - theme.js  (dispatches 'themechange' CustomEvent on every theme switch)
 *
 * All absolute timing is relative to the 'loaderComplete' event (~2700ms
 * after page load) to guarantee the preloader has fully exited.
 */

import { lerp, clamp } from './utils.js';

/* ── Constants ────────────────────────────────────────────── */

const NODE_COUNT      = 65;
const CONNECTION_DIST = 160;
const REPEL_DIST      = 120;
const REPEL_FORCE     = 0.08;
const HOVER_DIST      = 40;
const LERP_FACTOR     = 0.08;

const ROLES = ['Software Developer', 'UI/UX Designer', 'Graphic Designer'];
const ROLE_HOLD_MS    = 2200;
const ROLE_TRANSIT_MS = 400;

// Delays in ms after 'loaderComplete' fires
const DELAY_EYEBROW   =  100;
const DELAY_LINE_1    =  200;
const DELAY_LINE_2    =  350;
const DELAY_LINE_3    =  500;
const DELAY_LINE_4    =  650;
const DELAY_CANVAS    =  300;
const DELAY_SCROLL    =  900;
const DELAY_ROLE      =  900;
const DELAY_META      = 1100;

/* ── State ────────────────────────────────────────────────── */

let rafId          = null;       // canvas rAF id
let parallaxRafId  = null;       // parallax rAF id
let roleTimer      = null;       // role cycling timeout
let currentRole    = 0;
let accentColor    = '';         // canvas draw color, read from CSS
let accentSecColor = '';         // secondary accent for Signal nodes

// Canvas state
let nodes          = [];
let canvasEl       = null;
let ctx            = null;
let canvasOpacity  = 0;         // fades in over 800ms
let canvasRunning  = false;

// Mouse state (relative to canvas)
let mouseX         = -9999;
let mouseY         = -9999;

// Parallax state
let scrollY        = 0;
let targetScrollY  = 0;
let heroLeft       = null;
let heroCanvas     = null;

/* ── Utility: Reduced Motion Check ───────────────────────── */

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* ── Utility: Read CSS Custom Property ───────────────────── */

function readCSSVar(prop) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(prop)
    .trim();
}

/* ── Utility: Current Theme ─────────────────────────────── */

function currentTheme() {
  return document.documentElement.getAttribute('data-theme') || 'void';
}

/* ── Canvas: Node Factory ─────────────────────────────────── */

function createNode(w, h, isSignalSecondary = false) {
  return {
    x:   Math.random() * w,
    y:   Math.random() * h,
    vx:  (Math.random() - 0.5) * 0.7,
    vy:  (Math.random() - 0.5) * 0.7,
    r:   2 + Math.random() * 2,          // base radius 2–4px
    baseR: 0,                             // set after creation
    pulseR: 0,                            // extra radius for hover pulse
    pulseTimer: 0,
    isSecondary: isSignalSecondary,       // Signal theme accent variant
  };
}

/* ── Canvas: Initialize Nodes ────────────────────────────── */

function initNodes(w, h) {
  nodes = [];
  // In Signal theme, 20% of nodes get accent-secondary color
  const secondaryCount = Math.floor(NODE_COUNT * 0.2);
  for (let i = 0; i < NODE_COUNT; i++) {
    const node = createNode(w, h, i < secondaryCount);
    node.baseR = node.r;
    nodes.push(node);
  }
}

/* ── Canvas: Resize ─────────────────────────────────────── */

function resizeCanvas() {
  if (!canvasEl) return;
  const parent = canvasEl.parentElement;
  const w = parent.offsetWidth;
  const h = parent.offsetHeight;
  if (w === 0 || h === 0) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvasEl.width  = w * dpr;
  canvasEl.height = h * dpr;
  canvasEl.style.width  = w + 'px';
  canvasEl.style.height = h + 'px';
  ctx.scale(dpr, dpr);

  // Re-initialize nodes proportionally if they exist
  if (nodes.length > 0) {
    initNodes(w, h);
  }
}

/* ── Canvas: Read Theme Colors ───────────────────────────── */

function readThemeColors() {
  accentColor    = readCSSVar('--accent-primary');
  accentSecColor = readCSSVar('--accent-secondary');
}

/* ── Canvas: Parse color → r,g,b for alpha compositing ──── */

function parseColorToRGB(cssColor) {
  // Works for both hex and rgb() forms returned by getComputedStyle
  const el = document.createElement('canvas');
  el.width = el.height = 1;
  const c = el.getContext('2d');
  c.fillStyle = cssColor;
  c.fillRect(0, 0, 1, 1);
  const [r, g, b] = c.getImageData(0, 0, 1, 1).data;
  return { r, g, b };
}

let accentRGB    = { r: 108, g: 99, b: 255 };
let accentSecRGB = { r: 57,  g: 255, b: 122 };

function refreshColors() {
  readThemeColors();
  accentRGB    = parseColorToRGB(accentColor);
  accentSecRGB = parseColorToRGB(accentSecColor);
}

/* ── Canvas: Draw One Frame ─────────────────────────────── */

function drawFrame() {
  if (!ctx || !canvasEl) return;
  const w = parseFloat(canvasEl.style.width)  || canvasEl.offsetWidth;
  const h = parseFloat(canvasEl.style.height) || canvasEl.offsetHeight;
  const isSignal = currentTheme() === 'signal';
  const isIvory  = currentTheme() === 'ivory';

  ctx.clearRect(0, 0, w, h);

  // Global opacity fade-in
  const effectiveOpacity = canvasOpacity;

  // ── Update & draw connections ──────────────────────────
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < CONNECTION_DIST) {
        const proximity = 1 - dist / CONNECTION_DIST;
        const lineAlpha = proximity * 0.35 * effectiveOpacity;
        const rgb = accentRGB;

        // Gradient line for depth
        const gradient = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
        gradient.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},${lineAlpha})`);
        gradient.addColorStop(0.5, `rgba(${rgb.r},${rgb.g},${rgb.b},${lineAlpha * 1.5})`);
        gradient.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},${lineAlpha})`);

        ctx.beginPath();
        ctx.strokeStyle = gradient;
        ctx.lineWidth = proximity * 1.2;
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }

  // ── Update & draw nodes ────────────────────────────────
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];

    // Mouse repel
    const mdx = n.x - mouseX;
    const mdy = n.y - mouseY;
    const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
    if (mdist < REPEL_DIST && mdist > 0) {
      const force = (1 - mdist / REPEL_DIST) * REPEL_FORCE;
      n.vx += (mdx / mdist) * force;
      n.vy += (mdy / mdist) * force;
    }

    // Velocity cap to prevent runaway
    const speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
    if (speed > 1.2) {
      n.vx = (n.vx / speed) * 1.2;
      n.vy = (n.vy / speed) * 1.2;
    }

    // Damping — gently drift back to base speed
    n.vx *= 0.995;
    n.vy *= 0.995;

    // Boundary bounce
    n.x += n.vx;
    n.y += n.vy;
    if (n.x < n.r)      { n.x = n.r;      n.vx = Math.abs(n.vx); }
    if (n.x > w - n.r)  { n.x = w - n.r;  n.vx = -Math.abs(n.vx); }
    if (n.y < n.r)      { n.y = n.r;       n.vy = Math.abs(n.vy); }
    if (n.y > h - n.r)  { n.y = h - n.r;  n.vy = -Math.abs(n.vy); }

    // Hover pulse
    if (mdist < HOVER_DIST) {
      n.pulseTimer = 300;
    }
    if (n.pulseTimer > 0) {
      n.pulseTimer -= 16.7;
      n.pulseR = lerp(n.pulseR, n.baseR, 0.05);
      n.r = n.baseR + (n.pulseR > 0.1 ? n.pulseR : 0);
    } else {
      n.r = lerp(n.r, n.baseR, 0.1);
    }

    // Color selection
    const rgb = (isSignal && n.isSecondary) ? accentSecRGB : accentRGB;
    const nodeAlpha = (n.isSecondary ? 0.8 : 0.55) * effectiveOpacity;

    // Signal: glow effect on larger nodes
    if (isSignal && n.r > 3) {
      ctx.save();
      ctx.shadowBlur = 12;
      ctx.shadowColor = `rgba(${rgb.r},${rgb.g},${rgb.b},0.6)`;
    }

    // Draw node with radial gradient for depth
    const gradient = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, Math.max(n.r, 0.5) * 2);
    gradient.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},${nodeAlpha})`);
    gradient.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);

    ctx.beginPath();
    ctx.fillStyle = gradient;
    ctx.arc(n.x, n.y, Math.max(n.r, 0.5) * 2, 0, Math.PI * 2);
    ctx.fill();

    // Solid core
    ctx.beginPath();
    ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${nodeAlpha * 1.2})`;
    ctx.arc(n.x, n.y, Math.max(n.r, 0.5), 0, Math.PI * 2);
    ctx.fill();

    if (isSignal && n.r > 3) {
      ctx.restore();
    }
  }
}

/* ── Canvas: Animation Loop ─────────────────────────────── */

let canvasFadeStart = 0;
const CANVAS_FADE_DURATION = 800;

function animateCanvas(timestamp) {
  if (!canvasRunning) return;

  // Fade-in opacity
  if (canvasOpacity < 1) {
    if (!canvasFadeStart) canvasFadeStart = timestamp;
    const elapsed = timestamp - canvasFadeStart;
    canvasOpacity = clamp(elapsed / CANVAS_FADE_DURATION, 0, 1);
  }

  drawFrame();
  rafId = requestAnimationFrame(animateCanvas);
}

/* ── Canvas: Start / Stop ─────────────────────────────────── */

function startCanvas() {
  if (canvasRunning) return;
  canvasRunning = true;
  canvasFadeStart = 0;
  rafId = requestAnimationFrame(animateCanvas);
  canvasEl.classList.add('canvas-ready');
}

function stopCanvas() {
  canvasRunning = false;
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

/* ── Canvas: Mouse Tracking ───────────────────────────────── */

function initCanvasMouse() {
  const rect = canvasEl.getBoundingClientRect();

  canvasEl.parentElement.addEventListener('mousemove', (e) => {
    const r = canvasEl.getBoundingClientRect();
    mouseX = e.clientX - r.left;
    mouseY = e.clientY - r.top;
  }, { passive: true });

  canvasEl.parentElement.addEventListener('mouseleave', () => {
    mouseX = -9999;
    mouseY = -9999;
  });
}

/* ── Canvas: Viewport Observer ───────────────────────────── */

function initCanvasObserver() {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          startCanvas();
        } else {
          stopCanvas();
        }
      }
    },
    { rootMargin: '200px 0px 200px 0px' }
  );
  observer.observe(canvasEl);
}

/* ── Canvas: Resize Observer ─────────────────────────────── */

function initResizeObserver() {
  const ro = new ResizeObserver(() => {
    resizeCanvas();
  });
  ro.observe(canvasEl.parentElement);
}

/* ── Role Cycling ─────────────────────────────────────────── */

function cycleRole(trackEl) {
  const textEl = trackEl.querySelector('.hero-role-text');
  if (!textEl) return;

  function swapTo(nextIndex) {
    // Exit current
    textEl.classList.add('exit-up');
    textEl.style.transitionDuration = ROLE_TRANSIT_MS + 'ms';

    roleTimer = setTimeout(() => {
      // Snap to below
      textEl.classList.remove('exit-up');
      textEl.classList.add('enter-below');
      textEl.style.transitionDuration = '0ms';
      textEl.textContent = ROLES[nextIndex];
      currentRole = nextIndex;

      // Force reflow so the enter-below is painted before transition
      void textEl.offsetHeight;

      // Enter from below
      textEl.style.transitionDuration = ROLE_TRANSIT_MS + 'ms';
      textEl.classList.remove('enter-below');

      // Hold, then next
      roleTimer = setTimeout(() => {
        const next = (nextIndex + 1) % ROLES.length;
        swapTo(next);
      }, ROLE_HOLD_MS);
    }, ROLE_TRANSIT_MS);
  }

  // Start cycling after first hold
  roleTimer = setTimeout(() => {
    const next = (currentRole + 1) % ROLES.length;
    swapTo(next);
  }, ROLE_HOLD_MS);
}

/* ── Headline Reveal ──────────────────────────────────────── */

function revealWord(selector, delay) {
  const els = document.querySelectorAll(selector);
  setTimeout(() => {
    els.forEach(el => el.classList.add('is-revealed'));
  }, delay);
}

/* ── Parallax ─────────────────────────────────────────────── */

function initParallax() {
  heroLeft   = document.querySelector('.hero-left');
  heroCanvas = document.getElementById('hero-canvas');

  if (!heroLeft || !heroCanvas) return;

  function onScroll() {
    targetScrollY = window.scrollY;
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  function parallaxFrame() {
    scrollY = lerp(scrollY, targetScrollY, LERP_FACTOR);

    if (heroLeft) {
      heroLeft.style.transform = `translateY(${scrollY * -0.12}px)`;
    }
    if (heroCanvas) {
      heroCanvas.style.transform = `translateY(${scrollY * -0.06}px)`;
    }

    parallaxRafId = requestAnimationFrame(parallaxFrame);
  }

  parallaxRafId = requestAnimationFrame(parallaxFrame);
}

/* ── Scroll Indicator ────────────────────────────────────── */

function initScrollIndicator() {
  const indicator = document.querySelector('.hero-scroll-indicator');
  if (!indicator) return;

  const heroSection = document.getElementById('hero');

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          indicator.classList.remove('is-hidden');
        } else {
          indicator.classList.add('is-hidden');
        }
      }
    },
    { threshold: 0.1 }
  );

  observer.observe(heroSection);
}

/* ── Theme Change Handler ────────────────────────────────── */

function onThemeChange() {
  refreshColors();
  // Signal theme: redistribute which nodes are secondary
  if (currentTheme() === 'signal') {
    const secondaryCount = Math.floor(nodes.length * 0.2);
    nodes.forEach((n, i) => {
      n.isSecondary = i < secondaryCount;
    });
  } else {
    nodes.forEach(n => { n.isSecondary = false; });
  }
}

/* ── Main Init — Runs After Loader Complete ─────────────── */

function initHero() {
  const reducedMotion = prefersReducedMotion();

  // ── Eyebrow ─────────────────────────────────────────────
  const eyebrow = document.querySelector('.hero-eyebrow');
  if (eyebrow) {
    if (reducedMotion) {
      eyebrow.classList.add('is-visible');
    } else {
      setTimeout(() => eyebrow.classList.add('is-visible'), DELAY_EYEBROW);
    }
  }

  // ── Headline word reveals ────────────────────────────────
  const words = document.querySelectorAll('.hero-word, .hero-cursor');
  if (reducedMotion) {
    words.forEach(w => w.classList.add('is-revealed'));
  } else {
    revealWord('[data-line="1"] .hero-word', DELAY_LINE_1);
    revealWord('[data-line="2"] .hero-word', DELAY_LINE_2);
    revealWord('[data-line="3"] .hero-word', DELAY_LINE_3);
    revealWord('[data-line="4"] .hero-word', DELAY_LINE_4);
    revealWord('[data-line="4"] .hero-cursor', DELAY_LINE_4);
  }

  // ── Role cycling ─────────────────────────────────────────
  const roleRow = document.querySelector('.hero-role-row');
  const roleTrack = document.querySelector('.hero-role-text-track');
  if (roleRow && roleTrack) {
    if (reducedMotion) {
      roleRow.classList.add('is-visible');
    } else {
      setTimeout(() => {
        roleRow.classList.add('is-visible');
        cycleRole(roleTrack);
      }, DELAY_ROLE);
    }
  }

  // ── Meta row ────────────────────────────────────────────
  const meta = document.querySelector('.hero-meta');
  if (meta) {
    if (reducedMotion) {
      meta.classList.add('is-visible');
    } else {
      setTimeout(() => meta.classList.add('is-visible'), DELAY_META);
    }
  }

  // ── Scroll indicator ────────────────────────────────────
  const scrollIndicator = document.querySelector('.hero-scroll-indicator');
  if (scrollIndicator) {
    if (reducedMotion) {
      scrollIndicator.classList.add('is-visible');
    } else {
      setTimeout(() => scrollIndicator.classList.add('is-visible'), DELAY_SCROLL);
    }
    initScrollIndicator();
  }

  // ── Canvas ──────────────────────────────────────────────
  canvasEl = document.getElementById('hero-canvas');
  if (canvasEl && !reducedMotion) {
    ctx = canvasEl.getContext('2d');
    refreshColors();
    resizeCanvas();

    const w = parseFloat(canvasEl.style.width)  || canvasEl.offsetWidth;
    const h = parseFloat(canvasEl.style.height) || canvasEl.offsetHeight;
    initNodes(w, h);

    initCanvasMouse();
    initCanvasObserver();
    initResizeObserver();

    setTimeout(startCanvas, DELAY_CANVAS);
  } else if (canvasEl && reducedMotion) {
    // Show static faint canvas at low opacity
    canvasEl.style.opacity = '0.3';
  }

  // ── Parallax ─────────────────────────────────────────────
  if (!reducedMotion) {
    initParallax();
  }

  // ── Theme change listener ─────────────────────────────────
  document.addEventListener('themechange', onThemeChange);
}

/* ── Entry Point ──────────────────────────────────────────── */

function bootstrap() {
  // If loader already completed (sessionStorage flag, reduced-motion fast-exit)
  if (document.body.classList.contains('loader-complete')) {
    initHero();
    return;
  }
  // Otherwise wait for the loader to finish
  document.addEventListener('loaderComplete', initHero, { once: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
