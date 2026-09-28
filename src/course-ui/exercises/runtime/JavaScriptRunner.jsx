import { useCallback, useEffect, useRef, useState } from 'react';

import styles from '../exercise.module.css';
import SandboxFrame from './SandboxFrame.jsx';

export const EXECUTION_TIMEOUT_MS = 1500;

export default function JavaScriptRunner({
  code = null,
  dom = '',
  stepIndex = 0,
  onResult,
  onReady,
  onConsole,
  resetKey = 0,
  title = 'Izolovaný JavaScript playground',
  className = '',
}) {
  const [finished, setFinished] = useState(code === null);
  const [timedOut, setTimedOut] = useState(false);
  const [executionKey, setExecutionKey] = useState(0);
  const activeRunRef = useRef(false);
  const onResultRef = useRef(onResult);
  const onReadyRef = useRef(onReady);
  const onConsoleRef = useRef(onConsole);

  useEffect(() => {
    onResultRef.current = onResult;
    onReadyRef.current = onReady;
    onConsoleRef.current = onConsole;
  }, [onConsole, onReady, onResult]);

  /* eslint-disable react-hooks/set-state-in-effect -- this effect establishes a fresh sandbox run. */
  useEffect(() => {
    activeRunRef.current = code !== null;
    setFinished(code === null);
    setTimedOut(false);
    setExecutionKey((key) => key + 1);
  }, [code, dom, resetKey, stepIndex]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (code === null || finished || timedOut) return;
    const timeout = setTimeout(() => {
      if (!activeRunRef.current) return;
      activeRunRef.current = false;
      setTimedOut(true);
      setFinished(true);
      onResultRef.current?.([
        {
          ok: false,
          text: `Chyba běhu: běh překročil časový limit ${EXECUTION_TIMEOUT_MS} ms`,
        },
      ]);
    }, EXECUTION_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, [code, executionKey, finished, timedOut]);

  const handleMessage = useCallback((message) => {
    if (!activeRunRef.current) return;
    if (message.type === 'ready') {
      onReadyRef.current?.();
      return;
    }
    if (message.type === 'console') {
      onConsoleRef.current?.({ type: message.level, text: message.text });
      return;
    }
    if (message.type === 'result') {
      activeRunRef.current = false;
      setFinished(true);
      onResultRef.current?.(message.value);
      return;
    }
    if (message.type === 'error') {
      activeRunRef.current = false;
      setFinished(true);
      onResultRef.current?.([{ ok: false, text: message.message }]);
    }
  }, []);

  if (timedOut) {
    return (
      <div>
        <SandboxFrame
          key={executionKey}
          html={dom}
          mode="static"
          title={title}
          className={className}
        />
        <p className={styles.timeout} role="status">
          × Nesplněno — běh byl ukončen po překročení časového limitu.
        </p>
      </div>
    );
  }

  return code === null ? (
    <SandboxFrame key={executionKey} html={dom} mode="static" title={title} className={className} />
  ) : (
    <SandboxFrame
      key={executionKey}
      html={dom}
      mode="javascript"
      code={code}
      stepIndex={stepIndex}
      onMessage={handleMessage}
      title={title}
      className={className}
    />
  );
}
