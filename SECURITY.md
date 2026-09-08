# Security Policy

## Supported versions

Only the default branch is actively supported. Releases should use Node.js 20 and the
dependency versions recorded in `package-lock.json`.

## Reporting a vulnerability

Please report suspected vulnerabilities privately. If this repository is hosted on GitHub,
use **Security → Report a vulnerability**; otherwise use the private security channel provided
by the project maintainers. Do not open a public issue for an unpatched vulnerability.

Include the affected route or file, reproduction steps, impact, and any suggested mitigation.
Please avoid including live credentials or personal data in the report.

Maintainers will acknowledge a report within five business days, assess its severity, and
coordinate a fix or mitigation before public disclosure where practical.

## Operational controls

### Secrets and cookies

Keep `DATABASE_URL`, `TEACHER_COOKIE_SECRET`, `STUDENT_COOKIE_SECRET`, attendance credentials,
and `OPENAI_API_KEY` in the deployment secret store, not in the repository or logs. Generate
cookie secrets with a cryptographically secure random source and rotate them through the
deployment mechanism. Rotating either cookie secret invalidates the corresponding active
sessions. Production uses `Secure`, `HttpOnly`, `SameSite=Lax`, `Path=/`, and `__Host-` cookies.

### Roster and access-code privacy

The roster is student data. Import it from an operator-controlled file, restrict database and
teacher access, and never commit a real roster or paste it into issues, logs, fixtures, or model
prompts. Access codes are stored as salted scrypt hashes and are returned only once from the
teacher mutation that creates or rotates them; do not log, email, or persist the plaintext in
application telemetry. Revoke and replace a code when it is exposed or when a student changes.

### AI grading data

AI grading sends submitted images, criteria, and grade context to the configured provider. Do not
submit unnecessary personal data. Review the provider's current retention and data-processing
terms before enabling the feature for student work. This application stores grade reasoning and
audit metadata, but does not store submitted image files as database records.

### Rate limits and proxy identity

Login and validator throttles use database-backed buckets. Login attempts are limited by both
client address and normalized account; HTML validation is limited per client; normalization and
AI grading have additional provider safeguards. When deployed behind a reverse proxy, configure
`TRUSTED_PROXY_IPS` with the exact proxy source addresses. The application ignores forwarded
client addresses from untrusted peers, so an arbitrary `X-Forwarded-For` header cannot bypass
the client-address limit. Review the provider-grading quota before scaling to multiple app
instances because the teacher-local guard is process-local.

### Migrations and incidents

Run migrations through `node scripts/start.mjs` in production, or run `node scripts/migrate.mjs`
as a separately controlled release step. The runner serializes migrations with a PostgreSQL
transaction advisory lock and records SHA-256 checksums; do not edit an already-applied
migration. Take a database backup before destructive legacy-data migrations and verify the
health endpoint after release. For an incident, preserve relevant server audit logs, revoke
affected sessions and access codes, rotate exposed secrets, restrict the affected route or
deployment, and privately report the timeline, impact, and mitigation to maintainers.

## Release security gates

Every change should pass the repository's static security scan, production dependency audit,
health/Docker checks, and the automated test, lint, format, type, build, and browser smoke
gates documented in `README.md`.
