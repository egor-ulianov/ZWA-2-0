import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildSectionUrl,
  getKeyboardNavigationDirection,
  isEditableTarget,
  resolveExperienceMode,
  resolveSectionId,
} from '../../src/course-ui/learning/navigation.js';

const sections = [
  { id: 'intro', title: 'Úvod' },
  { id: 'practice', title: 'Cvičení' },
  { id: 'summary', title: 'Shrnutí' },
];

test('section resolution tolerates malformed input and prefers valid query then hash selection', () => {
  assert.equal(resolveSectionId([], {}), undefined);
  assert.equal(resolveSectionId(null, {}), undefined);
  assert.equal(resolveSectionId([null, {}, { id: '' }, sections[0]], {}), 'intro');
  assert.equal(
    resolveSectionId(sections, { search: '?slide=practice', hash: '#summary' }),
    'practice',
  );
  assert.equal(
    resolveSectionId(sections, { search: '?slide=missing', hash: '#summary' }),
    'summary',
  );
  assert.equal(
    resolveSectionId(sections, { search: '?slide=missing', hash: '#also-missing' }),
    'intro',
  );
  assert.equal(resolveSectionId(sections, { hash: '#%E0%A4%A' }), 'intro');
});

test('section URLs preserve unrelated parameters while normalizing selection and hash', () => {
  assert.equal(
    buildSectionUrl(
      {
        pathname: '/interactive-zwa-1-html5',
        search: '?mode=presenter&source=course&slide=old',
        hash: '#stale',
      },
      'practice',
    ),
    '/interactive-zwa-1-html5?mode=presenter&source=course&slide=practice',
  );
});

test('experience mode accepts only the three deliberate lesson modes', () => {
  assert.equal(resolveExperienceMode({ search: '?mode=presenter' }), 'presenter');
  assert.equal(resolveExperienceMode({ search: '?mode=projector' }), 'projector');
  assert.equal(resolveExperienceMode({ search: '?mode=student' }), 'student');
  assert.equal(resolveExperienceMode({ search: '?mode=admin' }), 'student');
  assert.equal(resolveExperienceMode({}), 'student');
});

test('keyboard navigation excludes every editable target', () => {
  assert.equal(isEditableTarget({ tagName: 'INPUT' }), true);
  assert.equal(isEditableTarget({ tagName: 'textarea' }), true);
  assert.equal(isEditableTarget({ tagName: 'SELECT' }), true);
  assert.equal(isEditableTarget({ tagName: 'div', isContentEditable: true }), true);
  assert.equal(isEditableTarget({ tagName: 'button' }), false);
  assert.equal(
    getKeyboardNavigationDirection({ key: 'ArrowRight', target: { tagName: 'input' } }),
    null,
  );
  assert.equal(
    getKeyboardNavigationDirection({ key: 'ArrowRight', target: { tagName: 'button' } }),
    1,
  );
  assert.equal(getKeyboardNavigationDirection({ key: 'Home', target: null }), 'first');
  assert.equal(getKeyboardNavigationDirection({ key: 'End', target: null }), 'last');
  assert.equal(getKeyboardNavigationDirection({ key: 'Escape', target: null }), null);
});
