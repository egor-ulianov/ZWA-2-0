import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const dockerfile = await readFile(path.join(root, 'Dockerfile'), 'utf8');
const checks = [
  [
    'pinned Node 20 Alpine build stages',
    /FROM node:20-alpine AS dependencies[\s\S]*FROM node:20-alpine AS builder[\s\S]*FROM node:20-alpine AS runner/,
  ],
  ['reproducible dependency install', /npm ci --no-audit --no-fund/],
  ['production-only runtime dependencies', /npm ci --omit=dev --no-audit --no-fund/],
  ['non-root runtime user', /addgroup --system[\s\S]*adduser --system[\s\S]*USER app/],
  ['healthcheck probes the application health route', /HEALTHCHECK[\s\S]*\/api\/health/],
  [
    'runtime receives only the built application',
    /COPY --from=builder --chown=app:app \/app\/\.next \.\/\.next/,
  ],
];
const failures = checks.filter(([, pattern]) => !pattern.test(dockerfile)).map(([name]) => name);

if (dockerfile.includes('USER root')) failures.push('Dockerfile explicitly switches back to root');

if (failures.length > 0) {
  console.error('Docker checks failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log('Dockerfile hardening and healthcheck checks passed.');
}
