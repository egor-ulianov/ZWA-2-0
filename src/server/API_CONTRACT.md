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
The grading-route owner must replace legacy `progress`/`test_grades` writes with
`createGradesRepository()` and add `requireTeacher` plus `requireSameOrigin` to
the two deliberately untouched grading routes.
