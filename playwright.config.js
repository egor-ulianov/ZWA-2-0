import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { defineConfig, devices } = require('@playwright/test');

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:3000';
const root = path.dirname(fileURLToPath(import.meta.url));
const testDatabaseFixture = path.join(root, 'tests/e2e/fixtures/test-database.mjs');
const nodeOptions = [process.env.NODE_OPTIONS, `--import=${testDatabaseFixture}`]
  .filter(Boolean)
  .join(' ');

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'line',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  outputDir: '.next/test-results',
  webServer: {
    command: 'node scripts/start.mjs',
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://e2e:e2e@e2e.test/zwa',
      TEACHER_COOKIE_SECRET: 'e2e-teacher-cookie-secret',
      STUDENT_COOKIE_SECRET: 'e2e-student-cookie-secret',
      ATTENDANCE_AUTH_USER: 'e2e_teacher',
      ATTENDANCE_AUTH_PASS: 'e2e-teacher-password',
      APP_ORIGIN: baseURL,
      E2E_TEST_DATABASE: 'in-memory',
      NODE_OPTIONS: nodeOptions,
    },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: baseURL,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
