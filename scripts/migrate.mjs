import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';

const defaultDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../db/migrations');
const LOCK_KEY = 4_321_987_654;
const MIGRATION_FILE = /^\d+_.+\.sql$/;

function checksum(source) {
  return createHash('sha256').update(source).digest('hex');
}

function sqlLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function uniqueDollarTag(prefix, source) {
  let tag = prefix;
  let suffix = 0;
  while (source.includes(`$${tag}$`)) tag = `${prefix}_${++suffix}`;
  return tag;
}

function migrationQuery(filename, sourceOrDigest, maybeDigest) {
  const digest = maybeDigest ?? sourceOrDigest;
  const source = maybeDigest === undefined ? null : String(sourceOrDigest);
  const guardTag = uniqueDollarTag(`migration_checksum_guard_${digest}`, source ?? '');
  const sourceTag = source === null ? null : uniqueDollarTag(`migration_source_${digest}`, source);
  const sourceBlock = source === null
    ? '    return;'
    : `    execute $${sourceTag}$${source}$${sourceTag}$;
    insert into schema_migrations (filename, checksum)
      values (${sqlLiteral(filename)}, ${sqlLiteral(digest)});`;

  return `do $${guardTag}$
declare
  existing_checksum text;
begin
  select checksum into existing_checksum
  from schema_migrations where filename = ${sqlLiteral(filename)};
  if existing_checksum is not null and existing_checksum <> ${sqlLiteral(digest)} then
    raise exception 'Migration checksum changed for %', ${sqlLiteral(filename)};
  end if;
  if exists (select 1 from schema_migrations where filename = ${sqlLiteral(filename)}) then
    update schema_migrations
      set checksum = coalesce(checksum, ${sqlLiteral(digest)})
      where filename = ${sqlLiteral(filename)};
    return;
  end if;
${sourceBlock}
end
$${guardTag}$;`;
}

export async function getMigrationFiles(directory = defaultDirectory) {
  return (await readdir(directory)).filter((file) => MIGRATION_FILE.test(file)).sort();
}

export async function runMigrations({
  sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null,
  directory = defaultDirectory,
  lockKey = LOCK_KEY,
  output = (message) => process.stdout.write(`${message}\n`),
} = {}) {
  if (!sql) throw new Error('DATABASE_URL is required to run migrations');
  const files = await getMigrationFiles(directory);
  for (const filename of files) {
    const source = await readFile(path.join(directory, filename), 'utf8');
    const digest = checksum(source);
    await sql.transaction([
      sql('select pg_advisory_xact_lock($1)', [lockKey]),
      sql(`create table if not exists schema_migrations (
        filename text primary key,
        checksum text,
        applied_at timestamptz not null default now()
      )`),
      sql('alter table schema_migrations add column if not exists checksum text'),
      sql(migrationQuery(filename, source, digest)),
    ]);
    output(`Processed ${filename}`);
  }
}

export { LOCK_KEY, checksum, migrationQuery };

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runMigrations().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
