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
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        {theme === 'dark' ? (
          <>
            <circle cx="12" cy="12" r="3.5" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" />
          </>
        ) : (
          <path d="M20.5 15.4A8.5 8.5 0 0 1 8.6 3.5 8.5 8.5 0 1 0 20.5 15.4Z" />
        )}
      </svg>
    </button>
  );
}
