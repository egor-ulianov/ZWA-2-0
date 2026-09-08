import { createRequire } from 'node:module';

const { expect, test } = createRequire(import.meta.url)('@playwright/test');
import { installDeterministicNetwork } from './helpers/browser.js';

test.describe('lesson projector and presenter modes', () => {
  test('projector omits student navigation and advances with the keyboard', async ({ page }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-1-html5?mode=projector&slide=intro');
    await expect(page.getByRole('navigation', { name: /Course outline/i })).toHaveCount(0);
    await expect(page.getByText('01 / 04')).toBeVisible();
    await expect(page.getByText('Organizace a prostředí')).toBeVisible();
    await expect(page.locator('textarea, iframe, [aria-label="Test results"]')).toHaveCount(0);

    await page.keyboard.press('ArrowRight');
    await expect(page).toHaveURL(/mode=projector.*slide=sections/);
  });

  test('invalid lesson modes fall back to the student shell', async ({ page }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-1-html5?mode=unknown&slide=intro');
    await expect(page.locator('[data-lesson-mode="student"]')).toBeVisible();
    await expect(page.getByRole('navigation', { name: /Course outline/i })).toBeVisible();
  });

  test('projector keeps lesson teaching copy while stripping activity controls', async ({
    page,
  }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-5-js?mode=projector&slide=tasks');
    await expect(page.getByRole('heading', { name: 'Úlohy – JavaScript' }).first()).toBeVisible();
    await expect(page.getByText(/Vytvořte proměnnou greeting/)).toBeVisible();
    await expect(page.locator('textarea, iframe, [aria-label="Test results"]')).toHaveCount(0);
  });

  test('arrow keys in editable fields do not change the active slide', async ({ page }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-5-js?slide=tasks');
    const editor = page.locator('textarea').first();
    await editor.focus();
    await editor.press('ArrowRight');
    await expect(page).toHaveURL(/slide=tasks/);
  });

  test('presenter exposes instructor controls and an explicit projector action', async ({
    page,
  }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-1-html5?mode=presenter&slide=intro');
    await expect(page.getByRole('navigation', { name: /Presenter outline/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Open projector/i })).toBeVisible();
  });

  test('successful projector popup does not show the blocked-popup fallback', async ({ page }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-1-html5?mode=presenter&slide=intro');
    const popupPromise = page.waitForEvent('popup');
    await page.getByRole('button', { name: /Open projector/i }).click();
    const popup = await popupPromise;
    await expect(popup).toHaveURL(/mode=projector.*slide=intro/);
    await expect(page.getByRole('link', { name: /Open projector in this tab/i })).toHaveCount(0);
    await popup.close();
  });
});
