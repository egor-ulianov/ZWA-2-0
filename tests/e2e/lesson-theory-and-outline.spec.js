import { createRequire } from 'node:module';

const { expect, test } = createRequire(import.meta.url)('@playwright/test');
import { installDeterministicNetwork } from './helpers/browser.js';

const earlyLessonCases = [
  {
    route: '/interactive-zwa-1-html5?slide=sections',
    tasks: ['Kostra dokumentu', 'Sémantická struktura', 'Média a tabulka'],
  },
  {
    route: '/interactive-zwa-2-forms?slide=playground',
    tasks: [
      'Standardní prvky',
      'Seskupení polí',
      'Atributy',
      'HTML5 inputy',
      'Meter a progress',
      'Datalist',
    ],
  },
];

test.describe('early lesson theory and task outline', () => {
  for (const testCase of earlyLessonCases) {
    test(`${testCase.route} is theory-only and exposes named tasks in the outline`, async ({
      page,
    }) => {
      await installDeterministicNetwork(page);
      await page.goto(testCase.route);

      const content = page.getByRole('main');
      await expect(content.getByRole('tablist')).toHaveCount(0);
      await expect(content.getByRole('textbox')).toHaveCount(0);
      for (const legacyControl of ['Teorie', 'Příklady', 'Vyzkoušet', 'Úkol']) {
        await expect(content.getByRole('button', { name: legacyControl, exact: true })).toHaveCount(
          0,
        );
      }

      const outline = page.getByRole('navigation', { name: 'Osnova kurzu' });
      for (const task of testCase.tasks) {
        await expect(outline.getByRole('button', { name: task, exact: true })).toBeVisible();
      }
    });
  }

  test('HTML5 aggregate task deep link opens its first outline task workspace', async ({
    page,
  }) => {
    await installDeterministicNetwork(page);
    await page.goto('/interactive-zwa-1-html5?slide=tasks');

    const outline = page.getByRole('navigation', { name: 'Osnova kurzu' });
    await expect(
      outline.getByRole('button', { name: 'Kostra dokumentu', exact: true }),
    ).toHaveAttribute('aria-current', 'step');
    await expect(page.getByRole('region', { name: 'IDE' })).toBeVisible();
  });

  test('each HTML5 and forms outline task uses a file plus final read-only solution tab', async ({
    page,
  }) => {
    const cases = [
      {
        route: '/interactive-zwa-1-html5?slide=tasks',
        tasks: ['Kostra dokumentu', 'Sémantická struktura', 'Média a tabulka'],
      },
      {
        route: '/interactive-zwa-2-forms?slide=tasks',
        tasks: [
          'Standardní prvky',
          'Seskupení polí',
          'Atributy',
          'HTML5 inputy',
          'Meter a progress',
          'Datalist',
        ],
      },
    ];

    for (const testCase of cases) {
      await installDeterministicNetwork(page);
      await page.goto(testCase.route);
      const outline = page.getByRole('navigation', { name: 'Osnova kurzu' });

      for (const task of testCase.tasks) {
        await outline.getByRole('button', { name: task, exact: true }).click();
        const ide = page.getByRole('region', { name: 'IDE' });
        const tabs = ide.getByRole('tablist', { name: 'Soubory IDE' });
        await expect(tabs).toBeVisible();
        await expect(tabs.getByRole('tab').last()).toHaveText('Řešení');
        await expect(tabs.getByRole('tab').last()).toHaveAttribute('data-solution-tab', 'true');
        await tabs.getByRole('tab', { name: 'Řešení', exact: true }).click();
        await expect(ide.locator('[data-solution-panel] [contenteditable="false"]')).toHaveCount(1);
      }
    }
  });

  test('network task alias opens the first terminal task and has no legacy task sidebar', async ({
    page,
  }) => {
    await installDeterministicNetwork(page);
    await page.goto('/interactive-zwa-1?slide=tasks-net');

    const outline = page.getByRole('navigation', { name: 'Osnova kurzu' });
    for (const task of [
      'DNS: host / nslookup',
      'Lokální síť a konektivita: ifconfig / ping',
      'Směrování: traceroute',
      'TCP/HTTP: telnet',
    ]) {
      await expect(outline.getByRole('button', { name: task, exact: true })).toBeVisible();
    }

    await expect(page.getByRole('tablist', { name: 'Soubory IDE' })).toHaveCount(1);
    await expect(page.getByRole('tablist', { name: /Kroky|Úkol/ })).toHaveCount(0);
    await expect(page.getByRole('tab', { name: 'terminál', exact: true })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Řešení', exact: true })).toBeVisible();

    await page.getByRole('tab', { name: 'Řešení', exact: true }).click();
    await expect(page.getByRole('region', { name: 'IDE' })).toContainText('host cvut.cz');
    await expect(
      page
        .getByRole('region', { name: 'IDE' })
        .locator('[data-solution-panel] [contenteditable="false"]'),
    ).toHaveCount(1);
  });
});
