/**
 * Data-driven SVG diagram primitives. Colours come from CSS classes defined in
 * components.css, so every diagram follows the light/dark theme.
 */
import { useId } from 'react';

const CHAR_W = 6.7; // approx width of an 11px mono glyph

function useMarkerIds() {
  const raw = useId().replace(/[^a-zA-Z0-9]/g, '');
  return { def: `arr-${raw}`, acc: `arr-a-${raw}`, err: `arr-e-${raw}`, brass: `arr-b-${raw}` };
}

export function Markers({ ids }) {
  const m = (id, cls) => (
    <marker id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" className={`d-arrowhead ${cls}`} />
    </marker>
  );
  return (
    <defs>
      {m(ids.def, '')}
      {m(ids.acc, 'accent')}
      {m(ids.err, 'danger')}
      {m(ids.brass, 'brass')}
    </defs>
  );
}

function LabelText({ x, y, text, anchor = 'middle', cls = 'd-label' }) {
  const w = text.length * CHAR_W + 10;
  const rx = anchor === 'middle' ? x - w / 2 : anchor === 'start' ? x - 5 : x - w + 5;
  return (
    <g>
      <rect x={rx} y={y - 11} width={w} height={15} className="d-label-bg" rx="2" />
      <text x={x} y={y} textAnchor={anchor} className={cls}>{text}</text>
    </g>
  );
}

/**
 * Sequence diagram.
 * actors: [{ label, sub }]
 * steps:  { from, to, label, kind: 'req'|'res'|'err'|'ok' }
 *         { divider: 'text' }
 *         { note: 'text', at: actorIndex }
 */
export function Sequence({ actors, steps, colW = 168, rowH = 36, title }) {
  const ids = useMarkerIds();
  const left = 20;
  const headH = 46;
  const top = headH + 30;
  const width = left * 2 + actors.length * colW;
  const height = top + steps.length * rowH + 20;
  const cx = (i) => left + colW * i + colW / 2;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} role="img" aria-label={title}>
      <title>{title}</title>
      <Markers ids={ids} />
      {actors.map((a, i) => (
        <g key={a.label}>
          <line x1={cx(i)} y1={headH} x2={cx(i)} y2={height - 6} className="d-life" />
          <rect x={cx(i) - colW / 2 + 10} y={2} width={colW - 20} height={headH - 4} rx="4"
            className={`d-box ${a.tone || 'muted'}`} />
          <text x={cx(i)} y={a.sub ? 21 : 28} textAnchor="middle" className="d-title">{a.label}</text>
          {a.sub && <text x={cx(i)} y={36} textAnchor="middle" className="d-faint">{a.sub}</text>}
        </g>
      ))}
      {steps.map((s, i) => {
        const y = top + i * rowH;
        if (s.divider) {
          return (
            <g key={i}>
              <line x1={left} x2={width - left} y1={y - 4} y2={y - 4} className="d-line dashed" />
              <LabelText x={width / 2} y={y} text={s.divider} cls="d-brass-text" />
            </g>
          );
        }
        if (s.note !== undefined) {
          const x = cx(s.at);
          const w = Math.max(...s.note.split('|').map((t) => t.length)) * CHAR_W + 18;
          const lines = s.note.split('|');
          return (
            <g key={i}>
              <rect x={x - w / 2} y={y - 16} width={w} height={14 * lines.length + 8} rx="3" className="d-note" />
              {lines.map((t, k) => (
                <text key={k} x={x} y={y - 3 + k * 14} textAnchor="middle" className="d-mono">{t}</text>
              ))}
            </g>
          );
        }
        const x1 = cx(s.from);
        const x2 = cx(s.to);
        const dir = x2 > x1 ? 1 : -1;
        const kind = s.kind || 'req';
        const lineCls = kind === 'err' ? 'danger' : kind === 'ok' ? 'accent' : '';
        const marker = kind === 'err' ? ids.err : kind === 'ok' ? ids.acc : ids.def;
        const dashed = kind === 'res' || kind === 'ok' || kind === 'err';
        const textCls = kind === 'err' ? 'd-danger-text' : kind === 'ok' ? 'd-accent-text' : 'd-label';
        if (s.from === s.to) {
          return (
            <g key={i}>
              <path d={`M${x1} ${y - 10} h28 v14 h-24`} className="d-line" markerEnd={`url(#${marker})`} />
              <LabelText x={x1 + 36} y={y} text={s.label} anchor="start" cls={textCls} />
            </g>
          );
        }
        return (
          <g key={i}>
            <line x1={x1 + dir * 3} y1={y + 4} x2={x2 - dir * 4} y2={y + 4}
              className={`d-line ${lineCls}${dashed ? ' dashed' : ''}`} markerEnd={`url(#${marker})`} />
            <LabelText x={(x1 + x2) / 2} y={y - 3} text={s.label} cls={textCls} />
          </g>
        );
      })}
    </svg>
  );
}

/**
 * Vertical pipeline with optional side branches (usually error exits).
 * stages: [{ title, sub, tone, code, branch: { label, title, sub, tone } }]
 */
export function Flow({ stages, title, boxW = 330, boxH = 54, gap = 26, branchW = 210 }) {
  const ids = useMarkerIds();
  const hasBranch = stages.some((s) => s.branch);
  const pad = 16;
  const BG = 100; // gap between a stage and its branch box
  const width = pad * 2 + boxW + (hasBranch ? BG + branchW : 0);
  const height = pad * 2 + stages.length * boxH + (stages.length - 1) * gap;
  const x = pad;
  const yOf = (i) => pad + i * (boxH + gap);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} role="img" aria-label={title}>
      <title>{title}</title>
      <Markers ids={ids} />
      {stages.map((s, i) => {
        const y = yOf(i);
        const subLines = Array.isArray(s.sub) ? s.sub : s.sub ? [s.sub] : [];
        return (
          <g key={i}>
            {i < stages.length - 1 && (
              <line x1={x + boxW / 2} y1={y + boxH} x2={x + boxW / 2} y2={y + boxH + gap - 2}
                className="d-line" markerEnd={`url(#${ids.def})`} />
            )}
            <rect x={x} y={y} width={boxW} height={boxH} rx="4" className={`d-box ${s.tone || ''}`} />
            <text x={x + 14} y={y + (subLines.length ? 22 : boxH / 2 + 5)} className="d-title">{s.title}</text>
            {s.tag && <text x={x + boxW - 12} y={y + 22} textAnchor="end" className="d-brass-text">{s.tag}</text>}
            {subLines.map((t, k) => (
              <text key={k} x={x + 14} y={y + 39 + k * 13} className={s.mono ? 'd-mono' : 'd-text'}>{t}</text>
            ))}
            {s.branch && (() => {
              const bx = x + boxW + BG;
              const by = y + boxH / 2;
              const bSub = Array.isArray(s.branch.sub) ? s.branch.sub : s.branch.sub ? [s.branch.sub] : [];
              const tone = s.branch.tone || 'danger';
              return (
                <g>
                  <line x1={x + boxW} y1={by} x2={bx - 2} y2={by}
                    className={`d-line ${tone === 'danger' ? 'danger' : 'accent'} dashed`}
                    markerEnd={`url(#${tone === 'danger' ? ids.err : ids.acc})`} />
                  {s.branch.label && (
                    <text x={x + boxW + BG / 2} y={by - 6} textAnchor="middle"
                      className={tone === 'danger' ? 'd-danger-text' : 'd-accent-text'}>{s.branch.label}</text>
                  )}
                  <rect x={bx} y={y + 4} width={branchW} height={boxH - 8} rx="4" className={`d-box ${tone}`} />
                  <text x={bx + 12} y={y + (bSub.length ? 22 : boxH / 2 + 5)} className="d-title">{s.branch.title}</text>
                  {bSub.map((t, k) => (
                    <text key={k} x={bx + 12} y={y + 37 + k * 13} className="d-mono">{t}</text>
                  ))}
                </g>
              );
            })()}
          </g>
        );
      })}
    </svg>
  );
}

export { useMarkerIds };
