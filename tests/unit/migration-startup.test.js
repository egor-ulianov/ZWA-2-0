import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { checksum, migrationQuery, runMigrations } from '../../scripts/migrate.mjs';
import { start } from '../../scripts/start.mjs';

function queryRecorder() {
  const calls = [];
  const sql = (query, parameters) => {
    const request = { query, parameters };
    calls.push(request);
    return request;
  };
  sql.transaction = async (queries) => {
    calls.push({ transaction: queries });
    return [];
  };
  return { calls, sql };
}

test('migration source execution and ledger write share the applied-row guard', () => {
  const source = 'create table example (id integer);';
  const query = migrationQuery('001_example.sql', source, checksum(source));

  assert.match(query, /if exists \(select 1 from schema_migrations/i);
  assert.match(query, /execute \$migration_source_[0-9a-f]+\$/i);
  assert.match(query, /insert into schema_migrations/i);
  assert.ok(query.indexOf('return;') < query.indexOf('execute $migration_source_'));
  assert.ok(
    query.indexOf('execute $migration_source_') < query.indexOf('insert into schema_migrations'),
  );
});

test('runner does not submit an applied migration source as an unconditional statement', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'zwa-migrations-'));
  try {
    const source = 'create table example (id integer);';
    await writeFile(path.join(directory, '001_example.sql'), source);
    const { calls, sql } = queryRecorder();

    await runMigrations({ sql, directory });
    await runMigrations({ sql, directory });

    const submittedQueries = calls
      .filter((call) => call.transaction)
      .flatMap(({ transaction }) => transaction)
      .map(({ query }) => query);
    assert.equal(submittedQueries.filter((query) => query === source).length, 0);
    assert.equal(submittedQueries.filter((query) => query.includes(source)).length, 2);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('legacy attendance migration rejects impossible calendar dates without a throwing cast', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(
    new URL('../../db/migrations/001_core.sql', import.meta.url),
    'utf8',
  );

  assert.match(source, /\^\[0-9\]\{4\}-\[0-9\]\{2\}-\[0-9\]\{2\}\$/);
  assert.match(source, /to_date\(/i);
  assert.match(source, /to_char\(/i);
  assert.doesNotMatch(source, /date::date/i);
});

test('production startup validates the complete server environment before migration or Next spawn', async () => {
  const originalEnvironment = { ...process.env };
  try {
    Object.assign(process.env, {
      NODE_ENV: 'production',
      DATABASE_URL: '',
      TEACHER_COOKIE_SECRET: 'teacher-secret',
      STUDENT_COOKIE_SECRET: 'student-secret',
      ATTENDANCE_AUTH_USER: 'teacher',
      ATTENDANCE_AUTH_PASS: 'password',
      APP_ORIGIN: 'https://zwa.example.test',
    });
    let migrationCalled = false;
    let spawnCalled = false;

    await assert.rejects(
      start({
        migrate: async () => {
          migrationCalled = true;
        },
        spawnProcess: () => {
          spawnCalled = true;
          return { on() {} };
        },
      }),
      /DATABASE_URL/,
    );

    assert.equal(migrationCalled, false);
    assert.equal(spawnCalled, false);

    Object.assign(process.env, { DATABASE_URL: 'postgresql://user:password@example.test/db' });
    const order = [];
    await start({
      migrate: async () => {
        order.push('migrate');
      },
      spawnProcess: () => {
        order.push('spawn');
        return { on() {} };
      },
    });
    assert.deepEqual(order, ['migrate', 'spawn']);
  } finally {
    process.env = originalEnvironment;
  }
});
