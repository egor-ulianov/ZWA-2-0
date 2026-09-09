import React, { useCallback, useEffect, useRef, useState } from 'react';
import PortalFrame from '../portal/PortalFrame.jsx';
import { getCourseModule } from '../portal/courseMetadata.js';
import LessonOutline from './LessonOutline.jsx';
import { createLessonContextValue, LessonContext } from './LessonContext.jsx';
import PresenterConsole from './PresenterConsole.jsx';
import ProjectorStage from './ProjectorStage.jsx';
import { createPresenterChannel } from './presenterChannel.js';
import SlideNavigation from './SlideNavigation.jsx';
import { buildSlideUrl, resolveLessonMode, resolveSlideId } from './navigation.js';

const LESSON_MODES = Object.freeze(['student', 'projector', 'presenter']);

function normalizeLessonMode(mode) {
  return LESSON_MODES.includes(mode) ? mode : 'student';
}

function shellId(lesson) {
  return `lesson-${String(lesson?.slug || 'presentation').replace(/[^a-zA-Z0-9_-]/g, '-')}`;
}

function isEditableTarget(target) {
  if (!target || typeof target !== 'object') return false;
  if (target.isContentEditable) return true;
  const tagName = typeof target.tagName === 'string' ? target.tagName.toLowerCase() : '';
  return tagName === 'input' || tagName === 'textarea' || tagName === 'select';
}

export function useSlideNavigation(slides) {
  const fallback = slides[0]?.id;
  const [activeSlide, setActiveSlideState] = useState(() =>
    typeof window === 'undefined' ? fallback : resolveSlideId(slides, window.location),
  );
  const activeSlideRef = useRef(activeSlide);
  useEffect(() => {
    activeSlideRef.current = activeSlide;
  }, [activeSlide]);

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
    if (typeof window === 'undefined') return undefined;

    function handleKeyDown(event) {
      if (event.defaultPrevented || isEditableTarget(event.target)) return;
      const direction =
        event.key === 'ArrowRight' || event.key === 'ArrowDown'
          ? 1
          : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
            ? -1
            : event.key === 'Home'
              ? 'first'
              : event.key === 'End'
                ? 'last'
                : null;
      if (!direction) return;

      const current = activeSlideRef.current;
      const currentIndex = Math.max(
        0,
        slides.findIndex((slide) => slide.id === current),
      );
      const nextIndex =
        direction === 'first'
          ? 0
          : direction === 'last'
            ? slides.length - 1
            : Math.min(Math.max(currentIndex + direction, 0), slides.length - 1);
      const nextSlide = slides[nextIndex]?.id || fallback;
      if (nextSlide === current) return;
      event.preventDefault();
      setActiveSlideState(nextSlide);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fallback, slides]);

  useEffect(() => {
    if (typeof window === 'undefined' || !activeSlide) return;
    const syncUrl = () => {
      const nextUrl = buildSlideUrl(window.location, activeSlide);
      const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (nextUrl !== currentUrl) window.history.replaceState(window.history.state, '', nextUrl);
    };

    syncUrl();
    // The Pages Router may rewrite the URL once during hydration; normalize after that pass too.
    const timeoutId = window.setTimeout(syncUrl, 50);
    return () => window.clearTimeout(timeoutId);
  }, [activeSlide]);

  return { activeSlide: activeSlide || fallback, setActiveSlide };
}

export { LESSON_MODES, normalizeLessonMode };

export default function LessonShell({
  lesson,
  slides,
  activeSlide,
  onChange,
  children,
  title,
  subtitle,
  objective,
  learningObjective,
  footerText,
  maxWidthClass = 'max-w-6xl',
  mode = 'student',
}) {
  const idPrefix = shellId(lesson);
  const locationMode =
    mode === 'student' && typeof window !== 'undefined' ? resolveLessonMode(window.location) : mode;
  const resolvedMode = normalizeLessonMode(locationMode);
  const courseModule = getCourseModule(lesson);
  const lessonTitle = title || lesson?.title || 'Lekce';
  const resolvedObjective =
    objective || learningObjective || lesson?.objective || courseModule?.focus;
  const contextValue = createLessonContextValue({
    lesson,
    slides,
    activeSlide,
    onChange,
    mode: resolvedMode,
  });
  const channelRef = useRef(null);

  useEffect(() => {
    if (!['projector', 'presenter'].includes(resolvedMode) || !lesson?.slug) {
      channelRef.current?.close();
      channelRef.current = null;
      return undefined;
    }

    const channel = createPresenterChannel({
      lessonSlug: lesson.slug,
      slides,
      onSlide: (slideId) => onChange?.(slideId),
    });
    channelRef.current = channel;
    return () => {
      channel.close();
      if (channelRef.current === channel) channelRef.current = null;
    };
  }, [lesson?.slug, onChange, resolvedMode, slides]);

  useEffect(() => {
    if (activeSlide) channelRef.current?.publishSlide(activeSlide);
  }, [activeSlide]);

  if (resolvedMode === 'projector') {
    const currentSlide = slides.find((slide) => slide.id === activeSlide) || slides[0];
    const currentIndex = Math.max(
      0,
      slides.findIndex((slide) => slide.id === currentSlide?.id),
    );
    return (
      <LessonContext.Provider value={contextValue}>
        <PortalFrame
          meta={lesson?.number ? `Lekce ${lesson.number}` : 'Lekce'}
          className="lesson-shell"
        >
          <ProjectorStage
            lesson={lesson}
            slides={slides}
            slide={currentSlide}
            onPrevious={() => onChange?.(slides[Math.max(0, currentIndex - 1)]?.id)}
            onNext={() => onChange?.(slides[Math.min(slides.length - 1, currentIndex + 1)]?.id)}
          >
            {children}
          </ProjectorStage>
        </PortalFrame>
      </LessonContext.Provider>
    );
  }

  return (
    <LessonContext.Provider value={contextValue}>
      <PortalFrame
        meta={lesson?.number ? `Lekce ${lesson.number}` : 'Lekce'}
        className="lesson-shell"
      >
        <div
          data-lesson-mode={resolvedMode}
          className={`${maxWidthClass} mx-auto min-w-0 px-4 py-8 md:px-8`}
        >
          <header className="mb-8 max-w-4xl">
            <p className="portal-kicker mb-2">
              {lesson?.number ? `Lekce ${lesson.number}` : 'Lekce'}
            </p>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{lessonTitle}</h1>
            {subtitle && (
              <div className="mt-3 max-w-3xl text-sm leading-6 text-[var(--portal-text-muted)]">
                {subtitle}
              </div>
            )}
            {resolvedObjective && (
              <div className="portal-panel mt-5 max-w-3xl p-4">
                <p className="portal-kicker">Cíl lekce</p>
                <p className="mt-1 text-sm leading-6">{resolvedObjective}</p>
              </div>
            )}
          </header>

          {resolvedMode === 'presenter' ? (
            <PresenterConsole
              lesson={lesson}
              slides={slides}
              activeSlide={activeSlide}
              onChange={onChange}
            />
          ) : null}

          <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(12rem,15rem)_minmax(0,1fr)]">
            <LessonOutline
              lesson={lesson}
              slides={slides}
              activeSlide={activeSlide}
              onChange={onChange}
            />

            <div className="min-w-0">
              {resolvedMode !== 'student' ? (
                <SlideNavigation
                  slides={slides}
                  activeSlide={activeSlide}
                  onChange={onChange}
                  idPrefix={idPrefix}
                />
              ) : null}
              <main id={`${idPrefix}-content`} aria-label={lessonTitle}>
                {children}
              </main>
            </div>
          </div>

          <footer className="mt-8 text-center text-sm text-[var(--portal-text-muted)]">
            {footerText || `© 2025 ZWA – ${lesson?.title || lessonTitle}`}
          </footer>
        </div>
      </PortalFrame>
    </LessonContext.Provider>
  );
}
