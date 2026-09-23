import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';

// Small hand-rolled SVG charts: one series each, so no legend (the card title
// names the metric). Every chart has a hover/tap readout and a screen-reader table.

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(320);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(200, Math.floor(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Clean tick values (1, 2, 2.5, 5 × 10^n) covering [min, max]. */
function niceTicks(min: number, max: number, count = 4) {
  if (max === min) {
    max = min === 0 ? 1 : max * 1.1;
    min = min * 0.9;
  }
  const raw = (max - min) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Number(v.toFixed(6)));
  return ticks;
}

function compact(v: number) {
  if (Math.abs(v) >= 10_000) return `${Number((v / 1000).toFixed(1))}k`;
  return String(Number(v.toFixed(1)));
}

function SrTable({ caption, rows }: { caption: string; rows: [string, string][] }) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <tbody>
        {rows.map(([k, v], i) => (
          <tr key={i}>
            <th scope="row">{k}</th>
            <td>{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export interface BarDatum {
  tick: string;
  label: string;
  value: number;
}

export function BarChart({
  data,
  format,
  caption,
  height = 176,
}: {
  data: BarDatum[];
  format: (v: number) => string;
  caption: string;
  height?: number;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const pad = { top: 22, right: 4, bottom: 24, left: 40 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const ticks = niceTicks(0, Math.max(...data.map((d) => d.value), 0));
  const top = ticks.at(-1) || 1;
  const band = innerW / data.length;
  const barW = Math.min(24, Math.max(4, band - 6));
  const y = (v: number) => pad.top + innerH - (v / top) * innerH;
  const every = Math.ceil(data.length / 6);
  const last = data.length - 1;
  const shown = active ?? null;

  // The latest bar carries a direct label, right-aligned to its edge. Lift it
  // above any neighbouring bar it would otherwise overlap.
  const lastLabel = data[last]?.value > 0 ? format(data[last].value) : '';
  const labelRight = pad.left + band * last + band / 2 + barW / 2;
  const labelLeft = labelRight - lastLabel.length * 6.6;
  let labelY = y(data[last]?.value ?? 0) - 6;
  data.forEach((d, i) => {
    const cx = pad.left + band * i + band / 2;
    if (cx + barW / 2 > labelLeft) labelY = Math.min(labelY, y(d.value) - 6);
  });

  return (
    <div className="chart" ref={ref} onPointerLeave={() => setActive(null)}>
      <svg width={width} height={height} role="img" aria-label={caption}>
        {ticks.map((t) => (
          <g key={t}>
            <line className="grid" x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} />
            <text className="axis" x={pad.left - 8} y={y(t)} dy="0.32em" textAnchor="end">
              {compact(t)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const cx = pad.left + band * i + band / 2;
          const h = Math.max(0, y(0) - y(d.value));
          const r = Math.min(4, h, barW / 2);
          const x0 = cx - barW / 2;
          const yTop = y(d.value);
          const path =
            h > 0
              ? `M${x0},${y(0)} V${yTop + r} Q${x0},${yTop} ${x0 + r},${yTop} H${x0 + barW - r} Q${x0 + barW},${yTop} ${x0 + barW},${yTop + r} V${y(0)} Z`
              : '';
          return (
            <g key={i}>
              {path && <path className={`bar ${shown !== null && shown !== i ? 'dim' : ''}`} d={path} />}
              {i % every === (last % every) && (
                <text className="axis" x={cx} y={height - 6} textAnchor="middle">
                  {d.tick}
                </text>
              )}
              {i === last && shown === null && lastLabel && (
                <text className="bar-label" x={labelRight} y={labelY} textAnchor="end">
                  {lastLabel}
                </text>
              )}
              <rect
                className="hit"
                x={pad.left + band * i}
                y={pad.top}
                width={band}
                height={innerH}
                tabIndex={0}
                aria-label={`${d.label}: ${format(d.value)}`}
                onPointerEnter={() => setActive(i)}
                onPointerDown={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
              />
            </g>
          );
        })}
        <line className="baseline" x1={pad.left} x2={width - pad.right} y1={y(0)} y2={y(0)} />
      </svg>
      {shown !== null && (
        <div
          className="tooltip"
          style={{
            left: Math.min(Math.max(pad.left + band * shown + band / 2, 70), width - 70),
            top: Math.max(0, y(data[shown].value) - 52),
          }}
        >
          <strong>{format(data[shown].value)}</strong>
          <span>{data[shown].label}</span>
        </div>
      )}
      <SrTable caption={caption} rows={data.map((d) => [d.label, format(d.value)])} />
    </div>
  );
}

export interface LinePoint {
  x: number;
  y: number;
  label: string;
}

export function LineChart({
  points,
  format,
  caption,
  height = 200,
}: {
  points: LinePoint[];
  format: (v: number) => string;
  caption: string;
  height?: number;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const pad = { top: 16, right: 14, bottom: 26, left: 44 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const ys = points.map((p) => p.y);
  const ticks = niceTicks(Math.min(...ys), Math.max(...ys));
  const [lo, hi] = [ticks[0], ticks.at(-1)!];
  const xs = points.map((p) => p.x);
  const [x0, x1] = [Math.min(...xs), Math.max(...xs)];
  const x = (v: number) => (x1 === x0 ? pad.left + innerW / 2 : pad.left + ((v - x0) / (x1 - x0)) * innerW);
  const y = (v: number) => pad.top + innerH - ((v - lo) / (hi - lo || 1)) * innerH;
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.x)},${y(p.y)}`).join(' ');
  const area = points.length > 1 ? `${line} L${x(x1)},${y(lo)} L${x(x0)},${y(lo)} Z` : '';
  const showDots = points.length <= 24;
  const last = points.length - 1;

  function onMove(e: ReactPointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    let best = 0;
    points.forEach((p, i) => {
      if (Math.abs(x(p.x) - px) < Math.abs(x(points[best].x) - px)) best = i;
    });
    setActive(best);
  }

  const a = active !== null ? points[active] : null;
  const dateTicks = points.length > 1 ? [points[0], points[last]] : points;

  return (
    <div className="chart" ref={ref}>
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={caption}
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => setActive(null)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') setActive((i) => Math.min(last, (i ?? -1) + 1));
          if (e.key === 'ArrowLeft') setActive((i) => Math.max(0, (i ?? last + 1) - 1));
        }}
        onBlur={() => setActive(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line className="grid" x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} />
            <text className="axis" x={pad.left - 8} y={y(t)} dy="0.32em" textAnchor="end">
              {compact(t)}
            </text>
          </g>
        ))}
        {dateTicks.map((p, i) => (
          <text
            key={i}
            className="axis"
            x={x(p.x)}
            y={height - 6}
            textAnchor={dateTicks.length === 1 ? 'middle' : i === 0 ? 'start' : 'end'}
          >
            {p.label}
          </text>
        ))}
        {area && <path className="area" d={area} />}
        <path className="line" d={line} />
        {showDots && points.map((p, i) => <circle key={i} className="dot" cx={x(p.x)} cy={y(p.y)} r={4} />)}
        {!showDots && <circle className="dot" cx={x(points[last].x)} cy={y(points[last].y)} r={4} />}
        {a && (
          <>
            <line className="crosshair" x1={x(a.x)} x2={x(a.x)} y1={pad.top} y2={pad.top + innerH} />
            <circle className="dot active" cx={x(a.x)} cy={y(a.y)} r={5} />
          </>
        )}
      </svg>
      {a && (
        <div className="tooltip" style={{ left: Math.min(Math.max(x(a.x), 70), width - 70), top: 0 }}>
          <strong>{format(a.y)}</strong>
          <span>{a.label}</span>
        </div>
      )}
      <SrTable caption={caption} rows={points.map((p) => [p.label, format(p.y)])} />
    </div>
  );
}

/** Horizontal bars for a ranked breakdown; values sit at the bar tips. */
export function HBars({ rows, format }: { rows: { label: string; value: number }[]; format: (v: number) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="hbars">
      {rows.map((r) => (
        <li key={r.label}>
          <span className="hbar-label">{r.label}</span>
          <span className="hbar-track">
            <span className="hbar-fill" style={{ '--p': r.value / max } as CSSProperties} />
            <span className="hbar-value">{format(r.value)}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
