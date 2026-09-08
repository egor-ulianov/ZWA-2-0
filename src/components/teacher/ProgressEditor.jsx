import React from 'react';

const EMPTY_PROGRESS = {
  assignment_task_checked: false,
  assignment_midterm_ok: false,
  assignment_topic: '',
  assignment_partner: '',
  assignment_final_points: '',
};

export default function ProgressEditor({ username, value, onSavePatch }) {
  const [draft, setDraft] = React.useState({ ...EMPTY_PROGRESS, ...(value || {}) });
  const [status, setStatus] = React.useState({ saving: false, error: '', accessCode: '' });
  const pendingRef = React.useRef({});
  const timerRef = React.useRef(null);
  const requestVersionRef = React.useRef(0);

  React.useEffect(() => {
    setDraft({ ...EMPTY_PROGRESS, ...(value || {}) });
  }, [username]);

  React.useEffect(() => () => clearTimeout(timerRef.current), []);

  const flush = React.useCallback(async () => {
    clearTimeout(timerRef.current);
    const patch = pendingRef.current;
    pendingRef.current = {};
    if (!Object.keys(patch).length) return;
    const version = requestVersionRef.current;
    setStatus((current) => ({ ...current, saving: true, error: '' }));
    try {
      await onSavePatch(username, patch);
      if (version === requestVersionRef.current) setStatus((current) => ({ ...current, saving: false }));
    } catch (error) {
      if (version === requestVersionRef.current) {
        setStatus((current) => ({ ...current, saving: false, error: error.message || 'Unable to save progress' }));
      }
    }
  }, [onSavePatch, username]);

  function change(patch) {
    requestVersionRef.current += 1;
    setDraft((current) => ({ ...current, ...patch }));
    pendingRef.current = { ...pendingRef.current, ...patch };
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, 500);
  }

  async function generateAccessCode() {
    requestVersionRef.current += 1;
    setStatus((current) => ({ ...current, saving: true, error: '', accessCode: '' }));
    try {
      const result = await onSavePatch(username, { generate_access_code: true });
      setStatus((current) => ({ ...current, saving: false, accessCode: result.accessCode || '' }));
    } catch (error) {
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
          setDraft((current) => ({ ...current, assignment_final_points: raw }));
          if (raw !== '' && Number.isInteger(Number(raw))) change({ assignment_final_points: Number(raw) });
        }} />
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="px-3 py-1 rounded bg-zinc-200 disabled:opacity-50" disabled={status.saving} onClick={generateAccessCode}>Generate access code</button>
        {mailto ? <a className="px-3 py-1 rounded bg-sky-600 text-white" href={mailto}>Email login + code</a> : null}
      </div>
      <p className="text-xs text-zinc-600" aria-live="polite">{status.saving ? 'Saving…' : status.accessCode ? 'Access code generated. Copy it now; it will not be shown again.' : 'Changes save automatically.'}</p>
      {status.error ? <p className="text-sm text-red-600" role="alert">{status.error}</p> : null}
    </section>
  );
}
