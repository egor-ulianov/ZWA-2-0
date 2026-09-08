import { clearSessionCookie } from '../../../src/server/auth/session.js';
import { requireStudent, revokeSession } from '../../../src/server/auth/guards.js';
import { requireSameOrigin } from '../../../src/server/security/csrf.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).end(); }
  if (!requireSameOrigin(req)) return res.status(403).json({ error: 'Forbidden' });
  const session = await requireStudent(req, { status: () => ({ json: () => undefined }) });
  if (session) await revokeSession(session);
  res.setHeader('Set-Cookie', clearSessionCookie('student'));
  return res.status(200).json({ ok: true });
}
