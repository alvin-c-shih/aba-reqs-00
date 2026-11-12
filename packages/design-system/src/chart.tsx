/* Session charts follow single-case-design conventions:
   sessions are evenly spaced on x; phase changes are dashed vertical lines and the data
   path never connects across them; the mastery criterion is a quiet dashed line;
   annotations live in a slim lane under the axis so the data stays uncluttered. */
import { useEffect, useMemo, useRef, useState } from "react";

export type ChartPoint = {
  session_id: string; at: string; value: number; trials?: number; correct?: number; prompted?: number;
  incorrect?: number; no_response?: number; events?: number; seconds?: number; recorder?: string; session_kind?: string;
  intervals?: number; hits?: number; incidents?: number; steps?: number; steps_correct?: number;
};
export type ChartPhase = { id: string; label: string; kind: string; started_at: string; note?: string };
export type ChartNote = { id: string; at: string; kind: "note" | "treatment" | "context"; body: string; author?: string };
export type ProgramKind = "trial" | "frequency" | "duration" | "interval" | "abc" | "task";
export const isPercent = (kind: ProgramKind) => kind === "trial" || kind === "interval" || kind === "task";
/** A possible change point the statistics found inside a phase; the BCBA accepts or dismisses it. */
export type ChartSuggestion = { index: number; key: string; text: string };
export type ChartForecast = { sessions: number; from: number; text: string };

export function formatValue(kind: ProgramKind, v: number | null | undefined): string {
  if (v == null) return "–";
  if (isPercent(kind)) return `${Math.round(v)}%`;
  if (kind === "frequency" || kind === "abc") return String(Math.round(v));
  const m = Math.floor(v / 60), s = Math.round(v % 60);
  return m ? `${m}m ${String(s).padStart(2, "0")}s` : `${s}s`;
}
export const unitLabel = (kind: ProgramKind) => ({ trial: "% independent correct", frequency: "count per session", duration: "duration per session",
  interval: "% of intervals with behaviour", abc: "incidents per session", task: "% of steps independent" })[kind];

function niceMax(v: number) {
  if (v <= 5) return 5;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  return [1, 2, 2.5, 5, 10].map(m => m * p).find(m => m >= v) ?? v;
}
const shortDate = (iso: string) => new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });

function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(720);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, e.contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

export function SessionChart(props: {
  kind: ProgramKind; goal: "increase" | "decrease"; criterion: number; points: ChartPoint[]; phases: ChartPhase[]; notes: ChartNote[];
  mode?: "line" | "bar" | "cumulative"; height?: number; editable?: boolean; composing?: number | null;
  suggestions?: ChartSuggestion[]; unusual?: string[]; forecast?: ChartForecast | null; onSuggestion?: (s: ChartSuggestion, x: number) => void;
  onOpen?: (p: ChartPoint, index: number) => void; onCompose?: (index: number, x: number) => void; onNote?: (n: ChartNote) => void;
}) {
  const { kind, goal, criterion, phases, notes, mode = "line", height = 320, editable, composing } = props;
  // cumulative record: each session adds to a running total, so slope = rate
  const points = useMemo(() => { if (mode !== "cumulative") return props.points; let sum = 0; return props.points.map(p => ({ ...p, value: (sum += p.value) })); }, [props.points, mode]);
  const cumulative = mode === "cumulative";
  const [ref, W] = useWidth();
  const [active, setActive] = useState<number | null>(null);
  const [noteHover, setNoteHover] = useState<string | null>(null);
  const M = { l: 44, r: 14, t: 28, axis: 22, lane: 28 };
  const plotH = height - M.t - M.axis - M.lane, plotW = W - M.l - M.r;
  const fc = props.forecast && mode === "line" ? props.forecast : null;
  const ahead = fc ? Math.min(fc.sessions, 6) : 0;          // slots reserved to the right for the projection
  const n = points.length, step = plotW / Math.max(n + ahead, 8);
  const odd = new Set(props.unusual ?? []);
  const yMax = isPercent(kind) ? 100 : niceMax(Math.max(cumulative ? 0 : criterion, ...points.map(p => p.value), 1) * 1.1);
  const x = (i: number) => M.l + (i + 0.5) * step;
  const y = (v: number) => M.t + plotH - (Math.min(v, yMax) / yMax) * plotH;
  const met = (v: number) => !cumulative && (goal === "increase" ? v >= criterion : v <= criterion);
  const ticks = isPercent(kind) ? [0, 25, 50, 75, 100] : [0, .25, .5, .75, 1].map(f => f * yMax);

  const geo = useMemo(() => {
    const t = points.map(p => +new Date(p.at));
    const sorted = [...phases].sort((a, b) => +new Date(a.started_at) - +new Date(b.started_at));
    // phase j starts before the first point at/after its start time
    const starts = sorted.map((ph, j) => j === 0 ? 0 : (() => { const k = t.findIndex(v => v >= +new Date(ph.started_at)); return k < 0 ? n : k; })());
    const segs = sorted.length ? sorted.map((ph, j) => ({ ph, from: starts[j], to: j + 1 < sorted.length ? starts[j + 1] : n })) : [{ ph: null as ChartPhase | null, from: 0, to: n }];
    const noteAt = notes.map(nt => { let k = 0; const at = +new Date(nt.at); t.forEach((v, i) => { if (v <= at) k = i; }); return k; });
    return { segs, noteAt };
  }, [points, phases, notes, n]);

  const last = geo.segs[geo.segs.length - 1];
  let trend: [number, number, number, number] | null = null;
  if (!cumulative && last && last.to - last.from >= 3) {
    const vals = points.slice(last.from, last.to).map(p => p.value), k = vals.length, mx = (k - 1) / 2, my = vals.reduce((a, b) => a + b, 0) / k;
    const sl = vals.reduce((a, v, i) => a + (i - mx) * (v - my), 0) / vals.reduce((a, _, i) => a + (i - mx) ** 2, 0);
    trend = [x(last.from), y(Math.max(0, my - sl * mx)), x(last.to - 1), y(Math.max(0, my + sl * mx))];
  }
  const dateEvery = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(plotW / 64))));
  const laneY = M.t + plotH + M.axis + M.lane / 2;
  const ap = active != null ? points[active] : null;
  const hoverNote = notes.find(nt => nt.id === noteHover);
  const guide = composing ?? (noteHover ? geo.noteAt[notes.findIndex(nt => nt.id === noteHover)] : active);
  const slot: Record<number, number> = {};

  return (
    <div className="ds-chart" ref={ref} data-testid="session-chart" onMouseLeave={() => { setActive(null); setNoteHover(null); }}>
      <svg height={height} viewBox={`0 0 ${W} ${height}`} role="img"
        aria-label={`${mode} chart, ${n} sessions, ${geo.segs.length} phases. Latest value ${n ? formatValue(kind, points[n - 1].value) : "none"}.`}>
        {ticks.map(v => (
          <g key={v}>
            <line className="grid" x1={M.l} x2={W - M.r} y1={y(v)} y2={y(v)} />
            <text x={M.l - 8} y={y(v) + 4} textAnchor="end">{kind === "duration" ? `${Math.round(v / 60)}m` : Math.round(v)}{isPercent(kind) ? "%" : ""}</text>
          </g>
        ))}
        {geo.segs.map((s, j) => {
          const x0 = M.l + s.from * step, x1 = j + 1 < geo.segs.length ? M.l + s.to * step : W - M.r;
          const room = Math.floor((x1 - x0 - 8) / 6.3), label = s.ph?.label ?? "";
          return (
            <g key={j}>
              {j % 2 === 1 && <rect className="phase-band" x={x0} y={M.t} width={x1 - x0} height={plotH} />}
              {j > 0 && <line className="phase" x1={x0} x2={x0} y1={M.t - 16} y2={M.t + plotH} />}
              {s.ph && room > 3 && (
                <text className="phase-label" x={x0 + 6} y={M.t - 10} data-testid={`phase-label-${j}`}>
                  <title>{label}{s.ph.note ? ` — ${s.ph.note}` : ""}</title>{label.length > room ? label.slice(0, room - 1) + "…" : label}
                </text>
              )}
            </g>
          );
        })}
        {!cumulative && <><line className="crit" x1={M.l} x2={W - M.r} y1={y(criterion)} y2={y(criterion)} />
        <text className="crit-label" x={W - M.r - 4} y={y(criterion) + (goal === "increase" ? -5 : 13)} textAnchor="end">criterion {formatValue(kind, criterion)}</text></>}
        <line className="axis" x1={M.l} x2={W - M.r} y1={M.t + plotH} y2={M.t + plotH} />
        {guide != null && guide < n && <line className="guide" x1={x(guide)} x2={x(guide)} y1={M.t} y2={laneY - 8} />}

        {mode === "bar"
          ? points.map((p, i) => {
            const bw = Math.min(28, step * 0.62), h = Math.max(1.5, M.t + plotH - y(p.value));
            return <rect key={p.session_id} className={`bar${met(p.value) ? " met" : ""}${i === active ? " on" : ""}`} x={x(i) - bw / 2} y={M.t + plotH - h} width={bw} height={h} rx={3} />;
          })
          : <>
            {trend && <line className="trend" x1={trend[0]} y1={trend[1]} x2={trend[2]} y2={trend[3]} />}
            {geo.segs.map((s, j) => s.to - s.from > 1 && (
              <path key={j} className="path" d={points.slice(s.from, s.to).map((p, k) => `${k ? "L" : "M"}${x(s.from + k).toFixed(1)} ${y(p.value).toFixed(1)}`).join(" ")} />
            ))}
            {fc && n > 0 && <g data-testid="chart-forecast">
              <line className="forecast" x1={x(n - 1)} y1={y(fc.from)} x2={x(n - 1 + ahead)} y2={y(fc.from + ((criterion - fc.from) * ahead) / fc.sessions)} />
              <text className="forecast-label" x={x(n - 1) + 10} y={y(fc.from) + (goal === "increase" ? 18 : -10)} textAnchor="start">
                {fc.sessions > ahead ? `criterion in ≈${fc.sessions} sessions` : `≈${fc.sessions} session${fc.sessions === 1 ? "" : "s"} to criterion`}</text>
            </g>}
            {points.map((p, i) => <circle key={p.session_id} className={`pt${met(p.value) ? " met" : ""}${i === active ? " on" : ""}`} cx={x(i)} cy={y(p.value)} r={i === active ? 5.5 : 3.5} />)}
          </>}
        {points.map((p, i) => odd.has(p.session_id) && <circle key={"u" + p.session_id} className="unusual" cx={x(i)} cy={y(p.value)} r={10} data-testid="chart-unusual"><title>Unusual compared with the recent pattern</title></circle>)}
        {(props.suggestions ?? []).map(s => {
          const sx = M.l + s.index * step;
          return (
            <g key={s.key} className="suggest" data-testid="chart-suggestion" onClick={() => props.onSuggestion?.(s, sx)}>
              <title>{s.text}</title>
              <line x1={sx} x2={sx} y1={M.t - 4} y2={M.t + plotH} />
              <circle cx={sx} cy={M.t - 12} r={9} />
              <text x={sx} y={M.t - 8} textAnchor="middle">?</text>
            </g>
          );
        })}

        {points.map((p, i) => i % dateEvery === 0 && <text key={i} x={x(i)} y={M.t + plotH + 15} textAnchor="middle">{shortDate(p.at)}</text>)}

        {/* notes lane */}
        <line className="lane-line" x1={M.l} x2={W - M.r} y1={laneY} y2={laneY} />
        <text x={M.l - 8} y={laneY + 4} textAnchor="end">notes</text>
        {notes.map((nt, k) => {
          const i = geo.noteAt[k]; slot[i] = (slot[i] ?? -1) + 1;
          const cx = x(i) + slot[i] * 11 - (notes.filter((_, q) => geo.noteAt[q] === i).length - 1) * 5.5;
          return (
            <g key={nt.id} className={`note ${nt.kind}`} onMouseEnter={() => { setNoteHover(nt.id); setActive(null); }} onMouseLeave={() => setNoteHover(null)}
              onClick={() => props.onNote?.(nt)} data-testid="chart-note" data-x={cx}>
              <rect x={cx - 8} y={laneY - 10} width={16} height={20} fill="transparent" />
              {nt.kind === "treatment" ? <rect className="m" x={cx - 4.5} y={laneY - 4.5} width={9} height={9} transform={`rotate(45 ${cx} ${laneY})`} />
                : <circle className="m" cx={cx} cy={laneY} r={nt.kind === "context" ? 5 : 4} />}
            </g>
          );
        })}

        {/* one hit column per session: hover, click, keyboard */}
        {points.map((p, i) => (
          <rect key={p.session_id} className="hit" x={M.l + i * step} y={M.t} width={step} height={plotH + M.axis} tabIndex={0}
            data-testid={`chart-session-${i}`} aria-label={`${shortDate(p.at)}: ${formatValue(kind, p.value)}`}
            onMouseEnter={() => { setActive(i); setNoteHover(null); }} onFocus={() => setActive(i)} onClick={() => props.onOpen?.(p, i)}
            onKeyDown={e => {
              const sib = (d: number) => ((e.currentTarget.parentNode as SVGElement).querySelector(`[data-testid="chart-session-${i + d}"]`) as SVGElement | null)?.focus();
              if (e.key === "ArrowRight") sib(1); else if (e.key === "ArrowLeft") sib(-1);
              else if (e.key === "Enter") props.onOpen?.(p, i);
              else if (editable && e.key.toLowerCase() === "n") { e.preventDefault(); props.onCompose?.(i, x(i)); }
            }} />
        ))}
        {editable && active != null && composing == null && (
          <g className="add show" onClick={() => props.onCompose?.(active, x(active))} data-testid="chart-add-note">
            <title>Add a note here (N)</title>
            <circle cx={x(active)} cy={laneY} r={9} />
            <path d={`M${x(active) - 4} ${laneY}h8M${x(active)} ${laneY - 4}v8`} stroke="var(--accent-ink)" strokeWidth={1.6} strokeLinecap="round" />
          </g>
        )}
      </svg>

      {ap && active != null && !hoverNote && (
        <div className="ds-tip" style={{ left: x(active), top: y(ap.value) - 10 }}>
          <b>{formatValue(kind, ap.value)}</b> <span className="sub">· {new Date(ap.at).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}</span>
          <div className="sub">
            {cumulative ? "running total"
              : kind === "trial" ? `${ap.correct}/${ap.trials} independent · ${ap.prompted} prompted · ${(ap.incorrect ?? 0) + (ap.no_response ?? 0)} missed`
              : kind === "interval" ? `${ap.hits} of ${ap.intervals} intervals`
              : kind === "task" ? `${ap.steps_correct} of ${ap.steps} steps independent`
              : kind === "abc" ? `${ap.incidents} incident${ap.incidents === 1 ? "" : "s"}`
              : kind === "frequency" ? `${ap.events} in session` : "total in session"}
            {ap.recorder ? ` · ${ap.recorder}` : ""}
          </div>
        </div>
      )}
      {hoverNote && (
        <div className="ds-tip below" style={{ left: Math.min(Math.max(x(geo.noteAt[notes.indexOf(hoverNote)]), 130), W - 130), top: laneY + 6 }}>
          <div className="sub">{hoverNote.kind === "treatment" ? "Treatment change" : hoverNote.kind === "context" ? "Context" : "Note"} · {shortDate(hoverNote.at)}{hoverNote.author ? ` · ${hoverNote.author}` : ""}</div>
          {hoverNote.body}
        </div>
      )}
    </div>
  );
}

export function Sparkline({ values, criterion, width = 96, height = 28, max }: { values: number[]; criterion?: number; width?: number; height?: number; max?: number }) {
  if (!values.length) return <svg className="ds-spark" width={width} height={height} aria-hidden="true" />;
  const top = max ?? Math.max(...values, criterion ?? 0, 1), pad = 3;
  const px = (i: number) => pad + (values.length === 1 ? (width - pad * 2) / 2 : (i * (width - pad * 2)) / (values.length - 1));
  const py = (v: number) => height - pad - (v / top) * (height - pad * 2);
  return (
    <svg className="ds-spark" width={width} height={height} aria-hidden="true">
      {criterion != null && <line x1={0} x2={width} y1={py(criterion)} y2={py(criterion)} />}
      <path d={values.map((v, i) => `${i ? "L" : "M"}${px(i).toFixed(1)} ${py(v).toFixed(1)}`).join(" ")} />
      <circle cx={px(values.length - 1)} cy={py(values[values.length - 1])} r={2.5} />
    </svg>
  );
}
