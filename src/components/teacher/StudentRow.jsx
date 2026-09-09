import React from 'react';
import ProgressEditor from './ProgressEditor.jsx';

export default function StudentRow({ student, present, saving, progress, onToggle, onSaveProgress }) {
  const inputId = `attendance-${student.username}`;
  return (
    <li className="portal-panel p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="portal-kicker">Student record</p>
          <h3 className="mt-2 text-lg font-semibold">{student.username}</h3>
        </div>
        <label htmlFor={inputId} className="inline-flex min-h-11 items-center gap-3 rounded border border-[var(--portal-border)] px-3 py-2 text-sm font-semibold">
          <input
            id={inputId}
            type="checkbox"
            checked={present}
            disabled={saving}
            onChange={(event) => onToggle(student.username, event.target.checked)}
          />
          Present
        </label>
      </div>
      <details className="mt-4 border-t border-[var(--portal-border)] pt-3 text-sm">
        <summary className="cursor-pointer select-none font-semibold">Assignment progress</summary>
        <ProgressEditor username={student.username} value={progress} onSavePatch={onSaveProgress} />
      </details>
    </li>
  );
}
