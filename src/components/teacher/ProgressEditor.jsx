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

const FINAL_POINTS_ERROR = 'Final points must be a whole number from 0 to 100.';

function normalizeFinalPoints(value) {
  if (value === null || value === undefined || value === '') return '';
  const patch = progressPatchForFinalPointsInput(String(value));
  return patch?.assignment_final_points ?? '';
}

function isEmailAddress(value) {
  const email = typeof value === 'string' ? value.trim() : '';
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeProgress(value) {
  return {
    ...EMPTY_PROGRESS,
    ...(value || {}),
    assignment_final_points: normalizeFinalPoints(value?.assignment_final_points),
  };
}

export default function ProgressEditor({ username, value, onSavePatch }) {
  const [draft, setDraft] = React.useState(() => normalizeProgress(value));
  const [status, setStatus] = React.useState({ saving: false, error: '', accessCode: '' });
  const [finalPointsError, setFinalPointsError] = React.useState('');
  const pendingRef = React.useRef({});
  const failedRef = React.useRef({});
  const serverValueRef = React.useRef(normalizeProgress(value));
  const dirtyFieldsRef = React.useRef(new Set());
  const fieldVersionsRef = React.useRef(new Map());
  const draftRef = React.useRef(draft);
  const timerRef = React.useRef(null);
  const flushingRef = React.useRef(false);
  const identityRef = React.useRef(username);
  const accessCodeRetryRef = React.useRef(false);

  React.useEffect(() => {
    if (identityRef.current !== username) {
      identityRef.current = username;
      pendingRef.current = {};
      failedRef.current = {};
      accessCodeRetryRef.current = false;
      dirtyFieldsRef.current = new Set();
      fieldVersionsRef.current = new Map();
      setStatus({ saving: false, error: '', accessCode: '' });
      setFinalPointsError('');
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

  function handleFinalPointsBlur() {
    const raw = draftRef.current.assignment_final_points;
    const patch = progressPatchForFinalPointsInput(raw === null || raw === undefined ? '' : String(raw));
    if (!patch) {
      const restored = normalizeProgress(serverValueRef.current).assignment_final_points;
      const next = { ...draftRef.current, assignment_final_points: restored };
      draftRef.current = next;
      setDraft(next);
      setFinalPointsError(FINAL_POINTS_ERROR);
      return;
    }
    setFinalPointsError('');
    if (String(raw) !== String(patch.assignment_final_points ?? '')) change(patch);
    flush();
  }

  async function generateAccessCode() {
    accessCodeRetryRef.current = true;
    setStatus((current) => ({ ...current, saving: true, error: '', accessCode: '' }));
    try {
      const result = await onSavePatch(username, { generate_access_code: true });
      accessCodeRetryRef.current = false;
      setStatus((current) => ({ ...current, saving: false, accessCode: result.accessCode || '' }));
    } catch (error) {
      if (isAbortError(error)) return;
      setStatus((current) => ({ ...current, saving: false, error: error.message || 'Unable to generate an access code' }));
    }
  }

  const mailto = status.accessCode && isEmailAddress(username)
    ? `mailto:${encodeURIComponent(username)}?subject=${encodeURIComponent('ZWA access information')}&body=${encodeURIComponent(`Username: ${username}\nAccess code: ${status.accessCode}\n\nLogin: ${typeof window === 'undefined' ? '/student' : `${window.location.origin}/student`}`)}`
    : '';
  const finalPointsErrorId = `final-points-error-${username.replace(/[^a-zA-Z0-9_-]/g, '-')}`;

  function retrySave() {
    if (accessCodeRetryRef.current) {
      generateAccessCode();
      return;
    }
    pendingRef.current = { ...failedRef.current, ...pendingRef.current };
    setStatus((current) => ({ ...current, error: '' }));
    flush();
  }

  function rollbackChanges() {
    clearTimeout(timerRef.current);
    pendingRef.current = {};
    failedRef.current = {};
    accessCodeRetryRef.current = false;
    dirtyFieldsRef.current = new Set();
    const next = normalizeProgress(serverValueRef.current);
    draftRef.current = next;
    setDraft(next);
    setStatus((current) => ({ ...current, saving: false, error: '' }));
  }

  return (
    <section className="mt-4 space-y-4 border-t border-[var(--portal-border)] pt-4" aria-label={`Progress for ${username}`}>
      <fieldset className="rounded border border-[var(--portal-border)] p-4">
        <legend className="px-1 text-sm font-semibold">Assignment checks</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="inline-flex min-h-11 items-center gap-3 text-sm">
            <input type="checkbox" checked={draft.assignment_task_checked} onChange={(event) => change({ assignment_task_checked: event.target.checked })} />
            Task checked
          </label>
          <label className="inline-flex min-h-11 items-center gap-3 text-sm">
            <input type="checkbox" checked={draft.assignment_midterm_ok} onChange={(event) => change({ assignment_midterm_ok: event.target.checked })} />
            Mid-term approved
          </label>
        </div>
      </fieldset>

      <fieldset className="grid grid-cols-1 gap-4 rounded border border-[var(--portal-border)] p-4">
        <legend className="px-1 text-sm font-semibold">Assignment details</legend>
        <label className="text-sm font-semibold">
          Semestral topic
          <input className="mt-2 block min-h-11 w-full rounded border border-[var(--portal-border)] bg-[var(--portal-panel)] px-3 py-2 font-normal text-[var(--portal-text)]" value={draft.assignment_topic || ''} onBlur={flush} onChange={(event) => change({ assignment_topic: event.target.value })} />
        </label>
        <label className="text-sm font-semibold">
          Partner username
          <input className="mt-2 block min-h-11 w-full rounded border border-[var(--portal-border)] bg-[var(--portal-panel)] px-3 py-2 font-normal text-[var(--portal-text)]" value={draft.assignment_partner || ''} onBlur={flush} onChange={(event) => change({ assignment_partner: event.target.value })} />
        </label>
        <label className="text-sm font-semibold">
          Final points
          <input className="mt-2 block min-h-11 w-full rounded border border-[var(--portal-border)] bg-[var(--portal-panel)] px-3 py-2 font-normal text-[var(--portal-text)]" type="number" min="0" max="100" step="1" value={draft.assignment_final_points ?? ''} onBlur={handleFinalPointsBlur} onChange={(event) => {
            const raw = event.target.value;
            const patch = progressPatchForFinalPointsInput(raw);
            if (patch) {
              setFinalPointsError('');
              change(patch);
            } else {
              fieldVersionsRef.current.set(
                'assignment_final_points',
                (fieldVersionsRef.current.get('assignment_final_points') || 0) + 1,
              );
              delete pendingRef.current.assignment_final_points;
              delete failedRef.current.assignment_final_points;
              dirtyFieldsRef.current.delete('assignment_final_points');
              clearTimeout(timerRef.current);
              if (!flushingRef.current && Object.keys(pendingRef.current).length) {
                timerRef.current = setTimeout(flush, 500);
              }
              setDraft((current) => {
                const next = { ...current, assignment_final_points: raw };
                draftRef.current = next;
                return next;
              });
            }
          }} aria-invalid={Boolean(finalPointsError)} aria-describedby={finalPointsError ? finalPointsErrorId : undefined} />
          {finalPointsError ? <p id={finalPointsErrorId} className="mt-2 text-sm text-[var(--portal-coral)]" role="alert">{finalPointsError}</p> : null}
        </label>
      </fieldset>

      <fieldset className="rounded border border-[var(--portal-border)] p-4">
        <legend className="px-1 text-sm font-semibold">Student access</legend>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="portal-action portal-secondary-action disabled:cursor-not-allowed disabled:opacity-50" disabled={status.saving} onClick={generateAccessCode}>Generate access code</button>
          {mailto ? <a className="portal-action" href={mailto}>Email login + code</a> : null}
        </div>
        <p className="mt-3 text-xs text-[var(--portal-text-muted)]" role="status" aria-live="polite">{status.saving ? 'Saving…' : status.accessCode ? 'Access code generated. Copy it now; it will not be shown again.' : 'Changes save automatically.'}</p>
      </fieldset>

      {status.error ? <div className="text-sm text-[var(--portal-coral)]" role="alert"><p>{status.error}</p><div className="mt-2 flex flex-wrap gap-3"><button type="button" className="font-semibold underline" onClick={retrySave}>Retry</button><button type="button" className="font-semibold underline" onClick={rollbackChanges}>Roll back</button></div></div> : null}
    </section>
  );
}
