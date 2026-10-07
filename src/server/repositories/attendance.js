import { getDb } from '../db.js';
import {
  validateAttendanceInput,
  validateLectureNumber,
  validateUsername,
} from './validation.js';

export class AttendanceConflictError extends Error {
  constructor(message = 'Attendance revision is stale') {
    super(message);
    this.name = 'AttendanceConflictError';
  }
}

export function createAttendanceRepository(sql = getDb()) {
  return {
    async getByLecture(lecture) {
      const lectureNumber = validateLectureNumber(lecture);
      const rows = await sql(
        'select username, present from attendance where lecture_number = $1',
        [lectureNumber],
      );
      return Object.fromEntries(rows.map((row) => [row.username, Boolean(row.present)]));
    },
    async getByLectureWithRevision(lecture) {
      const lectureNumber = validateLectureNumber(lecture);
      const [rows, revisions] = await sql.transaction(
        (transaction) => [
          transaction('select username, present from attendance where lecture_number = $1', [
            lectureNumber,
          ]),
          transaction('select revision from attendance_revisions where lecture_number = $1', [
            lectureNumber,
          ]),
        ],
        { isolationLevel: 'RepeatableRead' },
      );
      return {
        map: Object.fromEntries((rows || []).map((row) => [row.username, Boolean(row.present)])),
        revision: Number(revisions?.[0]?.revision || 0),
      };
    },
    async getOverviewWithRevisions() {
      const [rows, revisionRows] = await sql.transaction(
        (transaction) => [
          transaction(
            'select lecture_number, username, present from attendance order by lecture_number, username',
          ),
          transaction(
            'select lecture_number, revision from attendance_revisions order by lecture_number',
          ),
        ],
        { isolationLevel: 'RepeatableRead' },
      );
      const overview = (rows || []).reduce((result, row) => {
        const lecture = validateLectureNumber(row.lecture_number);
        result[lecture] ||= {};
        result[lecture][row.username] = Boolean(row.present);
        return result;
      }, {});
      const revisions = Object.fromEntries(
        (revisionRows || []).map((row) => [
          validateLectureNumber(row.lecture_number),
          Number(row.revision),
        ]),
      );
      return { overview, revisions };
    },
    async getForStudent(username) {
      const rows = await sql(
        'select lecture_number, present from attendance where username = $1 order by lecture_number',
        [validateUsername(username)],
      );
      return Object.fromEntries(
        rows.map((row) => [validateLectureNumber(row.lecture_number), Boolean(row.present)]),
      );
    },
    async bulkUpsert(input) {
      const { lecture, entries, actor, expectedRevision } = validateAttendanceInput(input);
      if (!entries.length && (expectedRevision === undefined || expectedRevision === null)) return { count: 0 };
      if (expectedRevision !== undefined && expectedRevision !== null) {
        const results = await sql.transaction([
          sql(
            `insert into attendance_revisions (lecture_number, revision)
             values ($1, 0) on conflict (lecture_number) do nothing`,
            [lecture],
          ),
          sql(
            `with bumped as (
               update attendance_revisions
               set revision = revision + 1, updated_at = now()
               where lecture_number = $1 and revision = $2
               returning revision
             ), upserted as (
               insert into attendance (lecture_number, username, present, updated_by)
               select $1, item.username, item.present, $4
               from jsonb_to_recordset($3::jsonb) as item(username text, present boolean)
               cross join bumped
               on conflict (lecture_number, username) do update
                 set present = excluded.present, updated_by = excluded.updated_by, updated_at = now()
               returning 1
             )
             select revision, (select count(*)::int from upserted) as count from bumped`,
            [lecture, expectedRevision, JSON.stringify(entries), actor],
          ),
        ]);
        const result = results?.[1]?.[0];
        if (!result) throw new AttendanceConflictError();
        return { count: Number(result.count), revision: Number(result.revision) };
      }
      await sql.transaction(entries.map(({ username, present }) => sql(
        `insert into attendance (lecture_number, username, present, updated_by)
         values ($1, $2, $3, $4)
         on conflict (lecture_number, username) do update set present = excluded.present, updated_by = excluded.updated_by, updated_at = now()`,
        [lecture, username, present, actor],
      )));
      return { count: entries.length };
    },
  };
}
