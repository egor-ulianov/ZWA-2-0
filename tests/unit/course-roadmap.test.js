import assert from 'node:assert/strict';
import test from 'node:test';

import { lessons } from '../../src/config/lessons.js';
import { getCourseModules } from '../../src/course-ui/course/courseModel.js';

test('course modules cover every lesson in catalog order', () => {
  const modules = getCourseModules();
  const groupedLessons = modules.flatMap((module) => module.lessons);
  assert.equal(modules.length, 4);
  assert.deepEqual(
    groupedLessons.map(({ slug }) => slug),
    lessons.map(({ slug }) => slug),
  );
  assert.ok(modules.every(({ title, color }) => title && color));
});
