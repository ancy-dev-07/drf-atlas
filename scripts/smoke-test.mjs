// Renders every documentation page on the server and checks for:
//  - runtime errors while rendering
//  - source excerpts that could not be found in the Django code
//  - internal links (#/slug?s=section) pointing to missing pages or headings
//  - duplicate heading ids on a page
// Run: npm run smoke
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
let failures = 0;
const fail = (msg) => { failures++; console.error('✗', msg); };

try {
  const { pages, pageBySlug } = await server.ssrLoadModule('/src/content/index.js');
  const { CODE } = await server.ssrLoadModule('/src/lib/source.js');

  for (const [k, v] of Object.entries(CODE)) {
    if (!v || v.includes('not found in source')) fail(`source excerpt "${k}" is missing`);
  }

  const html = {};
  const ids = {};
  for (const p of pages) {
    try {
      html[p.slug] = renderToStaticMarkup(createElement(p.Body));
    } catch (e) {
      fail(`${p.slug}: render error ${e.message}`);
      continue;
    }
    const found = [...html[p.slug].matchAll(/<h[23] id="([^"]+)"/g)].map((m) => m[1]);
    ids[p.slug] = new Set(found);
    const dupes = found.filter((id, i) => found.indexOf(id) !== i);
    if (dupes.length) fail(`${p.slug}: duplicate heading ids ${[...new Set(dupes)].join(', ')}`);
  }

  for (const [slug, markup] of Object.entries(html)) {
    for (const m of markup.matchAll(/href="#\/([^"?]*)(?:\?s=([^"]+))?"/g)) {
      const target = m[1].replace(/\/$/, '');
      if (target === '') continue;
      if (!pageBySlug[target]) { fail(`${slug}: link to missing page "${target}"`); continue; }
      if (m[2] && !ids[target]?.has(decodeURIComponent(m[2]))) fail(`${slug}: link to missing section "${target}?s=${m[2]}"`);
    }
  }

  const words = Object.values(html).join(' ').replace(/<[^>]+>/g, ' ').split(/\s+/).length;
  console.log(`Rendered ${Object.keys(html).length}/${pages.length} pages, ~${words.toLocaleString()} words.`);
} finally {
  await server.close();
}

if (failures) { console.error(`${failures} problem(s) found.`); process.exit(1); }
console.log('✓ All pages render; all source excerpts and internal links resolve.');
