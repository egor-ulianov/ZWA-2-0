# Task 4 report — static/server task lesson workspaces

Implemented Task 4 for lessons 7–12 in the shared checkout.

## Changes

- Added the Czech `LessonTaskWorkspace` to the task slides in lessons 7–12.
- Added editable, seeded source drafts for the existing JavaScript and PHP/server exercises.
- Added bounded static source-marker checks (at most three markers per adapted task) using the shared
  `runStaticTaskChecks` helper; no source is evaluated and no network, filesystem, API, PHP, or
  server runtime is introduced.
- Added Czech static expected-outcome explanations and the explicit browser non-execution notice.
- Kept the existing task slide IDs and reveal/disclosure components, including the lesson 7 click
  challenge and the PHP `ClickToRevealSolution` blocks.
- Kept each complete workspace projector-private through `data-projector-private`.
- Added `tests/e2e/lesson-workspace-static.spec.js` for all six required task routes.

## TDD evidence

- RED: `npm run test:e2e -- tests/e2e/lesson-workspace-static.spec.js` — all six route assertions
  failed because the legacy task slides did not expose the named Czech workspace zones.
- GREEN: the same command — 6 passed after the adapters were added.

## Verification

- `node --test tests/unit/static-task-checks.test.js tests/unit/lessons.test.js` — 10 passed.
- `npm run test:e2e -- tests/e2e/lesson-workspace-static.spec.js tests/e2e/navigation-accessibility.spec.js`
  — 24 passed.
- `npm run lint` — passed with `--max-warnings=0`.
- `npm run format:check` — passed.
- `npm run typecheck` — passed.
- `npm run build` — passed with Next.js 16.3.4.
- `git diff --check` — passed.

## Commit

- `feat: unify static lesson task workspaces`

The pre-existing untracked `.env.local` was not staged.
