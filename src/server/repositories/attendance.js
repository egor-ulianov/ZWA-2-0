import { getDb } from '../db.js';
import { validateAttendanceInput, validateIsoDate, validateUsername } from './validation.js';

export function createAttendanceRepository(sql = getDb()) {
  return {
    async getByDate(attendanceDate) {
      const date = validateIsoDate(attendanceDate);
      const rows = await sql('select username, present from attendance where attendance_date = $1', [date]);
      return Object.fromEntries(rows.map((row) => [row.username, Boolean(row.present)]));
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
      const { attendanceDate, entries, actor } = validateAttendanceInput(input);
      if (!entries.length) return { count: 0 };
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
