import net from 'node:net';

import { getDb } from './db.js';

export const RATE_LIMIT_DEFAULT_TIMEOUT_MS = 1_000;
export const RATE_LIMIT_BUCKET_RETENTION_MS = 24 * 60 * 60 * 1_000;
export const LOGIN_IP_LIMIT = 30;
export const LOGIN_ACCOUNT_LIMIT = 10;
export const LOGIN_IP_WINDOW_MS = 60_000;
export const LOGIN_ACCOUNT_WINDOW_MS = 15 * 60_000;
const KEY = /^[A-Za-z0-9:_./-]{1,128}$/;
const SUBJECT = /^[A-Za-z0-9._-]{1,64}$/;

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

function normalizeIpAddress(value) {
  const address = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (net.isIP(address) === 0) return null;
  return address.startsWith('::ffff:') && net.isIP(address.slice(7)) === 4 ? address.slice(7) : address;
}

export function getConfiguredTrustedProxyIps(environment = process.env) {
  const configured = typeof environment.TRUSTED_PROXY_IPS === 'string'
    ? environment.TRUSTED_PROXY_IPS.split(',').map((value) => value.trim()).filter(Boolean)
    : [];
  return [...new Set(configured.map(normalizeIpAddress).filter(Boolean))];
}

export function getRequestClientAddress(req, { trustedProxyIps = getConfiguredTrustedProxyIps() } = {}) {
  const remoteAddress = normalizeIpAddress(req?.socket?.remoteAddress) || 'unknown';
  const trusted = new Set(
    (Array.isArray(trustedProxyIps) ? trustedProxyIps : [])
      .map(normalizeIpAddress)
      .filter(Boolean),
  );
  if (!trusted.has(remoteAddress)) return remoteAddress;
  const forwarded = req?.headers?.['x-forwarded-for'];
  const forwardedAddresses = (Array.isArray(forwarded) ? forwarded : [forwarded])
    .flatMap((value) => String(value || '').split(','))
    .map(normalizeIpAddress)
    .filter(Boolean);
  for (let index = forwardedAddresses.length - 1; index >= 0; index -= 1) {
    if (!trusted.has(forwardedAddresses[index])) return forwardedAddresses[index];
  }
  return forwardedAddresses[0] || remoteAddress;
}

export function normalizeRateLimitSubject(subject) {
  const normalized = typeof subject === 'string' ? subject.trim().toLowerCase() : '';
  if (SUBJECT.test(normalized)) return normalized;
  return 'invalid';
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
      `with expired_buckets as (
       delete from rate_limit_buckets
         where updated_at < $3
         returning bucket_key
       )
       insert into rate_limit_buckets (bucket_key, window_start, request_count)
       values ($1, $2, 1)
       on conflict (bucket_key, window_start) do update
         set request_count = rate_limit_buckets.request_count + 1, updated_at = now()
       returning request_count`,
      [key, windowStart, new Date(now - RATE_LIMIT_BUCKET_RETENTION_MS).toISOString()],
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
  if (typeof scope !== 'string' || typeof subject !== 'string') throw new TypeError('Invalid rate-limit key');
  const key = `${scope}:${subject}`;
  if (!KEY.test(key)) throw new TypeError('Invalid rate-limit key');
  return key;
}

export async function consumeLoginRateLimits({
  kind,
  clientAddress,
  account,
  includeIp = true,
  now = Date.now(),
  timeoutMs = RATE_LIMIT_DEFAULT_TIMEOUT_MS,
  sql,
  rateLimiter = consumeSharedRateLimit,
} = {}) {
  if (!['teacher', 'student'].includes(kind) || typeof clientAddress !== 'string' || !clientAddress.trim()) {
    throw new TypeError('Invalid login rate-limit input');
  }
  const limits = [];
  if (includeIp) {
    limits.push({
      key: rateLimitKey(`${kind}-login-ip`, clientAddress),
      limit: LOGIN_IP_LIMIT,
      windowMs: LOGIN_IP_WINDOW_MS,
    });
  }
  if (account !== undefined) {
    limits.push({
      key: rateLimitKey(`${kind}-login-account`, normalizeRateLimitSubject(account)),
      limit: LOGIN_ACCOUNT_LIMIT,
      windowMs: LOGIN_ACCOUNT_WINDOW_MS,
    });
  }
  for (const limit of limits) {
    await rateLimiter({ ...limit, now, timeoutMs, sql });
  }
}
