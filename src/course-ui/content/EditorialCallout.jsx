import styles from './content.module.css';

const SUPPORTED_TONES = new Set(['note', 'tip', 'warning']);

export default function EditorialCallout({ tone = 'note', title, children }) {
  const normalizedTone = SUPPORTED_TONES.has(tone) ? tone : 'note';

  return (
    <aside className={styles.callout} data-tone={normalizedTone}>
      {title ? <h3>{title}</h3> : null}
      <div>{children}</div>
    </aside>
  );
}
