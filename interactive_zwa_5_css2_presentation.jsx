import React, { useEffect, useMemo, useRef, useState } from "react";
import { Analytics } from "@vercel/analytics/react";

function clsx(...xs) { return xs.filter(Boolean).join(" "); }

function Code({ children }) {
  return <code className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[90%]">{children}</code>;
}

function getBaseHtml() {
  return [
    "<!doctype html>",
    "<html>",
    "  <head>",
    "    <meta charset=\"utf-8\">",
    "    <title>CSS II Playground</title>",
    "  </head>",
    "  <body>",
    "    <header id=\"site-header\" class=\"p-2\">",
    "      <img id=\"logo\" alt=\"Logo\" src=\"https://placehold.co/80x40\" />",
    "      <h1 id=\"title\">Sample Article</h1>",
    "    </header>",
    "    <nav id=\"menu\">",
    "      <ul>",
    "        <li><a href=\"#\">Home</a></li>",
    "        <li><a href=\"#\">Docs</a></li>",
    "        <li><a href=\"#\">Contact</a></li>",
    "      </ul>",
    "    </nav>",
    "    <main class=\"container\">",
    "      <article id=\"article\">",
    "        <h2>CSS II Tasks</h2>",
    "        <p id=\"lorem\">Lorem ipsum <span class=\"hl\">dolor sit amet</span>, consectetur adipiscing elit. Curabitur <span class=\"hl\">ligula</span> sapien, fermentum quis lorem in, luctus gravida leo.</p>",
    "        <img id=\"pic\" alt=\"Sample\" src=\"https://placehold.co/160x120\" />",
    "        <p>More text follows. Vestibulum ante ipsum primis in faucibus orci luctus.</p>",
    "      </article>",
    "    </main>",
    "    <footer id=\"footer\">© 2025</footer>",
    "  </body>",
    "</html>",
  ].join("\n");
}

function getTaskTemplates(stepIndex) {
  const baseHtml = getBaseHtml();
  const steps = [
    {
      id: "boxmodel",
      title: "Box model",
      desc: "Viditelně oddělte header, nav, article, footer pomocí padding, border, margin.",
      css: [
        "/* TODO: nastavte padding/border/margin pro #site-header, #menu, #article, #footer */",
        "#site-header { /* padding: 8px; border: 1px solid #e5e7eb; margin-bottom: 8px; */ }",
        "#menu { /* padding: 8px; border: 1px solid #e5e7eb; margin-bottom: 8px; */ }",
        "#article { /* padding: 8px; border: 1px solid #e5e7eb; margin-bottom: 8px; */ }",
        "#footer { /* padding: 8px; border: 1px solid #e5e7eb; margin-top: 8px; */ }",
      ].join("\n"),
      html: baseHtml,
    },
    {
      id: "float",
      title: "Float/Clear",
      desc: "Vložte obrázek do textu a nechte text obtékat (float).",
      css: [
        "/* TODO: nastavte #pic float left/right a případné okraje */",
        "#pic { /* float: right; margin: 0 0 8px 8px; */ }",
        "#article::after { /* content: \"\"; display: block; clear: both; */ }",
      ].join("\n"),
      html: baseHtml,
    },
    {
      id: "position",
      title: "Position",
      desc: "Vyzkoušejte position u obrázku (relative/absolute/fixed).",
      css: [
        "/* TODO: změňte position u #pic na relative/absolute/fixed a posuňte jej */",
        "#article { position: relative; }",
        "#pic { /* position: absolute; top: 0; right: 0; */ }",
      ].join("\n"),
      html: baseHtml,
    },
    {
      id: "display",
      title: "Display",
      desc: "Změňte zobrazování označených slov (.hl) na block nebo inline-block a obarvěte je.",
      css: [
        "/* TODO: upravte zobrazení .hl */",
        ".hl { /* display: inline-block; background: #fef08a; padding: 2px 4px; */ }",
      ].join("\n"),
      html: baseHtml,
    },
    {
      id: "flex",
      title: "Flexbox",
      desc: "V headeru zarovnejte tlačítko Login zcela vpravo a logo s h1 vlevo.",
      css: [
        "/* TODO: nastavte #site-header jako flex kontejner; přidejte zarovnání */",
        "#site-header { /* display: flex; align-items: center; gap: 8px; */ }",
        "#site-header button { /* margin-left: auto; */ }",
      ].join("\n"),
      html: getBaseHtml().replace(
        "</header>",
        "  <button id=\"login\">Login</button>\n    </header>"
      ),
    },
    {
      id: "responsive",
      title: "Responzivita (@media)",
      desc: "Na desktopu zobrazte nav a article vedle sebe, na mobilu pod sebou.",
      css: [
        "/* TODO: použijte @media pro změnu layoutu */",
        ".container { /* display: block; */ }",
        "#menu { /* margin-bottom: 8px; */ }",
        "@media (min-width: 800px) {",
        "  .container { display: grid; grid-template-columns: 240px 1fr; gap: 12px; }",
        "  #menu { margin-bottom: 0; }",
        "}",
      ].join("\n"),
      html: baseHtml,
    },
    {
      id: "print",
      title: "Print stylesheet",
      desc: "Přidejte do <head> odkaz na stylopis pro tisk (<link media=\"print\">).",
      css: "/* Tento krok kontroluje <link media=\"print\"> v HTML. CSS může zůstat prázdné. */",
      html: baseHtml.replace(
        "</head>",
        [
          "    <!-- TODO: Přidejte <link rel=\"stylesheet\" href=\"print.css\" media=\"print\"> -->",
          "  </head>",
        ].join("\n")
      ),
    },
  ];
  const idx = Math.max(0, Math.min(stepIndex || 0, steps.length - 1));
  return { step: steps[idx], all: steps };
}

function runValidation({ container, htmlCode, cssCode, stepIndex }) {
  const results = [];
  try {
    if (!container) return results;
    if (stepIndex === 0) {
      const ids = ["#site-header", "#menu", "#article", "#footer"];
      ids.forEach((sel) => {
        const el = container.querySelector(sel);
        const cs = el ? window.getComputedStyle(el) : null;
        const ok = cs && (parseInt(cs.paddingTop) > 0 || parseInt(cs.borderTopWidth) > 0 || parseInt(cs.marginTop) > 0);
        results.push({ ok: !!ok, text: `${sel} has some box model styling` });
      });
    } else if (stepIndex === 1) {
      const img = container.querySelector('#pic');
      const cs = img ? window.getComputedStyle(img) : null;
      const ok = cs && (cs.float === 'left' || cs.float === 'right');
      results.push({ ok: !!ok, text: "#pic floats left/right" });
      const hasClearfix = /clear\s*:\s*both/i.test(cssCode) || /::after[\s\S]*clear\s*:\s*both/i.test(cssCode);
      results.push({ ok: !!hasClearfix, text: "clearfix (clear: both) present" });
    } else if (stepIndex === 2) {
      const img = container.querySelector('#pic');
      const cs = img ? window.getComputedStyle(img) : null;
      const ok = cs && cs.position && cs.position !== 'static';
      results.push({ ok: !!ok, text: "#pic position is not static" });
    } else if (stepIndex === 3) {
      const el = container.querySelector('.hl');
      const cs = el ? window.getComputedStyle(el) : null;
      const ok = cs && (cs.display === 'inline-block' || cs.display === 'block');
      results.push({ ok: !!ok, text: ".hl display changed (block/inline-block)" });
      const hasBg = /\.hl[\s\S]*background/i.test(cssCode);
      results.push({ ok: !!hasBg, text: ".hl has background color" });
    } else if (stepIndex === 4) {
      const hdr = container.querySelector('#site-header');
      const cs = hdr ? window.getComputedStyle(hdr) : null;
      const ok = cs && cs.display === 'flex';
      results.push({ ok: !!ok, text: "#site-header uses display:flex" });
      const hasAuto = /#site-header\s+button[\s\S]*margin-left\s*:\s*auto/i.test(cssCode);
      results.push({ ok: !!hasAuto, text: "#site-header button has margin-left:auto" });
    } else if (stepIndex === 5) {
      const hasMedia = /@media\s*\(min-width:\s*800px\)/i.test(cssCode);
      results.push({ ok: !!hasMedia, text: "@media(min-width:800px) present" });
    } else if (stepIndex === 6) {
      const okLink = /<link[^>]*rel=["']stylesheet["'][^>]*media=["']print["'][^>]*>/i.test(htmlCode);
      results.push({ ok: !!okLink, text: "<link rel=stylesheet media=print> present" });
    }
  } catch (e) {
    results.push({ ok: false, text: `Validation error: ${e?.message || e}` });
  }
  return results;
}

function VsPlayground({ stepIndex }) {
  const previewRef = useRef(null);
  const [htmlCode, setHtmlCode] = useState("");
  const [cssCode, setCssCode] = useState("");
  const [applyVersion, setApplyVersion] = useState(0);
  const [results, setResults] = useState([]);
  const templates = useMemo(() => getTaskTemplates(stepIndex), [stepIndex]);

  useEffect(() => {
    setHtmlCode(templates.step.html);
    setCssCode(templates.step.css);
    setResults([]);
    setApplyVersion((v) => v + 1);
  }, [templates]);

  useEffect(() => {
    if (!previewRef.current) return;
    let html = htmlCode || "";
    if (/<\/head>/i.test(html)) {
      html = html.replace(/<\/head>/i, `<style>${cssCode}</style></head>`);
    } else {
      html = `<style>${cssCode}</style>` + html;
    }
    previewRef.current.innerHTML = html;
  }, [htmlCode, cssCode, applyVersion]);

  function applyOnce() { setApplyVersion((v) => v + 1); }
  function validate() {
    const r = runValidation({ container: previewRef.current, htmlCode, cssCode, stepIndex });
    setResults(r);
  }

  return (
    <div className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 shadow overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2">
        <div className="p-3 border-b lg:border-b-0 lg:border-r border-zinc-200/60 dark:border-zinc-800">
          <div className="font-semibold text-sm mb-2">HTML</div>
          <textarea value={htmlCode} onChange={(e) => setHtmlCode(e.target.value)} spellCheck={false} className="min-h-[220px] w-full rounded border p-3 font-mono text-xs bg-white dark:bg-zinc-900" />
          <div className="font-semibold text-sm mt-3 mb-2">CSS</div>
          <textarea value={cssCode} onChange={(e) => setCssCode(e.target.value)} spellCheck={false} className="min-h-[220px] w-full rounded border p-3 font-mono text-xs bg-white dark:bg-zinc-900" />
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
        </div>
        <div className="p-3">
          <div className="font-semibold text-sm mb-2">Preview</div>
          <div ref={previewRef} className="rounded-xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 min-h-[320px]" />
        </div>
      </div>
    </div>
  );
}

const slides = [
  { id: "title", title: "CSS II – layout a responzivita", subtitle: "ZWA-5 • Box model, float, position, display, flex, @media, print" },
  { id: "toc", title: "Obsah", bullets: [
    "Box model (padding/border/margin)",
    "Float a clear",
    "Position (static/relative/absolute/fixed)",
    "Display (inline/block/inline-block)",
    "Flexbox (zarovnání, mezery)",
    "Responzivita (@media)",
    "Tisk (print stylesheet)",
  ]},
  { id: "theory", title: "Teorie – CSS II", sections: [
    { icon: "📦", title: "Box model", points: [
      "Každý element má content, padding, border a margin.",
      "box-sizing:border-box zahrne padding+border do šířky/výšky.",
      "Svislé marginy se mohou sčítat (margin collapsing).",
    ]},
    { icon: "🧭", title: "Float & Clear", points: [
      "float odsunuje element vlevo/vpravo a text jej obtéká.",
      "clearfix (např. ::after s clear:both) zabrání kolapsu výšky rodiče.",
      "Float se dnes používá výjimečně (historický layout).",
    ]},
    { icon: "📍", title: "Position", points: [
      "static (výchozí), relative (posun bez vlivu na flow), absolute (vyjme z flow, kotvený k nejbližšímu positioned rodiči)",
      "fixed (kotvení k viewportu), sticky (hybrid mezi relative a fixed).",
      "Zvažte z-index a stacking contexty.",
    ]},
    { icon: "🧱", title: "Display", points: [
      "inline vs. block vs. inline-block – vliv na tok a box model.",
      "display:none odstraní z flow i accessibility stromu (pozor na ARIA).",
      "Moderní layout řešte Flexbox/Grid, ne tabulkami.",
    ]},
    { icon: "🧰", title: "Flexbox", points: [
      "Parent: display:flex; children: flex properties (flex, order, align).",
      "Zarovnání: justify-content (hlavní osa), align-items (příčná osa).",
      "margin-left:auto rychle odsune prvek na konec řádku.",
    ]},
    { icon: "📱", title: "Media queries", points: [
      "@media (min-width: ...) pro mobile-first přístup.",
      "Používejte promyšlené breakpoints dle obsahu, ne zařízení.",
      "Preferujte relativní jednotky (em/rem/vw/vh).",
    ]},
    { icon: "🖨️", title: "Print", points: [
      "Samostatný stylesheet přes <link media=\"print\">.",
      "Skryjte navigaci, barevné pozadí a zvyšte kontrast textu.",
      "Zajistěte čitelnost: font-size, margins, page-break.",
    ]},
  ]},
  { id: "links", title: "Odkazy", bullets: [
    "Cvičení 5 – CSS II (cw.fel) — https://cw.fel.cvut.cz/wiki/courses/b6b39zwa/tutorials/05/start",
    "MDN: Box model — https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/The_box_model",
    "MDN: float — https://developer.mozilla.org/en-US/docs/Web/CSS/float",
    "MDN: position — https://developer.mozilla.org/en-US/docs/Web/CSS/position",
    "MDN: display — https://developer.mozilla.org/en-US/docs/Web/CSS/display",
    "MDN: Flexbox — https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Flexbox",
    "MDN: @media — https://developer.mozilla.org/en-US/docs/Web/CSS/@media",
    "MDN: print styles — https://developer.mozilla.org/en-US/docs/Web/CSS/Media_Queries/Using_media_queries#printing",
  ]},
  { id: "quiz-css", title: "KVÍZ: CSS základy", steps: [] },
  { id: "tasks", title: "Úlohy – CSS II", steps: [] },
];

function SlideCard({ slide, stepIndex, onStepIndexChange }) {
  const hasSteps = slide.id === "tasks";
  const hasSections = Array.isArray(slide.sections) && slide.sections.length > 0;
  const internal = useMemo(() => getTaskTemplates(0).all, []);
  const total = internal.length;
  const cur = internal[stepIndex];
  return (
    <div className="p-6 rounded-2xl shadow bg-white/70 dark:bg-zinc-900/60 backdrop-blur border border-zinc-200/60 dark:border-zinc-800">
      <h2 className="text-2xl font-bold mb-2">{slide.title}</h2>
      {slide.subtitle && <p className="text-zinc-500 mb-3">{slide.subtitle}</p>}
      {slide.bullets && (
        <ul className="list-disc pl-6 space-y-1 mt-2">{slide.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>
      )}
      {hasSections && (
        <div className="mt-4">
          <TheorySections sections={slide.sections} />
        </div>
      )}
      {slide.id === 'quiz-css' && (
        <div className="mt-2"><QuizCssBasics /></div>
      )}
      {hasSteps && (
        <div className="mt-2">
          <div className="rounded-xl border border-zinc-200/60 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800">Úloha {stepIndex + 1} / {total}</span>
            </div>
            <div className="font-semibold mb-1">{cur.title}</div>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-2">{cur.desc}</p>
            <div className="text-xs text-zinc-500">Odkaz: <a className="underline" href="https://cw.fel.cvut.cz/wiki/courses/b6b39zwa/tutorials/05/start" target="_blank" rel="noreferrer noopener">Cvičení 5 – CSS II</a></div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <button className="px-3 py-1.5 text-sm rounded-lg border border-zinc-200/60 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 disabled:opacity-50" onClick={() => onStepIndexChange(Math.max(0, stepIndex - 1))} disabled={stepIndex === 0}>Předchozí</button>
            <div className="flex items-center gap-1">{Array.from({ length: total }).map((_, i) => (
              <button key={i} className={clsx("h-2.5 w-2.5 rounded-full border border-zinc-300/60 dark:border-zinc-700", i === stepIndex ? "bg-sky-500" : "bg-zinc-200 dark:bg-zinc-800")} onClick={() => onStepIndexChange(i)} aria-label={`Přejít na úlohu ${i + 1}`} />
            ))}</div>
            <button className="px-3 py-1.5 text-sm rounded-lg border border-sky-500/30 bg-sky-600 text-white disabled:opacity-50" onClick={() => onStepIndexChange(Math.min(total - 1, stepIndex + 1))} disabled={stepIndex === total - 1}>Další</button>
          </div>
        </div>
      )}
    </div>
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
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800">Krok {idx + 1} / {total}</span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl" aria-hidden>{cur.icon}</span>
          <div className="font-semibold">{cur.title}</div>
        </div>
        <ul className="list-disc pl-5 space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
          {cur.points.map((p, i) => <li key={i}>{p}</li>)}
        </ul>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <button className="px-3 py-1.5 text-sm rounded-lg border border-zinc-200/60 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 disabled:opacity-50" onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0}>Předchozí</button>
        <div className="flex items-center gap-1">
          {sections.map((_, i) => (
            <button key={i} className={clsx("h-2.5 w-2.5 rounded-full border border-zinc-300/60 dark:border-zinc-700", i === idx ? "bg-sky-500" : "bg-zinc-200 dark:bg-zinc-800")} onClick={() => setIdx(i)} aria-label={`Přejít na krok ${i + 1}`} />
          ))}
        </div>
        <button className="px-3 py-1.5 text-sm rounded-lg border border-sky-500/30 bg-sky-600 text-white disabled:opacity-50" onClick={() => setIdx((i) => Math.min(total - 1, i + 1))} disabled={idx === total - 1}>Další</button>
      </div>
    </div>
  );
}

function QuizCssBasics() {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const questions = [
    { id: 'q1', text: 'Pořadí stavů odkazů (doporučené) je…', options: [':visited, :link, :hover, :active', ':link, :visited, :hover, :active', ':hover, :link, :visited, :active'], correctIndex: 1, hint: 'LVHA' },
    { id: 'q2', text: 'Které pravidlo má vyšší specifitu?', options: ['.card .title', '#title', 'header h1'], correctIndex: 1, hint: 'id > třída > element' },
    { id: 'q3', text: 'Co dělá box-sizing:border-box?', options: ['Zruší padding', 'Zahrne padding+border do šířky/výšky', 'Změní display na block'], correctIndex: 1, hint: 'Výpočet boxu' },
    { id: 'q4', text: 'Které z následujících ODEBERE element z toku a accessibility?', options: ['visibility:hidden', 'display:none', 'opacity:0'], correctIndex: 1, hint: 'display:none' },
    { id: 'q5', text: 'Jak zarovnáte tlačítko vpravo ve flex řádku?', options: ['text-align:right', 'margin-left:auto', 'float:right'], correctIndex: 1, hint: 'Flex a auto margin' },
    { id: 'q6', text: 'Mobile-first media query pro desktop je…', options: ['@media (max-width: 800px)', '@media (min-width: 800px)', '@media screen and (touch)'], correctIndex: 1, hint: 'min-width pro větší obrazovky' },
    { id: 'q7', text: 'Jak nejlépe zajistit obtékání obrázku textem v moderním layoutu?', options: ['float', 'flexbox justify-content', 'obvykle ne – použíjte float jen výjimečně'], correctIndex: 2, hint: 'Float je historický' },
  ];
  const total = questions.length;
  const score = questions.reduce((acc, q) => acc + (answers[q.id] === q.correctIndex ? 1 : 0), 0);
  function selectAnswer(qid, idx) { if (!submitted) setAnswers((a) => ({ ...a, [qid]: idx })); }
  function submit() { setSubmitted(true); }
  function reset() { setAnswers({}); setSubmitted(false); }
  return (
    <div className="space-y-4">
      {questions.map((q, qi) => {
        const selected = answers[q.id];
        const isCorrect = selected === q.correctIndex;
        return (
          <div key={q.id} className="rounded-xl border border-zinc-200/60 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 p-4">
            <div className="font-medium mb-2">{qi + 1}. {q.text}</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {q.options.map((opt, idx) => {
                const active = selected === idx;
                const correct = submitted && idx === q.correctIndex;
                const wrong = submitted && active && !correct;
                return (
                  <button key={idx} className={clsx("text-left px-3 py-2 rounded-lg border text-sm", active ? "border-sky-500 bg-sky-50 dark:bg-sky-950/30" : "border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60", correct ? "ring-2 ring-emerald-400" : "", wrong ? "ring-2 ring-rose-400" : "")} onClick={() => selectAnswer(q.id, idx)}>
                    {opt}
                  </button>
                );
              })}
            </div>
            {submitted && (
              <div className={clsx("mt-2 text-xs", isCorrect ? "text-emerald-600" : "text-rose-600")}>
                {isCorrect ? "Správně!" : `Nesprávně. Správná volba je ${q.correctIndex + 1}.`} <span className="text-zinc-500">({q.hint})</span>
              </div>
            )}
          </div>
        );
      })}
      <div className="flex items-center gap-2">
        {!submitted ? (
          <button className="px-4 py-2 rounded-lg bg-sky-600 text-white" onClick={submit}>Vyhodnotit</button>
        ) : (
          <>
            <div className="text-sm text-zinc-700 dark:text-zinc-300">Skóre: {score} / {total}</div>
            <button className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700" onClick={reset}>Reset</button>
          </>
        )}
      </div>
    </div>
  );
}

export default function AppCss2Lesson() {
  const [active, setActive] = useState(slides[0].id);
  const [stepIndex, setStepIndex] = useState(0);
  const current = slides.find((s) => s.id === active) || slides[0];
  const hasTasks = current.id === "tasks";
  useEffect(() => { setStepIndex(0); }, [active]);
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-zinc-50 to-sky-50 dark:from-zinc-950 dark:to-zinc-900 text-zinc-900 dark:text-zinc-50">
      <div className="max-w-7xl mx-auto p-4 md:p-8 relative">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
          <div className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-sky-300/40 dark:bg-sky-500/20 blur-3xl" />
          <div className="absolute top-1/3 -left-24 h-72 w-72 rounded-full bg-fuchsia-300/40 dark:bg-fuchsia-500/20 blur-3xl" />
        </div>
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">ZWA-5: Interactive CSS II Presentation</h1>
            <p className="text-xs md:text-sm text-zinc-500 mt-1">Editor vlevo, náhled vpravo. Úkoly dle <a className="underline" href="https://cw.fel.cvut.cz/wiki/courses/b6b39zwa/tutorials/05/start" target="_blank" rel="noreferrer noopener">Cvičení 5 – CSS II</a>.</p>
          </div>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <nav className="flex flex-wrap gap-2 mb-3">
              {slides.map((s) => (
                <button key={s.id} className={clsx("px-3 py-1.5 rounded-full text-sm border", s.id === active ? "bg-sky-600 text-white border-sky-600" : "bg-white/70 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 hover:bg-white")} onClick={() => setActive(s.id)}>{s.title}</button>
              ))}
              <button className={clsx("px-3 py-1.5 rounded-full text-sm border", active === "tasks" ? "bg-sky-600 text-white border-sky-600" : "bg-white/70 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 hover:bg-white")} onClick={() => setActive("tasks")}>
                Úlohy – CSS II
              </button>
            </nav>
            <SlideCard slide={current} stepIndex={stepIndex} onStepIndexChange={setStepIndex} />
          </div>
          <div>
            <div className="lg:sticky lg:top-8">
              <VsPlayground stepIndex={hasTasks ? stepIndex : 0} />
              <div className="mt-3 text-xs text-zinc-500">Pozn.: Validace je zjednodušená (heuristiky pomocí computed styles a regex).</div>
            </div>
          </div>
        </div>
        <footer className="mt-8 text-sm text-zinc-500">© 2025 ZWA – Interactive CSS II lesson</footer>
        <Analytics />
      </div>
    </div>
  );
}


