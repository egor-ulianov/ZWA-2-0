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
import WorkspaceIdeTabs from './src/components/exercises/WorkspaceIdeTabs.jsx';
import LessonQuiz from './src/components/lesson/LessonQuiz.jsx';

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
      solution: [
        "const greeting = 'Ahoj';",
        'function double(n) { return n * 2; }',
        'exports.greeting = greeting;',
        'exports.double = double;',
      ].join('\n'),
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
      solution: [
        'function classify(n) {',
        "  if (typeof n !== 'number' || Number.isNaN(n)) return 'n/a';",
        "  return n % 2 === 0 ? 'even' : 'odd';",
        '}',
        'exports.classify = classify;',
      ].join('\n'),
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
      solution: [
        'function sumTo(n) {',
        '  let total = 0;',
        '  for (let i = 1; i <= n; i += 1) total += i;',
        '  return total;',
        '}',
        'exports.sumTo = sumTo;',
      ].join('\n'),
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
      solution: [
        'function total(xs) {',
        '  return Array.isArray(xs) ? xs.reduce((sum, value) => sum + value, 0) : 0;',
        '}',
        'exports.total = total;',
      ].join('\n'),
    },
    {
      title: '5) DOM selektory',
      desc: "Vyberte #app a nastavte mu textContent na 'Hello JS'.",
      js: [
        '// Úkol: pomocí document.querySelector vyberte #app',
        "// TODO: nastavte elementu textContent na 'Hello JS'",
      ].join('\n'),
      dom: '<div id="app" class="rounded border p-2 text-sm">(sem napište text)</div>',
      solution: [
        "const app = document.querySelector('#app');",
        "if (app) app.textContent = 'Hello JS';",
      ].join('\n'),
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
      solution: [
        "const button = document.querySelector('#btn');",
        "const counter = document.querySelector('#cnt');",
        "button?.addEventListener('click', () => {",
        '  counter.textContent = String(Number(counter.textContent) + 1);',
        '});',
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
      solution: [
        'function notify(decision) {',
        "  alert(decision ? 'OK' : 'Cancelled');",
        '}',
        'exports.notify = notify;',
      ].join('\n'),
    },
  ];
  const idx = Math.max(0, Math.min(stepIndex || 0, steps.length - 1));
  return { step: steps[idx], all: steps };
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

function JsReferencePanel({ source, dom }) {
  return (
    <div className="space-y-3" data-reference-solution="true">
      <p className="text-xs text-zinc-500">Kompletní referenční řešení pouze pro čtení.</p>
      <SyntaxCodeEditor
        value={source}
        language="javascript"
        label="Řešení main.js"
        readOnly
        editable={false}
        minHeight="320px"
      />
      {dom && !String(dom).includes('Tento krok DOM nevyužívá') && (
        <div className="rounded-lg border border-zinc-200/70 p-3 dark:border-zinc-800">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            DOM fixture
          </p>
          {dom}
        </div>
      )}
    </div>
  );
}

function JsTaskWorkspace({ steps, stepIndex }) {
  const template = steps[stepIndex] || steps[0];
  const [source, setSource] = useState(template.js);
  const [activeFileId, setActiveFileId] = useState('main.js');
  const [hasRun, setHasRun] = useState(false);
  const [runNumber, setRunNumber] = useState(0);
  const [results, setResults] = useState([]);
  const definition = getJavaScriptDefinition(stepIndex);

  /* eslint-disable react-hooks/set-state-in-effect -- each task starts a fresh student draft. */
  useEffect(() => {
    setSource(template.js);
    setActiveFileId('main.js');
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
        <div className="mt-3">
          <WorkspaceIdeTabs
            activeFileId={activeFileId}
            onActiveFileChange={setActiveFileId}
            files={[
              {
                id: 'main.js',
                label: 'main.js',
                panel: <JsCodeEditor source={source} onChange={handleSourceChange} />,
              },
              ...(template.dom && !String(template.dom).includes('Tento krok DOM nevyužívá')
                ? [
                    {
                      id: 'dom.html',
                      label: 'dom.html',
                      panel: (
                        <div className="rounded-lg border border-zinc-200/70 p-3 dark:border-zinc-800">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                            DOM fixture (pouze pro čtení)
                          </p>
                          {template.dom}
                        </div>
                      ),
                    },
                  ]
                : []),
            ]}
            solution={{
              label: 'Řešení',
              panel: <JsReferencePanel source={template.solution} dom={template.dom} />,
            }}
          />
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

const slideDefinitions = [
  {
    id: 'title',
    title: 'Základy JavaScriptu – interaktivní cvičení',
    activityType: 'learn',
    subtitle: 'ZWA-6 • JS: Proměnné, funkce, DOM',
    presenterNotes: 'Začněte krátkou ukázkou události a nechte studenty popsat očekávaný stav DOM.',
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
    id: 'quiz-css',
    title: 'KVÍZ: JavaScript základy',
    activityType: 'quick-check',
    presenterNotes:
      'Nechte studenty vysvětlit volbu typu, deklarace nebo DOM API před vyhodnocením odpovědí.',
  },
  { id: 'meme', title: 'Meme', activityType: 'learn' },
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

const slides = slideDefinitions.flatMap((slide) => {
  if (slide.id !== 'tasks') return [slide];
  return getJsTemplates(0).all.map((step, index) => ({
    ...slide,
    id: index === 0 ? 'tasks' : `js-task-${index + 1}`,
    title: step.title,
    taskIndex: index,
    task: step,
  }));
});

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
  const questions = [
    {
      id: 'q1',
      text: 'Co vrátí výraz typeof 42?',
      options: ['number', 'string', 'object'],
      correctIndex: 0,
      hint: 'typeof vrací řetězec s typem hodnoty.',
    },
    {
      id: 'q2',
      text: 'Kterou deklaraci nelze znovu přiřadit?',
      options: ['var', 'let', 'const'],
      correctIndex: 2,
      hint: 'const chrání vazbu proměnné před novým přiřazením.',
    },
    {
      id: 'q3',
      text: 'Který operátor porovnává hodnotu i typ bez přetypování?',
      options: ['==', '=', '==='],
      correctIndex: 2,
      hint: 'Striktní rovnost je v JavaScriptu ===.',
    },
    {
      id: 'q4',
      text: 'Co pro pole typicky prochází cyklus for...of?',
      options: ['indexy', 'hodnoty', 'vlastnosti prototypu'],
      correctIndex: 1,
      hint: 'for...of iteruje přes hodnoty iterovatelného objektu.',
    },
    {
      id: 'q5',
      text: 'Který zápis vybere první prvek odpovídající CSS selektoru?',
      options: [
        'document.querySelector(selector)',
        'document.querySelectorAll(selector)',
        'document.getElements(selector)',
      ],
      correctIndex: 0,
      hint: 'querySelector vrací první odpovídající prvek.',
    },
    {
      id: 'q6',
      text: 'Který zápis správně připojí handler na kliknutí?',
      options: [
        "button.addEventListener('click', handler)",
        'button.click(handler)',
        "listen(button, 'click', handler)",
      ],
      correctIndex: 0,
      hint: 'Události se připojují metodou addEventListener.',
    },
    {
      id: 'q7',
      text: 'Co udělá event.preventDefault() ve formuláři?',
      options: ['zastaví výchozí akci prohlížeče', 'odstraní handler', 'ukončí celý JavaScript'],
      correctIndex: 0,
      hint: 'Například zabrání odeslání formuláře a reloadu stránky.',
    },
  ];

  return (
    <LessonQuiz
      title="JavaScript základy"
      subtitle="Procvičte typy, deklarace, cykly, DOM selektory a práci s událostmi."
      questions={questions}
      visualKey="javascript-event-loop"
    />
  );
}

export default function AppJsLesson5() {
  const { activeSlide, setActiveSlide } = useSlideNavigation(slides);
  const [stepIndex, setStepIndex] = useState(0);
  const current = slides.find((s) => s.id === activeSlide) || slides[0];
  const hasTasks = typeof current.taskIndex === 'number';

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
            <JsTaskWorkspace steps={getJsTemplates(0).all} stepIndex={current.taskIndex} />
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
