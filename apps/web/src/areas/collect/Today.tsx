import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Avatar, Badge, Card, EmptyState, Icon } from "@aba/design-system";
import { useAuth } from "../../lib/auth";
import { usePageTour } from "../../shell/Shell";
import { TOURS } from "../../shell/tours";
import { SyncPill } from "./SyncPill";
import { activeSession, init, online, useCollect } from "./store";

export function Today() {
  const { me } = useAuth();
  const st = useCollect();
  useEffect(() => { init(me!.id); }, [me]);
  usePageTour(TOURS.today, !!st.bundle);
  const students = st.bundle?.students ?? [];
  return (
    <div className="phone">
      <SyncPill />
      <h1 style={{ margin: "8px 0 2px" }}>Today</h1>
      <p className="ds-muted ds-small" style={{ marginBottom: 14 }}>{new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })} · {students.length} student{students.length === 1 ? "" : "s"}</p>
      {!online() && <div className="lockbar" style={{ background: "var(--slate-soft)", color: "var(--slate)" }}><Icon name="wifiOff" />You're offline. Start and record sessions as usual — they sync when you reconnect.</div>}
      <div className="ds-stack">
        {students.map((s: any, i: number) => {
          const act = activeSession(s.id, st), other = s.lock && s.lock.holder_id !== me!.id ? s.lock.holder : null;
          return (
            <Link key={s.id} to={`/collect/${s.id}`} className="ds-card click" data-tour={i === 0 ? "student-row" : undefined} data-testid={`collect-${s.first_name}`}>
              <div className="ds-row" style={{ gap: 12 }}>
                <Avatar name={`${s.first_name} ${s.last_name}`} size="lg" />
                <div className="ds-grow">
                  <h2>{s.first_name} {s.last_name[0]}.</h2>
                  <div className="ds-small ds-muted">{s.site} · {s.programs.length} program{s.programs.length === 1 ? "" : "s"}</div>
                  <div className="ds-row wrap" style={{ marginTop: 6 }}>
                    {act ? <Badge tone="accent" icon="play">Session in progress</Badge>
                      : other ? <Badge tone="warn" icon="lock">{other} is recording</Badge>
                      : s.seen_today ? <Badge tone="ok" icon="check">Seen today</Badge> : <Badge>Not seen yet</Badge>}
                  </div>
                </div>
                <Icon name="chevron" />
              </div>
            </Link>
          );
        })}
      </div>
      {st.ready && st.bundle && !students.length && <Card><EmptyState icon="users" title="No students assigned yet">Your BCBA adds you to a student's team. They'll appear here.</EmptyState></Card>}
      {st.ready && !st.bundle && <Card><EmptyState icon="wifiOff" title="Connect once to load your students">After the first load, everything works offline.</EmptyState></Card>}
    </div>
  );
}
