# Course experience visual QA — 2026-09-28

## Scope and method

The deterministic Playwright matrix writes review images to `.next/visual-review/` at fixed viewports with reduced motion, local fixtures, loaded fonts, and settled images. The generated PNG files are build evidence and remain untracked; this record is the committed inspection result.

Review criteria:

- **Hierarchy:** the intended primary action and reading order are visually clear.
- **Spacing:** sections retain deliberate rhythm without collisions or accidental gaps.
- **Type:** headings, body copy, code, and labels remain legible.
- **Overflow:** no unintended horizontal clipping or scroll.
- **Crop:** illustration and content crops preserve the meaningful subject.
- **Theme:** surface and text tokens remain consistent with the selected theme.
- **Focus:** explicit focus is visible where the capture contains a focused control; otherwise keyboard focus is covered by the responsive interaction suite.
- **Legacy:** no retired portal panel language or visual shell is present.

`PASS*` under Focus means that the screenshot itself is not a focus-state capture; the same surface's keyboard order and focused element are asserted by `course-theme.spec.js`, `navigation-accessibility.spec.js`, `portal-responsive.spec.js`, or `workspace-responsive.spec.js`. `N/A` under Crop means the surface is not an illustration review.

## Surface inspection

| Generated file                  | Hierarchy | Spacing | Type | Overflow | Crop | Theme | Focus | Legacy |
| ------------------------------- | --------- | ------- | ---- | -------- | ---- | ----- | ----- | ------ |
| `01-overview-desktop-light.png` | PASS      | PASS    | PASS | PASS     | PASS | PASS  | PASS* | PASS   |
| `02-overview-desktop-dark.png`  | PASS      | PASS    | PASS | PASS     | PASS | PASS  | PASS* | PASS   |
| `03-overview-mobile-light.png`  | PASS      | PASS    | PASS | PASS     | PASS | PASS  | PASS* | PASS   |
| `04-theory-desktop-light.png`   | PASS      | PASS    | PASS | PASS     | PASS | PASS  | PASS* | PASS   |
| `05-theory-desktop-dark.png`    | PASS      | PASS    | PASS | PASS     | PASS | PASS  | PASS* | PASS   |
| `06-theory-mobile-light.png`    | PASS      | PASS    | PASS | PASS     | PASS | PASS  | PASS* | PASS   |
| `07-exercise-desktop.png`       | PASS      | PASS    | PASS | PASS     | PASS | PASS  | PASS* | PASS   |
| `08-exercise-mobile.png`        | PASS      | PASS    | PASS | PASS     | PASS | PASS  | PASS* | PASS   |
| `09-quiz-unanswered.png`        | PASS      | PASS    | PASS | PASS     | PASS | PASS  | PASS* | PASS   |
| `10-quiz-answered.png`          | PASS      | PASS    | PASS | PASS     | PASS | PASS  | PASS* | PASS   |
| `11-student-access.png`         | PASS      | PASS    | PASS | PASS     | N/A  | PASS  | PASS* | PASS   |
| `12-student-progress.png`       | PASS      | PASS    | PASS | PASS     | N/A  | PASS  | PASS* | PASS   |
| `13-teacher-normalization.png`  | PASS      | PASS    | PASS | PASS     | N/A  | PASS  | PASS* | PASS   |
| `14-attendance-workspace.png`   | PASS      | PASS    | PASS | PASS     | N/A  | PASS  | PASS* | PASS   |
| `15-presenter.png`              | PASS      | PASS    | PASS | PASS     | N/A  | PASS  | PASS* | PASS   |
| `16-projector.png`              | PASS      | PASS    | PASS | PASS     | N/A  | PASS  | PASS* | PASS   |
| `17-keyboard-focus.png`         | PASS      | PASS    | PASS | PASS     | PASS | PASS  | PASS  | PASS   |

## Original lecture illustration inspection

| Generated file                    | Hierarchy | Spacing | Type | Overflow | Crop | Theme | Focus | Legacy |
| --------------------------------- | --------- | ------- | ---- | -------- | ---- | ----- | ----- | ------ |
| `artwork-01-html5.png`            | PASS      | PASS    | N/A  | PASS     | PASS | PASS  | N/A   | PASS   |
| `artwork-02-forms.png`            | PASS      | PASS    | N/A  | PASS     | PASS | PASS  | N/A   | PASS   |
| `artwork-03-network.png`          | PASS      | PASS    | N/A  | PASS     | PASS | PASS  | N/A   | PASS   |
| `artwork-04-css.png`              | PASS      | PASS    | N/A  | PASS     | PASS | PASS  | N/A   | PASS   |
| `artwork-05-css-ii.png`           | PASS      | PASS    | N/A  | PASS     | PASS | PASS  | N/A   | PASS   |
| `artwork-06-javascript.png`       | PASS      | PASS    | N/A  | PASS     | PASS | PASS  | N/A   | PASS   |
| `artwork-07-classes-ajax.png`     | PASS      | PASS    | N/A  | PASS     | PASS | PASS  | N/A   | PASS   |
| `artwork-08-php.png`              | PASS      | PASS    | N/A  | PASS     | PASS | PASS  | N/A   | PASS   |
| `artwork-09-forms-crud.png`       | PASS      | PASS    | N/A  | PASS     | PASS | PASS  | N/A   | PASS   |
| `artwork-10-sessions-cookies.png` | PASS      | PASS    | N/A  | PASS     | PASS | PASS  | N/A   | PASS   |
| `artwork-11-files-json.png`       | PASS      | PASS    | N/A  | PASS     | PASS | PASS  | N/A   | PASS   |
| `artwork-12-auth.png`             | PASS      | PASS    | N/A  | PASS     | PASS | PASS  | N/A   | PASS   |

## Findings and corrections

1. The first dark overview capture revealed a capture-order issue: lazy artwork dimensions were not stable after an in-place theme switch. The matrix now reloads from persisted explicit theme state and asserts the artwork height before capture.
2. Visual inspection found that the HTML5 `Sekce` projector slide initially displayed only its title. The projector now captures the rendered DOM expansion of lesson components before sanitizing the projected copy, and a focused end-to-end regression asserts the missing teaching paragraphs.
3. A shared `:focus-visible` treatment was added for links, buttons, form controls, and explicit tab stops. `17-keyboard-focus.png` records the resulting outline on the mobile theme control.

## Verification commands

```text
BASE_URL=http://127.0.0.1:3118 PORT=3118 npm run test:e2e -- tests/e2e/course-visual-acceptance.spec.js tests/e2e/portal-responsive.spec.js tests/e2e/workspace-responsive.spec.js --workers=2
```

Result: 12 tests passed and 29 images were generated and inspected, including `17-keyboard-focus.png`.

```text
node --test tests/quality/course-ui-clean-break.test.mjs tests/quality/course-art.test.mjs
```

The clean-break and artwork checks must remain green after the final production build.

## Final release gate

```text
BASE_URL=http://127.0.0.1:3118 PORT=3118 npm run quality
```

Result: PASS. Unit 142/142, API 28/28, playground 8/8, repository quality 6/6, and E2E 192/192. Lint, formatting, type checking, static security scan, dependency audit (0 vulnerabilities), health contract, Docker checks, and the production build also passed.

The explicit port avoids reusing an unrelated local process on the default port. A prior default-port attempt reached a stale server with a different `APP_ORIGIN`; the pinned final run started the migration-gated test server and exercised the real provider-backed student login successfully.
