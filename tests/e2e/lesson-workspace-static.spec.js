import { createRequire } from 'node:module';

const { expect, test } = createRequire(import.meta.url)('@playwright/test');
import { installDeterministicNetwork } from './helpers/browser.js';

const taskRoutes = [
  '/interactive-zwa-7?slide=task1',
  '/interactive-zwa-8-php?slide=t1',
  '/interactive-zwa-9?slide=tasks',
  '/interactive-zwa-10-sessions-cookies?slide=tasks',
  '/interactive-zwa-11-files-json?slide=tasks',
  '/interactive-zwa-12-auth?slide=tasks',
];

test.describe('static lesson task workspaces', () => {
  for (const route of taskRoutes) {
    test(`${route} exposes the Czech static task workspace zones`, async ({ page }) => {
      await installDeterministicNetwork(page);

      const externalRequests = [];
      page.on('request', (request) => {
        if (/^https?:\/\//.test(request.url()) && !request.url().startsWith('http://127.0.0.1')) {
          externalRequests.push(request.url());
        }
      });

      await page.goto(route);

      const taskRegion = page.getByRole('region', { name: 'Zadání' });
      const editorRegion = page.getByRole('region', { name: 'IDE' });
      const previewRegion = page.getByRole('region', { name: 'Náhled a testy' });
      const editor = editorRegion.getByRole('textbox', { name: 'Editor – zdrojový kód' });
      const runTests = previewRegion.getByRole('button', { name: 'Spustit testy', exact: true });
      const results = previewRegion.getByRole('group', { name: 'Výsledky testů' });

      await expect(taskRegion).toBeVisible();
      await expect(editorRegion).toBeVisible();
      await expect(previewRegion).toContainText('Statická kontrola');
      await expect(editor).toBeVisible();

      const seededDraft = await editor.inputValue();
      const baselineExternalRequests = externalRequests.length;

      await editor.fill(
        "globalThis.__staticTaskExecuted = 'executed'; fetch('https://static-task.invalid/should-not-run');",
      );
      await runTests.click();
      await expect(results).toContainText('nebyl nalezen');
      await expect.poll(() => page.evaluate(() => window.__staticTaskExecuted ?? null)).toBeNull();

      await editor.fill(seededDraft);
      await runTests.click();
      await expect(results).not.toContainText('nebyl nalezen');
      expect(externalRequests.slice(baselineExternalRequests)).toEqual([]);
    });
  }

  for (const route of taskRoutes) {
    test(`${route} hides the complete workspace in projector mode`, async ({ page }) => {
      await installDeterministicNetwork(page);

      await page.goto(route.replace('?', '?mode=projector&'));

      await expect(page.locator('[data-projector-private]')).toHaveCount(0);
      await expect(page.getByRole('region', { name: 'Zadání' })).toHaveCount(0);
      await expect(page.getByRole('region', { name: 'IDE' })).toHaveCount(0);
      await expect(page.getByRole('region', { name: 'Náhled a testy' })).toHaveCount(0);
      await expect(page.locator('textarea')).toHaveCount(0);
      await expect(page.getByText('Statická kontrola', { exact: false })).toHaveCount(0);
    });
  }

  test('preserves the lesson 7 challenge and PHP solution reveal for students', async ({
    page,
  }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-7?slide=task1');
    await expect(page.getByText('Řešení je zamčené', { exact: true })).toBeVisible();
    const challenge = page.getByRole('button', { name: /Klikněte zde/ });
    await expect(challenge).toBeVisible();
    for (let click = 0; click < 20; click += 1) await challenge.click();
    await expect(page.getByText('✅ Řešení odhaleno', { exact: true })).toBeVisible();

    await page.goto('/interactive-zwa-8-php?slide=t1');
    const reveal = page.getByRole('button', { name: 'Zobrazit řešení', exact: true });
    await expect(reveal).toBeVisible();
    await reveal.click();
    await expect(
      page
        .getByRole('region', { name: 'Náhled a testy' })
        .locator('code.language-php')
        .filter({ hasText: 'Dnešní datum je:' }),
    ).toBeVisible();
  });
});
