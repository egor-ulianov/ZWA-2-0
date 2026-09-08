# ZWA Presentations

The application runs on the Next.js Pages Router. Node.js 20 is required.

## Local development

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Populate the blank values in `.env.local` with local development credentials. Never commit this file. `DATABASE_URL` is required for database-backed API routes and the health check. `OPENAI_API_KEY` is required only for AI grading. `ATTENDANCE_AUTH_USER`, `ATTENDANCE_AUTH_PASS`, `TEACHER_COOKIE_SECRET`, `STUDENT_COOKIE_SECRET`, and `APP_ORIGIN` are required for a production deployment.

## Commands

```sh
npm run dev
npm run build
npm run start
```

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

Run the versioned database migration command before starting a deployment:

```sh
node scripts/migrate.mjs
npm run build
npm run start
```

For production, use the migration-gated entrypoint after the build so Next cannot serve before migrations finish:

```sh
node scripts/start.mjs
```

The entrypoint takes a transaction advisory lock, validates the ordered migration ledger (including checksums), applies pending migrations, and only then starts Next. `npm run start` remains useful for a local build when migrations are managed separately. Set `NODE_ENV=production`, configure every required environment variable above, and expose the app only through its configured `APP_ORIGIN`. The `GET /api/health` endpoint checks required configuration and database connectivity without disclosing configuration values.

Build the production image with:

```sh
docker build -t zwa-presentations .
```
