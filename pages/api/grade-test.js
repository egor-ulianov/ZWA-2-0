import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function ensureSchema() {
  await sql(`
    create table if not exists test_grades (
      id bigserial primary key,
      username text not null,
      test_number int not null,
      points int not null,
      reasoning text not null,
      images_count int default 0,
      graded_at timestamptz default now()
    );
  `);
}

function clampPoints(value, maxPoints) {
  const v = Number.isFinite(value) ? Math.round(value) : 0;
  if (v < 0) return 0;
  if (v > maxPoints) return maxPoints;
  return v;
}

function getTestColumnName(testNumber) {
  const n = Number(testNumber);
  if (n === 1) return 'test1';
  if (n === 2) return 'test2';
  if (n === 3) return 'test3';
  if (n === 4) return 'test4';
  return null;
}

async function callOpenAIVision({ images, maxPoints, criteriaText }) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not set');
  }
  const content = [];
  content.push({ type: 'text', text: `You are grading a student test. Score from 0 to ${maxPoints}. Respond ONLY as strict JSON with keys: points (integer 0..${maxPoints}), reasoning (concise explanation).` });
  if (criteriaText && typeof criteriaText === 'string' && criteriaText.trim()) {
    content.push({ type: 'text', text: `Grading criteria: ${criteriaText.trim()}` });
  }
  for (const url of images) {
    content.push({ type: 'image_url', image_url: { url } });
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You are a careful, fair grader for short-answer and calculation tests.' },
        { role: 'user', content }
      ]
    })
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`OpenAI error ${res.status}: ${txt}`);
  }
  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content || '{}';
  let parsed = {};
  try {
    parsed = JSON.parse(raw);
  } catch (_) {
    parsed = {};
  }
  const points = clampPoints(Number(parsed.points), maxPoints);
  const reasoning = String(parsed.reasoning || '').slice(0, 20000);
  return { points, reasoning };
}

export default async function handler(req, res) {
  try {
    await ensureSchema();
  } catch (e) {
    return res.status(500).json({ error: 'DB schema init failed', details: String(e) });
  }

  if (req.method === 'GET') {
    const username = typeof req.query.username === 'string' ? req.query.username : '';
    const testNumber = req.query.testNumber ? Number(req.query.testNumber) : undefined;
    if (!username) return res.status(400).json({ error: 'username required' });
    try {
      if (testNumber && [1,2,3,4].includes(testNumber)) {
        const rows = await sql(`
          select username, test_number, points, reasoning, images_count, graded_at
          from test_grades
          where username = $1 and test_number = $2
          order by graded_at desc
          limit 1
        `, [username, testNumber]);
        return res.status(200).json({ item: rows[0] || null });
      }
      const rows = await sql(`
        select distinct on (test_number) username, test_number, points, reasoning, images_count, graded_at
        from test_grades
        where username = $1
        order by test_number, graded_at desc
      `, [username]);
      const map = {};
      for (const r of rows) map[r.test_number] = r;
      return res.status(200).json({ items: map });
    } catch (e) {
      return res.status(500).json({ error: 'DB read failed', details: String(e) });
    }
  }

  if (req.method === 'POST') {
    try {
      const body = req.body || {};
      const username = String(body.username || '').trim();
      const testNumber = Number(body.testNumber);
      const images = Array.isArray(body.images) ? body.images.filter(Boolean) : [];
      const maxPoints = Number.isFinite(body.maxPoints) ? Number(body.maxPoints) : 10;
      const criteria = typeof body.criteria === 'string' ? body.criteria : '';
      if (!username) return res.status(400).json({ error: 'username required' });
      if (![1,2,3,4].includes(testNumber)) return res.status(400).json({ error: 'testNumber must be 1..4' });
      if (images.length === 0) return res.status(400).json({ error: 'images required' });

      const { points, reasoning } = await callOpenAIVision({ images, maxPoints, criteriaText: criteria });

      await sql(`
        insert into test_grades (username, test_number, points, reasoning, images_count)
        values ($1, $2, $3, $4, $5)
      `, [username, testNumber, points, reasoning, images.length]);

      const col = getTestColumnName(testNumber);
      if (col) {
        await sql(`
          insert into progress (username, ${col})
          values ($1, $2)
          on conflict (username) do update set ${col} = excluded.${col}
        `, [username, points]);
      }

      return res.status(200).json({ ok: true, points, reasoning });
    } catch (e) {
      return res.status(500).json({ error: 'Grade failed', details: String(e) });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).end('Method Not Allowed');
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};


