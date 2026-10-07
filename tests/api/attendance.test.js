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

const { default: attendanceHandler } = await import('../../pages/api/attendance.js');
const { createSessionToken } = await import('../../src/server/auth/session.js');
const { setDbForTests } = await import('../../src/server/db.js');

function response() {
  return {
    statusCode: null,
    body: null,
    headers: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
    setHeader(name, value) {
      this.headers[name] = value;
    },
    end() {},
  };
}

function teacherCookie() {
  const issuedAt = Math.floor(Date.now() / 1000);
  const token = createSessionToken({
    kind: 'teacher',
    subject: 'teacher',
    issuedAt,
    expiresAt: issuedAt + 3600,
  });
  return `teacher_session=${encodeURIComponent(token)}`;
}

test('teacher reads one lecture snapshot with its revision', async () => {
  const sql = async () => [];
  sql.transaction = async (factory) => {
    assert.equal(typeof factory, 'function');
    return [[{ username: 'alice', present: true }], [{ revision: 2 }]];
  };
  setDbForTests(sql);
  const res = response();

  await attendanceHandler(
    { method: 'GET', headers: { cookie: teacherCookie() }, query: { lecture: '4' } },
    res,
  );

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { lecture: 4, map: { alice: true }, revision: 2 });
  assert.equal(res.headers.ETag, '"2"');
});

test('teacher attendance rejects a lecture outside 1 through 13', async () => {
  const sql = async () => [];
  sql.transaction = async () => {
    throw new Error('invalid lecture must not reach a transaction');
  };
  setDbForTests(sql);
  const res = response();

  await attendanceHandler(
    {
      method: 'POST',
      headers: {
        cookie: teacherCookie(),
        origin: 'http://localhost:3000',
        'if-match': '"0"',
      },
      query: {},
      body: { lecture: 14, map: { alice: true } },
    },
    res,
  );

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error, 'Invalid request');
});
