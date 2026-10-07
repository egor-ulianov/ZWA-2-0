import assert from 'node:assert/strict';
import test from 'node:test';

import {
  normalizeRosterRows,
  validateAttendanceInput,
  validateLectureNumber,
  filterAssignmentPatch,
  validateUsername,
} from '../../src/server/repositories/validation.js';
import { createAttendanceRepository } from '../../src/server/repositories/attendance.js';
import { createProgressRepository } from '../../src/server/repositories/progress.js';
import { createStudentsRepository } from '../../src/server/repositories/students.js';

test('rejects invalid usernames before a database query can be built', () => {
  assert.throws(() => validateUsername('alice; drop table students'), /username/i);
  assert.equal(validateUsername('alice.smith'), 'alice.smith');
});

test('accepts only whole lecture numbers from 1 through 13', () => {
  assert.equal(validateLectureNumber(1), 1);
  assert.equal(validateLectureNumber(13), 13);
  for (const invalid of [0, 14, 1.5, '04', 'lecture 1']) {
    assert.throws(() => validateLectureNumber(invalid), /lecture/i);
  }
});

test('rejects oversized attendance snapshots', () => {
  assert.throws(
    () => validateAttendanceInput({
      lecture: 4,
      entries: Array.from({ length: 501 }, (_, index) => ({ username: `student${index}`, present: true })),
      actor: 'teacher',
    }),
    /500/i,
  );
});

test('deduplicates roster rows after normalizing usernames', () => {
  assert.deepEqual(normalizeRosterRows([
    { username: ' Alice ' },
    { username: 'alice' },
    { username: 'bob' },
  ]), [
    { username: 'alice' },
    { username: 'bob' },
  ]);
});

test('roster replacement deactivates the previous roster and upserts the new active students atomically', async () => {
  const queries = [];
  let transactionQueries;
  const sql = (query, parameters) => {
    const request = { query, parameters };
    queries.push(request);
    return request;
  };
  sql.transaction = async (items) => {
    transactionQueries = items;
    return [];
  };

  const result = await createStudentsRepository(sql).replaceRoster([
    { username: 'ada', firstName: 'Ada', lastName: 'Lovelace', parallel: '107' },
    { username: 'karel.capek', firstName: 'Karel', lastName: 'Čapek', parallel: '108' },
  ]);

  assert.equal(transactionQueries.length, 4);
  assert.match(transactionQueries[0].query, /pg_advisory_xact_lock/i);
  assert.match(transactionQueries[1].query, /update students set active = false/i);
  assert.match(transactionQueries[2].query, /on conflict \(username\) do update/i);
  assert.deepEqual(queries.filter(({ parameters }) => parameters?.length === 4).map(({ parameters }) => parameters), [
    ['ada', 'Ada', 'Lovelace', '107'],
    ['karel.capek', 'Karel', 'Čapek', '108'],
  ]);
  assert.deepEqual(result, {
    imported: 2,
    students: [
      { username: 'ada', firstName: 'Ada', lastName: 'Lovelace', parallel: '107' },
      { username: 'karel.capek', firstName: 'Karel', lastName: 'Čapek', parallel: '108' },
    ],
  });
});

test('filters progress changes to assignment fields and enforces score bounds', () => {
  assert.deepEqual(filterAssignmentPatch({
    assignment_topic: 'HTTP',
    test1: 12,
    auth_code: 'not persisted here',
  }), { assignment_topic: 'HTTP' });
  assert.deepEqual(filterAssignmentPatch({ assignment_final_points: null }), { assignment_final_points: null });
  assert.throws(
    () => filterAssignmentPatch({ assignment_final_points: 101 }),
    /final points/i,
  );
});

test('uses one transaction for a validated bulk attendance write', async () => {
  const queries = [];
  const sql = (query, parameters) => {
    queries.push({ query, parameters });
    return Promise.resolve([]);
  };
  let transactionQueries;
  sql.transaction = async (items) => { transactionQueries = items; };

  const result = await createAttendanceRepository(sql).bulkUpsert({
    lecture: 4, actor: 'teacher',
    entries: [{ username: 'alice', present: true }, { username: 'bob', present: false }],
  });

  assert.deepEqual(result, { count: 2 });
  assert.equal(transactionQueries.length, 2);
  assert.deepEqual(queries.map(({ parameters }) => parameters), [
    [4, 'alice', true, 'teacher'],
    [4, 'bob', false, 'teacher'],
  ]);
});

test('returns student attendance keyed by lecture number', async () => {
  const sql = async () => [
    { lecture_number: 13, present: true },
  ];

  assert.deepEqual(await createAttendanceRepository(sql).getForStudent('alice'), {
    13: true,
  });
});

test('passes a cleared final-points value as SQL NULL through the progress repository', async () => {
  const queries = [];
  const sql = async (query, parameters) => {
    queries.push({ query, parameters });
    return [{ username: 'alice', assignment_final_points: null }];
  };

  const result = await createProgressRepository(sql).patch(
    'alice',
    { assignment_final_points: null },
    'teacher',
  );

  assert.equal(result.assignment_final_points, null);
  assert.equal(queries.length, 1);
  assert.equal(queries[0].parameters[1], null);
  assert.match(queries[0].query, /assignment_final_points/);
});
