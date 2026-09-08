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
    <SharedSlideCard slide={slide} idPrefix="lesson-11">
      {slide.id === 'title' && (
        <div className="mt-2 text-zinc-600 dark:text-zinc-400">
          <div>Autor: Bc. Egor Ulianov</div>
          <div>Datum: 3. 12. 2025</div>
        </div>
      )}

      {slide.id === 'toc' && <TableOfContents />}
      {slide.id === 'theory-files' && <TheoryFilesBasics />}
      {slide.id === 'theory-json' && <TheoryJsonBasics />}
      {slide.id === 'theory-library' && <TheoryUsersLibrary />}
      {slide.id === 'theory-pagination' && <TheoryPagination />}

      {slide.id === 'tasks' && <Tasks />}
      {slide.id === 'summary' && <SummarySlide />}
    </SharedSlideCard>
  );
}

function TableOfContents() {
  return (
    <ul className="list-disc pl-6 space-y-2 text-lg">
      <li>
        1 – Práce se soubory v PHP: <Code>file_get_contents</Code>, <Code>file_put_contents</Code>
      </li>
      <li>
        2 – JSON v PHP: <Code>json_decode</Code> (assoc=<Code>true</Code>), <Code>json_encode</Code>
      </li>
      <li>
        3 – Knihovna uživatelů nad souborem <Code>users.json</Code>
      </li>
      <li>
        4 – Stránkování: parametry <Code>limit</Code> a <Code>offset</Code>
      </li>
      <li>5 – Úkoly a řešení</li>
      <li>6 – Shrnutí a odkazy</li>
    </ul>
  );
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
      <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm">
        <code className="language-php">{`<?php
$path = __DIR__ . '/data.txt';
$ok = file_put_contents($path, "Ahoj svět\\n", LOCK_EX);
if ($ok === false) {
  throw new RuntimeException('Zápis selhal');
}
$content = @file_get_contents($path);
echo $content === false ? 'Nelze číst' : $content;`}</code>
      </pre>
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
      <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm">
        <code className="language-php">{`<?php
$json = '{"name":"Alice","email":"a@example.com"}';
$data = json_decode($json, true); // asociativní pole
echo $data['name'] ?? 'neznámé';

$encoded = json_encode($data, JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE);`}</code>
      </pre>
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
      <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm">
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
      </pre>
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
      <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm">
        <code className="language-php">{`<?php
function list_users_paginated(?int $limit = null, int $offset = 0): array {
  $all = load_all_users();
  // length = null → do konce pole
  return array_slice($all, max(0, $offset), $limit ?? null);
}`}</code>
      </pre>
      <div className="text-xs text-zinc-500">
        Poznámka: Ujistěte se, že stránkovací odkazy nepřekračují meze (offset ≥ 0, offset &lt;=
        count).
      </div>
    </div>
  );
}

function Tasks() {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Zadání</h3>

      <section className="space-y-3">
        <h4 className="font-semibold">1) První experimenty se soubory</h4>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li>
            Vytvořte <Code>data.txt</Code>, zapište do něj text a přečtěte ho zpět.
          </li>
          <li>
            Vyzkoušejte <Code>LOCK_EX</Code> a práci s cestou přes <Code>__DIR__</Code>.
          </li>
        </ul>
        <ClickToRevealSolution hint="file_put_contents(__DIR__.'/data.txt', 'Hello', LOCK_EX); file_get_contents(...);">
          <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm">
            <code className="language-php">{`<?php
$p = __DIR__ . '/data.txt';
file_put_contents($p, "Hello\\n", LOCK_EX);
echo file_get_contents($p);`}</code>
          </pre>
        </ClickToRevealSolution>
      </section>

      <section className="space-y-3">
        <h4 className="font-semibold">2) JSON – načtení a uložení</h4>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li>
            Uložte pole do <Code>data.json</Code> a načtěte ho jako asociativní pole.
          </li>
          <li>
            Použijte <Code>JSON_PRETTY_PRINT</Code> a <Code>JSON_UNESCAPED_UNICODE</Code>.
          </li>
        </ul>
        <ClickToRevealSolution hint="json_encode($arr, JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE); json_decode($raw, true);">
          <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm">
            <code className="language-php">{`<?php
$arr = ['greeting' => 'Ahoj', 'n' => 3];
$json = json_encode($arr, JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE);
file_put_contents(__DIR__ . '/data.json', $json, LOCK_EX);
$raw = file_get_contents(__DIR__ . '/data.json');
$back = json_decode($raw, true);
var_dump($back);`}</code>
          </pre>
        </ClickToRevealSolution>
      </section>

      <section className="space-y-3">
        <h4 className="font-semibold">3) Knihovna uživatelů</h4>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li>
            Implementujte v <Code>users.lib.php</Code> funkce: <Code>list_users</Code>,{' '}
            <Code>get_user</Code>, <Code>add_user</Code>, <Code>delete_user</Code>,{' '}
            <Code>edit_user</Code>.
          </li>
          <li>
            Testujte pomocí připraveného <Code>index.php</Code> a souboru <Code>users.json</Code>.
          </li>
        </ul>
        <ClickToRevealSolution hint="viz ukázka v Teorie – Knihovna uživatelů">
          <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm">
            <code className="language-php">{`<?php
require __DIR__.'/users.lib.php';
$id = add_user('Alice','alice@example.com','😊');
$u = get_user($id);
var_dump($u);
delete_user($id);`}</code>
          </pre>
        </ClickToRevealSolution>
      </section>

      <section className="space-y-3">
        <h4 className="font-semibold">4) Stránkování</h4>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li>
            Rozšiřte <Code>list_users()</Code> o parametry <Code>$limit</Code> a{' '}
            <Code>$offset</Code> a připravte HTML s odkazem na další/předchozí stránku (3 položky na
            stránku).
          </li>
        </ul>
        <ClickToRevealSolution hint="array_slice(load_all_users(), $offset, $limit);">
          <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm">
            <code className="language-php">{`<?php
function list_users(int $limit = 3, int $offset = 0): array {
  return array_slice(load_all_users(), max(0,$offset), $limit);
}`}</code>
          </pre>
        </ClickToRevealSolution>
      </section>

      <section className="space-y-3">
        <h4 className="font-semibold">BONUS: Robustnější zpracování</h4>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li>
            Validujte vstupy (email, nepovinný avatar), ošetřete chyby <Code>json_decode</Code>/
            <Code>json_encode</Code>.
          </li>
          <li>Zvažte kontrolu souběžných zápisů (LOCK_EX) a zálohu staré verze souboru.</li>
        </ul>
      </section>
      <div className="text-xs text-zinc-500">
        Materiál vychází z:{' '}
        <a
          className="underline"
          href="https://cw.fel.cvut.cz/wiki/courses/b6b39zwa/tutorials/11/start"
          target="_blank"
          rel="noreferrer noopener"
        >
          B6B39ZWA – Cvičení 11: Soubory
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
  const slides = useMemo(
    () => [
      {
        id: 'title',
        title: 'Základy webových aplikací – 11. cvičení',
        subtitle: 'Soubory a JSON v PHP',
      },
      { id: 'toc', title: 'Obsah' },
      { id: 'theory-files', title: 'Teorie – Práce se soubory' },
      { id: 'theory-json', title: 'Teorie – JSON (encode/decode)' },
      { id: 'theory-library', title: 'Teorie – Knihovna uživatelů (users.json)' },
      { id: 'theory-pagination', title: 'Teorie – Stránkování (limit/offset)' },
      { id: 'tasks', title: 'Úkoly' },
      { id: 'summary', title: 'Shrnutí a odkazy' },
    ],
    [],
  );
  const { activeSlide, setActiveSlide } = useSlideNavigation(slides);
  const current = slides.find((s) => s.id === activeSlide) || slides[0];

  return (
    <LessonShell
      lesson={getLessonByNumber(11)}
      slides={slides}
      activeSlide={activeSlide}
      onChange={setActiveSlide}
      title="ZWA-11: Soubory a JSON v PHP"
      subtitle="Interaktivní prezentace podle cvičení 11 s ukázkami kódu"
      footerText="© 2025 ZWA – Cvičení 11: Soubory a JSON"
    >
      <LessonSlideContent slide={current} />
    </LessonShell>
  );
}
