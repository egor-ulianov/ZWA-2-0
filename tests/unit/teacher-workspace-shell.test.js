import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.join(fileURLToPath(new URL('../..', import.meta.url)));

test('teacher workspace shell uses PortalFrame and text-only teacher navigation', async () => {
  const source = await readFile(
    path.join(root, 'src/components/teacher/TeacherWorkspaceShell.jsx'),
    'utf8',
  );

  assert.match(source, /PortalFrame/);
  assert.match(source, /Attendance & records/);
  assert.match(source, /Grade normalization/);
  assert.doesNotMatch(source, /Z logo|standalone Z/i);
});
