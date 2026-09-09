# Final lesson workspace gaps

## Scope

- Re-composed the HTML5, forms, CSS I, and CSS II runtime task slides into distinct Czech `Zadání`, `IDE`, and `Náhled a testy` zones. Live sandbox previews and checker output now render in the named preview region.
- Preserved the existing client-side sandbox, validator, command simulation, protocol token, CSP, and no-external-I/O boundaries. Hidden CSS inspection frames now use a bounded timer so validation completes reliably when positioned outside the viewport.
- Localized shared catalog metadata/chrome, runtime and validator messages, JavaScript sandbox copy, network CLI output, and remaining lesson shell labels to Czech while retaining identifiers, filenames, protocol terms, test data, and code samples.
- Added Czech accessible names for runtime editors and the terminal input, and Czech iframe titles.

## RED / GREEN

RED was recorded before implementation with:

```text
node --test tests/unit/final-lesson-gaps.test.js
```

The initial run failed the catalog metadata, sandbox runtime-message, and CSS-validator-message assertions. The first focused E2E run also exposed stale runtime DOM and then the hidden-inspection-frame completion issue; the strengthened preview assertions stayed red until the inspection scheduling fix and production rebuild were applied.

GREEN evidence:

- `node --test tests/unit/final-lesson-gaps.test.js tests/unit/course-roadmap.test.js tests/unit/portal-frame.test.js tests/unit/lessons.test.js tests/unit/lesson-shell.test.js tests/unit/exercise-test-runner.test.js tests/unit/static-task-checks.test.js tests/playground-isolation.test.js` — 39 passed.
- Focused runtime E2E — 60 passed for runtime/static workspaces, catalog navigation, isolation, and smoke coverage.
- Full E2E — 127 passed.

## Verification

All requested checks passed. E2E used an alternate local port because port 3000 was occupied by an unrelated existing service:

```text
npm test
npm run lint
npm run format:check
npm run typecheck
npm run build
BASE_URL=http://127.0.0.1:3118 PORT=3118 npm run test:e2e
git diff --check
```

`.env.local` remained untracked and was not staged.
