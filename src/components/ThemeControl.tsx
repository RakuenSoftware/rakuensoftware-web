import type { ThemeDefault } from '@rakuensoftware/smoothgui';

/** Controlled by Layout so the header and mobile menu always agree. */
export default function ThemeControl({ mode, onChange }: {
  mode: ThemeDefault;
  onChange: (mode: ThemeDefault) => void;
}) {
  return (
    <div className="site-theme" role="group" aria-label="Appearance">
      <span className="site-theme__label">Theme</span>
      {(['light', 'dark', 'system'] as const).map((choice) => (
        <button key={choice} type="button" aria-pressed={mode === choice}
          onClick={() => onChange(choice)} title={choice === 'system' ? 'Follow system appearance' : `${choice === 'light' ? 'Light' : 'Dark'} appearance`}>
          {choice === 'light' ? 'Light' : choice === 'dark' ? 'Dark' : 'Auto'}
        </button>
      ))}
    </div>
  );
}
