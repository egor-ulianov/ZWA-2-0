import React, { useCallback, useRef } from 'react';

export default function LessonTaskTabs({ tasks, activeTaskId, onChange, label }) {
  const tabRefs = useRef([]);
  const activeIndex = Math.max(
    0,
    tasks.findIndex((task) => task.id === activeTaskId),
  );

  const selectTask = useCallback(
    (index) => {
      const nextIndex = Math.min(Math.max(index, 0), tasks.length - 1);
      onChange(tasks[nextIndex].id);
      requestAnimationFrame(() => tabRefs.current[nextIndex]?.focus());
    },
    [onChange, tasks],
  );

  function onKeyDown(event, index) {
    let nextIndex = index;
    if (event.key === 'ArrowRight') nextIndex = index === tasks.length - 1 ? 0 : index + 1;
    if (event.key === 'ArrowLeft') nextIndex = index === 0 ? tasks.length - 1 : index - 1;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = tasks.length - 1;
    if (nextIndex === index) return;
    event.preventDefault();
    selectTask(nextIndex);
  }

  return (
    <div className="mb-4" role="tablist" aria-label={label}>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Vyberte úlohu
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tasks.map((task, index) => {
          const isActive = task.id === activeTaskId;
          return (
            <button
              key={task.id}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              type="button"
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onChange(task.id)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={
                isActive
                  ? 'shrink-0 rounded-lg border border-indigo-700 bg-indigo-700 px-3 py-2 text-sm font-medium text-white'
                  : 'shrink-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800'
              }
            >
              {task.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
