import { getDb } from '../db.js';
import { cookieName, verifySessionToken } from './session.js';

function readCookie(req, name) {
  const cookies = String(req.headers?.cookie || '').split(';');
  for (const part of cookies) {
    const [key, ...value] = part.trim().split('=');
    if (key === name) {
      try { return decodeURIComponent(value.join('=')); } catch { return ''; }
    }
  }
  return '';
}

async function isRevoked(session) {
  const rows = await getDb()('select 1 from revoked_sessions where session_id = $1 and expires_at > now()', [session.sessionId]);
  return rows.length > 0;
}

async function requireKind(req, res, kind) {
  const token = readCookie(req, cookieName(kind));
  const session = verifySessionToken(token, kind);
  if (!session || await isRevoked(session)) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  return session;
}

export function requireTeacher(req, res) { return requireKind(req, res, 'teacher'); }
export function requireStudent(req, res) { return requireKind(req, res, 'student'); }

export async function revokeSession(session) {
  if (!session) return;
  await getDb()(
    `insert into revoked_sessions (session_id, expires_at) values ($1, to_timestamp($2))
     on conflict (session_id) do nothing`,
    [session.sessionId, session.expiresAt],
  );
}
