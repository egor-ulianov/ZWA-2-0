import { isValidElement } from 'react';

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
  return (
    <div className={styles.stage} data-exercise-stage="true" data-projector-private={privateMarker}>
      <section role="region" aria-label="Zadání" className={styles.brief}>
        <p className={styles.eyebrow}>Praktická práce</p>
        <h3>Zadání</h3>
        <div>{brief}</div>
      </section>

      <section role="region" aria-label="IDE" className={styles.workspace}>
        <div className={styles.regionHeading}>
          <span>02</span>
          <h3>IDE</h3>
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
