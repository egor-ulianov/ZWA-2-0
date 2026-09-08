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

test.describe('F2 lesson composition and deep links', () => {
  test('CSS II lesson keeps its task deep link and learning objective', async ({ page }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-5-css-ii?slide=tasks');

    await expect(page.getByRole('tab', { name: 'Úlohy – CSS II', exact: true })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect.poll(() => new URL(page.url()).searchParams.get('slide')).toBe('tasks');
    await expect(
      page.getByText(
        'Vytvoříte a ověříte responzivní CSS layout pomocí box modelu, flexboxu, media queries a tisku.',
        { exact: true },
      ),
    ).toBeVisible();
  });

  test('JavaScript lesson keeps its task deep link and learning objective', async ({ page }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-5-js?slide=tasks');

    await expect(
      page.getByRole('tab', { name: 'Úlohy – JavaScript', exact: true }),
    ).toHaveAttribute('aria-selected', 'true');
    await expect.poll(() => new URL(page.url()).searchParams.get('slide')).toBe('tasks');
    await expect(
      page.getByText(
        'Procvičíte proměnné, funkce, DOM a události v JavaScriptu v bezpečném interaktivním playgroundu.',
        { exact: true },
      ),
    ).toBeVisible();
  });

  test('classes and AJAX lesson keeps its task deep link and learning objective', async ({
    page,
  }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-7?slide=task1');

    await expect(page.getByRole('tab', { name: 'Úkol 1: Třídy', exact: true })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect.poll(() => new URL(page.url()).searchParams.get('slide')).toBe('task1');
    await expect(
      page.getByText(
        'Vysvětlíte základy tříd v JavaScriptu a AJAXu a procvičíte práci s asynchronními požadavky.',
        { exact: true },
      ),
    ).toBeVisible();
  });

  test('PHP lesson keeps its task deep link and learning objective', async ({ page }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-8-php?slide=t1');

    await expect(
      page.getByRole('tab', { name: 'Úkol 1: Výpis aktuálního data', exact: true }),
    ).toHaveAttribute('aria-selected', 'true');
    await expect.poll(() => new URL(page.url()).searchParams.get('slide')).toBe('t1');
    await expect(
      page.getByText(
        'Použijete základní PHP syntaxi pro práci s datem, funkcemi, poli a parametry.',
        { exact: true },
      ),
    ).toBeVisible();
  });
});
