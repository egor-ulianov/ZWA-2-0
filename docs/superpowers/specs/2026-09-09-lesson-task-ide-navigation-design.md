# Lesson Task IDE and Navigation Design

## Goal

Make every ZWA practical exercise predictable: students navigate to an individual task from the single left course outline, edit named files in an IDE-style panel, and can deliberately open a reference solution in the same panel. Every lesson also offers a clear return to the course catalogue.

## Decisions

### One outline, individual task entries

- `Osnova kurzu` remains the only student-mode navigation.
- Each independently completable task is a first-class outline item with a stable slide ID. A lesson may retain its existing aggregate `tasks` deep link as an alias that opens its first task, but no task picker, dots, or previous/next controls remain outside the outline.
- A task never appears both as an outline item and as an in-IDE task selector. File and solution tabs are IDE controls, not lesson navigation.
- Existing theory slides remain theory. In particular, HTML5 lesson `Sekce` becomes a readable theory page: remove its nested `Teorie`, `Příklady`, `Vyzkoušet`, and `Úkol` tabs and their editors. The same rule applies to every remaining theory slide with embedded task/reveal navigation.

### Shared IDE model

Every `Plocha úkolu` still has `Zadání`, `IDE`, and `Náhled a testy`. The IDE has one horizontal tab strip:

1. One tab per student file, for example `index.html`, `style.css`, `main.js`, or `task.php`.
2. A final `Řešení` tab, visually distinct and read-only.

The active student-file tab renders the existing local syntax-aware editor or a deterministic terminal. The `Řešení` tab renders a local, read-only syntax-aware editor and never mutates the student draft. Its source is the course's existing solution/reveal where one exists; otherwise it is a complete reference implementation matching that task's stated acceptance criteria. File tabs and solution tabs use keyboard semantics and do not invoke global slide navigation.

### Runtime and safety rules

- Preserve current sandbox, validator, terminal simulation, static-check, and projector privacy boundaries. Do not create PHP/server execution or real networking.
- Reference solutions are explanatory source only. Opening one does not run it and does not alter test results.
- All labels and accessible names are Czech. Drafts remain in-browser session state only.

### Course-wide application

| Lessons | Individual outline tasks | Student file tabs | Reference tab source |
| --- | --- | --- | --- |
| 01 HTML5 | document skeleton, semantic structure, media/table | `index.html` | existing task requirements completed as valid HTML |
| 02 Forms | standard controls, grouping, attributes, inputs, meter/progress, datalist | `index.html` | existing form examples and requirements |
| 03 Network | one item per terminal scenario/checklist | `terminál` | deterministic command sequence and expected output |
| 04 CSS | one item per existing CSS step | `index.html`, `style.css` | current checked HTML/CSS templates |
| 05 CSS II | one item per existing CSS II step | `index.html`, `style.css` | current checked templates |
| 06 JavaScript | one item per current JavaScript step | `main.js` and DOM fixture when applicable | current passing export/DOM implementation |
| 07 Classes/AJAX | existing task 1 and task 2 entries | all required HTML/JS fixture files | existing locked solutions |
| 08 PHP | existing eight task entries | `task.php` | existing locked solutions |
| 09–12 PHP topics | split aggregate task slides into individual outline entries | task-specific PHP/HTML files | existing locked solutions or completed equivalent source |

### Catalogue return

`LessonShell` renders a visible `← Zpět na přehled lekcí` link above the lesson title in student and presenter modes. It targets `/`, preserves keyboard focus styling, and is omitted from projector mode.

## Non-goals

- No change to course content, security model, live runtime capability, grading, persistence, or URL routing outside additive individual-task slide IDs and aggregate-task aliases.
- No external editor CDN or newly introduced runtime dependency.

## Acceptance checks

- Every task is reachable from `Osnova kurzu`; no practical task requires a secondary selector outside file/solution tabs.
- Every task has at least one student file tab and exactly one final, read-only `Řešení` tab.
- No reference solution is displayed above or below the student input.
- HTML5 `Sekce` and analogous theory pages show learning content only, with no nested exercise navigation or live editors.
- Lesson 03 has no legacy task sidebar; its terminal tasks are outline entries and use the unified workspace.
- Lesson 04 does not render a live editor on non-task slides.
- Every student/presenter lesson has the catalogue return link; projector mode does not.
- Existing test suite, sandbox isolation tests, deep links, 320px layout, and projector redaction remain green.
