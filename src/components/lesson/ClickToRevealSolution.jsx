import React, { useId, useState } from 'react';
import { clsx } from './classNames.js';

export default function ClickToRevealSolution({ children, hint }) {
  const [revealed, setRevealed] = useState(false);
  const contentId = `solution-${useId().replace(/:/g, '')}`;

  return (
    <div className="rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 p-6">
      {!revealed ? (
        <div className="text-center">
          <div className="text-4xl mb-2" aria-hidden="true">
            🔒
          </div>
          <h4 className="font-semibold text-lg mb-2">Řešení je zamčené</h4>
          {hint && <div className="text-xs text-zinc-500 mb-3">{hint}</div>}
          <button
            type="button"
            className={clsx(
              'px-6 py-3 rounded-lg bg-sky-600 text-white font-medium',
              'hover:bg-sky-700 transition-all active:scale-95 focus-visible:outline-none',
              'focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2',
            )}
            aria-expanded={revealed}
            aria-controls={contentId}
            onClick={() => setRevealed(true)}
          >
            Zobrazit řešení
          </button>
        </div>
      ) : (
        <div id={contentId} hidden={!revealed}>
          {children}
        </div>
      )}
    </div>
  );
}
