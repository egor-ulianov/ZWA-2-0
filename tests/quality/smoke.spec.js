const { test, expect } = require('@playwright/test');

test('homepage serves a non-empty document', async ({ page }) => {
  const response = await page.goto('/');

  expect(response).not.toBeNull();
  expect(response.ok()).toBe(true);
  await expect(page.locator('body')).not.toBeEmpty();
});
