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

## Concerns

- The networking E2E ignores pre-command analytics requests from the existing app instrumentation and asserts that entering a simulated command adds no external request.
- The pre-existing untracked `.env.local` was not staged.
