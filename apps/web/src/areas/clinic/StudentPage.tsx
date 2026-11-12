import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Avatar, Badge, Button, Card, Dialog, EmptyState, useToast } from "@aba/design-system";
import { put } from "../../lib/api";
import { studentName, useData } from "../../lib/hooks";
import { PageHead } from "../../shell/Shell";
import { ProgramRow } from "./Caseload";
import { ProgramForm } from "./ProgramForm";
import { StudentExtras } from "./StudentExtras";

export function StudentPage() {
  const { id } = useParams();
  const { data, error, reload } = useData<any>(`/clinic/students/${id}`);
  const staff = useData<any[]>("/clinic/staff");
  const [adding, setAdding] = useState(false), [team, setTeam] = useState<string[] | null>(null);
  const toast = useToast();
  if (error) return <div className="page"><div className="err">{error}</div></div>;
  if (!data) return null;
  const s = data.student, active = data.programs.filter((p: any) => p.status !== "archived");
  const saveTeam = async () => {
    const before = data.team.map((t: any) => t.id);
    await put(`/clinic/students/${id}/team`, { rbt_ids: team }); setTeam(null); reload();
    toast({ text: "Team updated", action: { label: "Undo", run: () => put(`/clinic/students/${id}/team`, { rbt_ids: before }).then(reload) } });
  };
  return (
    <div className="page">
      <PageHead crumbs={<><Link to="/clinic">Caseload</Link> ›</>} title={<span className="ds-row"><Avatar name={`${s.first_name} ${s.last_name}`} size="lg" />{studentName(s)}</span>} sub={`${s.site} · ${data.plan?.name ?? "No plan"}`}>
        <Link className="ds-btn" to={`/clinic/students/${id}/report`} data-testid="open-report">Progress report</Link>
        <Button variant="primary" icon="plus" onClick={() => setAdding(true)} testid="add-program">New program</Button>
      </PageHead>
      <div className="ds-stack lg">
        <Card>
          <div className="ds-row between"><h2>Team</h2><Button size="sm" icon="edit" onClick={() => setTeam(data.team.map((t: any) => t.id))} testid="edit-team">Assign RBTs</Button></div>
          <div className="ds-row wrap" style={{ marginTop: 10, gap: 16 }}>
            {data.team.map((t: any) => <span key={t.id} className="ds-row"><Avatar name={t.name} size="sm" /><span className="ds-small">{t.name} <span className="ds-muted">· RBT</span></span></span>)}
            {!data.team.length && <Badge tone="warn">No RBT assigned — nobody can record sessions yet</Badge>}
          </div>
        </Card>
        <Card flush>
          <div style={{ padding: "14px 16px" }}><h2>Programs</h2></div>
          {active.map((p: any) => <ProgramRow key={p.id} p={p} />)}
          {!active.length && <EmptyState icon="chart" title="No programs yet" action={<Button variant="primary" onClick={() => setAdding(true)}>Create the first program</Button>}>
            A program defines what to measure, how, and when it counts as mastered.</EmptyState>}
        </Card>
        <StudentExtras studentId={id!} name={s.first_name} />
      </div>
      {adding && <ProgramForm studentId={id} onClose={() => setAdding(false)} onSaved={() => { setAdding(false); reload(); toast({ text: "Program created — it starts in Baseline" }); }} />}
      {team && (
        <Dialog title={`Who works with ${studentName(s)}?`} onClose={() => setTeam(null)} testid="team-dialog">
          <p className="ds-small ds-muted" style={{ marginBottom: 12 }}>Assigned RBTs see this student on their phone and can record sessions. Removing someone keeps their past data.</p>
          <div className="ds-stack">{staff.data?.map(u => (
            <label key={u.id} className="ds-check"><input type="checkbox" checked={team.includes(u.id)} data-testid={`team-${u.name}`}
              onChange={e => setTeam(e.target.checked ? [...team, u.id] : team.filter(x => x !== u.id))} /><Avatar name={u.name} size="sm" />{u.name}</label>))}</div>
          <div className="actions"><Button onClick={() => setTeam(null)}>Cancel</Button><Button variant="primary" onClick={saveTeam} testid="team-save">Save team</Button></div>
        </Dialog>
      )}
    </div>
  );
}
