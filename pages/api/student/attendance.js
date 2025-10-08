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
    const rows = await sql(`select date, present from attendance where username = $1`, [username]);
    const byDate = {};
    for (const r of rows) byDate[r.date] = !!r.present;
    return res.status(200).json({ username, attendance: byDate });
  } catch (e) {
    return res.status(500).json({ error: 'Failed', details: String(e) });
  }
}


