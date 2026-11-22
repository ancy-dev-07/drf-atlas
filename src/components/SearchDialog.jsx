import { useEffect, useMemo, useRef, useState } from 'react';
import { hrefFor, navigate } from '../lib/router.js';
import { buildIndex, search } from '../lib/search.js';
import { SearchIcon } from './Icons.jsx';

function Highlight({ text, q }) {
  if (!q) return text;
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return text;
  const alt = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const splitter = new RegExp(`(${alt})`, 'ig');
  const exact = new RegExp(`^(?:${alt})$`, 'i');
  return text.split(splitter).map((part, i) => (exact.test(part) ? <mark key={i}>{part}</mark> : <span key={i}>{part}</span>));
}

export default function SearchDialog({ pages, onClose }) {
  const [q, setQ] = useState('');
  const [index, setIndex] = useState(null);
  const [sel, setSel] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    let alive = true;
    buildIndex(pages).then((idx) => { if (alive) setIndex(idx); });
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { alive = false; document.body.style.overflow = prev; };
  }, [pages]);

  const results = useMemo(() => (index ? search(index, q) : []), [index, q]);
  useEffect(() => setSel(0), [q]);
  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [sel]);

  const go = (r) => { navigate(r.slug, r.section); onClose(); };

  const onKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
    else if (e.key === 'Enter' && results[sel]) { e.preventDefault(); go(results[sel]); }
  };

  return (
    <div className="search-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="search-dialog" role="dialog" aria-modal="true" aria-label="Search documentation" onKeyDown={onKey}>
        <div className="search-input-row">
          <SearchIcon />
          <input ref={inputRef} type="search" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search: refresh token, PATCH, 415, MEDIA_ROOT…" aria-label="Search query"
            role="combobox" aria-expanded={results.length > 0} aria-controls="search-results"
            aria-activedescendant={results[sel] ? `sr-${sel}` : undefined} autoComplete="off" spellCheck="false" />
          <kbd>Esc</kbd>
        </div>
        {q.trim() === '' ? (
          <p className="search-empty">Type to search every page, heading and paragraph in DRF Atlas.</p>
        ) : !index ? (
          <p className="search-empty">Building search index…</p>
        ) : results.length === 0 ? (
          <p className="search-empty">No results for “{q}”.</p>
        ) : (
          <ul className="search-results" id="search-results" role="listbox" ref={listRef}>
            {results.map((r, i) => (
              <li key={`${r.slug}-${r.section}-${i}`} id={`sr-${i}`} role="option" aria-selected={i === sel}
                onMouseEnter={() => setSel(i)}>
                <a href={hrefFor(r.slug, r.section)} onClick={(e) => { e.preventDefault(); go(r); }} tabIndex={-1}>
                  <span className="r-path">{r.group} › {r.pageTitle}</span>
                  <span className="r-title"><Highlight text={r.heading} q={q} /></span>
                  {r.snippet && <span className="r-snip"><Highlight text={r.snippet} q={q} /></span>}
                </a>
              </li>
            ))}
          </ul>
        )}
        <div className="search-foot"><span>↑↓ to navigate</span><span>Enter to open</span><span>Esc to close</span></div>
      </div>
    </div>
  );
}
