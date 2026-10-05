import { classHighlighter, highlightTree } from '@lezer/highlight';

import { getCodeLanguageParser, normalizeCodeLanguage } from './languages.js';

export function highlightCode(value, language) {
  const code = String(value ?? '');
  const normalizedLanguage = normalizeCodeLanguage(language);
  const parser = getCodeLanguageParser(normalizedLanguage);

  if (!parser || !code) {
    return { highlighted: false, language: normalizedLanguage, tokens: [{ text: code }] };
  }

  const tokens = [];
  let cursor = 0;
  highlightTree(parser.parse(code), classHighlighter, (from, to, className) => {
    if (from > cursor) tokens.push({ text: code.slice(cursor, from) });
    tokens.push({ className, text: code.slice(from, to) });
    cursor = to;
  });
  if (cursor < code.length) tokens.push({ text: code.slice(cursor) });

  return {
    highlighted: tokens.some((token) => token.className),
    language: normalizedLanguage,
    tokens,
  };
}
