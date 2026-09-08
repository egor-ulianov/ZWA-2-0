# ZWA Presentations SWE Improvement Specification

**Date:** 2026-09-08  
**Repository:** `zwa-presentations`  
**Runtime decision:** Standardize on the Next.js Pages Router; the checked-in Vite entrypoint is legacy and is not used by `npm run dev`, `npm run build`, or `npm run start`.

## Goal

Make the student presentation site safe to expose, reproducible for contributors and deployments, maintainable as the lesson set grows, and dependable for teacher/student data workflows without changing the lesson content or public lesson URLs unnecessarily.

## Current architecture

- Next.js 14 Pages Router pages live in `pages/`; each lesson route dynamically imports one large root-level `interactive_zwa_*_presentation.jsx` file with `ssr: false`.
- Tailwind classes are supplied at runtime by the Tailwind CDN from `pages/_document.jsx`; a separate Vite configuration and two static HTML entrypoints also exist.
- Teacher and student workflows use Next API routes backed by Neon/Postgres. Schema creation and upgrades happen inside request handlers.
- Roster data is read synchronously from the tracked `src/interactive-zwa-1/assets/Course_B251_B6B39ZWA.csv` file. The file contains student names, usernames, personal EIDs, study information, and teacher/class information.
- Lesson playgrounds inject user-edited HTML/CSS into the main document and execute user-edited JavaScript with `new Function`.

## Problem map

| Priority | Problem | Evidence | Consequence |
|---|---|---|---|
| P0 | Teacher-only APIs do not enforce teacher authorization. | `pages/api/attendance.js:26-75`, `pages/api/progress.js:28-100`, `pages/api/students.js:50-61`, and `pages/api/grade-test.js:95-163` have no auth guard. | Any caller can read or change attendance, grades, assignment state, and student access codes; AI grading can be invoked without authorization. |
| P0 | Student/teacher session signing has insecure development fallbacks and duplicated verification. | `pages/api/teacher/login.js:3-5`, `pages/api/student/login.js:6-9`, `pages/api/teacher/me.js:3-12`, and repeated code in `grade-test.js`/`normalize-grades.js`. | A missing production secret silently becomes a known secret; expiry, constant-time comparison, logout, and centralized policy are absent. |
| P0 | Personally identifiable roster data is committed and exposed by an unauthenticated endpoint. | `src/interactive-zwa-1/assets/Course_B251_B6B39ZWA.csv` is tracked; `pages/api/students.js:52-57` reads and returns it. | Privacy, retention, and access-control risk for student records. |
| P0 | Code playgrounds execute or render untrusted input in the application origin. | `interactive_zwa_5_javascript_presentation.jsx:122`, `interactive_zwa_1_html5_presentation.jsx:21`, `interactive_zwa_2_css_presentation.jsx:246`, `interactive_zwa_5_css2_presentation.jsx:213`, and `interactive_zwa_2_forms_presentation.jsx:363`. | A student can affect the host page, access same-origin browser state, submit forms, or exfiltrate data; the experience is not safely sandboxed. |
| P0 | AI grading accepts unbounded input and can publish unsafe output. | `pages/api/grade-test.js:131-161` accepts arbitrary image strings and `maxPoints`; `pages/api/teacher/normalize-grades.js:172-209` sends all students in one call and applies missing/invalid model output as zero. | Cost abuse, privacy leakage, oversized requests, inconsistent scores, and bulk data corruption. |
| P1 | A clean install is not reproducible. | `npm ci` fails because `package.json` contains `react-markdown` while `package-lock.json` does not. | CI and Docker builds can diverge; a new contributor cannot install with the standard lockfile workflow. |
| P1 | Dependency and runtime security is stale. | `npm audit --omit=dev` reports high/critical vulnerabilities, including the pinned `next@14.2.15`; Next also warns about the missing production `sharp` package. | Known dependency vulnerabilities and slower/image-heavy production behavior. |
| P1 | Database migrations are run on every request and data has two sources of truth. | `ensureSchema()` in `pages/api/attendance.js`, `pages/api/progress.js`, `pages/api/grade-test.js`, and `pages/api/teacher/normalize-grades.js`; grades are stored in both `test_grades` and `progress`. | Added latency, race-prone deploys, difficult rollback, and inconsistent records. |
| P1 | Writes are race-prone and some UI actions do not persist. | `pages/attendance.jsx:72-75`, `:177-190`, and `:217-240` fire requests without checking results; `:134-136` imports into `localStorage` instead of the database. | Rapid edits can overwrite one another, UI can report stale state, and imported attendance disappears on refresh. |
| P1 | There are no automated quality gates. | `package.json` has only `dev`, `build`, and `start`; no lint/test scripts, test files, CI workflow, README, environment example, or runtime health check are present. | Regressions in API/auth/playground behavior are discovered manually or in production. |
| P1 | Container build is not aligned with the lockfile or least privilege. | `Dockerfile:6` runs `npm install`; no non-root `USER` or `HEALTHCHECK` is configured. | Non-reproducible image contents and a larger blast radius if the app is compromised. |
| P2 | Lesson structure is duplicated and naming is inconsistent. | Ten root-level lesson files repeat `clsx`, `Code`, `InfoBox`, `SlideCard`, nav, footer, and analytics; `pages/index.jsx` maps ZWA-3 to `/interactive-zwa-1/` and ZWA-4 to `/interactive-zwa-2`. | Content updates require repeated edits and route/lesson identity is easy to break. |
| P2 | Styling and static entrypoints are legacy/deployment-dependent. | `pages/_document.jsx:8`, `index.html`, `interactive-zwa-1/index.html`, and `vite.config.js`. | Runtime CDN availability controls core styling; the repository has two competing build models. |
| P2 | Accessibility and navigation semantics are inconsistent. | Lesson navs use plain buttons without tab semantics/`aria-current`; login labels are not associated with inputs in `pages/student/index.jsx:41-63`; there is no deep-link/history state. | Keyboard and assistive-technology navigation is weaker; students cannot reliably share or resume a slide. |
| P2 | External and local references are brittle. | `interactive_zwa_12_auth_presentation.jsx:331-352` contains a machine-specific `file:///Users/...` URL; several lessons depend on remote placeholder or course-hosted assets. | Links fail outside the author machine and lessons degrade when external services are unavailable. |
| P2 | Parsing and export logic is not robust. | `pages/api/students.js:4-22` splits CSV manually; `pages/attendance.jsx:102-135` splits and emits CSV without quoting/escaping. | Quoted delimiters, commas, newlines, and malformed imports can corrupt roster/attendance data. |

## Target architecture

1. Keep Next.js as the only application runtime. Build Tailwind locally, centralize global CSS/security headers, and remove the unused Vite surface.
2. Put shared lesson primitives in `src/components/lesson/`, lesson metadata in `src/content/lessons/` and `src/config/lessons.js`, and keep each lesson's domain content in a focused module.
3. Put server-only concerns in `src/server/`: environment validation, Neon client, migrations, auth/session helpers, CSRF/origin checks, repository functions, validation schemas, and AI provider adapters.
4. Protect every teacher mutation/read with a teacher guard and every student read with a session-scoped student guard. Store only a hash of student access codes; require configured secrets and secure cookies in production.
5. Use a normalized roster, attendance, assignment-progress, and grade-attempt model. Store the official published score once; keep AI attempts and teacher edits auditable. Apply related changes transactionally.
6. Isolate HTML/CSS/JavaScript playground execution in sandboxed iframes or workers and communicate through a narrow message protocol. The host application never executes student code or mounts student HTML in its own DOM.
7. Add unit, API-contract, accessibility, and browser smoke tests, then run them in CI before build/deploy.

## Acceptance criteria

- `npm ci` succeeds from a clean checkout and `npm run lint`, `npm run test:unit`, `npm run test:e2e`, and `npm run build` are documented and green in CI.
- Requests without the proper session receive `401`/`403`; teacher APIs never return `auth_code` or unrelated students to a student session; no API returns raw internal error details.
- Production startup fails when required secrets are missing; session cookies are `HttpOnly`, `Secure` in production, `SameSite=Lax` or stricter, scoped to `/`, signed with a rotating secret, and carry server-validated expiry.
- The tracked roster is removed from public source history or replaced by an anonymized fixture; production roster access comes from a protected source and returns only fields needed by the caller.
- Playground tests demonstrate that HTML event handlers, CSS rules, and JavaScript cannot access the parent document, cookies, local storage, or protected APIs.
- AI grading rejects unsupported media, oversized payloads, invalid point ranges, and excessive batch sizes; malformed model output cannot overwrite a grade; every applied change records actor, prompt/model version, source, and timestamp.
- Attendance import/export round-trips quoted CSV correctly, imports persist through the API, and concurrent edits have deterministic conflict/error behavior.
- Lesson URLs have a single catalog source, keyboard navigation and active-slide semantics are covered by accessibility tests, and no deployed lesson contains machine-specific `file:///` links.

## Non-goals

- Rewriting the educational content or changing grading policy without an explicit instructor decision.
- Introducing a separate backend service before the existing Next API boundary and database model are made safe.
- Migrating every JSX lesson to TypeScript in one change; new server boundaries should be typed/validated first, with lesson files migrated incrementally.
