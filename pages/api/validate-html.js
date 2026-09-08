import crypto from 'node:crypto';

import { consumeSharedRateLimit, RateLimitExceeded } from '../../src/server/rate-limit.js';

export const MAX_HTML_CHARS = 100_000;
const VALIDATOR_TIMEOUT_MS = 5_000;
const VALIDATOR_RATE_LIMIT = 30;

function clientKey(req) {
  const forwarded = req.headers?.['x-forwarded-for'];
  const firstForwarded = Array.isArray(forwarded) ? forwarded[0] : String(forwarded || '').split(',')[0].trim();
  const address = firstForwarded || req.socket?.remoteAddress || 'unknown';
  return `validate-html:${String(address).replace(/[^A-Za-z0-9:._-]/g, '_').slice(0, 96)}`;
}

function sendError(res, status, error, correlationId, cause) {
  if (status >= 500) console.error('validate-html failed', { correlationId, cause: cause?.name || 'unknown' });
  return res.status(status).json({ error, correlationId });
}

export function createValidateHtmlHandler({
  fetchImpl = (...args) => fetch(...args),
  rateLimiter = consumeSharedRateLimit,
} = {}) {
  return async function handler(req, res) {
    const correlationId = crypto.randomUUID();
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const body = req.body;
    const html = body && typeof body === 'object' && !Array.isArray(body) ? body.html : null;
    if (typeof html !== 'string' || html.trim() === '') {
      return res.status(400).json({ error: 'Missing html string in body' });
    }
    if (html.length > MAX_HTML_CHARS || Buffer.byteLength(html, 'utf8') > 120 * 1024) {
      return res.status(413).json({ error: 'HTML is too large' });
    }

    try {
      await rateLimiter({
        key: clientKey(req),
        limit: VALIDATOR_RATE_LIMIT,
        windowMs: 60_000,
        timeoutMs: 1_000,
      });
    } catch (error) {
      if (error instanceof RateLimitExceeded) return sendError(res, 429, 'Too many validation requests', correlationId);
      return sendError(res, 503, 'Validation service unavailable', correlationId, error);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), VALIDATOR_TIMEOUT_MS);
    try {
      const response = await fetchImpl('https://validator.w3.org/nu/?out=json', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'User-Agent': 'ZWA-Validator-Proxy',
        },
        body: html,
      });
      if (!response.ok) return sendError(res, 502, 'HTML validation service unavailable', correlationId);
      const data = await response.json();
      return res.status(200).json(data);
    } catch (error) {
      return sendError(res, 502, 'HTML validation service unavailable', correlationId, error);
    } finally {
      clearTimeout(timeout);
    }
  };
}

export default createValidateHtmlHandler();

export const config = { api: { bodyParser: { sizeLimit: '128kb' } } };
