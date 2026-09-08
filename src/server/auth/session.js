import crypto from 'node:crypto';
import { getServerEnv } from '../env.js';

const VERSION = 1;
const KINDS = new Set(['teacher', 'student']);

function encode(value) { return Buffer.from(value).toString('base64url'); }
function decode(value) {
  try { return Buffer.from(value, 'base64url').toString('utf8'); } catch { return null; }
}
function secretFor(kind) {
  const env = getServerEnv();
  return kind === 'teacher' ? env.teacherCookieSecret : env.studentCookieSecret;
}
function signature(payload, secret) { return crypto.createHmac('sha256', secret).update(payload).digest(); }

export function createSessionToken({ kind, subject, issuedAt, expiresAt, sessionId = crypto.randomUUID() }) {
  if (!KINDS.has(kind) || typeof subject !== 'string' || !subject || !Number.isInteger(issuedAt) || !Number.isInteger(expiresAt) || expiresAt <= issuedAt) {
    throw new TypeError('Invalid session payload');
  }
  const payload = encode(JSON.stringify({ v: VERSION, k: kind, s: subject, iat: issuedAt, exp: expiresAt, sid: sessionId }));
  return `${payload}.${signature(payload, secretFor(kind)).toString('base64url')}`;
}

export function verifySessionToken(token, expectedKind, { now = Math.floor(Date.now() / 1000) } = {}) {
  if (!KINDS.has(expectedKind) || typeof token !== 'string') return null;
  const [payload, signaturePart, extra] = token.split('.');
  if (!payload || !signaturePart || extra) return null;
  const expected = signature(payload, secretFor(expectedKind));
  let actual;
  try { actual = Buffer.from(signaturePart, 'base64url'); } catch { return null; }
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;
  let parsed;
  try { parsed = JSON.parse(decode(payload)); } catch { return null; }
  if (!parsed || parsed.v !== VERSION || parsed.k !== expectedKind || typeof parsed.s !== 'string' || typeof parsed.sid !== 'string'
    || !Number.isInteger(parsed.iat) || !Number.isInteger(parsed.exp) || parsed.exp <= now || parsed.exp <= parsed.iat) return null;
  return { version: parsed.v, kind: parsed.k, subject: parsed.s, issuedAt: parsed.iat, expiresAt: parsed.exp, sessionId: parsed.sid };
}

export function cookieName(kind, nodeEnv = getServerEnv().nodeEnv) {
  return nodeEnv === 'production' ? `__Host-${kind}_session` : `${kind}_session`;
}

export function serializeSessionCookie(kind, token, maxAge) {
  const env = getServerEnv();
  return `${cookieName(kind, env.nodeEnv)}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${env.nodeEnv === 'production' ? '; Secure' : ''}`;
}

export function clearSessionCookie(kind) {
  const env = getServerEnv();
  return `${cookieName(kind, env.nodeEnv)}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${env.nodeEnv === 'production' ? '; Secure' : ''}`;
}
