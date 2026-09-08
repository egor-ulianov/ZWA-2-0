# Task 8 Presentation Architecture Design

**Date:** 2026-09-08
**Repository:** `ZWA-2-0`
**Scope:** Central lesson metadata, shared presentation UI, non-playground lesson refactors, deep-link/navigation accessibility, and brittle/risky educational examples.

## Context and constraints

The application is a Next.js Pages Router site with twelve public lesson routes. Five lesson modules are owned by the playground workstream and must remain untouched:

- `interactive_zwa_1_html5_presentation.jsx`
- `interactive_zwa_2_css_presentation.jsx`
- `interactive_zwa_2_forms_presentation.jsx`
- `interactive_zwa_5_css2_presentation.jsx`
- `interactive_zwa_5_javascript_presentation.jsx`

The actual non-playground lesson modules use different filenames from the task description. This design uses the repository's current mapping: the network lesson in `interactive_zwa_1_web_presentation_with_simulated_linux_cli.jsx`, lessons 7–12 in their existing root-level modules, and the existing route wrappers. Existing URLs, lesson content, interactive exercises, and grading behavior remain unchanged.

## Design

### 1. Canonical catalog

Create `src/config/lessons.js` exporting an ordered `lessons` array. Each entry has exactly the stable metadata needed by the home page and checks: `number`, logical `slug`, display `title`, public `href`, and the root presentation `componentKey`. The catalog records the current route map, including the historical `/interactive-zwa-1/` URL for the network lesson. It also exports `getLessonByNumber` and `getLessonBySlug` for presentation shells and tests.

`pages/index.jsx` renders lesson links from this array and keeps the protected Attendance link outside the lesson catalog. Route wrappers continue to dynamically import their current modules with `ssr: false`; no public route is renamed or redirected.

### 2. Shared presentation primitives

Create focused modules under `src/components/lesson/`:

- `classNames.js` provides the shared `clsx` helper.
- `Code.jsx` provides the inline code treatment.
- `InfoBox.jsx` provides consistent info, tip, and warning treatments.
- `ClickToRevealSolution.jsx` preserves the locked/revealed exercise behavior with explicit button semantics and generated IDs.
- `SlideCard.jsx` provides the accessible `tabpanel`, heading, title/subtitle, focus behavior, and shared card treatment.
- `SlideNavigation.jsx` provides a `tablist` with roving tab focus, `aria-selected`, `aria-controls`, `aria-current`, Home/End/Arrow-key navigation, and visible focus styling.
- `LessonShell.jsx` owns the common page background, header, navigation, content region, footer, analytics, and a `useSlideNavigation` hook.

`useSlideNavigation` validates a `slide` query parameter or hash against the supplied slide IDs, falls back to the first slide, and updates the URL with `history.replaceState` without adding history entries. It never trusts an unknown slide ID. `SlideCard` focuses its heading after a slide change so keyboard and assistive-technology users receive context.

The network lesson keeps its terminal and two-column exercise layout as lesson-specific content inside `LessonShell`. Shared primitives do not execute code, alter server boundaries, or modify the playground-owned lessons.

### 3. Non-playground adoption

Refactor the actual non-playground lessons to import the shared primitives and use `LessonShell`/`useSlideNavigation`, while retaining each module's slide data and lesson-specific render functions. The refactor covers the network lesson, lessons 7–12, and only the route wrappers/home page required by the catalog. Playground-owned modules remain byte-for-byte untouched.

### 4. Educational safety updates

- Replace the lesson 9 DELETE-as-GET example with an explicit POST form carrying a method override and a visible note that state-changing actions require server-side authorization and CSRF protection.
- Replace lesson 11 `uniqid()` examples with `bin2hex(random_bytes(16))`, explaining that time-based identifiers are not suitable as security or collision-resistant IDs and that production systems should prefer database-generated identifiers where appropriate.
- Replace lesson 12's machine-specific `file:///Users/.../ZWA-12.pdf` links with the existing authoritative course links.
- Keep lesson 7's blacklist exercise as a clearly labeled classroom UX demonstration only: remove the remote password-list fetch and make the displayed weak-password check local and non-authoritative, with text stating that password policy and breach checks must be enforced server-side. The lesson's AJAX/OOP learning behavior remains intact.
- Update the lesson 12 Digest nonce teaching example to use `random_bytes` rather than `uniqid`.

## Testing and verification

Before implementation, add `tests/unit/lessons.test.js` and `tests/e2e/navigation-accessibility.spec.js` as dependency-free Node tests. They verify catalog uniqueness/route coverage, the historical network deep link, query/hash validation behavior, shared navigation semantics, keyboard handlers, focus behavior, and absence of machine-specific links. Run them red before adding the implementation, then green after each relevant change. Finish with both focused tests, the full available Node test suite, `npm run build`, static scans for `file:///`, unauthorized playground edits, and the three risky patterns.

No package metadata, APIs/server/auth, teacher/student UI, grading, playground files, or unrelated tests are changed.
