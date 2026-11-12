import { useMemo, useState } from "react";
import { Badge, Card, EmptyState, Input } from "@aba/design-system";
import { fmtDateTime, useData } from "../../lib/hooks";
import { PageHead } from "../../shell/Shell";

const tone = (a: string) => a.includes("failed") || a.includes("locked") || a.includes("reuse") || a.includes("rejected") ? "bad"
  : a.startsWith("login") || a.startsWith("logout") ? "info" : a.includes("viewed") ? "neutral" : "accent";

export function AuditLog({ scope }: { scope: "platform" | "school" }) {
  const { data, error } = useData<any[]>(scope === "platform" ? "/platform/audit" : "/school/audit");
  const [q, setQ] = useState("");
  const rows = useMemo(() => (data ?? []).filter(r => !q || JSON.stringify(r).toLowerCase().includes(q.toLowerCase())), [data, q]);
  return (
    <div className="page">
      <PageHead title="Audit log" sub="Sign-ins, record views and every change. Append-only: the application cannot edit or delete entries.">
        <Input placeholder="Filter…" value={q} onChange={e => setQ(e.target.value)} style={{ width: 220 }} testid="audit-filter" />
      </PageHead>
      {error && <div className="err">{error}</div>}
      <Card flush>
        <div className="ds-table-wrap">
          <table className="ds-table" data-testid="audit-table">
            <thead><tr><th>When</th><th>Who</th><th>Action</th>{scope === "platform" && <th>School</th>}<th>Details</th></tr></thead>
            <tbody>{rows.map(r => (
              <tr key={r.id}>
                <td className="ds-num" style={{ whiteSpace: "nowrap" }}>{fmtDateTime(r.at)}</td>
                <td>{r.actor ?? <span className="ds-muted">{r.actor_role || "—"}</span>}</td>
                <td><Badge tone={tone(r.action) as any}>{r.action}</Badge></td>
                {scope === "platform" && <td className="ds-small">{r.school ?? <span className="ds-muted">platform</span>}</td>}
                <td className="ds-small ds-muted ds-truncate" style={{ maxWidth: 360 }}>{Object.entries(r.detail ?? {}).map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`).join(" · ")}</td>
              </tr>))}</tbody>
          </table>
        </div>
        {data && !rows.length && <EmptyState icon="shield" title="Nothing matches">Try a different filter.</EmptyState>}
      </Card>
    </div>
  );
}
