import { useEffect, useRef, useState } from 'react';
import { hrefFor } from '../lib/router.js';
import { ChevronIcon } from './Icons.jsx';
import { Method } from './docs.jsx';
import { SearchTrigger } from './Header.jsx';

export default function Sidebar({ groups, path, open, onNavigate, onOpenSearch }) {
  const activeGroup = groups.find((g) => g.pages.some((p) => p.slug === path))?.id;
  const [expanded, setExpanded] = useState(() => new Set(groups.map((g) => g.id)));
  const ref = useRef(null);

  // Make sure the group that contains the current page is open.
  useEffect(() => {
    if (activeGroup && !expanded.has(activeGroup)) {
      setExpanded((s) => new Set(s).add(activeGroup));
    }
  }, [activeGroup]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the active link visible in the sidebar scroll area.
  useEffect(() => {
    const el = ref.current?.querySelector('a.active');
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [path]);

  const toggle = (id) => setExpanded((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });

  return (
    <aside id="sidebar" ref={ref} className={`sidebar${open ? ' open' : ''}`} aria-label="Documentation navigation">
      <div className="sidebar-search"><SearchTrigger onOpen={onOpenSearch} /></div>
      <nav>
        {groups.map((g) => {
          const isOpen = expanded.has(g.id);
          return (
            <div className="nav-group" key={g.id}>
              <button type="button" className="nav-group-btn" aria-expanded={isOpen}
                aria-controls={`nav-${g.id}`} onClick={() => toggle(g.id)}>
                {g.title}
                <ChevronIcon />
              </button>
              {isOpen && (
                <ul className="nav-list" id={`nav-${g.id}`}>
                  {g.pages.map((p) => (
                    <li key={p.slug}>
                      <a href={hrefFor(p.slug)} className={p.slug === path ? 'active' : ''}
                        aria-current={p.slug === path ? 'page' : undefined} onClick={onNavigate}>
                        {p.method && <Method m={p.method} />}
                        <span>{p.nav || p.title}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
