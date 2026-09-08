const USERNAME = /^[a-z0-9][a-z0-9._-]{0,63}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ASSIGNMENT_FIELDS = new Set([
  'assignment_task_checked', 'assignment_midterm_ok', 'assignment_topic',
  'assignment_partner', 'assignment_final_points',
]);

export function parseAttendanceRevision(value) {
  if (value === undefined || value === null || value === '') return null;
  const text = String(value).trim();
  const numeric = /^\d+$/.test(text) ? text : (/^"\d+"$/.test(text) ? text.slice(1, -1) : null);
  if (numeric === null) throw new TypeError('Invalid attendance revision');
  const revision = Number(numeric);
  if (!Number.isSafeInteger(revision)) throw new TypeError('Invalid attendance revision');
  return revision;
}

export function validateUsername(value) {
  const username = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (!USERNAME.test(username)) throw new TypeError('Invalid username');
  return username;
}

export function validateIsoDate(value) {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) {
    throw new TypeError('Invalid attendance date');
  }
  const [, yearText, monthText, dayText] = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const year = Number(yearText); const month = Number(monthText); const day = Number(dayText);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (year < 1 || parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) {
    throw new TypeError('Invalid attendance date');
  }
  return value;
}

export function validateAttendanceInput({ attendanceDate, entries, actor, expectedRevision }) {
  const date = validateIsoDate(attendanceDate);
  const revision = expectedRevision === undefined ? undefined : parseAttendanceRevision(expectedRevision);
  if (!Array.isArray(entries) || entries.length > 500) throw new TypeError('Attendance accepts at most 500 entries');
  if (typeof actor !== 'string' || !actor) throw new TypeError('Actor is required');
  const seen = new Set();
  const normalized = entries.map((entry) => {
    if (!entry || typeof entry.present !== 'boolean') throw new TypeError('Attendance presence must be boolean');
    const username = validateUsername(entry.username);
    if (seen.has(username)) throw new TypeError('Duplicate attendance username');
    seen.add(username);
    return { username, present: entry.present };
  });
  return { attendanceDate: date, entries: normalized, actor, expectedRevision: revision };
}

export function normalizeRosterRows(rows) {
  if (!Array.isArray(rows)) throw new TypeError('Roster rows must be an array');
  if (rows.length > 5000) throw new TypeError('Roster accepts at most 5000 rows');
  const users = new Set();
  const normalized = [];
  for (const row of rows) {
    const username = validateUsername(row?.username);
    if (users.has(username)) continue;
    users.add(username);
    normalized.push({ username });
  }
  return normalized;
}

export function filterAssignmentPatch(patch) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) throw new TypeError('Invalid progress patch');
  const filtered = {};
  for (const [field, value] of Object.entries(patch)) {
    if (!ASSIGNMENT_FIELDS.has(field)) continue;
    if (field === 'assignment_task_checked' || field === 'assignment_midterm_ok') {
      if (typeof value !== 'boolean') throw new TypeError(`${field} must be boolean`);
    } else if (field === 'assignment_final_points') {
      if (!Number.isInteger(value) || value < 0 || value > 100) throw new TypeError('Invalid final points');
    } else if (typeof value !== 'string' || value.length > (field === 'assignment_topic' ? 500 : 200)) {
      throw new TypeError(`Invalid ${field}`);
    }
    filtered[field] = value;
  }
  return filtered;
}

export function validateScore(points, maxPoints) {
  if (!Number.isInteger(points) || !Number.isInteger(maxPoints) || maxPoints < 1 || maxPoints > 100 || points < 0 || points > maxPoints) {
    throw new TypeError('Invalid score');
  }
  return { points, maxPoints };
}
