import { LectureIllustration } from '../art/LectureIllustration.jsx';
import { LessonRow } from './LessonRow.jsx';
import styles from './course.module.css';

export function ModuleCard({ module, priority = false }) {
  const headingId = `course-module-${module.id}`;

  return (
    <article
      aria-labelledby={headingId}
      className={styles.moduleCard}
      data-color={module.color}
      data-course-module={module.id}
    >
      <LectureIllustration
        className={styles.moduleArtwork}
        lesson={module.lessons[0]}
        priority={priority}
      />
      <div className={styles.moduleBody}>
        <p className={styles.moduleNumber}>Modul {module.number}</p>
        <h2 id={headingId}>{module.title}</h2>
        <ol className={styles.lessonList}>
          {module.lessons.map((lesson) => (
            <li key={lesson.slug}>
              <LessonRow lesson={lesson} />
            </li>
          ))}
        </ol>
      </div>
    </article>
  );
}
