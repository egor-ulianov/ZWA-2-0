import React from 'react';

import OperationsApplication, {
  operationsStyles,
} from '../../src/course-ui/operations/OperationsApplication.jsx';
import StudentProgress from '../../src/course-ui/operations/StudentProgress.jsx';
import { isUnauthorized, request } from '../../src/lib/apiClient.js';

export default function StudentProgressPage() {
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
        const [record, attendanceRecord, gradeRecord] = await Promise.all([
          request('/api/student/me', { signal: controller.signal }),
          request('/api/student/attendance', { signal: controller.signal }),
          request('/api/student/grades', { signal: controller.signal }),
        ]);
        if (!mounted) return;
        setData(record);
        setAttendance(attendanceRecord.attendance || {});
        setGrades(gradeRecord.grades || {});
      } catch (cause) {
        if (cause.name === 'AbortError') return;
        if (isUnauthorized(cause)) {
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

  const actions = data ? (
    <button className={operationsStyles.secondaryButton} onClick={logout} type="button">
      Logout
    </button>
  ) : null;

  return (
    <OperationsApplication
      actions={actions}
      contextLabel="Student access"
      description="A read-only record of your attendance, assignment checks, and available evaluations."
      title="Your study record"
    >
      {error ? (
        <section className={operationsStyles.statusPanel} role="alert">
          <p className={operationsStyles.error}>{error}</p>
          <button
            className={operationsStyles.primaryButton}
            onClick={() => {
              setError('');
              setLoadAttempt((attempt) => attempt + 1);
            }}
            type="button"
          >
            Retry
          </button>
        </section>
      ) : null}
      {!error && !data ? (
        <section className={operationsStyles.statusPanel} role="status" aria-live="polite">
          <p className={operationsStyles.muted}>Loading…</p>
        </section>
      ) : null}
      {!error && data ? (
        <StudentProgress attendance={attendance} data={data} grades={grades} />
      ) : null}
    </OperationsApplication>
  );
}
