import { CourseApplication } from '../foundation/CourseApplication.jsx';
import { CourseMasthead } from '../foundation/CourseMasthead.jsx';
import styles from './operations.module.css';

export default function OperationsApplication({
  title,
  contextLabel,
  description,
  actions,
  navigation,
  children,
}) {
  return (
    <CourseApplication title={title} variant="operations">
      <CourseMasthead contextLabel={contextLabel || 'Studijní záznam'} />
      <main className={styles.page} data-operations-application="true">
        <header className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>{contextLabel || 'ZWA · provoz'}</p>
            <h1>{title}</h1>
            {description ? <p className={styles.heroDescription}>{description}</p> : null}
            {navigation ? (
              <nav className={styles.workspaceNavigation} aria-label="Teacher workspace sections">
                {navigation}
              </nav>
            ) : null}
          </div>
          {actions ? <div className={styles.heroActions}>{actions}</div> : null}
        </header>
        <div className={styles.content}>{children}</div>
      </main>
    </CourseApplication>
  );
}

export { styles as operationsStyles };
