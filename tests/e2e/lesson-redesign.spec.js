import { createRequire } from 'node:module';

const { expect, test } = createRequire(import.meta.url)('@playwright/test');
import { installDeterministicNetwork } from './helpers/browser.js';

async function expectSelectedOutlineSlide(page, name) {
  const outline = page.getByRole('navigation', { name: 'Osnova kurzu' });
  await expect(outline).toBeVisible();
  await expect(outline.getByRole('button', { name, exact: true })).toHaveAttribute(
    'aria-current',
    'step',
  );
}

test.describe('F1 lesson composition and deep links', () => {
  test('HTML5 lesson keeps its task deep link and learning objective', async ({ page }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-1-html5?slide=tasks');

    await expectSelectedOutlineSlide(page, 'Úkoly');
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

    await expectSelectedOutlineSlide(page, 'Úkoly');
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

    await expectSelectedOutlineSlide(page, 'Úlohy – síť (v terminálu vpravo)');
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

    await expectSelectedOutlineSlide(page, 'Úlohy – CSS');
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

    await expectSelectedOutlineSlide(page, 'Úlohy – CSS II');
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

    await expectSelectedOutlineSlide(page, 'Úlohy – JavaScript');
    await expect.poll(() => new URL(page.url()).searchParams.get('slide')).toBe('tasks');
    await expect(
      page.getByText(
        'Procvičíte proměnné, funkce, DOM a události v JavaScriptu v bezpečném interaktivním playgroundu.',
        { exact: true },
      ),
    ).toBeVisible();
  });

  test('CSS II keeps its playground on task slides only', async ({ page }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-5-css-ii?slide=theory');
    await expect(page.getByTitle('Náhled CSS II playgroundu')).toHaveCount(0);
    await expect(page.getByRole('textbox')).toHaveCount(0);

    await page.goto('/interactive-zwa-5-css-ii?slide=tasks');
    await expect(page.getByTitle('Náhled CSS II playgroundu')).toBeVisible();
    await expect(page.getByRole('textbox')).toHaveCount(2);
  });

  test('JavaScript keeps its exercise workspace on task slides only', async ({ page }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-5-js?slide=theory');
    await expect(page.getByRole('region', { name: 'Zadání', exact: true })).toHaveCount(0);
    await expect(page.getByTitle('Izolovaný JavaScript DOM sandbox')).toHaveCount(0);

    await page.goto('/interactive-zwa-5-js?slide=tasks');
    const workspace = page.locator('[data-projector-private="exercise-workspace"]');
    await expect(workspace).toBeVisible();
    await expect(workspace.getByRole('textbox')).toBeVisible();
    await expect(workspace.getByTitle('Izolovaný JavaScript DOM sandbox')).toBeVisible();
  });

  test('classes and AJAX lesson keeps its task deep link and learning objective', async ({
    page,
  }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-7?slide=task1');

    await expectSelectedOutlineSlide(page, 'Úkol 1: Třídy');
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

    await expectSelectedOutlineSlide(page, 'Úkol 1: Výpis aktuálního data');
    await expect.poll(() => new URL(page.url()).searchParams.get('slide')).toBe('t1');
    await expect(
      page.getByText(
        'Použijete základní PHP syntaxi pro práci s datem, funkcemi, poli a parametry.',
        { exact: true },
      ),
    ).toBeVisible();
  });
});

test.describe('F3 lesson composition and deep links', () => {
  test('forms and CRUD lesson keeps its task deep link and learning objective', async ({
    page,
  }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-9?slide=tasks');

    await expectSelectedOutlineSlide(page, 'Úkoly dle tutoriálu');
    await expect.poll(() => new URL(page.url()).searchParams.get('slide')).toBe('tasks');
    await expect(
      page.getByText(
        'Vysvětlíte životní cyklus serverového formuláře a procvičíte validaci vstupů i základní CRUD operace.',
        { exact: true },
      ),
    ).toBeVisible();
  });

  test('sessions and cookies lesson keeps its task deep link and learning objective', async ({
    page,
  }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-10-sessions-cookies?slide=tasks');

    await expectSelectedOutlineSlide(page, 'Úkoly');
    await expect.poll(() => new URL(page.url()).searchParams.get('slide')).toBe('tasks');
    await expect(
      page.getByText(
        'Vysvětlíte cookies a session v PHP a použijete jejich bezpečnostní atributy v praktických vzorech.',
        { exact: true },
      ),
    ).toBeVisible();
  });

  test('files and JSON lesson keeps its task deep link and learning objective', async ({
    page,
  }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-11-files-json?slide=tasks');

    await expectSelectedOutlineSlide(page, 'Úkoly');
    await expect.poll(() => new URL(page.url()).searchParams.get('slide')).toBe('tasks');
    await expect(
      page.getByText(
        'Použijete PHP pro bezpečnou práci se soubory, JSON daty a stránkovaným úložištěm uživatelů.',
        { exact: true },
      ),
    ).toBeVisible();
  });

  test('authentication lesson keeps its task deep link and learning objective', async ({
    page,
  }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-12-auth?slide=tasks');

    await expectSelectedOutlineSlide(page, 'Úkoly');
    await expect.poll(() => new URL(page.url()).searchParams.get('slide')).toBe('tasks');
    await expect(
      page.getByText(
        'Rozlišíte autentizaci a autorizaci, bezpečně uložíte hesla a ochráníte session po přihlášení.',
        { exact: true },
      ),
    ).toBeVisible();
  });
});
