import crypto from 'node:crypto';

import { requireTeacher } from '../../../src/server/auth/guards.js';
import { createGradesRepository } from '../../../src/server/repositories/grades.js';
import { requireSameOrigin } from '../../../src/server/security/csrf.js';

const MODEL = process.env.OPENAI_GRADING_MODEL || 'gpt-4.1';
const PROMPT_VERSION = 'normalization-v2';
const MAX_ITEMS = 500;
const BATCH_SIZE = 50;
const MAX_REASONING_CHARS = 4000;
const PROVIDER_TIMEOUT_MS = 30_000;
const rateWindows = new Map();

export class NormalizationValidationError extends Error {}
export class NormalizationProviderError extends Error {}

export function consumeNormalizationRateLimit(actor, now = Date.now()) {
  const windowStart = now - 5 * 60_000;
  const current = (rateWindows.get(actor) || []).filter((time) => time > windowStart);
  if (current.length >= 10) throw new NormalizationProviderError('AI grading temporarily unavailable');
  current.push(now);
  rateWindows.set(actor, current);
}

export function parseNormalizationOutput(raw, items, maxPoints) {
  let parsed;
  try { parsed = JSON.parse(raw); } catch { throw new NormalizationProviderError('Invalid normalization provider output'); }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new NormalizationProviderError('Invalid normalization provider output');
  const expected = new Set(items.map((item) => item.username));
  if (expected.size !== items.length) throw new NormalizationProviderError('Normalization input contains duplicate students');
  const received = Object.keys(parsed);
  if (received.length !== expected.size || received.some((username) => !expected.has(username))) {
    throw new NormalizationProviderError('Normalization output has missing or unknown students');
  }
  return items.map((item) => {
    const normalized = parsed[item.username];
    if (!normalized || typeof normalized !== 'object' || Array.isArray(normalized)
      || Object.keys(normalized).length !== 2 || Object.keys(normalized).some((key) => key !== 'points' && key !== 'reasoning')
      || !Number.isInteger(normalized.points) || normalized.points < 0 || normalized.points > maxPoints
      || typeof normalized.reasoning !== 'string' || !normalized.reasoning.trim() || normalized.reasoning.length > MAX_REASONING_CHARS) {
      throw new NormalizationProviderError('Normalization output contains an invalid student');
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

function validatePreviewRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new NormalizationValidationError('Invalid normalization request');
  if (!Number.isInteger(body.testNumber) || body.testNumber < 1 || body.testNumber > 4) throw new NormalizationValidationError('testNumber must be 1..4');
  if (!Number.isInteger(body.maxPoints) || body.maxPoints < 1 || body.maxPoints > 12) throw new NormalizationValidationError('maxPoints must be an integer from 1 to 12');
  return { testNumber: body.testNumber, maxPoints: body.maxPoints };
}

function normalizationPrompt({ testNumber, maxPoints, items }) {
  return [
    'Normalize these grades for test ' + testNumber + '. Score semantic correctness only; ignore superficial formatting and harmless naming differences.',
    'Return ONLY a JSON object with exactly one key for every supplied username. Each value must be {"points": integer 0..' + maxPoints + ', "reasoning": non-empty Czech text at most ' + MAX_REASONING_CHARS + ' chars}.',
    JSON.stringify(items.map(({ username, originalPoints, reasoning }) => ({ username, originalPoints, reasoning }))),
  ].join('\n');
}

async function normalizeBatch({ testNumber, maxPoints, items }, { fetchImpl = fetch, apiKey = process.env.OPENAI_API_KEY } = {}) {
  if (!apiKey || !String(apiKey).trim()) throw new NormalizationProviderError('AI grading is not configured');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
  try {
    const response = await fetchImpl('https://api.openai.com/v1/chat/completions', {
      method: 'POST', signal: controller.signal,
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
      body: JSON.stringify({
        model: MODEL, temperature: 0, response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: normalizationPrompt({ testNumber, maxPoints, items }) }],
      }),
    });
    if (!response.ok) throw new NormalizationProviderError('AI grading failed');
    const data = await response.json();
    return parseNormalizationOutput(data?.choices?.[0]?.message?.content, items, maxPoints);
  } catch (error) {
    if (error instanceof NormalizationProviderError) throw error;
    throw new NormalizationProviderError('AI grading failed');
  } finally {
    clearTimeout(timeout);
  }
}

function sendError(res, status, error, correlationId, cause) {
  if (status >= 500) console.error('grade-normalization failed', { correlationId, cause: cause?.name || 'unknown' });
  return res.status(status).json({ error, correlationId });
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
    if (!teacher) return;
    if (!requireSameOrigin(req)) return sendError(res, 403, 'Forbidden', correlationId);
  } catch (error) {
    return sendError(res, 500, 'Normalization service unavailable', correlationId, error);
  }
  const repository = createGradesRepository();

  try {
    if (req.body?.runId !== undefined) {
      if (typeof req.body.runId !== 'string' || !req.body.runId) return sendError(res, 400, 'Invalid runId', correlationId);
      const result = await repository.applyNormalizationRun({ runId: req.body.runId, actor: teacher.subject });
      if (!result) return sendError(res, 404, 'Normalization run not found', correlationId);
      if (result.stale) return sendError(res, 409, 'Normalization run is stale; preview again', correlationId);
      return res.status(200).json({ ok: true, runId: req.body.runId, total: result.total, updated: result.updated, alreadyApplied: result.alreadyApplied });
    }
    if (req.body?.dryRun !== true) return sendError(res, 400, 'runId required to apply normalization', correlationId);
    const { testNumber, maxPoints } = validatePreviewRequest(req.body);
    const rows = await repository.getPublishedForTest(testNumber);
    if (rows.length > MAX_ITEMS) return sendError(res, 400, 'At most ' + MAX_ITEMS + ' grades can be normalized at once', correlationId);
    const items = rows.map((row) => ({
      username: row.username,
      attemptId: row.id,
      originalPoints: row.points,
      reasoning: row.reasoning,
    }));
    const normalizedItems = [];
    for (let index = 0; index < items.length; index += BATCH_SIZE) {
      consumeNormalizationRateLimit(teacher.subject);
      normalizedItems.push(...await normalizeBatch({ testNumber, maxPoints, items: items.slice(index, index + BATCH_SIZE) }));
    }
    const runId = crypto.randomUUID();
    await repository.createNormalizationRun({
      runId, testNumber, maxPoints, actor: teacher.subject, model: MODEL, promptVersion: PROMPT_VERSION,
      originalAttempts: items.map(({ username, attemptId }) => ({ username, attemptId })),
      normalizedItems: normalizedItems.map(({ username, normalizedPoints, reasoning }) => ({ username, points: normalizedPoints, reasoning })),
    });
    return res.status(200).json({
      ok: true, runId, total: items.length, updated: 0,
      preview: normalizedItems.map(({ username, originalPoints, normalizedPoints, reasoning }) => ({ username, originalPoints, normalizedPoints, reasoning })),
    });
  } catch (error) {
    const validation = error instanceof NormalizationValidationError || error instanceof TypeError;
    const provider = error instanceof NormalizationProviderError;
    return sendError(res, validation ? 400 : 502, provider ? 'AI grading failed' : 'Normalization service unavailable', correlationId, error);
  }
}

export const config = { api: { bodyParser: { sizeLimit: '1mb' } } };
