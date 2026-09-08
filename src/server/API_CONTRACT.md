# Data and auth API contract

Run `node scripts/migrate.mjs` before starting the application, then import an
operator-provided roster with `node scripts/import-roster.mjs /absolute/path/to/roster.csv`.
The checked-in roster fixture is deliberately anonymous; do not commit a production roster.

All routes below use the `teacher_session` / `student_session` cookie in local
development and `__Host-teacher_session` / `__Host-student_session` in production.
Every cookie-authenticated mutation requires an `Origin` header exactly equal to
`APP_ORIGIN`; clients use ordinary same-origin `fetch` requests.

- `GET /api/students`, `GET|POST /api/attendance`, and `GET|POST /api/progress` require a teacher session.
- `GET /api/student/me`, `/api/student/attendance`, and `/api/student/grades` require a student session and always use the username in that session. They accept no username override.
- `POST /api/{teacher,student}/login` accepts its existing JSON credentials and establishes an expiring session. `POST /api/{teacher,student}/logout` clears and revokes it.
- `POST /api/progress` accepts only assignment fields. It may additionally accept `generate_access_code: true` or a one-time `auth_code` value. Its response can include `accessCode` exactly for that mutation; no GET response includes an access code or a hash.

The teacher UI currently expects names and plaintext `auth_code` values from
`GET /api/students` and `GET /api/progress`. Its owner must switch rows to the
username and display `accessCode` only from the successful mutation response.

`GET /api/student/grades` remains keyed by test number, but its values are a
least-privilege DTO containing only `test_number`, `points`, `max_points`,
`reasoning`, and `graded_at`. It does not expose attempt IDs, usernames,
actors, model names, prompt versions, image counts, or other audit metadata.

Attendance reads for a date return a monotonically increasing `revision` and
the same value as a quoted `ETag`. Attendance snapshot writes must send that
value as `If-Match: "<revision>"` (or as the numeric `revision` body field).
Missing preconditions return `428`; a stale revision returns `409` and writes
nothing. This is an intentional contract tightening for old unversioned full
snapshot writers; the `date`/`map` payload and successful response remain
compatible, with the new response also returning the next revision.

Grading routes are teacher-only. `POST /api/grade-test` accepts one test number
(`1..4`), max points (`1..12`), up to four PNG/JPEG/WebP data URLs (2 MiB
decoded per image and 8 MiB total), and criteria up to 2,000 characters. It
returns `{ ok, points, reasoning }` only after strict model-output validation;
malformed provider output creates no attempt. `GET /api/grade-test` preserves
the existing `{ items: { [testNumber]: grade } }` response shape, and `PUT`
records a teacher reasoning edit as a new audited attempt.

`POST /api/teacher/normalize-grades` is a two-phase workflow. A request with
`{ dryRun: true, testNumber, maxPoints }` returns a persisted `runId` and
preview. Applying canonically sends `{ runId }`; for compatibility with the
current teacher page, `{ dryRun: false, testNumber, maxPoints }` resolves the
latest preview for that same teacher and test before applying it. The server
rejects stale previews with `409` and safely treats an already-applied run as
idempotent. Normalization is bounded to 500 published grades, uses deterministic
batches, and records the actor, model, prompt version, original attempt IDs, and
timestamps. Neither grading route writes `test_grades` or test score columns in
`progress`.

## AI grading

`GET|POST|PUT /api/grade-test` and `POST /api/teacher/normalize-grades` require
a teacher session. Mutations require a same-origin `Origin` header. Grade image
submissions accept only 1--4 PNG/JPEG/WebP base64 data URLs (2 MiB decoded each,
8 MiB total), test numbers 1--4, and integer max points 1--12. Provider and
configuration failures return stable public errors plus a correlation ID; they
never publish a fallback score.

Normalization is now explicitly two-phase. `POST /api/teacher/normalize-grades`
with `{ testNumber, maxPoints, dryRun: true }` returns the existing `ok`,
`total`, `updated: 0`, and `preview` fields plus a required `runId`. To publish
that exact preview, the frontend must call the same endpoint with `{ runId }`.
The apply response retains `ok`, `total`, and `updated`, and additionally returns
`runId` and `alreadyApplied`; replaying an applied run is a successful no-op.
A `409` means an underlying published attempt changed after preview, so the
frontend must request a fresh preview. The previous `{ dryRun: false }` apply
request without `runId` resolves the latest same-teacher preview when one
exists; otherwise it returns `400` and the frontend must request a preview.

The production `node scripts/start.mjs` entrypoint runs migrations before Next.
Migrations are serialized with a PostgreSQL transaction advisory lock and
recorded in `schema_migrations` with a SHA-256 checksum; a changed
already-applied migration fails closed. Migration `005` copies valid scores
from legacy `progress.test1..test4` and `test_grades` into immutable audited
attempts, deterministically publishes one winner per student/test, then drops
the legacy grade storage. Migration `006` adds attendance revisions and the
database-backed rate-limit buckets.

The public HTML validator accepts at most 100,000 characters/120 KiB, uses a
bounded database-backed per-client throttle, and times out the upstream
validator. Server failures return a generic error and correlation ID; upstream
details are logged only on the server.
