import crypto from 'node:crypto';
import { clearSessionCookie } from '../../../src/server/auth/session.js';
import { getAuthenticatedSession, revokeSession } from '../../../src/server/auth/guards.js';
import { requireSameOrigin } from '../../../src/server/security/csrf.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).end(); }
  if (!requireSameOrigin(req)) return res.status(403).json({ error: 'Forbidden' });
  const correlationId = crypto.randomUUID();
  res.setHeader('Set-Cookie', clearSessionCookie('student'));
  try {
    const session = await getAuthenticatedSession(req, 'student');
    if (session) await revokeSession(session);
  } catch (error) {
    console.error('student logout revocation failed', { correlationId, cause: error?.name || 'unknown' });
  }
  return res.status(200).json({ ok: true });
}
