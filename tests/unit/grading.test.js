import assert from 'node:assert/strict';
import test from 'node:test';

import {
  gradeImages,
  parseGradeOutput,
  validateGradeRequest,
} from '../../pages/api/grade-test.js';
import {
  consumeNormalizationRateLimit,
  NormalizationProviderError,
  parseNormalizationOutput,
} from '../../pages/api/teacher/normalize-grades.js';
import { GradeProviderError } from '../../pages/api/grade-test.js';
import { createGradesRepository } from '../../src/server/repositories/grades.js';

const PNG_DATA_URL = `data:image/png;base64,${Buffer.from('tiny-image').toString('base64')}`;

test('rejects a grade request with too many, unsupported, or oversized images before grading', () => {
  assert.throws(() => validateGradeRequest({
    username: 'alice', testNumber: 1, maxPoints: 12, images: Array.from({ length: 5 }, () => PNG_DATA_URL),
  }), /four images/i);
  assert.throws(() => validateGradeRequest({
    username: 'alice', testNumber: 1, maxPoints: 12, images: ['data:image/gif;base64,dGlueQ=='],
  }), /PNG, JPEG, or WebP/i);
  assert.throws(() => validateGradeRequest({
    username: 'alice', testNumber: 1, maxPoints: 13, images: [PNG_DATA_URL],
  }), /maxPoints/i);
  const oversized = `data:image/png;base64,${Buffer.alloc((2 * 1024 * 1024) + 1).toString('base64')}`;
  assert.throws(() => validateGradeRequest({
    username: 'alice', testNumber: 1, maxPoints: 12, images: [oversized],
  }), /2 MiB/i);
});

test('accepts a nonzero grade only when the provider returns strict JSON', async () => {
  const fetchResponse = (content) => async () => ({
    ok: true,
    json: async () => ({ choices: [{ message: { content } }] }),
  });

  const grade = await gradeImages({ images: [PNG_DATA_URL], maxPoints: 12, criteria: '' }, {
    apiKey: 'test-key', fetchImpl: fetchResponse('{"points":8,"reasoning":"Dobrá odpověď"}'),
  });
  assert.deepEqual(grade, { points: 8, reasoning: 'Dobrá odpověď' });

  await assert.rejects(
    gradeImages({ images: [PNG_DATA_URL], maxPoints: 12, criteria: '' }, {
      apiKey: 'test-key', fetchImpl: fetchResponse('{"points":"0","reasoning":"bad"}'),
    }),
    /provider output/i,
  );
});

test('turns an aborted provider call into a safe unavailable error', async () => {
  await assert.rejects(
    gradeImages({ images: [PNG_DATA_URL], maxPoints: 12, criteria: '' }, {
      apiKey: 'test-key', timeoutMs: 1,
      fetchImpl: async (_url, options) => new Promise((_, reject) => {
        options.signal.addEventListener('abort', () => reject(new Error('network timeout')));
      }),
    }),
    /unavailable/i,
  );
});

test('does not coerce malformed or out-of-range grade model output into zero', () => {
  assert.throws(() => parseGradeOutput('{"points":"0","reasoning":"bad"}', 12), (error) => {
    assert.equal(error instanceof GradeProviderError, true);
    return /provider output/i.test(error.message);
  });
  assert.throws(() => parseGradeOutput('{"points":13,"reasoning":"bad"}', 12), /provider output/i);
  assert.throws(() => parseGradeOutput('not json', 12), /provider output/i);
  assert.throws(() => parseGradeOutput('{"points":7,"reasoning":"ok","confidence":1}', 12), /provider output/i);
  assert.deepEqual(parseGradeOutput('{"points":7,"reasoning":"věcně správně"}', 12), {
    points: 7,
    reasoning: 'věcně správně',
  });
});

test('rejects incomplete or invalid normalization output instead of defaulting missing students to zero', () => {
  const items = [
    { username: 'alice', attemptId: 11, originalPoints: 10, reasoning: 'A' },
    { username: 'bob', attemptId: 12, originalPoints: 8, reasoning: 'B' },
  ];
  assert.throws(() => parseNormalizationOutput('{"alice":{"points":9,"reasoning":"A"}}', items, 12), (error) => {
    assert.equal(error instanceof NormalizationProviderError, true);
    return /missing/i.test(error.message);
  });
  assert.throws(() => parseNormalizationOutput('{"alice":{"points":9.5,"reasoning":"A"},"bob":{"points":8,"reasoning":"B"}}', items, 12), /invalid/i);
  assert.throws(() => parseNormalizationOutput('{"alice":{"points":9,"reasoning":"A"},"bob":{"points":8,"reasoning":"B","note":"extra"}}', items, 12), /invalid/i);
  assert.throws(() => parseNormalizationOutput('{"alice":{"points":9,"reasoning":"A"},"bob":{"points":8,"reasoning":"B"}}', [items[0], items[0]], 12), /duplicate/i);
});

test('records an AI attempt and its published grade in one atomic statement', async () => {
  const queries = [];
  const sql = async (query, parameters) => {
    queries.push({ query, parameters });
    return [{ id: 41, username: 'alice', test_number: 1, points: 9 }];
  };

  const result = await createGradesRepository(sql).recordAndPublish({
    username: 'alice', testNumber: 1, points: 9, maxPoints: 12,
    reasoning: 'Correct solution', source: 'ai', actor: 'teacher',
    model: 'gpt-4.1', promptVersion: 'grade-v1', imageCount: 1,
  });

  assert.equal(result.id, 41);
  assert.equal(queries.length, 1);
  assert.match(queries[0].query, /with\s+new_attempt/i);
  assert.match(queries[0].query, /insert into published_grades/i);
  assert.deepEqual(queries[0].parameters, ['alice', 1, 9, 12, 'Correct solution', 'ai', 'teacher', 'gpt-4.1', 'grade-v1', 1, 'teacher']);
});

test('rejects non-string audit reasoning instead of coercing it', async () => {
  await assert.rejects(
    createGradesRepository(async () => []).recordAndPublish({
      username: 'alice', testNumber: 1, points: 9, maxPoints: 12,
      reasoning: 42, source: 'ai', actor: 'teacher', imageCount: 1,
    }),
    /invalid grade attempt/i,
  );
});

test('rejects normalization runs without required audit metadata', async () => {
  await assert.rejects(
    createGradesRepository(async () => []).createNormalizationRun({
      runId: 'run-1', testNumber: 1, maxPoints: 12, actor: 'teacher',
      model: '', promptVersion: 'normalization-v2', originalAttempts: [], normalizedItems: [],
    }),
    /invalid normalization run/i,
  );
});

test('rejects a normalization run whose staged rows do not match its original attempts', async () => {
  let queried = false;
  const sql = async () => { queried = true; return []; };

  await assert.rejects(
    createGradesRepository(sql).createNormalizationRun({
      runId: '89ccf2ca-35e8-4fb4-b4f9-3431571a7e1e', testNumber: 1, maxPoints: 12,
      actor: 'teacher', model: 'gpt-4.1', promptVersion: 'normalization-v2',
      originalAttempts: [{ username: 'alice', attemptId: 41 }],
      normalizedItems: [],
    }),
    /normalization run/i,
  );
  assert.equal(queried, false);
});

test('limits normalization provider calls per teacher in a five-minute window', () => {
  for (let index = 0; index < 10; index += 1) consumeNormalizationRateLimit('rate-limit-test', 1_000 + index);
  assert.throws(() => consumeNormalizationRateLimit('rate-limit-test', 1_020), /temporarily unavailable/i);
});

test('refuses a normalization apply when a published attempt changed after preview', async () => {
  const queries = [];
  const sql = async (query) => {
    queries.push(query);
    return queries.length === 1 ? [] : [{ status: 'previewed', total: 1 }];
  };

  const result = await createGradesRepository(sql).applyNormalizationRun({
    runId: '89ccf2ca-35e8-4fb4-b4f9-3431571a7e1e', actor: 'teacher',
  });

  assert.deepEqual(result, { updated: 0, total: 1, stale: true });
  assert.match(queries[0], /attempt_id\s+is\s+distinct\s+from\s+expected\.attempt_id/i);
  assert.doesNotMatch(queries[0], /select item\.username, run\./i);
});

test('uses the guarded normalization run values when inserting normalized attempts', async () => {
  const queries = [];
  const sql = async (query) => {
    queries.push(query);
    return [{ updated: 1, total: 1 }];
  };

  await createGradesRepository(sql).applyNormalizationRun({
    runId: '89ccf2ca-35e8-4fb4-b4f9-3431571a7e1e', actor: 'teacher',
  });

  assert.match(queries[0], /select item\.username, guarded_run\.test_number, item\.points, guarded_run\.max_points/i);
  assert.match(queries[0], /guarded_run\.model, guarded_run\.prompt_version/i);
});

test('rejects a normalization apply identifier that is not a UUID before querying', async () => {
  let queried = false;
  const sql = async () => { queried = true; return []; };

  await assert.rejects(
    createGradesRepository(sql).applyNormalizationRun({ runId: 'not-a-uuid', actor: 'teacher' }),
    /invalid normalization run/i,
  );
  assert.equal(queried, false);
});

test('batches normalization provider calls at the configured limit', async () => {
  const { normalizeGrades } = await import('../../src/server/grading/normalization.js');
  const items = Array.from({ length: 51 }, (_, index) => ({
    username: `student${index}`,
    attemptId: index + 1,
    originalPoints: 6,
    reasoning: 'Původní hodnocení',
  }));
  const calls = [];
  const normalized = await normalizeGrades({ testNumber: 1, maxPoints: 12, items, actor: 'batch-test' }, {
    apiKey: 'test-key',
    fetchImpl: async (_url, options) => {
      const payload = JSON.parse(options.body);
      const input = JSON.parse(payload.messages[0].content.split('\n').at(-1));
      calls.push(input);
      return {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(Object.fromEntries(input.map(({ username }) => [username, { points: 7, reasoning: 'Sjednocené hodnocení' }]))) } }],
        }),
      };
    },
    now: 9_000_000,
  });

  assert.equal(calls.length, 2);
  assert.equal(calls[0].length, 50);
  assert.equal(calls[1].length, 1);
  assert.equal(normalized.length, 51);
  assert.equal(normalized.at(-1).normalizedPoints, 7);
});

test('reapplying an applied normalization run is an idempotent no-op', async () => {
  const queries = [];
  const sql = async (query) => {
    queries.push(query);
    return queries.length === 1 ? [] : [{ status: 'applied', total: 2 }];
  };

  const result = await createGradesRepository(sql).applyNormalizationRun({
    runId: '89ccf2ca-35e8-4fb4-b4f9-3431571a7e1e', actor: 'teacher',
  });

  assert.deepEqual(result, { updated: 0, total: 2, alreadyApplied: true });
  assert.equal(queries.length, 2);
  assert.match(queries[1], /select status/i);
});
