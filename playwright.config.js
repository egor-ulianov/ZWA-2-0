const { defineConfig, devices } = require('@playwright/test');

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:3000';

module.exports = defineConfig({
  testDir: './tests/quality',
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
    command: 'npm run start',
    env: {
      NODE_ENV: 'test',
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
