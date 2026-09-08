import React, { useMemo, useState } from 'react';
import { getLessonByNumber } from './src/config/lessons.js';
import LessonShell, { useSlideNavigation } from './src/components/lesson/LessonShell.jsx';
import SharedSlideCard from './src/components/lesson/SlideCard.jsx';
import Code from './src/components/lesson/Code.jsx';
import InfoBox from './src/components/lesson/InfoBox.jsx';
import ClickToRevealSolution from './src/components/lesson/ClickToRevealSolution.jsx';
import { clsx } from './src/components/lesson/classNames.js';

function LessonSlideContent({ slide }) {
  return (
    <SharedSlideCard slide={slide} idPrefix="lesson-10">
      {slide.id === 'title' && (
        <div className="mt-2 text-zinc-600 dark:text-zinc-400">
          <div>Autor: Bc. Egor Ulianov</div>
          <div>Datum: 26. 11. 2025</div>
        </div>
      )}

      {slide.id === 'toc' && <TableOfContents />}
      {slide.id === 'theory-basics' && <TheoryBasics />}
      {slide.id === 'theory-cookies-api' && <TheoryCookiesAPI />}
      {slide.id === 'theory-session-lifecycle' && <TheorySessionLifecycle />}
      {slide.id === 'theory-security' && <TheorySecurity />}
      {slide.id === 'theory-examples' && <TheoryExamples />}

      {slide.id === 'tasks' && <Tasks />}
      {slide.id === 'summary' && <SummarySlide />}
    </SharedSlideCard>
  );
}

function TableOfContents() {
  return (
    <ul className="list-disc pl-6 space-y-2 text-lg">
      <li>1 – Co jsou cookies a session, superglobály</li>
      <li>
        2 – Cookies API v PHP: <Code>setcookie()</Code>, atributy, mazání
      </li>
      <li>
        3 – Session: <Code>session_start()</Code>, ID, uložení, lifecycle
      </li>
      <li>4 – Bezpečnost: HttpOnly, Secure, SameSite, fixation, hijacking</li>
      <li>5 – Praktické vzory: login, flash zprávy, remember‑me</li>
      <li>6 – Úkoly s řešeními</li>
      <li>7 – Shrnutí a odkazy</li>
    </ul>
  );
}

function TheoryBasics() {
  return (
    <div className="space-y-4">
      <InfoBox>
        <div className="font-semibold mb-1">Cookies vs Session</div>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li>
            <strong>Cookies</strong>: malé kousky dat uložené u klienta (prohlížeči). Odesílají se s
            každým požadavkem na danou doménu/cestu.
          </li>
          <li>
            <strong>Session</strong>: server‑side per‑user úložiště. Klienta identifikuje session ID
            (typicky v cookie).
          </li>
          <li>
            V PHP přístup přes <Code>$_COOKIE</Code> a <Code>$_SESSION</Code> (po{' '}
            <Code>session_start()</Code>).
          </li>
        </ul>
      </InfoBox>
      <InfoBox>
        <div className="font-semibold mb-1">Cookie atributy – přehled</div>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li>
            <Code>Expires</Code>/<Code>Max-Age</Code> – životnost cookie (session cookie nemá
            expiraci → zaniká po zavření prohlížeče).
          </li>
          <li>
            <Code>Path</Code>/<Code>Domain</Code> – omezení, kdy se cookie posílá.
          </li>
          <li>
            <Code>Secure</Code> – pouze přes HTTPS.
          </li>
          <li>
            <Code>HttpOnly</Code> – není dostupná z JS (chrání před XSS krádeží).
          </li>
          <li>
            <Code>SameSite</Code> – <Code>Lax</Code>, <Code>Strict</Code>, <Code>None</Code>{' '}
            (vyžaduje zároveň <Code>Secure</Code>) – dopad na CSRF.
          </li>
          <li>Velikostní limity: cca do 4 kB na cookie; web by měl používat jen nutné cookies.</li>
        </ul>
      </InfoBox>
      <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm">
        <code className="language-php">{`<?php
// Superglobály
$theme = $_COOKIE['theme'] ?? 'light';
// Session až po session_start():
session_start();
$_SESSION['visited_at'] = time();`}</code>
      </pre>
      <div className="text-xs text-zinc-500">
        Dokumentace:{' '}
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
        </a>
      </div>
    </div>
  );
}

function TheoryCookiesAPI() {
  return (
    <div className="space-y-4">
      <InfoBox>
        <div className="font-semibold mb-1">Nastavení cookie v PHP</div>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li>
            Použijte <Code>setcookie(name, value, options)</Code> před jakýmkoli výstupem (odesláním
            HTTP hlaviček).
          </li>
          <li>
            Od PHP 7.3 preferujte pole <Code>options</Code> s klíči: <Code>expires</Code>,{' '}
            <Code>path</Code>, <Code>domain</Code>, <Code>secure</Code>, <Code>httponly</Code>,{' '}
            <Code>samesite</Code>.
          </li>
          <li>
            Mazání: nastavte expiraci do minulosti a případně stejné <Code>path</Code>/
            <Code>domain</Code>.
          </li>
        </ul>
      </InfoBox>
      <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm">
        <code className="language-php">{`<?php
// Nastavení cookie (7 dní), pouze HTTPS, HttpOnly, SameSite=Lax
setcookie('theme', 'dark', [
  'expires'  => time() + 7 * 24 * 60 * 60,
  'path'     => '/',
  'secure'   => true,
  'httponly' => true,
  'samesite' => 'Lax',
]);

// Čtení
$theme = $_COOKIE['theme'] ?? 'light';

// Smazání
setcookie('theme', '', [
  'expires' => time() - 3600,
  'path'    => '/',
]);`}</code>
      </pre>
      <div className="text-xs text-zinc-500">
        Reference:{' '}
        <a
          className="underline"
          href="https://www.php.net/setcookie"
          target="_blank"
          rel="noreferrer noopener"
        >
          setcookie
        </a>{' '}
        •{' '}
        <a
          className="underline"
          href="https://developer.mozilla.org/docs/Web/HTTP/Headers/Set-Cookie"
          target="_blank"
          rel="noreferrer noopener"
        >
          MDN Set-Cookie
        </a>
      </div>
    </div>
  );
}

function TheorySessionLifecycle() {
  return (
    <div className="space-y-4">
      <InfoBox>
        <div className="font-semibold mb-1">Jak funguje session v PHP</div>
        <ol className="list-decimal pl-6 space-y-1 text-sm">
          <li>Klient pošle požadavek. Server spustí skript.</li>
          <li>
            <Code>session_start()</Code> – načte existující session dle ID z cookie (typicky{' '}
            <Code>PHPSESSID</Code>) nebo vytvoří novou.
          </li>
          <li>
            Čtení/zápis přes <Code>$_SESSION</Code>. Data jsou uložena serverově (default: soubory,
            lze DB/Redis – session save handler).
          </li>
          <li>
            Na konci požadavku se session zapíše; klient dostane odpověď. Garbage collector občas
            maže expirované session.
          </li>
        </ol>
      </InfoBox>
      <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm">
        <code className="language-php">{`<?php
// session.php
ini_set('session.use_strict_mode', '1');
session_start();

if (!isset($_SESSION['counter'])) {
  $_SESSION['counter'] = 0;
}
$_SESSION['counter']++;
echo "Počet návštěv: " . (int)$_SESSION['counter'];`}</code>
      </pre>
      <InfoBox type="warning">
        <div className="font-semibold mb-1">Doporučení</div>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li>
            Po přihlášení proveďte <Code>session_regenerate_id(true)</Code> – ochrana před fixation.
          </li>
          <li>
            Nastavte cookie parametry pro session: <Code>session.cookie_secure=1</Code>,{' '}
            <Code>session.cookie_httponly=1</Code>, <Code>session.cookie_samesite=Lax</Code>.
          </li>
          <li>Hlavičky posílejte před výstupem; vyhněte se „headers already sent“.</li>
        </ul>
      </InfoBox>
      <div className="text-xs text-zinc-500">
        Reference:{' '}
        <a
          className="underline"
          href="https://www.php.net/session_start"
          target="_blank"
          rel="noreferrer noopener"
        >
          session_start
        </a>{' '}
        •{' '}
        <a
          className="underline"
          href="https://www.php.net/session.configuration"
          target="_blank"
          rel="noreferrer noopener"
        >
          session configuration
        </a>
      </div>
    </div>
  );
}

function TheorySecurity() {
  return (
    <div className="space-y-4">
      <InfoBox>
        <div className="font-semibold mb-1">Hrozby a mitigace</div>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li>
            <strong>Session fixation</strong>: útočník donutí oběť použít známé ID. Řešení:{' '}
            <Code>session_regenerate_id(true)</Code> po loginu,{' '}
            <Code>session.use_strict_mode=1</Code>.
          </li>
          <li>
            <strong>Session hijacking</strong>: krádež session ID (např. XSS). Řešení:{' '}
            <Code>HttpOnly</Code>, <Code>Secure</Code>, ochrana před XSS.
          </li>
          <li>
            <strong>CSRF</strong>: požadavek z jiné stránky se „sveze“ na session. Řešení:{' '}
            <strong>CSRF token</strong> vygenerovaný do session a ověřovaný ve formulářích.
          </li>
          <li>
            <strong>SameSite</strong>: <Code>Lax</Code> často stačí; <Code>Strict</Code> maximum;{' '}
            <Code>None</Code> pouze s <Code>Secure</Code> (třetí strany).
          </li>
          <li>
            <strong>Cookie prefix</strong>: <Code>__Host-</Code> (vyžaduje <Code>Secure</Code>,
            žádný <Code>Domain</Code>, <Code>Path=/</Code>); <Code>__Secure-</Code> (vyžaduje{' '}
            <Code>Secure</Code>).
          </li>
        </ul>
      </InfoBox>
      <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm">
        <code className="language-php">{`<?php
// Generování a ověřování CSRF
session_start();
if (empty($_SESSION['csrf'])) {
  $_SESSION['csrf'] = bin2hex(random_bytes(32));
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $ok = hash_equals($_SESSION['csrf'] ?? '', $_POST['csrf'] ?? '');
  if (!$ok) {
    http_response_code(400);
    exit('CSRF verification failed');
  }
  // ... zpracování POST ...
}`}</code>
      </pre>
      <div className="text-xs text-zinc-500">
        Čtěte:{' '}
        <a
          className="underline"
          href="https://owasp.org/www-community/attacks/csrf"
          target="_blank"
          rel="noreferrer noopener"
        >
          OWASP CSRF
        </a>{' '}
        •{' '}
        <a
          className="underline"
          href="https://owasp.org/www-community/attacks/Session_fixation"
          target="_blank"
          rel="noreferrer noopener"
        >
          OWASP Session Fixation
        </a>
      </div>
    </div>
  );
}

function TheoryExamples() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg bg-white/60 dark:bg-zinc-900/60 p-4">
          <div className="font-semibold mb-2 text-sm">Login flow + regenerace ID</div>
          <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-3 overflow-x-auto text-xs">
            <code className="language-php">{`<?php
// login.php
session_start();
// Příklad: uživatel ověřen (dummy)
if ($_POST['username'] === 'admin' && $_POST['password'] === 'secret') {
  session_regenerate_id(true);
  $_SESSION['user'] = ['name' => 'admin', 'role' => 'teacher'];
  header('Location: /dashboard.php');
  exit;
}
// ... formulář ...`}</code>
          </pre>
        </div>
        <div className="rounded-lg bg-white/60 dark:bg-zinc-900/60 p-4">
          <div className="font-semibold mb-2 text-sm">Flash zprávy (jednorázové)</div>
          <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-3 overflow-x-auto text-xs">
            <code className="language-php">{`<?php
// set_flash.php
session_start();
$_SESSION['flash'] = 'Uloženo!';
header('Location: /list.php');
exit;`}</code>
          </pre>
          <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-3 overflow-x-auto text-xs mt-2">
            <code className="language-php">{`<?php
// list.php
session_start();
$flash = $_SESSION['flash'] ?? null;
unset($_SESSION['flash']);
if ($flash) { echo "<div class='ok'>".htmlspecialchars($flash)."</div>"; }`}</code>
          </pre>
        </div>
      </div>
      <div className="rounded-lg bg-white/60 dark:bg-zinc-900/60 p-4">
        <div className="font-semibold mb-2 text-sm">Remember‑me token (bezpečně)</div>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li>
            Vytvořte náhodný token, uložte jeho hash do DB a plaintext do cookie s{' '}
            <Code>HttpOnly</Code>, <Code>Secure</Code>, <Code>SameSite=Lax</Code>.
          </li>
          <li>Na příští návštěvě ověřte hash a vytvořte novou session (rotate tokeny).</li>
        </ul>
        <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-3 overflow-x-auto text-xs">
          <code className="language-php">{`<?php
$token = bin2hex(random_bytes(32));
$hash  = hash('sha256', $token);
// db.store(user_id, hash, expires)
setcookie('__Host-remember', $token, [
  'expires'  => time() + 30*24*60*60,
  'path'     => '/',
  'secure'   => true,
  'httponly' => true,
  'samesite' => 'Lax',
]);`}</code>
        </pre>
      </div>
    </div>
  );
}

function Tasks() {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Zadání</h3>

      <section className="space-y-3">
        <h4 className="font-semibold">1) Nastavte cookie s tématem vzhledu</h4>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li>
            Vytvořte <Code>theme.php</Code>. Nastavte cookie <Code>theme=dark</Code> na 7 dní,{' '}
            <Code>Secure</Code>, <Code>HttpOnly</Code>, <Code>SameSite=Lax</Code>.
          </li>
          <li>
            Stránka má vypsat aktuální hodnotu <Code>$_COOKIE[&apos;theme&apos;]</Code>.
          </li>
        </ul>
        <ClickToRevealSolution hint="setcookie('theme','dark',[...]); echo $_COOKIE['theme'] ?? 'light';">
          <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm">
            <code className="language-php">{`<?php
setcookie('theme', 'dark', [
  'expires'  => time() + 7*24*60*60,
  'path'     => '/',
  'secure'   => true,
  'httponly' => true,
  'samesite' => 'Lax',
]);
echo htmlspecialchars($_COOKIE['theme'] ?? 'light');`}</code>
          </pre>
        </ClickToRevealSolution>
      </section>

      <section className="space-y-3">
        <h4 className="font-semibold">2) Počítadlo návštěv v session</h4>
        <ClickToRevealSolution hint="session_start(); $_SESSION['counter'] = ($_SESSION['counter'] ?? 0) + 1;">
          <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm">
            <code className="language-php">{`<?php
session_start();
$_SESSION['counter'] = (int)(($_SESSION['counter'] ?? 0) + 1);
echo $_SESSION['counter'];`}</code>
          </pre>
        </ClickToRevealSolution>
      </section>

      <section className="space-y-3">
        <h4 className="font-semibold">3) CSRF token pro formulář</h4>
        <ClickToRevealSolution hint="$_SESSION['csrf']=...; ve formuláři <input type=hidden name=csrf ...>; při POST ověřit hash_equals">
          <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm">
            <code className="language-php">{`<?php
session_start();
if (empty($_SESSION['csrf'])) {
  $_SESSION['csrf'] = bin2hex(random_bytes(32));
}
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  if (!hash_equals($_SESSION['csrf'] ?? '', $_POST['csrf'] ?? '')) {
    exit('CSRF!');
  }
  echo 'OK';
}`}</code>
          </pre>
        </ClickToRevealSolution>
      </section>

      <section className="space-y-3">
        <h4 className="font-semibold">4) Přihlášení s regenerací session ID</h4>
        <ClickToRevealSolution hint="Po validaci hesla zavolejte session_regenerate_id(true) a nastavte $_SESSION['user']">
          <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm">
            <code className="language-php">{`<?php
session_start();
if (($_POST['u'] ?? '') === 'admin' && ($_POST['p'] ?? '') === 'secret') {
  session_regenerate_id(true);
  $_SESSION['user'] = 'admin';
  echo 'OK';
} else {
  echo 'Bad credentials';
}`}</code>
          </pre>
        </ClickToRevealSolution>
      </section>

      <section className="space-y-3">
        <h4 className="font-semibold">5) Flash zpráva</h4>
        <ClickToRevealSolution hint="$_SESSION['flash']='...'; a na další stránce vypsat a unset">
          <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm">
            <code className="language-php">{`<?php
// set
session_start();
$_SESSION['flash'] = 'Hotovo';
header('Location: /');`}</code>
          </pre>
          <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm mt-2">
            <code className="language-php">{`<?php
// show
session_start();
$f = $_SESSION['flash'] ?? null;
unset($_SESSION['flash']);
if ($f) echo htmlspecialchars($f);`}</code>
          </pre>
        </ClickToRevealSolution>
      </section>

      <section className="space-y-3">
        <h4 className="font-semibold">6) Smazání cookie „theme“</h4>
        <ClickToRevealSolution hint="setcookie('theme','', ['expires'=>time()-3600,'path'=>'/'])">
          <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm">
            <code className="language-php">{`<?php
setcookie('theme', '', ['expires' => time() - 3600, 'path' => '/']);`}</code>
          </pre>
        </ClickToRevealSolution>
      </section>

      <section className="space-y-3">
        <h4 className="font-semibold">BONUS: Remember‑me cookie s hashem v DB</h4>
        <ClickToRevealSolution hint="hash(token) uložit do DB, plaintext do cookie __Host-remember">
          <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm">
            <code className="language-php">{`<?php
$t = bin2hex(random_bytes(32));
// db.save(user_id, hash('sha256',$t), expires)
setcookie('__Host-remember', $t, [
  'expires' => time() + 30*24*60*60,
  'path'    => '/',
  'secure'  => true,
  'httponly'=> true,
  'samesite'=> 'Lax',
]);`}</code>
          </pre>
        </ClickToRevealSolution>
      </section>
    </div>
  );
}

function SummarySlide() {
  return (
    <div className="space-y-3">
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>Cookies:</strong> malé klientské úložiště; používejte <Code>Secure</Code>,{' '}
          <Code>HttpOnly</Code>, <Code>SameSite</Code>.
        </li>
        <li>
          <strong>Session:</strong> <Code>session_start()</Code>, data na serveru, identifikace přes
          ID v cookie.
        </li>
        <li>
          <strong>Bezpečnost:</strong> regenerace ID po loginu, CSRF tokeny, XSS prevence.
        </li>
        <li>
          <strong>Vzory:</strong> login, flash, remember‑me s hashovaným tokenem.
        </li>
      </ul>
      <div className="text-xs text-zinc-500">
        Odkazy:{' '}
        <a
          className="underline"
          href="https://www.php.net/manual/en/"
          target="_blank"
          rel="noreferrer noopener"
        >
          php.net/manual
        </a>{' '}
        •{' '}
        <a
          className="underline"
          href="https://owasp.org/www-project-cheat-sheets/cheatsheets/Session_Management_Cheat_Sheet.html"
          target="_blank"
          rel="noreferrer noopener"
        >
          OWASP Session Management
        </a>
      </div>
      <p className="text-2xl font-bold text-center text-sky-600 dark:text-sky-400 mt-2">
        Děkuji za pozornost!
      </p>
    </div>
  );
}

export default function AppPhpLesson10() {
  const slides = useMemo(
    () => [
      {
        id: 'title',
        title: 'Základy webových aplikací – 10. cvičení',
        subtitle: 'Session a cookies v PHP',
      },
      { id: 'toc', title: 'Obsah' },
      { id: 'theory-basics', title: 'Teorie – Cookies vs Session, superglobály' },
      { id: 'theory-cookies-api', title: 'Teorie – Cookies API v PHP' },
      { id: 'theory-session-lifecycle', title: 'Teorie – Session lifecycle a konfigurace' },
      { id: 'theory-security', title: 'Teorie – Bezpečnost (HttpOnly, Secure, SameSite, CSRF)' },
      { id: 'theory-examples', title: 'Teorie – Praktické vzory (login, flash, remember‑me)' },
      { id: 'tasks', title: 'Úkoly' },
      { id: 'summary', title: 'Shrnutí a odkazy' },
    ],
    [],
  );
  const { activeSlide, setActiveSlide } = useSlideNavigation(slides);
  const current = slides.find((s) => s.id === activeSlide) || slides[0];

  return (
    <LessonShell
      lesson={getLessonByNumber(10)}
      slides={slides}
      activeSlide={activeSlide}
      onChange={setActiveSlide}
      title="ZWA-10: Session a cookies v PHP"
      subtitle="Interaktivní prezentace o cookies, session a bezpečnosti"
      footerText="© 2025 ZWA – Cvičení 10: Session a cookies"
    >
      <LessonSlideContent slide={current} />
    </LessonShell>
  );
}
