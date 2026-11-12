import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Button, Dialog, Field, Icon, Input, Menu, useToast } from "@aba/design-system";
import { get, post } from "../lib/api";
import { useAuth } from "../lib/auth";
import { ago } from "../lib/hooks";

/** Notification bell: in-app only (no email or SMS leaves the system). */
export function Bell() {
  const [data, setData] = useState<{ items: any[]; unread: number }>({ items: [], unread: 0 });
  const nav = useNavigate();
  const load = () => get("/me/notifications").then(setData).catch(() => {});
  useEffect(() => { load(); const t = setInterval(load, 60_000); return () => clearInterval(t); }, []);
  return (
    <Menu trigger={open => (
      <span style={{ position: "relative" }} data-tour="bell">
        <Button variant="ghost" icon="bell" aria-label={`Notifications, ${data.unread} unread`} testid="bell" onClick={() => { open(); if (data.unread) post("/me/notifications/read").then(() => setTimeout(load, 1500)); }} />
        {data.unread > 0 && <span data-testid="bell-count" style={{ position: "absolute", top: 2, right: 2, pointerEvents: "none", minWidth: 16, height: 16, borderRadius: 8, background: "var(--bad)", color: "#fff", fontSize: 10, fontWeight: 700, display: "grid", placeItems: "center", padding: "0 4px" }}>{data.unread}</span>}
      </span>)}>
      {close => <div style={{ width: 320 }} data-testid="notifications">
        <div className="head"><b>Notifications</b></div>
        {data.items.map(n => (
          <button key={n.id} onClick={() => { close(); if (n.link) nav(n.link); }} style={{ alignItems: "flex-start" }}>
            <span style={{ color: n.read_at ? "var(--muted)" : "var(--accent)", marginTop: 2 }}><Icon name={n.kind === "message" ? "chat" : n.kind === "summary" ? "file" : "inbox"} size={16} /></span>
            <span><span style={{ fontWeight: n.read_at ? 400 : 650 }}>{n.text}</span><span className="ds-tiny ds-muted" style={{ display: "block" }}>{ago(n.created_at)}</span></span>
          </button>))}
        {!data.items.length && <div className="head ds-small ds-muted">Nothing yet. Messages, reviews and shared summaries appear here.</div>}
      </div>}
    </Menu>
  );
}

/** Two-factor sign-in with any authenticator app (time-based codes). */
export function SecurityDialog({ onClose }: { onClose: () => void }) {
  const { me, refresh } = useAuth();
  const [setup, setSetup] = useState<{ secret: string; uri: string } | null>(null);
  const [code, setCode] = useState(""), [codes, setCodes] = useState<string[] | null>(null), [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const run = async (fn: () => Promise<void>) => { setError(null); try { await fn(); } catch (e: any) { setError(e.message); } };
  const start = () => run(async () => setSetup(await post("/auth/2fa/setup")));
  const enable = () => run(async () => { setCodes((await post("/auth/2fa/enable", { code })).recovery_codes); setCode(""); await refresh(); });
  const disable = () => run(async () => { await post("/auth/2fa/disable", { code }); await refresh(); toast({ text: "Two-factor sign-in is off" }); onClose(); });
  return (
    <Dialog title="Sign-in security" onClose={onClose} testid="security-dialog">
      {codes ? <>
        <p><Badge tone="ok" icon="check">Two-factor sign-in is on</Badge></p>
        <p className="ds-small" style={{ margin: "10px 0" }}>Keep these recovery codes somewhere safe. Each works once if you lose your phone. They are not shown again.</p>
        <div className="ds-mono" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, padding: 12, background: "var(--surface-2)", borderRadius: 10, border: "1px dashed var(--line-strong)" }} data-testid="recovery-codes">{codes.map(c => <span key={c}>{c}</span>)}</div>
        <div className="actions"><Button variant="primary" onClick={onClose}>I have saved them</Button></div>
      </> : me!.two_factor ? <>
        <p><Badge tone="ok" icon="check">Two-factor sign-in is on</Badge></p>
        <p className="ds-small ds-muted" style={{ margin: "10px 0" }}>To turn it off, enter a current code from your authenticator app.</p>
        <Field label="6-digit code" error={error}><Input inputMode="numeric" value={code} onChange={e => setCode(e.target.value)} testid="totp-code" /></Field>
        <div className="actions"><Button onClick={onClose}>Close</Button><Button variant="danger" disabled={code.length < 6} onClick={disable}>Turn off</Button></div>
      </> : setup ? <>
        <p className="ds-small">In your authenticator app choose “enter a setup key”, then type this key (account: {me!.email}):</p>
        <div className="ds-mono" style={{ margin: "10px 0", padding: 12, background: "var(--surface-2)", borderRadius: 10, border: "1px dashed var(--line-strong)", letterSpacing: ".08em", wordBreak: "break-all" }} data-testid="totp-secret">{setup.secret.match(/.{1,4}/g)!.join(" ")}</div>
        <Field label="Then enter the 6-digit code it shows" error={error}><Input inputMode="numeric" autoFocus value={code} onChange={e => setCode(e.target.value)} testid="totp-code" /></Field>
        <div className="actions"><Button onClick={onClose}>Cancel</Button><Button variant="primary" disabled={code.length < 6} onClick={enable} testid="totp-enable">Turn on</Button></div>
      </> : <>
        <p>Add a second step when you sign in: a 6-digit code from an authenticator app on your phone.</p>
        <p className="ds-small ds-muted" style={{ marginTop: 8 }}>Recommended for everyone who can see student records. Works with any standard authenticator app; nothing is sent by text message.</p>
        {error && <div className="err">{error}</div>}
        <div className="actions"><Button onClick={onClose}>Not now</Button><Button variant="primary" onClick={start} testid="totp-start">Set up</Button></div>
      </>}
    </Dialog>
  );
}
