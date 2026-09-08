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
    await expect(page.getByRole('heading', { name: 'ZWA Presentations' })).toBeVisible();

    const lessonLinks = page
      .getByRole('main')
      .getByRole('link')
      .filter({ hasText: /^\d+\)/ });
    await expect(lessonLinks).toHaveCount(12);
    await expect(
      page.getByRole('link', { name: /Web Presentation with Simulated Linux CLI/ }),
    ).toHaveAttribute('href', '/interactive-zwa-1');

    await page.getByRole('link', { name: /Web Presentation with Simulated Linux CLI/ }).click();
    await expect(page).toHaveURL(/\/interactive-zwa-1\/?(?:\?slide=title)?$/);
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('valid lesson deep links select the requested slide and invalid ones fall back safely', async ({
    page,
  }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-1-html5?slide=tasks#stale');
    await expect(page.getByRole('tab', { name: 'Úkoly' })).toHaveAttribute('aria-selected', 'true');
    await expect.poll(() => new URL(page.url()).searchParams.get('slide')).toBe('tasks');
    expect(new URL(page.url()).hash).toBe('');

    await page.goto('/interactive-zwa-1-html5?slide=missing');
    await expect(page.getByRole('tab', { name: 'Úvod' })).toHaveAttribute('aria-selected', 'true');
    await expect.poll(() => new URL(page.url()).searchParams.get('slide')).toBe('intro');
  });

  test('lesson tabs expose accessible relationships and keyboard focus movement', async ({
    page,
  }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-1-html5?slide=intro');
    const tablist = page
      .getByRole('navigation', { name: 'Navigace mezi snímky' })
      .getByRole('tablist');
    const tabs = tablist.getByRole('tab');
    await expect(tablist).toHaveAttribute('aria-orientation', 'horizontal');
    await expect(tabs).toHaveCount(4);
    await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
    await expect(tabs.nth(0)).toHaveAttribute('tabindex', '0');
    await expect(tabs.nth(1)).toHaveAttribute('tabindex', '-1');

    await tabs.nth(0).focus();
    await tabs.nth(0).press('ArrowRight');
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(tabs.nth(1)).toBeFocused();

    await tabs.nth(1).press('End');
    await expect(tabs.nth(3)).toHaveAttribute('aria-selected', 'true');
    await expect(tabs.nth(3)).toBeFocused();

    const panelId = await tabs.nth(3).getAttribute('aria-controls');
    await expect(page.locator(`#${panelId}`)).toHaveAttribute(
      'aria-labelledby',
      await tabs.nth(3).getAttribute('id'),
    );

    await tabs.nth(3).press('Home');
    await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
    await expect(tabs.nth(0)).toBeFocused();
  });

  for (const lesson of lessons) {
    test(`route ${lesson.number} exposes navigable accessible lesson tabs`, async ({ page }) => {
      await installDeterministicNetwork(page);

      const response = await page.goto(lesson.href);
      expect(response).not.toBeNull();
      expect(response.ok()).toBe(true);
      await expect(page.locator('h1').first()).toBeVisible();

      const navigation = page.getByRole('navigation', { name: 'Navigace mezi snímky' });
      const tabs = navigation.getByRole('tab');
      const tabCount = await tabs.count();
      expect(tabCount).toBeGreaterThan(1);

      const controlledPanelIds = new Set();
      for (let index = 0; index < tabCount; index += 1) {
        const tab = tabs.nth(index);
        const tabId = await tab.getAttribute('id');
        const panelId = await tab.getAttribute('aria-controls');
        expect(tabId).toBeTruthy();
        expect(panelId).toBeTruthy();
        expect(controlledPanelIds.has(panelId)).toBe(false);
        controlledPanelIds.add(panelId);
      }

      const activeTab = navigation.getByRole('tab', { selected: true });
      const activeTabId = await activeTab.getAttribute('id');
      const activePanelId = await activeTab.getAttribute('aria-controls');
      await expect(page.locator(`#${activePanelId}`)).toHaveAttribute(
        'aria-labelledby',
        activeTabId,
      );
      await expect(activeTab).toHaveAttribute('aria-selected', 'true');
      await tabs.nth(1).click();
      await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
      await expect(
        page.locator(`#${await tabs.nth(1).getAttribute('aria-controls')}`),
      ).toBeVisible();
      await expect(tabs.nth(1)).toHaveAttribute('tabindex', '0');
      await expect(tabs.first()).toHaveAttribute('tabindex', '-1');
    });
  }
});
