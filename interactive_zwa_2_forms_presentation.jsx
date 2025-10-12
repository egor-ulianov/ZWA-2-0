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

function SectionCard({ title, children, footer }) {
  return (
    <div className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 p-5">
      <div className="text-lg font-semibold mb-2">{title}</div>
      <div className="text-sm text-zinc-700 dark:text-zinc-300">{children}</div>
      {footer}
    </div>
  );
}

function FieldRow({ label, children }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[180px,1fr] gap-2 items-center">
      <div className="text-xs sm:text-sm text-zinc-500">{label}</div>
      <div>{children}</div>
    </div>
  );
}

function FormInspector({ values }) {
  return (
    <div className="rounded-xl border border-zinc-200/60 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 p-3 text-xs">
      <div className="font-semibold mb-1">Form values</div>
      <pre className="whitespace-pre-wrap">{JSON.stringify(values, null, 2)}</pre>
    </div>
  );
}

function FormsPlayground() {
  const [values, setValues] = useState({
    text: "",
    textarea: "",
    select: "",
    selectMulti: [],
    file: null,
    color: "#22c55e",
    email: "",
    range: 50,
    number: 10,
    tel: "",
    url: "https://",
    search: "",
    date: "",
    time: "",
    month: "",
    datetime: "",
    datalistValue: "",
  });

  const [flags, setFlags] = useState({
    readOnly: false,
    disabled: false,
    autocomplete: "on",
    autofocus: "",
    requiredOn: false,
    patternTel: "^\\+?[0-9\\s-]{7,}$",
  });

  function onChange(name, val) {
    setValues((v) => ({ ...v, [name]: val }));
  }

  function onSubmitLocal(e) {
    e.preventDefault();
    alert("Submitted locally. See inspector for values.");
  }

  const common = useMemo(() => ({
    readOnly: flags.readOnly,
    disabled: flags.disabled,
    required: flags.requiredOn,
    autoComplete: flags.autocomplete,
  }), [flags]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1.2fr,0.8fr] gap-6">
      <div className="space-y-4">
        <form className="space-y-3" onSubmit={onSubmitLocal}>
          <fieldset className="rounded-xl border border-zinc-200/60 dark:border-zinc-800 p-3">
            <legend className="px-2 text-xs text-zinc-500">Standard elements</legend>
            <div className="space-y-2">
              <FieldRow label={<label htmlFor="text">label + input[type=text]</label>}>
                <input id="text" type="text" className="w-full rounded border p-2 bg-white dark:bg-zinc-900" {...common}
                  autoFocus={flags.autofocus === "text"}
                  value={values.text}
                  onChange={(e) => onChange("text", e.target.value)} />
              </FieldRow>
              <FieldRow label={<label htmlFor="textarea">textarea</label>}>
                <textarea id="textarea" className="w-full min-h-[80px] rounded border p-2 bg-white dark:bg-zinc-900" {...common}
                  autoFocus={flags.autofocus === "textarea"}
                  value={values.textarea}
                  onChange={(e) => onChange("textarea", e.target.value)} />
              </FieldRow>
              <FieldRow label={<label htmlFor="select">select</label>}>
                <select id="select" className="w-full rounded border p-2 bg-white dark:bg-zinc-900" {...common}
                  autoFocus={flags.autofocus === "select"}
                  value={values.select}
                  onChange={(e) => onChange("select", e.target.value)}>
                  <option value="">-- vyberte --</option>
                  <option value="a">Možnost A</option>
                  <option value="b">Možnost B</option>
                </select>
              </FieldRow>
              <FieldRow label={<label htmlFor="selectMulti">select[multiple]</label>}>
                <select id="selectMulti" multiple className="w-full rounded border p-2 bg-white dark:bg-zinc-900" {...common}
                  autoFocus={flags.autofocus === "selectMulti"}
                  value={values.selectMulti}
                  onChange={(e) => onChange("selectMulti", Array.from(e.target.selectedOptions).map(o => o.value))}>
                  <option value="x">X</option>
                  <option value="y">Y</option>
                  <option value="z">Z</option>
                </select>
              </FieldRow>
              <FieldRow label={<label htmlFor="file">input[type=file] (accept)</label>}>
                <input id="file" type="file" accept="image/*" className="block" disabled={flags.disabled} onChange={(e) => onChange("file", e.target.files?.[0] || null)} />
              </FieldRow>
              <div className="pt-2">
                <button className="px-3 py-1.5 rounded bg-emerald-600 text-white">Submit (local)</button>
              </div>
            </div>
          </fieldset>

          <fieldset className="rounded-xl border border-zinc-200/60 dark:border-zinc-800 p-3">
            <legend className="px-2 text-xs text-zinc-500">HTML5 inputs</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FieldRow label="color">
                <input type="color" {...common} value={values.color} onChange={(e) => onChange("color", e.target.value)} />
              </FieldRow>
              <FieldRow label="email">
                <input type="email" className="w-full rounded border p-2 bg-white dark:bg-zinc-900" {...common}
                  autoFocus={flags.autofocus === "email"}
                  value={values.email} onChange={(e) => onChange("email", e.target.value)} />
              </FieldRow>
              <FieldRow label="range (min,max,step)">
                <input type="range" min="0" max="100" step="1" value={values.range} disabled={flags.disabled} onChange={(e) => onChange("range", Number(e.target.value))} />
              </FieldRow>
              <FieldRow label="number">
                <input type="number" className="w-full rounded border p-2 bg-white dark:bg-zinc-900" {...common}
                  value={values.number} onChange={(e) => onChange("number", Number(e.target.value))} />
              </FieldRow>
              <FieldRow label="tel (pattern)">
                <input type="tel" className="w-full rounded border p-2 bg-white dark:bg-zinc-900" {...common}
                  pattern={flags.patternTel}
                  placeholder="+420 123 456 789"
                  value={values.tel} onChange={(e) => onChange("tel", e.target.value)} />
              </FieldRow>
              <FieldRow label="url">
                <input type="url" className="w-full rounded border p-2 bg-white dark:bg-zinc-900" {...common}
                  value={values.url} onChange={(e) => onChange("url", e.target.value)} />
              </FieldRow>
              <FieldRow label="search">
                <input type="search" className="w-full rounded border p-2 bg-white dark:bg-zinc-900" {...common}
                  value={values.search} onChange={(e) => onChange("search", e.target.value)} />
              </FieldRow>
              <FieldRow label="date">
                <input type="date" className="w-full rounded border p-2 bg-white dark:bg-zinc-900" {...common}
                  value={values.date} onChange={(e) => onChange("date", e.target.value)} />
              </FieldRow>
              <FieldRow label="time">
                <input type="time" className="w-full rounded border p-2 bg-white dark:bg-zinc-900" {...common}
                  value={values.time} onChange={(e) => onChange("time", e.target.value)} />
              </FieldRow>
              <FieldRow label="month">
                <input type="month" className="w-full rounded border p-2 bg-white dark:bg-zinc-900" {...common}
                  value={values.month} onChange={(e) => onChange("month", e.target.value)} />
              </FieldRow>
              <FieldRow label="datetime-local">
                <input type="datetime-local" className="w-full rounded border p-2 bg-white dark:bg-zinc-900" {...common}
                  value={values.datetime} onChange={(e) => onChange("datetime", e.target.value)} />
              </FieldRow>
              <FieldRow label={<span>datalist (<Code>list</Code>)</span>}>
                <>
                  <input list="demo-cities" className="w-full rounded border p-2 bg-white dark:bg-zinc-900" {...common}
                    value={values.datalistValue} onChange={(e) => onChange("datalistValue", e.target.value)} />
                  <datalist id="demo-cities">
                    <option value="Praha" />
                    <option value="Brno" />
                    <option value="Ostrava" />
                  </datalist>
                </>
              </FieldRow>
            </div>
          </fieldset>

          <fieldset className="rounded-xl border border-zinc-200/60 dark:border-zinc-800 p-3">
            <legend className="px-2 text-xs text-zinc-500">HTML5 elements: meter, progress</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
              <div className="space-y-2">
                <div className="text-xs text-zinc-500">meter</div>
                <meter min={0} max={100} low={30} high={80} optimum={60} value={values.range} className="w-full"></meter>
                <div className="text-xs">value: {values.range}</div>
              </div>
              <div className="space-y-2">
                <div className="text-xs text-zinc-500">progress</div>
                <progress max={100} value={values.range} className="w-full"></progress>
              </div>
            </div>
          </fieldset>
        </form>

        <details className="rounded-xl border border-zinc-200/60 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 p-3">
          <summary className="cursor-pointer font-medium">Odeslat na server (nové okno)</summary>
          <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">Akce ukáže, jaká data došla na server (může vyžadovat povolení vyskakovacích oken).</div>
          <form action="https://zwa.toad.cz/~xklima/vypisform.php" method="post" target="_blank" className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input name="name" placeholder="Jméno" className="rounded border p-2" />
            <input name="email" type="email" placeholder="E-mail" className="rounded border p-2" />
            <input name="favcolor" type="color" />
            <input name="when" type="datetime-local" className="rounded border p-2" />
            <input name="cv" type="file" />
            <button className="px-3 py-1.5 rounded bg-emerald-600 text-white">Odeslat</button>
          </form>
        </details>

        <details className="rounded-xl border border-zinc-200/60 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 p-3">
          <summary className="cursor-pointer font-medium">Validovat HTML formulář online</summary>
          <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">Zadejte HTML vašeho formuláře, spustíme lokální kontroly a volitelně i online validaci.</div>
          <FormValidationEditor />
        </details>
      </div>

      <div className="space-y-3">
        <SectionCard title="Nastavení formuláře">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={flags.readOnly} onChange={(e) => setFlags((f) => ({ ...f, readOnly: e.target.checked }))} />
              <span>readonly</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={flags.disabled} onChange={(e) => setFlags((f) => ({ ...f, disabled: e.target.checked }))} />
              <span>disabled</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={flags.requiredOn} onChange={(e) => setFlags((f) => ({ ...f, requiredOn: e.target.checked }))} />
              <span>required</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">autocomplete</span>
              <select className="rounded border p-1.5 bg-white dark:bg-zinc-900" value={flags.autocomplete} onChange={(e) => setFlags((f) => ({ ...f, autocomplete: e.target.value }))}>
                <option value="on">on</option>
                <option value="off">off</option>
              </select>
            </div>
            <div className="flex items-center gap-2 col-span-2">
              <span className="text-zinc-500">autofocus</span>
              <select className="rounded border p-1.5 bg-white dark:bg-zinc-900" value={flags.autofocus} onChange={(e) => setFlags((f) => ({ ...f, autofocus: e.target.value }))}>
                <option value="">(none)</option>
                <option value="text">text</option>
                <option value="textarea">textarea</option>
                <option value="select">select</option>
                <option value="selectMulti">select[multiple]</option>
                <option value="email">email</option>
              </select>
            </div>
            <div className="flex items-center gap-2 col-span-2">
              <span className="text-zinc-500">tel pattern</span>
              <input className="flex-1 rounded border p-1.5 bg-white dark:bg-zinc-900" value={flags.patternTel} onChange={(e) => setFlags((f) => ({ ...f, patternTel: e.target.value }))} />
            </div>
          </div>
        </SectionCard>
        <FormInspector values={values} />
        <div className="text-xs text-zinc-500">
          Zdroje: {" "}
          <a className="underline" href="https://cw.fel.cvut.cz/wiki/courses/b6b39zwa/tutorials/02/start" target="_blank" rel="noreferrer noopener">Cvičení 2 – Formuláře</a>, {" "}
          <a className="underline" href="https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input" target="_blank" rel="noreferrer noopener">MDN: input</a>, {" "}
          <a className="underline" href="https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meter" target="_blank" rel="noreferrer noopener">MDN: meter</a>
        </div>
      </div>
    </div>
  );
}

function FormValidationEditor({ initialHtml, localCheck, showPreview = false }) {
  const [html, setHtml] = useState(() => initialHtml || [
    "<!doctype html>",
    "<html>",
    "  <head>",
    "    <meta charset=\"utf-8\">",
    "    <title>Form Demo</title>",
    "  </head>",
    "  <body>",
    "    <form>",
    "      <label for=\"email\">E-mail</label>",
    "      <input id=\"email\" type=\"email\" required>",
    "      <button>Odeslat</button>",
    "    </form>",
    "  </body>",
    "</html>",
  ].join("\n"));
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState(null);

  function defaultLocalChecks(text) {
    const issues = [];
    const must = (re, msg) => { if (!re.test(text)) issues.push(msg); };
    must(/<!doctype\s+html>/i, "Chybí <!doctype html>");
    must(/<form[^>]*>/i, "Chybí <form>");
    if (!/type=\"email\"/i.test(text)) {
      issues.push("Zvažte použít input[type=email] pro e‑mail");
    }
    if (/type=\"tel\"/i.test(text) && !/pattern=/i.test(text)) {
      issues.push("Pro telefon zvažte atribut pattern");
    }
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

  const lc = (localCheck || defaultLocalChecks)(html);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <div className="flex flex-col">
        <textarea value={html} onChange={(e) => setHtml(e.target.value)} className="min-h-[280px] w-full rounded border p-2 font-mono text-sm bg-white dark:bg-zinc-900" />
        <div className="mt-2 text-xs">
          <div className={lc.passed ? "text-emerald-600" : "text-amber-600"}>
            {lc.passed ? "Lokální kontroly: vše v pořádku." : `Nalezeno ${lc.issues.length} připomínek:`}
          </div>
          {!lc.passed && (
            <ul className="list-disc pl-5 mt-1 space-y-0.5">
              {lc.issues.map((m, i) => <li key={i}>{m}</li>)}
            </ul>
          )}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <button className="px-3 py-1.5 rounded bg-fuchsia-600 text-white disabled:opacity-50" onClick={validateOnline} disabled={checking}>
            {checking ? "Validuji…" : "Validovat online (W3C)"}
          </button>
          <a className="px-3 py-1.5 rounded border" href="https://validator.w3.org/nu/" target="_blank" rel="noreferrer noopener">Otevřít W3C Validator</a>
        </div>
      </div>
      <div className="flex flex-col">
        {!showPreview && (<div className="text-xs text-zinc-500 mb-1">Pozn.: Náhled se nezobrazuje – editor je zaměřen na strukturu a validitu.</div>)}
        {showPreview ? (<div dangerouslySetInnerHTML={{ __html: html }} className="rounded border p-2 bg-white/70 dark:bg-zinc-900/60 text-xs" />) : (<pre className="rounded border p-2 bg-white/70 dark:bg-zinc-900/60 text-xs whitespace-pre-wrap">{html}</pre>)}
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
    </div>
  );
}

function FormsSections() {
  const tplStandard = ['<!doctype html>','<html>','  <head>','    <meta charset="utf-8">','    <title>Standard Inputs</title>','  </head>','  <body>','    <!-- Úkol: vytvořte form s label+for, input[type=text], textarea, select, button -->','  </body>','</html>'].join('\n');
  const exStandard = ['<!doctype html>','<html>','  <head>','    <meta charset="utf-8">','    <title>Standard Inputs (Example)</title>','  </head>','  <body>','    <form>','      <label for="name">Jméno</label>','      <input id="name" name="name" type="text" required>',
  '      <label for="msg">Zpráva</label>','      <textarea id="msg" name="msg"></textarea>',
  '      <label for="sel">Volba</label>','      <select id="sel" name="sel">','        <option value="A">A</option>','        <option value="B">B</option>','      </select>',
  '      <button type="submit">Odeslat</button>','    </form>','  </body>','</html>'].join('\n');
  const checkStandard = (html) => { const issues=[]; const must=(re,msg)=>{if(!re.test(html))issues.push(msg)}; must(/<label[^>]+for=/i,'Alespoň jeden <label for=...>'); must(/<input[^>]+type=\"text\"/i,'Alespoň jeden input[type=text]'); must(/<textarea/i,'Přidejte <textarea>'); must(/<select/i,'Přidejte <select>'); return {issues, passed: issues.length===0}; };

  const tplGrouping = ['<!doctype html>','<html>','  <head>','    <meta charset="utf-8">','    <title>Grouping</title>','  </head>','  <body>','    <!-- Úkol: vytvořte form a seskupte prvky do fieldset + legend, alespoň 1 label+input -->','  </body>','</html>'].join('\n');
  const exGrouping = ['<!doctype html>','<html>','  <head>','    <meta charset="utf-8">','    <title>Grouping (Example)</title>','  </head>','  <body>','    <form>','      <fieldset>','        <legend>Kontaktní údaje</legend>','        <label for="email">E-mail</label>','        <input id="email" name="email" type="email" required>','      </fieldset>','      <button type="submit">Odeslat</button>','    </form>','  </body>','</html>'].join('\n');
  const checkGrouping = (html) => { const issues=[]; const must=(re,msg)=>{if(!re.test(html))issues.push(msg)}; must(/<fieldset/i,'Použijte <fieldset>'); must(/<legend/i,'Použijte <legend>'); must(/<label[^>]+for=/i,'Spárujte label s inputem'); return {issues, passed: issues.length===0}; };

  const tplAttributes = ['<!doctype html>','<html>','  <head><meta charset="utf-8"><title>Attributes</title></head>','  <body>','    <!-- Úkol: přidejte form s inputy, použijte readonly, required, autocomplete(on/off), autofocus a disabled button -->','  </body>','</html>'].join('\n');
  const exAttributes = ['<!doctype html>','<html>','  <head><meta charset="utf-8"><title>Attributes (Example)</title></head>','  <body>','    <form autocomplete="on">','      <input type="text" name="immutable" value="jen pro čtení" readonly>',
  '      <input type="text" name="fullname" placeholder="Jméno a příjmení" required autofocus>',
  '      <button type="button" disabled>Nelze odeslat</button>','      <button type="submit">Odeslat</button>','    </form>','  </body>','</html>'].join('\n');
  const checkAttributes = (html) => { const issues=[]; if(!/readonly/i.test(html)) issues.push('Přidejte readonly'); if(!/required/i.test(html)) issues.push('Přidejte required'); if(!/autocomplete=\"(on|off)\"/i.test(html)) issues.push('Nastavte autocomplete'); return {issues, passed: issues.length===0}; };

  const tplInputs = ['<!doctype html>','<html><head><meta charset="utf-8"><title>HTML5 inputs</title></head><body>','  <!-- Úkol: vytvořte form s email, url, tel(+pattern), date, color, range(min/max/step) -->','</body></html>'].join('\n');
  const exInputs = ['<!doctype html>','<html><head><meta charset="utf-8"><title>HTML5 inputs (Example)</title></head><body>','  <form>','    <input type="email" name="email" required>',
  '    <input type="url" name="web">','    <input type="tel" name="phone" pattern="^\\+?[0-9\\s-]{7,}$">','    <input type="date" name="date">','    <input type="color" name="color">','    <input type="range" name="level" min="0" max="100" step="1" value="50">','    <button type="submit">Odeslat</button>','  </form>','</body></html>'].join('\n');
  const checkInputs = (html) => { const issues=[]; ['email','url','tel','date','color','range'].forEach(t=>{ if(!new RegExp(`type=\\\"${t}\\\"`,'i').test(html)) issues.push(`Chybí input[type=${t}]`); }); if(/type=\"tel\"/i.test(html) && !/pattern=/i.test(html)) issues.push('Pro telefon nastavte pattern'); return {issues, passed: issues.length===0}; };

  const tplMeter = ['<!doctype html>','<html><head><meta charset="utf-8"><title>Meter/Progress</title></head><body>','  <!-- Úkol: přidejte meter(min,max,low,high,optimum,value) a progress(max,value) -->','</body></html>'].join('\n');
  const exMeter = ['<!doctype html>','<html><head><meta charset="utf-8"><title>Meter/Progress (Example)</title></head><body>','  <meter min="0" max="100" low="30" high="80" optimum="60" value="42"></meter>','  <progress max="100" value="42"></progress>','</body></html>'].join('\n');
  const checkMeter = (html) => { const issues=[]; if(!/<meter/i.test(html)) issues.push('Přidejte <meter>'); if(!/<progress/i.test(html)) issues.push('Přidejte <progress>'); return {issues, passed: issues.length===0}; };

  const tplDatalist = ['<!doctype html>','<html><head><meta charset="utf-8"><title>Datalist</title></head><body>','  <!-- Úkol: input s atributem list a datalist s minimálně 2 options -->','</body></html>'].join('\n');
  const exDatalist = ['<!doctype html>','<html><head><meta charset="utf-8"><title>Datalist (Example)</title></head><body>','  <input list="cities" name="city">','  <datalist id="cities">','    <option value="Praha"/>','    <option value="Brno"/>','    <option value="Ostrava"/>','  </datalist>','</body></html>'].join('\n');
  const checkDatalist = (html) => { const issues=[]; if(!/list=\"[\w-]+\"/i.test(html)) issues.push('Input musí mít list=...'); if(!/<datalist/i.test(html)) issues.push('Chybí <datalist>'); return {issues, passed: issues.length===0}; };

  function TryStandard() { const [name,setName]=useState(''); const [msg,setMsg]=useState(''); const [sel,setSel]=useState('A'); return (<form className="space-y-2"><div className="grid grid-cols-1 sm:grid-cols-[120px,1fr] gap-2 items-center"><label htmlFor="name">Jméno</label><input id="name" className="rounded border p-2 bg-white dark:bg-zinc-900" value={name} onChange={(e)=>setName(e.target.value)} /><label htmlFor="msg">Zpráva</label><textarea id="msg" className="rounded border p-2 bg-white dark:bg-zinc-900" value={msg} onChange={(e)=>setMsg(e.target.value)} /><label htmlFor="sel">Volba</label><select id="sel" className="rounded border p-2 bg-white dark:bg-zinc-900" value={sel} onChange={(e)=>setSel(e.target.value)}><option>A</option><option>B</option></select></div></form>); }
  function TryGrouping() { return (<form className="space-y-2"><fieldset className="rounded border p-3"><legend>Kontaktní údaje</legend><label htmlFor="email2">E-mail</label><input id="email2" type="email" className="rounded border p-2 bg-white dark:bg-zinc-900" required /></fieldset></form>); }
  function TryAttributes() { return (<form className="grid grid-cols-1 md:grid-cols-2 gap-2"><input type="text" className="rounded border p-2 bg-white dark:bg-zinc-900" placeholder="placeholder" required /><input type="text" className="rounded border p-2 bg-white dark:bg-zinc-900" value="readonly" readOnly /><button className="rounded bg-zinc-200 p-2" disabled>Disabled</button></form>); }
  function TryInputs() { const [range,setRange]=useState(50); return (<form className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center"><input type="email" className="rounded border p-2 bg-white dark:bg-zinc-900" placeholder="email" /><input type="url" className="rounded border p-2 bg-white dark:bg-zinc-900" placeholder="https://" /><input type="tel" className="rounded border p-2 bg-white dark:bg-zinc-900" pattern="^\+?[0-9\s-]{7,}$" placeholder="+420 123 456 789" /><input type="date" className="rounded border p-2 bg-white dark:bg-zinc-900" /><input type="color" /><div className="flex items-center gap-2"><input type="range" min="0" max="100" value={range} onChange={(e)=>setRange(Number(e.target.value))} /><span className="text-xs">{range}</span></div></form>); }
  function TryMeter() { const [val,setVal]=useState(50); return (<div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center"><div className="flex items-center gap-2"><input type="range" min="0" max="100" value={val} onChange={(e)=>setVal(Number(e.target.value))} /><span className="text-xs">{val}</span></div><div className="space-y-2"><meter min="0" max="100" low="30" high="80" optimum="60" value={val} className="w-full"></meter><progress max="100" value={val} className="w-full"></progress></div></div>); }
  function TryDatalist() { return (<div><input list="cities-try" className="rounded border p-2 bg-white dark:bg-zinc-900" placeholder="Město" /><datalist id="cities-try"><option value="Praha"/><option value="Brno"/><option value="Ostrava"/></datalist></div>); }

  function Block({ id, title, theory, example, Try, validate }) {
    const [subTab, setSubTab] = useState('theory');
    const subTabs = [
      { id: 'theory', label: 'Teorie' },
      { id: 'examples', label: 'Příklady' },
      { id: 'try', label: 'Vyzkoušet' },
      { id: 'task', label: 'Úkol' },
    ];
    return (
      <div id={id}>
      <SectionCard title={title} footer={null}>
        <div className="mb-2 flex flex-wrap gap-2">
          {subTabs.map(st => (
            <button key={st.id} onClick={() => setSubTab(st.id)}
              className={clsx("px-2 py-1 rounded border text-xs",
                subTab === st.id ? "bg-sky-600 text-white border-sky-600" : "bg-white/70 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800")}>{st.label}</button>
          ))}
        </div>
        {subTab === 'theory' && (
          <div className="text-sm text-zinc-700 dark:text-zinc-300">{theory}</div>
        )}
        {subTab === 'examples' && (
          <pre className="text-xs bg-zinc-100/80 dark:bg-zinc-800/80 rounded p-2 whitespace-pre-wrap">{example}</pre>
        )}
        {subTab === 'try' && (
          <Try />
        )}
        {subTab === 'task' && (
          <FormValidationEditor initialHtml={validate.initial} localCheck={validate.check} showPreview={false} />
        )}
      </SectionCard>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Block id="standard" title="Standardní prvky" theory={(
        <>
          <p>
            HTML formulář tvoří kontejner <Code>form</Code>, ve kterém se nacházejí ovládací prvky
            jako <Code>input</Code>, <Code>textarea</Code>, <Code>select</Code> a akční prvky jako
            <Code>button</Code>. Při odeslání prohlížeč vytvoří dvojice <em>name=value</em> pro každý
            vyplněný, nepodmínečně povolený prvek a odešle je na server (metodou GET nebo POST).
          </p>
          <p className="mt-2">
            Klíčová je vazba <Code>label</Code> → <Code>input</Code> pomocí atributů
            <Code>for</Code> (na <Code>label</Code>) a <Code>id</Code> (na cílovém prvku). Zvyšuje to
            přístupnost (screen readery oznámí správný popisek) a použitelnost (klik na popisek
            zaostří pole). Většina prvků by měla mít i atribut <Code>name</Code>, jinak se jejich
            hodnota při odeslání nepřenese.
          </p>
          <p className="mt-2">
            <Code>textarea</Code> používejte pro víceřádkový text, <Code>select</Code> pro výběr z
            omezené sady. Vždy uvažte, zda je lepší výběr (select/radio) nebo volný text; výběr
            snižuje chybovost a usnadňuje validaci na serveru.
          </p>
        </>
      )} example={exStandard} Try={TryStandard} validate={{ initial: tplStandard, check: checkStandard }} />

      <Block id="grouping" title="Seskupení (fieldset/legend)" theory={(
        <>
          <p>
            <Code>fieldset</Code> umožňuje logicky seskupit související ovládací prvky (např. kontaktní
            údaje) a <Code>legend</Code> poskytuje textový titulek pro celou skupinu. Tato sémantika
            významně pomáhá přístupnosti: čtečky obrazovky oznámí název skupiny před čtením jejích
            polí a uživatel se tak lépe orientuje.
          </p>
          <p className="mt-2">
            Můžete mít více skupin ve formuláři; myslete na to, aby každá skupina měla jasný účel a
            aby prvky ve skupině sdílely společný kontext (např. doručovací adresa vs. fakturační
            adresa). Vyhnete se tak zmatku i duplicitám.
          </p>
        </>
      )} example={exGrouping} Try={TryGrouping} validate={{ initial: tplGrouping, check: checkGrouping }} />

      <Block id="attributes" title="Atributy (readonly, disabled, autocomplete, autofocus, required)" theory={(
        <>
          <p>
            <Code>readonly</Code> brání úpravě hodnoty, ale pole je stále odesíláno. Naproti tomu
            <Code>disabled</Code> pole vyřadí z tab pořadí a NEODESÍLÁ se – to je důležité pro logiku na
            serveru. Používejte jej například pro dočasně neaktivní volby.
          </p>
          <p className="mt-2">
            <Code>required</Code> vynucuje vyplnění, prohlížeč blokuje odeslání a zobrazí nápovědu.
            <Code>autocomplete</Code> (<Code>on</Code>/<Code>off</Code>) řídí návrhy prohlížeče a může
            urychlit vyplňování. <Code>autofocus</Code> zajistí zaostření po načtení – mělo by se
            používat střídmě a ideálně jen jednou na stránce.
          </p>
        </>
      )} example={exAttributes} Try={TryAttributes} validate={{ initial: tplAttributes, check: checkAttributes }} />

      <Block id="inputs" title="HTML5 typy inputů" theory={(
        <>
          <p>
            HTML5 přineslo specializované typy jako <Code>email</Code>, <Code>url</Code>,
            <Code>tel</Code>, <Code>date</Code>, <Code>color</Code>, <Code>range</Code> apod. Prohlížeč
            pak poskytuje správnou klávesnici na mobilech, základní validaci a lepší UX bez
            JavaScriptu. Např. <Code>email</Code> kontroluje formát a <Code>range</Code> dovoluje
            nastavovat číselnou hodnotu posuvníkem.
          </p>
          <p className="mt-2">
            U číselných a rozsahových vstupů dodávejte <Code>min</Code>, <Code>max</Code>, případně
            <Code>step</Code>. Pro <Code>tel</Code> je vhodné doplnit <Code>pattern</Code> kvůli
            validaci formátu. Klientská validace je pouze první linie – server musí pravidla zopakovat
            nezávisle, jinak hrozí obcházení omezení.
          </p>
        </>
      )} example={exInputs} Try={TryInputs} validate={{ initial: tplInputs, check: checkInputs }} />

      <Block id="meter" title="Meter a Progress" theory={(
        <>
          <p>
            <Code>meter</Code> reprezentuje měření známé veličiny v definovaném rozsahu (např. využití
            baterie). Atributy <Code>low</Code>, <Code>high</Code> a <Code>optimum</Code> dávají
            prohlížeči kontext, kdy je hodnota v normě či mimo ni. Není vhodné pro průběh úlohy.
          </p>
          <p className="mt-2">
            <Code>progress</Code> zobrazuje stav plnění úkolu (0 až <Code>max</Code>). Pokud ještě
            neznáte délku, je možné použít bez hodnoty (<em>indeterminate</em>), ale myslete na
            přístupnost: tato animace by měla být doplněna textovým popisem.
          </p>
        </>
      )} example={exMeter} Try={TryMeter} validate={{ initial: tplMeter, check: checkMeter }} />

      <Block id="datalist" title="Datalist" theory={(
        <>
          <p>
            <Code>datalist</Code> poskytuje pole návrhů pro <Code>input</Code> s atributem
            <Code>list</Code>. Uživatel může napsat libovolnou hodnotu, ale dostane nápovědu. Není to
            totéž co <Code>select</Code> – neomezuje vstup pouze na nabídku.
          </p>
          <p className="mt-2">
            Propojení funguje přes shodné <Code>id</Code> u <Code>datalist</Code> a hodnotu v
            <Code>list</Code> na <Code>input</Code>. Dbejte na unikátnost <Code>id</Code> a
            smysluplné volby, jinak návrhy spíše matou. Na mobilech nemusí být UX vždy ideální –
            zvažte alternativy.
          </p>
        </>
      )} example={exDatalist} Try={TryDatalist} validate={{ initial: tplDatalist, check: checkDatalist }} />
    </div>
  );
}

export default function AppFormsLesson2() {
  const [active, setActive] = useState("overview");
  const tabs = [
    { id: "overview", label: "Přehled" },
    { id: "playground", label: "Sekce" },
    { id: "tasks", label: "Úkoly" },
  ];
  function gotoSection(sectionId) {
    setActive("playground");
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-zinc-50 to-sky-50 dark:from-zinc-950 dark:to-zinc-900 text-zinc-900 dark:text-zinc-50">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <header className="mb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold">ZWA-2: Client-side Forms (Lesson 2)</h1>
          <p className="text-xs md:text-sm text-zinc-500 mt-1">
            Interaktivní přehled formulářů dle {" "}
            <a className="underline" href="https://cw.fel.cvut.cz/wiki/courses/b6b39zwa/tutorials/02/start" target="_blank" rel="noreferrer noopener">kurzovního zadání</a>.
          </p>
        </header>

        <nav className="flex flex-wrap gap-2 mb-4">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={clsx(
                "px-3 py-1.5 rounded-full text-sm border",
                active === t.id ? "bg-sky-600 text-white border-sky-600" : "bg-white/70 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 hover:bg-white"
              )}
              onClick={() => setActive(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {active === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SectionCard title="Standardní prvky">
              <ul className="list-disc pl-6 text-sm">
                <li><Code>form</Code>, <Code>input</Code> (vč. <Code>file</Code>, <Code>accept</Code>), <Code>select</Code>, <Code>textarea</Code>, <Code>button</Code></li>
              </ul>
            </SectionCard>
            <SectionCard title="Seskupení">
              <ul className="list-disc pl-6 text-sm">
                <li><Code>label</Code> + <Code>for</Code></li>
                <li><Code>fieldset</Code> + <Code>legend</Code></li>
              </ul>
            </SectionCard>
            <SectionCard title="Atributy">
              <ul className="list-disc pl-6 text-sm">
                <li><Code>readonly</Code>, <Code>disabled</Code>, <Code>accesskey</Code></li>
                <li><Code>autocomplete</Code>, <Code>autofocus</Code></li>
              </ul>
            </SectionCard>
            <SectionCard title="HTML5 typy inputů">
              <ul className="list-disc pl-6 text-sm">
                <li><Code>time</Code>, <Code>date</Code>, <Code>datetime-local</Code>, <Code>month</Code></li>
                <li><Code>color</Code>, <Code>email</Code>, <Code>range</Code>, <Code>search</Code>, <Code>number</Code>, <Code>tel</Code>, <Code>url</Code></li>
              </ul>
            </SectionCard>
            <SectionCard title="HTML5 nové elementy">
              <ul className="list-disc pl-6 text-sm">
                <li><Code>meter</Code> (min, max, low, high, optimum)</li>
                <li><Code>progress</Code> (max)</li>
              </ul>
            </SectionCard>
            <SectionCard title="Nové atributy">
              <ul className="list-disc pl-6 text-sm">
                <li><Code>placeholder</Code>, <Code>required</Code>, <Code>pattern</Code></li>
                <li><Code>list</Code> + <Code>datalist</Code></li>
              </ul>
            </SectionCard>
          </div>
        )}

        {active === "playground" && (
          <FormsSections />
        )}

        {active === "tasks" && (
          <div className="space-y-3">
            <SectionCard title="Vyberte úkol">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'standard', label: 'Standardní prvky' },
                  { id: 'grouping', label: 'Seskupení' },
                  { id: 'attributes', label: 'Atributy' },
                  { id: 'inputs', label: 'HTML5 inputy' },
                  { id: 'meter', label: 'Meter/Progress' },
                  { id: 'datalist', label: 'Datalist' },
                ].map((l) => (
                  <button key={l.id} type="button" className="px-3 py-1.5 rounded-full border text-sm bg-white/70 dark:bg-zinc-900/60 hover:bg-white border-zinc-200 dark:border-zinc-800" onClick={() => gotoSection(l.id)}>{l.label}</button>
                ))}
              </div>
            </SectionCard>
          </div>
        )}

        <footer className="mt-8 text-sm text-zinc-500">© 2025 ZWA – Lesson 2 interactive forms</footer>
        <Analytics />
      </div>
    </div>
  );
}


