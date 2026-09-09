import React, {
  createContext,
  forwardRef,
  useMemo,
  useRef,
  useState,
  useCallback,
  useImperativeHandle,
  useContext,
} from 'react';
import SandboxedPreview from './src/components/playground/SandboxedPreview';
import { getLessonByNumber } from './src/config/lessons.js';
import LessonShell, { useSlideNavigation } from './src/components/lesson/LessonShell.jsx';
import SharedSlideCard from './src/components/lesson/SlideCard.jsx';
import Code from './src/components/lesson/Code.jsx';
import LessonTaskWorkspace from './src/components/exercises/LessonTaskWorkspace.jsx';
import WorkspaceIdeTabs from './src/components/exercises/WorkspaceIdeTabs.jsx';
import SyntaxCodeEditor from './src/components/exercises/SyntaxCodeEditor.jsx';

function HtmlPreview({ html, title = 'Náhled HTML playgroundu' }) {
  return (
    <SandboxedPreview
      html={html}
      mode="static"
      title={title}
      className="w-full min-h-40 rounded-lg border bg-white"
    />
  );
}

function MinimalHtml5Skeleton() {
  const template = useMemo(
    () =>
      [
        '<!doctype html>',
        '<html lang="cs">',
        '  <head>',
        '    <meta charset="utf-8">',
        '    <meta name="viewport" content="width=device-width, initial-scale=1">',
        '    <title>Příklad HTML5</title>',
        '  </head>',
        '  <body>',
        '    <header><h1>Ahoj, HTML5!</h1></header>',
        '    <nav><a href="#">Domů</a></nav>',
        '    <main>',
        '      <section>',
        '        <article>',
        '          <h2>Ukázkový článek</h2>',
        '          <p>Semantické značky zlepšují čitelnost a SEO.</p>',
        '        </article>',
        '        <aside>Poznámka bokem</aside>',
        '      </section>',
        '      <figure>',
        '        <img src="https://placehold.co/400x200" alt="Náhled">',
        '        <figcaption>Popisek obrázku</figcaption>',
        '      </figure>',
        '      <table>',
        '        <tr><th>Jméno</th><th>Body</th></tr>',
        '        <tr><td>Ada</td><td>10</td></tr>',
        '      </table>',
        '    </main>',
        '    <footer>© 2025</footer>',
        '  </body>',
        '</html>',
      ].join('\n'),
    [],
  );
  return template;
}

// Minimal starting template for student tasks (intentionally incomplete)
function MinimalTaskTemplate() {
  return [
    '<!doctype html>',
    '<html lang="cs">',
    '  <head>',
    '    <meta charset="utf-8">',
    '    <title>Moje stránka</title>',
    '  </head>',
    '  <body>',
    '',
    '  </body>',
    '</html>',
  ].join('\n');
}

function runHtmlTaskChecks(text, taskId) {
  const issues = [];
  const req = (re, msg) => {
    if (!re.test(text)) issues.push(msg);
  };
  req(/<!doctype\s+html>/i, 'Chybí <!doctype html>');
  req(/<html[^>]*>/i, 'Chybí <html>');
  req(/<head[^>]*>/i, 'Chybí <head>');
  req(/<meta[^>]*charset=/i, 'Chybí <meta charset>');
  req(/<meta[^>]*viewport/i, 'Chybí <meta name="viewport"> (doporučeno)');
  req(/<title>[^<]+<\/title>/i, 'Chybí <title>');
  req(/<body[^>]*>/i, 'Chybí <body>');
  if (taskId === 'html-task-semantic') {
    ['header', 'nav', 'main', 'section', 'article', 'aside', 'footer'].forEach((tag) => {
      if (!new RegExp(`<${tag}[^>]*>`, 'i').test(text)) {
        issues.push(`Doplňte <${tag}> (sémantika)`);
      }
    });
  }
  if (taskId === 'html-task-media') {
    req(/<figure[^>]*>[\s\S]*<img[^>]*alt=[\s\S]*<\/figure>/i, 'Obrázek s alt vložte do <figure>');
    req(/<figcaption[^>]*>/i, 'Doplňte <figcaption>');
    if (!/(<table[\s\S]*?<th[\s\S]*?<td[\s\S]*?<\/table>)/i.test(text)) {
      issues.push('Tabulka by měla obsahovat hlavičku (<th>) i buňky (<td>)');
    }
    req(/colspan\s*=\s*"\d+"/i, 'V tabulce použijte alespoň jeden colspan');
    req(/rowspan\s*=\s*"\d+"/i, 'V tabulce použijte alespoň jeden rowspan');
  }
  return { issues, passed: issues.length === 0 };
}

const HtmlTaskContext = createContext(null);

const HtmlTaskProvider = forwardRef(function HtmlTaskProvider(
  { children, initialHtml, taskId },
  ref,
) {
  const [html, setHtml] = useState(() => initialHtml || MinimalTaskTemplate());
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState(null);

  const validateOnline = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch('/api/validate-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html }),
      });
      const data = await res.json();
      setResults({ type: 'online', data });
    } catch (e) {
      setResults({ type: 'error', error: String(e?.message || e) });
    } finally {
      setChecking(false);
    }
  }, [html]);

  useImperativeHandle(ref, () => ({ runValidation: validateOnline }), [validateOnline]);

  return (
    <HtmlTaskContext.Provider
      value={{
        html,
        setHtml,
        checking,
        results,
        validateOnline,
        local: runHtmlTaskChecks(html, taskId),
      }}
    >
      {children}
    </HtmlTaskContext.Provider>
  );
});

function HtmlTaskFileEditor() {
  const { html, setHtml, checking, validateOnline, local } = useContext(HtmlTaskContext);
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Editor HTML pro úkol</label>
      <SyntaxCodeEditor
        value={html}
        onChange={setHtml}
        language="html"
        label="Editor HTML pro úkol"
        minHeight="360px"
      />
      <div className="text-xs" aria-label="Průběžná nápověda editoru">
        <p className="font-medium text-zinc-700 dark:text-zinc-200">Průběžná nápověda editoru</p>
        <div className={local.passed ? 'text-emerald-600' : 'text-amber-600'}>
          {local.passed
            ? 'Lokální kontroly: vše v pořádku.'
            : `Nalezeno ${local.issues.length} připomínek:`}
        </div>
        {!local.passed && (
          <ul className="list-disc pl-5 mt-1 space-y-0.5">
            {local.issues.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="px-3 py-1.5 rounded bg-sky-600 text-white disabled:opacity-50"
          onClick={validateOnline}
          disabled={checking}
        >
          {checking ? 'Validuji…' : 'Validovat online (W3C)'}
        </button>
        <a
          className="px-3 py-1.5 rounded border"
          href="https://validator.w3.org/nu/"
          target="_blank"
          rel="noreferrer noopener"
        >
          Otevřít W3C Validator
        </a>
      </div>
    </div>
  );
}

function HtmlTaskPreview() {
  const { html, results } = useContext(HtmlTaskContext);
  return (
    <div className="space-y-3">
      <HtmlPreview html={html} title="Náhled HTML playgroundu" />
      {results?.type === 'online' && (
        <div className="text-xs rounded border p-2 bg-white/70 dark:bg-zinc-900/60">
          <div className="font-medium mb-1">Výsledky W3C (shrnutí)</div>
          <pre className="whitespace-pre-wrap">
            {JSON.stringify({ messages: results.data?.messages?.slice(0, 8) || [] }, null, 2)}
          </pre>
        </div>
      )}
      {results?.type === 'error' && (
        <div className="text-xs text-rose-600" role="status">
          Chyba validace: {results.error}
        </div>
      )}
    </div>
  );
}

function ValidatorHint() {
  return (
    <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-2">
      Ověřte validitu:
      <a
        className="underline ml-1"
        href="https://validator.w3.org/nu/"
        target="_blank"
        rel="noreferrer noopener"
      >
        validator.w3.org/nu
      </a>
    </div>
  );
}

function Playground() {
  const initial = MinimalHtml5Skeleton();
  const [html, setHtml] = useState(initial);
  const [showPreview, setShowPreview] = useState(true);
  return (
    <div data-projector-private="html-exercise" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="flex flex-col">
        <label className="text-sm font-medium mb-1">HTML editor</label>
        <textarea
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          className="min-h-[420px] w-full rounded-lg border p-3 font-mono text-sm bg-white dark:bg-zinc-900"
        />
        <ValidatorHint />
      </div>
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium">Náhled</label>
          <button
            className="text-xs px-2 py-1 rounded border bg-white dark:bg-zinc-900"
            onClick={() => setShowPreview((v) => !v)}
          >
            {showPreview ? 'Skrýt' : 'Zobrazit'}
          </button>
        </div>
        {showPreview ? (
          <HtmlPreview html={html} />
        ) : (
          <div className="text-xs text-zinc-500">Náhled skryt</div>
        )}
      </div>
    </div>
  );
}

function Task({ title, children, example }) {
  return (
    <div className="rounded-xl border border-zinc-200/60 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 p-4">
      <div className="font-semibold mb-1">{title}</div>
      <div className="text-sm text-zinc-700 dark:text-zinc-300">{children}</div>
      {example && (
        <pre className="mt-2 text-xs bg-zinc-100/80 dark:bg-zinc-800/80 rounded p-2 whitespace-pre-wrap">
          {example}
        </pre>
      )}
    </div>
  );
}

const TaskEditorHtml = forwardRef(function TaskEditorHtml(_, ref) {
  const [html, setHtml] = useState(MinimalTaskTemplate());
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState(null);

  function runLocalChecks(text) {
    const issues = [];
    const req = (re, msg) => {
      if (!re.test(text)) issues.push(msg);
    };
    req(/<!doctype\s+html>/i, 'Chybí <!doctype html>');
    req(/<html[^>]*>/i, 'Chybí <html>');
    req(/<head[^>]*>/i, 'Chybí <head>');
    req(/<meta[^>]*charset=/i, 'Chybí <meta charset>');
    req(/<meta[^>]*viewport/i, 'Chybí <meta name="viewport"> (doporučeno)');
    req(/<title>[^<]+<\/title>/i, 'Chybí <title>');
    req(/<body[^>]*>/i, 'Chybí <body>');
    // Semantika (doporučeno)
    ['header', 'nav', 'section', 'article', 'aside', 'figure', 'figcaption', 'footer'].forEach(
      (tag) => {
        if (!new RegExp(`<${tag}[^>]*>`, 'i').test(text))
          issues.push(`Doplňte <${tag}> (sémantika)`);
      },
    );
    // Média a tabulka (doporučeno)
    req(/<img[^>]*alt=/i, 'Obrázek musí mít atribut alt');
    if (!/(<table[\s\S]*?<th[\s\S]*?<td[\s\S]*?<\/table>)/i.test(text)) {
      issues.push('Tabulka by měla obsahovat hlavičku (<th>) i buňky (<td>)');
    }
    // Tabulkové sloučení buněk – vyžádejte alespoň jeden colspan a jeden rowspan
    req(/colspan\s*=\s*"\d+"/i, 'V tabulce použijte alespoň jeden colspan');
    req(/rowspan\s*=\s*"\d+"/i, 'V tabulce použijte alespoň jeden rowspan');
    return { issues, passed: issues.length === 0 };
  }

  const validateOnline = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch('/api/validate-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html }),
      });
      const data = await res.json();
      setResults({ type: 'online', data });
    } catch (e) {
      setResults({ type: 'error', error: String(e?.message || e) });
    } finally {
      setChecking(false);
    }
  }, [html]);

  useImperativeHandle(ref, () => ({ runValidation: validateOnline }), [validateOnline]);

  const local = runLocalChecks(html);

  return (
    <div data-projector-private="html-exercise" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="flex flex-col">
        <label className="text-sm font-medium mb-1" htmlFor="html-inline-task-editor">
          Editor HTML pro úkoly
        </label>
        <textarea
          id="html-inline-task-editor"
          aria-label="Editor HTML pro úkoly"
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          className="min-h-[360px] w-full rounded-lg border p-3 font-mono text-sm bg-white dark:bg-zinc-900"
        />
        <div className="mt-2 text-xs">
          <div className={local.passed ? 'text-emerald-600' : 'text-amber-600'}>
            {local.passed
              ? 'Lokální kontroly: vše v pořádku.'
              : `Nalezeno ${local.issues.length} připomínek:`}
          </div>
          {!local.passed && (
            <ul className="list-disc pl-5 mt-1 space-y-0.5">
              {local.issues.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <button
            className="px-3 py-1.5 rounded bg-sky-600 text-white disabled:opacity-50"
            onClick={validateOnline}
            disabled={checking}
          >
            {checking ? 'Validuji…' : 'Validovat online (W3C)'}
          </button>
          <a
            className="px-3 py-1.5 rounded border"
            href="https://validator.w3.org/nu/"
            target="_blank"
            rel="noreferrer noopener"
          >
            Otevřít W3C Validator
          </a>
        </div>
        {results?.type === 'online' && (
          <div className="mt-2 text-xs rounded border p-2 bg-white/70 dark:bg-zinc-900/60">
            <div className="font-medium mb-1">Výsledky W3C (shrnutí)</div>
            <pre className="whitespace-pre-wrap">
              {JSON.stringify({ messages: results.data?.messages?.slice(0, 8) || [] }, null, 2)}
            </pre>
          </div>
        )}
        {results?.type === 'error' && (
          <div className="mt-2 text-xs text-rose-600">Chyba validace: {results.error}</div>
        )}
      </div>
      <div className="flex flex-col">
        <label className="text-sm font-medium mb-1">Náhled úkolu</label>
        <HtmlPreview html={html} />
      </div>
    </div>
  );
});

function SectionTabs({ theory, example, id }) {
  return (
    <section
      id={id}
      className="space-y-3 rounded-2xl border border-zinc-200/60 bg-white/70 p-5 dark:border-zinc-800 dark:bg-zinc-900/60"
    >
      <div className="text-sm text-zinc-700 dark:text-zinc-300">{theory}</div>
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Ukázka
        </h3>
        <pre className="whitespace-pre-wrap rounded bg-zinc-100/80 p-3 text-xs dark:bg-zinc-800/80">
          {example}
        </pre>
      </div>
    </section>
  );
}

function HtmlSections() {
  const theorySkeleton = (
    <>
      <p>
        Minimální HTML5 dokument začíná doctype <Code>&lt;!doctype html&gt;</Code>, po něm následuje
        element <Code>&lt;html&gt;</Code> se strukturou <Code>&lt;head&gt;</Code> a
        <Code>&lt;body&gt;</Code>. V <Code>&lt;head&gt;</Code> definujeme zejména kódování
        <Code>&lt;meta charset&gt;</Code>, viewport a <Code>&lt;title&gt;</Code>.
      </p>
      <p className="mt-2">
        Cílem je vytvořit validní kostru, která je čitelná stroji i lidem a připraví půdu pro
        sémantické značky v těle dokumentu.
      </p>
    </>
  );
  const exampleSkeleton = MinimalHtml5Skeleton();
  const theorySemantic = (
    <>
      <p>
        HTML5 zavedlo sémantické elementy (<Code>header</Code>, <Code>nav</Code>,{' '}
        <Code>section</Code>,<Code>article</Code>, <Code>aside</Code>, <Code>figure</Code>,{' '}
        <Code>figcaption</Code>,<Code>footer</Code>), které dávají obsahu význam. Pomáhají SEO,
        přístupnosti i údržbě.
      </p>
      <p className="mt-2">
        Místo generických <Code>div</Code> používejte sémantické elementy a udržujte jasnou
        hierarchii nadpisů (<Code>h1..h6</Code>). Obsah se pak lépe analyzuje a zobrazuje v
        asistivních technologiích.
      </p>
    </>
  );
  const exampleSemantic = [
    '<main>',
    '  <section>',
    '    <article>',
    '      <h2>Nadpis článku</h2>',
    '      <p>Obsah článku...</p>',
    '    </article>',
    '    <aside>Poznámka</aside>',
    '  </section>',
    '  <footer>© 2025</footer>',
    '</main>',
  ].join('\n');
  const theoryBasics = (
    <>
      <p>
        HTML nabízí širokou škálu základních prvků pro strukturu a formátování textu. Pro nadpisy
        používejte <Code>h1..h6</Code>, pro odstavce <Code>p</Code>, zvýraznění významu je
        <Code>strong</Code> (důraz) a <Code>em</Code> (zdůraznění). Pro strojově čitelný kód
        <Code>code</Code> a víceliniové bloky <Code>pre</Code>. Citace patří do
        <Code>blockquote</Code>.
      </p>
      <p className="mt-2">
        <Code>div</Code> je blokový kontejner bez sémantiky; používejte ho s rozvahou, pokud
        neexistuje vhodnější sémantický element. <Code>span</Code> je inline varianta. Odkazy tvoří
        <Code>a href</Code> (zvažte <Code>rel=&quot;noopener noreferrer&quot;</Code> u{' '}
        <Code>target=&quot;_blank&quot;</Code>), seznamy <Code>ul/ol/li</Code>. Tabulky (
        <Code>table</Code>, <Code>tr</Code>, <Code>th</Code>, <Code>td</Code>) slouží k tabulárním
        datům, nikoli layoutu.
      </p>
      <p className="mt-2">
        Média vkládejte pomocí <Code>img</Code> (s <Code>alt</Code>), <Code>audio</Code>,
        <Code>video</Code>. Prohlížeč si poradí s nativním přehráváním a lze doplnit atributy
        <Code>controls</Code>, <Code>autoplay</Code> (opatrně) a <Code>loop</Code>.
      </p>
    </>
  );
  const exampleBasics = [
    '<h1>Nadpis stránky</h1>',
    '<p>Toto je <strong>důležitý</strong> text s <em>zdůrazněním</em> a inline <code>&lt;code&gt;</code>.</p>',
    '<blockquote>Citace, která dává kontext obsahu.</blockquote>',
    '<hr />',
    '<ul>\n  <li>Položka 1</li>\n  <li>Položka 2</li>\n</ul>',
    '<p>Odkaz: <a href="https://example.com" target="_blank" rel="noopener noreferrer">externí stránka</a></p>',
    '<figure>\n  <img src="https://placehold.co/320x180" alt="Ukázkový obrázek" />\n  <figcaption>Popisek obrázku</figcaption>\n</figure>',
    '<table>\n  <tr><th>Jméno</th><th>Body</th></tr>\n  <tr><td>Ada</td><td>10</td></tr>\n</table>',
  ].join('\n');
  const theoryMedia = (
    <>
      <p>
        Obrázky musí mít vždy smysluplný <Code>alt</Code> popisek (kromě čistě dekorativních),
        tabulky by měly mít hlavičku (<Code>th</Code>) a buňky (<Code>td</Code>) a strukturovat
        data, nikoliv layout. Pro popisek obrázku použijte <Code>figure</Code> a{' '}
        <Code>figcaption</Code>.
      </p>
      <p className="mt-2">
        Vyhněte se používání tabulek pro layout; moderní layout patří do CSS (Flexbox/Grid). Tabulka
        je vhodná pro tabulární data, kde hlavička dává význam sloupcům.
      </p>
      <p className="mt-2">
        Slučování buněk v tabulce řeší atributy <Code>colspan</Code> (slučuje sloupce) a
        <Code>rowspan</Code> (slučuje řádky). Používejte je střídmě – pomáhají zjednodušit vizuální
        mřížku, ale mohou zhoršit čitelnost čtečkám obrazovky. U složitějších tabulek zvažte
        doplnění
        <Code>scope</Code> na hlavičkách (<Code>th scope=&quot;col|row&quot;</Code>) nebo vazby přes
        <Code>headers</Code>/<Code>id</Code>, aby asistivní technologie správně přiřadily hlavičky k
        buňkám.
      </p>
    </>
  );
  const exampleMedia = [
    '<figure>',
    '  <img src="image.png" alt="Náhled schématu">',
    '  <figcaption>Schéma řešení</figcaption>',
    '</figure>',
    '<table>',
    '  <tr><th>Položka</th><th>Hodnota</th></tr>',
    '  <tr><td>A</td><td>10</td></tr>',
    '</table>',
  ].join('\n');
  return (
    <div className="space-y-4">
      <SectionTabs id="basics" theory={theoryBasics} example={exampleBasics} />
      <SectionTabs id="skeleton" theory={theorySkeleton} example={exampleSkeleton} />
      <SectionTabs id="semantic" theory={theorySemantic} example={exampleSemantic} />
      <SectionTabs id="media" theory={theoryMedia} example={exampleMedia} />
    </div>
  );
}
const HTML_TASKS = [
  {
    id: 'html-task-skeleton',
    label: 'Kostra dokumentu',
    description: 'Doplňte doctype, element html, head s metadaty a přehledné tělo dokumentu.',
    initialHtml: MinimalTaskTemplate(),
  },
  {
    id: 'html-task-semantic',
    label: 'Sémantická struktura',
    description:
      'Doplňte sémantickou strukturu pomocí header, nav, main, section, article, aside a footer.',
    initialHtml: MinimalTaskTemplate(),
  },
  {
    id: 'html-task-media',
    label: 'Média a tabulka',
    description: 'Přidejte obrázek s alt a tabulku s hlavičkami th, buňkami td, colspan a rowspan.',
    initialHtml: MinimalTaskTemplate(),
  },
];

const HTML_REFERENCE_SOLUTIONS = {
  'html-task-skeleton': [
    '<!doctype html>',
    '<html lang="cs">',
    '  <head>',
    '    <meta charset="utf-8">',
    '    <meta name="viewport" content="width=device-width, initial-scale=1">',
    '    <title>Moje stránka</title>',
    '  </head>',
    '  <body>',
    '    <header><h1>Moje stránka</h1></header>',
    '    <nav><a href="#obsah">Obsah</a></nav>',
    '    <main id="obsah"><p>Obsah stránky.</p></main>',
    '    <footer>© 2025</footer>',
    '  </body>',
    '</html>',
  ].join('\n'),
  'html-task-semantic': [
    '<!doctype html>',
    '<html lang="cs">',
    '  <head>',
    '    <meta charset="utf-8">',
    '    <meta name="viewport" content="width=device-width, initial-scale=1">',
    '    <title>Sémantická stránka</title>',
    '  </head>',
    '  <body>',
    '    <header><h1>Semantický web</h1></header>',
    '    <nav><a href="#clanek">Článek</a></nav>',
    '    <main>',
    '      <section>',
    '        <article id="clanek"><h2>Článek</h2><p>Smysluplný obsah.</p></article>',
    '        <aside>Souvisící poznámka</aside>',
    '      </section>',
    '    </main>',
    '    <footer>© 2025</footer>',
    '  </body>',
    '</html>',
  ].join('\n'),
  'html-task-media': [
    '<!doctype html>',
    '<html lang="cs">',
    '  <head>',
    '    <meta charset="utf-8">',
    '    <meta name="viewport" content="width=device-width, initial-scale=1">',
    '    <title>Média a tabulka</title>',
    '  </head>',
    '  <body>',
    '    <header><h1>Výsledky</h1></header>',
    '    <nav><a href="#tabulka">Tabulka</a></nav>',
    '    <main>',
    '      <section><article><h2>Výsledky testu</h2><p>Přehled výsledků.</p></article>',
    '        <aside>Aktualizováno dnes</aside>',
    '      </section>',
    '      <figure><img src="image.png" alt="Náhled výsledků"><figcaption>Výsledky</figcaption></figure>',
    '      <table id="tabulka">',
    '        <tr><th colspan="2">Výsledky</th></tr>',
    '        <tr><th scope="row">Ada</th><td rowspan="2">10</td></tr>',
    '        <tr><th scope="row">Jan</th></tr>',
    '      </table>',
    '    </main>',
    '    <footer>© 2025</footer>',
    '  </body>',
    '</html>',
  ].join('\n'),
};

const slides = [
  { id: 'intro', title: 'Úvod', activityType: 'learn' },
  { id: 'sections', title: 'Sekce', activityType: 'learn' },
  { id: 'validator', title: 'Validátor', activityType: 'diagnose' },
  ...HTML_TASKS.map((task) => ({ id: task.id, title: task.label, activityType: 'apply' })),
];

function useLegacyTaskAlias(slideList, legacyId, firstTaskId) {
  const aliasRequested =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('slide') === legacyId;
  const navigationSlides = useMemo(
    () =>
      aliasRequested
        ? slideList.map((slide) => (slide.id === firstTaskId ? { ...slide, id: legacyId } : slide))
        : slideList,
    [aliasRequested, firstTaskId, legacyId, slideList],
  );
  return { ...useSlideNavigation(navigationSlides), slides: navigationSlides };
}

export default function AppHtml5() {
  const {
    activeSlide,
    setActiveSlide,
    slides: navigationSlides,
  } = useLegacyTaskAlias(slides, 'tasks', HTML_TASKS[0].id);
  const htmlTaskRef = useRef(null);
  const currentSlide =
    navigationSlides.find((slide) => slide.id === activeSlide) || navigationSlides[0];
  const activeTask =
    HTML_TASKS.find((task) => task.id === activeSlide) ||
    (activeSlide === 'tasks' ? HTML_TASKS[0] : null);

  return (
    <LessonShell
      lesson={getLessonByNumber(1)}
      slides={navigationSlides}
      activeSlide={activeSlide}
      onChange={setActiveSlide}
      title="ZWA-1: Interaktivní prezentace HTML5"
      objective="Vytvoříte validní HTML5 dokument se sémantickou strukturou a ověříte jej validátorem."
      subtitle={
        <>
          Cvičení 1 – HTML5 témata a živý playground (
          <a
            className="underline"
            href="https://cw.fel.cvut.cz/wiki/courses/b6b39zwa/tutorials/01/start"
            target="_blank"
            rel="noreferrer noopener"
          >
            zdroj
          </a>
          )
        </>
      }
      footerText="© 2025 ZWA – Interaktivní pracovní list HTML5"
    >
      <SharedSlideCard slide={currentSlide} idPrefix="lesson-html5">
        {activeSlide === 'intro' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 p-6">
              <h2 className="text-xl font-bold mb-2">Organizace a prostředí</h2>
              <ul className="list-disc pl-6 text-sm">
                <li>Prohlížeč (Firefox/Chrome) a vývojářské nástroje</li>
                <li>Textový editor vhodný pro kód</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 p-6">
              <h2 className="text-xl font-bold mb-2">Cíle</h2>
              <ul className="list-disc pl-6 text-sm">
                <li>Vytvořit minimální validní HTML5 dokument</li>
                <li>
                  Využít sémantické značky: <Code>header</Code>, <Code>nav</Code>,{' '}
                  <Code>section</Code>, <Code>article</Code>, <Code>aside</Code>,{' '}
                  <Code>figure</Code>, <Code>figcaption</Code>, <Code>footer</Code>
                </li>
                <li>
                  Ověřit validitu ve{' '}
                  <a
                    className="underline"
                    href="https://validator.w3.org/nu/"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    Nu Validatoru
                  </a>
                </li>
              </ul>
            </div>
          </div>
        )}

        {activeSlide === 'sections' && <HtmlSections />}

        {activeSlide === 'validator' && (
          <div className="space-y-4">
            <Task title="Validace dokumentu">
              Zkopírujte finální HTML do{' '}
              <a
                className="underline"
                href="https://validator.w3.org/nu/"
                target="_blank"
                rel="noreferrer noopener"
              >
                validator.w3.org/nu
              </a>{' '}
              a opravte případné chyby.
            </Task>
            <ValidatorHint />
          </div>
        )}

        {activeTask && (
          <div className="space-y-3">
            <HtmlTaskProvider
              key={activeTask.id}
              ref={htmlTaskRef}
              initialHtml={activeTask.initialHtml}
              taskId={activeTask.id}
            >
              <LessonTaskWorkspace
                privateMarker="html-exercise"
                task={
                  <>
                    <p className="font-medium">{activeTask.label}</p>
                    <p>{activeTask.description}</p>
                  </>
                }
                onRunTests={() => htmlTaskRef.current?.runValidation()}
                ideTabs={
                  <WorkspaceIdeTabs
                    files={[
                      {
                        id: 'index-html',
                        label: 'index.html',
                        panel: <HtmlTaskFileEditor />,
                      },
                    ]}
                    solution={{
                      label: 'Řešení',
                      panel: (
                        <SyntaxCodeEditor
                          value={HTML_REFERENCE_SOLUTIONS[activeTask.id]}
                          language="html"
                          label="Referenční řešení HTML"
                          minHeight="360px"
                          readOnly
                        />
                      ),
                    }}
                  />
                }
                preview={<HtmlTaskPreview />}
              />
            </HtmlTaskProvider>
          </div>
        )}
      </SharedSlideCard>
    </LessonShell>
  );
}
