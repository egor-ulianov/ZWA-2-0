import Head from 'next/head';

import styles from './foundation.module.css';

export function CourseApplication({ variant = 'course', title, children }) {
  const documentTitle = title ? `${title} · ZWA` : 'ZWA · Základy webových aplikací';

  return (
    <div className={styles.application} data-course-application={variant}>
      <Head>
        <title>{documentTitle}</title>
        <meta
          content="Výukový kurz základů webových aplikací: od HTML a CSS po databáze."
          name="description"
        />
      </Head>
      {children}
    </div>
  );
}
