import crypto from 'node:crypto';

import { createGradesRepository } from '../repositories/grades.js';
import { GRADING_LIMITS, NormalizationValidationError, validateNormalizationRequest } from './limits.js';
import { normalizeGrades } from './normalization.js';

const PROMPT_VERSION = 'normalization-v2';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class NormalizationWorkflowError extends NormalizationValidationError {
  constructor(message) {
    super(message);
    this.name = 'NormalizationWorkflowError';
  }
}

export class NormalizationRunNotFoundError extends Error {
  constructor() {
    super('Normalization run not found');
    this.name = 'NormalizationRunNotFoundError';
  }
}

export class NormalizationRunStaleError extends Error {
  constructor() {
    super('Normalization run is stale; preview again');
    this.name = 'NormalizationRunStaleError';
  }
}

function normalizationModel() {
  return process.env.OPENAI_GRADING_MODEL || 'gpt-4.1';
}

export async function executeNormalization({
  body,
  actor,
  repository = createGradesRepository(),
  normalize = normalizeGrades,
  model = normalizationModel(),
  createRunId = crypto.randomUUID,
}) {
  let runId = body?.runId;
  if (runId === undefined && body?.dryRun === false) {
    const { testNumber, maxPoints } = validateNormalizationRequest(body);
    const latestPreview = await repository.getLatestPreviewRun({ testNumber, maxPoints, actor });
    runId = latestPreview?.id;
    if (!runId) throw new NormalizationWorkflowError('runId required to apply normalization');
  }

  if (runId !== undefined) {
    if (typeof runId !== 'string' || !UUID.test(runId)) {
      throw new NormalizationWorkflowError('Invalid runId');
    }
    const result = await repository.applyNormalizationRun({ runId, actor });
    if (!result) throw new NormalizationRunNotFoundError();
    if (result.stale) throw new NormalizationRunStaleError();
    return {
      kind: 'apply',
      runId,
      total: Number(result.total),
      updated: Number(result.updated),
      ...(result.alreadyApplied !== undefined ? { alreadyApplied: result.alreadyApplied } : {}),
    };
  }

  if (body?.dryRun !== true) {
    throw new NormalizationWorkflowError('runId required to apply normalization');
  }
  const { testNumber, maxPoints } = validateNormalizationRequest(body);
  const rows = await repository.getPublishedForTest(testNumber);
  if (rows.length > GRADING_LIMITS.maxNormalizationItems) {
    throw new NormalizationWorkflowError('At most 500 grades can be normalized at once');
  }
  const items = rows.map((row) => ({
    username: row.username,
    attemptId: row.id,
    originalPoints: row.points,
    reasoning: row.reasoning,
  }));
  const normalizedItems = await normalize(
    { testNumber, maxPoints, items, actor },
    { model },
  );
  const previewRunId = createRunId();
  await repository.createNormalizationRun({
    runId: previewRunId,
    testNumber,
    maxPoints,
    actor,
    model,
    promptVersion: PROMPT_VERSION,
    originalAttempts: items.map(({ username, attemptId, originalPoints }) => ({ username, attemptId, originalPoints })),
    normalizedItems: normalizedItems.map(({ username, normalizedPoints, reasoning }) => ({
      username,
      points: normalizedPoints,
      reasoning,
    })),
  });
  return {
    kind: 'preview',
    runId: previewRunId,
    total: items.length,
    updated: 0,
    preview: normalizedItems.map(({ username, originalPoints, normalizedPoints, reasoning }) => ({
      username,
      originalPoints,
      normalizedPoints,
      reasoning,
    })),
  };
}
