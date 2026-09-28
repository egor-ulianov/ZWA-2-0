import assert from 'node:assert/strict';
import test from 'node:test';

import {
  THEME_STORAGE_KEY,
  applyDocumentTheme,
  normalizeTheme,
  persistTheme,
  readStoredTheme,
} from '../../src/course-ui/theme/theme.js';

test('theme normalization accepts only the two explicit application themes', () => {
  assert.equal(THEME_STORAGE_KEY, 'zwa-theme');
  assert.equal(normalizeTheme('light'), 'light');
  assert.equal(normalizeTheme('dark'), 'dark');
  assert.equal(normalizeTheme('LIGHT'), 'light');
  assert.equal(normalizeTheme('system'), 'light');
  assert.equal(normalizeTheme(''), 'light');
  assert.equal(normalizeTheme(null), 'light');
});

test('stored theme reads fall back to light for missing, corrupt, and unavailable storage', () => {
  assert.equal(readStoredTheme({ getItem: () => 'dark' }), 'dark');
  assert.equal(readStoredTheme({ getItem: () => 'blue' }), 'light');
  assert.equal(readStoredTheme({ getItem: () => null }), 'light');
  assert.equal(
    readStoredTheme({
      getItem() {
        throw new Error('storage unavailable');
      },
    }),
    'light',
  );
});

test('theme persistence stores a normalized value and reports unavailable storage', () => {
  const writes = [];
  assert.equal(
    persistTheme(
      {
        setItem(key, value) {
          writes.push([key, value]);
        },
      },
      'dark',
    ),
    true,
  );
  assert.deepEqual(writes, [['zwa-theme', 'dark']]);

  assert.equal(
    persistTheme(
      {
        setItem() {
          throw new Error('storage unavailable');
        },
      },
      'dark',
    ),
    false,
  );
});

test('applying a theme updates the document attribute and native color scheme', () => {
  const attributes = new Map();
  const root = {
    style: {},
    setAttribute(name, value) {
      attributes.set(name, value);
    },
  };

  assert.equal(applyDocumentTheme('dark', root), 'dark');
  assert.equal(attributes.get('data-theme'), 'dark');
  assert.equal(root.style.colorScheme, 'dark');

  assert.equal(applyDocumentTheme('corrupt', root), 'light');
  assert.equal(attributes.get('data-theme'), 'light');
  assert.equal(root.style.colorScheme, 'light');
});
