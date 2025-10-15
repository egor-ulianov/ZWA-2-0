import React, { useEffect, useMemo, useRef, useState } from "react";
import heroImg from "./src/interactive-zwa-1/assets/semestral-meme.png";
import memeImg from "./src/interactive-zwa-2/assets/image.png";
import { Analytics } from "@vercel/analytics/react";

function clsx(...xs) {
  return xs.filter(Boolean).join(" ");
}

// very small CSS highlighter (regex-based, not a full parser)
function highlightCss(source) {
  if (!source) return "";
  const escape = (s) => s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  let html = escape(source);
  // comments
  html = html.replace(/\/\*[\s\S]*?\*\//g, (m) => `<span class=\"text-zinc-400\">${escape(m)}</span>`);
  // at-rules (@media, @keyframes, ...)
  html = html.replace(/@([a-zA-Z-]+)/g, (m) => `<span class=\"text-purple-600\">${m}</span>`);
  // selectors (before opening brace)
  html = html.replace(/([^{}\n]+)\{/g, (match, sel) => `<span class=\"text-sky-700 font-medium\">${sel.trim()}</span>{`);
  // property names
  html = html.replace(/([a-zA-Z-]+)(\s*):/g, (match, prop, ws) => `<span class=\"text-amber-700\">${prop}</span>${ws}:`);
  // hex colors
  html = html.replace(/#([0-9a-fA-F]{3,6})\b/g, (m) => `<span class=\"text-pink-600\">${m}</span>`);
  // numbers with units
  html = html.replace(/(-?\d*\.?\d+)(px|%|em|rem|vh|vw|ms|s)\b/g, (match, n, u) => `<span class=\"text-emerald-700\">${n}${u}</span>`);
  // keywords
  html = html.replace(/\b(transparent|none|solid|ease|inherit|initial|unset|auto|block|inline|flex)\b/g, (m) => `<span class=\"text-indigo-700\">${m}</span>`);
  // !important
  html = html.replace(/!important/g, `<span class=\"text-rose-700\">!important</span>`);
  return html;
}

// very small HTML highlighter (regex-based)
function highlightHtml(source) {
  if (!source) return "";
  const escape = (s) => s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  let html = escape(source);
  // attributes and values (first, so we don't mutate our own injected spans later)
  html = html.replace(/([a-zA-Z-:]+)(=)(\"[^\"]*\"|'[^']*')/g, (m, attr, eq, val) => `<span class=\"text-amber-700\">${attr}</span>${eq}<span class=\"text-emerald-700\">${val}</span>`);
  // tags (wrap only the tag name)
  html = html.replace(/(&lt;\/?)([a-zA-Z0-9-]+)([^&]*?&gt;)/g, (m, open, tag, rest) => `${open}<span class=\"text-purple-600\">${tag}</span>${rest}`);
  return html;
}

// Task templates provider (HTML/CSS per slide + step)
function getTaskTemplates(slideId, stepIndex) {
  const heroSrc = heroImg?.src || "";
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
  if (slideId === "linking") {
    // Two steps in linking; templates are same base, students edit HTML and CSS
    return {
      html: linkHtml,
      css: stepIndex === 0 ? "" : "/* styles.css — TODO: Nastavte barvu #title na #16a34a */\nh1#title {\n  /* napište sem vlastnosti */\n}"
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

// Validation provider (returns list of results for current slide+step)
function runValidation({ slideId, stepIndex, container, htmlCode, cssCode }) {
  const results = [];
  if (!container) return results;

  if (slideId === "linking") {
    // Check link tag exists and targets styles.css
    try {
      const okLink = /<link[^>]*rel=["']stylesheet["'][^>]*href=["']styles\.css["'][^>]*>/i.test(htmlCode);
      results.push({ ok: !!okLink, text: 'Task: <link rel="stylesheet" href="styles.css"> is present' });
    } catch (_) {
      results.push({ ok: false, text: "Task: Error checking <link> tag" });
    }
    // Check green applied to #title (#16a34a)
    try {
      const el = container.querySelector("#title");
      const cs = el ? window.getComputedStyle(el) : null;
      const ok = cs && cs.color === "rgb(22, 163, 74)";
      results.push({ ok: !!ok, text: "Task: #title color is green from styles.css" });
    } catch (_) {
      results.push({ ok: false, text: "Task: Error checking applied styles" });
    }
    return results;
  }

  // CSS tasks: evaluate all five, but highlight current step first
  // 1: h1 color and size
  try {
    const titleEl = container.querySelector("#title");
    const cs = titleEl ? window.getComputedStyle(titleEl) : null;
    const okColor = cs && cs.color === "rgb(29, 78, 216)"; // #1d4ed8
    const okSize = cs && cs.fontSize === "36px";
    results.push({ ok: !!(okColor && okSize), text: "Task 1: h1 is blue and 36px" });
  } catch (_) {
    results.push({ ok: false, text: "Task 1: Error checking styles" });
  }
  // 2: footer links font and color (+ visited)
  try {
    const link = container.querySelector("footer a");
    const cs = link ? window.getComputedStyle(link) : null;
    const okFamily = cs && /georgia/i.test(cs.fontFamily || "");
    const okColor = cs && cs.color === "rgb(37, 99, 235)"; // #2563eb
    const hasVisitedRule = /footer\s+a\s*:\s*visited[\s\S]*?color\s*:\s*#?2563eb/i.test(cssCode);
    results.push({ ok: !!(okFamily && okColor && hasVisitedRule), text: "Task 2: footer links styled incl. visited" });
  } catch (_) {
    results.push({ ok: false, text: "Task 2: Error checking styles" });
  }
  // 3: first-letter styled
  try {
    const hasSelector = /p\s*\.excerpt\s*::\s*first-letter/i.test(cssCode);
    const hasSize = /::\s*first-letter[\s\S]*font-size\s*:\s*200%/i.test(cssCode);
    const hasBg = /::\s*first-letter[\s\S]*background\s*:\s*#?fef08a/i.test(cssCode);
    results.push({ ok: !!(hasSelector && hasSize && hasBg), text: "Task 3: first-letter styled" });
  } catch (_) {
    results.push({ ok: false, text: "Task 3: Error checking styles" });
  }
  // 4: list style type lower-alpha
  try {
    const list = container.querySelector("ol.submenu");
    const cs = list ? window.getComputedStyle(list) : null;
    const ok = cs && (cs.listStyleType === "lower-alpha" || cs.listStyleType === "lower-alpha outside");
    results.push({ ok: !!ok, text: "Task 4: submenu uses lower-alpha" });
  } catch (_) {
    results.push({ ok: false, text: "Task 4: Error checking styles" });
  }
  // 5: hover rule present
  try {
    const hasHover = /\.hero\s+img\s*:\s*hover/i.test(cssCode);
    const hasScale = /transform\s*:\s*scale\s*\(/i.test(cssCode);
    const hasTransition = /transition\s*:\s*transform/i.test(cssCode);
    results.push({ ok: !!(hasHover && hasScale && hasTransition), text: "Task 5: hover transform + transition" });
  } catch (_) {
    results.push({ ok: false, text: "Task 5: Error checking styles" });
  }
  return results;
}

function VsPlayground({ slideId, stepIndex }) {
  const previewRef = useRef(null);
  const [activeTab, setActiveTab] = useState("css");
  const [autoApply, setAutoApply] = useState(true);
  const [applyVersion, setApplyVersion] = useState(0);
  const [results, setResults] = useState([]);

  // Editors state
  const templates = useMemo(() => getTaskTemplates(slideId, stepIndex), [slideId, stepIndex]);
  const [htmlCode, setHtmlCode] = useState(templates.html);
  const [cssCode, setCssCode] = useState(templates.css);

  // Reset editors when task changes
  useEffect(() => {
    setHtmlCode(templates.html);
    setCssCode(templates.css);
    setResults([]);
  }, [templates]);

  const preRef = useRef(null);
  const textRef = useRef(null);
  const highlighted = useMemo(() => activeTab === "css" ? highlightCss(cssCode) : highlightHtml(htmlCode), [activeTab, htmlCode, cssCode]);

  function syncScroll() {
    if (!textRef.current || !preRef.current) return;
    preRef.current.scrollTop = textRef.current.scrollTop;
    preRef.current.scrollLeft = textRef.current.scrollLeft;
  }

  // Render preview
  useEffect(() => {
    if (!previewRef.current) return;
    let html = htmlCode || "";
    if (slideId === "linking") {
      // Inject styles only if correct <link> is present (simulates real linking)
      const hasLink = /<link[^>]*rel=["']stylesheet["'][^>]*href=["']styles\.css["'][^>]*>/i.test(html);
      if (hasLink) {
        if (/<\/head>/i.test(html)) {
          html = html.replace(/<\/head>/i, `<style>${cssCode}</style></head>`);
        } else {
          html = `<style>${cssCode}</style>` + html;
        }
      }
    } else {
      // Always inline styles for CSS tasks
      html = `<style>${cssCode}</style>` + html;
    }
    previewRef.current.innerHTML = html;
  }, [htmlCode, cssCode, slideId, applyVersion]);

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

  function validate() {
    const container = previewRef.current;
    const pass = runValidation({ slideId, stepIndex, container, htmlCode, cssCode });
    setResults(pass);
  }

  return (
    <div className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 shadow overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
        <div className="p-3 border-b lg:border-b-0 lg:border-r border-zinc-200/60 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-sm">Editor</div>
            <label className="text-xs flex items-center gap-1">
              <input type="checkbox" checked={autoApply} onChange={(e) => setAutoApply(e.target.checked)} />
              Auto apply
            </label>
          </div>
          <div className="flex items-center gap-1 mb-2">
            <button
              className={clsx(
                "px-3 py-1.5 text-xs rounded-t-lg border",
                activeTab === "html"
                  ? "bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700"
                  : "bg-zinc-100/70 dark:bg-zinc-800/60 border-transparent"
              )}
              onClick={() => setActiveTab("html")}
            >
              HTML
            </button>
            <button
              className={clsx(
                "px-3 py-1.5 text-xs rounded-t-lg border",
                activeTab === "css"
                  ? "bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700"
                  : "bg-zinc-100/70 dark:bg-zinc-800/60 border-transparent"
              )}
              onClick={() => setActiveTab("css")}
            >
              CSS
            </button>
          </div>
          <div className="relative rounded-xl border border-zinc-200/60 dark:border-zinc-800 overflow-hidden">
            <pre
              ref={preRef}
              aria-hidden
              className="pointer-events-none whitespace-pre-wrap font-mono text-xs p-3 text-zinc-800 dark:text-zinc-200 bg-white/70 dark:bg-zinc-900/60 min-h-[450px] max-h-[450px] overflow-auto"
              dangerouslySetInnerHTML={{ __html: highlighted }}
            />
            <textarea
              ref={textRef}
              value={activeTab === "css" ? cssCode : htmlCode}
              onChange={(e) => (activeTab === "css" ? onCssChange(e.target.value) : onHtmlChange(e.target.value))}
              onScroll={syncScroll}
              spellCheck={false}
              className="absolute inset-0 w-full h-full font-mono text-xs p-3 bg-transparent text-transparent caret-black dark:caret-white resize-none outline-none"
            />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <button className="px-3 py-1.5 text-sm rounded-lg border border-sky-500/30 bg-sky-600 text-white" onClick={applyOnce}>Run</button>
            <button className="px-3 py-1.5 text-sm rounded-lg border" onClick={validate}>Check tasks</button>
          </div>
          {Array.isArray(results) && results.length > 0 && (
            <ul className="mt-3 text-sm">
              {results.map((r, i) => (
                <li key={i} className={clsx("flex items-center gap-2", r.ok ? "text-emerald-600" : "text-rose-600")}>
                  <span className={clsx("inline-block h-2.5 w-2.5 rounded-full", r.ok ? "bg-emerald-500" : "bg-rose-500")} />
                  {r.text}
                </li>
              ))}
            </ul>
          )}
          <div className="text-xs text-zinc-500 mt-2">
            Tip: Šablony se mění podle vybrané úlohy vlevo. Místa k doplnění jsou označena TODO komentáři.
          </div>
        </div>
        <div className="p-3">
          <div className="font-semibold text-sm mb-2">Preview</div>
          <div className="rounded-xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 min-h-[320px]" ref={previewRef} />
        </div>
      </div>
    </div>
  );
}

// (old linking playground replaced by VsPlayground)

const slides = [
  {
    id: "title",
    title: "Základy CSS – interaktivní cvičení",
    subtitle: "ZWA-4 • Selektory, třídy, odkazy",
    body: "Krátká praktická hřiště pro procvičení základních selektorů, pseudo-elementů a jednoduchých efektů.",
  },
  {
    id: "toc",
    title: "Obsah",
    bullets: [
      "Selektory a specifita",
      "Třídy a znovupoužitelnost",
      "Pseudo-elementy a odkazy",
    ],
  },
  {
    id: "theory",
    title: "Teorie – CSS základy",
    sections: [
      {
        icon: "🎯",
        title: "Selektory a specifita",
        points: [
          "Základní selektory: element (h1), třída (.btn), id (#main)",
          "Pseudo-třídy a pseudo-elementy: :hover, :visited, ::first-letter",
          "Specifita: inline > id > třída/atribut/pseudo-třída > element",
          "Kombinátory: potomci (A B), přímý potomek (A > B), sourozenci (A + B, A ~ B)",
          "Atributové selektory: [type=\"email\"], [data-role^=\"nav\"]",
          "Skupinové selektory: h1, h2, .lead (sdílení pravidel)",
          "Specifita v číslech: inline (1000), id (100), třída/atribut/pseudo-třída (10), element/pseudo-element (1)",
          "Vyhýbejte se !important; raději zvyšujte specifitu nebo upravte strukturu",
          "Kdy použít id vs. třídu: id pro jedinečné háčky, třídy pro znovupoužití",
        ],
      },
      {
        icon: "🧱",
        title: "Kaskáda a dědičnost",
        points: [
          "Pozdější pravidla a vyšší specifita přepisují dřívější",
          "Některé vlastnosti se dědí (font, color), jiné ne (margin, padding)",
          "!important překoná kaskádu (používat střídmě)",
          "Pořadí zdrojů: uživatelský agent < autor < inline < !important",
          "Dědičnost vynutíte inherit; potlačíte initial, unset, nebo revert",
          "Kontext dědičnosti: barva a písmo tečou do potomků, box model nikoli",
          "Kaskádové vrstvy (@layer): řízení priority modulů stylů",
          "Pište od obecného ke specifickému; snižujte zbytečnou specifitu",
          "Resety/normalizace sjednotí výchozí styly napříč prohlížeči",
        ],
      },
      {
        icon: "🔗",
        title: "Stavové selektory odkazů",
        points: [
          ":link, :visited, :hover, :active – často pořadí LVHA",
          "Bezpečnost: pro :visited je prohlížeč omezený (např. ne layout)",
          "Barva navštíveného může být stejná jako default, aby se neměnila",
          "Přístupnost: navštívené odkazy by měly být rozlišitelné alespoň barvou",
          ":focus a :focus-visible zlepšují klávesovou navigaci",
          ":hover není spolehlivý na dotykových zařízeních – přidejte i focus/active",
          "Pořadí stavů pište konzistentně: :link, :visited, :hover, :focus, :active",
          "U :visited lze měnit hlavně barvy (např. color, outline-color), ne rozvržení",
          "Zvětšujte klikací plochu pomocí paddingu; margin neovlivní hit-area",
        ],
      },
    ],
  },
  {
    id: "meme",
    title: "CSS Meme",
    body: "Krátké odlehčení: proč CSS patří ke každému webu.",
  },
  {
    id: "linking",
    title: "Propojení HTML a CSS",
    steps: [
      {
        title: "1) Vytvořte link na stylopis",
        desc: "Vložením <link rel=\"stylesheet\" href=\"styles.css\"> do <head> propojíte HTML se souborem CSS.",
        examples: [
          "<head>",
          "  <link rel=\"stylesheet\" href=\"styles.css\">",
          "</head>",
        ],
        hint: "Použijte přesně název styles.css",
      },
      {
        title: "2) Změňte barvu nadpisu v CSS",
        desc: "V styles.css nastavte zelenou barvu pro #title.",
        examples: [
          "h1#title {",
          "  color: #16a34a;",
          "}",
        ],
        hint: "Po propojení by se měl náhled obarvit.",
      },
    ],
  },
  {
    id: "tasks",
    title: "Úlohy – CSS",
    steps: [
      {
        title: "1) Nadpis",
        desc: "Zmodřete hlavní nadpis a nastavte velikost písma.",
        examples: [
          "h1#title {",
          "  color: #1d4ed8;",
          "  font-size: 36px;",
          "}",
        ],
        hint: "Použijte id selektor a hex barvu.",
      },
      {
        title: "2) Odkazy ve footeru",
        desc: "Změňte písmo na Georgia a barvu na #2563eb. Navštívené odkazy mají stejnou barvu.",
        examples: [
          "footer a {",
          "  font-family: Georgia, serif;",
          "  color: #2563eb;",
          "}",
          "footer a:visited {",
          "  color: #2563eb;",
          "}",
        ],
        hint: "Nezapomeňte na :visited.",
      },
      {
        title: "3) První písmeno",
        desc: "V odstavci .excerpt zvětšete první písmeno a přidejte pozadí.",
        examples: [
          "p.excerpt::first-letter {",
          "  font-size: 200%;",
          "  background: #fef08a;",
          "}",
        ],
        hint: "Použijte pseudo-element ::first-letter.",
      },
      {
        title: "4) Submenu jako písmena",
        desc: "Převeďte číslování v ol.submenu na lower-alpha.",
        examples: [
          "ol.submenu {",
          "  list-style-type: lower-alpha;",
          "}",
        ],
        hint: "Vlastnost list-style-type.",
      },
      {
        title: "5) Hover efekt na obrázku",
        desc: "Při hover lehce zvětšit obrázek a přidat plynulý přechod.",
        examples: [
          ".hero img:hover {",
          "  transform: scale(1.05);",
          "  transition: transform 200ms ease;",
          "}",
        ],
        hint: "Transform + transition.",
      },
    ],
  },
];

function SlideCard({ slide, stepIndex: controlledIndex, onStepIndexChange }) {
  const hasSteps = Array.isArray(slide.steps) && slide.steps.length > 0;
  const hasSections = Array.isArray(slide.sections) && slide.sections.length > 0;
  const isControlled = typeof controlledIndex === "number" && typeof onStepIndexChange === "function";
  const [internalIndex, setInternalIndex] = useState(0);
  useEffect(() => {
    if (!isControlled) setInternalIndex(0);
  }, [slide, isControlled]);
  const stepIndex = isControlled ? controlledIndex : internalIndex;
  const setStepIndex = isControlled ? onStepIndexChange : setInternalIndex;
  const totalSteps = hasSteps ? slide.steps.length : 0;
  const currentStep = hasSteps ? slide.steps[stepIndex] : null;
  const totalSections = hasSections ? slide.sections.length : 0;
  const currentSection = hasSections ? slide.sections[stepIndex] : null;
  return (
    <div className="p-6 rounded-2xl shadow bg-white/70 dark:bg-zinc-900/60 backdrop-blur border border-zinc-200/60 dark:border-zinc-800">
      <h2 className="text-2xl font-bold mb-2">{slide.title}</h2>
      {slide.subtitle && <p className="text-zinc-500 mb-3">{slide.subtitle}</p>}
      {slide.body && !hasSections && !hasSteps && (
        <div>
          <p className="leading-relaxed">{slide.body}</p>
        </div>
      )}
      {slide.bullets && !hasSections && !hasSteps && (
        <ul className="list-disc pl-6 space-y-1 mt-2">
          {slide.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      )}
      {hasSections && currentSection && (
        <div className="mt-4">
          <div className="rounded-xl border border-zinc-200/60 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800">Krok {stepIndex + 1} / {totalSections}</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl" aria-hidden>{currentSection.icon}</span>
              <div className="font-semibold">{currentSection.title}</div>
            </div>
            {Array.isArray(currentSection.points) && (
              <ul className="list-disc pl-5 space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                {currentSection.points.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
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
              {Array.from({ length: totalSections }).map((_, i) => (
                <button
                  key={i}
                  className={clsx(
                    "h-2.5 w-2.5 rounded-full border border-zinc-300/60 dark:border-zinc-700",
                    i === stepIndex ? "bg-sky-500" : "bg-zinc-200 dark:bg-zinc-800"
                  )}
                  onClick={() => setStepIndex(i)}
                  aria-label={`Přejít na krok ${i + 1}`}
                />
              ))}
            </div>
            <button
              className="px-3 py-1.5 text-sm rounded-lg border border-sky-500/30 bg-sky-600 text-white disabled:opacity-50"
              onClick={() => setStepIndex((i) => Math.min(totalSections - 1, i + 1))}
              disabled={stepIndex === totalSections - 1}
            >
              Další
            </button>
          </div>
        </div>
      )}
      {hasSteps && currentStep && (
        <div className="mt-4">
          <div className="rounded-xl border border-zinc-200/60 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800">Úloha {stepIndex + 1} / {totalSteps}</span>
            </div>
            <div className="font-semibold mb-1">{currentStep.title}</div>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-2">{currentStep.desc}</p>
            {currentStep.examples && (
              <pre className="text-xs bg-zinc-100/70 dark:bg-zinc-800/70 rounded-lg p-2 whitespace-pre-wrap">{currentStep.examples.join("\n")}</pre>
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
                    "h-2.5 w-2.5 rounded-full border border-zinc-300/60 dark:border-zinc-700",
                    i === stepIndex ? "bg-sky-500" : "bg-zinc-200 dark:bg-zinc-800"
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
      {slide.id === "meme" && (
        <div className="mt-3 rounded-xl overflow-hidden border border-zinc-200/60 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40">
          <img src={memeImg.src} alt="CSS meme" className="w-full max-h-[420px] object-contain bg-white dark:bg-zinc-900" />
        </div>
      )}
      {slide.id === "toc" && (
        <div className="text-xs text-zinc-500 mt-3">
          Studijní materiály: <a className="underline" href="https://cw.fel.cvut.cz/wiki/courses/b6b39zwa/tutorials/04/start" target="_blank" rel="noreferrer noopener">Cvičení 4 – CSS</a>
        </div>
      )}
    </div>
  );
}

// (old CSS and linking playgrounds consolidated into VsPlayground)
export default function App() {
  const [active, setActive] = useState(slides[0].id);
  const [stepIndex, setStepIndex] = useState(0);
  const current = slides.find((s) => s.id === active) || slides[0];
  const hasSteps = Array.isArray(current.steps) && current.steps.length > 0;

  useEffect(() => {
    setStepIndex(0);
  }, [active]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-zinc-50 to-sky-50 dark:from-zinc-950 dark:to-zinc-900 text-zinc-900 dark:text-zinc-50">
      <div className="max-w-7xl mx-auto p-4 md:p-8 relative">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
          <div className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-sky-300/40 dark:bg-sky-500/20 blur-3xl" />
          <div className="absolute top-1/3 -left-24 h-72 w-72 rounded-full bg-fuchsia-300/40 dark:bg-fuchsia-500/20 blur-3xl" />
        </div>

        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">ZWA-2: Interactive CSS Presentation</h1>
            <p className="text-xs md:text-sm text-zinc-500 mt-1">Editor vlevo, náhled vpravo. Upravit → Run → Check.</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <nav className="flex flex-wrap gap-2 mb-3">
              {slides.map((s) => (
                <button
                  key={s.id}
                  className={clsx(
                    "px-3 py-1.5 rounded-full text-sm border",
                    s.id === active
                      ? "bg-sky-600 text-white border-sky-600"
                      : "bg-white/70 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 hover:bg-white"
                  )}
                  onClick={() => setActive(s.id)}
                >
                  {s.title}
                </button>
              ))}
            </nav>
            <SlideCard slide={current} stepIndex={hasSteps ? stepIndex : undefined} onStepIndexChange={setStepIndex} />
          </div>
          <div>
            <div className="lg:sticky lg:top-8">
              <VsPlayground slideId={active} stepIndex={hasSteps ? stepIndex : 0} />
              <div className="mt-3 text-xs text-zinc-500">
                Pozn.: Toto je výuková simulace pro procvičení CSS. Výsledky jsou zjednodušené kvůli spolehlivému automatickému vyhodnocení.
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-8 text-sm text-zinc-500">
          © 2025 ZWA – Interactive demo for teaching (Egor Ulianov)
        </footer>
        <Analytics />
      </div>
    </div>
  );
}


