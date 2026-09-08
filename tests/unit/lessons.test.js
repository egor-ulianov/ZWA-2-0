const assert = require("node:assert/strict");
const { existsSync } = require("node:fs");
const { join } = require("node:path");
const test = require("node:test");

const root = join(__dirname, "..", "..");
const catalogPath = join(root, "src", "config", "lessons.js");
const navigationPath = join(root, "src", "components", "lesson", "navigation.js");

function loadCatalog() {
  assert.ok(existsSync(catalogPath), "src/config/lessons.js must exist");
  return require(catalogPath);
}

function loadNavigation() {
  assert.ok(existsSync(navigationPath), "src/components/lesson/navigation.js must exist");
  return require(navigationPath);
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
  const { resolveSlideId } = loadNavigation();
  const slides = [{ id: "title" }, { id: "tasks" }, { id: "summary" }];

  assert.equal(resolveSlideId(slides, { search: "?slide=tasks", hash: "" }), "tasks");
  assert.equal(resolveSlideId(slides, { search: "", hash: "#summary" }), "summary");
  assert.equal(resolveSlideId(slides, { search: "?slide=unknown", hash: "#also-unknown" }), "title");
  assert.equal(resolveSlideId([], { search: "?slide=tasks", hash: "#summary" }), undefined);
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
