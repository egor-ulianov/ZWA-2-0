import { createRequire } from 'node:module';

const { expect, test } = createRequire(import.meta.url)('@playwright/test');
import { installDeterministicNetwork } from './helpers/browser.js';

test.describe('F1 lesson composition and deep links', () => {
  test('HTML5 lesson keeps its task deep link and learning objective', async ({ page }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-1-html5?slide=tasks');

    await expect(page.getByRole('tab', { name: 'Úkoly', exact: true })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect.poll(() => new URL(page.url()).searchParams.get('slide')).toBe('tasks');
    await expect(
      page.getByText(
        'Vytvoříte validní HTML5 dokument se sémantickou strukturou a ověříte jej validátorem.',
        {
          exact: true,
        },
      ),
    ).toBeVisible();
  });

  test('forms lesson keeps its task deep link and learning objective', async ({ page }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-2-forms?slide=tasks');

    await expect(page.getByRole('tab', { name: 'Úkoly', exact: true })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect.poll(() => new URL(page.url()).searchParams.get('slide')).toBe('tasks');
    await expect(
      page.getByText(
        'Rozpoznáte HTML5 prvky formulářů a ověříte jejich atributy i klientskou validaci.',
        { exact: true },
      ),
    ).toBeVisible();
  });

  test('network lesson keeps its task deep link and learning objective', async ({ page }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-1/?slide=tasks-net');

    await expect(
      page.getByRole('tab', { name: 'Úlohy – síť (v terminálu vpravo)', exact: true }),
    ).toHaveAttribute('aria-selected', 'true');
    await expect.poll(() => new URL(page.url()).searchParams.get('slide')).toBe('tasks-net');
    await expect(
      page.getByText(
        'Vysvětlíte cestu požadavku od DNS přes TCP až po HTTP a procvičíte diagnostické příkazy v simulovaném terminálu.',
        { exact: true },
      ),
    ).toBeVisible();
  });

  test('CSS lesson keeps its task deep link and learning objective', async ({ page }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-2?slide=tasks');

    await expect(page.getByRole('tab', { name: 'Úlohy – CSS', exact: true })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect.poll(() => new URL(page.url()).searchParams.get('slide')).toBe('tasks');
    await expect(
      page.getByText(
        'Použijete základní CSS selektory, pseudo-elementy a propojení stylopisu v praktickém playgroundu.',
        { exact: true },
      ),
    ).toBeVisible();
  });
});
