import { highlightCode } from '../code/highlightCode.js';
import { getCodeLanguageLabel } from '../code/languages.js';
import styles from './content.module.css';

export default function EditorialCode({ children, language, label }) {
  const highlightedCode = highlightCode(children, language);
  const languageLabel = getCodeLanguageLabel(highlightedCode.language);

  return (
    <figure
      className={styles.codeFigure}
      data-code-highlight={highlightedCode.highlighted ? 'true' : undefined}
      data-language={highlightedCode.language || undefined}
    >
      {label ? <figcaption>{label}</figcaption> : null}
      <pre aria-label={`Ukázka kódu ${languageLabel}`} tabIndex={0}>
        <code>
          {highlightedCode.tokens.map((token, index) =>
            token.className ? (
              <span className={token.className} key={`${index}-${token.className}`}>
                {token.text}
              </span>
            ) : (
              token.text
            ),
          )}
        </code>
      </pre>
    </figure>
  );
}
