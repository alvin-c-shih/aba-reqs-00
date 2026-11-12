import { useState } from "react";
import { Avatar, Badge, Button, Card, Dialog, Field, Input, Menu, ROLE_LABEL, Select, useToast } from "@aba/design-system";
import { patch, post } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { ago, useData } from "../../lib/hooks";
import { PageHead } from "../../shell/Shell";
import { InviteContact } from "./SchoolExtras";

export function People() {
  const { me } = useAuth();
  const { data, error, reload } = useData<any[]>("/school/users");
  const [adding, setAdding] = useState(false), [inviting, setInviting] = useState(false);
  const [temp, setTemp] = useState<{ email: string; temp: string } | null>(null);
  const toast = useToast();
  const setStatus = async (u: any, status: string) => {
    try {
      await patch(`/school/users/${u.id}`, { status }); reload();
      toast({ text: `${u.name} ${status === "active" ? "reactivated" : "deactivated — access ends immediately"}`,
        action: { label: "Undo", run: () => patch(`/school/users/${u.id}`, { status: u.status }).then(reload) } });
    } catch (e: any) { toast({ text: e.message, tone: "bad" }); }
  };
  const resetPw = async (u: any) => { const r = await post(`/school/users/${u.id}/reset-password`); setTemp({ email: u.email, temp: r.temp_password }); reload(); };
  return (
    <div className="page">
      <PageHead title="People" sub="Staff accounts at your sites. Deactivating keeps history and ends access immediately.">
        <Button icon="heart" onClick={() => setInviting(true)} testid="invite-contact">Invite parent or teacher</Button>
        <Button variant="primary" icon="plus" onClick={() => setAdding(true)} testid="add-user">Add staff</Button>
      </PageHead>
      {error && <div className="err">{error}</div>}
      <Card flush>
        <div className="ds-table-wrap">
          <table className="ds-table" data-testid="users-table">
            <thead><tr><th>Name</th><th>Role</th><th>Sites</th><th>Last sign-in</th><th>Status</th><th /></tr></thead>
            <tbody>{data?.map(u => (
              <tr key={u.id} data-testid={`user-${u.email}`}>
                <td><div className="ds-row"><Avatar name={u.name} size="sm" /><div><b>{u.name}</b><div className="ds-tiny ds-muted">{u.email}</div></div></div></td>
                <td>{ROLE_LABEL[u.role]}</td>
                <td className="ds-small">{u.sites.map((s: any) => s.name).join(", ")}</td>
                <td className="ds-small ds-muted">{ago(u.last_login_at)}</td>
                <td>{u.status !== "active" ? <Badge>Deactivated</Badge> : u.locked ? <Badge tone="bad" icon="lock">Locked</Badge>
                  : u.must_change_password ? <Badge tone="warn">Temp password</Badge> : <Badge tone="ok" icon="check">Active</Badge>}</td>
                <td style={{ textAlign: "right" }}>
                  <Menu trigger={open => <Button size="sm" variant="ghost" onClick={open} aria-label={`Actions for ${u.name}`} testid={`user-actions-${u.email}`}>•••</Button>}>
                    {close => <>
                      <button onClick={() => { close(); resetPw(u); }}>Reset password{u.locked ? " & unlock" : ""}</button>
                      {u.id !== me!.id && <button onClick={() => { close(); setStatus(u, u.status === "active" ? "deactivated" : "active"); }}>{u.status === "active" ? "Deactivate" : "Reactivate"}</button>}
                    </>}
                  </Menu>
                </td>
              </tr>))}</tbody>
          </table>
        </div>
      </Card>
      {adding && <AddUser onClose={() => setAdding(false)} onDone={t => { setAdding(false); setTemp(t); reload(); }} />}
      {inviting && <InviteContact onClose={() => setInviting(false)} onDone={t => { setInviting(false); setTemp(t); reload(); }} />}
      {temp && <TempPassword who={temp.email} temp={temp.temp} onClose={() => setTemp(null)} />}
    </div>
  );
}

function AddUser({ onClose, onDone }: { onClose: () => void; onDone: (t: { email: string; temp: string }) => void }) {
  const { me } = useAuth();
  const [f, setF] = useState({ name: "", email: "", role: "rbt", site_ids: me!.sites.slice(0, 1).map(s => s.id) });
  const [error, setError] = useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    try { const r = await post("/school/users", f); onDone({ email: f.email, temp: r.temp_password }); } catch (x: any) { setError(x.message); }
  };
  return (
    <Dialog title="Add a person" onClose={onClose} testid="user-dialog">
      <form className="ds-stack" onSubmit={submit}>
        <Field label="Full name"><Input required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} testid="user-name" /></Field>
        <Field label="Work email"><Input required type="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} testid="user-email" /></Field>
        <Field label="Role" hint={f.role === "rbt" ? "Records session data for assigned students." : f.role === "bcba" ? "Designs programs and reviews data for their students." : "Manages people and enrolment at their sites."}>
          <Select value={f.role} onChange={e => setF({ ...f, role: e.target.value })} testid="user-role">
            <option value="rbt">RBT</option><option value="bcba">BCBA</option><option value="school_admin">School admin</option>
          </Select>
        </Field>
        <Field label="Sites" error={f.site_ids.length ? null : "Choose at least one site"}>
          <div className="ds-row wrap">{me!.sites.map(s => (
            <label key={s.id} className="ds-check"><input type="checkbox" checked={f.site_ids.includes(s.id)}
              onChange={e => setF({ ...f, site_ids: e.target.checked ? [...f.site_ids, s.id] : f.site_ids.filter(x => x !== s.id) })} />{s.name}</label>))}</div>
        </Field>
        {error && <div className="err">{error}</div>}
        <div className="actions"><Button onClick={onClose}>Cancel</Button><Button type="submit" variant="primary" disabled={!f.site_ids.length} testid="user-save">Create account</Button></div>
      </form>
    </Dialog>
  );
}

/** Temporary passwords are shown exactly once, to the admin who created them. */
export function TempPassword({ who, temp, onClose }: { who: string; temp: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <Dialog title="Temporary password" onClose={onClose} testid="temp-password-dialog">
      <p>Give this to <b>{who}</b> in person or by phone. It works once: they must choose their own password at first sign-in.</p>
      <div className="ds-row" style={{ margin: "16px 0", padding: 14, background: "var(--surface-2)", border: "1px dashed var(--line-strong)", borderRadius: 10 }}>
        <span className="ds-mono ds-grow" style={{ fontSize: 20, letterSpacing: ".04em" }} data-testid="temp-password">{temp}</span>
        <Button size="sm" onClick={() => { navigator.clipboard?.writeText(temp); setCopied(true); }}>{copied ? "Copied" : "Copy"}</Button>
      </div>
      <p className="ds-small ds-muted">It is not stored in readable form and won't be shown again.</p>
      <div className="actions"><Button variant="primary" onClick={onClose} testid="temp-password-done">Done</Button></div>
    </Dialog>
  );
}
