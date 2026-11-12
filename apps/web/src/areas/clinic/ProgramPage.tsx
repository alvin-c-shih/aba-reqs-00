import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge, Button, Card, FLAGS, FlagBadge, Icon, KIND_LABEL, Kbd, SIGNALS, Segmented, SessionChart, Stat, formatValue, unitLabel, useToast, type ChartNote } from "@aba/design-system";
import { del, patch, post, put } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { fmtDate, studentName, useData } from "../../lib/hooks";
import { PageHead, usePageTour } from "../../shell/Shell";
import { TOURS } from "../../shell/tours";
import { ProgramForm } from "./ProgramForm";
import { SessionDrawer } from "./SessionDrawer";

const NOTE_KINDS = [
  { value: "note", label: "Note" }, { value: "treatment", label: "Treatment change" }, { value: "context", label: "Context" },
] as const;

export function ProgramPage() {
  const { id } = useParams();
  const { me } = useAuth();
  const { data, error, reload } = useData<any>(`/clinic/programs/${id}/series`);
  const [pref, setMode] = useState<"line" | "bar" | "cumulative" | "table">(() => (localStorage.getItem("aba.chart") as any) || "line");
  const [compose, setCompose] = useState<{ index: number; x: number; phase?: boolean; kind?: "note" | "treatment" | "context" } | null>(null);
  const [session, setSession] = useState<string | null>(null), [editing, setEditing] = useState(false);
  const toast = useToast();
  const canEdit = me!.role === "bcba";
  usePageTour(TOURS.graph, !!data && canEdit);
  useEffect(() => localStorage.setItem("aba.chart", pref), [pref]);
  const countKind = ["frequency", "abc"].includes(data?.program.kind);
  const mode = pref === "cumulative" && !countKind ? "line" : pref;      // cumulative records only make sense for counts
  if (error) return <div className="page"><div className="err">{error}</div></div>;
  if (!data) return null;
  const { program: p, student, points, phases, annotations, summary } = data;
  const insights: any[] = data.insights ?? [];
  const xOf = (index: number) => { const w = document.querySelector<HTMLElement>('[data-testid="session-chart"]')?.clientWidth ?? 800; const fc = insights.find(i => i.kind === "forecast"); return 44 + (index + 0.5) * ((w - 58) / Math.max(points.length + (fc && mode === "line" ? Math.min(fc.sessions, 6) : 0), 8)); };
  const indexOf = (i: any) => i.index ?? points.findIndex((q: any) => q.session_id === i.key);
  const dismiss = async (i: any) => {
    await post(`/clinic/programs/${id}/insights/dismiss`, { kind: i.kind, key: i.key }); reload();
    toast({ text: "Suggestion dismissed", action: { label: "Undo", run: () => post(`/clinic/programs/${id}/insights/restore`, { kind: i.kind, key: i.key }).then(reload) } });
  };
  const flag = FLAGS[summary.flag as keyof typeof FLAGS];

  const removeNote = async (n: ChartNote) => {
    await del(`/clinic/annotations/${n.id}`); reload();
    toast({ text: "Note removed", action: { label: "Undo", run: () => post(`/clinic/annotations/${n.id}/restore`).then(reload) } });
  };
  const removePhase = async (ph: any) => {
    try { await del(`/clinic/phases/${ph.id}`); reload();
      toast({ text: `Phase “${ph.label}” removed`, action: { label: "Undo", run: () => post(`/clinic/programs/${id}/phases`, { label: ph.label, kind: ph.kind, started_at: ph.started_at, note: ph.note }).then(reload) } }); }
    catch (e: any) { toast({ text: e.message, tone: "bad" }); }
  };
  const setStatus = async (status: string) => {
    const before = p.status; await patch(`/clinic/programs/${id}`, { status }); reload();
    toast({ text: `Program marked ${status}`, action: { label: "Undo", run: () => patch(`/clinic/programs/${id}`, { status: before }).then(reload) } });
  };

  return (
    <div className="page">
      <PageHead crumbs={canEdit ? <><Link to="/clinic">Caseload</Link> › <Link to={`/clinic/students/${student.id}`}>{studentName(student)}</Link> ›</> : <Link to="/collect"><Icon name="arrowLeft" size={14} /> Back to today</Link>}
        title={p.name} sub={`${KIND_LABEL[p.kind]} · ${p.domain || "No domain"} · goal: ${p.goal}`}>
        {p.status !== "active" && <Badge tone={p.status === "mastered" ? "ok" : "neutral"}>{p.status}</Badge>}
        {canEdit && summary.flag === "mastered" && p.status === "active" && <Button variant="primary" icon="check" onClick={() => setStatus("mastered")} testid="mark-mastered">Mark mastered</Button>}
        {canEdit && p.status === "mastered" && <Button onClick={() => setStatus("active")}>Reopen</Button>}
        {canEdit && <Button variant="ghost" onClick={async () => { await post(`/clinic/programs/${id}/template`); toast({ text: "Saved as a school template — the design only, no student data" }); }} testid="save-template">Save as template</Button>}
        {canEdit && <span data-tour="edit-program"><Button icon="edit" onClick={() => setEditing(true)} testid="edit-program">Edit program</Button></span>}
      </PageHead>

      <div className="ds-stack lg">
        <Card data-tour="status" data-testid="status-card">
          <div className="ds-row wrap" style={{ gap: 28, alignItems: "flex-start" }}>
            <div style={{ minWidth: 220, flex: "1 1 260px" }}>
              <FlagBadge flag={summary.flag} />
              <div style={{ marginTop: 6, fontWeight: 600 }}>{summary.why}</div>
              <div className="ds-small ds-muted">{flag?.hint} Judged on the current phase only.</div>
            </div>
            <Stat value={formatValue(p.kind, summary.last)} label="Latest session" testid="stat-last" />
            <Stat value={formatValue(p.kind, summary.mean)} label="Mean this phase" />
            <Stat value={summary.sessions_in_phase} label="Sessions this phase" />
            <Stat value={<>{summary.slope > 0 ? "+" : ""}{p.kind === "duration" ? `${Math.round(summary.slope)}s` : summary.slope}</>} label="Trend per session" />
          </div>
        </Card>

        {insights.length > 0 && (
          <Card data-tour="insights" data-testid="insights">
            <div className="ds-row" style={{ marginBottom: 4 }}><span style={{ color: "var(--accent)" }}><Icon name="sparkle" /></span><h2>Suggestions</h2>
              <span className="ds-small ds-muted">from the statistics — nothing changes unless you act</span></div>
            {insights.map((i, k) => (
              <div key={k} className="ds-row wrap" style={{ padding: "10px 0", borderTop: k ? "1px solid var(--line)" : 0, gap: 12 }} data-testid={`insight-${i.kind}`}>
                <Badge tone={SIGNALS[i.kind]?.tone} icon={SIGNALS[i.kind]?.icon}>{SIGNALS[i.kind]?.label}</Badge>
                <span className="ds-grow ds-small" style={{ minWidth: 240 }}>{i.at ? <b>{fmtDate(i.at)} · </b> : null}{i.text}</span>
                {canEdit && i.kind === "change_point" && <Button size="sm" variant="primary" onClick={() => setCompose({ index: indexOf(i), x: xOf(indexOf(i)), phase: true })} testid="insight-add-phase">Mark phase here…</Button>}
                {canEdit && i.kind === "unusual" && <Button size="sm" onClick={() => setCompose({ index: indexOf(i), x: xOf(indexOf(i)), kind: "context" })} testid="insight-add-note">Add context…</Button>}
                {canEdit && i.kind !== "forecast" && <Button size="sm" variant="ghost" onClick={() => dismiss(i)} testid="insight-dismiss">Dismiss</Button>}
              </div>
            ))}
          </Card>
        )}

        <Card>
          <div className="ds-row between wrap" style={{ marginBottom: 6 }}>
            <div><h2>{unitLabel(p.kind)}</h2><div className="ds-small ds-muted">{points.length} sessions · {phases.length} phase{phases.length === 1 ? "" : "s"}</div></div>
            <span data-tour="chart-mode"><Segmented value={mode} onChange={setMode} testid="chart-mode" options={[{ value: "line", label: "Line", icon: "chart" }, { value: "bar", label: "Bar", icon: "bars" },
              ...(countKind ? [{ value: "cumulative" as const, label: "Cumulative", icon: "arrowRight" }] : []), { value: "table", label: "Table", icon: "list" }]} /></span>
          </div>
          {mode === "table" && (
            <div className="ds-table-wrap" style={{ maxHeight: 420, overflow: "auto" }} data-testid="data-table">
              <table className="ds-table"><thead><tr><th>Session</th><th>Phase</th><th className="num">Value</th><th>Detail</th><th>Recorded by</th></tr></thead>
                <tbody>{[...points].reverse().map((pt: any) => {
                  const ph = [...phases].reverse().find((q: any) => +new Date(q.started_at) <= +new Date(pt.at));
                  return (<tr key={pt.session_id} onClick={() => setSession(pt.session_id)} style={{ cursor: "pointer" }}>
                    <td className="ds-num">{fmtDate(pt.at)}</td><td className="ds-small">{ph?.label}</td><td className="num"><b>{formatValue(p.kind, pt.value)}</b></td>
                    <td className="ds-small ds-muted">{p.kind === "trial" ? `${pt.correct}/${pt.trials} independent, ${pt.prompted} prompted` : p.kind === "interval" ? `${pt.hits}/${pt.intervals} intervals`
                      : p.kind === "task" ? `${pt.steps_correct}/${pt.steps} steps` : p.kind === "duration" ? "total" : `${pt.window_s ? (pt.value / (pt.window_s / 3600)).toFixed(1) + " per hour" : ""}`}</td>
                    <td className="ds-small">{pt.recorder}</td></tr>);
                })}</tbody></table>
            </div>)}
          <div style={{ position: "relative", display: mode === "table" ? "none" : undefined }} data-tour="chart">
            <SessionChart kind={p.kind} goal={p.goal} criterion={p.mastery.value} points={points} phases={phases} notes={annotations} mode={mode === "table" ? "line" : mode} editable={canEdit}
              composing={compose?.index ?? null} onOpen={pt => setSession(pt.session_id)} onCompose={(index, x) => setCompose({ index, x })}
              suggestions={insights.filter(i => i.kind === "change_point").map(i => ({ index: i.index, key: i.key, text: i.text }))}
              unusual={insights.filter(i => i.kind === "unusual").map(i => i.key)} forecast={insights.find(i => i.kind === "forecast") ?? null}
              onSuggestion={(s, x) => canEdit && setCompose({ index: s.index, x, phase: true })} />
            {compose && points[compose.index] && <Composer key={`${compose.index}-${compose.phase}-${compose.kind}`} x={compose.x} point={points[compose.index]} programId={id!} initialPhase={compose.phase} initialKind={compose.kind}
              onClose={() => setCompose(null)} onSaved={() => { setCompose(null); reload(); }} />}
            {!points.length && <div className="ds-muted" style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>No sessions recorded yet</div>}
          </div>
          <div className="legend" style={{ marginTop: 8 }}>
            <span><i style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--ink)" }} />met criterion</span>
            <span><i style={{ width: 9, height: 9, borderRadius: "50%", border: "1.75px solid var(--ink)" }} />below</span>
            <span><i style={{ width: 16, borderTop: "1.5px dashed var(--ink-2)" }} />phase change</span>
            <span><i style={{ width: 8, height: 8, background: "var(--accent)", transform: "rotate(45deg)" }} />treatment change</span>
            <span><i style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--warn)" }} />context</span>
            {insights.some(i => i.kind === "forecast") && <span><i style={{ width: 16, borderTop: "1.5px dashed var(--accent)" }} />forecast</span>}
            {insights.some(i => i.kind === "unusual") && <span><i style={{ width: 11, height: 11, borderRadius: "50%", border: "1.5px dashed var(--warn)" }} />unusual session</span>}
            <span className="ds-grow" />
            {canEdit && <span>Hover a session and click <b style={{ color: "var(--accent)" }}>＋</b>, or press <Kbd>N</Kbd>, to annotate</span>}
          </div>
        </Card>

        {data.patterns && (
          <Card data-testid="abc-patterns">
            <h2>What surrounds the behaviour</h2>
            <p className="ds-small ds-muted" style={{ marginBottom: 12 }}>Most common antecedents and consequences in the last 60 days. A dominant pair points to the function of the behaviour.</p>
            <div className="ds-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
              {(["antecedents", "consequences"] as const).map(key => {
                const rows: any[] = data.patterns[key], total = rows.reduce((a, r) => a + r.n, 0) || 1;
                return (<div key={key}><div className="ds-eyebrow" style={{ marginBottom: 8 }}>{key === "antecedents" ? "Before (antecedent)" : "After (consequence)"}</div>
                  {rows.map(r => (<div key={r.label} style={{ marginBottom: 8 }}>
                    <div className="ds-row between ds-small"><span>{r.label}</span><b className="ds-num">{Math.round((100 * r.n) / total)}%</b></div>
                    <div style={{ height: 6, borderRadius: 3, background: "var(--line)" }}><div style={{ height: 6, borderRadius: 3, width: `${(100 * r.n) / total}%`, background: key === "antecedents" ? "var(--accent)" : "var(--warn)" }} /></div></div>))}
                  {!rows.length && <span className="ds-small ds-muted">No incidents logged yet.</span>}</div>);
              })}
            </div>
          </Card>
        )}

        <div className="ds-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
          <Card>
            <h2 style={{ marginBottom: 10 }}>Phases &amp; notes</h2>
            <div className="ds-stack" style={{ gap: 0 }} data-testid="timeline">
              {[...phases.map((ph: any) => ({ t: ph.started_at, ph })), ...annotations.map((n: any) => ({ t: n.at, n }))]
                .sort((a, b) => +new Date(b.t) - +new Date(a.t)).map((row: any, i) => (
                  <div key={i} className="ds-row" style={{ padding: "9px 0", borderTop: i ? "1px solid var(--line)" : 0, alignItems: "flex-start" }}>
                    <span className="ds-tiny ds-muted ds-num" style={{ width: 52, flex: "none", paddingTop: 3 }}>{fmtDate(row.t)}</span>
                    {row.ph ? <div className="ds-grow"><Badge tone="neutral" icon="flag">Phase</Badge> <b>{row.ph.label}</b>{row.ph.note && <div className="ds-small ds-muted">{row.ph.note}</div>}</div>
                      : <div className="ds-grow"><Badge tone={row.n.kind === "treatment" ? "accent" : row.n.kind === "context" ? "warn" : "neutral"}>{NOTE_KINDS.find(k => k.value === row.n.kind)!.label}</Badge> <span className="ds-small">{row.n.body}</span><div className="ds-tiny ds-muted">{row.n.author}</div></div>}
                    {canEdit && (row.n || phases.length > 1) && <Button size="sm" variant="ghost" icon="trash" aria-label="Remove" onClick={() => row.ph ? removePhase(row.ph) : removeNote(row.n)} />}
                  </div>
                ))}
            </div>
          </Card>
          <Card>
            <h2 style={{ marginBottom: 10 }}>Program</h2>
            <div className="ds-stack ds-small">
              <div><div className="ds-eyebrow">{p.kind === "trial" || p.kind === "task" ? "Instruction" : "Definition"}</div>{p.instruction || <span className="ds-muted">Not written yet</span>}</div>
              <div><div className="ds-eyebrow">Mastery rule</div>{p.goal === "increase" ? "At least" : "At most"} <b>{formatValue(p.kind, p.mastery.value)}</b> in <b>{p.mastery.n} of the last {p.mastery.m}</b> sessions{p.kind === "trial" && p.mastery.min_trials ? `, ${p.mastery.min_trials}+ trials each` : ""}</div>
              {canEdit && p.kind === "frequency" && <label className="ds-check"><input type="checkbox" checked={p.home_ok} data-testid="home-ok"
                onChange={async e => { await put(`/clinic/programs/${id}/home`, { home_ok: e.target.checked }); reload(); toast({ text: e.target.checked ? "Families you allow can now count this at home" : "Home recording switched off" }); }} />Family may count this at home <span className="ds-muted">(always reviewed)</span></label>}
              {p.kind === "interval" && <div><div className="ds-eyebrow">Intervals</div>{p.config.method} · {p.config.seconds}s × {p.config.count}</div>}
              {p.targets.length > 0 && <div><div className="ds-eyebrow">{p.kind === "task" ? "Steps" : "Targets"}</div><div className="chips" style={{ marginTop: 4 }}>{p.targets.map((t: any) => <span key={t.id} className="chip">{t.label}</span>)}</div></div>}
            </div>
          </Card>
        </div>
      </div>
      {session && <SessionDrawer sessionId={session} programId={id} canEdit={canEdit} onClose={() => setSession(null)} onChanged={reload} />}
      {editing && <ProgramForm program={p} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); reload(); toast({ text: "Program saved" }); }} />}
    </div>
  );
}

/* Inline annotation: appears under the session you pointed at, keyboard-first.
   Type → Enter. Optionally the same gesture starts a new phase at that session. */
function Composer({ x, point, programId, onClose, onSaved, initialPhase, initialKind }: { x: number; point: any; programId: string; onClose: () => void; onSaved: () => void; initialPhase?: boolean; initialKind?: "note" | "treatment" | "context" }) {
  const [body, setBody] = useState(""), [kind, setKind] = useState<"note" | "treatment" | "context">(initialKind ?? "note");
  const [phase, setPhase] = useState(!!initialPhase), [label, setLabel] = useState("");
  const ref = useRef<HTMLDivElement>(null), input = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const close = useRef(onClose); close.current = onClose;
  useEffect(() => {
    const out = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) close.current(); };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && close.current();
    const t = setTimeout(() => document.addEventListener("mousedown", out));   // skip the click that opened us
    document.addEventListener("keydown", esc);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", out); document.removeEventListener("keydown", esc); };
  }, []);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() && !(phase && label.trim())) return;
    try {
      const made: { note?: string; phase?: string } = {};
      if (phase && label.trim()) made.phase = (await post(`/clinic/programs/${programId}/phases`, { label: label.trim(), kind: "intervention", note: body.trim(),
        started_at: new Date(+new Date(point.at) - 60_000).toISOString() })).id;
      if (body.trim()) made.note = (await post(`/clinic/programs/${programId}/annotations`, { at: point.at, kind: phase ? "treatment" : kind, body: body.trim() })).id;
      onSaved();
      toast({ text: made.phase ? `Phase “${label.trim()}” starts ${fmtDate(point.at)}` : "Note added", action: { label: "Undo", run: async () => {
        if (made.note) await del(`/clinic/annotations/${made.note}`);
        if (made.phase) await del(`/clinic/phases/${made.phase}`);
        onSaved();
      } } });
    } catch (err: any) { toast({ text: err.message, tone: "bad" }); }
  };
  const width = 300, host = ref.current?.parentElement?.clientWidth ?? 800;
  return (
    <div ref={ref} className="composer" style={{ left: Math.max(0, Math.min(x - width / 2, host - width)), top: "100%", marginTop: -18 }} data-testid="composer">
      <form onSubmit={save}>
        <div className="ds-eyebrow" style={{ marginBottom: 4 }}>{fmtDate(point.at)} · session note</div>
        <input ref={input} type="text" autoFocus maxLength={500} placeholder="What happened or changed?" value={body} onChange={e => setBody(e.target.value)} data-testid="composer-text" />
        {!phase && <div className="chips">{NOTE_KINDS.map(k => <button type="button" key={k.value} className="chip" aria-pressed={kind === k.value} onClick={() => { setKind(k.value); input.current?.focus(); }} data-testid={`composer-kind-${k.value}`}>{k.label}</button>)}</div>}
        <label className="ds-check ds-small" style={{ marginTop: 10 }}><input type="checkbox" checked={phase} onChange={e => setPhase(e.target.checked)} data-testid="composer-phase" />Start a new phase at this session</label>
        {phase && <input type="text" maxLength={60} placeholder="Phase name, e.g. PECS phase 2" value={label} onChange={e => setLabel(e.target.value)} style={{ borderTop: "1px solid var(--line)", marginTop: 8, paddingTop: 10 }} data-testid="composer-phase-label" />}
        <div className="ds-row" style={{ justifyContent: "flex-end", marginTop: 10 }}>
          <span className="ds-tiny ds-muted ds-grow"><Kbd>↵</Kbd> save · <Kbd>esc</Kbd> cancel</span>
          <Button size="sm" type="submit" variant="primary" testid="composer-save">Save</Button>
        </div>
      </form>
    </div>
  );
}
