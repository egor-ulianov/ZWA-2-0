import { portalClassNames } from './portalClasses.js';

export default function PortalFrame({
  children,
  courseLabel = 'ZWA · Web Applications',
  meta,
  className,
}) {
  const pageClassName = [portalClassNames.page, className].filter(Boolean).join(' ');

  return (
    <div className={pageClassName}>
      <header className={portalClassNames.header}>
        <strong>{courseLabel}</strong>
        {meta ? <span>{meta}</span> : null}
      </header>
      {children}
    </div>
  );
}
