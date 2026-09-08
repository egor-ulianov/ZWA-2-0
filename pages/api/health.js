import { neon } from '@neondatabase/serverless';

const productionRequiredVariables = [
  'ATTENDANCE_AUTH_USER',
  'ATTENDANCE_AUTH_PASS',
  'TEACHER_COOKIE_SECRET',
  'STUDENT_COOKIE_SECRET',
  'APP_ORIGIN',
];

function hasValidDatabaseUrl(value) {
  if (!value) return false;

  try {
    const url = new URL(value);
    return url.protocol === 'postgres:' || url.protocol === 'postgresql:';
  } catch {
    return false;
  }
}

function hasValidConfiguration() {
  if (!hasValidDatabaseUrl(process.env.DATABASE_URL)) return false;

  return process.env.NODE_ENV !== 'production'
    || productionRequiredVariables.every((name) => Boolean(process.env[name]));
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!hasValidConfiguration()) {
    return res.status(503).json({ ok: false });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    await sql('select 1');
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(503).json({ ok: false });
  }
}
