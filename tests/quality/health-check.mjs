import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const healthRoute = await readFile(path.join(root, 'pages/api/health.js'), 'utf8');
const contractChecks = [
  ['GET-only method guard', /req\.method !== 'GET'/],
  ['configuration failure response', /status\(503\)\.json\(\{ ok: false \}\)/],
  ['database connectivity probe', /select 1/],
  ['healthy response body', /status\(200\)\.json\(\{ ok: true \}\)/],
];
const failures = contractChecks
  .filter(([, pattern]) => !pattern.test(healthRoute))
  .map(([name]) => name);

const liveUrl = process.env.QUALITY_HEALTH_URL;
if (liveUrl) {
  try {
    const response = await fetch(liveUrl, { signal: AbortSignal.timeout(5_000) });
    if (!response.ok) failures.push(`live health endpoint returned HTTP ${response.status}`);
    else {
      const body = await response.json();
      if (body?.ok !== true) failures.push('live health endpoint did not return { ok: true }');
    }
  } catch (error) {
    failures.push(`live health endpoint could not be reached: ${error.message}`);
  }
}

if (failures.length > 0) {
  console.error('Health checks failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else if (liveUrl) {
  console.log(`Live health check passed: ${liveUrl}`);
} else {
  console.log('Health endpoint contract passed; set QUALITY_HEALTH_URL for a live probe.');
}
