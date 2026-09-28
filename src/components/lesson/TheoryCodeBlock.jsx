import React, { Children, isValidElement } from 'react';
import SyntaxCodeEditor from '../exercises/SyntaxCodeEditor.jsx';

function textContent(node) {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textContent).join('');
  if (isValidElement(node)) return textContent(node.props.children);
  return '';
}

function languageFromClassName(className) {
  const match = String(className || '').match(/(?:^|\s)language-([\w-]+)/);
  return match?.[1] || 'text';
}

/**
 * Read-only CodeMirror presentation for code used in lecture theory.
 * It deliberately shares the same language extensions as student editors so
 * lecture examples and exercises teach the same visual grammar.
 */
export default function TheoryCodeBlock({ children }) {
  const codeElement = Children.toArray(children).find(isValidElement);
  const language = languageFromClassName(codeElement?.props?.className);
  const value = textContent(codeElement?.props?.children ?? children);
  const lineCount = Math.max(1, value.split('\n').length);
  const minHeight = `${Math.min(520, Math.max(112, lineCount * 20 + 28))}px`;

  return (
    <div
      data-theory-code-block="true"
      data-language={language}
      className="my-3 overflow-hidden rounded-lg border border-zinc-700/70 bg-zinc-950 shadow-inner"
    >
      <div className="theory-code-editor">
        <SyntaxCodeEditor
          value={value}
          language={language}
          label={`Teoretická ukázka ${language}`}
          minHeight={minHeight}
          editable={false}
          readOnly
        />
      </div>
      <pre className="theory-code-projector-fallback" aria-hidden="true">
        {value}
      </pre>
    </div>
  );
}
