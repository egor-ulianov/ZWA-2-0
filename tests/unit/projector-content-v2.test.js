import assert from 'node:assert/strict';
import { register } from 'node:module';
import test from 'node:test';

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import {
  projectDomNode,
  projectReactChildren,
} from '../../src/course-ui/presentation/projectorContent.js';

register(new URL('../helpers/jsx-loader.mjs', import.meta.url), { parentURL: import.meta.url });

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

test('v2 projector projection preserves safe teaching content and drops private or active content', () => {
  const projected = projectDomNode(
    element('div', {}, [
      element('p', {}, [text('Bezpečný výklad')]),
      element('section', { 'data-projector-private': 'exercise-workspace' }, [
        text('Tajné řešení'),
      ]),
      element('script', {}, [text('alert(1)')]),
    ]),
  );
  const serialized = JSON.stringify(projected);
  assert.match(serialized, /Bezpečný výklad/);
  assert.doesNotMatch(serialized, /Tajné řešení|alert/);

  const reactProjection = projectReactChildren([
    React.createElement('p', { key: 'safe' }, 'Viditelný princip'),
    React.createElement(
      'aside',
      { key: 'private', 'data-projector-private': 'notes' },
      'Soukromá poznámka',
    ),
  ]);
  const reactMarkup = renderToStaticMarkup(React.createElement('div', null, reactProjection));
  assert.match(reactMarkup, /Viditelný princip/);
  assert.doesNotMatch(reactMarkup, /Soukromá poznámka/);
});

test('projector experience renders one clean main landmark without private descendants', async () => {
  const { ProjectorExperience } =
    await import('../../src/course-ui/presentation/ProjectorExperience.jsx');
  const html = renderToStaticMarkup(
    React.createElement(
      ProjectorExperience,
      {
        lesson: {
          number: 1,
          title: 'HTML5 a sémantika',
          artwork: '/course-art/lesson-01-html5.svg',
          moduleId: 'web-foundations',
        },
        sections: [
          { id: 'intro', title: 'Úvod' },
          { id: 'practice', title: 'Cvičení' },
        ],
        activeSection: 'intro',
        onChange() {},
      },
      React.createElement('p', null, 'Viditelný obsah'),
      React.createElement('aside', { 'data-projector-private': 'answer' }, 'Soukromá odpověď'),
    ),
  );

  assert.equal((html.match(/<main\b/g) || []).length, 1);
  assert.match(html, /data-presentation-mode="projector"/);
  assert.match(html, /Pozice snímku/);
  assert.match(html, /Viditelný obsah/);
  assert.doesNotMatch(html, /Soukromá odpověď/);
  assert.match(html, /Předchozí snímek/);
  assert.match(html, /Následující snímek/);
});
