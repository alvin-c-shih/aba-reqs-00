import { useState } from "react";
import { Badge, Button, Card, Dialog, Field, Icon, Input, Select, Textarea, useToast } from "@aba/design-system";
import { post, put } from "../../lib/api";
import { useData } from "../../lib/hooks";

/** Invite a parent or a teacher: an account that can see only the students named here. */
export function InviteContact({ onClose, onDone }: { onClose: () => void; onDone: (t: { email: string; temp: string }) => void }) {
  const students = useData<any[]>("/school/students");
  const [f, setF] = useState({ name: "", email: "", role: "parent", relation: "", student_ids: [] as string[] });
  const [error, setError] = useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    try { const r = await post("/school/contacts", f); onDone({ email: f.email, temp: r.temp_password }); } catch (x: any) { setError(x.message); }
  };
  const toggle = (id: string) => setF(v => ({ ...v, student_ids: v.student_ids.includes(id) ? v.student_ids.filter(x => x !== id) : [...v.student_ids, id] }));
  return (
    <Dialog title="Invite a parent or teacher" onClose={onClose} testid="invite-dialog">
      <form className="ds-stack" onSubmit={submit}>
        <Field label="Who"><Select value={f.role} onChange={e => setF({ ...f, role: e.target.value })} testid="invite-role">
          <option value="parent">Parent or guardian — sees shared summaries, messages the team</option>
          <option value="teacher">Teacher — sees classroom goals, sends observations</option></Select></Field>
        <Field label="Full name"><Input required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} testid="invite-name" /></Field>
        <Field label="Email"><Input required type="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} testid="invite-email" /></Field>
        {f.role === "parent" && <Field label="Relationship" hint="For example Mother, Father, Guardian."><Input value={f.relation} onChange={e => setF({ ...f, relation: e.target.value })} /></Field>}
        <Field label={f.role === "parent" ? "Their child or children" : "Students in their class"} error={f.student_ids.length ? null : "Choose at least one student"}>
          <div style={{ maxHeight: 170, overflow: "auto", border: "1px solid var(--line)", borderRadius: 10, padding: 8 }} className="ds-stack">
            {(students.data ?? []).filter(s => s.status === "active").map(s => (
              <label key={s.id} className="ds-check ds-small"><input type="checkbox" checked={f.student_ids.includes(s.id)} onChange={() => toggle(s.id)} data-testid={`invite-student-${s.first_name}`} />{s.first_name} {s.last_name} <span className="ds-muted">· {s.site}</span></label>))}
          </div></Field>
        {error && <div className="err">{error}</div>}
        <div className="actions"><Button onClick={onClose}>Cancel</Button><Button type="submit" variant="primary" disabled={!f.student_ids.length} testid="invite-save">Create account</Button></div>
      </form>
    </Dialog>
  );
}

/** CSV roster import: paste or pick a file, check every row first, then enrol all or nothing. */
export function ImportStudents({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [text, setText] = useState("first_name,last_name,birth_date,site\n");
  const [report, setReport] = useState<any>(null), [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const rows = () => {
    const lines = text.trim().split(/\r?\n/).map(l => l.split(",").map(c => c.trim().replace(/^"|"$/g, "")));
    const head = lines[0].map(h => h.toLowerCase());
    return lines.slice(1).filter(l => l.some(Boolean)).map(l => Object.fromEntries(head.map((h, i) => [h, l[i] || (h === "birth_date" ? null : "")])));
  };
  const run = async (dry: boolean) => {
    setError(null);
    try {
      const r = await post("/school/students/import", { rows: rows(), dry_run: dry });
      if (dry) setReport(r); else { toast({ text: `${r.ok} student${r.ok === 1 ? "" : "s"} enrolled` }); onDone(); }
    } catch (x: any) { setError(x.message); }
  };
  return (
    <Dialog title="Import students from a spreadsheet" onClose={onClose} wide testid="import-dialog">
      <div className="ds-stack">
        <p className="ds-small ds-muted">Columns: <span className="ds-mono">first_name, last_name, birth_date (YYYY-MM-DD, optional), site</span>. Save your sheet as CSV and choose it, or paste the rows.</p>
        <input type="file" accept=".csv,text/csv" onChange={async e => { const f = e.target.files?.[0]; if (f) { setText(await f.text()); setReport(null); } }} />
        <Textarea className="ds-mono" style={{ minHeight: 130, fontSize: 13 }} value={text} onChange={e => { setText(e.target.value); setReport(null); }} data-testid="import-text" />
        {error && <div className="err">{error}</div>}
        {report && <div data-testid="import-report">
          <div className="ds-row wrap" style={{ marginBottom: 8 }}><Badge tone="ok" icon="check">{report.ok} ready</Badge>{report.skipped > 0 && <Badge>{report.skipped} already enrolled</Badge>}{report.errors > 0 && <Badge tone="bad">{report.errors} to fix</Badge>}</div>
          <div style={{ maxHeight: 150, overflow: "auto" }}>{report.rows.filter((r: any) => r.status !== "ok").map((r: any) => <div key={r.row} className="ds-small">Row {r.row}: {r.message}</div>)}</div>
        </div>}
      </div>
      <div className="actions"><Button onClick={onClose}>Cancel</Button>
        {report && !report.errors && report.ok > 0 ? <Button variant="primary" onClick={() => run(false)} testid="import-commit">Enrol {report.ok} student{report.ok === 1 ? "" : "s"}</Button>
          : <Button variant="primary" onClick={() => run(true)} testid="import-check">Check rows</Button>}</div>
    </Dialog>
  );
}

/** Features that need the school's explicit decision. Off by default; models run on this machine only. */
export function Features() {
  const { data, reload } = useData<any>("/school/features");
  const toast = useToast();
  if (!data) return null;
  const set = async (patch: any) => {
    const next = { ai: data.ai, voice: data.voice, ...patch };
    await put("/school/features", next); reload();
    toast({ text: "Saved", action: { label: "Undo", run: () => put("/school/features", { ai: data.ai, voice: data.voice }).then(reload) } });
  };
  const row = (key: "ai" | "voice", title: string, what: string, ready: boolean, status: string) => (
    <div className="ds-row" style={{ alignItems: "flex-start", padding: "10px 0", borderTop: "1px solid var(--line)" }}>
      <div className="ds-grow"><b>{title}</b><div className="ds-small ds-muted">{what}</div>
        <div className="ds-tiny" style={{ marginTop: 4 }}>{ready ? <Badge tone="ok" icon="check">{status}</Badge> : <Badge tone="warn">{status}</Badge>}</div></div>
      <label className="ds-check"><input type="checkbox" checked={data[key]} onChange={e => set({ [key]: e.target.checked })} data-testid={`feature-${key}`} />{data[key] ? "On" : "Off"}</label>
    </div>);
  return (
    <Card style={{ marginTop: 16 }} data-testid="features">
      <div className="ds-row"><span style={{ color: "var(--accent)" }}><Icon name="sparkle" size={20} /></span><h3>Optional features — prototype</h3></div>
      <p className="ds-small ds-muted" style={{ margin: "4px 0 6px" }}>These use AI models that run on the school’s own server. No student data is sent to an outside service. Each is off until you switch it on, and every result is a draft a person reviews.</p>
      {row("ai", "Drafted summaries and caseload questions", "BCBAs can ask the local model to draft a family summary, or to answer a question about their caseload.", !!data.model, data.model ? `Local model ready: ${data.model}` : "No local model is running on the server")}
      {row("voice", "Voice notes", "Staff can dictate session notes; the audio is transcribed on the server and not kept.", data.speech, data.speech ? "Local speech model ready" : "No local speech model is configured on the server")}
    </Card>
  );
}
