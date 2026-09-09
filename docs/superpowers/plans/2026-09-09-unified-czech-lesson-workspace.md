# Unified Czech Lesson Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give all twelve lessons a consistent Czech task/IDE/preview-test experience while eliminating duplicate student navigation and preserving every current runtime/security boundary.

**Architecture:** Define shared Czech copy and a composable task-workspace frame, then migrate the existing lesson activities through capability-specific adapters rather than inventing a universal code runner. `LessonShell` owns one student navigation system; individual lessons keep their slide IDs and existing validators/simulations while supplying common task-zone content.

**Tech Stack:** Next.js 16.3.4 Pages Router, React 18.3.1, Tailwind CSS 3.4, Node test runner, Playwright, existing sandboxed iframe playground.

**Spec:** `docs/superpowers/specs/2026-09-09-unified-czech-lesson-workspace-design.md`

## Global Constraints

- Keep Node.js `>=20 <21`, Next.js `16.3.4` Pages Router, React `18.3.1`, and existing dependencies only.
- Preserve all lesson routes, exact slide IDs, `?slide=` deep links, unknown-slide fallback, lesson content, existing validators, terminal simulation, solution reveals, iframe titles, and accessibility semantics.
- Student lesson mode must expose one navigation only: left `Osnova kurzu`; remove the duplicate top slide tablist. Preserve keyboard arrow/Home/End navigation outside editable fields.
- Translate every shared lesson/runtime UI string and accessible label to Czech. Do not machine-translate existing Czech curriculum content.
- Every task surface exposes named `Zadání`, `IDE`, and `Náhled a testy` zones with explicit `Spustit testy`; all source drafts are session-only.
- Do not create fake PHP/server execution or live network/filesystem behavior. Static checks must say they are static.
- Do not relax CSP, iframe sandbox attributes, message protocol/tokens, origin checks, timeout, host-page execution protections, API/auth/database behavior, or projector privacy filtering.

---

## Dispatch map

| Wave | Packet | Depends on | Exclusive ownership |
| --- | --- | --- | --- |
| 1 | A — Czech shell and one navigation | none | `src/components/lesson/*`, shared lesson tests |
| 2 | B — common task workspace | A | `src/components/exercises/*`, workspace tests |
| 3 | C — runtime-backed lessons 1–6 | A/B | HTML/forms/network/CSS/CSS II/JS sources, focused tests |
| 4 | D — static/server lesson adapters 7–12 | A/B | Classes/AJAX/PHP/CRUD/sessions/files/auth sources, focused tests |
| 5 | E — full locale, navigation, privacy integration | C/D | integration tests and narrowly proven fixes |

The user explicitly declined worktrees. Execute implementation packets serially in the existing checkout; no two implementation agents may mutate files concurrently.

### Task 1: Czech lesson shell and single student navigation

**Files:**

- Modify: `src/components/lesson/LessonShell.jsx`
- Modify: `src/components/lesson/LessonOutline.jsx`
- Modify: `src/components/lesson/ProjectorStage.jsx`
- Modify: `src/components/lesson/PresenterConsole.jsx`
- Modify: `tests/unit/lesson-shell.test.js`
- Modify: `tests/e2e/navigation-accessibility.spec.js`
- Modify: `tests/e2e/presenter-mode.spec.js`

**Interfaces:** `LessonShell` continues to receive `lesson`, `slides`, `activeSlide`, `onChange`, `children`, and modes. Student mode must not render `SlideNavigation`; `LessonOutline` remains the single `nav` control. Projector/presenter retain mode contracts and current privacy boundary.

- [ ] **Step 1: Write failing navigation/locale assertions**

```js
await page.goto('/interactive-zwa-1-html5?slide=tasks');
await expect(page.getByRole('navigation', { name: 'Osnova kurzu' })).toBeVisible();
await expect(page.getByRole('tablist')).toHaveCount(0);
await expect(page.getByText('Lekce 1', { exact: true })).toBeVisible();
```

Add source-contract assertions for `Osnova kurzu`, `Cíl lekce`, and absence of the old English `Course outline`/`Learning objective` strings in these shared lesson components.

- [ ] **Step 2: Verify RED**

Run: `npm run test:e2e -- tests/e2e/navigation-accessibility.spec.js tests/e2e/presenter-mode.spec.js && node --test tests/unit/lesson-shell.test.js`

Expected: student tablist and English labels still exist.

- [ ] **Step 3: Implement Czech shell copy and remove duplicate student tabs**

Remove only student-mode `SlideNavigation` rendering. Keep global arrow/Home/End behavior and `main` ID. Translate all shared lesson chrome including `Lekce N`, `Cíl lekce`, `Osnova kurzu`, projector previous/next controls, presenter outline/timer/notes/projector labels, and accessible names. Update tests to use outline buttons and preserve deep-link behavior.

- [ ] **Step 4: Verify and commit**

Run: `node --test tests/unit/lesson-shell.test.js tests/unit/projector-content.test.js tests/unit/presenter-channel.test.js && npm run test:e2e -- tests/e2e/navigation-accessibility.spec.js tests/e2e/presenter-mode.spec.js`

Commit message: `feat: unify Czech lesson shell navigation`

### Task 2: Common Czech task workspace and bounded static checks

**Files:**

- Create: `src/components/exercises/LessonTaskWorkspace.jsx`
- Create: `src/components/exercises/staticTaskChecks.js`
- Modify: `src/components/exercises/ExerciseWorkspace.jsx`
- Modify: `src/components/exercises/testDefinitions.js`
- Modify: `tests/unit/exercise-test-runner.test.js`
- Create: `tests/unit/static-task-checks.test.js`
- Modify: `tests/e2e/playground-isolation.spec.js`

**Interfaces:** `LessonTaskWorkspace({ task, editor, preview, testDefinition, staticCheck, privateMarker })` renders exactly three named regions: `Zadání`, `IDE`, `Náhled a testy`. `staticCheck` receives only bounded source text and returns `{ id, ok, text, hint? }[]`; it never evaluates code. Existing `ExerciseWorkspace` keeps its sandboxed behavior but exposes Czech labels and the same named zones.

- [ ] **Step 1: Write failing shared-workspace tests**

```js
test('static task checks inspect bounded source without evaluating it', () => {
  const results = runStaticTaskChecks({ required: ['function', 'return'] }, 'function demo() { return 1; }');
  assert.deepEqual(results.map(({ ok }) => ok), [true, true]);
});
```

```js
await expect(page.getByRole('region', { name: 'Zadání' })).toBeVisible();
await expect(page.getByRole('region', { name: 'IDE' })).toBeVisible();
await expect(page.getByRole('region', { name: 'Náhled a testy' })).toBeVisible();
await expect(page.getByRole('button', { name: 'Spustit testy' })).toBeVisible();
```

- [ ] **Step 2: Verify RED**

Run: `node --test tests/unit/static-task-checks.test.js tests/unit/exercise-test-runner.test.js && npm run test:e2e -- tests/e2e/playground-isolation.spec.js`

Expected: module/region labels are absent.

- [ ] **Step 3: Implement the common frame safely**

`LessonTaskWorkspace` may use a textarea only for its own session state, a caller-owned preview element, and static source checks. It must mark the complete interactive area `data-projector-private`. It must show `Statická kontrola — kód se v prohlížeči nespouští.` when `staticCheck` is supplied. Translate every `ExerciseWorkspace`/definition string: `Plocha úkolu`, `V tomto okně prohlížeče`, `Soubory`, `Editor`, `Náhled`, `Výsledky testů`, and `Spustit testy`.

- [ ] **Step 4: Verify sandbox and commit**

Run: `node --test tests/unit/exercise-test-runner.test.js tests/unit/static-task-checks.test.js tests/playground-isolation.test.js && npm run test:e2e -- tests/e2e/playground-isolation.spec.js`

Commit message: `feat: add unified Czech task workspace`

### Task 3: Migrate runtime-backed task lessons 1–6

**Files:**

- Modify: `interactive_zwa_1_html5_presentation.jsx`
- Modify: `interactive_zwa_2_forms_presentation.jsx`
- Modify: `interactive_zwa_1_web_presentation_with_simulated_linux_cli.jsx`
- Modify: `interactive_zwa_2_css_presentation.jsx`
- Modify: `interactive_zwa_5_css2_presentation.jsx`
- Modify: `interactive_zwa_5_javascript_presentation.jsx`
- Create: `tests/e2e/lesson-workspace-runtime.spec.js`

**Interfaces:** Consume `LessonTaskWorkspace` and Czech `ExerciseWorkspace`. Existing HTML/CSS/JS sandbox/validator/terminal APIs remain source of truth. Task slide IDs, task step IDs, and `data-projector-private` markers remain unchanged or become stricter.

- [ ] **Step 1: Add failing task-zone E2E coverage**

```js
for (const route of ['/interactive-zwa-1-html5?slide=tasks', '/interactive-zwa-2-forms?slide=tasks', '/interactive-zwa-1?slide=tasks-net', '/interactive-zwa-2?slide=tasks', '/interactive-zwa-5-css-ii?slide=tasks', '/interactive-zwa-5-js?slide=tasks']) {
  await page.goto(route);
  await expect(page.getByRole('region', { name: 'Zadání' }).first()).toBeVisible();
  await expect(page.getByRole('region', { name: 'IDE' }).first()).toBeVisible();
  await expect(page.getByRole('region', { name: 'Náhled a testy' }).first()).toBeVisible();
}
```

For JavaScript also click `Spustit testy` and retain isolation assertions. For networking assert command input remains local and no external requests are made.

- [ ] **Step 2: Verify RED**

Run: `npm run test:e2e -- tests/e2e/lesson-workspace-runtime.spec.js tests/e2e/playground-isolation.spec.js`

Expected: at least one named zone is absent for each route before migration.

- [ ] **Step 3: Adapt existing exercises, do not replace runtimes**

Wrap each existing task control in named task/IDE/preview-test zones. HTML/forms retain local and W3C validation. Network uses the simulated terminal as IDE and command checklist as results. CSS/CSS II retain static/inspect iframes and their current check buttons, relabeled to Czech. JavaScript uses translated `ExerciseWorkspace` and retains sandbox test execution, console, exports, timeout, and session reset. Avoid adding an IDE to non-task slides.

- [ ] **Step 4: Verify and commit**

Run: `node --test tests/unit/lessons.test.js tests/playground-isolation.test.js && npm run test:e2e -- tests/e2e/lesson-workspace-runtime.spec.js tests/e2e/playground-isolation.spec.js tests/e2e/navigation-accessibility.spec.js`

Commit message: `feat: unify runtime lesson task workspaces`

### Task 4: Migrate static/server task lessons 7–12

**Files:**

- Modify: `interactive_zwa_7_classes_ajax_presentation.jsx`
- Modify: `interactive_zwa_8_php_presentation.jsx`
- Modify: `interactive_zwa_9_forms_crud_presentation.jsx`
- Modify: `interactive_zwa_10_sessions_cookies_presentation.jsx`
- Modify: `interactive_zwa_11_files_json_presentation.jsx`
- Modify: `interactive_zwa_12_auth_presentation.jsx`
- Create: `tests/e2e/lesson-workspace-static.spec.js`

**Interfaces:** Consume `LessonTaskWorkspace({ task, editor, preview, staticCheck, privateMarker })`. Per-task static configuration lists only transparent required source markers; checks never evaluate source or invoke network/API. Existing reveal components and task slide IDs continue working.

- [ ] **Step 1: Add failing truthful-static E2E coverage**

```js
for (const route of ['/interactive-zwa-7?slide=task1', '/interactive-zwa-8-php?slide=t1', '/interactive-zwa-9?slide=tasks', '/interactive-zwa-10-sessions-cookies?slide=tasks', '/interactive-zwa-11-files-json?slide=tasks', '/interactive-zwa-12-auth?slide=tasks']) {
  await page.goto(route);
  await expect(page.getByRole('region', { name: 'Zadání' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'IDE' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Náhled a testy' })).toContainText('Statická kontrola');
}
```

- [ ] **Step 2: Verify RED**

Run: `npm run test:e2e -- tests/e2e/lesson-workspace-static.spec.js`

Expected: current static/reveal slides lack the common three-zone workspace.

- [ ] **Step 3: Add truthful task adapters**

For each existing task, seed an editable draft from the course’s existing example or starter text, preserve the original reveal/disclosure, and render a static expected-outcome/explanation preview. Supply no more than three source-marker requirements per task, worded Czech and bounded. State explicitly that browser checks do not execute PHP/server code. Mark the complete workspace projector-private.

- [ ] **Step 4: Verify and commit**

Run: `node --test tests/unit/static-task-checks.test.js tests/unit/lessons.test.js && npm run test:e2e -- tests/e2e/lesson-workspace-static.spec.js tests/e2e/navigation-accessibility.spec.js`

Commit message: `feat: unify static lesson task workspaces`

### Task 5: Czech locale, navigation, and security integration

**Files:**

- Create: `tests/e2e/lesson-czech-ui.spec.js`
- Modify: `tests/e2e/presenter-mode.spec.js`
- Modify: `tests/e2e/portal-responsive.spec.js`
- Modify only source required to repair a reproduced integration defect

**Interfaces:** Consume all prior packets. This task may not redesign lessons or alter runtime/security policy.

- [ ] **Step 1: Add failing all-lessons locale/navigation/privacy assertions**

```js
await page.goto('/interactive-zwa-5-js?slide=tasks');
await expect(page.getByRole('navigation', { name: 'Osnova kurzu' })).toBeVisible();
await expect(page.getByRole('tablist')).toHaveCount(0);
await expect(page.getByRole('button', { name: 'Spustit testy' })).toBeVisible();
await page.goto('/interactive-zwa-5-js?mode=projector&slide=tasks');
await expect(page.getByText('Plocha úkolu', { exact: true })).toHaveCount(0);
```

Add 320px task-workspace overflow and editor-arrow-key tests.

- [ ] **Step 2: Verify RED**

Run: `npm run test:e2e -- tests/e2e/lesson-czech-ui.spec.js`

Expected: test file is absent before integration coverage.

- [ ] **Step 3: Verify boundaries and make only narrow fixes**

Test every public lesson route’s task slide for Czech shared labels and one task workspace. Test projector strips the whole interactive workspace. Retain hostile-code sandbox tests and keyboard behavior. Make only source changes directly required by a failing test.

- [ ] **Step 4: Full verification and commit**

Run: `npm test && npm run lint && npm run format:check && npm run typecheck && npm run build && npm run test:e2e`

Commit message: `test: verify unified Czech lesson workspace`

## Self-review

- Spec coverage: Task 1 handles Czech chrome and navigation; Task 2 establishes a safe common frame; Task 3 preserves real client runtimes; Task 4 adds honest static server-task adapters; Task 5 proves localization, single navigation, privacy, responsiveness, and security.
- Placeholder scan: no TODO, TBD, or undefined interface is used.
- Interface consistency: `LessonTaskWorkspace` is defined before client and static lesson migrations; only its declared `staticCheck` may inspect source text and it never evaluates it.
