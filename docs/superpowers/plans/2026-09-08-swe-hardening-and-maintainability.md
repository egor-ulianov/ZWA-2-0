# SWE Hardening and Maintainability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the ZWA student presentation site safe to expose, reproducible to build, maintainable as lessons grow, and reliable for teacher/student workflows.

**Architecture:** Keep Next.js Pages Router as the only runtime. Move shared UI, lesson metadata, server authentication, database access, validation, and playground isolation into focused modules while preserving the existing public lesson URLs. Replace request-time schema mutation and client-only authorization with migrations, repository boundaries, server guards, and audited workflows.

**Tech Stack:** Next.js Pages Router, React, Tailwind CSS compiled at build time, Neon/Postgres, Node `crypto`, Zod for request/model validation, Vitest + Testing Library for unit/API tests, Playwright for browser and accessibility smoke tests, Docker, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-08-swe-improvement.md`

## Global Constraints

- Standardize on the Next.js Pages Router; the checked-in Vite entrypoint is legacy and is not used by `npm run dev`, `npm run build`, or `npm run start`.
- No teacher or student data endpoint may trust client-side visibility as authorization.
- Production startup must fail when required secrets are missing; development secrets must be explicit and local-only.
- Store only a hash of student access codes; never return `auth_code` from a general progress endpoint.
- Student-edited HTML, CSS, and JavaScript must execute only in a sandboxed origin isolated from the host page.
- AI grading must validate inputs and outputs, enforce limits, preserve the original result on malformed output, and record an auditable actor/model/prompt version.
- Do not change lesson content or grading policy without an explicit instructor decision.
- Preserve existing public lesson URLs while the canonical lesson catalog is introduced.

## File and Responsibility Map

- `src/config/lessons.js`: canonical lesson number, slug, title, route, and display metadata.
- `src/components/lesson/`: shared shell, slide navigation, card, code, info-box, reveal, and analytics primitives.
- `src/components/playground/`: sandboxed HTML/CSS/JavaScript runners and the host/iframe protocol.
- `src/components/teacher/`: attendance, student row, and progress editor components.
- `src/lib/apiClient.js`, `src/lib/csv.js`: browser request/error handling and RFC 4180-compatible CSV logic.
- `src/server/`: env validation, Neon client, sessions, guards, CSRF/origin checks, repositories, and grading provider.
- `db/migrations/`, `scripts/`: versioned schema plus operator-run roster import.
- `tests/unit`, `tests/api`, `tests/e2e`: pure logic, route contracts, authorization, and browser regressions.
- `.github/workflows/ci.yml`, `README.md`, `.env.example`, `SECURITY.md`, `next.config.js`, `Dockerfile`: quality gates and deployment policy.

### Task 1: Establish a reproducible single runtime

**Files:**
- Modify: `package.json`, `package-lock.json`
- Delete: `vite.config.js`, `index.html`, `interactive-zwa-1/index.html`, `src/interactive-zwa-1/main.jsx`
- Create: `README.md`, `.env.example`

**Interfaces:** Produces supported commands `npm ci`, `npm run dev`, `npm run build`, and `npm run start`; preserves all `pages/` routes and imported lesson assets.

- [ ] **Step 1: Capture the current clean-install failure**

```bash
npm ci --dry-run --ignore-scripts --no-audit --no-fund
```

Expected before the task: failure because `react-markdown` and its transitive packages are absent from the lockfile.

- [ ] **Step 2: Synchronize and constrain dependencies**

Keep the existing runtime dependencies, add `engines` matching Node 20, regenerate the lockfile, and verify:

```bash
npm install --package-lock-only --no-audit --no-fund
npm ci --dry-run --ignore-scripts --no-audit --no-fund
```

Expected: the dry run succeeds and the root lockfile dependency set includes `react-markdown`.

- [ ] **Step 3: Remove the competing Vite surface**

Delete only the four legacy entry files listed above; retain lesson images. Confirm the supported app has no Vite dependency or entry reference:

```bash
rg -n "vite|createRoot|index\\.html" package.json package-lock.json pages src interactive_zwa_*_presentation.jsx || true
npm run build
```

- [ ] **Step 4: Document setup and secrets**

`README.md` must document `npm ci`, `cp .env.example .env.local`, `npm run dev`, migration order, tests, and production startup. `.env.example` must list `DATABASE_URL`, `OPENAI_API_KEY`, `ATTENDANCE_AUTH_USER`, `ATTENDANCE_AUTH_PASS`, `TEACHER_COOKIE_SECRET`, `STUDENT_COOKIE_SECRET`, `APP_ORIGIN`, and `NODE_ENV` with no real values.

- [ ] **Step 5: Commit the runtime boundary**

```bash
git add package.json package-lock.json README.md .env.example vite.config.js index.html interactive-zwa-1/index.html src/interactive-zwa-1/main.jsx
git commit -m "build: standardize on reproducible Next runtime"
```

### Task 2: Replace runtime CDN styling and harden the container

**Files:**
- Create: `tailwind.config.js`, `postcss.config.js`, `styles/globals.css`, `next.config.js`, `pages/api/health.js`
- Modify: `pages/_app.jsx`, `pages/_document.jsx`, `Dockerfile`, `package.json`, `package-lock.json`

**Interfaces:** `pages/api/health.js` returns `{ ok: true }` only for valid process configuration; `next.config.js` owns security headers and `poweredByHeader: false`.

- [ ] **Step 1: Compile Tailwind locally**

```bash
npm install --save-dev tailwindcss postcss autoprefixer --no-audit --no-fund
```

Configure content globs for `pages/**/*.{js,jsx}`, `src/**/*.{js,jsx}`, and `interactive_zwa_*_presentation.jsx`. Import `styles/globals.css` once from `_app.jsx`, remove the Tailwind CDN script from `_document.jsx`, and verify:

```bash
rg -n "cdn\\.tailwindcss\\.com" . --glob '!node_modules/**' --glob '!.next/**' || true
npm run build
```

- [ ] **Step 2: Add headers and health checking**

Configure `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, restrictive `Permissions-Policy`, `frame-ancestors 'none'`, and a CSP compatible with the iframe playground. The health route must return `503` for invalid required configuration without leaking values.

- [ ] **Step 3: Build a least-privilege image**

Use a multi-stage Dockerfile with `npm ci` in the build stage, `npm ci --omit=dev` in the runtime stage, an `app` user, explicit copies of `.next`, `public`, `package.json`, and `package-lock.json`, and a `HEALTHCHECK` against `/api/health`.

```bash
docker build --no-cache -t zwa-presentations-audit .
docker inspect zwa-presentations-audit --format='User={{.Config.User}}'
```

Expected: the image runs as a non-root user and declares a health check.

### Task 3: Introduce versioned schema and repositories

**Files:**
- Create: `src/server/env.js`, `src/server/db.js`, `db/migrations/001_core.sql`, `db/migrations/002_grade_audit.sql`, `scripts/migrate.mjs`, `scripts/import-roster.mjs`
- Create: `src/server/repositories/students.js`, `attendance.js`, `progress.js`, `grades.js`
- Modify: all current data API handlers under `pages/api/`
- Create: `tests/unit/repositories.test.js`

**Interfaces:** `getServerEnv()` fails closed; `db.js` exports one validated Neon client; repositories accept validated domain values and return domain objects; API routes contain no schema DDL.

- [ ] **Step 1: Define the core tables and constraints**

Create `students`, `student_access`, `assignments`, and `attendance`. Use `students.username` as the primary key, foreign keys for related records, `attendance_date date`, composite attendance key `(attendance_date, username)`, bounded final points, `updated_by`, and timestamps. Store only `student_access.auth_code_hash`, never a plaintext access code.

- [ ] **Step 2: Define grade audit tables**

Create immutable `grade_attempts` with attempt ID, student, test number `1..4`, points, max points, reasoning, source (`ai`, `teacher`, `normalized`), actor, model, prompt version, image count, and timestamp. Create `published_grades` keyed by `(username, test_number)`; it is the single official score source.

- [ ] **Step 3: Move migrations out of requests**

Implement a migration table and transaction-per-migration in `scripts/migrate.mjs`; run `node scripts/migrate.mjs` before application startup. Delete every `ensureSchema()` function from API routes.

- [ ] **Step 4: Import and remove roster PII**

Make `scripts/import-roster.mjs` accept an explicit local path, parse quoted semicolon CSV with a real parser, normalize/deduplicate usernames, and insert only required student fields. Run it in a controlled environment, verify the row count, then remove the tracked PII CSV and replace it with an anonymized fixture. A history purge is required before using the public repository as the production source.

- [ ] **Step 5: Implement atomic repositories**

`attendance.bulkUpsert({ attendanceDate, entries, actor })` performs one transaction. `progress.patch(username, allowedFields, actor)` updates only assignment fields. `grades` exposes `createAttempt`, `publishAttempt`, `getLatestPublished`, and `getStudentAttempts`.

- [ ] **Step 6: Test repository boundaries**

Cover ISO date/username validation, score limits, duplicate roster rows, allowed-field filtering, and the bulk transaction input without a live production database:

```bash
npm run test:unit -- repositories
```

### Task 4: Centralize sessions, authorization, and CSRF

**Files:**
- Create: `src/server/auth/session.js`, `src/server/auth/guards.js`, `src/server/security/csrf.js`, `pages/api/teacher/logout.js`, `pages/api/student/logout.js`
- Modify: teacher/student login and me routes plus all teacher/student data routes
- Create: `tests/unit/auth-session.test.js`, `tests/api/authz.test.js`

**Interfaces:** `createSessionToken({ kind, subject, issuedAt, expiresAt })`, `verifySessionToken(token, expectedKind)`, `requireTeacher(req,res)`, `requireStudent(req,res)`, and `requireSameOrigin(req)` are the only auth/security entrypoints.

- [ ] **Step 1: Fail closed on production configuration**

Reject missing `DATABASE_URL`, both cookie secrets, teacher credentials, and `APP_ORIGIN` when `NODE_ENV=production`. Delete all `dev-secret` fallbacks.

- [ ] **Step 2: Use expiring constant-time sessions**

Sign versioned payloads containing kind, subject, issued-at, and expiry; compare signatures with `crypto.timingSafeEqual`; reject malformed, wrong-kind, expired, or wrong-length signatures. Set HttpOnly, Secure in production, SameSite=Lax, Path=/, Max-Age cookies with `__Host-` names under HTTPS.

- [ ] **Step 3: Protect access codes**

Hash codes with salted `crypto.scrypt`, support expiry/revocation, rate-limit login attempts using the selected shared/deployment store, and show a generated plaintext code only once to the teacher. Never include it in general progress responses.

- [ ] **Step 4: Apply an explicit route policy**

Teacher-only: `/api/students`, `/api/attendance`, `/api/progress`, `/api/grade-test`, and `/api/teacher/normalize-grades`. Student-only and session-scoped: `/api/student/me`, `/api/student/attendance`, and `/api/student/grades`. Public: lesson pages, bounded `/api/validate-html`, login, and health. Remove the `teacher` query parameter as an authorization mechanism.

- [ ] **Step 5: Add CSRF/origin and logout behavior**

Clear cookies from logout handlers. Require same-origin checks for all cookie-authenticated POST/PUT/DELETE requests; use a server-issued CSRF header token if a future cross-origin client is necessary.

- [ ] **Step 6: Prove the API contract**

```bash
npm run test:unit -- auth-session
npm run test:api -- authz
```

Assert anonymous teacher requests return `401`, students cannot read another user or mutate, and foreign-origin mutations return `403`.

### Task 5: Make AI grading bounded and auditable

**Files:**
- Create: `src/server/grading/limits.js`, `schemas.js`, `provider.js`, `normalization.js`
- Modify: `pages/api/grade-test.js`, `pages/api/teacher/normalize-grades.js`, `pages/teacher/index.jsx`
- Create: `tests/unit/grading.test.js`, `tests/api/grading.test.js`

**Interfaces:** `validateGradeRequest(body)`, `gradeImages(input, dependencies)`, `previewNormalization({ testNumber, maxPoints, actor })`, and `applyNormalization({ runId, actor })` are the only grading workflow entrypoints.

- [ ] **Step 1: Enforce input limits before provider calls**

Accept only tests 1–4, max points 1–12, at most four PNG/JPEG/WebP data URLs, 2 MiB decoded per image, 8 MiB total, criteria up to 2,000 characters, and a 30-second provider timeout. Require teacher authorization and reject invalid requests with `400`.

- [ ] **Step 2: Validate provider output strictly**

Require an object with integer points in range and bounded reasoning. Parsing/schema failure returns a provider error and writes no attempt or official score; it must not become score zero.

- [ ] **Step 3: Make normalization two-phase**

Preview must persist a run ID and original attempt IDs. Apply requires that run ID, validates every returned student, rejects incomplete output, batches input, records actor/model/prompt version, and updates attempts plus published scores in one transaction. Missing model rows preserve the original score. Reapplying a run is idempotent.

- [ ] **Step 4: Sanitize and observe failures**

Return stable public errors and log only correlation ID plus server-side cause. Remove all `details: String(e)` responses. Rate-limit provider calls and do not store image bytes without an approved retention policy.

- [ ] **Step 5: Test failure modes**

Cover unsupported media, oversized input, invalid points/JSON, missing normalization rows, duplicate apply, timeout, and unauthorized calls:

```bash
npm run test:unit -- grading
npm run test:api -- grading
```

### Task 6: Make teacher and student persistence deterministic

**Files:**
- Create: `src/lib/apiClient.js`, `src/lib/csv.js`, `src/components/teacher/AttendancePage.jsx`, `src/components/teacher/StudentRow.jsx`, `src/components/teacher/ProgressEditor.jsx`
- Modify: `pages/attendance.jsx`, `pages/student/index.jsx`, `pages/student/progress.jsx`, `pages/api/attendance.js`, `pages/api/progress.js`
- Create: `tests/unit/csv.test.js`, `tests/unit/api-client.test.js`, `tests/e2e/teacher-workflow.spec.js`

**Interfaces:** `apiClient.request(path, options)` parses JSON and throws `{ status, code }`; `serializeAttendanceCsv(rows)` and `parseAttendanceCsv(text)` round-trip quoted fields; `saveProgressPatch(username, patch)` sends only allowed assignment fields.

- [ ] **Step 1: Replace fire-and-forget writes**

Queue the latest attendance state per date, check responses, disable conflicting controls while saving, and roll back on failure. Use a draft plus explicit save or a debounced patch queue for progress; do not write a full record on every keystroke.

- [ ] **Step 2: Persist imports through the API**

Remove `localStorage.setItem` from attendance import. Parse and validate in the browser, show date/row count, confirm, call the authenticated bulk endpoint, and refresh from the server.

- [ ] **Step 3: Make CSV handling correct**

Quote fields containing comma, quote, CR, or LF; escape quotes as doubled quotes; handle BOM; reject unknown users with a visible import report.

- [ ] **Step 4: Reduce redundant reads and improve student UX**

Do not refetch the full overview after every checkbox; use `AbortController`; provide retry and logout; redirect expired students to `/student`; include intended assignment fields in the student response.

- [ ] **Step 5: Test persistence and concurrency behavior**

```bash
npm run test:unit -- csv api-client
npm run test:e2e -- teacher-workflow
```

The browser test must edit two fields quickly, reload, import a quoted CSV, verify persistence, and verify anonymous users receive no student list.

### Task 7: Isolate code playgrounds from the host application

**Files:**
- Create: `src/components/playground/protocol.js`, `src/components/playground/SandboxedPreview.jsx`, `src/components/playground/JsSandbox.jsx`
- Modify: `interactive_zwa_1_html5_presentation.jsx`, `interactive_zwa_2_forms_presentation.jsx`, `interactive_zwa_2_css_presentation.jsx`, `interactive_zwa_5_css2_presentation.jsx`, `interactive_zwa_5_javascript_presentation.jsx`
- Create: `tests/e2e/playground-isolation.spec.js`

**Interfaces:** `SandboxedPreview({ html, css, mode, onMessage })` renders an isolated iframe; `JsSandbox({ code, dom, onResult })` returns only serialized results; `protocol.js` validates `ready`, `console`, `result`, and `error` messages.

- [ ] **Step 1: Write the isolation regression test first**

The test payload must attempt to mutate `parent.document`, read `document.cookie`, access storage, submit a form, and send an unknown message. Assert that no host mutation or protected request occurs.

- [ ] **Step 2: Implement static preview isolation**

Use `iframe sandbox=""`, `srcDoc`, and a restrictive CSP for HTML/CSS. Use `sandbox="allow-scripts"` only for exercises requiring event handlers, without `allow-same-origin`; block forms/network by default.

- [ ] **Step 3: Move JavaScript execution into the sandbox**

Execute and capture console output in the iframe, communicate through validated `postMessage`, and remove host-side `new Function` and host `innerHTML` mounting.

- [ ] **Step 4: Preserve validators**

Run CSS/HTML checks against the iframe document and move pure check functions into testable modules without changing existing task messages.

- [ ] **Step 5: Verify the sandbox**

```bash
npm run test:e2e -- playground-isolation
```

### Task 8: Centralize lesson metadata and shared presentation UI

**Files:**
- Create: `src/config/lessons.js`, `src/components/lesson/LessonShell.jsx`, `SlideNavigation.jsx`, `SlideCard.jsx`, `Code.jsx`, `InfoBox.jsx`, `ClickToRevealSolution.jsx`
- Modify: `pages/index.jsx`, all `pages/interactive-*.jsx` wrappers, and all `interactive_zwa_*_presentation.jsx` files
- Create: `tests/unit/lessons.test.js`, `tests/e2e/navigation-accessibility.spec.js`

**Interfaces:** `lessons` is an ordered array of `{ number, slug, title, href, componentKey }`; `LessonShell` owns header/nav/content/footer/analytics; `SlideNavigation` exposes semantic tab state and keyboard navigation.

- [ ] **Step 1: Encode the current route map**

Keep the current public URLs—including the network lesson at `/interactive-zwa-1/`—and use the catalog to render the home page. Test unique lesson numbers and route coverage.

- [ ] **Step 2: Extract shared primitives**

Move duplicate `clsx`, `Code`, `InfoBox`, reveal, slide card, footer, and analytics implementations into shared components; leave lesson-specific theory/task content in place.

- [ ] **Step 3: Add resumable, accessible slide navigation**

Use a validated `slide` query or hash, fall back safely, add `aria-selected`, `aria-controls`, `aria-current`, Home/End/arrow keys, visible focus, and focus the content heading after changes.

- [ ] **Step 4: Remove brittle references and improve accessibility**

Delete machine-specific `file:///Users/...` links; use `public/references/` or authoritative URLs. Add label/id pairs, explicit button types, live status regions, table `scope`, and reduced-motion styles.

- [ ] **Step 5: Test catalog and navigation**

```bash
npm run test:unit -- lessons
npm run test:e2e -- navigation-accessibility
```

### Task 9: Add quality gates and operational documentation

**Files:**
- Modify: `package.json`, `package-lock.json`, `README.md`, `Dockerfile`
- Create: ESLint/Prettier config, `vitest.config.js`, `playwright.config.js`, `.github/workflows/ci.yml`, `SECURITY.md`

**Interfaces:** `npm run lint`, `npm run format:check`, `npm run test:unit`, `npm run test:api`, `npm run test:e2e`, and `npm run build` are deterministic release checks.

- [ ] **Step 1: Add deterministic scripts**

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint .",
  "format:check": "prettier --check .",
  "test:unit": "vitest run",
  "test:api": "vitest run tests/api",
  "test:e2e": "playwright test",
  "check": "npm run lint && npm run format:check && npm run test:unit && npm run build"
}
```

Pin dependencies in the lockfile, upgrade Next to a currently patched supported release after compatibility testing, and review rather than force-apply major-version audit fixes.

- [ ] **Step 2: Configure tests around real boundaries**

Mock Neon and the AI provider at repository/provider boundaries, not every route branch. Playwright must use test-only data and a test provider.

- [ ] **Step 3: Add CI**

Run `npm ci`, `npm run check`, and the Playwright suite on pushes and pull requests with Node 20; upload reports on failure.

- [ ] **Step 4: Document security and operations**

`SECURITY.md` must cover secrets, cookies, roster privacy, access-code rotation, AI retention, rate limits, migrations, and incidents. `README.md` must state that migrations run before app startup.

- [ ] **Step 5: Run the release checklist**

```bash
rm -rf node_modules .next
npm ci --no-audit --no-fund
npm run check
npm run test:api
npm run test:e2e
npm audit --omit=dev
```

Expected: clean install, lint, formatting, unit/API/browser tests, build, and dependency audit all pass or have documented accepted residual risk.

## Execution order and review checkpoints

1. Tasks 1–2 establish one build/deploy path.
2. Tasks 3–5 are the P0 safety track and must land before exposing teacher/student workflows or AI grading.
3. Task 6 repairs data-loss and persistence behavior.
4. Task 7 must land before accepting arbitrary student code in a shared deployment.
5. Task 8 is the maintainability/accessibility track and may proceed alongside Task 6 after route contracts are stable.
6. Task 9 is the release gate and must run after every P0/P1 task.

Each task is reviewed and committed independently. The merge gate is: no unauthorized data mutation, no tracked production PII, no host-context code execution, reproducible `npm ci`, green API tests, and a successful production build.
