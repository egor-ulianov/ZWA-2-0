const { CHANNEL, VERSION } = require("./protocol");

const BASE_CSP = [
  "default-src 'none'",
  "base-uri 'none'",
  "connect-src 'none'",
  "frame-ancestors 'none'",
  "child-src 'none'",
  "font-src data:",
  "form-action 'none'",
  "frame-src 'none'",
  "img-src data: blob:",
  "manifest-src 'none'",
  "media-src data: blob:",
  "navigate-to 'none'",
  "object-src 'none'",
  "script-src-attr 'none'",
  "style-src 'unsafe-inline'",
  "worker-src 'none'",
].join("; ");

const MAX_STUDENT_SOURCE_LENGTH = 100000;
const MAX_STUDENT_CODE_LENGTH = 24000;

const FRAME_STYLE = `
  :root { color-scheme: light; font-family: ui-sans-serif, system-ui, sans-serif; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 12px; color: #18181b; background: #fff; }
  img, video { max-width: 100%; }
  button, input, select, textarea { font: inherit; }
`;

function sandboxPolicy(mode) {
  if (mode === "static") return { sandbox: "" };
  if (mode === "inspect" || mode === "javascript") {
    return { sandbox: "allow-scripts" };
  }
  throw new Error(`Unsupported sandbox mode: ${mode}`);
}

function escapeAttribute(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function serializePayload(value) {
  return JSON.stringify(value)
    .replace(/&/g, "\\u0026")
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function escapeStyleText(value) {
  return String(value || "").replace(/<\/(style)/gi, "<\\/$1");
}

function boundedText(value, maxLength = MAX_STUDENT_SOURCE_LENGTH) {
  return String(value == null ? "" : value).slice(0, maxLength);
}

function htmlShell({ csp, head = "", body = "" }) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta http-equiv="Content-Security-Policy" content="${escapeAttribute(csp)}">
  <meta name="referrer" content="no-referrer">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>${FRAME_STYLE}</style>
  ${head}
</head>
<body>${body}</body>
</html>`;
}

function buildStaticDocument({ html = "", css = "" } = {}) {
  return htmlShell({
    csp: `${BASE_CSP}; script-src 'none'`,
    head: `<style>${escapeStyleText(boundedText(css))}</style>`,
    body: boundedText(html),
  });
}

function normalizeInspection(inspection) {
  if (!Array.isArray(inspection)) return [];
  return inspection.slice(0, 16).flatMap((entry) => {
    if (!entry || typeof entry.selector !== "string") return [];
    if (!entry.selector || entry.selector.length > 200) return [];
    const properties = Array.isArray(entry.properties)
      ? entry.properties
          .filter(
            (property) =>
              typeof property === "string" &&
              /^[a-zA-Z][a-zA-Z0-9-]{0,49}$/.test(property)
          )
          .slice(0, 16)
      : [];
    return [{ selector: entry.selector, properties }];
  });
}

const INSPECTION_BOOTSTRAP = String.raw`(() => {
  "use strict";
  const payload = JSON.parse(document.getElementById("zwa-payload").textContent);
  const appendHtml = (mount, html) => {
    const parsed = new DOMParser().parseFromString(String(html || ""), "text/html");
    for (const child of Array.from(parsed.body.childNodes)) {
      mount.appendChild(document.importNode(child, true));
    }
  };
  const send = (type, fields = {}) => parent.postMessage({
    channel: payload.channel,
    version: payload.version,
    token: payload.token,
    type,
    ...fields,
  }, "*");
  try {
    const mount = document.getElementById("zwa-mount");
    appendHtml(mount, payload.html);
    send("ready");
    requestAnimationFrame(() => {
      const elements = payload.inspection.map(({ selector, properties }) => {
        let element = null;
        try { element = mount.querySelector(selector); } catch (_) {}
        const styles = Object.create(null);
        if (element) {
          const computed = getComputedStyle(element);
          for (const property of properties) {
            styles[property] = computed.getPropertyValue(property) || computed[property] || "";
          }
        }
        return { selector, exists: Boolean(element), styles };
      });
      send("result", { value: { kind: "inspection", elements } });
    });
  } catch (error) {
    send("error", { message: String(error && error.message || error).slice(0, 2000) });
  }
})();`;

function buildInspectionDocument({
  html = "",
  css = "",
  inspection = [],
  token,
} = {}) {
  if (!token) throw new Error("A sandbox token is required");
  const payload = serializePayload({
    channel: CHANNEL,
    version: VERSION,
    token,
    html: boundedText(html),
    css: boundedText(css),
    inspection: normalizeInspection(inspection),
  });
  const nonce = escapeAttribute(token);
  return htmlShell({
    csp: `${BASE_CSP}; script-src 'nonce-${nonce}'`,
    head: `<style id="zwa-student-style">${escapeStyleText(boundedText(css))}</style><script id="zwa-payload" type="application/json">${payload}</script>`,
    body: `<div id="zwa-mount"></div><script nonce="${nonce}">${INSPECTION_BOOTSTRAP}</script>`,
  });
}

const JAVASCRIPT_BOOTSTRAP = String.raw`(() => {
  "use strict";
  const payload = JSON.parse(document.getElementById("zwa-payload").textContent);
  const appendHtml = (mount, html) => {
    const parsed = new DOMParser().parseFromString(String(html || ""), "text/html");
    for (const child of Array.from(parsed.body.childNodes)) {
      mount.appendChild(document.importNode(child, true));
    }
  };
  let completed = false;
  const alerts = [];
  let consoleCount = 0;
  const send = (type, fields = {}) => parent.postMessage({
    channel: payload.channel,
    version: payload.version,
    token: payload.token,
    type,
    ...fields,
  }, "*");
  const text = (value) => {
    try {
      if (typeof value === "string") return value.slice(0, 2000);
      const encoded = JSON.stringify(value);
      return (encoded === undefined ? String(value) : encoded).slice(0, 2000);
    } catch (_) {
      return String(value).slice(0, 2000);
    }
  };
  const emitConsole = (level, values) => {
    if (consoleCount >= 100) return;
    consoleCount += 1;
    send("console", { level, text: values.map(text).join(" ").slice(0, 2000) });
  };
  window.console = Object.freeze({
    log: (...values) => emitConsole("log", values),
    warn: (...values) => emitConsole("warn", values),
    error: (...values) => emitConsole("error", values),
  });
  window.alert = (message) => { alerts.push(String(message).slice(0, 2000)); };
  window.confirm = () => false;

  const validate = (exportsObject) => {
    const results = [{ ok: true, text: "Code executed" }];
    const add = (ok, message) => results.push({ ok: Boolean(ok), text: message });
    try {
      if (payload.stepIndex === 0) {
        add(exportsObject.greeting === "Ahoj", "exports.greeting === 'Ahoj'");
        add(typeof exportsObject.double === "function" && exportsObject.double(10) === 20, "exports.double(10) === 20");
      } else if (payload.stepIndex === 1) {
        add(typeof exportsObject.classify === "function" && exportsObject.classify(6) === "even" && exportsObject.classify(7) === "odd", "classify(6) -> even, classify(7) -> odd");
      } else if (payload.stepIndex === 2) {
        add(typeof exportsObject.sumTo === "function" && exportsObject.sumTo(5) === 15, "sumTo(5) === 15");
      } else if (payload.stepIndex === 3) {
        add(typeof exportsObject.total === "function" && exportsObject.total([1, 2, 3]) === 6, "total([1,2,3]) === 6");
      } else if (payload.stepIndex === 4) {
        const element = document.querySelector("#app");
        add(element && String(element.textContent).includes("Hello JS"), "#app has text 'Hello JS'");
      } else if (payload.stepIndex === 5) {
        const button = document.querySelector("#btn");
        const count = document.querySelector("#cnt");
        if (button && count) {
          button.dispatchEvent(new Event("click", { bubbles: true }));
          add(Number(count.textContent || "0") >= 1, "Click increments #cnt");
        } else {
          add(false, "DOM elements #btn/#cnt not found");
        }
      } else if (payload.stepIndex === 6) {
        if (typeof exportsObject.notify === "function") {
          alerts.length = 0;
          exportsObject.notify(true);
          add(alerts.includes("OK"), "notify(true) -> alert('OK')");
          alerts.length = 0;
          exportsObject.notify(false);
          add(alerts.includes("Cancelled"), "notify(false) -> alert('Cancelled')");
        } else {
          add(false, "exports.notify není funkce");
        }
      }
    } catch (error) {
      add(false, "Validation error: " + String(error && error.message || error).slice(0, 500));
    }
    return results;
  };

  window.__zwaComplete = (exportsObject) => {
    if (completed) return;
    completed = true;
    send("result", { value: validate(exportsObject || Object.create(null)) });
  };
  window.__zwaFail = (error) => {
    if (completed) return;
    completed = true;
    send("error", { message: "Runtime error: " + String(error && error.message || error).slice(0, 500) });
  };
  window.addEventListener("error", (event) => {
    event.preventDefault();
    window.__zwaFail(event.error || event.message || "Unknown runtime error");
  });

  try {
    appendHtml(document.getElementById("zwa-mount"), payload.dom);
    send("ready");
    if (payload.code === null) return;
    const script = document.createElement("script");
    script.nonce = payload.token;
    script.textContent = "\"use strict\";\n(() => {\nconst exports = Object.create(null);\ntry {\n" +
      payload.code +
      "\n;window.__zwaComplete(exports);\n} catch (error) { window.__zwaFail(error); }\n})();\n//# sourceURL=playground-student.js";
    document.getElementById("zwa-mount").appendChild(script);
  } catch (error) {
    window.__zwaFail(error);
  }
})();`;

function buildJavascriptDocument({ code = null, dom = "", stepIndex = 0, token } = {}) {
  if (!token) throw new Error("A sandbox token is required");
  const payload = serializePayload({
    channel: CHANNEL,
    version: VERSION,
    token,
    code: code === null ? null : boundedText(code, MAX_STUDENT_CODE_LENGTH),
    dom: boundedText(dom),
    stepIndex: Number.isInteger(stepIndex) ? stepIndex : 0,
  });
  const nonce = escapeAttribute(token);
  return htmlShell({
    csp: `${BASE_CSP}; script-src 'nonce-${nonce}'`,
    head: `<script id="zwa-payload" type="application/json">${payload}</script>`,
    body: `<div id="zwa-mount"></div><script nonce="${nonce}">${JAVASCRIPT_BOOTSTRAP}</script>`,
  });
}

module.exports = {
  sandboxPolicy,
  MAX_STUDENT_SOURCE_LENGTH,
  MAX_STUDENT_CODE_LENGTH,
  buildStaticDocument,
  buildInspectionDocument,
  buildJavascriptDocument,
};
