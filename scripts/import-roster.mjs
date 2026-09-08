import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';
import {
  MAX_CSV_INPUT_BYTES,
  isLikelyUsernameRecordStart,
  parseCsvRows,
} from '../src/lib/csv.js';
import { createStudentsRepository } from '../src/server/repositories/students.js';
import { normalizeRosterRows, validateUsername } from '../src/server/repositories/validation.js';

function detectRosterDelimiter(input) {
  const text = String(input).replace(/^\uFEFF/, '');
  let inQuotes = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"' && text[index + 1] === '"' && inQuotes) {
      index += 1;
    } else if (character === '"') {
      inQuotes = !inQuotes;
    } else if (!inQuotes && (character === '\r' || character === '\n')) {
      break;
    } else if (!inQuotes && character === ';') {
      return ';';
    } else if (!inQuotes && character === ',') {
      return ',';
    }
  }
  return ',';
}

export function parseSemicolonCsv(input) {
  return parseCsvRows(input, {
    delimiter: ';',
    isLikelyRecordStart: isLikelyUsernameRecordStart,
  });
}

export function parseRosterCsv(input) {
  const delimiter = detectRosterDelimiter(input);
  const rows = parseCsvRows(input, {
    delimiter,
    isLikelyRecordStart: isLikelyUsernameRecordStart,
  });
  const diagnostics = [];
  const [headerRow, ...records] = rows;
  if (!headerRow) return { roster: [], diagnostics: [{ line: 1, severity: 'error', message: 'Missing header row' }] };
  if (headerRow.errors.length) {
    diagnostics.push(...headerRow.errors.map((message) => ({ line: headerRow.line, severity: 'error', message })));
  }
  const headers = headerRow.values.map((value) => value.trim().toLowerCase());
  const usernameIndex = headers.indexOf('username');
  if (usernameIndex < 0) {
    diagnostics.push({ line: headerRow.line, severity: 'error', message: 'Roster CSV must contain a username column' });
    return { roster: [], diagnostics };
  }
  const duplicateHeaders = headers.filter((value, index) => value && headers.indexOf(value) !== index);
  for (const header of new Set(duplicateHeaders)) diagnostics.push({ line: headerRow.line, severity: 'error', message: `Duplicate header: ${header}` });

  const candidates = [];
  const seenUsernames = new Set();
  for (const row of records) {
    if (row.errors.length) {
      diagnostics.push(...row.errors.map((message) => ({ line: row.line, severity: 'error', message })));
      continue;
    }
    if (row.values.every((value) => !value.trim())) continue;
    if (row.values.length !== headers.length) {
      diagnostics.push({ line: row.line, severity: 'error', message: `Expected ${headers.length} fields, got ${row.values.length}` });
      continue;
    }
    try {
      const username = validateUsername(row.values[usernameIndex]);
      if (seenUsernames.has(username)) {
        diagnostics.push({ line: row.line, severity: 'warning', message: `Duplicate username: ${username}` });
        continue;
      }
      seenUsernames.add(username);
      candidates.push({ username });
    } catch {
      diagnostics.push({ line: row.line, severity: 'error', message: 'Invalid username' });
    }
  }

  let roster;
  try { roster = normalizeRosterRows(candidates); }
  catch (error) {
    diagnostics.push({ line: 0, severity: 'error', message: error.message });
    roster = [];
  }
  return { roster, diagnostics };
}

export async function importRoster(source, { databaseUrl = process.env.DATABASE_URL, sql = databaseUrl ? neon(databaseUrl) : null, output = console.log } = {}) {
  if (!source) throw new Error('Usage: node scripts/import-roster.mjs /absolute/path/to/roster.csv');
  if (!sql) throw new Error('DATABASE_URL is required to import a roster');
  const sourcePath = resolve(source);
  const sourceStats = await stat(sourcePath);
  if (sourceStats.size > MAX_CSV_INPUT_BYTES) {
    throw new RangeError(`Roster CSV exceeds the maximum size of ${MAX_CSV_INPUT_BYTES} bytes`);
  }
  const parsed = parseRosterCsv(await readFile(sourcePath, 'utf8'));
  const errors = parsed.diagnostics.filter(({ severity }) => severity === 'error');
  if (errors.length) {
    throw new Error(`Roster CSV has ${errors.length} malformed row(s): ${errors.map(({ line, message }) => `line ${line}: ${message}`).join('; ')}`);
  }
  const result = await createStudentsRepository(sql).importRoster(parsed.roster);
  output(`Imported ${result.imported} unique students.`);
  for (const diagnostic of parsed.diagnostics.filter(({ severity }) => severity === 'warning')) output(`Warning: ${diagnostic.message}`);
  return result;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  importRoster(process.argv[2]).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
