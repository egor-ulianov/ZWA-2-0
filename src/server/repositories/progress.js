import { getDb } from '../db.js';
import { filterAssignmentPatch, validateUsername } from './validation.js';

const FIELDS = 'username, assignment_task_checked, assignment_midterm_ok, assignment_topic, assignment_partner, assignment_final_points, updated_by, updated_at';

export function createProgressRepository(sql = getDb()) {
  return {
    async list() { return sql(`select ${FIELDS} from assignments order by username`); },
    async get(username) {
      const rows = await sql(`select ${FIELDS} from assignments where username = $1`, [validateUsername(username)]);
      return rows[0] || null;
    },
    async patch(username, patch, actor) {
      const normalized = validateUsername(username);
      const allowed = filterAssignmentPatch(patch);
      if (!Object.keys(allowed).length) return this.get(normalized);
      if (typeof actor !== 'string' || !actor) throw new TypeError('Actor is required');
      const fields = Object.keys(allowed);
      const values = fields.map((field) => allowed[field]);
      const assignments = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
      const rows = await sql(
        `insert into assignments (username, ${fields.join(', ')}, updated_by)
         values ($1, ${fields.map((_, index) => `$${index + 2}`).join(', ')}, $${fields.length + 2})
         on conflict (username) do update set ${assignments}, updated_by = excluded.updated_by, updated_at = now()
         returning ${FIELDS}`,
        [normalized, ...values, actor],
      );
      return rows[0];
    },
  };
}
