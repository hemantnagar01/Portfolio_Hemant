/**
 * design.js — Design Gallery & UX Case Study Section
 *
 * Covers:
 *   A. Graphic Design Gallery: filter bar, masonry, lightbox
 *   B. UX Case Study: timeline, before/after slider, metrics, quote
 *
 * Depends on:
 *   - utils.js  (animateValue, debounce)
 *   - loader.js (dispatches 'loaderComplete')
 *   - theme.js  (dispatches 'themechange')
 *
 * Same bootstrap pattern as hero.js and work.js.
 */

import { animateValue, debounce } from './utils.js';

/* ═══════════════════════════════════════════════════════════
   GALLERY DATA
═══════════════════════════════════════════════════════════ */

const GALLERY_ITEMS = [
  { id: 0,  title: 'Meridian',          subtitle: 'Brand Identity',    category: 'branding',     ratio: '4/3',  gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' },
  { id: 1,  title: 'Flora Series',      subtitle: 'Illustration',      category: 'illustration', ratio: '3/4',  gradient: 'linear-gradient(160deg, #0d2b1d 0%, #1a4a2e 60%, #0a3322 100%)' },
  { id: 2,  title: 'Carte Blanche',     subtitle: 'Print Magazine',    category: 'print',        ratio: '3/4',  gradient: 'linear-gradient(145deg, #1c1a14 0%, #2e2a18 50%, #3d3520 100%)' },
  { id: 3,  title: 'Vessel Co.',        subtitle: 'Logo & Type',       category: 'branding',     ratio: '16/9', gradient: 'linear-gradient(120deg, #1a0a2e 0%, #2d1554 50%, #3d1a6e 100%)' },
  { id: 4,  title: 'Orbital UI',        subtitle: 'Digital Interface', category: 'digital',      ratio: '4/3',  gradient: 'linear-gradient(135deg, #001a2c 0%, #003354 50%, #004d7a 100%)' },
  { id: 5,  title: 'Ink & Form',        subtitle: 'Editorial Illu.',   category: 'illustration', ratio: '4/3',  gradient: 'linear-gradient(150deg, #1a1220 0%, #2a1d38 50%, #3a2850 100%)' },
  { id: 6,  title: 'Annual Report',     subtitle: 'Print Design',      category: 'print',        ratio: '3/4',  gradient: 'linear-gradient(135deg, #0d1a1a 0%, #1a3030 50%, #103030 100%)' },
  { id: 7,  title: 'Rove Studio',       subtitle: 'Visual Identity',   category: 'branding',     ratio: '4/3',  gradient: 'linear-gradient(125deg, #2a1200 0%, #4a2200 50%, #3a1a00 100%)' },
  { id: 8,  title: 'Signal Interface',  subtitle: 'UI Design',         category: 'digital',      ratio: '16/9', gradient: 'linear-gradient(135deg, #001420 0%, #00203a 50%, #002a4d 100%)' },
  { id: 9,  title: 'Bloom Type',        subtitle: 'Type Illustration', category: 'illustration', ratio: '3/4',  gradient: 'linear-gradient(160deg, #1a0a14 0%, #2e1522 50%, #3d2030 100%)' },
  { id: 10, title: 'Alto Spirits',      subtitle: 'Packaging Design',  category: 'branding',     ratio: '3/4',  gradient: 'linear-gradient(145deg, #0a1a0d 0%, #142e18 50%, #1d4024 100%)' },
  { id: 11, title: 'Grid Studies',      subtitle: 'Digital Art',       category: 'digital',      ratio: '4/3',  gradient: 'linear-gradient(130deg, #1a1a0a 0%, #2e2e14 50%, #3d3d1e 100%)' },
];

/* ═══════════════════════════════════════════════════════════
   UX CASE STUDY DATA
═══════════════════════════════════════════════════════════ */

const TIMELINE_STAGES = [
  { num: '01', label: 'Discover', desc: '14 user interviews, 3 competitor analyses, diary studies over 2 weeks.' },
  { num: '02', label: 'Define',   desc: 'Affinity mapping → 4 core pain points → single problem statement.' },
  { num: '03', label: 'Design',   desc: '32 screens across 5 major iterations. Every decision documented.' },
  { num: '04', label: 'Build',    desc: 'React Native + Expo. Shipped to TestFlight in 6 weeks.' },
  { num: '05', label: 'Ship',     desc: 'Soft launch to 200 beta users. 4.8 stars, 94% D7 retention.' },
];

const METRICS = [
  { raw: 4.8,  display: '4.8★', label: 'App Store Rating',          suffix: '★', decimals: 1 },
  { raw: 94,   display: '94%',  label: 'Day-7 Retention',            suffix: '%', decimals: 0 },
  { raw: 2.3,  display: '2.3×', label: 'Session Length Increase',    suffix: '×', decimals: 1 },
];

/* ═══════════════════════════════════════════════════════════
   UTILITIES
═══════════════════════════════════════════════════════════ */

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function pad2(n) {
  return String(Math.floor(n)).padStart(2, '0');
}

function currentTheme() {
  return document.documentElement.getAttribute('data-theme') || 'void';
}

/* ═══════════════════════════════════════════════════════════
   PART A — GALLERY
═══════════════════════════════════════════════════════════ */

/* ── State ─────────────────────────────────────────────── */

let activeFilter  = 'all';
let lightboxIndex = 0;       // index into filteredItems
let lightboxOpen  = false;
let lbFocusableEls = [];
let lbLastFocused  = null;
let lightboxEl    = null;
let filterTransitioning = false;

/* ── Build Gallery Item ─────────────────────────────────── */

function buildGalleryItem(item) {
  const el = document.createElement('div');
  el.className = 'design-item';
  el.dataset.category = item.category;
  el.dataset.itemId   = String(item.id);
  el.setAttribute('data-cursor', 'view');
  el.setAttribute('role', 'button');
  el.setAttribute('tabindex', '0');
  el.setAttribute('aria-label', `View ${item.title} — ${item.subtitle}`);

  // Image placeholder
  const img = document.createElement('div');
  img.className = 'design-img';
  img.style.aspectRatio = item.ratio;
  img.style.setProperty('--di-gradient', item.gradient);

  // Hover overlay
  const overlay = document.createElement('div');
  overlay.className = 'design-item-overlay';
  overlay.setAttribute('aria-hidden', 'true');

  const titleEl = document.createElement('div');
  titleEl.className = 'design-item-title';
  titleEl.textContent = item.title;

  const subtitleEl = document.createElement('div');
  subtitleEl.className = 'design-item-subtitle';
  subtitleEl.textContent = item.subtitle;

  overlay.appendChild(titleEl);
  overlay.appendChild(subtitleEl);

  // Corner icon
  const corner = document.createElement('div');
  corner.className = 'design-item-corner';
  corner.setAttribute('aria-hidden', 'true');
  corner.textContent = '↗';

  img.appendChild(overlay);
  img.appendChild(corner);
  el.appendChild(img);

  return el;
}

/* ── Masonry Row-Span Calculation ───────────────────────── */

function setRowSpans(grid) {
  const rowHeight = 10; // px — must match grid-auto-rows in CSS
  const gap = 16;       // px — must match gap in CSS

  const items = Array.from(grid.querySelectorAll('.design-item:not(.is-hidden)'));
  items.forEach(item => {
    // Reset to auto first so natural height can be measured
    item.style.gridRowEnd = 'auto';
  });

  // Force reflow
  void grid.offsetHeight;

  items.forEach(item => {
    const img = item.querySelector('.design-img');
    if (!img) return;
    const h = img.getBoundingClientRect().height || img.offsetHeight;
    if (h > 0) {
      const spans = Math.ceil((h + gap) / (rowHeight + gap));
      item.style.gridRowEnd = `span ${spans}`;
    }
  });
}

/* ── Filter Logic ───────────────────────────────────────── */

function filteredItems() {
  if (activeFilter === 'all') return GALLERY_ITEMS;
  return GALLERY_ITEMS.filter(item => item.category === activeFilter);
}

function applyFilter(grid, newFilter) {
  if (filterTransitioning || newFilter === activeFilter) return;
  filterTransitioning = true;

  const allEls   = Array.from(grid.querySelectorAll('.design-item'));
  const toHide   = [];
  const toShow   = [];
  const newItems = newFilter === 'all'
    ? GALLERY_ITEMS.map(i => i.id)
    : GALLERY_ITEMS.filter(i => i.category === newFilter).map(i => i.id);

  allEls.forEach(el => {
    const id = parseInt(el.dataset.itemId, 10);
    if (newItems.includes(id)) {
      toShow.push(el);
    } else {
      toHide.push(el);
    }
  });

  // Step 1: exit existing visible items that should hide
  const hidePromises = toHide.map(el => new Promise(resolve => {
    if (el.classList.contains('is-hidden')) { resolve(); return; }
    el.style.transition = 'opacity 0.25s ease-in, transform 0.25s ease-in, visibility 0.25s ease-in';
    el.style.opacity = '0';
    el.style.transform = 'scale(0.94)';
    el.style.pointerEvents = 'none';
    el.style.visibility = 'hidden';
    setTimeout(() => {
      el.classList.add('is-hidden');
      el.style.transition = '';
      el.style.opacity = '';
      el.style.transform = '';
      resolve();
    }, 260);
  }));

  Promise.all(hidePromises).then(() => {
    activeFilter = newFilter;

    // Step 2: show entering items with stagger
    toShow.forEach((el, i) => {
      el.classList.remove('is-hidden');
      el.style.visibility = 'visible';
      el.style.pointerEvents = '';
      el.style.opacity = '0';
      el.style.transform = 'scale(0.94)';
      el.style.transition = '';

      // Force reflow so starting state is applied
      void el.offsetHeight;

      setTimeout(() => {
        el.style.transition = 'opacity 0.35s var(--ease-out-expo), transform 0.35s var(--ease-out-expo)';
        el.style.opacity = '1';
        el.style.transform = 'scale(1)';
        setTimeout(() => {
          el.style.transition = '';
          el.style.opacity = '';
          el.style.transform = '';
        }, 400);
      }, i * 40);
    });

    // Recalculate masonry after items are visible
    setTimeout(() => {
      setRowSpans(grid);
      filterTransitioning = false;
    }, toShow.length * 40 + 420);
  });
}

/* ── Filter Bar ─────────────────────────────────────────── */

function buildFilterBar(container, grid) {
  const bar = document.getElementById('design-filter-bar');
  if (!bar) return;

  const filters = [
    { value: 'all',          label: 'All' },
    { value: 'branding',     label: 'Branding' },
    { value: 'illustration', label: 'Illustration' },
    { value: 'print',        label: 'Print' },
    { value: 'digital',      label: 'Digital' },
  ];

  // Indicator element
  const indicator = document.createElement('div');
  indicator.className = 'design-filter-indicator';
  bar.appendChild(indicator);

  const buttons = filters.map(f => {
    const btn = document.createElement('button');
    btn.className = `design-filter-item${f.value === 'all' ? ' is-active' : ''}`;
    btn.textContent = f.label;
    btn.dataset.filter = f.value;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', f.value === 'all' ? 'true' : 'false');
    bar.appendChild(btn);
    return btn;
  });

  function moveIndicator(activeBtn) {
    const barRect = bar.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();
    indicator.style.left  = (btnRect.left - barRect.left) + 'px';
    indicator.style.width = btnRect.width + 'px';
  }

  // Position indicator on first active
  requestAnimationFrame(() => {
    const activeBtn = bar.querySelector('.design-filter-item.is-active');
    if (activeBtn) moveIndicator(activeBtn);
  });

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const newFilter = btn.dataset.filter;
      if (newFilter === activeFilter) return;

      // Update active state
      buttons.forEach(b => {
        b.classList.remove('is-active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('is-active');
      btn.setAttribute('aria-selected', 'true');

      // Move indicator
      moveIndicator(btn);

      // Apply filter transitions
      applyFilter(grid, newFilter);
    });
  });

  // Recalculate indicator on resize
  window.addEventListener('resize', debounce(() => {
    const activeBtn = bar.querySelector('.design-filter-item.is-active');
    if (activeBtn) moveIndicator(activeBtn);
  }, 100));
}

/* ── Build Gallery ──────────────────────────────────────── */

function buildGallery() {
  const grid = document.getElementById('design-grid');
  if (!grid) return;

  GALLERY_ITEMS.forEach(item => {
    const el = buildGalleryItem(item);
    grid.appendChild(el);
  });

  // Wire clicks
  grid.querySelectorAll('.design-item').forEach(el => {
    el.addEventListener('click', () => openLightbox(parseInt(el.dataset.itemId, 10)));
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(parseInt(el.dataset.itemId, 10));
      }
    });
  });

  // Masonry
  const ro = new ResizeObserver(debounce(() => setRowSpans(grid), 80));
  ro.observe(grid);

  // Initial row spans after images render
  requestAnimationFrame(() => setTimeout(() => setRowSpans(grid), 100));

  // Build filter bar
  buildFilterBar(null, grid);
}

/* ── Gallery Header Animation ───────────────────────────── */

function animateDesignHeader() {
  const reduced = prefersReducedMotion();
  const label   = document.querySelector('.design-section-label');
  const count   = document.querySelector('.design-count');
  const desc    = document.querySelector('.design-header-desc');

  if (!label || !count || !desc) return;

  if (reduced) {
    label.classList.add('is-visible');
    count.classList.add('is-visible');
    count.textContent = '12';
    desc.classList.add('is-visible');
    return;
  }

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) return;
      observer.disconnect();

      setTimeout(() => label.classList.add('is-visible'), 300);

      setTimeout(() => {
        count.classList.add('is-visible');
        animateValue({
          from: 0,
          to: 12,
          duration: 700,
          easing: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
          onUpdate: val => { count.textContent = pad2(val); },
        });
      }, 400);

      setTimeout(() => desc.classList.add('is-visible'), 700);
    }
  }, { threshold: 0.2 });

  const header = document.querySelector('.design-header');
  if (header) observer.observe(header);
}

/* ═══════════════════════════════════════════════════════════
   LIGHTBOX
═══════════════════════════════════════════════════════════ */

function buildLightbox() {
  const lb = document.createElement('div');
  lb.id = 'design-lightbox';
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.setAttribute('aria-label', 'Design work viewer');
  lb.setAttribute('aria-hidden', 'true');

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'lightbox-close';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.textContent = '✕';
  lb.appendChild(closeBtn);

  // Image wrap
  const imgWrap = document.createElement('div');
  imgWrap.className = 'lightbox-img-wrap';

  const imgPlaceholder = document.createElement('div');
  imgPlaceholder.className = 'lightbox-img-placeholder';

  const letter = document.createElement('div');
  letter.className = 'lightbox-img-letter';
  imgPlaceholder.appendChild(letter);

  imgWrap.appendChild(imgPlaceholder);
  lb.appendChild(imgWrap);

  // Info
  const info = document.createElement('div');
  info.className = 'lightbox-info';

  const cat = document.createElement('span');
  cat.className = 't-label lightbox-category';
  info.appendChild(cat);

  const title = document.createElement('h3');
  title.className = 't-heading lightbox-title';
  info.appendChild(title);

  const sub = document.createElement('p');
  sub.className = 't-small lightbox-subtitle';
  info.appendChild(sub);

  lb.appendChild(info);

  // Nav
  const nav = document.createElement('div');
  nav.className = 'lightbox-nav';

  const prevBtn = document.createElement('button');
  prevBtn.className = 'lb-prev';
  prevBtn.setAttribute('aria-label', 'Previous');
  prevBtn.textContent = '←';

  const counter = document.createElement('span');
  counter.className = 'lb-counter t-mono';

  const nextBtn = document.createElement('button');
  nextBtn.className = 'lb-next';
  nextBtn.setAttribute('aria-label', 'Next');
  nextBtn.textContent = '→';

  nav.appendChild(prevBtn);
  nav.appendChild(counter);
  nav.appendChild(nextBtn);
  lb.appendChild(nav);

  document.body.appendChild(lb);
  lightboxEl = lb;

  // Event wiring
  closeBtn.addEventListener('click', closeLightbox);

  lb.addEventListener('click', e => {
    if (e.target === lb) closeLightbox();
  });

  prevBtn.addEventListener('click', () => navigateLightbox(-1));
  nextBtn.addEventListener('click', () => navigateLightbox(1));

  document.addEventListener('keydown', handleLightboxKeydown);

  return lb;
}

function populateLightbox(item, visible) {
  if (!lightboxEl) return;

  const placeholder = lightboxEl.querySelector('.lightbox-img-placeholder');
  const letter      = lightboxEl.querySelector('.lightbox-img-letter');
  const cat         = lightboxEl.querySelector('.lightbox-category');
  const title       = lightboxEl.querySelector('.lightbox-title');
  const sub         = lightboxEl.querySelector('.lightbox-subtitle');
  const counter     = lightboxEl.querySelector('.lb-counter');

  placeholder.style.setProperty('--di-gradient', item.gradient);
  placeholder.style.setProperty('--lb-color', 'var(--accent-primary)');
  placeholder.style.aspectRatio = item.ratio;
  letter.textContent = item.title.charAt(0);

  cat.textContent   = item.category.charAt(0).toUpperCase() + item.category.slice(1);
  title.textContent = item.title;
  sub.textContent   = item.subtitle;

  const idx     = visible.findIndex(v => v.id === item.id);
  const total   = visible.length;
  counter.textContent = `${pad2(idx + 1)} / ${pad2(total)}`;
}

function openLightbox(itemId) {
  const visible = filteredItems();
  const item    = GALLERY_ITEMS.find(i => i.id === itemId);
  if (!item || !lightboxEl) return;

  const idx = visible.findIndex(v => v.id === itemId);
  lightboxIndex = idx >= 0 ? idx : 0;

  lbLastFocused = document.activeElement;

  populateLightbox(visible[lightboxIndex], visible);
  lightboxEl.setAttribute('aria-hidden', 'false');
  lightboxEl.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  lightboxOpen = true;

  // Collect focusable
  lbFocusableEls = Array.from(
    lightboxEl.querySelectorAll('button, [tabindex]:not([tabindex="-1"])')
  ).filter(el => !el.disabled);

  setTimeout(() => {
    const closeBtn = lightboxEl.querySelector('.lightbox-close');
    if (closeBtn) closeBtn.focus();
  }, 50);
}

function closeLightbox() {
  if (!lightboxEl || !lightboxOpen) return;
  lightboxEl.classList.remove('is-open');
  lightboxEl.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  lightboxOpen = false;

  if (lbLastFocused) {
    lbLastFocused.focus();
    lbLastFocused = null;
  }
}

function navigateLightbox(dir) {
  const visible = filteredItems();
  if (!visible.length) return;

  lightboxIndex = (lightboxIndex + dir + visible.length) % visible.length;

  // Fade out → update → fade in
  const imgWrap = lightboxEl.querySelector('.lightbox-img-wrap');
  imgWrap.style.transition = 'opacity 0.2s ease';
  imgWrap.style.opacity = '0';

  setTimeout(() => {
    populateLightbox(visible[lightboxIndex], visible);
    imgWrap.style.opacity = '1';
    setTimeout(() => {
      imgWrap.style.transition = '';
    }, 320);
  }, 210);
}

function handleLightboxKeydown(e) {
  if (!lightboxOpen) return;

  switch (e.key) {
    case 'Escape':
      closeLightbox();
      break;
    case 'ArrowLeft':
      e.preventDefault();
      navigateLightbox(-1);
      break;
    case 'ArrowRight':
      e.preventDefault();
      navigateLightbox(1);
      break;
    case 'Tab':
      trapLightboxFocus(e);
      break;
  }
}

function trapLightboxFocus(e) {
  if (!lbFocusableEls.length) return;
  const first = lbFocusableEls[0];
  const last  = lbFocusableEls[lbFocusableEls.length - 1];

  if (e.shiftKey) {
    if (document.activeElement === first) {
      e.preventDefault();
      last.focus();
    }
  } else {
    if (document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

/* ═══════════════════════════════════════════════════════════
   PART B — UX CASE STUDY
═══════════════════════════════════════════════════════════ */

/* ── UX Header Animation ────────────────────────────────── */

function animateUXHeader() {
  const reduced = prefersReducedMotion();
  const label   = document.querySelector('.ux-section-label');
  const right   = document.querySelector('.ux-header-right');

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
      setTimeout(() => right.classList.add('is-visible'), 400);
    }
  }, { threshold: 0.2 });

  const header = document.querySelector('.ux-header');
  if (header) observer.observe(header);
}

/* ── Timeline Animation ─────────────────────────────────── */

function initTimeline() {
  const reduced    = prefersReducedMotion();
  const line       = document.querySelector('.ux-timeline-line');
  const nodes      = Array.from(document.querySelectorAll('.ux-stage-node'));
  const labels     = Array.from(document.querySelectorAll('.ux-stage-label'));
  const descs      = Array.from(document.querySelectorAll('.ux-stage-desc'));

  if (!line) return;

  if (reduced) {
    line.classList.add('is-visible');
    nodes.forEach(n => n.classList.add('is-visible'));
    labels.forEach(l => l.classList.add('is-visible'));
    descs.forEach(d => d.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) return;
      observer.disconnect();

      // Draw line
      line.classList.add('is-visible');

      // Stagger nodes and text
      nodes.forEach((node, i) => {
        setTimeout(() => {
          node.classList.add('is-visible');
          setTimeout(() => {
            if (labels[i]) labels[i].classList.add('is-visible');
            if (descs[i])  descs[i].classList.add('is-visible');
          }, 200);
        }, 200 + i * 150);
      });
    }
  }, { threshold: 0.3 });

  const timeline = document.querySelector('.ux-timeline');
  if (timeline) observer.observe(timeline);
}

/* ── Before / After Slider ──────────────────────────────── */

function initBASlider() {
  const slider    = document.getElementById('ba-slider');
  const afterEl   = slider?.querySelector('.ba-after');
  const handleEl  = slider?.querySelector('.ba-handle');

  if (!slider || !afterEl || !handleEl) return;

  let isDragging = false;
  let currentPct = 50;

  function setPosition(pct) {
    pct = Math.max(0, Math.min(100, pct));
    currentPct = pct;

    // Clip the after layer — inset from right = (100 - pct)%
    afterEl.style.clipPath  = `inset(0 ${100 - pct}% 0 0)`;
    handleEl.style.left     = pct + '%';
    handleEl.setAttribute('aria-valuenow', Math.round(pct).toString());
  }

  function clientXToPercent(clientX) {
    const rect = slider.getBoundingClientRect();
    return ((clientX - rect.left) / rect.width) * 100;
  }

  // Mouse
  function onMouseDown(e) {
    isDragging = true;
    setPosition(clientXToPercent(e.clientX));
    e.preventDefault();
  }

  function onMouseMove(e) {
    if (!isDragging) return;
    setPosition(clientXToPercent(e.clientX));
  }

  function onMouseUp() {
    isDragging = false;
  }

  slider.addEventListener('mousedown', onMouseDown);
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);

  // Touch
  function onTouchStart(e) {
    isDragging = true;
    setPosition(clientXToPercent(e.touches[0].clientX));
  }

  function onTouchMove(e) {
    if (!isDragging) return;
    e.preventDefault();
    setPosition(clientXToPercent(e.touches[0].clientX));
  }

  function onTouchEnd() {
    isDragging = false;
  }

  slider.addEventListener('touchstart', onTouchStart, { passive: true });
  slider.addEventListener('touchmove', onTouchMove,  { passive: false });
  slider.addEventListener('touchend', onTouchEnd);

  // Keyboard — arrow keys when handle is focused
  handleEl.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setPosition(currentPct - 5);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setPosition(currentPct + 5);
    }
  });

  // Init at 50%
  setPosition(50);
}

/* ── Metrics Count-Up ───────────────────────────────────── */

function initMetrics() {
  const reduced  = prefersReducedMotion();
  const metricEls = Array.from(document.querySelectorAll('.ux-metric-value'));

  if (!metricEls.length) return;

  if (reduced) {
    metricEls.forEach((el, i) => {
      el.classList.add('is-visible');
      el.textContent = METRICS[i].display;
    });
    return;
  }

  const isSignal = () => currentTheme() === 'signal';

  // Character scramble for Signal theme
  function scrambleAnimate(el, metric) {
    const chars  = '0123456789';
    const target = metric.display;
    let frame    = 0;
    const total  = 18;

    function step() {
      if (frame >= total) {
        el.textContent = target;
        return;
      }
      // Scramble non-suffix, non-★/×/% chars
      let scrambled = '';
      for (let i = 0; i < target.length; i++) {
        const ch = target[i];
        if (ch >= '0' && ch <= '9' && frame < total - 2) {
          scrambled += chars[Math.floor(Math.random() * chars.length)];
        } else if (ch === '.' && frame < total - 4) {
          scrambled += '.';
        } else {
          scrambled += ch;
        }
      }
      el.textContent = scrambled;
      frame++;
      requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) return;
      observer.disconnect();

      metricEls.forEach((el, i) => {
        const metric = METRICS[i];
        setTimeout(() => {
          el.classList.add('is-visible');

          if (isSignal()) {
            scrambleAnimate(el, metric);
          } else {
            animateValue({
              from: 0,
              to: metric.raw,
              duration: 900,
              easing: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
              onUpdate: val => {
                const formatted = metric.decimals === 0
                  ? Math.floor(val).toString()
                  : val.toFixed(metric.decimals);
                el.textContent = formatted + metric.suffix;
              },
            });
          }
        }, i * 150);
      });
    }
  }, { threshold: 0.3 });

  const metricsRow = document.querySelector('.ux-metrics');
  if (metricsRow) observer.observe(metricsRow);
}

/* ── Quote Animation ────────────────────────────────────── */

function initQuote() {
  const reduced = prefersReducedMotion();
  const text    = document.querySelector('.ux-quote-text');
  const attr    = document.querySelector('.ux-quote-attribution');

  if (!text || !attr) return;

  if (reduced) {
    text.classList.add('is-visible');
    attr.classList.add('is-visible');
    return;
  }

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      setTimeout(() => text.classList.add('is-visible'), 100);
      setTimeout(() => attr.classList.add('is-visible'), 400);
    }
  }, { threshold: 0.2 });

  const wrap = document.querySelector('.ux-quote-wrap');
  if (wrap) observer.observe(wrap);
}

/* ── Signal Theme Handler ───────────────────────────────── */

function handleThemeChange() {
  // Indicator color is handled in CSS via [data-theme="signal"] selector.
  // Re-run metric animation if it has already fired and we switch to/from signal.
  const metricEls = Array.from(document.querySelectorAll('.ux-metric-value'));
  const allVisible = metricEls.every(el => el.classList.contains('is-visible'));

  if (allVisible && !prefersReducedMotion()) {
    const isSignal = currentTheme() === 'signal';

    metricEls.forEach((el, i) => {
      const metric = METRICS[i];
      setTimeout(() => {
        if (isSignal) {
          const chars = '0123456789';
          const target = metric.display;
          let frame = 0;
          const total = 18;
          function step() {
            if (frame >= total) { el.textContent = target; return; }
            let s = '';
            for (let j = 0; j < target.length; j++) {
              const ch = target[j];
              s += (ch >= '0' && ch <= '9' && frame < total - 2)
                ? chars[Math.floor(Math.random() * chars.length)]
                : ch;
            }
            el.textContent = s;
            frame++;
            requestAnimationFrame(step);
          }
          requestAnimationFrame(step);
        } else {
          animateValue({
            from: 0,
            to: metric.raw,
            duration: 600,
            easing: t => 1 - Math.pow(1 - t, 3),
            onUpdate: val => {
              const formatted = metric.decimals === 0
                ? Math.floor(val).toString()
                : val.toFixed(metric.decimals);
              el.textContent = formatted + metric.suffix;
            },
          });
        }
      }, i * 80);
    });
  }
}

/* ═══════════════════════════════════════════════════════════
   MAIN INIT
═══════════════════════════════════════════════════════════ */

function initDesign() {
  // Part A — Gallery
  buildGallery();
  buildLightbox();
  animateDesignHeader();

  // Part B — UX Case Study
  animateUXHeader();
  initTimeline();
  initBASlider();
  initMetrics();
  initQuote();

  // Theme change
  document.addEventListener('themechange', handleThemeChange);
}

/* ═══════════════════════════════════════════════════════════
   ENTRY POINT — same bootstrap pattern as hero.js / work.js
═══════════════════════════════════════════════════════════ */

function bootstrap() {
  if (document.body.classList.contains('loader-complete')) {
    initDesign();
    return;
  }
  document.addEventListener('loaderComplete', initDesign, { once: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
