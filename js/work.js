/**
 * work.js — Work Section: Scroll Reveal, Hover States, Case Study Overlay,
 *            Mobile Carousel, Header Animation
 *
 * Depends on:
 *   - utils.js  (animateValue, debounce)
 *   - loader.js (dispatches 'loaderComplete')
 *   - theme.js  (dispatches 'themechange')
 *
 * Follows the exact same IntersectionObserver + bootstrap pattern as hero.js.
 */

import { animateValue, debounce } from './utils.js';

/* ── Project Data ─────────────────────────────────────────── */

const PROJECTS = [
  {
    id: 0,
    name: 'FreshCart',
    category: 'Full-Stack Web App',
    year: '2024',
    tags: ['React', 'Firebase', 'Tailwind', 'Node.js'],
    description:
      'A comprehensive grocery delivery web application featuring secure user authentication, shopping cart management, and seamless Stripe payment integration.',
    role: 'Full-Stack Developer',
    color: '#39FF7A',
    initial: 'F',
    template: 'feature-split',
    steps: [
      { label: 'Discovery',    desc: 'Analyzed existing grocery delivery apps to identify pain points in checkout flows.' },
      { label: 'Frontend',     desc: 'Built a responsive UI with React and Tailwind CSS, utilizing Redux for state management.' },
      { label: 'Backend',      desc: 'Implemented Node.js & Express API with Firebase authentication and Firestore database.' },
      { label: 'Integration',  desc: 'Seamlessly integrated Stripe for secure payment processing and order confirmation.' },
    ],
  },
  {
    id: 1,
    name: 'Personal Portfolio',
    category: 'Frontend Development',
    year: '2024',
    tags: ['React', 'Framer Motion', 'Tailwind', 'EmailJS'],
    description:
      'A highly interactive and visually engaging portfolio website designed to showcase projects, skills, and professional experience.',
    role: 'Frontend Developer',
    color: '#00E5FF',
    initial: 'P',
    template: 'offset-tilt',
    steps: [
      { label: 'Design',       desc: 'Created high-fidelity wireframes focusing on Awwwards-level micro-interactions.' },
      { label: 'Build',        desc: 'Developed with React.js and Tailwind CSS, prioritizing performance and accessibility.' },
      { label: 'Animation',    desc: 'Integrated Framer Motion for fluid page transitions and scroll-based reveal effects.' },
      { label: 'Ship',         desc: 'Configured EmailJS for direct contact form submissions without a backend.' },
    ],
  },
  {
    id: 2,
    name: 'Trivana Hospitality',
    category: 'Mobile App Development',
    year: '2024',
    tags: ['React Native', 'TypeScript', 'Zustand'],
    description:
      'A point-of-sale mobile application for hospitality management, built during my internship to streamline restaurant operations.',
    role: 'Mobile Dev Intern',
    color: '#6C63FF',
    initial: 'T',
    template: 'type-watermark',
    steps: [
      { label: 'Onboarding',   desc: 'Adapted to the existing codebase and development environment.' },
      { label: 'Features',     desc: 'Implemented new UI components and fixed state management bugs using Zustand.' },
      { label: 'Testing',      desc: 'Conducted rigorous manual testing to ensure POS reliability during peak hours.' },
      { label: 'Deployment',   desc: 'Assisted in preparing release candidates for staging and production environments.' },
    ],
  }
];

/* ── Utility: Reduced Motion ─────────────────────────────── */

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* ── Utility: Pad number to 2 digits ────────────────────── */

function pad2(n) {
  return String(Math.floor(n)).padStart(2, '0');
}

/* ── Build Tag Pill ─────────────────────────────────────── */

function buildTag(label) {
  const span = document.createElement('span');
  span.className = 'work-tag';
  span.textContent = label;
  return span;
}

/* ── Build Image Placeholder ─────────────────────────────── */

function buildImgPlaceholder(project, extraClass = '') {
  const div = document.createElement('div');
  div.className = `work-img-placeholder${extraClass ? ' ' + extraClass : ''}`;
  div.style.setProperty('--project-color', project.color);

  const shape = document.createElement('div');
  shape.className = 'placeholder-shape';
  shape.textContent = project.initial;
  shape.setAttribute('aria-hidden', 'true');
  div.appendChild(shape);

  return div;
}

/* ── Build Hover Meta ────────────────────────────────────── */

function buildMeta(project) {
  const meta = document.createElement('div');
  meta.className = 'work-item-meta';

  const role = document.createElement('span');
  role.className = 'work-item-role';
  role.textContent = project.role;
  meta.appendChild(role);

  const tagsRow = document.createElement('div');
  tagsRow.className = 'work-tags';
  project.tags.forEach(t => tagsRow.appendChild(buildTag(t)));
  meta.appendChild(tagsRow);

  return meta;
}

/* ── Build Arrow ─────────────────────────────────────────── */

function buildArrow() {
  const arrow = document.createElement('span');
  arrow.className = 'work-item-arrow';
  arrow.textContent = '↗';
  arrow.setAttribute('aria-hidden', 'true');
  return arrow;
}

/* ────────────────────────────────────────────────────────────
   TEMPLATE BUILDERS
──────────────────────────────────────────────────────────── */

/* Template A — Feature Split */
function buildFeatureSplit(project, index) {
  const item = document.createElement('div');
  item.className = 'work-item work-item--feature-split';
  item.dataset.projectId = String(index);
  item.setAttribute('data-cursor', 'view');
  item.setAttribute('role', 'button');
  item.setAttribute('tabindex', '0');
  item.setAttribute('aria-label', `View case study: ${project.name}`);
  item.style.setProperty('--project-color', project.color);

  // Left column
  const colLeft = document.createElement('div');
  colLeft.className = 'work-col-left';

  const num = document.createElement('span');
  num.className = 'work-project-num';
  num.textContent = '01';
  num.setAttribute('aria-hidden', 'true');
  colLeft.appendChild(num);

  const info = document.createElement('div');
  info.className = 'work-item-info';

  const cat = document.createElement('span');
  cat.className = 'work-item-category t-label';
  cat.textContent = project.category;
  info.appendChild(cat);

  const name = document.createElement('h3');
  name.className = 'work-item-name';
  name.textContent = project.name;
  info.appendChild(name);

  const desc = document.createElement('p');
  desc.className = 'work-item-desc';
  desc.textContent = project.description;
  info.appendChild(desc);

  const tags = document.createElement('div');
  tags.className = 'work-tags';
  project.tags.forEach(t => tags.appendChild(buildTag(t)));
  info.appendChild(tags);

  colLeft.appendChild(info);

  // Right column
  const colRight = document.createElement('div');
  colRight.className = 'work-col-right';
  const img = buildImgPlaceholder(project);
  const meta = buildMeta(project);
  img.appendChild(meta);
  colRight.appendChild(img);
  colRight.appendChild(buildArrow());

  item.appendChild(colLeft);
  item.appendChild(colRight);

  return item;
}

/* Template B — Offset Tilt */
function buildOffsetTilt(project, index) {
  const item = document.createElement('div');
  item.className = 'work-item work-item--offset-tilt';
  item.dataset.projectId = String(index);
  item.setAttribute('data-cursor', 'view');
  item.setAttribute('role', 'button');
  item.setAttribute('tabindex', '0');
  item.setAttribute('aria-label', `View case study: ${project.name}`);
  item.style.setProperty('--project-color', project.color);

  const row = document.createElement('div');
  row.className = 'tilt-row';

  // Left
  const left = document.createElement('div');
  left.className = 'tilt-left';

  const cat = document.createElement('span');
  cat.className = 'work-item-category t-label';
  cat.textContent = project.category;
  left.appendChild(cat);

  const name = document.createElement('h3');
  name.className = 'work-item-name';
  name.textContent = project.name;
  left.appendChild(name);

  const desc = document.createElement('p');
  desc.className = 'work-item-desc';
  desc.textContent = project.description;
  left.appendChild(desc);

  const tags = document.createElement('div');
  tags.className = 'work-tags';
  project.tags.forEach(t => tags.appendChild(buildTag(t)));
  left.appendChild(tags);

  // Right
  const right = document.createElement('div');
  right.className = 'tilt-right';
  const img = buildImgPlaceholder(project);
  const meta = buildMeta(project);
  img.appendChild(meta);
  right.appendChild(img);
  right.appendChild(buildArrow());

  const metaRow = document.createElement('div');
  metaRow.className = 'tilt-meta-row';

  const tagsInline = document.createElement('div');
  tagsInline.className = 'work-tags';
  project.tags.forEach(t => tagsInline.appendChild(buildTag(t)));
  metaRow.appendChild(tagsInline);

  const yearEl = document.createElement('span');
  yearEl.className = 't-mono';
  yearEl.textContent = project.year;
  yearEl.style.color = 'var(--text-muted)';
  metaRow.appendChild(yearEl);

  row.appendChild(left);
  row.appendChild(right);
  item.appendChild(row);
  item.appendChild(metaRow);

  return item;
}

/* Template C — Type Watermark */
function buildTypeWatermark(project, index) {
  const item = document.createElement('div');
  item.className = 'work-item work-item--type-watermark';
  item.dataset.projectId = String(index);
  item.setAttribute('data-cursor', 'view');
  item.setAttribute('role', 'button');
  item.setAttribute('tabindex', '0');
  item.setAttribute('aria-label', `View case study: ${project.name}`);
  item.style.setProperty('--project-color', project.color);

  // Watermark text
  const watermark = document.createElement('div');
  watermark.className = 'work-watermark-text';
  watermark.textContent = project.name;
  watermark.setAttribute('aria-hidden', 'true');
  item.appendChild(watermark);

  // Layout
  const layout = document.createElement('div');
  layout.className = 'work-watermark-layout';

  // Image col
  const imgCol = document.createElement('div');
  imgCol.className = 'work-watermark-img-col';
  const img = buildImgPlaceholder(project);
  img.style.aspectRatio = '4 / 5';
  const meta = buildMeta(project);
  img.appendChild(meta);
  imgCol.appendChild(img);
  imgCol.appendChild(buildArrow());

  // Card
  const card = document.createElement('div');
  card.className = 'work-watermark-card';

  const cat = document.createElement('span');
  cat.className = 'work-item-category t-label';
  cat.textContent = project.category;
  card.appendChild(cat);

  const name = document.createElement('h3');
  name.className = 'work-item-name';
  name.textContent = project.name;
  card.appendChild(name);

  const desc = document.createElement('p');
  desc.className = 'work-item-desc';
  desc.textContent = project.description;
  card.appendChild(desc);

  const tags = document.createElement('div');
  tags.className = 'work-tags';
  project.tags.forEach(t => tags.appendChild(buildTag(t)));
  card.appendChild(tags);

  const link = document.createElement('span');
  link.className = 'work-view-link';
  link.textContent = 'View Case Study';
  const linkArrow = document.createElement('span');
  linkArrow.textContent = '→';
  linkArrow.setAttribute('aria-hidden', 'true');
  link.appendChild(linkArrow);
  card.appendChild(link);

  layout.appendChild(imgCol);
  layout.appendChild(card);
  item.appendChild(layout);

  return item;
}

/* Template D — Editorial Row */
function buildEditorialRow(project, index) {
  const item = document.createElement('div');
  item.className = 'work-item work-item--editorial-row';
  item.dataset.projectId = String(index);
  item.setAttribute('data-cursor', 'view');
  item.setAttribute('role', 'button');
  item.setAttribute('tabindex', '0');
  item.setAttribute('aria-label', `View case study: ${project.name}`);
  item.style.setProperty('--project-color', project.color);

  // Strip row
  const strip = document.createElement('div');
  strip.className = 'work-editorial-strip';

  const num = document.createElement('span');
  num.className = 'work-editorial-num t-mono';
  num.textContent = '04';
  num.setAttribute('aria-hidden', 'true');
  strip.appendChild(num);

  const name = document.createElement('h3');
  name.className = 'work-editorial-name';
  name.textContent = project.name;
  strip.appendChild(name);

  const cat = document.createElement('span');
  cat.className = 'work-editorial-cat t-label';
  cat.textContent = project.category;
  strip.appendChild(cat);

  const year = document.createElement('span');
  year.className = 'work-editorial-year t-mono';
  year.textContent = project.year;
  strip.appendChild(year);

  strip.appendChild(buildArrow());

  // Image
  const imgWrap = document.createElement('div');
  imgWrap.className = 'work-editorial-img-wrap';
  const img = buildImgPlaceholder(project);
  const meta = buildMeta(project);
  img.appendChild(meta);
  imgWrap.appendChild(img);

  // Bottom rule
  const rule = document.createElement('div');
  rule.className = 'work-editorial-rule';

  item.appendChild(strip);
  item.appendChild(imgWrap);
  item.appendChild(rule);

  return item;
}

/* ── Build All Projects ──────────────────────────────────── */

const TEMPLATE_BUILDERS = [
  buildFeatureSplit,
  buildOffsetTilt,
  buildTypeWatermark,
  buildEditorialRow,
];

function buildProjectList(container) {
  PROJECTS.forEach((project, i) => {
    const el = TEMPLATE_BUILDERS[i](project, i);
    container.appendChild(el);
  });
}

/* ── Build Mobile Carousel ───────────────────────────────── */

function buildMobileCarousel(carouselEl) {
  // Track
  const track = document.createElement('div');
  track.className = 'work-carousel-track';
  track.id = 'work-carousel-track';

  PROJECTS.forEach((project, i) => {
    const card = document.createElement('div');
    card.className = 'work-card-mobile';
    card.dataset.projectId = String(i);
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `View case study: ${project.name}`);
    card.style.setProperty('--project-color', project.color);

    const img = buildImgPlaceholder(project);
    img.style.height = '200px';
    img.style.aspectRatio = 'auto';
    card.appendChild(img);

    const name = document.createElement('div');
    name.className = 'work-card-name';
    name.textContent = project.name;
    card.appendChild(name);

    const cat = document.createElement('div');
    cat.className = 'work-card-cat t-label';
    cat.textContent = project.category;
    card.appendChild(cat);

    const year = document.createElement('div');
    year.className = 'work-card-year t-mono';
    year.textContent = project.year;
    card.appendChild(year);

    track.appendChild(card);
  });

  // Dots
  const dots = document.createElement('div');
  dots.className = 'work-carousel-dots';
  dots.setAttribute('role', 'tablist');
  dots.setAttribute('aria-label', 'Project navigation');

  const dotEls = PROJECTS.map((p, i) => {
    const dot = document.createElement('button');
    dot.className = `work-carousel-dot${i === 0 ? ' is-active' : ''}`;
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Project ${i + 1}: ${p.name}`);
    dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    dots.appendChild(dot);
    return dot;
  });

  carouselEl.appendChild(track);
  carouselEl.appendChild(dots);

  // Dot update logic
  function updateDots() {
    const cardWidth = track.querySelector('.work-card-mobile')?.offsetWidth || 0;
    const gap = 16;
    const scrollLeft = track.scrollLeft;
    const activeIndex = Math.round(scrollLeft / (cardWidth + gap));
    dotEls.forEach((dot, i) => {
      const active = i === activeIndex;
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  }

  // Dot click
  dotEls.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      const cardWidth = track.querySelector('.work-card-mobile')?.offsetWidth || 0;
      const gap = 16;
      track.scrollTo({ left: i * (cardWidth + gap), behavior: 'smooth' });
    });
  });

  // Scroll update
  const debouncedUpdate = debounce(updateDots, 80);
  track.addEventListener('scroll', debouncedUpdate, { passive: true });
  if ('onscrollend' in window) {
    track.addEventListener('scrollend', updateDots, { passive: true });
  }

  return track;
}

/* ── Case Study Overlay ──────────────────────────────────── */

let overlayEl = null;
let lastFocusedEl = null;
let focusableEls = [];

function buildOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'work-overlay';
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-label', 'Case study');
  overlay.setAttribute('aria-hidden', 'true');

  const closeBtn = document.createElement('button');
  closeBtn.className = 'overlay-close';
  closeBtn.setAttribute('aria-label', 'Close case study');
  closeBtn.textContent = '✕';
  overlay.appendChild(closeBtn);

  const inner = document.createElement('div');
  inner.className = 'overlay-inner';

  // Header
  const header = document.createElement('div');
  header.className = 'overlay-header';

  const cat = document.createElement('span');
  cat.className = 't-label overlay-category';
  header.appendChild(cat);

  const title = document.createElement('h2');
  title.className = 't-display overlay-title';
  header.appendChild(title);

  const tagsRow = document.createElement('div');
  tagsRow.className = 'overlay-tags';
  header.appendChild(tagsRow);

  // Hero image
  const heroImg = document.createElement('div');
  heroImg.className = 'overlay-hero-img';
  const heroShape = document.createElement('div');
  heroShape.className = 'placeholder-shape';
  heroShape.setAttribute('aria-hidden', 'true');
  heroImg.appendChild(heroShape);

  // Body
  const body = document.createElement('div');
  body.className = 'overlay-body';

  const colLeft = document.createElement('div');
  colLeft.className = 'overlay-col-left';

  const problemH = document.createElement('h3');
  problemH.className = 't-heading';
  problemH.textContent = 'The Problem';
  colLeft.appendChild(problemH);

  const descP = document.createElement('p');
  descP.className = 't-body overlay-description';
  colLeft.appendChild(descP);

  const colRight = document.createElement('div');
  colRight.className = 'overlay-col-right';

  ['Role', 'Year', 'Stack'].forEach((label) => {
    const block = document.createElement('div');
    block.className = 'overlay-meta-block';

    const lbl = document.createElement('span');
    lbl.className = 't-label';
    lbl.textContent = label;
    block.appendChild(lbl);

    if (label === 'Stack') {
      const stackDiv = document.createElement('div');
      stackDiv.className = 'overlay-stack';
      block.appendChild(stackDiv);
    } else {
      const val = document.createElement('p');
      val.className = 't-body';
      val.classList.add(`overlay-${label.toLowerCase()}`);
      block.appendChild(val);
    }

    colRight.appendChild(block);
  });

  body.appendChild(colLeft);
  body.appendChild(colRight);

  // Process
  const process = document.createElement('div');
  process.className = 'overlay-process';

  const processH = document.createElement('h3');
  processH.className = 't-heading';
  processH.textContent = 'Process';
  process.appendChild(processH);

  const steps = document.createElement('div');
  steps.className = 'overlay-process-steps';
  process.appendChild(steps);

  inner.appendChild(header);
  inner.appendChild(heroImg);
  inner.appendChild(body);
  inner.appendChild(process);
  overlay.appendChild(inner);

  document.body.appendChild(overlay);

  // Close handlers
  closeBtn.addEventListener('click', closeOverlay);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeOverlay();
  });

  document.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('is-open')) return;
    if (e.key === 'Escape') {
      closeOverlay();
      return;
    }
    if (e.key === 'Tab') {
      trapFocus(e);
    }
  });

  return overlay;
}

function populateOverlay(project) {
  const overlay = overlayEl;

  overlay.querySelector('.overlay-category').textContent  = project.category;
  overlay.querySelector('.overlay-title').textContent     = project.name;
  overlay.querySelector('.overlay-description').textContent = project.description;
  overlay.querySelector('.overlay-role').textContent      = project.role;
  overlay.querySelector('.overlay-year').textContent      = project.year;

  // Tags
  const tagsRow = overlay.querySelector('.overlay-tags');
  tagsRow.innerHTML = '';
  project.tags.forEach(t => tagsRow.appendChild(buildTag(t)));

  // Hero image color
  const heroImg = overlay.querySelector('.overlay-hero-img');
  heroImg.style.setProperty('--project-color', project.color);
  heroImg.querySelector('.placeholder-shape').textContent = project.initial;

  // Stack
  const stack = overlay.querySelector('.overlay-stack');
  stack.innerHTML = '';
  project.tags.forEach(t => stack.appendChild(buildTag(t)));

  // Steps
  const stepsEl = overlay.querySelector('.overlay-process-steps');
  stepsEl.innerHTML = '';
  project.steps.forEach((step, i) => {
    const s = document.createElement('div');
    s.className = 'overlay-step';

    const badge = document.createElement('div');
    badge.className = 'overlay-step-badge';
    badge.textContent = pad2(i + 1);
    s.appendChild(badge);

    const lbl = document.createElement('div');
    lbl.className = 'overlay-step-label';
    lbl.textContent = step.label;
    s.appendChild(lbl);

    const d = document.createElement('p');
    d.className = 'overlay-step-desc t-small';
    d.textContent = step.desc;
    s.appendChild(d);

    stepsEl.appendChild(s);
  });
}

function openOverlay(projectIndex) {
  if (!overlayEl) return;
  const project = PROJECTS[projectIndex];
  if (!project) return;

  populateOverlay(project);
  overlayEl.setAttribute('aria-hidden', 'false');
  overlayEl.classList.add('is-open');
  document.body.style.overflow = 'hidden';

  // Collect focusable elements for focus trap
  focusableEls = Array.from(
    overlayEl.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
  ).filter(el => !el.disabled && el.offsetParent !== null);

  // Focus close button
  const closeBtn = overlayEl.querySelector('.overlay-close');
  if (closeBtn) setTimeout(() => closeBtn.focus(), 50);

  // Reset scroll
  overlayEl.scrollTop = 0;
}

function closeOverlay() {
  if (!overlayEl) return;
  overlayEl.classList.remove('is-open');
  overlayEl.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';

  // Return focus
  if (lastFocusedEl) {
    lastFocusedEl.focus();
    lastFocusedEl = null;
  }
}

function trapFocus(e) {
  if (!focusableEls.length) return;
  const first = focusableEls[0];
  const last  = focusableEls[focusableEls.length - 1];

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

/* ── Click / Keypress Handler ────────────────────────────── */

function handleProjectActivate(e) {
  const item = e.currentTarget;
  const pid = parseInt(item.dataset.projectId, 10);
  if (isNaN(pid)) return;

  // Keyboard: only Enter / Space
  if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
  if (e.type === 'keydown') e.preventDefault();

  lastFocusedEl = item;
  openOverlay(pid);
}

/* ── Header Animation ────────────────────────────────────── */

function animateWorkHeader() {
  const reducedMotion = prefersReducedMotion();

  const label = document.querySelector('.work-section-label');
  const count = document.querySelector('.work-count');
  const desc  = document.querySelector('.work-description');

  if (!label || !count || !desc) return;

  const headerObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) return;
        headerObserver.disconnect();

        if (reducedMotion) {
          label.classList.add('is-visible');
          count.classList.add('is-visible');
          count.textContent = '04';
          desc.classList.add('is-visible');
          return;
        }

        // Label fade-up (400ms delay)
        setTimeout(() => label.classList.add('is-visible'), 400);

        // Count animate 00 → 04
        setTimeout(() => {
          count.classList.add('is-visible');
          animateValue({
            from: 0,
            to: 4,
            duration: 600,
            easing: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
            onUpdate: (val) => {
              count.textContent = pad2(val);
            },
          });
        }, 500);

        // Description (800ms delay)
        setTimeout(() => desc.classList.add('is-visible'), 800);
      }
    },
    { threshold: 0.2 }
  );

  const header = document.querySelector('.work-header');
  if (header) headerObserver.observe(header);
}

/* ── Scroll Reveal — All Work Items ──────────────────────── */

function initScrollReveal() {
  const items = document.querySelectorAll('.work-item');
  if (!items.length) return;

  const reducedMotion = prefersReducedMotion();

  if (reducedMotion) {
    items.forEach(item => item.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
  );

  items.forEach(item => observer.observe(item));
}

/* ── Wire Project Click Events ───────────────────────────── */

function wireProjectEvents() {
  // Desktop items
  document.querySelectorAll('.work-item').forEach(item => {
    item.addEventListener('click', handleProjectActivate);
    item.addEventListener('keydown', handleProjectActivate);
  });

  // Mobile cards
  document.querySelectorAll('.work-card-mobile').forEach(card => {
    card.addEventListener('click', handleProjectActivate);
    card.addEventListener('keydown', handleProjectActivate);
  });
}

/* ── Main Init ───────────────────────────────────────────── */

function initWork() {
  const workList    = document.getElementById('work-list');
  const carouselEl  = document.getElementById('work-carousel');

  if (!workList || !carouselEl) return;

  // Build desktop layouts
  buildProjectList(workList);

  // Build mobile carousel
  buildMobileCarousel(carouselEl);

  // Build overlay
  overlayEl = buildOverlay();

  // Wire interactions
  wireProjectEvents();

  // Scroll reveal
  initScrollReveal();

  // Header animations
  animateWorkHeader();
}

/* ── Entry Point (same bootstrap pattern as hero.js) ──────── */

function bootstrap() {
  if (document.body.classList.contains('loader-complete')) {
    initWork();
    return;
  }
  document.addEventListener('loaderComplete', initWork, { once: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
