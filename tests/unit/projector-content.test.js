import assert from 'node:assert/strict';
import test from 'node:test';

import { projectDomNode } from '../../src/components/lesson/projectorContent.js';

function text(value) {
  return { nodeType: 3, nodeValue: value };
}

function element(tagName, attributes = {}, childNodes = []) {
  return {
    nodeType: 1,
    localName: tagName,
    attributes: Object.entries(attributes).map(([name, value]) => ({ name, value })),
    childNodes,
  };
}

test('projector drops unsafe SVG xlink payloads while retaining safe teaching text', () => {
  const projected = projectDomNode(
    element('div', {}, [
      element('svg', {}, [
        element('a', { 'xlink:href': 'javascript:alert(1)' }, [text('unsafe payload')]),
      ]),
      element('a', { 'xlink:href': 'javascript:alert(2)', href: 'https://example.test/lesson' }, [
        text('safe link text'),
      ]),
      element('p', {}, [text('safe teaching text')]),
    ]),
  );

  const serialized = JSON.stringify(projected);
  assert.match(serialized, /safe teaching text/);
  assert.match(serialized, /safe link text/);
  assert.doesNotMatch(serialized, /javascript|xlink|unsafe payload/);
});

test('projector drops marked exercise chrome before rendering its descendants', () => {
  const projected = projectDomNode(
    element('section', { 'data-projector-private': 'exercise-workspace' }, [
      text('In this browser session'),
      element('textarea', {}, [text('source')]),
    ]),
  );

  assert.equal(projected, null);
});
