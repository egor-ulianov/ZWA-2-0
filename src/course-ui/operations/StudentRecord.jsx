import styles from './operations.module.css';

export default function StudentRecord({ username, control, children }) {
  return (
    <article className={styles.studentRecord}>
      <header className={styles.studentRecordHeader}>
        <div>
          <p className={styles.sectionLabel}>Student record</p>
          <h3>{username}</h3>
        </div>
        {control}
      </header>
      {children}
    </article>
  );
}
