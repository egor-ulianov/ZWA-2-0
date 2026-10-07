import { createRequire } from 'node:module';

const { expect, test } = createRequire(import.meta.url)('@playwright/test');
import { installDeterministicNetwork } from './helpers/browser.js';

const PHP_THEORY_ROUTES = [
  '/interactive-zwa-8-php?slide=theory',
  '/interactive-zwa-9?slide=theory-lifecycle',
  '/interactive-zwa-9?slide=theory-methods',
  '/interactive-zwa-9?slide=theory-inputs',
  '/interactive-zwa-9?slide=theory-validation',
  '/interactive-zwa-9?slide=theory-session',
  '/interactive-zwa-9?slide=theory-crud',
  '/interactive-zwa-10-sessions-cookies?slide=theory-basics',
  '/interactive-zwa-10-sessions-cookies?slide=theory-cookies-api',
  '/interactive-zwa-10-sessions-cookies?slide=theory-session-lifecycle',
  '/interactive-zwa-10-sessions-cookies?slide=theory-security',
  '/interactive-zwa-10-sessions-cookies?slide=theory-examples',
  '/interactive-zwa-11-files-json?slide=theory-files',
  '/interactive-zwa-11-files-json?slide=theory-json',
  '/interactive-zwa-11-files-json?slide=theory-library',
  '/interactive-zwa-11-files-json?slide=theory-pagination',
  '/interactive-zwa-12-auth?slide=theory-terms',
  '/interactive-zwa-12-auth?slide=theory-methods',
  '/interactive-zwa-12-auth?slide=theory-passwords',
  '/interactive-zwa-12-auth?slide=theory-http-auth',
  '/interactive-zwa-12-auth?slide=theory-login-session',
  '/interactive-zwa-12-auth?slide=theory-security',
  '/interactive-zwa-13-mvc?slide=theory-responsibilities',
  '/interactive-zwa-13-mvc?slide=theory-request-flow',
  '/interactive-zwa-13-mvc?slide=theory-structure',
];

test.describe('PHP lecture editorial design', () => {
  for (const route of PHP_THEORY_ROUTES) {
    test(`${route} uses the linear editorial chapter`, async ({ page }) => {
      await installDeterministicNetwork(page);
      await page.goto(route);

      const chapter = page.locator('[data-editorial-chapter="true"]');
      await expect(chapter).toBeVisible();
      await expect(chapter.getByRole('heading', { level: 3 }).first()).toBeVisible();
    });
  }

  test('PHP examples render language-aware highlighted tokens', async ({ page }) => {
    await installDeterministicNetwork(page);
    await page.goto('/interactive-zwa-9?slide=theory-validation');

    const code = page.locator('figure[data-language="php"]').first();
    await expect(code).toHaveAttribute('data-code-highlight', 'true');
    await expect(code.locator('.tok-keyword').first()).toBeVisible();
    await expect(code.locator('.tok-variableName').first()).toBeVisible();
    await expect(code.locator('pre')).toHaveAttribute('aria-label', 'Ukázka kódu PHP');
  });

  for (const route of [
    '/interactive-zwa-9?slide=theory-validation',
    '/interactive-zwa-9?slide=theory-crud',
    '/interactive-zwa-13-mvc?slide=theory-structure',
    '/interactive-zwa-10-sessions-cookies?slide=theory-examples',
    '/interactive-zwa-12-auth?slide=theory-http-auth',
  ]) {
    test(`${route} stacks every code example vertically`, async ({ page }) => {
      await installDeterministicNetwork(page);
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto(route);

      await expect(page.locator('figure[data-language]').first()).toBeVisible();
      await expect(page.locator('div.grid:has(figure[data-language])')).toHaveCount(0);

      const figures = page.locator('figure[data-language]');
      const count = await figures.count();
      for (let index = 1; index < count; index += 1) {
        const previous = await figures.nth(index - 1).boundingBox();
        const current = await figures.nth(index).boundingBox();
        expect(previous).not.toBeNull();
        expect(current).not.toBeNull();
        expect(current.y).toBeGreaterThanOrEqual(previous.y + previous.height);
      }
    });
  }

  test('PHP editorial chapters remain inside a 320 pixel viewport', async ({ page }) => {
    await installDeterministicNetwork(page);
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto('/interactive-zwa-11-files-json?slide=theory-library');

    await expect(page.locator('[data-editorial-chapter="true"]')).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    ).toBe(true);
  });
});
