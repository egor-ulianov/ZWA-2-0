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
import heroImg from './src/interactive-zwa-1/assets/semestral-meme.png';
import memeImg from './src/interactive-zwa-2/assets/image.png';
import { getLessonByNumber } from './src/config/lessons.js';
import contentStyles from './src/course-ui/content/content.module.css';
import ExerciseStage from './src/course-ui/exercises/ExerciseStage.jsx';
import KnowledgeCheck from './src/course-ui/exercises/KnowledgeCheck.jsx';
import StudioEditor from './src/course-ui/exercises/StudioEditor.jsx';
import StudioTabs from './src/course-ui/exercises/StudioTabs.jsx';
import SandboxFrame from './src/course-ui/exercises/runtime/SandboxFrame.jsx';
import { LearningExperience } from './src/course-ui/learning/LearningExperience.jsx';
import { LearningSection } from './src/course-ui/learning/LearningSection.jsx';
import { useLearningNavigation } from './src/course-ui/learning/useLearningNavigation.js';

import {
  CSS_BASICS_INSPECTION,
  validateCssBasics,
} from './src/course-ui/exercises/runtime/validators.js';

function clsx(...values) {
  return values.filter(Boolean).join(' ');
}

// Small React-token based highlighters. Student text stays text; React escapes it.
function tokenizeCode(source, pattern, getClassName) {
  if (!source) return null;
  const nodes = [];
  let cursor = 0;
  let match;
  let key = 0;
  pattern.lastIndex = 0;
  while ((match = pattern.exec(source)) !== null) {
    if (match.index > cursor) nodes.push(source.slice(cursor, match.index));
    const token = match[0];
    const className = getClassName(token, source.slice(match.index + token.length));
    nodes.push(
      className ? (
        <span key={`token-${key++}`} className={className}>
          {token}
        </span>
      ) : (
        token
      ),
    );
    cursor = match.index + token.length;
  }
  if (cursor < source.length) nodes.push(source.slice(cursor));
  return nodes;
}

const CSS_TOKEN_PATTERN =
  /\/\*[\s\S]*?\*\/|@[a-zA-Z-]+|!important\b|#[0-9a-fA-F]{3,8}\b|-?\d*\.?\d+(?:px|%|em|rem|vh|vw|ms|s)\b|\b(?:transparent|none|solid|ease|inherit|initial|unset|auto|block|inline|flex)\b|[a-zA-Z-]+(?=\s*:)|[^{}\n]+(?=\s*\{)/gi;

function highlightCss(source) {
  return tokenizeCode(source, CSS_TOKEN_PATTERN, (token, following) => {
    if (token.startsWith('/*')) return 'text-zinc-400';
    if (/^@/.test(token)) return 'text-purple-600';
    if (/^!important$/i.test(token)) return 'text-rose-700';
    if (/^#[0-9a-f]/i.test(token)) return 'text-pink-600';
    if (/^-?\d*\.?\d+(?:px|%|em|rem|vh|vw|ms|s)$/i.test(token)) return 'text-emerald-700';
    if (
      /^(transparent|none|solid|ease|inherit|initial|unset|auto|block|inline|flex)$/i.test(token)
    ) {
      return 'text-indigo-700';
    }
    if (/^\s*:/.test(following)) return 'text-amber-700';
    return 'text-sky-700 font-medium';
  });
}

const HTML_TOKEN_PATTERN =
  /<!--[\s\S]*?-->|<\/?[a-zA-Z][\w:-]*|[a-zA-Z_:][\w:.-]*(?=\s*=)|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\/?\s*>/g;

function highlightHtml(source) {
  return tokenizeCode(source, HTML_TOKEN_PATTERN, (token) => {
    if (token.startsWith('<!--')) return 'text-zinc-400';
    if (token.startsWith('<') || /^\/?\s*>$/.test(token)) return 'text-purple-600';
    if (/^(?:"|')/.test(token)) return 'text-emerald-700';
    return 'text-amber-700';
  });
}

// Task templates provider (HTML/CSS per slide + step)
function getTaskTemplates(slideId, stepIndex) {
  const heroSrc = heroImg?.src || '';
  // Base HTML used for CSS tasks
  const baseHtml = `
<!-- CSS úlohy: NEUPRAVUJTE HTML; pracujte v záložce CSS. Místa k vyplnění jsou označena komentářem "TODO". -->
<header>
  <h1 id="title">ZWA-2: CSS Practice Playground</h1>
  <nav>
    <ol class="submenu">
      <li>Selectors</li>
      <li>Classes</li>
      <li>Links</li>
    </ol>
  </nav>
</header>

<main>
  <section class="hero" style="margin: 12px 0;">
    <img src="${heroSrc}" alt="Hero" style="max-width: 100%; border-radius: 12px; border: 1px solid #e5e7eb;" />
  </section>
  <article>
    <p class="excerpt">V tomto úryvku si vyzkoušíte práci s pseudo-elementem první písmeno. Cílem je zvětšit první písmeno a odlišit ho pozadím.</p>
  </article>
</main>

<footer style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
  <a href="#selectors">Selectors</a> ·
  <a href="#classes">Classes</a> ·
  <a href="#links">Links</a>
</footer>`;

  // Linking exercise HTML skeleton
  const linkHtml = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Link CSS</title>
    <!-- TODO: Přidejte odkaz na stylopis přesně takto: -->
    <!-- <link rel="stylesheet" href="styles.css"> -->
    <!-- [VLOŽTE SEM] -->
  </head>
  <body>
    <h1 id="title">Hello CSS</h1>
    <p>Link your stylesheet to change the title color.</p>
  </body>
</html>`;

  // Choose by slide id
  if (slideId === 'linking') {
    // Two steps in linking; templates are same base, students edit HTML and CSS
    return {
      html: linkHtml,
      css:
        stepIndex === 0
          ? ''
          : '/* styles.css — TODO: Nastavte barvu #title na #16a34a */\nh1#title {\n  /* napište sem vlastnosti */\n}',
    };
  }

  // Default to CSS tasks (5 steps)
  const cssPlaceholders = [
    `/* TODO 1: Nastavte #title na modrou (#1d4ed8) a velikost 36px. */\nh1#title {\n  /* napište sem vlastnosti */\n}`,
    `/* TODO 2: Změňte odkazy ve footeru na písmo Georgia a barvu #2563eb.\n   Nezapomeňte také definovat :visited se stejnou barvou. */\nfooter a {\n  /* napište sem vlastnosti */\n}\nfooter a:visited {\n  /* napište sem vlastnosti */\n}`,
    `/* TODO 3: Zvětšete první písmeno v p.excerpt a přidejte pozadí. */\np.excerpt::first-letter {\n  /* napište sem vlastnosti */\n}`,
    `/* TODO 4: Nastavte pro ol.submenu číslování na lower-alpha. */\nol.submenu {\n  /* napište sem vlastnosti */\n}`,
    `/* TODO 5: Přidejte na .hero img efekt při hover: mírné zvětšení\n   a plynulý přechod. */\n.hero img:hover {\n  /* napište sem vlastnosti */\n}`,
  ];

  const idx = Math.max(0, Math.min(stepIndex || 0, cssPlaceholders.length - 1));
  return { html: baseHtml, css: cssPlaceholders[idx] };
}

function getTaskSolution(slideId, stepIndex) {
  if (slideId === 'linking') {
    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Link CSS</title>
    <link rel="stylesheet" href="styles.css">
  </head>
  <body>
    <h1 id="title">Hello CSS</h1>
    <p>Link your stylesheet to change the title color.</p>
  </body>
</html>`;
    return {
      html,
      css:
        stepIndex === 0
          ? '/* styles.css is linked in index.html. */'
          : 'h1#title {\n  color: #16a34a;\n}',
    };
  }

  const solutions = [
    'h1#title {\n  color: #1d4ed8;\n  font-size: 36px;\n}',
    'footer a {\n  font-family: Georgia, serif;\n  color: #2563eb;\n}\n\nfooter a:visited {\n  color: #2563eb;\n}',
    'p.excerpt::first-letter {\n  font-size: 200%;\n  background: #fef08a;\n}',
    'ol.submenu {\n  list-style-type: lower-alpha;\n}',
    '.hero img {\n  transition: transform 200ms ease;\n}\n\n.hero img:hover {\n  transform: scale(1.05);\n}',
  ];
  return {
    html: getTaskTemplates('tasks', stepIndex).html.replace(/^<!-- CSS úlohy:[^\n]*\n/, ''),
    css: solutions[stepIndex] || solutions[0],
  };
}

const CssTaskContext = createContext(null);

const CssTaskProvider = forwardRef(function CssTaskProvider({ slideId, stepIndex, children }, ref) {
  const [activeFileId, setActiveFileId] = useState(
    slideId === 'linking' ? 'styles.css' : 'style.css',
  );
  const [autoApply, setAutoApply] = useState(true);
  const [applyVersion, setApplyVersion] = useState(0);
  const [validationVersion, setValidationVersion] = useState(0);
  const [results, setResults] = useState([]);
  const templates = useMemo(() => getTaskTemplates(slideId, stepIndex), [slideId, stepIndex]);
  const [htmlCode, setHtmlCode] = useState(templates.html);
  const [cssCode, setCssCode] = useState(templates.css);

  /* eslint-disable react-hooks/set-state-in-effect -- template changes define a new exercise. */
  useEffect(() => {
    setHtmlCode(templates.html);
    setCssCode(templates.css);
    setActiveFileId(slideId === 'linking' ? 'styles.css' : 'style.css');
    setResults([]);
  }, [slideId, templates]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const previewCss = useMemo(() => {
    if (slideId !== 'linking') return cssCode;
    const hasLink = /<link[^>]*rel=["']stylesheet["'][^>]*href=["']styles\.css["'][^>]*>/i.test(
      htmlCode,
    );
    return hasLink ? cssCode : '';
  }, [cssCode, htmlCode, slideId]);

  const applyOnce = useCallback(() => setApplyVersion((version) => version + 1), []);
  const onHtmlChange = useCallback(
    (value) => {
      setHtmlCode(value);
      if (autoApply) setApplyVersion((version) => version + 1);
    },
    [autoApply],
  );
  const onCssChange = useCallback(
    (value) => {
      setCssCode(value);
      if (autoApply) setApplyVersion((version) => version + 1);
    },
    [autoApply],
  );
  const validate = useCallback(() => {
    setResults([]);
    setValidationVersion((version) => version + 1);
  }, []);
  const handleInspection = useCallback(
    (message) => {
      if (message.type === 'result') {
        setResults(
          validateCssBasics({ slideId, stepIndex, inspection: message.value, htmlCode, cssCode }),
        );
      } else if (message.type === 'error') {
        setResults([{ ok: false, text: 'Úloha: kontrola použitých stylů selhala.' }]);
      }
    },
    [cssCode, htmlCode, slideId, stepIndex],
  );

  useImperativeHandle(ref, () => ({ runValidation: validate }), [validate]);

  return (
    <CssTaskContext.Provider
      value={{
        activeFileId,
        setActiveFileId,
        autoApply,
        setAutoApply,
        applyVersion,
        validationVersion,
        results,
        htmlCode,
        cssCode,
        previewCss,
        applyOnce,
        onHtmlChange,
        onCssChange,
        validate,
        handleInspection,
      }}
    >
      {children}
    </CssTaskContext.Provider>
  );
});
function CssReferencePanel({ solution }) {
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

function CssTaskIde({ slideId, stepIndex }) {
  const { activeFileId, setActiveFileId, htmlCode, cssCode, onHtmlChange, onCssChange } =
    useContext(CssTaskContext);
  const solution = getTaskSolution(slideId, stepIndex);
  const cssFileId = slideId === 'linking' ? 'styles.css' : 'style.css';
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
              onChange={onHtmlChange}
              language="html"
              label="index.html"
            />
          ),
        },
        {
          id: cssFileId,
          label: cssFileId,
          panel: (
            <StudioEditor value={cssCode} onChange={onCssChange} language="css" label={cssFileId} />
          ),
        },
      ]}
      solution={{ label: 'Řešení', panel: <CssReferencePanel solution={solution} /> }}
    />
  );
}

function CssTaskInstructions({ steps, stepIndex }) {
  const step = steps[stepIndex];
  if (!step) return null;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full border border-sky-200/60 bg-sky-100 px-2 py-0.5 text-[11px] text-sky-800 dark:border-sky-800 dark:bg-sky-900/40 dark:text-sky-300">
          Úloha
        </span>
      </div>
      <p className="mt-2 font-semibold">{step.title}</p>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{step.desc}</p>
      {step.examples && (
        <pre className="mt-3 overflow-x-auto rounded-lg bg-zinc-100/70 p-3 text-xs whitespace-pre-wrap dark:bg-zinc-800/70">
          {step.examples.join('\n')}
        </pre>
      )}
      {step.hint && <p className="mt-3 text-xs text-zinc-500">Nápověda: {step.hint}</p>}
    </div>
  );
}

function CssTaskPreview() {
  const { applyVersion, validationVersion, htmlCode, previewCss, handleInspection } =
    useContext(CssTaskContext);
  return (
    <div className="space-y-3">
      <SandboxFrame
        key={applyVersion}
        html={htmlCode}
        css={previewCss}
        mode="static"
        title="Náhled CSS playgroundu"
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
            css={previewCss}
            mode="inspect"
            inspection={CSS_BASICS_INSPECTION}
            onMessage={handleInspection}
            title="Sandbox kontroly CSS"
            className="h-[768px] w-[1024px]"
          />
        </div>
      )}
    </div>
  );
}

function CssTaskVerification() {
  const { results } = useContext(CssTaskContext);
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

const VsPlayground = forwardRef(function VsPlayground({ slideId, stepIndex }, ref) {
  const [activeTab, setActiveTab] = useState('css');
  const [autoApply, setAutoApply] = useState(true);
  const [applyVersion, setApplyVersion] = useState(0);
  const [validationVersion, setValidationVersion] = useState(0);
  const [results, setResults] = useState([]);

  // Editors state
  const templates = useMemo(() => getTaskTemplates(slideId, stepIndex), [slideId, stepIndex]);
  const [htmlCode, setHtmlCode] = useState(templates.html);
  const [cssCode, setCssCode] = useState(templates.css);

  // Reset editors when task changes
  /* eslint-disable react-hooks/set-state-in-effect -- template changes define a new exercise. */
  useEffect(() => {
    setHtmlCode(templates.html);
    setCssCode(templates.css);
    setResults([]);
  }, [templates]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const preRef = useRef(null);
  const textRef = useRef(null);

  function syncScroll() {
    if (!textRef.current || !preRef.current) return;
    preRef.current.scrollTop = textRef.current.scrollTop;
    preRef.current.scrollLeft = textRef.current.scrollLeft;
  }

  const previewCss = useMemo(() => {
    if (slideId !== 'linking') return cssCode;
    const hasLink = /<link[^>]*rel=["']stylesheet["'][^>]*href=["']styles\.css["'][^>]*>/i.test(
      htmlCode,
    );
    return hasLink ? cssCode : '';
  }, [cssCode, htmlCode, slideId]);

  function applyOnce() {
    setApplyVersion((v) => v + 1);
  }

  function onHtmlChange(v) {
    setHtmlCode(v);
    if (autoApply) setApplyVersion((x) => x + 1);
  }

  function onCssChange(v) {
    setCssCode(v);
    if (autoApply) setApplyVersion((x) => x + 1);
  }

  const validate = useCallback(() => {
    setResults([]);
    setValidationVersion((version) => version + 1);
  }, []);

  useImperativeHandle(ref, () => ({ runValidation: validate }), [validate]);

  function handleInspection(message) {
    if (message.type === 'result') {
      setResults(
        validateCssBasics({
          slideId,
          stepIndex,
          inspection: message.value,
          htmlCode,
          cssCode,
        }),
      );
    } else if (message.type === 'error') {
      setResults([{ ok: false, text: 'Úloha: při kontrole použitých stylů nastala chyba' }]);
    }
  }

  return (
    <div
      data-projector-private="css-exercise"
      className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 shadow overflow-hidden"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
        <div className="p-3 border-b lg:border-b-0 lg:border-r border-zinc-200/60 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-sm">Editor</div>
            <label className="text-xs flex items-center gap-1">
              <input
                type="checkbox"
                checked={autoApply}
                onChange={(e) => setAutoApply(e.target.checked)}
              />
              Použít automaticky
            </label>
          </div>
          <div className="flex items-center gap-1 mb-2">
            <button
              className={clsx(
                'px-3 py-1.5 text-xs rounded-t-lg border',
                activeTab === 'html'
                  ? 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700'
                  : 'bg-zinc-100/70 dark:bg-zinc-800/60 border-transparent',
              )}
              onClick={() => setActiveTab('html')}
            >
              HTML
            </button>
            <button
              className={clsx(
                'px-3 py-1.5 text-xs rounded-t-lg border',
                activeTab === 'css'
                  ? 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700'
                  : 'bg-zinc-100/70 dark:bg-zinc-800/60 border-transparent',
              )}
              onClick={() => setActiveTab('css')}
            >
              CSS
            </button>
          </div>
          <div className="relative rounded-xl border border-zinc-200/60 dark:border-zinc-800 overflow-hidden">
            <pre
              ref={preRef}
              aria-hidden
              className="pointer-events-none whitespace-pre-wrap font-mono text-xs p-3 text-zinc-800 dark:text-zinc-200 bg-white/70 dark:bg-zinc-900/60 min-h-[450px] max-h-[450px] overflow-auto"
            >
              {activeTab === 'css' ? highlightCss(cssCode) : highlightHtml(htmlCode)}
            </pre>
            <label className="sr-only" htmlFor="css-inline-editor">
              Editor HTML a CSS
            </label>
            <textarea
              id="css-inline-editor"
              aria-label="Editor HTML a CSS"
              ref={textRef}
              value={activeTab === 'css' ? cssCode : htmlCode}
              onChange={(e) =>
                activeTab === 'css' ? onCssChange(e.target.value) : onHtmlChange(e.target.value)
              }
              onScroll={syncScroll}
              spellCheck={false}
              className="absolute inset-0 w-full h-full font-mono text-xs p-3 bg-transparent text-transparent caret-black dark:caret-white resize-none outline-none"
            />
          </div>
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
          <div className="text-xs text-zinc-500 mt-2">
            Tip: Šablony se mění podle vybrané úlohy vlevo. Místa k doplnění jsou označena TODO
            komentáři.
          </div>
        </div>
        <div className="p-3">
          <div className="font-semibold text-sm mb-2">Náhled</div>
          <SandboxFrame
            html={htmlCode}
            css={previewCss}
            mode="static"
            title="Náhled CSS playgroundu"
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
                css={previewCss}
                mode="inspect"
                inspection={CSS_BASICS_INSPECTION}
                onMessage={handleInspection}
                title="Sandbox kontroly CSS"
                className="h-[768px] w-[1024px]"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// (old linking playground replaced by VsPlayground)

void VsPlayground;

const slideDefinitions = [
  {
    id: 'title',
    title: 'Základy CSS – interaktivní cvičení',
    activityType: 'learn',
    subtitle: 'ZWA-4 • Selektory, třídy, odkazy',
    body: 'Krátká praktická hřiště pro procvičení základních selektorů, pseudo-elementů a jednoduchých efektů.',
    bullets: ['Selektory a specifita', 'Třídy a znovupoužitelnost', 'Pseudo-elementy a odkazy'],
  },
  {
    id: 'quiz-css',
    title: 'KVÍZ: CSS základy',
    activityType: 'quick-check',
    body: null,
  },
  {
    id: 'theory',
    title: 'Teorie – CSS základy',
    activityType: 'learn',
    sections: [
      {
        title: 'Selektory a specifita',
        paragraphs: [
          'Selektor propojuje pravidlo CSS s konkrétní částí dokumentu. Elementový selektor, například h1, zasáhne všechny prvky daného typu; třída .btn popisuje opakovatelnou roli a id #main má označovat jediný prvek. Kombinátory A B, A > B, A + B a A ~ B pak zpřesňují vztah mezi prvky.',
          'Když na jeden prvek míří více pravidel, prohlížeč porovnává jejich specifitu. Inline styl má nejvyšší běžnou váhu, po něm následuje id, třída nebo atribut a nakonec element. Toto pořadí je důležitější než mechanické počítání bodů: cílem je psát selektory, jejichž priorita je čitelná a předvídatelná.',
          'Pseudo-třídy jako :hover nebo :visited popisují stav, zatímco pseudo-element ::first-letter vybírá virtuální část prvku. Atributové selektory pomáhají pracovat s významem HTML bez dalších tříd. !important používejte jen výjimečně; obvykle je lepší upravit strukturu pravidel a znovupoužitelné styly stavět na třídách.',
        ],
      },
      {
        title: 'Kaskáda a dědičnost',
        paragraphs: [
          'Kaskáda rozhoduje, které z platných pravidel se nakonec použije. Zohledňuje původ stylu, důležitost deklarace, specifitu selektoru a při shodě také pořadí zápisu. Proto pozdější pravidlo nepřebíjí vše automaticky — musí nejprve projít předchozími úrovněmi rozhodování.',
          'Dědičnost je jiný mechanismus. Barva a písmo obvykle přecházejí z rodiče na potomky, zatímco margin, padding a další části box modelu nikoli. Hodnotami inherit, initial, unset a revert lze chování řídit explicitně, ale dobře navržený stylopis většinou spoléhá na přirozenou dědičnost typografie.',
          'Pište pravidla od obecných ke konkrétním a udržujte jejich specifitu nízkou. Normalizace sjednotí výchozí styly prohlížečů a kaskádové vrstvy @layer mohou vyjádřit prioritu celých skupin pravidel bez řetězení stále složitějších selektorů.',
        ],
      },
      {
        title: 'Stavové selektory odkazů',
        paragraphs: [
          'Odkaz může být nenavštívený, navštívený, aktivovaný ukazatelem, zaměřený klávesnicí nebo právě stisknutý. Pravidla :link, :visited, :hover, :focus-visible a :active proto zapisujte v konzistentním pořadí, aby pozdější stav nepřepsal dřívější nečekaným způsobem.',
          'Hover není na dotykových zařízeních spolehlivý a nesmí být jediným signálem interakce. Stejnou pozornost věnujte focusu a aktivnímu stavu. Klikací plochu zvětšujte paddingem, protože margin pouze oddaluje okolní obsah a nestává se součástí odkazu.',
          'Prohlížeče z bezpečnostních důvodů omezují vlastnosti dostupné pro :visited, takže navštívený odkaz nemůže měnit rozvržení stránky. Odlišení barvou je naopak vhodné, pokud zůstává dostatečně kontrastní a dává uživateli užitečnou informaci o historii navigace.',
        ],
      },
    ],
  },
  {
    id: 'meme',
    title: 'CSS Meme',
    activityType: 'learn',
    body: 'Krátké odlehčení: proč CSS patří ke každému webu.',
  },
  {
    id: 'linking',
    title: 'Propojení HTML a CSS',
    activityType: 'build',
    steps: [
      {
        title: '1) Vytvořte link na stylopis',
        desc: 'Vložením <link rel="stylesheet" href="styles.css"> do <head> propojíte HTML se souborem CSS.',
        examples: ['<head>', '  <link rel="stylesheet" href="styles.css">', '</head>'],
        hint: 'Použijte přesně název styles.css',
      },
      {
        title: '2) Změňte barvu nadpisu v CSS',
        desc: 'V styles.css nastavte zelenou barvu pro #title.',
        examples: ['h1#title {', '  color: #16a34a;', '}'],
        hint: 'Po propojení by se měl náhled obarvit.',
      },
    ],
  },
  {
    id: 'tasks',
    title: 'Úlohy – CSS',
    activityType: 'build',
    steps: [
      {
        title: '1) Nadpis',
        desc: 'Zmodřete hlavní nadpis a nastavte velikost písma.',
        examples: ['h1#title {', '  color: #1d4ed8;', '  font-size: 36px;', '}'],
        hint: 'Použijte id selektor a hex barvu.',
      },
      {
        title: '2) Odkazy ve footeru',
        desc: 'Změňte písmo na Georgia a barvu na #2563eb. Navštívené odkazy mají stejnou barvu.',
        examples: [
          'footer a {',
          '  font-family: Georgia, serif;',
          '  color: #2563eb;',
          '}',
          'footer a:visited {',
          '  color: #2563eb;',
          '}',
        ],
        hint: 'Nezapomeňte na :visited.',
      },
      {
        title: '3) První písmeno',
        desc: 'V odstavci .excerpt zvětšete první písmeno a přidejte pozadí.',
        examples: [
          'p.excerpt::first-letter {',
          '  font-size: 200%;',
          '  background: #fef08a;',
          '}',
        ],
        hint: 'Použijte pseudo-element ::first-letter.',
      },
      {
        title: '4) Submenu jako písmena',
        desc: 'Převeďte číslování v ol.submenu na lower-alpha.',
        examples: ['ol.submenu {', '  list-style-type: lower-alpha;', '}'],
        hint: 'Vlastnost list-style-type.',
      },
      {
        title: '5) Hover efekt na obrázku',
        desc: 'Při hover lehce zvětšit obrázek a přidat plynulý přechod.',
        examples: [
          '.hero img:hover {',
          '  transform: scale(1.05);',
          '  transition: transform 200ms ease;',
          '}',
        ],
        hint: 'Transform + transition.',
      },
    ],
  },
];

const slides = slideDefinitions.flatMap((slide) => {
  if (!['linking', 'tasks'].includes(slide.id) || !Array.isArray(slide.steps)) return [slide];
  return slide.steps.map((step, index) => ({
    ...slide,
    id: index === 0 ? slide.id : `${slide.id}-${index + 1}`,
    title: step.title,
    steps: [step],
    taskGroup: slide.id,
    taskIndex: index,
  }));
});

function CssTheory({ sections }) {
  return (
    <div className={contentStyles.theoryFlow} data-theory-flow="true">
      {sections.map((section, index) => (
        <section className={contentStyles.theoryTopic} data-theory-topic="true" key={section.title}>
          <span className={contentStyles.theoryIndex}>{String(index + 1).padStart(2, '0')}</span>
          <div className={contentStyles.theoryBody}>
            <h3>{section.title}</h3>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function CssSlideContent({ slide, stepIndex: controlledIndex, onStepIndexChange }) {
  const hasSteps = Array.isArray(slide.steps) && slide.steps.length > 0;
  const hasSections = Array.isArray(slide.sections) && slide.sections.length > 0;
  const isControlled =
    typeof controlledIndex === 'number' && typeof onStepIndexChange === 'function';
  const [internalIndex, setInternalIndex] = useState(0);
  // Uncontrolled step state restarts when the displayed task changes.
  /* eslint-disable react-hooks/set-state-in-effect -- the step sequence belongs to the current slide. */
  useEffect(() => {
    if (!isControlled) setInternalIndex(0);
  }, [slide, isControlled]);
  /* eslint-enable react-hooks/set-state-in-effect */
  const stepIndex = isControlled ? controlledIndex : internalIndex;
  const setStepIndex = isControlled ? onStepIndexChange : setInternalIndex;
  const totalSteps = hasSteps ? slide.steps.length : 0;
  const currentStep = hasSteps ? slide.steps[stepIndex] : null;
  return (
    <>
      {slide.body && !hasSections && !hasSteps && (
        <div>
          <p className="leading-relaxed">{slide.body}</p>
        </div>
      )}
      {slide.id === 'quiz-css' && (
        <div className="mt-2">
          <QuizCssBasics />
        </div>
      )}
      {slide.bullets && !hasSections && !hasSteps && (
        <ul className="list-disc pl-6 space-y-1 mt-2">
          {slide.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      )}
      {hasSections && <CssTheory sections={slide.sections} />}
      {hasSteps && currentStep && (
        <div className="mt-4">
          <div className="rounded-xl border border-zinc-200/60 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800">
                Úloha {stepIndex + 1} / {totalSteps}
              </span>
            </div>
            <div className="font-semibold mb-1">{currentStep.title}</div>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-2">{currentStep.desc}</p>
            {currentStep.examples && (
              <pre className="text-xs bg-zinc-100/70 dark:bg-zinc-800/70 rounded-lg p-2 whitespace-pre-wrap">
                {currentStep.examples.join('\n')}
              </pre>
            )}
            {currentStep.hint && (
              <div className="text-xs text-zinc-500 mt-2">Nápověda: {currentStep.hint}</div>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <button
              className="px-3 py-1.5 text-sm rounded-lg border border-zinc-200/60 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 disabled:opacity-50"
              onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
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
                  onClick={() => setStepIndex(i)}
                  aria-label={`Přejít na úlohu ${i + 1}`}
                />
              ))}
            </div>
            <button
              className="px-3 py-1.5 text-sm rounded-lg border border-sky-500/30 bg-sky-600 text-white disabled:opacity-50"
              onClick={() => setStepIndex((i) => Math.min(totalSteps - 1, i + 1))}
              disabled={stepIndex === totalSteps - 1}
            >
              Další
            </button>
          </div>
        </div>
      )}
      {slide.id === 'meme' && (
        <div className="mt-3 rounded-xl overflow-hidden border border-zinc-200/60 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40">
          <img
            src={memeImg.src}
            alt="CSS meme"
            className="w-full max-h-[420px] object-contain bg-white dark:bg-zinc-900"
          />
        </div>
      )}
      {slide.id === 'title' && (
        <div className="text-xs text-zinc-500 mt-3">
          Studijní materiály:{' '}
          <a
            className="underline"
            href="https://cw.fel.cvut.cz/wiki/courses/b6b39zwa/tutorials/04/start"
            target="_blank"
            rel="noreferrer noopener"
          >
            Cvičení 4 – CSS
          </a>
        </div>
      )}
    </>
  );
}

// (old CSS and linking playgrounds consolidated into VsPlayground)
export default function App() {
  const { activeSection, setActiveSection } = useLearningNavigation(slides);
  const cssTaskRef = useRef(null);
  const [stepIndex, setStepIndex] = useState(0);
  const current = slides.find((section) => section.id === activeSection) || slides[0];

  // A new slide starts at its first task.
  /* eslint-disable react-hooks/set-state-in-effect -- reset is the slide transition boundary. */
  useEffect(() => {
    setStepIndex(0);
  }, [activeSection]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <LearningExperience
      lesson={getLessonByNumber(4)}
      sections={slides}
      activeSection={activeSection}
      onChange={setActiveSection}
      title="ZWA-4: CSS – interaktivní prezentace"
      objective="Použijete základní CSS selektory, pseudo-elementy a propojení stylopisu v praktickém playgroundu."
      subtitle="Vyberte úlohu, upravte kód v IDE a ověřte výsledek v náhledu."
      footerText="© 2025 ZWA – CSS interaktivní výuková ukázka"
    >
      <LearningSection section={current} idPrefix="lesson-css">
        {current.taskGroup ? (
          <CssTaskProvider
            ref={cssTaskRef}
            slideId={current.taskGroup}
            stepIndex={current.taskIndex}
          >
            <ExerciseStage
              brief={<CssTaskInstructions steps={current.steps} stepIndex={0} />}
              studio={<CssTaskIde slideId={current.taskGroup} stepIndex={current.taskIndex} />}
              preview={<CssTaskPreview />}
              verification={<CssTaskVerification />}
              onVerify={() => cssTaskRef.current?.runValidation()}
              privateMarker="css-exercise"
            />
          </CssTaskProvider>
        ) : (
          <CssSlideContent
            slide={current}
            stepIndex={Array.isArray(current.sections) ? stepIndex : undefined}
            onStepIndexChange={setStepIndex}
          />
        )}
      </LearningSection>
    </LearningExperience>
  );
}

function QuizCssBasics() {
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
  return (
    <KnowledgeCheck
      title="CSS základy"
      subtitle="Procvičte selektory, specifitu, stavové pseudo-třídy a typické CSS vlastnosti."
      questions={questions}
      visual={
        <div role="img" aria-label="Schéma specificity CSS" data-quiz-visual="css-specificity">
          <strong>#id</strong> &gt; .třída &gt; element
        </div>
      }
    />
  );
}
