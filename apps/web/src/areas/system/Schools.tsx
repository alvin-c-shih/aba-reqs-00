import { useState } from "react";
import { Badge, Button, Card, Dialog, EmptyState, Field, Icon, Input, useToast } from "@aba/design-system";
import { patch, post } from "../../lib/api";
import { useData } from "../../lib/hooks";
import { PageHead, usePageTour } from "../../shell/Shell";
import { TOURS } from "../../shell/tours";
import { TempPassword } from "../school/People";

export function Schools() {
  const { data, error, reload } = useData<any[]>("/platform/schools");
  const [adding, setAdding] = useState(false);
  const [created, setCreated] = useState<{ email: string; temp: string } | null>(null);
  const toast = useToast();
  usePageTour(TOURS.system, !!data);
  const setStatus = async (s: any, status: string) => {
    await patch(`/platform/schools/${s.id}`, { status });
    toast({ text: `${s.name} ${status}`, action: { label: "Undo", run: () => patch(`/platform/schools/${s.id}`, { status: s.status }).then(reload) } });
    reload();
  };
  return (
    <div className="page">
      <PageHead title="Schools" sub="Each school is an isolated tenant. You manage the platform; student records stay inside each school.">
        <Button variant="primary" icon="plus" onClick={() => setAdding(true)} testid="add-school">Add school</Button>
      </PageHead>
      {error && <div className="err">{error}</div>}
      <div className="ds-grid" data-tour="schools">
        {data?.map(s => (
          <Card key={s.id} data-testid={`school-${s.slug}`}>
            <div className="ds-row between"><h2>{s.name}</h2>{s.status === "active" ? <Badge tone="ok" icon="check">Active</Badge> : <Badge tone="warn">Suspended</Badge>}</div>
            <div className="ds-small ds-muted ds-mono" style={{ marginBottom: 12 }}>{s.slug}</div>
            <div className="ds-stack" style={{ gap: 8 }}>
              <div className="ds-row ds-small"><Icon name="pin" size={15} /><span><b>{s.sites}</b> site{s.sites === 1 ? "" : "s"}: {(s.site_names ?? []).join(", ")}</span></div>
              <div className="ds-row ds-small"><Icon name="users" size={15} /><span><b>{s.users}</b> active accounts</span></div>
              <div className="ds-row ds-small"><Icon name="shield" size={15} /><span>Admin{(s.admins ?? []).length === 1 ? "" : "s"}: {(s.admins ?? []).map((a: any) => a.name).join(", ") || "none"}</span></div>
            </div>
            <div className="ds-row" style={{ marginTop: 14, justifyContent: "flex-end" }}>
              <Button size="sm" variant={s.status === "active" ? "danger" : "default"} onClick={() => setStatus(s, s.status === "active" ? "suspended" : "active")}>
                {s.status === "active" ? "Suspend" : "Reactivate"}
              </Button>
            </div>
          </Card>
        ))}
      </div>
      {data && !data.length && <EmptyState icon="building" title="No schools yet" action={<Button variant="primary" onClick={() => setAdding(true)}>Add the first school</Button>}>A school gets its own sites, staff and students.</EmptyState>}
      {adding && <AddSchool onClose={() => setAdding(false)} onDone={(c) => { setAdding(false); setCreated(c); reload(); }} />}
      {created && <TempPassword who={created.email} temp={created.temp} onClose={() => setCreated(null)} />}
    </div>
  );
}

function AddSchool({ onClose, onDone }: { onClose: () => void; onDone: (c: { email: string; temp: string }) => void }) {
  const [f, setF] = useState({ name: "", slug: "", site_name: "Main Campus", admin_name: "", admin_email: "" });
  const [error, setError] = useState<string | null>(null);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setF(v => ({ ...v, [k]: e.target.value,
    ...(k === "name" && (!v.slug || v.slug === slugify(v.name)) ? { slug: slugify(e.target.value) } : {}) }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    try { const r = await post("/platform/schools", f); onDone({ email: f.admin_email, temp: r.temp_password }); } catch (err: any) { setError(err.message); }
  };
  return (
    <Dialog title="Add a school" onClose={onClose} testid="school-dialog">
      <form className="ds-stack" onSubmit={submit}>
        <Field label="School name"><Input required value={f.name} onChange={set("name")} testid="school-name" /></Field>
        <Field label="Short name" hint="Lowercase letters, digits and dashes. Used in exports and logs."><Input required pattern="[a-z0-9\-]{2,40}" value={f.slug} onChange={set("slug")} /></Field>
        <Field label="First site" hint="More sites can be added by the school admin."><Input required value={f.site_name} onChange={set("site_name")} /></Field>
        <hr className="ds-divider" />
        <Field label="School admin name"><Input required value={f.admin_name} onChange={set("admin_name")} testid="school-admin-name" /></Field>
        <Field label="School admin email"><Input required type="email" value={f.admin_email} onChange={set("admin_email")} testid="school-admin-email" /></Field>
        {error && <div className="err">{error}</div>}
        <div className="actions"><Button onClick={onClose}>Cancel</Button><Button type="submit" variant="primary" testid="school-save">Create school</Button></div>
      </form>
    </Dialog>
  );
}
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
