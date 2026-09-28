import { LectureIllustration } from '../art/LectureIllustration.jsx';
import styles from './learning.module.css';

export function LessonHero({ lesson, title, subtitle, objective }) {
  return (
    <header className={styles.hero}>
      <LectureIllustration className={styles.heroArtwork} lesson={lesson} priority />
      <div className={styles.editorialHeader}>
        <p className={styles.lessonNumber}>
          {lesson?.number ? `Lekce ${String(lesson.number).padStart(2, '0')}` : 'Lekce'}
        </p>
        <h1>{title || lesson?.shortTitle || lesson?.title || 'Lekce'}</h1>
        {subtitle ? <div className={styles.subtitle}>{subtitle}</div> : null}
        {objective ? (
          <div className={styles.objective}>
            <span>Cíl lekce</span>
            <p>{objective}</p>
          </div>
        ) : null}
      </div>
    </header>
  );
}
