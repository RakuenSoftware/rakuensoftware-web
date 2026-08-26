import { useEffect, useState } from 'react';
import { activeTheme, applyTheme, storeTheme } from '../lib/theme';

/** Flips the site between its dark default and an explicitly selected light theme. */
export default function ThemeToggle() {
  const [theme, setTheme] = useState(activeTheme);

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
