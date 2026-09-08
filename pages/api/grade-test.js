import crypto from 'node:crypto';

import { requireTeacher } from '../../src/server/auth/guards.js';
import { createGradesRepository } from '../../src/server/repositories/grades.js';
import { validateUsername } from '../../src/server/repositories/validation.js';
import { requireSameOrigin } from '../../src/server/security/csrf.js';
import { GRADING_LIMITS, GradeValidationError, validateGradeRequest } from '../../src/server/grading/limits.js';
import { ModelOutputError, parseGradeOutput as parseGradeOutputSchema } from '../../src/server/grading/schemas.js';
import { GradeProviderError, gradeImages } from '../../src/server/grading/provider.js';

const PROMPT_VERSION = 'grade-v2';
const rateWindows = new Map();

export { GradeValidationError, validateGradeRequest } from '../../src/server/grading/limits.js';
export { GradeProviderError, gradeImages } from '../../src/server/grading/provider.js';

export function parseGradeOutput(raw, maxPoints) {
  try {
    return parseGradeOutputSchema(raw, maxPoints);
  } catch (error) {
    if (error instanceof ModelOutputError) throw new GradeProviderError(error.message);
    throw error;
  }
}

function gradingModel() {
  return process.env.OPENAI_GRADING_MODEL || 'gpt-4.1';
}

function consumeGradeRateLimit(actor, now = Date.now()) {
  const windowStart = now - 5 * 60_000;
  const current = (rateWindows.get(actor) || []).filter((time) => time > windowStart);
  if (current.length >= 10) throw new GradeProviderError('AI grading temporarily unavailable');
  current.push(now);
  rateWindows.set(actor, current);
}

function legacyGradeShape(item) {
  if (!item) return item;
  return {
    ...item,
    teacher_comment: item.teacher_comment ?? null,
    images_count: item.image_count ?? 0,
    graded_at: item.created_at ?? null,
  };
}

function sendError(res, status, error, correlationId, cause) {
  if (status >= 500) {
    console.error('grade-test failed', { correlationId, cause: cause?.name || 'unknown' });
  }
  return res.status(status).json({ error, correlationId });
}

function isRateLimited(error) {
  return error instanceof GradeProviderError && error.message === 'AI grading temporarily unavailable';
}

export default async function handler(req, res) {
  const correlationId = crypto.randomUUID();
  let teacher;
  try {
    teacher = await requireTeacher(req, res);
  } catch (error) {
    return sendError(res, 500, 'Grade service unavailable', correlationId, error);
  }
  if (!teacher) return;

  try {
    if (!requireSameOrigin(req)) return sendError(res, 403, 'Forbidden', correlationId);
    const repository = createGradesRepository();

    if (req.method === 'GET') {
      const username = typeof req.query?.username === 'string' ? req.query.username : '';
      if (!username) return sendError(res, 400, 'username required', correlationId);
      const testNumber = req.query?.testNumber === undefined ? null : Number(req.query.testNumber);
      if (testNumber !== null && (!Number.isInteger(testNumber) || testNumber < 1 || testNumber > 4)) {
        return sendError(res, 400, 'Invalid testNumber', correlationId);
      }
      const items = (await repository.getLatestPublished(username)).map(legacyGradeShape);
      const item = testNumber === null ? null : items.find((row) => Number(row.test_number) === testNumber) || null;
      const keyedItems = Object.fromEntries(items.map((grade) => [grade.test_number, grade]));
      return res.status(200).json(testNumber === null ? { items: keyedItems } : { item });
    }

    if (req.method === 'POST') {
      let input;
      try {
        input = validateGradeRequest(req.body);
      } catch (error) {
        return sendError(res, 400, error.message, correlationId);
      }
      try {
        consumeGradeRateLimit(teacher.subject);
      } catch (error) {
        if (isRateLimited(error)) return sendError(res, 429, error.message, correlationId);
        throw error;
      }
      const model = gradingModel();
      const result = await gradeImages(input, { model });
      await repository.recordAndPublish({
        username: input.username,
        testNumber: input.testNumber,
        maxPoints: input.maxPoints,
        points: result.points,
        reasoning: result.reasoning,
        source: 'ai',
        actor: teacher.subject,
        model,
        promptVersion: PROMPT_VERSION,
        imageCount: input.images.length,
      });
      return res.status(200).json({ ok: true, points: result.points, reasoning: result.reasoning });
    }

    if (req.method === 'PUT') {
      let username;
      try {
        username = validateUsername(req.body?.username);
      } catch {
        return sendError(res, 400, 'Invalid grade request', correlationId);
      }
      const testNumber = Number(req.body?.testNumber);
      const reasoning = req.body?.reasoning;
      if (!Number.isInteger(testNumber) || testNumber < 1 || testNumber > 4
        || typeof reasoning !== 'string' || !reasoning.trim() || reasoning.length > GRADING_LIMITS.maxReasoningChars) {
        return sendError(res, 400, 'Invalid reasoning', correlationId);
      }
      const existing = await repository.getPublishedGrade(username, testNumber);
      if (!existing) return sendError(res, 404, 'Grade not found', correlationId);
      const item = await repository.recordAndPublish({
        username: existing.username,
        testNumber: existing.test_number,
        points: existing.points,
        maxPoints: existing.max_points,
        reasoning: reasoning.trim(),
        source: 'teacher',
        actor: teacher.subject,
        imageCount: existing.image_count || 0,
      });
      return res.status(200).json({ ok: true, item: legacyGradeShape(item) });
    }

    res.setHeader('Allow', 'GET, POST, PUT');
    return res.status(405).end('Method Not Allowed');
  } catch (error) {
    const isValidation = error instanceof GradeValidationError || error instanceof TypeError;
    const isProvider = error instanceof GradeProviderError || error instanceof ModelOutputError;
    return sendError(
      res,
      isValidation ? (error instanceof ModelOutputError ? 502 : 400) : 502,
      isProvider ? 'AI grading failed' : 'Grade service unavailable',
      correlationId,
      error,
    );
  }
}

export const config = { api: { bodyParser: { sizeLimit: '12mb' } } };
