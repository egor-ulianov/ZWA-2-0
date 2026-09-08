import { requireStudent } from '../../../src/server/auth/guards.js';
import { createProgressRepository } from '../../../src/server/repositories/progress.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).end(); }
  const session = await requireStudent(req, res);
  if (!session) return undefined;
  try { return res.status(200).json({ username: session.subject, progress: await createProgressRepository().get(session.subject) }); }
  catch { return res.status(500).json({ error: 'Unable to load progress' }); }
}
