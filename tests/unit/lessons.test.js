import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import * as catalog from "../../src/config/lessons.js";
import * as navigation from "../../src/components/lesson/navigation.js";

const root = join(fileURLToPath(new URL("../..", import.meta.url)));
const catalogPath = join(root, "src", "config", "lessons.js");
const navigationPath = join(root, "src", "components", "lesson", "navigation.js");

function lessonSourcePath(lesson) {
  return join(root, `${lesson.componentKey}.jsx`);
}

function loadCatalog() {
  assert.ok(existsSync(catalogPath), "src/config/lessons.js must exist");
  return catalog;
}

function loadNavigation() {
  assert.ok(existsSync(navigationPath), "src/components/lesson/navigation.js must exist");
  return navigation;
}

test("lesson catalog preserves all twelve ordered public routes", () => {
  const { lessons } = loadCatalog();
  const expectedHrefs = [
    "/interactive-zwa-1-html5",
    "/interactive-zwa-2-forms",
    "/interactive-zwa-1/",
    "/interactive-zwa-2",
    "/interactive-zwa-5-css-ii",
    "/interactive-zwa-5-js",
    "/interactive-zwa-7",
    "/interactive-zwa-8-php",
    "/interactive-zwa-9",
    "/interactive-zwa-10-sessions-cookies",
    "/interactive-zwa-11-files-json",
    "/interactive-zwa-12-auth",
  ];

  assert.equal(lessons.length, 12);
  assert.deepEqual(lessons.map((lesson) => lesson.number), Array.from({ length: 12 }, (_, i) => i + 1));
  assert.deepEqual(lessons.map((lesson) => lesson.href), expectedHrefs);
  for (const key of ["number", "slug", "title", "href", "componentKey"]) {
    assert.ok(lessons.every((lesson) => typeof lesson[key] === "string" || typeof lesson[key] === "number"), key);
  }
  for (const key of ["number", "slug", "href", "componentKey"]) {
    assert.equal(new Set(lessons.map((lesson) => lesson[key])).size, lessons.length, key);
  }
});

test("lesson catalog lookup helpers reject unknown lessons", () => {
  const { getLessonByNumber, getLessonBySlug, lessons } = loadCatalog();
  assert.equal(getLessonByNumber(3).href, "/interactive-zwa-1/");
  assert.equal(getLessonBySlug(lessons[6].slug).number, 7);
  assert.equal(getLessonByNumber(0), undefined);
  assert.equal(getLessonByNumber("3"), undefined);
  assert.equal(getLessonBySlug("missing-lesson"), undefined);
});

test("slide deep links accept only known query or hash IDs", () => {
  const { buildSlideUrl, getScrollBehavior, resolveSlideId } = loadNavigation();
  const slides = [{ id: "title" }, { id: "tasks" }, { id: "summary" }];

  assert.equal(resolveSlideId(slides, { search: "?slide=tasks", hash: "" }), "tasks");
  assert.equal(resolveSlideId(slides, { search: "", hash: "#summary" }), "summary");
  assert.equal(resolveSlideId(slides, { search: "?slide=unknown", hash: "#also-unknown" }), "title");
  assert.equal(resolveSlideId([], { search: "?slide=tasks", hash: "#summary" }), undefined);
  assert.equal(
    buildSlideUrl({ pathname: "/lesson", search: "?mode=student", hash: "#old" }, "tasks"),
    "/lesson?mode=student&slide=tasks"
  );
  assert.equal(getScrollBehavior(true), "auto");
  assert.equal(getScrollBehavior(false), "smooth");
});

test("every catalog route has a checked-in lesson wrapper", () => {
  const { lessons } = loadCatalog();
  for (const lesson of lessons) {
    const wrapperPath = lesson.href === "/interactive-zwa-1/"
      ? join(root, "pages", "interactive-zwa-1", "index.jsx")
      : join(root, "pages", `${lesson.href.slice(1)}.jsx`);
    assert.ok(existsSync(wrapperPath), `${lesson.href} -> ${wrapperPath}`);
  }
});

test("every catalog lesson uses the shared shell and navigation contract", () => {
  const { lessons } = loadCatalog();

  for (const lesson of lessons) {
    const sourcePath = lessonSourcePath(lesson);
    assert.ok(existsSync(sourcePath), `${lesson.componentKey} source must exist`);
    const source = readFileSync(sourcePath, "utf8");
    assert.match(source, /LessonShell/, lesson.componentKey);
    assert.match(source, /useSlideNavigation/, lesson.componentKey);
    assert.match(source, /<LessonShell\b/, lesson.componentKey);
    assert.match(source, /useSlideNavigation\(slides\)/, lesson.componentKey);
  }
});

test("playground lessons keep their isolated execution adapters", () => {
  const playgroundComponents = [
    "interactive_zwa_1_html5_presentation",
    "interactive_zwa_2_forms_presentation",
    "interactive_zwa_2_css_presentation",
    "interactive_zwa_5_css2_presentation",
    "interactive_zwa_5_javascript_presentation",
  ];

  for (const componentKey of playgroundComponents) {
    const source = readFileSync(join(root, `${componentKey}.jsx`), "utf8");
    assert.match(source, /src\/components\/playground\/(?:SandboxedPreview|JsSandbox)/, componentKey);
    assert.doesNotMatch(source, /new Function\s*\(/, componentKey);
  }
});
