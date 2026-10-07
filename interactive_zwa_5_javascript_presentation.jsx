import React, { useEffect, useMemo, useState } from 'react';
import { getLessonByNumber } from './src/config/lessons.js';
import Code from './src/course-ui/content/InlineCode.jsx';
import EditorialIllustration from './src/course-ui/content/EditorialIllustration.jsx';
import LessonSummary from './src/course-ui/content/LessonSummary.jsx';
import contentStyles from './src/course-ui/content/content.module.css';
import ExerciseStage from './src/course-ui/exercises/ExerciseStage.jsx';
import PreviousLectureQuiz from './src/course-ui/exercises/PreviousLectureQuiz.jsx';
import StudioEditor from './src/course-ui/exercises/StudioEditor.jsx';
import StudioTabs from './src/course-ui/exercises/StudioTabs.jsx';
import { getJavaScriptDefinition } from './src/course-ui/exercises/behavior/testDefinitions.js';
import { runExerciseTests } from './src/course-ui/exercises/behavior/testRunner.js';
import JavaScriptRunner from './src/course-ui/exercises/runtime/JavaScriptRunner.jsx';
import { LearningExperience } from './src/course-ui/learning/LearningExperience.jsx';
import { LearningSection } from './src/course-ui/learning/LearningSection.jsx';
import { useLearningNavigation } from './src/course-ui/learning/useLearningNavigation.js';

function clsx(...values) {
  return values.filter(Boolean).join(' ');
}

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
    <StudioEditor
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
      <StudioEditor
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
    <ExerciseStage
      brief={
        <>
          <p>
            <strong>{template.title}</strong>
          </p>
          <p>{template.desc}</p>
        </>
      }
      studio={
        <StudioTabs
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
                      <div>
                        <p>
                          <strong>DOM fixture (pouze pro čtení)</strong>
                        </p>
                        <code>{template.dom}</code>
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
      }
      preview={
        <JavaScriptRunner
          key={`javascript-run-${runNumber}`}
          code={hasRun ? source : null}
          dom={template.dom}
          stepIndex={stepIndex}
          onResult={handleResult}
          title="Izolovaný JavaScript DOM sandbox"
        />
      }
      verification={
        <div role="group" aria-label="Výsledky testů" aria-live="polite">
          {results.length === 0 ? (
            <p>Spusťte ověření a zkontrolujte požadavek.</p>
          ) : (
            <ul>
              {results.map((result, index) => (
                <li key={`${result.id}-${index}`}>
                  <strong>{result.ok ? '✓ Splněno' : '× Nesplněno'}</strong> —{' '}
                  <span>{result.text}</span>
                  {result.hint ? <small> ({result.hint})</small> : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      }
      onVerify={runTests}
      privateMarker="javascript-exercise"
    />
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
    title: 'KVÍZ: CSS II',
    activityType: 'quick-check',
    presenterNotes: 'Otázky opakují layout a responzivitu z předchozí lekce CSS II.',
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
    <>
      {slide.id === 'title' && (
        <LessonSummary
          intro="Od základních hodnot přejdeme k funkcím a objektům a nakonec jejich pomocí změníme stránku v prohlížeči."
          items={[
            'Projdeme proměnné, typy, operátory a řízení toku programu.',
            'Napíšeme znovupoužitelné funkce a zpracujeme pole i objekty.',
            'Najdeme a upravíme prvky stránky přes DOM.',
            'Propojíme události uživatele s reakcí rozhraní.',
          ]}
        />
      )}
      {slide.id === 'quiz-css' && (
        <div className="mt-2">
          <ReviewQuiz />
        </div>
      )}
      {slide.id !== 'title' && slide.bullets && (
        <ul className="list-disc pl-6 space-y-1 mt-2">
          {slide.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      )}
      {hasSections && (
        <div className="mt-4">
          <JavaScriptTheory sections={slide.sections} />
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
    </>
  );
}

function JavaScriptTheory({ sections }) {
  return (
    <div className={contentStyles.theoryFlow} data-theory-flow="true">
      {sections.map((section, index) => (
        <React.Fragment key={section.title}>
          <section className={contentStyles.theoryTopic} data-theory-topic="true">
            <span className={contentStyles.theoryIndex}>{String(index + 1).padStart(2, '0')}</span>
            <div className={contentStyles.theoryBody}>
              <h3>{section.title}</h3>
              <p>{section.body}</p>
              {section.points.map((point) => (
                <p key={point}>{point}</p>
              ))}
            </div>
          </section>
          {index === 3 ? (
            <EditorialIllustration
              alt="Kliknutí v prohlížeči prochází stromem DOM do JavaScriptu a vrací se jako změna stránky."
              src="/course-art/editorial/javascript-event-flow.png"
            />
          ) : null}
        </React.Fragment>
      ))}
    </div>
  );
}

function ReviewQuiz() {
  return <PreviousLectureQuiz lessonNumber={6} />;
}

export default function AppJsLesson5() {
  const { activeSection, setActiveSection } = useLearningNavigation(slides);
  const [stepIndex, setStepIndex] = useState(0);
  const current = slides.find((section) => section.id === activeSection) || slides[0];
  const hasTasks = typeof current.taskIndex === 'number';

  // A new slide starts at its first task.
  /* eslint-disable react-hooks/set-state-in-effect -- reset is the slide transition boundary. */
  useEffect(() => {
    setStepIndex(0);
  }, [activeSection]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <LearningExperience
      lesson={getLessonByNumber(6)}
      sections={slides}
      activeSection={activeSection}
      onChange={setActiveSection}
      title="ZWA-6: Interaktivní prezentace JavaScriptu"
      objective="Procvičíte proměnné, funkce, DOM a události v JavaScriptu v bezpečném interaktivním playgroundu."
      subtitle={
        <>
          Editor vlevo, DOM + konzole vpravo. Exportujte řešení přes <Code>exports</Code>.
        </>
      }
      footerText="ZWA – Interaktivní lekce JavaScriptu"
    >
      <LearningSection section={current} idPrefix="lesson-javascript">
        {hasTasks && (
          <JsTaskWorkspace steps={getJsTemplates(0).all} stepIndex={current.taskIndex} />
        )}
        {!hasTasks && (
          <JsSlideContent slide={current} stepIndex={stepIndex} onStepIndexChange={setStepIndex} />
        )}
      </LearningSection>
    </LearningExperience>
  );
}
