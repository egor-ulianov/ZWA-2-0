import crypto from 'node:crypto';

// Neon transforms the database host into the HTTP API host before calling fetch.
const TEST_DATABASE_HOST = 'api.test';
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1, maxmem: 32 * 1024 * 1024 };

function accessCodeHash(code) {
  const salt = Buffer.alloc(16, 7);
  const key = crypto.scryptSync(code, salt, 64, SCRYPT_OPTIONS);
  return `scrypt$${salt.toString('base64url')}$${key.toString('base64url')}`;
}

const state = {
  students: [{ username: 'e2e_student' }],
  access: {
    username: 'e2e_student',
    auth_code_hash: accessCodeHash('e2e-student-code'),
    expires_at: null,
    revoked_at: null,
    failed_attempts: 0,
    locked_until: null,
  },
  assignment: {
    username: 'e2e_student',
    assignment_task_checked: true,
    assignment_midterm_ok: true,
    assignment_topic: 'Real integration topic',
    assignment_partner: 'e2e_partner',
    assignment_final_points: 12,
    updated_by: 'e2e-fixture',
    updated_at: '2026-09-08T09:00:00.000Z',
  },
  attendance: [{ attendance_date: '2026-09-08', username: 'e2e_student', present: true }],
  grades: [
    {
      id: 1,
      username: 'e2e_student',
      test_number: 1,
      points: 9,
      max_points: 12,
      reasoning: 'Real provider-backed grade.',
      created_at: '2026-09-08T10:00:00.000Z',
    },
  ],
  attendanceRevisions: new Map([['2026-09-08', 0]]),
  revokedSessions: new Set(),
  rateLimitBuckets: new Map(),
};

function field(name, dataTypeID = 25) {
  return { name, dataTypeID };
}

function rawValue(dataTypeID, value) {
  if (value === null || value === undefined) return null;
  if (dataTypeID === 16) return value ? 't' : 'f';
  if ([20, 21, 23, 700, 701].includes(dataTypeID)) return String(value);
  return value;
}

function rows(fields, values = []) {
  return {
    fields: fields.map(([name, type]) => field(name, type)),
    rows: values.map((row) => row.map((value, index) => rawValue(fields[index]?.[1], value))),
  };
}

function emptyResult() {
  return rows([]);
}

function resultFor(query, parameters = []) {
  const normalized = query.replace(/\s+/g, ' ').trim().toLowerCase();
  const params = Array.isArray(parameters) ? parameters : [];

  // Migrations are deliberately gated by scripts/start.mjs. Their DDL is not
  // interpreted here because the application data below is the isolated test
  // database; the batch still receives one Neon result for every statement.
  if (
    normalized.startsWith('do $') ||
    normalized.startsWith('create table') ||
    normalized.startsWith('alter table') ||
    normalized.startsWith('select pg_advisory')
  ) {
    return emptyResult();
  }

  if (normalized.includes('with expired_buckets')) {
    const bucketKey = `${params[0]}|${params[1]}`;
    const requestCount = (state.rateLimitBuckets.get(bucketKey) || 0) + 1;
    state.rateLimitBuckets.set(bucketKey, requestCount);
    return rows([['request_count', 23]], [[requestCount]]);
  }

  if (normalized.includes('from revoked_sessions')) {
    return state.revokedSessions.has(params[0]) ? rows([['?column?', 23]], [[1]]) : emptyResult();
  }

  if (normalized.includes('insert into revoked_sessions')) {
    state.revokedSessions.add(params[0]);
    return emptyResult();
  }

  if (normalized.includes('from student_access')) {
    const access = state.access.username === params[0] ? state.access : null;
    return rows(
      [
        ['auth_code_hash', 25],
        ['expires_at', 1184],
        ['revoked_at', 1184],
        ['failed_attempts', 23],
        ['locked_until', 1184],
      ],
      access
        ? [
            [
              access.auth_code_hash,
              access.expires_at,
              access.revoked_at,
              access.failed_attempts,
              access.locked_until,
            ],
          ]
        : [],
    );
  }

  if (normalized.includes('from assignments where username')) {
    const assignment = state.assignment.username === params[0] ? state.assignment : null;
    return rows(
      [
        ['username', 25],
        ['assignment_task_checked', 16],
        ['assignment_midterm_ok', 16],
        ['assignment_topic', 25],
        ['assignment_partner', 25],
        ['assignment_final_points', 23],
        ['updated_by', 25],
        ['updated_at', 1184],
      ],
      assignment
        ? [
            [
              assignment.username,
              assignment.assignment_task_checked,
              assignment.assignment_midterm_ok,
              assignment.assignment_topic,
              assignment.assignment_partner,
              assignment.assignment_final_points,
              assignment.updated_by,
              assignment.updated_at,
            ],
          ]
        : [],
    );
  }

  if (normalized.includes('from assignments order by username')) {
    return rows(
      [
        ['username', 25],
        ['assignment_task_checked', 16],
        ['assignment_midterm_ok', 16],
        ['assignment_topic', 25],
        ['assignment_partner', 25],
        ['assignment_final_points', 23],
        ['updated_by', 25],
        ['updated_at', 1184],
      ],
      [state.assignment].map((assignment) => [
        assignment.username,
        assignment.assignment_task_checked,
        assignment.assignment_midterm_ok,
        assignment.assignment_topic,
        assignment.assignment_partner,
        assignment.assignment_final_points,
        assignment.updated_by,
        assignment.updated_at,
      ]),
    );
  }

  if (normalized.includes('from students order by username')) {
    return rows(
      [['username', 25]],
      state.students.map(({ username }) => [username]),
    );
  }

  if (normalized.includes('select attendance_date, username, present from attendance')) {
    return rows(
      [
        ['attendance_date', 1082],
        ['username', 25],
        ['present', 16],
      ],
      [...state.attendance]
        .sort((left, right) =>
          `${left.attendance_date}:${left.username}`.localeCompare(
            `${right.attendance_date}:${right.username}`,
          ),
        )
        .map((entry) => [entry.attendance_date, entry.username, entry.present]),
    );
  }

  if (normalized.includes('from attendance where username')) {
    return rows(
      [
        ['attendance_date', 1082],
        ['present', 16],
      ],
      state.attendance
        .filter((entry) => entry.username === params[0])
        .sort((left, right) => left.attendance_date.localeCompare(right.attendance_date))
        .map((entry) => [entry.attendance_date, entry.present]),
    );
  }

  if (normalized.includes('select username, present from attendance where attendance_date')) {
    return rows(
      [
        ['username', 25],
        ['present', 16],
      ],
      state.attendance
        .filter((entry) => entry.attendance_date === params[0])
        .map((entry) => [entry.username, entry.present]),
    );
  }

  if (normalized.includes('select revision from attendance_revisions')) {
    const revision = state.attendanceRevisions.get(params[0]);
    return revision === undefined ? emptyResult() : rows([['revision', 23]], [[revision]]);
  }

  if (normalized.includes('insert into attendance_revisions')) {
    if (!state.attendanceRevisions.has(params[0])) state.attendanceRevisions.set(params[0], 0);
    return emptyResult();
  }

  if (normalized.includes('with bumped as')) {
    const date = params[0];
    const expectedRevision = Number(params[1]);
    const currentRevision = state.attendanceRevisions.get(date) || 0;
    if (currentRevision !== expectedRevision) return emptyResult();
    const entries = JSON.parse(params[2] || '[]');
    for (const entry of entries) {
      const existing = state.attendance.find(
        (item) => item.attendance_date === date && item.username === entry.username,
      );
      if (existing) existing.present = Boolean(entry.present);
      else
        state.attendance.push({
          attendance_date: date,
          username: entry.username,
          present: Boolean(entry.present),
        });
    }
    const revision = currentRevision + 1;
    state.attendanceRevisions.set(date, revision);
    return rows(
      [
        ['revision', 23],
        ['count', 23],
      ],
      [[revision, entries.length]],
    );
  }

  if (normalized.includes('insert into attendance (attendance_date')) {
    const [date, username, present] = params;
    const existing = state.attendance.find(
      (item) => item.attendance_date === date && item.username === username,
    );
    if (existing) existing.present = Boolean(present);
    else state.attendance.push({ attendance_date: date, username, present: Boolean(present) });
    return emptyResult();
  }

  if (normalized.includes('from published_grades pg join grade_attempts')) {
    return rows(
      [
        ['id', 23],
        ['username', 25],
        ['test_number', 21],
        ['points', 21],
        ['max_points', 21],
        ['reasoning', 25],
        ['created_at', 1184],
      ],
      state.grades
        .filter((grade) => grade.username === params[0])
        .sort((left, right) => left.test_number - right.test_number)
        .map((grade) => [
          grade.id,
          grade.username,
          grade.test_number,
          grade.points,
          grade.max_points,
          grade.reasoning,
          grade.created_at,
        ]),
    );
  }

  if (normalized.includes('update student_access set failed_attempts = 0')) {
    state.access.failed_attempts = 0;
    state.access.locked_until = null;
    return emptyResult();
  }

  if (normalized.includes('update student_access set failed_attempts')) {
    state.access.failed_attempts += 1;
    return emptyResult();
  }

  if (normalized.includes('insert into assignments')) {
    const fieldMatch = normalized.match(/insert into assignments \(([^)]+)\)/);
    const fields = fieldMatch ? fieldMatch[1].split(',').map((field) => field.trim()) : [];
    const username = params[0];
    if (username === state.assignment.username) {
      fields.slice(1).forEach((field, index) => {
        state.assignment[field] = params[index + 1];
      });
      state.assignment.updated_by = params[fields.length] || state.assignment.updated_by;
    }
    return rows(
      [
        ['username', 25],
        ['assignment_task_checked', 16],
        ['assignment_midterm_ok', 16],
        ['assignment_topic', 25],
        ['assignment_partner', 25],
        ['assignment_final_points', 23],
        ['updated_by', 25],
        ['updated_at', 1184],
      ],
      [
        [
          state.assignment.username,
          state.assignment.assignment_task_checked,
          state.assignment.assignment_midterm_ok,
          state.assignment.assignment_topic,
          state.assignment.assignment_partner,
          state.assignment.assignment_final_points,
          state.assignment.updated_by,
          state.assignment.updated_at,
        ],
      ],
    );
  }

  if (normalized === 'select 1') return rows([['?column?', 23]], [[1]]);
  return emptyResult();
}

async function responseForNeon(input, init) {
  const body = typeof init?.body === 'string' ? init.body : await new Response(init?.body).text();
  const payload = JSON.parse(body || '{}');
  if (Array.isArray(payload.queries)) {
    return { results: payload.queries.map(({ query, params }) => resultFor(query, params)) };
  }
  return resultFor(payload.query, payload.params);
}

if (process.env.E2E_TEST_DATABASE === 'in-memory') {
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input?.url;
    if (url && new URL(url).hostname === TEST_DATABASE_HOST && new URL(url).pathname === '/sql') {
      return new Response(JSON.stringify(await responseForNeon(input, init)), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    return realFetch(input, init);
  };
}

export { accessCodeHash, resultFor, state };
