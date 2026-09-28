import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const learningRoot = new URL('../../src/course-ui/learning/', import.meta.url);

test('learning experience owns the lesson masthead, drawer, article, and pager', async () => {
  const source = await readFile(new URL('LearningExperience.jsx', learningRoot), 'utf8');
  assert.match(source, /CourseMasthead/);
  assert.match(source, /OutlineDrawer/);
  assert.match(source, /LessonHero/);
  assert.match(source, /LessonPager/);
  assert.match(source, /data-learning-experience="student"/);
  assert.doesNotMatch(source, /LessonShell|portal-/);
});

test('outline drawer traps focus and restores it after closing', async () => {
  const source = await readFile(new URL('OutlineDrawer.jsx', learningRoot), 'utf8');
  assert.match(source, /event\.key === 'Escape'/);
  assert.match(source, /event\.key !== 'Tab'/);
  assert.match(source, /triggerRef\.current\?\.focus/);
  assert.match(source, /aria-modal="true"/);
});
