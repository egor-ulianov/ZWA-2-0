import crypto from 'node:crypto';

import { requireTeacher } from '../../../src/server/auth/guards.js';
import { createGradesRepository } from '../../../src/server/repositories/grades.js';
import { requireSameOrigin } from '../../../src/server/security/csrf.js';
import {
  GRADING_LIMITS,
  NormalizationValidationError,
  validateNormalizationRequest,
} from '../../../src/server/grading/limits.js';
import { ModelOutputError, parseNormalizationOutput as parseNormalizationOutputSchema } from '../../../src/server/grading/schemas.js';
import { normalizeGrades, NormalizationProviderError } from '../../../src/server/grading/normalization.js';

const PROMPT_VERSION = 'normalization-v2';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export { consumeNormalizationRateLimit, normalizeBatch, NormalizationProviderError } from '../../../src/server/grading/normalization.js';
export { NormalizationValidationError } from '../../../src/server/grading/limits.js';

export function parseNormalizationOutput(raw, items, maxPoints) {
  try {
    return parseNormalizationOutputSchema(raw, items, maxPoints);
  } catch (error) {
    if (error instanceof ModelOutputError) throw new NormalizationProviderError(error.message);
    throw error;
  }
}

function normalizationModel() {
  return process.env.OPENAI_GRADING_MODEL || 'gpt-4.1';
}

function sendError(res, status, error, correlationId, cause) {
  if (status >= 500) {
    console.error('grade-normalization failed', { correlationId, cause: cause?.name || 'unknown' });
  }
  return res.status(status).json({ error, correlationId });
}

function isRateLimited(error) {
  return error instanceof NormalizationProviderError && error.message === 'AI grading temporarily unavailable';
}

export default async function handler(req, res) {
  const correlationId = crypto.randomUUID();
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  let teacher;
  try {
    teacher = await requireTeacher(req, res);
  } catch (error) {
    return sendError(res, 503, 'Normalization service unavailable', correlationId, error);
  }
  if (!teacher) return;

  try {
    if (!requireSameOrigin(req)) return sendError(res, 403, 'Forbidden', correlationId);
    const repository = createGradesRepository();

    let runId = req.body?.runId;
    if (runId === undefined && req.body?.dryRun === false) {
      const { testNumber, maxPoints } = validateNormalizationRequest(req.body);
      const latestPreview = await repository.getLatestPreviewRun({
        testNumber,
        maxPoints,
        actor: teacher.subject,
      });
      runId = latestPreview?.id;
      if (!runId) return sendError(res, 400, 'runId required to apply normalization', correlationId);
    }

    if (runId !== undefined) {
      if (typeof runId !== 'string' || !UUID.test(runId)) {
        return sendError(res, 400, 'Invalid runId', correlationId);
      }
      const result = await repository.applyNormalizationRun({
        runId,
        actor: teacher.subject,
      });
      if (!result) return sendError(res, 404, 'Normalization run not found', correlationId);
      if (result.stale) return sendError(res, 409, 'Normalization run is stale; preview again', correlationId);
      return res.status(200).json({
        ok: true,
        runId,
        total: Number(result.total),
        updated: Number(result.updated),
        ...(result.alreadyApplied !== undefined ? { alreadyApplied: result.alreadyApplied } : {}),
        ...(result.stale ? { stale: true } : {}),
      });
    }

    if (req.body?.dryRun !== true) {
      return sendError(res, 400, 'runId required to apply normalization', correlationId);
    }
    const { testNumber, maxPoints } = validateNormalizationRequest(req.body);
    const rows = await repository.getPublishedForTest(testNumber);
    if (rows.length > GRADING_LIMITS.maxNormalizationItems) {
      return sendError(res, 400, 'At most 500 grades can be normalized at once', correlationId);
    }
    const items = rows.map((row) => ({
      username: row.username,
      attemptId: row.id,
      originalPoints: row.points,
      reasoning: row.reasoning,
    }));
    const model = normalizationModel();
    const normalizedItems = await normalizeGrades(
      { testNumber, maxPoints, items, actor: teacher.subject },
      { model },
    );
    const previewRunId = crypto.randomUUID();
    await repository.createNormalizationRun({
      runId: previewRunId,
      testNumber,
      maxPoints,
      actor: teacher.subject,
      model,
      promptVersion: PROMPT_VERSION,
      originalAttempts: items.map(({ username, attemptId, originalPoints }) => ({ username, attemptId, originalPoints })),
      normalizedItems: normalizedItems.map(({ username, normalizedPoints, reasoning }) => ({
        username,
        points: normalizedPoints,
        reasoning,
      })),
    });
    return res.status(200).json({
      ok: true,
      runId: previewRunId,
      total: items.length,
      updated: 0,
      preview: normalizedItems.map(({ username, originalPoints, normalizedPoints, reasoning }) => ({
        username,
        originalPoints,
        normalizedPoints,
        reasoning,
      })),
    });
  } catch (error) {
    const isValidation = error instanceof NormalizationValidationError || error instanceof TypeError;
    const isProvider = error instanceof NormalizationProviderError || error instanceof ModelOutputError;
    const status = isRateLimited(error) ? 429 : (isValidation ? 400 : 502);
    return sendError(
      res,
      status,
      isProvider ? 'AI grading failed' : 'Normalization service unavailable',
      correlationId,
      error,
    );
  }
}

export const config = { api: { bodyParser: { sizeLimit: '1mb' } } };
