import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { javascript } from '@codemirror/lang-javascript';
import { StreamLanguage } from '@codemirror/language';

const PHP_STREAM_PARSER = {
  startState: () => ({ inPhp: true, inBlockComment: false }),
  token(stream, state) {
    if (state.inBlockComment) {
      if (stream.match(/.*?\*\//)) state.inBlockComment = false;
      else stream.skipToEnd();
      return 'comment';
    }
    if (stream.match(/^<\?(?:php|=)?/i)) {
      state.inPhp = true;
      return 'meta';
    }
    if (
      state.inPhp &&
      stream.sol() &&
      stream.match(
        /^<(?:!DOCTYPE|!--|html\b|head\b|body\b|form\b|label\b|input\b|button\b|div\b|p\b|a\b)/i,
      )
    ) {
      state.inPhp = false;
      return 'typeName';
    }
    if (state.inPhp && stream.match(/^\?>/)) {
      state.inPhp = false;
      return 'meta';
    }
    if (!state.inPhp) {
      if (stream.match(/^<\/?[a-z][\w:-]*/i)) return 'typeName';
      if (stream.match(/^<!DOCTYPE\b[^>]*>/i)) return 'meta';
      if (stream.match(/^[a-z_:][-\w:.]*(?=\s*=)/i)) return 'propertyName';
      stream.next();
      return null;
    }
    if (stream.match(/^\/\*/)) {
      state.inBlockComment = true;
      return 'comment';
    }
    if (stream.match(/^\/\/.*|^#.*|^\/\*.*\*\//)) return 'comment';
    if (stream.match(/^'(?:\\.|[^'\\])*'|^"(?:\\.|[^"\\])*"/)) return 'string';
    if (stream.match(/^\$[A-Za-z_][\w]*/)) return 'variableName';
    if (
      stream.match(
        /^(?:abstract|array|as|break|case|catch|class|clone|const|continue|declare|default|do|echo|else|elseif|empty|enum|extends|false|final|finally|fn|for|foreach|function|if|implements|include|include_once|instanceof|interface|isset|match|namespace|new|null|private|protected|public|readonly|require|require_once|return|static|strict_types|switch|throw|trait|true|try|use|while|yield)\b/,
      )
    ) {
      return 'keyword';
    }
    if (stream.match(/^\d+(?:\.\d+)?/)) return 'number';
    if (stream.match(/^(?:===|!==|==|!=|=>|->|::|\?\?|<=|>=|&&|\|\||[=+*/!<>?:.-])/)) {
      return 'operator';
    }
    stream.next();
    return null;
  },
};

const SHELL_STREAM_PARSER = {
  startState: () => ({}),
  token(stream) {
    if (stream.sol() && stream.match(/^\s*#.*/)) return 'comment';
    if (stream.match(/^#.*/)) return 'comment';
    if (stream.match(/^'(?:\\.|[^'\\])*'|^"(?:\\.|[^"\\])*"/)) return 'string';
    if (
      stream.match(
        /^(?:sudo|ssh|scp|cd|ls|pwd|mkdir|touch|cat|grep|ping|traceroute|telnet|nslookup|ifconfig|chmod|php)\b/,
      )
    ) {
      return 'keyword';
    }
    if (stream.match(/^\$[A-Za-z_][\w]*/)) return 'variableName';
    if (stream.match(/^(?:\|\||&&|>>|>|<|=)/)) return 'operator';
    stream.next();
    return null;
  },
};

const PHP_LANGUAGE = StreamLanguage.define(PHP_STREAM_PARSER);
const SHELL_LANGUAGE = StreamLanguage.define(SHELL_STREAM_PARSER);

const LANGUAGE_SUPPORT = Object.freeze({
  css: css(),
  html: html(),
  js: javascript(),
  javascript: javascript(),
  php: PHP_LANGUAGE,
  bash: SHELL_LANGUAGE,
  sh: SHELL_LANGUAGE,
  text: null,
});

export const SUPPORTED_CODE_LANGUAGES = Object.freeze(Object.keys(LANGUAGE_SUPPORT));

export function normalizeCodeLanguage(value) {
  const normalized = String(value || 'text').toLowerCase();
  if (normalized === 'shell') return 'bash';
  return Object.hasOwn(LANGUAGE_SUPPORT, normalized) ? normalized : 'text';
}

export function getCodeLanguageExtension(value) {
  const support = LANGUAGE_SUPPORT[normalizeCodeLanguage(value)];
  return support?.extension || [];
}

export function getCodeLanguageParser(value) {
  const support = LANGUAGE_SUPPORT[normalizeCodeLanguage(value)];
  return support?.language?.parser || support?.parser || null;
}

export function getCodeLanguageLabel(value) {
  const language = normalizeCodeLanguage(value);
  return {
    bash: 'shell',
    css: 'CSS',
    html: 'HTML',
    javascript: 'JavaScript',
    js: 'JavaScript',
    php: 'PHP',
    sh: 'shell',
    text: 'text',
  }[language];
}
