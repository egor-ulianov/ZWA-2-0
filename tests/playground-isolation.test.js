const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const test = require("node:test");

const root = join(__dirname, "..");
const lessonFiles = [
  "interactive_zwa_1_html5_presentation.jsx",
  "interactive_zwa_2_css_presentation.jsx",
  "interactive_zwa_2_forms_presentation.jsx",
  "interactive_zwa_5_css2_presentation.jsx",
  "interactive_zwa_5_javascript_presentation.jsx",
];

const hostilePayload = [
  "<script>",
  "parent.document.body.dataset.playgroundPwned = 'yes';",
  "void document.cookie;",
  "void localStorage.secret;",
  "fetch('/api/attendance', { method: 'POST', body: 'owned' });",
  "parent.postMessage({ type: 'unknown', value: 'owned' }, '*');",
  "</script>",
  "<form action='/api/attendance' method='post'><button>submit</button></form>",
].join("");

function lessonSources() {
  return lessonFiles.map((file) => ({
    file,
    source: readFileSync(join(root, file), "utf8"),
  }));
}

test("student JavaScript is never evaluated by a lesson in the host page", () => {
  for (const { file, source } of lessonSources()) {
    assert.doesNotMatch(source, /\bnew\s+Function\s*\(/, file);
    assert.doesNotMatch(source, /(?:^|[^.\w])eval\s*\(/m, file);
  }
});

test("student HTML and CSS are never mounted into a host-page DOM node", () => {
  for (const { file, source } of lessonSources()) {
    assert.doesNotMatch(
      source,
      /\.innerHTML\s*=/,
      file
    );
    assert.doesNotMatch(source, /dangerouslySetInnerHTML/, file);
    assert.doesNotMatch(source, /document\.head\s*\./, file);
  }
});

test("sandbox policy never grants student content same-origin, forms, or navigation privileges", () => {
  const documentsPath = join(
    root,
    "src/components/playground/documents.js"
  );
  assert.doesNotThrow(() => require(documentsPath));
  const { sandboxPolicy } = require(documentsPath);

  assert.deepEqual(sandboxPolicy("static"), { sandbox: "" });
  assert.deepEqual(sandboxPolicy("inspect"), { sandbox: "allow-scripts" });
  assert.deepEqual(sandboxPolicy("javascript"), { sandbox: "allow-scripts" });
});

test("static hostile HTML is framed by a no-script, no-network, no-form CSP", () => {
  const { buildStaticDocument } = require(
    join(root, "src/components/playground/documents.js")
  );
  const document = buildStaticDocument({
    html: hostilePayload,
    css: "</style><script>parent.document.body.remove()</script>",
  });

  assert.match(document, /default-src 'none'/);
  assert.match(document, /script-src 'none'/);
  assert.match(document, /connect-src 'none'/);
  assert.match(document, /form-action 'none'/);
  assert.match(document, /navigate-to 'none'/);
  assert.match(document, /style-src 'unsafe-inline'/);
  assert.doesNotMatch(document, /<style><\/style><script>/i);
});

test("script sandbox serializes hostile code as inert data before isolated execution", () => {
  const { buildJavascriptDocument } = require(
    join(root, "src/components/playground/documents.js")
  );
  const document = buildJavascriptDocument({
    code: hostilePayload,
    dom: hostilePayload,
    stepIndex: 0,
    token: "test-token",
  });

  assert.match(document, /default-src 'none'/);
  assert.match(document, /connect-src 'none'/);
  assert.match(document, /form-action 'none'/);
  assert.doesNotMatch(document, new RegExp(hostilePayload.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(document, /\\u003cscript\\u003e/i);
});

test("protocol accepts only bounded messages for the active sandbox token", () => {
  const protocolPath = join(root, "src/components/playground/protocol.js");
  assert.doesNotThrow(() => require(protocolPath));
  const {
    CHANNEL,
    VERSION,
    validatePlaygroundEvent,
    validatePlaygroundMessage,
  } = require(protocolPath);
  const base = { channel: CHANNEL, version: VERSION, token: "active-token" };

  assert.deepEqual(
    validatePlaygroundMessage({ ...base, type: "ready" }, "active-token"),
    { ...base, type: "ready" }
  );
  assert.deepEqual(
    validatePlaygroundMessage(
      { ...base, type: "console", level: "warn", text: "careful" },
      "active-token"
    ),
    { ...base, type: "console", level: "warn", text: "careful" }
  );
  assert.deepEqual(
    validatePlaygroundMessage(
      { ...base, type: "result", value: [{ ok: true, text: "done" }] },
      "active-token"
    ),
    { ...base, type: "result", value: [{ ok: true, text: "done" }] }
  );
  assert.deepEqual(
    validatePlaygroundMessage(
      { ...base, type: "error", message: "failed" },
      "active-token"
    ),
    { ...base, type: "error", message: "failed" }
  );

  assert.equal(
    validatePlaygroundMessage({ ...base, type: "unknown" }, "active-token"),
    null
  );
  assert.equal(
    validatePlaygroundMessage({ ...base, type: "ready" }, "stale-token"),
    null
  );
  assert.equal(
    validatePlaygroundMessage(
      { ...base, type: "console", level: "log", text: "x".repeat(2001) },
      "active-token"
    ),
    null
  );
  assert.equal(
    validatePlaygroundMessage({ ...base, type: "ready", unexpected: true }, "active-token"),
    null
  );

  const frameWindow = {};
  assert.deepEqual(
    validatePlaygroundEvent(
      { source: frameWindow, origin: "null", data: { ...base, type: "ready" } },
      "active-token",
      frameWindow
    ),
    { ...base, type: "ready" }
  );
  assert.equal(
    validatePlaygroundEvent(
      { source: frameWindow, origin: "https://example.test", data: { ...base, type: "ready" } },
      "active-token",
      frameWindow
    ),
    null
  );
  assert.equal(
    validatePlaygroundEvent(
      { source: {}, origin: "null", data: { ...base, type: "ready" } },
      "active-token",
      frameWindow
    ),
    null
  );
});

test("preview components enforce iframe, source-window, protocol, and timeout boundaries", () => {
  const previewPath = join(
    root,
    "src/components/playground/SandboxedPreview.jsx"
  );
  const jsSandboxPath = join(root, "src/components/playground/JsSandbox.jsx");
  const preview = readFileSync(previewPath, "utf8");
  const jsSandbox = readFileSync(jsSandboxPath, "utf8");
  const documents = readFileSync(
    join(root, "src/components/playground/documents.js"),
    "utf8"
  );

  assert.match(preview, /<iframe\b/);
  assert.match(preview, /srcDoc=/);
  assert.match(preview, /event\.source\s*!==\s*frameRef\.current\?\.contentWindow/);
  assert.match(preview, /event\.origin\s*!==\s*["']null["']/);
  assert.match(preview, /validatePlaygroundEvent\(\s*event,\s*token,/);
  assert.doesNotMatch(preview, /allow-same-origin|allow-forms|allow-top-navigation/);
  assert.doesNotMatch(documents, /document\.(head|body)\.appendChild/);

  assert.match(jsSandbox, /EXECUTION_TIMEOUT_MS\s*=\s*\d+/);
  assert.match(jsSandbox, /setTimeout\(/);
  assert.match(jsSandbox, /mode="static"/);
  assert.match(jsSandbox, /clearTimeout\(/);
  assert.match(jsSandbox, /key=\{executionKey\}/);
});

test("CSS validators preserve task outcomes from serialized iframe styles", () => {
  const validatorsPath = join(
    root,
    "src/components/playground/validators.js"
  );
  assert.doesNotThrow(() => require(validatorsPath));
  const { validateCssBasics, validateCssLayout } = require(validatorsPath);
  const inspection = {
    kind: "inspection",
    elements: [
      {
        selector: "#title",
        exists: true,
        styles: { color: "rgb(29, 78, 216)", "font-size": "36px" },
      },
      {
        selector: "footer a",
        exists: true,
        styles: {
          color: "rgb(37, 99, 235)",
          "font-family": "Georgia, serif",
        },
      },
      {
        selector: "ol.submenu",
        exists: true,
        styles: { "list-style-type": "lower-alpha" },
      },
      {
        selector: "#site-header",
        exists: true,
        styles: { display: "flex", "padding-top": "8px" },
      },
    ],
  };
  const css = [
    "footer a { font-family: Georgia, serif; color: #2563eb; }",
    "footer a:visited { color: #2563eb; }",
    "p.excerpt::first-letter { font-size: 200%; background: #fef08a; }",
    ".hero img:hover { transform: scale(1.05); transition: transform 100ms; }",
  ].join("\n");

  assert.deepEqual(
    validateCssBasics({
      slideId: "tasks",
      stepIndex: 0,
      inspection,
      htmlCode: "",
      cssCode: css,
    }),
    [
      { ok: true, text: "Task 1: h1 is blue and 36px" },
      { ok: true, text: "Task 2: footer links styled incl. visited" },
      { ok: true, text: "Task 3: first-letter styled" },
      { ok: true, text: "Task 4: submenu uses lower-alpha" },
      { ok: true, text: "Task 5: hover transform + transition" },
    ]
  );
  assert.deepEqual(
    validateCssLayout({
      stepIndex: 4,
      inspection,
      htmlCode: "",
      cssCode: "#site-header button { margin-left: auto; }",
    }),
    [
      { ok: true, text: "#site-header uses display:flex" },
      { ok: true, text: "#site-header button has margin-left:auto" },
    ]
  );
});
