import crypto from 'crypto';

function sign(value) {
  const secret = process.env.TEACHER_COOKIE_SECRET || 'dev-secret-teacher';
  const h = crypto.createHmac('sha256', secret).update(value).digest('hex');
  return `${value}.${h}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }
  const { username, password } = req.body || {};
  const u = process.env.ATTENDANCE_AUTH_USER || '';
  const p = process.env.ATTENDANCE_AUTH_PASS || '';
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  if (username !== u || password !== p) return res.status(401).json({ error: 'Invalid credentials' });
  const token = sign(username);
  res.setHeader('Set-Cookie', `teacher_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`);
  return res.status(200).json({ ok: true });
}


