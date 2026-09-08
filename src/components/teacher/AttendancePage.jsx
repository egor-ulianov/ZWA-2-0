import React from 'react';
import { createSerializedRequestQueue, isUnauthorized, request } from '../../lib/apiClient.js';
import { parseAttendanceCsv, serializeAttendanceCsv } from '../../lib/csv.js';
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

  const onUnauthorized = React.useCallback(() => setTeacher(null), []);
  const client = React.useCallback((path, options) => request(path, { ...options, onUnauthorized }), [onUnauthorized]);

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
      if (cause.name === 'AbortError' || isUnauthorized(cause)) return;
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
    client(`/api/attendance?date=${encodeURIComponent(date)}`, { signal: controller.signal }).then((data) => {
      const map = data.map || {};
      confirmedRef.current.set(date, map);
      setAttendance(map); setOverview((current) => ({ ...current, [date]: map }));
    }).catch((cause) => { if (cause.name !== 'AbortError' && !isUnauthorized(cause)) setError(cause.message || 'Unable to load attendance'); });
    return () => controller.abort();
  }, [client, date, teacher]);

  function queueForDate(targetDate) {
    if (!queuesRef.current.has(targetDate)) {
      queuesRef.current.set(targetDate, createSerializedRequestQueue(({ map }) => client('/api/attendance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date: targetDate, map }),
      })));
    }
    return queuesRef.current.get(targetDate);
  }

  function persist(targetDate, nextMap) {
    const revision = (revisionsRef.current.get(targetDate) || 0) + 1;
    revisionsRef.current.set(targetDate, revision);
    setSaveError(null);
    const snapshot = { ...nextMap };
    return queueForDate(targetDate).enqueue({ map: snapshot }).then(() => {
      confirmedRef.current.set(targetDate, snapshot);
      setOverview((current) => ({ ...current, [targetDate]: snapshot }));
      if (revisionsRef.current.get(targetDate) === revision) setSaveError(null);
    }).catch((cause) => {
      if (isUnauthorized(cause)) return;
      if (revisionsRef.current.get(targetDate) === revision) {
        setAttendance(confirmedRef.current.get(targetDate) || {});
        setSaveError({ message: cause.message || 'Unable to save attendance', date: targetDate, map: snapshot });
      }
      throw cause;
    });
  }

  function updateAttendance(nextMap) {
    setAttendance(nextMap);
    persist(date, nextMap).catch(() => {});
  }

  function handleFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try { setImportDraft(parseAttendanceCsv(String(reader.result || ''), { knownUsernames: new Set(students.map((student) => student.username)) })); }
      catch (cause) { setSaveError({ message: cause.message || 'Unable to parse CSV' }); }
    };
    reader.readAsText(file);
  }

  function confirmImport() {
    if (!importDraft?.entries.length) return;
    const base = importDraft.date === date ? attendance : (overview[importDraft.date] || {});
    const next = { ...base, ...Object.fromEntries(importDraft.entries.map((entry) => [entry.username, entry.present])) };
    setDate(importDraft.date);
    setAttendance(next);
    persist(importDraft.date, next).then(() => client(`/api/attendance?date=${encodeURIComponent(importDraft.date)}`)).then((data) => {
      const map = data.map || {};
      confirmedRef.current.set(importDraft.date, map);
      setAttendance(map); setOverview((current) => ({ ...current, [importDraft.date]: map })); setImportDraft(null);
    }).catch(() => {});
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
    setTeacher(null); setStudents([]); setAttendance({});
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
      <section className="mb-4 flex flex-wrap items-end gap-2"><label className="text-sm">Attendance date<input className="ml-2 border rounded px-2 py-1" type="date" value={date} disabled={attendanceSaving} onChange={(event) => setDate(event.target.value)} /></label><label className="flex-1 text-sm">Search username<input className="ml-2 border rounded px-2 py-1 w-full" value={query} onChange={(event) => setQuery(event.target.value)} /></label><button type="button" className="px-3 py-2 rounded bg-zinc-200 disabled:opacity-50" disabled={attendanceSaving} onClick={() => updateAttendance({ ...attendance, ...Object.fromEntries(filtered.map((student) => [student.username, true])) })}>All</button><button type="button" className="px-3 py-2 rounded bg-zinc-200 disabled:opacity-50" disabled={attendanceSaving} onClick={() => updateAttendance({ ...attendance, ...Object.fromEntries(filtered.map((student) => [student.username, false])) })}>None</button></section>
      <p className="mb-3 text-sm" aria-live="polite">Total: {students.length} · Present: {presentCount}</p>
      {error ? <p className="text-red-600" role="alert">{error}</p> : null}
      {saveError ? <p className="mb-3 text-red-600" role="alert">{saveError.message} <button type="button" className="underline" onClick={() => persist(saveError.date, saveError.map).catch(() => {})}>Retry</button></p> : null}
      <ul className="divide-y rounded-xl bg-white shadow">{filtered.map((student) => <StudentRow key={student.username} student={student} present={Boolean(attendance[student.username])} saving={attendanceSaving} progress={progress[student.username]} onToggle={(username, present) => updateAttendance({ ...attendance, [username]: present })} onSaveProgress={saveProgressPatch} />)}</ul>
      <section className="mt-4 flex flex-wrap items-center gap-2"><button type="button" className="px-4 py-2 rounded bg-sky-600 text-white" onClick={() => { const blob = new Blob([serializeAttendanceCsv(students.map((student) => ({ username: student.username, present: Boolean(attendance[student.username]), date })))], { type: 'text/csv;charset=utf-8' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `attendance_${date}.csv`; link.click(); URL.revokeObjectURL(url); }}>Export CSV</button><label className="px-4 py-2 rounded bg-zinc-800 text-white cursor-pointer">Import CSV<input type="file" accept=".csv,text/csv" className="sr-only" onChange={handleFile} /></label></section>
      {importDraft ? <section className="mt-4 rounded border p-3" aria-live="polite"><p>Import for {importDraft.date || 'an invalid date'}: {importDraft.entries.length} valid rows, {importDraft.rejected.length} rejected rows.</p>{importDraft.rejected.length ? <ul className="mt-2 text-sm text-red-600">{importDraft.rejected.map((item) => <li key={`${item.row}-${item.username}`}>Row {item.row} ({item.username || 'blank'}): {item.reason}</li>)}</ul> : null}<div className="mt-3 flex gap-2"><button type="button" className="px-3 py-1 rounded bg-sky-600 text-white disabled:opacity-50" disabled={!importDraft.date || !importDraft.entries.length} onClick={confirmImport}>Confirm and persist import</button><button type="button" className="px-3 py-1 rounded bg-zinc-200" onClick={() => setImportDraft(null)}>Cancel</button></div></section> : null}
      <section className="mt-8"><h2 className="text-xl font-bold mb-3">Overall attendance</h2><div className="overflow-x-auto"><table className="min-w-full text-sm bg-white rounded-xl shadow"><thead className="bg-zinc-100"><tr><th scope="col" className="text-left px-3 py-2">Username</th>{dates.map((item) => <th scope="col" key={item} className="text-center px-2 py-2">{item}</th>)}<th scope="col" className="px-3 py-2">Total</th></tr></thead><tbody>{students.map((student) => { const total = dates.filter((item) => overview[item]?.[student.username]).length; return <tr key={student.username} className="border-t"><th scope="row" className="text-left px-3 py-2">{student.username}</th>{dates.map((item) => <td key={item} className="text-center px-2 py-2">{overview[item]?.[student.username] ? '✓' : '–'}</td>)}<td className="text-center px-3 py-2 font-semibold">{total}</td></tr>; })}</tbody></table></div></section>
    </> : null}
  </main>;
}
