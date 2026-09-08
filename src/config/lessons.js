const lessons = Object.freeze([
  {
    number: 1,
    slug: "html5",
    title: "ZWA‑1 (HTML5): HTML5 Presentation with Live Playground",
    href: "/interactive-zwa-1-html5",
    componentKey: "interactive_zwa_1_html5_presentation",
  },
  {
    number: 2,
    slug: "forms",
    title: "ZWA‑2 (Forms): Client-side Forms and HTML5 Inputs",
    href: "/interactive-zwa-2-forms",
    componentKey: "interactive_zwa_2_forms_presentation",
  },
  {
    number: 3,
    slug: "network",
    title: "ZWA‑3 (Network): Web Presentation with Simulated Linux CLI",
    href: "/interactive-zwa-1/",
    componentKey: "interactive_zwa_1_web_presentation_with_simulated_linux_cli",
  },
  {
    number: 4,
    slug: "css",
    title: "ZWA‑4: CSS Presentation with Live Playground",
    href: "/interactive-zwa-2",
    componentKey: "interactive_zwa_2_css_presentation",
  },
  {
    number: 5,
    slug: "css-ii",
    title: "ZWA‑5: CSS II – Layout, Responsivity, Print",
    href: "/interactive-zwa-5-css-ii",
    componentKey: "interactive_zwa_5_css2_presentation",
  },
  {
    number: 6,
    slug: "javascript",
    title: "ZWA‑6: JavaScript Basics with Live Playground",
    href: "/interactive-zwa-5-js",
    componentKey: "interactive_zwa_5_javascript_presentation",
  },
  {
    number: 7,
    slug: "classes-ajax",
    title: "ZWA‑7: Classes and AJAX",
    href: "/interactive-zwa-7",
    componentKey: "interactive_zwa_7_classes_ajax_presentation",
  },
  {
    number: 8,
    slug: "php",
    title: "ZWA‑8: PHP Basics – Malý test #2",
    href: "/interactive-zwa-8-php",
    componentKey: "interactive_zwa_8_php_presentation",
  },
  {
    number: 9,
    slug: "forms-crud",
    title: "ZWA‑9: Server-side Forms & CRUD",
    href: "/interactive-zwa-9",
    componentKey: "interactive_zwa_9_forms_crud_presentation",
  },
  {
    number: 10,
    slug: "sessions-cookies",
    title: "ZWA‑10: Session & Cookies in PHP",
    href: "/interactive-zwa-10-sessions-cookies",
    componentKey: "interactive_zwa_10_sessions_cookies_presentation",
  },
  {
    number: 11,
    slug: "files-json",
    title: "ZWA‑11: Files & JSON in PHP",
    href: "/interactive-zwa-11-files-json",
    componentKey: "interactive_zwa_11_files_json_presentation",
  },
  {
    number: 12,
    slug: "auth",
    title: "ZWA‑12: Authentication & Authorization in PHP",
    href: "/interactive-zwa-12-auth",
    componentKey: "interactive_zwa_12_auth_presentation",
  },
].map(Object.freeze));

function getLessonByNumber(number) {
  return lessons.find((lesson) => lesson.number === number);
}

function getLessonBySlug(slug) {
  return lessons.find((lesson) => lesson.slug === slug);
}

module.exports = { lessons, getLessonByNumber, getLessonBySlug };
