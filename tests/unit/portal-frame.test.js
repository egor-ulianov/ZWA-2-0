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

test('portal frame uses textual course identity and no standalone Z mark', async () => {
  const source = await readFile(path.join(root, 'src/components/portal/PortalFrame.jsx'), 'utf8');
  assert.match(source, /ZWA · Web Applications/);
  assert.doesNotMatch(source, /w-symbol|aria-label=.Z logo/i);
});

test('portal action and instructional colors meet readable contrast in light and dark themes', async () => {
  const source = await readFile(path.join(root, 'styles/globals.css'), 'utf8');
  const lightTokens = cssBlock(source, '  :root {', '  ');
  const darkTokens = cssBlock(source, '@media (prefers-color-scheme: dark) {\n    :root {', '    ');
  const action = cssBlock(source, '  .portal-action {', '  ');
  const actionText = cssValue(action, 'color');
  const kicker = cssBlock(source, '  .portal-kicker {', '  ');
  const themes = [
    ['light', lightTokens],
    ['dark', darkTokens],
  ];

  for (const [theme, tokens] of themes) {
    const surface = cssValue(tokens, '--portal-surface');
    const actionBackground = cssValue(tokens, '--portal-indigo');
    const actionHover = cssValue(tokens, '--portal-indigo-hover');
    const coral = cssValue(tokens, '--portal-coral');

    assert.ok(
      contrastRatio(actionText, actionBackground) >= 4.5,
      `${theme} action text contrast is insufficient`,
    );
    assert.ok(
      contrastRatio(actionText, actionHover) >= 4.5,
      `${theme} action hover text contrast is insufficient`,
    );
    assert.ok(contrastRatio(coral, surface) >= 4.5, `${theme} kicker contrast is insufficient`);
  }

  assert.match(kicker, /color:\s*var\(--portal-coral\)/);
});
