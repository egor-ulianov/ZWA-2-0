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

const splitTaskCases = [
  {
    aggregateRoute: '/interactive-zwa-9?slide=tasks',
    taskIds: ['task1', 'task2', 'task3', 'task4', 'task5', 'task6'],
    titles: [
      'Úkol 1: Úprava formuláře + otázky',
      'Úkol 2: Spam – pouze jedna možnost (radio) + rekurze pro pole',
      'Úkol 3: Zájmy – posílat vybrané položky v jednom poli',
      'Úkol 4: Oblíbené předměty – multi‑select',
      'Úkol 5: Obsluha formuláře (validace)',
      'Úkol 6: BONUS: potvrzení před smazáním + uložení do session',
    ],
  },
  {
    aggregateRoute: '/interactive-zwa-10-sessions-cookies?slide=tasks',
    taskIds: ['task1', 'task2', 'task3', 'task4', 'task5', 'task6', 'task7'],
    titles: [
      'Úkol 1: Nastavte cookie s tématem vzhledu',
      'Úkol 2: Počítadlo návštěv v session',
      'Úkol 3: CSRF token pro formulář',
      'Úkol 4: Přihlášení s regenerací session ID',
      'Úkol 5: Flash zpráva',
      'Úkol 6: Smazání cookie „theme“',
      'Úkol 7: BONUS: Remember‑me cookie s hashem v DB',
    ],
  },
  {
    aggregateRoute: '/interactive-zwa-11-files-json?slide=tasks',
    taskIds: ['task1', 'task2', 'task3', 'task4', 'task5'],
    titles: [
      'Úkol 1: První experimenty se soubory',
      'Úkol 2: JSON – načtení a uložení',
      'Úkol 3: Knihovna uživatelů',
      'Úkol 4: Stránkování',
      'Úkol 5: BONUS: Robustnější zpracování',
    ],
  },
  {
    aggregateRoute: '/interactive-zwa-12-auth?slide=tasks',
    taskIds: ['task1', 'task2', 'task3', 'task4'],
    titles: [
      'Úkol 1: Přihlašovací formulář',
      'Úkol 2: Sezení a ochrana',
      'Úkol 3: Odhlášení',
      'Úkol 4: Domácí úkol: CSRF',
    ],
  },
];

async function openLessonOutline(page) {
  const trigger = page.getByRole('button', { name: 'Osnova lekce' });
  await trigger.click();
  return page.getByRole('dialog', { name: 'Osnova lekce' });
}

test.describe('static lesson task workspaces', () => {
  test('splits lessons 9–12 into outline tasks with IDE solutions', async ({ page }) => {
    await installDeterministicNetwork(page);

    for (const testCase of splitTaskCases) {
      await page.goto(testCase.aggregateRoute);
      await expect.poll(() => new URL(page.url()).searchParams.get('slide')).toBe('task1');

      const outline = await openLessonOutline(page);
      for (const title of testCase.titles) {
        await expect(outline.getByRole('button', { name: title, exact: true })).toBeVisible();
      }

      for (const taskId of testCase.taskIds) {
        const route = testCase.aggregateRoute.replace('slide=tasks', `slide=${taskId}`);
        await page.goto(route);
        const ide = page.getByRole('region', { name: 'IDE' });
        const tabs = ide.getByRole('tablist', { name: 'Soubory IDE' });
        await expect(tabs).toBeVisible();
        await expect(tabs.getByRole('tab', { name: 'Řešení', exact: true })).toHaveCount(1);
        await expect(page.getByText('Řešení je zamčené', { exact: true })).toHaveCount(0);
        await expect(
          page.getByRole('button', { name: /Zobrazit řešení|Klikněte zde/ }),
        ).toHaveCount(0);
      }
    }
  });

  test('switching a static outline task restores that task’s own source draft', async ({
    page,
  }) => {
    await installDeterministicNetwork(page);
    await page.goto('/interactive-zwa-9?slide=task1');

    const editor = page.getByRole('textbox', { name: 'Editor – zdrojový kód' });
    await editor.fill('CHANGED TASK 1');
    const outline = await openLessonOutline(page);
    await outline
      .getByRole('button', {
        name: /Úkol 2: Spam – pouze jedna možnost/,
      })
      .click();

    await expect(editor).not.toContainText('CHANGED TASK 1');
    await expect(editor).toContainText('name="spam"');
  });

  test('ZWA-7 task 1 exposes the expected HTML source in a local syntax editor', async ({
    page,
  }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-7?slide=task1');

    const editorRegion = page.getByRole('region', { name: 'IDE' });
    const editor = editorRegion.locator('[data-studio-editor="true"][data-language="html"]');

    await expect(editorRegion.getByRole('tab', { name: 'index.html', exact: true })).toBeVisible();
    await expect(editor).toHaveCount(1);
    await expect(editor.locator('.cm-editor')).toHaveCount(1);
    await expect(editor.locator('.cm-line span').first()).toBeVisible();
    await expect(editor.locator('.cm-content')).toContainText('<form id="registration-form">');
  });

  test('PHP static task editors use local syntax highlighting and named inputs', async ({
    page,
  }) => {
    await installDeterministicNetwork(page);

    for (const route of ['/interactive-zwa-8-php?slide=t1', '/interactive-zwa-9?slide=tasks']) {
      await page.goto(route);

      const editorRegion = page.getByRole('region', { name: 'IDE' });
      const editor = editorRegion.locator('[data-studio-editor="true"][data-language="php"]');

      await expect(editorRegion.getByRole('tab').first()).toHaveText(/\.php$/);
      await expect(editor).toHaveCount(1);
      await expect(editor.locator('.cm-editor')).toHaveCount(1);
      await expect(editor.locator('.cm-line span').first()).toBeVisible();
    }
  });

  test('lessons 7 and 8 expose read-only solution tabs inside the IDE', async ({ page }) => {
    await installDeterministicNetwork(page);

    for (const route of ['/interactive-zwa-7?slide=task1', '/interactive-zwa-8-php?slide=t1']) {
      await page.goto(route);

      const ide = page.getByRole('region', { name: 'IDE' });
      const tabs = ide.getByRole('tablist', { name: 'Soubory IDE' });
      const solutionTab = tabs.getByRole('tab', { name: 'Řešení', exact: true });

      await expect(tabs).toBeVisible();
      await expect(solutionTab).toBeVisible();
      await expect(page.getByText('Řešení je zamčené', { exact: true })).toHaveCount(0);
      await expect(page.getByRole('button', { name: /Klikněte zde/ })).toHaveCount(0);

      await solutionTab.click();
      const solutionPanel = ide.getByRole('tabpanel');
      await expect(solutionPanel.locator('[data-solution-panel="true"]')).toHaveAttribute(
        'aria-readonly',
        'true',
      );
      await expect(solutionPanel.locator('.cm-content')).toHaveAttribute(
        'contenteditable',
        'false',
      );
    }
  });

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
      await expect(taskRegion).toBeVisible();
      await expect(editorRegion).toBeVisible();

      const newVerification = page.getByRole('region', { name: 'Ověření' });
      const migrated = (await newVerification.count()) > 0;
      const previewRegion = migrated
        ? newVerification
        : page.getByRole('region', { name: 'Náhled a testy' });
      const editor = editorRegion.getByRole('textbox', { name: 'Editor – zdrojový kód' });
      const runTests = previewRegion.getByRole('button', {
        name: migrated ? 'Spustit ověření' : 'Spustit testy',
        exact: true,
      });
      const results = migrated
        ? previewRegion.locator('[aria-live="polite"]')
        : previewRegion.getByRole('group', { name: 'Výsledky testů' });

      await expect(previewRegion).toContainText('Statická kontrola');
      await expect(editor).toBeVisible();

      await editor.fill(
        "globalThis.__staticTaskExecuted = 'executed'; fetch('https://static-task.invalid/should-not-run');",
      );
      await runTests.click();
      await expect(results).toContainText('nebyl nalezen');
      await expect.poll(() => page.evaluate(() => window.__staticTaskExecuted ?? null)).toBeNull();

      await page.reload({ waitUntil: 'networkidle' });
      externalRequests.length = 0;
      await runTests.click();
      await expect(results).not.toContainText('nebyl nalezen');
      expect(externalRequests).toEqual([]);
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
      await expect(page.getByRole('region', { name: 'Náhled' })).toHaveCount(0);
      await expect(page.getByRole('region', { name: 'Ověření' })).toHaveCount(0);
      await expect(page.locator('textarea')).toHaveCount(0);
      await expect(page.getByText('Statická kontrola', { exact: false })).toHaveCount(0);
    });
  }

  test('shows the completed reference source in each lesson solution tab', async ({ page }) => {
    await installDeterministicNetwork(page);

    const cases = [
      {
        route: '/interactive-zwa-7?slide=task1',
        source: 'class FacultyProgram',
      },
      {
        route: '/interactive-zwa-8-php?slide=t1',
        source: "date('j.n.Y')",
      },
    ];

    for (const testCase of cases) {
      await page.goto(testCase.route);
      const ide = page.getByRole('region', { name: 'IDE' });
      await ide.getByRole('tab', { name: 'Řešení', exact: true }).click();
      await expect(ide.getByRole('tabpanel').locator('.cm-content')).toContainText(testCase.source);
    }
  });
});
