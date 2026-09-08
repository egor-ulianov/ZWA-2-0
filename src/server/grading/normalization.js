import { GRADING_LIMITS } from './limits.js';
import { ModelOutputError, parseNormalizationOutput } from './schemas.js';
import { GradeProviderError, requestModel } from './provider.js';
import { consumeSharedRateLimit, RateLimitExceeded, RateLimitUnavailable, rateLimitKey } from '../rate-limit.js';

export class NormalizationProviderError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NormalizationProviderError';
  }
}

export async function consumeNormalizationRateLimit(actor, now = Date.now(), dependencies = {}) {
  if (typeof actor !== 'string' || !actor.trim()) throw new NormalizationProviderError('AI grading unavailable');
  if (dependencies.rateLimit === false || (process.env.NODE_ENV === 'test' && !dependencies.sql)) return;
  try {
    await consumeSharedRateLimit({
      key: rateLimitKey('normalization', actor.trim()),
      limit: 10,
      windowMs: 5 * 60_000,
      now,
      sql: dependencies.sql,
      timeoutMs: dependencies.rateLimitTimeoutMs,
    });
  } catch (error) {
    if (error instanceof RateLimitExceeded) throw new NormalizationProviderError('AI grading temporarily unavailable');
    if (error instanceof RateLimitUnavailable) throw new NormalizationProviderError('AI grading unavailable');
    throw error;
  }
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
    await consumeNormalizationRateLimit(actor, dependencies.now, dependencies);
    normalized.push(...await normalizeBatch({
      testNumber,
      maxPoints,
      items: items.slice(index, index + GRADING_LIMITS.normalizationBatchSize),
    }, { ...dependencies, rateLimit: false }));
  }
  return normalized;
}
