import { createRequire } from 'node:module';

const { expect, test } = createRequire(import.meta.url)('@playwright/test');
import { lessons } from '../../src/config/lessons.js';
import { installDeterministicNetwork } from './helpers/browser.js';

test.describe('public catalog and lesson navigation', () => {
  test('homepage catalog navigates to the legacy network lesson route', async ({ page }) => {
    await installDeterministicNetwork(page);

    const response = await page.goto('/');
    expect(response).not.toBeNull();
    expect(response.ok()).toBe(true);
    await expect(page.getByText('ZWA · Webové aplikace', { exact: true })).toBeVisible();

    await expect(page.getByRole('main').getByRole('link')).toHaveCount(12);
    await expect(
      page.getByRole('link', { name: /Webová prezentace se simulovanou linuxovou CLI/ }),
    ).toHaveAttribute('href', '/interactive-zwa-1');

    await page
      .getByRole('link', { name: /Webová prezentace se simulovanou linuxovou CLI/ })
      .click();
    await expect(page).toHaveURL(/\/interactive-zwa-1\/?(?:\?slide=title)?$/);
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('student login controls follow a keyboard path', async ({ page }) => {
    await installDeterministicNetwork(page);

    await page.goto('/student');
    await expect(page.getByRole('main')).toHaveCount(1);
    const username = page.getByLabel('Username');
    const code = page.getByLabel('Auth code');
    const signIn = page.getByRole('button', { name: 'Sign in' });

    await username.focus();
    await username.press('Tab');
    await expect(code).toBeFocused();
    await code.press('Tab');
    await expect(signIn).toBeFocused();
  });

  test('course links can be reached and activated from the keyboard', async ({ page }) => {
    await installDeterministicNetwork(page);

    await page.goto('/');
    const firstLesson = page.getByRole('link', { name: /Otevřít lekci 1:/ }).first();
    await firstLesson.focus();
    await expect(firstLesson).toBeFocused();
    await firstLesson.press('Enter');

    await expect(page).toHaveURL(/\/interactive-zwa-1-html5\/?(?:\?slide=(?:title|intro))?$/);
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('valid lesson deep links select the requested slide and invalid ones fall back safely', async ({
    page,
  }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-1-html5?slide=tasks#stale');
    await expect(page.getByRole('navigation', { name: 'Osnova kurzu' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Navigace mezi snímky' })).toHaveCount(0);
    await expect(page.getByText('Lekce 1', { exact: true }).first()).toBeVisible();
    await expect(
      page.getByRole('navigation', { name: 'Osnova kurzu' }).getByRole('button', { name: 'Úkoly' }),
    ).toHaveAttribute('aria-current', 'step');
    await expect.poll(() => new URL(page.url()).searchParams.get('slide')).toBe('tasks');
    await expect.poll(() => new URL(page.url()).hash).toBe('');

    await page.goto('/interactive-zwa-1-html5?slide=missing');
    await expect(
      page.getByRole('navigation', { name: 'Osnova kurzu' }).getByRole('button', { name: 'Úvod' }),
    ).toHaveAttribute('aria-current', 'step');
    await expect.poll(() => new URL(page.url()).searchParams.get('slide')).toBe('intro');
  });

  test('student outline exposes one accessible navigation and slide focus movement', async ({
    page,
  }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-1-html5?slide=intro');
    const outline = page.getByRole('navigation', { name: 'Osnova kurzu' });
    await expect(outline).toBeVisible();
    await expect(page.getByRole('tablist')).toHaveCount(0);
    await expect(page.getByRole('tabpanel')).toHaveCount(0);
    const slides = outline.getByRole('button');
    await expect(slides).toHaveCount(4);

    await slides.nth(1).click();
    await expect(slides.nth(1)).toHaveAttribute('aria-current', 'step');
    await expect(page).toHaveURL(/slide=sections/);

    await page.keyboard.press('End');
    await expect(slides.nth(3)).toHaveAttribute('aria-current', 'step');
    await page.keyboard.press('Home');
    await expect(slides.nth(0)).toHaveAttribute('aria-current', 'step');
  });

  test('presenter controls are keyboard reachable', async ({ page }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-1-html5?mode=presenter&slide=intro');
    const startTimer = page.getByRole('button', { name: 'Spustit časovač' });
    const openProjector = page.getByRole('button', { name: 'Otevřít projektor' });

    await startTimer.focus();
    await expect(startTimer).toBeFocused();
    await startTimer.press('Enter');
    await expect(page.getByRole('button', { name: 'Pozastavit časovač' })).toBeFocused();

    await openProjector.focus();
    await expect(openProjector).toBeFocused();
    const popupPromise = page.waitForEvent('popup');
    await openProjector.press('Enter');
    const popup = await popupPromise;
    await expect(popup).toHaveURL(/mode=projector.*slide=intro/);
    await popup.close();
    await expect(page).toHaveURL(/mode=presenter.*slide=intro/);
  });

  for (const lesson of lessons) {
    test(`route ${lesson.number} exposes navigable accessible lesson tabs`, async ({ page }) => {
      await installDeterministicNetwork(page);

      const response = await page.goto(lesson.href);
      expect(response).not.toBeNull();
      expect(response.ok()).toBe(true);
      await expect(page.locator('h1').first()).toBeVisible();

      const navigation = page.getByRole('navigation', { name: 'Osnova kurzu' });
      const slideButtons = navigation.getByRole('button');
      const slideCount = await slideButtons.count();
      expect(slideCount).toBeGreaterThan(1);
      await expect(page.getByRole('tablist')).toHaveCount(0);

      const activeSlide = navigation.locator('button[aria-current="step"]');
      await expect(activeSlide).toHaveCount(1);
      await slideButtons.nth(1).click();
      await expect(slideButtons.nth(1)).toHaveAttribute('aria-current', 'step');
    });
  }
});
