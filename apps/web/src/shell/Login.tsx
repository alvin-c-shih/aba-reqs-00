import { useState } from "react";
import { Avatar, Button, Card, EnvBanner, Field, Icon, Input } from "@aba/design-system";
import { post } from "../lib/api";
import { useAuth, type Me } from "../lib/auth";

const WHAT: Record<string, string> = {
  system_admin: "Runs the platform: schools, health, audit",
  school_admin: "Manages sites, staff accounts and enrolment",
  bcba: "Designs programs, reads graphs, makes decisions",
  rbt: "Records session data on a phone, online or off",
  parent: "Sees shared progress, messages the team, counts at home",
  teacher: "Sees classroom goals, sends observations",
};

export function Login() {
  const { meta, setMe, notice } = useAuth();
  const [email, setEmail] = useState(""), [password, setPassword] = useState(""), [code, setCode] = useState(""), [needCode, setNeedCode] = useState(false);
  const [error, setError] = useState<string | null>(null), [busy, setBusy] = useState(false);
  const env = meta?.env ?? "prod", demo = env === "demo" && !!meta?.personas.length;

  const go = async (fn: () => Promise<Me>) => {
    setBusy(true); setError(null);
    try { setMe(await fn()); } catch (e: any) { if (e.data?.code === "totp_required") { setError(needCode ? e.message : null); setNeedCode(true); } else setError(e.message); } finally { setBusy(false); }
  };
  return (
    <div className="app">
      <EnvBanner env={env} />
      <div className="main">
        <div className="login">
          <div className={"login-box" + (demo ? "" : " solo")}>
            <div className="ds-stack lg">
              <div>
                <img src="/icon.svg" width={44} height={44} style={{ borderRadius: 11 }} alt="" />
                <h1 style={{ marginTop: 14 }}>ABA data collection<br />&amp; analysis</h1>
                <p className="ds-muted" style={{ marginTop: 6 }}>Record sessions anywhere. See what's working. Change course early.</p>
              </div>
              <Card pad="lg">
                <form className="ds-stack" onSubmit={e => { e.preventDefault(); go(() => post("/auth/login", { email, password, code })); }}>
                  <h2>Sign in</h2>
                  {notice && <div className="callout warn" data-testid="login-notice"><Icon name="clock" />{notice}</div>}
                  <Field label="Email"><Input type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} testid="login-email" /></Field>
                  <Field label="Password"><Input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} testid="login-password" /></Field>
                  {needCode && <Field label="6-digit code" hint="From your authenticator app, or a recovery code."><Input autoFocus inputMode="numeric" autoComplete="one-time-code" value={code} onChange={e => setCode(e.target.value)} testid="login-code" /></Field>}
                  {error && <div className="err" role="alert" data-testid="login-error">{error}</div>}
                  <Button type="submit" variant="primary" block disabled={busy} testid="login-submit">Sign in</Button>
                  <p className="ds-tiny ds-muted">Five failed attempts lock the account for 15 minutes. Accounts are created by your school admin.</p>
                </form>
              </Card>
            </div>
            {demo && (
              <div className="ds-stack" data-testid="personas">
                <div><div className="ds-eyebrow">Demo environment</div><h2 style={{ marginTop: 4 }}>Explore as…</h2>
                  <p className="ds-small ds-muted">One click, no password. All people and data are fictional. This shortcut exists only in Demo — the server refuses it everywhere else.</p></div>
                <div className="personas">
                  {meta!.personas.map(p => (
                    <button key={p.id} className="persona" disabled={busy} onClick={() => go(() => post("/auth/demo-login", { user_id: p.id }))} data-testid={`persona-${p.role}-${p.name.split(" ").pop()!.toLowerCase()}`}>
                      <Avatar name={p.name} size="lg" />
                      <span className="ds-grow">
                        <b>{p.name}</b> <span className="ds-small ds-muted">· {p.role_label}</span>
                        <span className="what" style={{ display: "block" }}>{p.school ?? "Platform"} — {WHAT[p.role]}</span>
                      </span>
                      <Icon name="arrowRight" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
