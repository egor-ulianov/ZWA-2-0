# Student and Teacher Workspace Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the authenticated student record and both teacher administration routes as coherent, accessible ZWA workspace surfaces while preserving every existing behavior.

**Architecture:** Reuse `PortalFrame` and portal CSS primitives through a small teacher shell, then redesign each route around its current data flow rather than changing any server contract. Student progress remains a read-only projection of existing data; teacher pages retain their existing client-side request queues, normalization safety protocol, and authentication boundaries.

**Tech Stack:** Next.js 16.3.4 Pages Router, React 18.3.1, Tailwind CSS 3.4, Node test runner, Playwright, existing API client.

**Spec:** `docs/superpowers/specs/2026-09-09-student-teacher-workspace-design.md`

## Global Constraints

- Keep Node.js `>=20 <21`, Next.js `16.3.4` Pages Router, React `18.3.1`, and existing dependencies only.
- Do not change database migrations, API handlers, authentication, authorization, grade-normalization protocol, attendance persistence, CSV parsing, or progress payloads.
- Use `ZWA · Web Applications` only as text; no standalone Z mark, gradient, glass effect, invented progress, badge, or streak.
- Preserve student least-privilege rendering and all current login, redirect, logout, error, retry, conflict, CSV, and autosave behaviors.
- Preserve current public lesson routes and sandbox boundaries; this plan owns only student and teacher surfaces plus their tests.
- Support keyboard access, visible focus, semantic landmarks, dark mode, and 320px layout; data tables may horizontally scroll.

---

## Dispatch map

| Wave | Packet | Depends on | Exclusive ownership |
| --- | --- | --- | --- |
| 1 | A — teacher shell | none | `src/components/teacher/TeacherWorkspaceShell.jsx`, teacher shell unit test |
| 2 | B — student record | A portal primitives only | `pages/student/*`, `tests/e2e/student-workflow.spec.js` |
| 3 | C — attendance workspace | A | `AttendancePage`, `StudentRow`, `ProgressEditor`, teacher workflow test |
| 4 | D — normalization workspace | A | `pages/teacher/index.jsx`, normalization E2E test |
| 5 | E — integration | B/C/D | responsive/accessibility test and narrowly required fixes |

Implementation packets are sequential because the user explicitly declined worktrees; no two implementation agents may edit the shared checkout at once.

### Task 1: Shared teacher workspace shell

**Files:**

- Create: `src/components/teacher/TeacherWorkspaceShell.jsx`
- Test: `tests/unit/teacher-workspace-shell.test.js`

**Interfaces:** `TeacherWorkspaceShell({ children, username, activeSection, actions, title, eyebrow, description })` wraps authenticated or unauthenticated teacher content in `PortalFrame`. `activeSection` is `'attendance'` or `'normalization'`; `actions` remains caller-owned button content.

- [ ] **Step 1: Write a failing source-contract test**

```js
test('teacher workspace shell uses PortalFrame and text-only teacher navigation', async () => {
  const source = await readFile(path.join(root, 'src/components/teacher/TeacherWorkspaceShell.jsx'), 'utf8');
  assert.match(source, /PortalFrame/);
  assert.match(source, /Attendance & records/);
  assert.match(source, /Grade normalization/);
  assert.doesNotMatch(source, /Z logo|standalone Z/i);
});
```

- [ ] **Step 2: Verify RED**

Run: `node --test tests/unit/teacher-workspace-shell.test.js`

Expected: missing-module failure.

- [ ] **Step 3: Implement the shell**

```jsx
export default function TeacherWorkspaceShell({ title, eyebrow = 'Teacher workspace', description, username, activeSection, actions, children }) {
  return <PortalFrame meta="Teacher workspace"><main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-12">{/* heading, semantic nav, caller actions, children */}</main></PortalFrame>;
}
```

Render only explicit route links (`/attendance`, `/teacher`); use `aria-current="page"` for `activeSection`; render teacher identity only when `username` is non-empty. Use existing `portal-panel`, `portal-action`, `portal-kicker`, and CSS variables.

- [ ] **Step 4: Verify and commit**

Run: `node --test tests/unit/teacher-workspace-shell.test.js && npm run lint && npm run format:check`

Commit message: `feat: add shared teacher workspace shell`

### Task 2: Student access and personal record

**Files:**

- Modify: `pages/student/index.jsx`
- Modify: `pages/student/progress.jsx`
- Modify: `tests/e2e/student-workflow.spec.js`

**Interfaces:** Keep `request`, `isUnauthorized`, existing endpoints, field IDs/labels, redirects, and `DataItem`. Render actual summary values only: `presentCount`, `evaluationCount`, and task/mid-term boolean state obtained from current payloads.

- [ ] **Step 1: Add failing student semantic assertions**

```js
await expect(page.getByRole('heading', { name: 'Your study record' })).toBeVisible();
await expect(page.getByRole('region', { name: 'At a glance' })).toContainText('1 attendance record');
await expect(page.getByRole('region', { name: 'Evaluations' })).toContainText('Test 1');
```

- [ ] **Step 2: Verify RED**

Run: `npm run test:e2e -- tests/e2e/student-workflow.spec.js`

Expected: heading/region assertions fail before UI changes.

- [ ] **Step 3: Redesign without changing data flow**

Keep login form IDs, labels, autocomplete, request payload, alert, and submit semantics. In progress, replace the generic two-column panels with: identity/header + logout, a labeled factual summary, assignment record, evaluations region, and attendance record. Derive count labels from real arrays, use `role="status"` for loading, retain retry alert behavior, and never display hidden grade fields.

- [ ] **Step 4: Verify and commit**

Run: `npm run test:e2e -- tests/e2e/student-workflow.spec.js tests/e2e/navigation-accessibility.spec.js && npm run lint && npm run format:check`

Commit message: `feat: redesign student record workspace`

### Task 3: Attendance and student-record administration

**Files:**

- Modify: `src/components/teacher/AttendancePage.jsx`
- Modify: `src/components/teacher/StudentRow.jsx`
- Modify: `src/components/teacher/ProgressEditor.jsx`
- Modify: `tests/e2e/teacher-workflow.spec.js`

**Interfaces:** Consume `TeacherWorkspaceShell`. Preserve `TeacherLogin({ onSuccess })`, `AttendancePage` request queues/revision handling, `StudentRow` `onToggle` and `onSaveProgress`, and `ProgressEditor` autosave/access-code behavior.

- [ ] **Step 1: Add failing operational-workspace assertions**

```js
await expect(page.getByRole('heading', { name: 'Attendance & student records' })).toBeVisible();
await expect(page.getByRole('region', { name: 'Active attendance day' })).toContainText('Present: 1 of 2');
await expect(page.getByRole('button', { name: 'Mark visible students present' })).toBeVisible();
```

- [ ] **Step 2: Verify RED**

Run: `npm run test:e2e -- tests/e2e/teacher-workflow.spec.js`

Expected: new workspace labels are absent before migration.

- [ ] **Step 3: Redesign composition only**

Use `TeacherWorkspaceShell` for the loading, login, error, and authenticated states. Keep the login request and session behavior intact. Group date/search/bulk controls in an `Active attendance day` region with `Present: N of M`; give bulk buttons specific accessible names. Make rows solid portal panels; keep the native details disclosure. Group ProgressEditor fields in labeled sections and retain debounce, retry, rollback, validation, mail link, and transient access-code behavior. Preserve the scrollable overview table and all CSV actions.

- [ ] **Step 4: Verify and commit**

Run: `npm run test:e2e -- tests/e2e/teacher-workflow.spec.js tests/e2e/navigation-accessibility.spec.js && npm run lint && npm run format:check`

Commit message: `feat: redesign teacher attendance workspace`

### Task 4: Grade-normalization workspace

**Files:**

- Modify: `pages/teacher/index.jsx`
- Create: `tests/e2e/teacher-normalization.spec.js`

**Interfaces:** Consume `TeacherWorkspaceShell`; retain `buildNormalizationRequestBody`, `request`, `isAbortError`, state-by-test shape, and `runNormalize(testNumber, dryRun)`. A matching panel's Apply button remains disabled until the latest successful dry run returns `result.runId`.

- [ ] **Step 1: Add failing normalization-view test**

```js
await expect(page.getByRole('heading', { name: 'Grade normalization' })).toBeVisible();
await expect(page.getByRole('region', { name: 'Test 1 normalization' })).toContainText('Dry run before applying changes');
await expect(page.getByRole('button', { name: 'Apply normalization for Test 1' })).toBeDisabled();
```

- [ ] **Step 2: Verify RED**

Run: `npm run test:e2e -- tests/e2e/teacher-normalization.spec.js`

Expected: route/test file assertions fail before redesign.

- [ ] **Step 3: Implement the teacher-safe surface**

Use `TeacherWorkspaceShell` after auth resolves. Preserve authorization output and all request code. Rename the visible heading, give each panel a `region` label, describe dry-run safety in copy, use distinct action names, retain loading/error live feedback, and keep the existing bounded preview table. Do not move mutation or validation logic out of the current page.

- [ ] **Step 4: Verify and commit**

Run: `npm run test:e2e -- tests/e2e/teacher-normalization.spec.js tests/e2e/teacher-workflow.spec.js && npm run lint && npm run format:check`

Commit message: `feat: redesign grade normalization workspace`

### Task 5: Workspace integration and accessibility

**Files:**

- Create: `tests/e2e/workspace-responsive.spec.js`
- Modify: `tests/e2e/navigation-accessibility.spec.js`
- Modify only source needed to resolve a reproducible integration failure

**Interfaces:** Consume all earlier packets; no production redesign/refactor is in scope.

- [ ] **Step 1: Add failing responsive/privacy assertions**

```js
await page.setViewportSize({ width: 320, height: 720 });
await page.goto('/student/progress');
expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
await expect(page.getByRole('main')).toHaveCount(1);
```

Use deterministic network fixtures to cover student login, attendance login, and normalization auth.

- [ ] **Step 2: Verify RED**

Run: `npm run test:e2e -- tests/e2e/workspace-responsive.spec.js`

Expected: file is absent before integration work.

- [ ] **Step 3: Add keyboard and boundary checks**

Cover visible focus/activation for student form, teacher login, teacher section links, attendance checkbox/disclosure, bulk action, and normalization dry-run. Assert student output excludes private grade fields. Keep all existing conflict retry and autosave assertions.

- [ ] **Step 4: Full verification and commit**

Run: `npm test && npm run lint && npm run format:check && npm run typecheck && npm run build && npm run test:e2e`

Commit message: `test: verify student and teacher workspaces`

## Self-review

- Spec coverage: Task 1 creates the shared teacher frame; Task 2 delivers student access/record; Task 3 covers attendance and progress operations; Task 4 covers grade normalization; Task 5 verifies responsiveness, access, and preserved boundaries.
- Placeholder scan: no TODO, TBD, or undefined interface is used.
- Interface consistency: TeacherWorkspaceShell and its exact `activeSection` values are defined before all consumers; all existing request functions remain owned by their current routes.
