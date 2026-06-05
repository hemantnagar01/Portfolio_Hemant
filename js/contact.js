/**
 * contact.js — Contact Section + Footer + Polish behaviors
 *
 * Covers:
 *   1. Contact headline entrance animation
 *   2. Form focus/blur field line animations (CSS-driven, JS wires events)
 *   3. Submit button hover fill sweep (CSS-driven, JS adds/removes classes)
 *   4. Form validation + shake animation
 *   5. Submit simulation: loading spinner → success state
 *   6. Aside entrance animation
 *   7. Footer: live IST clock + dynamic year
 *
 * Depends on:
 *   - loader.js (dispatches 'loaderComplete')
 *   - theme.js  (dispatches 'themechange')
 *
 * Same bootstrap pattern as hero.js, work.js, design.js, about.js.
 */

/* ═══════════════════════════════════════════════════════════
   UTILITIES
═══════════════════════════════════════════════════════════ */

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* ═══════════════════════════════════════════════════════════
   CONTACT HEADLINE ENTRANCE
═══════════════════════════════════════════════════════════ */

function initContactHeadline() {
  const reduced = prefersReducedMotion();
  const words   = Array.from(document.querySelectorAll('.contact-hl-word'));

  if (!words.length) return;

  if (reduced) {
    words.forEach(w => w.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) return;
      observer.disconnect();

      // Three lines, each starts at a 120ms offset from the previous
      words.forEach((word, i) => {
        // Each word gets its own delay based on its data-index attr
        const lineDelay  = parseInt(word.dataset.lineIndex  || '0', 10) * 120;
        const wordOffset = parseInt(word.dataset.wordIndex  || '0', 10) * 60;
        setTimeout(() => word.classList.add('is-visible'), lineDelay + wordOffset);
      });
    }
  }, { threshold: 0.2 });

  const headline = document.querySelector('.contact-headline');
  if (headline) observer.observe(headline);
}

/* ═══════════════════════════════════════════════════════════
   SUBMIT BUTTON FILL SWEEP
═══════════════════════════════════════════════════════════ */

function initSubmitHover() {
  const btn = document.getElementById('contact-submit');
  if (!btn) return;

  const fill = btn.querySelector('.submit-fill');
  if (!fill) return;

  btn.addEventListener('mouseleave', () => {
    // Ensure reverse direction on leave
    btn.classList.add('is-leaving');
    const onTransitionEnd = () => {
      btn.classList.remove('is-leaving');
      btn.removeEventListener('transitionend', onTransitionEnd);
    };
    btn.addEventListener('transitionend', onTransitionEnd, { once: true });
  });

  btn.addEventListener('mouseenter', () => {
    btn.classList.remove('is-leaving');
  });
}

/* ═══════════════════════════════════════════════════════════
   FORM VALIDATION
═══════════════════════════════════════════════════════════ */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function shakeField(fieldGroup) {
  if (prefersReducedMotion()) return;
  fieldGroup.classList.remove('is-shaking');
  // Force reflow to re-trigger animation
  void fieldGroup.offsetHeight;
  fieldGroup.classList.add('is-shaking');
  fieldGroup.addEventListener('animationend', () => {
    fieldGroup.classList.remove('is-shaking');
  }, { once: true });
}

function validate(nameVal, emailVal, msgVal) {
  const errors = [];
  if (!nameVal.trim())         errors.push('name');
  if (!EMAIL_RE.test(emailVal.trim())) errors.push('email');
  if (!msgVal.trim())          errors.push('message');
  return errors;
}

/* ═══════════════════════════════════════════════════════════
   SUCCESS STATE
═══════════════════════════════════════════════════════════ */

function showSuccess(formCol) {
  // Exit all field groups with stagger
  const fieldGroups = Array.from(formCol.querySelectorAll('.field-group'));
  const btn         = formCol.querySelector('#contact-submit');

  const exitDuration = 200;
  const stagger      = 60;

  fieldGroups.forEach((fg, i) => {
    setTimeout(() => {
      fg.style.transition = `transform ${exitDuration}ms var(--ease-in-expo), opacity ${exitDuration}ms ease`;
      fg.style.transform  = 'translateY(-20px)';
      fg.style.opacity    = '0';
    }, i * stagger);
  });

  // Exit button simultaneously with last field
  if (btn) {
    setTimeout(() => {
      btn.style.transition = `transform ${exitDuration}ms var(--ease-in-expo), opacity ${exitDuration}ms ease`;
      btn.style.transform  = 'translateY(-20px)';
      btn.style.opacity    = '0';
    }, 0);
  }

  const totalExitTime = fieldGroups.length * stagger + exitDuration + 80;

  setTimeout(() => {
    // Hide all exited elements
    fieldGroups.forEach(fg => { fg.style.display = 'none'; });
    if (btn) btn.style.display = 'none';

    // Show success state
    const success = formCol.querySelector('.contact-success');
    if (success) {
      success.classList.add('is-visible');
    }
  }, totalExitTime);
}

/* ═══════════════════════════════════════════════════════════
   SUBMIT HANDLER
═══════════════════════════════════════════════════════════ */

function initFormSubmit() {
  const btn     = document.getElementById('contact-submit');
  const nameEl  = document.getElementById('field-name');
  const emailEl = document.getElementById('field-email');
  const msgEl   = document.getElementById('field-message');

  if (!btn || !nameEl || !emailEl || !msgEl) return;

  // Field groups (parent of input)
  const nameGroup  = nameEl.closest('.field-group');
  const emailGroup = emailEl.closest('.field-group');
  const msgGroup   = msgEl.closest('.field-group');

  btn.addEventListener('click', () => {
    if (btn.classList.contains('is-loading')) return;

    const nameVal  = nameEl.value;
    const emailVal = emailEl.value;
    const msgVal   = msgEl.value;

    const errors = validate(nameVal, emailVal, msgVal);

    if (errors.length > 0) {
      if (errors.includes('name'))    shakeField(nameGroup);
      if (errors.includes('email'))   shakeField(emailGroup);
      if (errors.includes('message')) shakeField(msgGroup);

      // Focus first invalid
      const first = errors[0];
      const map   = { name: nameEl, email: emailEl, message: msgEl };
      if (map[first]) map[first].focus();
      return;
    }

    // Valid — show loading state
    btn.classList.add('is-loading');
    btn.setAttribute('aria-busy', 'true');
    btn.setAttribute('aria-label', 'Sending…');

    // Simulate async 800ms
    setTimeout(() => {
      btn.classList.remove('is-loading');
      const formCol = btn.closest('.contact-form-col');
      if (formCol) showSuccess(formCol);
    }, 800);
  });

  // Remove shake on input
  [nameEl, emailEl, msgEl].forEach(el => {
    el.addEventListener('input', () => {
      const fg = el.closest('.field-group');
      if (fg) fg.classList.remove('is-shaking');
    });
  });
}

/* ═══════════════════════════════════════════════════════════
   ASIDE ENTRANCE
═══════════════════════════════════════════════════════════ */

function initAsideEntrance() {
  const aside   = document.querySelector('.contact-aside');
  if (!aside)   return;

  if (prefersReducedMotion()) {
    aside.classList.add('is-visible');
    return;
  }

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      aside.classList.add('is-visible');
    }
  }, { threshold: 0.15 });

  observer.observe(aside);
}

/* ═══════════════════════════════════════════════════════════
   FOOTER CLOCK + YEAR
═══════════════════════════════════════════════════════════ */

function startFooterClock() {
  const clockEl = document.getElementById('footer-time');
  if (!clockEl) return;

  function tick() {
    const time = new Date().toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour12: false,
    });
    clockEl.textContent = time + ' IST';
  }

  tick();
  setInterval(tick, 1000);
}

function setFooterYear() {
  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
}

/* ═══════════════════════════════════════════════════════════
   MAIN INIT
═══════════════════════════════════════════════════════════ */

function initContact() {
  initContactHeadline();
  initSubmitHover();
  initFormSubmit();
  initAsideEntrance();
  startFooterClock();
  setFooterYear();
}

/* ═══════════════════════════════════════════════════════════
   ENTRY POINT
═══════════════════════════════════════════════════════════ */

function bootstrap() {
  if (document.body.classList.contains('loader-complete')) {
    initContact();
    return;
  }
  document.addEventListener('loaderComplete', initContact, { once: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
