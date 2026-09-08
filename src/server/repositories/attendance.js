import { getDb } from '../db.js';
import { validateAttendanceInput, validateIsoDate, validateUsername } from './validation.js';

export class AttendanceConflictError extends Error {
  constructor(message = 'Attendance revision is stale') {
    super(message);
    this.name = 'AttendanceConflictError';
  }
}

export function createAttendanceRepository(sql = getDb()) {
  return {
    async getByDate(attendanceDate) {
      const date = validateIsoDate(attendanceDate);
      const rows = await sql('select username, present from attendance where attendance_date = $1', [date]);
      return Object.fromEntries(rows.map((row) => [row.username, Boolean(row.present)]));
    },
    async getByDateWithRevision(attendanceDate) {
      const date = validateIsoDate(attendanceDate);
      const [rows, revisions] = await sql.transaction((transaction) => [
        transaction('select username, present from attendance where attendance_date = $1', [date]),
        transaction('select revision from attendance_revisions where attendance_date = $1', [date]),
      ], { isolationLevel: 'RepeatableRead' });
      return {
        map: Object.fromEntries((rows || []).map((row) => [row.username, Boolean(row.present)])),
        revision: Number(revisions?.[0]?.revision || 0),
      };
    },
    async getOverview() {
      const rows = await sql('select attendance_date, username, present from attendance order by attendance_date, username');
      return rows.reduce((overview, row) => {
        const date = String(row.attendance_date).slice(0, 10);
        overview[date] ||= {};
        overview[date][row.username] = Boolean(row.present);
        return overview;
      }, {});
    },
    async getForStudent(username) {
      const rows = await sql('select attendance_date, present from attendance where username = $1 order by attendance_date', [validateUsername(username)]);
      return Object.fromEntries(rows.map((row) => [String(row.attendance_date).slice(0, 10), Boolean(row.present)]));
    },
    async bulkUpsert(input) {
      const { attendanceDate, entries, actor, expectedRevision } = validateAttendanceInput(input);
      if (!entries.length && (expectedRevision === undefined || expectedRevision === null)) return { count: 0 };
      if (expectedRevision !== undefined && expectedRevision !== null) {
        const results = await sql.transaction([
          sql(
            `insert into attendance_revisions (attendance_date, revision)
             values ($1, 0) on conflict (attendance_date) do nothing`,
            [attendanceDate],
          ),
          sql(
            `with bumped as (
               update attendance_revisions
               set revision = revision + 1, updated_at = now()
               where attendance_date = $1 and revision = $2
               returning revision
             ), upserted as (
               insert into attendance (attendance_date, username, present, updated_by)
               select $1, item.username, item.present, $4
               from jsonb_to_recordset($3::jsonb) as item(username text, present boolean)
               cross join bumped
               on conflict (attendance_date, username) do update
                 set present = excluded.present, updated_by = excluded.updated_by, updated_at = now()
               returning 1
             )
             select revision, (select count(*)::int from upserted) as count from bumped`,
            [attendanceDate, expectedRevision, JSON.stringify(entries), actor],
          ),
        ]);
        const result = results?.[1]?.[0];
        if (!result) throw new AttendanceConflictError();
        return { count: Number(result.count), revision: Number(result.revision) };
      }
      await sql.transaction(entries.map(({ username, present }) => sql(
        `insert into attendance (attendance_date, username, present, updated_by)
         values ($1, $2, $3, $4)
         on conflict (attendance_date, username) do update set present = excluded.present, updated_by = excluded.updated_by, updated_at = now()`,
        [attendanceDate, username, present, actor],
      )));
      return { count: entries.length };
    },
  };
}
