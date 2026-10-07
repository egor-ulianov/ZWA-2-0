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

const { default: studentsHandler } = await import('../../pages/api/students.js');
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

test('teacher can replace the active roster with the uploaded CSV', async () => {
  const queries = [];
  const sql = async (query, parameters) => {
    queries.push({ query, parameters });
    return [];
  };
  sql.transaction = async (items) => Promise.all(items);
  setDbForTests(sql);
  const issuedAt = Math.floor(Date.now() / 1000);
  const token = createSessionToken({
    kind: 'teacher',
    subject: 'teacher',
    issuedAt,
    expiresAt: issuedAt + 3600,
  });
  const res = response();

  await studentsHandler(
    {
      method: 'POST',
      headers: {
        cookie: `teacher_session=${encodeURIComponent(token)}`,
        origin: 'http://localhost:3000',
      },
      body: {
        csv: [
          'Last Name,First Name,Username,Exerc.',
          'Lovelace,Ada,ada,107',
          'Čapek,Karel,karel.capek,108',
        ].join('\n'),
      },
    },
    res,
  );

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    ok: true,
    count: 2,
    students: [
      { username: 'ada', firstName: 'Ada', lastName: 'Lovelace', parallel: '107' },
      { username: 'karel.capek', firstName: 'Karel', lastName: 'Čapek', parallel: '108' },
    ],
  });
  assert.equal(queries.some(({ query }) => /update students set active = false/i.test(query)), true);
});
