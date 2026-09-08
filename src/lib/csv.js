import { validateIsoDate, validateUsername } from '../server/repositories/validation.js';

export const MAX_CSV_INPUT_CHARACTERS = 1_000_000;
export const MAX_CSV_INPUT_BYTES = 2_000_000;

function escapeCell(value) {
  const cell = String(value ?? '');
  return /[",\r\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell;
}

function isLineBreak(character) {
  return character === '\r' || character === '\n';
}

export function isLikelyUsernameRecordStart(nextLine, { delimiter }) {
  try {
    const [candidate] = parseCsvRows(nextLine, { delimiter });
    if (!candidate || candidate.errors.length) return false;
    validateUsername(candidate.values[0]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse delimited text using RFC-4180 quoting rules.
 *
 * The parser retains row start lines and row-local errors so callers can
 * report malformed records without losing the valid records around them.
 */
export function parseCsvRows(input, { delimiter = ',', isLikelyRecordStart = () => false } = {}) {
  if (typeof input !== 'string') throw new TypeError('CSV input must be text');
  if (
    typeof delimiter !== 'string' ||
    delimiter.length !== 1 ||
    delimiter === '"' ||
    isLineBreak(delimiter)
  ) {
    throw new TypeError('CSV delimiter must be one non-quote character');
  }

  const text = input.replace(/^\uFEFF/, '');
  if (text.length > MAX_CSV_INPUT_CHARACTERS) {
    throw new RangeError(
      `CSV input exceeds the maximum size of ${MAX_CSV_INPUT_CHARACTERS} characters`,
    );
  }
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
    if (errors.length || values.some((value) => value !== '')) {
      rows.push({ line: rowLine, values, errors });
    }
    values = [];
    errors = [];
    rowLine = line;
  };

  const consumeLineBreak = (index) => {
    if (text[index] === '\r' && text[index + 1] === '\n') return index + 1;
    return index;
  };

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (inQuotes) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        inQuotes = false;
        afterClosingQuote = true;
      } else if (isLineBreak(character)) {
        const lineBreakEnd = consumeLineBreak(index);
        const nextLineStart = lineBreakEnd + 1;
        const nextCarriageReturn = text.indexOf('\r', nextLineStart);
        const nextLineFeed = text.indexOf('\n', nextLineStart);
        const nextLineEnd = [nextCarriageReturn, nextLineFeed]
          .filter((position) => position >= 0)
          .reduce((first, position) => Math.min(first, position), text.length);
        const nextLine = text.slice(nextLineStart, nextLineEnd);
        const looksLikeNextRecord = isLikelyRecordStart(nextLine, {
          delimiter,
          line: line + 1,
          rowLine,
        });

        if (looksLikeNextRecord) {
          errors.push(`Unterminated quoted field starting at line ${rowLine}`);
          inQuotes = false;
          index = lineBreakEnd;
          line += 1;
          finishRow();
        } else if (character === '\r' && text[index + 1] === '\n') {
          field += '\r\n';
          index += 1;
        } else {
          field += character;
        }
        if (!looksLikeNextRecord) line += 1;
      } else {
        field += character;
      }
      continue;
    }

    if (afterClosingQuote) {
      if (character === delimiter) {
        finishField();
      } else if (isLineBreak(character)) {
        index = consumeLineBreak(index);
        line += 1;
        finishRow();
      } else {
        errors.push(`Unexpected character after closing quote at line ${line}`);
        field += character;
        afterClosingQuote = false;
      }
      continue;
    }

    if (character === '"') {
      if (field === '') inQuotes = true;
      else {
        errors.push(`Unexpected quote in unquoted field at line ${line}`);
        field += character;
      }
    } else if (character === delimiter) {
      finishField();
    } else if (isLineBreak(character)) {
      index = consumeLineBreak(index);
      line += 1;
      finishRow();
    } else {
      field += character;
    }
  }

  if (inQuotes) errors.push(`Unterminated quoted field starting at line ${rowLine}`);
  if (field !== '' || values.length || errors.length) finishRow();
  return rows;
}

export function serializeAttendanceCsv(rows) {
  const extras = [
    ...new Set(
      rows.flatMap((row) =>
        Object.keys(row).filter((key) => !['username', 'present', 'date'].includes(key)),
      ),
    ),
  ];
  const headers = ['username', 'present', 'date', ...extras];
  const lines = [
    headers,
    ...rows.map((row) =>
      headers.map((header) => (header === 'present' ? (row.present ? '1' : '0') : row[header])),
    ),
  ];
  return `${lines.map((row) => row.map(escapeCell).join(',')).join('\r\n')}\r\n`;
}

function presentValue(value) {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase();
  if (normalized === '1' || normalized === 'true') return true;
  if (normalized === '0' || normalized === 'false') return false;
  return null;
}

function normalizedKnownUsernames(knownUsernames) {
  if (!knownUsernames) return null;
  return new Set([...knownUsernames].map((username) => String(username).trim().toLowerCase()));
}

function rowUsername(row, usernameIndex) {
  return String(row.values[usernameIndex] ?? '')
    .trim()
    .toLowerCase();
}

export function parseAttendanceCsv(text, { knownUsernames } = {}) {
  const rows = parseCsvRows(String(text ?? ''), {
    isLikelyRecordStart: isLikelyUsernameRecordStart,
  });
  if (rows.length < 2) {
    throw new TypeError('CSV must include a header and at least one attendance row');
  }

  const [headerRow, ...records] = rows;
  if (headerRow.errors.length) {
    throw new TypeError(`Malformed header row: ${headerRow.errors.join('; ')}`);
  }

  const headers = headerRow.values.map((header) => header.trim().toLowerCase());
  const requiredColumns = ['username', 'present', 'date'];
  const missingColumns = requiredColumns.filter((column) => !headers.includes(column));
  if (missingColumns.length) {
    throw new TypeError(`Missing column: ${missingColumns.join(', ')}`);
  }

  const duplicateColumns = headers.filter(
    (header, index) => header && headers.indexOf(header) !== index,
  );
  if (duplicateColumns.length) {
    throw new TypeError(`Duplicate column: ${[...new Set(duplicateColumns)].join(', ')}`);
  }

  const usernameIndex = headers.indexOf('username');
  const presentIndex = headers.indexOf('present');
  const dateIndex = headers.indexOf('date');
  const entries = [];
  const rejected = [];
  const seenUsernames = new Set();
  const known = normalizedKnownUsernames(knownUsernames);
  let date = '';

  records.forEach((row) => {
    const username = rowUsername(row, usernameIndex);
    const reject = (reason) => rejected.push({ row: row.line, username, reason });

    if (row.errors.length) {
      reject(row.errors.join('; '));
      return;
    }
    if (row.values.length !== headers.length) {
      reject(`Expected ${headers.length} columns, got ${row.values.length}`);
      return;
    }
    if (!username) {
      reject('Username is required');
      return;
    }

    try {
      validateUsername(username);
    } catch {
      reject('Username is invalid');
      return;
    }
    if (seenUsernames.has(username)) {
      reject('Duplicate username');
      return;
    }
    seenUsernames.add(username);

    const present = presentValue(row.values[presentIndex]);
    const rowDate = String(row.values[dateIndex] ?? '').trim();
    if (present === null) {
      reject('Present must be 1, 0, true, or false');
    } else if (known && !known.has(username)) {
      reject('Unknown username');
    } else {
      try {
        validateIsoDate(rowDate);
      } catch {
        reject('Date must be a real YYYY-MM-DD date');
        return;
      }
      if (date && rowDate !== date) {
        reject('All rows must use the same date');
      } else {
        date ||= rowDate;
        entries.push({ username, present });
      }
    }
  });
  return { date, entries, rejected };
}
