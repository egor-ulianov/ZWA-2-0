import React, { useEffect, useMemo, useRef } from 'react';

import { createSandboxToken, validatePlaygroundEvent } from './protocol.js';
import {
  buildInspectionDocument,
  buildJavascriptDocument,
  buildStaticDocument,
  sandboxPolicy,
} from './documents.js';

export function SandboxedPreview({
  html = '',
  css = '',
  mode = 'static',
  code = null,
  stepIndex = 0,
  inspection = [],
  onMessage,
  title = 'Sandboxed playground preview',
  className = 'w-full min-h-40 rounded-lg border bg-white',
}) {
  const frameRef = useRef(null);
  const inspectionInput = mode === 'inspect' ? inspection : null;
  // Rotate the channel token whenever content entering the iframe changes.
  /* eslint-disable react-hooks/exhaustive-deps -- token rotation intentionally follows all iframe inputs. */
  const token = useMemo(
    () => createSandboxToken(),
    [html, css, mode, code, stepIndex, inspectionInput],
  );
  /* eslint-enable react-hooks/exhaustive-deps */
  const policy = sandboxPolicy(mode);
  const document = useMemo(() => {
    if (mode === 'static') return buildStaticDocument({ html, css });
    if (mode === 'inspect') {
      return buildInspectionDocument({ html, css, inspection: inspectionInput || [], token });
    }
    return buildJavascriptDocument({
      code,
      dom: html,
      stepIndex,
      token,
    });
  }, [html, css, mode, code, stepIndex, inspectionInput, token]);

  useEffect(() => {
    if (mode === 'static' || typeof onMessage !== 'function') return;
    const receive = (event) => {
      if (event.origin !== 'null') return;
      if (event.source !== frameRef.current?.contentWindow) return;
      const message = validatePlaygroundEvent(event, token, frameRef.current?.contentWindow);
      if (message) onMessage(message);
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
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
