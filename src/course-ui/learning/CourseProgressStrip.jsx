import styles from './learning.module.css';

export function CourseProgressStrip({ sections = [], activeSection }) {
  const activeIndex = Math.max(
    0,
    sections.findIndex((section) => section?.id === activeSection),
  );
  const total = Math.max(1, sections.length);
  const current = Math.min(activeIndex + 1, total);

  return (
    <div
      aria-label="Průběh lekce"
      aria-valuemax={total}
      aria-valuemin="1"
      aria-valuenow={current}
      className={styles.progress}
      role="progressbar"
    >
      <span style={{ width: `${(current / total) * 100}%` }} />
      <span className={styles.progressLabel}>
        {current} / {total}
      </span>
    </div>
  );
}
