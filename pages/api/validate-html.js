import crypto from 'node:crypto';

import {
  consumeSharedRateLimit,
  getRequestClientAddress,
  rateLimitKey,
  RateLimitExceeded,
} from '../../src/server/rate-limit.js';

export const MAX_HTML_CHARS = 100_000;
export const MAX_VALIDATOR_MESSAGES = 100;
export const MAX_VALIDATOR_MESSAGE_CHARS = 2_000;
export const MAX_VALIDATOR_EXTRACT_CHARS = 4_000;
export const MAX_VALIDATOR_RESPONSE_BYTES = 256 * 1024;
const VALIDATOR_TIMEOUT_MS = 5_000;
const VALIDATOR_RATE_LIMIT = 30;
const VALIDATOR_MESSAGE_POSITIONS = ['firstLine', 'firstColumn', 'lastLine', 'lastColumn'];

function clientKey(req) {
  return rateLimitKey('validate-html', getRequestClientAddress(req));
}

class ValidatorResponseError extends Error {
  constructor(message = 'Invalid validator response') {
    super(message);
    this.name = 'ValidatorResponseError';
  }
}

function validatorMessageDto(message) {
  if (!message || typeof message !== 'object' || Array.isArray(message)) {
    throw new ValidatorResponseError();
  }
  if (typeof message.type !== 'string' || !message.type.trim() || message.type.length > 32
    || typeof message.message !== 'string' || !message.message.trim()
    || message.message.length > MAX_VALIDATOR_MESSAGE_CHARS) {
    throw new ValidatorResponseError();
  }
  const dto = { type: message.type, message: message.message };
  for (const field of VALIDATOR_MESSAGE_POSITIONS) {
    if (message[field] === undefined) continue;
    if (!Number.isInteger(message[field]) || message[field] < 0 || message[field] > MAX_HTML_CHARS) {
      throw new ValidatorResponseError();
    }
    dto[field] = message[field];
  }
  if (message.extract !== undefined) {
    if (typeof message.extract !== 'string' || message.extract.length > MAX_VALIDATOR_EXTRACT_CHARS) {
      throw new ValidatorResponseError();
    }
    dto.extract = message.extract;
  }
  return dto;
}

export function toValidatorResponseDto(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data) || !Array.isArray(data.messages)
    || data.messages.length > MAX_VALIDATOR_MESSAGES) {
    throw new ValidatorResponseError();
  }
  const dto = { messages: data.messages.map(validatorMessageDto) };
  if (Buffer.byteLength(JSON.stringify(dto), 'utf8') > MAX_VALIDATOR_RESPONSE_BYTES) {
    throw new ValidatorResponseError();
  }
  return dto;
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
      return res.status(200).json(toValidatorResponseDto(data));
    } catch (error) {
      return sendError(res, 502, 'HTML validation service unavailable', correlationId, error);
    } finally {
      clearTimeout(timeout);
    }
  };
}

export default createValidateHtmlHandler();

export const config = { api: { bodyParser: { sizeLimit: '128kb' } } };
