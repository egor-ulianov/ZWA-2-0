import crypto from 'node:crypto';
import { getServerEnv } from '../../../src/server/env.js';
import { createSessionToken, serializeSessionCookie } from '../../../src/server/auth/session.js';
import { requireSameOrigin } from '../../../src/server/security/csrf.js';

function equal(left, right) {
  const a = Buffer.from(String(left)); const b = Buffer.from(String(right));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).end(); }
  if (!requireSameOrigin(req)) return res.status(403).json({ error: 'Forbidden' });
  const { username, password } = req.body || {};
  if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) return res.status(400).json({ error: 'Invalid request' });
  const env = getServerEnv();
  if (!equal(username, env.attendanceAuthUser) || !equal(password, env.attendanceAuthPass)) return res.status(401).json({ error: 'Invalid credentials' });
  const issuedAt = Math.floor(Date.now() / 1000); const maxAge = 8 * 60 * 60;
  const token = createSessionToken({ kind: 'teacher', subject: env.attendanceAuthUser, issuedAt, expiresAt: issuedAt + maxAge });
  res.setHeader('Set-Cookie', serializeSessionCookie('teacher', token, maxAge));
  return res.status(200).json({ ok: true });
}
