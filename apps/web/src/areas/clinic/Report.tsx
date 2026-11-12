import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge, Button, Card, FlagBadge, Field, Icon, Input, KIND_LABEL, Segmented, SessionChart, Textarea, formatValue, useToast } from "@aba/design-system";
import { del, post } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { fmtDate, studentName, useData } from "../../lib/hooks";
import { PageHead } from "../../shell/Shell";

/* Progress report: printable (File → Print → Save as PDF), built from the same facts as the caseload.
   At the top (not printed), the BCBA writes — or drafts with the local model — the plain-language summary shared with the family. */
export function Report() {
  const { id } = useParams();
  const { me } = useAuth();
  const [days, setDays] = useState("30");
  const { data, error, reload } = useData<any>(`/reports/students/${id}/progress?days=${days}`);
  const [title, setTitle] = useState(""), [body, setBody] = useState(""), [drafting, setDrafting] = useState(false), [model, setModel] = useState<string | null>(null);
  const toast = useToast();
  useEffect(() => { if (data && !title) setTitle(`${new Date().toLocaleDateString([], { month: "long" })} progress`); }, [data]);  // eslint-disable-line
  if (error) return <div className="page"><div className="err">{error}</div></div>;
  if (!data) return null;
  const s = data.student;
  const draft = async () => {
    setDrafting(true);
    try { const r = await post(`/clinic/students/${id}/ai/summary`, { days: +days }); setBody(r.text); setModel(r.model); }
    catch (e: any) { toast({ text: e.message, tone: "bad" }); } finally { setDrafting(false); }
  };
  const publish = async () => {
    try { await post(`/reports/students/${id}/summaries`, { title, body, days: +days }); setBody(""); setModel(null); reload(); toast({ text: `Shared with ${s.first_name}’s family` }); }
    catch (e: any) { toast({ text: e.message, tone: "bad" }); }
  };
  const withdraw = async (x: any) => { await del(`/reports/summaries/${x.id}`); reload(); toast({ text: "Summary withdrawn — the family no longer sees it" }); };
  return (
    <div className="page report">
      <PageHead crumbs={<span className="no-print"><Link to="/clinic">Caseload</Link> › <Link to={`/clinic/students/${id}`}>{studentName(s)}</Link> ›</span>}
        title={`Progress report — ${s.first_name} ${s.last_name}`} sub={`${fmtDate(data.from)} to ${fmtDate(data.to)} · ${data.school} · prepared by ${data.bcba}`}>
        <span className="no-print ds-row">
          <Segmented value={days} onChange={setDays} testid="report-days" options={[{ value: "30", label: "30 days" }, { value: "90", label: "90 days" }, { value: "180", label: "6 months" }]} />
          <a className="ds-btn" href={`/api/v1/reports/students/${id}/export.csv`} download data-testid="export-csv"><Icon name="download" size={16} />Data (CSV)</a>
          <Button variant="primary" icon="print" onClick={() => window.print()} testid="report-print">Print / PDF</Button>
        </span>
      </PageHead>
      <div className="ds-stack lg">
        <Card><div className="ds-row wrap" style={{ gap: 40 }}>
          <div><div className="ds-eyebrow">Sessions</div><b style={{ fontSize: 22 }}>{data.sessions}</b></div>
          <div><div className="ds-eyebrow">Hours of service</div><b style={{ fontSize: 22 }}>{(data.minutes / 60).toFixed(1)}</b></div>
          <div><div className="ds-eyebrow">Programs</div><b style={{ fontSize: 22 }}>{data.programs.length}</b></div>
          <div><div className="ds-eyebrow">Goals met</div><b style={{ fontSize: 22 }}>{data.programs.filter((p: any) => p.flag === "mastered").length}</b></div>
        </div></Card>
        <Card className="no-print" data-testid="family-summary">
          <h2>Share a summary with the family</h2>
          <p className="ds-small ds-muted" style={{ marginBottom: 12 }}>Parents see this text and a plain-language goal list — never sessions, staff names or clinical notes. Nothing is shared until you publish. The graphs below are for you; they are not sent.</p>
          <div className="ds-stack">
            <Field label="Title"><Input value={title} onChange={e => setTitle(e.target.value)} testid="summary-title" /></Field>
            <Field label="Summary" hint={model ? `Draft written on this machine by ${model.split("/").pop()!.split(":")[0]}. Read and edit it before sharing — you are the author.` : "Write in plain language: what went well, what is hard, what comes next."}>
              <Textarea style={{ minHeight: 140 }} value={body} onChange={e => { setBody(e.target.value); }} testid="summary-body" /></Field>
            <div className="ds-row wrap">
              {me!.features?.ai && <Button icon="sparkle" onClick={draft} disabled={drafting} testid="summary-draft">{drafting ? "Drafting on this machine…" : "Draft with the local model"}</Button>}
              <span className="ds-grow" />
              <Button variant="primary" disabled={body.trim().length < 10 || title.trim().length < 3} onClick={publish} testid="summary-publish">Publish to family</Button>
            </div>
          </div>
          {data.summaries.length > 0 && <div style={{ marginTop: 16 }}><div className="ds-eyebrow">Already shared</div>
            {data.summaries.map((x: any) => (
              <div key={x.id} className="ds-row" style={{ padding: "8px 0", borderTop: "1px solid var(--line)" }}>
                <span className="ds-grow ds-small"><b>{x.title}</b> · {fmtDate(x.published_at)}</span>
                {x.withdrawn_at ? <Badge>withdrawn</Badge> : <Button size="sm" variant="ghost" onClick={() => withdraw(x)}>Withdraw</Button>}
              </div>))}</div>}
        </Card>
        {data.programs.map((p: any) => (
          <Card key={p.id} className="avoid-break" data-testid="report-program">
            <div className="ds-row between wrap"><div><h2>{p.name}</h2><div className="ds-small ds-muted">{KIND_LABEL[p.kind]} · {p.domain || "—"} · goal: {p.goal} to {p.criterion_text}</div></div><FlagBadge flag={p.flag} /></div>
            <p className="ds-small" style={{ margin: "8px 0" }}>
              {p.sessions ? <>Over {p.sessions} session{p.sessions === 1 ? "" : "s"}: from <b>{p.first_text}</b> to <b>{p.last_text}</b>. {p.why}.{p.forecast ? ` ${p.forecast}` : ""}</> : "No sessions in this period."}
            </p>
            {p.points.length > 1 && <SessionChart kind={p.kind} goal={p.goal} criterion={p.criterion} points={p.points} phases={p.phases} notes={[]} height={190} />}
            {p.notes.length > 0 && <ul className="ds-small" style={{ margin: "6px 0 0", paddingLeft: 18 }}>{p.notes.map((n: any, i: number) => <li key={i}><span className="ds-muted">{fmtDate(n.at)}</span> — {n.body}</li>)}</ul>}
          </Card>))}
      </div>
    </div>
  );
}
