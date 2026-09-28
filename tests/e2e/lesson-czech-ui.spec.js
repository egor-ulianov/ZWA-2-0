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
  '/interactive-zwa-7?slide=task1',
  '/interactive-zwa-8-php?slide=t1',
  '/interactive-zwa-9?slide=tasks',
  '/interactive-zwa-10-sessions-cookies?slide=tasks',
  '/interactive-zwa-11-files-json?slide=tasks',
  '/interactive-zwa-12-auth?slide=tasks',
];

function usesNewExerciseStage(route) {
  return (
    route.includes('interactive-zwa-1-html5') ||
    route.includes('interactive-zwa-2-forms') ||
    route.includes('interactive-zwa-1?') ||
    route.includes('interactive-zwa-2?') ||
    route.includes('interactive-zwa-5-css-ii') ||
    route.includes('interactive-zwa-5-js')
  );
}

async function expectTaskWorkspace(page, route) {
  if (usesNewExerciseStage(route)) {
    await expect(page.getByRole('button', { name: 'Osnova lekce' })).toHaveCount(1);
    await expect(page.getByRole('navigation', { name: 'Osnova kurzu' })).toHaveCount(0);
    for (const label of ['Zadání', 'IDE', 'Náhled', 'Ověření']) {
      await expect(page.getByRole('region', { name: label })).toHaveCount(1);
      await expect(page.getByRole('region', { name: label })).toBeVisible();
    }
    const verification = page.getByRole('region', { name: 'Ověření' });
    await expect(
      verification.getByRole('button', { name: 'Spustit ověření', exact: true }),
    ).toBeVisible();
    return;
  }
  await expect(page.getByRole('navigation', { name: 'Osnova kurzu' })).toHaveCount(1);
  await expect(page.getByRole('navigation', { name: 'Navigace mezi snímky' })).toHaveCount(0);

  for (const label of ['Zadání', 'IDE', 'Náhled a testy']) {
    await expect(page.getByRole('region', { name: label })).toHaveCount(1);
    await expect(page.getByRole('region', { name: label })).toBeVisible();
  }

  const preview = page.getByRole('region', { name: 'Náhled a testy' });
  await expect(preview.getByRole('button', { name: 'Spustit testy', exact: true })).toHaveCount(1);
  await expect(preview.getByRole('button', { name: 'Spustit testy', exact: true })).toBeVisible();
}

test.describe('Czech unified lesson task workspace integration', () => {
  for (const route of taskRoutes) {
    test(`${route} exposes one Czech outline and one task workspace`, async ({ page }) => {
      await installDeterministicNetwork(page);

      const response = await page.goto(route);
      expect(response).not.toBeNull();
      expect(response.ok()).toBe(true);

      await expectTaskWorkspace(page, route);
    });
  }

  for (const route of taskRoutes) {
    test(`${route} strips the complete task workspace in projector mode`, async ({ page }) => {
      await installDeterministicNetwork(page);

      const response = await page.goto(route.replace('?', '?mode=projector&'));
      expect(response).not.toBeNull();
      expect(response.ok()).toBe(true);
      await expect(page.getByRole('main')).toHaveCount(1);
      await expect(page.getByRole('main')).toBeVisible();

      await expect(page.getByRole('navigation', { name: 'Osnova kurzu' })).toHaveCount(0);
      await expect(page.getByRole('navigation', { name: 'Navigace mezi snímky' })).toHaveCount(
        usesNewExerciseStage(route) ? 1 : 0,
      );
      await expect(page.locator('[data-projector-private]')).toHaveCount(0);
      await expect(page.getByRole('region', { name: 'Zadání' })).toHaveCount(0);
      await expect(page.getByRole('region', { name: 'IDE' })).toHaveCount(0);
      await expect(page.getByRole('region', { name: 'Náhled a testy' })).toHaveCount(0);
      await expect(page.getByRole('region', { name: 'Náhled' })).toHaveCount(0);
      await expect(page.getByRole('region', { name: 'Ověření' })).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Spustit testy', exact: true })).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Spustit ověření', exact: true })).toHaveCount(
        0,
      );
      await expect(page.getByText('Plocha úkolu', { exact: true })).toHaveCount(0);
    });
  }

  test('the JavaScript task workspace fits at 320px without horizontal overflow', async ({
    page,
  }) => {
    await installDeterministicNetwork(page);
    await page.setViewportSize({ width: 320, height: 720 });

    await page.goto('/interactive-zwa-5-js?slide=tasks');
    await expect(page.getByRole('region', { name: 'Náhled' })).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    ).toBe(true);
  });

  test('editor arrow and boundary keys do not navigate away from the task slide', async ({
    page,
  }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-5-js?slide=tasks');
    const editor = page.getByRole('textbox').first();
    await editor.focus();

    for (const key of ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Home', 'End']) {
      await editor.press(key);
      await expect(page).toHaveURL(/slide=tasks/);
    }
  });

  test('student task pages link back to the lesson catalogue', async ({ page }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-1-html5?slide=tasks');

    const catalogueLink = page.getByRole('link', { name: 'ZWA' });
    await expect(catalogueLink).toHaveAttribute('href', '/');
    await expect(catalogueLink).toBeVisible();
  });

  test('projector task pages omit the catalogue return link', async ({ page }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-1-html5?mode=projector&slide=tasks');

    await expect(page.getByRole('link', { name: '← Zpět na přehled lekcí' })).toHaveCount(0);
  });

  test('CSS, CSS II and JavaScript expose each exercise in the course outline and IDE tabs', async ({
    page,
  }) => {
    const cases = [
      {
        route: '/interactive-zwa-2?slide=tasks',
        tasks: [
          '1) Vytvořte link na stylopis',
          '2) Změňte barvu nadpisu v CSS',
          '1) Nadpis',
          '2) Odkazy ve footeru',
          '3) První písmeno',
          '4) Submenu jako písmena',
          '5) Hover efekt na obrázku',
        ],
        files: ['index.html', 'style.css'],
        legacyTablist: 'Kroky úlohy CSS',
      },
      {
        route: '/interactive-zwa-5-css-ii?slide=tasks',
        tasks: [
          'Box model',
          'Float/Clear',
          'Position',
          'Display',
          'Flexbox',
          'Responzivita (@media)',
          'Print stylesheet',
        ],
        files: ['index.html', 'style.css'],
        legacyTablist: 'Kroky úlohy CSS II',
      },
      {
        route: '/interactive-zwa-5-js?slide=tasks',
        tasks: [
          '1) Proměnné a typy',
          '2) Funkce a podmínky',
          '3) Cykly (for)',
          '4) Pole a objekty',
          '5) DOM selektory',
          '6) Události',
          '7) alert/confirm (wrapper)',
        ],
        files: ['main.js'],
        legacyTablist: 'Kroky úlohy JavaScript',
      },
    ];

    for (const testCase of cases) {
      await installDeterministicNetwork(page);
      await page.goto(testCase.route);

      const ide = page.getByRole('region', { name: 'IDE' });
      await expect(ide.getByRole('tablist', { name: 'Soubory IDE' })).toBeVisible();
      await expect(ide.getByRole('tab', { name: 'Řešení', exact: true })).toBeVisible();
      await expect(ide.getByRole('tab', { name: 'Řešení', exact: true })).toHaveAttribute(
        'data-solution-tab',
        'true',
      );
      await ide.getByRole('tab', { name: 'Řešení', exact: true }).click();
      await expect(ide.locator('[data-solution-panel="true"]')).toBeVisible();
      await expect(ide.locator('[data-solution-panel="true"] .cm-content').first()).toHaveAttribute(
        'contenteditable',
        'false',
      );
      for (const file of testCase.files) {
        await expect(ide.getByRole('tab', { name: file, exact: true })).toBeVisible();
      }
      await expect(page.getByRole('tablist', { name: testCase.legacyTablist })).toHaveCount(0);
      await page.getByRole('button', { name: 'Osnova lekce' }).click();
      const outline = page.getByRole('dialog', { name: 'Osnova lekce' });
      for (const task of testCase.tasks) {
        await expect(outline.getByRole('button').filter({ hasText: task })).toBeVisible();
      }
    }
  });
});
