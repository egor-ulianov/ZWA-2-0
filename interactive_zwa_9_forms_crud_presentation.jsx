import React, { useMemo, useState } from 'react';
import mvcImg from './src/interactive-zwa-8/ssr-mvc.png';
import restImg from './src/interactive-zwa-8/resful.jpg';
import gloryImg from './src/interactive-zwa-8/gloryofrest.png';
import memeImg from './src/interactive-zwa-8/meme.png';
import { getLessonByNumber } from './src/config/lessons.js';
import LessonShell, { useSlideNavigation } from './src/components/lesson/LessonShell.jsx';
import SharedSlideCard from './src/components/lesson/SlideCard.jsx';
import Code from './src/components/lesson/Code.jsx';
import InfoBox from './src/components/lesson/InfoBox.jsx';
import ClickToRevealSolution from './src/components/lesson/ClickToRevealSolution.jsx';
import { clsx } from './src/components/lesson/classNames.js';

function LessonSlideContent({ slide }) {
  return (
    <SharedSlideCard slide={slide} idPrefix="lesson-forms-crud">
      {slide.id === 'title' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <img
              src={memeImg.src}
              alt="Funny meme"
              className="rounded-lg border border-zinc-200 dark:border-zinc-800"
            />
          </div>
          <div className="mt-2 text-zinc-600 dark:text-zinc-400">
            <div>Autor: Bc. Egor Ulianov</div>
            <div>Datum: 19. 11. 2025</div>
          </div>
        </div>
      )}

      {slide.id === 'toc' && (
        <ul className="list-disc pl-6 space-y-2 text-lg">
          <li>1 – Životní cyklus formuláře na serveru</li>
          <li>
            2 – GET vs POST, {`$_GET`}, {`$_POST`}, {`$_REQUEST`}
          </li>
          <li>3 – Radio vs Checkbox, názvy polí, {`name[]`}, multi-select</li>
          <li>4 – Validace vstupů a chybová hlášení</li>
          <li>5 – Předvyplnění hodnot a uložení do session</li>
          <li>6 – Seznam → detail → vytvoření/úprava → smazání (CRUD)</li>
          <li>7 – MVC/SSR a REST kontext</li>
          <li>8 – Zadání z tutoriálu + interaktivní řešení</li>
          <li>9 – Shrnutí a odkazy</li>
        </ul>
      )}

      {slide.id === 'theory-lifecycle' && <TheoryLifecycle />}
      {slide.id === 'theory-methods' && <TheoryMethods />}
      {slide.id === 'theory-inputs' && <TheoryInputs />}
      {slide.id === 'theory-validation' && <TheoryValidation />}
      {slide.id === 'theory-session' && <TheorySession />}
      {slide.id === 'theory-crud' && <TheoryCrud />}
      {slide.id === 'theory-arch' && <TheoryArchitecture />}
      {slide.id === 'rest-glory' && <GloryRestSlide />}

      {slide.id === 'tasks' && <TasksFromTutorial />}
      {slide.id === 'summary' && <SummarySlide />}
    </SharedSlideCard>
  );
}

function TheoryLifecycle() {
  return (
    <div className="space-y-4">
      <InfoBox>
        <div className="font-semibold mb-1">Životní cyklus formuláře (server-side)</div>
        <ol className="list-decimal pl-6 space-y-1 text-sm">
          <li>
            Uživatel navštíví stránku s formulářem (GET) – server vrátí HTML se vstupními poli.
          </li>
          <li>Uživatel odešle formulář – prohlížeč pošle data na server (GET nebo POST).</li>
          <li>Server zpracuje vstupy (validace, sanitizace), případně uloží (DB, soubory).</li>
          <li>Server pošle odpověď – obvykle opět HTML: buď se chybami, nebo s potvrzením.</li>
        </ol>
      </InfoBox>
      <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm">
        <code className="language-php">{`<?php
// form.php – formulář i jeho obsluha v jednom souboru
$errors = [];
$values = ['email' => '', 'interests' => []];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $values['email'] = trim($_POST['email'] ?? '');
  $values['interests'] = $_POST['interests'] ?? [];
  if (!filter_var($values['email'], FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = 'Neplatný e-mail';
  }
}
?>
<!doctype html>
<form method="post" action="form.php">
  <label>Email: <input name="email" value="<?= htmlspecialchars($values['email']) ?>"></label>
  <?php if (isset($errors['email'])): ?><div class="err"><?= $errors['email'] ?></div><?php endif; ?>
  <label><input type="checkbox" name="interests[]" value="web"
    <?= in_array('web', $values['interests']) ? 'checked' : '' ?>> Web</label>
  <button type="submit">Odeslat</button>
</form>`}</code>
      </pre>
    </div>
  );
}

function TheoryMethods() {
  const [method, setMethod] = useState('GET');
  return (
    <div className="space-y-4">
      <InfoBox>
        <div className="font-semibold mb-1">GET vs POST (interaktivně)</div>
        <div className="flex gap-2 mb-2">
          <button
            className={clsx(
              'px-3 py-1.5 rounded-lg text-sm border',
              method === 'GET'
                ? 'bg-sky-600 text-white border-sky-600'
                : 'bg-white/70 dark:bg-zinc-900/60',
            )}
            onClick={() => setMethod('GET')}
          >
            GET
          </button>
          <button
            className={clsx(
              'px-3 py-1.5 rounded-lg text-sm border',
              method === 'POST'
                ? 'bg-sky-600 text-white border-sky-600'
                : 'bg-white/70 dark:bg-zinc-900/60',
            )}
            onClick={() => setMethod('POST')}
          >
            POST
          </button>
        </div>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          {method === 'GET' ? (
            <>
              <li>Parametry v URL (viditelné), limit délky, vhodné pro prohlížení/filtry.</li>
              <li>
                Přístup přes <Code>$_GET</Code>. Bookmarkovatelné, ale citlivá data sem nepatří.
              </li>
            </>
          ) : (
            <>
              <li>Data v těle požadavku, nejsou vidět v URL. Vhodné pro mutace.</li>
              <li>
                Přístup přes <Code>$_POST</Code>. Bezpečnější pro citlivé údaje (stále nutná
                validace).
              </li>
            </>
          )}
          <li>
            Oboje je dostupné přes <Code>$_REQUEST</Code> – ale preferujte explicitně{' '}
            <Code>$_GET</Code>/<Code>$_POST</Code> kvůli přehlednosti.
          </li>
        </ul>
      </InfoBox>
      <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm">
        <code className="language-php">{`// Rozdíl zdůrazněn: 
$q = $_GET['q'] ?? null;   // vyhledávání
$csrf = $_POST['csrf'] ?? null; // token z POST
// $_REQUEST může namíchat hodnoty stejného jména z GET i POST – explicitnost je bezpečnější.`}</code>
      </pre>
      <InfoBox>
        <div className="font-semibold mb-1">Superglobály v PHP – přehled</div>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li>
            <Code>$_GET</Code> – parametry z URL dotazu.
          </li>
          <li>
            <Code>$_POST</Code> – data odeslaná v těle požadavku (formuláře, JSON u classic PHP
            obvykle přes <Code>php://input</Code>).
          </li>
          <li>
            <Code>$_REQUEST</Code> – mix <Code>$_GET</Code>, <Code>$_POST</Code> a{' '}
            <Code>$_COOKIE</Code> (nedoporučuje se kvůli kolizím jmen).
          </li>
          <li>
            <Code>$_SERVER</Code> – metadata požadavku a serveru (např. <Code>REQUEST_METHOD</Code>,{' '}
            <Code>HTTP_USER_AGENT</Code>).
          </li>
          <li>
            <Code>$_COOKIE</Code> – HTTP cookies od klienta.
          </li>
          <li>
            <Code>$_SESSION</Code> – per‑user serverové úložiště (po <Code>session_start()</Code>).
          </li>
          <li>
            <Code>$_FILES</Code> – informace o nahrávaných souborech (<Code>name</Code>,{' '}
            <Code>type</Code>, <Code>tmp_name</Code>, <Code>size</Code>, <Code>error</Code>).
          </li>
          <li>
            <Code>$_ENV</Code> – proměnné prostředí (dle konfigurace <Code>variables_order</Code>).
          </li>
        </ul>
      </InfoBox>
      <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm">
        <code className="language-php">{`// Ukázky čtení superglobálů:
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
$query = $_GET['q'] ?? null;
$csrf = $_POST['csrf'] ?? null;
$theme = $_COOKIE['theme'] ?? 'light';
session_start();
$_SESSION['last_visit'] = time();
if (!empty($_FILES['avatar']) && $_FILES['avatar']['error'] === UPLOAD_ERR_OK) {
  // move_uploaded_file($_FILES['avatar']['tmp_name'], '/path/avatar.png');
}`}</code>
      </pre>
      <div className="text-xs text-zinc-500">
        Dokumentace:{' '}
        <a
          className="underline"
          href="https://www.php.net/manual/en/reserved.variables.get.php"
          target="_blank"
          rel="noreferrer noopener"
        >
          $_GET
        </a>{' '}
        •{' '}
        <a
          className="underline"
          href="https://www.php.net/manual/en/reserved.variables.post.php"
          target="_blank"
          rel="noreferrer noopener"
        >
          $_POST
        </a>{' '}
        •{' '}
        <a
          className="underline"
          href="https://www.php.net/manual/en/reserved.variables.request.php"
          target="_blank"
          rel="noreferrer noopener"
        >
          $_REQUEST
        </a>{' '}
        •{' '}
        <a
          className="underline"
          href="https://www.php.net/manual/en/reserved.variables.server.php"
          target="_blank"
          rel="noreferrer noopener"
        >
          $_SERVER
        </a>{' '}
        •{' '}
        <a
          className="underline"
          href="https://www.php.net/manual/en/reserved.variables.cookies.php"
          target="_blank"
          rel="noreferrer noopener"
        >
          $_COOKIE
        </a>{' '}
        •{' '}
        <a
          className="underline"
          href="https://www.php.net/manual/en/reserved.variables.session.php"
          target="_blank"
          rel="noreferrer noopener"
        >
          $_SESSION
        </a>{' '}
        •{' '}
        <a
          className="underline"
          href="https://www.php.net/manual/en/reserved.variables.files.php"
          target="_blank"
          rel="noreferrer noopener"
        >
          $_FILES
        </a>{' '}
        •{' '}
        <a
          className="underline"
          href="https://www.php.net/manual/en/reserved.variables.environment.php"
          target="_blank"
          rel="noreferrer noopener"
        >
          $_ENV
        </a>
      </div>
    </div>
  );
}

function TheoryInputs() {
  return (
    <div className="space-y-4">
      <InfoBox>
        <div className="font-semibold mb-1">Radio vs Checkbox, pole a multi-select</div>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li>
            <strong>Radio:</strong> jen jedna hodnota v rámci stejného <Code>name</Code>.
          </li>
          <li>
            <strong>Checkbox:</strong> více nezávislých; pro posílání více hodnot do{' '}
            <Code>$_POST</Code> použijte <Code>name=&quot;interests[]&quot;</Code>.
          </li>
          <li>
            <strong>Multi-select:</strong> atribut <Code>multiple</Code> a{' '}
            <Code>name=&quot;favs[]&quot;</Code> – server obdrží pole.
          </li>
        </ul>
      </InfoBox>
      <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm">
        <code className="language-html">{`<!-- Radio (single) -->
<label><input type="radio" name="spam" value="none"> Žádný</label>
<label><input type="radio" name="spam" value="promo"> Promo</label>

<!-- Checkbox group (array) -->
<label><input type="checkbox" name="interests[]" value="music"> Hudba</label>
<label><input type="checkbox" name="interests[]" value="web"> Web</label>

<!-- Multi-select -->
<select name="subjects[]" multiple>
  <option value="ZWA">ZWA</option>
  <option value="PA1">PA1</option>
  <option value="OSY">OSY</option>
</select>`}</code>
      </pre>
      <InfoBox>
        <div className="font-semibold mb-1">Výpis pole rekurzivně</div>
        <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-xs">
          <code className="language-php">{`function printArrayRecursive(array $x, int $lvl = 0): void {
  foreach ($x as $k => $v) {
    echo str_repeat('&nbsp;&nbsp;', $lvl) . htmlspecialchars((string)$k) . ': ';
    if (is_array($v)) {
      echo "<br>";
      printArrayRecursive($v, $lvl + 1);
    } else {
      echo htmlspecialchars((string)$v) . "<br>";
    }
  }
}`}</code>
        </pre>
      </InfoBox>
    </div>
  );
}

function TheoryValidation() {
  return (
    <div className="space-y-4">
      <InfoBox>
        <div className="font-semibold mb-1">Validace a sanitizace – co je co</div>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li>
            <strong>Validace</strong> = ověření, že vstup má očekávaný tvar a hodnotu (např. platný
            e‑mail, délka 8–64, číslo &gt; 0).
          </li>
          <li>
            <strong>Sanitizace</strong> = úprava/čištění vstupu do bezpečné podoby (odstranění
            nebezpečných znaků, trim, normalizace).
          </li>
          <li>
            <strong>Escapování</strong> = bezpečný výstup do konkrétního kontextu (HTML, atribut,
            URL, JS, SQL pomocí parametrů).
          </li>
          <li>
            <strong>Normalizace</strong> = převod vstupu do jednotného formátu (např.
            diakritika/Unicode NFKC, lowerCase e‑mailu).
          </li>
        </ul>
      </InfoBox>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg bg-white/60 dark:bg-zinc-900/60 p-4">
          <div className="font-semibold mb-2 text-sm">Validace – příklady</div>
          <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-3 overflow-x-auto text-xs">
            <code className="language-php">{`$errors = [];
if (!filter_var($_POST['email'] ?? '', FILTER_VALIDATE_EMAIL)) {
  $errors['email'] = 'Zadejte platný e-mail.';
}
if (empty($_POST['interests'])) {
  $errors['interests'] = 'Vyberte alespoň jeden zájem.';
}
if (!($_POST['spam'] ?? null)) {
  $errors['spam'] = 'Vyberte typ spamu.';
}
$best = $_POST['best_subject'] ?? null;
$favs = $_POST['subjects'] ?? [];
if ($best && !in_array($best, $favs, true)) {
  $errors['best_subject'] = 'Nejlepší předmět musí být mezi oblíbenými.';
}`}</code>
          </pre>
        </div>
        <div className="rounded-lg bg-white/60 dark:bg-zinc-900/60 p-4">
          <div className="font-semibold mb-2 text-sm">Sanitizace a escapování</div>
          <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-3 overflow-x-auto text-xs">
            <code className="language-php">{`$name = trim($_POST['name'] ?? '');
$name = preg_replace('/\\s+/', ' ', $name);      // normalizace whitespace
$safeHtml = htmlspecialchars($name, ENT_QUOTES, 'UTF-8'); // escapování do HTML

$rawUrl = $_GET['next'] ?? '/';
$safeUrl = filter_var($rawUrl, FILTER_VALIDATE_URL) ? $rawUrl : '/'; // validace URL

// SQL – vždy používejte prepared statements (PDO):
$pdo = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$stmt = $pdo->prepare('INSERT INTO users(name, email) VALUES(?, ?)');
$stmt->execute([$name, $_POST['email'] ?? '']);`}</code>
          </pre>
        </div>
      </div>
      <InfoBox>
        <div className="font-semibold mb-1">Whitelist &gt; blacklist</div>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li>
            Preferujte <strong>whitelist</strong> – definujte povolené znaky/hodnoty; blacklisty lze
            obejít.
          </li>
          <li>
            Rozlišujte <strong>kontexty escapování</strong>: HTML text, HTML atribut, URL, CSS,
            JavaScript.
          </li>
          <li>
            Bezpečnostní témata související s validací: XSS, SQLi, CSRF (tokeny ve formulářích),
            SSRF při práci s URL.
          </li>
        </ul>
      </InfoBox>
      <div className="text-xs text-zinc-500">
        Reference:{' '}
        <a
          className="underline"
          href="https://www.php.net/manual/en/filter.filters.validate.php"
          target="_blank"
          rel="noreferrer noopener"
        >
          php.net/filter_validate
        </a>{' '}
        •{' '}
        <a
          className="underline"
          href="https://www.php.net/manual/en/function.htmlspecialchars.php"
          target="_blank"
          rel="noreferrer noopener"
        >
          htmlspecialchars
        </a>{' '}
        •{' '}
        <a
          className="underline"
          href="https://www.php.net/manual/en/pdo.prepared-statements.php"
          target="_blank"
          rel="noreferrer noopener"
        >
          PDO prepared statements
        </a>
      </div>
    </div>
  );
}

function TheorySession() {
  return (
    <div className="space-y-4">
      <InfoBox type="info">
        <div className="font-semibold mb-1">Uložení posledního odeslání do session (BONUS)</div>
        <p className="text-sm">
          Pro zobrazení dat při pozdější návštěvě použijte {`$_SESSION`} – jednoduché per-user
          úložiště na serveru.
        </p>
      </InfoBox>
      <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm">
        <code className="language-php">{`session_start();
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $_SESSION['last_form'] = $_POST;
}
$last = $_SESSION['last_form'] ?? null;`}</code>
      </pre>
      <div className="text-xs text-zinc-500">
        Reference:{' '}
        <a
          className="underline"
          href="https://www.php.net/manual/en/reserved.variables.session.php"
          target="_blank"
          rel="noreferrer noopener"
        >
          php.net/$_SESSION
        </a>
      </div>
    </div>
  );
}

function TheoryCrud() {
  return (
    <div className="space-y-4">
      <InfoBox>
        <div className="font-semibold mb-1">
          CRUD mini‑aplikace (seznam → detail → create/edit → delete)
        </div>
        <p className="text-sm">
          V čistém PHP často obsluhujeme jednoduchým routerem podle parametru <Code>action</Code> a
          ID. Níže ukázka bez DB (soubor/array).
        </p>
      </InfoBox>
      <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm">
        <code className="language-php">{`// index.php
session_start();
require __DIR__.'/storage.php'; // jednoduché úložiště v souboru JSON

$action = $_GET['action'] ?? 'list';
$id = (int)($_GET['id'] ?? 0);
switch ($action) {
  case 'list':
    $items = load_all();
    include __DIR__.'/views/list.php';
    break;
  case 'detail':
    $item = load_one($id);
    include __DIR__.'/views/detail.php';
    break;
  case 'create':
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
      $data = ['title' => trim($_POST['title'] ?? '')];
      if ($data['title'] === '') { $error = 'Title required'; }
      if (empty($error)) { create_item($data); header('Location: ?action=list'); exit; }
    }
    include __DIR__.'/views/form.php';
    break;
  case 'edit':
    $item = load_one($id);
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
      $data = ['title' => trim($_POST['title'] ?? '')];
      if ($data['title'] === '') { $error = 'Title required'; }
      if (empty($error)) { update_item($id, $data); header('Location: ?action=detail&id='.$id); exit; }
    }
    include __DIR__.'/views/form.php';
    break;
  case 'delete':
    if (($_POST['_method'] ?? '') === 'DELETE') {
      delete_item($id);
      header('Location: ?action=list'); exit;
    }
    include __DIR__.'/views/delete_confirm.php';
    break;
}`}</code>
      </pre>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg bg-white/60 dark:bg-zinc-900/60 p-4">
          <div className="font-semibold mb-2 text-sm">Formuláře – create/edit</div>
          <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-3 overflow-x-auto text-xs">
            <code className="language-php">{`<!-- views/form.php -->
<form method="post" action="">
  <label>Název: <input name="title" value="<?= htmlspecialchars($item['title'] ?? '') ?>"></label>
  <?php if (!empty($error)): ?><div class="err"><?= htmlspecialchars($error) ?></div><?php endif; ?>
  <button type="submit"><?= isset($item) ? 'Uložit' : 'Vytvořit' ?></button>
</form>`}</code>
          </pre>
        </div>
        <div className="rounded-lg bg-white/60 dark:bg-zinc-900/60 p-4">
          <div className="font-semibold mb-2 text-sm">Smazání s potvrzením</div>
          <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-3 overflow-x-auto text-xs">
            <code className="language-php">{`<!-- views/delete_confirm.php -->
<form method="post" onsubmit="return confirm('Opravdu smazat?')">
  <input type="hidden" name="_method" value="DELETE">
  <button type="submit" class="danger">Smazat</button>
  <a href="?action=detail&id=<?= (int)$_GET['id'] ?>">Zpět</a>
</form>`}</code>
          </pre>
        </div>
      </div>
      <InfoBox type="warning">
        <div className="font-semibold mb-1">Potvrzení smazání (BONUS)</div>
        <p className="text-sm">
          Na klientu lze použít <Code>confirm(&apos;Opravdu smazat?&apos;)</Code>, na serveru vždy
          znovu ověřte oprávnění.
        </p>
      </InfoBox>
      <div className="text-xs text-zinc-500">
        Poznámka: v produkci použijte CSRF tokeny, autentizaci/autorizaci a perzistenci v DB; pro
        metodu DELETE u HTML formulářů se běžně používá skrytý <Code>_method</Code> nebo čisté POST.
      </div>
    </div>
  );
}

function TheoryArchitecture() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <img
          src={mvcImg.src}
          alt="SSR/MVC schema"
          className="rounded-lg border border-zinc-200 dark:border-zinc-800"
        />
        <img
          src={restImg.src}
          alt="REST concept"
          className="rounded-lg border border-zinc-200 dark:border-zinc-800"
        />
      </div>
      <InfoBox>
        <div className="font-semibold mb-1">Kde se CRUD bere v architektuře</div>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li>
            <strong>SSR/MVC:</strong> PHP generuje HTML na základě požadavků. Controller čte vstupy,
            volá model, vrací view.
          </li>
          <li>
            <strong>REST:</strong> server poskytuje JSON API (GET/POST/PUT/DELETE) a frontend (např.
            JS) zobrazuje data.
          </li>
        </ul>
      </InfoBox>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg bg-white/60 dark:bg-zinc-900/60 p-4">
          <div className="font-semibold mb-2 text-sm">SSR/MVC – kdy a proč</div>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li>Rychlý první render, SEO přirozeně, jednoduché linky a formuláře.</li>
            <li>Menší JS bundle – výkon na slabších zařízeních.</li>
            <li>Skvělé pro obsahové a administrativní aplikace.</li>
          </ul>
          <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-3 overflow-x-auto text-xs">
            <code className="language-text">{`Model (data, DB) ←→ Controller (logika) ←→ View (HTML šablona)`}</code>
          </pre>
        </div>
        <div className="rounded-lg bg-white/60 dark:bg-zinc-900/60 p-4">
          <div className="font-semibold mb-2 text-sm">REST API – kdy a proč</div>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li>Oddělení klientů (web, mobil, integrace) od backendu.</li>
            <li>Kešování odpovědí, škálování, možnost verzování.</li>
            <li>Jasné mapování: zdroj → URL, operace → HTTP verb.</li>
          </ul>
          <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-3 overflow-x-auto text-xs">
            <code className="language-text">{`GET /articles       → list
POST /articles      → create
GET /articles/{id}  → detail
PUT /articles/{id}  → full update
PATCH /articles/{id}→ partial update
DELETE /articles/{id} → delete`}</code>
          </pre>
        </div>
      </div>
      <div className="text-xs text-zinc-500">
        Kurzová opora (cvičení 09):{' '}
        <a
          className="underline"
          href="https://cw.fel.cvut.cz/wiki/courses/b6b39zwa/tutorials/09/start"
          target="_blank"
          rel="noreferrer noopener"
        >
          Cvičení 09 – Obsluha formulářů, seznam, detail, CRUD
        </a>{' '}
        • Teorie REST:{' '}
        <a
          className="underline"
          href="https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm"
          target="_blank"
          rel="noreferrer noopener"
        >
          Roy Fielding – Dissertation (REST)
        </a>
      </div>
    </div>
  );
}

function GloryRestSlide() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <img
          src={gloryImg.src}
          alt="Glory of REST (Richardson Maturity Model)"
          className="rounded-lg border border-zinc-200 dark:border-zinc-800"
        />
        <div className="rounded-lg bg-white/60 dark:bg-zinc-900/60 p-4">
          <h4 className="font-semibold mb-2">Richardson Maturity Model (RMM)</h4>
          <ol className="list-decimal pl-6 space-y-1 text-sm">
            <li>
              <strong>Level 0 – POX</strong>: jedna URL, jeden endpoint, akce v těle (RPC‑like).
            </li>
            <li>
              <strong>Level 1 – Resources</strong>: více URL – každému zdroji vlastní adresa.
            </li>
            <li>
              <strong>Level 2 – HTTP verbs</strong>: semantické použití GET/POST/PUT/PATCH/DELETE,
              status kódy.
            </li>
            <li>
              <strong>Level 3 – Hypermedia (HATEOAS)</strong>: odpovědi obsahují odkazy a ovládací
              prvky pro další kroky.
            </li>
          </ol>
        </div>
      </div>
      <InfoBox>
        <div className="font-semibold mb-1">Proč mířit výš?</div>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li>
            <strong>Evolvovatelnost</strong>: klienty lze vést odpověďmi (linky), menší coupling.
          </li>
          <li>
            <strong>Kešovatelnost a škálování</strong>: sémantika metod a kódů umožňuje HTTP
            cache/proxy.
          </li>
          <li>
            <strong>Sebe‑popisnost</strong>: jasné kontrakty, snadnější debug a integrace.
          </li>
        </ul>
      </InfoBox>
      <div className="text-xs text-zinc-500">
        Čtěte:{' '}
        <a
          className="underline"
          href="https://martinfowler.com/articles/richardsonMaturityModel.html"
          target="_blank"
          rel="noreferrer noopener"
        >
          Martin Fowler – Richardson Maturity Model
        </a>
      </div>
    </div>
  );
}

function TasksFromTutorial() {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Zadání dle tutoriálu</h3>

      <section className="space-y-3">
        <h4 className="font-semibold">1) Úprava formuláře + otázky</h4>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li>
            Kam se odesílají data? Jaká hodnota se pošle zaškrtnutým/ nezaškrtnutým checkboxem?
          </li>
          <li>Rozdíl mezi metodami GET a POST; co je v {`$_REQUEST`} a kolize jmen.</li>
        </ul>
        <ClickToRevealSolution hint="action, method, name=..., value=..., checkbox posílá value jen když je zaškrtnutý">
          <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm">
            <code className="language-php">{`<form action="handle.php" method="post">
  <input type="checkbox" name="agree" value="1"> Souhlasím
</form>
<?php
// Checkbox posílá '1' pouze pokud je zaškrtnut. Jinak není klíč v $_POST vůbec přítomen.
// $_REQUEST kombinuje $_GET, $_POST a $_COOKIE – hrozí kolize jmen.
?>`}</code>
          </pre>
        </ClickToRevealSolution>
      </section>

      <section className="space-y-3">
        <h4 className="font-semibold">2) Spam – pouze jedna možnost (radio) + rekurze pro pole</h4>
        <ClickToRevealSolution hint="name='spam' pro všechny radio, funkce pro výpis pole viz dříve">
          <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm">
            <code className="language-html">{`<label><input type="radio" name="spam" value="promo"> Promo</label>
<label><input type="radio" name="spam" value="news"> Newsletter</label>`}</code>
          </pre>
        </ClickToRevealSolution>
      </section>

      <section className="space-y-3">
        <h4 className="font-semibold">3) Zájmy – posílat vybrané položky v jednom poli</h4>
        <ClickToRevealSolution hint="name='interests[]'">
          <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm">
            <code className="language-html">{`<input type="checkbox" name="interests[]" value="music"> Hudba
<input type="checkbox" name="interests[]" value="web"> Web`}</code>
          </pre>
        </ClickToRevealSolution>
      </section>

      <section className="space-y-3">
        <h4 className="font-semibold">4) Oblíbené předměty – multi‑select</h4>
        <ClickToRevealSolution hint="multiple + name='subjects[]'">
          <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm">
            <code className="language-html">{`<select name="subjects[]" multiple>
  <option value="ZWA">ZWA</option>
  <option value="PA1">PA1</option>
</select>`}</code>
          </pre>
        </ClickToRevealSolution>
      </section>

      <section className="space-y-3">
        <h4 className="font-semibold">Obsluha formuláře (validace)</h4>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li>Validujte e‑mail; vyžadujte alespoň jeden zájem a typ spamu.</li>
          <li>„Nejlepší předmět“ musí být i mezi oblíbenými.</li>
          <li>Při chybě zobrazte zprávy a předvyplňte hodnoty.</li>
        </ul>
        <ClickToRevealSolution hint="viz blok TheoryValidation + předvyplnění hodnot">
          <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm">
            <code className="language-php">{`$values = [
  'email' => $_POST['email'] ?? '',
  'interests' => $_POST['interests'] ?? [],
  'spam' => $_POST['spam'] ?? null,
  'subjects' => $_POST['subjects'] ?? [],
  'best_subject' => $_POST['best_subject'] ?? null,
];`}</code>
          </pre>
        </ClickToRevealSolution>
      </section>

      <section className="space-y-3">
        <h4 className="font-semibold">BONUS: potvrzení před smazáním + uložení do session</h4>
        <ClickToRevealSolution hint="confirm() + $_SESSION">
          <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm">
            <code className="language-html">{`<form method="post" action="delete.php" onsubmit="return confirm('Opravdu smazat?')">
  <input type="hidden" name="_method" value="DELETE">
  <button type="submit">Smazat</button>
</form>`}</code>
          </pre>
        </ClickToRevealSolution>
      </section>

      <div className="text-xs text-zinc-500">
        Zadání a kontext:{' '}
        <a
          className="underline"
          href="https://cw.fel.cvut.cz/wiki/courses/b6b39zwa/tutorials/09/start"
          target="_blank"
          rel="noreferrer noopener"
        >
          B6B39ZWA – Cvičení 09
        </a>
      </div>
    </div>
  );
}

function SummarySlide() {
  return (
    <div className="space-y-3">
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>Form lifecycle:</strong> GET formulář → POST zpracování → odpověď se stavem.
        </li>
        <li>
          <strong>GET vs POST:</strong> explicitně používejte {`$_GET`} a {`$_POST`} místo{' '}
          {`$_REQUEST`}.
        </li>
        <li>
          <strong>Inputs:</strong> radio (single), checkboxy a multi-select přes pole{' '}
          <Code>name[]</Code>.
        </li>
        <li>
          <strong>Validace:</strong> filtrujte, validujte a escapujte výstupy.
        </li>
        <li>
          <strong>Session:</strong> per-user stav (např. poslední odeslání).
        </li>
        <li>
          <strong>CRUD:</strong> list/detail/create/edit/delete; potvrzení mazání.
        </li>
      </ul>
      <div className="text-xs text-zinc-500">
        Odkazy:{' '}
        <a
          className="underline"
          href="https://cw.fel.cvut.cz/wiki/courses/b6b39zwa/tutorials/09/start"
          target="_blank"
          rel="noreferrer noopener"
        >
          Cvičení 09 – materiál
        </a>{' '}
        •{' '}
        <a
          className="underline"
          href="https://www.php.net/manual/en/"
          target="_blank"
          rel="noreferrer noopener"
        >
          php.net/manual
        </a>
      </div>
      <p className="text-2xl font-bold text-center text-sky-600 dark:text-sky-400 mt-2">
        Děkuji za pozornost!
      </p>
    </div>
  );
}

export default function AppPhpLesson9() {
  const slides = useMemo(
    () => [
      {
        id: 'title',
        title: 'Základy webových aplikací – 9. cvičení',
        subtitle: 'Obsluha formulářů, seznam, detail, CRUD',
      },
      { id: 'toc', title: 'Obsah' },
      { id: 'theory-lifecycle', title: 'Teorie – Životní cyklus formuláře' },
      { id: 'theory-methods', title: 'Teorie – Superglobály, GET vs POST, $_REQUEST' },
      { id: 'theory-inputs', title: 'Teorie – Radio/Checkbox, name[], multi-select' },
      { id: 'theory-validation', title: 'Teorie – Validace a sanitizace' },
      { id: 'theory-session', title: 'Teorie – Session (BONUS)' },
      { id: 'theory-crud', title: 'Teorie – Mini CRUD' },
      { id: 'theory-arch', title: 'Kontekst – SSR/MVC a REST' },
      { id: 'rest-glory', title: 'REST Maturity – Glory of REST' },
      { id: 'tasks', title: 'Úkoly dle tutoriálu' },
      { id: 'summary', title: 'Shrnutí a odkazy' },
    ],
    [],
  );
  const { activeSlide, setActiveSlide } = useSlideNavigation(slides);
  const current = slides.find((s) => s.id === activeSlide) || slides[0];

  return (
    <LessonShell
      lesson={getLessonByNumber(9)}
      slides={slides}
      activeSlide={activeSlide}
      onChange={setActiveSlide}
      title="ZWA-9: Server-side formuláře & CRUD"
      subtitle="Interaktivní prezentace podle cvičení 09 s ukázkami kódu"
      footerText="© 2025 ZWA – Cvičení 9: Formuláře a CRUD"
    >
      <LessonSlideContent slide={current} />
    </LessonShell>
  );
}
