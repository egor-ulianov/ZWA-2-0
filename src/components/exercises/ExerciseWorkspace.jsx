import React, { isValidElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { MAX_EXERCISE_SOURCE_LENGTH, runExerciseTests } from './testRunner.js';

function normalizeFiles(files) {
  if (Array.isArray(files)) return files;
  if (!files || typeof files !== 'object') return [];
  return Object.entries(files).map(([name, source]) => ({ name, source }));
}

function fileId(file, index) {
  if (typeof file === 'string') return `file-${index + 1}`;
  return String(file?.id || file?.name || `file-${index + 1}`);
}

function fileName(file, index) {
  if (typeof file === 'string') return `file-${index + 1}`;
  return String(file?.name || file?.id || `file-${index + 1}`);
}

function fileSource(file) {
  if (typeof file === 'string') return file;
  return String(file?.source ?? file?.content ?? file?.code ?? '');
}

function normalizedFileList(files) {
  return normalizeFiles(files).map((file, index) => ({
    id: fileId(file, index),
    name: fileName(file, index),
    language: typeof file === 'object' && file?.language ? file.language : 'text',
    source: fileSource(file).slice(0, MAX_EXERCISE_SOURCE_LENGTH),
  }));
}

function initialFileId(files, activeFile) {
  if (typeof activeFile === 'number') return files[activeFile]?.id || files[0]?.id || '';
  if (activeFile && typeof activeFile === 'object') {
    return String(activeFile.id || activeFile.name || files[0]?.id || '');
  }
  return String(activeFile || files[0]?.id || '');
}

export function ExerciseWorkspace({
  files = [],
  activeFile,
  onChangeFile,
  onRun,
  preview = null,
  testDefinition,
}) {
  const normalizedFiles = useMemo(() => normalizedFileList(files), [files]);
  const resolvedActiveFile = useMemo(
    () => initialFileId(normalizedFiles, activeFile),
    [activeFile, normalizedFiles],
  );
  const fileSignature = useMemo(
    () =>
      normalizedFiles
        .map(
          ({ id, name, language, source }) => `${id}\u0000${name}\u0000${language}\u0000${source}`,
        )
        .join('\u0001'),
    [normalizedFiles],
  );
  const [selectedFile, setSelectedFile] = useState(resolvedActiveFile);
  const [sources, setSources] = useState(() =>
    Object.fromEntries(normalizedFiles.map((file) => [file.id, file.source])),
  );
  const [runNumber, setRunNumber] = useState(0);
  const [hasRun, setHasRun] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const runSourceRef = useRef('');

  // A changed exercise definition or file set starts a fresh browser-session draft.
  /* eslint-disable react-hooks/set-state-in-effect -- exercise changes define a new session draft. */
  /* eslint-disable react-hooks/exhaustive-deps -- fileSignature captures normalized file content. */
  useEffect(() => {
    setSelectedFile(resolvedActiveFile);
    setSources(Object.fromEntries(normalizedFiles.map((file) => [file.id, file.source])));
    setHasRun(false);
    setTestResults([]);
  }, [fileSignature, resolvedActiveFile, testDefinition?.id]);
  /* eslint-enable react-hooks/exhaustive-deps */
  /* eslint-enable react-hooks/set-state-in-effect */

  const currentFile =
    normalizedFiles.find((file) => file.id === selectedFile) || normalizedFiles[0] || null;
  const currentFileId = currentFile?.id || '';
  const source = sources[currentFileId] ?? currentFile?.source ?? '';

  const handleSourceChange = useCallback(
    (event) => {
      const nextSource = String(event.target.value || '').slice(0, MAX_EXERCISE_SOURCE_LENGTH);
      setSources((current) => ({ ...current, [currentFileId]: nextSource }));
      setHasRun(false);
      setTestResults([]);
      onChangeFile?.(currentFileId, nextSource);
    },
    [currentFileId, onChangeFile],
  );

  const handleFileChange = useCallback(
    (nextFileId) => {
      setSelectedFile(nextFileId);
      setHasRun(false);
      setTestResults([]);
      onChangeFile?.(nextFileId, sources[nextFileId] || '');
    },
    [onChangeFile, sources],
  );

  const handlePreviewResult = useCallback(
    (result) => {
      setTestResults(
        runExerciseTests(testDefinition, {
          source: runSourceRef.current,
          result,
        }),
      );
    },
    [testDefinition],
  );

  const handleRunTests = useCallback(() => {
    runSourceRef.current = source;
    onRun?.();
    setHasRun(true);
    setTestResults([]);
    setRunNumber((current) => current + 1);
  }, [onRun, source]);

  let renderedPreview = preview;
  if (typeof preview === 'function') {
    renderedPreview = preview({ source: hasRun ? source : null, runNumber });
  } else if (isValidElement(preview)) {
    const previousOnResult = preview.props.onResult;
    const previousOnReady = preview.props.onReady;
    renderedPreview = React.createElement(preview.type, {
      ...preview.props,
      key: `exercise-preview-${runNumber}`,
      code: hasRun ? source : null,
      onReady: (...args) => {
        previousOnReady?.(...args);
      },
      onResult: (result) => {
        previousOnResult?.(result);
        handlePreviewResult(result);
      },
    });
  }

  return (
    <section
      data-projector-private="exercise-workspace"
      className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
      aria-label={testDefinition?.label || 'Exercise workspace'}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/70 px-4 py-3 dark:border-zinc-800">
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {testDefinition?.label || 'Build exercise'}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">In this browser session</p>
        </div>
        <button
          type="button"
          className="rounded-lg bg-indigo-700 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={handleRunTests}
          disabled={!currentFile}
        >
          Run tests
        </button>
      </div>

      <div className="grid min-w-0 grid-cols-1 lg:grid-cols-[minmax(12rem,15rem)_minmax(0,1fr)]">
        <div className="min-w-0 border-b border-zinc-200/70 dark:border-zinc-800 lg:border-b-0 lg:border-r">
          <div className="border-b border-zinc-200/70 px-4 py-3 dark:border-zinc-800">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Files
            </p>
            <div className="mt-2 flex flex-wrap gap-1" role="tablist" aria-label="Source files">
              {normalizedFiles.map((file) => (
                <button
                  key={file.id}
                  type="button"
                  role="tab"
                  aria-selected={file.id === currentFileId}
                  className="rounded-md px-2 py-1 text-left text-xs font-medium text-zinc-700 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 aria-selected:bg-indigo-50 aria-selected:text-indigo-800 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:aria-selected:bg-indigo-950/50 dark:aria-selected:text-indigo-200"
                  onClick={() => handleFileChange(file.id)}
                >
                  {file.name}
                </button>
              ))}
            </div>
          </div>
          {currentFile ? (
            <label className="block p-4">
              <span className="sr-only">{currentFile.name} source editor</span>
              <textarea
                value={source}
                onChange={handleSourceChange}
                spellCheck={false}
                maxLength={MAX_EXERCISE_SOURCE_LENGTH}
                aria-label={`${currentFile.name} source editor`}
                className="min-h-[320px] w-full resize-y rounded-lg border border-zinc-300 bg-zinc-950 p-3 font-mono text-xs leading-5 text-zinc-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700"
              />
            </label>
          ) : (
            <p className="p-4 text-sm text-zinc-500">No source file selected.</p>
          )}
        </div>

        <div className="min-w-0 p-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Preview</h3>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Session-only edits</span>
          </div>
          <div className="min-w-0">{renderedPreview}</div>

          <section
            className="mt-4 rounded-xl border border-zinc-200/70 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/60"
            aria-label="Test results"
            aria-live="polite"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Test results
              </h3>
              {testDefinition?.hint && (
                <span className="text-right text-xs text-zinc-500 dark:text-zinc-400">
                  {testDefinition.hint}
                </span>
              )}
            </div>
            {testResults.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                Run tests to check this requirement.
              </p>
            ) : (
              <ul className="mt-2 space-y-1.5 text-sm">
                {testResults.map((result, index) => (
                  <li
                    key={`${result.id}-${index}`}
                    className={
                      result.ok
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-rose-700 dark:text-rose-400'
                    }
                  >
                    <span aria-hidden="true">{result.ok ? '✓' : '×'}</span>{' '}
                    <span>{result.text}</span>
                    {result.hint && (
                      <span className="ml-1 text-xs text-zinc-500 dark:text-zinc-400">
                        ({result.hint})
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}

export default ExerciseWorkspace;
