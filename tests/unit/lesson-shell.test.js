import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.join(fileURLToPath(new URL('../..', import.meta.url)));

test('lesson shell has a student default and declares projector and presenter modes', async () => {
  const source = await readFile(path.join(root, 'src/components/lesson/LessonShell.jsx'), 'utf8');
  assert.match(source, /mode = 'student'/);
  assert.match(source, /projector/);
  assert.match(source, /presenter/);
});

test('lesson shell composes the portal frame, outline, context, and objective', async () => {
  const source = await readFile(path.join(root, 'src/components/lesson/LessonShell.jsx'), 'utf8');
  assert.match(source, /PortalFrame/);
  assert.match(source, /LessonOutline/);
  assert.match(source, /LessonContext\.Provider/);
  assert.match(source, /objective/);
});

test('lesson context exposes the shared lesson state hook', async () => {
  const source = await readFile(path.join(root, 'src/components/lesson/LessonContext.jsx'), 'utf8');
  assert.match(source, /createContext/);
  assert.match(source, /useLessonContext/);
  assert.match(source, /lesson/);
  assert.match(source, /slides/);
  assert.match(source, /activeSlide/);
  assert.match(source, /onChange/);
  assert.match(source, /mode/);
});

test('lesson outline is a named navigation landmark', async () => {
  const source = await readFile(path.join(root, 'src/components/lesson/LessonOutline.jsx'), 'utf8');
  assert.match(source, /<nav/);
  assert.match(source, /Course outline/);
  assert.match(source, /aria-current/);
});

test('slide cards use solid portal panels without glass effects', async () => {
  const source = await readFile(path.join(root, 'src/components/lesson/SlideCard.jsx'), 'utf8');
  assert.match(source, /portal-panel/);
  assert.doesNotMatch(source, /backdrop-blur|bg-gradient/);
});
