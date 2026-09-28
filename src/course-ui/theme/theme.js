export const THEME_STORAGE_KEY = 'zwa-theme';

export function normalizeTheme(value) {
  return value === 'dark' ? 'dark' : 'light';
}

export function readStoredTheme(storage) {
  try {
    return normalizeTheme(storage?.getItem(THEME_STORAGE_KEY));
  } catch {
    return 'light';
  }
}

export function persistTheme(storage, theme) {
  try {
    storage?.setItem(THEME_STORAGE_KEY, normalizeTheme(theme));
    return Boolean(storage);
  } catch {
    return false;
  }
}

export function applyDocumentTheme(theme, root) {
  const normalizedTheme = normalizeTheme(theme);

  if (root) {
    root.setAttribute('data-theme', normalizedTheme);
    root.style.colorScheme = normalizedTheme;
  }

  return normalizedTheme;
}
