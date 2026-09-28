import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../..', import.meta.url));

test('catalog metadata uses Czech titles while preserving stable route identifiers', async () => {
  const source = await readFile(`${root}/src/config/lessons.js`, 'utf8');
  assert.match(source, /HTML5 prezentace/);
  assert.match(source, /simulovanou linuxovou CLI/);
  assert.doesNotMatch(source, /Presentation with Live Playground|Simulated Linux CLI/);
  assert.match(source, /href: '\/interactive-zwa-1-html5'/);
});

test('shared catalog chrome and module metadata are Czech', async () => {
  const [frame, roadmap, metadata] = await Promise.all([
    readFile(`${root}/src/course-ui/foundation/CourseMasthead.jsx`, 'utf8'),
    readFile(`${root}/src/course-ui/course/CourseOverview.jsx`, 'utf8'),
    readFile(`${root}/src/course-ui/course/courseModel.js`, 'utf8'),
  ]);
  assert.match(frame, /ZWA/);
  assert.match(roadmap, /Kurz · 12 lekcí/);
  assert.match(metadata, /Základy webu/);
  assert.doesNotMatch(roadmap, /Course catalogue|Course roadmap|Open lesson/);
  assert.doesNotMatch(
    metadata,
    /Web foundations|Presentation and interaction|Server-side foundations/,
  );
});

test('sandbox runtime results expose Czech user-facing messages', async () => {
  const source = await readFile(`${root}/src/course-ui/exercises/runtime/documents.js`, 'utf8');
  assert.match(source, /Kód byl spuštěn/);
  assert.match(source, /Chyba běhu:/);
  assert.doesNotMatch(source, /Code executed|Runtime error:|Validation error:/);
});

test('CSS validator results use Czech user-facing messages', async () => {
  const source = await readFile(`${root}/src/course-ui/exercises/runtime/validators.js`, 'utf8');
  assert.match(source, /Úloha 1:/);
  assert.doesNotMatch(source, /Task:|has some box model styling|present/);
});
