import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Badge, Button, Dialog, Icon } from "@aba/design-system";
import { useAuth } from "../../lib/auth";
import { ago } from "../../lib/hooks";
import { online, pendingCount, setSimulateOffline, sync, useCollect } from "./store";

/* Always-visible answer to "is my data safe?" — and, on tap, the server's own receipt. */
export function SyncPill() {
  const st = useCollect();
  const { meta } = useAuth();
  const [open, setOpen] = useState(false), [slot, setSlot] = useState<HTMLElement | null>(null);
  useEffect(() => setSlot(document.getElementById("phone-bar-slot")), []);
  const pending = pendingCount(st), on = online();
  const cls = !on ? "offline" : pending ? "pending" : "";
  const label = !on ? (pending ? `Offline · ${pending} saved here` : "Offline") : pending ? `Syncing ${pending}…` : "All synced";
  const receipts = st.sessions.map(s => ({ s, r: st.receipts[s.id], local: st.obs.filter(o => o.session_id === s.id).length }))
    .sort((a, b) => +new Date(b.s.started_at) - +new Date(a.s.started_at)).slice(0, 5);
  const name = (id: string) => { const x = st.bundle?.students.find((q: any) => q.id === id); return x ? `${x.first_name} ${x.last_name[0]}.` : "Student"; };
  if (!slot) return null;
  return createPortal(<>
    <button className={`syncpill ${cls}`} onClick={() => setOpen(true)} data-tour="sync" data-testid="sync-pill" data-state={cls || "synced"}>
      <Icon name={on ? (pending ? "refresh" : "check") : "wifiOff"} size={14} />{label}
    </button>
    {open && (
      <Dialog title="Sync status" onClose={() => setOpen(false)} testid="sync-dialog">
        <div className="ds-stack">
          <div className="ds-row between"><span>Connection</span>{on ? <Badge tone="ok" icon="wifi">Online</Badge> : <Badge icon="wifiOff">Offline — recording still works</Badge>}</div>
          <div className="ds-row between"><span>Waiting on this device</span><b className="ds-num" data-testid="sync-pending">{pending}</b></div>
          <div className="ds-row between"><span>Last sync</span><span className="ds-muted">{ago(st.lastSync)}</span></div>
          {st.lastError && <div className="err">{st.lastError}</div>}
          {receipts.length > 0 && <>
            <hr className="ds-divider" /><div className="ds-eyebrow">Server receipts</div>
            {receipts.map(({ s, r, local }) => (
              <div key={s.id} className="ds-row between ds-small" data-testid="receipt">
                <span>{name(s.student_id)} · {new Date(s.started_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
                {r ? <span className="ds-row">{r.review_state === "pending" && <Badge tone="warn">in review</Badge>}
                  <Badge tone={r.stored >= local ? "ok" : "warn"} icon={r.stored >= local ? "check" : "refresh"}>Server confirmed {r.stored}/{local}</Badge></span>
                  : <Badge>not sent yet</Badge>}
              </div>))}
          </>}
          {meta?.env !== "prod" && <>
            <hr className="ds-divider" />
            <label className="ds-check"><input type="checkbox" checked={st.simulateOffline} onChange={e => setSimulateOffline(e.target.checked)} data-testid="simulate-offline" />
              <span>Simulate being offline <span className="ds-tiny ds-muted">(demo aid — not in Prod)</span></span></label>
          </>}
        </div>
        <div className="actions"><Button onClick={() => sync()} disabled={!on || !pending} testid="sync-now">Sync now</Button><Button variant="primary" onClick={() => setOpen(false)}>Done</Button></div>
      </Dialog>
    )}
  </>, slot);
}
