import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';

const sql = neon(process.env.DATABASE_URL);

function verify(token) {
  const secret = process.env.STUDENT_COOKIE_SECRET || 'dev-secret';
  if (!token) return null;
  const idx = token.lastIndexOf('.');
  if (idx <= 0) return null;
  const value = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const h = crypto.createHmac('sha256', secret).update(value).digest('hex');
  if (h !== sig) return null;
  return value; // username
}

export default async function handler(req, res) {
  const cookie = req.headers.cookie || '';
  const match = cookie.match(/(?:^|; )student_session=([^;]+)/);
  const token = match ? decodeURIComponent(match[1]) : '';
  const username = verify(token);
  if (!username) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const rows = await sql(`
      select distinct on (test_number)
        username, test_number, points, reasoning, teacher_comment, images_count, graded_at
      from test_grades
      where username = $1
      order by test_number, graded_at desc
    `, [username]);
    const byTest = {};
    for (const r of rows) byTest[r.test_number] = r;
    return res.status(200).json({ username, grades: byTest });
  } catch (e) {
    return res.status(500).json({ error: 'Failed', details: String(e) });
  }
}


