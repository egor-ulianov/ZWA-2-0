import React, { useEffect, useMemo, useRef } from "react";

const {
  createSandboxToken,
  validatePlaygroundEvent,
} = require("./protocol");
const {
  buildInspectionDocument,
  buildJavascriptDocument,
  buildStaticDocument,
  sandboxPolicy,
} = require("./documents");

export function SandboxedPreview({
  html = "",
  css = "",
  mode = "static",
  code = null,
  stepIndex = 0,
  inspection = [],
  onMessage,
  title = "Sandboxed playground preview",
  className = "w-full min-h-40 rounded-lg border bg-white",
}) {
  const frameRef = useRef(null);
  const inspectionInput = mode === "inspect" ? inspection : null;
  const token = useMemo(() => createSandboxToken(), [
    html,
    css,
    mode,
    code,
    stepIndex,
    inspectionInput,
  ]);
  const policy = sandboxPolicy(mode);
  const document = useMemo(() => {
    if (mode === "static") return buildStaticDocument({ html, css });
    if (mode === "inspect") {
      return buildInspectionDocument({ html, css, inspection, token });
    }
    return buildJavascriptDocument({
      code,
      dom: html,
      stepIndex,
      token,
    });
  }, [html, css, mode, code, stepIndex, inspectionInput, token]);

  useEffect(() => {
    if (mode === "static" || typeof onMessage !== "function") return;
    const receive = (event) => {
      if (event.origin !== "null") return;
      if (event.source !== frameRef.current?.contentWindow) return;
      const message = validatePlaygroundEvent(
        event,
        token,
        frameRef.current?.contentWindow
      );
      if (message) onMessage(message);
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [mode, onMessage, token]);

  return (
    <iframe
      ref={frameRef}
      title={title}
      sandbox={policy.sandbox}
      referrerPolicy="no-referrer"
      srcDoc={document}
      className={className}
    />
  );
}

export default SandboxedPreview;
