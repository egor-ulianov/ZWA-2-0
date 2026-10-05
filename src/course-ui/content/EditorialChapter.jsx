import styles from './content.module.css';

export function EditorialChapter({ children, intro, ...props }) {
  return (
    <div className={styles.editorialChapter} data-editorial-chapter="true" {...props}>
      {intro ? <p className={styles.editorialChapterLead}>{intro}</p> : null}
      {children}
    </div>
  );
}

export function EditorialChapterSection({ children, index, title, ...props }) {
  return (
    <section className={styles.editorialChapterSection} {...props}>
      <span aria-hidden="true" className={styles.editorialChapterIndex}>
        {String(index).padStart(2, '0')}
      </span>
      <div className={styles.editorialChapterBody}>
        <h3>{title}</h3>
        {children}
      </div>
    </section>
  );
}
