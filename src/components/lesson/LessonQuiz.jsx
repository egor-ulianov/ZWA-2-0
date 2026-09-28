import React, { useMemo, useState } from 'react';

import { clsx } from './classNames.js';

const VISUAL_LABELS = Object.freeze({
  'html-structure': 'Mapa sémantické struktury HTML dokumentu',
  'css-specificity': 'Stupnice CSS specificity',
  'css-layout': 'Diagram CSS box modelu a layoutu',
  'javascript-event-loop': 'Tok události v JavaScriptu',
  'javascript-dom-ajax': 'Tok DOM a AJAX požadavku',
});

function VisualFrame({ visualKey, children }) {
  return (
    <div
      data-quiz-visual={visualKey}
      role="img"
      aria-label={VISUAL_LABELS[visualKey] || 'Výuková ilustrace'}
      className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/75 p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/80"
    >
      {children}
    </div>
  );
}

function HtmlStructureVisual() {
  return (
    <VisualFrame visualKey="html-structure">
      <div className="mb-3 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
        <span>Struktura dokumentu</span>
        <span className="font-mono normal-case tracking-normal text-indigo-600 dark:text-indigo-300">
          index.html
        </span>
      </div>
      <div className="space-y-2 font-mono text-xs">
        <div className="rounded-lg border border-indigo-300/70 bg-indigo-50 px-3 py-2 text-indigo-900 dark:border-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-200">
          &lt;html&gt;
        </div>
        <div className="ml-4 grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-sky-300/70 bg-sky-50 px-3 py-2 text-sky-900 dark:border-sky-700 dark:bg-sky-950/50 dark:text-sky-200">
            &lt;head&gt;
          </div>
          <div className="rounded-lg border border-emerald-300/70 bg-emerald-50 px-3 py-2 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200">
            &lt;body&gt;
          </div>
        </div>
        <div className="ml-8 grid grid-cols-3 gap-2">
          {['header', 'main', 'footer'].map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-center text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              &lt;{tag}&gt;
            </span>
          ))}
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
        Význam elementu pomáhá čtenáři i prohlížeči pochopit stránku.
      </p>
    </VisualFrame>
  );
}

function CssSpecificityVisual() {
  const levels = [
    { label: 'element', value: '1', width: '24%', color: 'bg-sky-400' },
    { label: '.class', value: '10', width: '48%', color: 'bg-indigo-500' },
    { label: '#id', value: '100', width: '82%', color: 'bg-violet-600' },
  ];

  return (
    <VisualFrame visualKey="css-specificity">
      <div className="mb-3 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
        <span>Specificita</span>
        <span className="font-mono normal-case tracking-normal">kdo vyhraje?</span>
      </div>
      <div className="space-y-3">
        {levels.map((level) => (
          <div key={level.label} className="grid grid-cols-[4.5rem_1fr_2rem] items-center gap-2">
            <span className="font-mono text-xs text-zinc-600 dark:text-zinc-300">
              {level.label}
            </span>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className={clsx('h-full rounded-full', level.color)}
                style={{ width: level.width }}
              />
            </div>
            <span className="text-right font-mono text-xs font-semibold text-zinc-700 dark:text-zinc-200">
              {level.value}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 font-mono text-xs text-violet-900 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-200">
        #title &gt; .title &gt; h1
      </div>
    </VisualFrame>
  );
}

function CssLayoutVisual() {
  return (
    <VisualFrame visualKey="css-layout">
      <div className="mb-3 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
        <span>Box model</span>
        <span className="font-mono normal-case tracking-normal">layout.css</span>
      </div>
      <div className="mx-auto max-w-[15rem] rounded-xl border-2 border-amber-400 bg-amber-50 p-2 dark:bg-amber-950/30">
        <div className="rounded-lg border-2 border-orange-400 bg-orange-50 p-2 dark:bg-orange-950/30">
          <div className="rounded-md border-2 border-emerald-400 bg-emerald-50 p-3 text-center font-mono text-xs text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
            content
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide">
        <span className="rounded bg-amber-100 px-1.5 py-1 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200">
          margin
        </span>
        <span className="rounded bg-orange-100 px-1.5 py-1 text-orange-800 dark:bg-orange-950/60 dark:text-orange-200">
          border
        </span>
        <span className="rounded bg-emerald-100 px-1.5 py-1 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200">
          padding
        </span>
      </div>
    </VisualFrame>
  );
}

function JavaScriptEventLoopVisual() {
  return (
    <VisualFrame visualKey="javascript-event-loop">
      <div className="mb-3 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
        <span>Smyčka událostí</span>
        <span className="font-mono normal-case tracking-normal">klik → změna</span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-1.5 text-center text-[10px] font-semibold">
        <span className="rounded-lg border border-indigo-300 bg-indigo-50 px-2 py-3 text-indigo-900 dark:border-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-200">
          zásobník volání
        </span>
        <span className="font-mono text-zinc-400" aria-hidden="true">
          →
        </span>
        <span className="rounded-lg border border-amber-300 bg-amber-50 px-2 py-3 text-amber-900 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-200">
          fronta událostí
        </span>
        <span className="font-mono text-zinc-400" aria-hidden="true">
          →
        </span>
        <span className="rounded-lg border border-emerald-300 bg-emerald-50 px-2 py-3 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200">
          DOM
        </span>
      </div>
      <p className="mt-3 font-mono text-xs text-zinc-500 dark:text-zinc-400">
        {"button.addEventListener('click', handler)"}
      </p>
    </VisualFrame>
  );
}

function JavaScriptDomAjaxVisual() {
  return (
    <VisualFrame visualKey="javascript-dom-ajax">
      <div className="mb-3 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
        <span>DOM + AJAX</span>
        <span className="font-mono normal-case tracking-normal">asynchronně</span>
      </div>
      <div className="relative flex items-center justify-between gap-2">
        <div className="w-1/3 rounded-lg border border-sky-300 bg-sky-50 px-2 py-3 text-center font-mono text-xs text-sky-900 dark:border-sky-700 dark:bg-sky-950/50 dark:text-sky-200">
          DOM
        </div>
        <div className="flex flex-1 flex-col items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400">
          <span className="font-mono">fetch()</span>
          <span className="h-px w-full bg-zinc-300 dark:bg-zinc-700" />
          <span>JSON</span>
        </div>
        <div className="w-1/3 rounded-lg border border-violet-300 bg-violet-50 px-2 py-3 text-center font-mono text-xs text-violet-900 dark:border-violet-700 dark:bg-violet-950/50 dark:text-violet-200">
          server
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
        Rozhraní se změní až po příchodu odpovědi.
      </p>
    </VisualFrame>
  );
}

function QuizVisual({ visualKey }) {
  switch (visualKey) {
    case 'html-structure':
      return <HtmlStructureVisual />;
    case 'css-specificity':
      return <CssSpecificityVisual />;
    case 'css-layout':
      return <CssLayoutVisual />;
    case 'javascript-event-loop':
      return <JavaScriptEventLoopVisual />;
    case 'javascript-dom-ajax':
      return <JavaScriptDomAjaxVisual />;
    default:
      return null;
  }
}

function defaultResultMessage(score, total) {
  const ratio = total > 0 ? score / total : 0;
  if (ratio === 1) return 'Perfektní výsledek — můžete pokračovat dál.';
  if (ratio >= 0.7) return 'Dobrá práce — ještě si projděte označené odpovědi.';
  return 'Vraťte se k teorii a zkuste si otázky ještě jednou.';
}

export default function LessonQuiz({
  title,
  subtitle,
  questions,
  visualKey,
  resultMessage = defaultResultMessage,
  resources = [],
}) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const total = questions.length;
  const answered = Object.keys(answers).length;
  const score = useMemo(
    () =>
      questions.reduce(
        (acc, question) => acc + (answers[question.id] === question.correctIndex ? 1 : 0),
        0,
      ),
    [answers, questions],
  );

  function selectAnswer(questionId, optionIndex) {
    if (submitted) return;
    setAnswers((current) => ({ ...current, [questionId]: optionIndex }));
  }

  function reset() {
    setAnswers({});
    setSubmitted(false);
  }

  const progress = total > 0 ? Math.round((answered / total) * 100) : 0;

  return (
    <section
      data-lesson-quiz
      aria-label={`Kvíz: ${title}`}
      className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-zinc-50 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="grid gap-5 border-b border-zinc-200/80 bg-white/80 p-5 dark:border-zinc-800 dark:bg-zinc-900/70 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,22rem)] lg:p-6">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700 dark:text-indigo-300">
              <span className="h-2 w-2 rounded-full bg-indigo-500" aria-hidden="true" />
              Rychlá kontrola
            </span>
            <span
              data-quiz-progress
              className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 font-mono text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            >
              {answered} / {total} zodpovězeno
            </span>
          </div>
          <h3 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              {subtitle}
            </p>
          )}
          <div
            className="mt-5 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
            aria-hidden="true"
          >
            <div
              className="h-full rounded-full bg-indigo-600 transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <QuizVisual visualKey={visualKey} />
      </div>

      <div className="space-y-4 p-5 lg:p-6">
        {questions.map((question, questionIndex) => {
          const selected = answers[question.id];
          const hasAnswer = Number.isInteger(selected);
          const isCorrect = hasAnswer && selected === question.correctIndex;
          return (
            <fieldset
              key={question.id}
              className={clsx(
                'rounded-2xl border bg-white p-4 transition-colors dark:bg-zinc-900',
                submitted
                  ? isCorrect
                    ? 'border-emerald-300 dark:border-emerald-800'
                    : 'border-rose-300 dark:border-rose-800'
                  : 'border-zinc-200/90 dark:border-zinc-800',
              )}
            >
              <legend className="flex w-full items-start gap-3 px-1 text-sm font-semibold leading-6 text-zinc-900 dark:text-zinc-100">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 font-mono text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  {String(questionIndex + 1).padStart(2, '0')}
                </span>
                <span>{question.text}</span>
              </legend>
              <div
                className="mt-4 grid gap-2"
                role="radiogroup"
                aria-label={`Odpovědi pro otázku ${questionIndex + 1}`}
              >
                {question.options.map((option, optionIndex) => {
                  const active = selected === optionIndex;
                  const correct = submitted && optionIndex === question.correctIndex;
                  const wrong = submitted && active && !correct;
                  return (
                    <label
                      key={optionIndex}
                      data-quiz-option
                      className={clsx(
                        'flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 text-sm transition-colors',
                        submitted
                          ? 'cursor-default'
                          : 'hover:border-indigo-300 hover:bg-indigo-50/60 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/30',
                        correct
                          ? 'border-emerald-400 bg-emerald-50 text-emerald-950 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-100'
                          : wrong
                            ? 'border-rose-400 bg-rose-50 text-rose-950 dark:border-rose-700 dark:bg-rose-950/40 dark:text-rose-100'
                            : active
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-950 dark:border-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-100'
                              : 'border-zinc-200 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
                      )}
                    >
                      <input
                        type="radio"
                        name={`lesson-quiz-${question.id}`}
                        value={optionIndex}
                        checked={active}
                        onChange={() => selectAnswer(question.id, optionIndex)}
                        disabled={submitted}
                        className="sr-only"
                      />
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-current/30 font-mono text-xs font-semibold">
                        {String.fromCharCode(65 + optionIndex)}
                      </span>
                      <span className="min-w-0 flex-1 leading-6">{option}</span>
                      {submitted && correct && (
                        <span className="font-semibold text-emerald-600 dark:text-emerald-300">
                          ✓
                        </span>
                      )}
                      {submitted && wrong && (
                        <span className="font-semibold text-rose-600 dark:text-rose-300">×</span>
                      )}
                    </label>
                  );
                })}
              </div>
              {submitted && (
                <div
                  role="status"
                  className={clsx(
                    'mt-3 rounded-lg px-3 py-2 text-xs leading-5',
                    isCorrect
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
                      : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200',
                  )}
                >
                  {isCorrect
                    ? 'Správně.'
                    : `Správná odpověď: ${String.fromCharCode(65 + question.correctIndex)}.`}{' '}
                  {question.hint && (
                    <span className="text-zinc-600 dark:text-zinc-400">{question.hint}</span>
                  )}
                </div>
              )}
            </fieldset>
          );
        })}

        {!submitted ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200/80 pt-4 dark:border-zinc-800">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Vyberte odpověď u každé otázky a potom kvíz vyhodnoťte.
            </p>
            <button
              type="button"
              className="rounded-xl bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              onClick={() => setSubmitted(true)}
            >
              Vyhodnotit kvíz
            </button>
          </div>
        ) : (
          <div
            data-quiz-result
            className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-950/40"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-indigo-700 px-3 py-2 text-center text-white">
                <div className="font-mono text-2xl font-bold leading-none">
                  {score}/{total}
                </div>
                <div className="mt-1 text-[10px] uppercase tracking-wide text-indigo-100">
                  skóre
                </div>
              </div>
              <div>
                <p className="font-semibold text-indigo-950 dark:text-indigo-100">
                  {Math.round((score / Math.max(total, 1)) * 100)} % správně
                </p>
                <p className="mt-1 text-sm text-indigo-800 dark:text-indigo-200">
                  {resultMessage(score, total)}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="rounded-xl border border-indigo-300 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-800 transition-colors hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-indigo-700 dark:bg-zinc-900 dark:text-indigo-200 dark:hover:bg-indigo-950/60"
              onClick={reset}
            >
              Zkusit znovu
            </button>
          </div>
        )}

        {resources.length > 0 && (
          <div className="border-t border-zinc-200/80 pt-4 text-xs leading-5 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
              Doporučené zdroje:
            </span>{' '}
            {resources.map((resource, index) => (
              <React.Fragment key={resource.href}>
                {index > 0 && <span aria-hidden="true"> · </span>}
                <a
                  href={resource.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-700 underline decoration-indigo-300 underline-offset-2 hover:text-indigo-900 dark:text-indigo-300 dark:decoration-indigo-700 dark:hover:text-indigo-100"
                >
                  {resource.label}
                </a>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
