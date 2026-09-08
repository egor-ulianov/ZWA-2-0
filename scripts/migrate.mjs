import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';

const directory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../db/migrations');
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required to run migrations');
const sql = neon(databaseUrl);

await sql(`create table if not exists schema_migrations (
  filename text primary key,
  applied_at timestamptz not null default now()
)`);

const files = (await readdir(directory)).filter((file) => /^\d+_.+\.sql$/.test(file)).sort();
for (const filename of files) {
  const applied = await sql('select 1 from schema_migrations where filename = $1', [filename]);
  if (applied.length) continue;
  const migration = await readFile(path.join(directory, filename), 'utf8');
  await sql.transaction([
    sql(migration),
    sql('insert into schema_migrations (filename) values ($1)', [filename]),
  ]);
  process.stdout.write(`Applied ${filename}\n`);
}
