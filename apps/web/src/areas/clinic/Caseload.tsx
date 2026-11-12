import { useMemo, useState } from "react";
import { Button, Dialog, Input } from "@aba/design-system";
import { post } from "../../lib/api";
import { Link } from "react-router-dom";
import { Avatar, Card, EmptyState, FLAGS, FlagBadge, Icon, KIND_ICON, SignalBadge, Sparkline, formatValue, isPercent, type Flag } from "@aba/design-system";
import { useAuth } from "../../lib/auth";
import { ago, studentName, useData } from "../../lib/hooks";
import { PageHead, usePageTour } from "../../shell/Shell";
import { TOURS } from "../../shell/tours";

const ATTENTION: Flag[] = ["regression", "no_progress", "variable", "mastered", "stale"];
const TONE_VAR: Record<string, string> = { ok: "var(--ok)", warn: "var(--warn)", bad: "var(--bad)", info: "var(--info)", violet: "var(--violet)", neutral: "var(--slate)", accent: "var(--accent)" };

export function Caseload() {
  const { me } = useAuth();
  const { data, error } = useData<any>("/clinic/caseload");
  const [filter, setFilter] = useState<Flag | null>(null), [asking, setAsking] = useState(false);
  usePageTour(TOURS.caseload, !!data);
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    data?.students.forEach((s: any) => s.programs.forEach((p: any) => { c[flagOf(p)] = (c[flagOf(p)] ?? 0) + 1; }));
    return c;
  }, [data]);
  const students = (data?.students ?? []).map((s: any) => ({ ...s, shown: s.programs.filter((p: any) => !filter || flagOf(p) === filter) })).filter((s: any) => s.shown.length || !filter);
  const hour = new Date().getHours();
  return (
    <div className="page">
      <PageHead title={`Good ${hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening"}, ${/^Dr\.?\s/.test(me!.name) ? `Dr. ${me!.name.split(" ").pop()}` : me!.name.split(" ")[0]}`}
        sub={data ? `${data.students.length} students · ${data.students.reduce((a: number, s: any) => a + s.programs.length, 0)} programs` : " "}>
        {me!.features?.ai && <Button icon="sparkle" onClick={() => setAsking(true)} testid="ask-open">Ask about your caseload</Button>}
      </PageHead>
      {asking && <Ask onClose={() => setAsking(false)} />}
      {error && <div className="err">{error}</div>}
      {data && (
        <div className="ds-row wrap" style={{ marginBottom: 20, gap: 10 }} data-tour="attention" data-testid="attention">
          {ATTENTION.filter(f => counts[f]).map(f => (
            <button key={f} className="chip" aria-pressed={filter === f} onClick={() => setFilter(filter === f ? null : f)} data-testid={`filter-${f}`}
              style={{ height: 34, padding: "0 12px", display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <span style={{ color: TONE_VAR[FLAGS[f].tone], display: "inline-flex" }}><Icon name={FLAGS[f].icon} size={15} /></span>
              <b className="ds-num">{counts[f]}</b> {FLAGS[f].label.toLowerCase()}
            </button>
          ))}
          {filter && <button className="chip" onClick={() => setFilter(null)} style={{ height: 34 }}>Show all</button>}
        </div>
      )}
      <div className="ds-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(440px, 1fr))" }}>
        {students.map((s: any, i: number) => (
          <Card key={s.id} flush data-tour={i === 0 ? "student-card" : undefined} data-testid={`student-card-${s.first_name}`}>
            <Link to={`/clinic/students/${s.id}`} className="ds-row" style={{ padding: "14px 16px", color: "inherit", textDecoration: "none" }}>
              <Avatar name={`${s.first_name} ${s.last_name}`} />
              <div className="ds-grow"><h2>{studentName(s)}</h2>
                <div className="ds-tiny ds-muted ds-truncate">{s.site} · {s.rbts.join(", ") || "no RBT assigned"} · last session {ago(s.last_session_at)}</div></div>
              <Icon name="chevron" />
            </Link>
            {s.shown.map((p: any) => <ProgramRow key={p.id} p={p} />)}
            {!s.programs.length && <div className="ds-small ds-muted" style={{ padding: "0 16px 14px" }}>No programs yet — open the student to add one.</div>}
          </Card>
        ))}
      </div>
      {data && !data.students.length && <EmptyState icon="users" title="No students on your caseload yet">Your school admin assigns you as a student's supervising BCBA.</EmptyState>}
    </div>
  );
}

/** Plain-language question answered by the model running on this machine, from the same facts as this page. */
function Ask({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState(""), [a, setA] = useState<{ text: string; model: string } | null>(null), [busy, setBusy] = useState(false), [err, setErr] = useState<string | null>(null);
  const ask = async (question = q) => { setQ(question); setBusy(true); setErr(null); setA(null);
    try { setA(await post("/clinic/ai/ask", { question })); } catch (e: any) { setErr(e.message); } finally { setBusy(false); } };
  return (
    <Dialog title="Ask about your caseload" onClose={onClose} wide testid="ask-dialog">
      <form className="ds-row" onSubmit={e => { e.preventDefault(); ask(); }}>
        <Input autoFocus placeholder="e.g. Which programs should I look at first this week?" value={q} onChange={e => setQ(e.target.value)} testid="ask-input" />
        <Button type="submit" variant="primary" disabled={busy || q.trim().length < 3} testid="ask-send">{busy ? "Thinking…" : "Ask"}</Button>
      </form>
      {!a && !busy && <div className="chips" style={{ marginTop: 10 }}>{["Which programs need a decision this week?", "Who is closest to meeting a goal?", "Where is data missing?"].map(x => <button key={x} className="chip" onClick={() => ask(x)}>{x}</button>)}</div>}
      {err && <div className="err" style={{ marginTop: 12 }}>{err}</div>}
      {busy && <p className="ds-small ds-muted" style={{ marginTop: 12 }}>Running on this machine — this can take a few seconds.</p>}
      {a && <div style={{ marginTop: 14 }} data-testid="ask-answer"><div style={{ whiteSpace: "pre-wrap", lineHeight: 1.55 }}>{a.text}</div>
        <p className="ds-tiny ds-muted" style={{ marginTop: 10 }}>Drafted on this machine by {a.model} from the statuses on this page. It can be wrong — check the graphs before acting.</p></div>}
      <div className="actions"><Button onClick={onClose}>Close</Button></div>
    </Dialog>
  );
}

export const flagOf = (p: any): Flag => ((p.summary ?? p).flag ?? "no_data") as Flag;

export function ProgramRow({ p }: { p: any }) {
  const sum = p.summary ?? p, flag = flagOf(p);
  const tone = TONE_VAR[FLAGS[flag]?.tone ?? "neutral"];
  return (
    <Link to={`/clinic/programs/${p.id}`} className="ds-row" data-testid={`program-row-${p.id}`}
      style={{ padding: "10px 16px", borderTop: "1px solid var(--line)", color: "inherit", textDecoration: "none", gap: 12 }}>
      <span className="ds-muted" title={p.kind}><Icon name={KIND_ICON[p.kind]} size={16} /></span>
      <div className="ds-grow"><div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.3 }}>{p.name}</div>
        <div className="ds-tiny ds-muted ds-truncate">{sum.why}</div>
        {sum.signals?.length > 0 && <div className="ds-row wrap" style={{ gap: 4, marginTop: 4 }}>{sum.signals.map((s: any, i: number) => <SignalBadge key={i} kind={s.kind} title={s.text} />)}</div>}</div>
      <span style={{ color: tone }}><Sparkline width={84} values={sum.spark} criterion={p.criterion ?? p.mastery?.value} max={isPercent(p.kind) ? 100 : undefined} /></span>
      <span className="ds-num" style={{ width: 58, textAlign: "right", fontWeight: 650, fontSize: 14 }}>{formatValue(p.kind, sum.last)}</span>
      <span style={{ width: 126, display: "flex", justifyContent: "flex-end" }}><FlagBadge flag={flag} /></span>
    </Link>
  );
}
