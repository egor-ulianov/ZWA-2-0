import { createRequire } from 'node:module';

const { expect, test } = createRequire(import.meta.url)('@playwright/test');
import { installDeterministicNetwork } from './helpers/browser.js';

test.describe('lecture task IDE modal', () => {
  test.beforeEach(async ({ page }) => {
    await installDeterministicNetwork(page);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/interactive-zwa-1-html5?slide=tasks');
  });

  test('expands the tabbed editor, preserves the draft and shrinks back into the lesson', async ({
    page,
  }) => {
    const stage = page.locator('[data-exercise-stage="true"]');
    const ide = stage.getByRole('region', { name: 'IDE' });
    const expand = ide.getByRole('button', { name: 'Rozbalit IDE' });
    const editor = ide.locator('.cm-content');

    await editor.click();
    await page.keyboard.press('Control+End');
    await page.keyboard.type('ZACHOVAT-ROZBALENI');
    await expand.click();

    const modal = stage.getByRole('dialog', { name: 'Rozšířené IDE' });
    await expect(modal).toBeVisible();
    await expect(modal.getByRole('tablist', { name: 'Soubory IDE' })).toBeVisible();
    await expect(modal.locator('.cm-content')).toContainText('ZACHOVAT-ROZBALENI');
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('hidden');

    const modalBounds = await modal.boundingBox();
    expect(modalBounds).not.toBeNull();
    expect(modalBounds.width).toBeGreaterThanOrEqual(1296);
    expect(modalBounds.height).toBeGreaterThanOrEqual(900);

    const shrink = modal.getByRole('button', { name: 'Zmenšit IDE' });
    await expect(shrink).toBeFocused();
    await shrink.click();

    await expect(modal).toHaveCount(0);
    await expect(ide).toBeVisible();
    await expect(editor).toContainText('ZACHOVAT-ROZBALENI');
    await expect(expand).toBeFocused();
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('');
  });

  test('escape closes the expanded IDE', async ({ page }) => {
    const stage = page.locator('[data-exercise-stage="true"]');
    const expand = stage.getByRole('button', { name: 'Rozbalit IDE' });

    await expand.click();
    await expect(stage.getByRole('dialog', { name: 'Rozšířené IDE' })).toBeVisible();
    await page.keyboard.press('Escape');

    await expect(stage.getByRole('dialog', { name: 'Rozšířené IDE' })).toHaveCount(0);
    await expect(expand).toBeFocused();
  });

  test('keeps keyboard focus inside the modal and closes from its backdrop', async ({ page }) => {
    const stage = page.locator('[data-exercise-stage="true"]');
    const expand = stage.getByRole('button', { name: 'Rozbalit IDE' });

    await expand.click();
    const modal = stage.getByRole('dialog', { name: 'Rozšířené IDE' });
    const shrink = modal.getByRole('button', { name: 'Zmenšit IDE' });
    await expect(shrink).toBeFocused();

    await page.keyboard.press('Shift+Tab');
    await expect
      .poll(() => modal.evaluate((element) => element.contains(document.activeElement)))
      .toBe(true);
    await page.keyboard.press('Tab');
    await expect(shrink).toBeFocused();

    await page.locator('[data-ide-backdrop="true"]').click({ position: { x: 5, y: 5 } });
    await expect(modal).toHaveCount(0);
    await expect(expand).toBeFocused();
  });
});
