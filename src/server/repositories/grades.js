import { getDb } from '../db.js';
import { validateScore, validateUsername } from './validation.js';

export function createGradesRepository(sql = getDb()) {
  return {
    async createAttempt({ username, testNumber, points, maxPoints, reasoning = '', source, actor, model = null, promptVersion = null, imageCount = 0 }) {
      const user = validateUsername(username);
      validateScore(points, maxPoints);
      if (!Number.isInteger(testNumber) || testNumber < 1 || testNumber > 4 || !['ai', 'teacher', 'normalized'].includes(source) || typeof actor !== 'string') throw new TypeError('Invalid grade attempt');
      const rows = await sql(
        `insert into grade_attempts (username, test_number, points, max_points, reasoning, source, actor, model, prompt_version, image_count)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning *`,
        [user, testNumber, points, maxPoints, String(reasoning).slice(0, 4000), source, actor, model, promptVersion, imageCount],
      );
      return rows[0];
    },
    async publishAttempt({ attemptId, actor }) {
      const rows = await sql(
        `insert into published_grades (username, test_number, attempt_id, updated_by)
         select username, test_number, id, $2 from grade_attempts where id = $1
         on conflict (username, test_number) do update set attempt_id = excluded.attempt_id, updated_by = excluded.updated_by, updated_at = now()
         returning *`, [attemptId, actor],
      );
      return rows[0] || null;
    },
    async getLatestPublished(username) {
      return sql(`select ga.* from published_grades pg join grade_attempts ga on ga.id = pg.attempt_id where pg.username = $1 order by ga.test_number`, [validateUsername(username)]);
    },
    async getStudentAttempts(username) {
      return sql('select * from grade_attempts where username = $1 order by created_at desc', [validateUsername(username)]);
    },
  };
}
