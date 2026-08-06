import { useEffect, useState } from 'react';
import { activeTheme, applyTheme, storeTheme, storedTheme, systemTheme } from '../lib/theme';

/**
 * Flips the site between light and dark. Until the visitor picks one, the site
 * follows the OS preference and keeps following it if that changes mid-visit.
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState(activeTheme);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (storedTheme() == null) setTheme(systemTheme());
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const next: typeof theme = theme === 'dark' ? 'light' : 'dark';

  return (
    <button
      type="button"
      className="site-theme-toggle"
      onClick={() => {
        storeTheme(next);
        setTheme(next);
      }}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
    >
      <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
    </button>
  );
}
