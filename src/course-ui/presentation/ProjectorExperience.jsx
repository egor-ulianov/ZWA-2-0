import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';

import { LectureIllustration } from '../art/LectureIllustration.jsx';
import { projectDomChildren, projectReactChildren } from './projectorContent.js';
import styles from './presentation.module.css';

const useClientLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function ProjectorExperience({ lesson, sections = [], activeSection, onChange, children }) {
  const activeIndex = Math.max(
    0,
    sections.findIndex((section) => section?.id === activeSection),
  );
  const active = sections[activeIndex] || sections[0] || null;
  const previous = sections[activeIndex - 1];
  const next = sections[activeIndex + 1];
  const reactProjection = projectReactChildren(children);
  const [domProjection, setDomProjection] = useState([]);
  const [capturedSection, setCapturedSection] = useState(null);
  const domCaptureReady = useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot,
  );
  const sourceRef = useRef(null);
  const hasDomProjection = domCaptureReady && capturedSection === active?.id;
  const needsDomProjection = domCaptureReady && !hasDomProjection;
  const projectedContent = hasDomProjection ? domProjection : reactProjection;

  useClientLayoutEffect(() => {
    if (!needsDomProjection || !sourceRef.current) return;
    const labelledSection = sourceRef.current.querySelector(':scope > section[aria-labelledby]');
    const lessonContent = labelledSection?.lastElementChild;
    setDomProjection(projectDomChildren(lessonContent || sourceRef.current));
    setCapturedSection(active?.id || null);
  }, [active?.id, needsDomProjection]);

  return (
    <main
      aria-label={`${lesson?.shortTitle || lesson?.title || 'Lekce'} — projekce`}
      className={styles.projector}
      data-presentation-mode="projector"
    >
      {needsDomProjection ? (
        <div aria-hidden="true" hidden ref={sourceRef}>
          {children}
        </div>
      ) : null}
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
