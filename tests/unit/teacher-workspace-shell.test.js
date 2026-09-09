import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.join(fileURLToPath(new URL('../..', import.meta.url)));

function cssBlock(source, marker, closingIndent) {
  const markerIndex = source.indexOf(marker);
  assert.notEqual(markerIndex, -1, `CSS marker not found: ${marker}`);
  const openIndex = source.indexOf('{', markerIndex);
  const closeIndex = source.indexOf(`\n${closingIndent}}`, openIndex);
  assert.notEqual(closeIndex, -1, `CSS block did not close: ${marker}`);
  return source.slice(openIndex + 1, closeIndex);
}

function cssValue(block, property) {
  const match = block.match(new RegExp(`${property}:\\s*(#[0-9a-f]{6})`, 'i'));
  assert.ok(match, `CSS property not found: ${property}`);
  return match[1];
}

function relativeLuminance(hex) {
  const channels = hex
    .slice(1)
    .match(/../g)
    .map((channel) => parseInt(channel, 16) / 255)
    .map((channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(foreground, background) {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

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

test('inactive teacher navigation keeps readable contrast on hover', async () => {
  const [shell, styles] = await Promise.all([
    readFile(path.join(root, 'src/components/teacher/TeacherWorkspaceShell.jsx'), 'utf8'),
    readFile(path.join(root, 'styles/globals.css'), 'utf8'),
  ]);

  assert.match(shell, /portal-secondary-action/);
  const hover = cssBlock(styles, '  .portal-action.portal-secondary-action:hover {', '  ');
  assert.match(hover, /background-color:\s*var\(--portal-surface-muted\)/);
  assert.match(hover, /color:\s*var\(--portal-text\)/);

  const lightTokens = cssBlock(styles, '  :root {', '  ');
  const darkTokens = cssBlock(styles, '    :root {', '    ');
  for (const [theme, tokens] of [
    ['light', lightTokens],
    ['dark', darkTokens],
  ]) {
    assert.ok(
      contrastRatio(
        cssValue(tokens, '--portal-text'),
        cssValue(tokens, '--portal-surface-muted'),
      ) >= 4.5,
      `${theme} inactive navigation hover contrast is insufficient`,
    );
  }
});
