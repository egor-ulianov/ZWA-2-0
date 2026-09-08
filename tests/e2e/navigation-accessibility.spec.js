const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const test = require("node:test");

const root = join(__dirname, "..", "..");
const read = (path) => readFileSync(join(root, path), "utf8");

test("shared lesson navigation exposes semantic tabs and keyboard movement", () => {
  const navigation = read("src/components/lesson/SlideNavigation.jsx");
  assert.match(navigation, /role="tablist"/);
  assert.match(navigation, /role="tab"/);
  assert.match(navigation, /aria-selected/);
  assert.match(navigation, /aria-controls/);
  assert.match(navigation, /aria-current/);
  assert.match(navigation, /tabIndex/);
  assert.match(navigation, /ArrowLeft/);
  assert.match(navigation, /ArrowRight/);
  assert.match(navigation, /ArrowUp/);
  assert.match(navigation, /ArrowDown/);
  assert.match(navigation, /Home/);
  assert.match(navigation, /End/);
  assert.match(navigation, /\.focus\(\)/);
});

test("lesson shell and slide card support validated deep links and focus context", () => {
  const shell = read("src/components/lesson/LessonShell.jsx");
  const card = read("src/components/lesson/SlideCard.jsx");
  const home = read("pages/index.jsx");

  assert.match(shell, /resolveSlideId/);
  assert.match(shell, /history\.replaceState/);
  assert.match(shell, /window\.location/);
  assert.match(card, /role="tabpanel"/);
  assert.match(card, /tabIndex=\{-1\}/);
  assert.match(card, /\.focus\(/);
  assert.match(home, /lessons\.map/);
  assert.doesNotMatch(home, /href="\/interactive-zwa-/);
});

test("lesson sources contain no machine-specific file links", () => {
  const lessonFiles = [
    "interactive_zwa_1_web_presentation_with_simulated_linux_cli.jsx",
    "interactive_zwa_7_classes_ajax_presentation.jsx",
    "interactive_zwa_8_php_presentation.jsx",
    "interactive_zwa_9_forms_crud_presentation.jsx",
    "interactive_zwa_10_sessions_cookies_presentation.jsx",
    "interactive_zwa_11_files_json_presentation.jsx",
    "interactive_zwa_12_auth_presentation.jsx",
  ];
  for (const file of lessonFiles) {
    assert.doesNotMatch(read(file), /file:\/\//, file);
  }
});

test("route wrappers retain dynamic client-only lesson loading", () => {
  const wrappers = [
    "pages/interactive-zwa-1-html5.jsx",
    "pages/interactive-zwa-2-forms.jsx",
    "pages/interactive-zwa-1/index.jsx",
    "pages/interactive-zwa-2.jsx",
    "pages/interactive-zwa-5-css-ii.jsx",
    "pages/interactive-zwa-5-js.jsx",
    "pages/interactive-zwa-7.jsx",
    "pages/interactive-zwa-8-php.jsx",
    "pages/interactive-zwa-9.jsx",
    "pages/interactive-zwa-10-sessions-cookies.jsx",
    "pages/interactive-zwa-11-files-json.jsx",
    "pages/interactive-zwa-12-auth.jsx",
  ];
  for (const file of wrappers) {
    const source = read(file);
    assert.match(source, /dynamic\(/, file);
    assert.match(source, /ssr:\s*false/, file);
  }
});
