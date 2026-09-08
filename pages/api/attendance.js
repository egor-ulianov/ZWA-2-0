import { requireTeacher } from '../../src/server/auth/guards.js';
import { createAttendanceRepository } from '../../src/server/repositories/attendance.js';
import { requireSameOrigin } from '../../src/server/security/csrf.js';

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) { res.setHeader('Allow', 'GET, POST'); return res.status(405).end(); }
  const teacher = await requireTeacher(req, res);
  if (!teacher) return undefined;
  if (req.method === 'POST' && !requireSameOrigin(req)) return res.status(403).json({ error: 'Forbidden' });
  try {
    const attendance = createAttendanceRepository();
    if (req.method === 'GET') {
      const date = typeof req.query.date === 'string' ? req.query.date : null;
      if (!date) return res.status(200).json({ overview: await attendance.getOverview() });
      return res.status(200).json({ date, map: await attendance.getByDate(date) });
    }
    const date = req.body?.date;
    const map = req.body?.map;
    if (typeof date !== 'string' || !map || typeof map !== 'object' || Array.isArray(map)) return res.status(400).json({ error: 'Invalid request' });
    const entries = Object.entries(map).map(([username, present]) => ({ username, present }));
    const result = await attendance.bulkUpsert({ attendanceDate: date, entries, actor: teacher.subject });
    return res.status(200).json({ ok: true, count: result.count });
  } catch (error) {
    if (error instanceof TypeError) return res.status(400).json({ error: 'Invalid request' });
    return res.status(500).json({ error: 'Unable to process attendance' });
  }
}
