import React, { useEffect, useMemo } from 'react';
import { getLessonByNumber } from './src/config/lessons.js';
import EditorialCallout from './src/course-ui/content/EditorialCallout.jsx';
import EditorialCode from './src/course-ui/content/EditorialCode.jsx';
import EditorialIllustration from './src/course-ui/content/EditorialIllustration.jsx';
import Code from './src/course-ui/content/InlineCode.jsx';
import LessonSummary from './src/course-ui/content/LessonSummary.jsx';
import StaticExercise from './src/course-ui/exercises/StaticExercise.jsx';
import { LearningExperience } from './src/course-ui/learning/LearningExperience.jsx';
import { LearningSection } from './src/course-ui/learning/LearningSection.jsx';
import { useLearningNavigation } from './src/course-ui/learning/useLearningNavigation.js';

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

function LessonSlideContent({ slide }) {
  return (
    <>
      {slide.id === 'title' && (
        <LessonSummary
          intro="Rozlišíme ověření identity od řízení oprávnění a sestavíme bezpečnější přihlašovací tok v PHP."
          items={[
            'Oddělíme autentizaci, autorizaci a správu identity.',
            'Porovnáme hesla, OTP, tokeny, SSO a vícefaktorové ověření.',
            'Uložíme hesla pomocí bezpečného hashe a soli.',
            'Propojíme přihlášení přes formulář se session a ochranou proti běžným útokům.',
          ]}
        />
      )}
      {slide.id === 'theory-terms' && <TheoryTerms />}
      {slide.id === 'theory-methods' && <TheoryMethods />}
      {slide.id === 'theory-passwords' && <TheoryPasswords />}
      {slide.id === 'theory-http-auth' && <TheoryHttpAuth />}
      {slide.id === 'theory-login-session' && <TheoryLoginSession />}
      {slide.id === 'theory-security' && <TheorySecurity />}

      {LESSON12_TASKS.some((task) => task.id === slide.id) && (
        <AuthTaskSlide task={LESSON12_TASKS.find((task) => task.id === slide.id)} />
      )}
      {slide.id === 'summary' && <SummarySlide />}
    </>
  );
}

function StaticLessonTask(props) {
  return <StaticExercise {...props} fileName="auth.php" language="php" />;
}

function TheoryTerms() {
  return (
    <div className="space-y-4">
      <InfoBox>
        <div className="font-semibold mb-1">Jaký je rozdíl?</div>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li>
            <strong>Autentikace</strong> – ověření identity uživatele (kdo jsi?).
          </li>
          <li>
            <strong>Autorizace</strong> – kontrola oprávnění (co smíš dělat?).
          </li>
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
          <li>
            <strong>Heslo</strong> – klasika; vždy přes HTTPS, nikdy neukládat plaintext.
          </li>
          <li>
            <strong>OTP</strong> – jednorázový kód (e‑mail, TOTP, SMS).
          </li>
          <li>
            <strong>Token</strong> – přenáší se v hlavičkách (např. Bearer), server ověřuje.
          </li>
          <li>
            <strong>SSO</strong> – centrální poskytovatel identity (OAuth/OIDC).
          </li>
          <li>
            <strong>Biometrie</strong> – otisk, obličej; často jako faktor navíc.
          </li>
          <li>
            <strong>MFA</strong> – kombinace více faktorů (něco znám, mám, jsem).
          </li>
          <li>
            <strong>Bezheslové</strong> – druh MFA, např. magic link, WebAuthn.
          </li>
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
          <li>
            Nikdy neukládejte heslo v přímé podobě. Ukládejte <strong>hash</strong> (s vhodným
            algoritmem – např. <Code>password_hash</Code> v PHP).
          </li>
          <li>
            <strong>Solení</strong>: do hesla se před hashováním přidá unikátní sůl – zamezí
            srovnání stejných hesel podle hashe.
          </li>
          <li>Ideál: server heslo nezná, zná pouze jeho otisk; přenos vždy přes HTTPS.</li>
        </ul>
      </InfoBox>
      <TheoryCodeBlock>
        <code className="language-php">{`<?php
// Hashování a ověřování hesla
$hash = password_hash('secret', PASSWORD_DEFAULT);
if (password_verify($_POST['password'] ?? '', $hash)) {
  echo 'OK';
} else {
  echo 'Bad';
}`}</code>
      </TheoryCodeBlock>
      <div className="text-xs text-zinc-500">Inspirace: lekce a slidy k ZWA‑12.</div>
    </div>
  );
}

function TheoryHttpAuth() {
  return (
    <div className="space-y-4">
      <InfoBox>
        <div className="font-semibold mb-1">Autentizace v HTTP: Basic a Digest</div>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li>
            <strong>Basic</strong>: přenos jména a hesla base64 – nutné HTTPS.
          </li>
          <li>
            <strong>Digest</strong>: challenge‑response přes MD5 (nonce, cnonce, qop...).
          </li>
          <li>Oba režimy vyžadují správné nastavení serveru a hlaviček.</li>
        </ul>
      </InfoBox>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg bg-white/60 dark:bg-zinc-900/60 p-4">
          <div className="font-semibold mb-2 text-sm">Basic v PHP</div>
          <TheoryCodeBlock>
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
          </TheoryCodeBlock>
        </div>
        <div className="rounded-lg bg-white/60 dark:bg-zinc-900/60 p-4">
          <div className="font-semibold mb-2 text-sm">Digest – princip (ukázka)</div>
          <TheoryCodeBlock>
            <code className="language-php">{`<?php
$realm = 'Restricted area';
$users = ['xklima' => 'martin', 'guest' => 'guest'];
if (empty($_SERVER['PHP_AUTH_DIGEST'])) {
  header('HTTP/1.1 401 Unauthorized');
  $nonce = bin2hex(random_bytes(16)); // nepředvídatelný jednorázový nonce
  header('WWW-Authenticate: Digest realm="'. $realm .'",qop="auth",nonce="'. $nonce .'",opaque="'. hash('sha256', $realm) .'"');
  die('Cancel');
}
// ... http_digest_parse(...) a ověření MD5(A1:nonce:...:A2) dle slidu ...
?>`}</code>
          </TheoryCodeBlock>
          <div className="text-xs text-zinc-500">
            Detailní ukázka viz odkaz na slidy (Digest v PHP).
          </div>
        </div>
      </div>
      <div className="text-xs text-zinc-500">
        Reference:{' '}
        <a
          className="underline"
          href="https://cw.fel.cvut.cz/wiki/_media/courses/b6b39zwa/lectures/10a/autentizace_a_autorizace_2020.pdf"
          target="_blank"
          rel="noreferrer noopener"
        >
          Autentizace a autorizace – slidy
        </a>
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
          <li>
            Formulář (POST) → ověření <Code>password_verify</Code> → uložení identity do{' '}
            <Code>$_SESSION</Code>.
          </li>
          <li>
            Po loginu proveďte <Code>session_regenerate_id(true)</Code> (ochrana před fixation).
          </li>
          <li>Chraňte přístup k chráněným stránkám kontrolou přihlášení v každém skriptu.</li>
        </ul>
      </InfoBox>
      <EditorialIllustration
        alt="Přihlašovací údaje projdou ověřením, vytvoří bezpečnou relaci a otevřou pouze povolený obsah."
        height={887}
        src="/course-art/editorial/authentication-flow.png"
        width={1774}
      />
      <TheoryCodeBlock>
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
      </TheoryCodeBlock>
    </div>
  );
}

function TheorySecurity() {
  return (
    <div className="space-y-4">
      <InfoBox type="warning">
        <div className="font-semibold mb-1">Bezpečnostní témata</div>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li>
            <strong>CSRF</strong> – chraňte formuláře jednorázovým tokenem v session a{' '}
            <Code>hash_equals</Code>.
          </li>
          <li>
            <strong>Session fixation</strong> – regenerujte ID po loginu, povolte{' '}
            <Code>session.use_strict_mode=1</Code>.
          </li>
          <li>
            <strong>Session hijacking</strong> – <Code>HttpOnly</Code>, <Code>Secure</Code>,{' '}
            <Code>SameSite</Code>, ochrana proti XSS.
          </li>
        </ul>
      </InfoBox>
      <TheoryCodeBlock>
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
      </TheoryCodeBlock>
      <div className="text-xs text-zinc-500">
        Čtěte:{' '}
        <a
          className="underline"
          href="https://cw.fel.cvut.cz/wiki/courses/b6b39zwa/tutorials/12/start"
          target="_blank"
          rel="noreferrer noopener"
        >
          Cvičení 12 – zadání
        </a>
      </div>
    </div>
  );
}

const LESSON12_TASKS = [
  {
    id: 'task1',
    title: 'Úkol 1: Přihlašovací formulář',
    task: 'Vytvořte přihlašovací formulář a ověřte heslo proti uloženému hashi.',
    draft: `<?php
$hash = password_hash('secret', PASSWORD_DEFAULT);
$password = $_POST['password'] ?? '';
$valid = password_verify($password, $hash);`,
    required: ['password_hash', 'password_verify', "$_POST['password']"],
    expected: 'Formulář předá heslo přes POST a server porovná jeho hash bez ukládání plaintextu.',
    solution: `<?php
$storedHash = password_hash('secret', PASSWORD_DEFAULT);
$username = trim($_POST['username'] ?? '');
$password = $_POST['password'] ?? '';
$errors = [];
if ($username === '') $errors[] = 'Zadejte uživatelské jméno.';
if (!password_verify($password, $storedHash)) $errors[] = 'Neplatné přihlašovací údaje.';
?>
<form method="post">
  <label>Uživatel <input name="username" required></label>
  <label>Heslo <input type="password" name="password" required></label>
  <button type="submit">Přihlásit</button>
</form>
<?php if ($errors): ?><p><?= htmlspecialchars($errors[0], ENT_QUOTES, 'UTF-8') ?></p><?php endif; ?>`,
  },
  {
    id: 'task2',
    title: 'Úkol 2: Sezení a ochrana',
    task: 'Po úspěšném přihlášení regenerujte ID session a chraňte stránku před anonymním přístupem.',
    draft: `<?php
session_start();
if ($valid) {
  session_regenerate_id(true);
  $_SESSION['user'] = $username;
}
if (!isset($_SESSION['user'])) header('Location: /login.php');`,
    required: ['session_start()', 'session_regenerate_id', "$_SESSION['user']", 'isset'],
    expected:
      'Session se po přihlášení zafixuje na novém ID a chráněný obsah uvidí jen přihlášený uživatel.',
    solution: `<?php
session_start();
$storedHash = password_hash('secret', PASSWORD_DEFAULT);
if ($_SERVER['REQUEST_METHOD'] === 'POST' && password_verify($_POST['password'] ?? '', $storedHash)) {
  session_regenerate_id(true);
  $_SESSION['user'] = ['name' => trim($_POST['username'] ?? '')];
  header('Location: /account.php');
  exit;
}
if (!isset($_SESSION['user'])) {
  header('Location: /login.php');
  exit;
}
echo 'Vítejte, ' . htmlspecialchars($_SESSION['user']['name'], ENT_QUOTES, 'UTF-8');`,
  },
  {
    id: 'task3',
    title: 'Úkol 3: Odhlášení',
    task: 'Implementujte odhlášení, které odstraní data session a přesměruje na přihlášení.',
    draft: `<?php
session_start();
$_SESSION = [];
session_destroy();
header('Location: /login.php');`,
    required: ['session_start()', '$_SESSION = []', 'session_destroy'],
    expected: 'Odhlášení odstraní session data a uživatel se vrátí na přihlašovací stránku.',
    solution: `<?php
session_start();
$_SESSION = [];
if (ini_get('session.use_cookies')) {
  $params = session_get_cookie_params();
  setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
}
session_destroy();
header('Location: /login.php');
exit;`,
  },
  {
    id: 'task4',
    title: 'Úkol 4: Domácí úkol: CSRF',
    task: 'Přidejte do formuláře CSRF token generovaný v session a ověřte jej při POST.',
    draft: `<?php
session_start();
$_SESSION['csrf'] = bin2hex(random_bytes(32));
if ($_SERVER['REQUEST_METHOD'] === 'POST' && !hash_equals($_SESSION['csrf'], $_POST['csrf'] ?? '')) {
  exit('CSRF');
}`,
    required: [
      'session_start()',
      'random_bytes',
      'hash_equals',
      "$_SESSION['csrf']",
      "$_POST['csrf']",
    ],
    expected: 'Server přijme pouze POST s tokenem, který odpovídá hodnotě uložené v session.',
    solution: `<?php
session_start();
if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(32));
if ($_SERVER['REQUEST_METHOD'] === 'POST' &&
    !hash_equals($_SESSION['csrf'], $_POST['csrf'] ?? '')) {
  http_response_code(400);
  exit('CSRF verification failed');
}
?>
<form method="post">
  <input type="hidden" name="csrf" value="<?= htmlspecialchars($_SESSION['csrf'], ENT_QUOTES, 'UTF-8') ?>">
  <button type="submit">Uložit</button>
</form>`,
  },
];

function AuthTaskSlide({ task }) {
  return <StaticLessonTask key={task.id} {...task} />;
}

function SummarySlide() {
  return (
    <div className="space-y-3">
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>Pojmy:</strong> autentikace (kdo jsem), autorizace (co smím).
        </li>
        <li>
          <strong>Metody:</strong> hesla, OTP, tokeny, SSO, biometrie, MFA.
        </li>
        <li>
          <strong>Hesla:</strong> hashování se solí, nikdy plaintext.
        </li>
        <li>
          <strong>HTTP auth:</strong> Basic/Digest – vždy řešit HTTPS a konfiguraci.
        </li>
        <li>
          <strong>Session:</strong> login přes formulář, <Code>session_regenerate_id</Code>, ochrana
          proti CSRF.
        </li>
      </ul>
      <div className="text-xs text-zinc-500">
        Odkazy:{' '}
        <a
          className="underline"
          href="https://cw.fel.cvut.cz/wiki/courses/b6b39zwa/tutorials/12/start"
          target="_blank"
          rel="noreferrer noopener"
        >
          Cvičení 12 – zadání
        </a>{' '}
        •{' '}
        <a
          className="underline"
          href="https://cw.fel.cvut.cz/wiki/_media/courses/b6b39zwa/lectures/10a/autentizace_a_autorizace_2020.pdf"
          target="_blank"
          rel="noreferrer noopener"
        >
          Slidy (Basic/Digest)
        </a>{' '}
        •{' '}
        <a
          className="underline"
          href="https://cw.fel.cvut.cz/wiki/courses/b6b39zwa/tutorials/12/start"
          target="_blank"
          rel="noreferrer noopener"
        >
          Cvičení 12
        </a>
      </div>
      <p className="text-2xl font-bold text-center text-sky-600 dark:text-sky-400 mt-2">
        Děkuji za pozornost!
      </p>
    </div>
  );
}

export default function AppPhpLesson12() {
  const legacyTasksRequested =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('slide') === 'tasks';
  const slides = useMemo(
    () => [
      {
        id: 'title',
        title: 'Základy webových aplikací – 12. cvičení',
        subtitle: 'Autentizace a autorizace v PHP',
        activityType: 'learn',
      },
      { id: 'theory-terms', title: 'Teorie – Pojmy (authn vs authz)', activityType: 'learn' },
      { id: 'theory-methods', title: 'Teorie – Způsoby autentikace', activityType: 'learn' },
      { id: 'theory-passwords', title: 'Teorie – Ukládání hesel', activityType: 'learn' },
      { id: 'theory-http-auth', title: 'Teorie – HTTP Basic/Digest', activityType: 'learn' },
      {
        id: 'theory-login-session',
        title: 'Teorie – Login přes formulář + session',
        activityType: 'learn',
      },
      {
        id: 'theory-security',
        title: 'Teorie – Bezpečnost (CSRF, fixation, hijacking)',
        activityType: 'learn',
      },
      ...LESSON12_TASKS.map(({ id, title }) => ({ id, title, activityType: 'apply' })),
      { id: 'summary', title: 'Shrnutí a odkazy', activityType: 'learn' },
    ],
    [],
  );
  const { activeSection, setActiveSection } = useLearningNavigation(slides);
  const current = slides.find((section) => section.id === activeSection) || slides[0];

  useEffect(() => {
    if (legacyTasksRequested) setActiveSection('task1');
  }, [legacyTasksRequested, setActiveSection]);

  return (
    <LearningExperience
      lesson={getLessonByNumber(12)}
      sections={slides}
      activeSection={activeSection}
      onChange={setActiveSection}
      title="ZWA-12: Autentizace a autorizace"
      objective="Rozlišíte autentizaci a autorizaci, bezpečně uložíte hesla a ochráníte session po přihlášení."
      subtitle="Interaktivní prezentace podle cvičení 12"
      footerText="ZWA – Cvičení 12: Autentizace a autorizace"
    >
      <LearningSection section={current} idPrefix="lesson-auth">
        <LessonSlideContent slide={current} />
      </LearningSection>
    </LearningExperience>
  );
}
