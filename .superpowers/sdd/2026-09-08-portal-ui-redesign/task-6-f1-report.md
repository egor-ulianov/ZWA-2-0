# Task 6 F1 report

## Scope

Migrated the four F1 lesson compositions to carry concise lesson objectives and truthful activity metadata while preserving the existing `LessonShell`, slide IDs, Czech curriculum copy, images, simulations, validators, wrappers, and sandbox behavior.

Added one deep-link regression check for each F1 route in `tests/e2e/lesson-redesign.spec.js`. Each check verifies the task slide remains selected, the URL keeps the requested `slide` query, and the route exposes its lesson objective.

No presenter notes were added because these lessons have no new cue that would be more useful than the existing teaching content. The network lesson's simulated terminal remains a classroom simulation; no IDE surface or execution boundary was changed.

## Verification

- Baseline: `npm run test:e2e -- tests/e2e/navigation-accessibility.spec.js tests/e2e/playground-isolation.spec.js` — 22 passed.
- Focused regression: `npm run test:e2e -- tests/e2e/lesson-redesign.spec.js` — 4 passed after migration.
- Unit + final focused E2E: `node --test tests/unit/lessons.test.js && npm run test:e2e -- tests/e2e/navigation-accessibility.spec.js tests/e2e/playground-isolation.spec.js tests/e2e/lesson-redesign.spec.js` — 6 unit tests and 26 E2E tests passed.
- Touched-file lint: `npx eslint --max-warnings=0 interactive_zwa_1_html5_presentation.jsx interactive_zwa_2_forms_presentation.jsx interactive_zwa_1_web_presentation_with_simulated_linux_cli.jsx interactive_zwa_2_css_presentation.jsx tests/e2e/lesson-redesign.spec.js` — passed.
- Touched-file format: `npx prettier --check interactive_zwa_1_html5_presentation.jsx interactive_zwa_2_forms_presentation.jsx interactive_zwa_1_web_presentation_with_simulated_linux_cli.jsx interactive_zwa_2_css_presentation.jsx tests/e2e/lesson-redesign.spec.js` — passed.

## Concerns

The new `activityType` values are slide metadata consumed by future shell/presenter UI; the current shared shell does not render badges for them. No shared component was changed in F1.
