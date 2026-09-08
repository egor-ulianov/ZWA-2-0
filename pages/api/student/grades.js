import { requireStudent } from '../../../src/server/auth/guards.js';
import { createGradesRepository } from '../../../src/server/repositories/grades.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).end(); }
  const session = await requireStudent(req, res);
  if (!session) return undefined;
  try {
    const rows = await createGradesRepository().getLatestPublished(session.subject);
    return res.status(200).json({ username: session.subject, grades: Object.fromEntries(rows.map((grade) => [grade.test_number, grade])) });
  } catch { return res.status(500).json({ error: 'Unable to load grades' }); }
}
