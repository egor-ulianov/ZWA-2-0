import React from 'react';
import {
  isAbortError,
  mergeProgressPatches,
  mergeServerState,
  progressPatchForFinalPointsInput,
} from '../../lib/apiClient.js';

const EMPTY_PROGRESS = {
  assignment_task_checked: false,
  assignment_midterm_ok: false,
  assignment_topic: '',
  assignment_partner: '',
  assignment_final_points: '',
};

function normalizeProgress(value) {
  return {
    ...EMPTY_PROGRESS,
    ...(value || {}),
    assignment_final_points: value?.assignment_final_points ?? '',
  };
}

export default function ProgressEditor({ username, value, onSavePatch }) {
  const [draft, setDraft] = React.useState(() => normalizeProgress(value));
  const [status, setStatus] = React.useState({ saving: false, error: '', accessCode: '' });
  const pendingRef = React.useRef({});
  const failedRef = React.useRef({});
  const serverValueRef = React.useRef(normalizeProgress(value));
  const dirtyFieldsRef = React.useRef(new Set());
  const fieldVersionsRef = React.useRef(new Map());
  const draftRef = React.useRef(draft);
  const timerRef = React.useRef(null);
  const flushingRef = React.useRef(false);
  const identityRef = React.useRef(username);

  React.useEffect(() => {
    if (identityRef.current !== username) {
      identityRef.current = username;
      pendingRef.current = {};
      failedRef.current = {};
      dirtyFieldsRef.current = new Set();
      fieldVersionsRef.current = new Map();
      setStatus({ saving: false, error: '', accessCode: '' });
    }
    const nextServerValue = normalizeProgress(value);
    serverValueRef.current = nextServerValue;
    setDraft((current) => {
      const next = normalizeProgress(mergeServerState(current, nextServerValue, dirtyFieldsRef.current));
      draftRef.current = next;
      return next;
    });
  }, [username, value]);

  React.useEffect(() => () => clearTimeout(timerRef.current), []);

  const flush = React.useCallback(async () => {
    clearTimeout(timerRef.current);
    if (flushingRef.current) return;
    const patch = { ...pendingRef.current };
    pendingRef.current = {};
    if (!Object.keys(patch).length) return;
    const patchVersions = Object.fromEntries(Object.keys(patch).map((field) => [field, fieldVersionsRef.current.get(field)]));
    flushingRef.current = true;
    let failed = false;
    setStatus((current) => ({ ...current, saving: true, error: '' }));
    try {
      const result = await onSavePatch(username, patch);
      const savedValue = normalizeProgress(result?.item || { ...serverValueRef.current, ...patch });
      serverValueRef.current = savedValue;
      for (const field of Object.keys(patch)) {
        if (fieldVersionsRef.current.get(field) === patchVersions[field]
          && !Object.hasOwn(pendingRef.current, field)) {
          dirtyFieldsRef.current.delete(field);
          delete failedRef.current[field];
        }
      }
      setDraft((current) => {
        const next = normalizeProgress(mergeServerState(current, savedValue, dirtyFieldsRef.current));
        draftRef.current = next;
        return next;
      });
    } catch (error) {
      if (!isAbortError(error)) {
        failed = true;
        pendingRef.current = { ...patch, ...pendingRef.current };
        failedRef.current = { ...failedRef.current, ...patch };
        setStatus((current) => ({ ...current, error: error.message || 'Unable to save progress' }));
      }
    } finally {
      flushingRef.current = false;
      if (Object.keys(pendingRef.current).length && !failed) {
        timerRef.current = setTimeout(flush, 0);
      } else {
        setStatus((current) => ({ ...current, saving: false }));
      }
    }
  }, [onSavePatch, username]);

  function change(patch) {
    for (const field of Object.keys(patch)) {
      fieldVersionsRef.current.set(field, (fieldVersionsRef.current.get(field) || 0) + 1);
      dirtyFieldsRef.current.add(field);
    }
    setDraft((current) => {
      const next = { ...current, ...patch };
      draftRef.current = next;
      return next;
    });
    pendingRef.current = mergeProgressPatches(failedRef.current, pendingRef.current, patch);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, 500);
    setStatus((current) => ({ ...current, error: '' }));
  }

  async function generateAccessCode() {
    setStatus((current) => ({ ...current, saving: true, error: '', accessCode: '' }));
    try {
      const result = await onSavePatch(username, { generate_access_code: true });
      setStatus((current) => ({ ...current, saving: false, accessCode: result.accessCode || '' }));
    } catch (error) {
      if (isAbortError(error)) return;
      setStatus((current) => ({ ...current, saving: false, error: error.message || 'Unable to generate an access code' }));
    }
  }

  const mailto = status.accessCode
    ? `mailto:${encodeURIComponent(username)}?subject=${encodeURIComponent('ZWA access information')}&body=${encodeURIComponent(`Username: ${username}\nAccess code: ${status.accessCode}\n\nLogin: ${typeof window === 'undefined' ? '/student' : `${window.location.origin}/student`}`)}`
    : '';

  return (
    <section className="mt-3 grid grid-cols-1 gap-3 border-t pt-3" aria-label={`Progress for ${username}`}>
      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" checked={draft.assignment_task_checked} onChange={(event) => change({ assignment_task_checked: event.target.checked })} />
        Task checked
      </label>
      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" checked={draft.assignment_midterm_ok} onChange={(event) => change({ assignment_midterm_ok: event.target.checked })} />
        Mid-term approved
      </label>
      <label className="text-sm">Semestral topic
        <input className="mt-1 block w-full border rounded px-2 py-1" value={draft.assignment_topic || ''} onBlur={flush} onChange={(event) => change({ assignment_topic: event.target.value })} />
      </label>
      <label className="text-sm">Partner username
        <input className="mt-1 block w-full border rounded px-2 py-1" value={draft.assignment_partner || ''} onBlur={flush} onChange={(event) => change({ assignment_partner: event.target.value })} />
      </label>
      <label className="text-sm">Final points
        <input className="mt-1 block w-full border rounded px-2 py-1" type="number" min="0" max="100" value={draft.assignment_final_points ?? ''} onBlur={flush} onChange={(event) => {
          const raw = event.target.value;
          const patch = progressPatchForFinalPointsInput(raw);
          if (patch) change(patch);
          else setDraft((current) => {
            const next = { ...current, assignment_final_points: raw };
            draftRef.current = next;
            return next;
          });
        }} />
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="px-3 py-1 rounded bg-zinc-200 disabled:opacity-50" disabled={status.saving} onClick={generateAccessCode}>Generate access code</button>
        {mailto ? <a className="px-3 py-1 rounded bg-sky-600 text-white" href={mailto}>Email login + code</a> : null}
      </div>
      <p className="text-xs text-zinc-600" aria-live="polite">{status.saving ? 'Saving…' : status.accessCode ? 'Access code generated. Copy it now; it will not be shown again.' : 'Changes save automatically.'}</p>
      {status.error ? <div className="text-sm text-red-600" role="alert"><p>{status.error}</p><div className="mt-1 flex gap-3"><button type="button" className="underline" onClick={() => { pendingRef.current = { ...failedRef.current, ...pendingRef.current }; setStatus((current) => ({ ...current, error: '' })); flush(); }}>Retry</button><button type="button" className="underline" onClick={() => { clearTimeout(timerRef.current); pendingRef.current = {}; failedRef.current = {}; dirtyFieldsRef.current = new Set(); const next = normalizeProgress(serverValueRef.current); draftRef.current = next; setDraft(next); setStatus((current) => ({ ...current, saving: false, error: '' })); }}>Roll back</button></div></div> : null}
    </section>
  );
}
