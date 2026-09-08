import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';
import { createStudentsRepository } from '../src/server/repositories/students.js';
import { normalizeRosterRows, validateUsername } from '../src/server/repositories/validation.js';

function pushRow(rows, values, line, errors) {
  if (values.length === 1 && values[0] === '' && errors.length === 0) return;
  rows.push({ line, values, errors });
}

export function parseSemicolonCsv(input) {
  if (typeof input !== 'string') throw new TypeError('CSV input must be text');
  const text = input.replace(/^\uFEFF/, '');
  const rows = [];
  let values = [];
  let field = '';
  let inQuotes = false;
  let afterClosingQuote = false;
  let line = 1;
  let rowLine = 1;
  let errors = [];

  const finishField = () => {
    values.push(field);
    field = '';
    afterClosingQuote = false;
  };
  const finishRow = () => {
    finishField();
    pushRow(rows, values, rowLine, errors);
    values = [];
    errors = [];
    rowLine = line;
  };

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (inQuotes) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
        afterClosingQuote = true;
      } else if (char === '\n') {
        const nextLineEnd = text.indexOf('\n', index + 1);
        const nextLine = text.slice(index + 1, nextLineEnd < 0 ? text.length : nextLineEnd);
        const nextDelimiter = nextLine.indexOf(';');
        const nextQuote = nextLine.indexOf('"');
        if (nextDelimiter >= 0 && (nextQuote < 0 || nextQuote > nextDelimiter)) {
          errors.push(`Unterminated quoted field before line ${line + 1}`);
          inQuotes = false;
          finishRow();
          line += 1;
          rowLine = line;
        } else {
          field += char;
          line += 1;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (afterClosingQuote) {
      if (char === ';') finishField();
      else if (char === '\n') { line += 1; finishRow(); }
      else if (char === '\r' && text[index + 1] === '\n') { /* CRLF is handled by LF. */ }
      else if (char !== ' ' && char !== '\t') {
        errors.push(`Unexpected character after closing quote at line ${line}`);
        field += char;
        afterClosingQuote = false;
      } else field += char;
      continue;
    }

    if (char === '"') {
      if (field === '') inQuotes = true;
      else {
        errors.push(`Unexpected quote in unquoted field at line ${line}`);
        field += char;
      }
    } else if (char === ';') finishField();
    else if (char === '\n') { line += 1; finishRow(); }
    else if (char === '\r' && text[index + 1] === '\n') { /* CRLF. */ }
    else field += char;
  }

  if (inQuotes) {
    errors.push(`Unterminated quoted field starting at line ${rowLine}`);
    inQuotes = false;
  }
  if (field || values.length || errors.length) finishRow();
  return rows;
}

export function parseRosterCsv(input) {
  const rows = parseSemicolonCsv(input);
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
      candidates.push({ username: validateUsername(row.values[usernameIndex]) });
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
  if (roster.length !== candidates.length) {
    diagnostics.push({ line: 0, severity: 'warning', message: `${candidates.length - roster.length} duplicate username row(s) ignored` });
  }
  return { roster, diagnostics };
}

export async function importRoster(source, { databaseUrl = process.env.DATABASE_URL, sql = databaseUrl ? neon(databaseUrl) : null, output = console.log } = {}) {
  if (!source) throw new Error('Usage: node scripts/import-roster.mjs /absolute/path/to/roster.csv');
  if (!sql) throw new Error('DATABASE_URL is required to import a roster');
  const parsed = parseRosterCsv(await readFile(resolve(source), 'utf8'));
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
