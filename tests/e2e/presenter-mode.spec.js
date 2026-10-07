import { createRequire } from 'node:module';

const { expect, test } = createRequire(import.meta.url)('@playwright/test');
import { lessons } from '../../src/config/lessons.js';
import { installDeterministicNetwork } from './helpers/browser.js';

test.describe('lesson projector and presenter modes', () => {
  test('every lesson exposes a direct presentation action for its active section', async ({
    page,
  }) => {
    await installDeterministicNetwork(page);

    for (const lesson of lessons) {
      await page.goto(lesson.href);
      const presentationLink = page.getByRole('link', { name: 'Spustit prezentaci' });
      await expect(presentationLink).toBeVisible();
      await expect(presentationLink).toHaveAttribute('href', /^\?mode=projector&slide=[a-z0-9-]+$/);
    }
  });

  test('projector uses a fitted widescreen slide with presentation-sized text and no scrolling', async ({
    page,
  }) => {
    await installDeterministicNetwork(page);
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto('/interactive-zwa-1-html5?mode=projector&slide=sections');

    const slide = page.locator('[data-presentation-slide]');
    const content = page.locator('[data-presentation-content]');
    await expect(slide).toBeVisible();
    await expect(content).toBeVisible();
    await expect(content).toHaveAttribute('data-presentation-ready', 'true');
    await expect(content).toHaveAttribute('data-presentation-pages', /^(?:[2-9]|\d{2,})$/);
    await expect(page.getByRole('button', { name: 'Celá obrazovka' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ukončit prezentaci' })).toHaveAttribute(
      'href',
      '?slide=sections',
    );

    const layout = await page.evaluate(() => {
      const slideElement = document.querySelector('[data-presentation-slide]');
      const contentElement = document.querySelector('[data-presentation-content]');
      const paragraph = contentElement?.querySelector('p, li, td, th');
      const heading = slideElement?.querySelector('h1');
      const slideRect = slideElement?.getBoundingClientRect();
      const visibleTextSizes = slideElement
        ? Array.from(
            slideElement.querySelectorAll(
              'p, span, small, a, button, h1, h2, h3, h4, h5, h6, li, td, th, figcaption, code',
            ),
          )
            .filter((element) => element.getClientRects().length > 0 && element.textContent?.trim())
            .map((element) => Number.parseFloat(getComputedStyle(element).fontSize))
        : [];
      return {
        bodyScrollHeight: document.documentElement.scrollHeight,
        bodyScrollWidth: document.documentElement.scrollWidth,
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth,
        slideWidth: slideRect?.width || 0,
        slideHeight: slideRect?.height || 0,
        contentFits:
          contentElement != null && contentElement.scrollHeight <= contentElement.clientHeight + 1,
        contentPages: Number(contentElement?.getAttribute('data-presentation-pages') || 0),
        bodyFontSize: paragraph ? Number.parseFloat(getComputedStyle(paragraph).fontSize) : 0,
        headingFontSize: heading ? Number.parseFloat(getComputedStyle(heading).fontSize) : 0,
        minimumTextSize: Math.min(...visibleTextSizes),
      };
    });

    expect(layout.bodyScrollHeight).toBeLessThanOrEqual(layout.viewportHeight + 1);
    expect(layout.bodyScrollWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
    expect(layout.slideWidth).toBeGreaterThanOrEqual(layout.viewportWidth * 0.92);
    expect(layout.slideWidth / layout.slideHeight).toBeCloseTo(16 / 9, 1);
    expect(layout.contentFits).toBe(true);
    expect(layout.contentPages).toBeGreaterThan(1);
    expect(layout.bodyFontSize).toBeGreaterThanOrEqual(24);
    expect(layout.headingFontSize).toBeGreaterThanOrEqual(48);
    expect(layout.minimumTextSize).toBeGreaterThanOrEqual(16);

    await page.keyboard.press('ArrowRight');
    await expect(page).toHaveURL(/mode=projector.*slide=sections/);
    await expect(content).toHaveAttribute('data-presentation-page', '2');
  });

  test('projector omits student navigation and advances with the keyboard', async ({ page }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-1-html5?mode=projector&slide=intro');
    await expect(page.getByRole('navigation', { name: /Osnova kurzu/i })).toHaveCount(0);
    await expect(page.getByText('01 / 07')).toBeVisible();
    await expect(page.getByText('Sestavíme minimální validní HTML5 dokument.')).toBeVisible();
    await expect(page.locator('textarea, iframe')).toHaveCount(0);
    const presentationContent = page.locator('[data-presentation-content]');
    await expect(presentationContent).toHaveAttribute('data-presentation-ready', 'true');
    const pageCount = Number(await presentationContent.getAttribute('data-presentation-pages'));

    for (let pageNumber = 1; pageNumber < pageCount; pageNumber += 1) {
      await page.keyboard.press('ArrowRight');
      await expect(page).toHaveURL(/mode=projector.*slide=intro/);
    }
    await page.keyboard.press('ArrowRight');
    await expect(page).toHaveURL(/mode=projector.*slide=quiz/);
  });

  test('invalid lesson modes fall back to the student shell', async ({ page }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-1-html5?mode=unknown&slide=intro');
    await expect(page.locator('[data-learning-experience="student"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Osnova lekce' })).toBeVisible();
  });

  test('projector keeps lesson teaching copy while stripping activity controls', async ({
    page,
  }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-5-js?mode=projector&slide=tasks');
    await expect(page.getByRole('heading', { name: '1) Proměnné a typy' }).first()).toBeVisible();
    await expect(page.locator('[data-projector-private]')).toHaveCount(0);
    await expect(
      page.locator('textarea, iframe, [role="tablist"], [contenteditable="true"]'),
    ).toHaveCount(0);
  });

  test('projector expands teaching content passed through lesson components', async ({ page }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-1-html5?mode=projector&slide=sections');
    await expect(page.getByText(/HTML nabízí širokou škálu základních prvků/).last()).toBeVisible();
    await expect(page.getByText(/Minimální HTML5 dokument začíná doctype/).last()).toBeVisible();
  });

  test('projector keeps CSS teaching content without the repeated simulation disclaimer', async ({
    page,
  }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-2?mode=projector&slide=linking');
    await expect(page.getByRole('heading', { name: '1) Vytvořte link na stylopis' })).toBeVisible();
    await expect(page.getByText(/Toto je výuková simulace pro procvičení CSS/)).toHaveCount(0);
    await expect(page.locator('[data-projector-private]')).toHaveCount(0);
    await expect(
      page.locator(
        'textarea, iframe, pre[aria-hidden="true"], [role="tablist"], [contenteditable="true"]',
      ),
    ).toHaveCount(0);
  });

  test('arrow keys in editable fields do not change the active slide', async ({ page }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-5-js?slide=tasks');
    const editor = page.getByRole('textbox', { name: 'main.js — Editor' });
    await editor.focus();
    await editor.press('ArrowRight');
    await expect(page).toHaveURL(/slide=tasks/);
  });

  test('presenter exposes instructor controls and an explicit projector action', async ({
    page,
  }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-1-html5?mode=presenter&slide=intro');
    await expect(page.getByRole('navigation', { name: /Osnova prezentujícího/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Otevřít projektor/i })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Aktuální výukový obsah' })).toBeVisible();
    await expect(page.getByRole('tablist')).toHaveCount(0);
  });

  test('successful projector popup does not show the blocked-popup fallback', async ({ page }) => {
    await installDeterministicNetwork(page);

    await page.goto('/interactive-zwa-1-html5?mode=presenter&slide=intro');
    const popupPromise = page.waitForEvent('popup');
    await page.getByRole('button', { name: /Otevřít projektor/i }).click();
    const popup = await popupPromise;
    await expect(popup).toHaveURL(/mode=projector.*slide=intro/);
    await expect(page.getByRole('link', { name: /Otevřít projektor v tomto panelu/i })).toHaveCount(
      0,
    );
    await popup.close();
  });
});
