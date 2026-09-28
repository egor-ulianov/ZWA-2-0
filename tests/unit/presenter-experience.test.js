import assert from 'node:assert/strict';
import { register } from 'node:module';
import test from 'node:test';

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import {
  parsePresenterMessage,
  presenterChannelName,
} from '../../src/course-ui/presentation/presenterChannel.js';

register(new URL('../helpers/jsx-loader.mjs', import.meta.url), { parentURL: import.meta.url });

const sections = [
  { id: 'intro', title: 'Úvod', presenterNotes: 'Začněte významem struktury.' },
  { id: 'practice', title: 'Cvičení' },
];

test('presenter messages accept only known section changes for the current lesson', () => {
  assert.equal(presenterChannelName('html5'), 'zwa-presenter-html5');
  assert.deepEqual(
    parsePresenterMessage(
      { type: 'slide-change', lessonSlug: 'html5', slideId: 'intro' },
      sections,
      'html5',
    ),
    { slideId: 'intro' },
  );
  assert.equal(
    parsePresenterMessage(
      { type: 'slide-change', lessonSlug: 'other', slideId: 'intro' },
      sections,
      'html5',
    ),
    null,
  );
  assert.equal(
    parsePresenterMessage(
      { type: 'slide-change', lessonSlug: 'html5', slideId: 'missing' },
      sections,
      'html5',
    ),
    null,
  );
});

test('presenter experience has one purpose-built main region and private notes', async () => {
  const { PresenterExperience } =
    await import('../../src/course-ui/presentation/PresenterExperience.jsx');
  const html = renderToStaticMarkup(
    React.createElement(
      PresenterExperience,
      {
        lesson: { slug: 'html5', title: 'HTML5 a sémantika' },
        sections,
        activeSection: 'intro',
        onChange() {},
      },
      React.createElement('p', null, 'Výukový obsah'),
    ),
  );

  assert.equal((html.match(/<main\b/g) || []).length, 1);
  assert.match(html, /data-presentation-mode="presenter"/);
  assert.match(html, /Osnova prezentujícího/);
  assert.match(html, /Spustit časovač/);
  assert.match(html, /Otevřít projektor/);
  assert.match(html, /data-projector-private="presenter-notes"/);
  assert.match(html, /Začněte významem struktury/);
  assert.doesNotMatch(html, /portal-panel|portal-action|portal-header/);
});
