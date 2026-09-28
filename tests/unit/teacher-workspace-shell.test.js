import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('teacher workspace uses the new operations application and text navigation', async () => {
  const source = await readFile(
    new URL('../../src/course-ui/operations/TeacherWorkspace.jsx', import.meta.url),
    'utf8',
  );
  assert.match(source, /OperationsApplication/);
  assert.match(source, /Attendance & records/);
  assert.match(source, /Grade normalization/);
  assert.doesNotMatch(source, /PortalFrame|portal-/);
});

test('operations CSS keeps compact layouts responsive and focusable', async () => {
  const source = await readFile(
    new URL('../../src/course-ui/operations/operations.module.css', import.meta.url),
    'utf8',
  );
  assert.match(source, /@media \(max-width: 720px\)/);
  assert.match(source, /focus-visible/);
  assert.match(source, /overflow-x: auto/);
});
