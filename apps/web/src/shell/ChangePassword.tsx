import { useState } from "react";
import { Button, Card, EnvBanner, Field, Input } from "@aba/design-system";
import { post } from "../lib/api";
import { useAuth } from "../lib/auth";

export function ChangePassword() {
  const { meta, me, signOut } = useAuth();
  const [current, setCurrent] = useState(""), [next, setNext] = useState(""), [error, setError] = useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    try { await post("/auth/password", { current, new: next }); await signOut("Password changed. Sign in with your new password."); }
    catch (err: any) { setError(err.message); }
  };
  return (
    <div className="app">
      <EnvBanner env={meta?.env ?? "prod"} role={me?.role_label} school={me?.school?.name} />
      <div className="main"><div className="login"><div className="login-box solo">
        <Card pad="lg">
          <form className="ds-stack" onSubmit={submit}>
            <h2>Choose your own password</h2>
            <p className="ds-small ds-muted">Welcome, {me?.name}. Your temporary password works once — set a new one to continue.</p>
            <Field label="Temporary password"><Input type="password" required value={current} onChange={e => setCurrent(e.target.value)} testid="pw-current" /></Field>
            <Field label="New password" hint="At least 12 characters. A short phrase works well."><Input type="password" required value={next} onChange={e => setNext(e.target.value)} testid="pw-new" /></Field>
            {error && <div className="err" role="alert">{error}</div>}
            <Button type="submit" variant="primary" block testid="pw-submit">Save and continue</Button>
            <Button variant="ghost" block onClick={() => signOut()}>Sign out</Button>
          </form>
        </Card>
      </div></div></div>
    </div>
  );
}
