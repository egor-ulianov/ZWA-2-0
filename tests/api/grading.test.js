import assert from 'node:assert/strict';
import test from 'node:test';

Object.assign(process.env, {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://user:password@example.invalid/test',
  TEACHER_COOKIE_SECRET: 'teacher-secret-for-tests',
  STUDENT_COOKIE_SECRET: 'student-secret-for-tests',
  ATTENDANCE_AUTH_USER: 'teacher',
  ATTENDANCE_AUTH_PASS: 'password',
  APP_ORIGIN: 'http://localhost:3000',
});

const { default: gradeHandler } = await import('../../pages/api/grade-test.js');
const { default: normalizeHandler } = await import('../../pages/api/teacher/normalize-grades.js');
const { createSessionToken } = await import('../../src/server/auth/session.js');
const { setDbForTests } = await import('../../src/server/db.js');

function response() {
  return {
    statusCode: null,
    body: null,
    headers: {},
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    setHeader(name, value) { this.headers[name] = value; },
    end() {},
  };
}

function teacherCookie(subject = 'teacher') {
  const issuedAt = Math.floor(Date.now() / 1000);
  const token = createSessionToken({
    kind: 'teacher', subject, issuedAt, expiresAt: issuedAt + 3600,
  });
  return `teacher_session=${encodeURIComponent(token)}`;
}

test('grade reads and mutations reject anonymous callers before accessing grade data', async () => {
  const get = response();
  await gradeHandler({ method: 'GET', headers: {}, query: { username: 'alice' } }, get);
  assert.equal(get.statusCode, 401);

  const post = response();
  await gradeHandler({ method: 'POST', headers: {}, body: {} }, post);
  assert.equal(post.statusCode, 401);
});

test('normalization rejects anonymous callers before reading grade attempts', async () => {
  const res = response();
  await normalizeHandler({ method: 'POST', headers: {}, body: { testNumber: 1, maxPoints: 12 } }, res);
  assert.equal(res.statusCode, 401);
});

test('grade mutation rejects a foreign origin after teacher authentication', async () => {
  setDbForTests(async () => []);
  const res = response();
  await gradeHandler({
    method: 'POST', headers: { cookie: teacherCookie(), origin: 'https://attacker.example' }, body: {},
  }, res);
  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body.error, 'Forbidden');
  assert.equal(Object.hasOwn(res.body, 'details'), false);
});

test('normalization mutation rejects a foreign origin after teacher authentication', async () => {
  setDbForTests(async () => []);
  const res = response();
  await normalizeHandler({
    method: 'POST', headers: { cookie: teacherCookie(), origin: 'https://attacker.example' }, body: { dryRun: true, testNumber: 1, maxPoints: 12 },
  }, res);
  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body.error, 'Forbidden');
  assert.equal(Object.hasOwn(res.body, 'details'), false);
});

test('grade route maps guard configuration failures to a generic error', async () => {
  const originalOrigin = process.env.APP_ORIGIN;
  const cookie = teacherCookie();
  process.env.APP_ORIGIN = 'not a valid origin';
  try {
    const res = response();
    await gradeHandler({ method: 'GET', headers: { cookie }, query: { username: 'alice' } }, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.error, 'Grade service unavailable');
    assert.match(res.body.correlationId, /^[0-9a-f-]{36}$/);
    assert.equal(Object.hasOwn(res.body, 'details'), false);
  } finally {
    process.env.APP_ORIGIN = originalOrigin;
  }
});

test('grade provider failure returns a generic error without writing an attempt', async () => {
  const queries = [];
  setDbForTests(async (query, parameters) => {
    queries.push({ query, parameters });
    return [];
  });
  const originalFetch = globalThis.fetch;
  const originalApiKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = 'test-key';
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({ choices: [{ message: { content: '{"points":"0","reasoning":"bad"}' } }] }),
  });
  try {
    const res = response();
    await gradeHandler({
      method: 'POST',
      headers: { cookie: teacherCookie(), origin: 'http://localhost:3000' },
      body: { username: 'alice', testNumber: 1, maxPoints: 12, images: ['data:image/png;base64,dGlueQ=='] },
    }, res);
    assert.equal(res.statusCode, 502);
    assert.equal(res.body.error, 'AI grading failed');
    assert.equal(Object.hasOwn(res.body, 'details'), false);
    assert.equal(queries.some(({ query }) => /insert into grade_attempts/i.test(query)), false);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalApiKey;
  }
});

test('normalization apply rejects a malformed run identifier without repository access', async () => {
  const queries = [];
  setDbForTests(async (query, parameters) => {
    queries.push({ query, parameters });
    return [];
  });
  const res = response();
  await normalizeHandler({
    method: 'POST',
    headers: { cookie: teacherCookie(), origin: 'http://localhost:3000' },
    body: { runId: 'not-a-uuid' },
  }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error, 'Invalid runId');
  assert.equal(queries.length, 1);
  assert.match(queries[0].query, /revoked_sessions/i);
});

test('normalization apply reports a stale preview as a conflict', async () => {
  let calls = 0;
  setDbForTests(async () => {
    calls += 1;
    if (calls === 1) return [];
    if (calls === 2) return [];
    return [{ status: 'previewed', total: 1 }];
  });
  const res = response();
  await normalizeHandler({
    method: 'POST',
    headers: { cookie: teacherCookie(), origin: 'http://localhost:3000' },
    body: { runId: '89ccf2ca-35e8-4fb4-b4f9-3431571a7e1e' },
  }, res);
  assert.equal(res.statusCode, 409);
  assert.equal(res.body.error, 'Normalization run is stale; preview again');
});

test('grade GET rejects an invalid test number before reading published grades', async () => {
  const queries = [];
  setDbForTests(async (query, parameters) => {
    queries.push({ query, parameters });
    return [];
  });
  const res = response();
  await gradeHandler({
    method: 'GET',
    headers: { cookie: teacherCookie() },
    query: { username: 'alice', testNumber: '5' },
  }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error, 'Invalid testNumber');
  assert.equal(queries.length, 1);
  assert.match(queries[0].query, /revoked_sessions/i);
});

test('grade GET keeps the legacy test-number keyed items response', async () => {
  let calls = 0;
  setDbForTests(async () => {
    calls += 1;
    if (calls === 1) return [];
    return [{ id: 41, username: 'alice', test_number: 1, points: 9, reasoning: 'Dobře', max_points: 12 }];
  });
  const res = response();
  await gradeHandler({
    method: 'GET',
    headers: { cookie: teacherCookie() },
    query: { username: 'alice' },
  }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(Array.isArray(res.body.items), false);
  assert.equal(res.body.items[1].points, 9);
  assert.equal(res.body.items[1].images_count, 0);
});

test('grade provider calls are throttled with 429 after the bounded window is full', async () => {
  setDbForTests(async () => []);
  const originalFetch = globalThis.fetch;
  const originalApiKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = 'test-key';
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({ choices: [{ message: { content: '{"points":1,"reasoning":"Hodnocení"}' } }] }),
  });
  try {
    const request = {
      method: 'POST',
      headers: { cookie: teacherCookie('rate-limit-teacher'), origin: 'http://localhost:3000' },
      body: { username: 'alice', testNumber: 1, maxPoints: 12, images: ['data:image/png;base64,dGlueQ=='] },
    };
    for (let index = 0; index < 10; index += 1) {
      const res = response();
      await gradeHandler(request, res);
      assert.equal(res.statusCode, 200);
    }
    const limited = response();
    await gradeHandler(request, limited);
    assert.equal(limited.statusCode, 429);
    assert.equal(limited.body.error, 'AI grading temporarily unavailable');
  } finally {
    globalThis.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalApiKey;
  }
});

test('normalization preview persists the exact bounded preview with audit metadata', async () => {
  const queries = [];
  setDbForTests(async (query, parameters) => {
    queries.push({ query, parameters });
    if (queries.length === 1) return [];
    if (queries.length === 2) return [{ id: 41, username: 'alice', test_number: 1, points: 8, reasoning: 'Původní', max_points: 12 }];
    return [{ id: 'run-created' }];
  });
  const originalFetch = globalThis.fetch;
  const originalApiKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = 'test-key';
  globalThis.fetch = async (_url, options) => {
    const payload = JSON.parse(options.body);
    const items = JSON.parse(payload.messages[0].content.split('\n').at(-1));
    return {
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify({ alice: { points: 9, reasoning: 'Sjednocené' } }) } }],
      }),
    };
  };
  try {
    const res = response();
    await normalizeHandler({
      method: 'POST',
      headers: { cookie: teacherCookie('preview-teacher'), origin: 'http://localhost:3000' },
      body: { dryRun: true, testNumber: 1, maxPoints: 12 },
    }, res);
    assert.equal(res.statusCode, 200);
    assert.match(res.body.runId, /^[0-9a-f-]{36}$/);
    assert.deepEqual(res.body.preview, [{ username: 'alice', originalPoints: 8, normalizedPoints: 9, reasoning: 'Sjednocené' }]);
    assert.equal(queries.length, 3);
    assert.match(queries[2].query, /insert into grade_normalization_runs/i);
    assert.equal(queries[2].parameters[3], 'preview-teacher');
    assert.equal(queries[2].parameters[4], 'gpt-4.1');
    assert.equal(queries[2].parameters[5], 'normalization-v2');
  } finally {
    globalThis.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalApiKey;
  }
});

test('normalization replay returns an idempotent no-op for an applied run', async () => {
  let calls = 0;
  setDbForTests(async () => {
    calls += 1;
    if (calls === 1) return [];
    if (calls === 2) return [];
    return [{ status: 'applied', total: 2 }];
  });
  const res = response();
  await normalizeHandler({
    method: 'POST',
    headers: { cookie: teacherCookie('replay-teacher'), origin: 'http://localhost:3000' },
    body: { runId: '89ccf2ca-35e8-4fb4-b4f9-3431571a7e1e' },
  }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    ok: true,
    runId: '89ccf2ca-35e8-4fb4-b4f9-3431571a7e1e',
    total: 2,
    updated: 0,
    alreadyApplied: true,
  });
});

for (const status of ['previewed', 'applied']) {
  test(`normalization ${status} run cannot be replayed by a non-owner`, async () => {
    const runId = '89ccf2ca-35e8-4fb4-b4f9-3431571a7e1e';
    let calls = 0;
    setDbForTests(async (query, parameters) => {
      calls += 1;
      if (calls < 3) return [];
      assert.match(query, /from grade_normalization_runs/i);
      assert.deepEqual(parameters, [runId, 'non-owner']);
      return [];
    });

    const res = response();
    await normalizeHandler({
      method: 'POST',
      headers: { cookie: teacherCookie('non-owner'), origin: 'http://localhost:3000' },
      body: { runId },
    }, res);

    assert.equal(res.statusCode, 404);
    assert.equal(res.body.error, 'Normalization run not found');
    assert.equal(Object.hasOwn(res.body, 'total'), false);
    void status;
  });
}

test('legacy normalization apply requests resolve the latest same-teacher preview', async () => {
  let calls = 0;
  const runId = '89ccf2ca-35e8-4fb4-b4f9-3431571a7e1e';
  setDbForTests(async (query) => {
    calls += 1;
    if (calls === 1) return [];
    if (calls === 2) return [{ id: runId }];
    assert.match(query, /status\s*=\s*'previewed'/i);
    return [{ updated: 1, total: 1 }];
  });
  const res = response();
  await normalizeHandler({
    method: 'POST',
    headers: { cookie: teacherCookie('legacy-ui-teacher'), origin: 'http://localhost:3000' },
    body: { dryRun: false, testNumber: 1, maxPoints: 12 },
  }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    ok: true, runId, total: 1, updated: 1, alreadyApplied: false,
  });
});
