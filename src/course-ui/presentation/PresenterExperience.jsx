import { useEffect, useMemo, useState } from 'react';

import styles from './presentation.module.css';

export function formatElapsed(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

export function buildProjectorPath(sectionId, location) {
  const currentLocation = location || (typeof window === 'undefined' ? null : window.location);
  if (!currentLocation) return '';
  const url = new URL(currentLocation.href || currentLocation.pathname, 'http://localhost');
  url.searchParams.set('mode', 'projector');
  url.searchParams.set('slide', sectionId);
  url.hash = '';
  return `${url.pathname}${url.search}`;
}

export function PresenterExperience({ lesson, sections = [], activeSection, onChange, children }) {
  const [elapsed, setElapsed] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [projectorUrl, setProjectorUrl] = useState('');
  const [popupBlocked, setPopupBlocked] = useState(false);
  const active = useMemo(
    () => sections.find((section) => section?.id === activeSection) || sections[0],
    [activeSection, sections],
  );

  useEffect(() => {
    if (!timerRunning) return undefined;
    const startedAt = Date.now() - elapsed * 1000;
    const timerId = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(timerId);
  }, [elapsed, timerRunning]);

  function openProjector() {
    if (!active?.id) return;
    const path = buildProjectorPath(active.id);
    setProjectorUrl(path);
    const popup = window.open(path, '_blank');
    if (popup) popup.opener = null;
    setPopupBlocked(!popup);
    popup?.focus?.();
  }

  return (
    <main className={styles.presenter} data-presentation-mode="presenter">
      <nav aria-label="Osnova prezentujícího" className={styles.presenterOutline}>
        <p>Osnova prezentujícího</p>
        <strong>{lesson?.shortTitle || lesson?.title || 'Lekce'}</strong>
        <ol>
          {sections.map((section, index) => (
            <li key={section.id}>
              <button
                aria-current={section.id === active?.id ? 'step' : undefined}
                onClick={() => onChange?.(section.id)}
                type="button"
              >
                <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                {section.title}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div className={styles.presenterWorkspace}>
        <header className={styles.presenterHeader}>
          <div>
            <p>Aktuální část</p>
            <h1>{active?.title || lesson?.shortTitle || 'Lekce'}</h1>
          </div>
          <button className={styles.projectorButton} onClick={openProjector} type="button">
            Otevřít projektor
          </button>
        </header>

        <section aria-label="Aktuální výukový obsah" className={styles.presenterContent}>
          {children}
        </section>

        <div className={styles.presenterTools}>
          <section aria-label="Časovač prezentujícího" className={styles.timer}>
            <p>Časovač</p>
            <strong aria-live="polite">{formatElapsed(elapsed)}</strong>
            <div>
              <button onClick={() => setTimerRunning((running) => !running)} type="button">
                {timerRunning ? 'Pozastavit časovač' : 'Spustit časovač'}
              </button>
              <button
                onClick={() => {
                  setTimerRunning(false);
                  setElapsed(0);
                }}
                type="button"
              >
                Resetovat
              </button>
            </div>
          </section>

          <section
            aria-label="Poznámky prezentujícího"
            className={styles.presenterNotes}
            data-projector-private="presenter-notes"
          >
            <p>Poznámky prezentujícího</p>
            <div>
              {active?.presenterNotes ||
                active?.notes ||
                'Pro tuto část nejsou žádné poznámky prezentujícího.'}
            </div>
          </section>
        </div>

        {popupBlocked && projectorUrl ? (
          <a className={styles.popupFallback} href={projectorUrl} rel="noreferrer" target="_blank">
            Otevřít projektor v novém panelu
          </a>
        ) : null}
      </div>
    </main>
  );
}
