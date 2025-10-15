import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function ensureSchema() {
  await sql(`
    create table if not exists progress (
      id bigserial primary key,
      username text not null,
      test1 int,
      test2 int,
      test3 int,
      test4 int,
      assignment_task_checked boolean,
      assignment_midterm_ok boolean,
      assignment_topic text,
      assignment_partner text,
      assignment_final_points int,
      auth_code text,
      unique (username)
    );
  `);
  // Upgrade path: add auth_code if missing
  await sql(`alter table progress add column if not exists auth_code text;`);
  await sql(`alter table progress add column if not exists assignment_topic text;`);
}

export default async function handler(req, res) {
  try {
    await ensureSchema();
  } catch (e) {
    return res.status(500).json({ error: 'DB schema init failed', details: String(e) });
  }

  if (req.method === 'GET') {
    const username = typeof req.query.username === 'string' ? req.query.username : '';
    try {
      if (!username) {
        const rows = await sql(`select username, test1, test2, test3, test4, assignment_task_checked, assignment_midterm_ok, assignment_topic, assignment_partner, assignment_final_points, auth_code from progress`);
        return res.status(200).json({ items: rows });
      }
      const rows = await sql(`select username, test1, test2, test3, test4, assignment_task_checked, assignment_midterm_ok, assignment_topic, assignment_partner, assignment_final_points, auth_code from progress where username = $1`, [username]);
      return res.status(200).json({ item: rows[0] || null });
    } catch (e) {
      return res.status(500).json({ error: 'DB read failed', details: String(e) });
    }
  }

  if (req.method === 'POST') {
    try {
      const body = req.body || {};
      const { username } = body;
      if (!username) return res.status(400).json({ error: 'username required' });

      const fields = {
        test1: body.test1 ?? null,
        test2: body.test2 ?? null,
        test3: body.test3 ?? null,
        test4: body.test4 ?? null,
        assignment_task_checked: body.assignment_task_checked ?? null,
        assignment_midterm_ok: body.assignment_midterm_ok ?? null,
        assignment_topic: body.assignment_topic ?? null,
        assignment_partner: body.assignment_partner ?? null,
        assignment_final_points: body.assignment_final_points ?? null,
        auth_code: body.auth_code ?? null
      };

      await sql(`
        insert into progress (username, test1, test2, test3, test4, assignment_task_checked, assignment_midterm_ok, assignment_topic, assignment_partner, assignment_final_points, auth_code)
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        on conflict (username) do update set
          test1 = excluded.test1,
          test2 = excluded.test2,
          test3 = excluded.test3,
          test4 = excluded.test4,
          assignment_task_checked = excluded.assignment_task_checked,
          assignment_midterm_ok = excluded.assignment_midterm_ok,
          assignment_topic = excluded.assignment_topic,
          assignment_partner = excluded.assignment_partner,
          assignment_final_points = excluded.assignment_final_points,
          auth_code = excluded.auth_code
      `, [
        username,
        fields.test1,
        fields.test2,
        fields.test3,
        fields.test4,
        fields.assignment_task_checked,
        fields.assignment_midterm_ok,
        fields.assignment_topic,
        fields.assignment_partner,
        fields.assignment_final_points,
        fields.auth_code
      ]);

      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: 'DB write failed', details: String(e) });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).end('Method Not Allowed');
}


