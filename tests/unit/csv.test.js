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
    { username: 'ada', present: true, lecture: 1, note: 'Lab 1, "intro"\nbring ID' },
    { username: 'bob', present: false, lecture: 13, note: '' },
  ]);

  assert.equal(
    csv,
    'username,present,lecture,note\r\nada,1,1,"Lab 1, ""intro""\nbring ID"\r\nbob,0,13,\r\n',
  );
  assert.deepEqual(parseAttendanceCsv(csv), {
    entries: [
      { username: 'ada', present: true, lecture: 1 },
      { username: 'bob', present: false, lecture: 13 },
    ],
    rejected: [],
  });
});

test('attendance CSV accepts a BOM and reports unknown or invalid rows', () => {
  const csv = '\uFEFFusername,present,lecture\r\nada,true,1\r\nunknown,0,2\r\nempty,,3\r\n';

  assert.deepEqual(parseAttendanceCsv(csv, { knownUsernames: new Set(['ada']) }), {
    entries: [{ username: 'ada', present: true, lecture: 1 }],
    rejected: [
      { row: 3, username: 'unknown', reason: 'Unknown username' },
      { row: 4, username: 'empty', reason: 'Present must be 1, 0, true, or false' },
    ],
  });
});

test('attendance CSV rejects invalid lectures and duplicate student lecture cells', () => {
  const parsed = parseAttendanceCsv([
    'username,present,lecture',
    'ada,1,1',
    'ADA,0,1',
    'ada,0,2',
    'bob,0,14',
  ].join('\r\n'));

  assert.deepEqual(parsed.entries, [
    { username: 'ada', present: true, lecture: 1 },
    { username: 'ada', present: false, lecture: 2 },
  ]);
  assert.deepEqual(parsed.rejected, [
    { row: 3, username: 'ada', reason: 'Duplicate username and lecture' },
    { row: 5, username: 'bob', reason: 'Lecture must be a whole number from 1 to 13' },
  ]);
});

test('attendance CSV diagnoses missing columns and rows with the wrong number of columns', () => {
  assert.throws(
    () => parseAttendanceCsv('username,lecture\r\nada,1\r\n'),
    /Missing column: present/,
  );

  const parsed = parseAttendanceCsv([
    'username,present,lecture',
    'ada,1,1,unexpected',
    'bob,0,13',
  ].join('\r\n'));

  assert.deepEqual(parsed.entries, [{ username: 'bob', present: false, lecture: 13 }]);
  assert.deepEqual(parsed.rejected, [
    { row: 2, username: 'ada', reason: 'Expected 3 columns, got 4' },
  ]);
});

test('attendance CSV reports malformed quoted rows instead of confirming them', () => {
  const parsed = parseAttendanceCsv([
    'username,present,lecture',
    'ada,1,"13',
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

test('teacher roster CSV maps names, usernames, and exercise parallels', async () => {
  const { parseTeacherRosterCsv } = await import('../../src/lib/csv.js');
  const csv = [
    'Last Name,First Name,Username,Exerc.,Exercise Teachers',
    'Lovelace,Ada,ADA,107,"Ulianov, Egor"',
    'Čapek,Karel,karel.capek,108,"Ulianov, Egor"',
  ].join('\r\n');

  assert.deepEqual(parseTeacherRosterCsv(csv), {
    students: [
      { username: 'ada', firstName: 'Ada', lastName: 'Lovelace', parallel: '107' },
      { username: 'karel.capek', firstName: 'Karel', lastName: 'Čapek', parallel: '108' },
    ],
    diagnostics: [],
  });
});
