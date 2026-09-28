import { cloneElement, isValidElement, useId, useMemo, useRef, useState } from 'react';

import styles from './exercise.module.css';

function normalizeFiles(files) {
  if (!Array.isArray(files)) return [];
  return files.flatMap((file, index) => {
    if (!file || typeof file !== 'object') return [];
    const id = String(file.id || `file-${index + 1}`);
    return [{ id, label: String(file.label || file.name || id), panel: file.panel ?? null }];
  });
}

function makeReadOnly(panel) {
  if (!isValidElement(panel)) return panel;
  const readOnlyProps = {
    readOnly: true,
    'aria-readonly': true,
  };
  if (typeof panel.type !== 'string') readOnlyProps.editable = false;
  return cloneElement(panel, readOnlyProps);
}

export function getNextStudioTabIndex(key, index, length) {
  if (length <= 0) return -1;
  if (key === 'ArrowRight' || key === 'ArrowDown') return (index + 1) % length;
  if (key === 'ArrowLeft' || key === 'ArrowUp') return (index - 1 + length) % length;
  if (key === 'Home') return 0;
  if (key === 'End') return length - 1;
  return Math.min(Math.max(index, 0), length - 1);
}

export default function StudioTabs({
  files = [],
  solution = { label: 'Řešení', panel: null },
  activeFileId,
  onActiveFileChange,
}) {
  const studentFiles = useMemo(() => normalizeFiles(files), [files]);
  const tabs = useMemo(
    () => [
      ...studentFiles,
      {
        id: 'solution',
        label: String(solution?.label || 'Řešení'),
        panel: solution?.panel ?? null,
      },
    ],
    [solution?.label, solution?.panel, studentFiles],
  );
  const [localActiveId, setLocalActiveId] = useState(String(activeFileId || tabs[0]?.id));
  const controlled = activeFileId !== undefined;
  const requestedId = controlled ? String(activeFileId) : localActiveId;
  const activeIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab.id === requestedId),
  );
  const activeTab = tabs[activeIndex];
  const refs = useRef([]);
  const idBase = useId().replaceAll(':', '');

  function select(index, moveFocus = false) {
    const next = tabs[index];
    if (!next) return;
    if (!controlled) setLocalActiveId(next.id);
    onActiveFileChange?.(next.id);
    if (moveFocus) requestAnimationFrame(() => refs.current[index]?.focus());
  }

  function handleKeyDown(event, index) {
    const nextIndex = getNextStudioTabIndex(event.key, index, tabs.length);
    if (nextIndex === index) return;
    event.preventDefault();
    event.stopPropagation();
    select(nextIndex, true);
  }

  return (
    <div className={styles.tabs} data-studio-tabs="true">
      <div role="tablist" aria-label="Soubory IDE" aria-orientation="horizontal">
        {tabs.map((tab, index) => {
          const active = index === activeIndex;
          const solutionTab = tab.id === 'solution';
          return (
            <button
              key={tab.id}
              ref={(node) => {
                refs.current[index] = node;
              }}
              id={`${idBase}-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`${idBase}-panel-${tab.id}`}
              data-solution-tab={solutionTab ? 'true' : undefined}
              tabIndex={active ? 0 : -1}
              onClick={() => select(index)}
              onKeyDown={(event) => handleKeyDown(event, index)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div
        id={`${idBase}-panel-${activeTab.id}`}
        role="tabpanel"
        aria-labelledby={`${idBase}-tab-${activeTab.id}`}
        tabIndex={0}
        className={styles.tabPanel}
      >
        {activeTab.id === 'solution' ? (
          <div data-solution-panel="true" aria-readonly="true">
            {makeReadOnly(activeTab.panel)}
          </div>
        ) : (
          <div data-file-panel={activeTab.id}>{activeTab.panel}</div>
        )}
      </div>
    </div>
  );
}
