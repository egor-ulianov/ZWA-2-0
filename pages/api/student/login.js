import { createStudentsRepository, verifyAccessCode } from '../../../src/server/repositories/students.js';
import { validateUsername } from '../../../src/server/repositories/validation.js';
import { createSessionToken, serializeSessionCookie } from '../../../src/server/auth/session.js';
import { requireSameOrigin } from '../../../src/server/security/csrf.js';
import {
  consumeLoginRateLimits,
  getRequestClientAddress,
  RateLimitExceeded,
} from '../../../src/server/rate-limit.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).end(); }
  if (!requireSameOrigin(req)) return res.status(403).json({ error: 'Forbidden' });

  try {
    const clientAddress = getRequestClientAddress(req);
    await consumeLoginRateLimits({ kind: 'student', clientAddress });

    const username = validateUsername(req.body?.username);
    const code = req.body?.code;
    if (typeof code !== 'string' || code.length > 128) return res.status(400).json({ error: 'Invalid request' });

    await consumeLoginRateLimits({
      kind: 'student',
      clientAddress,
      account: username,
      includeIp: false,
    });

    const students = createStudentsRepository();
    const access = await students.getAccess(username);
    const blocked = !access || access.revoked_at || (access.expires_at && new Date(access.expires_at) <= new Date())
      || (access.locked_until && new Date(access.locked_until) > new Date());
    const matches = !blocked && await verifyAccessCode(code, access.auth_code_hash);
    if (!matches) {
      if (access) await students.recordFailedLogin(username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    await students.clearFailedLogins(username);
    const issuedAt = Math.floor(Date.now() / 1000); const maxAge = 30 * 24 * 60 * 60;
    const token = createSessionToken({ kind: 'student', subject: username, issuedAt, expiresAt: issuedAt + maxAge });
    res.setHeader('Set-Cookie', serializeSessionCookie('student', token, maxAge));
    return res.status(200).json({ ok: true });
  } catch (error) {
    if (error instanceof RateLimitExceeded) return res.status(429).json({ error: 'Too many login attempts' });
    if (error?.code === 'RATE_LIMIT_UNAVAILABLE' || error?.name === 'RateLimitUnavailable') {
      return res.status(503).json({ error: 'Login service unavailable' });
    }
    if (error instanceof TypeError) return res.status(400).json({ error: 'Invalid request' });
    return res.status(500).json({ error: 'Unable to sign in' });
  }
}
