import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(new URL('../..', import.meta.url).pathname);

import { ApiError, request } from '../../src/lib/apiClient.js';

test('request rethrows AbortError so unmounts do not become visible failures', async () => {
  const originalFetch = globalThis.fetch;
  const abort = new DOMException('The operation was aborted', 'AbortError');
  globalThis.fetch = async () => { throw abort; };
  try {
    await assert.rejects(request('/api/teacher/me'), (error) => error === abort);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('attendance snapshot options carry the server revision as If-Match', async () => {
  const { createAttendanceSnapshotOptions } = await import('../../src/lib/apiClient.js');

  const options = createAttendanceSnapshotOptions({
    date: '2026-09-08',
    map: { alice: true },
    revision: 4,
  });

  assert.equal(options.headers['If-Match'], '"4"');
  assert.deepEqual(JSON.parse(options.body), {
    date: '2026-09-08',
    map: { alice: true },
  });
});

test('serialized attendance queues can reject stale queued snapshots after a conflict', async () => {
  const { createSerializedRequestQueue } = await import('../../src/lib/apiClient.js');
  let release;
  const queue = createSerializedRequestQueue(() => new Promise((resolve) => { release = resolve; }));
  const first = queue.enqueue('first');
  const second = queue.enqueue('second');
  const conflict = new ApiError('Attendance changed', { status: 409, code: 'attendance_conflict' });

  queue.clearPending(conflict);
  await assert.rejects(second, (error) => error === conflict);
  release('first');
  assert.equal(await first, 'first');
});

test('server progress updates merge without replacing locally dirty fields', async () => {
  const { mergeServerState } = await import('../../src/lib/apiClient.js');

  assert.deepEqual(mergeServerState(
    { assignment_topic: 'Local draft', assignment_partner: 'alice' },
    { assignment_topic: 'Server value', assignment_partner: 'bob', assignment_task_checked: true },
    new Set(['assignment_topic']),
  ), {
    assignment_topic: 'Local draft',
    assignment_partner: 'bob',
    assignment_task_checked: true,
  });
});

test('new progress edits retain failed fields while allowing the newest value to win', async () => {
  const { mergeProgressPatches } = await import('../../src/lib/apiClient.js');

  assert.deepEqual(mergeProgressPatches(
    { assignment_topic: 'failed topic' },
    { assignment_partner: 'alice' },
    { assignment_partner: 'bob' },
  ), {
    assignment_topic: 'failed topic',
    assignment_partner: 'bob',
  });
});

test('empty final-points input produces a nullable clear patch', async () => {
  const { progressPatchForFinalPointsInput } = await import('../../src/lib/apiClient.js');

  assert.deepEqual(progressPatchForFinalPointsInput(''), { assignment_final_points: null });
  assert.deepEqual(progressPatchForFinalPointsInput('7'), { assignment_final_points: 7 });
  assert.equal(progressPatchForFinalPointsInput('7.5'), null);
});

test('normalization apply payload requires an explicit preview run ID', async () => {
  const { buildNormalizationRequestBody } = await import('../../src/lib/apiClient.js');

  assert.throws(
    () => buildNormalizationRequestBody({ dryRun: false, testNumber: 1, maxPoints: 12 }),
    (error) => error instanceof ApiError && error.status === 400 && error.code === 'normalization_run_required',
  );
  assert.deepEqual(buildNormalizationRequestBody({ dryRun: false, runId: 'run-1' }), { runId: 'run-1' });
});

test('student progress offers retry for ordinary load failures without changing unauthorized handling', async () => {
  const source = await readFile(path.join(root, 'pages/student/progress.jsx'), 'utf8');

  assert.match(source, /loadAttempt/);
  assert.match(source, /setLoadAttempt/);
  assert.match(source, /Retry/);
  assert.match(source, /isUnauthorized\(e\)/);
  assert.match(source, /window\.location\.replace\('\/student'\)/);
});

test('attendance CSV file imports guard in-flight reads and report FileReader errors', async () => {
  const source = await readFile(path.join(root, 'src/components/teacher/AttendancePage.jsx'), 'utf8');

  assert.match(source, /fileReaderRef/);
  assert.match(source, /reader\.onerror/);
  assert.match(source, /if \(fileReaderRef\.current\)/);
});

test('attendance CSV import bounds files and cancels an active reader on unmount', async () => {
  const source = await readFile(path.join(root, 'src/components/teacher/AttendancePage.jsx'), 'utf8');

  assert.match(source, /MAX_CSV_INPUT_BYTES/);
  assert.match(source, /file\.size > MAX_CSV_INPUT_BYTES/);
  assert.match(source, /reader\.onload = null/);
  assert.match(source, /reader\.abort\(\)/);
});

test('attendance CSV import clears an older draft when reading or parsing a replacement fails', async () => {
  const source = await readFile(path.join(root, 'src/components/teacher/AttendancePage.jsx'), 'utf8');

  assert.match(source, /function showImportError\(message\)/);
  assert.match(source, /showImportError\(cause\.message/);
  assert.match(source, /setImportDraft\(null\);/);
});

test('progress editor validates final points and only creates mailto links for email usernames', async () => {
  const source = await readFile(path.join(root, 'src/components/teacher/ProgressEditor.jsx'), 'utf8');

  assert.match(source, /Final points must be a whole number from 0 to 100/);
  assert.match(source, /isEmailAddress\(username\)/);
  assert.match(source, /status\.accessCode && isEmailAddress\(username\)/);
});

test('progress editor drops a queued final-points patch when the draft becomes invalid', async () => {
  const source = await readFile(path.join(root, 'src/components/teacher/ProgressEditor.jsx'), 'utf8');

  assert.match(source, /delete pendingRef\.current\.assignment_final_points/);
  assert.match(source, /delete failedRef\.current\.assignment_final_points/);
});
