import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createSessionToken,
  verifySessionToken,
} from '../../src/server/auth/session.js';
import { getServerEnv } from '../../src/server/env.js';
import { hashAccessCode, verifyAccessCode } from '../../src/server/repositories/students.js';

function withAuthEnv(fn) {
  const original = { ...process.env };
  Object.assign(process.env, {
    NODE_ENV: 'test',
    DATABASE_URL: 'postgresql://example.invalid/test',
    TEACHER_COOKIE_SECRET: 'teacher-secret-for-tests',
    STUDENT_COOKIE_SECRET: 'student-secret-for-tests',
    ATTENDANCE_AUTH_USER: 'teacher',
    ATTENDANCE_AUTH_PASS: 'password',
    APP_ORIGIN: 'http://localhost:3000',
  });
  try {
    return fn();
  } finally {
    process.env = original;
  }
}

test('rejects a token whose signature was changed', () => withAuthEnv(() => {
  const token = createSessionToken({
    kind: 'teacher', subject: 'teacher', issuedAt: 100, expiresAt: 200,
  });
  const changed = `${token.slice(0, -1)}${token.endsWith('a') ? 'b' : 'a'}`;

  assert.equal(verifySessionToken(changed, 'teacher'), null);
}));

test('rejects an expired session', () => withAuthEnv(() => {
  const token = createSessionToken({
    kind: 'student', subject: 'alice', issuedAt: 1, expiresAt: 2,
  });

  assert.equal(verifySessionToken(token, 'student', { now: 3 }), null);
}));

test('rejects a session used as the wrong actor kind', () => withAuthEnv(() => {
  const token = createSessionToken({
    kind: 'student', subject: 'alice', issuedAt: 100, expiresAt: 200,
  });

  assert.equal(verifySessionToken(token, 'teacher', { now: 150 }), null);
}));

test('round-trips a valid expiring session payload', () => withAuthEnv(() => {
  const token = createSessionToken({
    kind: 'student', subject: 'alice', issuedAt: 100, expiresAt: 200,
  });

  const session = verifySessionToken(token, 'student', { now: 150 });
  assert.equal(session.version, 1);
  assert.equal(session.kind, 'student');
  assert.equal(session.subject, 'alice');
  assert.equal(session.issuedAt, 100);
  assert.equal(session.expiresAt, 200);
  assert.match(session.sessionId, /^[0-9a-f-]{36}$/);
}));

test('fails closed when a production secret is missing', () => {
  assert.throws(() => getServerEnv({ NODE_ENV: 'production', DATABASE_URL: 'postgresql://example.invalid/test' }), /TEACHER_COOKIE_SECRET/);
});

test('stores an access code as a salted hash rather than plaintext', async () => {
  const hash = await hashAccessCode('correct-horse-battery-staple');
  assert.doesNotMatch(hash, /correct-horse-battery-staple/);
  assert.equal(await verifyAccessCode('correct-horse-battery-staple', hash), true);
  assert.equal(await verifyAccessCode('wrong-code', hash), false);
});
