# Student and Teacher Workspace Redesign

## Purpose

Bring the authenticated student record and teacher administration surfaces into the established ZWA editorial portal system. The redesign must make school data easier to scan and act on without changing its meaning, permissions, persistence, or APIs.

## Product direction

Use the existing near-white, charcoal, deep-indigo, and soft-coral portal language. Treat these as focused working surfaces, not a consumer dashboard: solid panels, calm type hierarchy, explicit actions, visible save/error state, and clear labels. `ZWA · Web Applications` remains text-only; no standalone Z mark, decorative gradients, glass effects, fabricated progress, badges, or streaks.

## Student experience

### Sign-in

- Keep `/student`, its username and auth-code fields, request flow, redirects, and error states unchanged.
- Present it as a compact, reassuring student access panel with a brief explanation of what becomes available after sign-in: evaluations, assignment record, and attendance.
- Preserve labels, autocomplete metadata, error announcement, and keyboard path.

### Personal record

- Keep `/student/progress` read-only and preserve the current `/api/student/me`, attendance, and grade payload consumption.
- Introduce an honest at-a-glance summary derived only from returned data: recorded attendance count, available evaluations, and actual assignment checks. Do not infer course completion or a grade.
- Present assignment information as a clearly named record, evaluations as separate readable feedback cards, and attendance as a chronological record with present/absent status.
- Retain least-privilege rendering: internal grade-attempt, actor, model, prompt, and other private fields must never render.
- Retain loading, retry, unauthorized redirect, and logout behavior.

## Teacher experience

### Shared workspace

- Keep both existing teacher routes: `/attendance` for attendance and student records, `/teacher` for grade normalization.
- Introduce a shared teacher shell that uses `PortalFrame`, shows the authenticated teacher identity only after it is established, and offers route links appropriate to the existing pages.
- A teacher who is not authenticated sees a proper portal sign-in panel, never a partial admin workspace.
- Navigation and all actions must be keyboard accessible and visually distinguishable. No new role/permission model is introduced.

### Attendance and student records

- Preserve every attendance operation: date selection, per-student toggle, all/none, conflict reload/retry, CSV import/export, overview table, logout, and serialized request behavior.
- Reorganize the active-day controls into a compact operational bar: date, filtered roster, actual present count, and bulk actions. Save and conflict states are explicit, not only color-coded.
- Render each student as a calm record row/card with attendance as the primary action and assignment record disclosure as a secondary action.
- Make progress editing legible with grouped fields, an honest autosave status, final-points validation, access-code handling, and existing retry/rollback behavior. Generated access codes remain transient and are never prefilled or stored in the UI.
- Keep horizontal access to the attendance overview at small widths using the existing scroll-safe table treatment.

### Grade normalization

- Preserve `/teacher` authorization behavior and the existing dry-run-before-apply protocol per test.
- Use the shared shell, a clear safety explanation, test work panels, a compact preview table, and explicit dry-run/apply state. Apply stays unavailable until its matching dry run returns a run ID.
- Do not make grade results, totals, or applied status look like student-facing course progress.

## Non-goals

- No database schema, API, authentication, authorization, grade-normalization protocol, attendance, CSV, or progress-persistence change.
- No new dependencies, icons, analytics, notifications, accounts, messaging, completion tracking, or artificial metrics.
- No changes to the sandboxed lesson runtime or public lesson routes.
- Do not translate or rewrite existing Czech instructional content. New authenticated UI labels may remain English to match the existing admin and student interface.

## Compatibility and quality

- Keep Node.js `>=20 <21`, Next.js `16.3.4` Pages Router, React `18.3.1`, and existing dependencies only.
- Preserve every existing form label and behavior relied on by E2E tests, unless assertions are updated to equally semantic labels.
- Support keyboard operation, visible focus, semantic landmarks, error/live announcements, dark mode, and 320px layouts. Tables may scroll horizontally rather than compress data unsafely.
- Preserve the student least-privilege boundary and all existing CSRF/auth checks.
