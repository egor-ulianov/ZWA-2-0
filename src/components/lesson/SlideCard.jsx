import React, { useContext, useEffect, useRef } from 'react';
import { clsx } from './classNames.js';
import { LessonContext } from './LessonContext.jsx';
import { getSlideDomIds } from './navigation.js';

export { getSlideDomIds } from './navigation.js';

export default function SlideCard({ slide, children, idPrefix = 'lesson' }) {
  const headingRef = useRef(null);
  const mountedRef = useRef(false);
  const { panelId, tabId } = getSlideDomIds(slide.id, idPrefix);
  const lessonContext = useContext(LessonContext);
  const isPresenter = lessonContext?.mode === 'presenter';
  const headingId = `${panelId}-heading`;

  useEffect(() => {
    if (mountedRef.current) headingRef.current?.focus({ preventScroll: true });
    mountedRef.current = true;
  }, [slide.id]);

  return (
    <section
      id={panelId}
      role={isPresenter ? 'tabpanel' : 'region'}
      aria-labelledby={isPresenter ? tabId : headingId}
      tabIndex={-1}
      className={clsx(
        'portal-panel p-6',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--portal-focus)]',
      )}
    >
      <h2 ref={headingRef} id={headingId} tabIndex={-1} className="mb-3 text-3xl font-bold">
        {slide.title}
      </h2>
      {slide.subtitle && (
        <p className="mb-4 text-xl text-[var(--portal-coral)]">{slide.subtitle}</p>
      )}
      {children}
    </section>
  );
}
