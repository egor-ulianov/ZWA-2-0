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
  test('lecture code examples use read-only syntax highlighting', async ({ page }) => {
    await installDeterministicNetwork(page);
    await page.goto('/interactive-zwa-7?slide=ajax-practice');

    const codeBlock = page.locator('[data-theory-code-block]').first();
    await expect(codeBlock).toBeVisible();
    await expect(codeBlock).toHaveAttribute('data-language', 'js');
    await expect(codeBlock.locator('.cm-editor')).toBeVisible();
    await expect(codeBlock.locator('.cm-content')).toHaveAttribute('contenteditable', 'false');

    await page.goto('/interactive-zwa-7?mode=projector&slide=ajax-practice');
    await expect(page.getByText('function loadDoc()', { exact: false })).toBeVisible();
  });

  test('PHP and shell lecture examples use their matching language modes', async ({ page }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-9?slide=theory-lifecycle');
    const phpBlock = page.locator('[data-theory-code-block]').first();
    await expect(phpBlock).toHaveAttribute('data-language', 'php');
    await expect(phpBlock.locator('.cm-editor')).toBeVisible();

    await page.goto('/interactive-zwa-8-php?slide=ssh');
    const shellBlock = page.locator('[data-theory-code-block]').first();
    await expect(shellBlock).toHaveAttribute('data-language', 'bash');
    await expect(shellBlock.locator('.cm-editor')).toBeVisible();
  });

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

  test('switching an HTML5 outline task starts that task with its own draft', async ({ page }) => {
    await installDeterministicNetwork(page);
    await page.goto('/interactive-zwa-1-html5?slide=html-task-skeleton');

    const ide = page.getByRole('region', { name: 'IDE' });
    const editor = ide.locator('[data-code-editor="syntax"] .cm-content');
    await editor.click();
    await page.keyboard.press('Control+End');
    await page.keyboard.type('TEST-STATE-NEPŘENÁŠET');

    await page
      .getByRole('navigation', { name: 'Osnova kurzu' })
      .getByRole('button', { name: 'Sémantická struktura', exact: true })
      .click();
    await expect(ide.locator('[data-code-editor="syntax"] .cm-content')).not.toContainText(
      'TEST-STATE-NEPŘENÁŠET',
    );
  });

  test('each forms task opens a starter that matches its assignment', async ({ page }) => {
    await installDeterministicNetwork(page);
    await page.goto('/interactive-zwa-2-forms?slide=forms-task-meter');

    await expect(page.getByRole('region', { name: 'IDE' }).locator('.cm-content')).toContainText(
      '<meter',
    );
    await page
      .getByRole('navigation', { name: 'Osnova kurzu' })
      .getByRole('button', { name: 'Datalist', exact: true })
      .click();
    await expect(page.getByRole('region', { name: 'IDE' }).locator('.cm-content')).toContainText(
      '<datalist',
    );
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

  test('network theory does not render a terminal outside a task workspace', async ({ page }) => {
    await installDeterministicNetwork(page);
    await page.goto('/interactive-zwa-1?slide=theory');

    await expect(page.getByRole('textbox')).toHaveCount(0);
    await expect(page.getByRole('region', { name: 'IDE' })).toHaveCount(0);
  });

  test('network solution tabs contain every command sequence expected by their tasks', async ({
    page,
  }) => {
    await installDeterministicNetwork(page);
    await page.goto('/interactive-zwa-1?slide=network-task-dns');
    const ide = page.getByRole('region', { name: 'IDE' });
    const solutionTab = ide.getByRole('tab', { name: 'Řešení', exact: true });

    await solutionTab.click();
    await expect(ide.locator('[data-solution-panel]')).toContainText('nslookup -type=txt cvut.cz');

    await page
      .getByRole('navigation', { name: 'Osnova kurzu' })
      .getByRole('button', { name: 'Lokální síť a konektivita: ifconfig / ping', exact: true })
      .click();
    await solutionTab.click();
    await expect(ide.locator('[data-solution-panel]')).toContainText(
      'grep 192.168. ifconfigresult.txt',
    );
    await expect(ide.locator('[data-solution-panel]')).toContainText('ping seznam.cz');
  });
});
