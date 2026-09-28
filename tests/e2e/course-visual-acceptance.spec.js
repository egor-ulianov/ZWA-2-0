import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const { expect, test } = createRequire(import.meta.url)('@playwright/test');
import { fulfillJson, installDeterministicNetwork } from './helpers/browser.js';

const REVIEW_DIRECTORY = path.resolve('.next/visual-review');
const DESKTOP = { width: 1440, height: 1000 };
const MOBILE = { width: 390, height: 844 };

const LESSONS = [
  ['01-html5', '/interactive-zwa-1-html5?slide=intro'],
  ['02-forms', '/interactive-zwa-2-forms'],
  ['03-network', '/interactive-zwa-1'],
  ['04-css', '/interactive-zwa-2'],
  ['05-css-ii', '/interactive-zwa-5-css-ii'],
  ['06-javascript', '/interactive-zwa-5-js'],
  ['07-classes-ajax', '/interactive-zwa-7'],
  ['08-php', '/interactive-zwa-8-php'],
  ['09-forms-crud', '/interactive-zwa-9'],
  ['10-sessions-cookies', '/interactive-zwa-10-sessions-cookies'],
  ['11-files-json', '/interactive-zwa-11-files-json'],
  ['12-auth', '/interactive-zwa-12-auth'],
];

async function preparePage(page, viewport = DESKTOP) {
  await page.setViewportSize(viewport);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await installDeterministicNetwork(page);
}

async function settle(page) {
  await expect(page.getByRole('main')).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts?.ready;
    await Promise.all(
      [...document.images].map((image) =>
        image.complete
          ? Promise.resolve()
          : new Promise((resolve) => {
              image.addEventListener('load', resolve, { once: true });
              image.addEventListener('error', resolve, { once: true });
            }),
      ),
    );
  });
  await page.addStyleTag({ content: '* { caret-color: transparent !important; }' });
}

async function capturePage(page, name) {
  await settle(page);
  await page.screenshot({
    animations: 'disabled',
    fullPage: true,
    path: path.join(REVIEW_DIRECTORY, `${name}.png`),
  });
}

async function installOperationsFixtures(page) {
  await page.unroute('**/api/**');
  await page.route('**/api/student/me', (route) =>
    fulfillJson(route, {
      username: 'alice',
      progress: {
        username: 'alice',
        assignment_task_checked: true,
        assignment_midterm_ok: true,
        assignment_topic: 'Accessible event planner',
        assignment_partner: 'bob',
        assignment_final_points: 11,
      },
    }),
  );
  await page.route('**/api/student/attendance', (route) =>
    fulfillJson(route, {
      username: 'alice',
      attendance: { '2026-09-08': true, '2026-09-15': true, '2026-09-22': false },
    }),
  );
  await page.route('**/api/student/grades', (route) =>
    fulfillJson(route, {
      username: 'alice',
      grades: {
        1: {
          test_number: 1,
          points: 10,
          max_points: 12,
          reasoning: 'Strong semantic structure and clear reasoning.',
          graded_at: '2026-09-08T10:00:00.000Z',
        },
      },
    }),
  );
  await page.route('**/api/teacher/me', (route) => fulfillJson(route, { username: 'teacher' }));
  await page.route('**/api/students', (route) =>
    fulfillJson(route, {
      count: 3,
      students: [{ username: 'alice' }, { username: 'bob' }, { username: 'carol' }],
    }),
  );
  await page.route('**/api/attendance**', (route) => {
    const url = new URL(route.request().url());
    if (!url.searchParams.has('date')) {
      return fulfillJson(route, {
        overview: { '2026-09-28': { alice: true, bob: false, carol: true } },
      });
    }
    return fulfillJson(
      route,
      {
        date: url.searchParams.get('date'),
        map: { alice: true, bob: false, carol: true },
        revision: 1,
      },
      { headers: { etag: '"1"' } },
    );
  });
  await page.route('**/api/progress', (route) =>
    fulfillJson(route, {
      items: [
        {
          username: 'alice',
          assignment_task_checked: true,
          assignment_midterm_ok: true,
          assignment_topic: 'Accessible event planner',
          assignment_partner: 'bob',
          assignment_final_points: 11,
        },
        {
          username: 'bob',
          assignment_task_checked: true,
          assignment_midterm_ok: false,
          assignment_topic: 'Course notes API',
          assignment_partner: 'alice',
          assignment_final_points: null,
        },
        {
          username: 'carol',
          assignment_task_checked: false,
          assignment_midterm_ok: false,
          assignment_topic: '',
          assignment_partner: '',
          assignment_final_points: null,
        },
      ],
    }),
  );
}

test.beforeAll(async () => {
  await mkdir(REVIEW_DIRECTORY, { recursive: true });
});

test('captures the course overview in desktop, explicit dark, and mobile states', async ({
  page,
}) => {
  await preparePage(page);
  await page.goto('/');
  await capturePage(page, '01-overview-desktop-light');

  await page.getByRole('button', { name: 'Přepnout na tmavý režim' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect
    .poll(
      async () =>
        (await page.locator('article[data-course-module] [data-module]').first().boundingBox())
          ?.height,
    )
    .toBeGreaterThan(200);
  await capturePage(page, '02-overview-desktop-dark');

  await page.getByRole('button', { name: 'Přepnout na světlý režim' }).click();
  await page.reload();
  await page.setViewportSize(MOBILE);
  await capturePage(page, '03-overview-mobile-light');

  const themeToggle = page.getByRole('button', { name: 'Přepnout na tmavý režim' });
  await themeToggle.focus();
  await expect(themeToggle).toBeFocused();
  await page.screenshot({
    animations: 'disabled',
    path: path.join(REVIEW_DIRECTORY, '17-keyboard-focus.png'),
  });
});

test('captures theory, exercise, and quiz learning states', async ({ page }) => {
  await preparePage(page);
  await page.goto('/interactive-zwa-1-html5?slide=sections');
  await capturePage(page, '04-theory-desktop-light');

  await page.getByRole('button', { name: 'Přepnout na tmavý režim' }).click();
  await capturePage(page, '05-theory-desktop-dark');

  await page.getByRole('button', { name: 'Přepnout na světlý režim' }).click();
  await page.setViewportSize(MOBILE);
  await capturePage(page, '06-theory-mobile-light');

  await page.setViewportSize(DESKTOP);
  await page.goto('/interactive-zwa-1-html5?slide=tasks');
  await capturePage(page, '07-exercise-desktop');
  await page.setViewportSize(MOBILE);
  await capturePage(page, '08-exercise-mobile');

  await page.setViewportSize(DESKTOP);
  await page.goto('/interactive-zwa-1?slide=quiz-html');
  await expect(page.locator('[data-lesson-quiz]')).toBeVisible();
  await capturePage(page, '09-quiz-unanswered');
  await page.locator('[data-quiz-option]').first().click();
  await expect(page.locator('[data-quiz-progress]')).toHaveText(/1 (?:\/|z) \d+ zodpovězeno/);
  await capturePage(page, '10-quiz-answered');
});

test('captures student and teacher operations surfaces', async ({ page }) => {
  await preparePage(page);
  await page.goto('/student');
  await capturePage(page, '11-student-access');

  await installOperationsFixtures(page);
  await page.goto('/student/progress');
  await capturePage(page, '12-student-progress');

  await page.goto('/teacher');
  await expect(page.getByRole('heading', { name: 'Grade normalization' })).toBeVisible();
  await capturePage(page, '13-teacher-normalization');

  await page.goto('/attendance');
  await expect(page.getByRole('heading', { name: 'Attendance & student records' })).toBeVisible();
  await capturePage(page, '14-attendance-workspace');
});

test('captures presenter and projector surfaces', async ({ page }) => {
  await preparePage(page, { width: 1440, height: 900 });
  await page.goto('/interactive-zwa-1-html5?mode=presenter&slide=sections');
  await capturePage(page, '15-presenter');

  await page.goto('/interactive-zwa-1-html5?mode=projector&slide=sections');
  await expect(page.getByText(/HTML nabízí širokou škálu základních prvků/).last()).toBeVisible();
  await capturePage(page, '16-projector');
});

test('captures every original lecture illustration in its lesson hero', async ({ page }) => {
  await preparePage(page, { width: 1120, height: 760 });

  for (const [name, route] of LESSONS) {
    await page.goto(route);
    const artwork = page
      .locator('[data-learning-experience="student"] header [data-module]')
      .first();
    await expect(artwork).toBeVisible();
    await expect(artwork.locator('img')).toBeVisible();
    await artwork.screenshot({
      animations: 'disabled',
      path: path.join(REVIEW_DIRECTORY, `artwork-${name}.png`),
    });
  }
});
