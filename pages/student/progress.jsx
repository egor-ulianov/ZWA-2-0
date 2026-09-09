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
          <section className="portal-panel p-6" role="status" aria-live="polite">
            <p className="text-[var(--portal-text-muted)]">Loading…</p>
          </section>
        </main>
      </PortalFrame>
    );
  }

  const p = data.progress || {};
  const dates = Object.keys(attendance).sort();
  const presentCount = dates.filter((date) => Boolean(attendance[date])).length;
  const evaluationEntries = Object.entries(grades).filter(([, evaluation]) => evaluation);
  const evaluationCount = evaluationEntries.length;

  return (
    <PortalFrame meta="Student progress">
      <main className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8 md:py-14">
        <header className="portal-panel p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className={portalClassNames.kicker}>Student access</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
                Your study record
              </h1>
              <p className="mt-3 text-sm leading-6 text-[var(--portal-text-muted)]">
                A read-only record of your attendance, assignment checks, and available evaluations.
              </p>
              <p className="mt-3 text-sm text-[var(--portal-text-muted)]">
                Username:{' '}
                <span className="font-semibold text-[var(--portal-text)]">{data.username}</span>
              </p>
            </div>
            <button type="button" className={portalClassNames.action} onClick={logout}>
              Logout
            </button>
          </div>
        </header>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="portal-panel p-5" role="region" aria-labelledby="glance-title">
            <div className="border-b border-[var(--portal-border)] pb-4">
              <p className={portalClassNames.kicker}>Summary</p>
              <h2 id="glance-title" className="mt-2 text-xl font-semibold">
                At a glance
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--portal-text-muted)]">
                Counts and checks shown here come directly from the records available to you.
              </p>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DataItem
                label="Attendance"
                value={formatCount(presentCount, 'attendance record', 'attendance records')}
              />
              <DataItem
                label="Evaluations"
                value={formatCount(evaluationCount, 'evaluation', 'evaluations')}
              />
              <DataItem
                label="Task checked"
                value={formatBooleanValue(p.assignment_task_checked)}
              />
              <DataItem label="Mid-term" value={formatBooleanValue(p.assignment_midterm_ok)} />
            </div>
          </section>

          <section className="portal-panel p-5" role="region" aria-labelledby="assignment-title">
            <div className="border-b border-[var(--portal-border)] pb-4">
              <p className={portalClassNames.kicker}>Assignment record</p>
              <h2 id="assignment-title" className="mt-2 text-xl font-semibold">
                Assignment record
              </h2>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DataItem
                label="Task checked"
                value={formatBooleanValue(p.assignment_task_checked)}
              />
              <DataItem label="Mid-term" value={formatBooleanValue(p.assignment_midterm_ok)} />
              <DataItem label="Partner" value={p.assignment_partner || '—'} />
              <DataItem label="Final points" value={p.assignment_final_points ?? '—'} />
            </div>
          </section>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="portal-panel" role="region" aria-labelledby="evaluations-title">
            <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-[var(--portal-border)] px-5 py-4">
              <div>
                <p className={portalClassNames.kicker}>Feedback</p>
                <h2 id="evaluations-title" className="mt-2 text-xl font-semibold">
                  Evaluations
                </h2>
              </div>
              <span className="text-sm text-[var(--portal-text-muted)]">
                {formatCount(evaluationCount, 'evaluation', 'evaluations')}
              </span>
            </div>
            <div className="space-y-4 p-5">
              {evaluationEntries.length === 0 ? (
                <p className="text-sm leading-6 text-[var(--portal-text-muted)]">
                  No evaluations are available yet.
                </p>
              ) : (
                evaluationEntries.map(([testNumber, evaluation]) => (
                  <article
                    key={testNumber}
                    className="rounded border border-[var(--portal-border)] p-4"
                  >
                    <h3 className="text-base font-semibold">
                      Evaluation – Test {evaluation.test_number ?? testNumber}
                    </h3>
                    <div className="mt-2 text-sm">
                      <span className="font-medium">Points:</span> {evaluation.points ?? '—'}
                    </div>
                    {evaluation.reasoning ? (
                      <div className="mt-4">
                        <div className="text-xs font-semibold uppercase tracking-wide text-[var(--portal-text-muted)]">
                          AI reasoning
                        </div>
                        <div className="prose prose-sm dark:prose-invert mt-1 max-w-none">
                          <ReactMarkdown>{evaluation.reasoning}</ReactMarkdown>
                        </div>
                      </div>
                    ) : null}
                    {evaluation.teacher_comment ? (
                      <div className="mt-4">
                        <div className="text-xs font-semibold uppercase tracking-wide text-[var(--portal-text-muted)]">
                          Teacher comment
                        </div>
                        <div className="mt-1 whitespace-pre-wrap text-sm text-[var(--portal-text)]">
                          {evaluation.teacher_comment}
                        </div>
                      </div>
                    ) : null}
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="portal-panel" role="region" aria-labelledby="attendance-title">
            <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-[var(--portal-border)] px-5 py-4">
              <div>
                <p className={portalClassNames.kicker}>Attendance</p>
                <h2 id="attendance-title" className="mt-2 text-xl font-semibold">
                  Attendance record
                </h2>
              </div>
              <span className="text-sm text-[var(--portal-text-muted)]">
                {formatCount(presentCount, 'present day', 'present days')}
              </span>
            </div>
            <div className="p-5">
              {dates.length === 0 ? (
                <p className="text-sm leading-6 text-[var(--portal-text-muted)]">
                  No attendance recorded yet.
                </p>
              ) : (
                <ul className="divide-y divide-[var(--portal-border)] overflow-hidden rounded border border-[var(--portal-border)]">
                  {dates.map((date) => {
                    const present = Boolean(attendance[date]);
                    return (
                      <li key={date} className="flex items-center justify-between gap-4 px-3 py-3">
                        <span className="text-sm">{date}</span>
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

function formatCount(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function formatBooleanValue(value) {
  if (typeof value !== 'boolean') return '—';
  return value ? 'Yes' : 'No';
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
