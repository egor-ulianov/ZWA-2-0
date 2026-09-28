import { createRequire } from 'node:module';

const { expect, test } = createRequire(import.meta.url)('@playwright/test');
import { installDeterministicNetwork } from './helpers/browser.js';

const OPENING_SLIDES = [
  '/interactive-zwa-1-html5?slide=intro',
  '/interactive-zwa-2-forms?slide=overview',
  '/interactive-zwa-1?slide=title',
  '/interactive-zwa-2?slide=title',
  '/interactive-zwa-5-css-ii?slide=title',
  '/interactive-zwa-5-js?slide=title',
  '/interactive-zwa-7?slide=title',
  '/interactive-zwa-8-php?slide=title',
  '/interactive-zwa-9?slide=title',
  '/interactive-zwa-10-sessions-cookies?slide=title',
  '/interactive-zwa-11-files-json?slide=title',
  '/interactive-zwa-12-auth?slide=title',
];

test.describe('lecture opening pages', () => {
  for (const route of OPENING_SLIDES) {
    test(`${route} starts with a concise lesson summary`, async ({ page }) => {
      await installDeterministicNetwork(page);
      await page.goto(route);

      const summary = page.locator('[data-lesson-summary="true"]');
      await expect(summary).toBeVisible();
      await expect(summary.getByRole('listitem')).toHaveCount(4);
      await expect(page.getByRole('main')).not.toContainText(
        /Bc\. Egor Ulianov|Autor:|Datum:|FEL ČVUT, DCGI/,
      );
      await expect(page.getByRole('main').locator('img[alt*="meme" i]')).toHaveCount(0);
    });
  }

  test('lesson outlines no longer contain meme-only pages', async ({ page }) => {
    await installDeterministicNetwork(page);

    for (const route of [
      '/interactive-zwa-2?slide=title',
      '/interactive-zwa-5-js?slide=title',
      '/interactive-zwa-7?slide=title',
    ]) {
      await page.goto(route);
      await page.getByRole('button', { name: 'Osnova lekce' }).click();
      const outline = page.getByRole('dialog', { name: 'Osnova lekce' });
      await expect(outline).toBeVisible();
      await expect(outline).not.toContainText(/Meme|Jak JS zabil Lenina/i);
      await page.keyboard.press('Escape');
    }
  });
});
