import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { parseAttendanceRevision, validateIsoDate } from '../../src/server/repositories/validation.js';

Object.assign(process.env, {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://user:password@example.invalid/test',
  TEACHER_COOKIE_SECRET: 'teacher-secret-for-tests',
  STUDENT_COOKIE_SECRET: 'student-secret-for-tests',
  ATTENDANCE_AUTH_USER: 'teacher',
  ATTENDANCE_AUTH_PASS: 'password',
  APP_ORIGIN: 'http://localhost:3000',
});

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const migrationsDirectory = path.join(root, 'db/migrations');

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

test('rejects calendar rollover dates instead of trusting Date.parse normalization', () => {
  assert.throws(() => validateIsoDate('2026-02-29'), /date/i);
  assert.throws(() => validateIsoDate('2026-04-31'), /date/i);
  assert.doesNotThrow(() => validateIsoDate('2028-02-29'));
});

test('accepts only a numeric attendance revision or a paired quoted ETag', () => {
  assert.equal(parseAttendanceRevision(0), 0);
  assert.equal(parseAttendanceRevision('"12"'), 12);
  assert.throws(() => parseAttendanceRevision('"12'), /revision/i);
  assert.throws(() => parseAttendanceRevision('12"'), /revision/i);
});

test('includes an idempotent legacy grade retirement migration', async () => {
  const files = await readdir(migrationsDirectory);
  assert.ok(files.includes('005_migrate_legacy_grades.sql'));
  const source = await readFile(path.join(migrationsDirectory, '005_migrate_legacy_grades.sql'), 'utf8');
  assert.match(source, /test_grades/i);
  assert.match(source, /test[1-4]/i);
  assert.match(source, /grade_attempts/i);
  assert.match(source, /published_grades/i);
  assert.match(source, /on conflict/i);
  assert.match(source, /drop table if exists test_grades/i);
  assert.match(source, /drop column if exists test[1-4]/i);
  assert.match(source, /column_name in \('test1'/i);
});

test('migration runner serializes and checks migrations under a transaction advisory lock', async () => {
  const source = await readFile(path.join(root, 'scripts/migrate.mjs'), 'utf8');
  assert.match(source, /pg_advisory_xact_lock/i);
  assert.match(source, /schema_migrations/i);
  assert.match(source, /checksum/i);
  assert.match(source, /transaction\(/i);
  assert.match(source, /if not exists \(select 1 from schema_migrations/i);
});

test('migration runner does not wrap multi-statement migrations in dynamic SQL', async () => {
  const source = await readFile(path.join(root, 'scripts/migrate.mjs'), 'utf8');

  assert.doesNotMatch(source, /execute \$sourceTag\$/i);
  assert.match(source, /sql\(source\)/i);
});

test('production start entrypoint runs migrations before spawning Next', async () => {
  const source = await readFile(path.join(root, 'scripts/start.mjs'), 'utf8');
  assert.match(source, /runMigrations/i);
  assert.match(source, /spawn/i);
  assert.match(source, /next[^\n]+dist[^\n]+bin[^\n]+next/i);
});

test('grade DTO exposes only the least-privilege student fields', async () => {
  const { toStudentGradeDto } = await import('../../src/server/repositories/grades.js');
  assert.deepEqual(toStudentGradeDto({
    id: 41,
    username: 'alice',
    test_number: 1,
    points: 9,
    max_points: 12,
    reasoning: 'Dobře',
    source: 'ai',
    actor: 'teacher-secret',
    model: 'private-model',
    prompt_version: 'private-prompt',
    image_count: 1,
    created_at: '2026-09-08T10:00:00.000Z',
  }), {
    test_number: 1,
    points: 9,
    max_points: 12,
    reasoning: 'Dobře',
    graded_at: '2026-09-08T10:00:00.000Z',
  });
});

test('SQL requires normalization apply actor to own the previewed run', async () => {
  const source = await readFile(path.join(root, 'src/server/repositories/grades.js'), 'utf8');
  assert.match(source, /guarded_run[\s\S]{0,800}run\.actor\s*=\s*\$2/i);
  const migration = await readFile(path.join(migrationsDirectory, '005_migrate_legacy_grades.sql'), 'utf8');
  assert.match(migration, /actor/i);
  assert.match(migration, /new\.applied_by is distinct from old\.actor/i);
});

test('grade audit schema contains immutable history and restrictive ownership constraints', async () => {
  const source = await readFile(path.join(migrationsDirectory, '005_migrate_legacy_grades.sql'), 'utf8');
  assert.match(source, /before\s+(?:update|delete)/i);
  assert.match(source, /raise exception/i);
  assert.match(source, /foreign key/i);
  assert.match(source, /normalization/i);
});

test('shared rate limiter uses an atomic bounded database bucket and times out', async () => {
  const { consumeSharedRateLimit, RateLimitExceeded, RateLimitUnavailable } = await import('../../src/server/rate-limit.js');
  const queries = [];
  const sql = async (query, parameters) => {
    queries.push({ query, parameters });
    return [{ request_count: queries.length }];
  };

  await consumeSharedRateLimit({ key: 'validate-html:127.0.0.1', limit: 2, windowMs: 60_000, now: 120_000, sql });
  await consumeSharedRateLimit({ key: 'validate-html:127.0.0.1', limit: 2, windowMs: 60_000, now: 120_001, sql });
  await assert.rejects(
    consumeSharedRateLimit({ key: 'validate-html:127.0.0.1', limit: 2, windowMs: 60_000, now: 120_002, sql }),
    RateLimitExceeded,
  );
  assert.match(queries[0].query, /on conflict/i);
  assert.match(queries[0].query, /request_count/i);

  await assert.rejects(
    consumeSharedRateLimit({
      key: 'timeout-test', limit: 1, windowMs: 60_000, timeoutMs: 5,
      sql: () => new Promise(() => {}),
    }),
    RateLimitUnavailable,
  );
});

test('roster parser accepts quoted delimiters and reports malformed rows', async () => {
  const { parseRosterCsv } = await import('../../scripts/import-roster.mjs');
  const parsed = parseRosterCsv([
    '\uFEFFusername;name',
    'alice;"Doe; Alice"',
    'bob;"Doe ""Bob"""',
    'bad row;"unterminated',
  ].join('\n'));
  assert.deepEqual(parsed.roster, [{ username: 'alice' }, { username: 'bob' }]);
  assert.equal(parsed.diagnostics.some(({ line, severity }) => line === 4 && severity === 'error'), true);
});

test('roster parser keeps valid rows after invalid usernames and malformed rows', async () => {
  const { parseRosterCsv } = await import('../../scripts/import-roster.mjs');
  const parsed = parseRosterCsv([
    'username;name',
    'alice;Alice',
    'bad username;Bad',
    'broken;"unterminated',
    'bob;Bob',
  ].join('\n'));
  assert.deepEqual(parsed.roster, [{ username: 'alice' }, { username: 'bob' }]);
  assert.equal(parsed.diagnostics.filter(({ severity }) => severity === 'error').length >= 2, true);
});

test('attendance date reads return a map and revision from one transaction', async () => {
  const { createAttendanceRepository } = await import('../../src/server/repositories/attendance.js');
  let transactionCalled = false;
  const sql = async () => { throw new Error('date reads must use the transaction'); };
  sql.transaction = async (queriesOrFactory) => {
    transactionCalled = true;
    assert.equal(typeof queriesOrFactory, 'function');
    return [[{ username: 'alice', present: true }], [{ revision: 4 }]];
  };
  const current = await createAttendanceRepository(sql).getByDateWithRevision('2026-09-08');
  assert.equal(transactionCalled, true);
  assert.deepEqual(current, { map: { alice: true }, revision: 4 });
});

test('attendance snapshot writes require a precondition revision', async () => {
  const { setDbForTests } = await import('../../src/server/db.js');
  const { createSessionToken } = await import('../../src/server/auth/session.js');
  const { default: attendanceHandler } = await import('../../pages/api/attendance.js');
  setDbForTests(async () => []);
  const issuedAt = Math.floor(Date.now() / 1000);
  const token = createSessionToken({ kind: 'teacher', subject: 'teacher', issuedAt, expiresAt: issuedAt + 3600 });
  const res = response();
  await attendanceHandler({
    method: 'POST',
    headers: { cookie: `teacher_session=${encodeURIComponent(token)}`, origin: 'http://localhost:3000' },
    body: { date: '2026-09-08', map: { alice: true } },
  }, res);
  assert.equal(res.statusCode, 428);
  assert.equal(res.body.error, 'Attendance revision required');
});

test('attendance rejects a stale revision without reporting success', async () => {
  const { setDbForTests } = await import('../../src/server/db.js');
  const { createSessionToken } = await import('../../src/server/auth/session.js');
  const { default: attendanceHandler } = await import('../../pages/api/attendance.js');
  const sql = async () => [];
  sql.transaction = async () => [[], []];
  setDbForTests(sql);
  const issuedAt = Math.floor(Date.now() / 1000);
  const token = createSessionToken({ kind: 'teacher', subject: 'teacher', issuedAt, expiresAt: issuedAt + 3600 });
  const res = response();
  await attendanceHandler({
    method: 'POST',
    headers: { cookie: `teacher_session=${encodeURIComponent(token)}`, origin: 'http://localhost:3000', 'if-match': '"3"' },
    body: { date: '2026-09-08', map: { alice: true } },
  }, res);
  assert.equal(res.statusCode, 409);
  assert.equal(res.body.error, 'Attendance changed; reload and retry');
});

test('validate-html has strict limits, timeout, correlation errors, and injectable throttling', async () => {
  const { createValidateHtmlHandler, MAX_HTML_CHARS } = await import('../../pages/api/validate-html.js');
  let throttles = 0;
  const handler = createValidateHtmlHandler({
    rateLimiter: async () => { throttles += 1; },
    fetchImpl: async () => ({ ok: true, json: async () => ({ messages: [] }) }),
  });
  const tooLarge = response();
  await handler({ method: 'POST', headers: {}, body: { html: 'x'.repeat(MAX_HTML_CHARS + 1) } }, tooLarge);
  assert.equal(tooLarge.statusCode, 413);

  const ok = response();
  await handler({ method: 'POST', headers: { 'x-forwarded-for': '127.0.0.1' }, body: { html: '<p>ok</p>' } }, ok);
  assert.equal(ok.statusCode, 200);
  assert.equal(throttles, 1);
});

test('validate-html hides upstream failure details behind a correlation ID', async () => {
  const { createValidateHtmlHandler } = await import('../../pages/api/validate-html.js');
  const handler = createValidateHtmlHandler({
    rateLimiter: async () => {},
    fetchImpl: async () => { throw new Error('upstream secret=should-not-leak'); },
  });
  const res = response();
  await handler({ method: 'POST', headers: {}, body: { html: '<p>ok</p>' } }, res);
  assert.equal(res.statusCode, 502);
  assert.equal(res.body.error, 'HTML validation service unavailable');
  assert.match(res.body.correlationId, /^[0-9a-f-]{36}$/);
  assert.doesNotMatch(JSON.stringify(res.body), /secret|upstream/i);
});

test('student grades route strips audit metadata from its response DTO', async () => {
  const { setDbForTests } = await import('../../src/server/db.js');
  const { createSessionToken } = await import('../../src/server/auth/session.js');
  const { default: gradesHandler } = await import('../../pages/api/student/grades.js');
  let calls = 0;
  setDbForTests(async () => {
    calls += 1;
    if (calls === 1) return [];
    return [{
      id: 41, username: 'alice', test_number: 1, points: 9, max_points: 12,
      reasoning: 'Dobře', source: 'ai', actor: 'teacher', model: 'private',
      prompt_version: 'private', image_count: 2, created_at: '2026-09-08T10:00:00.000Z',
    }];
  });
  const issuedAt = Math.floor(Date.now() / 1000);
  const token = createSessionToken({ kind: 'student', subject: 'alice', issuedAt, expiresAt: issuedAt + 3600 });
  const res = response();
  await gradesHandler({ method: 'GET', headers: { cookie: `student_session=${encodeURIComponent(token)}` } }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.grades[1], {
    test_number: 1, points: 9, max_points: 12, reasoning: 'Dobře', graded_at: '2026-09-08T10:00:00.000Z',
  });
});

test('logout clears the cookie when session revocation cannot reach the database', async () => {
  const { setDbForTests } = await import('../../src/server/db.js');
  const { createSessionToken } = await import('../../src/server/auth/session.js');
  const { default: logoutHandler } = await import('../../pages/api/teacher/logout.js');
  setDbForTests(async () => { throw new Error('database unavailable'); });
  const issuedAt = Math.floor(Date.now() / 1000);
  const token = createSessionToken({ kind: 'teacher', subject: 'teacher', issuedAt, expiresAt: issuedAt + 3600 });
  const res = response();
  await logoutHandler({
    method: 'POST',
    headers: { cookie: `teacher_session=${encodeURIComponent(token)}`, origin: 'http://localhost:3000' },
  }, res);
  assert.equal(res.statusCode, 200);
  assert.match(res.headers['Set-Cookie'], /Max-Age=0/);
});

test('student logout also clears its cookie when revocation fails', async () => {
  const { setDbForTests } = await import('../../src/server/db.js');
  const { createSessionToken } = await import('../../src/server/auth/session.js');
  const { default: logoutHandler } = await import('../../pages/api/student/logout.js');
  setDbForTests(async () => { throw new Error('database unavailable'); });
  const issuedAt = Math.floor(Date.now() / 1000);
  const token = createSessionToken({ kind: 'student', subject: 'alice', issuedAt, expiresAt: issuedAt + 3600 });
  const res = response();
  await logoutHandler({
    method: 'POST',
    headers: { cookie: `student_session=${encodeURIComponent(token)}`, origin: 'http://localhost:3000' },
  }, res);
  assert.equal(res.statusCode, 200);
  assert.match(res.headers['Set-Cookie'], /Max-Age=0/);
});
