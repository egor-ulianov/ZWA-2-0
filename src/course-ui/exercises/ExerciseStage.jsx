import { isValidElement, useEffect, useRef, useState } from 'react';

import styles from './exercise.module.css';

export function createExerciseState(draft = '') {
  return { draft: String(draft), results: [] };
}

export function reduceExerciseState(state, action) {
  if (!state || typeof state !== 'object') return createExerciseState();
  if (action?.type === 'edit') {
    return { ...state, draft: String(action.draft ?? ''), results: [] };
  }
  if (action?.type === 'verified') {
    return { ...state, results: Array.isArray(action.results) ? action.results : [] };
  }
  return state;
}

function renderVerification(verification) {
  if (isValidElement(verification)) return verification;
  if (!Array.isArray(verification) || verification.length === 0) {
    return <p className={styles.emptyResult}>Spusťte ověření a zkontrolujte řešení.</p>;
  }
  return (
    <ul className={styles.results} aria-live="polite">
      {verification.map((result, index) => {
        const passed = Boolean(result?.ok);
        return (
          <li
            key={String(result?.id || `result-${index + 1}`)}
            data-result-state={passed ? 'passed' : 'failed'}
          >
            <strong>
              <span aria-hidden="true">{passed ? '✓' : '×'}</span>{' '}
              {passed ? 'Splněno' : 'Nesplněno'}
            </strong>
            <span>{String(result?.text || '')}</span>
            {result?.hint ? <small>{String(result.hint)}</small> : null}
          </li>
        );
      })}
    </ul>
  );
}

export default function ExerciseStage({
  brief,
  studio,
  preview,
  verification,
  solution,
  privateMarker = 'exercise-stage',
  onVerify,
  verificationLabel = 'Spustit ověření',
  staticCheck = false,
}) {
  const [ideExpanded, setIdeExpanded] = useState(false);
  const shrinkButtonRef = useRef(null);
  const workspaceRef = useRef(null);

  useEffect(() => {
    if (!ideExpanded) return undefined;

    const previousOverflow = document.body.style.overflow;
    const returnFocus = document.activeElement;
    const focusFrame = requestAnimationFrame(() => shrinkButtonRef.current?.focus());

    document.body.style.overflow = 'hidden';

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIdeExpanded(false);
        return;
      }

      if (event.key !== 'Tab') return;
      const focusable = Array.from(
        workspaceRef.current?.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) || [],
      ).filter((element) => !element.hasAttribute('hidden'));
      const first = focusable[0];
      const last = focusable.at(-1);

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      requestAnimationFrame(() => returnFocus?.focus());
    };
  }, [ideExpanded]);

  return (
    <div className={styles.stage} data-exercise-stage="true" data-projector-private={privateMarker}>
      <section role="region" aria-label="Zadání" className={styles.brief}>
        <p className={styles.eyebrow}>Praktická práce</p>
        <h3>Zadání</h3>
        <div>{brief}</div>
      </section>

      {ideExpanded ? (
        <div
          aria-hidden="true"
          className={styles.ideBackdrop}
          data-ide-backdrop="true"
          onClick={() => setIdeExpanded(false)}
        />
      ) : null}

      <section
        ref={workspaceRef}
        role={ideExpanded ? 'dialog' : 'region'}
        aria-label={ideExpanded ? 'Rozšířené IDE' : 'IDE'}
        aria-modal={ideExpanded ? 'true' : undefined}
        className={`${styles.workspace} ${ideExpanded ? styles.workspaceExpanded : ''}`}
        data-ide-expanded={ideExpanded ? 'true' : undefined}
      >
        <div className={styles.workspaceHeader}>
          <div className={styles.regionHeading}>
            <span>02</span>
            <h3>IDE</h3>
          </div>
          <button
            ref={ideExpanded ? shrinkButtonRef : undefined}
            type="button"
            className={styles.ideSizeButton}
            aria-label={ideExpanded ? 'Zmenšit IDE' : 'Rozbalit IDE'}
            onClick={() => setIdeExpanded((expanded) => !expanded)}
          >
            <span aria-hidden="true">{ideExpanded ? '↙' : '↗'}</span>
            {ideExpanded ? 'Zmenšit IDE' : 'Rozbalit IDE'}
          </button>
        </div>
        {studio}
      </section>

      <section role="region" aria-label="Náhled" className={styles.preview}>
        <div className={styles.regionHeading}>
          <span>03</span>
          <h3>Náhled</h3>
        </div>
        <div className={styles.previewSurface}>{preview}</div>
      </section>

      <section role="region" aria-label="Ověření" className={styles.verification}>
        <div className={styles.verificationHeader}>
          <div className={styles.regionHeading}>
            <span>04</span>
            <h3>Ověření</h3>
          </div>
          {onVerify ? (
            <button type="button" onClick={onVerify}>
              {verificationLabel}
            </button>
          ) : null}
        </div>
        {staticCheck ? (
          <p className={styles.staticNotice}>Statická kontrola — kód se v prohlížeči nespouští.</p>
        ) : null}
        {renderVerification(verification)}
      </section>

      {solution ? (
        <details className={styles.solution}>
          <summary>Referenční řešení</summary>
          <div aria-readonly="true">{solution}</div>
        </details>
      ) : null}
    </div>
  );
}
