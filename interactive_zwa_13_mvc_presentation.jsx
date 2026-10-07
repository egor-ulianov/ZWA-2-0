import { useMemo } from 'react';

import { getLessonByNumber } from './src/config/lessons.js';
import EditorialCallout from './src/course-ui/content/EditorialCallout.jsx';
import EditorialCode from './src/course-ui/content/EditorialCode.jsx';
import Code from './src/course-ui/content/InlineCode.jsx';
import LessonSummary from './src/course-ui/content/LessonSummary.jsx';
import PhpTheoryChapter from './src/course-ui/content/PhpTheoryChapter.jsx';
import PreviousLectureQuiz from './src/course-ui/exercises/PreviousLectureQuiz.jsx';
import StaticExercise from './src/course-ui/exercises/StaticExercise.jsx';
import { LearningExperience } from './src/course-ui/learning/LearningExperience.jsx';
import { LearningSection } from './src/course-ui/learning/LearningSection.jsx';
import { useLearningNavigation } from './src/course-ui/learning/useLearningNavigation.js';

const SECTIONS = [
  {
    id: 'title',
    title: 'Základy webových aplikací – 13. cvičení',
    subtitle: 'Model–View–Controller',
    activityType: 'learn',
  },
  { id: 'quiz', title: 'Opakování předchozí lekce', activityType: 'quick-check' },
  {
    id: 'theory-responsibilities',
    title: 'Teorie – Odpovědnosti Model, View a Controller',
    activityType: 'learn',
  },
  {
    id: 'theory-request-flow',
    title: 'Teorie – Cesta požadavku aplikací',
    activityType: 'learn',
  },
  {
    id: 'theory-structure',
    title: 'Teorie – Struktura MVC projektu',
    activityType: 'learn',
  },
  { id: 'task', title: 'Úkol – Oddělení controlleru a view', activityType: 'apply' },
  { id: 'summary', title: 'Shrnutí', activityType: 'learn' },
];

function ResponsibilitiesChapter() {
  return (
    <PhpTheoryChapter
      intro="MVC dává každé části aplikace jednu hlavní odpovědnost. Nejde o tři adresáře pro pořádek, ale o hranice, které brání míchání SQL, HTTP rozhodování a HTML výstupu."
      title="Tři role spolupracují, ale nezastupují se"
    >
      <ol className="space-y-5">
        <li>
          <strong>Model</strong>
          <p>
            Pracuje s daty a doménovými pravidly. Nezná HTML ani adresu aktuální stránky a neprovádí
            přesměrování.
          </p>
        </li>
        <li>
          <strong>Controller</strong>
          <p>
            Přijme požadavek, ověří vstupy, zavolá model a zvolí odpověď. Je koordinátorem, nikoli
            místem pro veškerou logiku.
          </p>
        </li>
        <li>
          <strong>View</strong>
          <p>
            Vykreslí předaná data. Výstup escapuje, ale nenačítá z databáze a nerozhoduje o toku
            aplikace.
          </p>
        </li>
      </ol>
      <EditorialCallout title="Praktická kontrola" tone="tip">
        <p>
          Pokud lze změnit HTML šablonu bez úpravy SQL dotazu a databázi bez přepisování směrování,
          mají vrstvy užitečné hranice.
        </p>
      </EditorialCallout>
    </PhpTheoryChapter>
  );
}

function RequestFlowChapter() {
  return (
    <PhpTheoryChapter
      intro="Požadavek vstoupí přes jeden veřejný bod aplikace. Router vybere controller, controller získá data z modelu a předá je view. Výsledkem je jedna explicitní HTTP odpověď."
      title="Tok požadavku je čitelný od URL až k odpovědi"
    >
      <ol className="space-y-4" aria-label="Tok HTTP požadavku v MVC">
        <li>
          <strong>1. Router:</strong> spojí metodu a URL s konkrétní akcí.
        </li>
        <li>
          <strong>2. Controller:</strong> načte a ověří vstupní parametry.
        </li>
        <li>
          <strong>3. Model:</strong> provede dotaz nebo doménovou operaci.
        </li>
        <li>
          <strong>4. View:</strong> převede data na bezpečný HTML výstup.
        </li>
        <li>
          <strong>5. Response:</strong> vrátí stavový kód, hlavičky a tělo.
        </li>
      </ol>
      <EditorialCode language="php" label="Jednoduchý front controller">
        {`<?php
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if ($_SERVER['REQUEST_METHOD'] === 'GET' && $path === '/articles') {
    (new ArticleController())->index();
    return;
}

http_response_code(404);
require __DIR__ . '/../views/errors/404.php';`}
      </EditorialCode>
      <EditorialCallout title="Hranice důvěry" tone="warning">
        <p>
          Controller musí validovat identifikátory a oprávnění před voláním modelu. View pak při
          výpisu do HTML používá například <Code>htmlspecialchars()</Code>.
        </p>
      </EditorialCallout>
    </PhpTheoryChapter>
  );
}

function StructureChapter() {
  return (
    <PhpTheoryChapter
      intro="Adresářová struktura má kopírovat odpovědnosti. Veřejný webový kořen obsahuje pouze vstupní skript a statické soubory; aplikační kód a konfigurace zůstávají mimo něj."
      title="Struktura projektu zpřístupňuje jen to, co patří na web"
    >
      <EditorialCode language="text" label="Minimální struktura MVC aplikace">
        {`project/
├── public/
│   └── index.php
├── src/
│   ├── Controllers/ArticleController.php
│   └── Models/ArticleRepository.php
├── views/
│   └── articles/detail.php
└── bootstrap.php`}
      </EditorialCode>
      <EditorialCode language="php" label="Controller předává view pouze potřebná data">
        {`<?php
final class ArticleController
{
    public function __construct(private ArticleRepository $articles) {}

    public function show(int $id): void
    {
        $article = $this->articles->find($id);

        if ($article === null) {
            http_response_code(404);
            require __DIR__ . '/../../views/errors/404.php';
            return;
        }

        require __DIR__ . '/../../views/articles/detail.php';
    }
}`}
      </EditorialCode>
      <p>
        Větší aplikace doplní služby, DTO, dependency injection a samostatnou vrstvu persistence.
        Základní otázka ale zůstává stejná: která část vlastní dané rozhodnutí?
      </p>
    </PhpTheoryChapter>
  );
}

function MvcTask() {
  return (
    <StaticExercise
      id="mvc-controller-view"
      language="php"
      fileName="ArticleController.php"
      task="Doplňte metodu show(): načtěte článek přes repository, ošetřete chybějící záznam stavem 404 a pro existující článek načtěte view. SQL ani HTML do controlleru nevkládejte."
      draft={`<?php
final class ArticleController
{
    public function __construct(private ArticleRepository $articles) {}

    public function show(int $id): void
    {
        // Doplňte koordinaci modelu a view.
    }
}`}
      required={['$this->articles->find($id)', 'http_response_code(404)', 'require']}
      expected="Controller načte data z modelu, vrátí 404 pro neznámé ID a jinak předá vykreslení view."
      solution={`<?php
final class ArticleController
{
    public function __construct(private ArticleRepository $articles) {}

    public function show(int $id): void
    {
        $article = $this->articles->find($id);

        if ($article === null) {
            http_response_code(404);
            require __DIR__ . '/../../views/errors/404.php';
            return;
        }

        require __DIR__ . '/../../views/articles/detail.php';
    }
}`}
    />
  );
}

function SlideContent({ id }) {
  if (id === 'title') {
    return (
      <LessonSummary
        intro="Oddělíme načítání dat, řízení HTTP požadavku a tvorbu HTML do tří spolupracujících částí."
        items={[
          'Rozlišíme odpovědnosti Model, View a Controller.',
          'Projdeme cestu požadavku od routeru k HTTP odpovědi.',
          'Navrhneme bezpečnou strukturu PHP projektu.',
          'Rozdělíme jednu obsluhu detailu mezi controller, model a view.',
        ]}
      />
    );
  }
  if (id === 'quiz') return <PreviousLectureQuiz lessonNumber={13} />;
  if (id === 'theory-responsibilities') return <ResponsibilitiesChapter />;
  if (id === 'theory-request-flow') return <RequestFlowChapter />;
  if (id === 'theory-structure') return <StructureChapter />;
  if (id === 'task') return <MvcTask />;
  if (id === 'summary') {
    return (
      <LessonSummary
        intro="MVC je užitečné tehdy, když z hranic mezi částmi vzniká čitelnější a lépe ověřitelný kód."
        items={[
          'Model vlastní práci s daty a doménovými pravidly.',
          'Controller koordinuje jeden konkrétní HTTP tok.',
          'View vykresluje předaná data a bezpečně je escapuje.',
          'Veřejný adresář neobsahuje aplikační zdrojové kódy ani tajné hodnoty.',
        ]}
      />
    );
  }
  return null;
}

export default function AppMvcLesson13() {
  const sections = useMemo(() => SECTIONS, []);
  const { activeSection, setActiveSection } = useLearningNavigation(sections);
  const current = sections.find((section) => section.id === activeSection) || sections[0];

  return (
    <LearningExperience
      lesson={getLessonByNumber(13)}
      sections={sections}
      activeSection={activeSection}
      onChange={setActiveSection}
      title="ZWA-13: MVC"
      objective="Rozlišíte odpovědnosti Model, View a Controller a sestavíte čitelný tok HTTP požadavku v PHP aplikaci."
      subtitle="Model–View–Controller jako praktické rozdělení odpovědností"
      footerText="ZWA – Cvičení 13: MVC"
    >
      <LearningSection section={current} idPrefix="lesson-mvc">
        <SlideContent id={current.id} />
      </LearningSection>
    </LearningExperience>
  );
}
