import React, {
  createContext,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { getLessonByNumber } from './src/config/lessons.js';
import ExerciseStage from './src/course-ui/exercises/ExerciseStage.jsx';
import KnowledgeCheck from './src/course-ui/exercises/KnowledgeCheck.jsx';
import StudioEditor from './src/course-ui/exercises/StudioEditor.jsx';
import StudioTabs from './src/course-ui/exercises/StudioTabs.jsx';
import SandboxFrame from './src/course-ui/exercises/runtime/SandboxFrame.jsx';
import { LearningExperience } from './src/course-ui/learning/LearningExperience.jsx';
import { LearningSection } from './src/course-ui/learning/LearningSection.jsx';
import { useLearningNavigation } from './src/course-ui/learning/useLearningNavigation.js';

import {
  CSS_LAYOUT_INSPECTION,
  validateCssLayout,
} from './src/course-ui/exercises/runtime/validators.js';

function clsx(...values) {
  return values.filter(Boolean).join(' ');
}

function getBaseHtml() {
  return [
    '<!doctype html>',
    '<html>',
    '  <head>',
    '    <meta charset="utf-8">',
    '    <title>CSS II Playground</title>',
    '  </head>',
    '  <body>',
    '    <header id="site-header" class="p-2">',
    '      <img id="logo" alt="Logo" src="https://placehold.co/80x40" />',
    '      <h1 id="title">Sample Article</h1>',
    '    </header>',
    '    <nav id="menu">',
    '      <ul>',
    '        <li><a href="#">Home</a></li>',
    '        <li><a href="#">Docs</a></li>',
    '        <li><a href="#">Contact</a></li>',
    '      </ul>',
    '    </nav>',
    '    <main class="container">',
    '      <article id="article">',
    '        <h2>CSS II Tasks</h2>',
    '        <p id="lorem">Lorem ipsum <span class="hl">dolor sit amet</span>, consectetur adipiscing elit. Curabitur <span class="hl">ligula</span> sapien, fermentum quis lorem in, luctus gravida leo.</p>',
    '        <img id="pic" alt="Sample" src="https://placehold.co/160x120" />',
    '        <p>More text follows. Vestibulum ante ipsum primis in faucibus orci luctus.</p>',
    '      </article>',
    '    </main>',
    '    <footer id="footer">© 2025</footer>',
    '  </body>',
    '</html>',
  ].join('\n');
}

function getTaskTemplates(stepIndex) {
  const baseHtml = getBaseHtml();
  const steps = [
    {
      id: 'boxmodel',
      title: 'Box model',
      desc: 'Viditelně oddělte header, nav, article, footer pomocí padding, border, margin.',
      css: [
        '/* TODO: nastavte padding/border/margin pro #site-header, #menu, #article, #footer */',
        '#site-header { /* padding: 8px; border: 1px solid #e5e7eb; margin-bottom: 8px; */ }',
        '#menu { /* padding: 8px; border: 1px solid #e5e7eb; margin-bottom: 8px; */ }',
        '#article { /* padding: 8px; border: 1px solid #e5e7eb; margin-bottom: 8px; */ }',
        '#footer { /* padding: 8px; border: 1px solid #e5e7eb; margin-top: 8px; */ }',
      ].join('\n'),
      html: baseHtml,
    },
    {
      id: 'float',
      title: 'Float/Clear',
      desc: 'Vložte obrázek do textu a nechte text obtékat (float).',
      css: [
        '/* TODO: nastavte #pic float left/right a případné okraje */',
        '#pic { /* float: right; margin: 0 0 8px 8px; */ }',
        '#article::after { /* content: ""; display: block; clear: both; */ }',
      ].join('\n'),
      html: baseHtml,
    },
    {
      id: 'position',
      title: 'Position',
      desc: 'Vyzkoušejte position u obrázku (relative/absolute/fixed).',
      css: [
        '/* TODO: změňte position u #pic na relative/absolute/fixed a posuňte jej */',
        '#article { position: relative; }',
        '#pic { /* position: absolute; top: 0; right: 0; */ }',
      ].join('\n'),
      html: baseHtml,
    },
    {
      id: 'display',
      title: 'Display',
      desc: 'Změňte zobrazování označených slov (.hl) na block nebo inline-block a obarvěte je.',
      css: [
        '/* TODO: upravte zobrazení .hl */',
        '.hl { /* display: inline-block; background: #fef08a; padding: 2px 4px; */ }',
      ].join('\n'),
      html: baseHtml,
    },
    {
      id: 'flex',
      title: 'Flexbox',
      desc: 'V headeru zarovnejte tlačítko Login zcela vpravo a logo s h1 vlevo.',
      css: [
        '/* TODO: nastavte #site-header jako flex kontejner; přidejte zarovnání */',
        '#site-header { /* display: flex; align-items: center; gap: 8px; */ }',
        '#site-header button { /* margin-left: auto; */ }',
      ].join('\n'),
      html: getBaseHtml().replace(
        '</header>',
        '  <button id="login">Login</button>\n    </header>',
      ),
    },
    {
      id: 'responsive',
      title: 'Responzivita (@media)',
      desc: 'Na desktopu zobrazte nav a article vedle sebe, na mobilu pod sebou.',
      css: [
        '/* TODO: použijte @media pro změnu layoutu */',
        '.container { /* display: block; */ }',
        '#menu { /* margin-bottom: 8px; */ }',
        '@media (min-width: 800px) {',
        '  .container { display: grid; grid-template-columns: 240px 1fr; gap: 12px; }',
        '  #menu { margin-bottom: 0; }',
        '}',
      ].join('\n'),
      html: baseHtml,
    },
    {
      id: 'print',
      title: 'Print stylesheet',
      desc: 'Přidejte do <head> odkaz na stylopis pro tisk (<link media="print">).',
      css: '/* Tento krok kontroluje <link media="print"> v HTML. CSS může zůstat prázdné. */',
      html: baseHtml.replace(
        '</head>',
        [
          '    <!-- TODO: Přidejte <link rel="stylesheet" href="print.css" media="print"> -->',
          '  </head>',
        ].join('\n'),
      ),
    },
  ];
  const idx = Math.max(0, Math.min(stepIndex || 0, steps.length - 1));
  return { step: steps[idx], all: steps };
}

function getTaskSolution(stepIndex) {
  const solutions = [
    `#site-header, #menu, #article, #footer {
  padding: 8px;
  border: 1px solid #e5e7eb;
}
#site-header, #menu, #article { margin-bottom: 8px; }
#footer { margin-top: 8px; }`,
    `#pic {
  float: right;
  margin: 0 0 8px 8px;
}
#article::after {
  content: "";
  display: block;
  clear: both;
}`,
    `#article { position: relative; }
#pic { position: absolute; top: 0; right: 0; }`,
    `.hl {
  display: inline-block;
  background: #fef08a;
  padding: 2px 4px;
}`,
    `#site-header {
  display: flex;
  align-items: center;
  gap: 8px;
}
#site-header button { margin-left: auto; }`,
    `.container { display: block; }
#menu { margin-bottom: 8px; }
@media (min-width: 800px) {
  .container { display: grid; grid-template-columns: 240px 1fr; gap: 12px; }
  #menu { margin-bottom: 0; }
}`,
    '/* index.html contains the complete print stylesheet link. */',
  ];
  const template = getTaskTemplates(stepIndex).step;
  const html =
    stepIndex === 6
      ? template.html.replace(
          '    <!-- TODO: Přidejte <link rel="stylesheet" href="print.css" media="print"> -->',
          '    <link rel="stylesheet" href="print.css" media="print">',
        )
      : template.html;
  return { html, css: solutions[stepIndex] || solutions[0] };
}

const Css2TaskContext = createContext(null);

const Css2TaskProvider = forwardRef(function Css2TaskProvider({ stepIndex, children }, ref) {
  const [htmlCode, setHtmlCode] = useState('');
  const [cssCode, setCssCode] = useState('');
  const [activeFileId, setActiveFileId] = useState('style.css');
  const [applyVersion, setApplyVersion] = useState(0);
  const [validationVersion, setValidationVersion] = useState(0);
  const [results, setResults] = useState([]);
  const templates = useMemo(() => getTaskTemplates(stepIndex), [stepIndex]);

  /* eslint-disable react-hooks/set-state-in-effect -- template changes define a new exercise. */
  useEffect(() => {
    setHtmlCode(templates.step.html);
    setCssCode(templates.step.css);
    setActiveFileId('style.css');
    setResults([]);
    setApplyVersion((version) => version + 1);
  }, [templates]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const applyOnce = useCallback(() => setApplyVersion((version) => version + 1), []);
  const validate = useCallback(() => {
    setResults([]);
    setValidationVersion((version) => version + 1);
  }, []);
  const handleInspection = useCallback(
    (message) => {
      if (message.type === 'result') {
        setResults(validateCssLayout({ inspection: message.value, htmlCode, cssCode, stepIndex }));
      } else if (message.type === 'error') {
        setResults([{ ok: false, text: `Kontrola selhala: ${message.message}` }]);
      }
    },
    [cssCode, htmlCode, stepIndex],
  );

  useImperativeHandle(ref, () => ({ runValidation: validate }), [validate]);

  return (
    <Css2TaskContext.Provider
      value={{
        htmlCode,
        cssCode,
        activeFileId,
        setActiveFileId,
        setHtmlCode,
        setCssCode,
        applyVersion,
        validationVersion,
        results,
        applyOnce,
        validate,
        handleInspection,
      }}
    >
      {children}
    </Css2TaskContext.Provider>
  );
});

function Css2ReferencePanel({ solution }) {
  return (
    <div className="space-y-3" data-reference-solution="true">
      <p className="text-xs text-zinc-500">Kompletní referenční řešení pouze pro čtení.</p>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          index.html
        </p>
        <StudioEditor
          value={solution.html}
          language="html"
          label="Řešení index.html"
          readOnly
          editable={false}
          minHeight="220px"
        />
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          style.css
        </p>
        <StudioEditor
          value={solution.css}
          language="css"
          label="Řešení style.css"
          readOnly
          editable={false}
          minHeight="180px"
        />
      </div>
    </div>
  );
}

function Css2TaskIde({ stepIndex }) {
  const { htmlCode, cssCode, setHtmlCode, setCssCode, activeFileId, setActiveFileId } =
    useContext(Css2TaskContext);
  const solution = getTaskSolution(stepIndex);
  return (
    <StudioTabs
      activeFileId={activeFileId}
      onActiveFileChange={setActiveFileId}
      files={[
        {
          id: 'index.html',
          label: 'index.html',
          panel: (
            <StudioEditor
              value={htmlCode}
              onChange={setHtmlCode}
              language="html"
              label="index.html"
            />
          ),
        },
        {
          id: 'style.css',
          label: 'style.css',
          panel: (
            <StudioEditor value={cssCode} onChange={setCssCode} language="css" label="style.css" />
          ),
        },
      ]}
      solution={{ label: 'Řešení', panel: <Css2ReferencePanel solution={solution} /> }}
    />
  );
}

function Css2TaskPreview() {
  const { applyVersion, validationVersion, htmlCode, cssCode, handleInspection } =
    useContext(Css2TaskContext);
  return (
    <div className="space-y-3">
      <SandboxFrame
        key={applyVersion}
        html={htmlCode}
        css={cssCode}
        mode="static"
        title="Náhled CSS II playgroundu"
        className="w-full rounded-xl border border-zinc-200/60 bg-white min-h-[320px]"
      />
      {validationVersion > 0 && (
        <div
          className="fixed -left-[10000px] top-0 h-[768px] w-[1024px] overflow-hidden"
          aria-hidden="true"
        >
          <SandboxFrame
            key={validationVersion}
            html={htmlCode}
            css={cssCode}
            mode="inspect"
            inspection={CSS_LAYOUT_INSPECTION}
            onMessage={handleInspection}
            title="Sandbox kontroly CSS II"
            className="h-[768px] w-[1024px]"
          />
        </div>
      )}
    </div>
  );
}

function Css2TaskVerification() {
  const { results } = useContext(Css2TaskContext);
  if (results.length === 0) return <p>Spusťte ověření a zkontrolujte požadavek.</p>;
  return (
    <ul role="status" aria-live="polite">
      {results.map((result, index) => (
        <li key={`${result.text}-${index}`}>
          <strong>{result.ok ? '✓ Splněno' : '× Nesplněno'}</strong> — {result.text}
        </li>
      ))}
    </ul>
  );
}

const VsPlayground = forwardRef(function VsPlayground({ stepIndex }, ref) {
  const [htmlCode, setHtmlCode] = useState('');
  const [cssCode, setCssCode] = useState('');
  const [applyVersion, setApplyVersion] = useState(0);
  const [validationVersion, setValidationVersion] = useState(0);
  const [results, setResults] = useState([]);
  const templates = useMemo(() => getTaskTemplates(stepIndex), [stepIndex]);

  // Editors intentionally reset with the selected exercise template.
  /* eslint-disable react-hooks/set-state-in-effect -- template changes define a new exercise. */
  useEffect(() => {
    setHtmlCode(templates.step.html);
    setCssCode(templates.step.css);
    setResults([]);
    setApplyVersion((v) => v + 1);
  }, [templates]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function applyOnce() {
    setApplyVersion((v) => v + 1);
  }
  const validate = useCallback(() => {
    setResults([]);
    setValidationVersion((version) => version + 1);
  }, []);

  useImperativeHandle(ref, () => ({ runValidation: validate }), [validate]);
  function handleInspection(message) {
    if (message.type === 'result') {
      setResults(
        validateCssLayout({
          inspection: message.value,
          htmlCode,
          cssCode,
          stepIndex,
        }),
      );
    } else if (message.type === 'error') {
      setResults([{ ok: false, text: `Chyba validace: ${message.message}` }]);
    }
  }

  return (
    <div
      data-projector-private="css-exercise"
      className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 shadow overflow-hidden"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2">
        <div className="p-3 border-b lg:border-b-0 lg:border-r border-zinc-200/60 dark:border-zinc-800">
          <div className="font-semibold text-sm mb-2">HTML</div>
          <label className="sr-only" htmlFor="css2-inline-html-editor">
            Editor HTML a CSS II — HTML
          </label>
          <textarea
            id="css2-inline-html-editor"
            aria-label="Editor HTML a CSS II — HTML"
            value={htmlCode}
            onChange={(e) => setHtmlCode(e.target.value)}
            spellCheck={false}
            className="min-h-[220px] w-full rounded border p-3 font-mono text-xs bg-white dark:bg-zinc-900"
          />
          <div className="font-semibold text-sm mt-3 mb-2">CSS</div>
          <label className="sr-only" htmlFor="css2-inline-css-editor">
            Editor HTML a CSS II — CSS
          </label>
          <textarea
            id="css2-inline-css-editor"
            aria-label="Editor HTML a CSS II — CSS"
            value={cssCode}
            onChange={(e) => setCssCode(e.target.value)}
            spellCheck={false}
            className="min-h-[220px] w-full rounded border p-3 font-mono text-xs bg-white dark:bg-zinc-900"
          />
          <div className="mt-2 flex items-center gap-2">
            <button
              className="px-3 py-1.5 text-sm rounded-lg border border-sky-500/30 bg-sky-600 text-white"
              onClick={applyOnce}
            >
              Spustit náhled
            </button>
            <button className="px-3 py-1.5 text-sm rounded-lg border" onClick={validate}>
              Spustit testy
            </button>
          </div>
          {Array.isArray(results) && results.length > 0 && (
            <ul className="mt-3 text-sm">
              {results.map((r, i) => (
                <li
                  key={i}
                  className={clsx(
                    'flex items-center gap-2',
                    r.ok ? 'text-emerald-600' : 'text-rose-600',
                  )}
                >
                  <span
                    className={clsx(
                      'inline-block h-2.5 w-2.5 rounded-full',
                      r.ok ? 'bg-emerald-500' : 'bg-rose-500',
                    )}
                  />
                  {r.text}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="p-3">
          <div className="font-semibold text-sm mb-2">Náhled</div>
          <SandboxFrame
            key={applyVersion}
            html={htmlCode}
            css={cssCode}
            mode="static"
            title="Náhled CSS II playgroundu"
            className="w-full rounded-xl border border-zinc-200/60 bg-white min-h-[320px]"
          />
          {validationVersion > 0 && (
            <div
              className="fixed -left-[10000px] top-0 h-[768px] w-[1024px] overflow-hidden"
              aria-hidden="true"
            >
              <SandboxFrame
                key={validationVersion}
                html={htmlCode}
                css={cssCode}
                mode="inspect"
                inspection={CSS_LAYOUT_INSPECTION}
                onMessage={handleInspection}
                title="Sandbox kontroly CSS II"
                className="h-[768px] w-[1024px]"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

void VsPlayground;

const CSS2_REFERENCE_LINKS = [
  {
    label: 'Cvičení 5 – CSS II (cw.fel)',
    href: 'https://cw.fel.cvut.cz/wiki/courses/b6b39zwa/tutorials/05/start',
  },
  {
    label: 'MDN: Box model',
    href: 'https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/The_box_model',
  },
  { label: 'MDN: float', href: 'https://developer.mozilla.org/en-US/docs/Web/CSS/float' },
  { label: 'MDN: position', href: 'https://developer.mozilla.org/en-US/docs/Web/CSS/position' },
  { label: 'MDN: display', href: 'https://developer.mozilla.org/en-US/docs/Web/CSS/display' },
  {
    label: 'MDN: Flexbox',
    href: 'https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Flexbox',
  },
  { label: 'MDN: @media', href: 'https://developer.mozilla.org/en-US/docs/Web/CSS/@media' },
  {
    label: 'MDN: print styles',
    href: 'https://developer.mozilla.org/en-US/docs/Web/CSS/Media_Queries/Using_media_queries#printing',
  },
];

const slideDefinitions = [
  {
    id: 'title',
    title: 'CSS II – layout a responzivita',
    activityType: 'learn',
    subtitle: 'ZWA-5 • Box model, float, position, display, flex, @media, print',
    presenterNotes: 'Začněte otázkou: kde se v layoutu projeví velikost boxu?',
    bullets: [
      'Box model (padding/border/margin)',
      'Float a clear',
      'Position (static/relative/absolute/fixed)',
      'Display (inline/block/inline-block)',
      'Flexbox (zarovnání, mezery)',
      'Responzivita (@media)',
      'Tisk (print stylesheet)',
    ],
  },
  {
    id: 'theory',
    title: 'Teorie – CSS II',
    activityType: 'learn',
    presenterNotes: 'Ukažte rozdíl mezi flow, flexboxem a media query na jednom layoutu.',
    sections: [
      {
        icon: '📦',
        title: 'Box model',
        points: [
          'Každý element má content, padding, border a margin.',
          'box-sizing:border-box zahrne padding+border do šířky/výšky.',
          'Svislé marginy se mohou sčítat (margin collapsing).',
        ],
      },
      {
        icon: '🧭',
        title: 'Float & Clear',
        points: [
          'float odsunuje element vlevo/vpravo a text jej obtéká.',
          'clearfix (např. ::after s clear:both) zabrání kolapsu výšky rodiče.',
          'Float se dnes používá výjimečně (historický layout).',
        ],
      },
      {
        icon: '📍',
        title: 'Position',
        points: [
          'static (výchozí), relative (posun bez vlivu na flow), absolute (vyjme z flow, kotvený k nejbližšímu positioned rodiči)',
          'fixed (kotvení k viewportu), sticky (hybrid mezi relative a fixed).',
          'Zvažte z-index a stacking contexty.',
        ],
      },
      {
        icon: '🧱',
        title: 'Display',
        points: [
          'inline vs. block vs. inline-block – vliv na tok a box model.',
          'display:none odstraní z flow i accessibility stromu (pozor na ARIA).',
          'Moderní layout řešte Flexbox/Grid, ne tabulkami.',
        ],
      },
      {
        icon: '🧰',
        title: 'Flexbox',
        points: [
          'Parent: display:flex; children: flex properties (flex, order, align).',
          'Zarovnání: justify-content (hlavní osa), align-items (příčná osa).',
          'margin-left:auto rychle odsune prvek na konec řádku.',
        ],
      },
      {
        icon: '📱',
        title: 'Media queries',
        points: [
          '@media (min-width: ...) pro mobile-first přístup.',
          'Používejte promyšlené breakpoints dle obsahu, ne zařízení.',
          'Preferujte relativní jednotky (em/rem/vw/vh).',
        ],
      },
      {
        icon: '🖨️',
        title: 'Print',
        points: [
          'Samostatný stylesheet přes <link media="print">.',
          'Skryjte navigaci, barevné pozadí a zvyšte kontrast textu.',
          'Zajistěte čitelnost: font-size, margins, page-break.',
        ],
      },
    ],
  },
  {
    id: 'links',
    title: 'Odkazy',
    activityType: 'learn',
    links: CSS2_REFERENCE_LINKS,
  },
  {
    id: 'quiz-css',
    title: 'KVÍZ: CSS základy',
    activityType: 'quick-check',
    presenterNotes: 'Nechte studenty nejdřív zdůvodnit volbu, teprve potom zobrazte skóre.',
    steps: [],
  },
  {
    id: 'tasks',
    title: 'Úlohy – CSS II',
    activityType: 'apply',
    presenterNotes: 'Před kontrolou požádejte o předpověď, jak se změna projeví v náhledu.',
    steps: [],
  },
];

const slides = slideDefinitions.flatMap((slide) => {
  if (slide.id !== 'tasks') return [slide];
  const steps = getTaskTemplates(0).all;
  return steps.map((step, index) => ({
    ...slide,
    id: index === 0 ? 'tasks' : `css2-task-${step.id}`,
    title: step.title,
    steps: [step],
    taskIndex: index,
  }));
});

function Css2SlideContent({ slide }) {
  const hasSections = Array.isArray(slide.sections) && slide.sections.length > 0;

  return (
    <>
      {slide.bullets && (
        <ul className="list-disc pl-6 space-y-1 mt-2">
          {slide.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      )}
      {slide.links && (
        <ul className="list-disc pl-6 space-y-2 mt-2">
          {slide.links.map((link) => (
            <li key={link.href}>
              <a
                className="text-sky-700 underline underline-offset-2 hover:text-sky-900 dark:text-sky-400 dark:hover:text-sky-300"
                href={link.href}
                target="_blank"
                rel="noreferrer noopener"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      )}
      {hasSections && (
        <div className="mt-4">
          <TheorySections sections={slide.sections} />
        </div>
      )}
      {slide.id === 'quiz-css' && (
        <div className="mt-2">
          <QuizCssBasics />
        </div>
      )}
    </>
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
      text: 'Pořadí stavů odkazů (doporučené) je…',
      options: [
        ':visited, :link, :hover, :active',
        ':link, :visited, :hover, :active',
        ':hover, :link, :visited, :active',
      ],
      correctIndex: 1,
      hint: 'LVHA',
    },
    {
      id: 'q2',
      text: 'Které pravidlo má vyšší specifitu?',
      options: ['.card .title', '#title', 'header h1'],
      correctIndex: 1,
      hint: 'id > třída > element',
    },
    {
      id: 'q3',
      text: 'Co dělá box-sizing:border-box?',
      options: ['Zruší padding', 'Zahrne padding+border do šířky/výšky', 'Změní display na block'],
      correctIndex: 1,
      hint: 'Výpočet boxu',
    },
    {
      id: 'q4',
      text: 'Které z následujících ODEBERE element z toku a accessibility?',
      options: ['visibility:hidden', 'display:none', 'opacity:0'],
      correctIndex: 1,
      hint: 'display:none',
    },
    {
      id: 'q5',
      text: 'Jak zarovnáte tlačítko vpravo ve flex řádku?',
      options: ['text-align:right', 'margin-left:auto', 'float:right'],
      correctIndex: 1,
      hint: 'Flex a auto margin',
    },
    {
      id: 'q6',
      text: 'Mobile-first media query pro desktop je…',
      options: [
        '@media (max-width: 800px)',
        '@media (min-width: 800px)',
        '@media screen and (touch)',
      ],
      correctIndex: 1,
      hint: 'min-width pro větší obrazovky',
    },
    {
      id: 'q7',
      text: 'Jak nejlépe zajistit obtékání obrázku textem v moderním layoutu?',
      options: ['float', 'flexbox justify-content', 'obvykle ne – použíjte float jen výjimečně'],
      correctIndex: 2,
      hint: 'Float je historický',
    },
  ];
  return (
    <KnowledgeCheck
      title="CSS II: layout a responzivita"
      subtitle="Ověřte si box model, flexbox, media queries, display a práci s odkazy."
      questions={questions}
      visual={
        <div role="img" aria-label="Schéma CSS layoutu" data-quiz-visual="css-layout">
          <strong>flex</strong> · grid · @media
        </div>
      }
    />
  );
}

export default function AppCss2Lesson() {
  const { activeSection, setActiveSection } = useLearningNavigation(slides);
  const cssTaskRef = useRef(null);
  const current = slides.find((section) => section.id === activeSection) || slides[0];
  const hasTasks = typeof current.taskIndex === 'number';
  const taskTemplates = getTaskTemplates(current.taskIndex || 0);
  return (
    <LearningExperience
      lesson={getLessonByNumber(5)}
      sections={slides}
      activeSection={activeSection}
      onChange={setActiveSection}
      title="ZWA-5: Interaktivní prezentace CSS II"
      objective="Vytvoříte a ověříte responzivní CSS layout pomocí box modelu, flexboxu, media queries a tisku."
      subtitle={
        <>
          Editor vlevo, náhled vpravo. Úkoly dle{' '}
          <a
            className="underline"
            href="https://cw.fel.cvut.cz/wiki/courses/b6b39zwa/tutorials/05/start"
            target="_blank"
            rel="noreferrer noopener"
          >
            Cvičení 5 – CSS II
          </a>
          .
        </>
      }
      footerText="© 2025 ZWA – Interaktivní lekce CSS II"
    >
      <LearningSection section={current} idPrefix="lesson-css-ii">
        {hasTasks ? (
          <Css2TaskProvider ref={cssTaskRef} stepIndex={current.taskIndex}>
            <ExerciseStage
              privateMarker="css-exercise"
              onVerify={() => cssTaskRef.current?.runValidation()}
              brief={
                <>
                  <p>
                    <strong>{taskTemplates.step.title}</strong>
                  </p>
                  <p>{taskTemplates.step.desc}</p>
                  <p>
                    Odkaz:{' '}
                    <a
                      className="underline"
                      href="https://cw.fel.cvut.cz/wiki/courses/b6b39zwa/tutorials/05/start"
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      Cvičení 5 – CSS II
                    </a>
                  </p>
                </>
              }
              studio={<Css2TaskIde stepIndex={current.taskIndex} />}
              preview={<Css2TaskPreview />}
              verification={<Css2TaskVerification />}
            />
            <p>Validace je zjednodušená pomocí computed styles a regulárních výrazů.</p>
          </Css2TaskProvider>
        ) : (
          <Css2SlideContent slide={current} />
        )}
      </LearningSection>
    </LearningExperience>
  );
}
