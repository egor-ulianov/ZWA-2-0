import React, { useEffect, useMemo, useState } from 'react';
import memeImg from './src/interactive-zwa-6/image.png';
import JsSandbox from './src/components/playground/JsSandbox';
import { getJavaScriptDefinition } from './src/components/exercises/testDefinitions.js';
import { runExerciseTests } from './src/components/exercises/testRunner.js';
import SyntaxCodeEditor from './src/components/exercises/SyntaxCodeEditor.jsx';
import { getLessonByNumber } from './src/config/lessons.js';
import LessonShell, { useSlideNavigation } from './src/components/lesson/LessonShell.jsx';
import SharedSlideCard from './src/components/lesson/SlideCard.jsx';
import Code from './src/components/lesson/Code.jsx';
import { clsx } from './src/components/lesson/classNames.js';

function getJsTemplates(stepIndex) {
  const steps = [
    {
      title: '1) Proměnné a typy',
      desc: "Vytvořte proměnnou greeting s hodnotou 'Ahoj' a funkci double(n), která vrátí dvojnásobek. Exportujte je do exports.greeting a exports.double.",
      js: [
        '// Úkol: proměnná greeting a funkce double(n)',
        "// Tip: cokoliv chcete testovat, zveřejněte přes objekt 'exports'",
        '// TODO: deklarujte greeting a funkci double a nastavte exports.greeting, exports.double',
        '// Např.: exports.greeting = ...; exports.double = ...',
      ].join('\n'),
      dom: '<div class="text-xs text-zinc-500">(Tento krok DOM nevyužívá)</div>',
    },
    {
      title: '2) Funkce a podmínky',
      desc: "Napište funkci classify(n), která vrátí 'even' pro sudá čísla a 'odd' pro lichá. Exportujte jako exports.classify.",
      js: [
        '// Úkol: napište funkci classify(n)',
        "// - vrací 'even' pro sudá čísla a 'odd' pro lichá",
        "// - pro nečíselné vstupy vraťte 'n/a'",
        '// TODO: implementujte a zveřejněte přes exports.classify',
      ].join('\n'),
      dom: '<div class="text-xs text-zinc-500">(Tento krok DOM nevyužívá)</div>',
    },
    {
      title: '3) Cykly (for)',
      desc: 'Napište funkci sumTo(n), která pomocí cyklu for sečte čísla 1..n. Exportujte jako exports.sumTo.',
      js: [
        '// Úkol: napište funkci sumTo(n)',
        '// - použijte cyklus for',
        '// - sečtěte 1..n a výsledek vraťte',
        '// TODO: implementujte a zveřejněte přes exports.sumTo',
      ].join('\n'),
      dom: '<div class="text-xs text-zinc-500">(Tento krok DOM nevyužívá)</div>',
    },
    {
      title: '4) Pole a objekty',
      desc: 'Vytvořte funkci total(xs), která sečte pole čísel. Exportujte jako exports.total.',
      js: [
        '// Úkol: napište funkci total(xs)',
        '// - očekává pole čísel a vrací jejich součet',
        '// - lze použít reduce/map/for... dle vás',
        '// TODO: implementujte a zveřejněte přes exports.total',
      ].join('\n'),
      dom: '<div class="text-xs text-zinc-500">(Tento krok DOM nevyužívá)</div>',
    },
    {
      title: '5) DOM selektory',
      desc: "Vyberte #app a nastavte mu textContent na 'Hello JS'.",
      js: [
        '// Úkol: pomocí document.querySelector vyberte #app',
        "// TODO: nastavte elementu textContent na 'Hello JS'",
      ].join('\n'),
      dom: '<div id="app" class="rounded border p-2 text-sm">(sem napište text)</div>',
    },
    {
      title: '6) Události',
      desc: 'Přidejte na #btn click, který zvýší číslo ve #cnt o 1.',
      js: [
        '// Úkol: najděte #btn a #cnt',
        '// TODO: přidejte click handler, který zvýší číslo v #cnt o 1',
      ].join('\n'),
      dom: [
        '<div class="flex items-center gap-2">',
        '  <button id="btn" class="px-2 py-1 rounded bg-sky-600 text-white text-xs">Klik</button>',
        '  <span id="cnt">0</span>',
        '</div>',
      ].join('\n'),
    },
    {
      title: '7) alert/confirm (wrapper)',
      desc: "Napište funkci notify(decision), která při true zavolá alert('OK') a při false alert('Cancelled'). Exportujte jako exports.notify.",
      js: [
        '// Úkol: napište funkci notify(decision)',
        "// - při true zavolejte alert('OK')",
        "// - při false zavolejte alert('Cancelled')",
        '// TODO: implementujte a zveřejněte přes exports.notify',
      ].join('\n'),
      dom: '<div class="text-xs text-zinc-500">(Tento krok DOM nevyužívá)</div>',
    },
  ];
  const idx = Math.max(0, Math.min(stepIndex || 0, steps.length - 1));
  return { step: steps[idx], all: steps };
}

function JsTaskTabs({ steps, activeIndex, onChange }) {
  function handleKeyDown(event, index) {
    const direction =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? -1
          : event.key === 'Home'
            ? 'first'
            : event.key === 'End'
              ? 'last'
              : null;
    if (!direction) return;
    event.preventDefault();
    event.stopPropagation();
    const nextIndex =
      direction === 'first'
        ? 0
        : direction === 'last'
          ? steps.length - 1
          : Math.min(Math.max(index + direction, 0), steps.length - 1);
    onChange(nextIndex);
  }

  return (
    <div className="mb-3" role="tablist" aria-label="Kroky úlohy JavaScript">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Vyberte úlohu
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {steps.map((step, index) => (
          <button
            key={step.title}
            type="button"
            role="tab"
            aria-selected={activeIndex === index}
            tabIndex={activeIndex === index ? 0 : -1}
            onClick={() => onChange(index)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={clsx(
              'shrink-0 rounded-lg border px-3 py-2 text-left text-sm font-medium',
              activeIndex === index
                ? 'border-indigo-600 bg-indigo-700 text-white'
                : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200',
            )}
          >
            {step.title}
          </button>
        ))}
      </div>
    </div>
  );
}

function JsCodeEditor({ source, onChange }) {
  return (
    <SyntaxCodeEditor
      value={source}
      minHeight="320px"
      onChange={onChange}
      language="javascript"
      label="main.js — Editor"
    />
  );
}

function JsTaskWorkspace({ steps, stepIndex, onStepIndexChange }) {
  const template = steps[stepIndex] || steps[0];
  const [source, setSource] = useState(template.js);
  const [hasRun, setHasRun] = useState(false);
  const [runNumber, setRunNumber] = useState(0);
  const [results, setResults] = useState([]);
  const definition = getJavaScriptDefinition(stepIndex);

  /* eslint-disable react-hooks/set-state-in-effect -- each task starts a fresh student draft. */
  useEffect(() => {
    setSource(template.js);
    setHasRun(false);
    setResults([]);
  }, [template]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function handleSourceChange(value) {
    setSource(value);
    setHasRun(false);
    setResults([]);
  }

  function runTests() {
    setHasRun(true);
    setResults([]);
    setRunNumber((value) => value + 1);
  }

  function handleResult(result) {
    setResults(runExerciseTests(definition, { source, result }));
  }

  return (
    <div
      data-projector-private="exercise-workspace"
      className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/70 px-4 py-3 dark:border-zinc-800">
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Plocha úkolu</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            JavaScript v tomto okně prohlížeče
          </p>
        </div>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          Úpravy platí jen pro tuto relaci.
        </span>
      </header>

      <section
        role="region"
        aria-label="Zadání"
        className="border-b border-zinc-200/70 px-4 py-4 dark:border-zinc-800"
      >
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Zadání</h2>
        <div className="mt-2 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
          <JsTaskTabs steps={steps} activeIndex={stepIndex} onChange={onStepIndexChange} />
          <p className="font-semibold">{template.title}</p>
          <p>{template.desc}</p>
        </div>
      </section>

      <section
        role="region"
        aria-label="IDE"
        className="border-b border-zinc-200/70 px-4 py-4 dark:border-zinc-800"
      >
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">IDE — JavaScript</h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Soubor: main.js</p>
        <div className="mt-3">
          <JsCodeEditor source={source} onChange={handleSourceChange} />
        </div>
      </section>

      <section role="region" aria-label="Náhled a testy" className="min-w-0 p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Náhled a testy</h2>
          <button
            type="button"
            className="rounded-lg bg-indigo-700 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            onClick={runTests}
          >
            Spustit testy
          </button>
        </div>
        <div className="min-w-0">
          <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Náhled</h3>
          <JsSandbox
            key={`javascript-run-${runNumber}`}
            code={hasRun ? source : null}
            dom={template.dom}
            stepIndex={stepIndex}
            onResult={handleResult}
            title="Izolovaný JavaScript DOM sandbox"
            className="w-full min-h-[160px] rounded-xl border bg-white"
          />
        </div>
        <div
          className="mt-4 rounded-xl border border-zinc-200/70 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/60"
          role="group"
          aria-label="Výsledky testů"
          aria-live="polite"
        >
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Výsledky testů</h3>
          {results.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Spusťte testy a ověřte požadavek.
            </p>
          ) : (
            <ul className="mt-2 space-y-1.5 text-sm">
              {results.map((result, index) => (
                <li
                  key={`${result.id}-${index}`}
                  className={
                    result.ok
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-rose-700 dark:text-rose-400'
                  }
                >
                  <span aria-hidden="true">{result.ok ? '✓' : '×'}</span> <span>{result.text}</span>
                  {result.hint && (
                    <span className="ml-1 text-xs text-zinc-500">({result.hint})</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

const slides = [
  {
    id: 'title',
    title: 'Základy JavaScriptu – interaktivní cvičení',
    activityType: 'learn',
    subtitle: 'ZWA-6 • JS: Proměnné, funkce, DOM',
    presenterNotes: 'Začněte krátkou ukázkou události a nechte studenty popsat očekávaný stav DOM.',
  },
  {
    id: 'quiz-css',
    title: 'KVÍZ: CSS základy',
    activityType: 'quick-check',
    presenterNotes: 'Nechte studenty vysvětlit volbu selektoru před vyhodnocením odpovědí.',
  },
  { id: 'meme', title: 'Meme', activityType: 'learn' },
  {
    id: 'toc',
    title: 'Obsah',
    activityType: 'learn',
    bullets: [
      'Přehled jazyka a prostředí',
      'Proměnné, typy a operátory',
      'Funkce, podmínky a cykly',
      'Pole a objekty',
      'Práce s DOM a události',
      'alert / confirm',
    ],
  },
  {
    id: 'theory',
    title: 'Teorie – JS základy',
    activityType: 'learn',
    presenterNotes: 'Zdůrazněte tok: vyberu uzel, změním stav, připojím handler.',
    sections: [
      {
        icon: '🌍',
        title: 'Přehled jazyka',
        body: 'JavaScript je univerzální jazyk webu: běží v prohlížeči i na serveru (Node.js). Je dynamicky typovaný a díky event loopu zvládá asynchronní operace bez blokování UI. Dnes se píše hlavně jako ESM modulový kód a balí se pomocí nástrojů ekosystému npm. Jeho síla je ve velké flexibilitě a obrovském množství knihoven. Naší ambicí je naučit se čitelné základy, které obstojí i v praxi.',
        points: [
          'JavaScript běží v prohlížeči i na serveru (Node.js).',
          'Jednovláknový runtime, asynchronní I/O, event loop.',
          'Moduly (ESM) a ekosystém npm.',
          "Příklad: `import { readFile } from 'node:fs/promises'`",
        ],
      },
      {
        icon: '🔤',
        title: 'Proměnné a typy',
        body: 'Proměnné deklarujeme přes let a const; const chrání referenci, ne nutně obsah. V JavaScriptu existují primitivní typy i objekty, přičemž přetypování může probíhat automaticky. Proto preferujeme striktní rovnost `===`, která nepřetypovává. Když potřebujeme konverzi, udělejme ji explicitně, aby byl kód předvídatelný. Nebojte se používat `typeof` jako rychlou diagnostiku.',
        points: [
          'Deklarace: `let x = 1; const PI = 3.14`.',
          'Primitiva: string, number, boolean, null, undefined, symbol, bigint.',
          "Typové kontroly: `typeof 42 // 'number'`, `typeof null // 'object'` (historická zvláštnost).",
          'Rovnosti: `===` (striktní), `==` (s přetypy – nedoporučeno).',
          "Konverze: `Number('2') // 2`, `String(20) // '20'`.",
        ],
      },
      {
        icon: '🧮',
        title: 'Funkce a cykly',
        body: 'Funkce jsou první občané jazyka – můžeme je ukládat do proměnných i předávat jako argumenty. Arrow funkce zkracují zápis, ale pozor na `this`. Řízení toku probíhá přes podmínky a cykly; u polí často dává smysl map/filter/reduce kvůli čitelnosti. Cílem je psát krátké, pojmenované funkce s jasným účelem. Když cítíte, že funkce dělá moc věcí, rozdělte ji.',
        points: [
          'Deklarace: `function sum(a,b){ return a+b }`.',
          'Arrow: `const inc = n => n + 1`.',
          "Podmínky: `n % 2 ? 'odd' : 'even'`.",
          'Cykly: `for (let i=0;i<xs.length;i++) {...}`; `for (const x of xs) {...}`.',
          'Pole: `xs.map(x=>x*2).filter(x=>x>0).reduce((a,b)=>a+b,0)`.',
        ],
      },
      {
        icon: '📦',
        title: 'Pole a objekty',
        body: 'Pole reprezentují pořadí, objekty páry klíč–hodnota. Při práci se strukturami upřednostňujeme neměnnost: místo úprav na místě vytváříme nové kopie pomocí spreadu. Destrukturalizace výrazně zkracuje kód a dělá záměr čitelnějším. V praxi často kombinujeme oba typy dohromady a dáváme si pozor na mělké vs. hluboké kopie. Klíčem je srozumitelná datová struktura.',
        points: [
          "Objekty: `{ id: 1, name: 'Ada' }` – přístup `user.name`.",
          'Destrukturalizace: `const {name} = user; const [first] = list`.',
          "Spread/Rest: `{...a, role:'admin'}`, `function f(...args){}`.",
        ],
      },
      {
        icon: '🧩',
        title: 'DOM a události',
        body: 'V prohlížeči manipulujeme s DOMem – stromem elementů stránky. Nejprve vybereme uzel, poté změníme jeho obsah či třídy, a případně přidáme posluchače událostí. Důležité je měnit jen to, co vlastníme, abychom nerozbili jiné části aplikace. Reagujeme na akce uživatele (klik, input) a stav synchronizujeme do UI. Malé, dobře pojmenované selektory a handlery usnadní údržbu.',
        points: [
          "Výběr: `document.querySelector('#app')`.",
          "Událost: `btn.addEventListener('click', handler)`.",
          "Manipulace: `el.textContent = 'Hello'`.",
        ],
      },
      {
        icon: '🔔',
        title: 'alert/confirm',
        body: '`alert` a `confirm` jsou jednoduché vestavěné dialogy. Jsou blokující, takže je používejte střídmě – přerušují tok práce i testy. V produkčním UI většinou nahradíte vlastní komponentou notifikací nebo modálu. Kvůli testovatelnosti je vhodné volání zabalit do funkce, kterou lze při testech nahradit. Studenti se zde naučí pracovat i s vedlejšími efekty.',
        points: [
          "`alert('Saved')` zobrazí dialog (blokující).",
          "`const ok = confirm('Proceed?')` vrací boolean.",
          'Doporučení: obalte do funkce kvůli testům a DI.',
        ],
      },
    ],
  },
  {
    id: 'tasks',
    title: 'Úlohy – JavaScript',
    activityType: 'apply',
    presenterNotes: 'Před spuštěním testů požádejte o předpověď výsledku pro jeden vstup.',
    steps: [],
  },
];

function JsSlideContent({ slide, stepIndex, onStepIndexChange }) {
  const hasSections = Array.isArray(slide.sections) && slide.sections.length > 0;
  const hasSteps = slide.id === 'tasks';
  const internalSteps = useMemo(() => getJsTemplates(0).all, []);
  const totalSteps = internalSteps.length;
  const currentStep = internalSteps[stepIndex];
  return (
    <SharedSlideCard slide={slide} idPrefix="lesson-javascript">
      {slide.id === 'quiz-css' && (
        <div className="mt-2">
          <QuizCssBasics />
        </div>
      )}
      {slide.bullets && (
        <ul className="list-disc pl-6 space-y-1 mt-2">
          {slide.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      )}
      {hasSections && (
        <div className="mt-4">
          <TheorySections sections={slide.sections} />
        </div>
      )}
      {slide.id === 'meme' && (
        <div className="mt-3 rounded-xl overflow-hidden border border-zinc-200/60 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40">
          <img
            src={memeImg.src}
            alt="Meme"
            className="w-full max-h-[420px] object-contain bg-white dark:bg-zinc-900"
          />
        </div>
      )}
      {hasSteps && (
        <div className="mt-2">
          <div className="rounded-xl border border-zinc-200/60 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800">
                Úloha {stepIndex + 1} / {totalSteps}
              </span>
            </div>
            <div className="font-semibold mb-1">{currentStep.title}</div>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-2">{currentStep.desc}</p>
            <div className="text-xs text-zinc-500">
              Tip: Exportujte testované funkce do <Code>exports</Code> (např.{' '}
              <Code>exports.sum = sum</Code>).
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <button
              className="px-3 py-1.5 text-sm rounded-lg border border-zinc-200/60 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 disabled:opacity-50"
              onClick={() => onStepIndexChange(Math.max(0, stepIndex - 1))}
              disabled={stepIndex === 0}
            >
              Předchozí
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <button
                  key={i}
                  className={clsx(
                    'h-2.5 w-2.5 rounded-full border border-zinc-300/60 dark:border-zinc-700',
                    i === stepIndex ? 'bg-sky-500' : 'bg-zinc-200 dark:bg-zinc-800',
                  )}
                  onClick={() => onStepIndexChange(i)}
                  aria-label={`Přejít na úlohu ${i + 1}`}
                />
              ))}
            </div>
            <button
              className="px-3 py-1.5 text-sm rounded-lg border border-sky-500/30 bg-sky-600 text-white disabled:opacity-50"
              onClick={() => onStepIndexChange(Math.min(totalSteps - 1, stepIndex + 1))}
              disabled={stepIndex === totalSteps - 1}
            >
              Další
            </button>
          </div>
        </div>
      )}
    </SharedSlideCard>
  );
}

function TheorySections({ sections }) {
  const [idx, setIdx] = useState(0);
  const total = sections.length;
  const cur = sections[idx];
  return (
    <div>
      <div className="rounded-xl border border-zinc-200/60 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800">
            Krok {idx + 1} / {total}
          </span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl" aria-hidden>
            {cur.icon}
          </span>
          <div className="font-semibold">{cur.title}</div>
        </div>
        {cur.body && (
          <p className="leading-relaxed text-sm text-zinc-700 dark:text-zinc-300 mb-2">
            {cur.body}
          </p>
        )}
        <ul className="list-disc pl-5 space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
          {cur.points.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <button
          className="px-3 py-1.5 text-sm rounded-lg border border-zinc-200/60 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 disabled:opacity-50"
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
          disabled={idx === 0}
        >
          Předchozí
        </button>
        <div className="flex items-center gap-1">
          {sections.map((_, i) => (
            <button
              key={i}
              className={clsx(
                'h-2.5 w-2.5 rounded-full border border-zinc-300/60 dark:border-zinc-700',
                i === idx ? 'bg-sky-500' : 'bg-zinc-200 dark:bg-zinc-800',
              )}
              onClick={() => setIdx(i)}
              aria-label={`Přejít na krok ${i + 1}`}
            />
          ))}
        </div>
        <button
          className="px-3 py-1.5 text-sm rounded-lg border border-sky-500/30 bg-sky-600 text-white disabled:opacity-50"
          onClick={() => setIdx((i) => Math.min(total - 1, i + 1))}
          disabled={idx === total - 1}
        >
          Další
        </button>
      </div>
    </div>
  );
}

function QuizCssBasics() {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const questions = [
    {
      id: 'q1',
      text: 'Který selektor cílí na element s id="title"?',
      options: ['.title', '#title', 'title'],
      correctIndex: 1,
      hint: 'id selektor',
    },
    {
      id: 'q2',
      text: 'Co je vyšší specifita?',
      options: ['.nav a', '#nav a', 'a.nav'],
      correctIndex: 1,
      hint: 'id > třída > element',
    },
    {
      id: 'q3',
      text: 'Jak nastavíte font na Georgia a fallback serif?',
      options: ['font: Georgia;', 'font-family: Georgia, serif;', 'font-style: Georgia, serif;'],
      correctIndex: 1,
      hint: 'font-family',
    },
    {
      id: 'q4',
      text: 'Jak stylovat navštívený odkaz?',
      options: ['a:hover', 'a:visited', 'a:active'],
      correctIndex: 1,
      hint: ':visited',
    },
    {
      id: 'q5',
      text: 'Jak vyberete první písmeno odstavce .excerpt?',
      options: ['p.excerpt:first-letter', 'p.excerpt::first-letter', 'p:first-letter.excerpt'],
      correctIndex: 1,
      hint: '::first-letter',
    },
    {
      id: 'q6',
      text: 'Která vlastnost nastaví číslování na lower-alpha?',
      options: ['list-style', 'list-style-type', 'counter-style'],
      correctIndex: 1,
      hint: 'list-style-type',
    },
  ];
  const total = questions.length;
  const score = questions.reduce((acc, q) => acc + (answers[q.id] === q.correctIndex ? 1 : 0), 0);
  function selectAnswer(qid, idx) {
    if (!submitted) setAnswers((a) => ({ ...a, [qid]: idx }));
  }
  function submit() {
    setSubmitted(true);
  }
  function reset() {
    setAnswers({});
    setSubmitted(false);
  }
  return (
    <div className="mt-4 space-y-4">
      {questions.map((q, qi) => {
        const selected = answers[q.id];
        const isCorrect = selected === q.correctIndex;
        return (
          <div
            key={q.id}
            className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 p-4"
          >
            <div className="font-medium mb-2">
              {qi + 1}. {q.text}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {q.options.map((opt, idx) => {
                const active = selected === idx;
                const correct = submitted && idx === q.correctIndex;
                const wrong = submitted && active && !correct;
                return (
                  <button
                    key={idx}
                    className={clsx(
                      'text-left px-3 py-2 rounded-lg border text-sm',
                      active
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/30'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60',
                      correct ? 'ring-2 ring-emerald-400' : '',
                      wrong ? 'ring-2 ring-rose-400' : '',
                    )}
                    onClick={() => selectAnswer(q.id, idx)}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {submitted && (
              <div
                className={clsx('mt-2 text-xs', isCorrect ? 'text-emerald-600' : 'text-rose-600')}
              >
                {isCorrect ? 'Správně!' : `Nesprávně. Správná volba je ${q.correctIndex + 1}.`}{' '}
                <span className="text-zinc-500">({q.hint})</span>
              </div>
            )}
          </div>
        );
      })}
      <div className="flex items-center gap-2">
        {!submitted ? (
          <button className="px-4 py-2 rounded-lg bg-sky-600 text-white" onClick={submit}>
            Vyhodnotit
          </button>
        ) : (
          <>
            <div className="text-sm text-zinc-700 dark:text-zinc-300">
              Skóre: {score} / {total}
            </div>
            <button
              className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700"
              onClick={reset}
            >
              Reset
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function AppJsLesson5() {
  const { activeSlide, setActiveSlide } = useSlideNavigation(slides);
  const [stepIndex, setStepIndex] = useState(0);
  const current = slides.find((s) => s.id === activeSlide) || slides[0];
  const hasTasks = current.id === 'tasks';

  // A new slide starts at its first task.
  /* eslint-disable react-hooks/set-state-in-effect -- reset is the slide transition boundary. */
  useEffect(() => {
    setStepIndex(0);
  }, [activeSlide]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <LessonShell
      lesson={getLessonByNumber(6)}
      slides={slides}
      activeSlide={activeSlide}
      onChange={setActiveSlide}
      title="ZWA-6: Interaktivní prezentace JavaScriptu"
      objective="Procvičíte proměnné, funkce, DOM a události v JavaScriptu v bezpečném interaktivním playgroundu."
      subtitle={
        <>
          Editor vlevo, DOM + konzole vpravo. Exportujte řešení přes <Code>exports</Code>.
        </>
      }
      footerText="© 2025 ZWA – Interaktivní lekce JavaScriptu"
      maxWidthClass="max-w-7xl"
    >
      <div className={hasTasks ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : ''}>
        {hasTasks && (
          <div className="lg:col-span-2">
            <JsTaskWorkspace
              steps={getJsTemplates(0).all}
              stepIndex={stepIndex}
              onStepIndexChange={setStepIndex}
            />
          </div>
        )}
        {!hasTasks && (
          <div className="max-w-4xl">
            <JsSlideContent
              slide={current}
              stepIndex={stepIndex}
              onStepIndexChange={setStepIndex}
            />
          </div>
        )}
      </div>
    </LessonShell>
  );
}
