import { useCallback, useEffect, useRef, useState } from 'react';

import {
  buildSectionUrl,
  getKeyboardNavigationDirection,
  getSectionIds,
  resolveSectionId,
} from './navigation.js';

export function useLearningNavigation(sections) {
  const sectionIds = getSectionIds(sections);
  const fallback = sectionIds[0];
  const [activeSection, setActiveSectionState] = useState(() =>
    typeof window === 'undefined' ? fallback : resolveSectionId(sections, window.location),
  );
  const activeSectionRef = useRef(activeSection);

  useEffect(() => {
    activeSectionRef.current = activeSection;
  }, [activeSection]);

  const setActiveSection = useCallback(
    (requestedSection) => {
      const nextSection = sectionIds.includes(requestedSection) ? requestedSection : fallback;
      setActiveSectionState(nextSection);
    },
    [fallback, sectionIds],
  );

  const syncFromLocation = useCallback(() => {
    const validated = resolveSectionId(sections, window.location);
    setActiveSectionState((current) => (current === validated ? current : validated));
  }, [sections]);

  useEffect(() => {
    window.addEventListener('popstate', syncFromLocation);
    window.addEventListener('hashchange', syncFromLocation);
    return () => {
      window.removeEventListener('popstate', syncFromLocation);
      window.removeEventListener('hashchange', syncFromLocation);
    };
  }, [syncFromLocation]);

  useEffect(() => {
    function handleKeyDown(event) {
      const direction = getKeyboardNavigationDirection(event);
      if (!direction || sectionIds.length === 0) return;

      const currentIndex = Math.max(0, sectionIds.indexOf(activeSectionRef.current));
      const nextIndex =
        direction === 'first'
          ? 0
          : direction === 'last'
            ? sectionIds.length - 1
            : Math.min(Math.max(currentIndex + direction, 0), sectionIds.length - 1);
      const nextSection = sectionIds[nextIndex];
      if (!nextSection || nextSection === activeSectionRef.current) return;
      event.preventDefault();
      setActiveSectionState(nextSection);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sectionIds]);

  useEffect(() => {
    if (!activeSection) return undefined;
    const syncUrl = () => {
      const nextUrl = buildSectionUrl(window.location, activeSection);
      const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (nextUrl !== currentUrl) window.history.replaceState(window.history.state, '', nextUrl);
    };

    syncUrl();
    const timeoutId = window.setTimeout(syncUrl, 50);
    return () => window.clearTimeout(timeoutId);
  }, [activeSection]);

  return { activeSection: activeSection || fallback, setActiveSection };
}
