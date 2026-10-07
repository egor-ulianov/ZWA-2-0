import crypto from 'node:crypto';
import { getDb } from '../db.js';
import {
  normalizeRosterRows,
  normalizeTeacherRosterRows,
  validateUsername,
} from './validation.js';

const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1, maxmem: 32 * 1024 * 1024 };
const ROSTER_REPLACEMENT_LOCK_KEY = 4_321_987_655;

function scrypt(code, salt) {
  return new Promise((resolve, reject) => crypto.scrypt(code, salt, 64, SCRYPT_OPTIONS, (error, key) => error ? reject(error) : resolve(key)));
}

export async function hashAccessCode(code) {
  if (typeof code !== 'string' || code.length < 8 || code.length > 128) throw new TypeError('Access code must be 8 to 128 characters');
  const salt = crypto.randomBytes(16);
  const key = await scrypt(code, salt);
  return `scrypt$${salt.toString('base64url')}$${key.toString('base64url')}`;
}

export async function verifyAccessCode(code, encoded) {
  if (typeof code !== 'string' || typeof encoded !== 'string') return false;
  const [algorithm, saltText, keyText, extra] = encoded.split('$');
  if (algorithm !== 'scrypt' || !saltText || !keyText || extra) return false;
  let salt; let expected;
  try { salt = Buffer.from(saltText, 'base64url'); expected = Buffer.from(keyText, 'base64url'); } catch { return false; }
  if (!salt.length || expected.length !== 64) return false;
  const actual = await scrypt(code, salt);
  return crypto.timingSafeEqual(actual, expected);
}

export function createStudentsRepository(sql = getDb()) {
  return {
    async list() {
      return sql(
        `select username, first_name as "firstName", last_name as "lastName", parallel
         from students where active = true
         order by last_name, first_name, username`,
      );
    },
    async importRoster(rows) {
      const normalized = normalizeRosterRows(rows);
      if (!normalized.length) return { imported: 0 };
      await sql.transaction(normalized.map(({ username }) => sql(
        `insert into students (username) values ($1)
         on conflict (username) do update set active = true, updated_at = now()`,
        [username],
      )));
      return { imported: normalized.length };
    },
    async replaceRoster(rows) {
      const normalized = normalizeTeacherRosterRows(rows);
      await sql.transaction([
        sql('select pg_advisory_xact_lock($1)', [ROSTER_REPLACEMENT_LOCK_KEY]),
        sql('update students set active = false, updated_at = now() where active = true'),
        ...normalized.map(({ username, firstName, lastName, parallel }) =>
          sql(
            `insert into students (username, first_name, last_name, parallel, active)
             values ($1, $2, $3, $4, true)
             on conflict (username) do update
               set first_name = excluded.first_name,
                   last_name = excluded.last_name,
                   parallel = excluded.parallel,
                   active = true,
                   updated_at = now()`,
            [username, firstName, lastName, parallel],
          ),
        ),
      ]);
      return { imported: normalized.length, students: normalized };
    },
    async getAccess(username) {
      const rows = await sql(
        `select auth_code_hash, expires_at, revoked_at, failed_attempts, locked_until
         from student_access where username = $1`, [validateUsername(username)],
      );
      return rows[0] || null;
    },
    async setAccessCode({ username, code, expiresAt = null }) {
      const normalized = validateUsername(username);
      const hash = await hashAccessCode(code);
      await sql(
        `insert into student_access (username, auth_code_hash, expires_at, revoked_at, failed_attempts, locked_until)
         values ($1, $2, $3, null, 0, null)
         on conflict (username) do update set auth_code_hash = excluded.auth_code_hash, expires_at = excluded.expires_at,
           revoked_at = null, failed_attempts = 0, locked_until = null, updated_at = now()`,
        [normalized, hash, expiresAt],
      );
    },
    async recordFailedLogin(username) {
      await sql(
        `update student_access set failed_attempts = failed_attempts + 1,
           locked_until = case when failed_attempts + 1 >= 5 then now() + interval '15 minutes' else locked_until end,
           updated_at = now() where username = $1`, [validateUsername(username)],
      );
    },
    async clearFailedLogins(username) {
      await sql('update student_access set failed_attempts = 0, locked_until = null, updated_at = now() where username = $1', [validateUsername(username)]);
    },
  };
}
