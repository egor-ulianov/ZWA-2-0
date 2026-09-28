import { useEffect, useMemo, useRef } from 'react';

import styles from '../exercise.module.css';
import {
  buildInspectionDocument,
  buildJavascriptDocument,
  buildStaticDocument,
  sandboxPolicy,
} from './documents.js';
import { createSandboxToken, validatePlaygroundEvent } from './protocol.js';

export default function SandboxFrame({
  html = '',
  css = '',
  mode = 'static',
  code = null,
  stepIndex = 0,
  inspection = [],
  onMessage,
  title = 'Náhled izolovaného playgroundu',
  className = '',
}) {
  const frameRef = useRef(null);
  const inspectionInput = mode === 'inspect' ? inspection : null;
  /* eslint-disable react-hooks/exhaustive-deps -- every iframe input rotates the channel token. */
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
    return buildJavascriptDocument({ code, dom: html, stepIndex, token });
  }, [code, css, html, inspectionInput, mode, stepIndex, token]);

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
      className={[styles.sandboxFrame, className].filter(Boolean).join(' ')}
    />
  );
}
