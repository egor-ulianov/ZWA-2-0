# Unified Czech Lesson Workspace

## Purpose

Make practical work consistent across all twelve ZWA lessons. Each lesson keeps its existing curriculum and deep links but presents task work in one predictable Czech three-zone workspace: task brief, IDE, and preview/test area.

## Product direction

The lesson reader retains the calm editorial ZWA system. The left course outline is the only in-lesson slide navigation. Remove the duplicate horizontal tab strip from student lesson mode. Slide changes remain available by outline, keyboard arrows/Home/End outside editable fields, and deep links.

All shared lesson UI is Czech: lesson labels, course outline, learning objective, task workspace, files, editor, preview, test actions/results, presenter mode, projector controls, loading/error/supporting copy, and accessible names. Preserve existing Czech curriculum text; do not machine-translate it.

## Unified task workspace

### Required zones

Every practical task is rendered through a common `Plocha úkolu` frame with:

1. `Zadání` — concise task instructions and the exact expected outcome.
2. `IDE` — editable source or a deterministic simulated terminal, with a clearly named active file/input.
3. `Náhled a testy` — preview/output plus an explicit Czech `Spustit testy` control and bounded results.

Task drafts stay only in the current browser session. The UI never claims server-side saving.

### Runtime truthfulness

- HTML, forms, CSS, CSS II, and JavaScript retain their existing sandboxed iframe/JS runtime and current validator behavior. Do not relax CSP, sandbox attributes, origin/token protocol, timeout, or validator/API boundaries.
- The networking lesson retains its deterministic simulated terminal and never makes actual network/filesystem requests.
- Classes/AJAX and PHP lessons gain an editable IDE-style source draft, a static expected-preview/explanation pane, and source-structure tests. The UI explicitly identifies those checks as static where code cannot be executed in the browser; it must not claim a PHP/server runtime.
- All test results identify requirements, not solutions. The tests are bounded, local, and never evaluate student source in the host page.

### Lesson mapping

| Lesson group | Existing capability | Unified adapter |
| --- | --- | --- |
| HTML5, Forms | HTML editor, local/online checks, sandbox preview where present | Preserve editor/validator; expose all three named zones. Forms uses an illustrative preview/state explanation if the existing task has no iframe preview. |
| Network | Deterministic terminal and checklist | Terminal becomes IDE; terminal/checklist is preview/tests; no live networking. |
| CSS, CSS II | HTML/CSS editor, sandbox preview, hidden inspection validator | Preserve current sandbox and inspection mechanics; expose shared zone headings and Czech controls/results. |
| JavaScript | `ExerciseWorkspace`, isolated JS sandbox, console/test definitions | Adopt shared Czech UI and keep isolated execution/exports/timeout boundary. |
| Classes/AJAX, PHP through Auth | Static code/reveal tasks | Use source drafts plus a static preview and source-structure checks; disclose static checking and retain course examples/reveals. |

## Navigation and modes

- Student mode renders the left `Osnova kurzu` panel and content only. It does not render the top `SlideNavigation` tablist.
- Projector and presenter mode retain their respective controls but use Czech labels. Projector still excludes every editor, preview runtime, test panel, console, private presenter notes, and other `data-projector-private` content.
- Existing slide IDs, `?slide=<known-id>` URLs, valid unknown-slide fallback, tab IDs/ARIA relationships where an interactive control remains, and keyboard behavior stay compatible. Tests may be updated to assert outline buttons instead of removed top tabs.

## Non-goals

- No PHP execution environment, server code runner, API/database/authentication change, real network simulation, new dependency, or persistence.
- No lesson content rewrite, renamed slide IDs, new course progression/grades, or changed exercise security policy.
- No removal of existing task-specific validators, W3C validation, terminal simulation, examples, or solution disclosure mechanics unless replaced by equivalent behavior verified in tests.

## Compatibility and quality

- Keep Node.js `>=20 <21`, Next.js `16.3.4` Pages Router, React `18.3.1`, and existing dependencies only.
- Use semantic Czech accessible names, keyboard operation, visible focus, 320px responsive behavior, and exactly one primary lesson navigation per student view.
- Preserve all hostile-code protections: no host-page source evaluation, no parent-window access, no network/forms/navigation privileges for sandbox content, and only the existing bounded message protocol.
