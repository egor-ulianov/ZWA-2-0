import React, { useRef } from 'react';
import { clsx } from './classNames.js';
import { getSlideDomIds } from './navigation.js';

export default function SlideNavigation({ slides, activeSlide, onChange, idPrefix = 'lesson' }) {
  const buttonRefs = useRef([]);

  function focusSlide(index) {
    const slide = slides[index];
    if (!slide) return;
    onChange(slide.id);
    requestAnimationFrame(() => buttonRefs.current[index]?.focus());
  }

  function handleKeyDown(event, index) {
    let nextIndex = index;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown')
      nextIndex = Math.min(index + 1, slides.length - 1);
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = Math.max(index - 1, 0);
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = slides.length - 1;
    if (nextIndex !== index) {
      event.preventDefault();
      focusSlide(nextIndex);
    }
  }

  return (
    <nav aria-label="Navigace mezi snímky" className="mb-6">
      <div role="tablist" aria-orientation="horizontal" className="flex flex-wrap gap-2">
        {slides.map((slide, index) => {
          const isActive = slide.id === activeSlide;
          const { panelId, tabId } = getSlideDomIds(slide.id, idPrefix);
          return (
            <button
              key={slide.id}
              ref={(element) => {
                buttonRefs.current[index] = element;
              }}
              id={tabId}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={panelId}
              aria-current={isActive ? 'step' : undefined}
              tabIndex={isActive ? 0 : -1}
              className={clsx(
                'rounded px-3 py-1.5 text-sm border transition-colors motion-reduce:transition-none',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--portal-focus)]',
                isActive
                  ? 'border-[var(--portal-indigo)] bg-[var(--portal-indigo)] font-semibold text-white'
                  : 'border-[var(--portal-border)] bg-[var(--portal-panel)] text-[var(--portal-text)] hover:bg-[var(--portal-surface-muted)]',
              )}
              onClick={() => onChange(slide.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
            >
              {slide.title}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
