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
        editorName: 'Editor HTML pro úkol',
      },
      {
        route: '/interactive-zwa-2-forms?slide=tasks',
        iframeTitle: 'Náhled HTML formuláře',
        editorName: 'Editor HTML formuláře',
      },
      {
        route: '/interactive-zwa-2?slide=tasks',
        iframeTitle: 'Náhled CSS playgroundu',
        editorName: 'Editor HTML a CSS',
      },
      {
        route: '/interactive-zwa-5-css-ii?slide=tasks',
        iframeTitle: 'Náhled CSS II playgroundu',
        editorName: 'Editor HTML CSS II',
      },
    ];

    for (const testCase of cases) {
      await installDeterministicNetwork(page);
      await page.goto(testCase.route);
      const editor = page.getByRole('region', { name: 'IDE' }).first();
      const preview = page.getByRole('region', { name: 'Náhled a testy' }).first();

      await expect(editor.getByRole('textbox', { name: testCase.editorName })).toBeVisible();
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

  test('CSS tasks keep the selected assignment above a wide IDE with task tabs', async ({
    page,
  }) => {
    await installDeterministicNetwork(page);
    await page.goto('/interactive-zwa-2?slide=tasks');

    const assignment = page.getByRole('region', { name: 'Zadání' });
    const ide = page.getByRole('region', { name: 'IDE' });
    const taskTabs = ide.getByRole('tablist', { name: 'Kroky úlohy CSS' });

    await expect(
      page.getByRole('heading', { level: 1, name: 'ZWA-4: CSS – interaktivní prezentace' }),
    ).toBeVisible();
    await expect(assignment.getByText('Úloha 1 / 5', { exact: true })).toBeVisible();
    await expect(taskTabs).toBeVisible();
    await expect(taskTabs.getByRole('tab', { name: /1.*Nadpis/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(ide.locator('.cm-editor')).toBeVisible();
    await expect(ide.locator('.cm-content')).toBeVisible();
    await expect(ide.locator('.cm-gutters')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Předchozí', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Další', exact: true })).toHaveCount(0);

    await taskTabs.getByRole('tab', { name: /2.*Odkazy ve footeru/ }).click();
    await expect(assignment.getByText('Úloha 2 / 5', { exact: true })).toBeVisible();
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

  test('task choice arrow keys stay on the task slide', async ({ page }) => {
    for (const route of [
      '/interactive-zwa-5-css-ii?slide=tasks',
      '/interactive-zwa-5-js?slide=tasks',
    ]) {
      await installDeterministicNetwork(page);
      await page.goto(route);

      const taskChoice = route.includes('5-js')
        ? page.getByRole('tab').nth(1)
        : route.includes('/interactive-zwa-2?')
          ? page.getByRole('tab').first()
          : page.getByRole('button', { name: 'Přejít na úlohu 2' }).first();
      await taskChoice.focus();
      await taskChoice.press('ArrowLeft');
      await expect(page).toHaveURL(/slide=tasks/);
    }
  });

  test('HTML and form task selectors keep students in the unified workspace', async ({ page }) => {
    const cases = [
      {
        route: '/interactive-zwa-1-html5?slide=tasks',
        tablist: 'Kroky úlohy HTML',
        tab: 'Sémantická struktura',
        assignment: 'sémantickou strukturu',
      },
      {
        route: '/interactive-zwa-2-forms?slide=tasks',
        tablist: 'Kroky úlohy formulářů',
        tab: 'Seskupení polí',
        assignment: 'fieldset',
      },
    ];

    for (const testCase of cases) {
      await installDeterministicNetwork(page);
      await page.goto(testCase.route);

      const assignment = page.getByRole('region', { name: 'Zadání' });
      const taskTabs = page
        .getByRole('region', { name: 'IDE' })
        .getByRole('tablist', { name: testCase.tablist });

      await taskTabs.getByRole('tab', { name: testCase.tab, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`${testCase.route.replace('?', '\\?')}$`));
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

  test('network checker reports unmet requirements and passes after all simulated commands', async ({
    page,
  }) => {
    await installDeterministicNetwork(page);
    await page.goto('/interactive-zwa-1?slide=tasks-net');

    const workspace = page.getByRole('region', { name: 'Náhled a testy' }).first();
    const commandInput = page.getByRole('textbox', { name: 'Příkaz terminálu' });
    await expect(commandInput).toBeVisible();
    const runTests = workspace.getByRole('button', { name: 'Spustit testy', exact: true });

    await commandInput.fill('host cvut.cz');
    await commandInput.press('Enter');
    await expect(page.getByText(/cvut\.cz má adresu 147\.32\.0\.1/)).toBeVisible();
    await runTests.click();

    await expect(workspace.getByText('Kontrola neúspěšná')).toBeVisible();
    await expect(
      workspace.getByText('Požadavek: ověření místní konfigurace — nesplněn'),
    ).toBeVisible();
    await expect(workspace).not.toContainText(/ifconfig|traceroute|telnet|host cvut\.cz/i);

    for (const command of ['ifconfig', 'traceroute fel.cvut.cz', 'telnet zwa.toad.cz 80']) {
      await commandInput.fill(command);
      await commandInput.press('Enter');
    }
    await runTests.click();

    await expect(workspace.getByText('Kontrola úspěšná')).toBeVisible();
    await expect(workspace.getByText(/nesplněn/)).toHaveCount(0);
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
