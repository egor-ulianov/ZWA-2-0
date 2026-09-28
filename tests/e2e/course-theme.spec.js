import { createRequire } from 'node:module';

const { expect, test } = createRequire(import.meta.url)('@playwright/test');

test.describe('explicit course theme', () => {
  test('a first visit stays light even when the system preference is dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('html')).toHaveCSS('color-scheme', 'light');
  });

  test('the keyboard-operable control persists dark mode and reload restores it', async ({
    page,
  }) => {
    await page.goto('/');

    const toggle = page.getByRole('button', { name: 'Přepnout na tmavý režim' });
    await expect(toggle).toBeVisible();
    const bounds = await toggle.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds.width).toBeGreaterThanOrEqual(44);
    expect(bounds.height).toBeGreaterThanOrEqual(44);

    await toggle.focus();
    await expect(toggle).toBeFocused();
    await toggle.press('Enter');

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(await page.evaluate(() => window.localStorage.getItem('zwa-theme'))).toBe('dark');

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByRole('button', { name: 'Přepnout na světlý režim' })).toBeVisible();
  });

  test('a corrupt saved value falls back to light', async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem('zwa-theme', 'sepia'));
    await page.goto('/');

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('the foundation provides a descriptive title and honors reduced motion', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    await expect(page).toHaveTitle(/ZWA/);
    const toggle = page.getByRole('button', { name: 'Přepnout na tmavý režim' });
    await expect(toggle).toHaveCSS('transition-duration', '0s');
  });
});
