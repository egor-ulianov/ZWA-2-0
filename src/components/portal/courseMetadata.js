const courseMetadata = Object.freeze(
  [
    {
      slug: 'html5',
      module: 'Základy webu',
      focus: 'Vybudujte pevný sémantický základ HTML pro každou stránku.',
    },
    {
      slug: 'forms',
      module: 'Základy webu',
      focus: 'Sbírejte a ověřujte vstupy uživatelů pomocí přístupných HTML formulářů.',
    },
    {
      slug: 'network',
      module: 'Základy webu',
      focus: 'Pochopte, jak spolupracují prohlížeče, servery a HTTP.',
    },
    {
      slug: 'css',
      module: 'Prezentace a interakce',
      focus: 'Použijte CSS pro strukturu stránky, rytmus a vizuální hierarchii.',
    },
    {
      slug: 'css-ii',
      module: 'Prezentace a interakce',
      focus: 'Skládejte odolné layouty, které se přizpůsobí obrazovkám i tisku.',
    },
    {
      slug: 'javascript',
      module: 'Prezentace a interakce',
      focus: 'Nechte rozhraní reagovat na události pomocí srozumitelné logiky JavaScriptu.',
    },
    {
      slug: 'classes-ajax',
      module: 'Základy serveru',
      focus: 'Uspořádejte klientský a serverový kód pomocí tříd a asynchronních požadavků.',
    },
    {
      slug: 'php',
      module: 'Základy serveru',
      focus: 'Poznejte stavební bloky PHP pro dynamické webové stránky.',
    },
    {
      slug: 'forms-crud',
      module: 'Základy serveru',
      focus: 'Propojte serverové formuláře s operacemi vytvoření, čtení, úpravy a mazání.',
    },
    {
      slug: 'sessions-cookies',
      module: 'Stav a data',
      focus: 'Uchovávejte užitečný stav mezi požadavky pomocí relací a cookies.',
    },
    {
      slug: 'files-json',
      module: 'Stav a data',
      focus: 'Čtěte, zapisujte a vyměňujte strukturovaná data pomocí souborů a JSON.',
    },
    {
      slug: 'auth',
      module: 'Stav a data',
      focus: 'Chraňte aplikaci pomocí autentizace a autorizace.',
    },
  ].map(Object.freeze),
);

function getCourseModule(lesson) {
  const slug = typeof lesson === 'string' ? lesson : lesson?.slug;
  return courseMetadata.find((metadata) => metadata.slug === slug);
}

export { courseMetadata, getCourseModule };
