# Lecture Attendance Matrix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace date-based attendance with a fixed, editable 13-lecture student matrix that never exposes dates.

**Architecture:** Replace the empty date-keyed PostgreSQL attendance tables with lecture-number keyed tables, then carry the `lecture` contract through repository, API, CSV, teacher, and student boundaries. Extract the matrix markup into a focused component while `AttendanceWorkspace` continues to own authenticated loading, optimistic concurrency, queues, and retry behavior.

**Tech Stack:** Next.js 16 Pages Router, React 18, PostgreSQL/Neon, Node test runner, Playwright, CSS Modules.

**Spec:** `docs/superpowers/specs/2026-10-07-lecture-attendance-matrix-design.md`

## Global Constraints

- Work directly in the current branch; do not create a worktree.
- Preserve `.env.local` and all unrelated dirty files.
- Treat attendance history as empty: migration intentionally discards date-based attendance and revisions.
- Lecture numbers are integers from 1 through 13; no attendance surface shows dates.
- Preserve teacher/student authentication, same-origin mutation checks, and optimistic concurrency.
- Manual student add/delete remains out of scope.
- Keep verification focused, then run the repository's normal `npm test` gate before completion.

## Review Focus

- Reject lecture `0`, `14`, fractions, strings that are not canonical integers, and missing lecture values before SQL; Task 1 tests these boundaries.
- A stale revision must reload only the affected lecture and must not overwrite another lecture's optimistic edit; Task 3 exercises independent lecture queues and conflict recovery.
- Rapid checkbox changes in two lecture columns must persist independently; Task 3 covers this in the browser workflow.
- CSV rows may span multiple lectures, but duplicate `(username, lecture)` cells must be rejected without discarding valid rows; Task 2 covers this with literal fixtures.
- A roster row without first/last name metadata must remain readable and accessible in the matrix; Task 3 includes a username-only fixture.

---

### Task 1: Lecture-keyed persistence and validation

**Files:**
- Create: `db/migrations/008_lecture_attendance.sql`
- Modify: `src/server/repositories/validation.js`
- Modify: `src/server/repositories/attendance.js`
- Modify: `tests/unit/repositories.test.js`
- Modify: `tests/unit/server-remediation.test.js`

**Interfaces:**
- Consumes: approved empty-history migration policy.
- Produces: `validateLectureNumber(value) -> integer`; repository methods `getByLecture(lecture)`, `getByLectureWithRevision(lecture)`, `getOverviewWithRevisions()`, `getForStudent(username)`, and `bulkUpsert({ lecture, entries, actor, expectedRevision })`.

- [ ] **Step 1: Write failing repository tests**

Add tests proving that lecture boundaries accept `1` and `13`, reject `0`, `14`, `1.5`, and nonnumeric input, and that a lecture read returns the literal `{ map: { alice: true }, revision: 4 }`. Update the bulk-upsert test to assert SQL parameters begin with lecture `4`, not a date.

- [ ] **Step 2: Run the repository tests and verify RED**

Run: `node --test tests/unit/repositories.test.js tests/unit/server-remediation.test.js`

Expected: failures because lecture validation and lecture repository methods do not exist.

- [ ] **Step 3: Implement the migration and repository contract**

Create migration `008` that drops the empty date-based `attendance` and `attendance_revisions` tables without `CASCADE`, recreates them with `lecture_number integer check (lecture_number between 1 and 13)`, and restores the student foreign key, primary keys, revision, timestamps, and update metadata. Replace date validation and SQL columns with `validateLectureNumber` and `lecture_number`; make overview and revisions load in one repeatable-read transaction.

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run: `node --test tests/unit/repositories.test.js tests/unit/server-remediation.test.js`

Expected: all focused tests pass.

- [ ] **Step 5: Commit the persistence task**

```bash
git add db/migrations/007_student_roster_profiles.sql db/migrations/008_lecture_attendance.sql src/server/repositories/validation.js src/server/repositories/attendance.js tests/unit/repositories.test.js tests/unit/server-remediation.test.js
git commit -m "feat: key attendance by lecture"
```

### Task 2: Lecture API and CSV contracts

**Files:**
- Modify: `pages/api/attendance.js`
- Modify: `pages/api/student/attendance.js`
- Modify: `src/lib/csv.js`
- Modify: `src/lib/apiClient.js`
- Modify: `src/server/API_CONTRACT.md`
- Create: `tests/api/attendance.test.js`
- Modify: `tests/unit/csv.test.js`
- Modify: `tests/unit/ui-state.test.js`

**Interfaces:**
- Consumes: Task 1 repository methods and `validateLectureNumber`.
- Produces: teacher API payloads keyed by lecture, student lecture map, `createAttendanceSnapshotOptions({ lecture, map, revision })`, `serializeAttendanceCsv(rows)` using `username,present,lecture`, and `parseAttendanceCsv(text, options)` returning `{ entries, rejected }` with a lecture on every accepted entry.

- [ ] **Step 1: Write failing API and CSV tests**

Add one route test for `GET /api/attendance?lecture=4` returning `{ lecture: 4, map: { alice: true }, revision: 2 }`, one POST test that rejects lecture `14`, a snapshot-options test asserting body `{ lecture: 4, map: { alice: true } }`, and CSV fixtures asserting the exact header `username,present,lecture`, accepted entries across lectures 1 and 13, and rejection of duplicate `ada`/lecture `1` cells plus an invalid lecture `14` row.

- [ ] **Step 2: Run the API and CSV tests and verify RED**

Run: `node --test tests/api/attendance.test.js tests/unit/csv.test.js tests/unit/ui-state.test.js`

Expected: failures showing the still-date-based route and CSV contract.

- [ ] **Step 3: Implement the lecture contracts**

Change the teacher route query/body and snapshot request builder from `date` to `lecture`, return `{ overview, revisions }` for the overview request, and keep ETag/If-Match behavior. Keep the student route shape `{ username, attendance }`, with attendance keys `1` through `13`. Update CSV parsing, serialization, row diagnostics, and API contract documentation; do not accept or emit the old date column.

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run: `node --test tests/api/attendance.test.js tests/unit/csv.test.js tests/unit/ui-state.test.js`

Expected: all focused tests pass.

- [ ] **Step 5: Commit the contract task**

```bash
git add pages/api/attendance.js pages/api/student/attendance.js src/lib/csv.js src/lib/apiClient.js src/server/API_CONTRACT.md tests/api/attendance.test.js tests/unit/csv.test.js tests/unit/ui-state.test.js
git commit -m "feat: expose lecture attendance contracts"
```

### Task 3: Editable teacher attendance matrix

**Files:**
- Create: `src/course-ui/operations/LectureAttendanceMatrix.jsx`
- Modify: `src/course-ui/operations/AttendanceWorkspace.jsx`
- Modify: `src/course-ui/operations/AttendanceImportPreview.jsx`
- Modify: `src/course-ui/operations/AttendanceStudentRow.jsx`
- Modify: `src/course-ui/operations/StudentRecord.jsx`
- Modify: `src/course-ui/operations/operations.module.css`
- Modify: `tests/e2e/teacher-workflow.spec.js`

**Interfaces:**
- Consumes: `{ overview, revisions }`, active roster profiles, and Task 2 lecture API/CSV contracts.
- Produces: `LectureAttendanceMatrix({ students, overview, disabledLectures, onToggle })`, where `onToggle({ lecture, username, present })` persists one lecture snapshot through the workspace queue.

- [ ] **Step 1: Write the failing Playwright workflow**

Replace the new roster/attendance scenario with one focused workflow that loads two students (including one username-only record), asserts columns `1` through `13` and no date input/date text, filters by name and parallel, checks Ada in lecture 1 and Karel in lecture 13, and verifies two independent POST payloads preserve the other student's value in each lecture. Adapt the existing conflict/retry scenario to a lecture column and remove obsolete selected-date race scenarios whose behavior no longer exists.

- [ ] **Step 2: Run the workflow and verify RED**

Run: `npx playwright test --config=playwright.config.js tests/e2e/teacher-workflow.spec.js --grep "lecture attendance matrix"`

Expected: failure because the matrix and lecture-labeled checkboxes do not exist.

- [ ] **Step 3: Implement the matrix and lecture queue state**

Create the semantic table with a sticky identity column, lecture columns 1–13, accessible checkbox names, and total column. In `AttendanceWorkspace`, remove selected-date state/effects and the active-day/read-only history UI; keep one overview plus revision map, one serialized queue per lecture, and lecture-scoped save/conflict/retry status. Keep roster upload/search/parallel filtering and assignment records; remove the duplicate per-card attendance checkbox.

- [ ] **Step 4: Convert attendance CSV actions in the workspace**

Export all active student/lecture cells. Group accepted import entries by lecture, merge each group into the corresponding snapshot, and save affected lectures independently using their revisions. Keep preview/cancel behavior and bounded diagnostics.

- [ ] **Step 5: Run the focused teacher workflow and verify GREEN**

Run: `npx playwright test --config=playwright.config.js tests/e2e/teacher-workflow.spec.js --grep "lecture attendance matrix"`

Expected: the matrix workflow passes.

- [ ] **Step 6: Commit the teacher matrix task**

```bash
git add src/course-ui/operations/LectureAttendanceMatrix.jsx src/course-ui/operations/AttendanceWorkspace.jsx src/course-ui/operations/AttendanceImportPreview.jsx src/course-ui/operations/AttendanceStudentRow.jsx src/course-ui/operations/StudentRecord.jsx src/course-ui/operations/operations.module.css tests/e2e/teacher-workflow.spec.js
git commit -m "feat: add editable lecture attendance matrix"
```

### Task 4: Student view, fixtures, migration, and final verification

**Files:**
- Modify: `src/course-ui/operations/StudentProgress.jsx`
- Modify: `tests/e2e/student-workflow.spec.js`
- Modify: `tests/e2e/fixtures/test-database.mjs`

**Interfaces:**
- Consumes: Task 2 student attendance payload keyed by lecture.
- Produces: student-facing labels `Lecture 1` through `Lecture 13` with present/absent state and no dates.

- [ ] **Step 1: Write the failing student workflow assertion**

Update one existing student workflow fixture to return `{ "1": true, "13": false }`; assert visible labels `Lecture 1` and `Lecture 13`, their respective states, and absence of the former ISO date.

- [ ] **Step 2: Run the student workflow and verify RED**

Run: `npx playwright test --config=playwright.config.js tests/e2e/student-workflow.spec.js --grep "attendance"`

Expected: failure because the view renders raw keys as dates/days.

- [ ] **Step 3: Implement student labels and update the database fixture**

Sort attendance keys numerically, render `Lecture N`, change count copy from days to lectures, and update the in-memory Neon fixture to recognize lecture-number SQL fields and response columns.

- [ ] **Step 4: Apply migrations and perform proportionate verification**

Run:

```bash
node --env-file=.env.local scripts/migrate.mjs
npm test
npm run lint
npm run format:check
npm run typecheck
npx playwright test --config=playwright.config.js tests/e2e/teacher-workflow.spec.js tests/e2e/student-workflow.spec.js
```

Expected: migration `008` processes successfully and every command passes. Do not run unrelated visual/browser suites beyond these two workflow files.

- [ ] **Step 5: Verify the live teacher boundary without exposing secrets**

Use the environment credentials against the local server and report only status codes; expect teacher login, `/api/teacher/me`, and the lecture overview to return 200. Do not write `.env.local` and do not upload a roster or attendance data during this check.

- [ ] **Step 6: Commit the integration task**

```bash
git add src/course-ui/operations/StudentProgress.jsx tests/e2e/student-workflow.spec.js tests/e2e/fixtures/test-database.mjs
git commit -m "feat: show lecture attendance to students"
```

- [ ] **Step 7: Request final code review**

Review only the lecture attendance files and any directly updated fixture. Resolve concrete correctness, security, accessibility, or regression findings, rerun the focused checks affected by fixes, and preserve unrelated dirty files.
