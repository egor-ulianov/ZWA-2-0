import assert from 'node:assert/strict';
import test from 'node:test';

import { lessons } from '../../src/config/lessons.js';
import { courseMetadata } from '../../src/components/portal/courseMetadata.js';

test('course metadata covers each existing lesson in catalogue order', () => {
  assert.equal(courseMetadata.length, lessons.length);
  assert.deepEqual(
    courseMetadata.map(({ slug }) => slug),
    lessons.map(({ slug }) => slug),
  );
  assert.ok(courseMetadata.every(({ module, focus }) => module && focus));
});
