import styles from './content.module.css';

export default function EditorialCode({ children, language, label }) {
  return (
    <figure className={styles.codeFigure} data-language={language || undefined}>
      {label ? <figcaption>{label}</figcaption> : null}
      <pre tabIndex={0}>
        <code>{children}</code>
      </pre>
    </figure>
  );
}
