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
    await expect(results).toContainText('Code executed');
    await expect(page.locator('iframe[title="JavaScript DOM sandbox"]')).toBeVisible();
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
        route: '/interactive-zwa-1?slide=tasks-net',
        prepare: async (page) => {
          const commandInput = page.getByPlaceholder(/type a command and press Enter/i);
          await commandInput.fill('host cvut.cz');
          await commandInput.press('Enter');
          await expect(page.getByText(/cvut\.cz has address 147\.32\.0\.1/)).toBeVisible();
        },
        result: 'Kontrolní seznam ověřen',
      },
      {
        route: '/interactive-zwa-2?slide=tasks',
        state: async (page) => {
          await expect(page.locator('iframe[title="CSS validation sandbox"]')).toHaveCount(1);
        },
      },
      {
        route: '/interactive-zwa-5-css-ii?slide=tasks',
        state: async (page) => {
          await expect(page.locator('iframe[title="CSS layout validation sandbox"]')).toHaveCount(
            1,
          );
        },
      },
    ];

    for (const checkerCase of checkerCases) {
      test(`${checkerCase.route} runs its existing checker`, async ({ page }) => {
        await installDeterministicNetwork(page);
        await page.goto(checkerCase.route);
        await checkerCase.prepare?.(page);
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
    const commandInput = page.getByPlaceholder(/type a command and press Enter/i);
    await expect(commandInput).toBeVisible();
    const externalRequestsBeforeCommand = externalRequests.length;
    await commandInput.fill('host cvut.cz');
    await commandInput.press('Enter');
    await expect(page.getByText(/cvut\.cz has address 147\.32\.0\.1/)).toBeVisible();
    expect(externalRequests.slice(externalRequestsBeforeCommand)).toEqual([]);
  });
});
