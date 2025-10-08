import crypto from 'crypto';

function verify(token) {
  const secret = process.env.TEACHER_COOKIE_SECRET || 'dev-secret-teacher';
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
  const match = cookie.match(/(?:^|; )teacher_session=([^;]+)/);
  const token = match ? decodeURIComponent(match[1]) : '';
  const username = verify(token);
  if (!username) return res.status(401).json({ error: 'Unauthorized' });
  return res.status(200).json({ username });
}


