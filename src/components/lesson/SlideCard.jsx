import React, { useEffect, useRef } from 'react';
import { clsx } from './classNames.js';
import { getSlideDomIds } from './navigation.js';

export { getSlideDomIds } from './navigation.js';

export default function SlideCard({ slide, children, idPrefix = 'lesson' }) {
  const headingRef = useRef(null);
  const mountedRef = useRef(false);
  const { panelId, tabId } = getSlideDomIds(slide.id, idPrefix);

  useEffect(() => {
    if (mountedRef.current) headingRef.current?.focus({ preventScroll: true });
    mountedRef.current = true;
  }, [slide.id]);

  return (
    <section
      id={panelId}
      role="tabpanel"
      aria-labelledby={tabId}
      tabIndex={-1}
      className={clsx(
        'p-6 rounded-2xl shadow-lg bg-white/70 dark:bg-zinc-900/60',
        'backdrop-blur border border-zinc-200/60 dark:border-zinc-800',
      )}
    >
      <h2
        ref={headingRef}
        id={`${panelId}-heading`}
        tabIndex={-1}
        className="text-3xl font-bold mb-3"
      >
        {slide.title}
      </h2>
      {slide.subtitle && (
        <p className="text-xl text-sky-600 dark:text-sky-400 mb-4">{slide.subtitle}</p>
      )}
      {children}
    </section>
  );
}
