import { useState } from "react";
import { Button, Card, EmptyState, Icon, Input, Stat } from "@aba/design-system";
import { useData } from "../../lib/hooks";
import { PageHead } from "../../shell/Shell";

const iso = (d: Date) => d.toISOString().slice(0, 10);

/* Service log: who delivered how many minutes to whom. Generic by design — no payer-specific codes. */
export function ServiceLog() {
  const [start, setStart] = useState(iso(new Date(Date.now() - 30 * 86_400_000))), [end, setEnd] = useState(iso(new Date()));
  const { data, error } = useData<any>(`/reports/service-log?start=${start}&end=${end}`);
  return (
    <div className="page report">
      <PageHead title="Service log" sub="Sessions delivered, in minutes and 15-minute units (8-minute rule). Sessions awaiting review are not included.">
        <span className="no-print ds-row wrap">
          <Input type="date" value={start} max={end} onChange={e => setStart(e.target.value)} style={{ width: 150 }} aria-label="From" testid="log-start" />
          <span className="ds-muted">to</span>
          <Input type="date" value={end} min={start} onChange={e => setEnd(e.target.value)} style={{ width: 150 }} aria-label="To" />
          <a className="ds-btn" href={`/api/v1/reports/service-log?format=csv&start=${start}&end=${end}`} download data-testid="log-csv"><Icon name="download" size={16} />CSV</a>
          <Button variant="primary" icon="print" onClick={() => window.print()}>Print / PDF</Button>
        </span>
      </PageHead>
      {error && <div className="err">{error}</div>}
      {data && <div className="ds-stack lg">
        <Card><div className="ds-row wrap" style={{ gap: 40 }}>
          <Stat value={data.rows.length} label="Sessions" testid="log-sessions" /><Stat value={(data.minutes / 60).toFixed(1)} label="Hours" /><Stat value={data.units} label="Units (15 min)" testid="log-units" /></div></Card>
        <Card flush>
          <div className="ds-table-wrap"><table className="ds-table" data-testid="service-log">
            <thead><tr><th>Date</th><th>Time</th><th>Student</th><th>Site</th><th>Staff</th><th>Service</th><th>Setting</th><th className="num">Minutes</th><th className="num">Units</th></tr></thead>
            <tbody>{data.rows.map((r: any) => (
              <tr key={r.id}><td className="ds-num">{new Date(r.started_at).toLocaleDateString([], { month: "short", day: "numeric" })}</td>
                <td className="ds-num ds-small">{new Date(r.started_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</td>
                <td>{r.first_name} {r.last_name}</td><td className="ds-small">{r.site}</td><td>{r.staff} <span className="ds-muted ds-tiny">{r.staff_role.toUpperCase()}</span></td>
                <td className="ds-small">{r.type}</td><td className="ds-small">{r.setting}</td><td className="num">{r.minutes}</td><td className="num"><b>{r.units}</b></td></tr>))}</tbody>
          </table></div>
          {!data.rows.length && <EmptyState icon="list" title="No sessions in this period">Try a wider date range.</EmptyState>}
        </Card>
      </div>}
    </div>
  );
}
