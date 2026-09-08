import React from 'react';
import ProgressEditor from './ProgressEditor.jsx';

export default function StudentRow({ student, present, saving, progress, onToggle, onSaveProgress }) {
  const inputId = `attendance-${student.username}`;
  return (
    <li className="p-3 flex flex-wrap items-center justify-between gap-3">
      <div className="font-medium">{student.username}</div>
      <div className="flex items-center gap-4">
        <label htmlFor={inputId} className="inline-flex items-center gap-2 text-sm">
          <input id={inputId} type="checkbox" checked={present} disabled={saving} onChange={(event) => onToggle(student.username, event.target.checked)} />
          Present
        </label>
        <details className="text-sm">
          <summary className="cursor-pointer select-none">Assignment progress</summary>
          <ProgressEditor username={student.username} value={progress} onSavePatch={onSaveProgress} />
        </details>
      </div>
    </li>
  );
}
