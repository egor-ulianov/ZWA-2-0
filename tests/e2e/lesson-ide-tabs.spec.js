import { createRequire } from 'node:module';

const { expect, test } = createRequire(import.meta.url)('@playwright/test');
import { installDeterministicNetwork } from './helpers/browser.js';

test.describe('lesson IDE tabs', () => {
  test('task workspaces expose student files and a final read-only solution tab', async ({
    page,
  }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-1-html5?slide=tasks');

    const ide = page.getByRole('region', { name: 'IDE' });
    const tabs = ide.getByRole('tablist', { name: 'Soubory IDE' });
    await expect(tabs).toBeVisible();
    await expect(tabs.getByRole('tab')).toHaveCount(2);
    await expect(tabs.getByRole('tab').first()).not.toHaveText('Řešení');
    await expect(tabs.getByRole('tab', { name: 'Řešení', exact: true })).toHaveAttribute(
      'aria-selected',
      'false',
    );

    await tabs.getByRole('tab', { name: 'Řešení', exact: true }).click();
    await expect(tabs.getByRole('tab', { name: 'Řešení', exact: true })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(ide.locator('[data-solution-panel]')).toBeVisible();
    await expect(ide.locator('[data-solution-panel] [contenteditable="false"]')).toHaveCount(1);

    const solutionTextOutsideIde = await page
      .locator('body *')
      .evaluateAll(
        (nodes) =>
          nodes.filter(
            (node) => node.textContent?.trim() === 'Řešení' && !node.closest('[aria-label="IDE"]'),
          ).length,
      );
    expect(solutionTextOutsideIde).toBe(0);
  });

  test('IDE tab roving focus consumes directional and boundary keys', async ({ page }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-1-html5?slide=tasks');

    const tabs = page.getByRole('tablist', { name: 'Soubory IDE' });
    const fileTab = tabs.getByRole('tab').first();
    const solutionTab = tabs.getByRole('tab', { name: 'Řešení', exact: true });

    await fileTab.focus();
    await fileTab.press('ArrowRight');
    await expect(solutionTab).toBeFocused();
    await expect(page).toHaveURL(/slide=tasks/);

    await solutionTab.press('Home');
    await expect(fileTab).toBeFocused();
    await solutionTab.press('End');
    await expect(solutionTab).toBeFocused();
    await solutionTab.press('ArrowLeft');
    await expect(fileTab).toBeFocused();
    await expect(page).toHaveURL(/slide=tasks/);
  });
});
