# ZWA Presentations

The application runs on the Next.js Pages Router. Node.js 20 is required.

## Local development

```sh
npm ci
cp .env.example .env.local
node scripts/migrate.mjs
npm run dev
```

Populate the blank values in `.env.local` before running the migration. Never commit this file. `DATABASE_URL`, `TEACHER_COOKIE_SECRET`, `STUDENT_COOKIE_SECRET`, `ATTENDANCE_AUTH_USER`, and `ATTENDANCE_AUTH_PASS` are required by the authenticated API routes; `APP_ORIGIN` should also be set locally so browser login, logout, and mutations pass the same-origin check. `OPENAI_API_KEY` is required only when AI grading is enabled. Production requires all server and authentication values above; the AI key remains conditional.

If the app is behind a reverse proxy, set `TRUSTED_PROXY_IPS` to the proxy's
exact source IP address or addresses, separated by commas. Rate limiting uses
`X-Forwarded-For` only when the direct socket peer is one of those configured
addresses. Leave it blank for direct connections; do not set it to a wildcard.
`OPENAI_GRADING_MODEL` is optional and defaults to `gpt-4.1`.

## Commands

```sh
npm run dev
npm run build
npm run start
```

Run `npm run start` only after `npm run build` and a successful migration; it
does not run migrations itself. Use `node scripts/start.mjs` for the production
startup path described below.

The release quality gates are available locally and run in CI:

```sh
npm test
npm run lint
npm run format:check
npm run typecheck
npm run security:scan
npm audit --omit=dev
npm run build
npm run quality:health
npm run quality:docker
docker build -t zwa-presentations .
npx playwright install chromium
npm run test:e2e
```

`npm run quality` runs the complete sequence, including the production build and browser
smoke test. The health gate validates the endpoint contract by default; set
`QUALITY_HEALTH_URL` to probe a live deployment and require `{ "ok": true }`.

The browser smoke test expects a completed production build. CI installs Chromium explicitly
before running it.

## Database and deployment

The migration command requires `DATABASE_URL`. For a deployment where
migrations are managed separately, run the versioned migration and then start
the already-built app:

```sh
node scripts/migrate.mjs
npm run build
npm run start
```

After the schema is ready, import a controlled roster CSV containing a
`username` column. The importer validates and normalizes usernames, but the
source file remains sensitive and must stay outside the repository:

```sh
node scripts/import-roster.mjs /absolute/path/to/roster.csv
```

For production, prefer the migration-gated entrypoint after the build so Next
cannot serve before migrations finish:

```sh
npm run build
node scripts/start.mjs
```

The entrypoint validates the required environment before opening the migration
connection, takes a transaction advisory lock, validates the ordered migration
ledger (including checksums), applies pending migrations, and only then starts
Next. A migration or checksum failure prevents the app from serving. `npm run
start` remains useful for a local build when migrations are managed separately.
Set `NODE_ENV=production`, configure every required environment variable above,
serve the app over HTTPS, and expose it only through its configured
`APP_ORIGIN`. The `__Host-` session cookies require HTTPS. The `GET /api/health`
endpoint checks required configuration and database connectivity without
disclosing configuration values.

Build the production image with:

```sh
docker build -t zwa-presentations .
```
