import React, { useMemo, useState } from "react";
import { getLessonByNumber } from "./src/config/lessons.js";
import LessonShell, { useSlideNavigation } from "./src/components/lesson/LessonShell.jsx";
import SharedSlideCard from "./src/components/lesson/SlideCard.jsx";
import Code from "./src/components/lesson/Code.jsx";
import InfoBox from "./src/components/lesson/InfoBox.jsx";
import ClickToRevealSolution from "./src/components/lesson/ClickToRevealSolution.jsx";
import { clsx } from "./src/components/lesson/classNames.js";

function LessonSlideContent({ slide }) {
  return (
    <SharedSlideCard slide={slide} idPrefix="lesson-8">
      {slide.id === "title" && (
        <div className="mt-6 text-zinc-600 dark:text-zinc-400">
          <div>Autor: Bc. Egor Ulianov</div>
          <div>Datum: 12. 11. 2025</div>
        </div>
      )}

      {slide.id === "toc" && (
        <ul className="list-disc pl-6 space-y-2 text-lg">
          <li>1 – Výpis aktuálního data</li>
          <li>2 – Práce s datem (den.měsíc.rok → timestamp → den v týdnu)</li>
          <li>3 – Funkce pro formátování</li>
          <li>4 – Průchod pole dat</li>
          <li>5 – Vytváření pole měsíců</li>
          <li>6 – Různé (unikátní) měsíce</li>
          <li>7 – Zjištění, zda řetězec je kladné celé číslo</li>
          <li>8 – Nepovinné parametry <Code>$min</Code> a <Code>$max</Code></li>
        </ul>
      )}

      {slide.id === "theory" && (
        <PhpTheorySections />
      )}

      {slide.id === "t1" && <Task1 />}
      {slide.id === "t2" && <Task2 />}
      {slide.id === "t3" && <Task3 />}
      {slide.id === "t4" && <Task4 />}
      {slide.id === "t5" && <Task5 />}
      {slide.id === "t6" && <Task6 />}
      {slide.id === "t7" && <Task7 />}
      {slide.id === "t8" && <Task8 />}

      {slide.id === "summary" && (
        <div className="space-y-3">
          <ul className="list-disc pl-6 space-y-2">
            <li>Práce s datem: <Code>date()</Code>, <Code>mktime()</Code>, rozklad řetězce</li>
            <li>Funkce a průchod pole: <Code>foreach</Code>, návratové hodnoty</li>
            <li>Operace s poli: <Code>array_map()</Code>, <Code>array_unique()</Code>, <Code>sort()</Code></li>
            <li>Validace řetězce jako čísla: <Code>ctype_digit()</Code></li>
            <li>Nepovinné parametry a podmínky: <Code>$min</Code>, <Code>$max</Code></li>
          </ul>
          <p className="text-2xl font-bold text-center text-sky-600 dark:text-sky-400">
            Děkuji za pozornost!
          </p>
        </div>
      )}
    </SharedSlideCard>
  );
}

function Task1() {
  return (
    <div>
      <h3 className="text-xl font-semibold mb-3">1 – Výpis aktuálního data</h3>
      <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-4">
        Vytvořte soubor <Code>datum.php</Code> a do HTML vložte PHP kód, který vypíše dnešní datum.
      </p>
      <InfoBox>
        <div className="font-semibold mb-1">Užitečná syntaxe a dokumentace</div>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>
            Datum/čas: <Code>date('j.n.Y')</Code> —{" "}
            <a className="underline" href="https://www.php.net/date" target="_blank" rel="noreferrer noopener">php.net/date</a>
          </li>
          <li>
            Aktuální čas: <Code>time()</Code> —{" "}
            <a className="underline" href="https://www.php.net/time" target="_blank" rel="noreferrer noopener">php.net/time</a>
          </li>
          <li>
            Základní přehled manuálu —{" "}
            <a className="underline" href="https://www.php.net/manual/en/" target="_blank" rel="noreferrer noopener">php.net/manual</a>
          </li>
        </ul>
      </InfoBox>
      <ClickToRevealSolution hint="Nápověda: funkce date('j.n.Y')">
        <div className="space-y-3">
          <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm">
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
          </pre>
        </div>
      </ClickToRevealSolution>
    </div>
  );
}

function Task2() {
  return (
    <div>
      <h3 className="text-xl font-semibold mb-3">2 – Práce s datem</h3>
      <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-2">
        Mějte proměnnou <Code>$datum</Code> ve tvaru <Code>den.mesic.rok</Code>. Naplňte <Code>$den</Code>, <Code>$mesic</Code>, <Code>$rok</Code>, vytvořte <Code>$timestamp</Code> a vypište
        den v týdnu.
      </p>
      <InfoBox>
        <div className="font-semibold mb-1">Užitečná syntaxe a dokumentace</div>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>
            Rozdělení řetězce: <Code>explode('.', $str)</Code> —{" "}
            <a className="underline" href="https://www.php.net/explode" target="_blank" rel="noreferrer noopener">php.net/explode</a>
          </li>
          <li>
            Přiřazení z pole: <Code>list($a, $b) = ...</Code> —{" "}
            <a className="underline" href="https://www.php.net/manual/en/function.list.php" target="_blank" rel="noreferrer noopener">php.net/list</a>
          </li>
          <li>
            Unix timestamp pro datum: <Code>mktime(0,0,0,$m,$d,$y)</Code> —{" "}
            <a className="underline" href="https://www.php.net/mktime" target="_blank" rel="noreferrer noopener">php.net/mktime</a>
          </li>
          <li>
            Den v týdnu: <Code>date('N', $ts)</Code> —{" "}
            <a className="underline" href="https://www.php.net/date" target="_blank" rel="noreferrer noopener">php.net/date</a>
          </li>
        </ul>
      </InfoBox>
      <ClickToRevealSolution hint="explode('.', $datum) + mktime(0,0,0,$mesic,$den,$rok) + date()">
        <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm">
<code className="language-php">{`<?php
$datum = "12.6.2008";
list($den, $mesic, $rok) = explode('.', $datum);
$timestamp = mktime(0, 0, 0, (int)$mesic, (int)$den, (int)$rok);

// CZ názvy dní (1 = pondělí ... 7 = neděle)
$dny = [1=>"pondělí","úterý","středa","čtvrtek","pátek","sobota","neděle"];
$cisloDne = (int)date('N', $timestamp);
echo "$den.$mesic.$rok je " . $dny[$cisloDne];`}</code>
        </pre>
      </ClickToRevealSolution>
    </div>
  );
}

function Task3() {
  return (
    <div>
      <h3 className="text-xl font-semibold mb-3">3 – Funkce</h3>
      <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-2">
        Převeďte řešení z 2 na funkci, která přijme řetězec data a vrátí text s datem a dnem v týdnu.
      </p>
      <InfoBox>
        <div className="font-semibold mb-1">Užitečná syntaxe a dokumentace</div>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>
            Uživ. funkce: <Code>function name($arg): string {'{'} ... {'}'}</Code> —{" "}
            <a className="underline" href="https://www.php.net/manual/en/functions.user-defined.php" target="_blank" rel="noreferrer noopener">php.net/functions.user-defined</a>
          </li>
          <li>
            Typové deklarace (argumenty/return) —{" "}
            <a className="underline" href="https://www.php.net/manual/en/language.types.declarations.php" target="_blank" rel="noreferrer noopener">php.net/type-declarations</a>
          </li>
          <li>
            Vrácení hodnoty: <Code>return ...</Code> —{" "}
            <a className="underline" href="https://www.php.net/manual/en/functions.returning-values.php" target="_blank" rel="noreferrer noopener">php.net/returning-values</a>
          </li>
        </ul>
      </InfoBox>
      <ClickToRevealSolution hint="function formatCzechDate($str) { ... return '12.6.2008 je čtvrtek'; }">
        <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm">
<code className="language-php">{`<?php
function formatCzechDate(string $dateStr): string {
  list($den, $mesic, $rok) = explode('.', $dateStr);
  $ts = mktime(0, 0, 0, (int)$mesic, (int)$den, (int)$rok);
  $dny = [1=>"pondělí","úterý","středa","čtvrtek","pátek","sobota","neděle"];
  $cisloDne = (int)date('N', $ts);
  return "$den.$mesic.$rok je " . $dny[$cisloDne];
}

echo formatCzechDate("12.6.2008");`}</code>
        </pre>
      </ClickToRevealSolution>
    </div>
  );
}

function Task4() {
  return (
    <div>
      <h3 className="text-xl font-semibold mb-3">4 – Průchod pole</h3>
      <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-2">
        Mějte pole řetězců s daty jako v příkladu 2. Pro každý řádek vypište pořadí (od 1), datum a den v týdnu.
      </p>
      <InfoBox>
        <div className="font-semibold mb-1">Užitečná syntaxe a dokumentace</div>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>
            Cykly: <Code>foreach ($xs as $i =&gt; $x) {'{'} ... {'}'}</Code> —{" "}
            <a className="underline" href="https://www.php.net/manual/en/control-structures.foreach.php" target="_blank" rel="noreferrer noopener">php.net/foreach</a>
          </li>
          <li>
            Výstup: <Code>echo</Code>, řetězení tečkou <Code>.</Code> —{" "}
            <a className="underline" href="https://www.php.net/manual/en/function.echo.php" target="_blank" rel="noreferrer noopener">php.net/echo</a>
          </li>
          <li>
            Interpolace: <Code>"Řádek $i"</Code> —{" "}
            <a className="underline" href="https://www.php.net/manual/en/language.types.string.php" target="_blank" rel="noreferrer noopener">php.net/strings</a>
          </li>
        </ul>
      </InfoBox>
      <ClickToRevealSolution hint="foreach ($data as $i => $d) { echo ($i+1).'. '.formatCzechDate($d); }">
        <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm">
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
        </pre>
      </ClickToRevealSolution>
    </div>
  );
}

function Task5() {
  return (
    <div>
      <h3 className="text-xl font-semibold mb-3">5 – Vytváření pole</h3>
      <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-2">
        Napište funkci, která vrátí pole všech čísel měsíců z pole dat.
      </p>
      <InfoBox>
        <div className="font-semibold mb-1">Užitečná syntaxe a dokumentace</div>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>
            Mapování: <Code>array_map(fn($s) =&gt; ..., $dates)</Code> —{" "}
            <a className="underline" href="https://www.php.net/array_map" target="_blank" rel="noreferrer noopener">php.net/array_map</a>
          </li>
          <li>
            Arrow funkce: <Code>fn($x) =&gt; $x + 1</Code> —{" "}
            <a className="underline" href="https://www.php.net/manual/en/functions.arrow.php" target="_blank" rel="noreferrer noopener">php.net/arrow-functions</a>
          </li>
          <li>
            Rozdělení: <Code>explode('.', $str)</Code> —{" "}
            <a className="underline" href="https://www.php.net/explode" target="_blank" rel="noreferrer noopener">php.net/explode</a>
          </li>
        </ul>
      </InfoBox>
      <ClickToRevealSolution hint="array_map + explode">
        <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm">
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
        </pre>
      </ClickToRevealSolution>
    </div>
  );
}

function Task6() {
  return (
    <div>
      <h3 className="text-xl font-semibold mb-3">6 – Různé měsíce</h3>
      <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-2">
        Upravte funkci tak, aby vracela pouze unikátní čísla měsíců (bez duplicit).
      </p>
      <InfoBox>
        <div className="font-semibold mb-1">Užitečná syntaxe a dokumentace</div>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>
            Unikátní hodnoty: <Code>array_unique($xs)</Code> —{" "}
            <a className="underline" href="https://www.php.net/array_unique" target="_blank" rel="noreferrer noopener">php.net/array_unique</a>
          </li>
          <li>
            Seřazení: <Code>sort($xs)</Code> —{" "}
            <a className="underline" href="https://www.php.net/sort" target="_blank" rel="noreferrer noopener">php.net/sort</a>
          </li>
          <li>
            Přeindexování: <Code>array_values($xs)</Code> —{" "}
            <a className="underline" href="https://www.php.net/array_values" target="_blank" rel="noreferrer noopener">php.net/array_values</a>
          </li>
        </ul>
      </InfoBox>
      <ClickToRevealSolution hint="array_unique + sort">
        <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm">
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
        </pre>
      </ClickToRevealSolution>
    </div>
  );
}

function Task7() {
  return (
    <div>
      <h3 className="text-xl font-semibold mb-3">7 – Zjištění typu proměnné</h3>
      <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-2">
        Napište funkci, která zjistí, zda řetězec představuje kladné celé číslo.
      </p>
      <InfoBox>
        <div className="font-semibold mb-1">Užitečná syntaxe a dokumentace</div>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>
            Číslice: <Code>ctype_digit($s)</Code> —{" "}
            <a className="underline" href="https://www.php.net/ctype_digit" target="_blank" rel="noreferrer noopener">php.net/ctype_digit</a>
          </li>
          <li>
            Validace integer: <Code>filter_var($s, FILTER_VALIDATE_INT)</Code> —{" "}
            <a className="underline" href="https://www.php.net/manual/en/filter.filters.validate.php" target="_blank" rel="noreferrer noopener">php.net/FILTER_VALIDATE_INT</a>
          </li>
          <li>
            Přetypování: <Code>(int)$s</Code> —{" "}
            <a className="underline" href="https://www.php.net/manual/en/language.types.integer.php" target="_blank" rel="noreferrer noopener">php.net/integer</a>
          </li>
        </ul>
      </InfoBox>
      <ClickToRevealSolution hint="ctype_digit a hodnota > 0">
        <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm">
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
        </pre>
      </ClickToRevealSolution>
    </div>
  );
}

function Task8() {
  return (
    <div>
      <h3 className="text-xl font-semibold mb-3">8 – Nepovinné parametry funkcí</h3>
      <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-2">
        Rozšiřte funkci o nepovinné parametry <Code>$min</Code> a <Code>$max</Code> dle zadání.
      </p>
      <InfoBox>
        <div className="font-semibold mb-1">Užitečná syntaxe a dokumentace</div>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>
            Nepovinné parametry: <Code>function f($x, $min = null)</Code> —{" "}
            <a className="underline" href="https://www.php.net/manual/en/functions.arguments.php" target="_blank" rel="noreferrer noopener">php.net/function-arguments</a>
          </li>
          <li>
            Typy a nullable: <Code>function f(?int $min): bool</Code> —{" "}
            <a className="underline" href="https://www.php.net/manual/en/language.types.declarations.php" target="_blank" rel="noreferrer noopener">php.net/type-declarations</a>
          </li>
          <li>
            Porovnání čísel: <Code>$val &gt;= $min</Code>, <Code>$val &lt;= $max</Code>
          </li>
        </ul>
      </InfoBox>
      <ClickToRevealSolution hint="function isPositiveInt($s, $min = null, $max = null)">
        <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm">
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
        </pre>
      </ClickToRevealSolution>
    </div>
  );
}

export default function AppPhpLesson8() {
  const slides = useMemo(
    () => [
      { id: "title", title: "Základy webových aplikací – 8. cvičení", subtitle: "PHP – Malý test #2 (základy PHP)" },
      { id: "toc", title: "Obsah" },
      { id: "theory", title: "Teorie – PHP rychlý přehled" },
      { id: "ssh", title: "Jak se připojit přes SSH + nastavení hesla" },
      { id: "filezilla", title: "Jak se připojit přes FileZilla (SFTP)" },
      { id: "t1", title: "Úkol 1: Výpis aktuálního data" },
      { id: "t2", title: "Úkol 2: Práce s datem" },
      { id: "t3", title: "Úkol 3: Funkce" },
      { id: "t4", title: "Úkol 4: Průchod pole" },
      { id: "t5", title: "Úkol 5: Vytváření pole měsíců" },
      { id: "t6", title: "Úkol 6: Různé měsíce" },
      { id: "t7", title: "Úkol 7: Zjištění typu proměnné" },
      { id: "t8", title: "Úkol 8: Nepovinné parametry" },
      { id: "summary", title: "Shrnutí" },
    ],
    []
  );
  const { activeSlide, setActiveSlide } = useSlideNavigation(slides);
  const current = slides.find((s) => s.id === activeSlide) || slides[0];

  return (
    <LessonShell
      lesson={getLessonByNumber(8)}
      slides={slides}
      activeSlide={activeSlide}
      onChange={setActiveSlide}
      title="ZWA-8: PHP Basics – Malý test #2"
      subtitle="Interaktivní prezentace s ukázkami kódu pro PHP základy"
      footerText="© 2025 ZWA – Cvičení 8: PHP Basics"
    >
      <LessonSlideContent slide={current} />
      {current.id === "ssh" && <SshTutorial />}
      {current.id === "filezilla" && <FileZillaTutorial />}
    </LessonShell>
  );
}

function PhpTheorySections() {
  const sections = useMemo(() => [
    {
      title: "Co je PHP?",
      content: (
        <InfoBox type="info">
          <div className="font-semibold mb-1">Co je PHP?</div>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            PHP je skriptovací jazyk pro server‑side vykreslování webu. Běží na serveru, generuje HTML/JSON
            a výsledek posílá klientovi. Je široce dostupný na hostinzích a pohání populární systémy
            jako WordPress, MediaWiki či Moodle.
          </p>
        </InfoBox>
      )
    },
    {
      title: "Proč se PHP stále používá",
      content: (
        <InfoBox>
          <div className="font-semibold mb-1">Proč se PHP stále používá</div>
          <ul className="list-disc pl-5 space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
            <li>Jednoduché nasazení – běží téměř všude (Apache/Nginx + PHP‑FPM).</li>
            <li>Silný ekosystém – Composer, Packagist, frameworky (Laravel, Symfony).</li>
            <li>Rychlý vývoj klasických webů a admin rozhraní.</li>
            <li>Nízká bariéra vstupu, velká komunita a dokumentace.</li>
          </ul>
        </InfoBox>
      )
    },
    {
      title: "Hlavní koncepty jazyka",
      content: (
        <InfoBox>
          <div className="font-semibold mb-1">Hlavní koncepty jazyka</div>
          <ul className="list-disc pl-5 space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
            <li>Vkládání do HTML: <Code>&lt;?php ... ?&gt;</Code>, výstup přes <Code>echo</Code>.</li>
            <li>Proměnné s <Code>$</Code>, pole indexová i asociativní: <Code>[]</Code>, <Code>array()</Code>.</li>
            <li>Funkce: <Code>function f($x) {'{'} return $x; {'}'}</Code>, soubory: <Code>include</Code>/<Code>require</Code>.</li>
            <li>Superglobály: <Code>$_GET</Code>, <Code>$_POST</Code>, <Code>$_SERVER</Code>, <Code>$_SESSION</Code>.</li>
            <li>Životní cyklus: každý HTTP požadavek spustí skript od začátku do konce.</li>
          </ul>
        </InfoBox>
      )
    },
    {
      title: "Moderní PHP (8.x)",
      content: (
        <InfoBox>
          <div className="font-semibold mb-1">Moderní PHP (8.x) – vybrané prvky</div>
          <ul className="list-disc pl-5 space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
            <li>Typové deklarace (scalar/return), union typy (<Code>int|float</Code>), <Code>mixed</Code>.</li>
            <li><Code>match</Code> výraz, nullsafe operátor <Code>?-&gt;</Code>, named arguments.</li>
            <li>Attributes (anotace), readonly vlastnosti, enums (8.1), JIT (8.0).</li>
            <li>Doporučení: <Code>declare(strict_types=1);</Code> na začátku souboru.</li>
          </ul>
        </InfoBox>
      )
    },
    {
      title: "Ekosystém a praxe",
      content: (
        <InfoBox>
          <div className="font-semibold mb-1">Ekosystém a praxe</div>
          <ul className="list-disc pl-5 space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
            <li>Správa balíčků: <Code>Composer</Code> + <Code>autoload</Code> (PSR‑4).</li>
            <li>Frameworky: Laravel (rychlý vývoj), Symfony (enterprise, komponenty).</li>
            <li>Databáze: PDO (prepared statements), ORM/DBAL podle frameworku.</li>
          </ul>
        </InfoBox>
      )
    },
    {
      title: "Bezpečnostní minimum",
      content: (
        <InfoBox>
          <div className="font-semibold mb-1">Bezpečnostní minimum</div>
          <ul className="list-disc pl-5 space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
            <li>Únik HTML: <Code>htmlspecialchars($v, ENT_QUOTES, 'UTF-8')</Code>.</li>
            <li>Vstupy: <Code>filter_input()</Code>, validace/normalizace, nikdy ne‑důvěřovat <Code>$_GET/$_POST</Code>.</li>
            <li>DB: vždy prepared statements (PDO), žádné stringové skládání SQL.</li>
            <li>Hesla: <Code>password_hash()</Code> / <Code>password_verify()</Code>, nikdy ne ukládat v plaintextu.</li>
            <li>CSRF: token ve formulářích; session: <Code>session_start()</Code> + bezpečná konfigurace cookies.</li>
          </ul>
        </InfoBox>
      )
    },
    {
      title: "Verze a prostředí",
      content: (
        <InfoBox>
          <div className="font-semibold mb-1">Verze a prostředí</div>
          <ul className="list-disc pl-5 space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
            <li>Aktuální řada je 8.x. Verzi na serveru zjistíte: <Code>php -v</Code> nebo <Code>phpinfo()</Code>.</li>
            <li>Serverový stack: Apache/Nginx + PHP‑FPM; konfigurace přes <Code>php.ini</Code>.</li>
          </ul>
          <div className="mt-3 text-xs text-zinc-600 dark:text-zinc-400">
            Zadání cvičení:{" "}
            <a
              className="underline"
              href="https://cw.fel.cvut.cz/wiki/courses/b6b39zwa/tutorials/08/start"
              target="_blank"
              rel="noreferrer noopener"
            >
              Cvičení 8 – Jazyk PHP (Malý test #2)
            </a>
          </div>
        </InfoBox>
      )
    },
  ], []);

  const [idx, setIdx] = useState(0);
  const total = sections.length;
  const cur = sections[idx];

  return (
    <div>
      <div className="rounded-xl border border-zinc-200/60 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800">
            Krok {idx + 1} / {total}
          </span>
          <div className="font-semibold text-sm">{cur.title}</div>
        </div>
        <div>{cur.content}</div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <button
          className="px-3 py-1.5 text-sm rounded-lg border border-zinc-200/60 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 disabled:opacity-50"
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
          disabled={idx === 0}
        >
          Předchozí
        </button>
        <div className="flex items-center gap-1">
          {sections.map((_, i) => (
            <button
              key={i}
              className={clsx("h-2.5 w-2.5 rounded-full border border-zinc-300/60 dark:border-zinc-700", i === idx ? "bg-sky-500" : "bg-zinc-200 dark:bg-zinc-800")}
              onClick={() => setIdx(i)}
              aria-label={`Přejít na krok ${i + 1}`}
            />
          ))}
        </div>
        <button
          className="px-3 py-1.5 text-sm rounded-lg border border-sky-500/30 bg-sky-600 text-white disabled:opacity-50"
          onClick={() => setIdx((i) => Math.min(total - 1, i + 1))}
          disabled={idx === total - 1}
        >
          Další
        </button>
      </div>
    </div>
  );
}

function SshTutorial() {
  return (
    <div className="mt-4 space-y-4">
      <InfoBox type="info">
        <div className="font-semibold mb-1">Cíl</div>
        <div className="text-sm">
          Připojit se na server <Code>zwa.toad.cz</Code> přes SSH, ověřit přístup a případně změnit heslo. Následně připravit
          webový adresář <Code>www/01</Code> a vytvořit <Code>index.html</Code>.
        </div>
      </InfoBox>

      <div className="rounded-xl border p-4 bg-white/70 dark:bg-zinc-900/60 border-zinc-200/60 dark:border-zinc-800">
        <h3 className="text-lg font-semibold mb-3">1) Připojení přes SSH</h3>
        <ul className="list-decimal pl-5 space-y-1 text-sm text-zinc-700 dark:text-zinc-300 mb-3">
          <li>Otevřete Terminal (macOS/Linux) nebo Ubuntu/WSL/Terminal (Windows).</li>
          <li>Zadejte příkaz: <Code>ssh username@zwa.toad.cz</Code> (username = vaše ČVUT přihlašovací jméno).</li>
          <li>Při dotazu na otisk klíče potvrďte <Code>yes</Code>, poté zadejte výchozí heslo <Code>webove aplikace</Code> (doporučeno ihned změnit).</li>
        </ul>
        <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm mb-3">
<code className="language-bash">{`ssh username@zwa.toad.cz
# Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
# password: webove aplikace (výchozí)`}</code>
        </pre>
        <InfoBox>
          <div className="text-sm">
            Po přihlášení můžete ověřit, že webové prostředí reaguje, návštěvou <Code>http://zwa.toad.cz/~username/</Code>
            (zpočátku může vracet 404/403, dokud nevytvoříte složky a soubor).
          </div>
        </InfoBox>
      </div>

      <div className="rounded-xl border p-4 bg-white/70 dark:bg-zinc-900/60 border-zinc-200/60 dark:border-zinc-800">
        <h3 className="text-lg font-semibold mb-3">2) Změna hesla (volitelné)</h3>
        <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-2">
          Po prvním přihlášení s výchozím heslem <Code>webove aplikace</Code> doporučujeme okamžitě změnit své heslo pomocí <Code>passwd</Code>:
        </p>
        <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm mb-3">
<code className="language-bash">{`passwd
# Current password: ****
# New password: ****
# Retype new password: ****`}</code>
        </pre>
        <InfoBox type="warning">
          <div className="text-sm">
            Pokud server používá napojení na centrální ČVUT autentizaci, správa hesla může probíhat mimo server (např. v UI ČVUT).
            Postupujte podle pokynů k serveru. Jinak <Code>passwd</Code> změní vaše lokální unixové heslo na <Code>zwa.toad.cz</Code>.
          </div>
        </InfoBox>
      </div>

      <div className="rounded-xl border p-4 bg-white/70 dark:bg-zinc-900/60 border-zinc-200/60 dark:border-zinc-800">
        <h3 className="text-lg font-semibold mb-3">3) Příprava adresáře a jednoduchá stránka</h3>
        <ul className="list-decimal pl-5 space-y-1 text-sm text-zinc-700 dark:text-zinc-300 mb-3">
          <li>V domovském adresáři vytvořte <Code>www/01</Code>.</li>
          <li>Uvnitř <Code>01</Code> vytvořte <Code>index.html</Code>.</li>
          <li>Ověřte v prohlížeči: <Code>http://zwa.toad.cz/~username/</Code></li>
        </ul>
        <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm mb-3">
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
        </pre>
      </div>

      <div className="text-xs text-zinc-500">
        Podle návodu k FileZille vycházejícího z materiálu kolegy (CZ):{" "}
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
          Připojit se pomocí FileZilla přes SFTP na <Code>zwa.toad.cz</Code>, vytvořit <Code>www/01</Code> a nahrát <Code>index.html</Code>.
        </div>
      </InfoBox>

      <div className="rounded-xl border p-4 bg-white/70 dark:bg-zinc-900/60 border-zinc-200/60 dark:border-zinc-800">
        <h3 className="text-lg font-semibold mb-3">1) Instalace FileZilla</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
          <li>macOS: stáhněte klient z <Code>filezilla-project.org</Code> (standardní verze, ne „Pro“).</li>
          <li>Windows: stáhněte klient z <Code>filezilla-project.org</Code> (x64). Nainstalujte s doporučenými volbami.</li>
        </ul>
      </div>

      <div className="rounded-xl border p-4 bg-white/70 dark:bg-zinc-900/60 border-zinc-200/60 dark:border-zinc-800">
        <h3 className="text-lg font-semibold mb-3">2) Rychlé připojení (SFTP)</h3>
        <ul className="list-decimal pl-5 space-y-1 text-sm text-zinc-700 dark:text-zinc-300 mb-3">
          <li>Do pole Host zadejte <Code>sftp://zwa.toad.cz</Code></li>
          <li>Username = vaše ČVUT přihlašovací jméno</li>
          <li>Password = výchozí <Code>webove aplikace</Code> (po přihlášení přes SSH si heslo změňte pomocí <Code>passwd</Code>)</li>
          <li>Klikněte na <strong>Quickconnect</strong> a potvrďte uložení údajů dle preferencí</li>
        </ul>
        <InfoBox>
          <div className="text-sm">
            Při prvním připojení potvrďte bezpečnostní dotaz/otisk serveru. Pokud nezvolíte ukládání hesla, budete ho zadávat při dalších připojeních.
          </div>
        </InfoBox>
      </div>

      <div className="rounded-xl border p-4 bg-white/70 dark:bg-zinc-900/60 border-zinc-200/60 dark:border-zinc-800">
        <h3 className="text-lg font-semibold mb-3">3) Vytvoření složek a souboru</h3>
        <ul className="list-decimal pl-5 space-y-1 text-sm text-zinc-700 dark:text-zinc-300 mb-3">
          <li>Po připojení přejděte do domovské složky na serveru (pravé okno).</li>
          <li>Vytvořte <Code>www</Code> a uvnitř <Code>01</Code> (Right click → Create directory).</li>
          <li>Vytvořte soubor <Code>index.html</Code>: Right click → View/Edit, zvolte IDE, vložte HTML, uložte, FileZilla nabídne upload → potvrďte.</li>
        </ul>
        <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm mb-3">
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
        </pre>
        <div className="text-sm text-zinc-700 dark:text-zinc-300">
          Pak otevřete <Code>http://zwa.toad.cz/~username/</Code> a ověřte, že vidíte obsah. Pokud vidíte složku, vstupte do <Code>01/</Code> a otevřete <Code>index.html</Code>.
        </div>
      </div>

      <div className="text-xs text-zinc-500">
        Podrobný návod a snímky obrazovek (CZ):{" "}
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
