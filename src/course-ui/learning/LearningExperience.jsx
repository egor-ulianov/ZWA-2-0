import { useEffect, useMemo, useRef } from 'react';

import { CourseApplication } from '../foundation/CourseApplication.jsx';
import { CourseMasthead } from '../foundation/CourseMasthead.jsx';
import { createPresenterChannel } from '../presentation/presenterChannel.js';
import { PresenterExperience } from '../presentation/PresenterExperience.jsx';
import { ProjectorExperience } from '../presentation/ProjectorExperience.jsx';
import { CourseProgressStrip } from './CourseProgressStrip.jsx';
import { LearningContext, createLearningContextValue } from './LearningContext.jsx';
import { LessonHero } from './LessonHero.jsx';
import { LessonPager } from './LessonPager.jsx';
import { normalizeExperienceMode, resolveExperienceMode } from './navigation.js';
import { OutlineDrawer } from './OutlineDrawer.jsx';
import styles from './learning.module.css';

export function LearningExperience({
  lesson,
  sections = [],
  activeSection,
  onChange,
  title,
  subtitle,
  objective,
  learningObjective,
  footerText,
  mode,
  children,
}) {
  const requestedMode =
    mode || (typeof window === 'undefined' ? 'student' : resolveExperienceMode(window.location));
  const resolvedMode = normalizeExperienceMode(requestedMode);
  const currentSection =
    sections.find((section) => section?.id === activeSection) || sections[0] || null;
  const currentIndex = Math.max(
    0,
    sections.findIndex((section) => section?.id === currentSection?.id),
  );
  const contextValue = useMemo(
    () =>
      createLearningContextValue({
        lesson,
        sections,
        activeSection: currentSection?.id,
        onChange,
        mode: resolvedMode,
      }),
    [currentSection?.id, lesson, onChange, resolvedMode, sections],
  );
  const channelRef = useRef(null);

  useEffect(() => {
    if (!['projector', 'presenter'].includes(resolvedMode) || !lesson?.slug) {
      channelRef.current?.close();
      channelRef.current = null;
      return undefined;
    }

    const channel = createPresenterChannel({
      lessonSlug: lesson.slug,
      slides: sections,
      onSlide: (sectionId) => onChange?.(sectionId),
    });
    channelRef.current = channel;
    return () => {
      channel.close();
      if (channelRef.current === channel) channelRef.current = null;
    };
  }, [lesson?.slug, onChange, resolvedMode, sections]);

  useEffect(() => {
    if (currentSection?.id) channelRef.current?.publishSlide(currentSection.id);
  }, [currentSection?.id]);

  if (resolvedMode === 'projector') {
    return (
      <LearningContext.Provider value={contextValue}>
        <CourseApplication
          title={`${currentSection?.title || title || 'Lekce'} · Projekce`}
          variant="projector"
        >
          <ProjectorExperience
            activeSection={currentSection?.id}
            lesson={lesson}
            onChange={onChange}
            sections={sections}
          >
            {children}
          </ProjectorExperience>
        </CourseApplication>
      </LearningContext.Provider>
    );
  }

  if (resolvedMode === 'presenter') {
    return (
      <LearningContext.Provider value={contextValue}>
        <CourseApplication
          title={`${title || lesson?.shortTitle || 'Lekce'} · Prezentující`}
          variant="presenter"
        >
          <CourseMasthead contextLabel={lesson?.number ? `Lekce ${lesson.number}` : 'Lekce'} />
          <PresenterExperience
            activeSection={currentSection?.id}
            lesson={lesson}
            onChange={onChange}
            sections={sections}
          >
            {children}
          </PresenterExperience>
        </CourseApplication>
      </LearningContext.Provider>
    );
  }

  const resolvedObjective = objective || learningObjective || lesson?.focus;
  const outlineControl = (
    <OutlineDrawer
      activeSection={currentSection?.id}
      lesson={lesson}
      onChange={onChange}
      sections={sections}
    />
  );
  const presentationHref = currentSection?.id
    ? `?mode=projector&slide=${encodeURIComponent(currentSection.id)}`
    : '?mode=projector';
  const presentationAction = (
    <a
      aria-label="Spustit prezentaci"
      className={styles.presentationAction}
      data-presentation-launch
      href={presentationHref}
    >
      <span aria-hidden="true" className={styles.presentationIcon}>
        ▶
      </span>
      <span className={styles.presentationLabel}>Prezentace</span>
    </a>
  );

  return (
    <LearningContext.Provider value={contextValue}>
      <CourseApplication title={title || lesson?.shortTitle || lesson?.title} variant="lesson">
        <CourseMasthead
          actions={presentationAction}
          contextLabel={lesson?.number ? `Lekce ${lesson.number}` : 'Lekce'}
          outlineControl={outlineControl}
        />
        <CourseProgressStrip activeSection={currentSection?.id} sections={sections} />
        <main
          className={styles.learningPage}
          data-learning-experience="student"
          data-learning-page-content
        >
          <LessonHero
            lesson={lesson}
            objective={resolvedObjective}
            subtitle={subtitle}
            title={title}
          />
          <article className={styles.article}>{children}</article>
          <LessonPager activeSection={currentSection?.id} onChange={onChange} sections={sections} />
          <footer className={styles.lessonFooter}>
            {footerText || `ZWA · ${lesson?.shortTitle || lesson?.title || 'Lekce'}`}
            <span>
              {currentIndex + 1} / {Math.max(1, sections.length)}
            </span>
          </footer>
        </main>
      </CourseApplication>
    </LearningContext.Provider>
  );
}
