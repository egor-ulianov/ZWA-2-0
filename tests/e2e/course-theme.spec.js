import { createRequire } from 'node:module';

const { expect, test } = createRequire(import.meta.url)('@playwright/test');

async function textContrastRatio(locator) {
  return locator.evaluate((element) => {
    const channels = (value) =>
      value
        .match(/[\d.]+/g)
        .slice(0, 3)
        .map(Number);
    const luminance = (value) => {
      const linear = channels(value).map((channel) => {
        const normalized = channel / 255;
        return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
    };
    const foreground = luminance(getComputedStyle(element).color);
    const background = luminance(getComputedStyle(document.body).backgroundColor);
    return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
  });
}

test.describe('explicit course theme', () => {
  test('a first visit stays light even when the system preference is dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('html')).toHaveCSS('color-scheme', 'light');
  });

  test('light lecture text remains readable when the system preference is dark', async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/interactive-zwa-1?slide=theory');

    const introduction = page.getByText(/Tento blok shrnuje síťové základy/).first();
    await expect(introduction).toBeVisible();
    expect(await textContrastRatio(introduction)).toBeGreaterThanOrEqual(4.5);
  });

  test('dark lecture text remains readable when the system preference is light', async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.addInitScript(() => window.localStorage.setItem('zwa-theme', 'dark'));
    await page.goto('/interactive-zwa-1?slide=theory');

    const introduction = page.getByText(/Tento blok shrnuje síťové základy/).first();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(await textContrastRatio(introduction)).toBeGreaterThanOrEqual(4.5);
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
