import Link from 'next/link';

import PortalFrame from '../portal/PortalFrame.jsx';

const sections = [
  { key: 'attendance', href: '/attendance', label: 'Attendance & records' },
  { key: 'normalization', href: '/teacher', label: 'Grade normalization' },
];

function sectionClassName(isActive) {
  return [
    'portal-action',
    'min-h-0 px-3 py-2 text-sm',
    isActive
      ? 'ring-2 ring-[var(--portal-focus)] ring-offset-2 ring-offset-[var(--portal-surface)]'
      : 'border-[var(--portal-border)] bg-[var(--portal-panel)] text-[var(--portal-text)] hover:bg-[var(--portal-surface-muted)]',
  ].join(' ');
}

export default function TeacherWorkspaceShell({
  title,
  eyebrow = 'Teacher workspace',
  description,
  username,
  activeSection,
  actions,
  children,
}) {
  const identity = typeof username === 'string' ? username.trim() : '';

  return (
    <PortalFrame meta="Teacher workspace">
      <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-12">
        <header className="portal-panel p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0">
              <p className="portal-kicker">{eyebrow}</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
              {description ? (
                <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--portal-text-muted)] md:text-base">
                  {description}
                </p>
              ) : null}
              {identity ? (
                <p className="mt-4 text-sm text-[var(--portal-text-muted)]">
                  Signed in as{' '}
                  <span className="font-semibold text-[var(--portal-text)]">{identity}</span>
                </p>
              ) : null}
            </div>
            {actions == null ? null : <div className="flex flex-wrap gap-2">{actions}</div>}
          </div>
        </header>

        <nav className="mt-6" aria-label="Teacher workspace sections">
          <ul className="flex flex-wrap gap-2">
            {sections.map((section) => {
              const isActive = activeSection === section.key;
              return (
                <li key={section.key}>
                  <Link
                    className={sectionClassName(isActive)}
                    href={section.href}
                    prefetch={false}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {section.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-8">{children}</div>
      </main>
    </PortalFrame>
  );
}
