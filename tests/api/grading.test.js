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

function teacherCookie() {
  const issuedAt = Math.floor(Date.now() / 1000);
  const token = createSessionToken({
    kind: 'teacher', subject: 'teacher', issuedAt, expiresAt: issuedAt + 3600,
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
