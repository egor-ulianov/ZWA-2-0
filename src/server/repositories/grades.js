import { getDb } from '../db.js';
import { validateScore, validateUsername } from './validation.js';

const SOURCES = new Set(['ai', 'teacher', 'normalized']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function toStudentGradeDto(grade) {
  if (!grade) return null;
  return {
    test_number: Number(grade.test_number),
    points: Number(grade.points),
    max_points: Number(grade.max_points),
    reasoning: grade.reasoning,
    graded_at: grade.created_at ?? null,
  };
}

function validateAttempt(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TypeError('Invalid grade attempt');
  const {
    username, testNumber, points, maxPoints, reasoning = '', source, actor,
    model = null, promptVersion = null, imageCount = 0,
  } = input;
  const user = validateUsername(username);
  validateScore(points, maxPoints);
  if (!Number.isInteger(testNumber) || testNumber < 1 || testNumber > 4 || !SOURCES.has(source)
    || typeof actor !== 'string' || !actor.trim() || !Number.isInteger(imageCount) || imageCount < 0 || imageCount > 4
    || typeof reasoning !== 'string' || reasoning.length > 4000
    || (model !== null && typeof model !== 'string') || (promptVersion !== null && typeof promptVersion !== 'string')
    || (model !== null && !model.trim()) || (promptVersion !== null && !promptVersion.trim())
    || (source !== 'teacher' && (!model || !promptVersion))) {
    throw new TypeError('Invalid grade attempt');
  }
  return {
    username: user, testNumber, points, maxPoints, reasoning: reasoning.trim(),
    source, actor: actor.trim(), model: model ? model.trim() : null,
    promptVersion: promptVersion ? promptVersion.trim() : null, imageCount,
  };
}

function validateNormalizationItems(originalAttempts, normalizedItems, maxPoints) {
  if (!Array.isArray(originalAttempts) || !Array.isArray(normalizedItems)
    || originalAttempts.length !== normalizedItems.length || originalAttempts.length > 500) {
    throw new TypeError('Invalid normalization run');
  }
  const originals = new Map();
  for (const item of originalAttempts) {
    const username = validateUsername(item?.username);
    if (!Number.isInteger(item?.attemptId) || item.attemptId < 1 || originals.has(username)
      || (item.originalPoints !== undefined
        && (!Number.isInteger(item.originalPoints) || item.originalPoints < 0 || item.originalPoints > maxPoints))) {
      throw new TypeError('Invalid normalization run');
    }
    originals.set(username, {
      username,
      attempt_id: item.attemptId,
      ...(item.originalPoints === undefined ? {} : { originalPoints: item.originalPoints }),
    });
  }
  const normalized = [];
  const seen = new Set();
  for (const item of normalizedItems) {
    const username = validateUsername(item?.username);
    if (!originals.has(username) || seen.has(username)
      || !Number.isInteger(item?.points) || item.points < 0 || item.points > maxPoints
      || typeof item?.reasoning !== 'string' || !item.reasoning.trim() || item.reasoning.length > 4000) {
      throw new TypeError('Invalid normalization run');
    }
    seen.add(username);
    normalized.push({ username, points: item.points, reasoning: item.reasoning.trim() });
  }
  if (seen.size !== originals.size) throw new TypeError('Invalid normalization run');
  return { originalAttempts: [...originals.values()], normalizedItems: normalized };
}

export function createGradesRepository(sql = getDb()) {
  return {
    async createAttempt(input) {
      const attempt = validateAttempt(input);
      const rows = await sql(
        `insert into grade_attempts (username, test_number, points, max_points, reasoning, source, actor, model, prompt_version, image_count)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning *`,
        [attempt.username, attempt.testNumber, attempt.points, attempt.maxPoints, attempt.reasoning, attempt.source, attempt.actor, attempt.model, attempt.promptVersion, attempt.imageCount],
      );
      return rows[0];
    },
    async publishAttempt({ attemptId, actor }) {
      if (!Number.isInteger(attemptId) || attemptId < 1 || typeof actor !== 'string' || !actor.trim()) {
        throw new TypeError('Invalid grade publication');
      }
      const rows = await sql(
        `insert into published_grades (username, test_number, attempt_id, updated_by)
         select username, test_number, id, $2 from grade_attempts where id = $1
         on conflict (username, test_number) do update
           set attempt_id = excluded.attempt_id, updated_by = excluded.updated_by, updated_at = now()
         returning *`,
        [attemptId, actor.trim()],
      );
      return rows[0] || null;
    },
    async recordAndPublish(input) {
      const attempt = validateAttempt(input);
      const rows = await sql(
        `with new_attempt as (
           insert into grade_attempts (username, test_number, points, max_points, reasoning, source, actor, model, prompt_version, image_count)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
           returning *
         ), published as (
           insert into published_grades (username, test_number, attempt_id, updated_by)
           select username, test_number, id, $11 from new_attempt
           on conflict (username, test_number) do update
             set attempt_id = excluded.attempt_id, updated_by = excluded.updated_by, updated_at = now()
           returning username, test_number, attempt_id, updated_by, updated_at
         )
         select new_attempt.*, published.updated_by, published.updated_at
         from new_attempt cross join published`,
        [attempt.username, attempt.testNumber, attempt.points, attempt.maxPoints, attempt.reasoning, attempt.source, attempt.actor, attempt.model, attempt.promptVersion, attempt.imageCount, attempt.actor],
      );
      return rows[0] || null;
    },
    async getLatestPublished(username) {
      return sql(`select ga.* from published_grades pg join grade_attempts ga on ga.id = pg.attempt_id where pg.username = $1 order by ga.test_number`, [validateUsername(username)]);
    },
    async getPublishedGrade(username, testNumber) {
      const user = validateUsername(username);
      if (!Number.isInteger(testNumber) || testNumber < 1 || testNumber > 4) throw new TypeError('Invalid test number');
      const rows = await sql(
        `select ga.* from published_grades pg join grade_attempts ga on ga.id = pg.attempt_id
         where pg.username = $1 and pg.test_number = $2`, [user, testNumber],
      );
      return rows[0] || null;
    },
    async getPublishedForTest(testNumber) {
      if (!Number.isInteger(testNumber) || testNumber < 1 || testNumber > 4) throw new TypeError('Invalid test number');
      return sql(
        `select ga.* from published_grades pg join grade_attempts ga on ga.id = pg.attempt_id
         where pg.test_number = $1 order by ga.username`, [testNumber],
      );
    },
    async createNormalizationRun({ runId, testNumber, maxPoints, actor, model, promptVersion, originalAttempts, normalizedItems }) {
      if (typeof runId !== 'string' || !UUID.test(runId) || !Number.isInteger(testNumber) || testNumber < 1 || testNumber > 4
        || !Number.isInteger(maxPoints) || maxPoints < 1 || maxPoints > 12 || typeof actor !== 'string' || !actor.trim()
        || typeof model !== 'string' || !model.trim() || typeof promptVersion !== 'string' || !promptVersion.trim()) throw new TypeError('Invalid normalization run');
      const normalized = validateNormalizationItems(originalAttempts, normalizedItems, maxPoints);
      const rows = await sql(
        `insert into grade_normalization_runs
          (id, test_number, max_points, actor, model, prompt_version, original_attempts, normalized_items)
         values ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb) returning *`,
        [runId, testNumber, maxPoints, actor, model, promptVersion, JSON.stringify(normalized.originalAttempts), JSON.stringify(normalized.normalizedItems)],
      );
      return rows[0];
    },
    async getLatestPreviewRun({ testNumber, maxPoints, actor }) {
      if (!Number.isInteger(testNumber) || testNumber < 1 || testNumber > 4
        || !Number.isInteger(maxPoints) || maxPoints < 1 || maxPoints > 12
        || typeof actor !== 'string' || !actor.trim()) {
        throw new TypeError('Invalid normalization request');
      }
      const rows = await sql(
        `select id from grade_normalization_runs
         where test_number = $1 and max_points = $2 and actor = $3 and status = 'previewed'
         order by created_at desc, id desc limit 1`,
        [testNumber, maxPoints, actor.trim()],
      );
      return rows[0] || null;
    },
    async applyNormalizationRun({ runId, actor }) {
      if (typeof runId !== 'string' || !UUID.test(runId) || typeof actor !== 'string' || !actor.trim()) throw new TypeError('Invalid normalization run');
      const rows = await sql(
        `with run as (
           select * from grade_normalization_runs where id = $1 and status = 'previewed' for update
         ), guarded_run as (
           select run.* from run
           where run.actor = $2
             and not exists (
             select 1 from jsonb_to_recordset(run.original_attempts) as expected(username text, attempt_id bigint)
             left join lateral (
               select current_grade.attempt_id
               from published_grades current_grade
               where current_grade.username = expected.username and current_grade.test_number = run.test_number
               for update
             ) pg on true
             where pg.attempt_id is distinct from expected.attempt_id
           )
         ), inserted_attempts as (
           insert into grade_attempts (username, test_number, points, max_points, reasoning, source, actor, model, prompt_version, image_count)
           select item.username, guarded_run.test_number, item.points, guarded_run.max_points, item.reasoning,
             'normalized', $2, guarded_run.model, guarded_run.prompt_version, 0
           from guarded_run
           cross join jsonb_to_recordset(guarded_run.normalized_items) as item(username text, points smallint, reasoning text)
           returning id, username, test_number
         ), published as (
           insert into published_grades (username, test_number, attempt_id, updated_by)
           select username, test_number, id, $2 from inserted_attempts
           on conflict (username, test_number) do update
             set attempt_id = excluded.attempt_id, updated_by = excluded.updated_by, updated_at = now()
         ), marked as (
           update grade_normalization_runs set status = 'applied', applied_by = $2, applied_at = now()
           where id = (select id from guarded_run) returning id
         )
         select (select count(*)::int from inserted_attempts) as updated,
                (select jsonb_array_length(original_attempts) from guarded_run) as total
         from marked`,
        [runId, actor],
      );
      if (rows[0]) return { ...rows[0], alreadyApplied: false };
      const existing = await sql('select status, jsonb_array_length(original_attempts) as total from grade_normalization_runs where id = $1', [runId]);
      if (existing[0]?.status === 'applied') return { updated: 0, total: existing[0].total, alreadyApplied: true };
      if (existing[0]?.status === 'previewed') return { updated: 0, total: existing[0].total, stale: true };
      return null;
    },
    async getStudentAttempts(username) {
      return sql('select * from grade_attempts where username = $1 order by created_at desc', [validateUsername(username)]);
    },
  };
}
