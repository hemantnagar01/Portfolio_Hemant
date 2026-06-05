/**
 * enhancements.js — Premium Interactive Upgrades
 *
 * 1. Marquee strip population
 * 2. Availability orb entrance + hide on contact
 * 3. Magnetic button effect
 * 4. Work cursor-following image preview
 * 5. Hero index number reveal
 * 6. Text scramble on nav hover
 * 7. Footer year display
 * 8. Work/Design title serif injection
 * 9. Card tilt effect
 */

/* ── Utilities ───────────────────────────────────────────── */

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

/* ══════════════════════════════════════════════════════════
   1. MARQUEE STRIP
══════════════════════════════════════════════════════════ */

const MARQUEE_ITEMS = [
  'React', 'TypeScript', 'Node.js', 'Next.js', 'React Native',
  'Figma', 'UI Design', 'UX Research', 'Design Systems', 'Motion Design',
  'After Effects', 'Illustrator', 'Photoshop', 'Framer', 'Webflow',
  'PostgreSQL', 'Vue.js', 'CSS / Sass', 'REST APIs', 'Git',
  'Brand Identity', 'Print Design', 'Illustration', 'Typography',
];

function buildMarquee() {
  const track = document.getElementById('marquee-track');
  if (!track) return;

  // Build one set of items
  function buildSet() {
    const frag = document.createDocumentFragment();
    MARQUEE_ITEMS.forEach((item) => {
      const wrapper = document.createElement('span');
      wrapper.className = 'marquee-item';
      wrapper.textContent = item;
      frag.appendChild(wrapper);

      const sep = document.createElement('span');
      sep.className = 'marquee-sep';
      sep.setAttribute('aria-hidden', 'true');
      frag.appendChild(sep);
    });
    return frag;
  }

  // Two copies for seamless infinite scroll
  track.appendChild(buildSet());
  track.appendChild(buildSet());
}

/* ══════════════════════════════════════════════════════════
   2. AVAILABILITY ORB
══════════════════════════════════════════════════════════ */

function initAvailabilityOrb() {
  const orb = document.getElementById('availability-orb');
  if (!orb) return;

  function showOrb() {
    setTimeout(() => orb.classList.add('is-visible'), 1800);
  }

  if (document.body.classList.contains('loader-complete')) {
    showOrb();
  } else {
    document.addEventListener('loaderComplete', showOrb, { once: true });
  }

  // Hide when contact section is in view
  const contactSection = document.getElementById('contact');
  if (contactSection) {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          orb.style.opacity = entry.isIntersecting ? '0' : '';
          orb.style.pointerEvents = entry.isIntersecting ? 'none' : '';
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(contactSection);
  }
}

/* ══════════════════════════════════════════════════════════
   3. MAGNETIC BUTTON EFFECT
══════════════════════════════════════════════════════════ */

function initMagneticButtons() {
  if (prefersReducedMotion()) return;

  const magneticEls = document.querySelectorAll('.nav-resume, .nav-logo');

  magneticEls.forEach(el => {
    let rafId = null;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let isHovered = false;

    function animate() {
      currentX = lerp(currentX, targetX, 0.14);
      currentY = lerp(currentY, targetY, 0.14);

      const tx = Math.round(currentX * 100) / 100;
      const ty = Math.round(currentY * 100) / 100;

      el.style.transform = `translate(${tx}px, ${ty}px)`;

      if (isHovered || Math.abs(currentX) > 0.05 || Math.abs(currentY) > 0.05) {
        rafId = requestAnimationFrame(animate);
      } else {
        el.style.transform = '';
        rafId = null;
      }
    }

    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      targetX = (e.clientX - cx) * 0.3;
      targetY = (e.clientY - cy) * 0.3;
      isHovered = true;
      if (!rafId) rafId = requestAnimationFrame(animate);
    });

    el.addEventListener('mouseleave', () => {
      isHovered = false;
      targetX = 0;
      targetY = 0;
      if (!rafId) rafId = requestAnimationFrame(animate);
    });
  });
}

/* ══════════════════════════════════════════════════════════
   4. WORK CURSOR-FOLLOWING PREVIEW (Editorial Row)
══════════════════════════════════════════════════════════ */

function initWorkCursorPreview() {
  if (prefersReducedMotion()) return;

  const preview = document.createElement('div');
  preview.className = 'work-cursor-preview';
  preview.setAttribute('aria-hidden', 'true');

  const inner = document.createElement('div');
  inner.className = 'work-cursor-preview-inner';
  preview.appendChild(inner);
  document.body.appendChild(preview);

  let rafId = null;
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let isVisible = false;

  function animatePreview() {
    currentX = lerp(currentX, targetX, 0.1);
    currentY = lerp(currentY, targetY, 0.1);
    preview.style.left = Math.round(currentX) + 'px';
    preview.style.top  = Math.round(currentY) + 'px';
    if (isVisible) {
      rafId = requestAnimationFrame(animatePreview);
    } else {
      rafId = null;
    }
  }

  function wireEditorialRows() {
    document.querySelectorAll('.work-item--editorial-row').forEach(item => {
      const color = item.style.getPropertyValue('--project-color') || 'var(--accent-primary)';
      const nameEl = item.querySelector('.work-editorial-name');
      const initial = nameEl ? nameEl.textContent.trim().charAt(0) : '?';

      item.addEventListener('mouseenter', () => {
        inner.style.cssText = `
          display:flex; align-items:center; justify-content:center;
          width:100%; height:100%;
          background: linear-gradient(135deg, var(--bg-elevated) 0%, var(--bg-surface) 100%);
          font-family: var(--font-display); font-size:72px; font-weight:800;
          color:${color}; opacity:0.25; letter-spacing:-0.04em;
        `;
        inner.textContent = initial;
        preview.classList.add('is-visible');
        isVisible = true;
        if (!rafId) rafId = requestAnimationFrame(animatePreview);
      });

      item.addEventListener('mouseleave', () => {
        preview.classList.remove('is-visible');
        isVisible = false;
      });

      item.addEventListener('mousemove', (e) => {
        targetX = e.clientX + 24;
        targetY = e.clientY - 100;
      });
    });
  }

  const ready = () => setTimeout(wireEditorialRows, 150);
  if (document.body.classList.contains('loader-complete')) {
    ready();
  } else {
    document.addEventListener('loaderComplete', ready, { once: true });
  }
}

/* ══════════════════════════════════════════════════════════
   5. HERO INDEX NUMBER REVEAL
══════════════════════════════════════════════════════════ */

function initHeroIndexNum() {
  const indexNum = document.querySelector('.hero-index-num');
  if (!indexNum) return;

  const reveal = () => setTimeout(() => indexNum.classList.add('is-visible'), 1400);

  if (document.body.classList.contains('loader-complete')) {
    reveal();
  } else {
    document.addEventListener('loaderComplete', reveal, { once: true });
  }

  // Parallax on scroll
  if (!prefersReducedMotion()) {
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      const heroH = document.getElementById('hero')?.offsetHeight || window.innerHeight;
      if (scrollY > heroH) return;
      const p = scrollY / heroH;
      indexNum.style.transform = `translateY(${p * 40}px)`;
      indexNum.style.opacity = String(Math.max(0, 1 - p * 4));
    }, { passive: true });
  }
}

/* ══════════════════════════════════════════════════════════
   6. TEXT SCRAMBLE ON NAV HOVER
══════════════════════════════════════════════════════════ */

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function scrambleText(el, original) {
  if (prefersReducedMotion()) return;
  let frame = 0;
  const total = 7;
  let rafId;

  function step() {
    if (frame >= total) { el.textContent = original; return; }
    const progress = frame / total;
    const locked = Math.floor(progress * original.length);
    let result = '';
    for (let i = 0; i < original.length; i++) {
      if (original[i] === ' ') { result += ' '; continue; }
      result += i < locked
        ? original[i]
        : CHARS[Math.floor(Math.random() * CHARS.length)];
    }
    el.textContent = result;
    frame++;
    rafId = requestAnimationFrame(step);
  }
  rafId = requestAnimationFrame(step);
}

function initNavScramble() {
  document.querySelectorAll('.nav-links a').forEach(link => {
    const orig = link.textContent.trim();
    link.addEventListener('mouseenter', () => scrambleText(link, orig));
    link.addEventListener('mouseleave', () => { link.textContent = orig; });
  });
}

function initMobileNavScramble() {
  const observer = new MutationObserver(() => {
    const links = document.querySelectorAll('.mobile-nav-links a');
    if (links.length) {
      observer.disconnect();
      links.forEach(link => {
        const orig = link.textContent.trim();
        link.addEventListener('mouseenter', () => scrambleText(link, orig));
        link.addEventListener('mouseleave', () => { link.textContent = orig; });
      });
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

/* ══════════════════════════════════════════════════════════
   7. FOOTER YEAR DISPLAY
══════════════════════════════════════════════════════════ */

function updateFooterYearDisplay() {
  const el = document.getElementById('footer-year-display');
  if (el) el.textContent = new Date().getFullYear();
}

/* ══════════════════════════════════════════════════════════
   8. SERIF ITALIC INJECTION INTO SECTION TITLES
══════════════════════════════════════════════════════════ */

function injectSerifAccents() {
  const map = [
    { selector: '.work-title',   html: 'Built with<br><em>intention.</em>' },
    { selector: '.design-title', html: 'Visual<br><em>systems.</em>' },
    { selector: '.const-title',  html: 'What I<br>bring to the <em>table.</em>' },
  ];

  map.forEach(({ selector, html }) => {
    const el = document.querySelector(selector);
    if (el) el.innerHTML = html;
  });
}

/* ══════════════════════════════════════════════════════════
   9. CARD TILT EFFECT
══════════════════════════════════════════════════════════ */

function initCardTilt() {
  if (prefersReducedMotion()) return;

  document.querySelectorAll('.work-watermark-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const dx = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
      const dy = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
      card.style.transform = `perspective(800px) rotateX(${dy * -3}deg) rotateY(${dx * 3}deg) translateZ(6px) translateY(-4px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

/* ══════════════════════════════════════════════════════════
   MAIN INIT
══════════════════════════════════════════════════════════ */

function initEnhancements() {
  buildMarquee();
  initAvailabilityOrb();
  initWorkCursorPreview();
  initHeroIndexNum();
  updateFooterYearDisplay();
  injectSerifAccents();

  const afterLoad = () => {
    initMagneticButtons();
    initNavScramble();
    initMobileNavScramble();
    setTimeout(initCardTilt, 300);
  };

  if (document.body.classList.contains('loader-complete')) {
    afterLoad();
  } else {
    document.addEventListener('loaderComplete', afterLoad, { once: true });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEnhancements);
} else {
  initEnhancements();
}
