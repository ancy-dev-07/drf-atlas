import { hrefFor } from '../lib/router.js';

export default function Pager({ page, pages }) {
  const i = pages.findIndex((p) => p.slug === page.slug);
  if (i === -1) return null;
  const prev = pages[i - 1];
  const next = pages[i + 1];
  return (
    <nav className="pager" aria-label="Previous and next pages">
      {prev ? (
        <a href={hrefFor(prev.slug)} rel="prev">
          <span className="dir">← Previous</span>
          <span className="ttl">{prev.title}</span>
        </a>
      ) : <span />}
      {next && (
        <a href={hrefFor(next.slug)} rel="next" className="next">
          <span className="dir">Next →</span>
          <span className="ttl">{next.title}</span>
        </a>
      )}
    </nav>
  );
}
