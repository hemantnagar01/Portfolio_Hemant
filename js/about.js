/**
 * about.js — Skills Constellation Canvas + About Me Section
 *
 * Covers:
 *   A. Skills Constellation: canvas nodes, entrance animation, hover, tooltip
 *   B. About Me: portrait reveal, text stagger, stats count-up, principles
 *
 * Depends on:
 *   - utils.js  (animateValue, debounce, lerp)
 *   - loader.js (dispatches 'loaderComplete')
 *   - theme.js  (dispatches 'themechange')
 *
 * Same bootstrap pattern as hero.js, work.js, design.js.
 */

import { animateValue, debounce, lerp } from './utils.js';

/* ═══════════════════════════════════════════════════════════
   SKILL NODE DATA
═══════════════════════════════════════════════════════════ */

const GROUPS = [
  {
    id: 'frontend',
    label: 'Frontend',
    centerPct: { x: 0.25, y: 0.50 },
    colorVar: '--accent-primary',
    skills: [
      { name: 'React.js',     size: 3 },
      { name: 'React Native', size: 3 },
      { name: 'HTML5',        size: 2 },
      { name: 'CSS3',         size: 2 },
      { name: 'Tailwind CSS', size: 2 },
      { name: 'Zustand',      size: 1 },
      { name: 'Framer Motion',size: 1 },
    ],
  },
  {
    id: 'backend',
    label: 'Backend',
    centerPct: { x: 0.50, y: 0.45 },
    colorVar: '--accent-secondary',
    skills: [
      { name: 'Node.js',      size: 3 },
      { name: 'Express.js',   size: 2 },
      { name: 'Firebase',     size: 3 },
      { name: 'Firestore',    size: 2 },
      { name: 'REST APIs',    size: 2 },
      { name: 'Cloud Computing', size: 1 },
    ],
  },
  {
    id: 'languages_ai',
    label: 'Languages / AI',
    centerPct: { x: 0.75, y: 0.50 },
    colorVar: '--accent-tertiary',
    skills: [
      { name: 'JavaScript',   size: 3 },
      { name: 'TypeScript',   size: 3 },
      { name: 'Python',       size: 2 },
      { name: 'C++',          size: 2 },
      { name: 'Scikit-Learn', size: 1 },
      { name: 'Generative AI',size: 1 },
      { name: 'Prompt Eng.',  size: 1 },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════
   ABOUT ME DATA
═══════════════════════════════════════════════════════════ */

const PRINCIPLES = [
  'Architecture first. Great products are built on solid foundations.',
  'The best code is the code your users never have to think about.',
  'Iterate rapidly. Learn continuously. Build with purpose.',
  'Ship it, learn from it, make it better.',
];

const STATS = [
  { value: 2,   suffix: '+', label: 'Years of coding',      animate: true,  decimals: 0 },
  { value: 3,   suffix: '+', label: 'Projects shipped',     animate: true,  decimals: 0 },
  { value: 8.2, suffix: '',  label: 'SGPA (Current)',       animate: true,  decimals: 1 },
  { value: '∞', suffix: '',  label: 'Cups of chai',         animate: false, decimals: 0 },
];

/* ═══════════════════════════════════════════════════════════
   UTILITIES
═══════════════════════════════════════════════════════════ */

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function currentTheme() {
  return document.documentElement.getAttribute('data-theme') || 'void';
}

function readCSSVar(prop) {
  return getComputedStyle(document.documentElement).getPropertyValue(prop).trim();
}

function parseHex(cssColor) {
  const el = document.createElement('canvas');
  el.width = el.height = 1;
  const c = el.getContext('2d');
  c.fillStyle = cssColor;
  c.fillRect(0, 0, 1, 1);
  const [r, g, b] = c.getImageData(0, 0, 1, 1).data;
  return { r, g, b };
}

function rgba(rgb, a) {
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${a})`;
}

/* ═══════════════════════════════════════════════════════════
   CANVAS STATE
═══════════════════════════════════════════════════════════ */

let canvasEl     = null;
let ctx          = null;
let rafId        = null;
let canvasRunning = false;
let entranceDone  = false;
let entranceStart = 0;

/* Node array — built once, mutated for entrance animation */
let nodes = [];

/* Color cache, refreshed on themechange */
let colors = { primary: null, secondary: null, tertiary: null, muted: null, textSecondary: null };

/* Hover state */
let hoveredNode = null;
let mouseX      = -9999;
let mouseY      = -9999;

const ENTRANCE_DURATION = 900;    // ms for each node to travel to target
const GROUP_STAGGER     = 200;    // ms between group starts
const NODE_STAGGER      = 35;     // ms between nodes within group
const HOVER_RADIUS      = 28;     // px hit-test
const CONNECT_DIST      = 160;    // px max connection distance (same group)

/* ── Build Nodes ─────────────────────────────────────────── */

function buildNodes(w, h) {
  nodes = [];

  GROUPS.forEach((group, gi) => {
    const cx = group.centerPct.x * w;
    const cy = group.centerPct.y * h;

    // Spread radius: proportional to number of skills
    const spreadR = Math.min(w * 0.14, 130);

    group.skills.forEach((skill, si) => {
      // Organic cluster — place on a rough circle with random offsets
      const angleStep = (Math.PI * 2) / group.skills.length;
      const angle = angleStep * si - Math.PI / 2;
      const dist  = spreadR * (0.55 + Math.random() * 0.5);

      const rawX = cx + Math.cos(angle) * dist + (Math.random() - 0.5) * 30;
      const rawY = cy + Math.sin(angle) * dist + (Math.random() - 0.5) * 30;

      // Clamp to canvas bounds with padding
      const pad = 40;
      const tx  = Math.max(pad, Math.min(w - pad, rawX));
      const ty  = Math.max(pad, Math.min(h - pad, rawY));

      const baseRadius = skill.size * 5 + 4;

      nodes.push({
        // Identity
        name:        skill.name,
        size:        skill.size,
        groupId:     group.id,
        groupLabel:  group.label,
        groupIndex:  gi,
        skillIndex:  si,
        colorVar:    group.colorVar,

        // Final target position
        tx, ty,

        // Current animated position (starts at center)
        x: w * 0.5,
        y: h * 0.5,

        // Radii
        baseRadius,
        radius:     0,         // animated from 0 to baseRadius

        // Opacity (animated from 0)
        opacity:    0,

        // Hover state
        hoverScale: 1.0,       // animated
        dimmed:     false,
      });
    });
  });
}

/* ── Entrance: entrance time for each node ───────────────── */

function nodeEntranceDelay(node) {
  return node.groupIndex * GROUP_STAGGER + node.skillIndex * NODE_STAGGER;
}

/* ── Ease function ───────────────────────────────────────── */

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/* ── Color refresh ───────────────────────────────────────── */

function refreshColors() {
  const primary   = readCSSVar('--accent-primary');
  const secondary = readCSSVar('--accent-secondary');
  const tertiary  = readCSSVar('--accent-tertiary');
  const muted     = readCSSVar('--text-muted');
  const textSec   = readCSSVar('--text-secondary');

  colors = {
    primary:   parseHex(primary),
    secondary: parseHex(secondary),
    tertiary:  parseHex(tertiary),
    muted:     parseHex(muted),
    textSec:   parseHex(textSec),
    primaryRaw:   primary,
    secondaryRaw: secondary,
    tertiaryRaw:  tertiary,
  };
}

function groupColor(node) {
  switch (node.groupId) {
    case 'dev':   return colors.primary;
    case 'des':   return colors.secondary;
    case 'tools': return colors.tertiary;
    default:      return colors.primary;
  }
}

/* ── Draw One Frame ─────────────────────────────────────── */

function drawFrame(timestamp) {
  if (!ctx || !canvasEl) return;

  const w = parseFloat(canvasEl.style.width)  || canvasEl.offsetWidth;
  const h = parseFloat(canvasEl.style.height) || canvasEl.offsetHeight;
  const isSignal   = currentTheme() === 'signal';
  const isReduced  = prefersReducedMotion();
  const elapsed    = entranceDone ? ENTRANCE_DURATION + 9999 : (timestamp - entranceStart);

  ctx.clearRect(0, 0, w, h);

  /* ── 1. Update node positions (entrance animation) ─────── */
  nodes.forEach(node => {
    const delay    = nodeEntranceDelay(node);
    const nodeElapsed = Math.max(0, elapsed - delay);
    const t        = isReduced ? 1 : Math.min(nodeElapsed / ENTRANCE_DURATION, 1);
    const te       = easeOutCubic(t);

    node.x       = lerp(w * 0.5, node.tx, te);
    node.y       = lerp(h * 0.5, node.ty, te);
    node.opacity = t;
    node.radius  = lerp(0, node.baseRadius, te);
  });

  const allSettled = nodes.every(n => n.opacity >= 0.999);
  if (allSettled && !entranceDone) entranceDone = true;

  /* ── 2. Draw group watermark labels ─────────────────────── */
  const maxGroupDelay = (GROUPS.length - 1) * GROUP_STAGGER;
  const labelFadeStart = ENTRANCE_DURATION * 0.7;

  GROUPS.forEach((group, gi) => {
    const cx = group.centerPct.x * w;
    const cy = group.centerPct.y * h;

    const groupSettleTime = gi * GROUP_STAGGER + ENTRANCE_DURATION;
    const labelT = isReduced ? 1 : Math.min(Math.max(0, elapsed - groupSettleTime) / 400, 1);

    const labelOpacity = 0.35 * labelT * easeOutCubic(labelT);
    if (labelOpacity <= 0) return;

    ctx.save();
    ctx.globalAlpha  = labelOpacity;
    ctx.fillStyle    = rgba(colors.muted, 1);
    const fontFamily = isSignal ? 'monospace' : 'sans-serif';
    ctx.font         = `bold 48px ${fontFamily}`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(group.label, cx, cy);
    ctx.restore();
  });

  /* ── 3. Draw connections ────────────────────────────────── */

  // Same-group connections
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      if (a.groupId !== b.groupId) continue;

      const dx   = b.x - a.x;
      const dy   = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > CONNECT_DIST) continue;

      const rgb    = groupColor(a);
      const pairOpacity = Math.min(a.opacity, b.opacity);

      let lineAlpha = (1 - dist / CONNECT_DIST) * 0.18 * pairOpacity;

      // Hover: brighten lines connected to hovered node
      const isHoveredLine = hoveredNode && (a === hoveredNode || b === hoveredNode);
      if (hoveredNode) {
        lineAlpha = isHoveredLine ? lineAlpha * (0.5 / 0.18) : lineAlpha * 0.3;
      }

      // Signal: pulse bridge connections for size-3 nodes
      if (isSignal && a.size === 3 && b.size === 3) {
        const pulse = 0.18 + 0.27 * (0.5 + 0.5 * Math.sin(timestamp * 0.002 + i));
        lineAlpha   = pulse * pairOpacity;
      }

      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = rgba(rgb, lineAlpha);
      ctx.lineWidth   = 0.8;
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Cross-group bridge connections (size-3 nodes of adjacent groups)
  const bridges = [
    { a: 'dev', b: 'des' },
    { a: 'des', b: 'tools' },
  ];

  bridges.forEach(bridge => {
    const groupANodes = nodes.filter(n => n.groupId === bridge.a && n.size === 3);
    const groupBNodes = nodes.filter(n => n.groupId === bridge.b && n.size === 3);

    // Pick closest pair
    let minDist = Infinity;
    let bestA = null, bestB = null;
    groupANodes.forEach(a => {
      groupBNodes.forEach(b => {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < minDist) { minDist = d; bestA = a; bestB = b; }
      });
    });

    if (!bestA || !bestB) return;

    const pairOpacity = Math.min(bestA.opacity, bestB.opacity);
    let   bridgeAlpha = 0.12 * pairOpacity;

    if (isSignal) {
      bridgeAlpha = (0.12 + 0.18 * (0.5 + 0.5 * Math.sin(timestamp * 0.0015))) * pairOpacity;
    }

    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([4, 8]);
    ctx.strokeStyle = rgba(colors.primary, bridgeAlpha);
    ctx.lineWidth   = 0.8;
    ctx.moveTo(bestA.x, bestA.y);
    ctx.lineTo(bestB.x, bestB.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  });

  /* ── 4. Draw nodes ─────────────────────────────────────── */
  nodes.forEach(node => {
    if (node.opacity <= 0) return;

    const rgb    = groupColor(node);
    let   alpha  = 0.7 * node.opacity;
    let   r      = node.radius * node.hoverScale;

    // Hover dim/brighten
    if (hoveredNode) {
      alpha = node === hoveredNode ? 1.0 : 0.3 * node.opacity;
    }

    // Signal glow
    if (isSignal) {
      ctx.save();
      ctx.shadowBlur  = 12;
      ctx.shadowColor = rgba(rgb, 0.6);
    }

    ctx.beginPath();
    ctx.fillStyle = rgba(rgb, alpha);
    ctx.arc(node.x, node.y, Math.max(r, 0.5), 0, Math.PI * 2);
    ctx.fill();

    if (isSignal) ctx.restore();

    // Label
    if (node.opacity > 0.5) {
      const labelAlpha = Math.min((node.opacity - 0.5) * 2, 1) * (hoveredNode && node !== hoveredNode ? 0.3 : 1);
      ctx.save();
      ctx.globalAlpha  = labelAlpha * 0.85;
      ctx.fillStyle    = rgba(colors.textSec, 1);
      ctx.font         = `11px sans-serif`;
      ctx.textAlign    = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.name, node.x + r + 5, node.y);
      ctx.restore();
    }
  });
}

/* ── Animate hoverScale ─────────────────────────────────── */

function animateHoverScales(timestamp) {
  nodes.forEach(node => {
    const target = hoveredNode === node ? 1.8 : 1.0;
    node.hoverScale = lerp(node.hoverScale, target, 0.12);
  });
}

/* ── Canvas Loop ─────────────────────────────────────────── */

function loop(timestamp) {
  if (!canvasRunning) return;
  animateHoverScales(timestamp);
  drawFrame(timestamp);
  rafId = requestAnimationFrame(loop);
}

/* ── Canvas Start / Stop ─────────────────────────────────── */

function startCanvas() {
  if (canvasRunning) return;
  canvasRunning = true;
  if (!entranceStart) entranceStart = performance.now();
  rafId = requestAnimationFrame(loop);
}

function stopCanvas() {
  canvasRunning = false;
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
}

/* ── Canvas Resize ───────────────────────────────────────── */

function resizeCanvas() {
  if (!canvasEl) return;
  const parent = canvasEl.parentElement;
  const w = parent.offsetWidth;
  const h = canvasEl.offsetHeight || parseInt(getComputedStyle(canvasEl).height, 10) || 560;
  if (!w || !h) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvasEl.width  = w * dpr;
  canvasEl.height = h * dpr;
  canvasEl.style.width  = w + 'px';
  canvasEl.style.height = h + 'px';
  ctx.scale(dpr, dpr);

  // Rebuild nodes for new dimensions
  buildNodes(w, h);

  // If entrance already done, jump all nodes to target
  if (entranceDone) {
    nodes.forEach(n => {
      n.x = n.tx; n.y = n.ty;
      n.opacity = 1; n.radius = n.baseRadius;
    });
  }
}

/* ── Tooltip ─────────────────────────────────────────────── */

let tooltipEl     = null;
let tooltipHiding = false;
let tooltipHideTimer = null;

function showTooltip(node, cx, cy) {
  if (!tooltipEl) return;
  clearTimeout(tooltipHideTimer);

  tooltipEl.querySelector('.tooltip-name').textContent  = node.name;
  tooltipEl.querySelector('.tooltip-group').textContent = node.groupLabel;

  tooltipEl.classList.remove('is-hiding');

  // Constrain to canvas bounds
  const wrap   = canvasEl.parentElement;
  const wrapW  = wrap.offsetWidth;
  const wrapH  = wrap.offsetHeight;
  const ttW    = tooltipEl.offsetWidth  || 120;
  const ttH    = tooltipEl.offsetHeight || 44;
  const ox     = 12;
  const oy     = -16;

  let tx = cx + ox;
  let ty = cy + oy;

  if (tx + ttW > wrapW - 8) tx = cx - ttW - ox;
  if (ty < 8)               ty = cy + 20;
  if (ty + ttH > wrapH - 8) ty = cy - ttH - 8;

  tooltipEl.style.left = tx + 'px';
  tooltipEl.style.top  = ty + 'px';

  tooltipEl.classList.add('is-visible');
}

function hideTooltip() {
  if (!tooltipEl) return;
  tooltipEl.classList.add('is-hiding');
  tooltipHideTimer = setTimeout(() => {
    tooltipEl.classList.remove('is-visible');
    tooltipEl.classList.remove('is-hiding');
  }, 180);
}

/* ── Mouse Tracking ─────────────────────────────────────── */

function initCanvasMouse() {
  const wrap = canvasEl.parentElement;

  wrap.addEventListener('mousemove', e => {
    const rect = canvasEl.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;

    // Find nearest node
    let nearest = null;
    let minDist = HOVER_RADIUS;

    nodes.forEach(node => {
      if (node.opacity < 0.5) return;
      const dx   = node.x - mouseX;
      const dy   = node.y - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) { minDist = dist; nearest = node; }
    });

    if (nearest !== hoveredNode) {
      hoveredNode = nearest;
      if (nearest) {
        showTooltip(nearest, mouseX, mouseY);
        canvasEl.style.cursor = 'pointer';
      } else {
        hideTooltip();
        canvasEl.style.cursor = 'default';
      }
    } else if (nearest) {
      // Update tooltip position
      showTooltip(nearest, mouseX, mouseY);
    }
  }, { passive: true });

  wrap.addEventListener('mouseleave', () => {
    mouseX = -9999;
    mouseY = -9999;
    hoveredNode = null;
    hideTooltip();
    canvasEl.style.cursor = 'default';
  });
}

/* ── Canvas IntersectionObserver ─────────────────────────── */

function initCanvasIO() {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        startCanvas();
      } else {
        stopCanvas();
      }
    }
  }, { rootMargin: '200px 0px 200px 0px' });

  observer.observe(canvasEl);
}

/* ── Entrance Trigger IO ─────────────────────────────────── */

function initEntranceIO() {
  let triggered = false;
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting && !triggered) {
        triggered    = true;
        entranceStart = performance.now();
        observer.disconnect();
      }
    }
  }, { threshold: 0.2 });

  observer.observe(canvasEl);
}

/* ── Canvas Init ─────────────────────────────────────────── */

function initCanvas() {
  canvasEl = document.getElementById('skills-canvas');
  if (!canvasEl) return;

  ctx = canvasEl.getContext('2d');
  refreshColors();
  resizeCanvas();

  // ResizeObserver
  const ro = new ResizeObserver(debounce(resizeCanvas, 100));
  ro.observe(canvasEl.parentElement);

  // Mouse
  initCanvasMouse();

  // Viewport lifecycle
  initCanvasIO();
  initEntranceIO();

  // themechange
  document.addEventListener('themechange', () => {
    refreshColors();
  });

  // Reduced motion: skip to final state
  if (prefersReducedMotion()) {
    const w = parseFloat(canvasEl.style.width)  || canvasEl.offsetWidth;
    const h = parseFloat(canvasEl.style.height) || canvasEl.offsetHeight;
    entranceDone  = true;
    entranceStart = -99999;
    buildNodes(w, h);
    nodes.forEach(n => {
      n.x = n.tx; n.y = n.ty;
      n.opacity = 1; n.radius = n.baseRadius;
    });
    // Draw one static frame
    drawFrame(performance.now());
    canvasEl.style.opacity = '0.6';
  }
}

/* ═══════════════════════════════════════════════════════════
   MOBILE TAG-CLOUD
═══════════════════════════════════════════════════════════ */

function buildTagCloud() {
  const container = document.querySelector('.skills-tag-cloud');
  if (!container) return;

  container.innerHTML = '';

  GROUPS.forEach(group => {
    const section = document.createElement('div');
    section.className = 'tag-cloud-group';

    const lbl = document.createElement('span');
    lbl.className = 'tag-cloud-group-label t-label';
    lbl.textContent = group.label;
    section.appendChild(lbl);

    const pills = document.createElement('div');
    pills.className = 'tag-cloud-pills';

    group.skills.forEach(skill => {
      const pill = document.createElement('span');
      pill.className = 'tag-pill t-small';
      pill.textContent = skill.name;
      pills.appendChild(pill);
    });

    section.appendChild(pills);
    container.appendChild(section);
  });

  // IntersectionObserver for stagger entrance
  const allPills = container.querySelectorAll('.tag-pill');
  if (prefersReducedMotion()) {
    allPills.forEach(p => p.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      allPills.forEach((pill, i) => {
        setTimeout(() => pill.classList.add('is-visible'), i * 35);
      });
    }
  }, { threshold: 0.1 });

  observer.observe(container);
}

/* ═══════════════════════════════════════════════════════════
   CONSTELLATION HEADER ANIMATION
═══════════════════════════════════════════════════════════ */

function animateConstellationHeader() {
  const reduced = prefersReducedMotion();
  const label   = document.querySelector('.const-section-label');
  const right   = document.querySelector('.const-header-right');

  if (!label || !right) return;

  if (reduced) {
    label.classList.add('is-visible');
    right.classList.add('is-visible');
    return;
  }

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      setTimeout(() => label.classList.add('is-visible'), 200);
      setTimeout(() => right.classList.add('is-visible'), 350);
    }
  }, { threshold: 0.2 });

  const header = document.querySelector('.const-header');
  if (header) observer.observe(header);
}

/* ═══════════════════════════════════════════════════════════
   ABOUT ME — PORTRAIT REVEAL
═══════════════════════════════════════════════════════════ */

function animatePortrait() {
  const portrait = document.querySelector('.about-portrait');
  if (!portrait) return;

  if (prefersReducedMotion()) {
    portrait.style.clipPath = 'inset(0% 0 0 0)';
    portrait.style.transform = 'scale(1)';
    return;
  }

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      portrait.classList.add('is-visible');
    }
  }, { threshold: 0.2 });

  observer.observe(portrait);
}

/* ═══════════════════════════════════════════════════════════
   ABOUT ME — TEXT CONTENT ENTRANCE
═══════════════════════════════════════════════════════════ */

function animateAboutContent() {
  const reduced  = prefersReducedMotion();
  const eyebrow  = document.querySelector('.about-eyebrow');
  const words    = Array.from(document.querySelectorAll('.about-title-word'));
  const bio      = document.querySelector('.about-bio');
  const princi   = Array.from(document.querySelectorAll('.about-principle'));
  const stats    = Array.from(document.querySelectorAll('.about-stat'));
  const badge    = document.querySelector('.about-availability');

  const allEls = [eyebrow, bio, badge, ...words, ...princi, ...stats].filter(Boolean);

  if (reduced) {
    allEls.forEach(el => el.classList.add('is-visible'));
    // Instant stats
    stats.forEach((el, i) => {
      const stat = STATS[i];
      const val  = el.querySelector('.about-stat-value');
      if (val && stat) val.textContent = stat.value + stat.suffix;
    });
    return;
  }

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) return;
      observer.disconnect();

      // Eyebrow
      if (eyebrow) setTimeout(() => eyebrow.classList.add('is-visible'), 0);

      // Title words with clipPath stagger
      words.forEach((w, i) => {
        setTimeout(() => w.classList.add('is-visible'), 150 + i * 100);
      });

      // Bio
      if (bio) setTimeout(() => bio.classList.add('is-visible'), 400);

      // Principles stagger
      princi.forEach((p, i) => {
        setTimeout(() => p.classList.add('is-visible'), 500 + i * 80);
      });

      // Stats stagger + count-up
      stats.forEach((statEl, i) => {
        setTimeout(() => {
          statEl.classList.add('is-visible');
          const stat    = STATS[i];
          const valEl   = statEl.querySelector('.about-stat-value');
          if (!valEl || !stat) return;
          if (!stat.animate) {
            valEl.textContent = stat.value + stat.suffix;
            return;
          }
          animateValue({
            from: 0,
            to: typeof stat.value === 'number' ? stat.value : 0,
            duration: 800,
            easing: t => 1 - Math.pow(1 - t, 3),
            onUpdate: v => {
              valEl.textContent = Math.floor(v) + stat.suffix;
            },
          });
        }, 700 + i * 100);
      });

      // Availability badge
      if (badge) setTimeout(() => badge.classList.add('is-visible'), 900);
    }
  }, { threshold: 0.2 });

  const content = document.querySelector('.about-content');
  if (content) observer.observe(content);
}

/* ═══════════════════════════════════════════════════════════
   MAIN INIT
═══════════════════════════════════════════════════════════ */

function initAbout() {
  // Part A — Skills Constellation
  animateConstellationHeader();
  initCanvas();
  buildTagCloud();

  // Part B — About Me
  animatePortrait();
  animateAboutContent();
}

/* ═══════════════════════════════════════════════════════════
   ENTRY POINT — same bootstrap pattern as hero.js / work.js
═══════════════════════════════════════════════════════════ */

function bootstrap() {
  if (document.body.classList.contains('loader-complete')) {
    initAbout();
    return;
  }
  document.addEventListener('loaderComplete', initAbout, { once: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
