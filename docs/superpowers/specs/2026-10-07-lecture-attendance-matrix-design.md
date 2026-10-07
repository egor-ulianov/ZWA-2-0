# Lecture Attendance Matrix Design

## Purpose

Replace date-oriented attendance editing with one compact teacher matrix. Teachers see the active roster as rows and the thirteen course lectures as numbered columns, and can change any student's attendance for any lecture directly in the table. Dates are not shown on teacher, student, or attendance CSV surfaces.

## Scope

- Use fixed lecture numbers 1 through 13.
- Show each active student by full name, username, and parallel.
- Keep the existing name/username search and parallel filter; both filter matrix rows.
- Render one checkbox for every visible student and lecture combination.
- Save each changed cell immediately while preserving attendance for every other student in that lecture.
- Show each student's total present count.
- Keep assignment-progress editing below the attendance matrix, without a duplicate attendance control in each student card.
- Convert attendance CSV import/export from `date` to `lecture`.
- Show lecture numbers rather than dates in the student attendance record.
- Manual student add/delete remains out of scope.

## Data Model and Migration

Attendance is keyed by `lecture_number` instead of `attendance_date`.

The project is treated as having no attendance history. Migration `008` replaces the date-based attendance and revision structures without backfill or compatibility behavior. The resulting constraints are:

- `attendance.lecture_number` is an integer from 1 through 13.
- The attendance primary key is `(lecture_number, username)`.
- `attendance_revisions.lecture_number` is an integer from 1 through 13 and remains the revision primary key.

Existing date-based attendance and revision rows, if any, are intentionally discarded by this migration.

## Server Contract

The teacher attendance API keeps its existing routes and optimistic-concurrency behavior, but replaces `date` with `lecture`:

- `GET /api/attendance` returns the full overview plus the current revision for every lecture.
- `GET /api/attendance?lecture=4` returns `{ lecture: 4, map, revision }`.
- `POST /api/attendance` accepts `{ lecture: 4, map }` plus the existing revision precondition.

Repository validation accepts only integer lecture numbers from 1 through 13. Student attendance returns a lecture-number keyed map.

Each matrix cell change uses the complete snapshot and revision for that lecture. Request queues remain independent per lecture so edits in different columns can save concurrently. A stale revision reloads that lecture, reports the conflict, and does not claim the edit succeeded.

## Teacher Experience

The current active-day panel and the read-only historical table are replaced by one `Attendance by lecture` panel:

- The first column is sticky and contains student identity.
- Columns are labeled `1` through `13` under a `Lecture` heading; no dates or date inputs appear.
- Checkbox accessible names include both the student and lecture, for example `Ada Lovelace, lecture 4`.
- The final column displays `present / 13`.
- The table scrolls horizontally on narrow screens while the student identity remains visible.
- A compact live status reports saving, saved, conflict, or failure for the affected lecture.

Roster upload, roster preview, search, parallel filtering, and assignment-progress records remain available. Attendance CSV actions remain, using lecture numbers.

## CSV Contract

Attendance CSV uses columns `username,present,lecture`. Lecture values must be integers from 1 through 13. Export includes all active students for all thirteen lectures. Import may contain multiple lectures and previews accepted and rejected rows before confirmation. Confirmation merges the accepted cells into their corresponding lecture snapshots and saves each affected lecture with its own revision.

## Student Experience

The student progress page labels attendance entries as `Lecture 1`, `Lecture 2`, and so forth. It does not expose former dates. Totals continue to count present values.

## Error Handling

- A failed cell save restores the last server-confirmed value for that lecture and offers retry.
- A revision conflict reloads only the conflicted lecture.
- Invalid lecture numbers receive a bounded 400 response.
- CSV diagnostics identify the row and invalid lecture value.
- Loading failure disables matrix checkboxes until attendance data is reliable.

## Verification

Keep verification proportionate:

- Unit coverage for lecture validation and lecture-based CSV parsing.
- Repository/API coverage for lecture snapshots, revisions, and the migration contract.
- One Playwright workflow covering the matrix, row filtering, and independent checkbox edits across two lectures.
- Existing focused teacher and student workflows, lint, formatting, and type-checking.
