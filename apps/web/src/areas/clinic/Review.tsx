import { useState } from "react";
import { Badge, Button, Card, Dialog, EmptyState, Field, Icon, Textarea, useToast } from "@aba/design-system";
import { post } from "../../lib/api";
import { fmtDateTime, studentName, useData } from "../../lib/hooks";
import { PageHead, useShell } from "../../shell/Shell";
import { SessionDrawer } from "./SessionDrawer";

export function Review() {
  const { data, error, reload } = useData<any[]>("/clinic/review");
  const { refreshCounts } = useShell();
  const [view, setView] = useState<string | null>(null), [reject, setReject] = useState<any>(null), [note, setNote] = useState("");
  const toast = useToast();
  const decide = async (s: any, decision: "accepted" | "rejected", why = "") => {
    try { await post(`/clinic/review/${s.id}`, { decision, note: why }); setReject(null); setNote(""); reload(); refreshCounts();
      toast({ text: decision === "accepted" ? "Accepted — now counts in graphs" : "Excluded from graphs — the data is kept" }); }
    catch (e: any) { toast({ text: e.message, tone: "bad" }); }
  };
  const pending = (data ?? []).filter(s => s.review_state === "pending"), done = (data ?? []).filter(s => s.review_state !== "pending");
  return (
    <div className="page" style={{ maxWidth: 860 }}>
      <PageHead title="Review queue" sub="Sessions recorded without a confirmed lock — for example offline, or after someone else took over. Nothing is dropped; you decide what counts." />
      {error && <div className="err">{error}</div>}
      <div className="ds-stack">
        {pending.map(s => (
          <Card key={s.id} data-testid="review-item">
            <div className="ds-row between wrap">
              <div><h2>{studentName(s)} <span className="ds-muted" style={{ fontWeight: 400 }}>· {fmtDateTime(s.started_at)}</span></h2>
                <div className="ds-small ds-muted">Recorded by {s.recorder} · {s.observations} items · {(s.programs ?? []).join(", ")}</div></div>
              <Badge tone="warn" icon="clock">Waiting for you</Badge>
            </div>
            <div className="callout warn" style={{ margin: "12px 0" }}><Icon name="lock" /><span>{s.review_why}</span></div>
            <div className="ds-row" style={{ justifyContent: "flex-end" }}>
              <Button variant="ghost" onClick={() => setView(s.id)} testid="review-view">View data</Button>
              <Button variant="danger" onClick={() => setReject(s)} testid="review-reject">Exclude…</Button>
              <Button variant="primary" icon="check" onClick={() => decide(s, "accepted")} testid="review-accept">Accept</Button>
            </div>
          </Card>
        ))}
        {data && !pending.length && <Card><EmptyState icon="check" title="All caught up">Every session is either live or decided.</EmptyState></Card>}
        {done.length > 0 && <>
          <div className="ds-eyebrow" style={{ marginTop: 12 }}>Decided in the last 14 days</div>
          {done.map(s => (
            <Card key={s.id}><div className="ds-row between wrap">
              <div className="ds-small"><b>{studentName(s)}</b> · {fmtDateTime(s.started_at)} · {s.recorder}{s.review_note ? ` — “${s.review_note}”` : ""}</div>
              <span className="ds-row"><Badge tone={s.review_state === "accepted" ? "ok" : "bad"}>{s.review_state}</Badge><Button size="sm" variant="ghost" onClick={() => setView(s.id)}>View</Button></span>
            </div></Card>))}
        </>}
      </div>
      {view && <SessionDrawer sessionId={view} canEdit={false} onClose={() => setView(null)} />}
      {reject && (
        <Dialog title="Exclude this session from graphs?" onClose={() => setReject(null)}>
          <p className="ds-small ds-muted">The data is kept and this decision is logged. It won't appear in graphs or mastery checks.</p>
          <div style={{ marginTop: 12 }}><Field label="Reason"><Textarea autoFocus value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Duplicate of Marcus's session" data-testid="reject-note" /></Field></div>
          <div className="actions"><Button onClick={() => setReject(null)}>Cancel</Button><Button variant="danger" disabled={note.trim().length < 3} onClick={() => decide(reject, "rejected", note)} testid="reject-confirm">Exclude session</Button></div>
        </Dialog>
      )}
    </div>
  );
}
