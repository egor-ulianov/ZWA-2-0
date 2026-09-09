import { createRequire } from 'node:module';

const { expect, test } = createRequire(import.meta.url)('@playwright/test');
import { installDeterministicNetwork } from './helpers/browser.js';

const taskRoutes = [
  '/interactive-zwa-1-html5?slide=tasks',
  '/interactive-zwa-2-forms?slide=tasks',
  '/interactive-zwa-1?slide=tasks-net',
  '/interactive-zwa-2?slide=tasks',
  '/interactive-zwa-5-css-ii?slide=tasks',
  '/interactive-zwa-5-js?slide=tasks',
];

const nonTaskRoutes = [
  '/interactive-zwa-1-html5?slide=validator',
  '/interactive-zwa-2-forms?slide=overview',
  '/interactive-zwa-1?slide=theory',
  '/interactive-zwa-2?slide=linking',
  '/interactive-zwa-5-css-ii?slide=links',
];

test.describe('runtime lesson task workspaces', () => {
  for (const route of taskRoutes) {
    test(`${route} exposes the Czech task workspace zones`, async ({ page }) => {
      await installDeterministicNetwork(page);

      const response = await page.goto(route);
      expect(response).not.toBeNull();
      expect(response.ok()).toBe(true);

      await expect(page.getByRole('region', { name: 'Zadání' }).first()).toBeVisible();
      await expect(page.getByRole('region', { name: 'IDE' }).first()).toBeVisible();
      await expect(page.getByRole('region', { name: 'Náhled a testy' }).first()).toBeVisible();
      await expect(page.getByRole('button', { name: 'Spustit testy' }).first()).toBeVisible();
    });
  }

  test('JavaScript keeps test execution inside the isolated sandbox', async ({ page }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-5-js?slide=tasks');
    const runTests = page.getByRole('button', { name: 'Spustit testy' });
    await runTests.click();

    const results = page.getByRole('group', { name: 'Výsledky testů' });
    await expect(results).toContainText('Kód byl spuštěn');
    await expect(page.locator('iframe[title="Izolovaný JavaScript DOM sandbox"]')).toBeVisible();
  });

  test('live previews and runtime output stay inside the named preview region', async ({
    page,
  }) => {
    const cases = [
      {
        route: '/interactive-zwa-1-html5?slide=tasks',
        iframeTitle: 'Náhled HTML playgroundu',
      },
      {
        route: '/interactive-zwa-2-forms?slide=tasks',
        iframeTitle: 'Náhled HTML formuláře',
      },
      {
        route: '/interactive-zwa-2?slide=tasks',
        iframeTitle: 'Náhled CSS playgroundu',
      },
      {
        route: '/interactive-zwa-5-css-ii?slide=tasks',
        iframeTitle: 'Náhled CSS II playgroundu',
      },
    ];

    for (const testCase of cases) {
      await installDeterministicNetwork(page);
      await page.goto(testCase.route);
      const editor = page.getByRole('region', { name: 'IDE' }).first();
      const preview = page.getByRole('region', { name: 'Náhled a testy' }).first();

      await expect(editor.getByRole('textbox').first()).toBeVisible();
      await expect(preview.locator(`iframe[title="${testCase.iframeTitle}"]`)).toBeVisible();
      await expect(editor.locator(`iframe[title="${testCase.iframeTitle}"]`)).toHaveCount(0);

      await preview.getByRole('button', { name: 'Spustit testy', exact: true }).click();
      if (testCase.iframeTitle.startsWith('Náhled HTML')) {
        await expect(preview.getByText(/Chyba validace:/)).toBeVisible();
      } else {
        await expect(preview.getByRole('status')).toContainText(/Úloha|#site-header/);
      }
      await expect(preview.getByRole('group', { name: 'Výsledky testů' })).toBeVisible();
    }
  });

  test('CSS tasks live in the course outline while IDE tabs stay reserved for files', async ({
    page,
  }) => {
    await installDeterministicNetwork(page);
    await page.goto('/interactive-zwa-2?slide=tasks');

    const assignment = page.getByRole('region', { name: 'Zadání' });
    const ide = page.getByRole('region', { name: 'IDE' });
    const outline = page.getByRole('navigation', { name: 'Osnova kurzu' });

    await expect(
      page.getByRole('heading', { level: 1, name: 'ZWA-4: CSS – interaktivní prezentace' }),
    ).toBeVisible();
    await expect(outline.getByRole('button', { name: '1) Nadpis', exact: true })).toBeVisible();
    await expect(ide.getByRole('tablist', { name: 'Kroky úlohy CSS' })).toHaveCount(0);
    await expect(ide.getByRole('tablist', { name: 'Soubory IDE' })).toBeVisible();
    await expect(ide.locator('.cm-editor')).toBeVisible();
    await expect(ide.locator('.cm-content')).toBeVisible();
    await expect(ide.locator('.cm-gutters')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Předchozí', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Další', exact: true })).toHaveCount(0);

    await outline.getByRole('button', { name: '2) Odkazy ve footeru', exact: true }).click();
    await expect(assignment).toContainText('Georgia');
  });

  test('CSS II and JavaScript task IDEs provide syntax-aware student editors', async ({ page }) => {
    for (const route of [
      '/interactive-zwa-2?slide=tasks',
      '/interactive-zwa-5-css-ii?slide=tasks',
      '/interactive-zwa-5-js?slide=tasks',
    ]) {
      await installDeterministicNetwork(page);
      await page.goto(route);

      const ide = page.getByRole('region', { name: 'IDE' });
      await expect(ide.locator('.cm-editor')).not.toHaveCount(0);
    }
  });

  test('CSS II tasks use the course outline and keep only files and solution in the IDE', async ({
    page,
  }) => {
    await installDeterministicNetwork(page);
    await page.goto('/interactive-zwa-5-css-ii?slide=tasks');

    const assignment = page.getByRole('region', { name: 'Zadání' });
    const ide = page.getByRole('region', { name: 'IDE' });
    const outline = page.getByRole('navigation', { name: 'Osnova kurzu' });

    await expect(outline.getByRole('button', { name: 'Box model', exact: true })).toBeVisible();
    await expect(ide.getByRole('tablist', { name: 'Kroky úlohy CSS II' })).toHaveCount(0);
    await expect(ide.getByRole('tablist', { name: 'Soubory IDE' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Předchozí', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Další', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Přejít na úlohu/ })).toHaveCount(0);

    await outline.getByRole('button', { name: 'Float/Clear', exact: true }).click();
    await expect(assignment).toContainText('Vložte obrázek do textu');
    await expect(ide).toBeVisible();
    await expect(page.getByRole('region', { name: 'Náhled a testy' })).toBeVisible();
  });

  test('IDE file and solution tab arrow keys stay on the task slide', async ({ page }) => {
    for (const route of [
      '/interactive-zwa-5-css-ii?slide=tasks',
      '/interactive-zwa-5-js?slide=tasks',
      '/interactive-zwa-1-html5?slide=tasks',
      '/interactive-zwa-2-forms?slide=tasks',
    ]) {
      await installDeterministicNetwork(page);
      await page.goto(route);

      const taskChoice =
        route.includes('1-html5') || route.includes('2-forms')
          ? page
              .getByRole('region', { name: 'IDE' })
              .getByRole('tablist', { name: 'Soubory IDE' })
              .getByRole('tab')
              .last()
          : route.includes('5-js')
            ? page.getByRole('tab').nth(1)
            : page.getByRole('tablist').first().getByRole('tab').first();
      await taskChoice.focus();
      await taskChoice.press('ArrowLeft');
      await expect(page).toHaveURL(/slide=tasks/);
    }
  });

  test('HTML and form tasks are selected from the course outline', async ({ page }) => {
    const cases = [
      {
        route: '/interactive-zwa-1-html5?slide=tasks',
        task: 'Sémantická struktura',
        assignment: 'sémantickou strukturu',
      },
      {
        route: '/interactive-zwa-2-forms?slide=tasks',
        task: 'Seskupení polí',
        assignment: 'fieldset',
      },
    ];

    for (const testCase of cases) {
      await installDeterministicNetwork(page);
      await page.goto(testCase.route);

      const assignment = page.getByRole('region', { name: 'Zadání' });
      await page
        .getByRole('navigation', { name: 'Osnova kurzu' })
        .getByRole('button', { name: testCase.task, exact: true })
        .click();
      await expect(assignment).toContainText(testCase.assignment);
      await expect(page.getByRole('region', { name: 'IDE' })).toBeVisible();
      await expect(page.getByRole('region', { name: 'Náhled a testy' })).toBeVisible();
    }
  });

  test('HTML and form task editors use the local HTML syntax editor', async ({ page }) => {
    for (const route of [
      '/interactive-zwa-1-html5?slide=tasks',
      '/interactive-zwa-2-forms?slide=tasks',
    ]) {
      await installDeterministicNetwork(page);
      await page.goto(route);

      const ide = page.getByRole('region', { name: 'IDE' });
      await expect(ide.locator('[data-code-editor="syntax"][data-language="html"]')).toHaveCount(1);
      await expect(ide.locator('.cm-editor')).toHaveCount(1);
      await expect(ide.locator('.cm-content')).toHaveCount(1);
      await expect(ide.locator('.cm-gutters')).toHaveCount(1);
    }
  });

  test.describe('the unified action invokes the existing runtime checker', () => {
    const checkerCases = [
      {
        route: '/interactive-zwa-1-html5?slide=tasks',
        result: /Chyba validace:/,
      },
      {
        route: '/interactive-zwa-2-forms?slide=tasks',
        result: /Chyba validace:/,
      },
      {
        route: '/interactive-zwa-2?slide=tasks',
        state: async (page) => {
          await expect(page.locator('iframe[title="Sandbox kontroly CSS"]')).toHaveCount(1);
        },
      },
      {
        route: '/interactive-zwa-5-css-ii?slide=tasks',
        state: async (page) => {
          await expect(page.locator('iframe[title="Sandbox kontroly CSS II"]')).toHaveCount(1);
        },
      },
    ];

    for (const checkerCase of checkerCases) {
      test(`${checkerCase.route} runs its existing checker`, async ({ page }) => {
        await installDeterministicNetwork(page);
        await page.goto(checkerCase.route);
        await page
          .getByRole('region', { name: 'Náhled a testy' })
          .first()
          .getByRole('button', { name: 'Spustit testy', exact: true })
          .click();
        if (checkerCase.state) {
          await checkerCase.state(page);
        } else {
          await expect(page.getByText(checkerCase.result)).toBeVisible();
        }
      });
    }
  });

  for (const route of nonTaskRoutes) {
    test(`${route} does not render unified task zones`, async ({ page }) => {
      await installDeterministicNetwork(page);
      await page.goto(route);
      await expect(page.getByRole('region', { name: 'Zadání' })).toHaveCount(0);
      await expect(page.getByRole('region', { name: 'IDE' })).toHaveCount(0);
      await expect(page.getByRole('region', { name: 'Náhled a testy' })).toHaveCount(0);
    });
  }

  test('network task checkers stay scoped to their individual outline task', async ({ page }) => {
    await installDeterministicNetwork(page);
    await page.goto('/interactive-zwa-1?slide=tasks-net');

    const workspace = page.getByRole('region', { name: 'Náhled a testy' }).first();
    const commandInput = page.getByRole('textbox', { name: 'Příkaz terminálu' });
    await expect(commandInput).toBeVisible();
    const runTests = workspace.getByRole('button', { name: 'Spustit testy', exact: true });

    await runTests.click();

    await expect(workspace.getByText('Kontrola neúspěšná')).toBeVisible();
    await expect(workspace.getByText('Požadavek: ověření DNS — nesplněn')).toBeVisible();

    await commandInput.fill('host cvut.cz');
    await commandInput.press('Enter');
    await expect(page.getByText(/cvut\.cz má adresu 147\.32\.0\.1/)).toBeVisible();
    await runTests.click();
    await expect(workspace.getByText('Kontrola úspěšná')).toBeVisible();
    await expect(workspace.getByText(/nesplněn/)).toHaveCount(0);

    await page
      .getByRole('navigation', { name: 'Osnova kurzu' })
      .getByRole('button', { name: 'Lokální síť a konektivita: ifconfig / ping', exact: true })
      .click();
    const localWorkspace = page.getByRole('region', { name: 'Náhled a testy' }).first();
    await localWorkspace.getByRole('button', { name: 'Spustit testy', exact: true }).click();
    await expect(localWorkspace.getByText('Kontrola neúspěšná')).toBeVisible();
    await commandInput.fill('ifconfig');
    await commandInput.press('Enter');
    await localWorkspace.getByRole('button', { name: 'Spustit testy', exact: true }).click();
    await expect(localWorkspace.getByText('Kontrola úspěšná')).toBeVisible();
  });

  test('network task keeps terminal commands local and makes no external requests', async ({
    page,
  }) => {
    await installDeterministicNetwork(page);

    const externalRequests = [];
    page.on('request', (request) => {
      if (/^https?:\/\//.test(request.url()) && !request.url().startsWith('http://127.0.0.1')) {
        externalRequests.push(request.url());
      }
    });

    await page.goto('/interactive-zwa-1?slide=tasks-net');
    const commandInput = page.getByPlaceholder(/zadejte příkaz a stiskněte Enter/i);
    await expect(commandInput).toBeVisible();
    const externalRequestsBeforeCommand = externalRequests.length;
    await commandInput.fill('host cvut.cz');
    await commandInput.press('Enter');
    await expect(page.getByText(/cvut\.cz má adresu 147\.32\.0\.1/)).toBeVisible();
    expect(externalRequests.slice(externalRequestsBeforeCommand)).toEqual([]);
  });
});
