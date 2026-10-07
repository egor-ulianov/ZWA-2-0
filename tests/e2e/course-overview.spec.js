import { createRequire } from 'node:module';

const { expect, test } = createRequire(import.meta.url)('@playwright/test');
import { lessons } from '../../src/config/lessons.js';

test.describe('rebuilt course overview', () => {
  test('groups all legacy lesson routes into four ordered modules without invented progress', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(page.getByRole('main')).toHaveCount(1);
    const modules = page.locator('article[data-course-module]');
    await expect(modules).toHaveCount(4);

    let catalogIndex = 0;
    for (let moduleIndex = 0; moduleIndex < 4; moduleIndex += 1) {
      const moduleCard = modules.nth(moduleIndex);
      const links = moduleCard.getByRole('link');
      const expectedLessons = lessons.filter(
        (lesson) =>
          lesson.moduleId ===
          ['web-foundations', 'presentation-interaction', 'server-foundations', 'state-data'][
            moduleIndex
          ],
      );
      await expect(links).toHaveCount(expectedLessons.length);

      for (let lessonIndex = 0; lessonIndex < expectedLessons.length; lessonIndex += 1) {
        const lesson = lessons[catalogIndex];
        const renderedHref = lesson.href === '/' ? '/' : lesson.href.replace(/\/$/, '');
        await expect(links.nth(lessonIndex)).toHaveAttribute('href', renderedHref);
        await expect(links.nth(lessonIndex)).toContainText(lesson.shortTitle);
        catalogIndex += 1;
      }
    }

    expect(catalogIndex).toBe(lessons.length);

    await expect(page.getByRole('progressbar')).toHaveCount(0);
    await expect(page.getByText(/dokončeno|hotovo|%/i)).toHaveCount(0);
  });

  test('shows a color-field fallback when module artwork cannot load', async ({ page }) => {
    await page.route('**/course-art/lesson-03-network.svg', (route) => route.abort());
    await page.goto('/');

    await expect(page.locator('[data-artwork-fallback="true"]')).toHaveCount(1);
  });

  test('uses one uninterrupted column without horizontal overflow at 320 pixels', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto('/');

    const modules = page.locator('article[data-course-module]');
    const first = await modules.nth(0).boundingBox();
    const second = await modules.nth(1).boundingBox();
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(second.y).toBeGreaterThan(first.y + first.height - 1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    ).toBe(true);
  });

  test('keeps the longest lesson title visible when text is enlarged to 200 percent', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 800, height: 900 });
    await page.goto('/');
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });

    const longTitle = page.getByRole('link', { name: /Obsluha formulářů na straně serveru/ });
    await expect(longTitle).toBeVisible();
    expect(
      await longTitle.evaluate((element) => element.scrollHeight <= element.clientHeight),
    ).toBe(true);
  });
});
