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
                'px-3 py-1.5 rounded-full text-sm border transition-all motion-reduce:transition-none',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2',
                isActive
                  ? 'bg-sky-600 text-white border-sky-600 shadow-lg'
                  : 'bg-white/70 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-800',
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
