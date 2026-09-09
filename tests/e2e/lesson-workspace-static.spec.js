import { createRequire } from 'node:module';

const { expect, test } = createRequire(import.meta.url)('@playwright/test');

const taskRoutes = [
  '/interactive-zwa-7?slide=task1',
  '/interactive-zwa-8-php?slide=t1',
  '/interactive-zwa-9?slide=tasks',
  '/interactive-zwa-10-sessions-cookies?slide=tasks',
  '/interactive-zwa-11-files-json?slide=tasks',
  '/interactive-zwa-12-auth?slide=tasks',
];

test.describe('static lesson task workspaces', () => {
  for (const route of taskRoutes) {
    test(`${route} exposes the Czech static task workspace zones`, async ({ page }) => {
      await page.goto(route);
      await expect(page.getByRole('region', { name: 'Zadání' })).toBeVisible();
      await expect(page.getByRole('region', { name: 'IDE' })).toBeVisible();
      await expect(page.getByRole('region', { name: 'Náhled a testy' })).toContainText(
        'Statická kontrola',
      );
    });
  }
});
