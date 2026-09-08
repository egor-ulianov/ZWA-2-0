import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import playwrightConfig from '../../playwright.config.js';
import { start } from '../../scripts/start.mjs';

Object.assign(process.env, {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://user:password@example.invalid/test',
  TEACHER_COOKIE_SECRET: 'teacher-secret-for-tests',
  STUDENT_COOKIE_SECRET: 'student-secret-for-tests',
  ATTENDANCE_AUTH_USER: 'teacher',
  ATTENDANCE_AUTH_PASS: 'password',
});

test('start runs migrations before spawning the built Next server', async () => {
  const events = [];
  const child = {
    on(eventName) {
      events.push(`listener:${eventName}`);
      return child;
    },
  };

  await start({
    migrate: async () => events.push('migrate'),
    spawnProcess: (...args) => {
      events.push({ type: 'spawn', args });
      return child;
    },
  });

  assert.equal(events[0], 'migrate');
  assert.equal(events[1].type, 'spawn');
  assert.equal(events[1].args[1].at(-1), 'start');
  assert.equal(events[2], 'listener:exit');
});

test('migration failure prevents Next from starting', async () => {
  let spawned = false;

  await assert.rejects(
    start({
      migrate: async () => {
        throw new Error('fixture migration failed');
      },
      spawnProcess: () => {
        spawned = true;
      },
    }),
    /fixture migration failed/,
  );
  assert.equal(spawned, false);
});

test('Playwright uses the migration-gated test server and provider fixture', async () => {
  const source = await readFile(new URL('../../playwright.config.js', import.meta.url), 'utf8');

  assert.match(playwrightConfig.webServer.command, /scripts[\\/]start\.mjs/);
  assert.doesNotMatch(playwrightConfig.webServer.command, /npm run start/);
  assert.equal(playwrightConfig.webServer.env.NODE_ENV, 'test');
  assert.equal(playwrightConfig.webServer.env.E2E_TEST_DATABASE, 'in-memory');
  assert.match(
    playwrightConfig.webServer.env.NODE_OPTIONS,
    /tests[\\/]e2e[\\/]fixtures[\\/]test-database\.mjs/,
  );
  assert.match(source, /scripts[\\/]start\.mjs/);
});
