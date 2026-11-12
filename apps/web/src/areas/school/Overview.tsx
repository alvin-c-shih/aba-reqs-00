import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, Dialog, Field, Icon, Input, Stat } from "@aba/design-system";
import { post } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useData } from "../../lib/hooks";
import { PageHead, usePageTour } from "../../shell/Shell";
import { TOURS } from "../../shell/tours";
import { Features } from "./SchoolExtras";

export function Overview() {
  const { me } = useAuth();
  const { data, error, reload } = useData<any>("/school/overview");
  const [adding, setAdding] = useState(false), [name, setName] = useState(""), [err, setErr] = useState<string | null>(null);
  usePageTour(TOURS.school, !!data);
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await post("/school/sites", { name }); setAdding(false); setName(""); setErr(null); reload(); } catch (x: any) { setErr(x.message); }
  };
  return (
    <div className="page">
      <PageHead title={me!.school!.name} sub="You administer the sites below: staff accounts and student enrolment.">
        <Button icon="plus" onClick={() => setAdding(true)} testid="add-site">Add site</Button>
      </PageHead>
      {error && <div className="err">{error}</div>}
      {data?.needs_team > 0 && (
        <div className="callout warn" style={{ marginBottom: 16 }} data-testid="needs-team"><Icon name="flag" />
          <span><b>{data.needs_team} student{data.needs_team === 1 ? "" : "s"}</b> without a supervising BCBA or an RBT. <Link to="/school/students">Review students</Link></span></div>
      )}
      <div className="ds-grid" data-tour="sites">
        {data?.sites.map((s: any) => (
          <Card key={s.id} pad="lg" data-testid={`site-${s.name}`}>
            <div className="ds-row" style={{ marginBottom: 14 }}><span style={{ color: "var(--accent)" }}><Icon name="pin" size={20} /></span><h2>{s.name}</h2></div>
            <div className="ds-row" style={{ gap: 32 }}><Stat value={s.students} label="Active students" /><Stat value={s.staff} label="Clinical staff" /></div>
          </Card>
        ))}
      </div>
      <Features />
      <Card style={{ marginTop: 16 }}>
        <div className="ds-row" style={{ alignItems: "flex-start", gap: 12 }}><span style={{ color: "var(--muted)" }}><Icon name="lock" size={20} /></span>
          <div><h3>What you can and can't see</h3><p className="ds-small ds-muted">School admins manage people and enrolment. Session data, graphs and clinical notes are visible only to each student's BCBA and assigned RBTs — the database enforces this, not just the screens.</p></div></div>
      </Card>
      {adding && (
        <Dialog title="Add a site" onClose={() => setAdding(false)}>
          <form className="ds-stack" onSubmit={add}>
            <Field label="Site name" hint="For example a campus or neighbourhood." error={err}><Input required value={name} onChange={e => setName(e.target.value)} testid="site-name" /></Field>
            <div className="actions"><Button onClick={() => setAdding(false)}>Cancel</Button><Button type="submit" variant="primary" testid="site-save">Add site</Button></div>
          </form>
        </Dialog>
      )}
    </div>
  );
}
