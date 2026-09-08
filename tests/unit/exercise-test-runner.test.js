import assert from 'node:assert/strict';
import test from 'node:test';

import { runExerciseTests } from '../../src/components/exercises/testRunner.js';
import {
  getJavaScriptDefinition,
  semanticHtmlDefinition,
} from '../../src/components/exercises/testDefinitions.js';

test('JavaScript definition run returns the exercise result contract itself', () => {
  const definition = getJavaScriptDefinition(0);
  const result = definition.run({
    source: '',
    result: [
      { ok: true, text: 'Code executed' },
      { ok: false, text: 'Requirement failed', hint: 'Try again' },
    ],
  });

  assert.deepEqual(result, [
    { id: 'javascript-step-1-1', ok: true, text: 'Code executed' },
    {
      id: 'javascript-step-1-2',
      ok: false,
      text: 'Requirement failed',
      hint: 'Try again',
    },
  ]);
});

test('semantic HTML test names a failed requirement but does not give a solution', () => {
  const result = runExerciseTests(semanticHtmlDefinition, { source: '<div>News</div>' });

  assert.deepEqual(
    result.map(({ id, ok }) => [id, ok]),
    [['main-landmark', false]],
  );
  assert.match(result[0].text, /main landmark/i);
  assert.doesNotMatch(result[0].text, /replace.*div.*main/i);
});

test('semantic HTML test reports the requirement as met when the source has a main landmark', () => {
  const result = runExerciseTests(semanticHtmlDefinition, {
    source: '<main><h1>News</h1></main>',
  });

  assert.deepEqual(result, [
    {
      id: 'main-landmark',
      ok: true,
      text: 'Main landmark requirement met',
      hint: 'The page identifies its primary content region.',
    },
  ]);
});

test('runner preserves bounded sandbox result messages while adding stable ids', () => {
  const result = runExerciseTests(
    {
      id: 'javascript-step',
      run: ({ result: sandboxResult }) => sandboxResult,
    },
    {
      source: '',
      result: [
        { ok: true, text: 'Code executed' },
        { ok: false, text: 'Requirement failed' },
      ],
    },
  );

  assert.deepEqual(result, [
    { id: 'javascript-step-1', ok: true, text: 'Code executed' },
    { id: 'javascript-step-2', ok: false, text: 'Requirement failed' },
  ]);
});
