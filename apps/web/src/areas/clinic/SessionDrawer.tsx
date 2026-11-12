import { useState } from "react";
import { Badge, Button, Drawer, Input, OUTCOMES, OutcomeDot, formatValue, useToast, type Outcome } from "@aba/design-system";
import { post } from "../../lib/api";
import { fmtDateTime, useData } from "../../lib/hooks";

/* Every recorded item of one session. A BCBA can correct or void an item; the original stays
   in the record with the reason (history is never rewritten). */
export function SessionDrawer({ sessionId, programId, canEdit, onClose, onChanged }: { sessionId: string; programId?: string; canEdit: boolean; onClose: () => void; onChanged?: () => void }) {
  const { data, reload } = useData<any>(`/clinic/sessions/${sessionId}${programId ? `?program_id=${programId}` : ""}`);
  const [open, setOpen] = useState<string | null>(null), [reason, setReason] = useState("");
  const toast = useToast();
  const fix = async (o: any, outcome: Outcome | null) => {
    try { await post(`/clinic/observations/${o.id}/correct`, { outcome, reason }); setOpen(null); setReason(""); reload(); onChanged?.(); toast({ text: outcome ? "Corrected — original kept in history" : "Voided — kept in history" }); }
    catch (e: any) { toast({ text: e.message, tone: "bad" }); }
  };
  const s = data?.session;
  return (
    <Drawer title="Session detail" onClose={onClose} testid="session-drawer">
      {s && <>
        <div className="ds-small ds-muted" style={{ marginBottom: 12 }}>{fmtDateTime(s.started_at)} · recorded by {s.recorder} · {s.setting}
          {s.review_state !== "live" && <> · <Badge tone={s.review_state === "pending" ? "warn" : s.review_state === "accepted" ? "ok" : "bad"}>{s.review_state}</Badge></>}</div>
        {s.review_why && <div className="callout warn" style={{ marginBottom: 12 }}>{s.review_why}</div>}
        <div className="ds-stack" style={{ gap: 0 }}>
          {data.observations.map((o: any, i: number) => (
            <div key={o.id} style={{ borderTop: i ? "1px solid var(--line)" : 0, padding: "8px 0", opacity: o.voided ? 0.55 : 1 }} data-testid="obs-row">
              <div className="ds-row">
                {o.kind === "trial" || o.kind === "step" ? <OutcomeDot outcome={o.outcome} voided={o.voided} />
                  : <Badge tone={o.kind === "interval" && o.hit ? "bad" : "neutral"}>{o.kind === "event" ? "count" : o.kind === "interval" ? (o.hit ? "yes" : "no") : o.kind === "abc" ? "ABC" : formatValue("duration", o.seconds)}</Badge>}
                <span className="ds-grow ds-small" style={{ textDecoration: o.voided ? "line-through" : undefined }}>
                  {o.kind === "trial" || o.kind === "step" ? OUTCOMES[o.outcome as Outcome].label : o.kind === "event" ? "Occurrence" : o.kind === "interval" ? "Interval"
                    : o.kind === "abc" ? `${o.data?.antecedent} → ${o.data?.consequence}${o.data?.note ? ` — ${o.data.note}` : ""}` : "Timed"}{o.target ? ` · ${o.target}` : ""}
                  {o.corrects && <Badge tone="accent">correction</Badge>}
                </span>
                <span className="ds-tiny ds-muted ds-num">{new Date(o.recorded_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
                {canEdit && !o.voided && <Button size="sm" variant="ghost" onClick={() => { setOpen(open === o.id ? null : o.id); setReason(""); }} testid="obs-fix">Fix</Button>}
              </div>
              {(o.voided || o.corrects) && <div className="ds-tiny ds-muted" style={{ marginLeft: 30 }}>{o.voided ? `Voided by ${o.voided_by}: ${o.void_reason}` : o.reason}</div>}
              {open === o.id && (
                <div className="ds-stack" style={{ margin: "8px 0 4px 30px", gap: 8 }}>
                  <Input autoFocus placeholder="Reason (required)" value={reason} onChange={e => setReason(e.target.value)} testid="fix-reason" />
                  <div className="ds-row wrap">
                    {(o.kind === "trial" || o.kind === "step") && (Object.keys(OUTCOMES) as Outcome[]).filter(k => k !== o.outcome).map(k => (
                      <Button key={k} size="sm" disabled={reason.trim().length < 3} onClick={() => fix(o, k)} testid={`fix-${k}`}>→ {OUTCOMES[k].label}</Button>))}
                    <Button size="sm" variant="danger" disabled={reason.trim().length < 3} onClick={() => fix(o, null)} testid="fix-void">Void</Button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {!data.observations.length && <p className="ds-small ds-muted">Nothing recorded for this program in the session.</p>}
        </div>
      </>}
    </Drawer>
  );
}
