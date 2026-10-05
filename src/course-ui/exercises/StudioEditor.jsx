import { useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { EditorView } from '@codemirror/view';

import {
  getCodeLanguageExtension,
  normalizeCodeLanguage,
  SUPPORTED_CODE_LANGUAGES,
} from '../code/languages.js';
import styles from './exercise.module.css';

export const SUPPORTED_STUDIO_LANGUAGES = SUPPORTED_CODE_LANGUAGES;

export function normalizeStudioLanguage(value) {
  return normalizeCodeLanguage(value);
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
    return [
      getCodeLanguageExtension(normalizedLanguage),
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
