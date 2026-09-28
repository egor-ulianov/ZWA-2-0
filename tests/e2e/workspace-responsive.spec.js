import { createRequire } from 'node:module';

const { expect, test } = createRequire(import.meta.url)('@playwright/test');
import { fulfillJson, installDeterministicNetwork } from './helpers/browser.js';

const STUDENT_RECORD = {
  username: 'alice',
  progress: {
    username: 'alice',
    assignment_task_checked: true,
    assignment_midterm_ok: true,
    assignment_partner: 'bob',
    assignment_final_points: 11,
  },
};

const STUDENT_ATTENDANCE = {
  username: 'alice',
  attendance: { '2026-09-08': true, '2026-09-09': false },
};

const STUDENT_GRADES = {
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
    },
  },
};

async function installStudentFixtures(page, { authenticated = true } = {}) {
  await installDeterministicNetwork(page);

  let isAuthenticated = authenticated;
  await page.route('**/api/student/me', async (route) => {
    if (!isAuthenticated) return fulfillJson(route, { error: 'Unauthorized' }, { status: 401 });
    return fulfillJson(route, STUDENT_RECORD);
  });
  await page.route('**/api/student/login', async (route) => {
    isAuthenticated = true;
    return fulfillJson(route, { ok: true });
  });
  await page.route('**/api/student/attendance', (route) => fulfillJson(route, STUDENT_ATTENDANCE));
  await page.route('**/api/student/grades', (route) => fulfillJson(route, STUDENT_GRADES));
}

async function installTeacherFixtures(page) {
  await installDeterministicNetwork(page);

  let isAuthenticated = false;
  await page.route('**/api/teacher/me', async (route) => {
    if (!isAuthenticated) return fulfillJson(route, { error: 'Unauthorized' }, { status: 401 });
    return fulfillJson(route, { username: 'teacher' });
  });
  await page.route('**/api/teacher/login', async (route) => {
    isAuthenticated = true;
    return fulfillJson(route, { ok: true });
  });
  await page.route('**/api/students', (route) =>
    fulfillJson(route, {
      count: 2,
      students: [{ username: 'alice' }, { username: 'bob' }],
    }),
  );
  await page.route('**/api/attendance**', async (route) => {
    if (route.request().method() === 'GET') {
      const url = new URL(route.request().url());
      if (!url.searchParams.has('date')) {
        return fulfillJson(route, { overview: { '2026-09-08': { alice: false, bob: true } } });
      }
      return fulfillJson(
        route,
        {
          date: url.searchParams.get('date'),
          map: { alice: false, bob: true },
          revision: 1,
        },
        { headers: { etag: '"1"' } },
      );
    }
    const body = JSON.parse(route.request().postData() || '{}');
    return fulfillJson(
      route,
      { ok: true, count: Object.values(body.map || {}).filter(Boolean).length, revision: 2 },
      { headers: { etag: '"2"' } },
    );
  });
  await page.route('**/api/progress', async (route) => {
    if (route.request().method() === 'GET') {
      return fulfillJson(route, {
        items: [
          {
            username: 'alice',
            assignment_task_checked: false,
            assignment_midterm_ok: false,
            assignment_topic: '',
            assignment_partner: '',
            assignment_final_points: null,
          },
          {
            username: 'bob',
            assignment_task_checked: true,
            assignment_midterm_ok: true,
            assignment_topic: 'Existing topic',
            assignment_partner: 'alice',
            assignment_final_points: 8,
          },
        ],
      });
    }
    const body = JSON.parse(route.request().postData() || '{}');
    return fulfillJson(route, { ok: true, item: { username: body.username, ...body } });
  });
  await page.route('**/api/teacher/normalize-grades', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    return fulfillJson(route, {
      runId: body.dryRun ? `dry-run-${body.testNumber}` : undefined,
      total: 2,
      updated: body.dryRun ? 0 : 2,
      preview: [
        { username: 'alice', originalPoints: 10, normalizedPoints: 11 },
        { username: 'bob', originalPoints: 8, normalizedPoints: 9 },
      ],
    });
  });
}

async function expectNoHorizontalOverflow(page) {
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);
}

test('student sign-in and record stay keyboard accessible and least-privilege at 320px', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await installStudentFixtures(page, { authenticated: false });

  await page.goto('/student');
  await expect(page.getByRole('main')).toHaveCount(1);
  await expect(page.locator('[data-operations-application="true"]')).toBeVisible();
  const username = page.getByLabel('Username');
  const code = page.getByLabel('Auth code');
  const signIn = page.getByRole('button', { name: 'Sign in' });

  await username.fill('alice');
  await code.fill('ABC123');
  await username.focus();
  await username.press('Tab');
  await expect(code).toBeFocused();
  await code.press('Tab');
  await expect(signIn).toBeFocused();
  await signIn.press('Enter');

  await expect(page).toHaveURL(/\/student\/progress\/?$/);
  await expect(page.getByRole('heading', { name: 'Your study record' })).toBeVisible();
  await expect(page.getByRole('main')).toHaveCount(1);
  await expectNoHorizontalOverflow(page);
  await expect(page.getByRole('region', { name: 'At a glance' })).toContainText(
    '1 attendance record',
  );

  const renderedText = await page.locator('body').innerText();
  expect(renderedText).not.toContain('attempt-secret-not-for-students');
  expect(renderedText).not.toContain('teacher-secret-not-for-students');
  expect(renderedText).not.toContain('private-model-not-for-students');
  expect(renderedText).not.toContain('prompt-secret-not-for-students');
});

test('teacher attendance workspace keeps controls keyboard operable at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await installTeacherFixtures(page);

  await page.goto('/attendance');
  const login = page.getByRole('form', { name: 'Teacher login' });
  await expect(login).toBeVisible();
  await expect(page.getByRole('main')).toHaveCount(1);

  const teacherUsername = login.getByLabel('Username');
  const teacherPassword = login.getByLabel('Password');
  const loginButton = login.getByRole('button', { name: 'Login' });
  await teacherUsername.fill('teacher');
  await teacherPassword.fill('correct horse battery staple');
  await teacherUsername.focus();
  await teacherUsername.press('Tab');
  await expect(teacherPassword).toBeFocused();
  await teacherPassword.press('Tab');
  await expect(loginButton).toBeFocused();
  await loginButton.press('Enter');

  await expect(page.getByRole('heading', { name: 'Attendance & student records' })).toBeVisible();
  await expect(page.locator('[data-operations-application="true"]')).toBeVisible();
  await expect(page.getByRole('main')).toHaveCount(1);
  await expectNoHorizontalOverflow(page);

  const sectionNavigation = page.getByRole('navigation', { name: 'Teacher workspace sections' });
  const normalizationLink = sectionNavigation.getByRole('link', { name: 'Grade normalization' });
  await normalizationLink.focus();
  await expect(normalizationLink).toBeFocused();

  const aliceRow = page.getByRole('listitem').filter({
    has: page.getByRole('heading', { name: 'alice', exact: true }),
  });
  const aliceAttendance = page.locator('#attendance-alice');
  await aliceAttendance.focus();
  await expect(aliceAttendance).toBeFocused();
  await aliceAttendance.press('Space');
  await expect(aliceAttendance).toBeChecked();

  const disclosure = aliceRow.getByText('Assignment progress', { exact: true });
  await disclosure.focus();
  await expect(disclosure).toBeFocused();
  await disclosure.press('Enter');
  await expect(aliceRow.getByLabel('Semestral topic')).toBeVisible();

  const markPresent = page.getByRole('button', { name: 'Mark visible students present' });
  await expect(markPresent).toBeEnabled();
  await markPresent.focus();
  await expect(markPresent).toBeFocused();
  await markPresent.press('Enter');
  await expect(aliceAttendance).toBeChecked();
  await expect(
    page
      .getByRole('listitem')
      .filter({ has: page.getByRole('heading', { name: 'bob', exact: true }) })
      .getByRole('checkbox'),
  ).toBeChecked();

  await normalizationLink.press('Enter');
  await expect(page).toHaveURL(/\/teacher\/?$/);
  await expect(page.getByRole('heading', { name: 'Grade normalization' })).toBeVisible();
  await expect(page.getByRole('main')).toHaveCount(1);
  await expectNoHorizontalOverflow(page);

  const dryRun = page.getByRole('button', { name: 'Dry run normalization for Test 1' });
  await dryRun.focus();
  await expect(dryRun).toBeFocused();
  await dryRun.press('Enter');
  await expect(page.getByRole('button', { name: 'Apply normalization for Test 1' })).toBeEnabled();
});
