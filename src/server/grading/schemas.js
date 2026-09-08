import { GRADING_LIMITS } from './limits.js';

export class ModelOutputError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ModelOutputError';
  }
}

function parseObject(raw, message) {
  if (typeof raw !== 'string') throw new ModelOutputError(message);
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ModelOutputError(message);
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new ModelOutputError(message);
  }
  return parsed;
}

function hasExactlyKeys(value, keys) {
  const actual = Object.keys(value);
  return actual.length === keys.length && keys.every((key) => actual.includes(key));
}

function validateReasoning(value) {
  return typeof value === 'string'
    && value.trim().length > 0
    && value.length <= GRADING_LIMITS.maxReasoningChars;
}

export function parseGradeOutput(raw, maxPoints) {
  const parsed = parseObject(raw, 'Invalid provider output');
  if (!Number.isInteger(maxPoints) || maxPoints < 1 || maxPoints > GRADING_LIMITS.maxPoints
    || !hasExactlyKeys(parsed, ['points', 'reasoning'])
    || !Number.isInteger(parsed.points) || parsed.points < 0 || parsed.points > maxPoints
    || !validateReasoning(parsed.reasoning)) {
    throw new ModelOutputError('Invalid provider output');
  }
  return { points: parsed.points, reasoning: parsed.reasoning.trim() };
}

export function parseNormalizationOutput(raw, items, maxPoints) {
  const parsed = parseObject(raw, 'Invalid normalization provider output');
  if (!Array.isArray(items) || !Number.isInteger(maxPoints) || maxPoints < 1 || maxPoints > GRADING_LIMITS.maxPoints) {
    throw new ModelOutputError('Invalid normalization provider output');
  }

  const expected = new Set();
  for (const item of items) {
    if (!item || typeof item.username !== 'string' || expected.has(item.username)) {
      throw new ModelOutputError('Normalization input contains a duplicate student');
    }
    expected.add(item.username);
  }
  const received = Object.keys(parsed);
  if (received.length !== expected.size || received.some((username) => !expected.has(username))) {
    throw new ModelOutputError('Normalization output has missing or unknown students');
  }

  return items.map((item) => {
    const normalized = parsed[item.username];
    if (!normalized || typeof normalized !== 'object' || Array.isArray(normalized)
      || !hasExactlyKeys(normalized, ['points', 'reasoning'])
      || !Number.isInteger(normalized.points) || normalized.points < 0 || normalized.points > maxPoints
      || !validateReasoning(normalized.reasoning)) {
      throw new ModelOutputError('Normalization output contains an invalid student');
    }
    return {
      username: item.username,
      attemptId: item.attemptId,
      originalPoints: item.originalPoints,
      normalizedPoints: normalized.points,
      reasoning: normalized.reasoning.trim(),
    };
  });
}
