import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const editorPath = new URL('../../src/course-ui/exercises/StudioEditor.jsx', import.meta.url);

test('StudioEditor forwards read-only state to CodeMirror and labels the editing surface', async () => {
  const source = await readFile(editorPath, 'utf8');
  assert.match(source, /readOnly = false/);
  assert.match(source, /editable=\{!readOnly\}/);
  assert.match(source, /readOnly=\{readOnly\}/);
  assert.match(source, /aria-label/);
  assert.doesNotMatch(source, /MutationObserver|SyntaxCodeEditor/);
});
