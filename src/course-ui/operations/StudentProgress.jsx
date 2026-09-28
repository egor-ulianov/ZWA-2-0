import ReactMarkdown from 'react-markdown';

import styles from './operations.module.css';

function formatCount(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function formatBooleanValue(value) {
  if (typeof value !== 'boolean') return '—';
  return value ? 'Yes' : 'No';
}

function DataItem({ label, value }) {
  return (
    <div className={styles.dataItem}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export default function StudentProgress({ data, attendance = {}, grades = {} }) {
  const progress = data?.progress || {};
  const dates = Object.keys(attendance).sort();
  const presentCount = dates.filter((date) => Boolean(attendance[date])).length;
  const evaluations = Object.entries(grades).filter(([, evaluation]) => evaluation);

  return (
    <div className={styles.stack}>
      <p className={styles.muted}>
        Username: <strong>{data?.username}</strong>
      </p>
      <div className={styles.twoColumn}>
        <section className={styles.record} role="region" aria-labelledby="glance-title">
          <header className={styles.recordHeader}>
            <div>
              <p className={styles.sectionLabel}>Summary</p>
              <h2 id="glance-title">At a glance</h2>
            </div>
          </header>
          <dl className={`${styles.recordBody} ${styles.summaryGrid}`}>
            <DataItem
              label="Attendance"
              value={formatCount(presentCount, 'attendance record', 'attendance records')}
            />
            <DataItem
              label="Evaluations"
              value={formatCount(evaluations.length, 'evaluation', 'evaluations')}
            />
            <DataItem
              label="Task checked"
              value={formatBooleanValue(progress.assignment_task_checked)}
            />
            <DataItem label="Mid-term" value={formatBooleanValue(progress.assignment_midterm_ok)} />
          </dl>
        </section>

        <section className={styles.record} role="region" aria-labelledby="assignment-title">
          <header className={styles.recordHeader}>
            <div>
              <p className={styles.sectionLabel}>Assignment record</p>
              <h2 id="assignment-title">Assignment record</h2>
            </div>
          </header>
          <dl className={`${styles.recordBody} ${styles.summaryGrid}`}>
            <DataItem
              label="Task checked"
              value={formatBooleanValue(progress.assignment_task_checked)}
            />
            <DataItem label="Mid-term" value={formatBooleanValue(progress.assignment_midterm_ok)} />
            <DataItem label="Partner" value={progress.assignment_partner || '—'} />
            <DataItem label="Final points" value={progress.assignment_final_points ?? '—'} />
          </dl>
        </section>
      </div>

      <div className={styles.recordGrid}>
        <section className={styles.record} role="region" aria-labelledby="evaluations-title">
          <header className={styles.recordHeader}>
            <div>
              <p className={styles.sectionLabel}>Feedback</p>
              <h2 id="evaluations-title">Evaluations</h2>
            </div>
            <span className={styles.muted}>
              {formatCount(evaluations.length, 'evaluation', 'evaluations')}
            </span>
          </header>
          <div className={`${styles.recordBody} ${styles.evaluationList}`}>
            {evaluations.length === 0 ? (
              <p className={styles.muted}>No evaluations are available yet.</p>
            ) : (
              evaluations.map(([testNumber, evaluation]) => (
                <article className={styles.evaluation} key={testNumber}>
                  <h3>Evaluation – Test {evaluation.test_number ?? testNumber}</h3>
                  <p>
                    <strong>Points:</strong> {evaluation.points ?? '—'}
                  </p>
                  {evaluation.reasoning ? (
                    <div>
                      <p className={styles.sectionLabel}>AI reasoning</p>
                      <div className={styles.markdown}>
                        <ReactMarkdown>{evaluation.reasoning}</ReactMarkdown>
                      </div>
                    </div>
                  ) : null}
                  {evaluation.teacher_comment ? (
                    <div>
                      <p className={styles.sectionLabel}>Teacher comment</p>
                      <p className={styles.markdown}>{evaluation.teacher_comment}</p>
                    </div>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </section>

        <section className={styles.record} role="region" aria-labelledby="attendance-title">
          <header className={styles.recordHeader}>
            <div>
              <p className={styles.sectionLabel}>Attendance</p>
              <h2 id="attendance-title">Attendance record</h2>
            </div>
            <span className={styles.muted}>
              {formatCount(presentCount, 'present day', 'present days')}
            </span>
          </header>
          <div className={styles.recordBody}>
            {dates.length === 0 ? (
              <p className={styles.muted}>No attendance recorded yet.</p>
            ) : (
              <ul className={styles.attendanceList}>
                {dates.map((date) => (
                  <li key={date}>
                    <span>{date}</span>
                    <span className={attendance[date] ? styles.positive : styles.muted}>
                      {attendance[date] ? 'Present' : 'Absent'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
