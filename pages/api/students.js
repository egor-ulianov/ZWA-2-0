import { requireTeacher } from '../../src/server/auth/guards.js';
import { createStudentsRepository } from '../../src/server/repositories/students.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).end(); }
  const teacher = await requireTeacher(req, res);
  if (!teacher) return undefined;
  try {
    const students = await createStudentsRepository().list();
    return res.status(200).json({ count: students.length, students });
  } catch { return res.status(500).json({ error: 'Unable to load students' }); }
}
