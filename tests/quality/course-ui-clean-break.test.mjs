import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../..', import.meta.url));
const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.css']);
const FORBIDDEN = [
  /src\/components\/(?:portal|lesson|exercises|playground|teacher)/,
  /portal-(?:page|header|panel|action|kicker)/,
  /prefers-color-scheme:\s*dark/,
  /\b(?:PortalFrame|LessonShell|SharedSlideCard|LessonTaskWorkspace|TeacherWorkspaceShell)\b/,
];

async function collect(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collect(path)));
    else if (SOURCE_EXTENSIONS.has(extname(entry.name))) files.push(path);
  }
  return files;
}

test('active source contains one course UI architecture and no legacy visual layer', async () => {
  const files = [
    ...(await collect(join(root, 'pages'))),
    ...(await collect(join(root, 'src'))),
    ...(await collect(join(root, 'styles'))),
    ...(await readdir(root))
      .filter((name) => /^interactive_zwa_.*\.jsx$/.test(name))
      .map((name) => join(root, name)),
  ];
  const violations = [];

  for (const file of files) {
    const source = await readFile(file, 'utf8');
    for (const pattern of FORBIDDEN) {
      if (pattern.test(source)) violations.push(`${file.slice(root.length + 1)}: ${pattern}`);
    }
  }

  assert.deepEqual(violations, []);
});
