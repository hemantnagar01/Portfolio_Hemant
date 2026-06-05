/**
 * theme.js — Theme Switcher
 * Injects the theme switcher UI, handles theme changes,
 * and persists selection to localStorage.
 */

const STORAGE_KEY = 'portfolio-theme';
const DEFAULT_THEME = 'void';
const VALID_THEMES = ['void', 'ivory', 'signal'];

/**
 * Apply a theme to the document.
 * @param {string} theme
 */
function applyTheme(theme) {
  if (!VALID_THEMES.includes(theme)) theme = DEFAULT_THEME;
  document.documentElement.setAttribute('data-theme', theme);

  // Update active button state
  document.querySelectorAll('.ts-option').forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset.themeSet === theme);
  });

  // Persist
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch (_) {
    // Storage may be blocked in private browsing
  }

  // Notify other modules (e.g. hero canvas) of the theme change
  document.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
}


/**
 * Read saved theme from localStorage.
 * @returns {string}
 */
function getSavedTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && VALID_THEMES.includes(saved)) return saved;
  } catch (_) {
    // Fallback
  }
  return DEFAULT_THEME;
}

/**
 * Build and inject the theme switcher element.
 */
function buildSwitcher() {
  const switcher = document.createElement('div');
  switcher.id = 'theme-switcher';
  switcher.setAttribute('role', 'group');
  switcher.setAttribute('aria-label', 'Choose color theme');

  const themes = [
    { id: 'void',   label: 'Void' },
    { id: 'ivory',  label: 'Ivory' },
    { id: 'signal', label: 'Signal' },
  ];

  themes.forEach(({ id, label }) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = `theme-btn-${id}`;
    btn.className = `ts-option ts-${id}`;
    btn.dataset.themeSet = id;
    btn.textContent = label;
    btn.setAttribute('aria-label', `Switch to ${label} theme`);

    btn.addEventListener('click', () => {
      applyTheme(id);
    });

    switcher.appendChild(btn);
  });

  document.body.appendChild(switcher);
}

/**
 * Initialize the theme system.
 * Called immediately — theme applied before first paint.
 */
function initTheme() {
  // Apply saved theme immediately to avoid FOUC
  const saved = getSavedTheme();
  document.documentElement.setAttribute('data-theme', saved);

  // Build UI after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      buildSwitcher();
      applyTheme(saved);
    });
  } else {
    buildSwitcher();
    applyTheme(saved);
  }
}

initTheme();
