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

const editorialTheoryCases = [
  {
    route: '/interactive-zwa-1?slide=theory',
    topics: [
      'DNS – překládání jmen',
      'IP adresy – jak se zařízení najdou',
      'TCP – spolehlivý přenos',
      'HTTP – jazyk webu',
      'HTTPS – šifrované HTTP',
      'Jak to souvisí s úlohami',
    ],
  },
  {
    route: '/interactive-zwa-2?slide=theory',
    topics: ['Selektory a specifita', 'Kaskáda a dědičnost', 'Stavové selektory odkazů'],
  },
  {
    route: '/interactive-zwa-5-css-ii?slide=theory',
    topics: [
      'Box model',
      'Float & Clear',
      'Position',
      'Display',
      'Flexbox',
      'Media queries',
      'Print',
    ],
  },
  {
    route: '/interactive-zwa-5-js?slide=theory',
    topics: [
      'Přehled jazyka',
      'Proměnné a typy',
      'Funkce a cykly',
      'Pole a objekty',
      'DOM a události',
      'alert/confirm',
    ],
  },
  {
    route: '/interactive-zwa-8-php?slide=theory',
    topics: [
      'Co je PHP?',
      'Proč se PHP stále používá',
      'Hlavní koncepty jazyka',
      'Moderní PHP (8.x)',
      'Ekosystém a praxe',
      'Bezpečnostní minimum',
      'Verze a prostředí',
    ],
  },
];

const allLectureIllustrationCases = [
  '/interactive-zwa-1-html5?slide=sections',
  '/interactive-zwa-2-forms?slide=playground',
  '/interactive-zwa-1?slide=theory',
  '/interactive-zwa-2?slide=theory',
  '/interactive-zwa-5-css-ii?slide=theory',
  '/interactive-zwa-5-js?slide=theory',
  '/interactive-zwa-7?slide=ajax-theory',
  '/interactive-zwa-8-php?slide=theory',
  '/interactive-zwa-9?slide=theory-lifecycle',
  '/interactive-zwa-10-sessions-cookies?slide=theory-session-lifecycle',
  '/interactive-zwa-11-files-json?slide=theory-json',
  '/interactive-zwa-12-auth?slide=theory-login-session',
];

async function openLessonOutline(page) {
  const trigger = page.getByRole('button', { name: 'Osnova lekce' });
  await trigger.click();
  return page.getByRole('dialog', { name: 'Osnova lekce' });
}

function outlineButton(outline, name) {
  return outline.getByRole('button').filter({ hasText: name });
}

test.describe('early lesson theory and task outline', () => {
  test('migrated theory lectures read as complete editorial chapters without nested steppers', async ({
    page,
  }) => {
    await installDeterministicNetwork(page);

    for (const testCase of editorialTheoryCases) {
      await page.goto(testCase.route);
      const theory = page.locator('[data-theory-flow="true"]');

      await expect(theory).toBeVisible();
      await expect(theory.locator('[data-theory-topic="true"]')).toHaveCount(
        testCase.topics.length,
      );
      for (const topic of testCase.topics) {
        const section = theory
          .locator('[data-theory-topic="true"]')
          .filter({ has: page.getByRole('heading', { level: 3, name: topic, exact: true }) });
        await expect(section).toBeVisible();
        expect(await section.locator('p').count()).toBeGreaterThanOrEqual(1);
      }
      await expect(theory.getByRole('button', { name: 'Předchozí', exact: true })).toHaveCount(0);
      await expect(theory.getByRole('button', { name: 'Další', exact: true })).toHaveCount(0);
      await expect(theory.getByText(/Krok \d+ \/ \d+/)).toHaveCount(0);
    }
  });

  test('every lecture integrates one unique transparent illustration between teaching blocks', async ({
    page,
  }) => {
    await installDeterministicNetwork(page);
    const sources = [];

    for (const route of allLectureIllustrationCases) {
      await page.goto(route);
      const illustration = page.locator('[data-editorial-illustration="true"]');

      await expect(illustration).toHaveCount(1);
      await expect(illustration.locator('img')).toHaveAttribute('alt', /\S+/);
      await expect(illustration.locator('figcaption')).toHaveCount(0);
      expect(
        await illustration.evaluate((element) => {
          const styles = getComputedStyle(element);
          return {
            backgroundColor: styles.backgroundColor,
            borderStyle: styles.borderStyle,
          };
        }),
      ).toEqual({ backgroundColor: 'rgba(0, 0, 0, 0)', borderStyle: 'none' });
      expect(
        await illustration.evaluate(
          (figure) => Boolean(figure.previousElementSibling) && Boolean(figure.nextElementSibling),
        ),
      ).toBe(true);

      await illustration.scrollIntoViewIfNeeded();
      await expect
        .poll(() => illustration.locator('img').evaluate((image) => image.naturalWidth), {
          timeout: 10_000,
        })
        .toBeGreaterThan(0);
      const image = illustration.locator('img');
      sources.push(await image.getAttribute('src'));
      const cornerAlphas = await image.evaluate((element) => {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const context = canvas.getContext('2d');
        const corners = [
          [0, 0],
          [element.naturalWidth - 1, 0],
          [0, element.naturalHeight - 1],
          [element.naturalWidth - 1, element.naturalHeight - 1],
        ];
        return corners.map(([x, y]) => {
          context.clearRect(0, 0, 1, 1);
          context.drawImage(element, x, y, 1, 1, 0, 0, 1, 1);
          return context.getImageData(0, 0, 1, 1).data[3];
        });
      });
      expect(cornerAlphas.filter((alpha) => alpha === 0).length).toBeGreaterThanOrEqual(2);
    }

    expect(new Set(sources).size).toBe(allLectureIllustrationCases.length);
  });

  test('editorial theory remains readable without horizontal overflow at 320 pixels', async ({
    page,
  }) => {
    await installDeterministicNetwork(page);
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto('/interactive-zwa-2?slide=theory');

    await expect(page.locator('[data-theory-flow="true"]')).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    ).toBe(true);
  });

  test('lecture code examples use read-only syntax highlighting', async ({ page }) => {
    await installDeterministicNetwork(page);
    await page.goto('/interactive-zwa-7?slide=ajax-practice');

    const codeBlock = page.locator('figure[data-language]').first();
    await expect(codeBlock).toBeVisible();
    await expect(codeBlock).toHaveAttribute('data-language', 'js');
    await expect(codeBlock.locator('pre code')).toContainText('function loadDoc()');

    await page.goto('/interactive-zwa-7?mode=projector&slide=ajax-practice');
    await expect(page.getByText('function loadDoc()', { exact: false })).toBeVisible();
  });

  test('PHP and shell lecture examples use their matching language modes', async ({ page }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-9?slide=theory-lifecycle');
    const phpBlock = page.locator('figure[data-language]').first();
    await expect(phpBlock).toHaveAttribute('data-language', 'php');
    await expect(phpBlock.locator('pre code')).toBeVisible();

    await page.goto('/interactive-zwa-8-php?slide=ssh');
    const shellBlock = page.locator('figure[data-language]').first();
    await expect(shellBlock).toHaveAttribute('data-language', 'bash');
    await expect(shellBlock.locator('pre code')).toBeVisible();
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

      const outline = await openLessonOutline(page, testCase.route);
      for (const task of testCase.tasks) {
        await expect(outlineButton(outline, task)).toBeVisible();
      }
    });
  }

  test('HTML5 aggregate task deep link opens its first outline task workspace', async ({
    page,
  }) => {
    await installDeterministicNetwork(page);
    await page.goto('/interactive-zwa-1-html5?slide=tasks');

    const outline = await openLessonOutline(page, '/interactive-zwa-1-html5?slide=tasks');
    await expect(outlineButton(outline, 'Kostra dokumentu')).toHaveAttribute(
      'aria-current',
      'step',
    );
    await page.keyboard.press('Escape');
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
      for (const task of testCase.tasks) {
        const outline = await openLessonOutline(page, testCase.route);
        await outlineButton(outline, task).click();
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
    const editor = ide.locator('[data-studio-editor="true"] .cm-content');
    await editor.click();
    await page.keyboard.press('Control+End');
    await page.keyboard.type('TEST-STATE-NEPŘENÁŠET');

    const outline = await openLessonOutline(
      page,
      '/interactive-zwa-1-html5?slide=html-task-skeleton',
    );
    await outlineButton(outline, 'Sémantická struktura').click();
    await expect(ide.locator('[data-studio-editor="true"] .cm-content')).not.toContainText(
      'TEST-STATE-NEPŘENÁŠET',
    );
  });

  test('each forms task opens a starter that matches its assignment', async ({ page }) => {
    await installDeterministicNetwork(page);
    await page.goto('/interactive-zwa-2-forms?slide=forms-task-meter');

    await expect(page.getByRole('region', { name: 'IDE' }).locator('.cm-content')).toContainText(
      '<meter',
    );
    const outline = await openLessonOutline(
      page,
      '/interactive-zwa-2-forms?slide=forms-task-meter',
    );
    await outline.getByRole('button', { name: /Datalist/ }).click();
    await expect(page.getByRole('region', { name: 'IDE' }).locator('.cm-content')).toContainText(
      '<datalist',
    );
  });

  test('network task alias opens the first terminal task and has no legacy task sidebar', async ({
    page,
  }) => {
    await installDeterministicNetwork(page);
    await page.goto('/interactive-zwa-1?slide=tasks-net');

    const outline = await openLessonOutline(page, '/interactive-zwa-1?slide=tasks-net');
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

    await page.keyboard.press('Escape');
    await page.getByRole('tab', { name: 'Řešení', exact: true }).click();
    await expect(page.getByRole('region', { name: 'IDE' })).toContainText('host cvut.cz');
    await expect(
      page
        .getByRole('region', { name: 'IDE' })
        .locator('[data-solution-panel] [contenteditable="false"]'),
    ).toHaveCount(1);
  });

  test('network task workspace stays inside the active slide card', async ({ page }) => {
    await installDeterministicNetwork(page);
    await page.goto('/interactive-zwa-1?slide=network-task-dns');

    const slide = page.getByRole('region', { name: 'DNS: host / nslookup' });
    await expect(slide.getByRole('region', { name: 'Zadání' })).toHaveCount(1);
    await expect(slide.getByRole('region', { name: 'IDE' })).toHaveCount(1);
    await expect(slide.getByRole('region', { name: 'Náhled' })).toHaveCount(1);
    await expect(slide.getByRole('region', { name: 'Ověření' })).toHaveCount(1);
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

    const outline = await openLessonOutline(page, '/interactive-zwa-1?slide=network-task-dns');
    await outline
      .getByRole('button', { name: /Lokální síť a konektivita: ifconfig \/ ping/ })
      .click();
    await solutionTab.click();
    await expect(ide.locator('[data-solution-panel]')).toContainText(
      'grep 192.168. ifconfigresult.txt',
    );
    await expect(ide.locator('[data-solution-panel]')).toContainText('ping seznam.cz');
  });
});
