import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function ensureSchema() {
  // Create with new schema (id as PK) if missing
  await sql(`
    create table if not exists attendance (
      id bigserial primary key,
      date text not null,
      username text not null,
      present boolean not null
    );
  `);
  // Add id column if upgrading from old schema
  await sql(`alter table attendance add column if not exists id bigserial;`);
  // Backfill missing ids
  await sql(`update attendance set id = nextval('attendance_id_seq') where id is null;`).catch(() => {});
  // Drop old PK if present and set new PK on id
  await sql(`alter table attendance drop constraint attendance_pkey`).catch(() => {});
  await sql(`alter table attendance add primary key (id)`).catch(() => {});
  // Ensure uniqueness of (date, username) via index (idempotent)
  await sql(`create unique index if not exists attendance_date_username_idx on attendance (date, username);`);
}

export default async function handler(req, res) {
  try {
    await ensureSchema();
  } catch (e) {
    return res.status(500).json({ error: 'DB schema init failed', details: String(e) });
  }

  if (req.method === 'GET') {
    const date = typeof req.query.date === 'string' ? req.query.date : '';
    try {
      if (!date) {
        const rows = await sql(`select date, username, present from attendance`);
        const overview = {};
        for (const r of rows) {
          if (!overview[r.date]) overview[r.date] = {};
          overview[r.date][r.username] = !!r.present;
        }
        return res.status(200).json({ overview });
      }
      const rows = await sql(`select username, present from attendance where date = $1`, [date]);
      const map = {};
      for (const r of rows) map[r.username] = !!r.present;
      return res.status(200).json({ date, map });
    } catch (e) {
      return res.status(500).json({ error: 'DB read failed', details: String(e) });
    }
  }

  if (req.method === 'POST') {
    try {
      const { date, map } = req.body || {};
      if (!date || typeof map !== 'object' || map === null) {
        return res.status(400).json({ error: 'Invalid payload' });
      }
      const entries = Object.entries(map);
      if (entries.length === 0) return res.status(200).json({ ok: true });
      const values = entries.map(([username, present]) => [date, username, !!present]);
      // Upsert row-per-student for given date using unique(date, username)
      for (const [d, u, p] of values) {
        await sql(`
          insert into attendance (date, username, present)
          values ($1, $2, $3)
          on conflict (date, username) do update set present = excluded.present
        `, [d, u, p]);
      }
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: 'DB write failed', details: String(e) });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).end('Method Not Allowed');
}


