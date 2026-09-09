import React from 'react';

function lessonNumber(lesson) {
  return lesson?.number ? String(lesson.number).padStart(2, '0') : null;
}

export default function LessonOutline({ lesson, slides = [], activeSlide, onChange }) {
  const number = lessonNumber(lesson);

  return (
    <nav aria-label="Osnova kurzu" className="portal-panel min-w-0 p-4">
      <div className="mb-4">
        <p className="portal-kicker">Osnova kurzu</p>
        <p className="mt-1 text-sm font-semibold leading-5">
          {number ? `${number} · ` : ''}
          {lesson?.title || 'Lekce'}
        </p>
      </div>

      <ol className="m-0 list-none space-y-1 p-0">
        {slides.map((slide, index) => {
          const isActive = slide.id === activeSlide;
          return (
            <li key={slide.id}>
              <button
                type="button"
                aria-current={isActive ? 'step' : undefined}
                className={`flex w-full items-start gap-3 rounded px-2 py-2 text-left text-sm transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--portal-focus)] ${
                  isActive
                    ? 'bg-[var(--portal-surface-muted)] font-semibold text-[var(--portal-text)]'
                    : 'text-[var(--portal-text-muted)] hover:bg-[var(--portal-surface-muted)] hover:text-[var(--portal-text)]'
                }`}
                onClick={() => onChange(slide.id)}
              >
                <span className="shrink-0 font-mono text-xs tabular-nums" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span>{slide.title}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
