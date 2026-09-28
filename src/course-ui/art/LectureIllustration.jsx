import Image from 'next/image';
import { useState } from 'react';

import styles from './art.module.css';

export function LectureIllustration({ lesson, className = '', priority = false }) {
  const [failed, setFailed] = useState(false);
  const moduleColor = lesson?.moduleId || 'web-foundations';
  const classes = [styles.frame, className].filter(Boolean).join(' ');

  return (
    <div
      aria-hidden="true"
      className={classes}
      data-artwork-fallback={failed ? 'true' : undefined}
      data-module={moduleColor}
    >
      {failed || !lesson?.artwork ? (
        <span className={styles.fallback} />
      ) : (
        <Image
          alt=""
          className={styles.image}
          height={540}
          onError={() => setFailed(true)}
          priority={priority}
          sizes="(max-width: 48rem) 100vw, 60rem"
          src={lesson.artwork}
          unoptimized
          width={960}
        />
      )}
    </div>
  );
}
