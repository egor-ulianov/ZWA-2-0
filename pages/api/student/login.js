import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';

const sql = neon(process.env.DATABASE_URL);

function sign(value) {
  const secret = process.env.STUDENT_COOKIE_SECRET || 'dev-secret';
  const h = crypto.createHmac('sha256', secret).update(value).digest('hex');
  return `${value}.${h}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }
  try {
    const { username, code } = req.body || {};
    if (!username || !code) return res.status(400).json({ error: 'username and code required' });
    const rows = await sql(`select auth_code from progress where username = $1`, [username]);
    if (!rows.length || !rows[0].auth_code || rows[0].auth_code !== code) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = sign(username);
    res.setHeader('Set-Cookie', `student_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`);
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'Login failed', details: String(e) });
  }
}


