import { requireTeacher } from '../../src/server/auth/guards.js';
import { parseTeacherRosterCsv } from '../../src/lib/csv.js';
import { createStudentsRepository } from '../../src/server/repositories/students.js';
import { requireSameOrigin } from '../../src/server/security/csrf.js';

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).end();
  }
  const teacher = await requireTeacher(req, res);
  if (!teacher) return undefined;
  if (req.method === 'POST' && !requireSameOrigin(req)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const repository = createStudentsRepository();
    if (req.method === 'GET') {
      const students = await repository.list();
      return res.status(200).json({ count: students.length, students });
    }
    if (typeof req.body?.csv !== 'string') {
      return res.status(400).json({ error: 'Roster CSV is required' });
    }
    const parsed = parseTeacherRosterCsv(req.body.csv);
    const errors = parsed.diagnostics.filter(({ severity }) => severity === 'error');
    if (errors.length) {
      return res.status(400).json({ error: 'Invalid roster CSV', diagnostics: errors.slice(0, 50) });
    }
    const result = await repository.replaceRoster(parsed.students);
    return res.status(200).json({ ok: true, count: result.imported, students: result.students });
  } catch (error) {
    if (error instanceof TypeError) return res.status(400).json({ error: error.message });
    return res.status(500).json({ error: 'Unable to process students' });
  }
}
