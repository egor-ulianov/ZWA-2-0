import { createRequire } from 'node:module';

const { expect, test } = createRequire(import.meta.url)('@playwright/test');
import { fulfillJson, installDeterministicNetwork } from './helpers/browser.js';

test('teacher can sign in, edit roster data, and retry a conflicted attendance save', async ({
  page,
}) => {
  await installDeterministicNetwork(page);

  let authenticated = false;
  let attendancePostCount = 0;
  let releaseConflict;
  const conflictPending = new Promise((resolve) => {
    releaseConflict = resolve;
  });
  let attendanceDateReadCount = 0;
  let releaseConflictReload;
  const conflictReloadPending = new Promise((resolve) => {
    releaseConflictReload = resolve;
  });
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
      attendanceDateReadCount += 1;
      if (attendanceDateReadCount === 2) await conflictReloadPending;
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
      await conflictPending;
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

  await expect(page.getByRole('heading', { name: 'Attendance & student records' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Active attendance day' })).toContainText(
    'Present: 1 of 2',
  );
  await expect(page.getByRole('button', { name: 'Mark visible students present' })).toBeVisible();
  await expect(page.getByRole('list').getByText('alice', { exact: true })).toBeVisible();
  await expect(page.getByRole('list').getByText('bob', { exact: true })).toBeVisible();
  await expect(page.getByText('Present: 1 of 2')).toBeVisible();

  const aliceRow = page.getByRole('listitem').filter({
    has: page.getByRole('heading', { name: 'alice', exact: true }),
  });
  const aliceAttendance = aliceRow.getByRole('checkbox');
  await expect(aliceAttendance).not.toBeChecked();
  await aliceAttendance.check();
  await expect.poll(() => attendancePostCount).toBe(1);
  try {
    await expect(page.getByRole('status').filter({ hasText: 'Saving attendance…' })).toBeVisible();
  } finally {
    releaseConflict();
  }

  await expect.poll(() => attendanceDateReadCount).toBe(2);
  await expect(aliceAttendance).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Mark visible students present' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Export CSV' })).toBeDisabled();
  releaseConflictReload();

  const conflict = page
    .getByRole('alert')
    .filter({ hasText: 'Attendance changed on the server. The latest values were reloaded' });
  await expect(conflict).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Attendance conflict' })).toBeVisible();
  await expect(aliceAttendance).not.toBeChecked();
  await conflict.getByRole('button', { name: 'Reload latest' }).click();
  await expect(conflict).not.toBeVisible();
  await aliceAttendance.check();
  await expect.poll(() => attendancePostCount).toBe(2);
  await expect(aliceAttendance).toBeChecked();
  await expect(page.getByRole('status').filter({ hasText: 'Attendance saved.' })).toBeVisible();
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

test('teacher keeps the workspace hidden until initial records load and can recover from failure', async ({
  page,
}) => {
  await installDeterministicNetwork(page);

  let studentsRequested = false;
  let studentAttempt = 0;
  let releaseStudents;
  const studentsPending = new Promise((resolve) => {
    releaseStudents = resolve;
  });

  await page.route('**/api/teacher/me', (route) => fulfillJson(route, { username: 'teacher' }));
  await page.route('**/api/students', async (route) => {
    studentsRequested = true;
    studentAttempt += 1;
    if (studentAttempt === 1) {
      await studentsPending;
      return fulfillJson(route, { error: 'Students unavailable' }, { status: 503 });
    }
    return fulfillJson(route, {
      count: 2,
      students: [{ username: 'alice' }, { username: 'bob' }],
    });
  });
  await page.route('**/api/attendance**', async (route) => {
    if (route.request().method() === 'GET') {
      const url = new URL(route.request().url());
      if (!url.searchParams.has('date')) {
        return fulfillJson(route, { overview: { '2026-09-08': { alice: false, bob: true } } });
      }
      return fulfillJson(route, {
        date: url.searchParams.get('date'),
        map: { alice: false, bob: true },
        revision: 1,
      });
    }
    return fulfillJson(route, { ok: true, revision: 2 });
  });
  await page.route('**/api/progress', (route) =>
    fulfillJson(route, {
      items: [
        { username: 'alice', assignment_final_points: null },
        { username: 'bob', assignment_final_points: 8 },
      ],
    }),
  );

  await page.goto('/attendance');
  await expect.poll(() => studentsRequested).toBe(true);
  await expect(page.getByRole('region', { name: 'Active attendance day' })).toHaveCount(0);

  releaseStudents();
  await expect(page.getByRole('alert').filter({ hasText: 'Students unavailable' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Active attendance day' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Retry loading workspace' })).toBeVisible();

  await page.getByRole('button', { name: 'Retry loading workspace' }).click();
  await expect(page.getByRole('region', { name: 'Active attendance day' })).toBeVisible();
});

test('teacher disables date-dependent attendance writes while a selected day loads', async ({
  page,
}) => {
  await installDeterministicNetwork(page);

  const nextDate = '2030-01-02';
  let releaseNextDate;
  const nextDatePending = new Promise((resolve) => {
    releaseNextDate = resolve;
  });
  let postCount = 0;

  await page.route('**/api/teacher/me', (route) => fulfillJson(route, { username: 'teacher' }));
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
        return fulfillJson(route, { overview: {} });
      }
      if (url.searchParams.get('date') === nextDate) {
        await nextDatePending;
        return fulfillJson(route, {
          date: nextDate,
          map: { alice: false, bob: false },
          revision: 2,
        });
      }
      return fulfillJson(route, {
        date: url.searchParams.get('date'),
        map: { alice: false, bob: true },
        revision: 1,
      });
    }
    postCount += 1;
    return fulfillJson(route, { ok: true, revision: 3 });
  });
  await page.route('**/api/progress', (route) => fulfillJson(route, { items: [] }));

  await page.goto('/attendance');
  await expect(page.getByRole('region', { name: 'Active attendance day' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Active attendance day' })).toContainText(
    'Present: 1 of 2',
  );

  const dateInput = page.getByLabel('Attendance date');
  const markPresent = page.getByRole('button', { name: 'Mark visible students present' });
  const aliceAttendance = page
    .getByRole('listitem')
    .filter({
      has: page.getByRole('heading', { name: 'alice', exact: true }),
    })
    .getByRole('checkbox');
  await dateInput.fill(nextDate);
  try {
    await expect(dateInput).toBeDisabled();
    await expect(markPresent).toBeDisabled();
    await expect(aliceAttendance).toBeDisabled();
  } finally {
    releaseNextDate();
  }

  await expect(dateInput).toBeEnabled();
  await expect(page.getByRole('region', { name: 'Active attendance day' })).toContainText(
    'Present: 0 of 2',
  );
  expect(postCount).toBe(0);
});

test('teacher ignores stale date responses and blocks export after the selected date fails', async ({
  page,
}) => {
  await installDeterministicNetwork(page);

  const firstDate = '2030-01-02';
  const secondDate = '2030-01-03';
  const failedDate = '2030-01-04';
  let releaseFirstDate;
  let releaseSecondDate;
  const firstDatePending = new Promise((resolve) => {
    releaseFirstDate = resolve;
  });
  const secondDatePending = new Promise((resolve) => {
    releaseSecondDate = resolve;
  });
  let releaseFailedDate;
  const failedDatePending = new Promise((resolve) => {
    releaseFailedDate = resolve;
  });
  let firstDateRequested = false;
  let secondDateRequested = false;
  let failedDateRequested = false;

  await page.route('**/api/teacher/me', (route) => fulfillJson(route, { username: 'teacher' }));
  await page.route('**/api/students', (route) =>
    fulfillJson(route, {
      count: 2,
      students: [{ username: 'alice' }, { username: 'bob' }],
    }),
  );
  await page.route('**/api/attendance**', async (route) => {
    if (route.request().method() !== 'GET') return fulfillJson(route, { ok: true, revision: 4 });
    const url = new URL(route.request().url());
    if (!url.searchParams.has('date')) return fulfillJson(route, { overview: {} });
    const requestedDate = url.searchParams.get('date');
    if (requestedDate === firstDate) {
      firstDateRequested = true;
      await firstDatePending;
      return fulfillJson(route, {
        date: firstDate,
        map: { alice: true, bob: false },
        revision: 2,
      });
    }
    if (requestedDate === secondDate) {
      secondDateRequested = true;
      await secondDatePending;
      return fulfillJson(route, {
        date: secondDate,
        map: { alice: true, bob: true },
        revision: 3,
      });
    }
    if (requestedDate === failedDate) {
      failedDateRequested = true;
      await failedDatePending;
      return fulfillJson(route, { error: 'Selected date unavailable' }, { status: 503 });
    }
    return fulfillJson(route, {
      date: requestedDate,
      map: { alice: false, bob: false },
      revision: 1,
    });
  });
  await page.route('**/api/progress', (route) => fulfillJson(route, { items: [] }));

  await page.goto('/attendance');
  await expect(page.getByRole('region', { name: 'Active attendance day' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Active attendance day' })).toContainText(
    'Present: 0 of 2',
  );

  const dateInput = page.getByLabel('Attendance date');
  await dateInput.fill(firstDate);
  await expect.poll(() => firstDateRequested).toBe(true);
  await page.evaluate((value) => {
    const input = document.querySelector('#attendance-date');
    input.removeAttribute('disabled');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, secondDate);
  await expect.poll(() => secondDateRequested).toBe(true);

  releaseFirstDate();
  await expect(page.getByRole('region', { name: 'Active attendance day' })).toContainText(
    'Present: 0 of 2',
  );
  releaseSecondDate();
  await expect(page.getByRole('region', { name: 'Active attendance day' })).toContainText(
    'Present: 2 of 2',
  );

  await dateInput.fill(failedDate);
  await expect.poll(() => failedDateRequested).toBe(true);
  await expect(dateInput).toBeDisabled();
  releaseFailedDate();
  await expect(
    page.getByRole('alert').filter({ hasText: 'Selected date unavailable' }),
  ).toBeVisible();

  // A failed current-date response must not leave its previous verified map exportable.
  await expect(page.getByRole('button', { name: 'Export CSV' })).toBeDisabled();
});

test('teacher retry persists the recovered attendance map before the next edit', async ({
  page,
}) => {
  await installDeterministicNetwork(page);

  let postCount = 0;
  const postedMaps = [];
  let releaseFailure;
  const failurePending = new Promise((resolve) => {
    releaseFailure = resolve;
  });
  await page.route('**/api/teacher/me', (route) => fulfillJson(route, { username: 'teacher' }));
  await page.route('**/api/students', (route) =>
    fulfillJson(route, {
      count: 2,
      students: [{ username: 'alice' }, { username: 'bob' }],
    }),
  );
  await page.route('**/api/attendance**', async (route) => {
    if (route.request().method() === 'GET') {
      const url = new URL(route.request().url());
      if (!url.searchParams.has('date')) return fulfillJson(route, { overview: {} });
      return fulfillJson(route, {
        date: url.searchParams.get('date'),
        map: { alice: false, bob: false },
        revision: 1,
      });
    }
    postCount += 1;
    const body = JSON.parse(route.request().postData() || '{}');
    postedMaps.push(body.map);
    if (postCount === 1) {
      await failurePending;
      return fulfillJson(route, { error: 'Temporary attendance failure' }, { status: 503 });
    }
    return fulfillJson(route, { ok: true, revision: postCount + 1 });
  });
  await page.route('**/api/progress', (route) => fulfillJson(route, { items: [] }));

  await page.goto('/attendance');
  await expect(page.getByRole('region', { name: 'Active attendance day' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Active attendance day' })).toContainText(
    'Present: 0 of 2',
  );
  const aliceRow = page.getByRole('listitem').filter({
    has: page.getByRole('heading', { name: 'alice', exact: true }),
  });
  const bobRow = page.getByRole('listitem').filter({
    has: page.getByRole('heading', { name: 'bob', exact: true }),
  });
  const aliceAttendance = aliceRow.getByRole('checkbox');
  const bobAttendance = bobRow.getByRole('checkbox');

  await expect(aliceAttendance).toBeEnabled();
  await aliceAttendance.check();
  await expect.poll(() => postCount).toBe(1);
  releaseFailure();
  const failure = page.getByRole('alert').filter({ hasText: 'Temporary attendance failure' });
  await expect(failure).toBeVisible();
  await expect(
    page
      .getByRole('status')
      .filter({ hasText: 'Attendance save failed: Temporary attendance failure' }),
  ).toBeVisible();
  await expect(aliceAttendance).not.toBeChecked();
  await failure.getByRole('button', { name: 'Retry' }).click();
  await expect.poll(() => postCount).toBe(2);
  await expect(aliceAttendance).toBeChecked();

  await bobAttendance.check();
  await expect.poll(() => postCount).toBe(3);
  expect(postedMaps[2]).toEqual({ alice: true, bob: true });
});

test('teacher can retry a failed generated access-code request', async ({ page }) => {
  await installDeterministicNetwork(page);

  let accessCodeAttempts = 0;
  let ordinaryFieldAttempts = 0;
  const progressBodies = [];
  const progress = {
    username: 'alice',
    assignment_task_checked: false,
    assignment_midterm_ok: false,
    assignment_topic: '',
    assignment_partner: '',
    assignment_final_points: null,
  };
  await page.route('**/api/teacher/me', (route) => fulfillJson(route, { username: 'teacher' }));
  await page.route('**/api/students', (route) =>
    fulfillJson(route, { count: 1, students: [{ username: 'alice' }] }),
  );
  await page.route('**/api/attendance**', (route) => {
    if (route.request().method() === 'GET') {
      const url = new URL(route.request().url());
      if (!url.searchParams.has('date')) return fulfillJson(route, { overview: {} });
      return fulfillJson(route, {
        date: url.searchParams.get('date'),
        map: { alice: false },
        revision: 1,
      });
    }
    return fulfillJson(route, { ok: true, revision: 2 });
  });
  await page.route('**/api/progress', async (route) => {
    if (route.request().method() === 'GET') return fulfillJson(route, { items: [progress] });
    const body = JSON.parse(route.request().postData() || '{}');
    progressBodies.push(body);
    if (body.generate_access_code) {
      accessCodeAttempts += 1;
      if (accessCodeAttempts === 1) {
        return fulfillJson(route, { error: 'Access code service unavailable' }, { status: 503 });
      }
      return fulfillJson(route, { ok: true, item: progress, accessCode: 'one-time-code' });
    }
    if (body.assignment_topic) {
      ordinaryFieldAttempts += 1;
      if (ordinaryFieldAttempts === 1) {
        return fulfillJson(route, { error: 'Ordinary field save unavailable' }, { status: 503 });
      }
    }
    return fulfillJson(route, { ok: true, item: { ...progress, ...body } });
  });

  await page.goto('/attendance');
  await expect(page.getByRole('region', { name: 'Active attendance day' })).toBeVisible();
  const aliceRow = page.getByRole('listitem').filter({
    has: page.getByRole('heading', { name: 'alice', exact: true }),
  });
  await aliceRow.getByText('Assignment progress').click();
  await aliceRow.getByRole('button', { name: 'Generate access code' }).click();
  const accessCodeFailure = aliceRow
    .getByRole('alert')
    .filter({ hasText: 'Access code service unavailable' });
  await expect(accessCodeFailure).toBeVisible();
  await aliceRow.getByLabel('Semestral topic').fill('A topic that fails once');
  const ordinaryFieldFailure = aliceRow
    .getByRole('alert')
    .filter({ hasText: 'Ordinary field save unavailable' });
  await expect(ordinaryFieldFailure).toBeVisible();
  await ordinaryFieldFailure.getByRole('button', { name: 'Retry' }).click();
  await expect.poll(() => ordinaryFieldAttempts).toBe(2);
  expect(accessCodeAttempts).toBe(1);
  expect(progressBodies.at(-1)).toMatchObject({
    username: 'alice',
    assignment_topic: 'A topic that fails once',
  });
  expect(progressBodies.at(-1)).not.toHaveProperty('generate_access_code');
  await expect(aliceRow.getByLabel('Semestral topic')).toHaveValue('A topic that fails once');
});
