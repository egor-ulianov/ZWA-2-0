# Elements of AI-Inspired Course Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the complete ZWA interface with a blue, editorial course experience inspired by Elements of AI, including twelve original lecture illustrations and explicit persistent dark mode, without reusing the current UI layer.

**Architecture:** Build a parallel `src/course-ui/` component tree with separate foundation, course, learning, exercise, presentation, and operations boundaries. Migrate routes in vertical slices while preserving existing behavior modules and security contracts, then delete every superseded `src/components/` UI and `portal-*` style after all routes have moved.

**Tech Stack:** Next.js 16.3.4 Pages Router, React 18.3.1, JavaScript/JSX, Tailwind CSS 3 plus new CSS Modules, CodeMirror 6, local SVG assets, Sharp, Node test runner, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-28-elements-of-ai-inspired-course-experience-design.md`

## Global Constraints

- Preserve Node.js `>=20 <21`, Next.js `16.3.4` Pages Router, React `18.3.1`, every public route, every known lesson deep link, and all current API/authentication behavior.
- Build new JSX and styling; do not restyle, wrap, or retain the existing `PortalFrame`, `LessonShell`, `SlideCard`, `LessonTaskWorkspace`, presenter/projector UI, teacher shells, or `portal-*` visual classes.
- Keep sandbox, CSP, origin/token validation, timeouts, static-check disclosure, and projector-private boundaries unchanged in strength.
- First visit is light. Only an explicit control may choose dark mode; persist exactly `zwa-theme=light|dark` in `localStorage`; ignore `prefers-color-scheme` for theme selection.
- Create twelve distinct local SVG lecture illustrations with no embedded text, raster payloads, gradients, copied Elements of AI assets, or remote runtime dependency.
- Preserve Czech curriculum copy and slide IDs. New shared UI copy is Czech except existing operational copy intentionally retained by current contracts.
- Support keyboard operation, visible focus, reduced motion, 320px layout, 200% zoom, and the 1280×720 projector contract.
- Keep `.env.local` and unrelated working-tree changes untouched.

## Review Focus

- Corrupt, absent, or throwing `localStorage` must yield a usable light theme; Task 1 pins this with unit and E2E tests.
- Missing artwork must render a deliberate color-field fallback without broken-image chrome; Tasks 2 and 3 pin this.
- Empty or malformed section lists and unknown deep links must resolve safely without trapping focus or emitting invalid progress; Tasks 4 and 6 pin this.
- Long Czech titles at 320px and 200% zoom must not create horizontal overflow or hide primary actions; Tasks 3, 6, and 15 pin this.
- Sandbox/static-check failures must remain inside verification and preserve the student draft; Tasks 5 and 6 pin this.

---

### Task 1: Explicit Theme and New Application Foundation

**Files:**
- Create: `src/course-ui/theme/theme.js`
- Create: `src/course-ui/theme/ThemeController.jsx`
- Create: `src/course-ui/theme/theme.module.css`
- Create: `src/course-ui/foundation/CourseApplication.jsx`
- Create: `src/course-ui/foundation/CourseMasthead.jsx`
- Create: `src/course-ui/foundation/foundation.module.css`
- Create: `styles/course-ui.css`
- Modify: `pages/_app.jsx`
- Modify: `pages/_document.jsx`
- Modify: `package.json`
- Modify: `package-lock.json`
- Test: `tests/unit/course-theme.test.js`
- Test: `tests/e2e/course-theme.spec.js`

**Interfaces:**
- Produces: `THEME_STORAGE_KEY = 'zwa-theme'`, `normalizeTheme(value) -> 'light'|'dark'`, `readStoredTheme(storage) -> 'light'|'dark'`, `persistTheme(storage, theme) -> boolean`, `applyDocumentTheme(theme, root) -> normalizedTheme`, and `<ThemeController />`.
- Produces: `<CourseApplication variant title children>` and `<CourseMasthead contextLabel outlineControl actions>` for all later surfaces.

- [ ] **Step 1: Write failing theme unit tests**

Assert exact normalization, storage objects whose `getItem` or `setItem` throws, corrupt values, `persistTheme` returning false without throwing, and `applyDocumentTheme` setting `data-theme` plus `colorScheme`.

- [ ] **Step 2: Run the unit test and verify the new module is missing**

Run: `node --test tests/unit/course-theme.test.js`

Expected: FAIL because `src/course-ui/theme/theme.js` does not exist.

- [ ] **Step 3: Implement the pure theme contract and global tokens**

Define light tokens including `#2856a6`, deep blue-black ink, warm paper, yellow, coral, sky, mint, and apricot; define independently tuned dark tokens. Remove no old tokens yet.

- [ ] **Step 4: Write the failing browser theme tests**

Cover a dark system preference still loading light, an explicit toggle writing `zwa-theme=dark`, reload restoring dark before content inspection, corrupt storage returning light, a 44px keyboard-operable toggle, descriptive document titles, and reduced-motion media removing non-essential transitions.

- [ ] **Step 5: Implement the early document bootstrap, bundled Manrope font, masthead, and controller**

Add `@fontsource-variable/manrope`, import its CSS and `styles/course-ui.css` only from `_app.jsx`, and add an inline `_document.jsx` bootstrap that reads only the approved storage values. No media-query theme selection.

- [ ] **Step 6: Run focused verification**

Run: `node --test tests/unit/course-theme.test.js && BASE_URL=http://127.0.0.1:3118 PORT=3118 npm run test:e2e -- tests/e2e/course-theme.spec.js`

Expected: all theme unit and browser tests PASS.

- [ ] **Step 7: Commit the foundation**

```bash
git add package.json package-lock.json pages/_app.jsx pages/_document.jsx styles/course-ui.css src/course-ui/foundation src/course-ui/theme tests/unit/course-theme.test.js tests/e2e/course-theme.spec.js
git commit -m "feat: add explicit course theme foundation"
```

### Task 2: Course Model and Twelve Original Lecture Illustrations

**Files:**
- Create: `src/course-ui/course/courseModel.js`
- Create: `src/course-ui/art/LectureIllustration.jsx`
- Create: `src/course-ui/art/art.module.css`
- Create: `public/course-art/lesson-01-html5.svg`
- Create: `public/course-art/lesson-02-forms.svg`
- Create: `public/course-art/lesson-03-network.svg`
- Create: `public/course-art/lesson-04-css.svg`
- Create: `public/course-art/lesson-05-css-ii.svg`
- Create: `public/course-art/lesson-06-javascript.svg`
- Create: `public/course-art/lesson-07-classes-ajax.svg`
- Create: `public/course-art/lesson-08-php.svg`
- Create: `public/course-art/lesson-09-forms-crud.svg`
- Create: `public/course-art/lesson-10-sessions-cookies.svg`
- Create: `public/course-art/lesson-11-files-json.svg`
- Create: `public/course-art/lesson-12-auth.svg`
- Create: `scripts/render-course-art.mjs`
- Modify: `src/config/lessons.js`
- Test: `tests/unit/course-model.test.js`
- Test: `tests/quality/course-art.test.mjs`

**Interfaces:**
- Produces: every lesson with `shortTitle`, `moduleId`, `focus`, and `artwork`.
- Produces: `COURSE_MODULES` and `getCourseModules(lessonList = lessons) -> Array<{id, number, title, color, lessons}>`.
- Produces: `<LectureIllustration lesson className priority />`, which uses `alt=""` and renders a color-field fallback after an image error.

- [ ] **Step 1: Write failing model and asset-quality tests**

Assert four modules in approved order, three lessons per module, twelve unique artwork paths, twelve distinct SVG file bodies, a shared `viewBox`, no `<text>`, no `data:image`, and no `linearGradient`/`radialGradient`.

- [ ] **Step 2: Run the tests and verify missing metadata/assets**

Run: `node --test tests/unit/course-model.test.js tests/quality/course-art.test.mjs`

Expected: FAIL for absent fields and artwork.

- [ ] **Step 3: Implement course metadata and the illustration renderer**

Keep `lessons` as route-order authority. Make `LectureIllustration` render fixed intrinsic dimensions and expose `data-artwork-fallback` when loading fails.

- [ ] **Step 4: Create all twelve original SVG scenes**

Follow the subject table and art rules in the spec exactly. Each file needs a genuinely different composition, not a recolor. Use the shared flat palette and keep all meaningful text in adjacent HTML.

- [ ] **Step 5: Add and run the Sharp contact-sheet renderer**

Run: `node scripts/render-course-art.mjs`

Expected: `.next/visual-review/course-art-contact-sheet.png` contains twelve labeled source filenames and twelve visible compositions.

- [ ] **Step 6: Inspect the contact sheet at full resolution and correct inconsistent crops**

Check consistent artboard ratio, line weight, detail density, negative space, light/dark legibility, and recognizability at card size.

- [ ] **Step 7: Run asset verification**

Run: `node --test tests/unit/course-model.test.js tests/quality/course-art.test.mjs`

Expected: all tests PASS.

- [ ] **Step 8: Commit the course model and artwork**

```bash
git add src/config/lessons.js src/course-ui/course src/course-ui/art public/course-art scripts/render-course-art.mjs tests/unit/course-model.test.js tests/quality/course-art.test.mjs
git commit -m "feat: add original lecture artwork and course model"
```

### Task 3: Rebuilt Course Overview

**Files:**
- Create: `src/course-ui/course/CourseOverview.jsx`
- Create: `src/course-ui/course/ModuleCard.jsx`
- Create: `src/course-ui/course/LessonRow.jsx`
- Create: `src/course-ui/course/course.module.css`
- Modify: `pages/index.jsx`
- Test: `tests/e2e/course-overview.spec.js`
- Modify: `tests/e2e/navigation-accessibility.spec.js`

**Interfaces:**
- Consumes: `CourseApplication`, `CourseMasthead`, `getCourseModules()`, and `LectureIllustration`.
- Produces: `<CourseOverview lessons />`, `<ModuleCard module />`, and `<LessonRow lesson />`.

- [ ] **Step 1: Write failing overview tests**

Assert one main landmark, four module articles, three ordered lesson links per module, exact legacy hrefs, no fabricated progress, fallback artwork behavior, 320px no-overflow, and a long title remaining visible at 200% zoom.

- [ ] **Step 2: Run the overview tests and verify they fail on the old roadmap**

Run: `BASE_URL=http://127.0.0.1:3118 PORT=3118 npm run test:e2e -- tests/e2e/course-overview.spec.js`

Expected: FAIL because the old twelve-card roadmap is still rendered.

- [ ] **Step 3: Implement the blue course canvas and four module cards**

Use a two-by-two desktop grid and one column on narrow screens. Make each lesson row the only link for that lesson; do not nest links or buttons.

- [ ] **Step 4: Update the existing navigation test to the new semantic contract**

Keep route and keyboard assertions. Replace only old visual-structure assertions with module/lesson-row assertions.

- [ ] **Step 5: Run focused overview and navigation verification**

Run: `BASE_URL=http://127.0.0.1:3118 PORT=3118 npm run test:e2e -- tests/e2e/course-overview.spec.js tests/e2e/navigation-accessibility.spec.js`

Expected: overview cases and catalogue navigation PASS.

- [ ] **Step 6: Commit the overview**

```bash
git add pages/index.jsx src/course-ui/course tests/e2e/course-overview.spec.js tests/e2e/navigation-accessibility.spec.js
git commit -m "feat: rebuild the course overview"
```

### Task 4: New Learning and Presentation Architecture

**Files:**
- Create: `src/course-ui/learning/navigation.js`
- Create: `src/course-ui/learning/useLearningNavigation.js`
- Create: `src/course-ui/learning/LearningContext.jsx`
- Create: `src/course-ui/learning/LearningExperience.jsx`
- Create: `src/course-ui/learning/CourseProgressStrip.jsx`
- Create: `src/course-ui/learning/OutlineDrawer.jsx`
- Create: `src/course-ui/learning/LessonHero.jsx`
- Create: `src/course-ui/learning/LearningSection.jsx`
- Create: `src/course-ui/learning/LessonPager.jsx`
- Create: `src/course-ui/learning/learning.module.css`
- Create: `src/course-ui/presentation/presenterChannel.js`
- Create: `src/course-ui/presentation/projectorContent.js`
- Create: `src/course-ui/presentation/PresenterExperience.jsx`
- Create: `src/course-ui/presentation/ProjectorExperience.jsx`
- Create: `src/course-ui/presentation/presentation.module.css`
- Test: `tests/unit/learning-navigation.test.js`
- Test: `tests/unit/learning-experience.test.js`
- Test: `tests/unit/presenter-experience.test.js`
- Test: `tests/unit/projector-content-v2.test.js`

**Interfaces:**
- Produces: `resolveSectionId(sections, location)`, `buildSectionUrl(location, sectionId)`, `resolveExperienceMode(location)`, and `useLearningNavigation(sections) -> {activeSection, setActiveSection}`.
- Produces: `<LearningExperience lesson sections activeSection onChange title subtitle objective footerText mode>` and `<LearningSection section idPrefix children>`.
- Produces: `<PresenterExperience ...>` and `<ProjectorExperience ...>` using the moved pure channel/projection behavior.

- [ ] **Step 1: Write failing navigation tests**

Cover empty/malformed arrays, query/hash selection, unknown IDs, URL normalization with unrelated query parameters preserved, mode validation, and editable-target keyboard exclusion.

- [ ] **Step 2: Write failing static-render tests for the new component contracts**

Use `renderToStaticMarkup` to assert the new masthead/progress/hero/article/pager hierarchy, Czech labels, one main landmark per mode, and projector-private exclusion.

- [ ] **Step 3: Run the unit tests and verify the modules are absent**

Run: `node --test tests/unit/learning-navigation.test.js tests/unit/learning-experience.test.js tests/unit/presenter-experience.test.js tests/unit/projector-content-v2.test.js`

Expected: FAIL for missing modules.

- [ ] **Step 4: Implement navigation, context, student learning, drawer, pager, presenter, and projector components**

Drawer requirements: focus first meaningful control on open, trap Tab while modal, close on Escape, restore invoking focus, and call `onChange` then close after section selection.

- [ ] **Step 5: Run the learning/presentation unit suite**

Run: `node --test tests/unit/learning-navigation.test.js tests/unit/learning-experience.test.js tests/unit/presenter-experience.test.js tests/unit/projector-content-v2.test.js`

Expected: all four files PASS with no old component imports.

- [ ] **Step 6: Commit the new architecture**

```bash
git add src/course-ui/learning src/course-ui/presentation tests/unit/learning-navigation.test.js tests/unit/learning-experience.test.js tests/unit/presenter-experience.test.js tests/unit/projector-content-v2.test.js
git commit -m "feat: add new learning and presentation architecture"
```

### Task 5: New Editorial, Exercise, Editor, Quiz, and Sandbox UI

**Files:**
- Create: `src/course-ui/content/InlineCode.jsx`
- Create: `src/course-ui/content/EditorialCallout.jsx`
- Create: `src/course-ui/content/EditorialCode.jsx`
- Create: `src/course-ui/content/content.module.css`
- Create: `src/course-ui/exercises/ExerciseStage.jsx`
- Create: `src/course-ui/exercises/StudioEditor.jsx`
- Create: `src/course-ui/exercises/StudioTabs.jsx`
- Create: `src/course-ui/exercises/KnowledgeCheck.jsx`
- Create: `src/course-ui/exercises/exercise.module.css`
- Create: `src/course-ui/exercises/runtime/SandboxFrame.jsx`
- Create: `src/course-ui/exercises/runtime/JavaScriptRunner.jsx`
- Create: `src/course-ui/exercises/runtime/documents.js`
- Create: `src/course-ui/exercises/runtime/protocol.js`
- Create: `src/course-ui/exercises/runtime/validators.js`
- Create: `src/course-ui/exercises/behavior/staticTaskChecks.js`
- Create: `src/course-ui/exercises/behavior/testDefinitions.js`
- Create: `src/course-ui/exercises/behavior/testRunner.js`
- Test: `tests/unit/course-editor.test.js`
- Test: `tests/unit/exercise-stage.test.js`
- Modify: `tests/playground-isolation.test.js`

**Interfaces:**
- Produces: `<EditorialCode children>`, `<EditorialCallout tone title children>`, and `<InlineCode children>`.
- Produces: `<StudioEditor value onChange language label minHeight readOnly>`, `<StudioTabs files solution activeFileId onActiveFileChange>`, and `<KnowledgeCheck title subtitle questions visual resultMessage resources>`.
- Produces: `<ExerciseStage brief studio preview verification solution privateMarker>` with named regions `Zadání`, `IDE`, `Náhled`, and `Ověření`.
- Produces: sandbox runtime APIs behaviorally equivalent to the current protocol, documents, validators, and 1500ms JavaScript timeout.

- [ ] **Step 1: Write failing editor, stage, and runtime tests**

Assert language support including PHP and shell, read-only solutions, roving tab keyboard behavior, named exercise regions, result states not relying on color, unchanged sandbox policies, token/source-window validation, timeout handling, and draft preservation after failed verification.

- [ ] **Step 2: Run focused tests and verify missing modules**

Run: `node --test tests/unit/course-editor.test.js tests/unit/exercise-stage.test.js tests/playground-isolation.test.js`

Expected: FAIL because the new modules do not exist.

- [ ] **Step 3: Implement editorial and exercise components with new markup and CSS**

Use CodeMirror directly in `StudioEditor`; do not import `SyntaxCodeEditor`. Use a continuous exercise stage without nested generic panels.

- [ ] **Step 4: Copy then independently verify pure sandbox/check behavior in the new boundary**

Preserve security constants and algorithms exactly unless a new test proves a necessary correction. Do not loosen policies to simplify styling.

- [ ] **Step 5: Run the focused tests plus the current security regression suite**

Run: `node --test tests/unit/course-editor.test.js tests/unit/exercise-stage.test.js tests/playground-isolation.test.js tests/unit/static-task-checks.test.js tests/unit/exercise-test-runner.test.js`

Expected: all new and existing behavior tests PASS.

- [ ] **Step 6: Commit the new content and exercise system**

```bash
git add src/course-ui/content src/course-ui/exercises tests/unit/course-editor.test.js tests/unit/exercise-stage.test.js tests/playground-isolation.test.js
git commit -m "feat: add new editorial and exercise system"
```

### Task 6: HTML5 End-to-End Vertical Slice

**Files:**
- Modify: `interactive_zwa_1_html5_presentation.jsx`
- Modify: `tests/e2e/lesson-theory-and-outline.spec.js`
- Modify: `tests/e2e/lesson-workspace-runtime.spec.js`
- Modify: `tests/e2e/navigation-accessibility.spec.js`
- Modify: `tests/e2e/presenter-mode.spec.js`
- Modify: `tests/e2e/portal-responsive.spec.js`
- Create: `tests/e2e/course-learning-experience.spec.js`

**Interfaces:**
- Consumes: all Task 4 and Task 5 public interfaces.
- Produces: the reference migration pattern for all remaining presentation files.

- [ ] **Step 1: Write failing integrated HTML5 tests**

Assert lecture artwork, progress strip, drawer focus lifecycle, previous/next navigation, valid and invalid deep links, one main landmark, new exercise regions, solution read-only behavior, student/presenter/projector branches, and no old `portal-*` elements.

- [ ] **Step 2: Run the focused browser tests and confirm failure on the old lesson**

Run: `BASE_URL=http://127.0.0.1:3118 PORT=3118 npm run test:e2e -- tests/e2e/course-learning-experience.spec.js`

Expected: FAIL on absent new experience markers.

- [ ] **Step 3: Migrate HTML5 to the new architecture and reorganize its inner content**

Replace old shell/card/workspace/editor/code imports and remove rounded panel compositions from the lesson body. Preserve all HTML task providers, validators, reference solutions, IDs, and runtime behavior.

- [ ] **Step 4: Update existing tests to the new semantic contract without weakening behavior assertions**

Keep deep-link, focus, validation, sandbox, and projector privacy coverage. Remove only assertions tied to deleted old markup.

- [ ] **Step 5: Run integrated HTML5 verification at desktop and 320px**

Run: `BASE_URL=http://127.0.0.1:3118 PORT=3118 npm run test:e2e -- tests/e2e/course-learning-experience.spec.js tests/e2e/lesson-theory-and-outline.spec.js tests/e2e/lesson-workspace-runtime.spec.js tests/e2e/navigation-accessibility.spec.js tests/e2e/presenter-mode.spec.js tests/e2e/portal-responsive.spec.js`

Expected: all selected tests PASS.

- [ ] **Step 6: Inspect HTML5 in light, dark, mobile, presenter, and projector modes**

Verify no old UI fragments remain in the vertical slice before treating it as the migration template.

- [ ] **Step 7: Commit the vertical slice**

```bash
git add interactive_zwa_1_html5_presentation.jsx tests/e2e/lesson-theory-and-outline.spec.js tests/e2e/lesson-workspace-runtime.spec.js tests/e2e/navigation-accessibility.spec.js tests/e2e/course-learning-experience.spec.js tests/e2e/presenter-mode.spec.js tests/e2e/portal-responsive.spec.js
git commit -m "feat: migrate HTML5 to the new course experience"
```

### Task 7: Forms and Network Lesson Migration

**Files:**
- Modify: `interactive_zwa_2_forms_presentation.jsx`
- Modify: `interactive_zwa_1_web_presentation_with_simulated_linux_cli.jsx`
- Modify: `tests/e2e/lesson-redesign.spec.js`
- Modify: `tests/e2e/lesson-workspace-runtime.spec.js`
- Modify: `tests/e2e/lesson-czech-ui.spec.js`

**Interfaces:**
- Consumes: the Task 6 migration pattern and all new learning/exercise primitives.
- Produces: migrated lessons 2 and 3 with existing form validation and deterministic terminal behavior.

- [ ] **Step 1: Add failing assertions for new artwork, learning layout, and exercise stages on lessons 2 and 3**
- [ ] **Step 2: Run the focused tests and confirm both lessons still expose old UI**

Run: `BASE_URL=http://127.0.0.1:3118 PORT=3118 npm run test:e2e -- tests/e2e/lesson-redesign.spec.js tests/e2e/lesson-workspace-runtime.spec.js tests/e2e/lesson-czech-ui.spec.js tests/e2e/playground-isolation.spec.js`

Expected: new experience assertions FAIL while existing runtime protection assertions still PASS.

- [ ] **Step 3: Migrate both files and replace inner legacy panels with editorial primitives**
- [ ] **Step 4: Run `BASE_URL=http://127.0.0.1:3118 PORT=3118 npm run test:e2e -- tests/e2e/lesson-redesign.spec.js tests/e2e/lesson-workspace-runtime.spec.js tests/e2e/lesson-czech-ui.spec.js tests/e2e/playground-isolation.spec.js`**

Expected: all selected cases PASS, including no real network access from the terminal.

- [ ] **Step 5: Commit lessons 2 and 3**

```bash
git add interactive_zwa_2_forms_presentation.jsx interactive_zwa_1_web_presentation_with_simulated_linux_cli.jsx tests/e2e/lesson-redesign.spec.js tests/e2e/lesson-workspace-runtime.spec.js tests/e2e/lesson-czech-ui.spec.js tests/e2e/playground-isolation.spec.js
git commit -m "feat: migrate forms and network lessons"
```

### Task 8: CSS, CSS II, and JavaScript Lesson Migration

**Files:**
- Modify: `interactive_zwa_2_css_presentation.jsx`
- Modify: `interactive_zwa_5_css2_presentation.jsx`
- Modify: `interactive_zwa_5_javascript_presentation.jsx`
- Modify: `tests/e2e/lesson-redesign.spec.js`
- Modify: `tests/e2e/lesson-workspace-runtime.spec.js`
- Modify: `tests/e2e/workspace-responsive.spec.js`
- Modify: `tests/e2e/playground-isolation.spec.js`

**Interfaces:**
- Produces: migrated lessons 4–6 with new knowledge checks, editors, previews, and runtime result presentation.

- [ ] **Step 1: Add failing new-UI assertions for lessons 4–6 and their quizzes**
- [ ] **Step 2: Run the group tests and confirm failure on old components**

Run: `BASE_URL=http://127.0.0.1:3118 PORT=3118 npm run test:e2e -- tests/e2e/lesson-redesign.spec.js tests/e2e/lesson-workspace-runtime.spec.js tests/e2e/workspace-responsive.spec.js tests/e2e/playground-isolation.spec.js`

Expected: new experience assertions FAIL on lessons 4–6.

- [ ] **Step 3: Migrate all three presentations, including quiz visuals and task studios**
- [ ] **Step 4: Verify static CSS and JavaScript runtime isolation plus 320px stacking**

Run: `BASE_URL=http://127.0.0.1:3118 PORT=3118 npm run test:e2e -- tests/e2e/lesson-redesign.spec.js tests/e2e/lesson-workspace-runtime.spec.js tests/e2e/workspace-responsive.spec.js tests/e2e/playground-isolation.spec.js`

Expected: all selected cases PASS.

- [ ] **Step 5: Commit lessons 4–6**

```bash
git add interactive_zwa_2_css_presentation.jsx interactive_zwa_5_css2_presentation.jsx interactive_zwa_5_javascript_presentation.jsx tests/e2e/lesson-redesign.spec.js tests/e2e/lesson-workspace-runtime.spec.js tests/e2e/workspace-responsive.spec.js tests/e2e/playground-isolation.spec.js
git commit -m "feat: migrate CSS and JavaScript lessons"
```

### Task 9: Classes/AJAX, PHP, and CRUD Lesson Migration

**Files:**
- Modify: `interactive_zwa_7_classes_ajax_presentation.jsx`
- Modify: `interactive_zwa_8_php_presentation.jsx`
- Modify: `interactive_zwa_9_forms_crud_presentation.jsx`
- Modify: `tests/e2e/lesson-workspace-static.spec.js`
- Modify: `tests/e2e/lesson-theory-and-outline.spec.js`
- Modify: `tests/e2e/lesson-redesign.spec.js`

**Interfaces:**
- Produces: migrated lessons 7–9 with truthful static verification and reorganized editorial theory.

- [ ] **Step 1: Add failing new-UI assertions for lessons 7–9**
- [ ] **Step 2: Run focused static/theory tests and confirm failure**

Run: `BASE_URL=http://127.0.0.1:3118 PORT=3118 npm run test:e2e -- tests/e2e/lesson-workspace-static.spec.js tests/e2e/lesson-theory-and-outline.spec.js tests/e2e/lesson-redesign.spec.js`

Expected: new experience assertions FAIL on lessons 7–9.

- [ ] **Step 3: Migrate all three presentations and remove old boxes, cards, editors, and quiz markup**
- [ ] **Step 4: Run `BASE_URL=http://127.0.0.1:3118 PORT=3118 npm run test:e2e -- tests/e2e/lesson-workspace-static.spec.js tests/e2e/lesson-theory-and-outline.spec.js tests/e2e/lesson-redesign.spec.js`**

Expected: all selected cases PASS and static checks remain explicitly labeled.

- [ ] **Step 5: Commit lessons 7–9**

```bash
git add interactive_zwa_7_classes_ajax_presentation.jsx interactive_zwa_8_php_presentation.jsx interactive_zwa_9_forms_crud_presentation.jsx tests/e2e/lesson-workspace-static.spec.js tests/e2e/lesson-theory-and-outline.spec.js tests/e2e/lesson-redesign.spec.js
git commit -m "feat: migrate server application lessons"
```

### Task 10: Sessions, Files/JSON, and Authentication Lesson Migration

**Files:**
- Modify: `interactive_zwa_10_sessions_cookies_presentation.jsx`
- Modify: `interactive_zwa_11_files_json_presentation.jsx`
- Modify: `interactive_zwa_12_auth_presentation.jsx`
- Modify: `tests/e2e/static-lessons-10-12-consistency.spec.js`
- Modify: `tests/e2e/lesson-workspace-static.spec.js`
- Modify: `tests/e2e/lesson-theory-and-outline.spec.js`

**Interfaces:**
- Produces: migrated lessons 10–12 and completes all twelve learner routes.

- [ ] **Step 1: Add failing new-UI and artwork assertions for lessons 10–12**
- [ ] **Step 2: Run focused tests and confirm failure**

Run: `BASE_URL=http://127.0.0.1:3118 PORT=3118 npm run test:e2e -- tests/e2e/static-lessons-10-12-consistency.spec.js tests/e2e/lesson-workspace-static.spec.js tests/e2e/lesson-theory-and-outline.spec.js`

Expected: new experience assertions FAIL on lessons 10–12.

- [ ] **Step 3: Migrate all three presentations and preserve every security teaching example and static check**
- [ ] **Step 4: Run `BASE_URL=http://127.0.0.1:3118 PORT=3118 npm run test:e2e -- tests/e2e/static-lessons-10-12-consistency.spec.js tests/e2e/lesson-workspace-static.spec.js tests/e2e/lesson-theory-and-outline.spec.js`**

Expected: all selected cases PASS.

- [ ] **Step 5: Run every public lesson route once and verify no old shell import remains**

Run: `rg -n "src/components/(lesson|exercises|playground)" interactive_zwa_*_presentation.jsx`

Expected: no matches.

- [ ] **Step 6: Commit lessons 10–12**

```bash
git add interactive_zwa_10_sessions_cookies_presentation.jsx interactive_zwa_11_files_json_presentation.jsx interactive_zwa_12_auth_presentation.jsx tests/e2e/static-lessons-10-12-consistency.spec.js tests/e2e/lesson-workspace-static.spec.js tests/e2e/lesson-theory-and-outline.spec.js
git commit -m "feat: migrate state and security lessons"
```

### Task 11: Student Access and Progress Rebuild

**Files:**
- Create: `src/course-ui/operations/OperationsApplication.jsx`
- Create: `src/course-ui/operations/StudentAccess.jsx`
- Create: `src/course-ui/operations/StudentProgress.jsx`
- Create: `src/course-ui/operations/operations.module.css`
- Modify: `pages/student/index.jsx`
- Modify: `pages/student/progress.jsx`
- Modify: `tests/e2e/student-workflow.spec.js`
- Modify: `tests/e2e/workspace-responsive.spec.js`

**Interfaces:**
- Produces: `<OperationsApplication title contextLabel children>` and the two student views; consumes existing API helpers unchanged.

- [ ] **Step 1: Add failing tests for the new sign-in composition and editorial progress record**

Keep keyboard path, unauthorized redirect, retry, least-privilege output, loading/error/empty states, explicit theme, and 320px no-overflow assertions.

- [ ] **Step 2: Run student tests and confirm failure on old portal markup**

Run: `BASE_URL=http://127.0.0.1:3118 PORT=3118 npm run test:e2e -- tests/e2e/student-workflow.spec.js tests/e2e/workspace-responsive.spec.js`

Expected: new operations structure assertions FAIL while existing API fixtures remain valid.

- [ ] **Step 3: Implement the new student surfaces without changing API calls or response handling**
- [ ] **Step 4: Run `BASE_URL=http://127.0.0.1:3118 PORT=3118 npm run test:e2e -- tests/e2e/student-workflow.spec.js tests/e2e/workspace-responsive.spec.js`**

Expected: all student cases PASS.

- [ ] **Step 5: Commit the student rebuild**

```bash
git add pages/student/index.jsx pages/student/progress.jsx src/course-ui/operations/OperationsApplication.jsx src/course-ui/operations/StudentAccess.jsx src/course-ui/operations/StudentProgress.jsx src/course-ui/operations/operations.module.css tests/e2e/student-workflow.spec.js tests/e2e/workspace-responsive.spec.js
git commit -m "feat: rebuild student access and progress"
```

### Task 12: Teacher Workspace Rebuild

**Files:**
- Create: `src/course-ui/operations/TeacherWorkspace.jsx`
- Create: `src/course-ui/operations/StudentRecord.jsx`
- Create: `src/course-ui/operations/ProgressEditor.jsx`
- Modify: `pages/teacher/index.jsx`
- Modify: `tests/e2e/teacher-workflow.spec.js`
- Modify: `tests/e2e/teacher-normalization.spec.js`
- Modify: `tests/unit/ui-state.test.js`

**Interfaces:**
- Produces: teacher normalization and student-record UI under `OperationsApplication`; consumes existing API queue, preview/apply, and validation helpers.

- [ ] **Step 1: Add failing tests for new teacher structure, operational states, and unchanged safeguards**

Cover authentication, dry-run before apply, run-ID requirement, stale/failed patch retention, final-points validation, mailto restrictions, and 320px access to primary actions.

- [ ] **Step 2: Run focused teacher tests and confirm failure on old UI**

Run: `node --test tests/unit/ui-state.test.js && BASE_URL=http://127.0.0.1:3118 PORT=3118 npm run test:e2e -- tests/e2e/teacher-workflow.spec.js tests/e2e/teacher-normalization.spec.js`

Expected: new structure assertions FAIL and existing behavior tests remain diagnostic.

- [ ] **Step 3: Implement the teacher components and move visual responsibility out of old teacher components**
- [ ] **Step 4: Run `node --test tests/unit/ui-state.test.js && BASE_URL=http://127.0.0.1:3118 PORT=3118 npm run test:e2e -- tests/e2e/teacher-workflow.spec.js tests/e2e/teacher-normalization.spec.js`**

Expected: all selected tests PASS.

- [ ] **Step 5: Commit the teacher rebuild**

```bash
git add pages/teacher/index.jsx src/course-ui/operations/TeacherWorkspace.jsx src/course-ui/operations/StudentRecord.jsx src/course-ui/operations/ProgressEditor.jsx src/course-ui/operations/operations.module.css tests/e2e/teacher-workflow.spec.js tests/e2e/teacher-normalization.spec.js tests/unit/ui-state.test.js
git commit -m "feat: rebuild the teacher workspace"
```

### Task 13: Attendance Workspace Rebuild

**Files:**
- Create: `src/course-ui/operations/AttendanceWorkspace.jsx`
- Create: `src/course-ui/operations/AttendanceStudentRow.jsx`
- Create: `src/course-ui/operations/AttendanceImportPreview.jsx`
- Modify: `pages/attendance.jsx`
- Modify: `tests/e2e/teacher-workflow.spec.js`
- Modify: `tests/e2e/workspace-responsive.spec.js`
- Modify: `tests/unit/ui-state.test.js`

**Interfaces:**
- Produces: new attendance composition preserving the existing serialized-save, ETag conflict, CSV limit, preview/cancel/apply, bulk mark, and history behavior.

- [ ] **Step 1: Add failing tests for new attendance structure and all destructive-action previews**

Retain explicit import preview/cancel, file read failure cleanup, stale revision handling, keyboard checkboxes, bulk actions, and mobile access.

- [ ] **Step 2: Run focused attendance tests and confirm failure**

Run: `node --test tests/unit/ui-state.test.js && BASE_URL=http://127.0.0.1:3118 PORT=3118 npm run test:e2e -- tests/e2e/teacher-workflow.spec.js tests/e2e/workspace-responsive.spec.js`

Expected: new attendance structure assertions FAIL while existing queue/import behavior remains covered.

- [ ] **Step 3: Implement the new attendance components without changing API payloads or queue semantics**
- [ ] **Step 4: Run `node --test tests/unit/ui-state.test.js && BASE_URL=http://127.0.0.1:3118 PORT=3118 npm run test:e2e -- tests/e2e/teacher-workflow.spec.js tests/e2e/workspace-responsive.spec.js`**

Expected: all selected attendance cases PASS.

- [ ] **Step 5: Commit the attendance rebuild**

```bash
git add pages/attendance.jsx src/course-ui/operations/AttendanceWorkspace.jsx src/course-ui/operations/AttendanceStudentRow.jsx src/course-ui/operations/AttendanceImportPreview.jsx src/course-ui/operations/operations.module.css tests/e2e/teacher-workflow.spec.js tests/e2e/workspace-responsive.spec.js tests/unit/ui-state.test.js
git commit -m "feat: rebuild the attendance workspace"
```

### Task 14: Remove the Superseded UI Layer

**Files:**
- Delete: `src/components/portal/`
- Delete: `src/components/lesson/`
- Delete: `src/components/exercises/`
- Delete: `src/components/playground/`
- Delete: `src/components/teacher/`
- Modify: `styles/globals.css`
- Modify: `tests/unit/course-roadmap.test.js`
- Replace: `tests/unit/lesson-shell.test.js`
- Replace: `tests/unit/portal-frame.test.js`
- Replace: `tests/unit/syntax-code-editor.test.js`
- Replace: `tests/unit/teacher-workspace-shell.test.js`
- Replace: `tests/unit/presenter-channel.test.js`
- Replace: `tests/unit/projector-content.test.js`
- Modify: `tests/unit/final-lesson-gaps.test.js`
- Modify: `tests/unit/lessons.test.js`
- Modify: `tests/unit/exercise-test-runner.test.js`
- Modify: `tests/unit/static-task-checks.test.js`
- Modify: `tests/playground-isolation.test.js`
- Create: `tests/quality/course-ui-clean-break.test.mjs`

**Interfaces:**
- Consumes: all new modules and completed route migrations.
- Produces: one active UI architecture with no compatibility wrapper or old visual imports.

- [ ] **Step 1: Write the failing clean-break quality test**

Scan active `.js/.jsx/.css` source for imports from `src/components/(portal|lesson|exercises|playground|teacher)`, `portal-page|portal-header|portal-panel|portal-action|portal-kicker`, automatic theme media queries, and old component names. Assert all are absent after cleanup.

- [ ] **Step 2: Run the quality test and verify it reports every remaining old reference**

Run: `node --test tests/quality/course-ui-clean-break.test.mjs`

Expected: FAIL with a finite list of remaining references.

- [ ] **Step 3: Move any still-required pure behavior, update imports, delete old directories, and remove old CSS tokens/rules**

Do not delete behavioral coverage. Replace source-reading tests with tests of the new public contracts.

- [ ] **Step 4: Run repository scans**

Run: `rg -n "src/components/(portal|lesson|exercises|playground|teacher)|portal-(page|header|panel|action|kicker)|prefers-color-scheme:\s*dark" pages src styles interactive_zwa_*_presentation.jsx tests`

Expected: no active-source matches; test fixture strings may appear only inside the clean-break test's forbidden-pattern list.

- [ ] **Step 5: Run unit, quality, lint, format, and type verification**

Run: `npm test && npm run lint && npm run format:check && npm run typecheck`

Expected: all commands exit 0.

- [ ] **Step 6: Commit cleanup**

```bash
git add -A src/components styles/globals.css tests/unit/course-roadmap.test.js tests/unit/lesson-shell.test.js tests/unit/portal-frame.test.js tests/unit/syntax-code-editor.test.js tests/unit/teacher-workspace-shell.test.js tests/unit/presenter-channel.test.js tests/unit/projector-content.test.js tests/unit/final-lesson-gaps.test.js tests/unit/lessons.test.js tests/unit/exercise-test-runner.test.js tests/unit/static-task-checks.test.js tests/playground-isolation.test.js tests/quality/course-ui-clean-break.test.mjs
git commit -m "refactor: remove the superseded course UI"
```

### Task 15: Visual Acceptance, Full Regression, and Delivery Evidence

**Files:**
- Create: `tests/e2e/course-visual-acceptance.spec.js`
- Create: `docs/verification/2026-09-28-course-experience-visual-qa.md`
- Modify: `tests/e2e/portal-responsive.spec.js`
- Modify: `tests/e2e/workspace-responsive.spec.js`

**Interfaces:**
- Produces: deterministic screenshots under `.next/visual-review/` and a committed inspection record covering every required surface and all twelve illustrations.

- [ ] **Step 1: Write the visual-capture test matrix**

Capture overview desktop light/dark/mobile; theory desktop light/dark/mobile; exercise desktop/mobile; quiz unanswered/answered; student access/progress; teacher; attendance; presenter; projector; and all twelve card/hero artwork crops. Use deterministic network fixtures and fixed viewports.

- [ ] **Step 2: Run responsive and visual capture tests**

Run: `BASE_URL=http://127.0.0.1:3118 PORT=3118 npm run test:e2e -- tests/e2e/course-visual-acceptance.spec.js tests/e2e/portal-responsive.spec.js tests/e2e/workspace-responsive.spec.js`

Expected: all cases PASS and the screenshot matrix exists under `.next/visual-review/`.

- [ ] **Step 3: Inspect every screenshot and record evidence**

For each file record PASS/FAIL for hierarchy, spacing, typography, overflow, illustration crop, theme consistency, focus visibility, and absence of the retired panel language. Fix any failure before proceeding; regenerate only after a code change.

- [ ] **Step 4: Run the complete project quality gate**

Run: `npm run quality`

Expected: unit, API, playground, quality, security scan, audit, health, Docker, build, and full E2E gates all exit 0.

- [ ] **Step 5: Re-run clean-break and artwork checks after the full build**

Run: `node --test tests/quality/course-ui-clean-break.test.mjs tests/quality/course-art.test.mjs`

Expected: both PASS; twelve distinct artwork assets and zero old UI references.

- [ ] **Step 6: Commit visual acceptance evidence**

```bash
git add tests/e2e/course-visual-acceptance.spec.js tests/e2e/portal-responsive.spec.js tests/e2e/workspace-responsive.spec.js docs/verification/2026-09-28-course-experience-visual-qa.md
git commit -m "test: verify the rebuilt course experience"
```

- [ ] **Step 7: Apply the verification-before-completion checklist**

Report exact command outcomes, test counts, screenshot count, any environment-only boundary, and the final clean working-tree status without claiming completion from partial evidence.
