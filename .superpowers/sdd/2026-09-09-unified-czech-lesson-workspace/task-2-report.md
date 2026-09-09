# Task 2 report — common Czech task workspace and bounded static checks

Implemented Task 2 in the shared checkout.

## Changes

- Added `LessonTaskWorkspace` with exactly three task regions: `Zadání`, `IDE`, and `Náhled a testy`.
- Marked the complete task workspace `data-projector-private` and kept editor drafts in component session state only.
- Added bounded `runStaticTaskChecks` source-marker checks that inspect source text only and never evaluate it.
- Preserved `ExerciseWorkspace` iframe/runtime behavior while adding the Czech workspace labels and named regions.
- Translated exercise definition labels, hints, and semantic HTML result copy to Czech.
- Added unit and Playwright coverage for bounded static checks, projector privacy, Czech labels, and the three task regions.

## Verification

- `node --test tests/unit/exercise-test-runner.test.js tests/unit/static-task-checks.test.js tests/playground-isolation.test.js` — 17 passed.
- `npm run test:e2e -- tests/e2e/playground-isolation.spec.js` — 9 passed.
- `npm test` — 122 unit, 28 API, 8 playground-isolation, and 4 quality tests passed.
- `npm run lint` — passed.
- `npm run format:check` — passed.
- `npm run typecheck` — passed.
- `npm run build` — passed.

## Commit

- `feat: add unified Czech task workspace`

The pre-existing untracked `.env.local` was not staged.
