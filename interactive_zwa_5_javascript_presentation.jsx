import React, { useEffect, useMemo, useRef, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import memeImg from "./src/interactive-zwa-6/image.png";

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
        "// Tip: cokoliv chcete testovat, zveřejněte přes objekt 'exports'",
        "// TODO: deklarujte greeting a funkci double a nastavte exports.greeting, exports.double",
        "// Např.: exports.greeting = ...; exports.double = ...",
      ].join("\n"),
      dom: "<div class=\"text-xs text-zinc-500\">(Tento krok DOM nevyužívá)</div>",
    },
    {
      title: "2) Funkce a podmínky",
      desc: "Napište funkci classify(n), která vrátí 'even' pro sudá čísla a 'odd' pro lichá. Exportujte jako exports.classify.",
      js: [
        "// Úkol: napište funkci classify(n)",
        "// - vrací 'even' pro sudá čísla a 'odd' pro lichá",
        "// - pro nečíselné vstupy vraťte 'n/a'",
        "// TODO: implementujte a zveřejněte přes exports.classify",
      ].join("\n"),
      dom: "<div class=\"text-xs text-zinc-500\">(Tento krok DOM nevyužívá)</div>",
    },
    {
      title: "3) Cykly (for)",
      desc: "Napište funkci sumTo(n), která pomocí cyklu for sečte čísla 1..n. Exportujte jako exports.sumTo.",
      js: [
        "// Úkol: napište funkci sumTo(n)",
        "// - použijte cyklus for",
        "// - sečtěte 1..n a výsledek vraťte",
        "// TODO: implementujte a zveřejněte přes exports.sumTo",
      ].join("\n"),
      dom: "<div class=\"text-xs text-zinc-500\">(Tento krok DOM nevyužívá)</div>",
    },
    {
      title: "4) Pole a objekty",
      desc: "Vytvořte funkci total(xs), která sečte pole čísel. Exportujte jako exports.total.",
      js: [
        "// Úkol: napište funkci total(xs)",
        "// - očekává pole čísel a vrací jejich součet",
        "// - lze použít reduce/map/for... dle vás",
        "// TODO: implementujte a zveřejněte přes exports.total",
      ].join("\n"),
      dom: "<div class=\"text-xs text-zinc-500\">(Tento krok DOM nevyužívá)</div>",
    },
    {
      title: "5) DOM selektory",
      desc: "Vyberte #app a nastavte mu textContent na 'Hello JS'.",
      js: [
        "// Úkol: pomocí document.querySelector vyberte #app",
        "// TODO: nastavte elementu textContent na 'Hello JS'",
      ].join("\n"),
      dom: "<div id=\"app\" class=\"rounded border p-2 text-sm\">(sem napište text)</div>",
    },
    {
      title: "6) Události",
      desc: "Přidejte na #btn click, který zvýší číslo ve #cnt o 1.",
      js: [
        "// Úkol: najděte #btn a #cnt",
        "// TODO: přidejte click handler, který zvýší číslo v #cnt o 1",
      ].join("\n"),
      dom: [
        "<div class=\"flex items-center gap-2\">",
        "  <button id=\"btn\" class=\"px-2 py-1 rounded bg-sky-600 text-white text-xs\">Klik</button>",
        "  <span id=\"cnt\">0</span>",
        "</div>",
      ].join("\n"),
    },
    {
      title: "7) alert/confirm (wrapper)",
      desc: "Napište funkci notify(decision), která při true zavolá alert('OK') a při false alert('Cancelled'). Exportujte jako exports.notify.",
      js: [
        "// Úkol: napište funkci notify(decision)",
        "// - při true zavolejte alert('OK')",
        "// - při false zavolejte alert('Cancelled')",
        "// TODO: implementujte a zveřejněte přes exports.notify",
      ].join("\n"),
      dom: "<div class=\"text-xs text-zinc-500\">(Tento krok DOM nevyužívá)</div>",
    },
  ];
  const idx = Math.max(0, Math.min(stepIndex || 0, steps.length - 1));
  return { step: steps[idx], all: steps };
}

function runJsAndValidate({ code, consoleApi, domRef, stepIndex }) {
  const results = [];
  const exportsObj = {};
  // Spy on alerts for validation without disruptive popups
  const alertCalls = [];
  const originalAlert = typeof window !== 'undefined' ? window.alert : undefined;
  if (typeof window !== 'undefined') {
    window.alert = (msg) => { alertCalls.push(String(msg)); };
  }
  try {
    // Execute user code with captured console and provided exports
    const fn = new Function("exports", "console", code);
    fn(exportsObj, consoleApi);
    results.push({ ok: true, text: "Code executed" });
  } catch (e) {
    results.push({ ok: false, text: `Runtime error: ${e?.message || e}` });
    if (typeof window !== 'undefined') window.alert = originalAlert;
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
      const ok = typeof exportsObj.sumTo === "function" && exportsObj.sumTo(5) === 15;
      results.push({ ok: !!ok, text: "sumTo(5) === 15" });
    } else if (stepIndex === 3) {
      const ok = typeof exportsObj.total === "function" && exportsObj.total([1, 2, 3]) === 6;
      results.push({ ok: !!ok, text: "total([1,2,3]) === 6" });
    } else if (stepIndex === 4) {
      const el = domRef?.current?.querySelector?.('#app');
      const ok = el && String(el.textContent).includes('Hello JS');
      results.push({ ok: !!ok, text: "#app has text 'Hello JS'" });
    } else if (stepIndex === 5) {
      const btn = domRef?.current?.querySelector?.('#btn');
      const cnt = domRef?.current?.querySelector?.('#cnt');
      if (btn && cnt) {
        btn.dispatchEvent(new Event('click', { bubbles: true }));
        const after = Number(cnt.textContent || '0');
        results.push({ ok: after >= 1, text: "Click increments #cnt" });
      } else {
        results.push({ ok: false, text: "DOM elements #btn/#cnt not found" });
      }
    } else if (stepIndex === 6) {
      const fn = exportsObj.notify;
      if (typeof fn === 'function') {
        alertCalls.length = 0;
        fn(true);
        const okTrue = alertCalls.includes('OK');
        alertCalls.length = 0;
        fn(false);
        const okFalse = alertCalls.includes('Cancelled');
        results.push({ ok: !!okTrue, text: "notify(true) -> alert('OK')" });
        results.push({ ok: !!okFalse, text: "notify(false) -> alert('Cancelled')" });
      } else {
        results.push({ ok: false, text: "exports.notify není funkce" });
      }
    }
  } catch (e) {
    results.push({ ok: false, text: `Validation error: ${e?.message || e}` });
  }
  if (typeof window !== 'undefined') window.alert = originalAlert;
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
  { id: "title", title: "Základy JavaScriptu – interaktivní cvičení", subtitle: "ZWA-6 • JS: Proměnné, funkce, DOM" },
  { id: "quiz-css", title: "KVÍZ: CSS základy" },
  { id: "meme", title: "Meme" },
  { id: "toc", title: "Obsah", bullets: [
    "Přehled jazyka a prostředí",
    "Proměnné, typy a operátory",
    "Funkce, podmínky a cykly",
    "Pole a objekty",
    "Práce s DOM a události",
    "alert / confirm",
  ] },
  { id: "theory", title: "Teorie – JS základy", sections: [
    { icon: "🌍", title: "Přehled jazyka", body: "JavaScript je univerzální jazyk webu: běží v prohlížeči i na serveru (Node.js). Je dynamicky typovaný a díky event loopu zvládá asynchronní operace bez blokování UI. Dnes se píše hlavně jako ESM modulový kód a balí se pomocí nástrojů ekosystému npm. Jeho síla je ve velké flexibilitě a obrovském množství knihoven. Naší ambicí je naučit se čitelné základy, které obstojí i v praxi.", points: [
      "JavaScript běží v prohlížeči i na serveru (Node.js).",
      "Jednovláknový runtime, asynchronní I/O, event loop.",
      "Moduly (ESM) a ekosystém npm.",
      "Příklad: `import { readFile } from 'node:fs/promises'`",
    ]},
    { icon: "🔤", title: "Proměnné a typy", body: "Proměnné deklarujeme přes let a const; const chrání referenci, ne nutně obsah. V JavaScriptu existují primitivní typy i objekty, přičemž přetypování může probíhat automaticky. Proto preferujeme striktní rovnost `===`, která nepřetypovává. Když potřebujeme konverzi, udělejme ji explicitně, aby byl kód předvídatelný. Nebojte se používat `typeof` jako rychlou diagnostiku.", points: [
      "Deklarace: `let x = 1; const PI = 3.14`.",
      "Primitiva: string, number, boolean, null, undefined, symbol, bigint.",
      "Typové kontroly: `typeof 42 // 'number'`, `typeof null // 'object'` (historická zvláštnost).",
      "Rovnosti: `===` (striktní), `==` (s přetypy – nedoporučeno).",
      "Konverze: `Number('2') // 2`, `String(20) // '20'`.",
    ]},
    { icon: "🧮", title: "Funkce a cykly", body: "Funkce jsou první občané jazyka – můžeme je ukládat do proměnných i předávat jako argumenty. Arrow funkce zkracují zápis, ale pozor na `this`. Řízení toku probíhá přes podmínky a cykly; u polí často dává smysl map/filter/reduce kvůli čitelnosti. Cílem je psát krátké, pojmenované funkce s jasným účelem. Když cítíte, že funkce dělá moc věcí, rozdělte ji.", points: [
      "Deklarace: `function sum(a,b){ return a+b }`.",
      "Arrow: `const inc = n => n + 1`.",
      "Podmínky: `n % 2 ? 'odd' : 'even'`.",
      "Cykly: `for (let i=0;i<xs.length;i++) {...}`; `for (const x of xs) {...}`.",
      "Pole: `xs.map(x=>x*2).filter(x=>x>0).reduce((a,b)=>a+b,0)`.",
    ]},
    { icon: "📦", title: "Pole a objekty", body: "Pole reprezentují pořadí, objekty páry klíč–hodnota. Při práci se strukturami upřednostňujeme neměnnost: místo úprav na místě vytváříme nové kopie pomocí spreadu. Destrukturalizace výrazně zkracuje kód a dělá záměr čitelnějším. V praxi často kombinujeme oba typy dohromady a dáváme si pozor na mělké vs. hluboké kopie. Klíčem je srozumitelná datová struktura.", points: [
      "Objekty: `{ id: 1, name: 'Ada' }` – přístup `user.name`.",
      "Destrukturalizace: `const {name} = user; const [first] = list`.",
      "Spread/Rest: `{...a, role:'admin'}`, `function f(...args){}`.",
    ]},
    { icon: "🧩", title: "DOM a události", body: "V prohlížeči manipulujeme s DOMem – stromem elementů stránky. Nejprve vybereme uzel, poté změníme jeho obsah či třídy, a případně přidáme posluchače událostí. Důležité je měnit jen to, co vlastníme, abychom nerozbili jiné části aplikace. Reagujeme na akce uživatele (klik, input) a stav synchronizujeme do UI. Malé, dobře pojmenované selektory a handlery usnadní údržbu.", points: [
      "Výběr: `document.querySelector('#app')`.",
      "Událost: `btn.addEventListener('click', handler)`.",
      "Manipulace: `el.textContent = 'Hello'`.",
    ]},
    { icon: "🔔", title: "alert/confirm", body: "`alert` a `confirm` jsou jednoduché vestavěné dialogy. Jsou blokující, takže je používejte střídmě – přerušují tok práce i testy. V produkčním UI většinou nahradíte vlastní komponentou notifikací nebo modálu. Kvůli testovatelnosti je vhodné volání zabalit do funkce, kterou lze při testech nahradit. Studenti se zde naučí pracovat i s vedlejšími efekty.", points: [
      "`alert('Saved')` zobrazí dialog (blokující).",
      "`const ok = confirm('Proceed?')` vrací boolean.",
      "Doporučení: obalte do funkce kvůli testům a DI.",
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
      {slide.id === "quiz-css" && (
        <div className="mt-2">
          <QuizCssBasics />
        </div>
      )}
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
      {slide.id === "meme" && (
        <div className="mt-3 rounded-xl overflow-hidden border border-zinc-200/60 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40">
          <img src={memeImg.src} alt="Meme" className="w-full max-h-[420px] object-contain bg-white dark:bg-zinc-900" />
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
        {cur.body && (
          <p className="leading-relaxed text-sm text-zinc-700 dark:text-zinc-300 mb-2">{cur.body}</p>
        )}
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
    { id: 'q1', text: 'Který selektor cílí na element s id="title"?', options: ['.title', '#title', 'title'], correctIndex: 1, hint: 'id selektor' },
    { id: 'q2', text: 'Co je vyšší specifita?', options: ['.nav a', '#nav a', 'a.nav'], correctIndex: 1, hint: 'id > třída > element' },
    { id: 'q3', text: 'Jak nastavíte font na Georgia a fallback serif?', options: ['font: Georgia;', 'font-family: Georgia, serif;', 'font-style: Georgia, serif;'], correctIndex: 1, hint: 'font-family' },
    { id: 'q4', text: 'Jak stylovat navštívený odkaz?', options: ['a:hover', 'a:visited', 'a:active'], correctIndex: 1, hint: ':visited' },
    { id: 'q5', text: 'Jak vyberete první písmeno odstavce .excerpt?', options: ['p.excerpt:first-letter', 'p.excerpt::first-letter', 'p:first-letter.excerpt'], correctIndex: 1, hint: '::first-letter' },
    { id: 'q6', text: 'Která vlastnost nastaví číslování na lower-alpha?', options: ['list-style', 'list-style-type', 'counter-style'], correctIndex: 1, hint: 'list-style-type' },
  ];
  const total = questions.length;
  const score = questions.reduce((acc, q) => acc + (answers[q.id] === q.correctIndex ? 1 : 0), 0);
  function selectAnswer(qid, idx) { if (!submitted) setAnswers((a) => ({ ...a, [qid]: idx })); }
  function submit() { setSubmitted(true); }
  function reset() { setAnswers({}); setSubmitted(false); }
  return (
    <div className="mt-4 space-y-4">
      {questions.map((q, qi) => {
        const selected = answers[q.id];
        const isCorrect = selected === q.correctIndex;
        return (
          <div key={q.id} className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 p-4">
            <div className="font-medium mb-2">{qi + 1}. {q.text}</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {q.options.map((opt, idx) => {
                const active = selected === idx;
                const correct = submitted && idx === q.correctIndex;
                const wrong = submitted && active && !correct;
                return (
                  <button
                    key={idx}
                    className={clsx(
                      "text-left px-3 py-2 rounded-lg border text-sm",
                      active ? "border-sky-500 bg-sky-50 dark:bg-sky-950/30" : "border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60",
                      correct ? "ring-2 ring-emerald-400" : "",
                      wrong ? "ring-2 ring-rose-400" : ""
                    )}
                    onClick={() => selectAnswer(q.id, idx)}
                  >
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
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">ZWA-6: Interactive JavaScript Presentation</h1>
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



