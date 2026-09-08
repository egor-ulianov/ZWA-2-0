import React, { useEffect, useMemo, useState } from 'react';

function formatElapsed(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

function buildProjectorPath(slideId) {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.href);
  url.searchParams.set('mode', 'projector');
  url.searchParams.set('slide', slideId);
  url.hash = '';
  return `${url.pathname}${url.search}`;
}

export default function PresenterConsole({ lesson, slides = [], activeSlide, onChange }) {
  const [elapsed, setElapsed] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [projectorUrl, setProjectorUrl] = useState('');
  const [popupBlocked, setPopupBlocked] = useState(false);
  const active = useMemo(
    () => slides.find((slide) => slide.id === activeSlide) || slides[0],
    [activeSlide, slides],
  );

  useEffect(() => {
    if (!timerRunning) return undefined;
    const startedAt = Date.now() - elapsed * 1000;
    const timerId = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(timerId);
  }, [elapsed, timerRunning]);

  function openProjector() {
    if (!active?.id || typeof window === 'undefined') return;
    const path = buildProjectorPath(active.id);
    setProjectorUrl(path);
    const popup = window.open(path, '_blank', 'noopener,noreferrer');
    setPopupBlocked(!popup);
    if (popup && typeof popup.focus === 'function') popup.focus();
  }

  return (
    <section
      aria-label="Presenter console"
      className="grid gap-6 lg:grid-cols-[minmax(14rem,18rem)_minmax(0,1fr)]"
    >
      <nav aria-label="Presenter outline" className="portal-panel min-w-0 p-4">
        <p className="portal-kicker">Presenter outline</p>
        <p className="mt-1 text-sm font-semibold leading-5">{lesson?.title || 'Lesson'}</p>
        <ol className="mt-4 space-y-1">
          {slides.map((slide, index) => (
            <li key={slide.id}>
              <button
                type="button"
                aria-current={slide.id === activeSlide ? 'step' : undefined}
                className={`flex w-full items-start gap-3 rounded px-2 py-2 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--portal-focus)] ${slide.id === activeSlide ? 'bg-[var(--portal-surface-muted)] font-semibold' : 'text-[var(--portal-text-muted)] hover:bg-[var(--portal-surface-muted)]'}`}
                onClick={() => onChange(slide.id)}
              >
                <span className="shrink-0 font-mono text-xs tabular-nums" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span>{slide.title}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div className="space-y-6">
        <div className="portal-panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="portal-kicker">Presenter timer</p>
              <p aria-live="polite" className="mt-1 font-mono text-3xl tabular-nums">
                {formatElapsed(elapsed)}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="portal-action rounded px-3 py-2"
                onClick={() => setTimerRunning((running) => !running)}
              >
                {timerRunning ? 'Pause timer' : 'Start timer'}
              </button>
              <button
                type="button"
                className="rounded border px-3 py-2"
                onClick={() => {
                  setTimerRunning(false);
                  setElapsed(0);
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="portal-panel p-5">
          <p className="portal-kicker">Presenter notes</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
            {active?.presenterNotes || active?.notes || 'No presenter notes for this slide.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="portal-action rounded px-4 py-2" onClick={openProjector}>
            Open projector
          </button>
          {popupBlocked && projectorUrl ? (
            <a className="underline" href={projectorUrl} target="_blank" rel="noreferrer">
              Open projector in this tab
            </a>
          ) : null}
          <span className="text-sm text-[var(--portal-text-muted)]">
            Arrow keys change slides · Escape leaves fullscreen
          </span>
        </div>
      </div>
    </section>
  );
}

export { formatElapsed };
