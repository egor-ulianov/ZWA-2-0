import { useMemo, useState } from 'react';

import styles from './exercise.module.css';

function defaultResultMessage(score, total) {
  if (total > 0 && score === total) return 'Všechny odpovědi jsou správně.';
  return 'Projdi označené odpovědi a zkus kontrolu znovu.';
}

export default function KnowledgeCheck({
  title,
  subtitle,
  questions = [],
  visual,
  resultMessage = defaultResultMessage,
  resources = [],
}) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const answered = Object.keys(answers).length;
  const total = questions.length;
  const gradedTotal = questions.filter((question) =>
    Number.isInteger(question.correctIndex),
  ).length;
  const score = useMemo(
    () =>
      questions.reduce(
        (sum, question) =>
          sum +
          (Number.isInteger(question.correctIndex) && answers[question.id] === question.correctIndex
            ? 1
            : 0),
        0,
      ),
    [answers, questions],
  );

  function select(questionId, optionIndex) {
    if (submitted) return;
    setAnswers((current) => ({ ...current, [questionId]: optionIndex }));
  }

  function reset() {
    setAnswers({});
    setSubmitted(false);
  }

  return (
    <section
      className={styles.knowledge}
      data-knowledge-check="true"
      data-lesson-quiz="true"
      aria-label={`Kvíz: ${title}`}
    >
      <header>
        <div>
          <p className={styles.eyebrow}>Rychlá kontrola</p>
          <h3>{title}</h3>
          {subtitle ? <p>{subtitle}</p> : null}
          <p className={styles.quizProgress} data-quiz-progress="true" aria-live="polite">
            {answered} z {total} zodpovězeno
          </p>
        </div>
        {visual ? <div className={styles.quizVisual}>{visual}</div> : null}
      </header>

      <div className={styles.questionList}>
        {questions.map((question, questionIndex) => {
          const selected = answers[question.id];
          return (
            <fieldset key={question.id}>
              <legend>
                <span>{String(questionIndex + 1).padStart(2, '0')}</span>
                {question.prompt || question.text}
              </legend>
              <div role="radiogroup" aria-label={`Odpovědi pro otázku ${questionIndex + 1}`}>
                {question.options.map((option, optionIndex) => {
                  const active = selected === optionIndex;
                  const graded = Number.isInteger(question.correctIndex);
                  const correct = submitted && graded && optionIndex === question.correctIndex;
                  const wrong = submitted && graded && active && !correct;
                  const state = correct
                    ? 'correct'
                    : wrong
                      ? 'incorrect'
                      : active
                        ? 'selected'
                        : 'idle';
                  return (
                    <label key={optionIndex} data-answer-state={state} data-quiz-option="true">
                      <input
                        type="radio"
                        name={`knowledge-${question.id}`}
                        checked={active}
                        onChange={() => select(question.id, optionIndex)}
                        disabled={submitted}
                      />
                      <span>{typeof option === 'string' ? option : option?.label}</span>
                      {correct ? <strong>✓ Správně</strong> : null}
                      {wrong ? <strong>× Nesprávně</strong> : null}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          );
        })}
      </div>

      <footer>
        {submitted ? (
          <>
            <p role="status">
              <strong>{gradedTotal ? `${score} z ${gradedTotal}` : 'Hotovo'}</strong>{' '}
              {resultMessage(score, gradedTotal)}
            </p>
            <button type="button" onClick={reset}>
              Zkusit znovu
            </button>
          </>
        ) : (
          <button type="button" onClick={() => setSubmitted(true)} disabled={answered !== total}>
            Ověřit odpovědi
          </button>
        )}
        {resources.length ? (
          <ul aria-label="Doporučené zdroje">
            {resources.map((resource) => (
              <li key={resource.href || resource.label}>
                <a href={resource.href}>{resource.label}</a>
              </li>
            ))}
          </ul>
        ) : null}
      </footer>
    </section>
  );
}
