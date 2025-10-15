import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Analytics } from "@vercel/analytics/next"

export default function StudentProgress() {
  const [data, setData] = React.useState(null);
  const [error, setError] = React.useState('');
  const [attendance, setAttendance] = React.useState({});
  const [grades, setGrades] = React.useState({});
  React.useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch('/api/student/me');
        if (!res.ok) throw new Error('Unauthorized');
        const d = await res.json();
        if (!mounted) return;
        setData(d);
        const a = await fetch('/api/student/attendance');
        if (a.ok) {
          const at = await a.json();
          if (mounted) setAttendance(at.attendance || {});
        }
        const g = await fetch('/api/student/grades');
        if (g.ok) {
          const gj = await g.json();
          if (mounted) setGrades(gj.grades || {});
        }
      } catch (e) {
        if (mounted) setError('Unauthorized');
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  if (error) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-zinc-50 to-sky-50 dark:from-zinc-950 dark:to-zinc-900 text-zinc-900 dark:text-zinc-50">
        <main className="max-w-4xl mx-auto p-6">
          <div className="rounded-2xl border border-rose-300/40 dark:border-rose-900/40 bg-white/70 dark:bg-zinc-900/60 p-6">
            <p className="text-rose-600 dark:text-rose-400">{error}</p>
          </div>
        </main>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-zinc-50 to-sky-50 dark:from-zinc-950 dark:to-zinc-900 text-zinc-900 dark:text-zinc-50">
        <main className="max-w-4xl mx-auto p-6">
          <div className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 p-6">
            <p className="text-zinc-600 dark:text-zinc-300">Loading…</p>
          </div>
        </main>
      </div>
    );
  }

  const p = data.progress || {};
  const dates = Object.keys(attendance).sort();
  const total = dates.reduce((acc, d) => acc + (attendance[d] ? 1 : 0), 0);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-zinc-50 to-sky-50 dark:from-zinc-950 dark:to-zinc-900 text-zinc-900 dark:text-zinc-50">
      <div className="max-w-5xl mx-auto p-4 md:p-8 relative">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
          <div className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-sky-300/40 dark:bg-sky-500/20 blur-3xl" />
          <div className="absolute top-1/3 -left-24 h-72 w-72 rounded-full bg-fuchsia-300/40 dark:bg-fuchsia-500/20 blur-3xl" />
        </div>

        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Your Progress</h1>
            <p className="text-xs md:text-sm text-zinc-500 mt-1">Username: <span className="font-semibold text-zinc-700 dark:text-zinc-200">{data.username}</span></p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 shadow">
            <div className="px-4 py-3 border-b border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-lg font-bold">Scores & Assignment</h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800">updated</span>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <DataItem label="Test 1" value={p.test1 ?? '—'} />
                <DataItem label="Test 2" value={p.test2 ?? '—'} />
                <DataItem label="Test 3" value={p.test3 ?? '—'} />
                <DataItem label="Test 4" value={p.test4 ?? '—'} />
                <DataItem label="Task checked" value={p.assignment_task_checked ? 'Yes' : 'No'} />
                <DataItem label="Mid‑term" value={p.assignment_midterm_ok ? 'OK' : '—'} />
                <DataItem label="Partner" value={p.assignment_partner || '—'} className="col-span-2" />
                <DataItem label="Final points" value={p.assignment_final_points ?? '—'} className="col-span-2" />
              </div>
              <div className="mt-4 space-y-3">
                {[1,2,3,4].map(tn => {
                  const g = grades[tn] || null;
                  if (!g) return null;
                  return (
                    <div key={tn} className="rounded-lg border border-zinc-200/60 dark:border-zinc-800 p-3 bg-white/60 dark:bg-zinc-900/40">
                      <div className="text-sm font-semibold mb-1">Evaluation – Test {tn}</div>
                      <div className="text-sm"><span className="font-medium">Points:</span> {g.points ?? '—'}</div>
                      {g.reasoning ? (
                        <div className="mt-1">
                          <div className="text-xs uppercase tracking-wide text-zinc-500">AI reasoning</div>
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{g.reasoning}</ReactMarkdown>
                          </div>
                        </div>
                      ) : null}
                      {g.teacher_comment ? (
                        <div className="mt-2">
                          <div className="text-xs uppercase tracking-wide text-zinc-500">Teacher comment</div>
                          <div className="text-sm whitespace-pre-wrap text-zinc-800 dark:text-zinc-200">{g.teacher_comment}</div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 shadow">
            <div className="px-4 py-3 border-b border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-lg font-bold">Attendance</h2>
              <div className="text-xs text-zinc-600 dark:text-zinc-300">Total present: <span className="font-semibold">{total}</span></div>
            </div>
            <div className="p-4">
              {dates.length === 0 ? (
                <div className="text-sm text-zinc-600 dark:text-zinc-300">No attendance recorded yet.</div>
              ) : (
                <ul className="divide-y divide-zinc-200/60 dark:divide-zinc-800 rounded-xl overflow-hidden">
                  {dates.map((d) => {
                    const present = !!attendance[d];
                    return (
                      <li key={d} className="flex items-center justify-between px-3 py-2 bg-white/60 dark:bg-zinc-900/40">
                        <span className="text-sm">{d}</span>
                        <span className={present ? 'text-emerald-600 text-sm font-medium' : 'text-zinc-500 text-sm'}>
                          {present ? 'Present' : 'Absent'}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        </div>

        <footer className="mt-8 text-sm text-zinc-500">
          © 2025 ZWA – Student view
        </footer>
      </div>
      <Analytics />
    </div>
  );
}

function DataItem({ label, value, className }) {
  return (
    <div className={className}>
      <div className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-zinc-800 dark:text-zinc-100">{value}</div>
    </div>
  );
}


