import crypto from 'node:crypto';

import { requireTeacher } from '../../../src/server/auth/guards.js';
import { requireSameOrigin } from '../../../src/server/security/csrf.js';
import {
  NormalizationRunNotFoundError,
  NormalizationRunStaleError,
  NormalizationWorkflowError,
  executeNormalization,
} from '../../../src/server/grading/normalization-service.js';
import {
  NormalizationValidationError,
} from '../../../src/server/grading/limits.js';
import { ModelOutputError, parseNormalizationOutput as parseNormalizationOutputSchema } from '../../../src/server/grading/schemas.js';
import { NormalizationProviderError } from '../../../src/server/grading/normalization.js';

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
    const result = await executeNormalization({ body: req.body, actor: teacher.subject });
    if (result.kind === 'apply') {
      return res.status(200).json({
        ok: true,
        runId: result.runId,
        total: result.total,
        updated: result.updated,
        ...(result.alreadyApplied !== undefined ? { alreadyApplied: result.alreadyApplied } : {}),
      });
    }
    return res.status(200).json({
      ok: true,
      runId: result.runId,
      total: result.total,
      updated: result.updated,
      preview: result.preview,
    });
  } catch (error) {
    if (error instanceof NormalizationWorkflowError) {
      return sendError(res, 400, error.message, correlationId);
    }
    if (error instanceof NormalizationRunNotFoundError) {
      return sendError(res, 404, error.message, correlationId);
    }
    if (error instanceof NormalizationRunStaleError) {
      return sendError(res, 409, error.message, correlationId);
    }
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
