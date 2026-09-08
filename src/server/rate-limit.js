import { getDb } from './db.js';

export const RATE_LIMIT_DEFAULT_TIMEOUT_MS = 1_000;
const KEY = /^[A-Za-z0-9:_./-]{1,128}$/;

export class RateLimitExceeded extends Error {
  constructor(message = 'Request limit exceeded') {
    super(message);
    this.name = 'RateLimitExceeded';
    this.code = 'RATE_LIMITED';
  }
}

export class RateLimitUnavailable extends Error {
  constructor(message = 'Rate limiting unavailable') {
    super(message);
    this.name = 'RateLimitUnavailable';
    this.code = 'RATE_LIMIT_UNAVAILABLE';
  }
}

function validateRateLimitInput({ key, limit, windowMs, now, timeoutMs }) {
  if (typeof key !== 'string' || !KEY.test(key)) throw new TypeError('Invalid rate-limit key');
  if (!Number.isInteger(limit) || limit < 1 || limit > 100_000) throw new TypeError('Invalid rate-limit limit');
  if (!Number.isInteger(windowMs) || windowMs < 1_000 || windowMs > 86_400_000) throw new TypeError('Invalid rate-limit window');
  if (!Number.isFinite(now) || now < 0) throw new TypeError('Invalid rate-limit time');
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 5_000) throw new TypeError('Invalid rate-limit timeout');
}

function withTimeout(promise, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new RateLimitUnavailable()), timeoutMs);
    promise.then(resolve, reject).finally(() => clearTimeout(timer));
  });
}

export async function consumeSharedRateLimit({
  key,
  limit,
  windowMs,
  now = Date.now(),
  timeoutMs = RATE_LIMIT_DEFAULT_TIMEOUT_MS,
  sql,
} = {}) {
  validateRateLimitInput({ key, limit, windowMs, now, timeoutMs });
  const database = sql || getDb();
  if (typeof database !== 'function') throw new RateLimitUnavailable();
  const windowStart = new Date(Math.floor(now / windowMs) * windowMs).toISOString();
  let rows;
  try {
    rows = await withTimeout(database(
      `insert into rate_limit_buckets (bucket_key, window_start, request_count)
       values ($1, $2, 1)
       on conflict (bucket_key, window_start) do update
         set request_count = rate_limit_buckets.request_count + 1, updated_at = now()
       returning request_count`,
      [key, windowStart],
    ), timeoutMs);
  } catch (error) {
    if (error instanceof RateLimitUnavailable) throw error;
    throw new RateLimitUnavailable();
  }
  const requestCount = Number(rows?.[0]?.request_count);
  if (!Number.isInteger(requestCount) || requestCount < 1) throw new RateLimitUnavailable();
  if (requestCount > limit) throw new RateLimitExceeded();
  return { allowed: true, remaining: Math.max(0, limit - requestCount) };
}

export function rateLimitKey(scope, subject) {
  const key = `${scope}:${subject}`;
  if (!KEY.test(key)) throw new TypeError('Invalid rate-limit key');
  return key;
}
