export type Theme = 'light' | 'dark';

/**
 * Kept in sync with the pre-paint script in index.html, which applies the same
 * choice before React mounts so a dark-mode visitor never sees a white flash.
 */
export const THEME_STORAGE_KEY = 'rakuen-theme';

/** The visitor's explicit choice, or null while they are following the OS. */
export function storedTheme(): Theme | null {
  // Storage throws rather than returning null when it is blocked (Safari
  // private browsing, embedded webviews). Falling back to the OS preference is
  // the correct behaviour there — the toggle still works for the session.
  let value: string | null;
  try {
    value = localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
  return value === 'light' || value === 'dark' ? value : null;
}

export function systemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function activeTheme(): Theme {
  return storedTheme() ?? systemTheme();
}

/** Persists the choice. Returns false when storage is unavailable. */
export function storeTheme(theme: Theme): boolean {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    return true;
  } catch {
    return false;
  }
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
}
