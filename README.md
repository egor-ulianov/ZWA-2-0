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

The future quality gates are documented here for CI: `npm run lint`, `npm run test:unit`, and `npm run test:e2e`. They will be introduced with their corresponding test work.

## Database and deployment

Run the versioned database migration command before starting a deployment:

```sh
node scripts/migrate.mjs
npm run build
npm run start
```

Set `NODE_ENV=production`, configure every required environment variable above, and expose the app only through its configured `APP_ORIGIN`. The `GET /api/health` endpoint checks required configuration and database connectivity without disclosing configuration values.

Build the production image with:

```sh
docker build -t zwa-presentations .
```
