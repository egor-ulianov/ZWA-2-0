import React, { useMemo } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const PRIVATE_PROJECTOR_SELECTORS = [
  'textarea',
  'input',
  'select',
  'button',
  'iframe',
  'script',
  'style',
  'object',
  'embed',
  'link',
  '[aria-label="Course outline"]',
  '[aria-label="Presenter outline"]',
  '[aria-label="Presenter console"]',
  '[aria-label="Exercise workspace"]',
  '[aria-label="Test results"]',
  '[role="tablist"]',
  '[role="tab"]',
].join(',');

function sanitizeProjectorMarkup(markup) {
  if (!markup || typeof DOMParser === 'undefined') return '';
  const document = new DOMParser().parseFromString(
    `<div data-projector-content="root">${markup}</div>`,
    'text/html',
  );
  const root = document.body.firstElementChild;
  if (!root) return '';

  root.querySelectorAll(PRIVATE_PROJECTOR_SELECTORS).forEach((element) => element.remove());
  root.querySelectorAll('[role="tabpanel"]').forEach((element) => {
    element.removeAttribute('role');
    element.removeAttribute('aria-labelledby');
    element.removeAttribute('tabindex');
  });
  root.querySelectorAll('*').forEach((element) => {
    Array.from(element.attributes).forEach((attribute) => {
      if (attribute.name.toLowerCase().startsWith('on')) element.removeAttribute(attribute.name);
    });
  });
  root.querySelectorAll('[href], [src]').forEach((element) => {
    for (const attributeName of ['href', 'src']) {
      const value = element.getAttribute(attributeName);
      if (value && /^(?:javascript|data):/i.test(value.trim())) {
        element.removeAttribute(attributeName);
      }
    }
  });

  return root.innerHTML;
}

function renderProjectedContent(children) {
  if (!children) return '';
  try {
    return sanitizeProjectorMarkup(renderToStaticMarkup(children));
  } catch {
    return '';
  }
}

function slidePosition(slides, slide) {
  const index = Array.isArray(slides)
    ? slides.findIndex((candidate) => candidate?.id === slide?.id)
    : -1;
  const total = Array.isArray(slides) && slides.length > 0 ? slides.length : 1;
  return {
    index: index < 0 ? 0 : index,
    total,
  };
}

export default function ProjectorStage({ lesson, slides, slide, onPrevious, onNext, children }) {
  const { index, total } = slidePosition(slides, slide);
  const hasPrevious = index > 0;
  const hasNext = index < total - 1;
  const projectedMarkup = useMemo(() => renderProjectedContent(children), [children]);

  return (
    <main
      aria-label={`${lesson?.title || 'Lesson'} projector`}
      className="projector-stage mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl flex-col justify-between px-6 py-10 md:px-12 md:py-16"
    >
      <div>
        <div className="mb-12 flex items-center justify-between gap-6 text-sm text-[var(--portal-text-muted)]">
          <p className="portal-kicker">{lesson?.number ? `Lesson ${lesson.number}` : 'Lesson'}</p>
          <p aria-label="Slide position" className="font-mono tabular-nums">
            {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </p>
        </div>
        <div className="max-w-5xl">
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            {slide?.title || 'Lesson'}
          </h1>
          {slide?.subtitle ? (
            <p className="mt-5 text-xl text-[var(--portal-text-muted)] md:text-2xl">
              {slide.subtitle}
            </p>
          ) : null}
          {projectedMarkup ? (
            <div
              className="projector-teaching-content mt-10"
              dangerouslySetInnerHTML={{ __html: projectedMarkup }}
            />
          ) : null}
        </div>
      </div>

      <div className="mt-12 flex items-center justify-between gap-4">
        <button
          type="button"
          className="portal-action rounded px-4 py-2"
          onClick={onPrevious}
          disabled={!hasPrevious}
          aria-label="Previous slide"
        >
          Previous
        </button>
        <button
          type="button"
          className="portal-action rounded px-4 py-2"
          onClick={onNext}
          disabled={!hasNext}
          aria-label="Next slide"
        >
          Next
        </button>
      </div>
    </main>
  );
}

export { renderProjectedContent, sanitizeProjectorMarkup };
