# Portal UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Rebuild the course and lesson UI into a calm programming-learning portal with IDE-style exercises and dedicated projector/presenter modes, without changing routes, content, backend behavior, or sandbox boundaries.

**Architecture:** Add a small shared visual layer, then layer it under existing Pages Router routes and presentation components. LessonShell stays the compatibility boundary for all twelve lessons and gains student, projector, and presenter paths. The current sandbox remains the sole runtime for student code; a pure declarative test adapter feeds the new test panel.

**Tech Stack:** Next.js 16.3.4 Pages Router, React 18.3.1, Tailwind CSS 3.4, Node test runner, Playwright, existing sandboxed iframe playground.

**Spec:** docs/superpowers/specs/2026-09-08-portal-ui-redesign.md

## Global Constraints

- Keep Node.js >=20 <21, Next.js 16.3.4 Pages Router, and React 18.3.1; add no dependencies.
- Preserve every public lesson route, ?slide= deep link, tab semantics, unknown-slide fallback, CSP, sandbox policy, and hostile-code protection.
- Do not change database migrations, API handlers, grade/attendance payloads, or authorization logic.
- Use ZWA · Web Applications only as text; do not create a standalone Z mark.
- Do not display fake progress or claim persistent saved work.
- Retain Czech lesson text; do not translate or rewrite instructional material during UI migration.

---

## Dispatch map

| Wave | Agent packet | Depends on | Exclusive ownership |
| --- | --- | --- | --- |
| 1 | A — visual foundation | none | src/components/portal/*, styles/globals.css |
| 2 | B — catalogue and student UI | A | pages/index.jsx, pages/student/*, course UI |
| 2 | C — shared lesson shell | A | src/components/lesson/* except presenter files |
| 3 | D — IDE/test workspace | C | src/components/exercises/*, JavaScript pilot lesson |
| 3 | E — projector/presenter | C | presenter files and LessonShell integration |
| 4 | F1/F2/F3 — lesson migration | C/D/E as applicable | disjoint lesson source groups |
| 5 | G — integration and accessibility | all | tests and narrowly scoped fixes |

Do not dispatch B/C before A. D and E may run together after C. Merge D/E serially if both touch LessonShell.jsx. F1/F2/F3 may run in parallel after shared interfaces merge. An agent must not edit another active packet’s files.

## File structure

| File | Responsibility |
| --- | --- |
| src/components/portal/PortalFrame.jsx | Text-only course identity, header, page width, and shared semantic frame. |
| src/components/portal/CourseRoadmap.jsx | Readable module grouping from the current lesson catalogue. |
| src/components/lesson/LessonShell.jsx | Student/projector/presenter shell selection while keeping legacy slide API. |
| src/components/lesson/LessonOutline.jsx | Accessible compact course and slide outline. |
| src/components/lesson/ProjectorStage.jsx | Projected current-slide view with no private controls. |
| src/components/lesson/PresenterConsole.jsx | Instructor notes, outline, timer, and projector launcher. |
| src/components/lesson/presenterChannel.js | Same-origin BroadcastChannel validation and lifecycle. |
| src/components/exercises/ExerciseWorkspace.jsx | Files, editor, preview/output, explicit test trigger, and test panel. |
| src/components/exercises/testDefinitions.js | Declarative requirement labels, hints, and validators. |

### Task 1: Agent A — shared visual foundation

**Files:**

- Create: src/components/portal/PortalFrame.jsx
- Create: src/components/portal/portalClasses.js
- Modify: styles/globals.css
- Test: tests/unit/portal-frame.test.js

**Interfaces:** Produces PortalFrame({ children, courseLabel, meta, className }) and portalClassNames. Later work may consume CSS classes portal-page, portal-header, portal-action, portal-panel, portal-kicker, and portal-code.

- [ ] **Step 1: Write a failing visual-identity test**

~~~js
test('portal frame uses textual course identity and no standalone Z mark', async () => {
  const source = await readFile(path.join(root, 'src/components/portal/PortalFrame.jsx'), 'utf8');
  assert.match(source, /ZWA · Web Applications/);
  assert.doesNotMatch(source, /w-symbol|aria-label=.Z logo/i);
});
~~~

- [ ] **Step 2: Verify it fails**

Run: node --test tests/unit/portal-frame.test.js

Expected: FAIL because PortalFrame.jsx is absent.

- [ ] **Step 3: Implement the minimal shared frame and visual primitives**

~~~jsx
export default function PortalFrame({ children, courseLabel = 'ZWA · Web Applications', meta }) {
  return <div className="portal-page"><header className="portal-header"><strong>{courseLabel}</strong><span>{meta}</span></header>{children}</div>;
}
~~~

Use solid near-white surfaces, charcoal text, deep-indigo actions, soft-coral instructional accents, dark-mode equivalents, and visible focus-visible styling. Do not add gradients, glass blur, decorative marks, or stat cards.

- [ ] **Step 4: Verify and commit**

Run: node --test tests/unit/portal-frame.test.js && npm run format:check

Expected: PASS.

Commit message: feat: add restrained portal visual foundation

### Task 2: Agent B — course roadmap and student screens

**Files:**

- Create: src/components/portal/CourseRoadmap.jsx
- Create: src/components/portal/courseMetadata.js
- Modify: pages/index.jsx
- Modify: pages/student/index.jsx
- Modify: pages/student/progress.jsx
- Test: tests/unit/course-roadmap.test.js
- Test: tests/e2e/navigation-accessibility.spec.js
- Test: tests/e2e/student-workflow.spec.js

**Interfaces:** Consumes PortalFrame and lessons. Produces getCourseModule(lesson) and CourseRoadmap({ lessons }). Must retain /student and /student/progress request, redirect, and response behavior.

- [ ] **Step 1: Write a failing metadata test**

~~~js
test('course metadata covers each existing lesson in catalogue order', () => {
  assert.equal(courseMetadata.length, lessons.length);
  assert.deepEqual(courseMetadata.map(({ slug }) => slug), lessons.map(({ slug }) => slug));
  assert.ok(courseMetadata.every(({ module, focus }) => module && focus));
});
~~~

- [ ] **Step 2: Verify it fails**

Run: node --test tests/unit/course-roadmap.test.js

Expected: FAIL because course metadata is absent.

- [ ] **Step 3: Implement roadmap and restyle authenticated screens**

Map actual lessons to hand-authored module/focus strings. Keep current href values and expose exactly one lesson-opening action per card. Do not display percentage, lock, streak, or continue state without a persisted lesson-progress source. Wrap login and progress with PortalFrame, retaining form labels/IDs, errors, API calls, redirects, grade fields, and attendance behavior.

- [ ] **Step 4: Update only necessary E2E expectations**

~~~js
await expect(page.getByText('ZWA · Web Applications', { exact: true })).toBeVisible();
await expect(page.getByRole('main').getByRole('link')).toHaveCount(12);
await expect(page.getByRole('link', { name: /Web Presentation with Simulated Linux CLI/ })).toHaveAttribute('href', '/interactive-zwa-1');
~~~

Keep unauthorized redirect and least-privilege grade assertions unchanged.

- [ ] **Step 5: Verify and commit**

Run: node --test tests/unit/course-roadmap.test.js tests/unit/lessons.test.js && npm run test:e2e -- tests/e2e/navigation-accessibility.spec.js tests/e2e/student-workflow.spec.js

Expected: PASS.

Commit message: feat: redesign course catalogue and student surfaces

### Task 3: Agent C — shared student lesson shell

**Files:**

- Create: src/components/lesson/LessonOutline.jsx
- Create: src/components/lesson/LessonContext.jsx
- Modify: src/components/lesson/LessonShell.jsx
- Modify: src/components/lesson/SlideNavigation.jsx
- Modify: src/components/lesson/SlideCard.jsx
- Test: tests/unit/lesson-shell.test.js
- Test: tests/e2e/navigation-accessibility.spec.js

**Interfaces:** LessonShell accepts an optional mode = 'student' prop with student, projector, and presenter as the only supported values. It produces LessonContext value { lesson, slides, activeSlide, onChange, mode }. Test-running and window synchronization are out of scope for this task.

- [ ] **Step 1: Write a failing shell contract test**

~~~js
test('lesson shell has a student default and declares projector and presenter modes', async () => {
  const source = await readFile(path.join(root, 'src/components/lesson/LessonShell.jsx'), 'utf8');
  assert.match(source, /mode = 'student'/);
  assert.match(source, /projector/);
  assert.match(source, /presenter/);
});
~~~

- [ ] **Step 2: Verify it fails**

Run: node --test tests/unit/lesson-shell.test.js

Expected: FAIL because the mode contract is absent.

- [ ] **Step 3: Implement the calmer lesson composition**

Use PortalFrame; render course/lesson context, optional objective support, LessonOutline, and the existing tablist. Preserve SlideNavigation as the canonical accessible control: same tab IDs, ARIA relations, Home/End, arrow keys, and URL behavior. Make SlideCard solid and restrained; do not alter slide content.

- [ ] **Step 4: Add outline E2E coverage and retain old navigation assertions**

~~~js
await expect(page.getByRole('navigation', { name: /Course outline/i })).toBeVisible();
await page.getByRole('tab', { name: 'Úkoly' }).press('Home');
await expect(page.getByRole('tab', { name: 'Úvod' })).toHaveAttribute('aria-selected', 'true');
~~~

- [ ] **Step 5: Verify and commit**

Run: node --test tests/unit/lesson-shell.test.js tests/unit/lessons.test.js && npm run test:e2e -- tests/e2e/navigation-accessibility.spec.js

Expected: PASS.

Commit message: feat: rebuild shared student lesson shell

### Task 4: Agent D — IDE exercise workspace and test runner

**Files:**

- Create: src/components/exercises/ExerciseWorkspace.jsx
- Create: src/components/exercises/testDefinitions.js
- Create: src/components/exercises/testRunner.js
- Modify: src/components/playground/JsSandbox.jsx
- Modify: interactive_zwa_5_javascript_presentation.jsx
- Test: tests/unit/exercise-test-runner.test.js
- Test: tests/e2e/playground-isolation.spec.js

**Interfaces:** ExerciseWorkspace({ files, activeFile, onChangeFile, preview, testDefinition }) displays session-only source state. testDefinition is { id, label, hint, run({ source, result }) }; run returns an array of { id, ok, text, hint? }. JsSandbox retains onResult(results) and may add onReady(), but must not relax sandboxing.

- [ ] **Step 1: Write the pure runner test first**

~~~js
test('semantic HTML test names a failed requirement but does not give a solution', () => {
  const result = runExerciseTests(semanticHtmlDefinition, { source: '<div>News</div>' });
  assert.deepEqual(result.map(({ id, ok }) => [id, ok]), [['main-landmark', false]]);
  assert.match(result[0].text, /main landmark/i);
  assert.doesNotMatch(result[0].text, /replace.*div.*main/i);
});
~~~

- [ ] **Step 2: Verify it fails**

Run: node --test tests/unit/exercise-test-runner.test.js

Expected: FAIL because testRunner.js is absent.

- [ ] **Step 3: Implement workspace and definitions**

Use native buttons, aria-selected file tabs, an explicit Run tests button, and aria-live="polite" test summary. Reuse iframe preview and bounded source limits. Show In this browser session, never Saved. Do not edit documents.js, protocol.js, CSP, token generation, or iframe sandbox attributes.

- [ ] **Step 4: Convert only the existing JavaScript task editor into the pilot**

Keep every JS template and validation result. Replace the layout with ExerciseWorkspace, rename the visible primary action to Run tests, and retain iframe[title="JavaScript DOM sandbox"].

- [ ] **Step 5: Add UI test and retain hostile-code regression**

~~~js
await page.goto('/interactive-zwa-5-js?slide=tasks');
await page.getByRole('button', { name: 'Run tests' }).click();
await expect(page.getByRole('region', { name: 'Test results' })).toContainText('Code executed');
await expect(page.locator('iframe[title="JavaScript DOM sandbox"]')).toBeVisible();
~~~

Keep the existing hostile student JavaScript test unchanged.

- [ ] **Step 6: Verify and commit**

Run: node --test tests/unit/exercise-test-runner.test.js tests/playground-isolation.test.js && npm run test:e2e -- tests/e2e/playground-isolation.spec.js

Expected: PASS.

Commit message: feat: add IDE-style exercise test workspace

### Task 5: Agent E — projector and presenter modes

**Files:**

- Create: src/components/lesson/presenterChannel.js
- Create: src/components/lesson/ProjectorStage.jsx
- Create: src/components/lesson/PresenterConsole.jsx
- Modify: src/components/lesson/LessonShell.jsx
- Modify: src/components/lesson/navigation.js
- Test: tests/unit/presenter-channel.test.js
- Test: tests/e2e/presenter-mode.spec.js

**Interfaces:** createPresenterChannel({ lessonSlug, slides, onSlide }) returns { publishSlide(slideId), close() }. ProjectorStage({ lesson, slide, onPrevious, onNext }) renders only projected content. PresenterConsole({ lesson, slides, activeSlide, onChange }) provides instructor controls.

- [ ] **Step 1: Write failing channel-validation tests**

~~~js
test('presenter messages ignore malformed, foreign, and unknown slide ids', () => {
  assert.equal(parsePresenterMessage({ lessonSlug: 'html5', slideId: 'unknown' }, slides, 'html5'), null);
  assert.equal(parsePresenterMessage({ lessonSlug: 'other', slideId: 'intro' }, slides, 'html5'), null);
  assert.deepEqual(parsePresenterMessage({ type: 'slide-change', lessonSlug: 'html5', slideId: 'intro' }, slides, 'html5'), { slideId: 'intro' });
});
~~~

- [ ] **Step 2: Verify it fails**

Run: node --test tests/unit/presenter-channel.test.js

Expected: FAIL because presenterChannel.js is absent.

- [ ] **Step 3: Add safe modes and synchronization**

Add resolveLessonMode(location) to navigation.js: only student, projector, and presenter are valid; invalid values return student. Projector mode omits course outline, tabs, source editor, test panel, grades, and presenter notes. Open projector runs only from a user click; if window.open returns null, show a non-modal same-origin projector link. Synchronize only validated slide IDs through a lesson-specific BroadcastChannel and close it on unmount.

- [ ] **Step 4: Add projector behavior tests**

~~~js
await page.goto('/interactive-zwa-1-html5?mode=projector&slide=intro');
await expect(page.getByRole('navigation', { name: /Course outline/i })).toHaveCount(0);
await expect(page.getByText('01 / 04')).toBeVisible();
await page.keyboard.press('ArrowRight');
await expect(page).toHaveURL(/mode=projector.*slide=html/);
~~~

Also test invalid mode fallback and that an arrow key inside an editable field does not move the slide.

- [ ] **Step 5: Verify and commit**

Run: node --test tests/unit/presenter-channel.test.js tests/unit/lessons.test.js && npm run test:e2e -- tests/e2e/presenter-mode.spec.js tests/e2e/navigation-accessibility.spec.js

Expected: PASS.

Commit message: feat: add projector and presenter lesson modes

### Task 6: Agents F1, F2, and F3 — migrate all lesson components without collisions

**Files:**

- F1: interactive_zwa_1_html5_presentation.jsx, interactive_zwa_2_forms_presentation.jsx, interactive_zwa_1_web_presentation_with_simulated_linux_cli.jsx, interactive_zwa_2_css_presentation.jsx
- F2: interactive_zwa_5_css2_presentation.jsx, interactive_zwa_5_javascript_presentation.jsx, interactive_zwa_7_classes_ajax_presentation.jsx, interactive_zwa_8_php_presentation.jsx
- F3: interactive_zwa_9_forms_crud_presentation.jsx, interactive_zwa_10_sessions_cookies_presentation.jsx, interactive_zwa_11_files_json_presentation.jsx, interactive_zwa_12_auth_presentation.jsx
- Test: tests/e2e/navigation-accessibility.spec.js and new tests/e2e/lesson-redesign.spec.js

**Interfaces:** Agents consume the shared shell, IDE workspace, and presenter mode. Each owns only named lesson sources and must not edit shared components.

- [ ] **Step 1: Add one regression check per assigned route before migration**

~~~js
test('HTML lesson retains its task deep link after migration', async ({ page }) => {
  await page.goto('/interactive-zwa-1-html5?slide=tasks');
  await expect(page.getByRole('tab', { name: 'Úkoly' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('heading').first()).toBeVisible();
});
~~~

- [ ] **Step 2: Confirm baseline routes pass**

Run: npm run test:e2e -- tests/e2e/navigation-accessibility.spec.js tests/e2e/playground-isolation.spec.js

Expected: PASS before each group edits lesson sources.

- [ ] **Step 3: Migrate composition, not curriculum behavior**

Add concise course-owned objectives and activity types only where they reflect current content. Preserve Czech copy, images, simulations, validators, iframe titles, and wrappers. Do not force the IDE surface into non-code exercises. Add presenter notes only with a concrete teaching cue; projector pages omit them.

- [ ] **Step 4: Verify and commit each group**

Run: node --test tests/unit/lessons.test.js && npm run test:e2e -- tests/e2e/navigation-accessibility.spec.js tests/e2e/playground-isolation.spec.js tests/e2e/lesson-redesign.spec.js

Expected: PASS.

Commit message: feat: migrate lesson group to learning portal UI

### Task 7: Agent G — responsive, accessibility, and full-regression review

**Files:**

- Create: tests/e2e/portal-responsive.spec.js
- Modify: tests/e2e/navigation-accessibility.spec.js
- Modify: tests/e2e/playground-isolation.spec.js
- Modify: only source directly required to repair a reproducible failure

**Interfaces:** Consumes all previous work. Produces final test evidence; it must not redesign behavior or refactor shared components without a failing test and coordinator approval.

- [ ] **Step 1: Add responsive student and projector assertions**

~~~js
test('student lesson has no horizontal overflow at 320 pixels', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto('/interactive-zwa-5-js?slide=tasks');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('projector mode has usable controls at 1280 pixels', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/interactive-zwa-1-html5?mode=projector&slide=intro');
  await expect(page.getByRole('main')).toBeVisible();
  await expect(page.getByRole('button', { name: /Next/i })).toBeVisible();
});
~~~

- [ ] **Step 2: Verify keyboard and privacy boundaries**

Check focus on login, course links, tabs, Run tests, test region, presenter controls, and projector controls. Confirm no keyboard trap, duplicate main landmark, projector tablist, or presenter-note text in projector output.

- [ ] **Step 3: Run complete verification**

Run: npm test && npm run lint && npm run format:check && npm run typecheck && npm run build && npm run test:e2e

Expected: every command exits 0.

- [ ] **Step 4: Commit integration tests and narrowly scoped fixes**

Commit message: test: verify portal redesign across views

## Coordinator review gates

1. Merge Task 1 before Tasks 2 and 3.
2. Review Task 3 LessonShell API before Tasks 4 and 5.
3. Before merging Tasks 4/5, confirm no sandbox policy, protocol, auth, API, or database file changed.
4. Dispatch F1/F2/F3 only after shared interfaces merge; require each agent to report exact lesson files changed.
5. Before final integration, audit every packet: no fake progress, standalone Z mark, backend change, or sandbox relaxation.

## Self-review

- Spec coverage: Tasks 1–2 deliver visual system and course/student UI; Task 3 lesson shell; Task 4 IDE/testing; Task 5 projector/presenter; Task 6 applies the work to twelve lessons; Task 7 verifies accessibility and regressions.
- Placeholder scan: no TBD, TODO, or undefined interface is used.
- Interface consistency: mode, ExerciseWorkspace, testDefinition, and createPresenterChannel are declared before tasks that consume them.
