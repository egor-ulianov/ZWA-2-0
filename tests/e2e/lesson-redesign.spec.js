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
  test('opening slides combine the lesson title with its contents', async ({ page }) => {
    await installDeterministicNetwork(page);

    const openingSlides = [
      { route: '/interactive-zwa-2?slide=title', content: 'Selektory a specifita' },
      {
        route: '/interactive-zwa-5-css-ii?slide=title',
        content: 'Box model (padding/border/margin)',
      },
      { route: '/interactive-zwa-5-js?slide=title', content: 'Přehled jazyka a prostředí' },
      { route: '/interactive-zwa-8-php?slide=title', content: '1 – Výpis aktuálního data' },
      {
        route: '/interactive-zwa-9?slide=title',
        content: '1 – Životní cyklus formuláře na serveru',
      },
      {
        route: '/interactive-zwa-10-sessions-cookies?slide=title',
        content: '1 – Co jsou cookies a session, superglobály',
      },
      {
        route: '/interactive-zwa-11-files-json?slide=title',
        content: '1 – Práce se soubory v PHP:',
      },
      {
        route: '/interactive-zwa-12-auth?slide=title',
        content: '1 – Pojmy: Autentikace vs Autorizace',
      },
    ];

    for (const openingSlide of openingSlides) {
      await page.goto(openingSlide.route);
      await expect(
        page.getByRole('navigation', { name: 'Osnova kurzu' }).getByRole('button', {
          name: 'Obsah',
          exact: true,
        }),
      ).toHaveCount(0);
      await expect(page.getByText(openingSlide.content, { exact: false })).toBeVisible();
    }
  });

  test('CSS II references are rendered as usable hyperlinks', async ({ page }) => {
    await installDeterministicNetwork(page);
    await page.goto('/interactive-zwa-5-css-ii?slide=links');

    const links = page.getByRole('region', { name: 'Odkazy' }).getByRole('link');
    await expect(links).toHaveCount(8);
    await expect(links.first()).toHaveAttribute(
      'href',
      'https://cw.fel.cvut.cz/wiki/courses/b6b39zwa/tutorials/05/start',
    );
    await expect(links.nth(1)).toHaveAttribute(
      'href',
      'https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/The_box_model',
    );
  });

  test('lecture quizzes share a rich shell while keeping individual teaching visuals', async ({
    page,
  }) => {
    await installDeterministicNetwork(page);

    const quizRoutes = [
      { route: '/interactive-zwa-1?slide=quiz-html', visual: 'html-structure' },
      { route: '/interactive-zwa-2?slide=quiz-css', visual: 'css-specificity' },
      { route: '/interactive-zwa-5-css-ii?slide=quiz-css', visual: 'css-layout' },
      { route: '/interactive-zwa-5-js?slide=quiz-css', visual: 'javascript-event-loop' },
      { route: '/interactive-zwa-7?slide=quiz', visual: 'javascript-dom-ajax' },
    ];

    for (const quizRoute of quizRoutes) {
      await page.goto(quizRoute.route);
      const quiz = page.locator('[data-lesson-quiz]');
      await expect(quiz).toBeVisible();
      await expect(quiz.getByText('Rychlá kontrola', { exact: true })).toBeVisible();
      await expect(quiz.locator('[data-quiz-visual]')).toHaveAttribute(
        'data-quiz-visual',
        quizRoute.visual,
      );
      await expect(quiz.locator('[data-quiz-progress]')).toHaveText(/0 \/ \d+ zodpovězeno/);

      await quiz.locator('[data-quiz-option]').first().click();
      await expect(quiz.locator('[data-quiz-progress]')).toHaveText(/1 \/ \d+ zodpovězeno/);
    }
  });

  test('HTML5 lesson keeps its task deep link and learning objective', async ({ page }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-1-html5?slide=tasks');

    await expectSelectedOutlineSlide(page, 'Kostra dokumentu');
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

    await expectSelectedOutlineSlide(page, 'Standardní prvky');
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

    await expectSelectedOutlineSlide(page, 'DNS: host / nslookup');
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

    await expectSelectedOutlineSlide(page, '1) Nadpis');
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

    await expectSelectedOutlineSlide(page, 'Box model');
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

    await expectSelectedOutlineSlide(page, '1) Proměnné a typy');
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
    await expect(page.getByRole('textbox')).toHaveCount(1);
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

    await expectSelectedOutlineSlide(page, 'Úkol 1: Úprava formuláře + otázky');
    await expect.poll(() => new URL(page.url()).searchParams.get('slide')).toBe('task1');
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

    await expectSelectedOutlineSlide(page, 'Úkol 1: Nastavte cookie s tématem vzhledu');
    await expect.poll(() => new URL(page.url()).searchParams.get('slide')).toBe('task1');
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

    await expectSelectedOutlineSlide(page, 'Úkol 1: První experimenty se soubory');
    await expect.poll(() => new URL(page.url()).searchParams.get('slide')).toBe('task1');
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

    await expectSelectedOutlineSlide(page, 'Úkol 1: Přihlašovací formulář');
    await expect.poll(() => new URL(page.url()).searchParams.get('slide')).toBe('task1');
    await expect(
      page.getByText(
        'Rozlišíte autentizaci a autorizaci, bezpečně uložíte hesla a ochráníte session po přihlášení.',
        { exact: true },
      ),
    ).toBeVisible();
  });
});
