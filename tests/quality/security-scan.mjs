import { execFileSync } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sourceRoots = ['pages/api', 'src/server', 'src/lib', 'scripts'];
const sourceExtensions = new Set(['.js', '.mjs', '.jsx', '.ts', '.tsx']);
const findings = [];

async function collectFiles(relativePath) {
  const absolutePath = path.join(root, relativePath);
  const stat = await readdir(absolutePath, { withFileTypes: true });
  const files = [];

  for (const entry of stat) {
    const entryPath = path.join(relativePath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(entryPath)));
    } else if (sourceExtensions.has(path.extname(entry.name))) {
      files.push(entryPath);
    }
  }

  return files;
}

function addFinding(message) {
  findings.push(message);
}

const sourceFiles = (await Promise.all(sourceRoots.map(collectFiles))).flat();
const secretPatterns = [
  /-----BEGIN (?:RSA|EC|OPENSSH|PRIVATE) KEY-----/,
  /\b(?:sk|ghp|github_pat)_[A-Za-z0-9_]{20,}/,
  /\b(?:api[_-]?key|password|secret|token)\b\s*[:=]\s*['"][^'"\n]{12,}['"]/i,
];
const unsafeCodePattern = /\b(?:eval|Function)\s*\(/;

for (const relativePath of sourceFiles) {
  const source = await readFile(path.join(root, relativePath), 'utf8');

  if (secretPatterns.some((pattern) => pattern.test(source))) {
    addFinding(`possible hard-coded secret in ${relativePath}`);
  }
  if (unsafeCodePattern.test(source)) {
    addFinding(`dynamic code execution in ${relativePath}`);
  }
}

const trackedFiles = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' })
  .split('\0')
  .filter(Boolean);
const trackedEnvironmentFiles = trackedFiles.filter((file) => {
  const name = path.basename(file);
  return name.startsWith('.env') && name !== '.env.example';
});

if (trackedEnvironmentFiles.length > 0) {
  addFinding(`tracked environment file(s): ${trackedEnvironmentFiles.join(', ')}`);
}

const nextConfig = await readFile(path.join(root, 'next.config.js'), 'utf8');
const requiredHeaders = [
  'Content-Security-Policy',
  'Permissions-Policy',
  'Referrer-Policy',
  'X-Content-Type-Options',
];

for (const header of requiredHeaders) {
  if (!nextConfig.includes(`key: '${header}'`)) {
    addFinding(`missing security header in next.config.js: ${header}`);
  }
}

if (findings.length > 0) {
  console.error('Static security scan failed:');
  for (const finding of findings) console.error(`- ${finding}`);
  process.exitCode = 1;
} else {
  console.log(`Static security scan passed for ${sourceFiles.length} source files.`);
}
