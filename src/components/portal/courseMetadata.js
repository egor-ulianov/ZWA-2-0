const courseMetadata = Object.freeze(
  [
    {
      slug: 'html5',
      module: 'Web foundations',
      focus: 'Build a sturdy semantic HTML foundation for every page.',
    },
    {
      slug: 'forms',
      module: 'Web foundations',
      focus: 'Collect and validate user input with accessible HTML forms.',
    },
    {
      slug: 'network',
      module: 'Web foundations',
      focus: 'Understand how browsers, servers, and HTTP work together.',
    },
    {
      slug: 'css',
      module: 'Presentation and interaction',
      focus: 'Use CSS to give a page structure, rhythm, and visual hierarchy.',
    },
    {
      slug: 'css-ii',
      module: 'Presentation and interaction',
      focus: 'Compose resilient layouts that adapt across screens and print.',
    },
    {
      slug: 'javascript',
      module: 'Presentation and interaction',
      focus: 'Make interfaces respond to events with clear JavaScript logic.',
    },
    {
      slug: 'classes-ajax',
      module: 'Server-side foundations',
      focus: 'Organize client-server code with classes and asynchronous requests.',
    },
    {
      slug: 'php',
      module: 'Server-side foundations',
      focus: 'Learn the PHP building blocks behind a dynamic web page.',
    },
    {
      slug: 'forms-crud',
      module: 'Server-side foundations',
      focus: 'Connect server-side forms to create, read, update, and delete flows.',
    },
    {
      slug: 'sessions-cookies',
      module: 'State and data',
      focus: 'Keep useful state across requests with sessions and cookies.',
    },
    {
      slug: 'files-json',
      module: 'State and data',
      focus: 'Read, write, and exchange structured data with files and JSON.',
    },
    {
      slug: 'auth',
      module: 'State and data',
      focus: 'Apply authentication and authorization to protect an application.',
    },
  ].map(Object.freeze),
);

function getCourseModule(lesson) {
  const slug = typeof lesson === 'string' ? lesson : lesson?.slug;
  return courseMetadata.find((metadata) => metadata.slug === slug);
}

export { courseMetadata, getCourseModule };
