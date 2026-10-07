import { createRequire } from 'node:module';

const { expect, test } = createRequire(import.meta.url)('@playwright/test');
import { installDeterministicNetwork } from './helpers/browser.js';

test.describe('responsive portal and projector views', () => {
  test('course overview has no horizontal overflow from mobile through desktop', async ({
    page,
  }) => {
    await installDeterministicNetwork(page);

    for (const viewport of [
      { width: 320, height: 720 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto('/');
      await expect(page.getByRole('main')).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        ),
      ).toBe(true);
    }
  });

  test('student lesson has no horizontal overflow at 320 pixels', async ({ page }) => {
    await installDeterministicNetwork(page);

    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto('/interactive-zwa-5-js?slide=tasks');
    await expect(page.getByRole('main')).toBeVisible();

    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    ).toBe(true);
  });

  test('projector mode has usable controls at 1280 pixels', async ({ page }) => {
    await installDeterministicNetwork(page);

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/interactive-zwa-1-html5?mode=projector&slide=intro');

    await expect(page.getByRole('main')).toHaveCount(1);
    const next = page.getByRole('button', { name: 'Následující snímek' });
    await expect(next).toBeVisible();
    await expect(next).toBeEnabled();

    const box = await next.boundingBox();
    expect(box).not.toBeNull();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(1280);
  });

  test('projector controls can be operated from the keyboard', async ({ page }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-1-html5?mode=projector&slide=intro');
    const next = page.getByRole('button', { name: 'Následující snímek' });
    await next.focus();
    await expect(next).toBeFocused();
    await next.press('Enter');

    await expect(page).toHaveURL(/mode=projector.*slide=quiz/);
    await expect(page.getByRole('button', { name: 'Následující snímek' })).toBeFocused();
  });
});
