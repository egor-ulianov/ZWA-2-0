import { useEffect, useRef } from 'react';

import { getSectionDomIds } from './navigation.js';
import styles from './learning.module.css';

export function LearningSection({ section, idPrefix = 'lesson', children }) {
  const headingRef = useRef(null);
  const mountedRef = useRef(false);
  const { headingId, sectionId } = getSectionDomIds(section?.id, idPrefix);

  useEffect(() => {
    if (mountedRef.current) headingRef.current?.focus({ preventScroll: true });
    mountedRef.current = true;
  }, [section?.id]);

  return (
    <section aria-labelledby={headingId} className={styles.learningSection} id={sectionId}>
      <h2 id={headingId} ref={headingRef} tabIndex={-1}>
        {section?.title || 'Část lekce'}
      </h2>
      {section?.subtitle ? <p className={styles.sectionSubtitle}>{section.subtitle}</p> : null}
      <div className={styles.sectionContent}>{children}</div>
    </section>
  );
}
