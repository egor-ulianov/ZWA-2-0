import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { lessons } from '../../src/config/lessons.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('all twelve original lecture illustrations follow the shared vector rules', async () => {
  const bodies = [];

  for (const lesson of lessons) {
    const filePath = path.join(root, 'public', lesson.artwork.replace(/^\//, ''));
    const body = await readFile(filePath, 'utf8');
    bodies.push(body.replace(/\s+/g, ' ').trim());

    assert.match(body, /<svg[^>]+viewBox="0 0 960 540"/);
    assert.doesNotMatch(body, /<text\b/i);
    assert.doesNotMatch(body, /data:image/i);
    assert.doesNotMatch(body, /<(?:linearGradient|radialGradient)\b/i);
    assert.doesNotMatch(body, /filter\s*=/i);
    assert.match(body, /aria-hidden="true"/);
  }

  assert.equal(bodies.length, 12);
  assert.equal(new Set(bodies).size, 12);
});
