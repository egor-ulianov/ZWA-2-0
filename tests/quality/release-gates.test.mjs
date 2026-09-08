import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const packageJson = JSON.parse(
  await readFile(new URL('../../package.json', import.meta.url), 'utf8'),
);

test('package exposes the release quality gates', () => {
  assert.equal(packageJson.type, 'module');
  const requiredScripts = [
    'test',
    'test:unit',
    'test:api',
    'lint',
    'format:check',
    'typecheck',
    'security:scan',
    'quality:health',
    'quality:docker',
    'test:e2e',
  ];

  for (const script of requiredScripts) {
    assert.equal(typeof packageJson.scripts?.[script], 'string', `missing npm script: ${script}`);
  }
});
