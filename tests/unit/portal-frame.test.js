import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.join(fileURLToPath(new URL('../..', import.meta.url)));

test('portal frame uses textual course identity and no standalone Z mark', async () => {
  const source = await readFile(path.join(root, 'src/components/portal/PortalFrame.jsx'), 'utf8');
  assert.match(source, /ZWA · Web Applications/);
  assert.doesNotMatch(source, /w-symbol|aria-label=.Z logo/i);
});
