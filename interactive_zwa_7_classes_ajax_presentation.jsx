import React, { useEffect, useState, useRef, useMemo } from "react";
import { Analytics } from "@vercel/analytics/react";
import lenin1 from "./src/interactive-zwa-7/lenin1.png";
import lenin2 from "./src/interactive-zwa-7/lenin2.png";
import lenin3 from "./src/interactive-zwa-7/lenin3.png";

function clsx(...xs) {
  return xs.filter(Boolean).join(" ");
}

function Code({ children }) {
  return (
    <code className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[90%] font-mono">
      {children}
    </code>
  );
}

function QuizSection() {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const questions = [
    {
      id: 'q1',
      text: 'Jaký typový systém používá JavaScript?',
      options: [
        'Statické typování – typ se musí vždy definovat předem',
        'Dynamické typování – proměnná může změnit typ za běhu',
        'Žádné typování – v JS jsou jen stringy'
      ],
      correctIndex: 1
    },
    {
      id: 'q2',
      text: 'Co nejlépe odpovídá pojmu „duck-typing" v JavaScriptu?',
      options: [
        'Pokud něco vypadá jako typ a chová se jako typ, tak se k němu tak chováme',
        'Všechny proměnné musí mít typ duck',
        'Proměnné typu var se vždy mění na let'
      ],
      correctIndex: 0
    },
    {
      id: 'q3',
      text: 'Jaký je rozdíl mezi cykly for...in a for...of u pole?',
      options: [
        'for...in iteruje přes indexy, for...of přes hodnoty pole',
        'for...in se používá jen pro objekty, for...of jen pro čísla',
        'Žádný rozdíl, oba dělají to samé'
      ],
      correctIndex: 0
    },
    {
      id: 'q4',
      text: 'Co dělá metoda forEach u pole?',
      options: [
        'Seřadí prvky pole',
        'Projde všechny prvky pole a na každý zavolá předanou funkci',
        'Vrátí délku pole'
      ],
      correctIndex: 1
    },
    {
      id: 'q5',
      text: 'Jak se chová funkce confirm("I like ZWA classes")?',
      options: [
        'Vypíše text do konzole',
        'Zobrazí dialog s OK/Cancel a vrátí true/false podle volby uživatele',
        'Vždy vyvolá chybu'
      ],
      correctIndex: 1
    },
    {
      id: 'q6',
      text: 'Jaký je hlavní rozdíl mezi document.querySelector("#alert-input") a document.getElementById("alert-input")?',
      options: [
        'querySelector používá CSS selektory a může vrátit jakýkoli prvek, getElementById hledá přímo podle id',
        'getElementById umí hledat podle třídy',
        'querySelector vždy vrací pole'
      ],
      correctIndex: 0
    },
    {
      id: 'q7',
      text: 'Který zápis správně přidá listener na kliknutí tlačítka?',
      options: [
        'button.onClick = "alert(\'Ahoj\')"',
        'button.addEventListener("click", () => alert("Ahoj"));',
        'addEventListener(button, "click", alert("Ahoj"))'
      ],
      correctIndex: 1
    }
  ];

  const score = questions.reduce((acc, q) => acc + (answers[q.id] === q.correctIndex ? 1 : 0), 0);

  function selectAnswer(qid, idx) {
    if (!submitted) setAnswers((a) => ({ ...a, [qid]: idx }));
  }

  function submit() {
    setSubmitted(true);
  }

  function reset() {
    setAnswers({});
    setSubmitted(false);
  }

  let resultMessage = "";
  if (submitted) {
    if (score <= 2) {
      resultMessage = "Je čas se na to ještě podívat 🙂";
    } else if (score <= 4) {
      resultMessage = "Dobrá práce, ale ještě je co zlepšovat.";
    } else {
      resultMessage = "Skvělé, máte to v malíku! 🎉";
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-gradient-to-br from-amber-50/80 to-orange-50/80 dark:from-zinc-900/80 dark:to-zinc-800/80 p-6 shadow-lg">
      <h2 className="text-2xl font-bold mb-3">Kvíz z minulého cvičení</h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
        Zopakujte si základy z Cvičení 6 – Úvod do JavaScriptu
      </p>
      <div className="space-y-4">
        {questions.map((q, qi) => {
          const selected = answers[q.id];
          const isCorrect = selected === q.correctIndex;
          const showFeedback = submitted && selected !== undefined;
          return (
            <div
              key={q.id}
              className={clsx(
                "rounded-xl border p-4 bg-white/70 dark:bg-zinc-900/60",
                showFeedback
                  ? isCorrect
                    ? "border-emerald-400 dark:border-emerald-600"
                    : "border-rose-400 dark:border-rose-600"
                  : "border-zinc-200/60 dark:border-zinc-800"
              )}
            >
              <div className="font-medium mb-3">
                {qi + 1}. {q.text}
              </div>
              <div className="space-y-2">
                {q.options.map((opt, idx) => {
                  const active = selected === idx;
                  const correct = submitted && idx === q.correctIndex;
                  const wrong = submitted && active && !correct;
                  return (
                    <button
                      key={idx}
                      className={clsx(
                        "w-full text-left px-3 py-2 rounded-lg border text-sm transition-all",
                        active
                          ? "border-sky-500 bg-sky-50 dark:bg-sky-950/30"
                          : "border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 hover:bg-zinc-50 dark:hover:bg-zinc-800/60",
                        correct ? "ring-2 ring-emerald-400" : "",
                        wrong ? "ring-2 ring-rose-400" : ""
                      )}
                      onClick={() => selectAnswer(q.id, idx)}
                      disabled={submitted}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-6 flex items-center gap-4">
        {!submitted ? (
          <button
            className="px-6 py-2.5 rounded-lg bg-sky-600 text-white font-medium hover:bg-sky-700 transition-colors"
            onClick={submit}
          >
            Vyhodnotit kvíz
          </button>
        ) : (
          <>
            <div className="text-lg font-semibold">
              Skóre: {score} / {questions.length}
            </div>
            <div className="text-zinc-700 dark:text-zinc-300">{resultMessage}</div>
            <button
              className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              onClick={reset}
            >
              Zkusit znovu
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function InfoBox({ children, type = "info" }) {
  const bgColor = type === "info" ? "bg-sky-50/80 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800" : "bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800";
  return (
    <div className={clsx("rounded-xl border p-4 text-sm", bgColor)}>
      {children}
    </div>
  );
}

function ClickToRevealSolution({ children }) {
  const [clicks, setClicks] = useState([]);
  const [revealed, setRevealed] = useState(false);
  const REQUIRED_CLICKS = 20;
  const TIME_WINDOW = 5000; // 5 seconds

  const handleClick = () => {
    const now = Date.now();
    const recentClicks = [...clicks, now].filter(time => now - time < TIME_WINDOW);
    setClicks(recentClicks);
    
    if (recentClicks.length >= REQUIRED_CLICKS) {
      setRevealed(true);
    }
  };

  const progress = Math.min((clicks.length / REQUIRED_CLICKS) * 100, 100);
  const validClicks = clicks.filter(time => Date.now() - time < TIME_WINDOW).length;

  if (revealed) {
    return <div>{children}</div>;
  }

  return (
    <div className="rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 p-6 text-center">
      <div className="mb-4">
        <div className="text-4xl mb-2">🔒</div>
        <h4 className="font-semibold text-lg mb-2">Řešení je zamčené</h4>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
          Pro odhalení řešení klikněte {REQUIRED_CLICKS}× během {TIME_WINDOW / 1000} sekund
        </p>
        <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
          ⚡ Výzva: Musíte být velmi rychlí!
        </p>
      </div>

      <button
        onClick={handleClick}
        className="px-6 py-3 rounded-lg bg-sky-600 text-white font-medium hover:bg-sky-700 transition-all active:scale-95 mb-4"
      >
        Klikněte zde ({validClicks} / {REQUIRED_CLICKS})
      </button>

      <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-3 overflow-hidden">
        <div
          className="bg-gradient-to-r from-sky-500 to-emerald-500 h-full transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {validClicks > 0 && validClicks < REQUIRED_CLICKS && (
        <p className="text-xs text-zinc-500 mt-2">
          Ještě {REQUIRED_CLICKS - validClicks} kliknutí... ⏱️ RYCHLE!
        </p>
      )}
    </div>
  );
}

function SlideCard({ slide, password, setPassword, isBlacklisted }) {
  return (
    <div className="p-6 rounded-2xl shadow-lg bg-white/70 dark:bg-zinc-900/60 backdrop-blur border border-zinc-200/60 dark:border-zinc-800">
      <h2 className="text-3xl font-bold mb-3">{slide.title}</h2>
      {slide.subtitle && <p className="text-xl text-sky-600 dark:text-sky-400 mb-4">{slide.subtitle}</p>}
      
      {slide.id === "title" && (
        <div className="mt-6 text-zinc-600 dark:text-zinc-400">
          <div>Autor: Bc. Egor Ulianov</div>
          <div>Datum: 5. 11. 2025</div>
        </div>
      )}
      
      {slide.id === "quiz" && <QuizSection />}
      
      {slide.id === "intro" && <IntroSlide />}
      
      {slide.id === "oop-theory" && <OopTheorySlide />}
      
      {slide.id === "creating-objects" && <CreatingObjectsSlide />}
      
      {slide.id === "methods-private" && <MethodsPrivateSlide />}
      
      {slide.id === "ajax-theory" && <AjaxTheorySlide />}
      
      {slide.id === "ajax-practice" && <AjaxPracticeSlide />}
      
      {slide.id === "task1" && <Task1Slide />}
      
      {slide.id === "task2" && <Task2Slide password={password} setPassword={setPassword} isBlacklisted={isBlacklisted} />}
      
      {slide.id === "summary" && <SummarySlide />}
    </div>
  );
}

function IntroSlide() {
  return (
    <div>
      <h3 className="text-2xl font-bold mb-4">Jak JS zabil Lenina?</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <img src={lenin1.src} alt="Lenin meme 1" className="rounded-lg border border-zinc-200 dark:border-zinc-800" />
        <img src={lenin2.src} alt="Lenin meme 2" className="rounded-lg border border-zinc-200 dark:border-zinc-800" />
        <img src={lenin3.src} alt="Lenin meme 3" className="rounded-lg border border-zinc-200 dark:border-zinc-800" />
      </div>
      <ul className="list-disc pl-6 space-y-2 mb-6 text-lg">
        <li>JavaScript je vlastněn společností Oracle (kapitalisté)</li>
        <li>V JavaScriptu můžete definovat různé třídy</li>
        <li>V JavaScriptu můžete definovat soukromé vlastnosti</li>
      </ul>
      <div className="rounded-xl bg-sky-50/80 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 p-6">
        <h4 className="font-semibold text-lg mb-3">Cíle dnešního cvičení:</h4>
        <ul className="list-disc pl-6 space-y-2 text-lg">
          <li>Třídy (objekty, prototypy)</li>
          <li>AJAX</li>
        </ul>
      </div>
      <p className="mt-6 text-zinc-700 dark:text-zinc-300 leading-relaxed text-lg">
        <strong>Třídy</strong> nám pomáhají strukturovat data a logiku do přehledných celků.
        <strong> AJAX</strong> umožňuje načítat data ze serveru bez reloadu celé stránky,
        což je základ moderních webových aplikací.
      </p>
    </div>
  );
}

function OopTheorySlide() {
  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Základní OOP pojmy</h3>
      <div className="space-y-3 mb-6">
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/60 p-4">
          <h4 className="font-semibold mb-1">Zapouzdření (Encapsulation)</h4>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            Data a metody jsou pohromadě v jednom objektu. Skrýváme implementační detaily
            a vystavujeme jen potřebné rozhraní.
          </p>
        </div>
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/60 p-4">
          <h4 className="font-semibold mb-1">Dědičnost (Inheritance)</h4>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            Možnost přebírat vlastnosti a metody z nadřazené třídy.
            Redukuje duplicitu kódu a vytváří hierarchie tříd.
          </p>
        </div>
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/60 p-4">
          <h4 className="font-semibold mb-1">Polymorfismus</h4>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            Různé implementace stejného rozhraní. Objekty různých tříd mohou
            reagovat na stejné zprávy různým způsobem.
          </p>
        </div>
      </div>

      <h3 className="text-xl font-semibold mb-3">Class-based vs Prototype-based OOP</h3>
      <div className="overflow-x-auto mb-4">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-zinc-100 dark:bg-zinc-800">
              <th className="border border-zinc-300 dark:border-zinc-700 p-2 text-left">Vlastnost</th>
              <th className="border border-zinc-300 dark:border-zinc-700 p-2 text-left">Class-based</th>
              <th className="border border-zinc-300 dark:border-zinc-700 p-2 text-left">Prototype-based</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-zinc-300 dark:border-zinc-700 p-2">Vytváření objektů</td>
              <td className="border border-zinc-300 dark:border-zinc-700 p-2">Z tříd (blueprints)</td>
              <td className="border border-zinc-300 dark:border-zinc-700 p-2">Z prototypů</td>
            </tr>
            <tr className="bg-zinc-50 dark:bg-zinc-900/40">
              <td className="border border-zinc-300 dark:border-zinc-700 p-2">Struktura</td>
              <td className="border border-zinc-300 dark:border-zinc-700 p-2">Pevně daná</td>
              <td className="border border-zinc-300 dark:border-zinc-700 p-2">Dynamická</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mb-6 p-4 rounded-xl bg-sky-50/80 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800">
        <h4 className="font-semibold mb-3 text-lg">🔗 Jak fungují prototypy v JavaScriptu?</h4>
        <div className="space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
          <p>
            <strong>Každý objekt v JS má interní odkaz na svůj prototyp</strong> – jiný objekt, 
            ze kterého "dědí" vlastnosti a metody. Tento odkaz se ukládá do vlastnosti <Code>[[Prototype]]</Code> 
            (přístupná přes <Code>__proto__</Code> nebo <Code>Object.getPrototypeOf()</Code>).
          </p>
          <p>
            <strong>Prototype chain (řetězec prototypů):</strong> Když přistoupíte k vlastnosti objektu, 
            kterou objekt nemá, JavaScript se podívá do jeho prototypu, pak do prototypu prototypu, atd., 
            dokud nenajde vlastnost nebo nenarazí na konec řetězce (<Code>null</Code>).
          </p>
          <div className="rounded-lg bg-white/60 dark:bg-zinc-900/60 p-3 font-mono text-xs">
            <div>const animal = {'{'} eats: true {'}'};</div>
            <div>const rabbit = {'{'} jumps: true {'}'};</div>
            <div>rabbit.__proto__ = animal;</div>
            <div className="mt-2 text-emerald-600 dark:text-emerald-400">
              // rabbit.eats → true (z prototypu)
            </div>
            <div className="text-emerald-600 dark:text-emerald-400">
              // rabbit.jumps → true (vlastní vlastnost)
            </div>
          </div>
          <p>
            <strong>Konstruktorové funkce a .prototype:</strong> Když vytvoříte objekt pomocí <Code>new</Code>, 
            nový objekt získá jako prototyp vlastnost <Code>prototype</Code> konstruktorové funkce.
          </p>
          <div className="rounded-lg bg-white/60 dark:bg-zinc-900/60 p-3 font-mono text-xs">
            <div>function User(name) {'{'} this.name = name; {'}'}</div>
            <div>User.prototype.greet = function() {'{'}</div>
            <div className="pl-4">return `Hi, ${'{'}this.name{'}'}!`;</div>
            <div>{'}'};</div>
            <div className="mt-2">const user = new User("Alice");</div>
            <div className="text-emerald-600 dark:text-emerald-400">
              // user.__proto__ === User.prototype
            </div>
          </div>
          <p>
            <strong>ES6 class je syntaktický cukr:</strong> Moderní <Code>class</Code> syntaxe 
            pod kapotou stále vytváří konstruktorovou funkci a nastavuje prototypy stejným způsobem!
          </p>
        </div>
      </div>

      <InfoBox type="tip">
        <h4 className="font-semibold mb-2">💡 Did you know?</h4>
        <p>
          Před ES6 (2015) neexistovalo klíčové slovo <Code>class</Code>. Všechno se řešilo 
          pomocí konstruktorových funkcí a manuálního nastavování prototypů. ES6 třídy jsou 
          jen čitelnější způsob zápisu, ale mechanismus zůstává stejný – prototypy!
        </p>
      </InfoBox>
    </div>
  );
}

function CreatingObjectsSlide() {
  const [step, setStep] = useState(0);
  const steps = [
    {
      title: "1. new Object() + přiřazení",
      code: `const user1 = new Object();
user1.name = "John";
user1.surname = "Smith";
console.log(user1);`
    },
    {
      title: "2. Konstruktorová funkce",
      code: `function User(name, surname) {
  this.name = name;
  this.surname = surname;
}

const user2 = new User("John", "Smith");`
    },
    {
      title: "3. Objektový literál",
      code: `const user3 = {
  name: "John",
  surname: "Smith",
  getFullName() {
    return \`\${this.name} \${this.surname}\`;
  }
};`
    },
    {
      title: "4. ES6 třídy (doporučeno)",
      code: `class User {
  constructor(name, surname) {
    this.name = name;
    this.surname = surname;
  }
}

class AccessUser extends User {
  #role; // Soukromé pole
  
  constructor(name, surname, role) {
    super(name, surname);
    this.#role = role;
  }
}`
    }
  ];

  return (
    <div>
      <p className="mb-4 text-zinc-700 dark:text-zinc-300">
        JavaScript nabízí několik způsobů vytváření objektů:
      </p>
      
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm px-2 py-1 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800">
            Způsob {step + 1} / {steps.length}
          </span>
        </div>
        <h3 className="text-lg font-semibold mb-3">{steps[step].title}</h3>
        <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm">
          <code className="language-js">{steps[step].code}</code>
        </pre>
      </div>

      <div className="flex items-center justify-between mt-4">
        <button
          className="px-4 py-2 rounded-lg border border-zinc-200/60 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 disabled:opacity-50"
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
        >
          Předchozí
        </button>
        <div className="flex items-center gap-1">
          {steps.map((_, i) => (
            <button
              key={i}
              className={clsx(
                "h-2.5 w-2.5 rounded-full border",
                i === step ? "bg-sky-500 border-sky-500" : "bg-zinc-200 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
              )}
              onClick={() => setStep(i)}
            />
          ))}
        </div>
        <button
          className="px-4 py-2 rounded-lg border border-sky-500/30 bg-sky-600 text-white disabled:opacity-50"
          onClick={() => setStep(Math.min(steps.length - 1, step + 1))}
          disabled={step === steps.length - 1}
        >
          Další
        </button>
      </div>

      {step === steps.length - 1 && (
        <div className="mt-6 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60">
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            ES6 syntaxe <Code>class</Code> je jen <strong>syntaktický cukr</strong> nad prototypy.
          </p>
        </div>
      )}
    </div>
  );
}

function MethodsPrivateSlide() {
  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Instanční vs. statické metody</h3>
      <ul className="list-disc pl-6 space-y-2 text-sm text-zinc-700 dark:text-zinc-300 mb-6">
        <li><strong>Instanční metody</strong> – patří objektu, přístup k <Code>this</Code></li>
        <li><strong>Statické metody</strong> – patří třídě, volají se na třídě</li>
        <li><strong>Soukromá pole (#)</strong> – přístupná jen uvnitř třídy</li>
      </ul>

      <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm">
<code className="language-js">{`class AccessUser extends User {
  #role; // Soukromé pole
  
  constructor(name, surname, role) {
    super(name, surname);
    this.#role = role;
  }
  
  // Instanční metoda
  toAccessString() {
    return \`User: \${this.name}, Role: \${this.#role}\`;
  }
  
  // Statická metoda
  static createSimpleUser(name, surname) {
    return new AccessUser(name, surname, "USER");
  }
}

const admin = new AccessUser("John", "Smith", "ADMIN");
console.log(admin.toAccessString());`}</code>
      </pre>
    </div>
  );
}

function AjaxTheorySlide() {
  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Co je AJAX?</h3>
      <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed mb-2 text-lg">
        <strong>AJAX</strong> = <strong>A</strong>synchronous <strong>J</strong>avaScript{" "}
        <strong>a</strong>nd <strong>X</strong>ML
      </p>
      <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed mb-6">
        Technika pro <strong>asynchronní komunikaci se serverem</strong> bez reloadu celé stránky. 
        Umožňuje dynamicky aktualizovat části stránky na základě dat ze serveru. 
        Dnes se místo XML používá většinou <strong>JSON</strong>.
      </p>

      <div className="mb-6 p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
        <h4 className="font-semibold mb-3 text-lg">🌐 Klasický web vs. AJAX</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className="font-semibold text-sm mb-2 text-rose-700 dark:text-rose-400">
              ❌ Bez AJAXu (tradiční model)
            </h5>
            <ol className="list-decimal pl-5 space-y-1 text-xs text-zinc-700 dark:text-zinc-300">
              <li>Uživatel klikne na odkaz/tlačítko</li>
              <li>Prohlížeč pošle požadavek na server</li>
              <li>Server zpracuje a vrátí celou HTML stránku</li>
              <li><strong>Celá stránka se znovu načte</strong></li>
              <li>Uživatel vidí "bliknutí" a ztrátu stavu</li>
            </ol>
          </div>
          <div>
            <h5 className="font-semibold text-sm mb-2 text-emerald-700 dark:text-emerald-400">
              ✅ S AJAXem
            </h5>
            <ol className="list-decimal pl-5 space-y-1 text-xs text-zinc-700 dark:text-zinc-300">
              <li>Uživatel provede akci</li>
              <li>JavaScript pošle požadavek na pozadí</li>
              <li>Server vrátí jen data (JSON, XML, text)</li>
              <li><strong>Aktualizuje se jen část stránky</strong></li>
              <li>Plynulá interakce bez reloadu</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="mb-6 p-4 rounded-xl bg-sky-50/80 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800">
        <h4 className="font-semibold mb-3 text-lg">⚡ Synchronní vs. Asynchronní</h4>
        <div className="space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
          <div>
            <p className="font-semibold mb-1">🔒 Synchronní požadavek:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Kód čeká na odpověď serveru – <strong>blokuje celou stránku</strong></li>
              <li>Uživatel nemůže nic dělat, dokud server neodpoví</li>
              <li>UI "zamrzne" (špatný UX)</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-1">🚀 Asynchronní požadavek (AJAX):</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Požadavek běží na pozadí – <strong>neblokuje UI</strong></li>
              <li>Uživatel může dál pracovat se stránkou</li>
              <li>Po obdržení odpovědi se spustí callback funkce</li>
              <li>Moderní přístup: Promises a async/await</li>
            </ul>
          </div>
        </div>
        <div className="mt-3 rounded-lg bg-white/60 dark:bg-zinc-900/60 p-3 font-mono text-xs">
          <div className="text-rose-600 dark:text-rose-400">// ❌ Synchronní (nedoporučeno)</div>
          <div>const xhr = new XMLHttpRequest();</div>
          <div>xhr.open('GET', url, <span className="text-rose-600 dark:text-rose-400 font-bold">false</span>); // false = sync</div>
          <div>xhr.send(); // Blokuje!</div>
          <div className="mt-2"></div>
          <div className="text-emerald-600 dark:text-emerald-400">// ✅ Asynchronní (doporučeno)</div>
          <div>fetch(url) // Neblokuje</div>
          <div className="pl-4">.then(res =&gt; res.json())</div>
          <div className="pl-4">.then(data =&gt; console.log(data));</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/60 p-4">
          <h4 className="font-semibold mb-2">✅ Výhody AJAXu</h4>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li><strong>Rychlejší odezva</strong> – načítají se jen data, ne celá stránka</li>
            <li><strong>Lepší UX</strong> – plynulá interakce bez "blikání"</li>
            <li><strong>Menší přenos dat</strong> – šetří bandwidth</li>
            <li><strong>Desktopový zážitek</strong> – aplikace se chová jako nativní software</li>
          </ul>
        </div>
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/60 p-4">
          <h4 className="font-semibold mb-2">⚠️ Nevýhody/Výzvy</h4>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li><strong>SEO</strong> – obsah načítaný AJAXem je hůře indexovatelný</li>
            <li><strong>Historie prohlížeče</strong> – tlačítko zpět nemusí fungovat správně</li>
            <li><strong>Složitější debugging</strong> – asynchronní kód je náročnější</li>
            <li><strong>Závislost na JS</strong> – bez JS aplikace nefunguje</li>
          </ul>
        </div>
      </div>

      <div className="mb-4 p-4 rounded-xl bg-violet-50/80 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800">
        <h4 className="font-semibold mb-2">📚 Historie AJAXu</h4>
        <div className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
          <p>
            <strong>1999:</strong> Microsoft představil XMLHttpRequest v IE5 (původně pro Outlook Web Access)
          </p>
          <p>
            <strong>2005:</strong> Jesse James Garrett pojmenoval techniku "AJAX" – rychlý vzestup popularity
          </p>
          <p>
            <strong>2006+:</strong> AJAX se stal standardem (Gmail, Google Maps, Facebook)
          </p>
          <p>
            <strong>2015:</strong> Standardizace <Code>fetch()</Code> API – moderní, promise-based přístup
          </p>
          <p>
            <strong>Dnes:</strong> fetch() + async/await je preferovaný způsob. JSON kompletně nahradil XML.
          </p>
        </div>
      </div>

      <InfoBox>
        <p className="text-sm">
          <strong>💡 Fun fact:</strong> Přestože se AJAX jmenuje "...and XML", dnes se XML téměř nepoužívá. 
          JSON je jednodušší, menší a přirozeně podporovaný JavaScriptem (<Code>JSON.parse()</Code>, <Code>JSON.stringify()</Code>).
        </p>
      </InfoBox>
    </div>
  );
}

function AjaxPracticeSlide() {
  const [mode, setMode] = useState(0);
  const modes = [
    {
      title: "XMLHttpRequest (starší)",
      code: `function loadDoc() {
  const xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState === 4 && this.status === 200) {
      console.log(this.responseText);
    }
  };
  xhttp.open("GET", "https://zwa.toad.cz/passwords.txt", true);
  xhttp.send();
}`
    },
    {
      title: "fetch() (moderní)",
      code: `fetch("https://zwa.toad.cz/passwords.txt")
  .then(response => response.text())
  .then(text => console.log(text))
  .catch(error => console.error('Error:', error));`
    }
  ];

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button
          className={clsx(
            "px-4 py-2 rounded-lg text-sm",
            mode === 0 ? "bg-sky-600 text-white" : "bg-zinc-100 dark:bg-zinc-800"
          )}
          onClick={() => setMode(0)}
        >
          XMLHttpRequest
        </button>
        <button
          className={clsx(
            "px-4 py-2 rounded-lg text-sm",
            mode === 1 ? "bg-sky-600 text-white" : "bg-zinc-100 dark:bg-zinc-800"
          )}
          onClick={() => setMode(1)}
        >
          fetch()
        </button>
      </div>

      <h3 className="text-lg font-semibold mb-3">{modes[mode].title}</h3>
      <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm mb-4">
        <code className="language-js">{modes[mode].code}</code>
      </pre>

      <InfoBox>
        <p className="text-sm">
          💡 <Code>fetch()</Code> je čitelnější a promise-based. V legacy kódu ale narazíte na <Code>XMLHttpRequest</Code>.
        </p>
      </InfoBox>
    </div>
  );
}

function Task1Slide() {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">Zadání</h3>
      <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-3">
        Vytvořte formulář pro registraci studenta ČVUT:
      </p>
      <ul className="list-disc pl-6 space-y-1 text-sm text-zinc-700 dark:text-zinc-300 mb-4">
        <li>Jméno, Příjmení, Heslo</li>
        <li>Číslo osoby ČVUT</li>
        <li>Fakulta, Studijní program</li>
      </ul>

      <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm mb-6">
<code className="language-js">{`class FacultyProgram {
  constructor(faculty, program) {
    this.faculty = faculty;
    this.program = program;
  }
}

class CvutStudent {
  constructor(name, surname, password, personId, fp) {
    this.name = name;
    this.surname = surname;
    this.password = password;
    this.personId = personId;
    this.facultyProgram = fp;
  }
}

// V event listeneru:
const fp = new FacultyProgram(faculty, program);
const student = new CvutStudent(name, surname, pwd, id, fp);
console.log(student);`}</code>
      </pre>

      <ClickToRevealSolution>
        <div className="mt-6 p-6 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border-2 border-emerald-300 dark:border-emerald-800">
          <h4 className="font-semibold text-lg mb-4 text-emerald-900 dark:text-emerald-100">
            ✅ Řešení odhaleno
          </h4>
          
          <div className="mb-4">
            <h5 className="font-semibold mb-2">HTML (index.html)</h5>
            <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm">
<code className="language-html">{`<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Registrace studenta ČVUT</title>
  <script src="script.js"></script>
  <style>
    body { font-family: Arial, sans-serif; max-width: 500px; margin: 50px auto; padding: 20px; }
    input, select { width: 100%; padding: 8px; margin: 5px 0 15px; box-sizing: border-box; }
    button { padding: 10px 20px; background: #0066cc; color: white; border: none; cursor: pointer; }
    button:hover { background: #0052a3; }
  </style>
</head>
<body>
  <h1>Registrace studenta ČVUT</h1>
  <form id="registration-form">
    <label>Jméno:</label>
    <input type="text" id="name" required>
    
    <label>Příjmení:</label>
    <input type="text" id="surname" required>
    
    <label>Heslo:</label>
    <input type="password" id="password" required>
    
    <label>Číslo osoby ČVUT:</label>
    <input type="text" id="person-id" required>
    
    <label>Fakulta:</label>
    <select id="faculty" required>
      <option value="">Vyberte fakultu</option>
      <option value="FIT">FIT - Fakulta informačních technologií</option>
      <option value="FEL">FEL - Fakulta elektrotechnická</option>
      <option value="FJFI">FJFI - Fakulta jaderná a fyzikálně inženýrská</option>
      <option value="FS">FS - Fakulta strojní</option>
    </select>
    
    <label>Studijní program:</label>
    <input type="text" id="program" required>
    
    <button type="submit">SEND</button>
  </form>
</body>
</html>`}</code>
            </pre>
          </div>

          <div>
            <h5 className="font-semibold mb-2">JavaScript (script.js)</h5>
            <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm">
<code className="language-js">{`// Definice tříd
class FacultyProgram {
  constructor(faculty, program) {
    this.faculty = faculty;
    this.program = program;
  }

  toString() {
    return \`\${this.faculty} - \${this.program}\`;
  }
}

class CvutStudent {
  constructor(name, surname, password, personId, facultyProgram) {
    this.name = name;
    this.surname = surname;
    this.password = password;
    this.personId = personId;
    this.facultyProgram = facultyProgram;
  }

  toString() {
    return \`Student: \${this.name} \${this.surname}
ID: \${this.personId}
Faculty/Program: \${this.facultyProgram.toString()}
Password: ***\${this.password.slice(-3)}\`;
  }

  getFullInfo() {
    return {
      fullName: \`\${this.name} \${this.surname}\`,
      personId: this.personId,
      faculty: this.facultyProgram.faculty,
      program: this.facultyProgram.program
    };
  }
}

// Čekání na načtení DOMu
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded. Formulář připraven.');
  
  // Obsluha formuláře
  document.getElementById('registration-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Načtení hodnot z inputů
    const name = document.getElementById('name').value.trim();
    const surname = document.getElementById('surname').value.trim();
    const password = document.getElementById('password').value;
    const personId = document.getElementById('person-id').value.trim();
    const faculty = document.getElementById('faculty').value;
    const program = document.getElementById('program').value.trim();
    
    // Vytvoření instancí tříd
    const facultyProgram = new FacultyProgram(faculty, program);
    const student = new CvutStudent(name, surname, password, personId, facultyProgram);
    
    // Výpis do konzole
    console.log('=== Registrace studenta ===');
    console.log(student);
    console.log('\\n' + student.toString());
    console.log('\\nStrukturované info:', student.getFullInfo());
    
    // Oznámení uživateli
    alert('Student zaregistrován! Podívejte se do konzole (F12).');
    
    // Volitelně: reset formuláře
    // e.target.reset();
  });
});`}</code>
            </pre>
          </div>
        </div>
      </ClickToRevealSolution>
    </div>
  );
}

function Task2Slide({ password, setPassword, isBlacklisted }) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">Zadání</h3>
      <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-3">
        Kontrolujte heslo proti blacklistu z <Code>https://zwa.toad.cz/passwords.txt</Code>
      </p>

      <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm mb-4">
<code className="language-js">{`let blacklist = [];

fetch("https://zwa.toad.cz/passwords.txt")
  .then(res => res.text())
  .then(text => {
    blacklist = text.split("\\n");
  });

passwordInput.addEventListener('input', () => {
  if (blacklist.includes(passwordInput.value)) {
    showWarning();
  }
});`}</code>
      </pre>

      <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/60 p-4 mb-6">
        <h4 className="font-semibold mb-2">Demo:</h4>
        <input
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Zadejte heslo..."
          className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm mb-2"
        />
        {isBlacklisted && (
          <div className="text-sm text-rose-600 dark:text-rose-400 font-medium">
            ⚠️ Your password is in the blacklist!
          </div>
        )}
        {!isBlacklisted && password && (
          <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
            ✓ Heslo není v blacklistu
          </div>
        )}
      </div>

      <ClickToRevealSolution>
        <div className="mt-6 p-6 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border-2 border-emerald-300 dark:border-emerald-800">
          <h4 className="font-semibold text-lg mb-4 text-emerald-900 dark:text-emerald-100">
            ✅ Řešení odhaleno
          </h4>
          
          <div className="mb-4">
            <h5 className="font-semibold mb-2">HTML (index.html)</h5>
            <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm">
<code className="language-html">{`<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Blacklist Checker</title>
  <script src="script.js"></script>
  <style>
    body { font-family: Arial, sans-serif; max-width: 500px; margin: 50px auto; padding: 20px; }
    input { width: 100%; padding: 12px; font-size: 16px; box-sizing: border-box; }
    #password-warning {
      margin-top: 10px;
      padding: 10px;
      background: #fee;
      border: 2px solid #c33;
      color: #c33;
      border-radius: 5px;
      font-weight: bold;
    }
    .hidden { display: none; }
    #loading { color: #666; font-size: 14px; margin-top: 10px; }
  </style>
</head>
<body>
  <h1>Password Blacklist Checker</h1>
  <p>Zadejte heslo pro kontrolu proti blacklistu:</p>
  
  <input type="text" id="password" placeholder="Zadejte heslo...">
  
  <div id="loading">Načítám blacklist...</div>
  <div id="password-warning" class="hidden">
    Your password is in the blacklist, try another one.
  </div>
</body>
</html>`}</code>
            </pre>
          </div>

          <div>
            <h5 className="font-semibold mb-2">JavaScript (script.js)</h5>
            <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm">
<code className="language-js">{`// Globální proměnná pro blacklist
let blacklist = [];

// Čekání na načtení DOMu
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded. Inicializuji aplikaci...');
  
  // Získání elementů
  const passwordInput = document.getElementById('password');
  const warningDiv = document.getElementById('password-warning');
  const loadingDiv = document.getElementById('loading');
  
  // Načtení blacklistu při startu stránky
  fetch("https://zwa.toad.cz/passwords.txt")
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.text();
    })
    .then(text => {
      // Rozdělení textu na řádky a odstranění prázdných řádků
      blacklist = text.split("\\n")
                      .map(password => password.trim())
                      .filter(password => password.length > 0);
      
      console.log(\`Načteno \${blacklist.length} hesel z blacklistu\`);
      
      // Skrytí loading zprávy
      loadingDiv.classList.add('hidden');
    })
    .catch(error => {
      console.error("Chyba při načítání blacklistu:", error);
      loadingDiv.textContent = 
        "Chyba při načítání blacklistu. Zkuste stránku obnovit.";
    });
  
  // Event listener pro kontrolu hesla
  passwordInput.addEventListener('input', () => {
    const password = passwordInput.value;
    
    // Pokud je heslo prázdné, skryj varování
    if (!password) {
      warningDiv.classList.add('hidden');
      return;
    }
    
    // Kontrola, zda je heslo v blacklistu
    if (blacklist.includes(password)) {
      warningDiv.classList.remove('hidden');
      console.warn(\`Heslo "\${password}" je v blacklistu!\`);
    } else {
      warningDiv.classList.add('hidden');
    }
  });
});

// Alternativní varianta s debounce (pro výkon)
/*
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

document.addEventListener('DOMContentLoaded', () => {
  const passwordInput = document.getElementById('password');
  const warningDiv = document.getElementById('password-warning');
  
  const checkPassword = debounce(() => {
    const password = passwordInput.value;
    if (password && blacklist.includes(password)) {
      warningDiv.classList.remove('hidden');
    } else {
      warningDiv.classList.add('hidden');
    }
  }, 300);
  
  passwordInput.addEventListener('input', checkPassword);
});
*/`}</code>
            </pre>
          </div>
        </div>
      </ClickToRevealSolution>
    </div>
  );
}

function SummarySlide() {
  return (
    <div>
      <ul className="list-disc pl-6 space-y-3 text-zinc-700 dark:text-zinc-300">
        <li><strong>OOP v JS:</strong> Prototypy vs. Class syntaxe</li>
        <li><strong>Vytváření objektů:</strong> Object, funkce, literály, třídy</li>
        <li><strong>Soukromá pole:</strong> Symbol # pro zapouzdření</li>
        <li><strong>AJAX:</strong> XMLHttpRequest vs fetch()</li>
        <li><strong>Praxe:</strong> Strukturování dat + asynchronní komunikace</li>
      </ul>
      <p className="mt-8 text-2xl font-bold text-center text-sky-600 dark:text-sky-400">
        Děkuji za pozornost!
      </p>
    </div>
  );
}

export default function AppJsLesson7() {
  const [activeSlide, setActiveSlide] = useState("title");
  const [blacklist, setBlacklist] = useState([]);
  const [password, setPassword] = useState("");
  const [isBlacklisted, setIsBlacklisted] = useState(false);

  const slides = useMemo(() => [
    { id: "title", title: "Základy webových aplikací – 7. cvičení", subtitle: "Třídy a AJAX" },
    { id: "quiz", title: "Kvíz z minulého cvičení" },
    { id: "intro", title: "Úvod" },
    { id: "oop-theory", title: "Teorie OOP" },
    { id: "creating-objects", title: "Vytváření objektů" },
    { id: "methods-private", title: "Metody a soukromá pole" },
    { id: "ajax-theory", title: "Teorie AJAXu" },
    { id: "ajax-practice", title: "AJAX v praxi" },
    { id: "task1", title: "Úkol 1: Třídy" },
    { id: "task2", title: "Úkol 2: AJAX" },
    { id: "summary", title: "Shrnutí" },
  ], []);

  const currentSlide = slides.find((s) => s.id === activeSlide) || slides[0];

  useEffect(() => {
    fetch("https://zwa.toad.cz/passwords.txt")
      .then((res) => res.text())
      .then((text) => setBlacklist(text.split("\n").map((p) => p.trim()).filter(Boolean)))
      .catch((err) => console.error("Failed to load blacklist:", err));
  }, []);

  useEffect(() => {
    if (password && blacklist.length > 0) {
      setIsBlacklisted(blacklist.includes(password));
    } else {
      setIsBlacklisted(false);
    }
  }, [password, blacklist]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-zinc-50 to-sky-50 dark:from-zinc-950 dark:to-zinc-900 text-zinc-900 dark:text-zinc-50">
      <div className="max-w-6xl mx-auto p-4 md:p-8 relative">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
          <div className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-sky-300/40 dark:bg-sky-500/20 blur-3xl" />
          <div className="absolute top-1/3 -left-24 h-72 w-72 rounded-full bg-rose-300/40 dark:bg-rose-500/20 blur-3xl" />
        </div>

        <header className="mb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
            ZWA-7: Classes and AJAX
          </h1>
          <p className="text-sm text-zinc-500">
            Interaktivní prezentace s příklady kódu a úkoly
          </p>
        </header>

        <nav className="flex flex-wrap gap-2 mb-6">
          {slides.map((s) => (
            <button
              key={s.id}
              className={clsx(
                "px-3 py-1.5 rounded-full text-sm border transition-all",
                s.id === activeSlide
                  ? "bg-sky-600 text-white border-sky-600 shadow-lg"
                  : "bg-white/70 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-800"
              )}
              onClick={() => setActiveSlide(s.id)}
            >
              {s.title}
            </button>
          ))}
        </nav>

        <SlideCard
          slide={currentSlide}
          password={password}
          setPassword={setPassword}
          isBlacklisted={isBlacklisted}
        />


        <footer className="mt-8 text-sm text-zinc-500 text-center">
          © 2025 ZWA – Cvičení 7: Třídy a AJAX
        </footer>
        <Analytics />
      </div>
    </div>
  );
}

