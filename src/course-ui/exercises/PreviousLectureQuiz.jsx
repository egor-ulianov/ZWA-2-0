import KnowledgeCheck from './KnowledgeCheck.jsx';

function distributeCorrectAnswers(questions) {
  return questions.map((question, questionIndex) => {
    if (!Number.isInteger(question.correctIndex) || question.options.length < 2) return question;

    const offset = questionIndex % question.options.length;
    if (offset === 0) return question;

    return {
      ...question,
      options: [...question.options.slice(-offset), ...question.options.slice(0, -offset)],
      correctIndex: (question.correctIndex + offset) % question.options.length,
    };
  });
}

const reviewQuizzes = Object.freeze({
  1: {
    title: 'Vaše zkušenost na začátku kurzu',
    subtitle: 'Nejde o test. Odpověď vám pomůže pojmenovat výchozí bod před první lekcí.',
    visualKey: 'starting-experience',
    visualLabel: 'Výchozí zkušenost studenta',
    visualText: 'zkušenost → kurz → praxe',
    resultMessage: () => 'Děkujeme za odpověď. Na výsledku se nic neboduje.',
    questions: [
      {
        id: 'experience',
        text: 'Jaké máte dosavadní zkušenosti s tvorbou webových aplikací?',
        options: [
          'Zatím žádné nebo téměř žádné',
          'Znám základy HTML a CSS',
          'Používal(a) jsem také JavaScript',
          'Vytvářel(a) jsem web i se serverovou částí',
        ],
      },
    ],
  },
  2: {
    title: 'Opakování: GitLab, síť a HTTP',
    subtitle: 'Pět otázek z předchozí lekce před začátkem HTML.',
    visualKey: 'network-http-review',
    visualLabel: 'Cesta webového požadavku',
    visualText: 'DNS → TCP → HTTP',
    questions: distributeCorrectAnswers([
      {
        id: 'dns',
        text: 'Jakou základní úlohu plní DNS při otevření webové adresy?',
        options: ['Překládá doménové jméno na IP adresu', 'Šifruje HTML', 'Ukládá Git commity'],
        correctIndex: 0,
      },
      {
        id: 'clone',
        text: 'Který příkaz vytvoří místní kopii vzdáleného Git repozitáře?',
        options: ['git clone', 'git copy', 'git init --remote'],
        correctIndex: 0,
      },
      {
        id: 'http',
        text: 'Co v HTTP obvykle posílá klient serveru?',
        options: ['Požadavek', 'DNS zónu', 'Git větev'],
        correctIndex: 0,
      },
      {
        id: 'status',
        text: 'Co znamená stavový kód HTTP 404?',
        options: ['Zdroj nebyl nalezen', 'Požadavek uspěl', 'Server trvale přesměroval klienta'],
        correctIndex: 0,
      },
      {
        id: 'trace',
        text: 'Který nástroj ukazuje postupné síťové uzly na cestě k cíli?',
        options: ['traceroute', 'mkdir', 'git status'],
        correctIndex: 0,
      },
    ]),
  },
  3: {
    title: 'Opakování: sémantické HTML',
    subtitle: 'Pět otázek z předchozí lekce před tvorbou formulářů.',
    visualKey: 'html-review',
    visualLabel: 'Sémantická struktura HTML dokumentu',
    visualText: '<header> → <main> → <footer>',
    questions: distributeCorrectAnswers([
      {
        id: 'doctype',
        text: 'Který zápis oznamuje prohlížeči dokument HTML5?',
        options: ['<!doctype html>', '<html5>', '<meta type="html5">'],
        correctIndex: 0,
      },
      {
        id: 'main',
        text: 'Který element označuje hlavní jedinečný obsah stránky?',
        options: ['<main>', '<body-content>', '<section-main>'],
        correctIndex: 0,
      },
      {
        id: 'navigation',
        text: 'Který sémantický element patří hlavní navigaci?',
        options: ['<nav>', '<links>', '<menu-bar>'],
        correctIndex: 0,
      },
      {
        id: 'image-alt',
        text: 'K čemu slouží atribut alt u obrázku?',
        options: ['K textové alternativě obrázku', 'K nastavení šířky', 'K načtení CSS'],
        correctIndex: 0,
      },
      {
        id: 'validator',
        text: 'Co pomáhá odhalit HTML validátor?',
        options: [
          'Chyby ve struktuře a syntaxi HTML',
          'Pomalé SQL dotazy',
          'Neuložené Git commity',
        ],
        correctIndex: 0,
      },
    ]),
  },
  4: {
    title: 'Opakování: HTML formuláře',
    subtitle: 'Pět otázek z předchozí lekce před začátkem CSS.',
    visualKey: 'forms-review',
    visualLabel: 'Vztah formulářového popisku a vstupu',
    visualText: '<label> ↔ <input>',
    questions: distributeCorrectAnswers([
      {
        id: 'label',
        text: 'Jak se explicitně propojí label s formulářovým prvkem?',
        options: ['Atributem for odpovídajícím id prvku', 'Stejnou CSS třídou', 'Atributem target'],
        correctIndex: 0,
      },
      {
        id: 'required',
        text: 'Který atribut označí pole jako povinné?',
        options: ['required', 'mandatory', 'validate'],
        correctIndex: 0,
      },
      {
        id: 'email',
        text: 'Který typ inputu poskytne základní kontrolu e-mailové adresy?',
        options: ['email', 'mailbox', 'text-email'],
        correctIndex: 0,
      },
      {
        id: 'group',
        text: 'Která dvojice sémanticky seskupuje související formulářová pole?',
        options: ['fieldset a legend', 'div a span', 'section a footer'],
        correctIndex: 0,
      },
      {
        id: 'name',
        text: 'Který atribut určuje název hodnoty odeslané formulářem?',
        options: ['name', 'id', 'placeholder'],
        correctIndex: 0,
      },
    ]),
  },
  5: {
    title: 'Opakování: základy CSS',
    subtitle: 'Pět otázek z předchozí lekce před layoutem a responzivitou.',
    visualKey: 'css-basics-review',
    visualLabel: 'Specifita CSS selektorů',
    visualText: '#id > .třída > element',
    questions: distributeCorrectAnswers([
      {
        id: 'id-selector',
        text: 'Který selektor cílí na element s id="title"?',
        options: ['#title', '.title', 'title'],
        correctIndex: 0,
      },
      {
        id: 'specificity',
        text: 'Který selektor má nejvyšší specifitu?',
        options: ['#menu a', '.menu a', 'nav a'],
        correctIndex: 0,
      },
      {
        id: 'font-family',
        text: 'Která vlastnost nastavuje rodinu písma?',
        options: ['font-family', 'font-style', 'text-font'],
        correctIndex: 0,
      },
      {
        id: 'visited',
        text: 'Která pseudo-třída označuje již navštívený odkaz?',
        options: [':visited', ':checked', ':focus-visible-only'],
        correctIndex: 0,
      },
      {
        id: 'first-letter',
        text: 'Který pseudo-element vybírá první písmeno odstavce?',
        options: ['::first-letter', ':letter-first', '::initial'],
        correctIndex: 0,
      },
    ]),
  },
  6: {
    title: 'Opakování: CSS layout a responzivita',
    subtitle: 'Pět otázek z předchozí lekce před začátkem JavaScriptu.',
    visualKey: 'css-layout-review',
    visualLabel: 'Responzivní CSS layout',
    visualText: 'box model → flex → @media',
    questions: distributeCorrectAnswers([
      {
        id: 'border-box',
        text: 'Co znamená box-sizing: border-box?',
        options: [
          'Padding a border se započítají do zadané šířky a výšky',
          'Padding se odstraní',
          'Element se změní na flex kontejner',
        ],
        correctIndex: 0,
      },
      {
        id: 'flex-auto',
        text: 'Jak ve flex řádku odsunete jeden prvek doprava?',
        options: ['margin-left: auto', 'text-align: right', 'position: float-right'],
        correctIndex: 0,
      },
      {
        id: 'mobile-first',
        text: 'Která media query odpovídá běžnému mobile-first rozšíření pro větší obrazovky?',
        options: ['@media (min-width: 800px)', '@media (max-width: 800px)', '@media mobile'],
        correctIndex: 0,
      },
      {
        id: 'display-none',
        text: 'Která deklarace odstraní element i z layoutu?',
        options: ['display: none', 'opacity: 0', 'visibility: hidden'],
        correctIndex: 0,
      },
      {
        id: 'print',
        text: 'Která media query cílí na tisk?',
        options: ['@media print', '@media paper', '@print'],
        correctIndex: 0,
      },
    ]),
  },
  7: {
    title: 'Opakování: základy JavaScriptu',
    subtitle: 'Pět otázek z předchozí lekce před třídami a AJAXem.',
    visualKey: 'javascript-basics-review',
    visualLabel: 'JavaScript reagující na událost v DOM',
    visualText: 'událost → handler → DOM',
    questions: distributeCorrectAnswers([
      {
        id: 'const',
        text: 'Kterou deklaraci nelze znovu přiřadit?',
        options: ['const', 'let', 'var'],
        correctIndex: 0,
      },
      {
        id: 'strict-equality',
        text: 'Který operátor porovnává hodnotu i typ bez přetypování?',
        options: ['===', '==', '='],
        correctIndex: 0,
      },
      {
        id: 'for-of',
        text: 'Co u pole typicky prochází cyklus for...of?',
        options: ['Hodnoty', 'Pouze názvy vlastností', 'Řádky HTML'],
        correctIndex: 0,
      },
      {
        id: 'query-selector',
        text: 'Která metoda vrátí první prvek odpovídající CSS selektoru?',
        options: ['document.querySelector', 'document.querySelectorAll', 'document.findCss'],
        correctIndex: 0,
      },
      {
        id: 'event-listener',
        text: 'Která metoda připojí handler k události?',
        options: ['addEventListener', 'listenToDom', 'attachCallbackOnly'],
        correctIndex: 0,
      },
    ]),
  },
  8: {
    title: 'Opakování: JavaScript třídy a AJAX',
    subtitle: 'Pět otázek z předchozí lekce před začátkem PHP.',
    visualKey: 'classes-ajax-review',
    visualLabel: 'Objektová logika a asynchronní požadavek',
    visualText: 'class → instance → fetch',
    questions: distributeCorrectAnswers([
      {
        id: 'constructor',
        text: 'Která metoda třídy inicializuje novou instanci?',
        options: ['constructor', 'initializeClass', 'create'],
        correctIndex: 0,
      },
      {
        id: 'new',
        text: 'Které klíčové slovo vytvoří instanci třídy?',
        options: ['new', 'class', 'instanceof'],
        correctIndex: 0,
      },
      {
        id: 'private-field',
        text: 'Jak se v moderním JavaScriptu zapisuje soukromé pole třídy?',
        options: ['#value', 'private value', '_private(value)'],
        correctIndex: 0,
      },
      {
        id: 'fetch',
        text: 'Co vrací volání fetch bez await?',
        options: ['Promise', 'Hotový JSON objekt', 'HTML element'],
        correctIndex: 0,
      },
      {
        id: 'json',
        text: 'Jak z objektu Response asynchronně načtete JSON tělo?',
        options: ['await response.json()', 'response.body.json', 'JSON.fetch(response)'],
        correctIndex: 0,
      },
    ]),
  },
  9: {
    title: 'Opakování: základy PHP',
    subtitle: 'Pět otázek z předchozí lekce před serverovými formuláři a CRUD.',
    visualKey: 'php-basics-review',
    visualLabel: 'Zpracování PHP skriptu na serveru',
    visualText: 'požadavek → PHP → odpověď',
    questions: distributeCorrectAnswers([
      {
        id: 'php-tag',
        text: 'Kterým zápisem začíná standardní blok PHP kódu?',
        options: ['<?php', '<php>', '<script php>'],
        correctIndex: 0,
      },
      {
        id: 'variable',
        text: 'Jak v PHP začíná název proměnné?',
        options: ['Znakem $', 'Znakem #', 'Klíčovým slovem var povinně'],
        correctIndex: 0,
      },
      {
        id: 'function',
        text: 'Které klíčové slovo deklaruje vlastní funkci?',
        options: ['function', 'def', 'fn-only'],
        correctIndex: 0,
      },
      {
        id: 'strict',
        text: 'Který operátor v PHP porovnává hodnotu i typ?',
        options: ['===', '==', '='],
        correctIndex: 0,
      },
      {
        id: 'array-loop',
        text: 'Který příkaz se běžně používá k průchodu polem?',
        options: ['foreach', 'repeat array', 'loopValues'],
        correctIndex: 0,
      },
    ]),
  },
  10: {
    title: 'Opakování: serverové formuláře a CRUD',
    subtitle: 'Pět otázek z předchozí lekce před sessions a cookies.',
    visualKey: 'crud-review',
    visualLabel: 'Serverový cyklus formuláře a CRUD',
    visualText: 'vstup → validace → CRUD → výstup',
    questions: distributeCorrectAnswers([
      {
        id: 'post',
        text: 'Která HTTP metoda se běžně používá pro změnu dat formulářem?',
        options: ['POST', 'GET', 'TRACE'],
        correctIndex: 0,
      },
      {
        id: 'post-data',
        text: 'Ve které PHP superglobální proměnné jsou data z POST formuláře?',
        options: ['$_POST', '$_FORM', '$_BODY'],
        correctIndex: 0,
      },
      {
        id: 'validation',
        text: 'Proč musí server validovat vstup i při klientské HTML validaci?',
        options: [
          'Klientskou kontrolu lze obejít',
          'PHP neumí číst validní data',
          'Serverová validace zrychluje CSS',
        ],
        correctIndex: 0,
      },
      {
        id: 'escape',
        text: 'Která funkce pomáhá bezpečně vypsat text do HTML?',
        options: ['htmlspecialchars', 'html_decode_all', 'strip_everything'],
        correctIndex: 0,
      },
      {
        id: 'crud',
        text: 'Co znamená písmeno U ve zkratce CRUD?',
        options: ['Update', 'Upload', 'User'],
        correctIndex: 0,
      },
    ]),
  },
  11: {
    title: 'Opakování: sessions a cookies',
    subtitle: 'Pět otázek z předchozí lekce před prací se soubory a JSON.',
    visualKey: 'session-review',
    visualLabel: 'Propojení klientské cookie se serverovou session',
    visualText: 'cookie ID ↔ serverová session',
    questions: distributeCorrectAnswers([
      {
        id: 'cookie-storage',
        text: 'Kde prohlížeč uchovává cookie?',
        options: ['Na straně klienta', 'Pouze v PHP zdrojovém kódu', 'V DNS'],
        correctIndex: 0,
      },
      {
        id: 'session-storage',
        text: 'Kde se obvykle uchovávají důvěryhodná data session?',
        options: ['Na serveru', 'V názvu domény', 'V CSS'],
        correctIndex: 0,
      },
      {
        id: 'session-start',
        text: 'Která PHP funkce zahájí nebo obnoví session?',
        options: ['session_start()', 'session_open_new()', 'start_cookie_session()'],
        correctIndex: 0,
      },
      {
        id: 'regenerate',
        text: 'Co je vhodné udělat s ID session po úspěšném přihlášení?',
        options: ['Obnovit jej', 'Vypsat jej do stránky', 'Poslat jej e-mailem'],
        correctIndex: 0,
      },
      {
        id: 'httponly',
        text: 'Který atribut cookie brání běžnému přístupu z JavaScriptu?',
        options: ['HttpOnly', 'Visible', 'ClientScript'],
        correctIndex: 0,
      },
    ]),
  },
  12: {
    title: 'Opakování: soubory a JSON',
    subtitle: 'Pět otázek z předchozí lekce před autentizací a autorizací.',
    visualKey: 'files-json-review',
    visualLabel: 'Převod dat mezi PHP, JSON a souborem',
    visualText: 'PHP data ↔ JSON text ↔ soubor',
    questions: distributeCorrectAnswers([
      {
        id: 'read-file',
        text: 'Která PHP funkce načte celý soubor jako řetězec?',
        options: ['file_get_contents', 'file_read_all_json', 'open_text_value'],
        correctIndex: 0,
      },
      {
        id: 'write-lock',
        text: 'Který příznak file_put_contents pomáhá zabránit souběžnému zápisu?',
        options: ['LOCK_EX', 'WRITE_SAFE', 'JSON_LOCK'],
        correctIndex: 0,
      },
      {
        id: 'encode',
        text: 'Která funkce převede PHP hodnotu na JSON text?',
        options: ['json_encode', 'json_decode', 'serialize_json_file'],
        correctIndex: 0,
      },
      {
        id: 'decode',
        text: 'Co vrátí json_decode($json, true) pro JSON objekt?',
        options: ['Asociativní pole', 'HTML tabulku', 'Souborový descriptor'],
        correctIndex: 0,
      },
      {
        id: 'pagination',
        text: 'K čemu slouží limit a offset při stránkování?',
        options: ['K výběru omezeného výřezu dat', 'K hashování hesla', 'K nastavení cookie'],
        correctIndex: 0,
      },
    ]),
  },
  13: {
    title: 'Opakování: autentizace a autorizace',
    subtitle: 'Pět otázek z předchozí lekce před architekturou MVC.',
    visualKey: 'authentication-review',
    visualLabel: 'Ověření identity a následná kontrola oprávnění',
    visualText: 'kdo jste? → co smíte?',
    questions: distributeCorrectAnswers([
      {
        id: 'authentication',
        text: 'Na jakou otázku odpovídá autentizace?',
        options: ['Kdo je uživatel?', 'Co smí uživatel udělat?', 'Jaké CSS používá stránka?'],
        correctIndex: 0,
      },
      {
        id: 'authorization',
        text: 'Na jakou otázku odpovídá autorizace?',
        options: ['Co smí ověřený uživatel udělat?', 'Jaké je jeho heslo?', 'Kde je DNS server?'],
        correctIndex: 0,
      },
      {
        id: 'hash',
        text: 'Která PHP funkce vytvoří bezpečný hash hesla?',
        options: ['password_hash', 'md5_for_login', 'encrypt_password_text'],
        correctIndex: 0,
      },
      {
        id: 'verify',
        text: 'Která PHP funkce ověří heslo proti uloženému hashi?',
        options: ['password_verify', 'password_decode', 'hash_equals_plaintext'],
        correctIndex: 0,
      },
      {
        id: 'login-session',
        text: 'Co je vhodné provést s ID session po přihlášení?',
        options: ['Regenerovat jej', 'Zobrazit jej v URL', 'Uložit heslo do cookie'],
        correctIndex: 0,
      },
    ]),
  },
});

export function getReviewQuiz(lessonNumber) {
  return reviewQuizzes[lessonNumber];
}

export default function PreviousLectureQuiz({ lessonNumber }) {
  const quiz = getReviewQuiz(lessonNumber);
  if (!quiz) return null;

  return (
    <KnowledgeCheck
      title={quiz.title}
      subtitle={quiz.subtitle}
      questions={quiz.questions}
      resultMessage={quiz.resultMessage}
      visual={
        <div role="img" aria-label={quiz.visualLabel} data-quiz-visual={quiz.visualKey}>
          <strong>{quiz.visualText}</strong>
        </div>
      }
    />
  );
}
