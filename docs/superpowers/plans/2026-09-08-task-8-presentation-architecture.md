# Task 8 Presentation Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralize lesson metadata and shared presentation UI, add accessible resumable navigation, and modernize scoped risky lesson examples without touching playground-owned files.

**Architecture:** Keep the existing Next.js Pages Router and dynamic route wrappers. Add a metadata-only lesson catalog and shared React presentation primitives, then migrate only the actual non-playground lesson modules to the common shell and navigation hook.

**Tech Stack:** Next.js Pages Router, React 18, Tailwind CSS, Node `node:test`, CommonJS-compatible metadata/helpers, JSX presentation modules.

**Spec:** `docs/superpowers/specs/2026-09-08-task-8-presentation-architecture-design.md`

## Global Constraints

- Standardize on the Next.js Pages Router; the checked-in Vite entrypoint is legacy and is not used by `npm run dev`, `npm run build`, or `npm run start`.
- Do not change lesson content or grading policy without an explicit instructor decision.
- Preserve existing public lesson URLs while the canonical lesson catalog is introduced.
- Student-edited HTML, CSS, and JavaScript must execute only in a sandboxed origin isolated from the host page.
- The five playground lesson files and `src/components/playground/` are owned by another workstream and must not be modified.
- Do not modify package metadata, APIs/server/auth, teacher/student UI, grading, or unrelated tests.

## File and Responsibility Map

- Create `src/config/lessons.js` for the ordered route catalog and lookup helpers.
- Create `src/components/lesson/classNames.js`, `Code.jsx`, `InfoBox.jsx`, `ClickToRevealSolution.jsx`, `SlideCard.jsx`, `SlideNavigation.jsx`, and `LessonShell.jsx` for shared presentation behavior.
- Modify `pages/index.jsx` to render the catalog; leave existing route wrappers unchanged unless a catalog contract check identifies a required non-behavioral adjustment.
- Modify only the actual non-playground lesson modules: `interactive_zwa_1_web_presentation_with_simulated_linux_cli.jsx`, `interactive_zwa_7_classes_ajax_presentation.jsx`, `interactive_zwa_8_php_presentation.jsx`, `interactive_zwa_9_forms_crud_presentation.jsx`, `interactive_zwa_10_sessions_cookies_presentation.jsx`, `interactive_zwa_11_files_json_presentation.jsx`, and `interactive_zwa_12_auth_presentation.jsx`.
- Create `tests/unit/lessons.test.js` and `tests/e2e/navigation-accessibility.spec.js`; leave existing playground tests unchanged.

### Task 1: Add red catalog and accessibility checks

**Files:**
- Create: `tests/unit/lessons.test.js`
- Create: `tests/e2e/navigation-accessibility.spec.js`

**Interfaces:** Tests will consume `src/config/lessons.js`, `getLessonByNumber`, `getLessonBySlug`, and source-level shared primitive contracts once those modules exist.

- [ ] **Step 1: Write catalog contract tests**

Assert that the catalog has twelve entries, unique numbers/slugs/hrefs/component keys, numbers 1–12 in order, exact preservation of the twelve public lesson paths, and the network entry uses `/interactive-zwa-1/`. Assert unknown lookup values return `undefined`.

- [ ] **Step 2: Write deep-link and accessibility source checks**

Read `LessonShell.jsx`, `SlideNavigation.jsx`, `SlideCard.jsx`, `pages/index.jsx`, and every route wrapper. Assert the shared source contains query/hash validation, `replaceState`, `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`, `aria-current`, `tabIndex`, Home/End/Arrow handlers, focus management, and no `file:///` references. Assert each catalog `href` has a corresponding lesson wrapper or the special `pages/interactive-zwa-1/index.jsx` wrapper.

- [ ] **Step 3: Run the focused checks before implementation**

Run:

```bash
node --test tests/unit/lessons.test.js tests/e2e/navigation-accessibility.spec.js
```

Expected: FAIL because the catalog and shared primitive modules do not exist yet. If the test process errors instead of reporting assertion failures, fix only the test harness/import setup before continuing.

### Task 2: Implement catalog and shared primitives

**Files:**
- Create: `src/config/lessons.js`
- Create: `src/components/lesson/classNames.js`
- Create: `src/components/lesson/Code.jsx`
- Create: `src/components/lesson/InfoBox.jsx`
- Create: `src/components/lesson/ClickToRevealSolution.jsx`
- Create: `src/components/lesson/SlideCard.jsx`
- Create: `src/components/lesson/SlideNavigation.jsx`
- Create: `src/components/lesson/LessonShell.jsx`

**Interfaces:**
- `lessons` is an ordered array of `{ number, slug, title, href, componentKey }`.
- `getLessonByNumber(number)` and `getLessonBySlug(slug)` return a catalog entry or `undefined`.
- `LessonShell({ lesson, slides, activeSlide, onChange, children, title, subtitle, footerText, maxWidthClass })` renders the common lesson frame.
- `useSlideNavigation(slides)` returns `{ activeSlide, setActiveSlide }` and synchronizes a validated query/hash deep link.
- `SlideNavigation({ slides, activeSlide, onChange, idPrefix })` renders accessible tabs.
- `SlideCard({ slide, children, idPrefix })` renders the focused accessible panel.
- `Code`, `InfoBox`, and `ClickToRevealSolution` preserve existing visual/educational behavior with semantic button attributes.

- [ ] **Step 1: Implement the catalog**

Encode the current twelve route/module mappings exactly. Use logical slugs for each lesson and return `undefined` for invalid lookup input. Export the array without importing React or lesson modules so Node tests can load it directly.

- [ ] **Step 2: Implement the stateless shared primitives**

Move the duplicate class-name joining, inline code, info/tip/warning box, reveal state, and slide-card markup into the focused modules. Keep `ClickToRevealSolution`'s optional `hint` prop and use `type="button"`, `aria-expanded`, `aria-controls`, and a stable `hidden` content region.

- [ ] **Step 3: Implement accessible slide navigation**

Render a `nav` containing a `div role="tablist"`; each button gets `role="tab"`, `aria-selected`, `aria-controls`, `aria-current="step"` only for the active tab, and roving `tabIndex`. Handle ArrowLeft/ArrowRight/ArrowUp/ArrowDown, Home, and End with wrap-free bounded movement and focus the selected button.

- [ ] **Step 4: Implement the shell and deep-link hook**

Validate a query `slide` first and a hash second against slide IDs. On changes, update only the `slide` query with `window.history.replaceState`. Keep the first slide as the safe fallback, use the supplied max-width/footer/header overrides, and render `<Analytics />` from the shell. In `SlideCard`, skip initial focus but focus the `h2` with `tabIndex={-1}` after subsequent slide changes.

- [ ] **Step 5: Run focused checks to verify the shared contract**

Run:

```bash
node --test tests/unit/lessons.test.js tests/e2e/navigation-accessibility.spec.js
```

Expected: PASS for catalog, deep-link, source accessibility, and route coverage assertions.

### Task 3: Make the home page catalog-driven

**Files:**
- Modify: `pages/index.jsx`

- [ ] **Step 1: Replace hard-coded lesson links**

Import `lessons`, map each entry to the existing card-like `Link`, preserve the Attendance link separately, and expose lesson numbers/titles as readable link text. Do not alter protected routes or API behavior.

- [ ] **Step 2: Re-run catalog and build checks**

Run:

```bash
node --test tests/unit/lessons.test.js tests/e2e/navigation-accessibility.spec.js
npm run build
```

Expected: both commands exit zero and the home page no longer contains a hand-maintained lesson list.

### Task 4: Refactor non-playground lessons onto the shell

**Files:**
- Modify: `interactive_zwa_1_web_presentation_with_simulated_linux_cli.jsx`
- Modify: `interactive_zwa_7_classes_ajax_presentation.jsx`
- Modify: `interactive_zwa_8_php_presentation.jsx`
- Modify: `interactive_zwa_9_forms_crud_presentation.jsx`
- Modify: `interactive_zwa_10_sessions_cookies_presentation.jsx`
- Modify: `interactive_zwa_11_files_json_presentation.jsx`
- Modify: `interactive_zwa_12_auth_presentation.jsx`

- [ ] **Step 1: Replace duplicate primitive definitions**

Import shared `clsx`, `Code`, `InfoBox`, `ClickToRevealSolution`, and `SlideCard`; rename each lesson's content dispatcher to a lesson-specific name and retain its existing slide-specific children. Do not open or edit the five playground modules.

- [ ] **Step 2: Replace local active-slide state**

Use `useSlideNavigation(slides)` in each migrated lesson and keep the existing slide arrays and fallback semantics. For the network lesson, keep the terminal/checklist grid as the shell's children while the shell owns the page navigation.

- [ ] **Step 3: Wrap each lesson with `LessonShell`**

Pass the matching catalog entry, existing heading/subtitle/footer text, current slide, and lesson-specific content. Preserve all exercise state, images, code samples, and analytics behavior.

- [ ] **Step 4: Run syntax/build and focused checks**

Run:

```bash
node --test tests/unit/lessons.test.js tests/e2e/navigation-accessibility.spec.js
npm run build
```

Expected: PASS with all migrated route modules compiled by Next.

### Task 5: Modernize scoped risky examples and remove the machine-specific link

**Files:**
- Modify: `interactive_zwa_7_classes_ajax_presentation.jsx`
- Modify: `interactive_zwa_9_forms_crud_presentation.jsx`
- Modify: `interactive_zwa_11_files_json_presentation.jsx`
- Modify: `interactive_zwa_12_auth_presentation.jsx`

- [ ] **Step 1: Make the lesson 7 blacklist check non-authoritative**

Remove the mount-time fetch of `https://zwa.toad.cz/passwords.txt`. Use a small local demo set only for UI feedback, label it as a classroom hint, and include adjacent text that real password policy/breach checks must run server-side and never rely on a client blacklist.

- [ ] **Step 2: Make DELETE examples state-changing by explicit request**

Replace the GET anchor example with a POST form containing a hidden `_method=DELETE` field and a submit button, retaining the confirmation prompt and adding the existing server-side authorization/CSRF warning.

- [ ] **Step 3: Replace time-based identifiers**

Use `bin2hex(random_bytes(16))` in lesson 11 user IDs and lesson 12 Digest nonce teaching snippets. Explain that production persistence should use a database-generated unique identifier and that random values are for unpredictable tokens/nonces.

- [ ] **Step 4: Remove local filesystem PDF links**

Replace both lesson 12 `file:///Users/...` links with the existing authoritative course tutorial URL while keeping the surrounding resource links and labels useful.

- [ ] **Step 5: Run static risk scans and focused checks**

Run:

```bash
rg -n 'file:///|passwords\.txt|uniqid\s*\(|href="delete\.php\?id=' interactive_zwa_*_presentation.jsx pages src --glob '!src/components/playground/**' || true
node --test tests/unit/lessons.test.js tests/e2e/navigation-accessibility.spec.js
```

Expected: no machine-specific link, remote blacklist fetch, `uniqid()` teaching call, or DELETE-as-GET anchor remains in the scoped non-playground lessons. Any matches in playground-owned files are out of scope and must not be edited; report them separately if present.

### Task 6: Full verification and scoped commit

**Files:**
- Verify only: all files listed above; ensure playground-owned and unrelated worktree files are not staged.

- [ ] **Step 1: Run the fresh focused checks**

```bash
node --test tests/unit/lessons.test.js tests/e2e/navigation-accessibility.spec.js
```

- [ ] **Step 2: Run the available full unit/API suite**

```bash
node --test tests/unit/*.test.js tests/api/*.test.js tests/playground-isolation.test.js
```

- [ ] **Step 3: Run the production build**

```bash
npm run build
```

- [ ] **Step 4: Inspect the diff and stage only Task 8 scope**

```bash
git diff --check
git status --short
git diff --name-only
git add docs/superpowers/specs/2026-09-08-task-8-presentation-architecture-design.md docs/superpowers/plans/2026-09-08-task-8-presentation-architecture.md src/config/lessons.js src/components/lesson pages/index.jsx interactive_zwa_1_web_presentation_with_simulated_linux_cli.jsx interactive_zwa_7_classes_ajax_presentation.jsx interactive_zwa_8_php_presentation.jsx interactive_zwa_9_forms_crud_presentation.jsx interactive_zwa_10_sessions_cookies_presentation.jsx interactive_zwa_11_files_json_presentation.jsx interactive_zwa_12_auth_presentation.jsx tests/unit/lessons.test.js tests/e2e/navigation-accessibility.spec.js
git diff --cached --name-only
```

Verify that no playground file, API/server/auth file, teacher/student UI file, grading file, package metadata, or unrelated test is staged.

- [ ] **Step 5: Commit the scoped change**

```bash
git commit -m "feat: centralize lesson presentation architecture"
```

- [ ] **Step 6: Capture final evidence**

Record the commit hash, changed-file list, focused/full test results, build result, static scan result, and any residual risks such as legacy navigation semantics in the five untouched playground lessons.
