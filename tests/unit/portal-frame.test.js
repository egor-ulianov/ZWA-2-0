import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('course foundation uses textual identity and the explicit theme controller', async () => {
  const [application, masthead] = await Promise.all([
    readFile(
      new URL('../../src/course-ui/foundation/CourseApplication.jsx', import.meta.url),
      'utf8',
    ),
    readFile(new URL('../../src/course-ui/foundation/CourseMasthead.jsx', import.meta.url), 'utf8'),
  ]);
  assert.match(application, /data-course-application/);
  assert.match(masthead, /ThemeController/);
  assert.doesNotMatch(`${application}${masthead}`, /PortalFrame|portal-/);
});

test('theme tokens provide separately tuned light and explicit dark palettes', async () => {
  const source = await readFile(new URL('../../styles/course-ui.css', import.meta.url), 'utf8');
  assert.match(source, /:root\[data-theme='light'\]/);
  assert.match(source, /:root\[data-theme='dark'\]/);
  assert.match(source, /--course-blue:/);
  assert.doesNotMatch(source, /prefers-color-scheme:\s*dark/);
});
