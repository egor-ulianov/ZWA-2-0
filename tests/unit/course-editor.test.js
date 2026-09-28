import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

register(new URL('../helpers/jsx-loader.mjs', import.meta.url), { parentURL: import.meta.url });

const root = join(fileURLToPath(new URL('../..', import.meta.url)));

test('studio editor exposes the approved language set without the legacy editor', async () => {
  const { SUPPORTED_STUDIO_LANGUAGES, normalizeStudioLanguage } =
    await import('../../src/course-ui/exercises/StudioEditor.jsx');
  const source = readFileSync(join(root, 'src/course-ui/exercises/StudioEditor.jsx'), 'utf8');

  assert.deepEqual(SUPPORTED_STUDIO_LANGUAGES, [
    'css',
    'html',
    'js',
    'javascript',
    'php',
    'bash',
    'sh',
    'text',
  ]);
  assert.equal(normalizeStudioLanguage('PHP'), 'php');
  assert.equal(normalizeStudioLanguage('shell'), 'bash');
  assert.equal(normalizeStudioLanguage('unknown'), 'text');
  assert.match(source, /from ['"]@uiw\/react-codemirror['"]/);
  assert.doesNotMatch(source, /SyntaxCodeEditor/);
});

test('studio tabs provide wrapping roving-tab keyboard behavior', async () => {
  const { getNextStudioTabIndex } = await import('../../src/course-ui/exercises/StudioTabs.jsx');

  assert.equal(getNextStudioTabIndex('ArrowRight', 2, 3), 0);
  assert.equal(getNextStudioTabIndex('ArrowLeft', 0, 3), 2);
  assert.equal(getNextStudioTabIndex('ArrowDown', 0, 3), 1);
  assert.equal(getNextStudioTabIndex('ArrowUp', 2, 3), 1);
  assert.equal(getNextStudioTabIndex('Home', 2, 3), 0);
  assert.equal(getNextStudioTabIndex('End', 0, 3), 2);
  assert.equal(getNextStudioTabIndex('Enter', 1, 3), 1);
  assert.equal(getNextStudioTabIndex('ArrowRight', 0, 0), -1);
});

test('solution panel is visibly separate and forcibly read only', async () => {
  const { default: StudioTabs } = await import('../../src/course-ui/exercises/StudioTabs.jsx');
  const markup = renderToStaticMarkup(
    React.createElement(StudioTabs, {
      files: [
        {
          id: 'index',
          label: 'index.html',
          panel: React.createElement('textarea', { defaultValue: '<main />' }),
        },
      ],
      solution: {
        label: 'Řešení',
        panel: React.createElement('textarea', { defaultValue: '<main>Hotovo</main>' }),
      },
      activeFileId: 'solution',
    }),
  );

  assert.match(markup, /role="tablist"/);
  assert.match(markup, /data-solution-tab="true"[^>]*tabindex="0"/);
  assert.match(markup, /data-solution-panel="true"/);
  assert.match(markup, /aria-readonly="true"/);
  assert.match(markup, /<textarea[^>]*readonly=""/);
});
