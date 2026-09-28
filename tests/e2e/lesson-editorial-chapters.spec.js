import { createRequire } from 'node:module';

const { expect, test } = createRequire(import.meta.url)('@playwright/test');
import { installDeterministicNetwork } from './helpers/browser.js';

const EDITORIAL_CHAPTERS = [
  {
    route: '/interactive-zwa-1?slide=about-course',
    image: '/course-art/editorial/course-system-map.png',
  },
  {
    route: '/interactive-zwa-1?slide=tips',
    image: '/course-art/editorial/semester-project-route.png',
  },
  {
    route: '/interactive-zwa-1?slide=extras',
    image: '/course-art/editorial/course-support-channels.png',
  },
  {
    route: '/interactive-zwa-7?slide=oop-theory',
    image: '/course-art/editorial/javascript-oop-model.png',
  },
  {
    route: '/interactive-zwa-7?slide=creating-objects',
    image: '/course-art/editorial/javascript-object-creation.png',
  },
  {
    route: '/interactive-zwa-7?slide=ajax-theory',
    image: '/course-art/editorial/ajax-request-states.png',
  },
  {
    route: '/interactive-zwa-7?slide=ajax-practice',
    image: '/course-art/editorial/ajax-practical-flow.png',
  },
];

test.describe('editorial lecture chapters', () => {
  for (const chapter of EDITORIAL_CHAPTERS) {
    test(`${chapter.route} reads as an illustrated chapter`, async ({ page }) => {
      await installDeterministicNetwork(page);
      await page.goto(chapter.route);

      const content = page.locator('[data-editorial-chapter="true"]');
      await expect(content).toBeVisible();
      expect(await content.getByRole('heading', { level: 3 }).count()).toBeGreaterThanOrEqual(2);
      expect(await content.getByRole('paragraph').count()).toBeGreaterThanOrEqual(3);
      const illustration = content.locator('figure[data-integrated-artwork="true"]');
      const image = illustration.locator('img');
      await expect(illustration).toHaveAttribute('data-integrated-artwork', 'true');
      await expect(image).toBeVisible();
      await expect(image).toHaveAttribute('src', new RegExp(chapter.image.split('/').at(-1)));
    });
  }

  test('object creation and AJAX practice no longer hide teaching content in steppers', async ({
    page,
  }) => {
    await installDeterministicNetwork(page);

    for (const route of [
      '/interactive-zwa-7?slide=creating-objects',
      '/interactive-zwa-7?slide=ajax-practice',
    ]) {
      await page.goto(route);
      await expect(page.locator('[data-editorial-chapter="true"] button')).toHaveCount(0);
    }
  });
});
