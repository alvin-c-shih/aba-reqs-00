import { useState } from "react";
import { Badge, Button, Card, Dialog, Field, Input, Segmented, Select, useToast } from "@aba/design-system";
import { patch, post } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { studentName, useData } from "../../lib/hooks";
import { PageHead } from "../../shell/Shell";
import { ImportStudents } from "./SchoolExtras";

export function Students() {
  const { me } = useAuth();
  const { data, error, reload } = useData<any[]>("/school/students");
  const users = useData<any[]>("/school/users");
  const [site, setSite] = useState("all"), [adding, setAdding] = useState(false), [importing, setImporting] = useState(false);
  const toast = useToast();
  const bcbas = (users.data ?? []).filter(u => u.role === "bcba" && u.status === "active");
  const rows = (data ?? []).filter(s => site === "all" || s.site_id === site);
  const change = async (s: any, body: any, msg: string) => {
    const before = Object.fromEntries(Object.keys(body).map(k => [k, s[k]]));
    try { await patch(`/school/students/${s.id}`, body); reload(); toast({ text: msg, action: { label: "Undo", run: () => patch(`/school/students/${s.id}`, before).then(reload) } }); }
    catch (e: any) { toast({ text: e.message, tone: "bad" }); }
  };
  return (
    <div className="page">
      <PageHead title="Students" sub="Enrolment, site and supervising BCBA. The BCBA assigns RBTs and builds programs.">
        {me!.sites.length > 1 && <Segmented value={site} onChange={setSite} testid="site-filter" options={[{ value: "all", label: "All sites" }, ...me!.sites.map(s => ({ value: s.id, label: s.name }))]} />}
        <Button icon="upload" onClick={() => setImporting(true)} testid="import-students">Import</Button>
        <Button variant="primary" icon="plus" onClick={() => setAdding(true)} testid="add-student">Enrol student</Button>
      </PageHead>
      {error && <div className="err">{error}</div>}
      <Card flush>
        <div className="ds-table-wrap">
          <table className="ds-table" data-testid="students-table">
            <thead><tr><th>Student</th><th>Site</th><th>Supervising BCBA</th><th>RBTs</th><th>Status</th><th /></tr></thead>
            <tbody>{rows.map(s => (
              <tr key={s.id} data-testid={`student-${s.first_name}`}>
                <td><b>{s.first_name} {s.last_name}</b></td>
                <td><Select value={s.site_id} style={{ minHeight: 32, padding: "3px 8px", width: "auto" }} aria-label="Site"
                  onChange={e => change(s, { site_id: e.target.value }, `${studentName(s)} moved to ${me!.sites.find(x => x.id === e.target.value)?.name}`)}>
                  {me!.sites.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</Select></td>
                <td><Select value={s.bcba_id ?? ""} style={{ minHeight: 32, padding: "3px 8px", width: "auto" }} aria-label="Supervising BCBA" data-testid={`bcba-${s.first_name}`}
                  onChange={e => change(s, { bcba_id: e.target.value || null }, `Supervisor updated for ${studentName(s)}`)}>
                  <option value="">— none —</option>{bcbas.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</Select></td>
                <td className="ds-small">{s.rbts.length ? s.rbts.join(", ") : <Badge tone="warn">No RBT yet</Badge>}</td>
                <td>{s.status === "active" ? <Badge tone="ok" icon="check">Active</Badge> : <Badge>Discharged</Badge>}</td>
                <td style={{ textAlign: "right" }}><Button size="sm" variant="ghost"
                  onClick={() => change(s, { status: s.status === "active" ? "discharged" : "active" }, s.status === "active" ? `${studentName(s)} discharged — records are kept` : `${studentName(s)} re-enrolled`)}>
                  {s.status === "active" ? "Discharge" : "Re-enrol"}</Button></td>
              </tr>))}</tbody>
          </table>
        </div>
      </Card>
      {importing && <ImportStudents onClose={() => setImporting(false)} onDone={() => { setImporting(false); reload(); }} />}
      {adding && <Enrol bcbas={bcbas} onClose={() => setAdding(false)} onDone={() => { setAdding(false); reload(); toast({ text: "Student enrolled" }); }} />}
    </div>
  );
}

function Enrol({ bcbas, onClose, onDone }: { bcbas: any[]; onClose: () => void; onDone: () => void }) {
  const { me } = useAuth();
  const [f, setF] = useState({ first_name: "", last_name: "", birth_date: "", site_id: me!.sites[0]?.id ?? "", bcba_id: "" });
  const [error, setError] = useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    try { await post("/school/students", { ...f, birth_date: f.birth_date || null, bcba_id: f.bcba_id || null }); onDone(); } catch (x: any) { setError(x.message); }
  };
  return (
    <Dialog title="Enrol a student" onClose={onClose} testid="student-dialog">
      <form className="ds-stack" onSubmit={submit}>
        <div className="ds-row" style={{ alignItems: "flex-start" }}>
          <div className="ds-grow"><Field label="First name"><Input required value={f.first_name} onChange={e => setF({ ...f, first_name: e.target.value })} testid="student-first" /></Field></div>
          <div className="ds-grow"><Field label="Last name"><Input required value={f.last_name} onChange={e => setF({ ...f, last_name: e.target.value })} testid="student-last" /></Field></div>
        </div>
        <Field label="Date of birth" hint="Optional"><Input type="date" value={f.birth_date} onChange={e => setF({ ...f, birth_date: e.target.value })} /></Field>
        <Field label="Site"><Select value={f.site_id} onChange={e => setF({ ...f, site_id: e.target.value })}>{me!.sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
        <Field label="Supervising BCBA" hint="Can be assigned later."><Select value={f.bcba_id} onChange={e => setF({ ...f, bcba_id: e.target.value })} testid="student-bcba">
          <option value="">— assign later —</option>{bcbas.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</Select></Field>
        {error && <div className="err">{error}</div>}
        <div className="actions"><Button onClick={onClose}>Cancel</Button><Button type="submit" variant="primary" testid="student-save">Enrol</Button></div>
      </form>
    </Dialog>
  );
}
