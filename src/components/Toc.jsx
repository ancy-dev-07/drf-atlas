import { useEffect, useState } from 'react';
import { hrefFor, replaceSection } from '../lib/router.js';

/**
 * "On this page" table of contents. Headings are read from the rendered
 * article, so pages never have to declare their outline twice.
 */
export default function Toc({ path, articleRef }) {
  const [items, setItems] = useState([]);
  const [active, setActive] = useState(null);

  useEffect(() => {
    const root = articleRef.current;
    if (!root) return undefined;
    const hs = [...root.querySelectorAll('h2[id], h3[id]')];
    setItems(hs.map((h) => ({ id: h.id, text: h.firstChild?.textContent || h.textContent, depth: h.tagName === 'H2' ? 2 : 3 })));
    setActive(hs[0]?.id || null);

    const onScroll = () => {
      const offset = 110;
      let current = hs[0]?.id || null;
      for (const h of hs) {
        if (h.getBoundingClientRect().top - offset <= 0) current = h.id; else break;
      }
      if ((window.innerHeight + window.scrollY) >= document.body.scrollHeight - 4 && hs.length) {
        current = hs[hs.length - 1].id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [path, articleRef]);

  if (!items.length) return <aside className="toc" aria-hidden="true" />;

  return (
    <aside className="toc" aria-label="On this page">
      <p className="toc-title">On this page</p>
      <ul>
        {items.map((it) => (
          <li key={it.id} className={`depth-${it.depth}`}>
            <a href={hrefFor(path, it.id)} className={active === it.id ? 'active' : ''}
              aria-current={active === it.id ? 'location' : undefined}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(it.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                replaceSection(path, it.id);
              }}>
              {it.text}
            </a>
          </li>
        ))}
      </ul>
      <button type="button" className="toc-back" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        ↑ Back to top
      </button>
    </aside>
  );
}
