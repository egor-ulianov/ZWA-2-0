import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { getLessonByNumber } from './src/config/lessons.js';
import EditorialCallout from './src/course-ui/content/EditorialCallout.jsx';
import EditorialCode from './src/course-ui/content/EditorialCode.jsx';
import Code from './src/course-ui/content/InlineCode.jsx';
import ExerciseStage from './src/course-ui/exercises/ExerciseStage.jsx';
import StudioEditor from './src/course-ui/exercises/StudioEditor.jsx';
import StudioTabs from './src/course-ui/exercises/StudioTabs.jsx';
import SandboxFrame from './src/course-ui/exercises/runtime/SandboxFrame.jsx';
import { LearningExperience } from './src/course-ui/learning/LearningExperience.jsx';
import { LearningSection } from './src/course-ui/learning/LearningSection.jsx';
import { useLearningNavigation } from './src/course-ui/learning/useLearningNavigation.js';

function HtmlPreview({ html, title = 'Náhled HTML playgroundu' }) {
  return <SandboxFrame html={html} mode="static" title={title} />;
}

function MinimalHtml5Skeleton() {
  return [
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
  ].join('\n');
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

function HtmlTaskProvider({ children, initialHtml, taskId }) {
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
}

function HtmlTaskFileEditor() {
  const { html, setHtml, local } = useContext(HtmlTaskContext);
  return (
    <div>
      <StudioEditor
        value={html}
        onChange={setHtml}
        language="html"
        label="Editor HTML pro úkol"
        minHeight="360px"
      />
      <div aria-label="Průběžná nápověda editoru">
        <p>
          <strong>Průběžná nápověda editoru</strong>
        </p>
        <p>
          {local.passed
            ? 'Lokální kontroly: vše v pořádku.'
            : `Nalezeno ${local.issues.length} připomínek:`}
        </p>
        {!local.passed && (
          <ul>
            {local.issues.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        )}
      </div>
      <p>
        <a href="https://validator.w3.org/nu/" target="_blank" rel="noreferrer noopener">
          Otevřít W3C Validator
        </a>
      </p>
    </div>
  );
}

function HtmlTaskPreview() {
  const { html } = useContext(HtmlTaskContext);
  return <HtmlPreview html={html} title="Náhled HTML playgroundu" />;
}

function HtmlTaskVerification() {
  const { checking, results, local } = useContext(HtmlTaskContext);
  if (checking) return <p role="status">Validuji dokument…</p>;
  if (results?.type === 'error') {
    return <p role="status">× Nesplněno — Chyba validace: {results.error}</p>;
  }
  if (results?.type === 'online') {
    const messages = results.data?.messages?.slice(0, 8) || [];
    return (
      <div role="status">
        <p>
          <strong>{messages.length === 0 ? '✓ Splněno' : '× Nesplněno'}</strong> — Výsledky W3C
        </p>
        {messages.length ? <pre>{JSON.stringify({ messages }, null, 2)}</pre> : null}
      </div>
    );
  }
  return (
    <div aria-live="polite">
      <p>
        <strong>{local.passed ? '✓ Splněno' : '× Zatím nesplněno'}</strong> — lokální kontrola
      </p>
      {!local.passed ? (
        <ul>
          {local.issues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function ValidatorHint() {
  return (
    <p>
      Ověřte validitu:
      <a href="https://validator.w3.org/nu/" target="_blank" rel="noreferrer noopener">
        validator.w3.org/nu
      </a>
    </p>
  );
}

function SectionTabs({ theory, example, id }) {
  return (
    <section id={id}>
      <div>{theory}</div>
      <h3>Ukázka</h3>
      <EditorialCode language="html" label={`${id}.html`}>
        {example}
      </EditorialCode>
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
      <p>
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
      <p>
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
      <p>
        <Code>div</Code> je blokový kontejner bez sémantiky; používejte ho s rozvahou, pokud
        neexistuje vhodnější sémantický element. <Code>span</Code> je inline varianta. Odkazy tvoří
        <Code>a href</Code> (zvažte <Code>rel=&quot;noopener noreferrer&quot;</Code> u{' '}
        <Code>target=&quot;_blank&quot;</Code>), seznamy <Code>ul/ol/li</Code>. Tabulky (
        <Code>table</Code>, <Code>tr</Code>, <Code>th</Code>, <Code>td</Code>) slouží k tabulárním
        datům, nikoli layoutu.
      </p>
      <p>
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
      <p>
        Vyhněte se používání tabulek pro layout; moderní layout patří do CSS (Flexbox/Grid). Tabulka
        je vhodná pro tabulární data, kde hlavička dává význam sloupcům.
      </p>
      <p>
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
    <div>
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

const sections = [
  { id: 'intro', title: 'Úvod', activityType: 'learn' },
  { id: 'sections', title: 'Sekce', activityType: 'learn' },
  { id: 'validator', title: 'Validátor', activityType: 'diagnose' },
  ...HTML_TASKS.map((task) => ({ id: task.id, title: task.label, activityType: 'apply' })),
];

function useHtmlNavigation(sectionList, legacyId, firstTaskId) {
  const aliasRequested =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('slide') === legacyId;
  const navigationSections = useMemo(
    () =>
      aliasRequested
        ? sectionList.map((section) =>
            section.id === firstTaskId ? { ...section, id: legacyId } : section,
          )
        : sectionList,
    [aliasRequested, firstTaskId, legacyId, sectionList],
  );
  return { ...useLearningNavigation(navigationSections), sections: navigationSections };
}

function HtmlTaskStage({ task }) {
  const { checking, validateOnline } = useContext(HtmlTaskContext);
  return (
    <ExerciseStage
      brief={
        <>
          <p>
            <strong>{task.label}</strong>
          </p>
          <p>{task.description}</p>
        </>
      }
      onVerify={checking ? undefined : validateOnline}
      preview={<HtmlTaskPreview />}
      privateMarker="html-exercise"
      studio={
        <StudioTabs
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
              <StudioEditor
                value={HTML_REFERENCE_SOLUTIONS[task.id]}
                language="html"
                label="Referenční řešení HTML"
                minHeight="360px"
                readOnly
              />
            ),
          }}
        />
      }
      verification={<HtmlTaskVerification />}
      verificationLabel={checking ? 'Validuji…' : 'Spustit ověření'}
    />
  );
}

export default function AppHtml5() {
  const {
    activeSection,
    setActiveSection,
    sections: navigationSections,
  } = useHtmlNavigation(sections, 'tasks', HTML_TASKS[0].id);
  const currentSection =
    navigationSections.find((section) => section.id === activeSection) || navigationSections[0];
  const activeTask =
    HTML_TASKS.find((task) => task.id === activeSection) ||
    (activeSection === 'tasks' ? HTML_TASKS[0] : null);
  const lesson = getLessonByNumber(1);

  return (
    <LearningExperience
      lesson={lesson}
      sections={navigationSections}
      activeSection={activeSection}
      onChange={setActiveSection}
      title="ZWA-1: Interaktivní prezentace HTML5"
      objective="Vytvoříte validní HTML5 dokument se sémantickou strukturou a ověříte jej validátorem."
      subtitle={
        <>
          Cvičení 1 – HTML5 témata a živý playground (
          <a
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
      <LearningSection section={currentSection} idPrefix="lesson-html5">
        {activeSection === 'intro' && (
          <div>
            <section>
              <h3>Organizace a prostředí</h3>
              <ul>
                <li>Prohlížeč (Firefox/Chrome) a vývojářské nástroje</li>
                <li>Textový editor vhodný pro kód</li>
              </ul>
            </section>
            <section>
              <h3>Cíle</h3>
              <ul>
                <li>Vytvořit minimální validní HTML5 dokument</li>
                <li>
                  Využít sémantické značky: <Code>header</Code>, <Code>nav</Code>,{' '}
                  <Code>section</Code>, <Code>article</Code>, <Code>aside</Code>,{' '}
                  <Code>figure</Code>, <Code>figcaption</Code>, <Code>footer</Code>
                </li>
                <li>
                  Ověřit validitu ve{' '}
                  <a href="https://validator.w3.org/nu/" target="_blank" rel="noreferrer noopener">
                    Nu Validatoru
                  </a>
                </li>
              </ul>
            </section>
          </div>
        )}

        {activeSection === 'sections' && HtmlSections()}

        {activeSection === 'validator' && (
          <div>
            <EditorialCallout title="Validace dokumentu" tone="tip">
              Zkopírujte finální HTML do{' '}
              <a href="https://validator.w3.org/nu/" target="_blank" rel="noreferrer noopener">
                validator.w3.org/nu
              </a>{' '}
              a opravte případné chyby.
            </EditorialCallout>
            <ValidatorHint />
          </div>
        )}

        {activeTask && (
          <HtmlTaskProvider
            key={activeTask.id}
            initialHtml={activeTask.initialHtml}
            taskId={activeTask.id}
          >
            <HtmlTaskStage task={activeTask} />
          </HtmlTaskProvider>
        )}
      </LearningSection>
    </LearningExperience>
  );
}
