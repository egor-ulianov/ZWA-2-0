import assert from 'node:assert/strict';
import test from 'node:test';

import { requireSameOrigin } from '../../src/server/security/csrf.js';
import { requireStudent, requireTeacher } from '../../src/server/auth/guards.js';
import attendanceHandler from '../../pages/api/attendance.js';
import studentAttendanceHandler from '../../pages/api/student/attendance.js';

Object.assign(process.env, {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://example.invalid/test',
  TEACHER_COOKIE_SECRET: 'teacher-secret-for-tests',
  STUDENT_COOKIE_SECRET: 'student-secret-for-tests',
  ATTENDANCE_AUTH_USER: 'teacher',
  ATTENDANCE_AUTH_PASS: 'password',
  APP_ORIGIN: 'http://localhost:3000',
});

function response() {
  return { statusCode: null, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
}

test('returns 401 when a teacher endpoint has no teacher session', async () => {
  const res = response();
  const actor = await requireTeacher({ headers: {} }, res);
  assert.equal(actor, null);
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { error: 'Unauthorized' });
});

test('returns 401 before an anonymous request can read teacher attendance', async () => {
  const res = response();
  await attendanceHandler({ method: 'GET', headers: {}, query: {} }, res);
  assert.equal(res.statusCode, 401);
});

test('returns 401 before an anonymous request can read student attendance', async () => {
  const res = response();
  await studentAttendanceHandler({ method: 'GET', headers: {} }, res);
  assert.equal(res.statusCode, 401);
});

test('does not let a teacher session satisfy a student guard', async () => {
  const res = response();
  const actor = await requireStudent({ headers: { cookie: 'teacher_session=not-a-student-token' } }, res);
  assert.equal(actor, null);
  assert.equal(res.statusCode, 401);
});

test('rejects a cookie-authenticated mutation from a foreign origin', () => {
  process.env.APP_ORIGIN = 'https://zwa.example.test';
  assert.equal(requireSameOrigin({ method: 'POST', headers: { origin: 'https://attacker.example' } }), false);
});
