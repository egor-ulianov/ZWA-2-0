import React, { useCallback, useEffect, useState } from 'react';
import SlideNavigation from './SlideNavigation.jsx';
import { buildSlideUrl, resolveSlideId } from './navigation.js';

function shellId(lesson) {
  return `lesson-${String(lesson?.slug || 'presentation').replace(/[^a-zA-Z0-9_-]/g, '-')}`;
}

export function useSlideNavigation(slides) {
  const fallback = slides[0]?.id;
  const [activeSlide, setActiveSlideState] = useState(() =>
    typeof window === 'undefined' ? fallback : resolveSlideId(slides, window.location),
  );

  const setActiveSlide = useCallback(
    (requestedSlide) => {
      const nextSlide = slides.some((slide) => slide.id === requestedSlide)
        ? requestedSlide
        : fallback;
      setActiveSlideState(nextSlide);
    },
    [fallback, slides],
  );

  const syncFromLocation = useCallback(() => {
    if (typeof window === 'undefined') return;
    const validated = resolveSlideId(slides, window.location);
    setActiveSlideState((current) => (current === validated ? current : validated));
  }, [slides]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    window.addEventListener('popstate', syncFromLocation);
    window.addEventListener('hashchange', syncFromLocation);
    return () => {
      window.removeEventListener('popstate', syncFromLocation);
      window.removeEventListener('hashchange', syncFromLocation);
    };
  }, [syncFromLocation]);

  useEffect(() => {
    if (typeof window === 'undefined' || !activeSlide) return;
    const nextUrl = buildSlideUrl(window.location, activeSlide);
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (nextUrl !== currentUrl) window.history.replaceState(window.history.state, '', nextUrl);
  }, [activeSlide]);

  return { activeSlide: activeSlide || fallback, setActiveSlide };
}

export default function LessonShell({
  lesson,
  slides,
  activeSlide,
  onChange,
  children,
  title,
  subtitle,
  footerText,
  maxWidthClass = 'max-w-6xl',
}) {
  const idPrefix = shellId(lesson);
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-zinc-50 to-sky-50 dark:from-zinc-950 dark:to-zinc-900 text-zinc-900 dark:text-zinc-50">
      <div className={`${maxWidthClass} mx-auto p-4 md:p-8 relative`}>
        <div
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
          aria-hidden="true"
        >
          <div className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-sky-300/40 dark:bg-sky-500/20 blur-3xl" />
          <div className="absolute top-1/3 -left-24 h-72 w-72 rounded-full bg-rose-300/40 dark:bg-rose-500/20 blur-3xl" />
        </div>

        <header className="mb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
            {title || lesson.title}
          </h1>
          {subtitle && <p className="text-sm text-zinc-500">{subtitle}</p>}
        </header>

        <SlideNavigation
          slides={slides}
          activeSlide={activeSlide}
          onChange={onChange}
          idPrefix={idPrefix}
        />
        <main id={`${idPrefix}-content`} aria-label={title || lesson.title}>
          {children}
        </main>

        <footer className="mt-8 text-sm text-zinc-500 text-center">
          {footerText || `© 2025 ZWA – ${lesson.title}`}
        </footer>
      </div>
    </div>
  );
}
