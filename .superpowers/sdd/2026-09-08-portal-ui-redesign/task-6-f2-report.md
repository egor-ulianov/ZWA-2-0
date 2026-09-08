# Task 6 F2 migration report

## Status

Complete for the F2 group: CSS II, JavaScript, Classes/AJAX, and PHP.

## Changes

- Added one deep-link and objective regression test for each F2 route in `tests/e2e/lesson-redesign.spec.js`.
- Added concise Czech learning objectives to the existing `LessonShell` calls.
- Added activity metadata (`learn`, `quick-check`, `build`, and `apply`) to the existing slide definitions without changing slide IDs or curriculum copy.
- Added presenter cues only to slides that have a concrete teaching prompt; projector mode remains free of presenter controls/notes through the shared shell.
- Kept CSS II and JavaScript playgrounds visible only for their task activities, preserving their existing sandbox adapters, validators, iframe titles, and task behavior.
- Did not change shared components, wrappers, routes, backend code, or other lesson sources.

## Verification

- Baseline before F2 edits: `navigation-accessibility.spec.js` + `playground-isolation.spec.js` — 22 passed.
- TDD regression check: the four new F2 tests failed before objectives were added, then passed after migration.
- `node --test tests/unit/lessons.test.js` — 6 passed.
- `npm run test:e2e -- tests/e2e/navigation-accessibility.spec.js tests/e2e/playground-isolation.spec.js tests/e2e/lesson-redesign.spec.js` — 30 passed.
- `npm run test:e2e -- tests/e2e/presenter-mode.spec.js` — 7 passed.
- `npm run lint` — passed.
- `npm run format:check` — passed.

## Concerns

No known concerns within the assigned scope. The PHP and Classes/AJAX lessons retain their original non-IDE composition; CSS II and JavaScript expose the IDE/playground only on task slides.
