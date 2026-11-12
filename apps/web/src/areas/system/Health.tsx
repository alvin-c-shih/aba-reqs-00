import { useEffect, useState } from "react";
import { Badge, Button, Card, Icon, Stat } from "@aba/design-system";
import { fmtDateTime, useData } from "../../lib/hooks";
import { PageHead } from "../../shell/Shell";

/* The "is it really working?" page: evidence a tester or coding agent can check without trusting the UI. */
export function Health() {
  const { data, error, reload, loading } = useData<any>("/platform/health");
  const [auto, setAuto] = useState(false);
  useEffect(() => { if (!auto) return; const t = setInterval(reload, 5000); return () => clearInterval(t); }, [auto, reload]);
  const total = data?.tables.reduce((a: number, t: any) => a + t.total, 0);
  return (
    <div className="page">
      <PageHead title="Platform health" sub="Live evidence that the system writes to the real database. Counts only — no student data is readable here.">
        <label className="ds-check ds-small"><input type="checkbox" checked={auto} onChange={e => setAuto(e.target.checked)} data-testid="health-auto" />Refresh every 5 s</label>
        <Button icon="refresh" onClick={reload} disabled={loading} testid="health-refresh">Refresh</Button>
      </PageHead>
      {error && <div className="err">{error}</div>}
      {data && <div className="ds-stack lg">
        <div className="ds-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
          <Card><Stat value={<span style={{ textTransform: "uppercase" }}>{data.env}</span>} label="Environment" testid="health-env" /></Card>
          <Card><Stat value={<span className="ds-mono" style={{ fontSize: 22 }}>{data.db}</span>} label={`Database · connected as ${data.db_user}`} testid="health-db" /></Card>
          <Card><Stat value={total.toLocaleString()} label="Rows across all tables" testid="health-total" /></Card>
          <Card>
            <Stat value={data.canary.ok ? <span style={{ color: "var(--ok)" }}>Pass</span> : <span style={{ color: "var(--bad)" }}>Fail</span>}
              label={data.canary.ok ? `Write → read-back canary · ${data.canary.ms} ms` : `Canary failed: ${data.canary.error}`} testid="health-canary" />
          </Card>
        </div>
        <Card flush>
          <div style={{ padding: "14px 16px" }} className="ds-row between">
            <h2>Row counts</h2><span className="ds-small ds-muted">count(*) per table · “changed” = rows written in the last 5 minutes</span>
          </div>
          <div className="ds-table-wrap">
            <table className="ds-table" data-testid="row-counts">
              <thead><tr><th>Table</th><th className="num">Rows</th><th className="num">Changed (5 min)</th><th>Write rule</th></tr></thead>
              <tbody>{data.tables.map((t: any) => (
                <tr key={t.tbl} data-testid={`rows-${t.tbl}`}>
                  <td className="ds-mono">{t.tbl}</td><td className="num" data-testid={`rows-${t.tbl}-total`}>{t.total.toLocaleString()}</td>
                  <td className="num">{t.recent > 0 ? <Badge tone="accent">+{t.recent}</Badge> : <span className="ds-muted">0</span>}</td>
                  <td className="ds-small ds-muted">{["observations", "audit_log"].includes(t.tbl) ? "append-only" : ""}</td>
                </tr>))}</tbody>
            </table>
          </div>
        </Card>
        <div className="ds-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
          <Card>
            <h2 style={{ marginBottom: 10 }}>Security posture</h2>
            <div className="ds-stack" style={{ gap: 10 }}>{Object.entries(data.security).map(([k, v]) => (
              <div key={k} className="ds-row" style={{ alignItems: "flex-start" }}><span style={{ color: "var(--ok)", marginTop: 2 }}><Icon name="check" size={16} /></span>
                <div><div className="ds-eyebrow">{k.replace("_", " ")}</div><div className="ds-small">{String(v)}</div></div></div>))}</div>
          </Card>
          <Card>
            <h2 style={{ marginBottom: 10 }}>Build</h2>
            <div className="ds-stack ds-small" style={{ gap: 8 }}>
              <div className="ds-row between"><span className="ds-muted">Database engine</span><span className="ds-mono">{data.pg_version}</span></div>
              <div className="ds-row between"><span className="ds-muted">Server time</span><span>{fmtDateTime(data.server_time)}</span></div>
              <div className="ds-row between"><span className="ds-muted">Demo reset available</span><span>{data.resettable ? "Yes (non-prod)" : "No"}</span></div>
              <hr className="ds-divider" />
              <div className="ds-eyebrow">Schema migrations</div>
              {data.migrations.map((m: any) => <div key={m.name} className="ds-row between"><span className="ds-mono">{m.name}</span><span className="ds-muted">{fmtDateTime(m.applied_at)}</span></div>)}
            </div>
          </Card>
        </div>
      </div>}
    </div>
  );
}
