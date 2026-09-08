import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { neon } from '@neondatabase/serverless';
import { createStudentsRepository } from '../src/server/repositories/students.js';

function parseSemicolonCsv(input) {
  const rows = []; let row = []; let field = ''; let quoted = false;
  const text = input.replace(/^\uFEFF/, '');
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') { field += '"'; index += 1; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ';') { row.push(field); field = ''; }
    else if (char === '\n') { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = ''; }
    else field += char;
  }
  if (quoted) throw new Error('Malformed CSV: unterminated quoted field');
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const source = process.argv[2];
if (!source) throw new Error('Usage: node scripts/import-roster.mjs /absolute/path/to/roster.csv');
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required to import a roster');
const rows = parseSemicolonCsv(await readFile(resolve(source), 'utf8'));
const [header = [], ...records] = rows;
const index = Object.fromEntries(header.map((name, position) => [name.trim(), position]));
if (index.username === undefined) throw new Error('Roster CSV must contain a username column');
const roster = records.filter((record) => record.some((value) => value.trim())).map((record) => ({
  username: record[index.username],
}));
const result = await createStudentsRepository(neon(process.env.DATABASE_URL)).importRoster(roster);
process.stdout.write(`Imported ${result.imported} unique students.\n`);
