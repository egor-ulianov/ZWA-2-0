import { expect, test } from '@playwright/test';
import { installDeterministicNetwork } from '../e2e/helpers/browser.js';

test('homepage renders the lesson catalog and protected workspace entry point', async ({
  page,
}) => {
  await installDeterministicNetwork(page);

  const response = await page.goto('/');

  expect(response).not.toBeNull();
  expect(response.ok()).toBe(true);
  await expect(page.getByRole('heading', { name: 'ZWA Presentations' })).toBeVisible();
  await expect(
    page
      .getByRole('main')
      .getByRole('link')
      .filter({ hasText: /^\d+\)/ }),
  ).toHaveCount(12);
  await expect(page.getByRole('link', { name: 'Attendance (protected)' })).toBeVisible();
});
