import React, { useMemo, useState } from "react";
import { Analytics } from "@vercel/analytics/react";

function clsx(...xs) {
  return xs.filter(Boolean).join(" ");
}

function Code({ children }) {
  return (
    <code className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[90%]">
      {children}
    </code>
  );
}

function HtmlPreview({ html, onError }) {
  const [error, setError] = useState(null);
  function setHtml(node) {
    if (!node) return;
    try {
      node.innerHTML = html || "";
      setError(null);
    } catch (e) {
      setError(String(e.message));
      onError?.(e);
    }
  }
  return (
    <div>
      <div ref={setHtml} className="w-full min-h-40 p-3 rounded-lg border bg-white dark:bg-zinc-900" />
      {error && <div className="text-xs text-rose-600 mt-1">{error}</div>}
    </div>
  );
}

function MinimalHtml5Skeleton() {
  const template = useMemo(
    () =>
      [
        "<!doctype html>",
        "<html lang=\"cs\">",
        "  <head>",
        "    <meta charset=\"utf-8\">",
        "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">",
        "    <title>Příklad HTML5</title>",
        "  </head>",
        "  <body>",
        "    <header><h1>Ahoj, HTML5!</h1></header>",
        "    <nav><a href=\"#\">Domů</a></nav>",
        "    <main>",
        "      <section>",
        "        <article>",
        "          <h2>Ukázkový článek</h2>",
        "          <p>Semantické značky zlepšují čitelnost a SEO.</p>",
        "        </article>",
        "        <aside>Poznámka bokem</aside>",
        "      </section>",
        "      <figure>",
        "        <img src=\"https://placehold.co/400x200\" alt=\"Náhled\">",
        "        <figcaption>Popisek obrázku</figcaption>",
        "      </figure>",
        "      <table>",
        "        <tr><th>Jméno</th><th>Body</th></tr>",
        "        <tr><td>Ada</td><td>10</td></tr>",
        "      </table>",
        "    </main>",
        "    <footer>© 2025</footer>",
        "  </body>",
        "</html>",
      ].join("\n"),
    []
  );
  return template;
}

// Minimal starting template for student tasks (intentionally incomplete)
function MinimalTaskTemplate() {
  return [
    "<!doctype html>",
    "<html lang=\"cs\">",
    "  <head>",
    "    <meta charset=\"utf-8\">",
    "    <title>Moje stránka</title>",
    "  </head>",
    "  <body>",
    "",
    "  </body>",
    "</html>",
  ].join("\n");
}

function ValidatorHint() {
  return (
    <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-2">
      Ověřte validitu:
      <a className="underline ml-1" href="https://validator.w3.org/nu/" target="_blank" rel="noreferrer noopener">validator.w3.org/nu</a>
    </div>
  );
}

function Playground() {
  const initial = MinimalHtml5Skeleton();
  const [html, setHtml] = useState(initial);
  const [showPreview, setShowPreview] = useState(true);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
            {showPreview ? "Skrýt" : "Zobrazit"}
          </button>
        </div>
        {showPreview ? <HtmlPreview html={html} /> : <div className="text-xs text-zinc-500">Náhled skryt</div>}
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
        <pre className="mt-2 text-xs bg-zinc-100/80 dark:bg-zinc-800/80 rounded p-2 whitespace-pre-wrap">{example}</pre>
      )}
    </div>
  );
}

function TaskEditorHtml() {
  const [html, setHtml] = useState(MinimalTaskTemplate());
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState(null);

  function runLocalChecks(text) {
    const issues = [];
    const req = (re, msg) => { if (!re.test(text)) issues.push(msg); };
    req(/<!doctype\s+html>/i, "Chybí <!doctype html>");
    req(/<html[^>]*>/i, "Chybí <html>");
    req(/<head[^>]*>/i, "Chybí <head>");
    req(/<meta[^>]*charset=/i, "Chybí <meta charset>");
    req(/<meta[^>]*viewport/i, "Chybí <meta name=\"viewport\"> (doporučeno)");
    req(/<title>[^<]+<\/title>/i, "Chybí <title>");
    req(/<body[^>]*>/i, "Chybí <body>");
    // Semantika (doporučeno)
    ["header","nav","section","article","aside","figure","figcaption","footer"].forEach(tag => {
      if (!new RegExp(`<${tag}[^>]*>`, 'i').test(text)) issues.push(`Doplňte <${tag}> (sémantika)`);
    });
    // Média a tabulka (doporučeno)
    req(/<img[^>]*alt=/i, "Obrázek musí mít atribut alt");
    if (!/(<table[\s\S]*?<th[\s\S]*?<td[\s\S]*?<\/table>)/i.test(text)) {
      issues.push("Tabulka by měla obsahovat hlavičku (<th>) i buňky (<td>)");
    }
    // Tabulkové sloučení buněk – vyžádejte alespoň jeden colspan a jeden rowspan
    req(/colspan\s*=\s*"\d+"/i, "V tabulce použijte alespoň jeden colspan");
    req(/rowspan\s*=\s*"\d+"/i, "V tabulce použijte alespoň jeden rowspan");
    return { issues, passed: issues.length === 0 };
  }

  async function validateOnline() {
    setChecking(true);
    try {
      const res = await fetch('/api/validate-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html })
      });
      const data = await res.json();
      setResults({ type: 'online', data });
    } catch (e) {
      setResults({ type: 'error', error: String(e?.message || e) });
    } finally {
      setChecking(false);
    }
  }

  const local = runLocalChecks(html);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="flex flex-col">
        <label className="text-sm font-medium mb-1">HTML – Úkoly editor</label>
        <textarea
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          className="min-h-[360px] w-full rounded-lg border p-3 font-mono text-sm bg-white dark:bg-zinc-900"
        />
        <div className="mt-2 text-xs">
          <div className={local.passed ? "text-emerald-600" : "text-amber-600"}>
            {local.passed ? "Lokální kontroly: vše v pořádku." : `Nalezeno ${local.issues.length} připomínek:`}
          </div>
          {!local.passed && (
            <ul className="list-disc pl-5 mt-1 space-y-0.5">
              {local.issues.map((m, i) => <li key={i}>{m}</li>)}
            </ul>
          )}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <button className="px-3 py-1.5 rounded bg-sky-600 text-white disabled:opacity-50" onClick={validateOnline} disabled={checking}>
            {checking ? "Validuji…" : "Validovat online (W3C)"}
          </button>
          <a className="px-3 py-1.5 rounded border" href="https://validator.w3.org/nu/" target="_blank" rel="noreferrer noopener">Otevřít W3C Validator</a>
        </div>
        {results?.type === 'online' && (
          <div className="mt-2 text-xs rounded border p-2 bg-white/70 dark:bg-zinc-900/60">
            <div className="font-medium mb-1">Výsledky W3C (shrnutí)</div>
            <pre className="whitespace-pre-wrap">{JSON.stringify({ messages: results.data?.messages?.slice(0, 8) || [] }, null, 2)}</pre>
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
}

function SectionTabs({ theory, example, Try, validate, id, taskText }) {
  const [tab, setTab] = useState('theory');
  return (
    <div id={id} className="space-y-2">
      <div className="mb-1 flex flex-wrap gap-2">
        {[
          { id: 'theory', label: 'Teorie' },
          { id: 'examples', label: 'Příklady' },
          { id: 'try', label: 'Vyzkoušet' },
          { id: 'task', label: 'Úkol' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={clsx(
            'px-2 py-1 rounded border text-xs',
            tab === t.id ? 'bg-sky-600 text-white border-sky-600' : 'bg-white/70 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800')}>{t.label}</button>
        ))}
      </div>
      {tab === 'theory' && (
        <div className="text-sm text-zinc-700 dark:text-zinc-300">{theory}</div>
      )}
      {tab === 'examples' && (
        <pre className="text-xs bg-zinc-100/80 dark:bg-zinc-800/80 rounded p-2 whitespace-pre-wrap">{example}</pre>
      )}
      {tab === 'try' && (
        <Try />
      )}
      {tab === 'task' && (
        <div className="space-y-2">
          {taskText && (
            <div className="rounded-xl border border-zinc-200/60 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 p-3 text-sm">
              {taskText}
            </div>
          )}
          <TaskEditorHtml />
        </div>
      )}
    </div>
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
  function TrySkeleton() {
    return <Playground />;
  }

  const theorySemantic = (
    <>
      <p>
        HTML5 zavedlo sémantické elementy (<Code>header</Code>, <Code>nav</Code>, <Code>section</Code>,
        <Code>article</Code>, <Code>aside</Code>, <Code>figure</Code>, <Code>figcaption</Code>,
        <Code>footer</Code>), které dávají obsahu význam. Pomáhají SEO, přístupnosti i údržbě.
      </p>
      <p className="mt-2">
        Místo generických <Code>div</Code> používejte sémantické elementy a udržujte jasnou hierarchii
        nadpisů (<Code>h1..h6</Code>). Obsah se pak lépe analyzuje a zobrazuje v asistivních technologiích.
      </p>
    </>
  );
  const exampleSemantic = [
    '<main>','  <section>','    <article>','      <h2>Nadpis článku</h2>','      <p>Obsah článku...</p>','    </article>','    <aside>Poznámka</aside>','  </section>','  <footer>© 2025</footer>','</main>'
  ].join('\n');
  function TrySemantic() { return (
    <div className="rounded-xl border border-zinc-200/60 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 p-4 text-sm">
      Upravte skeleton v části Úkol tak, aby používal výše uvedené sémantické značky.
    </div>
  ); }

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
        <Code>div</Code> je blokový kontejner bez sémantiky; používejte ho s rozvahou, pokud neexistuje
        vhodnější sémantický element. <Code>span</Code> je inline varianta. Odkazy tvoří
        <Code>a href</Code> (zvažte <Code>rel="noopener noreferrer"</Code> u <Code>target="_blank"</Code>),
        seznamy <Code>ul/ol/li</Code>. Tabulky (<Code>table</Code>, <Code>tr</Code>, <Code>th</Code>, <Code>td</Code>)
        slouží k tabulárním datům, nikoli layoutu.
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
    '<table>\n  <tr><th>Jméno</th><th>Body</th></tr>\n  <tr><td>Ada</td><td>10</td></tr>\n</table>'
  ].join('\n');
  function TryBasics() { return (
    <div className="rounded-xl border border-zinc-200/60 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 p-4 text-sm">
      Do Úkolu doplňte: nadpis, odstavec se <Code>strong</Code>/<Code>em</Code>,
      seznam <Code>ul/li</Code>, odkaz <Code>a</Code> (s bezpečnými atributy), a tabulku.
    </div>
  ); }

  const theoryMedia = (
    <>
      <p>
        Obrázky musí mít vždy smysluplný <Code>alt</Code> popisek (kromě čistě dekorativních),
        tabulky by měly mít hlavičku (<Code>th</Code>) a buňky (<Code>td</Code>) a strukturovat data,
        nikoliv layout. Pro popisek obrázku použijte <Code>figure</Code> a <Code>figcaption</Code>.
      </p>
      <p className="mt-2">
        Vyhněte se používání tabulek pro layout; moderní layout patří do CSS (Flexbox/Grid). Tabulka
        je vhodná pro tabulární data, kde hlavička dává význam sloupcům.
      </p>
      <p className="mt-2">
        Slučování buněk v tabulce řeší atributy <Code>colspan</Code> (slučuje sloupce) a
        <Code>rowspan</Code> (slučuje řádky). Používejte je střídmě – pomáhají zjednodušit vizuální
        mřížku, ale mohou zhoršit čitelnost čtečkám obrazovky. U složitějších tabulek zvažte doplnění
        <Code>scope</Code> na hlavičkách (<Code>th scope="col|row"</Code>) nebo vazby přes
        <Code>headers</Code>/<Code>id</Code>, aby asistivní technologie správně přiřadily hlavičky k
        buňkám.
      </p>
    </>
  );
  const exampleMedia = [
    '<figure>','  <img src="image.png" alt="Náhled schématu">','  <figcaption>Schéma řešení</figcaption>','</figure>','<table>','  <tr><th>Položka</th><th>Hodnota</th></tr>','  <tr><td>A</td><td>10</td></tr>','</table>'
  ].join('\n');
  function TryMedia() { return (
    <div className="rounded-xl border border-zinc-200/60 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 p-4 text-sm">
      Doplňte do Úkolu obrázek s <Code>alt</Code> a tabulku s <Code>th</Code> a <Code>td</Code>.
    </div>
  ); }

  return (
    <div className="space-y-4">
      <SectionTabs id="basics" theory={theoryBasics} example={exampleBasics} Try={TryBasics} validate={{}} taskText={
        <>
          <p>Do editoru níže doplňte:</p>
          <ul className="list-disc pl-5"><li>Nadpis <Code>h1</Code> a odstavec <Code>p</Code> se <Code>strong</Code>/<Code>em</Code></li><li>Seznam <Code>ul/li</Code> a odkaz <Code>a</Code> s bezpečnými atributy</li><li>Tabulku s <Code>th</Code> a <Code>td</Code></li></ul>
        </>
      } />
      <SectionTabs id="skeleton" theory={theorySkeleton} example={exampleSkeleton} Try={TrySkeleton} validate={{}} taskText={
        <>
          <p>Vytvořte minimální validní skeleton s <Code>&lt;!doctype html&gt;</Code>, <Code>&lt;html&gt;</Code>, <Code>&lt;head&gt;</Code> (včetně <Code>&lt;meta charset&gt;</Code>, <Code>&lt;title&gt;</Code>) a <Code>&lt;body&gt;</Code>.</p>
        </>
      } />
      <SectionTabs id="semantic" theory={theorySemantic} example={exampleSemantic} Try={TrySemantic} validate={{}} taskText={
        <>
          <p>Doplňte do těla dokumentu sémantické prvky: <Code>header</Code>, <Code>nav</Code>, <Code>section</Code>, <Code>article</Code>, <Code>aside</Code>, <Code>figure</Code> + <Code>figcaption</Code>, <Code>footer</Code>.</p>
        </>
      } />
      <SectionTabs id="media" theory={theoryMedia} example={exampleMedia} Try={TryMedia} validate={{}} taskText={
        <>
          <p>Přidejte obrázek s povinným <Code>alt</Code> a tabulku s hlavičkou (<Code>th</Code>) a buňkami (<Code>td</Code>).</p>
          <p className="mt-1">Zahrňte alespoň jeden <Code>colspan</Code> a jeden <Code>rowspan</Code> pro sloučení buněk.</p>
        </>
      } />
    </div>
  );
}
export default function AppHtml5() {
  const [active, setActive] = useState("intro");
  const tabs = [
    { id: "intro", label: "Úvod" },
    { id: "sections", label: "Sekce" },
    { id: "validator", label: "Validátor" },
    { id: "tasks", label: "Úkoly" },
  ];
  function gotoSection(sectionId) {
    setActive("sections");
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-zinc-50 to-sky-50 dark:from-zinc-950 dark:to-zinc-900 text-zinc-900 dark:text-zinc-50">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <header className="mb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold">ZWA-1: Interactive HTML5 Presentation</h1>
          <p className="text-xs md:text-sm text-zinc-500 mt-1">
            Cvičení 1 – HTML5 témata a živý playground
            {" "}
            (<a className="underline" href="https://cw.fel.cvut.cz/wiki/courses/b6b39zwa/tutorials/01/start" target="_blank" rel="noreferrer noopener">zdroj</a>)
          </p>
        </header>

        <nav className="flex flex-wrap gap-2 mb-4">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={clsx(
                "px-3 py-1.5 rounded-full text-sm border",
                active === t.id
                  ? "bg-sky-600 text-white border-sky-600"
                  : "bg-white/70 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 hover:bg-white"
              )}
              onClick={() => setActive(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {active === "intro" && (
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
                <li>Využít sémantické značky: <Code>header</Code>, <Code>nav</Code>, <Code>section</Code>, <Code>article</Code>, <Code>aside</Code>, <Code>figure</Code>, <Code>figcaption</Code>, <Code>footer</Code></li>
                <li>Ověřit validitu ve <a className="underline" href="https://validator.w3.org/nu/" target="_blank" rel="noreferrer noopener">Nu Validatoru</a></li>
              </ul>
            </div>
          </div>
        )}

        {active === "sections" && (
          <HtmlSections />
        )}

        {active === "validator" && (
          <div className="space-y-4">
            <Task title="Validace dokumentu">
              Zkopírujte finální HTML do
              {" "}
              <a className="underline" href="https://validator.w3.org/nu/" target="_blank" rel="noreferrer noopener">validator.w3.org/nu</a>
              {" "}
              a opravte případné chyby.
            </Task>
            <ValidatorHint />
          </div>
        )}

        {active === "tasks" && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 p-4">
              <div className="font-semibold mb-2">Vyberte úkol</div>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'skeleton', label: 'Skeleton' },
                  { id: 'semantic', label: 'Sémantika' },
                  { id: 'media', label: 'Média + Tabulka' },
                ].map((l) => (
                  <button key={l.id} type="button" className="px-3 py-1.5 rounded-full border text-sm bg-white/70 dark:bg-zinc-900/60 hover:bg-white border-zinc-200 dark:border-zinc-800" onClick={() => gotoSection(l.id)}>{l.label}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        <footer className="mt-8 text-sm text-zinc-500">© 2025 ZWA – HTML5 interactive worksheet</footer>
        <Analytics />
      </div>
    </div>
  );
}


