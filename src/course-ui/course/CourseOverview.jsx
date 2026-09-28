import Link from 'next/link';

import { CourseApplication } from '../foundation/CourseApplication.jsx';
import { CourseMasthead } from '../foundation/CourseMasthead.jsx';
import { getCourseModules } from './courseModel.js';
import { ModuleCard } from './ModuleCard.jsx';
import styles from './course.module.css';

export function CourseOverview({ lessons }) {
  const modules = getCourseModules(lessons);
  const accessAction = (
    <Link className={styles.mastheadLink} href="/student">
      Moje studium
    </Link>
  );

  return (
    <CourseApplication title="Kurz základů webových aplikací" variant="catalog">
      <CourseMasthead actions={accessAction} contextLabel="Základy webových aplikací" />
      <main className={styles.overview}>
        <div className={styles.overviewInner}>
          <header className={styles.introduction}>
            <p className={styles.eyebrow}>Kurz · 12 lekcí</p>
            <h1>Jak funguje moderní web</h1>
            <p>
              Od sémantického HTML přes interaktivní rozhraní až po bezpečnou práci se stavem a daty
              na serveru.
            </p>
          </header>

          <div className={styles.moduleGrid}>
            {modules.map((module, index) => (
              <ModuleCard key={module.id} module={module} priority={index === 0} />
            ))}
          </div>

          <footer className={styles.courseFooter}>
            <span>ZWA · výukové materiály</span>
            <nav aria-label="Správa kurzu">
              <Link href="/teacher">Vyučující</Link>
              <Link href="/attendance" prefetch={false}>
                Docházka
              </Link>
            </nav>
          </footer>
        </div>
      </main>
    </CourseApplication>
  );
}
