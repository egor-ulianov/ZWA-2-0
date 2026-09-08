import assert from 'node:assert/strict';
import test from 'node:test';

import {
  MAX_CSV_INPUT_CHARACTERS,
  parseAttendanceCsv,
  parseCsvRows,
  serializeAttendanceCsv,
} from '../../src/lib/csv.js';

test('attendance CSV quotes commas, quotes, and line breaks without losing values', () => {
  const csv = serializeAttendanceCsv([
    { username: 'ada', present: true, date: '2026-09-08', note: 'Lab 1, "intro"\nbring ID' },
  ]);

  assert.equal(
    csv,
    'username,present,date,note\r\nada,1,2026-09-08,"Lab 1, ""intro""\nbring ID"\r\n',
  );
  assert.deepEqual(parseAttendanceCsv(csv), {
    date: '2026-09-08',
    entries: [{ username: 'ada', present: true }],
    rejected: [],
  });
});

test('attendance CSV accepts a BOM and reports unknown or invalid rows', () => {
  const csv = '\uFEFFusername,present,date\r\nada,true,2026-09-08\r\nunknown,0,2026-09-08\r\nempty,,2026-09-08\r\n';

  assert.deepEqual(parseAttendanceCsv(csv, { knownUsernames: new Set(['ada']) }), {
    date: '2026-09-08',
    entries: [{ username: 'ada', present: true }],
    rejected: [
      { row: 3, username: 'unknown', reason: 'Unknown username' },
      { row: 4, username: 'empty', reason: 'Present must be 1, 0, true, or false' },
    ],
  });
});

test('attendance CSV rejects calendar rollover dates while accepting a valid leap day', () => {
  const parsed = parseAttendanceCsv([
    'username,present,date',
    'ada,1,2026-02-29',
    'bob,0,2028-02-29',
  ].join('\r\n'));

  assert.equal(parsed.date, '2028-02-29');
  assert.deepEqual(parsed.entries, [{ username: 'bob', present: false }]);
  assert.deepEqual(parsed.rejected, [
    { row: 2, username: 'ada', reason: 'Date must be a real YYYY-MM-DD date' },
  ]);
});

test('attendance CSV rejects duplicate usernames before confirmation', () => {
  const parsed = parseAttendanceCsv([
    'username,present,date',
    'ada,1,2026-09-08',
    'ADA,0,2026-09-08',
    'bob,0,2026-09-08',
  ].join('\n'));

  assert.deepEqual(parsed.entries, [
    { username: 'ada', present: true },
    { username: 'bob', present: false },
  ]);
  assert.deepEqual(parsed.rejected, [
    { row: 3, username: 'ada', reason: 'Duplicate username' },
  ]);
});

test('attendance CSV diagnoses missing columns and rows with the wrong number of columns', () => {
  assert.throws(
    () => parseAttendanceCsv('username,date\r\nada,2026-09-08\r\n'),
    /Missing column: present/,
  );

  const parsed = parseAttendanceCsv([
    'username,present,date',
    'ada,1,2026-09-08,unexpected',
    'bob,0,2026-09-08',
  ].join('\r\n'));

  assert.deepEqual(parsed.entries, [{ username: 'bob', present: false }]);
  assert.deepEqual(parsed.rejected, [
    { row: 2, username: 'ada', reason: 'Expected 3 columns, got 4' },
  ]);
});

test('attendance CSV reports malformed quoted rows instead of confirming them', () => {
  const parsed = parseAttendanceCsv([
    'username,present,date',
    'ada,1,"2026-09-08',
  ].join('\r\n'));

  assert.deepEqual(parsed.entries, []);
  assert.deepEqual(parsed.rejected, [
    { row: 2, username: 'ada', reason: 'Unterminated quoted field starting at line 2' },
  ]);
});

test('CSV preserves a valid multiline field when its continuation contains a delimiter', () => {
  assert.deepEqual(parseCsvRows([
    'username,note',
    'ada,"first line',
    'second line, with a comma"',
  ].join('\r\n')), [
    { line: 1, values: ['username', 'note'], errors: [] },
    { line: 2, values: ['ada', 'first line\r\nsecond line, with a comma'], errors: [] },
  ]);
});

test('CSV rejects oversized input before parsing it', () => {
  assert.throws(
    () => parseCsvRows('x'.repeat(MAX_CSV_INPUT_CHARACTERS + 1)),
    /CSV input exceeds the maximum size/,
  );
});
