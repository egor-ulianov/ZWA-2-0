import { createRequire } from 'node:module';

const { expect, test } = createRequire(import.meta.url)('@playwright/test');
import { fulfillJson, installDeterministicNetwork } from './helpers/browser.js';

test('teacher edits the lecture attendance matrix across filtered students', async ({ page }) => {
  await installDeterministicNetwork(page);
  const students = [
    { username: 'ada', firstName: 'Ada', lastName: 'Lovelace', parallel: '107' },
    { username: 'bob' },
  ];
  const attendancePosts = [];

  await page.route('**/api/teacher/me', (route) => fulfillJson(route, { username: 'teacher' }));
  await page.route('**/api/students', (route) =>
    fulfillJson(route, { count: students.length, students }),
  );
  await page.route('**/api/attendance**', async (route) => {
    if (route.request().method() === 'POST') {
      attendancePosts.push(JSON.parse(route.request().postData() || '{}'));
      return fulfillJson(route, { ok: true, count: 2, revision: attendancePosts.length });
    }
    return fulfillJson(route, {
      overview: {
        1: { ada: false, bob: true },
        13: { ada: true, bob: false },
      },
      revisions: { 1: 0, 13: 0 },
    });
  });
  await page.route('**/api/progress', (route) => fulfillJson(route, { items: [] }));

  await page.goto('/attendance');
  const matrix = page.getByRole('region', { name: 'Attendance by lecture' });
  await expect(matrix.getByRole('columnheader', { name: '1', exact: true })).toBeVisible();
  await expect(matrix.getByRole('columnheader', { name: '13', exact: true })).toBeVisible();
  await expect(page.getByLabel('Attendance date')).toHaveCount(0);
  await expect(page.getByText('2026-09-08')).toHaveCount(0);

  await page.getByLabel('Search name or username').fill('Ada');
  await expect(matrix.getByRole('row', { name: /Ada Lovelace/ })).toBeVisible();
  await expect(matrix.getByRole('row', { name: /bob/ })).toHaveCount(0);
  await page.getByLabel('Search name or username').fill('');
  await page.getByLabel('Parallel').selectOption('107');
  await expect(matrix.getByRole('row', { name: /bob/ })).toHaveCount(0);
  await page.getByLabel('Parallel').selectOption('all');

  await matrix.getByRole('checkbox', { name: 'Ada Lovelace, lecture 1', exact: true }).check();
  await matrix.getByRole('checkbox', { name: 'bob, lecture 13', exact: true }).check();
  await expect.poll(() => attendancePosts.length).toBe(2);
  expect(attendancePosts).toEqual([
    { lecture: 1, map: { ada: true, bob: true } },
    { lecture: 13, map: { ada: true, bob: true } },
  ]);
});

test('teacher can sign in, retry a conflicted lecture, and edit progress', async ({ page }) => {
  await installDeterministicNetwork(page);
  let authenticated = false;
  let attendancePostCount = 0;
  const attendancePosts = [];
  const initialAttendance = { alice: false, bob: true };
  const reloadedAttendance = { alice: false, bob: false };
  const progressByUser = {
    alice: {
      username: 'alice',
      assignment_task_checked: false,
      assignment_midterm_ok: false,
      assignment_topic: '',
      assignment_partner: '',
      assignment_final_points: null,
    },
    bob: { username: 'bob', assignment_final_points: 8 },
  };

  await page.route('**/api/teacher/me', (route) => {
    if (!authenticated) return fulfillJson(route, { error: 'Unauthorized' }, { status: 401 });
    return fulfillJson(route, { username: 'teacher' });
  });
  await page.route('**/api/teacher/login', (route) => {
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
    const url = new URL(route.request().url());
    if (route.request().method() === 'GET' && url.searchParams.has('lecture')) {
      return fulfillJson(
        route,
        { lecture: 1, map: reloadedAttendance, revision: 1 },
        { headers: { etag: '"1"' } },
      );
    }
    if (route.request().method() === 'GET') {
      return fulfillJson(route, { overview: { 1: initialAttendance }, revisions: { 1: 1 } });
    }
    attendancePostCount += 1;
    attendancePosts.push(JSON.parse(route.request().postData() || '{}'));
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
  await login.getByLabel('Username').fill('teacher');
  await login.getByLabel('Password').fill('correct horse battery staple');
  await login.getByRole('button', { name: 'Login' }).click();

  const matrix = page.getByRole('region', { name: 'Attendance by lecture' });
  const aliceAttendance = matrix.getByRole('checkbox', {
    name: 'alice, lecture 1',
    exact: true,
  });
  await aliceAttendance.check();
  await expect.poll(() => attendancePostCount).toBe(1);
  const conflict = page
    .getByRole('alert')
    .filter({ hasText: 'Lecture 1 changed on the server. Latest values were reloaded.' });
  await expect(conflict).toBeVisible();
  await expect(aliceAttendance).not.toBeChecked();
  await conflict.getByRole('button', { name: 'Retry lecture 1' }).click();
  await expect.poll(() => attendancePostCount).toBe(2);
  await expect(aliceAttendance).toBeChecked();
  expect(attendancePosts[1].map).toEqual({ alice: true, bob: false });
  await expect(page.getByRole('status').filter({ hasText: 'Lecture 1 saved.' })).toBeVisible();

  const aliceRow = page.getByRole('listitem').filter({
    has: page.getByRole('heading', { name: 'alice', exact: true }),
  });
  await aliceRow.getByText('Assignment progress').click();
  const progressBodies = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/progress') && request.method() === 'POST') {
      progressBodies.push(JSON.parse(request.postData() || '{}'));
    }
  });
  await aliceRow.getByLabel('Semestral topic').fill('Topic with comma, quote "and details"');
  await aliceRow.getByLabel('Partner username').fill('bob');
  await expect
    .poll(() => progressBodies.some((body) => body.assignment_partner === 'bob'))
    .toBe(true);
  expect(Object.assign({}, ...progressBodies)).toMatchObject({
    username: 'alice',
    assignment_topic: 'Topic with comma, quote "and details"',
    assignment_partner: 'bob',
  });
});

test('teacher keeps the workspace hidden until initial records load and can recover', async ({
  page,
}) => {
  await installDeterministicNetwork(page);
  let studentAttempt = 0;
  let releaseStudents;
  const studentsPending = new Promise((resolve) => {
    releaseStudents = resolve;
  });

  await page.route('**/api/teacher/me', (route) => fulfillJson(route, { username: 'teacher' }));
  await page.route('**/api/students', async (route) => {
    studentAttempt += 1;
    if (studentAttempt === 1) {
      await studentsPending;
      return fulfillJson(route, { error: 'Students unavailable' }, { status: 503 });
    }
    return fulfillJson(route, { count: 1, students: [{ username: 'alice' }] });
  });
  await page.route('**/api/attendance**', (route) =>
    fulfillJson(route, { overview: { 1: { alice: false } }, revisions: { 1: 1 } }),
  );
  await page.route('**/api/progress', (route) => fulfillJson(route, { items: [] }));

  await page.goto('/attendance');
  await expect.poll(() => studentAttempt).toBe(1);
  await expect(page.getByRole('region', { name: 'Attendance by lecture' })).toHaveCount(0);
  releaseStudents();
  await expect(page.getByRole('alert').filter({ hasText: 'Students unavailable' })).toBeVisible();
  await page.getByRole('button', { name: 'Retry loading workspace' }).click();
  await expect(page.getByRole('region', { name: 'Attendance by lecture' })).toBeVisible();
});

test('teacher retry persists the recovered lecture map before the next edit', async ({ page }) => {
  await installDeterministicNetwork(page);
  let postCount = 0;
  const postedMaps = [];
  await page.route('**/api/teacher/me', (route) => fulfillJson(route, { username: 'teacher' }));
  await page.route('**/api/students', (route) =>
    fulfillJson(route, {
      count: 2,
      students: [{ username: 'alice' }, { username: 'bob' }],
    }),
  );
  await page.route('**/api/attendance**', (route) => {
    if (route.request().method() === 'GET') {
      return fulfillJson(route, {
        overview: { 1: { alice: false, bob: false } },
        revisions: { 1: 1 },
      });
    }
    postCount += 1;
    const body = JSON.parse(route.request().postData() || '{}');
    postedMaps.push(body.map);
    if (postCount === 1) {
      return fulfillJson(route, { error: 'Temporary attendance failure' }, { status: 503 });
    }
    return fulfillJson(route, { ok: true, revision: postCount + 1 });
  });
  await page.route('**/api/progress', (route) => fulfillJson(route, { items: [] }));

  await page.goto('/attendance');
  const matrix = page.getByRole('region', { name: 'Attendance by lecture' });
  const aliceAttendance = matrix.getByRole('checkbox', {
    name: 'alice, lecture 1',
    exact: true,
  });
  const bobAttendance = matrix.getByRole('checkbox', {
    name: 'bob, lecture 1',
    exact: true,
  });

  await aliceAttendance.check();
  await expect.poll(() => postCount).toBe(1);
  const failure = page.getByRole('alert').filter({ hasText: 'Temporary attendance failure' });
  await expect(failure).toBeVisible();
  await expect(aliceAttendance).not.toBeChecked();
  await failure.getByRole('button', { name: 'Retry lecture 1' }).click();
  await expect.poll(() => postCount).toBe(2);
  await expect(aliceAttendance).toBeChecked();

  await bobAttendance.check();
  await expect.poll(() => postCount).toBe(3);
  expect(postedMaps[2]).toEqual({ alice: true, bob: true });
});

test('teacher keeps failures per lecture and blocks an untrusted conflict reload', async ({
  page,
}) => {
  await installDeterministicNetwork(page);
  const posts = [];
  let lectureThreeReadCount = 0;
  let lectureThreePostCount = 0;
  await page.route('**/api/teacher/me', (route) => fulfillJson(route, { username: 'teacher' }));
  await page.route('**/api/students', (route) =>
    fulfillJson(route, {
      count: 2,
      students: [{ username: 'alice' }, { username: 'bob' }],
    }),
  );
  await page.route('**/api/attendance**', (route) => {
    const url = new URL(route.request().url());
    if (route.request().method() === 'GET' && url.searchParams.has('lecture')) {
      lectureThreeReadCount += 1;
      if (lectureThreeReadCount === 1) {
        return fulfillJson(route, { error: 'Reload unavailable' }, { status: 503 });
      }
      return fulfillJson(route, {
        lecture: 3,
        map: { alice: false, bob: true },
        revision: 2,
      });
    }
    if (route.request().method() === 'GET') {
      return fulfillJson(route, {
        overview: {
          1: { alice: false, bob: false },
          2: { alice: false, bob: false },
          3: { alice: false, bob: false },
        },
        revisions: { 1: 1, 2: 1, 3: 1 },
      });
    }
    const body = JSON.parse(route.request().postData() || '{}');
    posts.push(body);
    if (body.lecture === 1) {
      return fulfillJson(route, { error: 'Lecture one unavailable' }, { status: 503 });
    }
    if (body.lecture === 2) {
      return fulfillJson(route, { error: 'Lecture two unavailable' }, { status: 503 });
    }
    lectureThreePostCount += 1;
    if (lectureThreePostCount === 1) {
      return fulfillJson(route, { error: 'Attendance changed; reload and retry' }, { status: 409 });
    }
    return fulfillJson(route, { ok: true, count: 2, revision: 3 });
  });
  await page.route('**/api/progress', (route) => fulfillJson(route, { items: [] }));

  await page.goto('/attendance');
  const matrix = page.getByRole('region', { name: 'Attendance by lecture' });
  await matrix.getByRole('checkbox', { name: 'alice, lecture 1', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Retry lecture 1' })).toBeVisible();
  await matrix.getByRole('checkbox', { name: 'alice, lecture 2', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Retry lecture 1' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Retry lecture 2' })).toBeVisible();

  const lectureThree = matrix.getByRole('checkbox', {
    name: 'alice, lecture 3',
    exact: true,
  });
  await lectureThree.click();
  const recover = page.getByRole('button', { name: 'Reload and retry lecture 3' });
  await expect(recover).toBeVisible();
  await expect(lectureThree).not.toBeChecked();
  await expect(lectureThree).toBeDisabled();
  await recover.click();
  await expect.poll(() => lectureThreePostCount).toBe(2);
  await expect(lectureThree).toBeChecked();
  await expect(lectureThree).toBeEnabled();
  expect(posts.at(-1).map).toEqual({ alice: true, bob: true });
});

test('teacher can retry a failed generated access-code request', async ({ page }) => {
  await installDeterministicNetwork(page);
  let accessCodeAttempts = 0;
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
  await page.route('**/api/attendance**', (route) =>
    fulfillJson(route, { overview: {}, revisions: {} }),
  );
  await page.route('**/api/progress', (route) => {
    if (route.request().method() === 'GET') return fulfillJson(route, { items: [progress] });
    const body = JSON.parse(route.request().postData() || '{}');
    if (body.generate_access_code) {
      accessCodeAttempts += 1;
      if (accessCodeAttempts === 1) {
        return fulfillJson(route, { error: 'Access code service unavailable' }, { status: 503 });
      }
      return fulfillJson(route, { ok: true, item: progress, accessCode: 'one-time-code' });
    }
    return fulfillJson(route, { ok: true, item: { ...progress, ...body } });
  });

  await page.goto('/attendance');
  const aliceRow = page.getByRole('listitem').filter({
    has: page.getByRole('heading', { name: 'alice', exact: true }),
  });
  await aliceRow.getByText('Assignment progress').click();
  await aliceRow.getByRole('button', { name: 'Generate access code' }).click();
  const failure = aliceRow
    .getByRole('alert')
    .filter({ hasText: 'Access code service unavailable' });
  await expect(failure).toBeVisible();
  await failure.getByRole('button', { name: 'Retry' }).click();
  await expect.poll(() => accessCodeAttempts).toBe(2);
  await expect(aliceRow.getByRole('status')).toContainText('Access code generated.');
});
