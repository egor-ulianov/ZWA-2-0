import React, { useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { EditorView } from '@codemirror/view';

const LANGUAGE_EXTENSIONS = Object.freeze({
  css,
  html,
});

export default function SyntaxCodeEditor({
  value,
  onChange,
  language = 'css',
  label,
  minHeight = '450px',
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
      className="overflow-hidden rounded-xl border border-zinc-200/60 text-xs leading-5 dark:border-zinc-700"
    />
  );
}
