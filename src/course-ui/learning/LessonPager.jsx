import styles from './learning.module.css';

export function LessonPager({ sections = [], activeSection, onChange }) {
  const activeIndex = Math.max(
    0,
    sections.findIndex((section) => section?.id === activeSection),
  );
  const previous = sections[activeIndex - 1];
  const next = sections[activeIndex + 1];

  return (
    <nav aria-label="Navigace mezi částmi lekce" className={styles.pager}>
      {previous ? (
        <button
          aria-label={`Předchozí: ${previous.title}`}
          onClick={() => onChange?.(previous.id)}
          type="button"
        >
          <span aria-hidden="true">←</span>
          <span>
            <small>Předchozí</small>
            {previous.title}
          </span>
        </button>
      ) : (
        <span />
      )}
      {next ? (
        <button
          aria-label={`Další: ${next.title}`}
          onClick={() => onChange?.(next.id)}
          type="button"
        >
          <span>
            <small>Další</small>
            {next.title}
          </span>
          <span aria-hidden="true">→</span>
        </button>
      ) : (
        <span />
      )}
    </nav>
  );
}
