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
        'portal-panel p-6',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--portal-focus)]',
      )}
    >
      <h2
        ref={headingRef}
        id={`${panelId}-heading`}
        tabIndex={-1}
        className="mb-3 text-3xl font-bold"
      >
        {slide.title}
      </h2>
      {slide.subtitle && (
        <p className="mb-4 text-xl text-[var(--portal-coral)]">{slide.subtitle}</p>
      )}
      {children}
    </section>
  );
}
