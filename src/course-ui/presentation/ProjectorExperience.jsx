import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';

import { LectureIllustration } from '../art/LectureIllustration.jsx';
import { projectDomChildren, projectReactChildren } from './projectorContent.js';
import styles from './presentation.module.css';

const useClientLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;
const presentationPageGap = 32;

export function ProjectorExperience({ lesson, sections = [], activeSection, onChange, children }) {
  const activeIndex = Math.max(
    0,
    sections.findIndex((section) => section?.id === activeSection),
  );
  const active = sections[activeIndex] || sections[0] || null;
  const previous = sections[activeIndex - 1];
  const next = sections[activeIndex + 1];
  const reactProjection = projectReactChildren(children);
  const [domProjection, setDomProjection] = useState([]);
  const [capturedSection, setCapturedSection] = useState(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [pageWidth, setPageWidth] = useState(0);
  const [paginationReady, setPaginationReady] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const domCaptureReady = useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot,
  );
  const sourceRef = useRef(null);
  const pagesViewportRef = useRef(null);
  const projectedContentRef = useRef(null);
  const paginationRef = useRef({ count: 1, index: 0, ready: false });
  const hasDomProjection = domCaptureReady && capturedSection === active?.id;
  const needsDomProjection = domCaptureReady && !hasDomProjection;
  const projectedContent = hasDomProjection ? domProjection : reactProjection;

  useClientLayoutEffect(() => {
    paginationRef.current = {
      count: pageCount,
      index: pageIndex,
      ready: paginationReady,
    };
  }, [pageCount, pageIndex, paginationReady]);

  useClientLayoutEffect(() => {
    if (!needsDomProjection || !sourceRef.current) return;
    const labelledSection = sourceRef.current.querySelector(':scope > section[aria-labelledby]');
    const lessonContent = labelledSection?.lastElementChild;
    setDomProjection(projectDomChildren(lessonContent || sourceRef.current));
    setCapturedSection(active?.id || null);
  }, [active?.id, needsDomProjection]);

  useClientLayoutEffect(() => {
    setPageIndex(0);
    setPageCount(1);
    setPaginationReady(false);
  }, [active?.id, capturedSection]);

  useClientLayoutEffect(() => {
    const viewport = pagesViewportRef.current;
    const content = projectedContentRef.current;
    if (!hasDomProjection) {
      setPageCount(1);
      setPageWidth(0);
      setPaginationReady(false);
      return undefined;
    }
    if (!viewport || !content) {
      setPageCount(1);
      setPageWidth(0);
      setPaginationReady(true);
      return undefined;
    }

    let frameId = 0;
    const measure = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        const width = Math.max(1, viewport.clientWidth);
        content.style.setProperty('--presentation-page-width', `${width}px`);
        setPageWidth(width);
        frameId = window.requestAnimationFrame(() => {
          const pages = Math.max(
            1,
            Math.ceil((content.scrollWidth + 1) / (width + presentationPageGap)),
          );
          setPageCount(pages);
          setPageIndex((current) => Math.min(current, pages - 1));
          setPaginationReady(true);
        });
      });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    measure();
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frameId);
    };
  }, [active?.id, capturedSection, hasDomProjection]);

  useEffect(() => {
    const handleFullscreenChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    handleFullscreenChange();
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  async function toggleFullscreen() {
    if (document.fullscreenElement) {
      await document.exitFullscreen?.();
      return;
    }
    await document.documentElement.requestFullscreen?.();
  }

  function showPrevious() {
    if (pageIndex > 0) {
      setPageIndex((current) => current - 1);
      return;
    }
    if (previous) onChange?.(previous.id);
  }

  function showNext() {
    if (pageIndex < pageCount - 1) {
      setPageIndex((current) => current + 1);
      return;
    }
    if (next) onChange?.(next.id);
  }

  useEffect(() => {
    function handlePageKeyDown(event) {
      const pagination = paginationRef.current;
      const forwards = event.key === 'ArrowRight' || event.key === 'ArrowDown';
      const backwards = event.key === 'ArrowLeft' || event.key === 'ArrowUp';
      if (!forwards && !backwards) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      if (!pagination.ready) return;

      if (forwards) {
        if (pagination.index < pagination.count - 1) {
          setPageIndex((current) => current + 1);
        } else if (next) {
          onChange?.(next.id);
        }
      } else if (pagination.index > 0) {
        setPageIndex((current) => current - 1);
      } else if (previous) {
        onChange?.(previous.id);
      }
    }

    window.addEventListener('keydown', handlePageKeyDown, true);
    return () => window.removeEventListener('keydown', handlePageKeyDown, true);
  }, [next, onChange, previous]);

  useClientLayoutEffect(() => {
    if (!pagesViewportRef.current) return;
    pagesViewportRef.current.scrollLeft = pageIndex * (pageWidth + presentationPageGap);
  }, [pageIndex, pageWidth]);

  const exitHref = active?.id ? `?slide=${encodeURIComponent(active.id)}` : '?';

  return (
    <main
      aria-label={`${lesson?.shortTitle || lesson?.title || 'Lekce'} — projekce`}
      className={styles.projector}
      data-presentation-mode="projector"
    >
      {needsDomProjection ? (
        <div aria-hidden="true" hidden ref={sourceRef}>
          {children}
        </div>
      ) : null}
      <section className={styles.projectorSlide} data-presentation-slide>
        <header className={styles.projectorHeader}>
          <p>{lesson?.number ? `Lekce ${String(lesson.number).padStart(2, '0')}` : 'Lekce'}</p>
          <div className={styles.projectorActions}>
            <span aria-label="Pozice snímku">
              {String(activeIndex + 1).padStart(2, '0')} /{' '}
              {String(Math.max(1, sections.length)).padStart(2, '0')}
              {pageCount > 1 ? (
                <small>
                  {' '}
                  · {String(pageIndex + 1).padStart(2, '0')} / {String(pageCount).padStart(2, '0')}
                </small>
              ) : null}
            </span>
            <a href={exitHref}>Ukončit prezentaci</a>
            <button aria-pressed={fullscreen} onClick={toggleFullscreen} type="button">
              {fullscreen ? 'Ukončit celou obrazovku' : 'Celá obrazovka'}
            </button>
          </div>
        </header>

        <div className={styles.projectorStage}>
          {activeIndex === 0 && lesson?.artwork ? (
            <LectureIllustration className={styles.projectorArtwork} lesson={lesson} priority />
          ) : null}
          <div className={styles.fitViewport}>
            <div className={styles.projectorCopy}>
              <h1>{active?.title || lesson?.shortTitle || 'Lekce'}</h1>
              {active?.subtitle ? <p>{active.subtitle}</p> : null}
              {projectedContent.length > 0 ? (
                <div className={styles.projectedViewport} ref={pagesViewportRef}>
                  <div
                    className={styles.projectedContent}
                    data-presentation-content
                    data-presentation-page={pageIndex + 1}
                    data-presentation-pages={pageCount}
                    data-presentation-ready={paginationReady}
                    ref={projectedContentRef}
                  >
                    {projectedContent}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <nav aria-label="Navigace mezi snímky" className={styles.projectorNavigation}>
          <button
            aria-label="Předchozí snímek"
            disabled={!paginationReady || (!previous && pageIndex === 0)}
            onClick={showPrevious}
            type="button"
          >
            ← Předchozí snímek
          </button>
          <button
            aria-label="Následující snímek"
            disabled={!paginationReady || (!next && pageIndex === pageCount - 1)}
            onClick={showNext}
            type="button"
          >
            Následující snímek →
          </button>
        </nav>
      </section>
    </main>
  );
}
