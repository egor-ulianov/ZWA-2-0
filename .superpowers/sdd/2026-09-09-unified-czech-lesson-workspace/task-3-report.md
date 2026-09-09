# Task 3 report — runtime lesson task workspaces

Implemented Task 3 in the shared checkout.

## Changes

- Added `tests/e2e/lesson-workspace-runtime.spec.js` covering all six runtime task routes and the three Czech regions (`Zadání`, `IDE`, `Náhled a testy`).
- Added a Czech `LessonTaskWorkspace` frame to HTML5 and forms task slides while retaining local checks, W3C validation controls, and sandbox previews.
- Adapted the simulated networking terminal into the task IDE and moved its deterministic command checklist into the preview/test zone; no real network or filesystem requests are made.
- Added the shared task frame around CSS and CSS II task playgrounds, retaining static previews, hidden inspection iframes, and existing validation behavior. Existing task actions are labeled in Czech.
- Kept the existing JavaScript `ExerciseWorkspace`/`JsSandbox` path, including isolated execution, exports, timeout, console, and session reset behavior.
- Preserved existing task slide/deep-link IDs and projector-private markers; task workspace wrappers are projector-private.

## TDD evidence

The new E2E file was written before source edits. The required RED run failed six route assertions (the six non-JavaScript runtime routes had no named task zones); the existing JavaScript workspace and prior isolation tests passed. After migration, the new runtime suite passed all eight tests.

## Verification

- `node --test tests/unit/lessons.test.js tests/playground-isolation.test.js` — 14 passed.
- `npm run test:e2e -- tests/e2e/lesson-workspace-runtime.spec.js tests/e2e/playground-isolation.spec.js tests/e2e/navigation-accessibility.spec.js` — 35 passed.
- `npm run lint` — passed with `--max-warnings=0`.
- `npm run format:check` — passed.
- `npm run typecheck` — passed.
- `npm run build` — passed with Next.js 16.3.4.
- `git diff --check` — passed.

## Final network P2 follow-up

- Replaced the generic network “checked” marker with truthful evaluation of all four existing command-log predicates (DNS, local interface, routing, and TCP/HTTP).
- Partial command logs show bounded Czech unmet-requirement results and never expose command strings or solution steps; the pass state appears only when all four requirements are satisfied.
- The terminal remains the deterministic local interpreter and does not perform network or filesystem I/O.
- Updated runtime E2E to verify failure after only the DNS command, then success after all four simulated commands.

## Final network verification

- `npm run test:e2e -- tests/e2e/lesson-workspace-runtime.spec.js --grep "network checker reports unmet requirements"` — 1 passed (RED before implementation, then GREEN).
- `npm run test:e2e -- tests/e2e/lesson-workspace-runtime.spec.js tests/e2e/playground-isolation.spec.js` — 27 passed.
- `npm run lint` — passed with `--max-warnings=0`.
- `npm run format:check` — passed.
- `npm run build` — passed with Next.js 16.3.4.
- `git diff --check` — passed.

## Concerns

- The networking E2E ignores pre-command analytics requests from the existing app instrumentation and asserts that entering a simulated command adds no external request.
- The pre-existing untracked `.env.local` was not staged.

## P2 follow-up

- Added an optional `onRunTests` bridge to `LessonTaskWorkspace`; the unified Czech action now invokes the existing W3C validation, network checklist evaluation, or CSS/CSS II hidden inspection action instead of being inert.
- Added E2E coverage that clicks the outer action and observes a W3C error result, checklist state, or validation iframe for every non-JavaScript runtime route.
- Added representative non-task deep-link assertions proving the unified task regions are absent outside task slides.

## P2 verification

- `npm run test:e2e -- tests/e2e/lesson-workspace-runtime.spec.js` — 18 passed.
- `npm run test:e2e -- tests/e2e/lesson-workspace-runtime.spec.js tests/e2e/playground-isolation.spec.js` — 27 passed.
- `npm run lint` — passed with `--max-warnings=0`.
- `npm run format:check` — passed.
- `npm run typecheck` — passed.
- `npm run build` — passed with Next.js 16.3.4.
- `git diff --check` — passed.
