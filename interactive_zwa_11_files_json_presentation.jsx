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
          intro="Postavíme malou datovou vrstvu nad JSON souborem a doplníme ji o bezpečný zápis i stránkování výsledků."
          items={[
            'Načteme a zapíšeme soubor pomocí PHP funkcí pro file I/O.',
            'Převedeme data mezi JSONem a asociativním polem.',
            'Zapouzdříme práci s uživateli do znovupoužitelné knihovny.',
            'Přidáme stránkování pomocí parametrů limit a offset.',
          ]}
        />
      )}
      {slide.id === 'theory-files' && <TheoryFilesBasics />}
      {slide.id === 'theory-json' && <TheoryJsonBasics />}
      {slide.id === 'theory-library' && <TheoryUsersLibrary />}
      {slide.id === 'theory-pagination' && <TheoryPagination />}

      {LESSON11_TASKS.some((task) => task.id === slide.id) && (
        <FileTaskSlide task={LESSON11_TASKS.find((task) => task.id === slide.id)} />
      )}
      {slide.id === 'summary' && <SummarySlide />}
    </>
  );
}

function StaticLessonTask(props) {
  return <StaticExercise {...props} fileName="users.lib.php" language="php" />;
}

function TheoryFilesBasics() {
  return (
    <div className="space-y-4">
      <InfoBox>
        <div className="font-semibold mb-1">Souborové I/O v PHP</div>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li>
            <Code>file_get_contents($path)</Code> – načte obsah souboru jako řetězec; vrací{' '}
            <Code>false</Code> při chybě.
          </li>
          <li>
            <Code>file_put_contents($path, $data, $flags)</Code> – zapíše data; použijte{' '}
            <Code>LOCK_EX</Code> pro atomický zápis.
          </li>
          <li>
            Pracujte s cestami relativně k souboru pomocí <Code>__DIR__</Code> – zamezí problémům s
            aktuálním pracovním adresářem.
          </li>
          <li>
            Ověření: <Code>file_exists</Code>, <Code>is_readable</Code>, <Code>is_writable</Code>;
            ošetření chyb.
          </li>
        </ul>
      </InfoBox>
      <TheoryCodeBlock>
        <code className="language-php">{`<?php
$path = __DIR__ . '/data.txt';
$ok = file_put_contents($path, "Ahoj svět\\n", LOCK_EX);
if ($ok === false) {
  throw new RuntimeException('Zápis selhal');
}
$content = @file_get_contents($path);
echo $content === false ? 'Nelze číst' : $content;`}</code>
      </TheoryCodeBlock>
      <div className="text-xs text-zinc-500">
        Reference:{' '}
        <a
          className="underline"
          href="https://www.php.net/file_get_contents"
          target="_blank"
          rel="noreferrer noopener"
        >
          file_get_contents
        </a>{' '}
        •{' '}
        <a
          className="underline"
          href="https://www.php.net/file_put_contents"
          target="_blank"
          rel="noreferrer noopener"
        >
          file_put_contents
        </a>
      </div>
    </div>
  );
}

function TheoryJsonBasics() {
  return (
    <div className="space-y-4">
      <InfoBox>
        <div className="font-semibold mb-1">
          JSON v PHP – proč <Code>json_decode(..., true)</Code>?
        </div>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li>
            <Code>json_decode($json, true)</Code> vrací asociativní pole místo objektů stdClass –
            snadnější práce s poli (<Code>array_merge</Code>, <Code>foreach</Code>, aj.).
          </li>
          <li>
            <Code>json_encode($data, JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE)</Code> – čitelný
            zápis a zachování diakritiky.
          </li>
          <li>
            Zvažte <Code>JSON_THROW_ON_ERROR</Code> a blok <Code>try/catch</Code> pro robustnější
            zpracování chyb.
          </li>
        </ul>
      </InfoBox>
      <EditorialIllustration
        alt="Aplikační data se převádějí do struktury JSON, ukládají do souboru a znovu načítají."
        height={887}
        src="/course-art/editorial/json-file-storage.png"
        width={1774}
      />
      <TheoryCodeBlock>
        <code className="language-php">{`<?php
$json = '{"name":"Alice","email":"a@example.com"}';
$data = json_decode($json, true); // asociativní pole
echo $data['name'] ?? 'neznámé';

$encoded = json_encode($data, JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE);`}</code>
      </TheoryCodeBlock>
      <div className="text-xs text-zinc-500">
        Reference:{' '}
        <a
          className="underline"
          href="https://www.php.net/json_decode"
          target="_blank"
          rel="noreferrer noopener"
        >
          json_decode
        </a>{' '}
        •{' '}
        <a
          className="underline"
          href="https://www.php.net/json_encode"
          target="_blank"
          rel="noreferrer noopener"
        >
          json_encode
        </a>
      </div>
    </div>
  );
}

function TheoryUsersLibrary() {
  return (
    <div className="space-y-4">
      <InfoBox>
        <div className="font-semibold mb-1">
          Knihovna uživatelů nad souborem <Code>users.json</Code>
        </div>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li>
            Evidujte: <Code>id</Code>, <Code>name</Code>, <Code>email</Code>, <Code>avatar</Code>{' '}
            (emotikon/krátký text).
          </li>
          <li>
            API: <Code>list_users()</Code>, <Code>get_user($id)</Code>,{' '}
            <Code>add_user($name,$email,$avatar)</Code>, <Code>delete_user($id)</Code>,{' '}
            <Code>edit_user($id,...)</Code>.
          </li>
          <li>
            Pro demo ID použijte <Code>bin2hex(random_bytes(16))</Code>; produkční data obvykle
            použijí ID generované databází. Používejte <Code>LOCK_EX</Code> při zápisu.
          </li>
        </ul>
      </InfoBox>
      <TheoryCodeBlock>
        <code className="language-php">{`<?php
// users.lib.php
const USERS_FILE = __DIR__ . '/users.json';

function load_all_users(): array {
  if (!is_file(USERS_FILE)) { return []; }
  $raw = file_get_contents(USERS_FILE);
  if ($raw === false || $raw === '') { return []; }
  $arr = json_decode($raw, true);
  return is_array($arr) ? $arr : [];
}

function save_all_users(array $users): void {
  $json = json_encode($users, JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE);
  if ($json === false) {
    throw new RuntimeException('JSON encode failed');
  }
  if (file_put_contents(USERS_FILE, $json, LOCK_EX) === false) {
    throw new RuntimeException('Write failed');
  }
}

function list_users(): array {
  return load_all_users();
}

function get_user(string $id): ?array {
  foreach (load_all_users() as $u) {
    if (($u['id'] ?? null) === $id) { return $u; }
  }
  return null;
}

function add_user(string $name, string $email, string $avatar): string {
  $users = load_all_users();
  // Náhodná hodnota je vhodná pro demo token; produkční CRUD preferuje DB ID.
  $id = bin2hex(random_bytes(16));
  $users[] = ['id' => $id, 'name' => $name, 'email' => $email, 'avatar' => $avatar];
  save_all_users($users);
  return $id;
}

function delete_user(string $id): bool {
  $users = load_all_users();
  $before = count($users);
  $users = array_values(array_filter($users, fn($u) => ($u['id'] ?? null) !== $id));
  if (count($users) === $before) { return false; }
  save_all_users($users);
  return true;
}

function edit_user(string $id, string $name, string $email, string $avatar): bool {
  $users = load_all_users();
  $found = false;
  foreach ($users as &$u) {
    if (($u['id'] ?? null) === $id) {
      $u['name'] = $name;
      $u['email'] = $email;
      $u['avatar'] = $avatar;
      $found = true;
      break;
    }
  }
  if ($found) { save_all_users($users); }
  return $found;
}`}</code>
      </TheoryCodeBlock>
    </div>
  );
}

function TheoryPagination() {
  return (
    <div className="space-y-4">
      <InfoBox>
        <div className="font-semibold mb-1">
          Stránkování: <Code>limit</Code> a <Code>offset</Code>
        </div>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li>
            Rozšiřte <Code>list_users($limit, $offset)</Code> – vrací výřez z kompletního pole.
          </li>
          <li>
            Pro jednoduché pole použijte <Code>array_slice</Code>; pro UI připravte odkazy
            „Předchozí/Další“ podle celkového počtu.
          </li>
        </ul>
      </InfoBox>
      <TheoryCodeBlock>
        <code className="language-php">{`<?php
function list_users_paginated(?int $limit = null, int $offset = 0): array {
  $all = load_all_users();
  // length = null → do konce pole
  return array_slice($all, max(0, $offset), $limit ?? null);
}`}</code>
      </TheoryCodeBlock>
      <div className="text-xs text-zinc-500">
        Poznámka: Ujistěte se, že stránkovací odkazy nepřekračují meze (offset ≥ 0, offset &lt;=
        count).
      </div>
    </div>
  );
}

const LESSON11_TASKS = [
  {
    id: 'task1',
    title: 'Úkol 1: První experimenty se soubory',
    task: 'Vytvořte data.txt, zapište do něj text a přečtěte ho zpět s LOCK_EX.',
    draft: `<?php
$path = __DIR__ . '/data.txt';
file_put_contents($path, "Hello\\n", LOCK_EX);
$raw = file_get_contents($path);`,
    required: ['file_put_contents', 'file_get_contents', '__DIR__', 'LOCK_EX'],
    expected: 'Program bezpečně zapíše a přečte lokální textový soubor.',
    solution: `<?php
$path = __DIR__ . '/data.txt';
file_put_contents($path, "Hello\\n", LOCK_EX);
echo file_get_contents($path);`,
  },
  {
    id: 'task2',
    title: 'Úkol 2: JSON – načtení a uložení',
    task: 'Uložte pole do data.json v čitelném UTF-8 JSON a načtěte jej jako asociativní pole.',
    draft: `<?php
$data = ['greeting' => 'Ahoj'];
$json = json_encode($data);
$decoded = json_decode($json, true);`,
    required: ['json_encode', 'JSON_PRETTY_PRINT', 'json_decode', 'JSON_UNESCAPED_UNICODE'],
    expected: 'JSON se uloží čitelně a po načtení vznikne asociativní pole.',
    solution: `<?php
$data = ['greeting' => 'Ahoj', 'n' => 3];
$json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
file_put_contents(__DIR__ . '/data.json', $json, LOCK_EX);
$raw = file_get_contents(__DIR__ . '/data.json');
$decoded = json_decode($raw, true);
var_dump($decoded);`,
  },
  {
    id: 'task3',
    title: 'Úkol 3: Knihovna uživatelů',
    task: 'Implementujte list_users, get_user, add_user, delete_user a edit_user nad users.json.',
    draft: `<?php
function list_users(): array { return []; }
function get_user(int $id): ?array { return null; }
function add_user(string $name, string $email): int { return 1; }
function delete_user(int $id): bool { return true; }
function edit_user(int $id, array $data): bool { return true; }`,
    required: [
      'function list_users',
      'function get_user',
      'function add_user',
      'function delete_user',
      'function edit_user',
    ],
    expected: 'Knihovna poskytuje základní CRUD operace s uživateli.',
    solution: `<?php
function users_path(): string { return __DIR__ . '/users.json'; }
function load_all_users(): array {
  $raw = @file_get_contents(users_path());
  $users = json_decode($raw ?: '[]', true);
  return is_array($users) ? $users : [];
}
function save_all_users(array $users): void {
  file_put_contents(users_path(), json_encode($users, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
}
function list_users(): array { return load_all_users(); }
function get_user(int $id): ?array {
  foreach (load_all_users() as $user) if ((int)($user['id'] ?? 0) === $id) return $user;
  return null;
}
function add_user(string $name, string $email, string $avatar = ''): int {
  $users = load_all_users();
  $id = count($users) ? max(array_column($users, 'id')) + 1 : 1;
  $users[] = compact('id', 'name', 'email', 'avatar');
  save_all_users($users);
  return $id;
}
function delete_user(int $id): bool {
  $before = load_all_users();
  $after = array_values(array_filter($before, fn($user) => (int)($user['id'] ?? 0) !== $id));
  save_all_users($after);
  return count($after) !== count($before);
}
function edit_user(int $id, array $data): bool {
  $users = load_all_users();
  foreach ($users as &$user) if ((int)($user['id'] ?? 0) === $id) { $user = array_merge($user, $data); save_all_users($users); return true; }
  return false;
}`,
  },
  {
    id: 'task4',
    title: 'Úkol 4: Stránkování',
    task: 'Rozšiřte list_users o limit a offset a připravte odkazy na další/předchozí stránku.',
    draft: `<?php
function list_users(int $limit = 3, int $offset = 0): array {
  return array_slice(load_all_users(), $offset, $limit);
}`,
    required: ['array_slice', '$limit', '$offset'],
    expected: 'Výpis vrací právě požadovanou stránku uživatelů.',
    solution: `<?php
function list_users(int $limit = 3, int $offset = 0): array {
  $limit = max(1, $limit);
  $offset = max(0, $offset);
  return array_slice(load_all_users(), $offset, $limit);
}
$page = max(0, (int)($_GET['page'] ?? 0));
$users = list_users(3, $page * 3);`,
  },
  {
    id: 'task5',
    title: 'Úkol 5: BONUS: Robustnější zpracování',
    task: 'Validujte e-mail a avatar, ošetřete chyby JSON a chraňte souběžný zápis.',
    draft: `<?php
$email = filter_input(INPUT_POST, 'email', FILTER_VALIDATE_EMAIL);
$raw = file_get_contents(__DIR__ . '/users.json');
$users = json_decode($raw, true) ?? [];`,
    required: ['FILTER_VALIDATE_EMAIL', 'json_last_error', 'LOCK_EX'],
    expected: 'Neplatné vstupy a poškozený JSON se zpracují bezpečně.',
    solution: `<?php
$email = filter_input(INPUT_POST, 'email', FILTER_VALIDATE_EMAIL);
if ($email === false) throw new InvalidArgumentException('Neplatný e-mail');
$raw = file_get_contents(__DIR__ . '/users.json');
$users = json_decode($raw, true);
if (json_last_error() !== JSON_ERROR_NONE || !is_array($users)) $users = [];
file_put_contents(__DIR__ . '/users.json', json_encode($users, JSON_UNESCAPED_UNICODE), LOCK_EX);`,
  },
];

function FileTaskSlide({ task }) {
  return <StaticLessonTask key={task.id} {...task} />;
}

function SummarySlide() {
  return (
    <div className="space-y-3">
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>Soubory:</strong> <Code>file_get_contents</Code>/<Code>file_put_contents</Code>,
          práce s <Code>__DIR__</Code>, <Code>LOCK_EX</Code>.
        </li>
        <li>
          <strong>JSON:</strong> <Code>json_decode(..., true)</Code> pro asociativní pole, čitelný{' '}
          <Code>json_encode</Code>.
        </li>
        <li>
          <strong>Knihovna:</strong> jednoduché CRUD nad <Code>users.json</Code>, demo ID přes{' '}
          <Code>random_bytes()</Code>; v produkci ID generuje databáze.
        </li>
        <li>
          <strong>Stránkování:</strong> <Code>limit</Code> a <Code>offset</Code> pomocí{' '}
          <Code>array_slice</Code>.
        </li>
      </ul>
      <div className="text-xs text-zinc-500">
        Odkazy:{' '}
        <a
          className="underline"
          href="https://cw.fel.cvut.cz/wiki/courses/b6b39zwa/tutorials/11/start"
          target="_blank"
          rel="noreferrer noopener"
        >
          Cvičení 11 – materiál
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

export default function AppPhpLesson11() {
  const legacyTasksRequested =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('slide') === 'tasks';
  const slides = useMemo(
    () => [
      {
        id: 'title',
        title: 'Základy webových aplikací – 11. cvičení',
        subtitle: 'Soubory a JSON v PHP',
        activityType: 'learn',
      },
      { id: 'theory-files', title: 'Teorie – Práce se soubory', activityType: 'learn' },
      { id: 'theory-json', title: 'Teorie – JSON (encode/decode)', activityType: 'learn' },
      {
        id: 'theory-library',
        title: 'Teorie – Knihovna uživatelů (users.json)',
        activityType: 'learn',
      },
      {
        id: 'theory-pagination',
        title: 'Teorie – Stránkování (limit/offset)',
        activityType: 'learn',
      },
      ...LESSON11_TASKS.map(({ id, title }) => ({ id, title, activityType: 'apply' })),
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
      lesson={getLessonByNumber(11)}
      sections={slides}
      activeSection={activeSection}
      onChange={setActiveSection}
      title="ZWA-11: Soubory a JSON v PHP"
      objective="Použijete PHP pro bezpečnou práci se soubory, JSON daty a stránkovaným úložištěm uživatelů."
      subtitle="Interaktivní prezentace podle cvičení 11 s ukázkami kódu"
      footerText="ZWA – Cvičení 11: Soubory a JSON"
    >
      <LearningSection section={current} idPrefix="lesson-files-json">
        <LessonSlideContent slide={current} />
      </LearningSection>
    </LearningExperience>
  );
}
