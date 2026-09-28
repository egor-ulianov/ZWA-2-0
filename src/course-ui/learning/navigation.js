function getSectionIds(sections) {
  if (!Array.isArray(sections)) return [];
  return sections
    .filter((section) => section && typeof section.id === 'string' && section.id.length > 0)
    .map((section) => section.id);
}

function decodeHash(hash) {
  if (typeof hash !== 'string') return '';
  const value = hash.replace(/^#/, '');
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function resolveSectionId(sections, location = {}) {
  const ids = getSectionIds(sections);
  if (ids.length === 0) return undefined;

  const search = typeof location.search === 'string' ? location.search : '';
  const querySection = new URLSearchParams(search).get('slide');
  if (ids.includes(querySection)) return querySection;

  const hashSection = decodeHash(location.hash);
  if (ids.includes(hashSection)) return hashSection;

  return ids[0];
}

export function buildSectionUrl(location = {}, sectionId) {
  const pathname = location.pathname || '/';
  const current = new URL(
    location.href || `${pathname}${location.search || ''}${location.hash || ''}`,
    'http://localhost',
  );
  current.searchParams.set('slide', sectionId);
  current.hash = '';
  return `${current.pathname}${current.search}`;
}

const EXPERIENCE_MODES = new Set(['student', 'projector', 'presenter']);

export function resolveExperienceMode(location = {}) {
  const search = typeof location.search === 'string' ? location.search : '';
  const requestedMode = new URLSearchParams(search).get('mode');
  return EXPERIENCE_MODES.has(requestedMode) ? requestedMode : 'student';
}

export function normalizeExperienceMode(mode) {
  return EXPERIENCE_MODES.has(mode) ? mode : 'student';
}

export function isEditableTarget(target) {
  if (!target || typeof target !== 'object') return false;
  if (target.isContentEditable) return true;
  const tagName = typeof target.tagName === 'string' ? target.tagName.toLowerCase() : '';
  return tagName === 'input' || tagName === 'textarea' || tagName === 'select';
}

export function getKeyboardNavigationDirection(event = {}) {
  if (event.defaultPrevented || isEditableTarget(event.target)) return null;
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') return 1;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') return -1;
  if (event.key === 'Home') return 'first';
  if (event.key === 'End') return 'last';
  return null;
}

export function getSectionDomIds(sectionId, idPrefix = 'lesson') {
  const safePrefix = String(idPrefix).replace(/[^a-zA-Z0-9_-]/g, '-');
  const safeSectionId = String(sectionId).replace(/[^a-zA-Z0-9_-]/g, '-');
  return {
    headingId: `${safePrefix}-heading-${safeSectionId}`,
    sectionId: `${safePrefix}-section-${safeSectionId}`,
  };
}

export { EXPERIENCE_MODES, getSectionIds };
