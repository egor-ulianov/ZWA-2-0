const { test, expect } = require('@playwright/test');
const { fulfillJson, installDeterministicNetwork } = require('./helpers/browser.js');

test('teacher can sign in, edit roster data, and retry a conflicted attendance save', async ({
  page,
}) => {
  await installDeterministicNetwork(page);

  let authenticated = false;
  let attendancePostCount = 0;
  const initialAttendance = { alice: false, bob: true };
  const progressByUser = {
    alice: {
      username: 'alice',
      assignment_task_checked: false,
      assignment_midterm_ok: false,
      assignment_topic: '',
      assignment_partner: '',
      assignment_final_points: null,
    },
    bob: {
      username: 'bob',
      assignment_task_checked: true,
      assignment_midterm_ok: true,
      assignment_topic: 'Existing topic',
      assignment_partner: 'alice',
      assignment_final_points: 8,
    },
  };

  await page.route('**/api/teacher/me', async (route) => {
    if (!authenticated) return fulfillJson(route, { error: 'Unauthorized' }, { status: 401 });
    return fulfillJson(route, { username: 'teacher' });
  });
  await page.route('**/api/teacher/login', async (route) => {
    authenticated = true;
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
        return fulfillJson(route, { overview: { '2026-09-08': initialAttendance } });
      }
      return fulfillJson(
        route,
        {
          date: url.searchParams.get('date'),
          map: initialAttendance,
          revision: 1,
        },
        { headers: { etag: '"1"' } },
      );
    }

    attendancePostCount += 1;
    if (attendancePostCount === 1) {
      return fulfillJson(route, { error: 'Attendance changed; reload and retry' }, { status: 409 });
    }
    return fulfillJson(route, { ok: true, count: 2, revision: 2 }, { headers: { etag: '"2"' } });
  });
  await page.route('**/api/progress', async (route) => {
    if (route.request().method() === 'GET') {
      return fulfillJson(route, { items: Object.values(progressByUser) });
    }

    const body = JSON.parse(route.request().postData() || '{}');
    const { username, ...patch } = body;
    progressByUser[username] = { ...progressByUser[username], ...patch };
    return fulfillJson(route, { ok: true, item: progressByUser[username] });
  });

  await page.goto('/attendance');
  const login = page.getByRole('form', { name: 'Teacher login' });
  await expect(login).toBeVisible();
  await expect(page.getByText('alice')).not.toBeVisible();

  await login.getByLabel('Username').fill('teacher');
  await login.getByLabel('Password').fill('correct horse battery staple');
  await login.getByRole('button', { name: 'Login' }).click();

  await expect(page.getByRole('heading', { name: 'Attendance' })).toBeVisible();
  await expect(page.getByRole('list').getByText('alice', { exact: true })).toBeVisible();
  await expect(page.getByRole('list').getByText('bob', { exact: true })).toBeVisible();
  await expect(page.getByText('Total: 2 · Present: 1')).toBeVisible();

  const aliceRow = page.locator('li').filter({ hasText: /^alice/ });
  const aliceAttendance = aliceRow.getByRole('checkbox');
  await expect(aliceAttendance).not.toBeChecked();
  await aliceAttendance.check();

  const conflict = page
    .getByRole('alert')
    .filter({ hasText: 'Attendance changed on the server. The latest values were reloaded' });
  await expect(conflict).toBeVisible();
  await expect(aliceAttendance).not.toBeChecked();
  await conflict.getByRole('button', { name: 'Reload latest' }).click();
  await expect(conflict).not.toBeVisible();
  await aliceAttendance.check();
  await expect.poll(() => attendancePostCount).toBe(2);
  await expect(aliceAttendance).toBeChecked();
  expect(attendancePostCount).toBe(2);

  await aliceRow.getByText('Assignment progress').click();
  const topic = aliceRow.getByLabel('Semestral topic');
  const partner = aliceRow.getByLabel('Partner username');
  const progressBodies = [];
  const captureProgressRequest = (request) => {
    if (request.url().includes('/api/progress') && request.method() === 'POST') {
      progressBodies.push(JSON.parse(request.postData() || '{}'));
    }
  };
  page.on('request', captureProgressRequest);
  await topic.fill('Topic with comma, quote "and details"');
  await partner.fill('bob');
  await expect
    .poll(() => progressBodies.some((body) => body.assignment_partner === 'bob'))
    .toBe(true);
  page.off('request', captureProgressRequest);
  const requestBody = Object.assign({}, ...progressBodies);
  expect(requestBody).toMatchObject({
    username: 'alice',
    assignment_topic: 'Topic with comma, quote "and details"',
    assignment_partner: 'bob',
  });
  expect(requestBody).not.toHaveProperty('test1');
  await expect(topic).toHaveValue('Topic with comma, quote "and details"');
});
