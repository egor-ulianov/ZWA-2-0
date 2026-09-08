import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { runMigrations } from './migrate.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export async function start({ migrate = runMigrations, spawnProcess = spawn } = {}) {
  await migrate();
  const nextBin = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next');
  const child = spawnProcess(process.execPath, [nextBin, 'start'], {
    cwd: root,
    env: process.env,
    stdio: 'inherit',
  });
  child.on('exit', (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    else process.exitCode = code ?? 1;
  });
  return child;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  start().catch((error) => {
    console.error('Production startup aborted before Next could serve:', error.message);
    process.exitCode = 1;
  });
}
