import { createRequire } from 'node:module';

const { expect, test } = createRequire(import.meta.url)('@playwright/test');
import { installDeterministicNetwork } from './helpers/browser.js';

test.describe('HTML5 course learning experience', () => {
  test.beforeEach(async ({ page }) => {
    await installDeterministicNetwork(page);
  });

  test('student view uses the new artwork, progress, article and pager hierarchy', async ({
    page,
  }) => {
    await page.goto('/interactive-zwa-1-html5?slide=intro');

    await expect(page.locator('[data-learning-experience="student"]')).toBeVisible();
    await expect(page.getByRole('main')).toHaveCount(1);
    await expect(page.locator('[data-module="web-foundations"] img')).toBeVisible();
    await expect(page.getByRole('progressbar', { name: 'Průběh lekce' })).toHaveAttribute(
      'aria-valuenow',
      '1',
    );
    await expect(page.getByRole('heading', { level: 1, name: /HTML5/ })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Úvod' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Další: Sekce' })).toBeVisible();
    await expect(page.locator('[class*="portal-"], .lesson-shell')).toHaveCount(0);
  });

  test('lecture artwork introduces the page without dominating the desktop viewport', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/interactive-zwa-1-html5?slide=intro');

    const artwork = page.locator('header [data-module="web-foundations"]').first();
    await expect(artwork).toBeVisible();
    const bounds = await artwork.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds.height).toBeLessThanOrEqual(300);
    expect(bounds.height).toBeGreaterThanOrEqual(240);
  });

  test('outline drawer traps entry, closes with escape and restores focus', async ({ page }) => {
    await page.goto('/interactive-zwa-1-html5?slide=intro');
    const trigger = page.getByRole('button', { name: 'Osnova lekce' });

    await trigger.click();
    const drawer = page.getByRole('dialog', { name: 'Osnova lekce' });
    await expect(drawer).toBeVisible();
    await expect(page.getByRole('button', { name: 'Zavřít osnovu' }).last()).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(drawer).toHaveCount(0);
    await expect(trigger).toBeFocused();

    await trigger.click();
    await drawer.getByRole('button', { name: /Sekce/ }).click();
    await expect(page).toHaveURL(/slide=sections/);
    await expect(drawer).toHaveCount(0);
  });

  test('valid, legacy and invalid deep links resolve without duplicate main landmarks', async ({
    page,
  }) => {
    await page.goto('/interactive-zwa-1-html5?slide=sections#stale');
    await expect(page.getByRole('heading', { level: 2, name: 'Sekce' })).toBeVisible();
    await expect.poll(() => new URL(page.url()).hash).toBe('');
    await expect(page.getByRole('main')).toHaveCount(1);

    await page.goto('/interactive-zwa-1-html5?slide=tasks');
    await expect(page.getByRole('heading', { level: 2, name: 'Kostra dokumentu' })).toBeVisible();
    await expect.poll(() => new URL(page.url()).searchParams.get('slide')).toBe('tasks');

    await page.goto('/interactive-zwa-1-html5?slide=missing');
    await expect(page.getByRole('heading', { level: 2, name: 'Úvod' })).toBeVisible();
    await expect.poll(() => new URL(page.url()).searchParams.get('slide')).toBe('intro');
  });

  test('exercise is one named stage with read-only solution and a preserved failed draft', async ({
    page,
  }) => {
    await page.goto('/interactive-zwa-1-html5?slide=tasks');
    const stage = page.locator('[data-exercise-stage="true"]');

    for (const region of ['Zadání', 'IDE', 'Náhled', 'Ověření']) {
      await expect(stage.getByRole('region', { name: region })).toBeVisible();
    }
    const editor = stage.getByRole('region', { name: 'IDE' }).locator('.cm-content');
    await editor.click();
    await page.keyboard.press('Control+End');
    await page.keyboard.type('ZACHOVAT-DRAFT');
    await stage.getByRole('button', { name: 'Spustit ověření' }).click();
    await expect(stage).toContainText('Chyba validace:');
    await expect(editor).toContainText('ZACHOVAT-DRAFT');

    await stage.getByRole('tab', { name: 'Řešení' }).click();
    await expect(stage.locator('[data-solution-panel] [contenteditable="false"]')).toHaveCount(1);
  });

  test('exercise sections keep a responsive text gutter from the stage edge', async ({ page }) => {
    await page.goto('/interactive-zwa-1-html5?slide=html-task-media');
    const stage = page.locator('[data-exercise-stage="true"]');
    const regions = ['Zadání', 'IDE', 'Náhled', 'Ověření'];

    for (const region of regions) {
      await expect
        .poll(async () => {
          const padding = await stage
            .getByRole('region', { name: region })
            .evaluate((element) => Number.parseFloat(getComputedStyle(element).paddingInlineStart));
          return padding;
        })
        .toBeGreaterThanOrEqual(24);
    }

    await page.setViewportSize({ width: 320, height: 720 });
    for (const region of regions) {
      const padding = await stage
        .getByRole('region', { name: region })
        .evaluate((element) => Number.parseFloat(getComputedStyle(element).paddingInlineStart));
      expect(padding).toBeGreaterThanOrEqual(16);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    ).toBe(true);
  });

  test('presenter and projector each render one new-mode main and exclude private controls', async ({
    page,
  }) => {
    await page.goto('/interactive-zwa-1-html5?mode=presenter&slide=intro');
    await expect(page.getByRole('main')).toHaveCount(1);
    await expect(page.locator('[data-presentation-mode="presenter"]')).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Osnova prezentujícího' })).toBeVisible();

    await page.goto('/interactive-zwa-1-html5?mode=projector&slide=tasks');
    await expect(page.getByRole('main')).toHaveCount(1);
    await expect(page.locator('[data-presentation-mode="projector"]')).toBeVisible();
    await expect(
      page.locator('[data-projector-private], textarea, iframe, [role="tablist"]'),
    ).toHaveCount(0);
  });

  test('long content remains inside a 320 pixel viewport', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto('/interactive-zwa-1-html5?slide=html-task-semantic');

    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    ).toBe(true);
    await expect(page.getByRole('button', { name: 'Spustit ověření' })).toBeVisible();
  });
});
