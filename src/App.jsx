import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Header from './components/Header.jsx';
import Sidebar from './components/Sidebar.jsx';
import Toc from './components/Toc.jsx';
import SearchDialog from './components/SearchDialog.jsx';
import Pager from './components/Pager.jsx';
import { useRoute } from './lib/router.js';
import { useTheme } from './lib/theme.js';
import { groups, pages, pageBySlug, HOME_SLUG } from './content/index.js';

export default function App() {
  const route = useRoute();
  const path = route.path || HOME_SLUG;
  const page = pageBySlug[path] || pageBySlug['not-found'];
  const [theme, toggleTheme] = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const articleRef = useRef(null);
  const lastFocus = useRef(null);

  const openSearch = useCallback(() => {
    lastFocus.current = document.activeElement;
    setMenuOpen(false);
    setSearchOpen(true);
  }, []);
  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    lastFocus.current?.focus?.();
  }, []);

  // Global keyboard shortcuts: Ctrl/Cmd+K or "/" opens search.
  useEffect(() => {
    const onKey = (e) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName);
      if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !typing)) {
        e.preventDefault();
        openSearch();
      }
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openSearch]);

  // Scroll to the requested section, or to the top on page change.
  useLayoutEffect(() => {
    if (route.section) {
      const el = document.getElementById(route.section);
      if (el) { el.scrollIntoView({ block: 'start' }); return; }
    }
    window.scrollTo(0, 0);
  }, [path, route.section]);

  useEffect(() => {
    document.title = page.slug === HOME_SLUG ? 'DRF Atlas' : `${page.title} · DRF Atlas`;
    setMenuOpen(false);
  }, [page]);

  const Body = page.Body;

  return (
    <>
      <a className="skip-link" href="#main-content" onClick={(e) => {
        e.preventDefault(); document.getElementById('main-content')?.focus();
      }}>Skip to content</a>
      <Header path={path} theme={theme} onToggleTheme={toggleTheme} onOpenSearch={openSearch}
        menuOpen={menuOpen} onToggleMenu={() => setMenuOpen((o) => !o)} />
      <div className="shell">
        <Sidebar groups={groups} path={path} open={menuOpen}
          onNavigate={() => setMenuOpen(false)} onOpenSearch={openSearch} />
        {menuOpen && <button type="button" className="scrim" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
        <main className="main" id="main-content" tabIndex={-1}>
          <article className="article" ref={articleRef} key={page.slug}>
            {page.group && page.slug !== HOME_SLUG && (
              <div className="crumbs"><span>{page.group}</span><span>{page.title}</span></div>
            )}
            {page.slug !== HOME_SLUG && (
              <>
                <h1>{page.title}</h1>
                {page.lede && <p className="lede">{page.lede}</p>}
              </>
            )}
            <Body />
            <Pager page={page} pages={pages} />
          </article>
        </main>
        <Toc path={page.slug} articleRef={articleRef} />
      </div>
      {searchOpen && <SearchDialog pages={pages} onClose={closeSearch} />}
    </>
  );
}
