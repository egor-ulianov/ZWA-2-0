import React, { isValidElement, useCallback, useMemo, useState } from 'react';

import { MAX_STATIC_SOURCE_LENGTH } from './staticTaskChecks.js';

function normalizeEditor(editor) {
  if (typeof editor === 'string') {
    return { source: editor, label: 'Editor', language: 'text' };
  }
  if (!editor || typeof editor !== 'object' || isValidElement(editor)) {
    return { source: '', label: 'Editor', language: 'text' };
  }
  return {
    source: String(editor.source ?? editor.value ?? editor.content ?? '').slice(
      0,
      MAX_STATIC_SOURCE_LENGTH,
    ),
    label: String(editor.label || 'Editor'),
    language: String(editor.language || 'text'),
    placeholder: String(editor.placeholder || ''),
  };
}

function renderTask(task, testDefinition) {
  if (isValidElement(task)) return task;
  if (task == null) {
    return (
      <>
        {testDefinition?.label && <p>{testDefinition.label}</p>}
        {testDefinition?.hint && <p>{testDefinition.hint}</p>}
      </>
    );
  }
  if (typeof task === 'object') {
    return (
      <div className="space-y-2">
        {task.title && <p className="font-medium">{task.title}</p>}
        {task.description && <p>{task.description}</p>}
        {task.outcome && <p>{task.outcome}</p>}
      </div>
    );
  }
  return task;
}

function normalizeStaticResults(results) {
  if (!Array.isArray(results)) return [];
  return results.slice(0, 64).flatMap((result, index) => {
    if (!result || typeof result !== 'object') return [];
    const normalized = {
      id: typeof result.id === 'string' && result.id ? result.id : `static-${index + 1}`,
      ok: Boolean(result.ok),
      text: String(result.text ?? '').slice(0, 2000),
    };
    if (typeof result.hint === 'string' && result.hint) {
      normalized.hint = result.hint.slice(0, 1000);
    }
    return [normalized];
  });
}

export function LessonTaskWorkspace({
  task,
  editor,
  preview = null,
  testDefinition,
  staticCheck,
  privateMarker,
}) {
  const editorConfig = useMemo(() => normalizeEditor(editor), [editor]);
  const [source, setSource] = useState(editorConfig.source);
  const [results, setResults] = useState([]);

  const handleSourceChange = useCallback((event) => {
    setSource(String(event.target.value || '').slice(0, MAX_STATIC_SOURCE_LENGTH));
    setResults([]);
  }, []);

  const handleRunTests = useCallback(() => {
    if (typeof staticCheck !== 'function') {
      setResults([]);
      return;
    }
    const bounded = source.slice(0, MAX_STATIC_SOURCE_LENGTH);
    try {
      setResults(normalizeStaticResults(staticCheck(bounded)));
    } catch (_) {
      setResults([
        {
          id: 'static-check-error',
          ok: false,
          text: 'Statickou kontrolu se nepodařilo dokončit.',
        },
      ]);
    }
  }, [source, staticCheck]);

  return (
    <div
      data-projector-private={privateMarker || 'lesson-task-workspace'}
      className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/70 px-4 py-3 dark:border-zinc-800">
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Plocha úkolu</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">V tomto okně prohlížeče</p>
        </div>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          Úpravy platí jen pro tuto relaci.
        </span>
      </header>

      <section
        role="region"
        aria-label="Zadání"
        className="border-b border-zinc-200/70 px-4 py-4 dark:border-zinc-800"
      >
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Zadání</h2>
        <div className="mt-2 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
          {renderTask(task, testDefinition)}
        </div>
      </section>

      <section
        role="region"
        aria-label="IDE"
        className="border-b border-zinc-200/70 dark:border-zinc-800"
      >
        <div className="border-b border-zinc-200/70 px-4 py-3 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">IDE</h2>
        </div>
        {isValidElement(editor) ? (
          <div className="min-w-0 p-4">{editor}</div>
        ) : (
          <label className="block p-4">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {editorConfig.label}
            </span>
            <textarea
              value={source}
              onChange={handleSourceChange}
              spellCheck={false}
              maxLength={MAX_STATIC_SOURCE_LENGTH}
              aria-label={editorConfig.label}
              placeholder={editorConfig.placeholder}
              data-language={editorConfig.language}
              className="min-h-[320px] w-full resize-y rounded-lg border border-zinc-300 bg-zinc-950 p-3 font-mono text-xs leading-5 text-zinc-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700"
            />
          </label>
        )}
      </section>

      <section role="region" aria-label="Náhled a testy" className="min-w-0 p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Náhled a testy</h2>
          <button
            type="button"
            className="rounded-lg bg-indigo-700 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            onClick={handleRunTests}
          >
            Spustit testy
          </button>
        </div>
        {staticCheck && (
          <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
            Statická kontrola — kód se v prohlížeči nespouští.
          </p>
        )}
        <div className="min-w-0">
          <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Náhled</h3>
          {preview}
        </div>
        <div
          className="mt-4 rounded-xl border border-zinc-200/70 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/60"
          role="group"
          aria-label="Výsledky testů"
          aria-live="polite"
        >
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Výsledky testů</h3>
          {results.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Spusťte testy a ověřte požadavek.
            </p>
          ) : (
            <ul className="mt-2 space-y-1.5 text-sm">
              {results.map((result) => (
                <li
                  key={result.id}
                  className={
                    result.ok
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-rose-700 dark:text-rose-400'
                  }
                >
                  <span aria-hidden="true">{result.ok ? '✓' : '×'}</span> <span>{result.text}</span>
                  {result.hint && (
                    <span className="ml-1 text-xs text-zinc-500 dark:text-zinc-400">
                      ({result.hint})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

export default LessonTaskWorkspace;
