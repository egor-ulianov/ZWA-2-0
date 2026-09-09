import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { getDefaultExtensions } from '@uiw/react-codemirror/esm/getDefaultExtensions.js';

const editorPath = new URL('../../src/components/exercises/SyntaxCodeEditor.jsx', import.meta.url);

test('SyntaxCodeEditor forwards read-only state to CodeMirror instead of relying on DOM attributes', async () => {
  const source = await readFile(editorPath, 'utf8');

  assert.match(source, /readOnly\s*=\s*false/);
  assert.match(source, /editable\s*=\s*true/);
  assert.match(source, /readOnly=\{readOnly\}/);
  assert.match(source, /editable=\{editable\}/);
  assert.doesNotMatch(source, /MutationObserver/);

  const state = EditorState.create({
    doc: '<p>řešení</p>',
    extensions: getDefaultExtensions({
      basicSetup: false,
      editable: false,
      readOnly: true,
      theme: 'none',
    }),
  });

  assert.equal(state.readOnly, true);
  assert.equal(state.facet(EditorView.editable), false);
});
