import { getServerEnv } from '../env.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function requireSameOrigin(req) {
  if (SAFE_METHODS.has(req.method || 'GET')) return true;
  const expected = getServerEnv().appOrigin;
  if (!expected) return false;
  const origin = req.headers?.origin;
  return typeof origin === 'string' && origin === expected;
}
