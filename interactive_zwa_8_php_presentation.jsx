import React, { useMemo, useState } from 'react';
import { getLessonByNumber } from './src/config/lessons.js';
import EditorialCallout from './src/course-ui/content/EditorialCallout.jsx';
import EditorialCode from './src/course-ui/content/EditorialCode.jsx';
import EditorialIllustration from './src/course-ui/content/EditorialIllustration.jsx';
import Code from './src/course-ui/content/InlineCode.jsx';
import LessonSummary from './src/course-ui/content/LessonSummary.jsx';
import contentStyles from './src/course-ui/content/content.module.css';
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

function LessonSlideContent({ slide }) {
  return (
    <>
      {slide.id === 'title' && (
        <LessonSummary
          intro="Na práci s datem a poli si osvojíme základní syntaxi PHP, vlastní funkce i ověřování vstupů."
          items={[
            'Vypíšeme a převedeme datum mezi řetězcem, timestampem a formátovaným výstupem.',
            'Zapouzdříme opakovanou logiku do vlastních funkcí.',
            'Projdeme pole hodnot a odvodíme z něj unikátní měsíce.',
            'Ověříme celočíselný vstup a použijeme nepovinné parametry.',
          ]}
        />
      )}

      {slide.id === 'theory' && <PhpTheorySections />}

      {slide.id === 't1' && <Task1 />}
      {slide.id === 't2' && <Task2 />}
      {slide.id === 't3' && <Task3 />}
      {slide.id === 't4' && <Task4 />}
      {slide.id === 't5' && <Task5 />}
      {slide.id === 't6' && <Task6 />}
      {slide.id === 't7' && <Task7 />}
      {slide.id === 't8' && <Task8 />}

      {slide.id === 'summary' && (
        <div className="space-y-3">
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Práce s datem: <Code>date()</Code>, <Code>mktime()</Code>, rozklad řetězce
            </li>
            <li>
              Funkce a průchod pole: <Code>foreach</Code>, návratové hodnoty
            </li>
            <li>
              Operace s poli: <Code>array_map()</Code>, <Code>array_unique()</Code>,{' '}
              <Code>sort()</Code>
            </li>
            <li>
              Validace řetězce jako čísla: <Code>ctype_digit()</Code>
            </li>
            <li>
              Nepovinné parametry a podmínky: <Code>$min</Code>, <Code>$max</Code>
            </li>
          </ul>
          <p className="text-2xl font-bold text-center text-sky-600 dark:text-sky-400">
            Děkuji za pozornost!
          </p>
        </div>
      )}
    </>
  );
}

function StaticLessonTask(props) {
  return <StaticExercise {...props} language="php" />;
}

function TaskReferenceSource() {
  return null;
}

const PHP_TASK_SOLUTIONS = {
  t1: `<!DOCTYPE html>
<html lang="cs">
<head><meta charset="UTF-8"><title>Dnešní datum</title></head>
<body><p>Dnešní datum je: <?php echo date('j.n.Y'); ?></p></body>
</html>`,
  t2: `<?php
$datum = "12.6.2008";
list($den, $mesic, $rok) = explode('.', $datum);
$timestamp = mktime(0, 0, 0, (int)$mesic, (int)$den, (int)$rok);
$dny = [1 => "pondělí", "úterý", "středa", "čtvrtek", "pátek", "sobota", "neděle"];
echo "$den.$mesic.$rok je " . $dny[(int)date('N', $timestamp)];`,
  t3: `<?php
function formatCzechDate(string $dateStr): string {
  list($den, $mesic, $rok) = explode('.', $dateStr);
  $timestamp = mktime(0, 0, 0, (int)$mesic, (int)$den, (int)$rok);
  $dny = [1 => "pondělí", "úterý", "středa", "čtvrtek", "pátek", "sobota", "neděle"];
  return "$den.$mesic.$rok je " . $dny[(int)date('N', $timestamp)];
}

echo formatCzechDate("12.6.2008");`,
  t4: `<?php
function formatCzechDate(string $dateStr): string {
  list($d, $m, $y) = explode('.', $dateStr);
  $timestamp = mktime(0, 0, 0, (int)$m, (int)$d, (int)$y);
  $dny = [1 => "pondělí", "úterý", "středa", "čtvrtek", "pátek", "sobota", "neděle"];
  return "$d.$m.$y je " . $dny[(int)date('N', $timestamp)];
}

$data = ["12.6.2008", "5.1.2020", "1.12.2024"];
foreach ($data as $i => $date) echo ($i + 1) . ". " . formatCzechDate($date) . "<br>";`,
  t5: `<?php
function extractMonths(array $dates): array {
  return array_map(function ($str) {
    $parts = explode('.', $str);
    return (int)($parts[1] ?? 0);
  }, $dates);
}

$data = ["12.6.2008", "5.1.2020", "1.12.2024"];
print_r(extractMonths($data));`,
  t6: `<?php
function extractUniqueMonths(array $dates): array {
  $months = array_map(function ($str) {
    $parts = explode('.', $str);
    return (int)($parts[1] ?? 0);
  }, $dates);
  $unique = array_values(array_unique($months));
  sort($unique);
  return $unique;
}

$data = ["12.6.2008", "5.1.2020", "1.12.2024", "20.1.2021"];
print_r(extractUniqueMonths($data));`,
  t7: `<?php
function isPositiveInt(string $s): bool {
  return $s !== '' && ctype_digit($s) && (int)$s > 0;
}

var_dump(isPositiveInt("123"));
var_dump(isPositiveInt("0"));
var_dump(isPositiveInt("-1"));`,
  t8: `<?php
function isPositiveInt(string $s, ?int $min = null, ?int $max = null): bool {
  if ($s === '' || !ctype_digit($s)) return false;
  $val = (int)$s;
  if ($val <= 0) return false;
  if ($min !== null && $val >= $min) {
    // Dolní mez je splněna.
  } elseif ($min !== null) {
    return false;
  }
  if ($max !== null && $max > $min && $val > $max) return false;
  return true;
}

var_dump(isPositiveInt("10"));
var_dump(isPositiveInt("10", 5));
var_dump(isPositiveInt("7", 5, 10));`,
};

function Task1() {
  return (
    <StaticLessonTask
      id="zwa8-task1"
      task="Vytvořte soubor datum.php a do HTML vložte kód, který vypíše dnešní datum."
      fileName="datum.php"
      draft={`<!DOCTYPE html>
<p>Dnešní datum je: <?php echo date('j.n.Y'); ?></p>`}
      required={['<?php', "date('j.n.Y')", 'Dnešní datum']}
      expected="HTML stránka vypíše dnešní datum ve formátu den.měsíc.rok."
      solution={PHP_TASK_SOLUTIONS.t1}
    >
      <h3 className="text-xl font-semibold mb-3">1 – Výpis aktuálního data</h3>
      <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-4">
        Vytvořte soubor <Code>datum.php</Code> a do HTML vložte PHP kód, který vypíše dnešní datum.
      </p>
      <InfoBox>
        <div className="font-semibold mb-1">Užitečná syntaxe a dokumentace</div>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>
            Datum/čas: <Code>date(&apos;j.n.Y&apos;)</Code> —{' '}
            <a
              className="underline"
              href="https://www.php.net/date"
              target="_blank"
              rel="noreferrer noopener"
            >
              php.net/date
            </a>
          </li>
          <li>
            Aktuální čas: <Code>time()</Code> —{' '}
            <a
              className="underline"
              href="https://www.php.net/time"
              target="_blank"
              rel="noreferrer noopener"
            >
              php.net/time
            </a>
          </li>
          <li>
            Základní přehled manuálu —{' '}
            <a
              className="underline"
              href="https://www.php.net/manual/en/"
              target="_blank"
              rel="noreferrer noopener"
            >
              php.net/manual
            </a>
          </li>
        </ul>
      </InfoBox>
      <TaskReferenceSource>
        <div className="space-y-3">
          <TheoryCodeBlock>
            <code className="language-php">{`<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <title>Dnešní datum</title>
</head>
<body>
  <p>Dnešní datum je: <?php echo date('j.n.Y'); ?></p>
</body>
</html>`}</code>
          </TheoryCodeBlock>
        </div>
      </TaskReferenceSource>
    </StaticLessonTask>
  );
}

function Task2() {
  return (
    <StaticLessonTask
      id="zwa8-task2"
      task="Rozložte datum, vytvořte timestamp a vypište český den v týdnu."
      draft={`$datum = "12.6.2008";
list($den, $mesic, $rok) = explode('.', $datum);
$timestamp = mktime(0, 0, 0, (int)$mesic, (int)$den, (int)$rok);
$cisloDne = (int)date('N', $timestamp);`}
      required={['explode', 'mktime', "date('N'"]}
      expected="Z řetězce den.měsíc.rok vznikne timestamp a český název dne."
      solution={PHP_TASK_SOLUTIONS.t2}
    >
      <h3 className="text-xl font-semibold mb-3">2 – Práce s datem</h3>
      <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-2">
        Mějte proměnnou <Code>$datum</Code> ve tvaru <Code>den.mesic.rok</Code>. Naplňte{' '}
        <Code>$den</Code>, <Code>$mesic</Code>, <Code>$rok</Code>, vytvořte <Code>$timestamp</Code>{' '}
        a vypište den v týdnu.
      </p>
      <InfoBox>
        <div className="font-semibold mb-1">Užitečná syntaxe a dokumentace</div>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>
            Rozdělení řetězce: <Code>explode(&apos;.&apos;, $str)</Code> —{' '}
            <a
              className="underline"
              href="https://www.php.net/explode"
              target="_blank"
              rel="noreferrer noopener"
            >
              php.net/explode
            </a>
          </li>
          <li>
            Přiřazení z pole: <Code>list($a, $b) = ...</Code> —{' '}
            <a
              className="underline"
              href="https://www.php.net/manual/en/function.list.php"
              target="_blank"
              rel="noreferrer noopener"
            >
              php.net/list
            </a>
          </li>
          <li>
            Unix timestamp pro datum: <Code>mktime(0,0,0,$m,$d,$y)</Code> —{' '}
            <a
              className="underline"
              href="https://www.php.net/mktime"
              target="_blank"
              rel="noreferrer noopener"
            >
              php.net/mktime
            </a>
          </li>
          <li>
            Den v týdnu: <Code>date(&apos;N&apos;, $ts)</Code> —{' '}
            <a
              className="underline"
              href="https://www.php.net/date"
              target="_blank"
              rel="noreferrer noopener"
            >
              php.net/date
            </a>
          </li>
        </ul>
      </InfoBox>
      <TaskReferenceSource>
        <TheoryCodeBlock>
          <code className="language-php">{`<?php
$datum = "12.6.2008";
list($den, $mesic, $rok) = explode('.', $datum);
$timestamp = mktime(0, 0, 0, (int)$mesic, (int)$den, (int)$rok);

// CZ názvy dní (1 = pondělí ... 7 = neděle)
$dny = [1=>"pondělí","úterý","středa","čtvrtek","pátek","sobota","neděle"];
$cisloDne = (int)date('N', $timestamp);
echo "$den.$mesic.$rok je " . $dny[$cisloDne];`}</code>
        </TheoryCodeBlock>
      </TaskReferenceSource>
    </StaticLessonTask>
  );
}

function Task3() {
  return (
    <StaticLessonTask
      id="zwa8-task3"
      task="Převeďte řešení práce s datem na funkci vracející datum a den v týdnu."
      draft={`function formatCzechDate(string $dateStr): string {
  list($den, $mesic, $rok) = explode('.', $dateStr);
  return "$den.$mesic.$rok";
}`}
      required={['function formatCzechDate', 'return', 'explode']}
      expected="Funkce přijme řetězec data a vrátí čitelný text s českým dnem."
      solution={PHP_TASK_SOLUTIONS.t3}
    >
      <h3 className="text-xl font-semibold mb-3">3 – Funkce</h3>
      <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-2">
        Převeďte řešení z 2 na funkci, která přijme řetězec data a vrátí text s datem a dnem v
        týdnu.
      </p>
      <InfoBox>
        <div className="font-semibold mb-1">Užitečná syntaxe a dokumentace</div>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>
            Uživ. funkce:{' '}
            <Code>
              function name($arg): string {'{'} ... {'}'}
            </Code>{' '}
            —{' '}
            <a
              className="underline"
              href="https://www.php.net/manual/en/functions.user-defined.php"
              target="_blank"
              rel="noreferrer noopener"
            >
              php.net/functions.user-defined
            </a>
          </li>
          <li>
            Typové deklarace (argumenty/return) —{' '}
            <a
              className="underline"
              href="https://www.php.net/manual/en/language.types.declarations.php"
              target="_blank"
              rel="noreferrer noopener"
            >
              php.net/type-declarations
            </a>
          </li>
          <li>
            Vrácení hodnoty: <Code>return ...</Code> —{' '}
            <a
              className="underline"
              href="https://www.php.net/manual/en/functions.returning-values.php"
              target="_blank"
              rel="noreferrer noopener"
            >
              php.net/returning-values
            </a>
          </li>
        </ul>
      </InfoBox>
      <TaskReferenceSource>
        <TheoryCodeBlock>
          <code className="language-php">{`<?php
function formatCzechDate(string $dateStr): string {
  list($den, $mesic, $rok) = explode('.', $dateStr);
  $ts = mktime(0, 0, 0, (int)$mesic, (int)$den, (int)$rok);
  $dny = [1=>"pondělí","úterý","středa","čtvrtek","pátek","sobota","neděle"];
  $cisloDne = (int)date('N', $ts);
  return "$den.$mesic.$rok je " . $dny[$cisloDne];
}

echo formatCzechDate("12.6.2008");`}</code>
        </TheoryCodeBlock>
      </TaskReferenceSource>
    </StaticLessonTask>
  );
}

function Task4() {
  return (
    <StaticLessonTask
      id="zwa8-task4"
      task="Projíždějte pole dat a vypište pořadí, datum i den v týdnu pro každý řádek."
      draft={`$data = ["12.6.2008", "5.1.2020", "1.12.2024"];
foreach ($data as $i => $d) {
  echo ($i + 1) . ". " . formatCzechDate($d);
}`}
      required={['foreach', '$i + 1', 'formatCzechDate']}
      expected="Každé datum se vypíše s pořadím od jedné a formátovaným dnem."
      solution={PHP_TASK_SOLUTIONS.t4}
    >
      <h3 className="text-xl font-semibold mb-3">4 – Průchod pole</h3>
      <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-2">
        Mějte pole řetězců s daty jako v příkladu 2. Pro každý řádek vypište pořadí (od 1), datum a
        den v týdnu.
      </p>
      <InfoBox>
        <div className="font-semibold mb-1">Užitečná syntaxe a dokumentace</div>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>
            Cykly:{' '}
            <Code>
              foreach ($xs as $i =&gt; $x) {'{'} ... {'}'}
            </Code>{' '}
            —{' '}
            <a
              className="underline"
              href="https://www.php.net/manual/en/control-structures.foreach.php"
              target="_blank"
              rel="noreferrer noopener"
            >
              php.net/foreach
            </a>
          </li>
          <li>
            Výstup: <Code>echo</Code>, řetězení tečkou <Code>.</Code> —{' '}
            <a
              className="underline"
              href="https://www.php.net/manual/en/function.echo.php"
              target="_blank"
              rel="noreferrer noopener"
            >
              php.net/echo
            </a>
          </li>
          <li>
            Interpolace: <Code>&quot;Řádek $i&quot;</Code> —{' '}
            <a
              className="underline"
              href="https://www.php.net/manual/en/language.types.string.php"
              target="_blank"
              rel="noreferrer noopener"
            >
              php.net/strings
            </a>
          </li>
        </ul>
      </InfoBox>
      <TaskReferenceSource>
        <TheoryCodeBlock>
          <code className="language-php">{`<?php
$data = ["12.6.2008", "5.1.2020", "1.12.2024"];

function formatCzechDate(string $dateStr): string {
  list($d, $m, $y) = explode('.', $dateStr);
  $ts = mktime(0, 0, 0, (int)$m, (int)$d, (int)$y);
  $dny = [1=>"pondělí","úterý","středa","čtvrtek","pátek","sobota","neděle"];
  return "$d.$m.$y je " . $dny[(int)date('N', $ts)];
}

foreach ($data as $i => $d) {
  echo ($i + 1) . ". " . formatCzechDate($d) . "<br>";
}`}</code>
        </TheoryCodeBlock>
      </TaskReferenceSource>
    </StaticLessonTask>
  );
}

function Task5() {
  return (
    <StaticLessonTask
      id="zwa8-task5"
      task="Napište funkci, která vrátí pole všech čísel měsíců z pole dat."
      draft={`function extractMonths(array $dates): array {
  return array_map(function ($str) {
    $parts = explode('.', $str);
    return (int)($parts[1] ?? 0);
  }, $dates);
}`}
      required={['function extractMonths', 'array_map', 'explode']}
      expected="Z každého řetězce se vybere měsíc a zachová se pořadí vstupního pole."
      solution={PHP_TASK_SOLUTIONS.t5}
    >
      <h3 className="text-xl font-semibold mb-3">5 – Vytváření pole</h3>
      <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-2">
        Napište funkci, která vrátí pole všech čísel měsíců z pole dat.
      </p>
      <InfoBox>
        <div className="font-semibold mb-1">Užitečná syntaxe a dokumentace</div>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>
            Mapování: <Code>array_map(fn($s) =&gt; ..., $dates)</Code> —{' '}
            <a
              className="underline"
              href="https://www.php.net/array_map"
              target="_blank"
              rel="noreferrer noopener"
            >
              php.net/array_map
            </a>
          </li>
          <li>
            Arrow funkce: <Code>fn($x) =&gt; $x + 1</Code> —{' '}
            <a
              className="underline"
              href="https://www.php.net/manual/en/functions.arrow.php"
              target="_blank"
              rel="noreferrer noopener"
            >
              php.net/arrow-functions
            </a>
          </li>
          <li>
            Rozdělení: <Code>explode(&apos;.&apos;, $str)</Code> —{' '}
            <a
              className="underline"
              href="https://www.php.net/explode"
              target="_blank"
              rel="noreferrer noopener"
            >
              php.net/explode
            </a>
          </li>
        </ul>
      </InfoBox>
      <TaskReferenceSource>
        <TheoryCodeBlock>
          <code className="language-php">{`<?php
function extractMonths(array $dates): array {
  return array_map(function ($str) {
    // 'den.mesic.rok'
    $parts = explode('.', $str);
    return (int)($parts[1] ?? 0);
  }, $dates);
}

$data = ["12.6.2008", "5.1.2020", "1.12.2024", "20.1.2021"];
print_r(extractMonths($data)); // např. [6,1,12,1]`}</code>
        </TheoryCodeBlock>
      </TaskReferenceSource>
    </StaticLessonTask>
  );
}

function Task6() {
  return (
    <StaticLessonTask
      id="zwa8-task6"
      task="Upravte funkci tak, aby vracela pouze unikátní čísla měsíců bez duplicit."
      draft={`$unique = array_values(array_unique($months));
sort($unique);
return $unique;`}
      required={['array_unique', 'array_values', 'sort']}
      expected="Výsledné měsíce jsou jedinečné, seřazené a znovu indexované."
      solution={PHP_TASK_SOLUTIONS.t6}
    >
      <h3 className="text-xl font-semibold mb-3">6 – Různé měsíce</h3>
      <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-2">
        Upravte funkci tak, aby vracela pouze unikátní čísla měsíců (bez duplicit).
      </p>
      <InfoBox>
        <div className="font-semibold mb-1">Užitečná syntaxe a dokumentace</div>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>
            Unikátní hodnoty: <Code>array_unique($xs)</Code> —{' '}
            <a
              className="underline"
              href="https://www.php.net/array_unique"
              target="_blank"
              rel="noreferrer noopener"
            >
              php.net/array_unique
            </a>
          </li>
          <li>
            Seřazení: <Code>sort($xs)</Code> —{' '}
            <a
              className="underline"
              href="https://www.php.net/sort"
              target="_blank"
              rel="noreferrer noopener"
            >
              php.net/sort
            </a>
          </li>
          <li>
            Přeindexování: <Code>array_values($xs)</Code> —{' '}
            <a
              className="underline"
              href="https://www.php.net/array_values"
              target="_blank"
              rel="noreferrer noopener"
            >
              php.net/array_values
            </a>
          </li>
        </ul>
      </InfoBox>
      <TaskReferenceSource>
        <TheoryCodeBlock>
          <code className="language-php">{`<?php
function extractUniqueMonths(array $dates): array {
  $months = array_map(function ($str) {
    $parts = explode('.', $str);
    return (int)($parts[1] ?? 0);
  }, $dates);
  $unique = array_values(array_unique($months));
  sort($unique);
  return $unique;
}

$data = ["12.6.2008", "5.1.2020", "1.12.2024", "20.1.2021"];
print_r(extractUniqueMonths($data)); // např. [1,6,12]`}</code>
        </TheoryCodeBlock>
      </TaskReferenceSource>
    </StaticLessonTask>
  );
}

function Task7() {
  return (
    <StaticLessonTask
      id="zwa8-task7"
      task="Napište funkci, která zjistí, zda řetězec představuje kladné celé číslo."
      draft={`function isPositiveInt(string $s): bool {
  return $s !== '' && ctype_digit($s) && (int)$s > 0;
}`}
      required={['function isPositiveInt', 'ctype_digit', '(int)$s > 0']}
      expected="Kontrola přijme jen neprázdné číselné řetězce s hodnotou větší než nula."
      solution={PHP_TASK_SOLUTIONS.t7}
    >
      <h3 className="text-xl font-semibold mb-3">7 – Zjištění typu proměnné</h3>
      <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-2">
        Napište funkci, která zjistí, zda řetězec představuje kladné celé číslo.
      </p>
      <InfoBox>
        <div className="font-semibold mb-1">Užitečná syntaxe a dokumentace</div>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>
            Číslice: <Code>ctype_digit($s)</Code> —{' '}
            <a
              className="underline"
              href="https://www.php.net/ctype_digit"
              target="_blank"
              rel="noreferrer noopener"
            >
              php.net/ctype_digit
            </a>
          </li>
          <li>
            Validace integer: <Code>filter_var($s, FILTER_VALIDATE_INT)</Code> —{' '}
            <a
              className="underline"
              href="https://www.php.net/manual/en/filter.filters.validate.php"
              target="_blank"
              rel="noreferrer noopener"
            >
              php.net/FILTER_VALIDATE_INT
            </a>
          </li>
          <li>
            Přetypování: <Code>(int)$s</Code> —{' '}
            <a
              className="underline"
              href="https://www.php.net/manual/en/language.types.integer.php"
              target="_blank"
              rel="noreferrer noopener"
            >
              php.net/integer
            </a>
          </li>
        </ul>
      </InfoBox>
      <TaskReferenceSource>
        <TheoryCodeBlock>
          <code className="language-php">{`<?php
function isPositiveInt(string $s): bool {
  if ($s === '') return false;
  if (!ctype_digit($s)) return false; // jen 0-9
  // '0' není kladné číslo
  return (int)$s > 0;
}

var_dump(isPositiveInt("123")); // true
var_dump(isPositiveInt("0"));   // false
var_dump(isPositiveInt("-1"));  // false
var_dump(isPositiveInt("12a")); // false`}</code>
        </TheoryCodeBlock>
      </TaskReferenceSource>
    </StaticLessonTask>
  );
}

function Task8() {
  return (
    <StaticLessonTask
      id="zwa8-task8"
      task="Rozšiřte kontrolu kladného čísla o nepovinné parametry min a max."
      draft={`function isPositiveInt(string $s, ?int $min = null, ?int $max = null): bool {
  if ($s === '' || !ctype_digit($s)) return false;
  $val = (int)$s;
  return $val > 0 && ($min === null || $val >= $min) && ($max === null || $val <= $max);
}`}
      required={['?int $min = null', '?int $max = null', '$val >= $min']}
      expected="Funkce respektuje volitelné dolní a horní meze při zachování kontroly kladného čísla."
      solution={PHP_TASK_SOLUTIONS.t8}
    >
      <h3 className="text-xl font-semibold mb-3">8 – Nepovinné parametry funkcí</h3>
      <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-2">
        Rozšiřte funkci o nepovinné parametry <Code>$min</Code> a <Code>$max</Code> dle zadání.
      </p>
      <InfoBox>
        <div className="font-semibold mb-1">Užitečná syntaxe a dokumentace</div>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>
            Nepovinné parametry: <Code>function f($x, $min = null)</Code> —{' '}
            <a
              className="underline"
              href="https://www.php.net/manual/en/functions.arguments.php"
              target="_blank"
              rel="noreferrer noopener"
            >
              php.net/function-arguments
            </a>
          </li>
          <li>
            Typy a nullable: <Code>function f(?int $min): bool</Code> —{' '}
            <a
              className="underline"
              href="https://www.php.net/manual/en/language.types.declarations.php"
              target="_blank"
              rel="noreferrer noopener"
            >
              php.net/type-declarations
            </a>
          </li>
          <li>
            Porovnání čísel: <Code>$val &gt;= $min</Code>, <Code>$val &lt;= $max</Code>
          </li>
        </ul>
      </InfoBox>
      <TaskReferenceSource>
        <TheoryCodeBlock>
          <code className="language-php">{`<?php
function isPositiveInt(string $s, ?int $min = null, ?int $max = null): bool {
  if ($s === '' || !ctype_digit($s)) return false;
  $val = (int)$s;
  if ($val <= 0) return false;

  if ($min !== null && !is_nan($min)) {
    if ($val < $min) return false;
  }
  if ($max !== null && !is_nan($max)) {
    if ($min !== null && $max <= $min) {
      // pokud max není větší než min, ignorujme max dle zadání
    } else if ($val > $max) {
      return false;
    }
  }
  return true;
}

var_dump(isPositiveInt("10"));            // true
var_dump(isPositiveInt("10", 5));         // true
var_dump(isPositiveInt("3", 5));          // false
var_dump(isPositiveInt("12", 5, 10));     // false (12 > 10)
var_dump(isPositiveInt("7", 5, 10));      // true`}</code>
        </TheoryCodeBlock>
      </TaskReferenceSource>
    </StaticLessonTask>
  );
}

export default function AppPhpLesson8() {
  const slides = useMemo(
    () => [
      {
        id: 'title',
        title: 'Základy webových aplikací – 8. cvičení',
        subtitle: 'PHP – Malý test #2 (základy PHP)',
        activityType: 'learn',
        presenterNotes:
          'Začněte krátkým příkladem data a nechte studenty pojmenovat jednotlivé kroky.',
      },
      {
        id: 'theory',
        title: 'Teorie – PHP rychlý přehled',
        activityType: 'learn',
        presenterNotes: 'Ukažte, jak se datum rozloží na vstup, timestamp a formátovaný výstup.',
      },
      { id: 'ssh', title: 'Jak se připojit přes SSH + nastavení hesla', activityType: 'learn' },
      { id: 'filezilla', title: 'Jak se připojit přes FileZilla (SFTP)', activityType: 'learn' },
      {
        id: 't1',
        title: 'Úkol 1: Výpis aktuálního data',
        activityType: 'apply',
        presenterNotes: 'Nechte studenty nejdřív určit formát data, který má výstup splnit.',
      },
      { id: 't2', title: 'Úkol 2: Práce s datem', activityType: 'apply' },
      { id: 't3', title: 'Úkol 3: Funkce', activityType: 'apply' },
      { id: 't4', title: 'Úkol 4: Průchod pole', activityType: 'apply' },
      { id: 't5', title: 'Úkol 5: Vytváření pole měsíců', activityType: 'apply' },
      { id: 't6', title: 'Úkol 6: Různé měsíce', activityType: 'apply' },
      { id: 't7', title: 'Úkol 7: Zjištění typu proměnné', activityType: 'apply' },
      {
        id: 't8',
        title: 'Úkol 8: Nepovinné parametry',
        activityType: 'apply',
        presenterNotes: 'Porovnejte chování funkce bez limitů, s minimem a s oběma limity.',
      },
      { id: 'summary', title: 'Shrnutí', activityType: 'learn' },
    ],
    [],
  );
  const { activeSection, setActiveSection } = useLearningNavigation(slides);
  const current = slides.find((section) => section.id === activeSection) || slides[0];

  return (
    <LearningExperience
      lesson={getLessonByNumber(8)}
      sections={slides}
      activeSection={activeSection}
      onChange={setActiveSection}
      title="ZWA-8: Základy PHP – Malý test č. 2"
      objective="Použijete základní PHP syntaxi pro práci s datem, funkcemi, poli a parametry."
      subtitle="Interaktivní prezentace s ukázkami kódu pro PHP základy"
      footerText="ZWA – Cvičení 8: Základy PHP"
    >
      <LearningSection section={current} idPrefix="lesson-php">
        <LessonSlideContent slide={current} />
        {current.id === 'ssh' && <SshTutorial />}
        {current.id === 'filezilla' && <FileZillaTutorial />}
      </LearningSection>
    </LearningExperience>
  );
}

function PhpTheorySections() {
  const sections = [
    {
      title: 'Co je PHP?',
      content: (
        <>
          <p>
            PHP je serverový skriptovací jazyk. Kód se vykoná na serveru, vytvoří HTML, JSON nebo
            jinou odpověď a teprve výsledek se odešle prohlížeči. Uživatel tedy nevidí zdrojový PHP
            soubor, ale pouze data, která aplikace vrátí.
          </p>
          <p>
            Tento model se hodí pro klasické weby, administrační rozhraní i API. PHP je široce
            dostupné na hostinzích a stojí za systémy jako WordPress, MediaWiki nebo Moodle, takže
            jeho principy potkáte v nových i dlouhodobě provozovaných aplikacích.
          </p>
        </>
      ),
    },
    {
      title: 'Proč se PHP stále používá',
      content: (
        <>
          <p>
            Nasazení je přímočaré: webový server Apache nebo Nginx předá požadavek PHP-FPM a hotová
            odpověď se vrátí klientovi. Díky této dostupnosti lze rychle vytvořit menší web, ale
            stejný runtime zvládá i rozsáhlé aplikace.
          </p>
          <p>
            Composer a Packagist zajišťují správu balíčků, zatímco Laravel a Symfony nabízejí
            strukturu pro větší projekty. Důvodem dalšího používání tedy není jen nízká bariéra
            vstupu, ale také vyspělý ekosystém, dokumentace a velká komunita.
          </p>
        </>
      ),
    },
    {
      title: 'Hlavní koncepty jazyka',
      content: (
        <>
          <p>
            PHP lze vložit do šablony mezi <Code>&lt;?php ... ?&gt;</Code> a hodnoty vypsat pomocí{' '}
            <Code>echo</Code>. Proměnné začínají znakem <Code>$</Code>, pole mohou být indexová i
            asociativní a opakovanou logiku uzavíráme do funkcí. Soubory propojují{' '}
            <Code>include</Code> a <Code>require</Code>.
          </p>
          <p>
            Každý HTTP požadavek obvykle spustí skript od začátku do konce. Informace o požadavku
            zpřístupňují superglobální pole <Code>$_GET</Code>, <Code>$_POST</Code>,{' '}
            <Code>$_SERVER</Code> a po zahájení session také <Code>$_SESSION</Code>. Tato data jsou
            vstupem zvenčí a aplikace je musí před použitím ověřit.
          </p>
        </>
      ),
    },
    {
      title: 'Moderní PHP (8.x)',
      content: (
        <>
          <p>
            Současné PHP podporuje typy parametrů a návratových hodnot, union typy jako{' '}
            <Code>int|float</Code>, pojmenované argumenty, výraz <Code>match</Code>, nullsafe
            operátor i výčty. Tyto prvky pomáhají přesunout chyby blíž k místu, kde vznikají, a
            zpřesňují veřejné rozhraní funkcí a tříd.
          </p>
          <p>
            Pro výukový i produkční kód je vhodné začít soubor deklarací{' '}
            <Code>declare(strict_types=1);</Code>. Striktní režim nenahrazuje validaci dat, ale
            omezuje překvapivé automatické převody při volání typovaných funkcí.
          </p>
        </>
      ),
    },
    {
      title: 'Ekosystém a praxe',
      content: (
        <>
          <p>
            Composer zapisuje závislosti projektu a autoloading podle PSR-4 zpřístupňuje třídy bez
            ručního načítání každého souboru. Laravel nabízí rychlou cestu k běžným webovým funkcím,
            zatímco Symfony poskytuje samostatné komponenty i základ pro rozsáhlejší aplikace.
          </p>
          <p>
            Pro databáze lze použít PDO s připravenými dotazy nebo vyšší vrstvu ORM či DBAL. Volba
            nástroje se mění podle projektu, ale oddělení doménové logiky, HTTP vrstvy a persistence
            zůstává důležité v každém frameworku.
          </p>
        </>
      ),
    },
    {
      title: 'Bezpečnostní minimum',
      content: (
        <>
          <p>
            Vstupům z <Code>$_GET</Code> a <Code>$_POST</Code> nikdy automaticky nedůvěřujte.
            Nejprve je validujte a normalizujte, SQL posílejte přes připravené dotazy a text
            vkládaný do HTML escapujte pomocí{' '}
            <Code>htmlspecialchars($value, ENT_QUOTES, &apos;UTF-8&apos;)</Code>.
          </p>
          <p>
            Hesla ukládejte pomocí <Code>password_hash()</Code> a ověřujte přes{' '}
            <Code>password_verify()</Code>. Formuláře měnící stav chrání CSRF token a session
            vyžaduje bezpečné nastavení cookies. Bezpečnost zde není jedna funkce, ale souvislý
            řetěz rozhodnutí od přijetí vstupu po vytvoření odpovědi.
          </p>
        </>
      ),
    },
    {
      title: 'Verze a prostředí',
      content: (
        <>
          <p>
            Aplikace běží v konkrétní verzi PHP a s konkrétní konfigurací. Verzi zjistíte příkazem{' '}
            <Code>php -v</Code>, podrobnosti prostředí funkcí <Code>phpinfo()</Code> a nastavení se
            načítá z <Code>php.ini</Code>. V běžném serverovém stacku požadavky obsluhuje Nginx nebo
            Apache společně s PHP-FPM.
          </p>
          <p>
            Při přesunu mezi lokálním prostředím a serverem vždy ověřte dostupná rozšíření, limity a
            verzi runtime. Konkrétní postup pro tento kurz shrnuje{' '}
            <a
              href="https://cw.fel.cvut.cz/wiki/courses/b6b39zwa/tutorials/08/start"
              target="_blank"
              rel="noreferrer noopener"
            >
              zadání cvičení 8
            </a>
            .
          </p>
        </>
      ),
    },
  ];

  return (
    <div className={contentStyles.theoryFlow} data-theory-flow="true">
      {sections.map((section, index) => (
        <React.Fragment key={section.title}>
          <section className={contentStyles.theoryTopic} data-theory-topic="true">
            <span className={contentStyles.theoryIndex}>{String(index + 1).padStart(2, '0')}</span>
            <div className={contentStyles.theoryBody}>
              <h3>{section.title}</h3>
              {section.content}
            </div>
          </section>
          {index === 2 ? (
            <EditorialIllustration
              alt="Webový požadavek prochází PHP serverem, aplikační logikou a databází a vrací hotovou stránku."
              src="/course-art/editorial/php-request-lifecycle.png"
            />
          ) : null}
        </React.Fragment>
      ))}
    </div>
  );
}

function SshTutorial() {
  return (
    <div className="mt-4 space-y-4">
      <InfoBox type="info">
        <div className="font-semibold mb-1">Cíl</div>
        <div className="text-sm">
          Připojit se na server <Code>zwa.toad.cz</Code> přes SSH, ověřit přístup a případně změnit
          heslo. Následně připravit webový adresář <Code>www/01</Code> a vytvořit{' '}
          <Code>index.html</Code>.
        </div>
      </InfoBox>

      <div className="rounded-xl border p-4 bg-white/70 dark:bg-zinc-900/60 border-zinc-200/60 dark:border-zinc-800">
        <h3 className="text-lg font-semibold mb-3">1) Připojení přes SSH</h3>
        <ul className="list-decimal pl-5 space-y-1 text-sm text-zinc-700 dark:text-zinc-300 mb-3">
          <li>Otevřete Terminal (macOS/Linux) nebo Ubuntu/WSL/Terminal (Windows).</li>
          <li>
            Zadejte příkaz: <Code>ssh username@zwa.toad.cz</Code> (username = vaše ČVUT přihlašovací
            jméno).
          </li>
          <li>
            Při dotazu na otisk klíče potvrďte <Code>yes</Code>, poté zadejte výchozí heslo{' '}
            <Code>webove aplikace</Code> (doporučeno ihned změnit).
          </li>
        </ul>
        <TheoryCodeBlock>
          <code className="language-bash">{`ssh username@zwa.toad.cz
# Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
# password: webove aplikace (výchozí)`}</code>
        </TheoryCodeBlock>
        <InfoBox>
          <div className="text-sm">
            Po přihlášení můžete ověřit, že webové prostředí reaguje, návštěvou{' '}
            <Code>http://zwa.toad.cz/~username/</Code>
            (zpočátku může vracet 404/403, dokud nevytvoříte složky a soubor).
          </div>
        </InfoBox>
      </div>

      <div className="rounded-xl border p-4 bg-white/70 dark:bg-zinc-900/60 border-zinc-200/60 dark:border-zinc-800">
        <h3 className="text-lg font-semibold mb-3">2) Změna hesla (volitelné)</h3>
        <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-2">
          Po prvním přihlášení s výchozím heslem <Code>webove aplikace</Code> doporučujeme okamžitě
          změnit své heslo pomocí <Code>passwd</Code>:
        </p>
        <TheoryCodeBlock>
          <code className="language-bash">{`passwd
# Current password: ****
# New password: ****
# Retype new password: ****`}</code>
        </TheoryCodeBlock>
        <InfoBox type="warning">
          <div className="text-sm">
            Pokud server používá napojení na centrální ČVUT autentizaci, správa hesla může probíhat
            mimo server (např. v UI ČVUT). Postupujte podle pokynů k serveru. Jinak{' '}
            <Code>passwd</Code> změní vaše lokální unixové heslo na <Code>zwa.toad.cz</Code>.
          </div>
        </InfoBox>
      </div>

      <div className="rounded-xl border p-4 bg-white/70 dark:bg-zinc-900/60 border-zinc-200/60 dark:border-zinc-800">
        <h3 className="text-lg font-semibold mb-3">3) Příprava adresáře a jednoduchá stránka</h3>
        <ul className="list-decimal pl-5 space-y-1 text-sm text-zinc-700 dark:text-zinc-300 mb-3">
          <li>
            V domovském adresáři vytvořte <Code>www/01</Code>.
          </li>
          <li>
            Uvnitř <Code>01</Code> vytvořte <Code>index.html</Code>.
          </li>
          <li>
            Ověřte v prohlížeči: <Code>http://zwa.toad.cz/~username/</Code>
          </li>
        </ul>
        <TheoryCodeBlock>
          <code className="language-bash">{`mkdir -p ~/www/01
cd ~/www/01
cat > index.html <<'HTML'
<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <title>Hello ZWA</title>
</head>
<body>
  <h1>Hello ZWA!</h1>
</body>
</html>
HTML`}</code>
        </TheoryCodeBlock>
      </div>

      <div className="text-xs text-zinc-500">
        Podle návodu k FileZille vycházejícího z materiálu kolegy (CZ):{' '}
        <a
          className="underline"
          href="https://github.com/koko007/FileZilla-connection-MacOS-and-Windows-cz/"
          target="_blank"
          rel="noreferrer noopener"
        >
          FileZilla connection – macOS a Windows
        </a>
      </div>
    </div>
  );
}

function FileZillaTutorial() {
  return (
    <div className="mt-4 space-y-4">
      <InfoBox type="info">
        <div className="font-semibold mb-1">Cíl</div>
        <div className="text-sm">
          Připojit se pomocí FileZilla přes SFTP na <Code>zwa.toad.cz</Code>, vytvořit{' '}
          <Code>www/01</Code> a nahrát <Code>index.html</Code>.
        </div>
      </InfoBox>

      <div className="rounded-xl border p-4 bg-white/70 dark:bg-zinc-900/60 border-zinc-200/60 dark:border-zinc-800">
        <h3 className="text-lg font-semibold mb-3">1) Instalace FileZilla</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
          <li>
            macOS: stáhněte klient z <Code>filezilla-project.org</Code> (standardní verze, ne
            „Pro“).
          </li>
          <li>
            Windows: stáhněte klient z <Code>filezilla-project.org</Code> (x64). Nainstalujte s
            doporučenými volbami.
          </li>
        </ul>
      </div>

      <div className="rounded-xl border p-4 bg-white/70 dark:bg-zinc-900/60 border-zinc-200/60 dark:border-zinc-800">
        <h3 className="text-lg font-semibold mb-3">2) Rychlé připojení (SFTP)</h3>
        <ul className="list-decimal pl-5 space-y-1 text-sm text-zinc-700 dark:text-zinc-300 mb-3">
          <li>
            Do pole Host zadejte <Code>sftp://zwa.toad.cz</Code>
          </li>
          <li>Username = vaše ČVUT přihlašovací jméno</li>
          <li>
            Password = výchozí <Code>webove aplikace</Code> (po přihlášení přes SSH si heslo změňte
            pomocí <Code>passwd</Code>)
          </li>
          <li>
            Klikněte na <strong>Quickconnect</strong> a potvrďte uložení údajů dle preferencí
          </li>
        </ul>
        <InfoBox>
          <div className="text-sm">
            Při prvním připojení potvrďte bezpečnostní dotaz/otisk serveru. Pokud nezvolíte ukládání
            hesla, budete ho zadávat při dalších připojeních.
          </div>
        </InfoBox>
      </div>

      <div className="rounded-xl border p-4 bg-white/70 dark:bg-zinc-900/60 border-zinc-200/60 dark:border-zinc-800">
        <h3 className="text-lg font-semibold mb-3">3) Vytvoření složek a souboru</h3>
        <ul className="list-decimal pl-5 space-y-1 text-sm text-zinc-700 dark:text-zinc-300 mb-3">
          <li>Po připojení přejděte do domovské složky na serveru (pravé okno).</li>
          <li>
            Vytvořte <Code>www</Code> a uvnitř <Code>01</Code> (Right click → Create directory).
          </li>
          <li>
            Vytvořte soubor <Code>index.html</Code>: Right click → View/Edit, zvolte IDE, vložte
            HTML, uložte, FileZilla nabídne upload → potvrďte.
          </li>
        </ul>
        <TheoryCodeBlock>
          <code className="language-html">{`<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <title>Hello world!</title>
</head>
<body>
  <h1>Hello world!</h1>
</body>
</html>`}</code>
        </TheoryCodeBlock>
        <div className="text-sm text-zinc-700 dark:text-zinc-300">
          Pak otevřete <Code>http://zwa.toad.cz/~username/</Code> a ověřte, že vidíte obsah. Pokud
          vidíte složku, vstupte do <Code>01/</Code> a otevřete <Code>index.html</Code>.
        </div>
      </div>

      <div className="text-xs text-zinc-500">
        Podrobný návod a snímky obrazovek (CZ):{' '}
        <a
          className="underline"
          href="https://github.com/koko007/FileZilla-connection-MacOS-and-Windows-cz/"
          target="_blank"
          rel="noreferrer noopener"
        >
          FileZilla connection – macOS a Windows
        </a>
      </div>
    </div>
  );
}
