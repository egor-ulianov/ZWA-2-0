import assert from 'node:assert/strict';
import test from 'node:test';

import { parseAttendanceCsv, serializeAttendanceCsv } from '../../src/lib/csv.js';

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
