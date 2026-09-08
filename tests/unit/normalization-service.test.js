import assert from 'node:assert/strict';
import test from 'node:test';

import {
  NormalizationRunNotFoundError,
  NormalizationRunStaleError,
  executeNormalization,
} from '../../src/server/grading/normalization-service.js';

const runId = '89ccf2ca-35e8-4fb4-b4f9-3431571a7e1e';

test('executeNormalization persists a bounded preview through the grading boundary', async () => {
  const calls = [];
  const repository = {
    async getPublishedForTest(testNumber) {
      calls.push(['getPublishedForTest', testNumber]);
      return [{ id: 41, username: 'alice', points: 8, reasoning: 'Původní' }];
    },
    async createNormalizationRun(input) {
      calls.push(['createNormalizationRun', input]);
    },
  };

  const result = await executeNormalization({
    body: { dryRun: true, testNumber: 1, maxPoints: 12 },
    actor: 'teacher',
    repository,
    model: 'test-model',
    createRunId: () => runId,
    normalize: async (input, dependencies) => {
      calls.push(['normalize', input, dependencies]);
      return [
        {
          username: 'alice',
          originalPoints: 8,
          normalizedPoints: 9,
          reasoning: 'Sjednocené',
        },
      ];
    },
  });

  assert.deepEqual(result, {
    kind: 'preview',
    runId,
    total: 1,
    updated: 0,
    preview: [
      { username: 'alice', originalPoints: 8, normalizedPoints: 9, reasoning: 'Sjednocené' },
    ],
  });
  assert.deepEqual(calls[0], ['getPublishedForTest', 1]);
  assert.deepEqual(calls[1], [
    'normalize',
    {
      testNumber: 1,
      maxPoints: 12,
      actor: 'teacher',
      items: [{ username: 'alice', attemptId: 41, originalPoints: 8, reasoning: 'Původní' }],
    },
    { model: 'test-model' },
  ]);
  assert.deepEqual(calls[2], [
    'createNormalizationRun',
    {
      runId,
      testNumber: 1,
      maxPoints: 12,
      actor: 'teacher',
      model: 'test-model',
      promptVersion: 'normalization-v2',
      originalAttempts: [{ username: 'alice', attemptId: 41, originalPoints: 8 }],
      normalizedItems: [{ username: 'alice', points: 9, reasoning: 'Sjednocené' }],
    },
  ]);
});

test('executeNormalization applies a requested run and returns normalized counts', async () => {
  let providerCalled = false;
  const repository = {
    async applyNormalizationRun(input) {
      assert.deepEqual(input, { runId, actor: 'teacher' });
      return { total: '2', updated: '2', alreadyApplied: false };
    },
  };

  const result = await executeNormalization({
    body: { runId },
    actor: 'teacher',
    repository,
    normalize: async () => {
      providerCalled = true;
      return [];
    },
  });

  assert.deepEqual(result, {
    kind: 'apply',
    runId,
    total: 2,
    updated: 2,
    alreadyApplied: false,
  });
  assert.equal(providerCalled, false);
});

test('executeNormalization preserves apply not-found and stale classifications', async () => {
  for (const [result, ErrorType] of [
    [null, NormalizationRunNotFoundError],
    [{ stale: true, total: 1, updated: 0 }, NormalizationRunStaleError],
  ]) {
    await assert.rejects(
      executeNormalization({
        body: { runId },
        actor: 'teacher',
        repository: { applyNormalizationRun: async () => result },
      }),
      (error) => error instanceof ErrorType,
    );
  }
});
