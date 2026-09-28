import { LectureIllustration } from '../art/LectureIllustration.jsx';
import { projectReactChildren } from './projectorContent.js';
import styles from './presentation.module.css';

export function ProjectorExperience({ lesson, sections = [], activeSection, onChange, children }) {
  const activeIndex = Math.max(
    0,
    sections.findIndex((section) => section?.id === activeSection),
  );
  const active = sections[activeIndex] || sections[0] || null;
  const previous = sections[activeIndex - 1];
  const next = sections[activeIndex + 1];
  const projectedContent = projectReactChildren(children);

  return (
    <main
      aria-label={`${lesson?.shortTitle || lesson?.title || 'Lekce'} — projekce`}
      className={styles.projector}
      data-presentation-mode="projector"
    >
      <header className={styles.projectorHeader}>
        <p>{lesson?.number ? `Lekce ${String(lesson.number).padStart(2, '0')}` : 'Lekce'}</p>
        <span aria-label="Pozice snímku">
          {String(activeIndex + 1).padStart(2, '0')} /{' '}
          {String(Math.max(1, sections.length)).padStart(2, '0')}
        </span>
      </header>

      <div className={styles.projectorStage}>
        {activeIndex === 0 && lesson?.artwork ? (
          <LectureIllustration className={styles.projectorArtwork} lesson={lesson} priority />
        ) : null}
        <div className={styles.projectorCopy}>
          <h1>{active?.title || lesson?.shortTitle || 'Lekce'}</h1>
          {active?.subtitle ? <p>{active.subtitle}</p> : null}
          {projectedContent.length > 0 ? (
            <div className={styles.projectedContent}>{projectedContent}</div>
          ) : null}
        </div>
      </div>

      <nav aria-label="Navigace mezi snímky" className={styles.projectorNavigation}>
        <button
          aria-label="Předchozí snímek"
          disabled={!previous}
          onClick={() => previous && onChange?.(previous.id)}
          type="button"
        >
          ← Předchozí snímek
        </button>
        <button
          aria-label="Následující snímek"
          disabled={!next}
          onClick={() => next && onChange?.(next.id)}
          type="button"
        >
          Následující snímek →
        </button>
      </nav>
    </main>
  );
}
