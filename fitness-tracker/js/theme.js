// Light/dark theme preference: 'system' (default, follows the OS/browser),
// or an explicit 'dark' / 'light' override. Applied via a data-theme
// attribute on <html>, which styles.css keys off alongside the
// prefers-color-scheme media query.

const KEY = 'fittrack-theme';

export function getThemePref() {
  return localStorage.getItem(KEY) || 'system';
}

function apply(pref) {
  if (pref === 'dark' || pref === 'light') {
    document.documentElement.dataset.theme = pref;
  } else {
    delete document.documentElement.dataset.theme;
  }
}

export function setThemePref(pref) {
  if (pref === 'dark' || pref === 'light') localStorage.setItem(KEY, pref);
  else localStorage.removeItem(KEY);
  apply(pref);
}

// Call once, as early as possible, to avoid a flash of the wrong theme.
export function initTheme() {
  apply(getThemePref());
}
