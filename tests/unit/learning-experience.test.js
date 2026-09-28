import assert from 'node:assert/strict';
import { register } from 'node:module';
import test from 'node:test';

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

register(new URL('../helpers/jsx-loader.mjs', import.meta.url), { parentURL: import.meta.url });

test('student learning experience renders the new editorial hierarchy with one main landmark', async () => {
  const [{ LearningExperience }, { LearningSection }] = await Promise.all([
    import('../../src/course-ui/learning/LearningExperience.jsx'),
    import('../../src/course-ui/learning/LearningSection.jsx'),
  ]);
  const lesson = {
    number: 1,
    slug: 'html5',
    shortTitle: 'HTML5 a sémantika',
    title: 'HTML5 a sémantika',
    focus: 'Vybudujte pevný sémantický základ.',
    artwork: '/course-art/lesson-01-html5.svg',
    moduleId: 'web-foundations',
  };
  const sections = [
    { id: 'intro', title: 'Úvod' },
    { id: 'practice', title: 'Kostra dokumentu' },
  ];
  const content = React.createElement(
    LearningSection,
    { section: sections[0], idPrefix: 'html5' },
    React.createElement('p', null, 'Bezpečný obsah lekce'),
  );
  const html = renderToStaticMarkup(
    React.createElement(
      LearningExperience,
      {
        lesson,
        sections,
        activeSection: 'intro',
        onChange() {},
        title: 'HTML5 a sémantika',
        subtitle: 'Stavba dokumentu',
        objective: 'Rozpoznat význam sémantických prvků.',
        mode: 'student',
      },
      content,
    ),
  );

  assert.equal((html.match(/<main\b/g) || []).length, 1);
  assert.match(html, /data-learning-experience="student"/);
  assert.match(html, /Osnova lekce/);
  assert.match(html, /Průběh lekce/);
  assert.match(html, /1\s*\/\s*2/);
  assert.match(html, /lesson-01-html5\.svg/);
  assert.match(html, /Cíl lekce/);
  assert.match(html, /Bezpečný obsah lekce/);
  assert.match(html, /Další: Kostra dokumentu/);
});
