import crypto from 'node:crypto';

import { requireTeacher } from '../../src/server/auth/guards.js';
import { createGradesRepository } from '../../src/server/repositories/grades.js';
import { validateUsername } from '../../src/server/repositories/validation.js';
import { requireSameOrigin } from '../../src/server/security/csrf.js';

const MAX_IMAGES = 4;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_TOTAL_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_CRITERIA_CHARS = 2000;
const MAX_REASONING_CHARS = 4000;
const PROVIDER_TIMEOUT_MS = 30_000;
const MODEL = process.env.OPENAI_GRADING_MODEL || 'gpt-4.1';
const PROMPT_VERSION = 'grade-v2';
const DATA_URL = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/;
const rateWindows = new Map();

export class GradeValidationError extends Error {}
export class GradeProviderError extends Error {}

function validateImage(value) {
  if (typeof value !== 'string') throw new GradeValidationError('Images must be data URLs');
  const match = DATA_URL.exec(value);
  if (!match || match[2].length % 4 !== 0) throw new GradeValidationError('Images must be PNG, JPEG, or WebP data URLs');
  const bytes = Buffer.from(match[2], 'base64');
  if (!bytes.length || bytes.toString('base64') !== match[2]) throw new GradeValidationError('Images must be valid base64 data URLs');
  if (bytes.length > MAX_IMAGE_BYTES) throw new GradeValidationError('Each image must be at most 2 MiB');
  return { url: value, bytes: bytes.length };
}

export function validateGradeRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new GradeValidationError('Invalid grade request');
  let username;
  try { username = validateUsername(body.username); } catch { throw new GradeValidationError('Invalid username'); }
  const testNumber = body.testNumber;
  const maxPoints = body.maxPoints;
  if (!Number.isInteger(testNumber) || testNumber < 1 || testNumber > 4) throw new GradeValidationError('testNumber must be 1..4');
  if (!Number.isInteger(maxPoints) || maxPoints < 1 || maxPoints > 12) throw new GradeValidationError('maxPoints must be an integer from 1 to 12');
  if (!Array.isArray(body.images) || !body.images.length) throw new GradeValidationError('At least one image is required');
  if (body.images.length > MAX_IMAGES) throw new GradeValidationError('At most four images are allowed');
  const images = body.images.map(validateImage);
  const totalBytes = images.reduce((total, image) => total + image.bytes, 0);
  if (totalBytes > MAX_TOTAL_IMAGE_BYTES) throw new GradeValidationError('Images may total at most 8 MiB');
  if (body.criteria !== undefined && (typeof body.criteria !== 'string' || body.criteria.length > MAX_CRITERIA_CHARS)) {
    throw new GradeValidationError('criteria must be at most 2000 characters');
  }
  return { username, testNumber, maxPoints, images: images.map(({ url }) => url), criteria: (body.criteria || '').trim() };
}

export function parseGradeOutput(raw, maxPoints) {
  let parsed;
  try { parsed = JSON.parse(raw); } catch { throw new GradeProviderError('Invalid provider output'); }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)
    || Object.keys(parsed).length !== 2 || Object.keys(parsed).some((key) => key !== 'points' && key !== 'reasoning')
    || !Number.isInteger(parsed.points) || parsed.points < 0 || parsed.points > maxPoints
    || typeof parsed.reasoning !== 'string' || !parsed.reasoning.trim() || parsed.reasoning.length > MAX_REASONING_CHARS) {
    throw new GradeProviderError('Invalid provider output');
  }
  return { points: parsed.points, reasoning: parsed.reasoning.trim() };
}

function prompt({ maxPoints, criteria }) {
  return `You are a careful, fair grader for short-answer and calculation tests. Score only semantic correctness; ignore superficial formatting and harmless naming differences. Respond only with JSON: {"points": integer 0..${maxPoints}, "reasoning": non-empty concise Czech explanation up to ${MAX_REASONING_CHARS} characters}.${criteria ? `\nGrading criteria: ${criteria}` : ''}`;
}

function consumeRateLimit(actor) {
  const now = Date.now();
  const windowStart = now - 5 * 60_000;
  const current = (rateWindows.get(actor) || []).filter((time) => time > windowStart);
  if (current.length >= 10) throw new GradeProviderError('AI grading temporarily unavailable');
  current.push(now);
  rateWindows.set(actor, current);
}

export async function gradeImages(input, { fetchImpl = fetch, apiKey = process.env.OPENAI_API_KEY, timeoutMs = PROVIDER_TIMEOUT_MS } = {}) {
  if (!apiKey || !String(apiKey).trim()) throw new GradeProviderError('AI grading is not configured');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl('https://api.openai.com/v1/chat/completions', {
      method: 'POST', signal: controller.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: MODEL, temperature: 0, response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: [
          { type: 'text', text: prompt(input) },
          ...input.images.map((url) => ({ type: 'image_url', image_url: { url } })),
        ] }],
      }),
    });
    if (!response.ok) throw new GradeProviderError('AI grading failed');
    const data = await response.json();
    return parseGradeOutput(data?.choices?.[0]?.message?.content, input.maxPoints);
  } catch (error) {
    if (error instanceof GradeProviderError) throw error;
    throw new GradeProviderError('AI grading unavailable');
  } finally {
    clearTimeout(timeout);
  }
}

function sendError(res, status, error, correlationId, cause) {
  if (status >= 500) console.error('grade-test failed', { correlationId, cause: cause?.name || 'unknown' });
  return res.status(status).json({ error, correlationId });
}

export default async function handler(req, res) {
  const correlationId = crypto.randomUUID();
  let teacher;
  try {
    teacher = await requireTeacher(req, res);
    if (!teacher) return;
    if (!requireSameOrigin(req)) return sendError(res, 403, 'Forbidden', correlationId);
  } catch (error) {
    return sendError(res, 500, 'Grade service unavailable', correlationId, error);
  }
  const repository = createGradesRepository();

  try {
    if (req.method === 'GET') {
      const username = typeof req.query?.username === 'string' ? req.query.username : '';
      if (!username) return sendError(res, 400, 'username required', correlationId);
      const items = await repository.getLatestPublished(username);
      const testNumber = req.query?.testNumber === undefined ? null : Number(req.query.testNumber);
      if (testNumber !== null && (!Number.isInteger(testNumber) || testNumber < 1 || testNumber > 4)) return sendError(res, 400, 'Invalid testNumber', correlationId);
      const item = testNumber === null ? null : items.find((row) => row.test_number === testNumber) || null;
      return res.status(200).json(testNumber === null ? { items } : { item });
    }
    if (req.method === 'POST') {
      let input;
      try { input = validateGradeRequest(req.body); } catch (error) { return sendError(res, 400, error.message, correlationId); }
      try { consumeRateLimit(teacher.subject); } catch (error) { return sendError(res, 429, error.message, correlationId); }
      const result = await gradeImages(input);
      await repository.recordAndPublish({ ...input, ...result, source: 'ai', actor: teacher.subject, model: MODEL, promptVersion: PROMPT_VERSION, imageCount: input.images.length });
      return res.status(200).json({ ok: true, points: result.points, reasoning: result.reasoning });
    }
    if (req.method === 'PUT') {
      const username = req.body?.username;
      const testNumber = req.body?.testNumber;
      const reasoning = req.body?.reasoning;
      if (typeof reasoning !== 'string' || !reasoning.trim() || reasoning.length > MAX_REASONING_CHARS) return sendError(res, 400, 'Invalid reasoning', correlationId);
      const existing = await repository.getPublishedGrade(username, testNumber);
      if (!existing) return sendError(res, 404, 'Grade not found', correlationId);
      const item = await repository.recordAndPublish({
        username: existing.username, testNumber: existing.test_number, points: existing.points, maxPoints: existing.max_points,
        reasoning: reasoning.trim(), source: 'teacher', actor: teacher.subject, imageCount: existing.image_count || 0,
      });
      return res.status(200).json({ ok: true, item });
    }
    res.setHeader('Allow', 'GET, POST, PUT');
    return res.status(405).end('Method Not Allowed');
  } catch (error) {
    const isValidation = error instanceof GradeValidationError || error instanceof TypeError;
    const isProvider = error instanceof GradeProviderError;
    return sendError(res, isValidation ? 400 : 502, isProvider ? 'AI grading failed' : 'Grade service unavailable', correlationId, error);
  }
}

export const config = { api: { bodyParser: { sizeLimit: '12mb' } } };
