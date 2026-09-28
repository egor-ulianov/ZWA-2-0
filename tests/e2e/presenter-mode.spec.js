import { createRequire } from 'node:module';

const { expect, test } = createRequire(import.meta.url)('@playwright/test');
import { installDeterministicNetwork } from './helpers/browser.js';

test.describe('lesson projector and presenter modes', () => {
  test('projector omits student navigation and advances with the keyboard', async ({ page }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-1-html5?mode=projector&slide=intro');
    await expect(page.getByRole('navigation', { name: /Osnova kurzu/i })).toHaveCount(0);
    await expect(page.getByText('01 / 06')).toBeVisible();
    await expect(page.getByText('Organizace a prostředí')).toBeVisible();
    await expect(page.locator('textarea, iframe')).toHaveCount(0);

    await page.keyboard.press('ArrowRight');
    await expect(page).toHaveURL(/mode=projector.*slide=sections/);
  });

  test('invalid lesson modes fall back to the student shell', async ({ page }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-1-html5?mode=unknown&slide=intro');
    await expect(page.locator('[data-learning-experience="student"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Osnova lekce' })).toBeVisible();
  });

  test('projector keeps lesson teaching copy while stripping activity controls', async ({
    page,
  }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-5-js?mode=projector&slide=tasks');
    await expect(page.getByRole('heading', { name: '1) Proměnné a typy' }).first()).toBeVisible();
    await expect(page.locator('[data-projector-private]')).toHaveCount(0);
    await expect(
      page.locator('textarea, iframe, [role="tablist"], [contenteditable="true"]'),
    ).toHaveCount(0);
  });

  test('projector expands teaching content passed through lesson components', async ({ page }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-1-html5?mode=projector&slide=sections');
    await expect(page.getByText(/HTML nabízí širokou škálu základních prvků/).last()).toBeVisible();
    await expect(page.getByText(/Minimální HTML5 dokument začíná doctype/).last()).toBeVisible();
  });

  test('projector keeps CSS teaching text without editor mirrors or controls', async ({ page }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-2?mode=projector&slide=linking');
    await expect(page.getByText(/Toto je výuková simulace pro procvičení CSS/)).toBeVisible();
    await expect(page.locator('[data-projector-private]')).toHaveCount(0);
    await expect(
      page.locator(
        'textarea, iframe, pre[aria-hidden="true"], [role="tablist"], [contenteditable="true"]',
      ),
    ).toHaveCount(0);
  });

  test('arrow keys in editable fields do not change the active slide', async ({ page }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-5-js?slide=tasks');
    const editor = page.getByRole('textbox', { name: 'main.js — Editor' });
    await editor.focus();
    await editor.press('ArrowRight');
    await expect(page).toHaveURL(/slide=tasks/);
  });

  test('presenter exposes instructor controls and an explicit projector action', async ({
    page,
  }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-1-html5?mode=presenter&slide=intro');
    await expect(page.getByRole('navigation', { name: /Osnova prezentujícího/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Otevřít projektor/i })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Aktuální výukový obsah' })).toBeVisible();
    await expect(page.getByRole('tablist')).toHaveCount(0);
  });

  test('successful projector popup does not show the blocked-popup fallback', async ({ page }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-1-html5?mode=presenter&slide=intro');
    const popupPromise = page.waitForEvent('popup');
    await page.getByRole('button', { name: /Otevřít projektor/i }).click();
    const popup = await popupPromise;
    await expect(popup).toHaveURL(/mode=projector.*slide=intro/);
    await expect(page.getByRole('link', { name: /Otevřít projektor v tomto panelu/i })).toHaveCount(
      0,
    );
    await popup.close();
  });
});
