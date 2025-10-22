import React, { useEffect, useMemo, useRef, useState } from "react";
import { Analytics } from "@vercel/analytics/react";

function clsx(...xs) {
  return xs.filter(Boolean).join(" ");
}

function Code({ children }) {
  return (
    <code className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[90%]">{children}</code>
  );
}

function useConsoleCapture() {
  const [logs, setLogs] = useState([]);
  const clear = () => setLogs([]);
  const api = useMemo(() => ({
    log: (...args) => setLogs((l) => [...l, { type: "log", text: args.map(String).join(" ") }]),
    error: (...args) => setLogs((l) => [...l, { type: "error", text: args.map(String).join(" ") }]),
    warn: (...args) => setLogs((l) => [...l, { type: "warn", text: args.map(String).join(" ") }]),
  }), []);
  return { logs, api, clear };
}

function getJsTemplates(stepIndex) {
  const steps = [
    {
      title: "1) Proměnné a typy",
      desc: "Vytvořte proměnnou greeting s hodnotou 'Ahoj' a funkci double(n), která vrátí dvojnásobek. Exportujte je do exports.greeting a exports.double.",
      js: [
        "// Úkol: proměnná greeting a funkce double(n)",
        "// Tip: vše co chcete testovat zveřejněte přes objekt 'exports'",
        "const greeting = 'Ahoj';",
        "function double(n) {",
        "  return n * 2;",
        "}",
        "exports.greeting = greeting;",
        "exports.double = double;",
        "console.log(greeting, double(21));",
      ].join("\n"),
      dom: "<div class=\"text-xs text-zinc-500\">(Tento krok DOM nevyužívá)</div>",
    },
    {
      title: "2) Funkce a podmínky",
      desc: "Napište funkci classify(n), která vrátí 'even' pro sudá čísla a 'odd' pro lichá. Exportujte jako exports.classify.",
      js: [
        "function classify(n) {",
        "  if (typeof n !== 'number') return 'n/a';",
        "  return n % 2 === 0 ? 'even' : 'odd';",
        "}",
        "exports.classify = classify;",
        "console.log('classify(5)=', classify(5));",
      ].join("\n"),
      dom: "<div class=\"text-xs text-zinc-500\">(Tento krok DOM nevyužívá)</div>",
    },
    {
      title: "3) Pole a objekty",
      desc: "Vytvořte funkci total(xs), která sečte pole čísel. Exportujte jako exports.total.",
      js: [
        "function total(xs) {",
        "  if (!Array.isArray(xs)) return 0;",
        "  return xs.reduce((acc, n) => acc + Number(n || 0), 0);",
        "}",
        "exports.total = total;",
        "console.log('total([1,2,3])=', total([1,2,3]));",
      ].join("\n"),
      dom: "<div class=\"text-xs text-zinc-500\">(Tento krok DOM nevyužívá)</div>",
    },
    {
      title: "4) DOM selektory",
      desc: "Vyberte #app a nastavte mu textContent na 'Hello JS'.",
      js: [
        "const app = document.querySelector('#app');",
        "if (app) {",
        "  app.textContent = 'Hello JS';",
        "}",
      ].join("\n"),
      dom: "<div id=\"app\" class=\"rounded border p-2 text-sm\">(sem napište text)</div>",
    },
    {
      title: "5) Události",
      desc: "Přidejte na #btn click, který zvýší číslo ve #cnt o 1.",
      js: [
        "const btn = document.getElementById('btn');",
        "const cnt = document.getElementById('cnt');",
        "if (btn && cnt) {",
        "  btn.addEventListener('click', () => {",
        "    const n = Number(cnt.textContent || '0');",
        "    cnt.textContent = String(n + 1);",
        "  });",
        "}",
      ].join("\n"),
      dom: [
        "<div class=\"flex items-center gap-2\">",
        "  <button id=\"btn\" class=\"px-2 py-1 rounded bg-sky-600 text-white text-xs\">Klik</button>",
        "  <span id=\"cnt\">0</span>",
        "</div>",
      ].join("\n"),
    },
  ];
  const idx = Math.max(0, Math.min(stepIndex || 0, steps.length - 1));
  return { step: steps[idx], all: steps };
}

function runJsAndValidate({ code, consoleApi, domRef, stepIndex }) {
  const results = [];
  const exportsObj = {};
  try {
    // Execute user code with captured console and provided exports
    const fn = new Function("exports", "console", code);
    fn(exportsObj, consoleApi);
    results.push({ ok: true, text: "Code executed" });
  } catch (e) {
    results.push({ ok: false, text: `Runtime error: ${e?.message || e}` });
    return { results, exportsObj };
  }

  try {
    // Per-step validations
    if (stepIndex === 0) {
      const ok1 = exportsObj.greeting === "Ahoj";
      const ok2 = typeof exportsObj.double === "function" && exportsObj.double(10) === 20;
      results.push({ ok: !!ok1, text: "exports.greeting === 'Ahoj'" });
      results.push({ ok: !!ok2, text: "exports.double(10) === 20" });
    } else if (stepIndex === 1) {
      const ok = typeof exportsObj.classify === "function" && exportsObj.classify(6) === "even" && exportsObj.classify(7) === "odd";
      results.push({ ok: !!ok, text: "classify(6) -> even, classify(7) -> odd" });
    } else if (stepIndex === 2) {
      const ok = typeof exportsObj.total === "function" && exportsObj.total([1, 2, 3]) === 6;
      results.push({ ok: !!ok, text: "total([1,2,3]) === 6" });
    } else if (stepIndex === 3) {
      const el = domRef?.current?.querySelector?.('#app');
      const ok = el && String(el.textContent).includes('Hello JS');
      results.push({ ok: !!ok, text: "#app has text 'Hello JS'" });
    } else if (stepIndex === 4) {
      const btn = domRef?.current?.querySelector?.('#btn');
      const cnt = domRef?.current?.querySelector?.('#cnt');
      if (btn && cnt) {
        btn.dispatchEvent(new Event('click', { bubbles: true }));
        const after = Number(cnt.textContent || '0');
        results.push({ ok: after >= 1, text: "Click increments #cnt" });
      } else {
        results.push({ ok: false, text: "DOM elements #btn/#cnt not found" });
      }
    }
  } catch (e) {
    results.push({ ok: false, text: `Validation error: ${e?.message || e}` });
  }
  return { results, exportsObj };
}

function JsPlayground({ stepIndex }) {
  const domRef = useRef(null);
  const { logs, api: consoleApi, clear: clearLogs } = useConsoleCapture();
  const templates = useMemo(() => getJsTemplates(stepIndex), [stepIndex]);
  const [code, setCode] = useState(templates.step.js);
  const [validateResults, setValidateResults] = useState([]);
  const [appliedVersion, setAppliedVersion] = useState(0);

  useEffect(() => {
    setCode(templates.step.js);
    setValidateResults([]);
    clearLogs();
    setAppliedVersion((v) => v + 1);
  }, [templates]);

  useEffect(() => {
    if (!domRef.current) return;
    domRef.current.innerHTML = templates.step.dom || "";
  }, [templates, appliedVersion]);

  function run() {
    setValidateResults([]);
    clearLogs();
    const out = runJsAndValidate({ code, consoleApi, domRef, stepIndex });
    setValidateResults(out.results);
    setAppliedVersion((v) => v + 1);
  }

  return (
    <div className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 shadow overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2">
        <div className="p-3 border-b lg:border-b-0 lg:border-r border-zinc-200/60 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-sm">JavaScript editor</div>
            <button className="px-3 py-1.5 text-sm rounded-lg border border-sky-500/30 bg-sky-600 text-white" onClick={run}>Run + Check</button>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            className="min-h-[320px] w-full rounded border p-3 font-mono text-xs bg-white dark:bg-zinc-900"
          />
          {Array.isArray(validateResults) && validateResults.length > 0 && (
            <ul className="mt-3 text-sm">
              {validateResults.map((r, i) => (
                <li key={i} className={clsx("flex items-center gap-2", r.ok ? "text-emerald-600" : "text-rose-600")}>
                  <span className={clsx("inline-block h-2.5 w-2.5 rounded-full", r.ok ? "bg-emerald-500" : "bg-rose-500")} />
                  {r.text}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="p-3">
          <div className="font-semibold text-sm mb-2">DOM preview</div>
          <div ref={domRef} className="rounded-xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 min-h-[160px]" />
          <div className="mt-3">
            <div className="font-semibold text-sm mb-1">Console</div>
            <div className="rounded-xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 min-h-[80px] max-h-[180px] overflow-auto text-xs">
              {logs.length === 0 && <div className="text-zinc-500">(žádné výstupy)</div>}
              {logs.map((l, i) => (
                <div key={i} className={clsx(l.type === 'error' ? 'text-rose-600' : l.type === 'warn' ? 'text-amber-600' : 'text-zinc-800 dark:text-zinc-200')}>{l.text}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const slides = [
  { id: "title", title: "Základy JavaScriptu – interaktivní cvičení", subtitle: "ZWA-5 • Proměnné, funkce, DOM" },
  { id: "toc", title: "Obsah", bullets: [
    "Proměnné, typy a operátory",
    "Funkce a podmínky",
    "Pole a objekty",
    "Práce s DOM a události",
  ] },
  { id: "theory", title: "Teorie – JS základy", sections: [
    { icon: "🔤", title: "Proměnné a typy", points: [
      "Deklarace: let (mění se), const (nemění se reference).",
      "Primitiva: string, number, boolean, null, undefined, symbol, bigint.",
      "Rovnosti: === (striktní), == (s přetypy – nedoporučeno).",
    ]},
    { icon: "🧮", title: "Funkce a řízení toku", points: [
      "Funkce deklarací i výrazem (arrow).",
      "Podmínky if/else, ternární operátor, switch.",
      "Cyklus for/of, while; map/filter/reduce u polí.",
    ]},
    { icon: "📦", title: "Pole a objekty", points: [
      "Pole jsou uspořádané; objekt je mapa klíč→hodnota.",
      "Destrukturalizace, spread/rest zjednodušují práci.",
      "Čisté funkce usnadňují testování.",
    ]},
    { icon: "🧩", title: "DOM a události", points: [
      "document.querySelector pro výběr elementu.",
      "addEventListener pro připojení handlerů.",
      "Nikdy nemanipulujte cizím DOM mimo svůj kontejner.",
    ]},
  ]},
  { id: "tasks", title: "Úlohy – JavaScript", steps: [] },
];

function SlideCard({ slide, stepIndex, onStepIndexChange }) {
  const hasSections = Array.isArray(slide.sections) && slide.sections.length > 0;
  const hasSteps = slide.id === "tasks";
  const internalSteps = useMemo(() => getJsTemplates(0).all, []);
  const totalSteps = internalSteps.length;
  const currentStep = internalSteps[stepIndex];
  return (
    <div className="p-6 rounded-2xl shadow bg-white/70 dark:bg-zinc-900/60 backdrop-blur border border-zinc-200/60 dark:border-zinc-800">
      <h2 className="text-2xl font-bold mb-2">{slide.title}</h2>
      {slide.subtitle && <p className="text-zinc-500 mb-3">{slide.subtitle}</p>}
      {slide.bullets && (
        <ul className="list-disc pl-6 space-y-1 mt-2">
          {slide.bullets.map((b, i) => <li key={i}>{b}</li>)}
        </ul>
      )}
      {hasSections && (
        <div className="mt-4">
          <TheorySections sections={slide.sections} />
        </div>
      )}
      {hasSteps && (
        <div className="mt-2">
          <div className="rounded-xl border border-zinc-200/60 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800">Úloha {stepIndex + 1} / {totalSteps}</span>
            </div>
            <div className="font-semibold mb-1">{currentStep.title}</div>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-2">{currentStep.desc}</p>
            <div className="text-xs text-zinc-500">Tip: Exportujte testované funkce do <Code>exports</Code> (např. <Code>exports.sum = sum</Code>).</div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <button className="px-3 py-1.5 text-sm rounded-lg border border-zinc-200/60 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 disabled:opacity-50" onClick={() => onStepIndexChange(Math.max(0, stepIndex - 1))} disabled={stepIndex === 0}>Předchozí</button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <button key={i} className={clsx("h-2.5 w-2.5 rounded-full border border-zinc-300/60 dark:border-zinc-700", i === stepIndex ? "bg-sky-500" : "bg-zinc-200 dark:bg-zinc-800")} onClick={() => onStepIndexChange(i)} aria-label={`Přejít na úlohu ${i + 1}`} />
              ))}
            </div>
            <button className="px-3 py-1.5 text-sm rounded-lg border border-sky-500/30 bg-sky-600 text-white disabled:opacity-50" onClick={() => onStepIndexChange(Math.min(totalSteps - 1, stepIndex + 1))} disabled={stepIndex === totalSteps - 1}>Další</button>
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

export default function AppJsLesson5() {
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
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">ZWA-5: Interactive JavaScript Presentation</h1>
            <p className="text-xs md:text-sm text-zinc-500 mt-1">Editor vlevo, DOM + Console vpravo. Exportujte řešení přes <Code>exports</Code>.</p>
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
              <button
                className={clsx(
                  "px-3 py-1.5 rounded-full text-sm border",
                  active === "tasks" ? "bg-sky-600 text-white border-sky-600" : "bg-white/70 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 hover:bg-white"
                )}
                onClick={() => setActive("tasks")}
              >
                Úlohy – JavaScript
              </button>
            </nav>
            <SlideCard slide={current} stepIndex={stepIndex} onStepIndexChange={setStepIndex} />
          </div>
          <div>
            <div className="lg:sticky lg:top-8">
              <JsPlayground stepIndex={hasTasks ? stepIndex : 0} />
              <div className="mt-3 text-xs text-zinc-500">
                Pozn.: Toto je výuková simulace pro procvičení JavaScriptu. Výsledky testů jsou zjednodušené kvůli spolehlivému automatickému vyhodnocení.
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-8 text-sm text-zinc-500">© 2025 ZWA – Interactive JS lesson</footer>
        <Analytics />
      </div>
    </div>
  );
}


