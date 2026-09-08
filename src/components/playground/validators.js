const CSS_BASICS_INSPECTION = [
  { selector: '#title', properties: ['color', 'font-size'] },
  { selector: 'footer a', properties: ['color', 'font-family'] },
  { selector: 'ol.submenu', properties: ['list-style-type'] },
];

const CSS_LAYOUT_INSPECTION = [
  {
    selector: '#site-header',
    properties: ['display', 'padding-top', 'border-top-width', 'margin-top'],
  },
  {
    selector: '#menu',
    properties: ['padding-top', 'border-top-width', 'margin-top'],
  },
  {
    selector: '#article',
    properties: ['padding-top', 'border-top-width', 'margin-top'],
  },
  {
    selector: '#footer',
    properties: ['padding-top', 'border-top-width', 'margin-top'],
  },
  { selector: '#pic', properties: ['float', 'position'] },
  { selector: '.hl', properties: ['display'] },
];

function styleFor(inspection, selector) {
  if (!inspection || inspection.kind !== 'inspection') return null;
  const item = Array.isArray(inspection.elements)
    ? inspection.elements.find((element) => element.selector === selector)
    : null;
  return item && item.exists && item.styles ? item.styles : null;
}

function validateCssBasics({ slideId, inspection, htmlCode, cssCode }) {
  const results = [];
  if (slideId === 'linking') {
    const hasLink = /<link[^>]*rel=["']stylesheet["'][^>]*href=["']styles\.css["'][^>]*>/i.test(
      htmlCode,
    );
    results.push({
      ok: hasLink,
      text: 'Task: <link rel="stylesheet" href="styles.css"> is present',
    });
    const title = styleFor(inspection, '#title');
    results.push({
      ok: Boolean(title && title.color === 'rgb(22, 163, 74)'),
      text: 'Task: #title color is green from styles.css',
    });
    return results;
  }

  const title = styleFor(inspection, '#title');
  results.push({
    ok: Boolean(title && title.color === 'rgb(29, 78, 216)' && title['font-size'] === '36px'),
    text: 'Task 1: h1 is blue and 36px',
  });

  const footerLink = styleFor(inspection, 'footer a');
  const hasVisitedRule = /footer\s+a\s*:\s*visited[\s\S]*?color\s*:\s*#?2563eb/i.test(cssCode);
  results.push({
    ok: Boolean(
      footerLink &&
      /georgia/i.test(footerLink['font-family'] || '') &&
      footerLink.color === 'rgb(37, 99, 235)' &&
      hasVisitedRule,
    ),
    text: 'Task 2: footer links styled incl. visited',
  });

  const hasFirstLetter = /p\s*\.excerpt\s*::\s*first-letter/i.test(cssCode);
  const hasFirstLetterSize = /::\s*first-letter[\s\S]*font-size\s*:\s*200%/i.test(cssCode);
  const hasFirstLetterBackground = /::\s*first-letter[\s\S]*background\s*:\s*#?fef08a/i.test(
    cssCode,
  );
  results.push({
    ok: hasFirstLetter && hasFirstLetterSize && hasFirstLetterBackground,
    text: 'Task 3: first-letter styled',
  });

  const submenu = styleFor(inspection, 'ol.submenu');
  results.push({
    ok: Boolean(
      submenu && ['lower-alpha', 'lower-alpha outside'].includes(submenu['list-style-type']),
    ),
    text: 'Task 4: submenu uses lower-alpha',
  });

  results.push({
    ok:
      /\.hero\s+img\s*:\s*hover/i.test(cssCode) &&
      /transform\s*:\s*scale\s*\(/i.test(cssCode) &&
      /transition\s*:\s*transform/i.test(cssCode),
    text: 'Task 5: hover transform + transition',
  });
  return results;
}

function hasPositiveBoxStyle(style) {
  return Boolean(
    style &&
    ['padding-top', 'border-top-width', 'margin-top'].some(
      (property) => parseInt(style[property], 10) > 0,
    ),
  );
}

function validateCssLayout({ stepIndex, inspection, htmlCode, cssCode }) {
  const results = [];
  if (stepIndex === 0) {
    ['#site-header', '#menu', '#article', '#footer'].forEach((selector) => {
      results.push({
        ok: hasPositiveBoxStyle(styleFor(inspection, selector)),
        text: `${selector} has some box model styling`,
      });
    });
  } else if (stepIndex === 1) {
    const picture = styleFor(inspection, '#pic');
    results.push({
      ok: Boolean(picture && ['left', 'right'].includes(picture.float)),
      text: '#pic floats left/right',
    });
    results.push({
      ok: /clear\s*:\s*both/i.test(cssCode) || /::after[\s\S]*clear\s*:\s*both/i.test(cssCode),
      text: 'clearfix (clear: both) present',
    });
  } else if (stepIndex === 2) {
    const picture = styleFor(inspection, '#pic');
    results.push({
      ok: Boolean(picture && picture.position && picture.position !== 'static'),
      text: '#pic position is not static',
    });
  } else if (stepIndex === 3) {
    const highlight = styleFor(inspection, '.hl');
    results.push({
      ok: Boolean(highlight && ['inline-block', 'block'].includes(highlight.display)),
      text: '.hl display changed (block/inline-block)',
    });
    results.push({
      ok: /\.hl[\s\S]*background/i.test(cssCode),
      text: '.hl has background color',
    });
  } else if (stepIndex === 4) {
    const header = styleFor(inspection, '#site-header');
    results.push({
      ok: Boolean(header && header.display === 'flex'),
      text: '#site-header uses display:flex',
    });
    results.push({
      ok: /#site-header\s+button[\s\S]*margin-left\s*:\s*auto/i.test(cssCode),
      text: '#site-header button has margin-left:auto',
    });
  } else if (stepIndex === 5) {
    results.push({
      ok: /@media\s*\(min-width:\s*800px\)/i.test(cssCode),
      text: '@media(min-width:800px) present',
    });
  } else if (stepIndex === 6) {
    results.push({
      ok: /<link[^>]*rel=["']stylesheet["'][^>]*media=["']print["'][^>]*>/i.test(htmlCode),
      text: '<link rel=stylesheet media=print> present',
    });
  }
  return results;
}

export { CSS_BASICS_INSPECTION, CSS_LAYOUT_INSPECTION, validateCssBasics, validateCssLayout };
