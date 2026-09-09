import { createRequire } from 'node:module';

const { expect, test } = createRequire(import.meta.url)('@playwright/test');
import { installDeterministicNetwork } from './helpers/browser.js';

const cases = [
  {
    route: '/interactive-zwa-10-sessions-cookies?slide=tasks',
    assignment: 'Nastavte theme=dark na 7 dní',
    expected: 'Cookie má bezpečné atributy',
    sourceFile: 'sessions.php',
  },
  {
    route: '/interactive-zwa-11-files-json?slide=tasks',
    assignment: 'Vytvořte data.txt',
    expected: 'Program bezpečně zapíše a přečte',
    sourceFile: 'users.lib.php',
  },
  {
    route: '/interactive-zwa-12-auth?slide=tasks',
    assignment: 'Vytvořte přihlašovací formulář',
    expected: 'Formulář předá heslo přes POST',
    sourceFile: 'auth.php',
  },
];

test.describe('student task workspace consistency for lessons 10–12', () => {
  for (const testCase of cases) {
    test(`${testCase.route} puts the assignment before the PHP IDE`, async ({ page }) => {
      await installDeterministicNetwork(page);
      await page.goto(testCase.route);

      const assignment = page.getByRole('region', { name: 'Zadání' });
      const ide = page.getByRole('region', { name: 'IDE' });
      const preview = page.getByRole('region', { name: 'Náhled a testy' });

      await expect(assignment).toContainText(testCase.assignment);
      await expect(assignment).toContainText('Konkrétní vstup studenta:');
      await expect(ide.getByRole('tab', { name: testCase.sourceFile })).toBeVisible();
      await expect(ide.locator('.cm-editor')).toBeVisible();
      await expect(preview).toContainText(testCase.expected);
      await expect(preview).toContainText('Statická kontrola');
      await expect(preview).not.toContainText(testCase.assignment);
    });
  }
});
