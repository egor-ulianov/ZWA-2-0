# Elements of AI-Inspired Course Experience

## Purpose

Rebuild the complete ZWA interface around the visual clarity and editorial course structure of Elements of AI while retaining ZWA's identity, Czech curriculum, and existing application behavior. This is a clean-break UI reconstruction, not a restyling of the current portal.

The finished product must feel like one intentionally designed course across the public overview, lessons, exercises, quizzes, student access and progress, teacher and attendance workspaces, presenter mode, and projector mode.

## Hard boundary: no reuse of the existing UI

The implementation must not use the current UI components as the foundation of the redesign. In particular, it must replace rather than restyle:

- `PortalFrame`
- `CourseRoadmap`
- `LessonShell`
- `LessonOutline`
- `SlideCard`
- `LessonTaskWorkspace`
- `PresenterConsole`
- `ProjectorStage`
- `TheoryCodeBlock` and `SyntaxCodeEditor` as visual components
- the `portal-*` utility classes, existing portal tokens, panels, buttons, navigation treatments, and automatic color-scheme rules

New routes may temporarily coexist with the old implementation during migration, but completion requires every in-scope route to use the new component tree and the superseded visual layer to be deleted. Compatibility wrappers that preserve the old markup or styling are out of scope.

Pure behavior may be retained or extracted when it has no visual contract. This includes lesson metadata, slide validation and URL synchronization, presenter messaging, exercise checks, sandbox protocols, API clients, authentication logic, and server repositories. Existing third-party runtime libraries such as CodeMirror may remain, but their current JSX wrappers and styling must not be reused.

## Product direction

The interface adopts the reference's structural qualities rather than copying its brand:

- a bold, single-color course canvas;
- flat pastel illustrations with strong silhouettes;
- white editorial reading surfaces;
- compact course navigation and visible progress;
- narrow, comfortable reading columns;
- large areas of deliberate whitespace;
- chapter-like modules containing a small number of clearly ordered lessons;
- minimal decoration, shallow hierarchy, and strong alignment.

ZWA uses blue instead of the reference's purple. All illustrations, icons, labels, and compositions are original. The Elements of AI logo, artwork, proprietary typography, and exact brand assets must not be copied.

## Information architecture

### Course overview

The overview is a blue course canvas with a compact masthead followed by a short introduction and four module cards. The current list of twelve individual panels is replaced by four chapter-like units:

1. Základy webu
2. Prezentace a interakce
3. Základy serveru
4. Stav a data

Each module card has an illustrated upper field and a white body containing its module number, title, and three ordered lesson rows. A lesson row contains the lesson number, concise title, optional short focus, and a directional affordance. The entire row is a clear, keyboard-accessible link.

The desktop overview uses a two-by-two grid so every card has enough width for Czech titles. It becomes one uninterrupted column on narrow viewports. No completion status is invented for anonymous visitors. Persisted progress may be shown only where an existing authenticated data source supports it.

### Lesson experience

The permanent left outline and dashboard-like framing are removed.

A student lesson contains, in order:

1. a compact masthead with ZWA identity, course access, outline menu, and theme control;
2. a thin blue/yellow progress strip showing current lesson section and position;
3. a wide lecture-specific illustration;
4. a narrow editorial header with lesson number, title, and learning objective;
5. the active theory, quiz, or exercise content;
6. explicit previous and next section navigation;
7. a restrained course footer.

Only one lesson section remains visible at a time, preserving current deep links and interactive state boundaries. The full outline opens as a keyboard-accessible drawer. The drawer is a new composition, not a disguised version of the current sidebar. Opening it moves focus into the drawer; closing it restores focus to the invoking control. Escape closes it, and background content is not keyboard-reachable while the drawer is modal.

Valid `?slide=<id>` links select the requested section. Unknown section IDs fall back to the lesson's defined first section and normalize the URL. Existing non-editable keyboard navigation remains available without intercepting keystrokes inside editors, inputs, selects, or content-editable regions.

### Editorial content

The main reading column is approximately 720px wide. Titles and introductions are visually dominant; supporting labels are compact. Learning objectives are integrated as editorial callouts rather than placed in generic bordered cards.

Theory code examples use a new read-only code presentation built directly on the syntax engine. It follows the new tokens, supports all currently required languages, remains horizontally scrollable, and avoids embedding the current `TheoryCodeBlock` markup or styles.

Information, warning, terminology, and example callouts use a small number of semantically distinct compositions. They must not recreate the current collection of rounded colored boxes.

### Exercise stage

Exercises break out of the reading column into a dedicated stage up to approximately 1120px wide. The stage is visually continuous and must not become a stack of panels inside panels.

It contains four clear regions:

1. **Brief** — task, constraints, and expected outcome.
2. **Studio** — editable source, deterministic simulated terminal, or other lesson-specific working surface.
3. **Preview** — sandboxed rendering, bounded output, or truthful static explanation.
4. **Verification** — explicit test action and requirement-focused results.

On wide screens, studio and preview may sit side by side when that improves the task. On mobile, the order is always brief, studio, preview, verification. Solution disclosure is visually subordinate and requires an explicit action.

Existing sandbox, CSP, message validation, timeout, origin, static-check, and no-network boundaries remain authoritative. The new UI must describe static checks as static and must not imply that PHP or network code executes when it does not.

### Quizzes

Quizzes become editorial question sequences within the lesson rather than independent dashboard widgets. Progress is visible but quiet. Answer choices have clear selected, correct, incorrect, and focus states that do not depend on color alone. Existing quiz behavior and content remain authoritative.

### Presenter and projector experiences

Presenter and projector modes are purpose-built branches of the new system, not responsive variants of the student layout.

Projector mode emphasizes one teaching idea at a time, uses the lecture illustration and large typography where appropriate, removes private exercise and presenter material, and keeps only concise previous/next controls plus section position.

Presenter mode combines a compact section navigator, current teaching content, timer, notes, and projector launch action. Existing `BroadcastChannel` synchronization and independent fallback behavior remain unchanged.

### Student, teacher, and attendance experiences

Student access uses a focused sign-in composition rather than a generic panel. Student progress becomes an editorial record with clear sections for summary, assignment, feedback, and attendance. It must not mimic a SaaS analytics dashboard.

Teacher and attendance pages use the same typography, color, masthead, controls, and theme system, but prioritize dense operational clarity. Forms and tables may be utilitarian. They must still be newly composed and must not retain `portal-panel`, `portal-action`, or the current workspace shell markup.

No API shape, authentication rule, grade calculation, attendance behavior, import/export flow, or authorization boundary changes as part of this redesign.

## New component architecture

The new interface is built in a parallel `src/course-ui/` tree during migration:

```text
CourseApplication
├── CourseMasthead
│   └── ThemeController
├── CourseOverview
│   └── ModuleCard
│       └── LessonRow
├── LearningPage
│   ├── CourseProgressStrip
│   ├── LessonHero
│   ├── LessonArticle
│   ├── OutlineDrawer
│   └── LessonPager
├── ExerciseStage
│   ├── ExerciseBrief
│   ├── CodeStudio
│   ├── PreviewStage
│   └── TestResults
├── PresenterExperience
├── ProjectorExperience
└── OperationsExperience
    ├── StudentAccess
    ├── StudentProgress
    ├── TeacherWorkspace
    └── AttendanceWorkspace
```

Names may be refined during planning, but the ownership boundaries are normative. Course-level chrome, learning flow, exercise work, presentation modes, and operational tools must not collapse into one universal shell.

## Original lecture illustrations

Original imagery is a required implementation workstream and acceptance criterion, not optional polish.

Create twelve distinct, locally bundled lecture illustrations, one for every public lesson:

| Lesson | Illustration subject |
| --- | --- |
| HTML5 | Semantic document structure represented as assembled architectural blocks |
| Forms | Human input moving through clearly labeled controls and validation gates |
| Network | A request travelling from browser through named network stages to a server |
| CSS | A plain structure transformed through layers of visual rules |
| CSS II | Responsive boxes reorganizing across different frames and print |
| JavaScript | Events moving through an interface and triggering visible state changes |
| Classes and AJAX | Structured objects exchanging asynchronous messages |
| PHP | A server-side request transformed into a generated response |
| Forms and CRUD | Records being created, inspected, updated, and removed |
| Sessions and cookies | A returning browser carrying bounded session identity |
| Files and JSON | Structured documents flowing between files and an application |
| Authentication | Identity passing through authentication and authorization gates |

The art direction is shared across all twelve images:

- flat vector geometry;
- blue-black outlines or strong silhouette boundaries;
- the approved blue plus coral, sky, mint, apricot, yellow, and warm neutral pastels;
- simple human or object metaphors where helpful;
- no gradients, glass effects, faux-3D rendering, stock illustration packs, or embedded text;
- consistent artboard ratio, line weight, level of detail, and negative space;
- recognizably related to the subject without becoming a literal software diagram.

Use repository-native SVG assets so they remain sharp, lightweight, themeable where appropriate, and inspectable in source control. Every lecture receives a separate composition; recoloring one generic scene twelve times does not satisfy this requirement. Module-card artwork may use deliberate crops or composite arrangements derived from the three illustrations in that module.

The illustrations are decorative complements to adjacent headings and therefore use empty alternative text unless an image conveys information not present in nearby text. They must remain legible in both themes and at the smallest card crop. No remote image runtime dependency is allowed.

## Visual system

### Color

The initial palette direction is:

- course blue near `#2856a6`;
- deep blue-black ink;
- warm off-white paper;
- coral, sky, mint, and apricot module pastels;
- warm yellow for progress emphasis;
- semantic success, warning, and error colors that remain distinguishable from the module palette.

Final values are adjusted during implementation to satisfy contrast requirements in both themes. The palette uses flat fields rather than gradients.

### Typography

Bundle a Czech-capable geometric sans-serif with the application so rendering is consistent across supported systems. Use a compact heavy weight for headings, a restrained medium weight for labels, and a comfortable editorial line height for body copy. Code uses a separate bundled or system monospace stack.

Typography must remain legible at 320px width, in projector mode, and under browser zoom. Text is never embedded in lecture artwork.

### Shape, depth, and motion

- Square or lightly rounded geometry only.
- No glass effects and no ornamental shadows.
- Borders are used sparingly to separate interactive rows and operational data.
- Spacing follows a consistent base scale and favors whitespace over containers.
- Motion is limited to short state and navigation transitions.
- `prefers-reduced-motion` removes non-essential animation.

## Explicit theme behavior

The first visit always renders the light theme. System color preference must not change the theme.

The masthead exposes an explicit, keyboard-accessible theme control. Activating it changes the current theme and persists `zwa-theme` with a value of `light` or `dark` in `localStorage`. An early document script reads only this saved value before the application becomes visible, preventing a light-to-dark flash for returning users.

If storage is missing, blocked, corrupt, or contains another value, the application uses light mode. A storage write failure may leave the selected theme active for the current page, but it must not prevent navigation or content use.

Theme tokens are selected with a document attribute such as `data-theme`. Automatic `prefers-color-scheme` theme switching and the current `.dark`/media-query duplication are removed. Native form controls receive the appropriate `color-scheme` for the active explicit theme.

Dark mode uses deep navy surfaces, pale warm text, and desaturated versions of the illustration palette. It is designed independently rather than produced by mechanically inverting every light surface.

## Responsive behavior

- The overview uses a two-column module grid at desktop widths and one column on narrow screens.
- Lesson prose remains near 720px; media may extend beyond it when pedagogically useful.
- Exercise stages extend to approximately 1120px and collapse to one deliberate vertical sequence on small screens.
- The outline is always an on-demand drawer, never a permanently compressed sidebar.
- Masthead actions remain reachable without horizontal scrolling.
- Tables use a purposeful mobile treatment: essential columns, controlled horizontal scrolling, or stacked records according to the task.
- All required journeys remain usable at 320px CSS width and at 200% zoom.

## Accessibility

- Preserve semantic landmarks, logical headings, accessible names, and one primary navigation for each context.
- All controls are keyboard-operable and have visible focus that meets contrast requirements.
- Drawer focus management, modal isolation, Escape behavior, and focus restoration are tested.
- Selected, correct, incorrect, loading, and error states never rely on color alone.
- Illustrations do not introduce redundant announcements or embedded text.
- Touch targets are at least 44px where practical.
- Reduced-motion preferences are respected.
- Existing editable-target protections prevent global navigation shortcuts from interfering with exercises.

## State and data flow

`src/config/lessons.js` remains the route and lesson-order authority. Course metadata is expanded only as needed for module association, concise display titles, illustration references, and stable art direction identifiers.

Each presentation route supplies its existing lesson definition, ordered sections, active section ID, and content to the new learning experience. Pure navigation state is extracted from the current visual shell into a non-visual module. The outline, progress strip, hero, and pager derive from the same ordered section data so they cannot disagree.

Exercise stages retain existing lesson-specific editors, documents, validators, runtimes, and test definitions as behavioral inputs. New presentation components own all labels, layout, controls, and state visualization.

Theme state is client-local and independent of authentication. No user profile or server schema is added for theme persistence.

## Failure and empty states

- Unknown lesson section: fall back to the defined first section and normalize the URL.
- Missing or invalid theme value: render light mode.
- Theme persistence failure: retain a usable current page and do not interrupt learning.
- Missing illustration asset: render the lesson's approved flat color field and title region without broken-image chrome.
- Sandbox or static-check failure: contain it within verification, preserve the draft, and identify the failed stage truthfully.
- Authentication expiry: use the existing security behavior and present a newly designed sign-in recovery state.
- API loading, empty, and error states: remain within the relevant operational region and preserve retry or recovery actions already supported by the product.

## Migration strategy constraints

The implementation plan must organize work so the new and old UI are not interleaved indefinitely:

1. establish new tokens, explicit theme bootstrapping, and the independent component tree;
2. create and visually validate all twelve illustrations;
3. migrate the overview and a representative theory lesson;
4. migrate a representative exercise and quiz;
5. migrate the remaining lessons through the validated new contracts;
6. implement new presenter and projector experiences;
7. migrate student, teacher, and attendance surfaces;
8. delete the old UI components, classes, tokens, and automatic-theme behavior;
9. run full behavioral, accessibility, responsive, and visual acceptance.

The implementation plan may split these into smaller verified tasks, but it must not declare success after only the overview or student lesson shell is new.

## Verification and acceptance

### Behavioral verification

- Preserve all twelve public routes and known deep links.
- Preserve invalid-section fallback and URL normalization.
- Preserve lesson keyboard navigation outside editable regions.
- Preserve exercise isolation, validator behavior, timeouts, static checks, and result bounds.
- Preserve student and teacher authentication, progress, grade, attendance, and data exchange behavior.
- Preserve presenter/projector synchronization and private-content exclusion.
- Run the existing unit, API, playground, quality, lint, formatting, type, build, and E2E gates relevant to the changed surfaces.

### New contract verification

- Test explicit theme selection, persistence, first-visit light default, corrupt-value fallback, and absence of automatic system-theme switching.
- Test overview module and lesson ordering.
- Test drawer keyboard behavior and focus restoration.
- Test all new exercise regions and truthful runtime labels.
- Test light and dark theme accessibility states.
- Add a repository scan or quality test proving retired `portal-*` classes and superseded UI imports are absent from active source.
- Verify that twelve distinct lecture illustration assets exist, are locally referenced, contain no embedded raster payloads or text labels, and are used by their intended lessons.

### Visual acceptance matrix

Capture deterministic screenshots and inspect, at minimum:

- overview: desktop light, desktop dark, and mobile light;
- theory lesson: desktop light, desktop dark, and mobile;
- exercise lesson: desktop and mobile;
- quiz state: unanswered and answered;
- student access and progress;
- teacher workspace and attendance;
- presenter and projector;
- representative card and hero crops for all twelve lecture illustrations.

Inspection must check hierarchy, spacing, typography, overflow, responsive composition, illustration cropping, theme consistency, focus visibility, and absence of the retired dashboard/panel language. DOM assertions alone do not establish design completion.

## Non-goals

- No curriculum rewrite or slide-ID renaming.
- No database, API, authentication, grading, attendance, analytics, or sandbox-policy expansion.
- No fabricated course completion, badges, streaks, social features, or server-side draft persistence.
- No copy of Elements of AI artwork, logo, source code, proprietary fonts, or exact brand assets.
- No compatibility layer that keeps the old UI alive after migration.
- No remote image service or runtime dependency for lecture artwork.

## Definition of done

The redesign is complete only when every in-scope surface uses the new architecture; all twelve original lecture illustrations are present and visually verified; explicit persistent theme switching works; behavioral and accessibility gates pass; representative desktop, mobile, presenter, and projector screens have been visually inspected; and the superseded UI components and styles have been removed.
