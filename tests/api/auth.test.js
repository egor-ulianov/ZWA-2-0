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

const { default: teacherLogin } = await import('../../pages/api/teacher/login.js');
const { default: studentLogin } = await import('../../pages/api/student/login.js');
const { hashAccessCode } = await import('../../src/server/repositories/students.js');
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

function request({ headers = {}, body = {} } = {}) {
  return {
    method: 'POST',
    headers: { origin: 'http://localhost:3000', ...headers },
    socket: { remoteAddress: '198.51.100.10' },
    body,
  };
}

test('teacher login consumes shared IP and account buckets before checking credentials', async () => {
  const queries = [];
  setDbForTests(async (query, parameters) => {
    queries.push({ query, parameters });
    return [{ request_count: 1 }];
  });

  const res = response();
  await teacherLogin(request({ body: { username: 'teacher', password: 'password' } }), res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(queries.map(({ parameters }) => parameters[0]), [
    'teacher-login-ip:198.51.100.10',
    'teacher-login-account:teacher',
  ]);
});

test('student login consumes shared IP and account buckets before reading access state', async () => {
  const queries = [];
  const accessCodeHash = await hashAccessCode('correct-code');
  setDbForTests(async (query, parameters) => {
    queries.push({ query, parameters });
    if (/rate_limit_buckets/i.test(query)) return [{ request_count: 1 }];
    if (/select auth_code_hash/i.test(query)) {
      return [{ auth_code_hash: accessCodeHash, expires_at: null, revoked_at: null, failed_attempts: 0, locked_until: null }];
    }
    return [];
  });

  const res = response();
  await studentLogin(request({ body: { username: 'Alice', code: 'correct-code' } }), res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(queries.filter(({ query }) => /rate_limit_buckets/i.test(query)).map(({ parameters }) => parameters[0]), [
    'student-login-ip:198.51.100.10',
    'student-login-account:alice',
  ]);
  assert.equal(queries.some(({ query }) => /failed_attempts = failed_attempts \+ 1/i.test(query)), false);
});

test('teacher login fails closed when the shared limiter is unavailable', async () => {
  setDbForTests(async () => { throw new Error('database unavailable'); });

  const res = response();
  await teacherLogin(request({ body: { username: 'teacher', password: 'password' } }), res);

  assert.equal(res.statusCode, 503);
  assert.deepEqual(res.body, { error: 'Login service unavailable' });
});

test('student login fails closed when the shared limiter is unavailable', async () => {
  setDbForTests(async () => { throw new Error('database unavailable'); });

  const res = response();
  await studentLogin(request({ body: { username: 'alice', code: 'wrong-code' } }), res);

  assert.equal(res.statusCode, 503);
  assert.deepEqual(res.body, { error: 'Login service unavailable' });
});

test('teacher IP limiting stops a request before credential verification', async () => {
  const queries = [];
  setDbForTests(async (query, parameters) => {
    queries.push({ query, parameters });
    if (/rate_limit_buckets/i.test(query)) return [{ request_count: 999 }];
    throw new Error('credential verification must not run');
  });

  const res = response();
  await teacherLogin(request({ body: { username: 'teacher', password: 'password' } }), res);

  assert.equal(res.statusCode, 429);
  assert.deepEqual(res.body, { error: 'Too many login attempts' });
  assert.equal(queries.length, 1);
});

test('student account limiting stops a request before access lookup', async () => {
  const queries = [];
  setDbForTests(async (query, parameters) => {
    queries.push({ query, parameters });
    if (parameters[0] === 'student-login-ip:198.51.100.10') return [{ request_count: 1 }];
    if (parameters[0] === 'student-login-account:alice') return [{ request_count: 999 }];
    throw new Error('access lookup must not run');
  });

  const res = response();
  await studentLogin(request({ body: { username: 'alice', code: 'wrong-code' } }), res);

  assert.equal(res.statusCode, 429);
  assert.deepEqual(res.body, { error: 'Too many login attempts' });
  assert.equal(queries.length, 2);
});

test('student failed login still records the account lockout attempt after rate checks', async () => {
  const queries = [];
  setDbForTests(async (query, parameters) => {
    queries.push({ query, parameters });
    if (/rate_limit_buckets/i.test(query)) return [{ request_count: 1 }];
    if (/select auth_code_hash/i.test(query)) {
      return [{ auth_code_hash: 'not-a-valid-hash', expires_at: null, revoked_at: null, failed_attempts: 4, locked_until: null }];
    }
    return [];
  });

  const res = response();
  await studentLogin(request({ body: { username: 'alice', code: 'wrong-code' } }), res);

  assert.equal(res.statusCode, 401);
  assert.equal(queries.filter(({ query }) => /rate_limit_buckets/i.test(query)).length, 2);
  assert.equal(queries.some(({ query }) => /update student_access set failed_attempts/i.test(query)), true);
});
