/**
 * Content primitives used by every documentation page.
 * Pages compose these instead of styling raw HTML, which keeps the visual
 * language consistent across the site.
 */
import { Children, useId, useMemo, useState } from 'react';
import { tokenize } from '../lib/highlight.js';
import { slugify, textOf } from '../lib/slug.js';
import { hrefFor } from '../lib/router.js';
import {
  CheckIcon, CopyIcon, InfoIcon, LockIcon, TipIcon, UnlockIcon, WarnIcon, CodeIcon, CompassIcon,
} from './Icons.jsx';

/* ---------- Headings ---------- */
function Heading({ level, id, children }) {
  const Tag = `h${level}`;
  const hid = id || slugify(textOf(children));
  return (
    <Tag id={hid}>
      {children}
      <a className="anchor" href={`#${hid}`} aria-label="Link to this section"
        onClick={(e) => {
          e.preventDefault();
          const el = document.getElementById(hid);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          const path = window.location.hash.replace(/^#\/?/, '').split('?')[0];
          history.replaceState(null, '', hrefFor(path, hid));
        }}>#</a>
    </Tag>
  );
}
export const H2 = (p) => <Heading level={2} {...p} />;
export const H3 = (p) => <Heading level={3} {...p} />;

/* ---------- Internal link ---------- */
export function L({ to, s, children }) {
  return <a href={hrefFor(to, s)}>{children}</a>;
}

/* ---------- Code block ---------- */
const LANG_LABEL = { python: 'Python', py: 'Python', json: 'JSON', bash: 'Shell', javascript: 'JavaScript', js: 'JavaScript', http: 'HTTP', text: 'Text', jsx: 'JSX' };

function dedent(str) {
  const s = str.replace(/^\n/, '').replace(/\s+$/, '');
  const lines = s.split('\n');
  const indents = lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length);
  const min = indents.length ? Math.min(...indents) : 0;
  return lines.map((l) => l.slice(min)).join('\n');
}

export function Code({ children, code, lang = 'text', file, mark = [], lines = false, caption }) {
  const source = useMemo(() => dedent(code ?? Children.toArray(children).join('')), [code, children]);
  const [copied, setCopied] = useState(false);
  const rows = useMemo(() => {
    const tokens = tokenize(source, lang);
    // split tokens into lines
    const out = [[]];
    for (const t of tokens) {
      const parts = t.text.split('\n');
      parts.forEach((p, i) => {
        if (i > 0) out.push([]);
        if (p) out[out.length - 1].push({ type: t.type, text: p });
      });
    }
    return out;
  }, [source, lang]);
  const srcLines = source.split('\n');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(source);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = source; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch { /* ignore */ }
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <>
      <div className="code">
        <div className="code-head">
          <span className="code-file">{file || ''}</span>
          <span className="code-lang">{LANG_LABEL[lang] || lang}</span>
          <button type="button" className={`copy-btn${copied ? ' copied' : ''}`} onClick={copy}
            aria-label={copied ? 'Copied' : `Copy ${file || 'code'} to clipboard`}>
            {copied ? <CheckIcon /> : <CopyIcon />}
            <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
        <pre tabIndex={0}><code>
          {rows.map((row, i) => {
            const hl = mark.some((m) => srcLines[i] && srcLines[i].includes(m));
            return (
              <span key={i} className={`line${hl ? ' hl' : ''}`}>
                {lines && <span className="ln">{i + 1}</span>}
                {row.map((t, j) => (t.type === 'plain'
                  ? <span key={j}>{t.text}</span>
                  : <span key={j} className={`tok-${t.type}`}>{t.text}</span>))}
                {'\n'}
              </span>
            );
          })}
        </code></pre>
      </div>
      {caption && <p className="code-caption">{caption}</p>}
    </>
  );
}

/* ---------- Callout ---------- */
const CALLOUT = {
  note: ['Note', InfoIcon],
  tip: ['Tip', TipIcon],
  warning: ['Warning', WarnIcon],
  danger: ['Important', WarnIcon],
  impl: ['In this project', CodeIcon],
  future: ['Suggested improvement', CompassIcon],
};
export function Callout({ type = 'note', title, children }) {
  const [label, Icon] = CALLOUT[type] || CALLOUT.note;
  return (
    <aside className={`callout ${type}`} role="note">
      <div className="callout-title"><Icon />{title || label}</div>
      {children}
    </aside>
  );
}

/* ---------- Table ---------- */
export function Table({ head, rows, className = '' }) {
  return (
    <div className="table-wrap" tabIndex={0} role="region" aria-label="Table">
      <table className={className}>
        <thead><tr>{head.map((h, i) => <th key={i} scope="col">{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- HTTP primitives ---------- */
export const Method = ({ m }) => <span className={`method ${m.toLowerCase()}`}>{m}</span>;

export function Path({ p }) {
  const parts = p.split(/(\{[^}]+\})/);
  return (
    <span className="endpoint-path">
      {parts.map((x, i) => (x.startsWith('{') ? <span key={i} className="param">{x}</span> : x))}
    </span>
  );
}

export function AuthPill({ required }) {
  return required
    ? <span className="auth-pill required"><LockIcon />Bearer token required</span>
    : <span className="auth-pill public"><UnlockIcon />Public</span>;
}

export function EndpointBar({ method, path, auth }) {
  const methods = Array.isArray(method) ? method : [method];
  return (
    <div className="endpoint">
      {methods.map((m) => <Method key={m} m={m} />)}
      <Path p={path} />
      {auth !== undefined && <AuthPill required={auth} />}
    </div>
  );
}

export function BodyKind({ kind }) {
  if (kind === 'multipart') return <span className="body-kind multipart">multipart/form-data</span>;
  if (kind === 'json') return <span className="body-kind json">application/json</span>;
  return <span className="body-kind">no body</span>;
}

export function Status({ code, text }) {
  const cls = `s${String(code)[0]}`;
  return <span className={`status ${cls}`}>{code}{text ? ` ${text}` : ''}</span>;
}

/* ---------- Tabs ---------- */
export function Tabs({ items }) {
  const [active, setActive] = useState(0);
  const base = useId();
  const onKey = (e) => {
    if (e.key === 'ArrowRight') setActive((a) => (a + 1) % items.length);
    if (e.key === 'ArrowLeft') setActive((a) => (a - 1 + items.length) % items.length);
  };
  return (
    <div className="tabs">
      <div className="tab-list" role="tablist" onKeyDown={onKey}>
        {items.map((it, i) => (
          <button key={it.label} type="button" role="tab" id={`${base}-t${i}`}
            aria-selected={active === i} aria-controls={`${base}-p${i}`}
            tabIndex={active === i ? 0 : -1} onClick={() => setActive(i)}>
            {it.label}
          </button>
        ))}
      </div>
      {items.map((it, i) => (
        <div key={it.label} className="tab-panel" role="tabpanel" id={`${base}-p${i}`}
          aria-labelledby={`${base}-t${i}`} hidden={active !== i}>
          {it.content}
        </div>
      ))}
    </div>
  );
}

/* ---------- Layout helpers ---------- */
export const Steps = ({ children }) => <ol className="steps">{children}</ol>;

export function DefList({ items }) {
  return (
    <dl className="deflist">
      {items.map(([k, v]) => (
        <div key={k} style={{ display: 'contents' }}><dt>{k}</dt><dd>{v}</dd></div>
      ))}
    </dl>
  );
}

export function Compare({ left, right }) {
  return (
    <div className="compare">
      <div><h4>{left.title}</h4>{left.body}</div>
      <div><h4>{right.title}</h4>{right.body}</div>
    </div>
  );
}

export function LinkGrid({ items }) {
  return (
    <nav className="linkgrid" aria-label="Related pages">
      {items.map((it) => (
        <a key={it.to} href={hrefFor(it.to)}><strong>{it.title}</strong><span>{it.text}</span></a>
      ))}
    </nav>
  );
}

/** Wrapper for SVG diagrams: scrollable on mobile, with a caption. */
export function Figure({ caption, title, children, label }) {
  return (
    <figure className="diagram" role="group" aria-label={label || title}>
      <div className="diagram-scroll">{children}</div>
      {(title || caption) && <figcaption>{title && <strong>{title}. </strong>}{caption}</figcaption>}
    </figure>
  );
}
