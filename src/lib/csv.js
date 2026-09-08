function escapeCell(value) {
  const cell = String(value ?? '');
  return /[",\r\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell;
}

function parseRows(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') { cell += '"'; index += 1; }
      else if (character === '"') quoted = false;
      else cell += character;
    } else if (character === '"' && cell === '') quoted = true;
    else if (character === ',') { row.push(cell); cell = ''; }
    else if (character === '\n' || character === '\r') {
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else cell += character;
  }
  if (quoted) throw new TypeError('CSV contains an unclosed quoted value');
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

function presentValue(value) {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (normalized === '1' || normalized === 'true') return true;
  if (normalized === '0' || normalized === 'false') return false;
  return null;
}

export function serializeAttendanceCsv(rows) {
  const extras = [...new Set(rows.flatMap((row) => Object.keys(row).filter((key) => !['username', 'present', 'date'].includes(key))))];
  const headers = ['username', 'present', 'date', ...extras];
  const lines = [headers, ...rows.map((row) => headers.map((header) => header === 'present' ? (row.present ? '1' : '0') : row[header]))];
  return `${lines.map((row) => row.map(escapeCell).join(',')).join('\r\n')}\r\n`;
}

export function parseAttendanceCsv(text, { knownUsernames } = {}) {
  const rows = parseRows(String(text || '').replace(/^\uFEFF/, '')).filter((row) => row.some((value) => value !== ''));
  if (rows.length < 2) throw new TypeError('CSV must include a header and at least one attendance row');
  const headers = rows[0].map((header) => header.trim());
  const usernameIndex = headers.indexOf('username');
  const presentIndex = headers.indexOf('present');
  const dateIndex = headers.indexOf('date');
  if (usernameIndex < 0 || presentIndex < 0 || dateIndex < 0) throw new TypeError('CSV must include username, present, and date columns');

  const entries = [];
  const rejected = [];
  let date = '';
  rows.slice(1).forEach((row, offset) => {
    const rowNumber = offset + 2;
    const username = String(row[usernameIndex] || '').trim().toLowerCase();
    const present = presentValue(row[presentIndex]);
    const rowDate = String(row[dateIndex] || '').trim();
    if (!username) rejected.push({ row: rowNumber, username: '', reason: 'Username is required' });
    else if (present === null) rejected.push({ row: rowNumber, username, reason: 'Present must be 1, 0, true, or false' });
    else if (knownUsernames && !knownUsernames.has(username)) rejected.push({ row: rowNumber, username, reason: 'Unknown username' });
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(rowDate)) rejected.push({ row: rowNumber, username, reason: 'Date must be YYYY-MM-DD' });
    else if (date && rowDate !== date) rejected.push({ row: rowNumber, username, reason: 'All rows must use the same date' });
    else { date ||= rowDate; entries.push({ username, present }); }
  });
  return { date, entries, rejected };
}
