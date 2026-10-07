import styles from './operations.module.css';

export default function AttendanceImportPreview({ draft, disabled, onConfirm, onCancel }) {
  if (!draft) return null;
  return (
    <section
      aria-labelledby="import-preview-title"
      aria-live="polite"
      className={styles.panel}
      data-import-preview="true"
    >
      <p className={styles.sectionLabel}>Kontrola před zápisem</p>
      <h2 id="import-preview-title">Import preview</h2>
      <p>
        {draft.entries.length} valid attendance cells across{' '}
        {new Set(draft.entries.map((entry) => entry.lecture)).size} lectures,{' '}
        {draft.rejected.length} rejected rows.
      </p>
      {draft.rejected.length > 0 ? (
        <ul className={styles.error}>
          {draft.rejected.map((item) => (
            <li key={`${item.row}-${item.username}`}>
              Row {item.row} ({item.username || 'blank'}): {item.reason}
            </li>
          ))}
        </ul>
      ) : null}
      <div className={styles.buttonRow}>
        <button
          className={styles.primaryButton}
          disabled={disabled || !draft.entries.length}
          onClick={onConfirm}
          type="button"
        >
          Confirm and persist import
        </button>
        <button className={styles.secondaryButton} onClick={onCancel} type="button">
          Cancel
        </button>
      </div>
    </section>
  );
}
