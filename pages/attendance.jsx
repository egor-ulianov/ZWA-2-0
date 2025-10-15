import React from 'react';
import { Analytics } from "@vercel/analytics/next"

function formatDateInput(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function AttendancePage() {
  const [students, setStudents] = React.useState([]);
  const [query, setQuery] = React.useState('');
  const [date, setDate] = React.useState(formatDateInput(new Date()));
  const [attendanceMap, setAttendanceMap] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [overviewMaps, setOverviewMaps] = React.useState({});
  const [progress, setProgress] = React.useState({}); // username -> progress object
  const [teacher, setTeacher] = React.useState(null);
  const [loginError, setLoginError] = React.useState('');
  const [grades, setGrades] = React.useState({}); // key: `${username}:${testNumber}` -> { points, reasoning, loading, error }

  React.useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        setLoading(true);
        // check teacher auth
        const me = await fetch('/api/teacher/me');
        if (me.ok) {
          const meData = await me.json();
          if (isMounted) setTeacher(meData.username || '');
        } else {
          if (isMounted) setTeacher(null);
        }
        const res = await fetch('/api/students');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!isMounted) return;
        setStudents(data.students || []);
      } catch (e) {
        if (isMounted) setError('Failed to load students');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  React.useEffect(() => {
    let isMounted = true;
    async function loadDate() {
      try {
        const res = await fetch(`/api/attendance?date=${encodeURIComponent(date)}`);
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        if (!isMounted) return;
        setAttendanceMap(data.map || {});
      } catch (_) {
        if (isMounted) setAttendanceMap({});
      }
    }
    loadDate();
    return () => { isMounted = false; };
  }, [date]);

  async function persistAttendance(next) {
    await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, map: next })
    });
  }

  function toggle(username, present) {
    const next = { ...attendanceMap, [username]: !!present };
    setAttendanceMap(next);
    persistAttendance(next);
  }

  function setAll(value) {
    const next = {};
    for (const s of filtered) {
      next[s.username] = !!value;
    }
    const merged = { ...attendanceMap, ...next };
    setAttendanceMap(merged);
    persistAttendance(merged);
  }

  function handleExport() {
    const rows = [['username', 'firstName', 'lastName', 'present', 'date']];
    for (const s of students) {
      const present = attendanceMap[s.username] ? '1' : '0';
      rows.push([s.username, s.firstName, s.lastName, present, date]);
    }
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || '');
        const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
        if (lines.length < 2) return;
        const header = lines[0].split(',');
        const userIdx = header.indexOf('username');
        const presentIdx = header.indexOf('present');
        const dateIdx = header.indexOf('date');
        const importedDate = dateIdx >= 0 ? lines[1].split(',')[dateIdx] : date;
        const nextDate = importedDate || date;
        const nextMap = {};
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',');
          const u = cols[userIdx];
          const p = cols[presentIdx];
          if (u) nextMap[u] = p === '1' || p === 'true';
        }
        const key = `attendance:${nextDate}`;
        localStorage.setItem(key, JSON.stringify(nextMap));
        setDate(nextDate);
        setAttendanceMap(nextMap);
      } catch (err) {
        // ignore
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  }

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = students.filter(s => {
    if (!normalizedQuery) return true;
    const full = `${s.firstName} ${s.lastName} ${s.username}`.toLowerCase();
    return full.includes(normalizedQuery);
  });

  const presentCount = students.reduce((acc, s) => acc + (attendanceMap[s.username] ? 1 : 0), 0);

  React.useEffect(() => {
    let isMounted = true;
    async function loadProgress() {
      try {
        const res = await fetch('/api/progress');
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        if (!isMounted) return;
        const map = {};
        for (const item of data.items || []) map[item.username] = item;
        setProgress(map);
      } catch (_) {
        if (isMounted) setProgress({});
      }
    }
    loadProgress();
    return () => { isMounted = false; };
  }, []);

  async function saveProgress(username, changes) {
    const current = progress[username] || { username };
    const payload = { ...current, ...changes, username };
    await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    setProgress(prev => ({ ...prev, [username]: payload }));
  }

  function gradeKey(username, testNumber) {
    return `${username}:${testNumber}`;
  }

  function readFilesAsDataUrls(fileList) {
    const files = Array.from(fileList || []);
    const readers = files.map(f => new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result || ''));
      r.onerror = reject;
      r.readAsDataURL(f);
    }));
    return Promise.all(readers);
  }

  async function loadLastAiResult(username, testNumber) {
    const key = gradeKey(username, testNumber);
    setGrades(prev => ({ ...prev, [key]: { ...(prev[key] || {}), loading: true, error: '' } }));
    try {
      const res = await fetch(`/api/grade-test?username=${encodeURIComponent(username)}&testNumber=${encodeURIComponent(testNumber)}`);
      if (!res.ok) throw new Error('Failed to load result');
      const data = await res.json();
      const item = data.item || null;
      setGrades(prev => ({
        ...prev,
        [key]: item ? { points: item.points, reasoning: item.reasoning, loading: false } : { points: null, reasoning: '', loading: false }
      }));
    } catch (e) {
      setGrades(prev => ({ ...prev, [key]: { ...(prev[key] || {}), loading: false, error: 'Failed to load result' } }));
    }
  }

  async function handleAiGrade(username, testNumber, fileList, maxPoints, criteria) {
    const key = gradeKey(username, testNumber);
    setGrades(prev => ({ ...prev, [key]: { ...(prev[key] || {}), loading: true, error: '' } }));
    try {
      const images = await readFilesAsDataUrls(fileList);
      if (images.length === 0) throw new Error('No images');
      const res = await fetch('/api/grade-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, testNumber, images, maxPoints, criteria })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Grade failed');
      }
      const data = await res.json();
      const points = data.points ?? null;
      const reasoning = data.reasoning || '';
      setGrades(prev => ({ ...prev, [key]: { points, reasoning, loading: false, error: '' } }));
      if (points != null) {
        const field = testNumber === 1 ? 'test1' : testNumber === 2 ? 'test2' : testNumber === 3 ? 'test3' : 'test4';
        await saveProgress(username, { [field]: points });
      }
    } catch (e) {
      setGrades(prev => ({ ...prev, [key]: { ...(prev[key] || {}), loading: false, error: e.message || 'Grade failed' } }));
    }
  }

  function buildMailto(student) {
    const username = student.username;
    const code = progress[username]?.auth_code || '';
    if (!username || !code) return '';
    const to = `${username}@cvut.cz,${username}@student.cvut.cz,${username}@fel.cvut.cz`;
    const subject = encodeURIComponent('ZWA – Access information');
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const loginUrl = `${origin}/student`;
    const body = encodeURIComponent(
      `Hello ${student.firstName} ${student.lastName},\n\n` +
      `Here are your access details for ZWA:\n` +
      `Username: ${username}\n` +
      `Auth code: ${code}\n\n` +
      `Login here: ${loginUrl}\n\n` +
      `Best,\nYour instructor`
    );
    return `mailto:${to}?subject=${subject}&body=${body}`;
  }

  function getWednesdays() {
    const start = new Date('2025-09-24T00:00:00');
    const end = new Date('2025-12-17T00:00:00');
    const days = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 7)) {
      days.push(formatDateInput(d));
    }
    return days;
  }

  const wednesdays = React.useMemo(() => getWednesdays(), []);

  React.useEffect(() => {
    let isMounted = true;
    async function loadOverview() {
      try {
        const res = await fetch('/api/attendance');
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        if (!isMounted) return;
        const store = data.overview || {};
        const applied = { ...store, [date]: { ...attendanceMap } };
        setOverviewMaps(applied);
      } catch (_) {
        if (isMounted) setOverviewMaps({});
      }
    }
    loadOverview();
    return () => { isMounted = false; };
  }, [wednesdays, date, attendanceMap]);

  return (
    <main className="max-w-3xl mx-auto p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold">Attendance</h1>
          <p className="text-zinc-600">Editable list for your practicals (Ulianov, Egor)</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            className="border rounded px-2 py-1"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>
      </header>

      {teacher === null && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Teacher login</h2>
          <TeacherLogin onSuccess={u => setTeacher(u)} onError={m => setLoginError(m)} />
          {!!loginError && <p className="text-red-600 text-sm mt-2">{loginError}</p>}
        </section>
      )}

      <section className="mb-4 flex items-center gap-2">
        <input
          type="text"
          placeholder="Search by name or username"
          className="border rounded px-3 py-2 w-full"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button className="px-3 py-2 rounded bg-zinc-200" onClick={() => setAll(true)}>All</button>
        <button className="px-3 py-2 rounded bg-zinc-200" onClick={() => setAll(false)}>None</button>
      </section>

      {loading && <p className="text-zinc-600">Loading…</p>}
      {!!error && <p className="text-red-600">{error}</p>}

      {!loading && !error && teacher && (
        <>
          <div className="mb-3 text-sm text-zinc-700">
            <span className="font-semibold">Total:</span> {students.length} · <span className="font-semibold">Present:</span> {presentCount}
          </div>
          <ul className="divide-y rounded-xl bg-white shadow">
            {filtered.map(s => {
              const present = !!attendanceMap[s.username];
              return (
                <li key={s.username} className="p-3 flex items-center justify-between">
                  <div className="grid grid-cols-2 gap-x-4">
                    <div className="font-medium">{s.firstName}</div>
                    <div className="font-medium">{s.lastName}</div>
                    <div className="text-sm text-zinc-600 col-span-2">{s.username} · Ex {s.exerciseNumber}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={present}
                        onChange={e => toggle(s.username, e.target.checked)}
                      /> Present
                    </label>
                    <details className="text-sm">
                      <summary className="cursor-pointer select-none">Progress</summary>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <input className="border rounded px-2 py-1" type="number" placeholder="Test 1"
                          value={(progress[s.username]?.test1 ?? '')}
                          onChange={e => saveProgress(s.username, { test1: e.target.value === '' ? null : Number(e.target.value) })} />
                        <input className="border rounded px-2 py-1" type="number" placeholder="Test 2"
                          value={(progress[s.username]?.test2 ?? '')}
                          onChange={e => saveProgress(s.username, { test2: e.target.value === '' ? null : Number(e.target.value) })} />
                        <input className="border rounded px-2 py-1" type="number" placeholder="Test 3"
                          value={(progress[s.username]?.test3 ?? '')}
                          onChange={e => saveProgress(s.username, { test3: e.target.value === '' ? null : Number(e.target.value) })} />
                        <input className="border rounded px-2 py-1" type="number" placeholder="Test 4"
                          value={(progress[s.username]?.test4 ?? '')}
                          onChange={e => saveProgress(s.username, { test4: e.target.value === '' ? null : Number(e.target.value) })} />
                        {[1,2,3,4].map(tn => (
                          <div key={tn} className="col-span-2 border rounded p-2">
                            <div className="font-semibold mb-1">AI grade: Test {tn}</div>
                            <div className="grid grid-cols-2 gap-2">
                              <input type="file" accept="image/*" multiple className="border rounded px-2 py-1 col-span-2" onChange={() => { /* handled on button click by reading input ref below */ }} ref={el => { (s._aiRefs = s._aiRefs || {})[tn] = el; }} />
                              <input type="number" className="border rounded px-2 py-1" placeholder="Max points" defaultValue={10} min={0} max={1000} ref={el => { (s._aiRefs = s._aiRefs || {} )[`max_${tn}`] = el; }} />
                              <input type="text" className="border rounded px-2 py-1" placeholder="Criteria (optional)" ref={el => { (s._aiRefs = s._aiRefs || {} )[`crit_${tn}`] = el; }} />
                              <div className="col-span-2 flex items-center gap-2">
                                <button type="button" className="px-3 py-1 rounded bg-zinc-200" onClick={() => {
                                  const files = (s._aiRefs && s._aiRefs[tn] && s._aiRefs[tn].files) || [];
                                  const maxEl = s._aiRefs && s._aiRefs[`max_${tn}`];
                                  const critEl = s._aiRefs && s._aiRefs[`crit_${tn}`];
                                  const maxPoints = maxEl && maxEl.value !== '' ? Number(maxEl.value) : 10;
                                  const criteria = critEl ? String(critEl.value || '') : '';
                                  handleAiGrade(s.username, tn, files, maxPoints, criteria);
                                }}>Grade</button>
                                <button type="button" className="px-3 py-1 rounded bg-zinc-200" onClick={() => loadLastAiResult(s.username, tn)}>Load last result</button>
                              </div>
                              {(() => {
                                const k = gradeKey(s.username, tn);
                                const g = grades[k];
                                if (!g) return null;
                                return (
                                  <div className="col-span-2 text-sm">
                                    {g.loading ? (
                                      <span className="text-zinc-600">Grading…</span>
                                    ) : g.error ? (
                                      <span className="text-red-600">{g.error}</span>
                                    ) : (
                                      <div className="space-y-1">
                                        <div><span className="font-semibold">Points:</span> {g.points != null ? g.points : '—'}</div>
                                        <div>
                                          <div className="font-semibold">Reasoning:</div>
                                          {!g.editing ? (
                                            <div>
                                              {g.reasoning ? (
                                                <div className="whitespace-pre-wrap text-zinc-700">{g.reasoning}</div>
                                              ) : (
                                                <div className="text-zinc-500">—</div>
                                              )}
                                              <div className="mt-1 flex items-center gap-2">
                                                <button type="button" className="px-2 py-0.5 rounded bg-zinc-200" onClick={() => {
                                                  setGrades(prev => ({
                                                    ...prev,
                                                    [k]: { ...(prev[k] || {}), editing: true, draft: prev[k]?.reasoning || '' }
                                                  }));
                                                }}>Edit</button>
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="space-y-2">
                                              <textarea className="border rounded p-2 w-full h-28" value={g.draft || ''} onChange={e => {
                                                const value = e.target.value;
                                                setGrades(prev => ({ ...prev, [k]: { ...(prev[k] || {}), draft: value } }));
                                              }} />
                                              <div className="flex items-center gap-2">
                                                <button type="button" disabled={!!g.saving} className="px-3 py-1 rounded bg-sky-600 text-white disabled:opacity-50" onClick={async () => {
                                                  const draft = (grades[k]?.draft || '').trim();
                                                  setGrades(prev => ({ ...prev, [k]: { ...(prev[k] || {}), saving: true } }));
                                                  try {
                                                    const resp = await fetch('/api/grade-test', {
                                                      method: 'PUT',
                                                      headers: { 'Content-Type': 'application/json' },
                                                      body: JSON.stringify({ username: s.username, testNumber: tn, reasoning: draft })
                                                    });
                                                    if (!resp.ok) {
                                                      const dj = await resp.json().catch(() => ({}));
                                                      throw new Error(dj.error || 'Update failed');
                                                    }
                                                    setGrades(prev => ({
                                                      ...prev,
                                                      [k]: { ...(prev[k] || {}), reasoning: draft, editing: false, saving: false }
                                                    }));
                                                  } catch (err) {
                                                    setGrades(prev => ({ ...prev, [k]: { ...(prev[k] || {}), saving: false, error: err.message || 'Update failed' } }));
                                                  }
                                                }}>Save</button>
                                                <button type="button" disabled={!!g.saving} className="px-3 py-1 rounded bg-zinc-200" onClick={() => {
                                                  setGrades(prev => ({
                                                    ...prev,
                                                    [k]: { ...(prev[k] || {}), editing: false, draft: prev[k]?.reasoning || '' }
                                                  }));
                                                }}>Cancel</button>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        ))}
                        <label className="inline-flex items-center gap-2 col-span-2">
                          <input type="checkbox"
                            checked={!!progress[s.username]?.assignment_task_checked}
                            onChange={e => saveProgress(s.username, { assignment_task_checked: e.target.checked })} /> Task checked
                        </label>
                        <input className="border rounded px-2 py-1 col-span-2" type="text" placeholder="Semestral topic"
                          value={(progress[s.username]?.assignment_topic ?? '')}
                          onChange={e => saveProgress(s.username, { assignment_topic: e.target.value || null })} />
                        <label className="inline-flex items-center gap-2 col-span-2">
                          <input type="checkbox"
                            checked={!!progress[s.username]?.assignment_midterm_ok}
                            onChange={e => saveProgress(s.username, { assignment_midterm_ok: e.target.checked })} /> Mid-term OK
                        </label>
                        <input className="border rounded px-2 py-1 col-span-2" type="text" placeholder="Partner username"
                          value={(progress[s.username]?.assignment_partner ?? '')}
                          onChange={e => saveProgress(s.username, { assignment_partner: e.target.value || null })} />
                        <input className="border rounded px-2 py-1 col-span-2" type="number" placeholder="Final points"
                          value={(progress[s.username]?.assignment_final_points ?? '')}
                          onChange={e => saveProgress(s.username, { assignment_final_points: e.target.value === '' ? null : Number(e.target.value) })} />
                        <input className="border rounded px-2 py-1 col-span-2" type="text" placeholder="Auth code"
                          value={(progress[s.username]?.auth_code ?? '')}
                          onChange={e => saveProgress(s.username, { auth_code: e.target.value || null })} />
                        <button type="button" className="px-3 py-1 rounded bg-zinc-200 col-span-2"
                          onClick={() => {
                            const code = Math.random().toString(36).slice(2, 8).toUpperCase();
                            saveProgress(s.username, { auth_code: code });
                          }}>Generate code</button>
                        {progress[s.username]?.auth_code ? (
                          <a
                            className="px-3 py-1 rounded bg-sky-600 text-white text-center col-span-2"
                            href={buildMailto(s)}
                          >Email login + code</a>
                        ) : (
                          <button type="button" className="px-3 py-1 rounded bg-zinc-300 text-zinc-600 cursor-not-allowed col-span-2" disabled>
                            Email login + code (generate code first)
                          </button>
                        )}
                      </div>
                    </details>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 flex items-center gap-2">
            <button className="px-4 py-2 rounded bg-sky-600 text-white" onClick={handleExport}>Export CSV</button>
            <label className="px-4 py-2 rounded bg-zinc-800 text-white cursor-pointer">
              Import CSV
              <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
            </label>
          </div>

          <section className="mt-8">
            <h2 className="text-xl font-bold mb-3">Overall attendance</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm bg-white rounded-xl shadow">
                <thead className="bg-zinc-100">
                  <tr>
                    <th className="text-left px-3 py-2">First name</th>
                    <th className="text-left px-3 py-2">Surname</th>
                    <th className="text-left px-3 py-2">Username</th>
                    {wednesdays.map(d => (
                      <th key={d} className="text-center px-2 py-2 whitespace-nowrap">{d.slice(5)}</th>
                    ))}
                    <th className="text-center px-3 py-2">Total ✓</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => {
                    let total = 0;
                    return (
                      <tr key={s.username} className="border-t">
                        <td className="px-3 py-2 whitespace-nowrap">{s.firstName}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{s.lastName}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{s.username}</td>
                        {wednesdays.map(d => {
                          const present = !!(overviewMaps[d] && overviewMaps[d][s.username]);
                          if (present) total += 1;
                          return (
                            <td key={d} className="text-center px-2 py-2">{present ? '✓' : '–'}</td>
                          );
                        })}
                        <td className="text-center px-3 py-2 font-semibold">{total}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-bold mb-3">Overall results – tests & semestral work</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm bg-white rounded-xl shadow">
                <thead className="bg-zinc-100">
                  <tr>
                    <th className="text-left px-3 py-2">First name</th>
                    <th className="text-left px-3 py-2">Surname</th>
                    <th className="text-left px-3 py-2">Username</th>
                    <th className="text-center px-3 py-2">T1</th>
                    <th className="text-center px-3 py-2">T2</th>
                    <th className="text-center px-3 py-2">T3</th>
                    <th className="text-center px-3 py-2">T4</th>
                    <th className="text-left px-3 py-2">Topic</th>
                    <th className="text-center px-3 py-2">Task</th>
                    <th className="text-center px-3 py-2">Mid-term</th>
                    <th className="text-left px-3 py-2">Partner</th>
                    <th className="text-center px-3 py-2">Final pts</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => {
                    const p = progress[s.username] || {};
                    return (
                      <tr key={s.username} className="border-t">
                        <td className="px-3 py-2 whitespace-nowrap">{s.firstName}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{s.lastName}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{s.username}</td>
                        <td className="px-3 py-2 text-center whitespace-nowrap">{p.test1 ?? '—'}</td>
                        <td className="px-3 py-2 text-center whitespace-nowrap">{p.test2 ?? '—'}</td>
                        <td className="px-3 py-2 text-center whitespace-nowrap">{p.test3 ?? '—'}</td>
                        <td className="px-3 py-2 text-center whitespace-nowrap">{p.test4 ?? '—'}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{p.assignment_topic || '—'}</td>
                        <td className="px-3 py-2 text-center whitespace-nowrap">{p.assignment_task_checked ? '✓' : '—'}</td>
                        <td className="px-3 py-2 text-center whitespace-nowrap">{p.assignment_midterm_ok ? 'OK' : '—'}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{p.assignment_partner || '—'}</td>
                        <td className="px-3 py-2 text-center whitespace-nowrap">{p.assignment_final_points ?? '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <Analytics />
    </main>
  );
}

function TeacherLogin({ onSuccess, onError }) {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  async function submit(e) {
    e.preventDefault();
    try {
      const res = await fetch('/api/teacher/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        onError(data.error || 'Login failed');
        return;
      }
      onError('');
      onSuccess(username);
    } catch (e) {
      onError('Login failed');
    }
  }
  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <input className="border rounded px-2 py-1" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
      <input type="password" className="border rounded px-2 py-1" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
      <button className="px-3 py-1 rounded bg-sky-600 text-white" type="submit">Login</button>
    </form>
  );
}


