import assert from 'node:assert/strict';
import test from 'node:test';

import {
  normalizeRosterRows,
  validateAttendanceInput,
  filterAssignmentPatch,
  validateUsername,
} from '../../src/server/repositories/validation.js';
import { createAttendanceRepository } from '../../src/server/repositories/attendance.js';
import { createProgressRepository } from '../../src/server/repositories/progress.js';

test('rejects invalid usernames before a database query can be built', () => {
  assert.throws(() => validateUsername('alice; drop table students'), /username/i);
  assert.equal(validateUsername('alice.smith'), 'alice.smith');
});

test('rejects malformed attendance dates and oversized bulk entries', () => {
  assert.throws(
    () => validateAttendanceInput({ attendanceDate: '08/09/2026', entries: [], actor: 'teacher' }),
    /date/i,
  );
  assert.throws(
    () => validateAttendanceInput({
      attendanceDate: '2026-09-08',
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
    attendanceDate: '2026-09-08', actor: 'teacher',
    entries: [{ username: 'alice', present: true }, { username: 'bob', present: false }],
  });

  assert.deepEqual(result, { count: 2 });
  assert.equal(transactionQueries.length, 2);
  assert.deepEqual(queries.map(({ parameters }) => parameters), [
    ['2026-09-08', 'alice', true, 'teacher'],
    ['2026-09-08', 'bob', false, 'teacher'],
  ]);
});

test('normalizes PostgreSQL date values returned as Date instances', async () => {
  const sql = async () => [
    { attendance_date: new Date(2026, 8, 8), present: true },
  ];

  assert.deepEqual(await createAttendanceRepository(sql).getForStudent('alice'), {
    '2026-09-08': true,
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
