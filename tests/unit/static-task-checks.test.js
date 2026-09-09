import assert from 'node:assert/strict';
import test from 'node:test';

import {
  MAX_STATIC_SOURCE_LENGTH,
  runStaticTaskChecks,
} from '../../src/components/exercises/staticTaskChecks.js';

test('static task checks inspect bounded source without evaluating it', () => {
  const results = runStaticTaskChecks(
    { required: ['function', 'return'] },
    'function demo() { return 1; }',
  );

  assert.deepEqual(
    results.map(({ ok }) => ok),
    [true, true],
  );
  assert.deepEqual(
    results.map(({ id }) => id),
    ['static-required-1', 'static-required-2'],
  );
});

test('static task checks only inspect the bounded source prefix', () => {
  const source = `${'x'.repeat(MAX_STATIC_SOURCE_LENGTH)}required`;
  const results = runStaticTaskChecks({ required: ['required'] }, source);

  assert.equal(results[0].ok, false);
});

test('static task checks do not execute source text', () => {
  globalThis.__staticTaskCheckExecuted = false;
  const source = 'globalThis.__staticTaskCheckExecuted = true;';

  runStaticTaskChecks({ required: ['globalThis'] }, source);

  assert.equal(globalThis.__staticTaskCheckExecuted, false);
  delete globalThis.__staticTaskCheckExecuted;
});

test('static task checks preserve bounded result messages and hints', () => {
  const results = runStaticTaskChecks(
    {
      id: 'php-task',
      required: ['<?php'],
      hints: ['Začněte značkou PHP.'],
    },
    '<html>',
  );

  assert.deepEqual(results, [
    {
      id: 'php-task-required-1',
      ok: false,
      text: 'Požadavek „<?php“ nebyl nalezen.',
      hint: 'Začněte značkou PHP.',
    },
  ]);
});
