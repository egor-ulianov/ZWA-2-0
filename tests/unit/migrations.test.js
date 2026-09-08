import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const migrationsDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../db/migrations');

test('ships an idempotent migration that removes the legacy plaintext auth_code column', async () => {
  const files = await readdir(migrationsDirectory);
  const runnableMigrations = files.filter((file) => /^\d+_.+\.sql$/.test(file)).sort();
  assert.ok(runnableMigrations.includes('003_retire_legacy_progress_auth_code.sql'));
  const source = await readFile(path.join(migrationsDirectory, '003_retire_legacy_progress_auth_code.sql'), 'utf8');
  assert.match(source, /alter\s+table\s+if\s+exists\s+progress\s+drop\s+column\s+if\s+exists\s+auth_code\s*;/i);
});
