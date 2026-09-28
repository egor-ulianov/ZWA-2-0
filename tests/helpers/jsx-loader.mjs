import { readFile } from 'node:fs/promises';

import ts from 'typescript';

const NEXT_ENTRYPOINTS = new Map([
  ['next/head', 'next/head.js'],
  ['next/link', 'next/link.js'],
]);

export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'next/image') {
    return {
      shortCircuit: true,
      url: new URL('./next-image.mjs', import.meta.url).href,
    };
  }
  return nextResolve(NEXT_ENTRYPOINTS.get(specifier) || specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.endsWith('.css')) {
    return {
      format: 'module',
      shortCircuit: true,
      source: 'export default new Proxy({}, { get: (_target, property) => String(property) });',
    };
  }

  if (url.endsWith('.jsx')) {
    const source = await readFile(new URL(url), 'utf8');
    const result = ts.transpileModule(source, {
      compilerOptions: {
        allowJs: true,
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
      fileName: new URL(url).pathname,
    });
    return { format: 'module', shortCircuit: true, source: result.outputText };
  }

  return nextLoad(url, context);
}
