import { createRequire } from 'node:module';

const { expect, test } = createRequire(import.meta.url)('@playwright/test');
import { fulfillJson, installDeterministicNetwork } from './helpers/browser.js';

test('teacher sees a guarded grade-normalization workspace', async ({ page }) => {
  await installDeterministicNetwork(page);
  await page.route('**/api/teacher/me', (route) => fulfillJson(route, { username: 'teacher' }));

  await page.goto('/teacher');

  await expect(page.getByRole('heading', { name: 'Grade normalization' })).toBeVisible();
  await expect(page.locator('[data-operations-application="true"]')).toBeVisible();
  await expect(page.locator('[class*="portal-"]')).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Test 1 normalization' })).toContainText(
    'Dry run before applying changes',
  );
  await expect(page.getByRole('button', { name: 'Apply normalization for Test 1' })).toBeDisabled();
});

test('unauthenticated teacher normalization stays in the shell and can sign in', async ({
  page,
}) => {
  await installDeterministicNetwork(page);

  let authenticated = false;
  let loginBody;
  await page.route('**/api/teacher/me', (route) => {
    if (!authenticated) return fulfillJson(route, { error: 'Unauthorized' }, { status: 401 });
    return fulfillJson(route, { username: 'teacher' });
  });
  await page.route('**/api/teacher/login', async (route) => {
    loginBody = JSON.parse(route.request().postData() || '{}');
    authenticated = true;
    return fulfillJson(route, { ok: true });
  });

  await page.goto('/teacher');
  const login = page.getByRole('form', { name: 'Teacher login' });
  await expect(login).toBeVisible();
  await expect(page.getByRole('main')).toHaveCount(1);

  await login.getByLabel('Username').fill('teacher');
  await login.getByLabel('Password').fill('correct horse battery staple');
  await login.getByRole('button', { name: 'Login' }).click();

  await expect(page.getByRole('heading', { name: 'Grade normalization' })).toBeVisible();
  expect(loginBody).toEqual({ username: 'teacher', password: 'correct horse battery staple' });
});

test('normalization preview keeps long usernames horizontally accessible', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await installDeterministicNetwork(page);
  const longUsername = 'student-with-a-very-long-username-that-must-remain-readable';

  await page.route('**/api/teacher/me', (route) => fulfillJson(route, { username: 'teacher' }));
  await page.route('**/api/teacher/normalize-grades', (route) =>
    fulfillJson(route, {
      runId: 'dry-run-1',
      total: 1,
      updated: 0,
      preview: [{ username: longUsername, originalPoints: 10, normalizedPoints: 11 }],
    }),
  );

  await page.goto('/teacher');
  await page.getByRole('button', { name: 'Dry run normalization for Test 1' }).click();
  await expect(page.getByText(longUsername)).toBeVisible();

  const previewTable = page.getByRole('table').first();
  await expect(previewTable.locator('xpath=..')).toHaveClass(/overflow-x-auto/);
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);
});
