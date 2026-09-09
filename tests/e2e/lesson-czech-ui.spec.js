import { createRequire } from 'node:module';

const { expect, test } = createRequire(import.meta.url)('@playwright/test');
import { installDeterministicNetwork } from './helpers/browser.js';

const taskRoutes = [
  '/interactive-zwa-1-html5?slide=tasks',
  '/interactive-zwa-2-forms?slide=tasks',
  '/interactive-zwa-1?slide=tasks-net',
  '/interactive-zwa-2?slide=tasks',
  '/interactive-zwa-5-css-ii?slide=tasks',
  '/interactive-zwa-5-js?slide=tasks',
  '/interactive-zwa-7?slide=task1',
  '/interactive-zwa-8-php?slide=t1',
  '/interactive-zwa-9?slide=tasks',
  '/interactive-zwa-10-sessions-cookies?slide=tasks',
  '/interactive-zwa-11-files-json?slide=tasks',
  '/interactive-zwa-12-auth?slide=tasks',
];

async function expectTaskWorkspace(page) {
  await expect(page.getByRole('navigation', { name: 'Osnova kurzu' })).toHaveCount(1);
  await expect(page.getByRole('tablist')).toHaveCount(0);

  for (const label of ['Zadání', 'IDE', 'Náhled a testy']) {
    await expect(page.getByRole('region', { name: label })).toHaveCount(1);
    await expect(page.getByRole('region', { name: label })).toBeVisible();
  }

  const preview = page.getByRole('region', { name: 'Náhled a testy' });
  await expect(preview.getByRole('button', { name: 'Spustit testy', exact: true })).toHaveCount(1);
  await expect(preview.getByRole('button', { name: 'Spustit testy', exact: true })).toBeVisible();
}

test.describe('Czech unified lesson task workspace integration', () => {
  for (const route of taskRoutes) {
    test(`${route} exposes one Czech outline and one task workspace`, async ({ page }) => {
      await installDeterministicNetwork(page);

      const response = await page.goto(route);
      expect(response).not.toBeNull();
      expect(response.ok()).toBe(true);

      await expectTaskWorkspace(page);
    });
  }

  for (const route of taskRoutes) {
    test(`${route} strips the complete task workspace in projector mode`, async ({ page }) => {
      await installDeterministicNetwork(page);

      await page.goto(route.replace('?', '?mode=projector&'));

      await expect(page.getByRole('navigation', { name: 'Osnova kurzu' })).toHaveCount(0);
      await expect(page.getByRole('tablist')).toHaveCount(0);
      await expect(page.locator('[data-projector-private]')).toHaveCount(0);
      await expect(page.getByRole('region', { name: 'Zadání' })).toHaveCount(0);
      await expect(page.getByRole('region', { name: 'IDE' })).toHaveCount(0);
      await expect(page.getByRole('region', { name: 'Náhled a testy' })).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Spustit testy', exact: true })).toHaveCount(0);
      await expect(page.getByText('Plocha úkolu', { exact: true })).toHaveCount(0);
    });
  }

  test('the JavaScript task workspace fits at 320px without horizontal overflow', async ({
    page,
  }) => {
    await installDeterministicNetwork(page);
    await page.setViewportSize({ width: 320, height: 720 });

    await page.goto('/interactive-zwa-5-js?slide=tasks');
    await expect(page.getByRole('region', { name: 'Náhled a testy' })).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    ).toBe(true);
  });

  test('editor arrow and boundary keys do not navigate away from the task slide', async ({
    page,
  }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-5-js?slide=tasks');
    const editor = page.locator('textarea').first();
    await editor.focus();

    for (const key of ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Home', 'End']) {
      await editor.press(key);
      await expect(page).toHaveURL(/slide=tasks/);
    }
  });
});
