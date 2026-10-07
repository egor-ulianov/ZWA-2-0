import React, { useMemo, useState } from 'react';
import { getLessonByNumber } from './src/config/lessons.js';
import {
  EditorialChapter,
  EditorialChapterSection,
} from './src/course-ui/content/EditorialChapter.jsx';
import EditorialCallout from './src/course-ui/content/EditorialCallout.jsx';
import EditorialCode from './src/course-ui/content/EditorialCode.jsx';
import EditorialIllustration from './src/course-ui/content/EditorialIllustration.jsx';
import Code from './src/course-ui/content/InlineCode.jsx';
import LessonSummary from './src/course-ui/content/LessonSummary.jsx';
import PreviousLectureQuiz from './src/course-ui/exercises/PreviousLectureQuiz.jsx';
import StaticExercise from './src/course-ui/exercises/StaticExercise.jsx';
import { LearningExperience } from './src/course-ui/learning/LearningExperience.jsx';
import { LearningSection } from './src/course-ui/learning/LearningSection.jsx';
import { useLearningNavigation } from './src/course-ui/learning/useLearningNavigation.js';

function clsx(...values) {
  return values.filter(Boolean).join(' ');
}

function InfoBox({ children, type }) {
  const tone = type === 'warning' ? 'warning' : type === 'tip' ? 'tip' : 'note';
  return <EditorialCallout tone={tone}>{children}</EditorialCallout>;
}

function TheoryCodeBlock({ children }) {
  const value = React.isValidElement(children) ? children.props.children : children;
  const className = React.isValidElement(children) ? children.props.className : '';
  const language = /language-([\w-]+)/.exec(className || '')?.[1];
  return <EditorialCode language={language}>{value}</EditorialCode>;
}

function ReviewQuiz() {
  return <PreviousLectureQuiz lessonNumber={7} />;
}

function ChallengeReveal({ children }) {
  const [clicks, setClicks] = useState([]);
  const [revealed, setRevealed] = useState(false);
  const REQUIRED_CLICKS = 20;
  const TIME_WINDOW = 5000; // 5 seconds

  const handleClick = () => {
    const now = Date.now();
    const recentClicks = [...clicks, now].filter((time) => now - time < TIME_WINDOW);
    setClicks(recentClicks);

    if (recentClicks.length >= REQUIRED_CLICKS) {
      setRevealed(true);
    }
  };

  const progress = Math.min((clicks.length / REQUIRED_CLICKS) * 100, 100);
  const validClicks = clicks.length;

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
        type="button"
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

function StaticLessonTask(props) {
  return <StaticExercise {...props} />;
}

function LessonSlideContent({ slide, password, setPassword, isWeakPassword }) {
  return (
    <>
      {slide.id === 'title' && (
        <LessonSummary
          intro="Propojíme objektový model JavaScriptu s načítáním dat ze serveru bez obnovení celé stránky."
          items={[
            'Vysvětlíme objekty, prototypy, třídy a zapouzdření.',
            'Vytvoříme instance, metody a soukromá pole.',
            'Projdeme životní cyklus asynchronního HTTP požadavku.',
            'Načteme a zpracujeme data pomocí fetch a async/await.',
          ]}
        />
      )}

      {slide.id === 'quiz' && <ReviewQuiz />}

      {slide.id === 'oop-theory' && <OopTheorySlide />}

      {slide.id === 'creating-objects' && <CreatingObjectsSlide />}

      {slide.id === 'methods-private' && <MethodsPrivateSlide />}

      {slide.id === 'ajax-theory' && <AjaxTheorySlide />}

      {slide.id === 'ajax-practice' && <AjaxPracticeSlide />}

      {slide.id === 'task1' && <Task1Slide />}

      {slide.id === 'task2' && (
        <Task2Slide password={password} setPassword={setPassword} isWeakPassword={isWeakPassword} />
      )}

      {slide.id === 'summary' && <SummarySlide />}
    </>
  );
}

function OopTheorySlide() {
  return (
    <EditorialChapter intro="Objekt propojuje data s operacemi, které nad nimi dávají smysl. V JavaScriptu jsou třídy pohodlným zápisem, ale skutečné sdílení chování stále zajišťuje prototypový řetězec.">
      <EditorialChapterSection index={1} title="Objekt drží stav a nabízí chování">
        <p>
          Vlastnosti popisují aktuální stav objektu a metody určují, co s ním lze bezpečně dělat.
          Zapouzdření neznamená schovat všechno; znamená vystavit malé srozumitelné rozhraní a
          zabránit tomu, aby okolní kód závisel na každém detailu implementace.
        </p>
        <p>
          Dědičnost může sdílet společné chování, ale vytváří také vazbu mezi potomkem a rodičem.
          Když vztah „je druhem“ není přirozený, bývá čitelnější složit objekt z menších
          spolupracujících částí.
        </p>
      </EditorialChapterSection>

      <EditorialIllustration
        alt="Objekt propojuje svůj stav a chování s dalšími objekty v prototypovém řetězci."
        height={771}
        src="/course-art/editorial/javascript-oop-model.png"
        width={2038}
      />

      <EditorialChapterSection index={2} title="Třída je zápis, prototyp je mechanismus">
        <p>
          Syntaxe <Code>class</Code> popisuje konstruktor a metody na jednom místě. Instance ale
          metody nekopíruje: při jejich hledání pokračuje přes svůj prototyp, prototyp rodiče a dál,
          dokud vlastnost nenajde nebo nedojde na konec řetězce.
        </p>
        <TheoryCodeBlock>
          <code className="language-js">{`class User {
  constructor(name) {
    this.name = name;
  }

  greet() {
    return \`Ahoj, \${this.name}!\`;
  }
}

const ada = new User('Ada');
Object.getPrototypeOf(ada) === User.prototype; // true`}</code>
        </TheoryCodeBlock>
      </EditorialChapterSection>

      <EditorialChapterSection index={3} title="Vyhledávání pokračuje po řetězci">
        <p>
          Když objekt nemá požadovanou vlastnost, JavaScript ji hledá na jeho prototypu a potom na
          dalších prototypech. Prakticky to znamená, že všechny instance mohou sdílet jednu metodu,
          zatímco každá instance si ponechá vlastní data.
        </p>
        <p>
          Řetězec kontrolujte přes <Code>Object.getPrototypeOf()</Code>. Historické{' '}
          <Code>__proto__</Code> pomáhá při čtení staršího kódu, ale pro novou implementaci není
          vhodným veřejným rozhraním.
        </p>
      </EditorialChapterSection>

      <EditorialChapterSection index={4} title="Používejte nejmenší užitečnou abstrakci">
        <p>
          Objektový literál stačí pro jednu hodnotu, tovární funkce dobře vytváří více podobných
          objektů a třída pomáhá tam, kde potřebujete jasnou identitu, sdílené metody nebo soukromý
          stav. OOP není cíl samo o sobě; je to nástroj pro čitelnější změny.
        </p>
      </EditorialChapterSection>
    </EditorialChapter>
  );
}

function CreatingObjectsSlide() {
  return (
    <EditorialChapter intro="Stejná data lze v JavaScriptu vytvořit několika způsoby. Volba není soutěž o nejmodernější syntaxi: měla by odpovídat počtu objektů, množství sdíleného chování a tomu, jak se bude model dál měnit.">
      <EditorialChapterSection index={1} title="Objektový literál pro jednu konkrétní hodnotu">
        <p>
          Literál je nejčitelnější, když potřebujete jeden konfigurační objekt nebo jednorázový
          záznam. Struktura je vidět přímo v místě použití a není potřeba zavádět konstrukční
          abstrakci.
        </p>
        <TheoryCodeBlock>
          <code className="language-js">{`const user = {
  name: 'Ada',
  surname: 'Lovelace',
  getFullName() {
    return \`\${this.name} \${this.surname}\`;
  },
};`}</code>
        </TheoryCodeBlock>
      </EditorialChapterSection>

      <EditorialIllustration
        alt="Objekty vznikají přímo, pomocí opakovatelně použitelné továrny nebo podle třídního předpisu."
        height={771}
        src="/course-art/editorial/javascript-object-creation.png"
        width={2038}
      />

      <EditorialChapterSection index={2} title="Tovární funkce pro opakované vytvoření">
        <p>
          Továrna je obyčejná funkce, která vrací nový objekt. Hodí se, když potřebujete více
          podobných hodnot, ale nepotřebujete identitu instance ani dědičnost. Závislosti lze předat
          jako parametry a výsledný objekt zůstává jednoduchý.
        </p>
        <TheoryCodeBlock>
          <code className="language-js">{`function createUser(name, surname) {
  return {
    name,
    surname,
    getFullName() {
      return \`\${name} \${surname}\`;
    },
  };
}

const ada = createUser('Ada', 'Lovelace');`}</code>
        </TheoryCodeBlock>
      </EditorialChapterSection>

      <EditorialChapterSection index={3} title="Třída pro stabilní model a sdílené metody">
        <p>
          Třída dává smysl, když objekty představují dlouhodobou doménovou roli a mají společné
          chování. Konstruktor nastaví platný počáteční stav, metody se sdílejí přes prototyp a
          soukromá pole mohou chránit interní pravidla.
        </p>
        <TheoryCodeBlock>
          <code className="language-js">{`class User {
  #role;

  constructor(name, surname, role = 'USER') {
    this.name = name;
    this.surname = surname;
    this.#role = role;
  }

  getFullName() {
    return \`\${this.name} \${this.surname}\`;
  }
}`}</code>
        </TheoryCodeBlock>
      </EditorialChapterSection>
    </EditorialChapter>
  );
}

function MethodsPrivateSlide() {
  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Instanční vs. statické metody</h3>
      <ul className="list-disc pl-6 space-y-2 text-sm text-zinc-700 dark:text-zinc-300 mb-6">
        <li>
          <strong>Instanční metody</strong> – patří objektu, přístup k <Code>this</Code>
        </li>
        <li>
          <strong>Statické metody</strong> – patří třídě, volají se na třídě
        </li>
        <li>
          <strong>Soukromá pole (#)</strong> – přístupná jen uvnitř třídy
        </li>
      </ul>

      <TheoryCodeBlock>
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
      </TheoryCodeBlock>
    </div>
  );
}

function AjaxTheorySlide() {
  return (
    <EditorialChapter intro="AJAX označuje způsob, jakým stránka komunikuje se serverem bez úplného obnovení dokumentu. Moderní implementace používá fetch, Promise a async/await; důležitější než název je ale správně řídit celý životní cyklus požadavku.">
      <EditorialChapterSection index={1} title="Aktualizuje se jen část rozhraní">
        <p>
          Uživatelská akce spustí HTTP požadavek na pozadí. Stránka zůstává dostupná, server vrátí
          data a JavaScript podle výsledku upraví konkrétní část DOM. Přenáší se obvykle JSON,
          nikoli nová kopie celé stránky.
        </p>
        <p>
          Asynchronní neznamená okamžité. Rozhraní musí uživateli ukázat, že operace běží, zabránit
          nechtěnému opakování a po dokončení zobrazit buď nová data, nebo srozumitelnou chybu.
        </p>
      </EditorialChapterSection>

      <EditorialIllustration
        alt="Asynchronní požadavek prochází stavem načítání a končí úspěšnou nebo chybovou aktualizací části stránky."
        height={771}
        src="/course-art/editorial/ajax-request-states.png"
        width={2038}
      />

      <EditorialChapterSection index={2} title="Požadavek má více stavů než úspěch a neúspěch">
        <p>
          Praktické rozhraní rozlišuje výchozí stav, načítání, úspěch, prázdný výsledek a chybu.
          Každý stav potřebuje vlastní prezentaci. Díky tomu se logika nerozpadne na nahodilé změny
          textu a uživatel vždy ví, co aplikace právě dělá.
        </p>
      </EditorialChapterSection>

      <EditorialChapterSection index={3} title="HTTP odpověď musíte vyhodnotit">
        <p>
          <Code>fetch()</Code> odmítne Promise při síťové chybě, ale odpověď se stavem 404 nebo 500
          je z pohledu přenosu úspěšná. Aplikace proto musí zkontrolovat <Code>response.ok</Code> a
          teprve potom zpracovat tělo odpovědi.
        </p>
        <TheoryCodeBlock>
          <code className="language-js">{`const response = await fetch('/api/projects');

if (!response.ok) {
  throw new Error(\`Server odpověděl stavem \${response.status}\`);
}

const projects = await response.json();`}</code>
        </TheoryCodeBlock>
      </EditorialChapterSection>

      <EditorialChapterSection index={4} title="Asynchronní tok má vlastní pravidla">
        <p>
          Blok <Code>try</Code> zachytí chybu požadavku i zpracování dat, zatímco{' '}
          <Code>finally</Code>
          vždy ukončí stav načítání. U opakovaných požadavků je navíc potřeba řešit pořadí odpovědí,
          aby starší výsledek nepřepsal novější stav rozhraní.
        </p>
        <p>
          Požadavek, který už není potřebný, lze zrušit pomocí <Code>AbortController</Code>. To je
          užitečné například při živém vyhledávání nebo při odchodu z komponenty, která výsledek už
          nebude zobrazovat.
        </p>
      </EditorialChapterSection>
    </EditorialChapter>
  );
}

function AjaxPracticeSlide() {
  return (
    <EditorialChapter intro="Spolehlivý AJAX nezačíná voláním fetch, ale jasným rozdělením odpovědností. Jedna část získá a ověří data, druhá řídí stav operace a třetí promítne výsledek do rozhraní.">
      <EditorialChapterSection index={1} title="Oddělte získání dat od vykreslení">
        <p>
          Funkce pro komunikaci se serverem by měla vracet data nebo vyhodit chybu. Nemá zároveň
          hledat elementy v DOM a rozhodovat o jejich vzhledu. Takové rozdělení usnadňuje testování
          i pozdější nahrazení API.
        </p>
        <TheoryCodeBlock>
          <code className="language-js">{`async function loadProject(projectId, signal) {
  const response = await fetch(\`/api/projects/\${projectId}\`, { signal });

  if (!response.ok) {
    throw new Error(\`Projekt nelze načíst: \${response.status}\`);
  }

  return response.json();
}`}</code>
        </TheoryCodeBlock>
      </EditorialChapterSection>

      <EditorialIllustration
        alt="Praktický tok požadavku odděluje vstup uživatele, síťovou komunikaci, ověření odpovědi a aktualizaci rozhraní."
        height={771}
        src="/course-art/editorial/ajax-practical-flow.png"
        width={2038}
      />

      <EditorialChapterSection index={2} title="Řiďte celý životní cyklus operace">
        <p>
          Před odesláním požadavku nastavte stav načítání. Po úspěchu uložte data, při chybě
          zobrazte uživatelsky srozumitelnou zprávu a v bloku <Code>finally</Code> vždy ukončete
          indikátor průběhu.
        </p>
        <TheoryCodeBlock>
          <code className="language-js">{`async function showProject(projectId) {
  renderStatus('loading');

  try {
    const project = await loadProject(projectId);
    renderProject(project);
    renderStatus('success');
  } catch (error) {
    console.error(error);
    renderStatus('error');
  } finally {
    setControlsDisabled(false);
  }
}`}</code>
        </TheoryCodeBlock>
      </EditorialChapterSection>

      <EditorialChapterSection index={3} title="Aktualizujte DOM bezpečně a předvídatelně">
        <p>
          Textová data vkládejte přes <Code>textContent</Code>, nikoli přes <Code>innerHTML</Code>.
          Rozhraní si připravte pro prázdný výsledek i opakování akce; načtení dat totiž nemusí vždy
          skončit položkou, kterou lze rovnou vykreslit.
        </p>
        <TheoryCodeBlock>
          <code className="language-js">{`function renderProject(project) {
  const title = document.querySelector('[data-project-title]');
  title.textContent = project?.name ?? 'Projekt nemá název';
}`}</code>
        </TheoryCodeBlock>
      </EditorialChapterSection>

      <EditorialChapterSection index={4} title="XMLHttpRequest patří hlavně do staršího kódu">
        <p>
          Ve starších projektech se můžete setkat s <Code>XMLHttpRequest</Code>. Pro nový kód je
          zpravidla čitelnější <Code>fetch()</Code> s <Code>async/await</Code>, protože odděluje
          sekvenční kroky bez ručního sledování <Code>readyState</Code> a callbacků.
        </p>
      </EditorialChapterSection>
    </EditorialChapter>
  );
}

function Task1Slide() {
  const solution = `<!doctype html>
<html lang="cs">
<head>
  <meta charset="utf-8">
  <title>Registrace studenta ČVUT</title>
</head>
<body>
  <form id="registration-form">
    <label>Jméno <input id="name" required></label>
    <label>Příjmení <input id="surname" required></label>
    <label>Heslo <input id="password" type="password" required></label>
    <label>Číslo osoby ČVUT <input id="person-id" required></label>
    <label>Fakulta <select id="faculty" required><option>FIT</option><option>FEL</option></select></label>
    <label>Studijní program <input id="program" required></label>
    <button type="submit">Registrovat</button>
  </form>
  <script>
class FacultyProgram {
  constructor(faculty, program) { this.faculty = faculty; this.program = program; }
}

class CvutStudent {
  constructor(name, surname, password, personId, facultyProgram) {
    this.name = name;
    this.surname = surname;
    this.password = password;
    this.personId = personId;
    this.facultyProgram = facultyProgram;
  }
}

document.getElementById('registration-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const student = new CvutStudent(
    document.getElementById('name').value,
    document.getElementById('surname').value,
    document.getElementById('password').value,
    document.getElementById('person-id').value,
    new FacultyProgram(
      document.getElementById('faculty').value,
      document.getElementById('program').value,
    ),
  );
  console.log(student);
});
  </script>
</body>
</html>`;

  return (
    <StaticLessonTask
      id="zwa7-task1"
      task={
        <>
          <p>Vytvořte formulář pro registraci studenta ČVUT.</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Jméno, příjmení a heslo</li>
            <li>Číslo osoby ČVUT</li>
            <li>Fakulta a studijní program</li>
          </ul>
        </>
      }
      language="html"
      fileName="index.html"
      draft={`<!doctype html>
<html lang="cs">
<head>
  <meta charset="utf-8">
  <title>Registrace studenta ČVUT</title>
</head>
<body>
  <form id="registration-form">
    <label>Jméno <input id="name" required></label>
    <label>Příjmení <input id="surname" required></label>
    <label>Heslo <input id="password" type="password" required></label>
    <label>Číslo osoby ČVUT <input id="person-id" required></label>
    <label>Fakulta <select id="faculty" required>
      <option value="">Vyberte fakultu</option>
      <option value="FIT">FIT</option>
      <option value="FEL">FEL</option>
    </select></label>
    <label>Studijní program <input id="program" required></label>
    <button type="submit">Registrovat</button>
  </form>
  <script>
class FacultyProgram {
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

document.getElementById('registration-form').addEventListener('submit', (event) => {
  event.preventDefault();
});
  </script>
</body>
</html>`}
      required={['class FacultyProgram', 'class CvutStudent', 'addEventListener']}
      expected="Po odeslání vznikne objekt studenta s vnořeným oborem fakulty a programu."
      solution={solution}
    >
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

        <TheoryCodeBlock>
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
        </TheoryCodeBlock>

        <ChallengeReveal>
          <div className="mt-6 p-6 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border-2 border-emerald-300 dark:border-emerald-800">
            <h4 className="font-semibold text-lg mb-4 text-emerald-900 dark:text-emerald-100">
              ✅ Řešení odhaleno
            </h4>

            <div className="mb-4">
              <h5 className="font-semibold mb-2">HTML (index.html)</h5>
              <TheoryCodeBlock>
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
              </TheoryCodeBlock>
            </div>

            <div>
              <h5 className="font-semibold mb-2">JavaScript (script.js)</h5>
              <TheoryCodeBlock>
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
              </TheoryCodeBlock>
            </div>
          </div>
        </ChallengeReveal>
      </div>
    </StaticLessonTask>
  );
}

function Task2Slide({ password, setPassword, isWeakPassword }) {
  const solution = `const demoWeakPasswords = new Set(["password", "123456", "qwerty"]);
const passwordInput = document.getElementById('password');
const warning = document.getElementById('password-warning');

passwordInput.addEventListener('input', () => {
  const isWeak = demoWeakPasswords.has(passwordInput.value);
  warning.hidden = !isWeak;
});

// Toto je pouze klientská nápověda; skutečnou politiku musí vynucovat server.`;

  return (
    <StaticLessonTask
      id="zwa7-task2"
      task={
        <p>
          Vytvořte pouze klientský náhled slabého hesla; skutečnou politiku hesel musí vynucovat
          server.
        </p>
      }
      draft={`const demoWeakPasswords = new Set(["password", "123456", "qwerty"]);
passwordInput.addEventListener('input', () => {
  showWarning(demoWeakPasswords.has(passwordInput.value));
});
// Skutečnou politiku hesel musí ověřit server.`}
      required={['demoWeakPasswords', 'addEventListener', 'server']}
      expected="Při zadání známého slabého hesla se zobrazí pouze orientační upozornění."
      solution={solution}
    >
      <div>
        <h3 className="text-lg font-semibold mb-3">Zadání</h3>
        <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-3">
          Vytvořte pouze klientský náhled slabého hesla; skutečnou politiku hesel musí vynucovat
          server.
        </p>

        <TheoryCodeBlock>
          <code className="language-js">{`const demoWeakPasswords = new Set(["password", "123456", "qwerty"]);
passwordInput.addEventListener('input', () => {
  showWarning(demoWeakPasswords.has(passwordInput.value));
});`}</code>
        </TheoryCodeBlock>

        <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/60 p-4 mb-6">
          <h4 className="font-semibold mb-2">Demo hint (není bezpečnostní kontrola):</h4>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Zadejte heslo..."
            className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm mb-2"
          />
          {isWeakPassword && (
            <div className="text-sm text-rose-600 dark:text-rose-400 font-medium">
              ⚠️ Toto heslo vypadá slabě (demo hint).
            </div>
          )}
          {!isWeakPassword && password && (
            <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
              ✓ Demo nápověda nenašla známé slabé heslo
            </div>
          )}
        </div>

        <ChallengeReveal>
          <div className="mt-6 p-6 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border-2 border-emerald-300 dark:border-emerald-800">
            <h4 className="font-semibold text-lg mb-4 text-emerald-900 dark:text-emerald-100">
              ✅ Řešení odhaleno
            </h4>

            <div className="mb-4">
              <h5 className="font-semibold mb-2">HTML (index.html)</h5>
              <TheoryCodeBlock>
                <code className="language-html">{`<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Strength Hint</title>
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
  <h1>Password Strength Hint</h1>
  <p>Zadejte heslo pro orientační kontrolu slabosti:</p>
  
  <input type="password" id="password" placeholder="Zadejte heslo..." autocomplete="new-password">
  
  <div id="loading">Kontrola je pouze lokální nápověda pro cvičení.</div>
  <div id="password-warning" class="hidden">
    This demo hint considers the password weak; validate it again on the server.
  </div>
</body>
</html>`}</code>
              </TheoryCodeBlock>
            </div>

            <div>
              <h5 className="font-semibold mb-2">JavaScript (script.js)</h5>
              <TheoryCodeBlock>
                <code className="language-js">{`// Pouze UX nápověda; nikdy nenahrazuje serverovou validaci.
const demoWeakPasswords = new Set(['password', '123456', 'qwerty']);

// Čekání na načtení DOMu
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded. Inicializuji aplikaci...');
  
  // Získání elementů
  const passwordInput = document.getElementById('password');
  const warningDiv = document.getElementById('password-warning');

  // Event listener pro kontrolu hesla
  passwordInput.addEventListener('input', () => {
    const password = passwordInput.value;
    
    // Pokud je heslo prázdné, skryj varování
    if (!password) {
      warningDiv.classList.add('hidden');
      return;
    }
    
    // Jen orientační nápověda; server musí heslo ověřit znovu.
    if (demoWeakPasswords.has(password)) {
      warningDiv.classList.remove('hidden');
      console.warn('Demo nápověda: heslo vypadá slabě; ověřte politiku na serveru.');
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
    if (password && demoWeakPasswords.has(password)) {
      warningDiv.classList.remove('hidden');
    } else {
      warningDiv.classList.add('hidden');
    }
  }, 300);
  
  passwordInput.addEventListener('input', checkPassword);
});
*/`}</code>
              </TheoryCodeBlock>
            </div>
          </div>
        </ChallengeReveal>
      </div>
    </StaticLessonTask>
  );
}

function SummarySlide() {
  return (
    <div>
      <ul className="list-disc pl-6 space-y-3 text-zinc-700 dark:text-zinc-300">
        <li>
          <strong>OOP v JS:</strong> Prototypy vs. Class syntaxe
        </li>
        <li>
          <strong>Vytváření objektů:</strong> Object, funkce, literály, třídy
        </li>
        <li>
          <strong>Soukromá pole:</strong> Symbol # pro zapouzdření
        </li>
        <li>
          <strong>AJAX:</strong> XMLHttpRequest vs fetch()
        </li>
        <li>
          <strong>Praxe:</strong> Strukturování dat + asynchronní komunikace
        </li>
      </ul>
      <p className="mt-8 text-2xl font-bold text-center text-sky-600 dark:text-sky-400">
        Děkuji za pozornost!
      </p>
    </div>
  );
}

export default function AppJsLesson7() {
  const [password, setPassword] = useState('');

  const slides = useMemo(
    () => [
      {
        id: 'title',
        title: 'Základy webových aplikací – 7. cvičení',
        subtitle: 'Třídy a AJAX',
        activityType: 'learn',
        presenterNotes: 'Uveďte spojení mezi zapouzdřením dat a asynchronní komunikací.',
      },
      {
        id: 'quiz',
        title: 'KVÍZ: JavaScript základy',
        activityType: 'quick-check',
        presenterNotes: 'Otázky opakují základy JavaScriptu z předchozí lekce.',
      },
      {
        id: 'oop-theory',
        title: 'Teorie OOP',
        activityType: 'learn',
        presenterNotes: 'Na příkladu ukažte, co třída skrývá a jaké rozhraní vystavuje.',
      },
      { id: 'creating-objects', title: 'Vytváření objektů', activityType: 'learn' },
      { id: 'methods-private', title: 'Metody a soukromá pole', activityType: 'learn' },
      { id: 'ajax-theory', title: 'Teorie AJAXu', activityType: 'learn' },
      {
        id: 'ajax-practice',
        title: 'AJAX v praxi',
        activityType: 'learn',
        presenterNotes: 'Nechte studenty sledovat stav před požadavkem, během něj a po odpovědi.',
      },
      {
        id: 'task1',
        title: 'Úkol 1: Třídy',
        activityType: 'apply',
        presenterNotes: 'Před řešením požádejte o návrh rozhraní třídy na tabuli.',
      },
      {
        id: 'task2',
        title: 'Úkol 2: AJAX',
        activityType: 'apply',
        presenterNotes: 'Před spuštěním požadavku nechte studenty určit očekávaný tvar odpovědi.',
      },
      { id: 'summary', title: 'Shrnutí', activityType: 'learn' },
    ],
    [],
  );

  const { activeSection, setActiveSection } = useLearningNavigation(slides);
  const currentSlide = slides.find((section) => section.id === activeSection) || slides[0];
  const demoWeakPasswords = ['password', '123456', 'qwerty'];
  const isWeakPassword = password.length > 0 && demoWeakPasswords.includes(password);

  return (
    <LearningExperience
      lesson={getLessonByNumber(7)}
      sections={slides}
      activeSection={activeSection}
      onChange={setActiveSection}
      title="ZWA-7: JavaScript II – třídy a AJAX"
      objective="Vysvětlíte základy tříd v JavaScriptu a AJAXu a procvičíte práci s asynchronními požadavky."
      subtitle="Interaktivní prezentace s příklady kódu a úkoly"
      footerText="ZWA – Cvičení 7: JavaScript II"
    >
      <LearningSection section={currentSlide} idPrefix="lesson-classes-ajax">
        <LessonSlideContent
          slide={currentSlide}
          password={password}
          setPassword={setPassword}
          isWeakPassword={isWeakPassword}
        />
      </LearningSection>
    </LearningExperience>
  );
}
