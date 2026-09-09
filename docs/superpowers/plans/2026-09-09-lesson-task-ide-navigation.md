# Lesson Task IDE and Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or an equivalent fresh-review workflow. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework all ZWA lessons so individual tasks live in the left outline and every task has consistent file and reference-solution IDE tabs.

**Architecture:** Add a reusable `WorkspaceIdeTabs` component and extend `LessonTaskWorkspace` with file/solution tab slots. Migrate lessons in non-overlapping groups, preserving their runtimes and deep links while splitting aggregate task slides into outline-visible task items. The shared shell owns the catalogue return control.

**Tech Stack:** Next.js 16.3.4 Pages Router, React 18.3.1, CodeMirror 6 through existing `@uiw/react-codemirror`, Playwright, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-09-lesson-task-ide-navigation-design.md`

## Global Constraints

- Do not use a worktree; the user explicitly declined it. Stage only files owned by the current task.
- Keep all existing runtime security: no host-page source evaluation, relaxed iframe sandbox, real networking, PHP execution, or external editor loading.
- `Osnova kurzu` is the only student-mode lesson navigation. Task, file, and solution tabs must prevent global arrow/Home/End navigation.
- The final IDE tab is always a read-only Czech `Řešení` tab. It is not rendered above/below input and cannot replace the student draft.
- Preserve current public routes and old aggregate task deep links by resolving them to the first corresponding individual task.
- Retain Czech copy, named task zones, 320px responsiveness, and projector privacy filtering.

### Task 1: Shared catalogue return and IDE tabs

**Files:**
- Create: `src/components/exercises/WorkspaceIdeTabs.jsx`
- Modify: `src/components/exercises/LessonTaskWorkspace.jsx`
- Modify: `src/components/lesson/LessonShell.jsx`
- Modify: `tests/e2e/lesson-czech-ui.spec.js`
- Create: `tests/e2e/lesson-ide-tabs.spec.js`

**Interfaces:** `WorkspaceIdeTabs({ files, solution, activeFileId, onActiveFileChange })` receives student file objects `{ id, label, panel }` and a solution object `{ label: 'Řešení', panel }`. `LessonTaskWorkspace` accepts `ideTabs` as an element in place of `editor`; old `editor` callers remain supported.

- [ ] Write a failing E2E test that visits an existing task route, asserts the IDE has file tab(s), a final `Řešení` tab, and no solution text outside `IDE`; assert `/interactive-zwa-1-html5?slide=tasks` has `← Zpět na přehled lekcí` linking to `/`.
- [ ] Run `BASE_URL=http://127.0.0.1:3118 PORT=3118 npm run test:e2e -- tests/e2e/lesson-ide-tabs.spec.js` and confirm RED.
- [ ] Implement accessible horizontal tabs with roving focus, Arrow Left/Right/Up/Down, Home, and End handling. File panels use caller-owned editors; solution panel is read-only and marks its CodeMirror content non-editable. Add the catalogue return link to non-projector `LessonShell`.
- [ ] Run the focused E2E test, `npm run lint`, `npm run format:check`, and `npm run build`; commit `feat: add lesson IDE tabs and catalogue return`.

### Task 2: Rework lessons 01–03 and theory-only section pages

**Files:**
- Modify: `interactive_zwa_1_html5_presentation.jsx`
- Modify: `interactive_zwa_2_forms_presentation.jsx`
- Modify: `interactive_zwa_1_web_presentation_with_simulated_linux_cli.jsx`
- Modify: `tests/e2e/lesson-workspace-runtime.spec.js`
- Create: `tests/e2e/lesson-theory-and-outline.spec.js`

**Interfaces:** Consume `WorkspaceIdeTabs`; add stable individual task slide IDs after legacy aggregate IDs, while `tasks` / `tasks-net` remain aliases for the first task. `Sekce` theory content must not consume the IDE component.

- [ ] Add failing tests: HTML5 `Sekce` has no tablist, textbox, or `Úkol` control; HTML/forms/network outlines expose each task by name; each task IDE has `index.html` or `terminál` plus `Řešení`; the network page has no legacy task sidebar.
- [ ] Run those focused tests and confirm RED.
- [ ] Split HTML and Forms task configurations into outline slides. Move the selected task brief from selector tabs to each slide. Convert `HtmlSections`, `FormsSections`, and network `SectionTabs` teaching pages into static theory/examples; remove embedded try/task panes. Represent the network terminal as a `terminál` file tab and its deterministic answer transcript as `Řešení`.
- [ ] Verify task deep links, W3C/local validation, terminal no-network policy, projector redaction, and focused E2E; commit `feat: move early lesson tasks into outline`.

### Task 3: Rework CSS, CSS II, and JavaScript task navigation/files/solutions

**Files:**
- Modify: `interactive_zwa_2_css_presentation.jsx`
- Modify: `interactive_zwa_5_css2_presentation.jsx`
- Modify: `interactive_zwa_5_javascript_presentation.jsx`
- Modify: `tests/e2e/lesson-workspace-runtime.spec.js`
- Modify: `tests/e2e/lesson-czech-ui.spec.js`

**Interfaces:** Each former step index maps to a stable outline slide ID. CSS/CSS II use `index.html` and `style.css`; JavaScript uses `main.js` and a DOM fixture tab only when its existing template has DOM. Every configuration contains a complete `solution` source.

- [ ] Add failing tests that assert CSS/CSS II/JS task outlines contain every current exercise, no `Kroky úlohy …` task tablist exists, only task slides render CodeMirror, and each task has its required file tabs plus final `Řešení`.
- [ ] Run the focused tests and confirm RED.
- [ ] Replace task-step state selectors with outline slide mapping. Preserve current exercise templates, iframe inspection, isolated JS sandbox, result semantics, and source reset behavior. Store each completed checked template as the corresponding read-only solution tab. Remove editors from CSS lesson theory/non-task slides.
- [ ] Verify runtime and isolation suites; commit `feat: move frontend tasks into outline`.

### Task 4: Rework lessons 07–08 solutions as IDE tabs

**Files:**
- Modify: `interactive_zwa_7_classes_ajax_presentation.jsx`
- Modify: `interactive_zwa_8_php_presentation.jsx`
- Modify: `src/components/lesson/ClickToRevealSolution.jsx`
- Modify: `tests/e2e/lesson-workspace-static.spec.js`

**Interfaces:** Existing outline IDs stay unchanged. Every prior `ClickToRevealSolution` body becomes a `solution` string/panel passed to `WorkspaceIdeTabs`; `ClickToRevealSolution` stays only for theory explanatory material, not task slides.

- [ ] Add failing tests that assert each lesson 07/08 task has one final solution tab, no `Řešení je zamčené` block appears outside IDE, and solution panels are read-only.
- [ ] Run targeted static workspace tests and confirm RED.
- [ ] Convert task examples and locked solution source into student files and solution tabs. Preserve static-check disclosure and task 2's AJAX/course fixtures without attempting network execution.
- [ ] Verify task routes and projector hiding; commit `feat: move classes and PHP solutions into IDE`.

### Task 5: Split and migrate aggregate PHP task lessons 09–12

**Files:**
- Modify: `interactive_zwa_9_forms_crud_presentation.jsx`
- Modify: `interactive_zwa_10_sessions_cookies_presentation.jsx`
- Modify: `interactive_zwa_11_files_json_presentation.jsx`
- Modify: `interactive_zwa_12_auth_presentation.jsx`
- Modify: `tests/e2e/lesson-workspace-static.spec.js`
- Create: `tests/e2e/lesson-reference-solutions.spec.js`

**Interfaces:** Preserve each existing `tasks` deep link as an alias to its first task and add one outline slide per existing task card/reveal. Each task has at least `task.php` and `Řešení`; add `index.html` only where its original task needs markup.

- [ ] Add failing tests that enumerate every existing task card title as an outline button, assert individual task URLs show one IDE solution tab, and assert no `ClickToRevealSolution` is above/below the active editor.
- [ ] Run targeted tests and confirm RED.
- [ ] Extract each existing locked solution into a complete read-only source tab; use existing examples to seed student drafts. Keep static checks and their transparent warning. Replace aggregate slide card lists with individual task slides.
- [ ] Verify PHP task routes, state reset, response at 320px, and projector redaction; commit `feat: split PHP tasks into outline entries`.

### Task 6: All-lesson regression and content completeness audit

**Files:**
- Modify: `tests/e2e/lesson-czech-ui.spec.js`
- Modify: `tests/e2e/navigation-accessibility.spec.js`
- Modify: `tests/e2e/presenter-mode.spec.js`
- Modify only source needed for a reproduced defect

**Interfaces:** All public lesson routes retain their prior deep-link aliases and any added individual task IDs. Every task adapter consumes `WorkspaceIdeTabs`.

- [ ] Write/extend a course matrix test over all individual task slides: one left outline, task zones, student tab(s), final solution tab, no solution outside IDE, catalogue link in student/presenter and absent in projector.
- [ ] Run it and confirm it catches at least one temporarily removed fixture assertion before final fixes.
- [ ] Repair only matrix-proven integration defects, including keyboard focus, duplicate navigation, course-home link, and projector filtering.
- [ ] Run `npm test`, `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm run build`, and `BASE_URL=http://127.0.0.1:3118 PORT=3118 npm run test:e2e`; commit `test: verify consistent lesson task IDEs`.
