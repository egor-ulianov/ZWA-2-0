import { requireTeacher } from '../../../src/server/auth/guards.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).end(); }
  const session = await requireTeacher(req, res);
  if (!session) return undefined;
  return res.status(200).json({ username: session.subject });
}
