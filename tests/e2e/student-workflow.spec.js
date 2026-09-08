import { expect, test } from '@playwright/test';
import { fulfillJson, installDeterministicNetwork } from './helpers/browser.js';

test('unauthorized student progress redirects back to the login page', async ({ page }) => {
  await installDeterministicNetwork(page);

  for (const endpoint of ['me', 'attendance', 'grades']) {
    await page.route(`**/api/student/${endpoint}`, (route) =>
      fulfillJson(route, { error: 'Unauthorized' }, { status: 401 }),
    );
  }

  await page.goto('/student/progress');
  await expect(page).toHaveURL(/\/student\/?$/);
  await expect(page.getByRole('heading', { name: 'Student Portal' })).toBeVisible();
  await expect(page.locator('form')).toBeVisible();
});

test('student login reaches progress and renders only least-privilege grade fields', async ({
  page,
}) => {
  await installDeterministicNetwork(page);

  let authenticated = false;
  await page.route('**/api/student/me', async (route) => {
    if (!authenticated) return fulfillJson(route, { error: 'Unauthorized' }, { status: 401 });
    return fulfillJson(route, {
      username: 'alice',
      progress: {
        username: 'alice',
        assignment_task_checked: true,
        assignment_midterm_ok: true,
        assignment_partner: 'bob',
        assignment_final_points: 11,
      },
    });
  });
  await page.route('**/api/student/login', async (route) => {
    authenticated = true;
    return fulfillJson(route, { ok: true });
  });
  await page.route('**/api/student/attendance', (route) =>
    fulfillJson(route, {
      username: 'alice',
      attendance: { '2026-09-08': true },
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
          reasoning: 'Strong solution with clear reasoning.',
          graded_at: '2026-09-08T10:00:00.000Z',
          attempt_id: 'attempt-secret-not-for-students',
          actor: 'teacher-secret-not-for-students',
          model: 'private-model-not-for-students',
          prompt_version: 'prompt-secret-not-for-students',
          image_count: 4,
        },
      },
    }),
  );

  await page.goto('/student');
  await page.getByLabel('Username').fill('alice');
  await page.getByLabel('Auth code').fill('ABC123');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL(/\/student\/progress\/?$/);
  await expect(page.getByRole('heading', { name: 'Your Progress' })).toBeVisible();
  await expect(page.getByText('alice', { exact: true })).toBeVisible();
  await expect(page.getByText('Evaluation – Test 1')).toBeVisible();
  await expect(page.getByText('Points:').locator('..')).toContainText('10');
  await expect(page.getByText('Strong solution with clear reasoning.')).toBeVisible();

  const renderedText = await page.locator('body').innerText();
  expect(renderedText).not.toContain('attempt-secret-not-for-students');
  expect(renderedText).not.toContain('teacher-secret-not-for-students');
  expect(renderedText).not.toContain('private-model-not-for-students');
  expect(renderedText).not.toContain('prompt-secret-not-for-students');
});
