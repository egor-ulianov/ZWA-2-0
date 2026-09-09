import React, {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';

function normalizeStudentFiles(files) {
  if (!Array.isArray(files)) return [];

  return files
    .map((file, index) => {
      if (!file || typeof file !== 'object') return null;
      const id = String(file.id || `file-${index + 1}`);
      return {
        id,
        label: String(file.label || file.name || id),
        panel: file.panel ?? null,
      };
    })
    .filter(Boolean);
}

function solutionPanel(panel) {
  if (!isValidElement(panel)) return panel;

  // SyntaxCodeEditor and CodeMirror-based callers can consume these props. The
  // wrapper below also protects callers whose panel is a native textarea/input.
  return cloneElement(panel, {
    readOnly: true,
    editable: false,
    'aria-readonly': true,
  });
}

function ReadOnlySolutionPanel({ panel }) {
  const panelRef = useRef(null);

  useEffect(() => {
    const root = panelRef.current;
    if (!root) return undefined;

    const markCodeMirrorContentReadOnly = () => {
      root.querySelectorAll('.cm-content').forEach((content) => {
        content.setAttribute('contenteditable', 'false');
        content.setAttribute('aria-readonly', 'true');
      });
    };

    markCodeMirrorContentReadOnly();
    const observer = new MutationObserver(markCodeMirrorContentReadOnly);
    observer.observe(root, { attributes: true, childList: true, subtree: true });
    return () => observer.disconnect();
  }, [panel]);

  return (
    <div
      ref={panelRef}
      data-solution-panel="true"
      aria-readonly="true"
      contentEditable={false}
      onBeforeInput={(event) => event.preventDefault()}
      className="min-w-0"
    >
      {solutionPanel(panel)}
    </div>
  );
}

/**
 * A small, reusable VS-Code-style file strip for task workspaces.
 *
 * `files` own their editor panels. The solution is deliberately rendered as a
 * separate, read-only panel so opening it cannot mutate the student's draft.
 */
export default function WorkspaceIdeTabs({
  files = [],
  solution = { label: 'Řešení', panel: null },
  activeFileId,
  onActiveFileChange,
}) {
  const normalizedFiles = useMemo(() => normalizeStudentFiles(files), [files]);
  const normalizedSolution = useMemo(
    () => ({
      id: 'solution',
      label: String(solution?.label || 'Řešení'),
      panel: solution?.panel ?? null,
    }),
    [solution?.label, solution?.panel],
  );
  const tabs = useMemo(
    () => [...normalizedFiles, normalizedSolution],
    [normalizedFiles, normalizedSolution],
  );
  const initialId = String(activeFileId || tabs[0]?.id || normalizedSolution.id);
  const [uncontrolledActiveId, setUncontrolledActiveId] = useState(initialId);
  const tabRefs = useRef([]);
  const generatedId = useId().replace(/:/g, '');
  const isControlled = activeFileId !== undefined;
  const requestedActiveId = String(activeFileId || '');
  const activeId = tabs.some(
    (tab) => tab.id === (isControlled ? requestedActiveId : uncontrolledActiveId),
  )
    ? isControlled
      ? requestedActiveId
      : uncontrolledActiveId
    : tabs[0]?.id || normalizedSolution.id;
  const activeIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab.id === activeId),
  );
  const activeTab = tabs[activeIndex] || normalizedSolution;

  function selectTab(index, focus = false) {
    const nextTab = tabs[index];
    if (!nextTab) return;
    if (!isControlled) setUncontrolledActiveId(nextTab.id);
    onActiveFileChange?.(nextTab.id);
    if (focus) {
      requestAnimationFrame(() => tabRefs.current[index]?.focus());
    }
  }

  function handleTabKeyDown(event, index) {
    const navigationKeys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'];
    if (!navigationKeys.includes(event.key)) return;

    event.preventDefault();
    event.stopPropagation();

    let nextIndex = index;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = index === tabs.length - 1 ? 0 : index + 1;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = index === 0 ? tabs.length - 1 : index - 1;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = tabs.length - 1;
    }

    selectTab(nextIndex, true);
  }

  return (
    <div className="min-w-0" data-workspace-ide-tabs="true">
      <div
        role="tablist"
        aria-label="Soubory IDE"
        aria-orientation="horizontal"
        className="flex min-w-0 gap-1 overflow-x-auto border-b border-zinc-200/70 px-4 pt-3 dark:border-zinc-800"
      >
        {tabs.map((tab, index) => {
          const isActive = index === activeIndex;
          const isSolution = tab.id === normalizedSolution.id;
          const tabId = `${generatedId}-tab-${tab.id}`;
          const panelId = `${generatedId}-panel-${tab.id}`;
          return (
            <button
              key={tab.id}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              id={tabId}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={panelId}
              data-solution-tab={isSolution ? 'true' : undefined}
              tabIndex={isActive ? 0 : -1}
              onClick={() => selectTab(index)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
              className={
                isActive
                  ? isSolution
                    ? 'shrink-0 rounded-t-lg border border-b-0 border-emerald-700 bg-emerald-700 px-3 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2'
                    : 'shrink-0 rounded-t-lg border border-b-0 border-indigo-700 bg-indigo-700 px-3 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
                  : 'shrink-0 rounded-t-lg border border-transparent px-3 py-2 text-sm text-zinc-700 hover:border-zinc-200 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-900'
              }
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        id={`${generatedId}-panel-${activeTab.id}`}
        role="tabpanel"
        aria-labelledby={`${generatedId}-tab-${activeTab.id}`}
        tabIndex={0}
        className="min-w-0 p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-inset"
      >
        {activeTab.id === normalizedSolution.id ? (
          <ReadOnlySolutionPanel panel={activeTab.panel} />
        ) : (
          <div data-file-panel={activeTab.id} className="min-w-0">
            {activeTab.panel}
          </div>
        )}
      </div>
    </div>
  );
}

export { ReadOnlySolutionPanel };
