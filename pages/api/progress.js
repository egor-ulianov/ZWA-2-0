import crypto from 'node:crypto';
import { requireTeacher } from '../../src/server/auth/guards.js';
import { createProgressRepository } from '../../src/server/repositories/progress.js';
import { createStudentsRepository } from '../../src/server/repositories/students.js';
import { validateUsername } from '../../src/server/repositories/validation.js';
import { requireSameOrigin } from '../../src/server/security/csrf.js';

function generatedCode() { return crypto.randomBytes(18).toString('base64url'); }

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) { res.setHeader('Allow', 'GET, POST'); return res.status(405).end(); }
  const teacher = await requireTeacher(req, res);
  if (!teacher) return undefined;
  if (req.method === 'POST' && !requireSameOrigin(req)) return res.status(403).json({ error: 'Forbidden' });
  try {
    const progress = createProgressRepository();
    if (req.method === 'GET') {
      const username = typeof req.query.username === 'string' ? req.query.username : null;
      return res.status(200).json(username ? { item: await progress.get(username) } : { items: await progress.list() });
    }
    const username = validateUsername(req.body?.username);
    const body = req.body || {};
    let accessCode = null;
    if (body.generate_access_code === true || typeof body.auth_code === 'string') {
      accessCode = body.generate_access_code === true ? generatedCode() : body.auth_code;
      await createStudentsRepository().setAccessCode({ username, code: accessCode, expiresAt: body.auth_code_expires_at || null });
    }
    const item = await progress.patch(username, body, teacher.subject);
    // The plaintext is deliberately returned only by this mutation, never by GET responses.
    return res.status(200).json({ ok: true, item, ...(accessCode ? { accessCode } : {}) });
  } catch (error) {
    if (error instanceof TypeError) return res.status(400).json({ error: 'Invalid request' });
    return res.status(500).json({ error: 'Unable to update progress' });
  }
}
