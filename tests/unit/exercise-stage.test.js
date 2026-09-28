import assert from 'node:assert/strict';
import { register } from 'node:module';
import test from 'node:test';

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

register(new URL('../helpers/jsx-loader.mjs', import.meta.url), { parentURL: import.meta.url });

test('exercise stage exposes four independently named regions in one continuous flow', async () => {
  const { default: ExerciseStage } =
    await import('../../src/course-ui/exercises/ExerciseStage.jsx');
  const markup = renderToStaticMarkup(
    React.createElement(ExerciseStage, {
      brief: React.createElement('p', null, 'Doplňte sémantickou strukturu.'),
      studio: React.createElement('textarea', { 'aria-label': 'Kód' }),
      preview: React.createElement('iframe', { title: 'Náhled' }),
      verification: [
        { id: 'one', ok: true, text: 'Element main existuje.' },
        { id: 'two', ok: false, text: 'Chybí popisek formuláře.' },
      ],
      solution: React.createElement('pre', null, '<main />'),
      privateMarker: 'exercise-private',
    }),
  );

  assert.match(markup, /data-exercise-stage="true"/);
  for (const label of ['Zadání', 'IDE', 'Náhled', 'Ověření']) {
    assert.match(markup, new RegExp(`role="region" aria-label="${label}"`));
  }
  assert.match(markup, /data-result-state="passed"/);
  assert.match(markup, /data-result-state="failed"/);
  assert.match(markup, /✓/);
  assert.match(markup, /Splněno/);
  assert.match(markup, /×/);
  assert.match(markup, /Nesplněno/);
  assert.match(markup, /data-projector-private="exercise-private"/);
  assert.doesNotMatch(markup, /portal-|rounded-2xl|shadow-sm/);
});

test('failed verification updates results without replacing the student draft', async () => {
  const { createExerciseState, reduceExerciseState } =
    await import('../../src/course-ui/exercises/ExerciseStage.jsx');
  const edited = reduceExerciseState(createExerciseState('start'), {
    type: 'edit',
    draft: '<main>Moje práce</main>',
  });
  const failed = reduceExerciseState(edited, {
    type: 'verified',
    results: [{ id: 'main', ok: false, text: 'Ještě chybí nadpis.' }],
  });

  assert.equal(failed.draft, '<main>Moje práce</main>');
  assert.deepEqual(failed.results, [{ id: 'main', ok: false, text: 'Ještě chybí nadpis.' }]);
});

test('knowledge check uses text and symbols as well as color for answer state', async () => {
  const { default: KnowledgeCheck } =
    await import('../../src/course-ui/exercises/KnowledgeCheck.jsx');
  const markup = renderToStaticMarkup(
    React.createElement(KnowledgeCheck, {
      title: 'HTML kontrola',
      subtitle: 'Vyberte jednu odpověď.',
      questions: [
        {
          id: 'q1',
          prompt: 'Který element obsahuje hlavní obsah?',
          options: ['main', 'meta'],
          correctIndex: 0,
        },
      ],
      visual: React.createElement('div', { role: 'img', 'aria-label': 'Struktura stránky' }),
    }),
  );

  assert.match(markup, /data-knowledge-check="true"/);
  assert.match(markup, /Rychlá kontrola/);
  assert.match(markup, /0 z 1/);
  assert.match(markup, /Ověřit odpovědi/);
});
