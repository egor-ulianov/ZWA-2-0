import React, { useCallback, useEffect, useRef, useState } from 'react';
import SandboxedPreview from './SandboxedPreview';

export const EXECUTION_TIMEOUT_MS = 1500;

export function JsSandbox({
  code = null,
  dom = '',
  stepIndex = 0,
  onResult,
  onConsole,
  resetKey = 0,
  title = 'Isolated JavaScript playground',
  className = 'w-full min-h-[160px] rounded-xl border bg-white',
}) {
  const [finished, setFinished] = useState(code === null);
  const [timedOut, setTimedOut] = useState(false);
  const [executionKey, setExecutionKey] = useState(0);
  const activeRunRef = useRef(false);
  const onResultRef = useRef(onResult);
  const onConsoleRef = useRef(onConsole);

  useEffect(() => {
    onResultRef.current = onResult;
    onConsoleRef.current = onConsole;
  }, [onConsole, onResult]);

  // A new execution must reset the iframe lifecycle state before it starts.
  /* eslint-disable react-hooks/set-state-in-effect -- this effect is the sandbox run boundary. */
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
      const result = [
        {
          ok: false,
          text: `Runtime error: execution exceeded ${EXECUTION_TIMEOUT_MS} ms`,
        },
      ];
      setTimedOut(true);
      setFinished(true);
      onResultRef.current?.(result);
    }, EXECUTION_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, [code, executionKey, finished, timedOut]);

  const handleMessage = useCallback((message) => {
    if (!activeRunRef.current) return;
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
        <SandboxedPreview
          key={executionKey}
          html={dom}
          mode="static"
          title={title}
          className={className}
        />
        <div className="mt-1 text-xs text-rose-600" role="status">
          Běh byl ukončen po překročení časového limitu.
        </div>
      </div>
    );
  }

  return code === null ? (
    <SandboxedPreview
      key={executionKey}
      html={dom}
      mode="static"
      title={title}
      className={className}
    />
  ) : (
    <SandboxedPreview
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

export default JsSandbox;
