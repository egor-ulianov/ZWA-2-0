# Portal UI Redesign

## Purpose

Rebuild the public course catalogue, student lesson shell, exercise workspace, and lecture projection experience into a coherent programming-learning portal. Preserve every existing route, lesson activity, sandbox boundary, authentication flow, grade, and attendance behavior.

## Product direction

The visual reference is an editorial course reader with a real coding workspace: Full Stack Open’s calm hierarchy, CS50’s lecture-to-practice course logic, and Scrimba’s code-centered interaction. The product must not resemble a generic SaaS dashboard.

Use near-white surfaces, charcoal text, deep indigo primary actions, and soft coral only for instructional emphasis. The text `ZWA · Web Applications` is permitted; a standalone `Z` icon or emblem is not.

## Primary experiences

### Course and student home

- Replace the plain list of twelve presentation links with a readable course roadmap grouped by module.
- A lesson card shows its number, title, learning focus, and one action. Completion appears only when backed by persisted data; no fabricated course progress.
- Keep `/student` and `/student/progress` as authenticated grade/attendance routes. Restyle existing data only; do not change APIs, fields, or access control.

### Student lesson

- Preserve existing `?slide=<known-id>` deep links, tab semantics, and keyboard navigation.
- Present course context, current concept, brief learning objective, content, and one obvious next action. Navigation is a compact course outline, not a dashboard.
- Existing lesson content and activities remain authoritative. The shared shell changes hierarchy; it does not silently rewrite academic content.
- An activity may identify its mode as learn, quick check, predict, diagnose, build, compare, or apply. A lesson uses two or three modes, not all seven.

### IDE-style build exercise

- Build exercises may show a compact file explorer, editor, preview/output, and test panel.
- `Run tests` is explicit and keyboard-accessible. Results use the existing sandbox and message-validation boundary. Test text identifies a requirement and does not expose a solution.
- The first release stores edits in the current browser session only. Do not claim saved work.
- No arbitrary execution capability, network access, parent-window access, or relaxed iframe sandbox policy is permitted.

### Projector and presenter modes

- Every lesson gets projector mode at `?mode=projector&slide=<known-id>`. It shows only teaching content, concise previous/next controls, and subtle slide position.
- Presenter mode at `?mode=presenter&slide=<known-id>` offers an outline, course-authored notes, timer, keyboard shortcuts, and an `Open projector` action.
- The two same-origin windows synchronize active slide via `BroadcastChannel`. Both work independently if a popup is blocked or no second display exists.
- Arrow keys move slides outside editable fields; fullscreen happens only after a user gesture; Escape never traps focus.

## Non-goals

- No database schema, API contract, authentication, grading, attendance, or AI-grading change.
- No new learner accounts, completion tracking, social feed, chat, badges, streaks, or notifications.
- No third-party IDE, editor, icon, design-system, or analytics dependency.
- No broad conversion of course text into a CMS.

## Compatibility and quality

- Node.js remains `>=20 <21`; Next.js remains 16.3.4 Pages Router; React remains 18.3.1.
- Preserve all twelve ordered public lesson routes, known-slide fallback behavior, and the existing isolated iframe rules.
- Support keyboard operation, visible focus, semantic landmarks, dark mode, 320px mobile layout, and 1280px projector layout.
- Preserve Czech instructional copy. New interface labels are supplied by the course owner; do not machine-translate existing lessons.
