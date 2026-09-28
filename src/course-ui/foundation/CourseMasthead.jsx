import Link from 'next/link';

import { ThemeController } from '../theme/ThemeController.jsx';
import styles from './foundation.module.css';

export function CourseMasthead({ contextLabel, outlineControl, actions }) {
  return (
    <header className={styles.masthead}>
      <div className={styles.mastheadInner}>
        <div className={styles.identityGroup}>
          <Link className={styles.identity} href="/">
            ZWA
          </Link>
          {contextLabel ? <span className={styles.context}>{contextLabel}</span> : null}
        </div>
        <div className={styles.controls}>
          {outlineControl}
          {actions}
          <ThemeController />
        </div>
      </div>
    </header>
  );
}
