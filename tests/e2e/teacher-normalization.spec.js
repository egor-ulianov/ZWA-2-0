import { createRequire } from 'node:module';

const { expect, test } = createRequire(import.meta.url)('@playwright/test');
import { fulfillJson, installDeterministicNetwork } from './helpers/browser.js';

test('teacher sees a guarded grade-normalization workspace', async ({ page }) => {
  await installDeterministicNetwork(page);
  await page.route('**/api/teacher/me', (route) => fulfillJson(route, { username: 'teacher' }));

  await page.goto('/teacher');

  await expect(page.getByRole('heading', { name: 'Grade normalization' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Test 1 normalization' })).toContainText(
    'Dry run before applying changes',
  );
  await expect(page.getByRole('button', { name: 'Apply normalization for Test 1' })).toBeDisabled();
});
