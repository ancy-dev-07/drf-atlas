/**
 * Client-side full-text search.
 * The index is built lazily the first time search opens: every page is
 * rendered to static HTML, then split into sections at each h2/h3.
 */
import { createElement } from 'react';

let cached = null;

export async function buildIndex(pages) {
  if (cached) return cached;
  const { renderToStaticMarkup } = await import('react-dom/server');
  const parser = new DOMParser();
  const entries = [];

  for (const page of pages) {
    let html = '';
    try {
      html = renderToStaticMarkup(createElement(page.Body));
    } catch (e) {
      html = '';
    }
    const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
    // Remove SVG diagram internals and copy-button labels from the text.
    doc.querySelectorAll('svg, button').forEach((n) => n.remove());

    let current = { section: null, heading: page.title, text: page.lede || '' };
    const flush = () => {
      entries.push({
        slug: page.slug, group: page.group, pageTitle: page.title,
        section: current.section, heading: current.heading,
        text: current.text.replace(/\s+/g, ' ').trim(),
      });
    };
    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      if (node.nodeType === 1 && /^H[23]$/.test(node.tagName) && node.id) {
        flush();
        current = { section: node.id, heading: node.textContent.replace(/#$/, '').trim(), text: '' };
        // skip the heading's own text nodes
        let skip = node.lastChild;
        while (skip && skip.lastChild) skip = skip.lastChild;
        while (node && node !== skip) node = walker.nextNode();
      } else if (node.nodeType === 3) {
        current.text += ` ${node.nodeValue}`;
      }
      node = walker.nextNode();
    }
    flush();
  }
  cached = entries;
  return entries;
}

export function search(index, query) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const results = [];
  for (const e of index) {
    const heading = e.heading.toLowerCase();
    const title = e.pageTitle.toLowerCase();
    const text = e.text.toLowerCase();
    let score = 0;
    let all = true;
    for (const t of terms) {
      const inHeading = heading.includes(t);
      const inTitle = title.includes(t);
      const inText = text.includes(t);
      if (!inHeading && !inTitle && !inText) { all = false; break; }
      if (inHeading) score += heading.startsWith(t) ? 14 : 10;
      if (inTitle) score += 5;
      if (inText) score += Math.min(4, text.split(t).length - 1);
    }
    if (!all) continue;
    if (!e.section) score += 2; // page-level entry
    results.push({ ...e, score, snippet: snippet(e.text, terms[0]) });
  }
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 40);
}

function snippet(text, term) {
  const i = text.toLowerCase().indexOf(term);
  if (i === -1) return text.slice(0, 110);
  const start = Math.max(0, i - 40);
  return (start > 0 ? '…' : '') + text.slice(start, start + 120).trim();
}
