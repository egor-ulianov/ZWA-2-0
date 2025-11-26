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
}

function clamp(value, min, max) {
  const v = Number.isFinite(value) ? Math.round(value) : 0;
  if (v < min) return min;
  if (v > max) return max;
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

async function callOpenAINormalize({ items, maxPoints, testNumber }) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not set');
  }
  const requestPayload = {
    meta: {
      testNumber,
      tasksCount: 4,
      pointsPerTask: 3,
      maxPoints
    },
    students: items
  };
  const instruction =
    `Jsi spravedlivý hodnotitel. Normalizuj body napříč všemi studenty pro test ${testNumber}, atˇ studenti jsou hodnocené stejně za stejné chyby. ` +
    `Maximálně 12 bodů (4 úlohy, 3 body za úlohu). ` +
    `Nepenalizuj triviální formátovací chyby (mezery, tečky/čárky) ani drobné rozdíly v pojmenování, pokud je řešení věcně správné. ` +
    `Pro každého studenta vrať nové body (celé číslo 0..${maxPoints}) a nové odůvodnění v češtině, které je přesně stejné jako původní odůvodnění ale bez zmínek triviálních formátovacích chyb. ` +
    `ODPOVÍDEJ POUZE jako striktní JSON objekt ve tvaru: { "<id>": { "points": <int>, "reasoning": "<string>" }, ... }. ` +
    `ID je přesně hodnota pole "id" ze vstupu.`;
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4.1',
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You are a careful, fair grader for short-answer and calculation tests. Ignore superficial style issues that do not change correctness.' },
        { role: 'user', content: `${instruction}\n\nVstupní data:\n${JSON.stringify(requestPayload, null, 2)}` }
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
  return parsed;
}

export default async function handler(req, res) {
  try {
    await ensureSchema();
  } catch (e) {
    return res.status(500).json({ error: 'DB schema init failed', details: String(e) });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  // Verify teacher session (same logic as teacher/me.js, copied inline)
  try {
    const cookie = req.headers.cookie || '';
    const match = cookie.match(/(?:^|; )teacher_session=([^;]+)/);
    const token = match ? decodeURIComponent(match[1]) : '';
    const crypto = await import('crypto');
    function verify(t) {
      const secret = process.env.TEACHER_COOKIE_SECRET || 'dev-secret-teacher';
      if (!t) return null;
      const idx = t.lastIndexOf('.');
      if (idx <= 0) return null;
      const value = t.slice(0, idx);
      const sig = t.slice(idx + 1);
      const h = crypto.createHmac('sha256', secret).update(value).digest('hex');
      if (h !== sig) return null;
      return value;
    }
    const teacher = verify(token);
    if (!teacher) return res.status(401).json({ error: 'Unauthorized' });
  } catch (e) {
    return res.status(500).json({ error: 'Auth failed', details: String(e) });
  }

  const body = req.body || {};
  const testNumber = Number(body.testNumber);
  const maxPoints = Number.isFinite(body.maxPoints) ? Number(body.maxPoints) : 12;
  const dryRun = Boolean(body.dryRun);

  if (![1, 2, 3, 4].includes(testNumber)) {
    return res.status(400).json({ error: 'testNumber must be 1..4' });
  }

  const testCol = getTestColumnName(testNumber);
  if (!testCol) {
    return res.status(400).json({ error: 'Unsupported test number' });
  }

  try {
    // Latest grade per username for this test
    const rows = await sql(`
      select distinct on (username)
        username, test_number, points, reasoning, graded_at
      from test_grades
      where test_number = $1
      order by username, graded_at desc
    `, [testNumber]);

    if (!rows || rows.length === 0) {
      return res.status(200).json({ ok: true, total: 0, updated: 0, preview: [] });
    }

    const items = rows.map((r) => ({
      id: r.username,
      originalPoints: clamp(Number(r.points) || 0, 0, maxPoints),
      reasoning: String(r.reasoning || '').slice(0, 20000)
    }));

    // Single LLM call to normalize across all students
    const llmResult = await callOpenAINormalize({ items, maxPoints, testNumber });

    const preview = items.map((it) => {
      const out = llmResult && typeof llmResult === 'object' ? llmResult[it.id] : undefined;
      const newPoints = clamp(Number(out?.points), 0, maxPoints);
      const newReasoning = String(out?.reasoning || it.reasoning).slice(0, 20000);
      return {
        username: it.id,
        originalPoints: it.originalPoints,
        normalizedPoints: newPoints,
        reasoning: newReasoning
      };
    });

    if (dryRun) {
      return res.status(200).json({
        ok: true,
        total: rows.length,
        updated: 0,
        preview
      });
    }

    // Apply updates: insert new normalized grade rows and update progress
    let updated = 0;
    for (const item of preview) {
      await sql(`
        insert into test_grades (username, test_number, points, reasoning, images_count)
        values ($1, $2, $3, $4, $5)
      `, [item.username, testNumber, item.normalizedPoints, item.reasoning, 0]);
      await sql(`
        insert into progress (username, ${testCol})
        values ($1, $2)
        on conflict (username) do update set ${testCol} = excluded.${testCol}
      `, [item.username, item.normalizedPoints]);
      updated += 1;
    }

    return res.status(200).json({
      ok: true,
      total: rows.length,
      updated
    });
  } catch (e) {
    return res.status(500).json({ error: 'Normalization failed', details: String(e) });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};


