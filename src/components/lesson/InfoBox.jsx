import React from 'react';
import { clsx } from './classNames.js';

const colors = {
  info: 'bg-sky-50/80 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800',
  tip: 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800',
  warning: 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
};

export default function InfoBox({ children, type = 'info' }) {
  return (
    <div className={clsx('rounded-xl border p-4 text-sm', colors[type] || colors.info)} role="note">
      {children}
    </div>
  );
}
