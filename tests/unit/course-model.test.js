import assert from 'node:assert/strict';
import test from 'node:test';

import { lessons } from '../../src/config/lessons.js';
import { COURSE_MODULES, getCourseModules } from '../../src/course-ui/course/courseModel.js';

const expectedModules = [
  ['web-foundations', 'Základy webu', 'coral'],
  ['presentation-interaction', 'Prezentace a interakce', 'sky'],
  ['server-foundations', 'Základy serveru', 'mint'],
  ['state-data', 'Stav a data', 'apricot'],
];

test('course modules preserve the approved order and group three ordered lessons each', () => {
  assert.deepEqual(
    COURSE_MODULES.map(({ id, title, color }) => [id, title, color]),
    expectedModules,
  );

  const modules = getCourseModules();
  assert.equal(modules.length, 4);
  assert.deepEqual(
    modules.map((module) => module.lessons.map((lesson) => lesson.number)),
    [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
      [10, 11, 12],
    ],
  );
  assert.ok(modules.every((module) => module.lessons.length === 3));
});

test('every public lesson has concise course metadata and unique local artwork', () => {
  assert.equal(lessons.length, 12);

  for (const lesson of lessons) {
    assert.equal(typeof lesson.shortTitle, 'string');
    assert.ok(lesson.shortTitle.length > 0 && lesson.shortTitle.length < lesson.title.length);
    assert.equal(typeof lesson.focus, 'string');
    assert.ok(lesson.focus.length > 20);
    assert.ok(COURSE_MODULES.some((module) => module.id === lesson.moduleId));
    assert.match(lesson.artwork, /^\/course-art\/lesson-\d{2}-[a-z0-9-]+\.svg$/);
  }

  assert.equal(new Set(lessons.map((lesson) => lesson.artwork)).size, 12);
});

test('custom lesson lists retain route authority and omit unknown module entries', () => {
  const selected = [lessons[9], lessons[0], { number: 99, moduleId: 'missing' }];
  const modules = getCourseModules(selected);

  assert.deepEqual(
    modules.map((module) => [module.id, module.lessons.map((lesson) => lesson.number)]),
    [
      ['web-foundations', [1]],
      ['state-data', [10]],
    ],
  );
});
