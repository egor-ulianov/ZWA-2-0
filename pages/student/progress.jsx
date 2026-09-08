import React from 'react';
import ReactMarkdown from 'react-markdown';

import PortalFrame from '../../src/components/portal/PortalFrame.jsx';
import { portalClassNames } from '../../src/components/portal/portalClasses.js';
import { isUnauthorized, request } from '../../src/lib/apiClient.js';

export default function StudentProgress() {
  const [data, setData] = React.useState(null);
  const [error, setError] = React.useState('');
  const [attendance, setAttendance] = React.useState({});
  const [grades, setGrades] = React.useState({});
  const [loadAttempt, setLoadAttempt] = React.useState(0);
  React.useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    async function load() {
      if (mounted) setError('');
      try {
        const [d, at, gj] = await Promise.all([
          request('/api/student/me', { signal: controller.signal }),
          request('/api/student/attendance', { signal: controller.signal }),
          request('/api/student/grades', { signal: controller.signal }),
        ]);
        if (!mounted) return;
        setData(d);
        setAttendance(at.attendance || {});
        setGrades(gj.grades || {});
      } catch (e) {
        if (e.name === 'AbortError') return;
        if (isUnauthorized(e)) {
          window.location.replace('/student');
          return;
        }
        if (mounted) setError('Unable to load your progress. Please try again.');
      }
    }
    load();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, [loadAttempt]);

  async function logout() {
    try {
      await request('/api/student/logout', { method: 'POST' });
    } finally {
      window.location.replace('/student');
    }
  }

  if (error) {
    return (
      <PortalFrame meta="Student progress">
        <main className="mx-auto w-full max-w-4xl px-4 py-10 md:px-8 md:py-14">
          <section className="portal-panel max-w-2xl p-6" role="alert">
            <p className="text-[var(--portal-coral)]">{error}</p>
            <button
              type="button"
              className={`${portalClassNames.action} mt-5`}
              onClick={() => {
                setError('');
                setLoadAttempt((attempt) => attempt + 1);
              }}
            >
              Retry
            </button>
          </section>
        </main>
      </PortalFrame>
    );
  }

  if (!data) {
    return (
      <PortalFrame meta="Student progress">
        <main className="mx-auto w-full max-w-4xl px-4 py-10 md:px-8 md:py-14">
          <section className="portal-panel p-6">
            <p className="text-[var(--portal-text-muted)]">Loading…</p>
          </section>
        </main>
      </PortalFrame>
    );
  }

  const p = data.progress || {};
  const dates = Object.keys(attendance).sort();
  const total = dates.reduce((acc, d) => acc + (attendance[d] ? 1 : 0), 0);

  return (
    <PortalFrame meta="Student progress">
      <main className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8 md:py-14">
        <header className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className={portalClassNames.kicker}>Student access</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              Your Progress
            </h1>
            <p className="mt-2 text-sm text-[var(--portal-text-muted)]">
              Username:{' '}
              <span className="font-semibold text-[var(--portal-text)]">{data.username}</span>
            </p>
          </div>
          <button type="button" className={portalClassNames.action} onClick={logout}>
            Logout
          </button>
        </header>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="portal-panel" aria-labelledby="scores-title">
            <div className="flex items-center justify-between gap-4 border-b border-[var(--portal-border)] px-4 py-3">
              <h2 id="scores-title" className="text-lg font-semibold">
                Scores & Assignment
              </h2>
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--portal-text-muted)]">
                Updated
              </span>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <DataItem label="Task checked" value={p.assignment_task_checked ? 'Yes' : 'No'} />
                <DataItem label="Mid‑term" value={p.assignment_midterm_ok ? 'OK' : '—'} />
                <DataItem
                  label="Partner"
                  value={p.assignment_partner || '—'}
                  className="col-span-2"
                />
                <DataItem
                  label="Final points"
                  value={p.assignment_final_points ?? '—'}
                  className="col-span-2"
                />
              </div>
              <div className="mt-6 space-y-3">
                {[1, 2, 3, 4].map((tn) => {
                  const g = grades[tn] || null;
                  if (!g) return null;
                  return (
                    <div key={tn} className="rounded border border-[var(--portal-border)] p-3">
                      <div className="mb-1 text-sm font-semibold">Evaluation – Test {tn}</div>
                      <div className="text-sm">
                        <span className="font-medium">Points:</span> {g.points ?? '—'}
                      </div>
                      {g.reasoning ? (
                        <div className="mt-2">
                          <div className="text-xs font-semibold uppercase tracking-wide text-[var(--portal-text-muted)]">
                            AI reasoning
                          </div>
                          <div className="prose prose-sm dark:prose-invert mt-1 max-w-none">
                            <ReactMarkdown>{g.reasoning}</ReactMarkdown>
                          </div>
                        </div>
                      ) : null}
                      {g.teacher_comment ? (
                        <div className="mt-3">
                          <div className="text-xs font-semibold uppercase tracking-wide text-[var(--portal-text-muted)]">
                            Teacher comment
                          </div>
                          <div className="mt-1 whitespace-pre-wrap text-sm text-[var(--portal-text)]">
                            {g.teacher_comment}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="portal-panel" aria-labelledby="attendance-title">
            <div className="flex items-center justify-between gap-4 border-b border-[var(--portal-border)] px-4 py-3">
              <h2 id="attendance-title" className="text-lg font-semibold">
                Attendance
              </h2>
              <div className="text-sm text-[var(--portal-text-muted)]">
                Total present:{' '}
                <span className="font-semibold text-[var(--portal-text)]">{total}</span>
              </div>
            </div>
            <div className="p-4">
              {dates.length === 0 ? (
                <div className="text-sm text-[var(--portal-text-muted)]">
                  No attendance recorded yet.
                </div>
              ) : (
                <ul className="divide-y divide-[var(--portal-border)] overflow-hidden rounded border border-[var(--portal-border)]">
                  {dates.map((d) => {
                    const present = !!attendance[d];
                    return (
                      <li key={d} className="flex items-center justify-between gap-4 px-3 py-2.5">
                        <span className="text-sm">{d}</span>
                        <span
                          className={
                            present
                              ? 'text-sm font-semibold text-emerald-700 dark:text-emerald-300'
                              : 'text-sm text-[var(--portal-text-muted)]'
                          }
                        >
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
      </main>
    </PortalFrame>
  );
}

function DataItem({ label, value, className }) {
  return (
    <div className={className}>
      <div className="text-xs font-semibold uppercase tracking-wide text-[var(--portal-text-muted)]">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-[var(--portal-text)]">{value}</div>
    </div>
  );
}
