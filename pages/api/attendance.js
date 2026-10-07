import { requireTeacher } from '../../src/server/auth/guards.js';
import { AttendanceConflictError, createAttendanceRepository } from '../../src/server/repositories/attendance.js';
import {
  parseAttendanceRevision,
  validateLectureNumber,
} from '../../src/server/repositories/validation.js';
import { requireSameOrigin } from '../../src/server/security/csrf.js';

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) { res.setHeader('Allow', 'GET, POST'); return res.status(405).end(); }
  const teacher = await requireTeacher(req, res);
  if (!teacher) return undefined;
  if (req.method === 'POST' && !requireSameOrigin(req)) return res.status(403).json({ error: 'Forbidden' });
  try {
    const attendance = createAttendanceRepository();
    if (req.method === 'GET') {
      if (req.query.lecture === undefined) {
        return res.status(200).json(await attendance.getOverviewWithRevisions());
      }
      const lecture = validateLectureNumber(req.query.lecture);
      const current = await attendance.getByLectureWithRevision(lecture);
      res.setHeader('ETag', `"${current.revision}"`);
      return res.status(200).json({ lecture, map: current.map, revision: current.revision });
    }
    const lecture = validateLectureNumber(req.body?.lecture);
    const map = req.body?.map;
    if (!map || typeof map !== 'object' || Array.isArray(map)) return res.status(400).json({ error: 'Invalid request' });
    const entries = Object.entries(map).map(([username, present]) => ({ username, present }));
    const headerRevision = parseAttendanceRevision(req.headers?.['if-match']);
    const bodyRevision = parseAttendanceRevision(req.body?.revision);
    if (headerRevision !== null && bodyRevision !== null && headerRevision !== bodyRevision) {
      return res.status(400).json({ error: 'Conflicting attendance revisions' });
    }
    const expectedRevision = headerRevision ?? bodyRevision;
    if (expectedRevision === null) return res.status(428).json({ error: 'Attendance revision required' });
    const result = await attendance.bulkUpsert({ lecture, entries, actor: teacher.subject, expectedRevision });
    res.setHeader('ETag', `"${result.revision}"`);
    return res.status(200).json({ ok: true, count: result.count, revision: result.revision });
  } catch (error) {
    if (error instanceof AttendanceConflictError) return res.status(409).json({ error: 'Attendance changed; reload and retry' });
    if (error instanceof TypeError) return res.status(400).json({ error: 'Invalid request' });
    return res.status(500).json({ error: 'Unable to process attendance' });
  }
}
