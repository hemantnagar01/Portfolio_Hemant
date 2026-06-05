/**
 * nav.js — Navigation Behavior
 * Handles:
 *  - Scroll-triggered transparent → floating pill transition
 *  - Scroll progress bar (real-time)
 *  - Active section tracking via IntersectionObserver
 *  - Mobile hamburger menu open/close
 *  - Post-loader stagger reveal of nav items
 */

import { debounce } from './utils.js';

const SCROLL_THRESHOLD = 80;

let nav;
let progressBar;
let hamburger;
let mobileMenu;
let navLinks;
let isMenuOpen = false;

/**
 * Update scroll progress bar width.
 */
function updateScrollProgress() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

  if (progressBar) {
    progressBar.style.width = `${progress}%`;
  }

  // Pill vs. transparent nav
  if (nav) {
    nav.classList.toggle('nav-scrolled', scrollTop > SCROLL_THRESHOLD);
  }
}

/**
 * Build and inject the mobile menu overlay.
 */
function buildMobileMenu() {
  mobileMenu = document.createElement('div');
  mobileMenu.id = 'mobile-menu';
  mobileMenu.setAttribute('role', 'dialog');
  mobileMenu.setAttribute('aria-modal', 'true');
  mobileMenu.setAttribute('aria-label', 'Navigation menu');

  const linkList = document.createElement('ul');
  linkList.className = 'mobile-nav-links';

  const pages = [
    { href: '#work',    label: 'Work' },
    { href: '#design',  label: 'Design' },
    { href: '#about',   label: 'About' },
    { href: '#contact', label: 'Contact' },
  ];

  pages.forEach(({ href, label }) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = href;
    a.textContent = label;
    a.dataset.cursor = 'hover';

    a.addEventListener('click', closeMobileMenu);
    li.appendChild(a);
    linkList.appendChild(li);
  });

  const closeArea = document.createElement('div');
  closeArea.className = 'mobile-nav-close-area';

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 't-label t-secondary';
  closeBtn.textContent = 'Close ✕';
  closeBtn.setAttribute('aria-label', 'Close navigation menu');
  closeBtn.addEventListener('click', closeMobileMenu);

  closeArea.appendChild(closeBtn);
  mobileMenu.appendChild(linkList);
  mobileMenu.appendChild(closeArea);

  document.body.appendChild(mobileMenu);
}

/**
 * Open the mobile menu.
 */
function openMobileMenu() {
  isMenuOpen = true;
  mobileMenu.classList.add('is-open');
  hamburger.classList.add('is-open');
  hamburger.setAttribute('aria-expanded', 'true');
  hamburger.setAttribute('aria-label', 'Close menu');
  document.body.style.overflow = 'hidden';

  // Focus first link for accessibility
  const firstLink = mobileMenu.querySelector('a');
  if (firstLink) setTimeout(() => firstLink.focus(), 100);
}

/**
 * Close the mobile menu.
 */
function closeMobileMenu() {
  isMenuOpen = false;
  mobileMenu.classList.remove('is-open');
  hamburger.classList.remove('is-open');
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.setAttribute('aria-label', 'Open menu');
  document.body.style.overflow = '';
}

/**
 * Set up IntersectionObserver for active section tracking.
 */
function initSectionObserver() {
  const sections = document.querySelectorAll('section[id]');
  if (!sections.length) return;

  const links = document.querySelectorAll('.nav-links a');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id = entry.target.getAttribute('id');

        links.forEach(link => {
          const isActive = link.getAttribute('href') === `#${id}`;
          link.classList.toggle('active', isActive);
        });
      });
    },
    {
      rootMargin: '-40% 0px -40% 0px',
      threshold: 0,
    }
  );

  sections.forEach(section => observer.observe(section));
}

/**
 * Trigger nav item reveal after loader completes.
 */
function revealNav() {
  if (nav) {
    nav.classList.add('nav-ready');
  }
}

/**
 * Handle Escape key for mobile menu.
 * @param {KeyboardEvent} e
 */
function handleKeyDown(e) {
  if (e.key === 'Escape' && isMenuOpen) {
    closeMobileMenu();
  }
}

/**
 * Initialize navigation.
 */
export function initNav() {
  nav = document.getElementById('main-nav');
  progressBar = document.getElementById('scroll-progress');
  hamburger = nav?.querySelector('.nav-hamburger');

  if (!nav) return;

  // Build mobile menu
  buildMobileMenu();

  // Hamburger toggle
  if (hamburger) {
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-controls', 'mobile-menu');
    hamburger.addEventListener('click', () => {
      isMenuOpen ? closeMobileMenu() : openMobileMenu();
    });
  }

  // Scroll listener — passive for performance
  window.addEventListener('scroll', updateScrollProgress, { passive: true });

  // Initial call
  updateScrollProgress();

  // Active section tracking
  initSectionObserver();

  // Keyboard support
  document.addEventListener('keydown', handleKeyDown);

  // Listen for loader complete to reveal nav items
  document.addEventListener('loaderComplete', revealNav);

  // If no loader (reduced motion / second visit), reveal immediately
  if (document.body.classList.contains('loader-complete')) {
    revealNav();
  }

  // Add cursor hover to nav links
  nav.querySelectorAll('a, button').forEach(el => {
    if (!el.dataset.cursor) el.dataset.cursor = 'hover';
  });
}

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNav);
} else {
  initNav();
}
