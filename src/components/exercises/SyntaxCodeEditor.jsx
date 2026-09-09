import React, { useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { javascript } from '@codemirror/lang-javascript';
import { StreamLanguage } from '@codemirror/language';
import { EditorView } from '@codemirror/view';

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

const phpLanguage = StreamLanguage.define(PHP_STREAM_PARSER);

const LANGUAGE_EXTENSIONS = Object.freeze({
  css,
  html,
  js: javascript,
  javascript,
  php: () => phpLanguage.extension,
});

export default function SyntaxCodeEditor({
  value,
  onChange,
  language = 'css',
  label,
  minHeight = '450px',
  editable = true,
  readOnly = false,
}) {
  const extensions = useMemo(() => {
    const languageExtension = LANGUAGE_EXTENSIONS[language] || css;
    return [
      languageExtension(),
      EditorView.contentAttributes.of({
        'aria-label': label,
        'aria-multiline': 'true',
      }),
    ];
  }, [label, language]);

  return (
    <div data-code-editor="syntax" data-language={language}>
      <CodeMirror
        value={value}
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
        editable={editable}
        readOnly={readOnly}
        className="overflow-hidden rounded-xl border border-zinc-200/60 text-xs leading-5 dark:border-zinc-700"
      />
    </div>
  );
}
