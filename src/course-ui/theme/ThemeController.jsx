import { useSyncExternalStore } from 'react';

import styles from './theme.module.css';
import { applyDocumentTheme, normalizeTheme, persistTheme } from './theme.js';

const themeListeners = new Set();

function subscribeToTheme(listener) {
  themeListeners.add(listener);
  return () => themeListeners.delete(listener);
}

function getThemeSnapshot() {
  return normalizeTheme(document.documentElement.getAttribute('data-theme'));
}

function getServerThemeSnapshot() {
  return 'light';
}

function publishThemeChange() {
  for (const listener of themeListeners) listener();
}

export function ThemeController({ className = '' }) {
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerThemeSnapshot);

  function toggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    applyDocumentTheme(nextTheme, document.documentElement);
    persistTheme(window.localStorage, nextTheme);
    publishThemeChange();
  }

  const isDark = theme === 'dark';
  const label = isDark ? 'Přepnout na světlý režim' : 'Přepnout na tmavý režim';

  return (
    <button
      aria-label={label}
      aria-pressed={isDark}
      className={[styles.toggle, className].filter(Boolean).join(' ')}
      onClick={toggleTheme}
      title={label}
      type="button"
    >
      <span aria-hidden="true" className={styles.icon}>
        {isDark ? '☀' : '☾'}
      </span>
      <span className={styles.label}>{isDark ? 'Světlý režim' : 'Tmavý režim'}</span>
    </button>
  );
}
