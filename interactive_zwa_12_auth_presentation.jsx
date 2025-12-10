import React, { useMemo, useState } from "react";
import { Analytics } from "@vercel/analytics/react";

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

function InfoBox({ children, type = "info" }) {
  const color =
    type === "info"
      ? "bg-sky-50/80 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800"
      : "bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800";
  return <div className={clsx("rounded-xl border p-4 text-sm", color)}>{children}</div>;
}

function ClickToRevealSolution({ children, hint }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 p-6">
      {!revealed ? (
        <div className="text-center">
          <div className="text-4xl mb-2">🔒</div>
          <h4 className="font-semibold text-lg mb-2">Řešení je zamčené</h4>
          {hint && <div className="text-xs text-zinc-500 mb-3">{hint}</div>}
          <button
            className="px-6 py-3 rounded-lg bg-sky-600 text-white font-medium hover:bg-sky-700 transition-all active:scale-95"
            onClick={() => setRevealed(true)}
          >
            Zobrazit řešení
          </button>
        </div>
      ) : (
        <div>{children}</div>
      )}
    </div>
  );
}

function SlideCard({ slide }) {
  return (
    <div className="p-6 rounded-2xl shadow-lg bg-white/70 dark:bg-zinc-900/60 backdrop-blur border border-zinc-200/60 dark:border-zinc-800">
      <h2 className="text-3xl font-bold mb-3">{slide.title}</h2>
      {slide.subtitle && <p className="text-xl text-sky-600 dark:text-sky-400 mb-4">{slide.subtitle}</p>}

      {slide.id === "title" && (
        <div className="mt-2 text-zinc-600 dark:text-zinc-400">
          <div>Autor: Bc. Egor Ulianov</div>
          <div>Datum: 11. 12. 2025</div>
        </div>
      )}

      {slide.id === "toc" && <TableOfContents />}
      {slide.id === "theory-terms" && <TheoryTerms />}
      {slide.id === "theory-methods" && <TheoryMethods />}
      {slide.id === "theory-passwords" && <TheoryPasswords />}
      {slide.id === "theory-http-auth" && <TheoryHttpAuth />}
      {slide.id === "theory-login-session" && <TheoryLoginSession />}
      {slide.id === "theory-security" && <TheorySecurity />}

      {slide.id === "tasks" && <Tasks />}
      {slide.id === "summary" && <SummarySlide />}
    </div>
  );
}

function TableOfContents() {
  return (
    <ul className="list-disc pl-6 space-y-2 text-lg">
      <li>1 – Pojmy: Autentikace vs Autorizace</li>
      <li>2 – Způsoby přihlášení: hesla, OTP, tokeny, SSO, biometrie, MFA</li>
      <li>3 – Ukládání hesel: hash, sůl</li>
      <li>4 – HTTP Basic/Digest autentizace</li>
      <li>5 – Přihlášení přes formulář + session</li>
      <li>6 – Bezpečnost: CSRF, fixation, hijacking</li>
      <li>7 – Úkoly a domácí úkol</li>
      <li>8 – Shrnutí a odkazy</li>
    </ul>
  );
}

function TheoryTerms() {
  return (
    <div className="space-y-4">
      <InfoBox>
        <div className="font-semibold mb-1">Jaký je rozdíl?</div>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li><strong>Autentikace</strong> – ověření identity uživatele (kdo jsi?).</li>
          <li><strong>Autorizace</strong> – kontrola oprávnění (co smíš dělat?).</li>
        </ul>
      </InfoBox>
    </div>
  );
}

function TheoryMethods() {
  return (
    <div className="space-y-4">
      <InfoBox>
        <div className="font-semibold mb-1">Způsoby autentikace</div>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li><strong>Heslo</strong> – klasika; vždy přes HTTPS, nikdy neukládat plaintext.</li>
          <li><strong>OTP</strong> – jednorázový kód (e‑mail, TOTP, SMS).</li>
          <li><strong>Token</strong> – přenáší se v hlavičkách (např. Bearer), server ověřuje.</li>
          <li><strong>SSO</strong> – centrální poskytovatel identity (OAuth/OIDC).</li>
          <li><strong>Biometrie</strong> – otisk, obličej; často jako faktor navíc.</li>
          <li><strong>MFA</strong> – kombinace více faktorů (něco znám, mám, jsem).</li>
          <li><strong>Bezheslové</strong> – druh MFA, např. magic link, WebAuthn.</li>
        </ul>
      </InfoBox>
    </div>
  );
}

function TheoryPasswords() {
  return (
    <div className="space-y-4">
      <InfoBox>
        <div className="font-semibold mb-1">Ukládání hesel</div>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li>Nikdy neukládejte heslo v přímé podobě. Ukládejte <strong>hash</strong> (s vhodným algoritmem – např. <Code>password_hash</Code> v PHP).</li>
          <li><strong>Solení</strong>: do hesla se před hashováním přidá unikátní sůl – zamezí srovnání stejných hesel podle hashe.</li>
          <li>Ideál: server heslo nezná, zná pouze jeho otisk; přenos vždy přes HTTPS.</li>
        </ul>
      </InfoBox>
      <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm">
<code className="language-php">{`<?php
// Hashování a ověřování hesla
$hash = password_hash('secret', PASSWORD_DEFAULT);
if (password_verify($_POST['password'] ?? '', $hash)) {
  echo 'OK';
} else {
  echo 'Bad';
}`}</code>
      </pre>
      <div className="text-xs text-zinc-500">
        Inspirace: lekce a slidy k ZWA‑12.
      </div>
    </div>
  );
}

function TheoryHttpAuth() {
  return (
    <div className="space-y-4">
      <InfoBox>
        <div className="font-semibold mb-1">Autentizace v HTTP: Basic a Digest</div>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li><strong>Basic</strong>: přenos jména a hesla base64 – nutné HTTPS.</li>
          <li><strong>Digest</strong>: challenge‑response přes MD5 (nonce, cnonce, qop...).</li>
          <li>Oba režimy vyžadují správné nastavení serveru a hlaviček.</li>
        </ul>
      </InfoBox>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg bg-white/60 dark:bg-zinc-900/60 p-4">
          <div className="font-semibold mb-2 text-sm">Basic v PHP</div>
          <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-3 overflow-x-auto text-xs">
<code className="language-php">{`<?php
if (
  isset($_SERVER['PHP_AUTH_USER'], $_SERVER['PHP_AUTH_PW']) &&
  $_SERVER['PHP_AUTH_USER'] === 'uzivatel' &&
  $_SERVER['PHP_AUTH_PW'] === '1234'
) {
  echo 'Prihlaseni probehlo uspesne';
} else {
  header('HTTP/1.0 401 Unauthorized');
  header('WWW-Authenticate: Basic realm="Login"');
  echo 'Chyba prihlaseni';
  exit;
}`}</code>
          </pre>
        </div>
        <div className="rounded-lg bg-white/60 dark:bg-zinc-900/60 p-4">
          <div className="font-semibold mb-2 text-sm">Digest – princip (ukázka)</div>
          <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-3 overflow-x-auto text-xs">
<code className="language-php">{`<?php
$realm = 'Restricted area';
$users = ['xklima' => 'martin', 'guest' => 'guest'];
if (empty($_SERVER['PHP_AUTH_DIGEST'])) {
  header('HTTP/1.1 401 Unauthorized');
  header('WWW-Authenticate: Digest realm="'. $realm .'",qop="auth",nonce="'. uniqid() .'",opaque="'. md5($realm) .'"');
  die('Cancel');
}
// ... http_digest_parse(...) a ověření MD5(A1:nonce:...:A2) dle slidu ...
?>`}</code>
          </pre>
          <div className="text-xs text-zinc-500">Detailní ukázka viz odkaz na slidy (Digest v PHP).</div>
        </div>
      </div>
      <div className="text-xs text-zinc-500">
        Reference:{" "}
        <a className="underline" href="https://cw.fel.cvut.cz/wiki/_media/courses/b6b39zwa/lectures/10a/autentizace_a_autorizace_2020.pdf" target="_blank" rel="noreferrer noopener">Autentizace a autorizace – slidy</a>
      </div>
    </div>
  );
}

function TheoryLoginSession() {
  return (
    <div className="space-y-4">
      <InfoBox>
        <div className="font-semibold mb-1">Přihlášení přes formulář + session</div>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li>Formulář (POST) → ověření <Code>password_verify</Code> → uložení identity do <Code>$_SESSION</Code>.</li>
          <li>Po loginu proveďte <Code>session_regenerate_id(true)</Code> (ochrana před fixation).</li>
          <li>Chraňte přístup k chráněným stránkám kontrolou přihlášení v každém skriptu.</li>
        </ul>
      </InfoBox>
      <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm">
<code className="language-php">{`<?php
// login.php
session_start();
$hashFromDb = password_hash('secret', PASSWORD_DEFAULT); // demo
if (($_POST['username'] ?? '') && password_verify($_POST['password'] ?? '', $hashFromDb)) {
  session_regenerate_id(true);
  $_SESSION['user'] = ['name' => $_POST['username'], 'role' => 'user'];
  header('Location: /dashboard.php');
  exit;
}
?>`}</code>
      </pre>
    </div>
  );
}

function TheorySecurity() {
  return (
    <div className="space-y-4">
      <InfoBox type="warning">
        <div className="font-semibold mb-1">Bezpečnostní témata</div>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li><strong>CSRF</strong> – chraňte formuláře jednorázovým tokenem v session a <Code>hash_equals</Code>.</li>
          <li><strong>Session fixation</strong> – regenerujte ID po loginu, povolte <Code>session.use_strict_mode=1</Code>.</li>
          <li><strong>Session hijacking</strong> – <Code>HttpOnly</Code>, <Code>Secure</Code>, <Code>SameSite</Code>, ochrana proti XSS.</li>
        </ul>
      </InfoBox>
      <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm">
<code className="language-php">{`<?php
// CSRF token – generování a ověření
session_start();
if (empty($_SESSION['csrf'])) {
  $_SESSION['csrf'] = bin2hex(random_bytes(32));
}
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  if (!hash_equals($_SESSION['csrf'] ?? '', $_POST['csrf'] ?? '')) {
    http_response_code(400);
    exit('CSRF verification failed');
  }
  // ... zpracování POST ...
}`}</code>
      </pre>
      <div className="text-xs text-zinc-500">
        Čtěte:{" "}
        <a className="underline" href="https://cw.fel.cvut.cz/wiki/courses/b6b39zwa/tutorials/12/start" target="_blank" rel="noreferrer noopener">Cvičení 12 – zadání</a>
      </div>
    </div>
  );
}

function Tasks() {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Zadání</h3>

      <section className="space-y-3">
        <h4 className="font-semibold">1) Přihlašovací formulář</h4>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li>Vytvořte jednoduchou stránku s formulářem (username + <Code>input type="password"</Code>).</li>
          <li>Po odeslání v PHP ověřte přes <Code>password_hash</Code>/<Code>password_verify</Code> oproti uložené hodnotě.</li>
        </ul>
        <ClickToRevealSolution hint="password_hash(...); password_verify($_POST['password'], $hash);">
          <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm">
<code className="language-php">{`<?php
$hash = password_hash('secret', PASSWORD_DEFAULT);
if (password_verify($_POST['password'] ?? '', $hash)) {
  echo 'OK';
} else {
  echo 'Bad';
}`}</code>
          </pre>
        </ClickToRevealSolution>
      </section>

      <section className="space-y-3">
        <h4 className="font-semibold">2) Sezení a ochrana</h4>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li>Po úspěšném přihlášení nastavte <Code>$_SESSION['user']</Code> a proveďte <Code>session_regenerate_id(true)</Code>.</li>
          <li>Zobrazte chráněnou stránku pouze přihlášeným; jinak přesměrujte na login.</li>
        </ul>
        <ClickToRevealSolution hint="session_start(); session_regenerate_id(true); $_SESSION['user']=...;">
          <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm">
<code className="language-php">{`<?php
session_start();
if (!isset($_SESSION['user'])) {
  header('Location: /login.php'); exit;
}
echo 'Vítejte, ' . htmlspecialchars($_SESSION['user']['name'] ?? '');`}</code>
          </pre>
        </ClickToRevealSolution>
      </section>

      <section className="space-y-3">
        <h4 className="font-semibold">3) Odhlášení</h4>
        <ClickToRevealSolution hint="unset($_SESSION['user']); session_destroy(); smazání session cookie dle potřeby">
          <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm">
<code className="language-php">{`<?php
session_start();
$_SESSION = [];
session_destroy();
header('Location: /login.php');`}</code>
          </pre>
        </ClickToRevealSolution>
      </section>

      <section className="space-y-3">
        <h4 className="font-semibold">Domácí úkol: CSRF</h4>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li>Přidejte do formulářů CSRF tokeny – generované a ověřované v session.</li>
        </ul>
      </section>

      <div className="text-xs text-zinc-500">
        Materiál vychází z:{" "}
        <a className="underline" href="file:///Users/egorulanov/Work/ZWA/ZWA-2-0/ZWA-12.pdf" target="_blank" rel="noreferrer noopener">ZWA‑12 PDF</a>{" "}
        • <a className="underline" href="https://cw.fel.cvut.cz/wiki/_media/courses/b6b39zwa/lectures/10a/autentizace_a_autorizace_2020.pdf" target="_blank" rel="noreferrer noopener">Autentizace a autorizace – slidy</a>{" "}
        • <a className="underline" href="https://cw.fel.cvut.cz/wiki/courses/b6b39zwa/tutorials/12/start" target="_blank" rel="noreferrer noopener">Cvičení 12 – zadání</a>
      </div>
    </div>
  );
}

function SummarySlide() {
  return (
    <div className="space-y-3">
      <ul className="list-disc pl-6 space-y-2">
        <li><strong>Pojmy:</strong> autentikace (kdo jsem), autorizace (co smím).</li>
        <li><strong>Metody:</strong> hesla, OTP, tokeny, SSO, biometrie, MFA.</li>
        <li><strong>Hesla:</strong> hashování se solí, nikdy plaintext.</li>
        <li><strong>HTTP auth:</strong> Basic/Digest – vždy řešit HTTPS a konfiguraci.</li>
        <li><strong>Session:</strong> login přes formulář, <Code>session_regenerate_id</Code>, ochrana proti CSRF.</li>
      </ul>
      <div className="text-xs text-zinc-500">
        Odkazy:{" "}
        <a className="underline" href="file:///Users/egorulanov/Work/ZWA/ZWA-2-0/ZWA-12.pdf" target="_blank" rel="noreferrer noopener">ZWA‑12 PDF</a>{" "}
        • <a className="underline" href="https://cw.fel.cvut.cz/wiki/_media/courses/b6b39zwa/lectures/10a/autentizace_a_autorizace_2020.pdf" target="_blank" rel="noreferrer noopener">Slidy (Basic/Digest)</a>{" "}
        • <a className="underline" href="https://cw.fel.cvut.cz/wiki/courses/b6b39zwa/tutorials/12/start" target="_blank" rel="noreferrer noopener">Cvičení 12</a>
      </div>
      <p className="text-2xl font-bold text-center text-sky-600 dark:text-sky-400 mt-2">Děkuji za pozornost!</p>
    </div>
  );
}

export default function AppPhpLesson12() {
  const [active, setActive] = useState("title");
  const slides = useMemo(
    () => [
      { id: "title", title: "Základy webových aplikací – 12. cvičení", subtitle: "Autentizace a autorizace v PHP" },
      { id: "toc", title: "Obsah" },
      { id: "theory-terms", title: "Teorie – Pojmy (authn vs authz)" },
      { id: "theory-methods", title: "Teorie – Způsoby autentikace" },
      { id: "theory-passwords", title: "Teorie – Ukládání hesel" },
      { id: "theory-http-auth", title: "Teorie – HTTP Basic/Digest" },
      { id: "theory-login-session", title: "Teorie – Login přes formulář + session" },
      { id: "theory-security", title: "Teorie – Bezpečnost (CSRF, fixation, hijacking)" },
      { id: "tasks", title: "Úkoly" },
      { id: "summary", title: "Shrnutí a odkazy" },
    ],
    []
  );
  const current = slides.find((s) => s.id === active) || slides[0];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-zinc-50 to-sky-50 dark:from-zinc-950 dark:to-zinc-900 text-zinc-900 dark:text-zinc-50">
      <div className="max-w-6xl mx-auto p-4 md:p-8 relative">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
          <div className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-sky-300/40 dark:bg-sky-500/20 blur-3xl" />
          <div className="absolute top-1/3 -left-24 h-72 w-72 rounded-full bg-rose-300/40 dark:bg-rose-500/20 blur-3xl" />
        </div>

        <header className="mb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">ZWA-12: Autentizace a autorizace</h1>
          <p className="text-sm text-zinc-500">Interaktivní prezentace podle cvičení 12</p>
        </header>

        <nav className="flex flex-wrap gap-2 mb-6">
          {slides.map((s) => (
            <button
              key={s.id}
              className={clsx(
                "px-3 py-1.5 rounded-full text-sm border transition-all",
                s.id === active
                  ? "bg-sky-600 text-white border-sky-600 shadow-lg"
                  : "bg-white/70 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-800"
              )}
              onClick={() => setActive(s.id)}
            >
              {s.title}
            </button>
          ))}
        </nav>

        <SlideCard slide={current} />

        <footer className="mt-8 text-sm text-zinc-500 text-center">© 2025 ZWA – Cvičení 12: Autentizace a autorizace</footer>
        <Analytics />
      </div>
    </div>
  );
}


