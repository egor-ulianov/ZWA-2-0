import { createElement } from 'react';

const ALLOWED_ELEMENTS = new Set([
  'a',
  'article',
  'aside',
  'b',
  'blockquote',
  'br',
  'caption',
  'cite',
  'code',
  'col',
  'colgroup',
  'dd',
  'del',
  'div',
  'dl',
  'dt',
  'em',
  'figcaption',
  'figure',
  'footer',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'hr',
  'i',
  'img',
  'ins',
  'kbd',
  'label',
  'li',
  'main',
  'mark',
  'ol',
  'p',
  'pre',
  'q',
  's',
  'section',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'time',
  'tr',
  'u',
  'ul',
]);

const BLOCKED_ELEMENTS = new Set([
  'audio',
  'base',
  'button',
  'canvas',
  'dialog',
  'embed',
  'fieldset',
  'form',
  'iframe',
  'input',
  'link',
  'math',
  'meta',
  'object',
  'option',
  'script',
  'select',
  'source',
  'style',
  'summary',
  'svg',
  'template',
  'textarea',
  'track',
  'video',
]);

const PRIVATE_CLASS_PATTERN =
  /(?:^|[-_\s])(console|editor(?:-chrome)?|exercise(?:-workspace|-panel)?|playground|preview(?:-pane)?|source-editor|test(?:-panel|-results)?)(?=$|[-_\s])/i;

function getAttribute(node, name) {
  if (!node?.attributes) return '';
  const attribute = Array.from(node.attributes).find(
    (candidate) => candidate.name.toLowerCase() === name.toLowerCase(),
  );
  return attribute?.value || '';
}

function isPrivateSubtree(node) {
  const marker = getAttribute(node, 'data-projector-private');
  if (marker) return true;
  return PRIVATE_CLASS_PATTERN.test(getAttribute(node, 'class'));
}

function isSafeUrl(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return false;
  if (/^(?:javascript|data|vbscript):/i.test(trimmed)) return false;
  if (/^(?:#|\/|\.\.?\/)/.test(trimmed)) return true;
  try {
    const protocol = new URL(trimmed, 'https://projector.invalid').protocol;
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

function allowedProps(tagName, node, key) {
  const props = { key };
  const className = getAttribute(node, 'class');
  const id = getAttribute(node, 'id');
  const title = getAttribute(node, 'title');
  if (className) props.className = className;
  if (id) props.id = id;
  if (title) props.title = title;

  if (tagName === 'a') {
    const href = getAttribute(node, 'href');
    if (isSafeUrl(href)) props.href = href;
  }
  if (tagName === 'img') {
    const src = getAttribute(node, 'src');
    if (isSafeUrl(src)) props.src = src;
    const alt = getAttribute(node, 'alt');
    if (alt) props.alt = alt;
    for (const attributeName of ['width', 'height']) {
      const value = getAttribute(node, attributeName);
      if (/^\d+$/.test(value)) props[attributeName] = value;
    }
  }
  if (tagName === 'td' || tagName === 'th') {
    for (const [attributeName, propName] of [
      ['colspan', 'colSpan'],
      ['rowspan', 'rowSpan'],
    ]) {
      const value = getAttribute(node, attributeName);
      if (/^\d+$/.test(value)) props[propName] = value;
    }
  }
  return props;
}

function projectDomNode(node, key = 'projected') {
  if (!node) return null;
  if (node.nodeType === 3) return node.nodeValue || '';
  if (node.nodeType !== 1) return null;

  const tagName = String(node.localName || node.tagName || '').toLowerCase();
  if (!tagName || BLOCKED_ELEMENTS.has(tagName) || isPrivateSubtree(node)) return null;

  const childNodes = Array.from(node.childNodes || [])
    .map((child, index) => projectDomNode(child, `${key}-${index}`))
    .filter((child) => child !== null);
  if (!ALLOWED_ELEMENTS.has(tagName)) return childNodes;
  return createElement(tagName, allowedProps(tagName, node, key), ...childNodes);
}

function projectDomChildren(node) {
  return Array.from(node?.childNodes || [])
    .flatMap((child, index) => {
      const projected = projectDomNode(child, `projected-${index}`);
      return projected === null ? [] : Array.isArray(projected) ? projected : [projected];
    })
    .filter((child) => child !== null && child !== '');
}

export {
  ALLOWED_ELEMENTS,
  BLOCKED_ELEMENTS,
  isPrivateSubtree,
  isSafeUrl,
  projectDomChildren,
  projectDomNode,
};
