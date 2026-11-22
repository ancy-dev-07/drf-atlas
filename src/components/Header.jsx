import { hrefFor } from '../lib/router.js';
import { BrandMark, CloseIcon, GithubIcon, MenuIcon, MoonIcon, SearchIcon, SunIcon } from './Icons.jsx';

const TOP_NAV = [
  { label: 'Guide', to: 'getting-started/introduction', match: (p) => !p.startsWith('api/') && !p.startsWith('testing/') && !p.startsWith('troubleshooting/') },
  { label: 'API Reference', to: 'api/overview', match: (p) => p.startsWith('api/') },
  { label: 'Testing', to: 'testing/thunder-client-setup', match: (p) => p.startsWith('testing/') },
  { label: 'Troubleshooting', to: 'troubleshooting/http-errors', match: (p) => p.startsWith('troubleshooting/') },
];

export function SearchTrigger({ onOpen }) {
  return (
    <button type="button" className="search-trigger" onClick={onOpen} aria-label="Search documentation">
      <SearchIcon />
      <span className="label">Search docs…</span>
      <kbd>Ctrl K</kbd>
    </button>
  );
}

export default function Header({ path, theme, onToggleTheme, onOpenSearch, menuOpen, onToggleMenu }) {
  return (
    <header className="header">
      <button type="button" className="icon-btn menu-btn" onClick={onToggleMenu}
        aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} aria-controls="sidebar">
        {menuOpen ? <CloseIcon /> : <MenuIcon />}
      </button>
      <a className="brand" href={hrefFor('')} aria-label="DRF Atlas home">
        <BrandMark />
        <span className="brand-name">DRF Atlas</span>
        <span className="brand-tag">docs</span>
      </a>
      <nav className="header-nav" aria-label="Documentation sections">
        {TOP_NAV.map((n) => (
          <a key={n.label} href={hrefFor(n.to)} className={path && n.match(path) ? 'active' : ''}>{n.label}</a>
        ))}
      </nav>
      <div className="header-spacer" />
      <div className="header-actions">
        <SearchTrigger onOpen={onOpenSearch} />
        <button type="button" className="icon-btn" onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
        <a className="icon-btn" href="https://github.com/your-username/drf-atlas" target="_blank" rel="noreferrer"
          aria-label="GitHub repository (placeholder)" title="GitHub repository (placeholder link)">
          <GithubIcon />
        </a>
      </div>
    </header>
  );
}
