import styles from './content.module.css';

export default function LessonSummary({ intro, items }) {
  return (
    <section
      aria-label="Rychlý přehled lekce"
      className={styles.lessonSummary}
      data-lesson-summary="true"
    >
      {intro ? <p className={styles.lessonSummaryIntro}>{intro}</p> : null}
      <ol className={styles.lessonSummaryList}>
        {items.map((item, index) => (
          <li key={`${index}-${typeof item === 'string' ? item : 'lesson-summary-item'}`}>
            <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <div>{item}</div>
          </li>
        ))}
      </ol>
    </section>
  );
}
