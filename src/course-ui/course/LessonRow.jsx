import Link from 'next/link';

import styles from './course.module.css';

export function LessonRow({ lesson }) {
  return (
    <Link
      aria-label={`Otevřít lekci ${lesson.number}: ${lesson.shortTitle}`}
      className={styles.lessonRow}
      href={lesson.href}
    >
      <span aria-hidden="true" className={styles.lessonNumber}>
        {String(lesson.number).padStart(2, '0')}
      </span>
      <span className={styles.lessonCopy}>
        <strong>{lesson.shortTitle}</strong>
        <span>{lesson.focus}</span>
      </span>
      <span aria-hidden="true" className={styles.lessonArrow}>
        →
      </span>
    </Link>
  );
}
