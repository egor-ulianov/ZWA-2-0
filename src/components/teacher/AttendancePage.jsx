import React from 'react';
import {
  createAttendanceSnapshotOptions,
  createSerializedRequestQueue,
  isAbortError,
  isUnauthorized,
  request,
} from '../../lib/apiClient.js';
import {
  MAX_CSV_INPUT_BYTES,
  parseAttendanceCsv,
  serializeAttendanceCsv,
} from '../../lib/csv.js';
import StudentRow from './StudentRow.jsx';

function today() { return new Date().toISOString().slice(0, 10); }

function TeacherLogin({ onSuccess }) {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  async function submit(event) {
    event.preventDefault();
    setSaving(true); setError('');
    try {
      await request('/api/teacher/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
      setPassword('');
      onSuccess();
    } catch (cause) { setError(cause.message || 'Login failed'); }
    finally { setSaving(false); }
  }
  return <form onSubmit={submit} className="flex flex-wrap items-end gap-2" aria-label="Teacher login">
    <label className="text-sm">Username<input className="ml-2 border rounded px-2 py-1" value={username} autoComplete="username" onChange={(event) => setUsername(event.target.value)} required /></label>
    <label className="text-sm">Password<input className="ml-2 border rounded px-2 py-1" type="password" value={password} autoComplete="current-password" onChange={(event) => setPassword(event.target.value)} required /></label>
    <button className="px-3 py-1 rounded bg-sky-600 text-white disabled:opacity-50" type="submit" disabled={saving}>{saving ? 'Signing in…' : 'Login'}</button>
    {error ? <p className="w-full text-sm text-red-600" role="alert">{error}</p> : null}
  </form>;
}

export default function AttendancePage() {
  const [teacher, setTeacher] = React.useState(undefined);
  const [students, setStudents] = React.useState([]);
  const [date, setDate] = React.useState(today);
  const [attendance, setAttendance] = React.useState({});
  const [overview, setOverview] = React.useState({});
  const [progress, setProgress] = React.useState({});
  const [query, setQuery] = React.useState('');
  const [error, setError] = React.useState('');
  const [saveError, setSaveError] = React.useState(null);
  const [importDraft, setImportDraft] = React.useState(null);
  const queuesRef = React.useRef(new Map());
  const revisionsRef = React.useRef(new Map());
  const progressQueuesRef = React.useRef(new Map());
  const confirmedRef = React.useRef(new Map());
  const attendanceRef = React.useRef({});
  const saveVersionsRef = React.useRef(new Map());
  const fileReaderRef = React.useRef(null);

  React.useEffect(() => () => {
    const reader = fileReaderRef.current;
    fileReaderRef.current = null;
    if (reader?.readyState === 1) {
      reader.onload = null;
      reader.onerror = null;
      reader.onabort = null;
      reader.abort();
    }
  }, []);

  const onUnauthorized = React.useCallback(() => setTeacher(null), []);
  const client = React.useCallback((path, options) => request(path, { ...options, onUnauthorized }), [onUnauthorized]);

  const applyAttendance = React.useCallback((targetDate, map) => {
    const snapshot = { ...map };
    confirmedRef.current.set(targetDate, snapshot);
    setOverview((current) => ({ ...current, [targetDate]: snapshot }));
    if (targetDate === date) {
      attendanceRef.current = snapshot;
      setAttendance(snapshot);
    }
  }, [date]);

  const readAttendanceDate = React.useCallback(async (targetDate, signal) => {
    const data = await client(`/api/attendance?date=${encodeURIComponent(targetDate)}`, { signal });
    const revision = Number(data?.revision);
    if (!Number.isSafeInteger(revision) || revision < 0) throw new Error('Attendance response is missing a revision');
    const map = data.map || {};
    revisionsRef.current.set(targetDate, revision);
    return { map, revision };
  }, [client]);

  const reloadAttendance = React.useCallback(async (targetDate) => {
    const current = await readAttendanceDate(targetDate);
    applyAttendance(targetDate, current.map);
    return current;
  }, [applyAttendance, readAttendanceDate]);

  const loadTeacherData = React.useCallback(async (signal) => {
    setError('');
    try {
      const me = await client('/api/teacher/me', { signal });
      setTeacher(me.username || 'teacher');
      const [studentData, attendanceData, progressData] = await Promise.all([
        client('/api/students', { signal }), client('/api/attendance', { signal }), client('/api/progress', { signal }),
      ]);
      const nextOverview = attendanceData.overview || {};
      setStudents(studentData.students || []);
      setOverview(nextOverview);
      setProgress(Object.fromEntries((progressData.items || []).map((item) => [item.username, item])));
    } catch (cause) {
      if (isAbortError(cause) || isUnauthorized(cause)) return;
      setError(cause.message || 'Unable to load teacher data');
    }
  }, [client]);

  React.useEffect(() => {
    const controller = new AbortController();
    loadTeacherData(controller.signal);
    return () => controller.abort();
  }, [loadTeacherData]);

  React.useEffect(() => {
    if (!teacher) return undefined;
    const controller = new AbortController();
    readAttendanceDate(date, controller.signal).then(({ map }) => applyAttendance(date, map)).catch((cause) => {
      if (!isAbortError(cause) && !isUnauthorized(cause)) setError(cause.message || 'Unable to load attendance');
    });
    return () => controller.abort();
  }, [applyAttendance, date, readAttendanceDate, teacher]);

  function queueForDate(targetDate) {
    if (!queuesRef.current.has(targetDate)) {
      queuesRef.current.set(targetDate, createSerializedRequestQueue(({ map }) => {
        const options = createAttendanceSnapshotOptions({
          date: targetDate,
          map,
          revision: revisionsRef.current.get(targetDate),
        });
        return client('/api/attendance', options).then((result) => {
          const revision = Number(result?.revision);
          if (!Number.isSafeInteger(revision) || revision < 0) throw new Error('Attendance response is missing a revision');
          revisionsRef.current.set(targetDate, revision);
          return result;
        });
      }));
    }
    return queuesRef.current.get(targetDate);
  }

  function persist(targetDate, nextMap) {
    const version = (saveVersionsRef.current.get(targetDate) || 0) + 1;
    saveVersionsRef.current.set(targetDate, version);
    setSaveError(null);
    const snapshot = { ...nextMap };
    const queue = queueForDate(targetDate);
    return queue.enqueue({ map: snapshot }).then(() => {
      confirmedRef.current.set(targetDate, snapshot);
      setOverview((current) => ({ ...current, [targetDate]: snapshot }));
      if (saveVersionsRef.current.get(targetDate) === version) setSaveError(null);
    }).catch(async (cause) => {
      if (isAbortError(cause) || isUnauthorized(cause)) throw cause;
      if (cause.status === 409) {
        queue.clearPending(cause);
        try {
          await reloadAttendance(targetDate);
          if (saveVersionsRef.current.get(targetDate) === version) {
            setSaveError({
              message: 'Attendance changed on the server. The latest values were reloaded; review and retry.',
              date: targetDate,
              conflict: true,
              action: 'reload',
            });
          }
        } catch (reloadError) {
          if (!isAbortError(reloadError) && !isUnauthorized(reloadError)
            && saveVersionsRef.current.get(targetDate) === version) {
            setSaveError({ message: reloadError.message || 'Unable to reload attendance after a conflict', date: targetDate, conflict: true, action: 'reload' });
          }
        }
      } else if (saveVersionsRef.current.get(targetDate) === version) {
        attendanceRef.current = confirmedRef.current.get(targetDate) || {};
        setAttendance(attendanceRef.current);
        setSaveError({ message: cause.message || 'Unable to save attendance', date: targetDate, map: snapshot, action: 'retry' });
      }
      throw cause;
    });
  }

  function updateAttendance(nextMap) {
    const snapshot = { ...nextMap };
    attendanceRef.current = snapshot;
    setAttendance(snapshot);
    persist(date, snapshot).catch((cause) => {
      if (!isAbortError(cause) && !isUnauthorized(cause)) return;
      return undefined;
    });
  }

  function handleFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (fileReaderRef.current) {
      setSaveError({ message: 'A CSV file is already being read.' });
      return;
    }
    function showImportError(message) {
      setImportDraft(null);
      setSaveError({ message });
    }
    if (typeof file.size === 'number' && file.size > MAX_CSV_INPUT_BYTES) {
      showImportError(`CSV file exceeds the maximum size of ${MAX_CSV_INPUT_BYTES} bytes.`);
      return;
    }
    const reader = new FileReader();
    fileReaderRef.current = reader;
    const finishReading = () => {
      if (fileReaderRef.current === reader) fileReaderRef.current = null;
    };
    reader.onload = () => {
      try { setImportDraft(parseAttendanceCsv(String(reader.result || ''), { knownUsernames: new Set(students.map((student) => student.username)) })); }
      catch (cause) { showImportError(cause.message || 'Unable to parse CSV'); }
      finally { finishReading(); }
    };
    reader.onerror = () => {
      finishReading();
      showImportError(reader.error?.message || 'Unable to read CSV file');
    };
    reader.onabort = () => {
      finishReading();
      showImportError('CSV file reading was cancelled.');
    };
    try {
      reader.readAsText(file);
    } catch (cause) {
      finishReading();
      showImportError(cause.message || 'Unable to read CSV file');
    }
  }

  function confirmImport() {
    if (!importDraft?.entries.length || !importDraft.date) return;
    const draft = importDraft;
    setSaveError(null);
    (async () => {
      try {
        const base = draft.date === date
          ? attendanceRef.current
          : (await readAttendanceDate(draft.date)).map;
        const next = { ...base, ...Object.fromEntries(draft.entries.map((entry) => [entry.username, entry.present])) };
        setDate(draft.date);
        attendanceRef.current = next;
        setAttendance(next);
        await persist(draft.date, next);
        const readback = await readAttendanceDate(draft.date);
        applyAttendance(draft.date, readback.map);
        setImportDraft(null);
      } catch (cause) {
        if (isAbortError(cause) || isUnauthorized(cause)) return;
        setSaveError((current) => current?.date === draft.date && current.action
          ? current
          : { message: cause.message || 'Unable to persist or verify CSV import', date: draft.date, action: 'reload' });
      }
    })();
  }

  function retrySave() {
    if (!saveError?.action) return;
    if (saveError.action === 'reload') {
      reloadAttendance(saveError.date).then(() => setSaveError(null)).catch((cause) => {
        if (!isAbortError(cause) && !isUnauthorized(cause)) setSaveError({ message: cause.message || 'Unable to reload attendance', date: saveError.date, conflict: true, action: 'reload' });
      });
      return;
    }
    persist(saveError.date, saveError.map).catch((cause) => {
      if (!isAbortError(cause) && !isUnauthorized(cause)) return;
    });
  }

  function saveProgressPatch(username, patch) {
    if (!progressQueuesRef.current.has(username)) {
      progressQueuesRef.current.set(username, createSerializedRequestQueue((nextPatch) => client('/api/progress', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, ...nextPatch }),
      })));
    }
    return progressQueuesRef.current.get(username).enqueue(patch).then((result) => {
      if (result.item) setProgress((current) => ({ ...current, [username]: result.item }));
      return result;
    });
  }

  async function logout() {
    try { await client('/api/teacher/logout', { method: 'POST' }); } catch (_) { /* local session state still ends */ }
    setTeacher(null); setStudents([]); attendanceRef.current = {}; setAttendance({});
  }

  const filtered = students.filter((student) => student.username.includes(query.trim().toLowerCase()));
  const dates = [...new Set([...Object.keys(overview), date])].sort();
  const presentCount = students.filter((student) => attendance[student.username]).length;
  const attendanceSaving = Boolean(queuesRef.current.get(date)?.pendingCount);

  return <main className="max-w-5xl mx-auto p-6">
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-3xl font-extrabold">Attendance</h1><p className="text-zinc-600">Teacher workspace</p></div>{teacher ? <button type="button" className="px-3 py-1 rounded bg-zinc-200" onClick={logout}>Logout</button> : null}</header>
    {teacher === undefined ? <p aria-live="polite">Checking teacher session…</p> : null}
    {teacher === null ? <TeacherLogin onSuccess={() => loadTeacherData()} /> : null}
    {teacher ? <>
      <section className="mb-4 flex flex-wrap items-end gap-2"><label className="text-sm">Attendance date<input className="ml-2 border rounded px-2 py-1" type="date" value={date} disabled={attendanceSaving} onChange={(event) => setDate(event.target.value)} /></label><label className="flex-1 text-sm">Search username<input className="ml-2 border rounded px-2 py-1 w-full" value={query} onChange={(event) => setQuery(event.target.value)} /></label><button type="button" className="px-3 py-2 rounded bg-zinc-200 disabled:opacity-50" disabled={attendanceSaving} onClick={() => updateAttendance({ ...attendanceRef.current, ...Object.fromEntries(filtered.map((student) => [student.username, true])) })}>All</button><button type="button" className="px-3 py-2 rounded bg-zinc-200 disabled:opacity-50" disabled={attendanceSaving} onClick={() => updateAttendance({ ...attendanceRef.current, ...Object.fromEntries(filtered.map((student) => [student.username, false])) })}>None</button></section>
      <p className="mb-3 text-sm" aria-live="polite">Total: {students.length} · Present: {presentCount}</p>
      {error ? <p className="text-red-600" role="alert">{error}</p> : null}
      {saveError ? <p className="mb-3 text-red-600" role="alert">{saveError.message}{saveError.action ? <button type="button" className="ml-2 underline" onClick={retrySave}>{saveError.action === 'reload' ? 'Reload latest' : 'Retry'}</button> : null}</p> : null}
      <ul className="divide-y rounded-xl bg-white shadow">{filtered.map((student) => <StudentRow key={student.username} student={student} present={Boolean(attendance[student.username])} saving={attendanceSaving} progress={progress[student.username]} onToggle={(username, present) => updateAttendance({ ...attendanceRef.current, [username]: present })} onSaveProgress={saveProgressPatch} />)}</ul>
      <section className="mt-4 flex flex-wrap items-center gap-2"><button type="button" className="px-4 py-2 rounded bg-sky-600 text-white" onClick={() => { const blob = new Blob([serializeAttendanceCsv(students.map((student) => ({ username: student.username, present: Boolean(attendance[student.username]), date })))], { type: 'text/csv;charset=utf-8' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `attendance_${date}.csv`; link.click(); URL.revokeObjectURL(url); }}>Export CSV</button><label className="px-4 py-2 rounded bg-zinc-800 text-white cursor-pointer">Import CSV<input type="file" accept=".csv,text/csv" className="sr-only" onChange={handleFile} /></label></section>
      {importDraft ? <section className="mt-4 rounded border p-3" aria-live="polite"><p>Import for {importDraft.date || 'an invalid date'}: {importDraft.entries.length} valid rows, {importDraft.rejected.length} rejected rows.</p>{importDraft.rejected.length ? <ul className="mt-2 text-sm text-red-600">{importDraft.rejected.map((item) => <li key={`${item.row}-${item.username}`}>Row {item.row} ({item.username || 'blank'}): {item.reason}</li>)}</ul> : null}<div className="mt-3 flex gap-2"><button type="button" className="px-3 py-1 rounded bg-sky-600 text-white disabled:opacity-50" disabled={!importDraft.date || !importDraft.entries.length} onClick={confirmImport}>Confirm and persist import</button><button type="button" className="px-3 py-1 rounded bg-zinc-200" onClick={() => setImportDraft(null)}>Cancel</button></div></section> : null}
      <section className="mt-8"><h2 className="text-xl font-bold mb-3">Overall attendance</h2><div className="overflow-x-auto"><table className="min-w-full text-sm bg-white rounded-xl shadow"><thead className="bg-zinc-100"><tr><th scope="col" className="text-left px-3 py-2">Username</th>{dates.map((item) => <th scope="col" key={item} className="text-center px-2 py-2">{item}</th>)}<th scope="col" className="px-3 py-2">Total</th></tr></thead><tbody>{students.map((student) => { const total = dates.filter((item) => overview[item]?.[student.username]).length; return <tr key={student.username} className="border-t"><th scope="row" className="text-left px-3 py-2">{student.username}</th>{dates.map((item) => <td key={item} className="text-center px-2 py-2">{overview[item]?.[student.username] ? '✓' : '–'}</td>)}<td className="text-center px-3 py-2 font-semibold">{total}</td></tr>; })}</tbody></table></div></section>
    </> : null}
  </main>;
}
