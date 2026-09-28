import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

import { lessons } from '../src/config/lessons.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = path.join(root, '.next', 'visual-review');
const outputPath = path.join(outputDirectory, 'course-art-contact-sheet.png');
const columns = 3;
const rows = 4;
const artworkWidth = 400;
const artworkHeight = 225;
const labelHeight = 44;
const gutter = 24;
const margin = 32;
const cellHeight = artworkHeight + labelHeight;
const width = margin * 2 + columns * artworkWidth + (columns - 1) * gutter;
const height = margin * 2 + rows * cellHeight + (rows - 1) * gutter;

function escapeXml(value) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' };
    return entities[character];
  });
}

const composites = [];

for (const [index, lesson] of lessons.entries()) {
  const column = index % columns;
  const row = Math.floor(index / columns);
  const left = margin + column * (artworkWidth + gutter);
  const top = margin + row * (cellHeight + gutter);
  const sourcePath = path.join(root, 'public', lesson.artwork.replace(/^\//, ''));
  const filename = path.basename(sourcePath);
  const source = await readFile(sourcePath);
  const artwork = await sharp(source)
    .resize(artworkWidth, artworkHeight, { fit: 'contain', background: '#fffdf8' })
    .png()
    .toBuffer();
  const label = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${artworkWidth}" height="${labelHeight}">
      <rect width="100%" height="100%" fill="#fffdf8"/>
      <text x="14" y="28" fill="#152038" font-family="Arial, sans-serif" font-size="16" font-weight="700">${escapeXml(filename)}</text>
    </svg>
  `);

  composites.push({ input: artwork, left, top });
  composites.push({ input: label, left, top: top + artworkHeight });
}

await mkdir(outputDirectory, { recursive: true });
await sharp({
  create: {
    width,
    height,
    channels: 3,
    background: '#e6e0d5',
  },
})
  .composite(composites)
  .png()
  .toFile(outputPath);

console.log(outputPath);
