import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Avatar, Badge, Button, Card, EmptyState, Field, Icon, Input, PLAIN_TONE, Select, Sparkline, isPercent, useToast } from "@aba/design-system";
import { post } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { fmtDate, studentName, useData } from "../../lib/hooks";
import { PageHead, usePageTour } from "../../shell/Shell";
import { TOURS } from "../../shell/tours";
import { Thread } from "../shared/Thread";

/* Family and classroom portal. Plain language, only what the BCBA has chosen to share. */
export function Children() {
  const { me } = useAuth();
  const { data, error } = useData<any[]>("/family/children");
  const parent = me!.role === "parent";
  usePageTour(TOURS.family, !!data);
  return (
    <div className="page" style={{ maxWidth: 760 }}>
      <PageHead title={parent ? "Your family" : "Your students"} sub={parent ? "Progress shared by your child’s team, and a direct line to them." : "Goals your students are working on, and how to support them in class."} />
      {error && <div className="err">{error}</div>}
      <div className="ds-stack" data-tour="children">
        {data?.map(k => (
          <Link key={k.id} to={`/family/${k.id}`} className="ds-card click" data-testid={`child-${k.first_name}`}>
            <div className="ds-row" style={{ gap: 14 }}>
              <Avatar name={`${k.first_name} ${k.last_name}`} size="lg" />
              <div className="ds-grow"><h2>{parent ? `${k.first_name} ${k.last_name}` : studentName(k)}</h2>
                <div className="ds-small ds-muted">{k.site}{k.bcba ? ` · Behaviour analyst: ${k.bcba}` : ""}</div>
                {k.latest_summary && <div style={{ marginTop: 6 }}><Badge tone="accent" icon="file">{k.latest_summary.title} · {fmtDate(k.latest_summary.published_at)}</Badge></div>}</div>
              <Icon name="chevron" />
            </div>
          </Link>))}
      </div>
      {data && !data.length && <Card><EmptyState icon="heart" title="Nothing here yet">The school links you to a student. Ask the school office if you expected to see someone.</EmptyState></Card>}
    </div>
  );
}

export function Child() {
  const { id } = useParams();
  const { me } = useAuth();
  const { data, error, reload } = useData<any>(`/family/children/${id}`);
  const parent = me!.role === "parent";
  if (error) return <div className="page"><div className="err">{error}</div></div>;
  if (!data) return null;
  const s = data.student, latest = data.summaries?.[0];
  return (
    <div className="page" style={{ maxWidth: 860 }}>
      <PageHead crumbs={<><Link to="/family">{parent ? "Your family" : "Your students"}</Link> ›</>} title={parent ? s.first_name : studentName(s)}
        sub={data.bcba ? `Behaviour analyst: ${data.bcba.name}` : undefined} />
      <div className="ds-stack lg">
        {parent && latest && (
          <Card pad="lg" data-testid="summary">
            <div className="ds-eyebrow">{fmtDate(latest.published_at)} · from {latest.author}</div>
            <h2 style={{ margin: "4px 0 10px" }}>{latest.title}</h2>
            <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{latest.body}</div>
            {data.summaries.length > 1 && <details style={{ marginTop: 14 }}><summary className="ds-small" style={{ cursor: "pointer", color: "var(--accent)" }}>Earlier summaries ({data.summaries.length - 1})</summary>
              {data.summaries.slice(1).map((x: any) => <div key={x.id} style={{ marginTop: 12 }}><b>{x.title}</b> <span className="ds-muted ds-small">· {fmtDate(x.published_at)}</span><div className="ds-small" style={{ whiteSpace: "pre-wrap" }}>{x.body}</div></div>)}</details>}
          </Card>)}
        {parent && !latest && <Card><EmptyState icon="file" title="No summary yet">Your child’s behaviour analyst will share progress here.</EmptyState></Card>}

        <Card flush data-testid="goals">
          <div style={{ padding: "14px 16px" }}><h2>{parent ? `What ${s.first_name} is working on` : "Current goals"}</h2>
            <p className="ds-small ds-muted">{parent ? "The dashed line is the goal. Ask the team if you would like to know more about any of these." : "Status in plain words, with how to support each goal in class."}</p></div>
          {data.goals.map((g: any) => (
            <div key={g.id} className="ds-row" style={{ padding: "12px 16px", borderTop: "1px solid var(--line)", gap: 14, alignItems: "flex-start" }}>
              <div className="ds-grow"><b>{g.name}</b>{!parent && g.domain && <span className="ds-muted ds-small"> · {g.domain}</span>}
                {g.support && <div className="ds-small ds-muted" style={{ marginTop: 2 }}>{g.support}</div>}
                {g.sessions > 0 && <div className="ds-small ds-muted" style={{ marginTop: 2 }} data-testid="goal-direction">
                  Counted: {g.measure} · {g.better} is better{g.sessions > 1 && <> · from <b>{g.first_text}</b> to <b>{g.last_text}</b></>} · goal {g.target_text}
                  {g.trend && <> · <b style={{ color: g.trend === "Moving toward the goal" ? "var(--ok)" : g.trend === "Moving away from the goal" ? "var(--warn)" : undefined }}>{g.trend.toLowerCase()}</b></>}</div>}</div>
              <span className="ds-muted"><Sparkline values={g.values} criterion={g.criterion} max={isPercent(g.kind) ? 100 : undefined} width={84} /></span>
              <span style={{ width: 150, display: "flex", justifyContent: "flex-end" }}><Badge tone={PLAIN_TONE[g.plain]}>{g.plain}</Badge></span>
            </div>))}
          {!data.goals.length && <div className="ds-small ds-muted" style={{ padding: "0 16px 14px" }}>No goals have been set up yet.</div>}
        </Card>

        {parent && data.home.length > 0 && <HomeData studentId={id!} programs={data.home} name={s.first_name} onDone={reload} />}

        <Card>
          <h2 style={{ marginBottom: 2 }}>{parent ? `Messages with ${s.first_name}’s team` : "Notes to the behaviour analyst"}</h2>
          <p className="ds-small ds-muted" style={{ marginBottom: 12 }}>{parent ? "Goes to the behaviour analyst. Not for emergencies — call the school office." : "Share what you see in class. Only the behaviour analyst reads this thread."}</p>
          <Thread messages={data.messages} sendTo={`/family/children/${id}/messages`} onSent={reload} placeholder={parent ? "Write a message…" : "What did you notice?"} />
        </Card>
      </div>
    </div>
  );
}

function HomeData({ studentId, programs, name, onDone }: { studentId: string; programs: any[]; name: string; onDone: () => void }) {
  const [pid, setPid] = useState(programs[0].id), [count, setCount] = useState(0), [note, setNote] = useState("");
  const toast = useToast();
  const p = programs.find(x => x.id === pid);
  const submit = async () => {
    try { await post(`/family/children/${studentId}/home`, { program_id: pid, count, note }); setCount(0); setNote(""); onDone(); toast({ text: "Sent — thank you. The team reviews it before it is added." }); }
    catch (e: any) { toast({ text: e.message, tone: "bad" }); }
  };
  return (
    <Card data-testid="home-data">
      <h2>Count at home</h2>
      <p className="ds-small ds-muted" style={{ marginBottom: 12 }}>{name}’s team asked if you could count this at home. They review what you send before adding it.</p>
      <div className="ds-stack">
        {programs.length > 1 && <Select value={pid} onChange={e => setPid(e.target.value)}>{programs.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</Select>}
        <div><b>{p.name}</b><div className="ds-small ds-muted">{p.instruction}</div></div>
        <div className="ds-row" style={{ gap: 14 }}>
          <Button size="lg" icon="minus" aria-label="One fewer" onClick={() => setCount(Math.max(0, count - 1))} />
          <span className="bigcount" style={{ fontSize: 56, minWidth: 80, textAlign: "center" }} data-testid="home-count">{count}</span>
          <Button size="lg" variant="primary" icon="plus" aria-label="One more" onClick={() => setCount(count + 1)} testid="home-plus" />
          <span className="ds-small ds-muted">times today</span>
        </div>
        <Field label="Anything the team should know? (optional)"><Input value={note} onChange={e => setNote(e.target.value)} maxLength={500} testid="home-note" /></Field>
        <div><Button variant="primary" onClick={submit} testid="home-send">Send to the team</Button></div>
      </div>
    </Card>
  );
}
