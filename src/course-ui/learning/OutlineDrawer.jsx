import { useEffect, useRef, useState } from 'react';

import styles from './learning.module.css';

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function OutlineDrawer({ lesson, sections = [], activeSection, onChange }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const drawerRef = useRef(null);
  const closeRef = useRef(null);

  function closeDrawer({ restoreFocus = true } = {}) {
    setOpen(false);
    if (restoreFocus) window.requestAnimationFrame(() => triggerRef.current?.focus());
  }

  useEffect(() => {
    if (!open) return undefined;

    const pageContent = document.querySelector('[data-learning-page-content]');
    pageContent?.setAttribute('inert', '');
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeDrawer();
        return;
      }
      if (event.key !== 'Tab' || !drawerRef.current) return;

      const focusable = Array.from(drawerRef.current.querySelectorAll(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      pageContent?.removeAttribute('inert');
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        className={styles.outlineTrigger}
        onClick={() => setOpen(true)}
        ref={triggerRef}
        type="button"
      >
        <span aria-hidden="true" className={styles.menuIcon}>
          <i />
          <i />
          <i />
        </span>
        Osnova lekce
      </button>
      {open ? (
        <div className={styles.drawerLayer}>
          <button
            aria-label="Zavřít osnovu"
            className={styles.drawerBackdrop}
            onClick={() => closeDrawer()}
            tabIndex={-1}
            type="button"
          />
          <aside
            aria-label="Osnova lekce"
            aria-modal="true"
            className={styles.drawer}
            ref={drawerRef}
            role="dialog"
          >
            <header>
              <div>
                <p>Osnova lekce</p>
                <strong>{lesson?.shortTitle || lesson?.title || 'Lekce'}</strong>
              </div>
              <button
                aria-label="Zavřít osnovu"
                className={styles.drawerClose}
                onClick={() => closeDrawer()}
                ref={closeRef}
                type="button"
              >
                ×
              </button>
            </header>
            <ol>
              {sections.map((section, index) => (
                <li key={section.id}>
                  <button
                    aria-current={section.id === activeSection ? 'step' : undefined}
                    onClick={() => {
                      onChange?.(section.id);
                      closeDrawer();
                    }}
                    type="button"
                  >
                    <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                    <strong>{section.title}</strong>
                  </button>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      ) : null}
    </>
  );
}
