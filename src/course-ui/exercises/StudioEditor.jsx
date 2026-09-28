import { useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { javascript } from '@codemirror/lang-javascript';
import { StreamLanguage } from '@codemirror/language';
import { EditorView } from '@codemirror/view';

import styles from './exercise.module.css';

const PHP_STREAM_PARSER = {
  startState: () => ({ inPhp: false, inBlockComment: false }),
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
    if (state.inPhp && stream.match(/^\?>/)) {
      state.inPhp = false;
      return 'meta';
    }
    if (!state.inPhp) {
      if (stream.match(/^<\/?[a-z][\w:-]*/i)) return 'typeName';
      if (stream.match(/^<!DOCTYPE\b[^>]*>/i)) return 'meta';
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
        /^(?:class|function|return|if|else|elseif|foreach|as|new|echo|true|false|null|const|public|private|protected|array)\b/,
      )
    ) {
      return 'keyword';
    }
    if (stream.match(/^\d+(?:\.\d+)?/)) return 'number';
    if (stream.match(/^(?:===|!==|==|!=|=>|<=|>=|&&|\|\||[=+*/!<>?:.-])/)) return 'operator';
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

const phpLanguage = StreamLanguage.define(PHP_STREAM_PARSER);
const shellLanguage = StreamLanguage.define(SHELL_STREAM_PARSER);

const LANGUAGE_EXTENSIONS = Object.freeze({
  css,
  html,
  js: javascript,
  javascript,
  php: () => phpLanguage.extension,
  bash: () => shellLanguage.extension,
  sh: () => shellLanguage.extension,
  text: () => [],
});

export const SUPPORTED_STUDIO_LANGUAGES = Object.freeze(Object.keys(LANGUAGE_EXTENSIONS));

export function normalizeStudioLanguage(value) {
  const normalized = String(value || 'text').toLowerCase();
  if (normalized === 'shell') return 'bash';
  return Object.hasOwn(LANGUAGE_EXTENSIONS, normalized) ? normalized : 'text';
}

export default function StudioEditor({
  value,
  onChange,
  language = 'text',
  label = 'Editor kódu',
  minHeight = '20rem',
  readOnly = false,
}) {
  const normalizedLanguage = normalizeStudioLanguage(language);
  const extensions = useMemo(() => {
    const languageExtension = LANGUAGE_EXTENSIONS[normalizedLanguage];
    return [
      languageExtension(),
      EditorView.contentAttributes.of({
        'aria-label': label,
        'aria-multiline': 'true',
      }),
    ];
  }, [label, normalizedLanguage]);

  return (
    <div
      className={styles.editor}
      data-studio-editor="true"
      data-language={normalizedLanguage}
      data-read-only={readOnly ? 'true' : undefined}
    >
      <CodeMirror
        value={String(value ?? '')}
        minHeight={minHeight}
        theme="dark"
        extensions={extensions}
        onChange={onChange}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLine: true,
          bracketMatching: true,
          foldGutter: false,
        }}
        indentWithTab
        editable={!readOnly}
        readOnly={readOnly}
      />
    </div>
  );
}
