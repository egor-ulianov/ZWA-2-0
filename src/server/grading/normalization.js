import { GRADING_LIMITS } from './limits.js';
import { ModelOutputError, parseNormalizationOutput } from './schemas.js';
import { GradeProviderError, requestModel } from './provider.js';

const rateWindows = new Map();

export class NormalizationProviderError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NormalizationProviderError';
  }
}

export function consumeNormalizationRateLimit(actor, now = Date.now()) {
  if (typeof actor !== 'string' || !actor.trim()) throw new NormalizationProviderError('AI grading unavailable');
  const windowStart = now - 5 * 60_000;
  const current = (rateWindows.get(actor) || []).filter((time) => time > windowStart);
  if (current.length >= 10) throw new NormalizationProviderError('AI grading temporarily unavailable');
  current.push(now);
  rateWindows.set(actor, current);
}

function normalizationPrompt({ testNumber, maxPoints, items }) {
  return [
    `Normalize these grades for test ${testNumber}. Score semantic correctness only; ignore superficial formatting and harmless naming differences.`,
    `Return ONLY a JSON object with exactly one key for every supplied username. Each value must be {"points": integer 0..${maxPoints}, "reasoning": non-empty Czech text at most ${GRADING_LIMITS.maxReasoningChars} chars}.`,
    JSON.stringify(items.map(({ username, originalPoints, reasoning }) => ({ username, originalPoints, reasoning }))),
  ].join('\n');
}

export async function normalizeBatch({ testNumber, maxPoints, items }, dependencies = {}) {
  try {
    const raw = await requestModel({
      messages: [{ role: 'user', content: normalizationPrompt({ testNumber, maxPoints, items }) }],
      model: dependencies.model,
    }, dependencies);
    return parseNormalizationOutput(raw, items, maxPoints);
  } catch (error) {
    if (error instanceof ModelOutputError || error instanceof GradeProviderError) {
      throw new NormalizationProviderError(error.message);
    }
    throw error;
  }
}

export async function normalizeGrades({ testNumber, maxPoints, items, actor }, dependencies = {}) {
  if (!Array.isArray(items) || items.length > GRADING_LIMITS.maxNormalizationItems) {
    throw new NormalizationProviderError('At most 500 grades can be normalized at once');
  }
  const normalized = [];
  for (let index = 0; index < items.length; index += GRADING_LIMITS.normalizationBatchSize) {
    consumeNormalizationRateLimit(actor, dependencies.now);
    normalized.push(...await normalizeBatch({
      testNumber,
      maxPoints,
      items: items.slice(index, index + GRADING_LIMITS.normalizationBatchSize),
    }, dependencies));
  }
  return normalized;
}
