import styles from './operations.module.css';

export default function StudentRecord({
  username,
  firstName,
  lastName,
  parallel,
  control,
  children,
}) {
  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  return (
    <article className={styles.studentRecord}>
      <header className={styles.studentRecordHeader}>
        <div>
          <p className={styles.sectionLabel}>Student record</p>
          <h3>{fullName || username}</h3>
          {fullName || parallel ? (
            <p className={styles.studentMeta}>
              {fullName ? <span>{username}</span> : null}
              {parallel ? <span>Parallel {parallel}</span> : null}
            </p>
          ) : null}
        </div>
        {control}
      </header>
      {children}
    </article>
  );
}
