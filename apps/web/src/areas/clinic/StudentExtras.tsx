import { useRef, useState } from "react";
import { Badge, Button, Card, Dialog, Field, Input, Segmented, Select, useToast } from "@aba/design-system";
import { del, patch, post, upload } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { ago, fmtDate, useData } from "../../lib/hooks";
import { Thread } from "../shared/Thread";

/* Everything around a student that is not a program: conversations, family & classroom links, consent and media. */
export function StudentExtras({ studentId, name }: { studentId: string; name: string }) {
  const { me } = useAuth();
  const bcba = me!.role === "bcba";
  const msgs = useData<any[]>(`/clinic/students/${studentId}/messages`);
  const extra = useData<any>(bcba ? `/clinic/students/${studentId}/contacts` : null);
  const [tab, setTab] = useState<"team" | "family" | "classroom">("team");
  const [consent, setConsent] = useState(false), [viewing, setViewing] = useState<any>(null);
  const file = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const thread = (msgs.data ?? []).filter(m => m.audience === tab);
  const count = (a: string) => (msgs.data ?? []).filter(m => m.audience === a).length;
  const d = extra.data;
  const active = (kind: string) => d?.consents.find((x: any) => x.kind === kind && !x.revoked_at);
  const setHome = async (c: any, v: boolean) => { await patch(`/clinic/contacts/${c.id}`, { home_data: v }); extra.reload();
    toast({ text: v ? `${c.name} can now send home counts (you review each one)` : "Home data switched off", action: { label: "Undo", run: () => patch(`/clinic/contacts/${c.id}`, { home_data: !v }).then(extra.reload) } }); };
  const send = async (f: File | undefined) => {
    if (!f) return;
    try { await upload(`/clinic/students/${studentId}/media?caption=${encodeURIComponent(f.name.slice(0, 80))}`, f); extra.reload(); toast({ text: "Added to the student’s media" }); }
    catch (e: any) { toast({ text: e.message, tone: "bad" }); }
    if (file.current) file.current.value = "";
  };
  return (
    <>
      <Card data-testid="messages-card">
        <div className="ds-row between wrap" style={{ marginBottom: 10 }}><h2>Messages</h2>
          {bcba && <Segmented value={tab} onChange={setTab} testid="thread" options={[{ value: "team", label: `Team ${count("team") || ""}` }, { value: "family", label: `Family ${count("family") || ""}` }, { value: "classroom", label: `Classroom ${count("classroom") || ""}` }]} />}</div>
        <p className="ds-small ds-muted" style={{ marginBottom: 10 }}>{tab === "team" ? "Between the BCBA and assigned RBTs." : tab === "family" ? `With ${name}’s parents or guardians.` : "Observations from the classroom teacher."}</p>
        <Thread key={tab} messages={thread} sendTo={`/clinic/students/${studentId}/messages`} audience={tab} onSent={msgs.reload} placeholder="Write a message…" testid={`thread-${tab}`} />
      </Card>

      {bcba && d && <div className="ds-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))" }}>
        <Card data-testid="contacts-card">
          <h2 style={{ marginBottom: 4 }}>Family &amp; classroom</h2>
          <p className="ds-small ds-muted" style={{ marginBottom: 8 }}>The school office invites parents and teachers. You decide what they can do.</p>
          {d.contacts.map((c: any) => (
            <div key={c.id} className="ds-row" style={{ padding: "9px 0", borderTop: "1px solid var(--line)" }}>
              <div className="ds-grow"><b className="ds-small">{c.name}</b> <span className="ds-small ds-muted">· {c.relation || c.kind}</span><div className="ds-tiny ds-muted">{c.last_login_at ? `last signed in ${ago(c.last_login_at)}` : "has not signed in yet"}</div></div>
              {c.kind === "guardian" && <label className="ds-check ds-small"><input type="checkbox" checked={c.home_data} onChange={e => setHome(c, e.target.checked)} data-testid="home-toggle" />May send home counts</label>}
            </div>))}
          {!d.contacts.length && <p className="ds-small ds-muted">Nobody outside the clinical team is linked to {name} yet.</p>}
        </Card>
        <Card data-testid="media-card">
          <div className="ds-row between"><h2>Consent &amp; media</h2><Button size="sm" onClick={() => setConsent(true)} testid="add-consent">Record consent</Button></div>
          <div className="ds-row wrap" style={{ margin: "8px 0" }}>
            {(["photo", "video"] as const).map(k => active(k)
              ? <Badge key={k} tone="ok" icon="check" title={`${active(k).source} · ${active(k).granted_by}`}>{k} consent · {fmtDate(active(k).granted_on)}</Badge>
              : <Badge key={k} tone="warn">no {k} consent</Badge>)}
          </div>
          <div className="ds-row wrap" style={{ gap: 8 }}>
            {d.media.map((m: any) => (
              <button key={m.id} onClick={() => setViewing(m)} style={{ all: "unset", cursor: "pointer" }} title={`${m.caption} · ${m.by} · ${fmtDate(m.created_at)}`} data-testid="media-thumb">
                {m.kind === "photo" ? <img src={`/api/v1/clinic/media/${m.id}`} alt={m.caption} style={{ width: 84, height: 84, objectFit: "cover", borderRadius: 10, border: "1px solid var(--line)" }} />
                  : <span style={{ width: 84, height: 84, display: "grid", placeItems: "center", borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface-2)" }}>▶ video</span>}
              </button>))}
          </div>
          <input ref={file} type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime" hidden onChange={e => send(e.target.files?.[0])} data-testid="media-file" />
          <div style={{ marginTop: 10 }}><Button size="sm" icon="upload" disabled={!active("photo") && !active("video")} onClick={() => file.current?.click()}>Add photo or video</Button>
            {!active("photo") && !active("video") && <span className="ds-tiny ds-muted"> Record consent first — uploads are refused without it.</span>}</div>
        </Card>
      </div>}

      {consent && <ConsentDialog studentId={studentId} onClose={() => setConsent(false)} onDone={() => { setConsent(false); extra.reload(); }} />}
      {viewing && (
        <Dialog title={viewing.caption || "Media"} onClose={() => setViewing(null)} wide>
          {viewing.kind === "photo" ? <img src={`/api/v1/clinic/media/${viewing.id}`} alt={viewing.caption} style={{ maxWidth: "100%", borderRadius: 10 }} />
            : <video src={`/api/v1/clinic/media/${viewing.id}`} controls style={{ maxWidth: "100%", borderRadius: 10 }} />}
          <div className="actions"><Button variant="danger" onClick={async () => { await del(`/clinic/media/${viewing.id}`); setViewing(null); extra.reload(); toast({ text: "Removed" }); }}>Remove</Button><Button onClick={() => setViewing(null)}>Close</Button></div>
        </Dialog>)}
    </>
  );
}

function ConsentDialog({ studentId, onClose, onDone }: { studentId: string; onClose: () => void; onDone: () => void }) {
  const [f, setF] = useState({ kind: "photo", granted_by: "", source: "Signed consent form, on file", granted_on: new Date().toISOString().slice(0, 10) });
  const [error, setError] = useState<string | null>(null);
  const save = async (e: React.FormEvent) => { e.preventDefault(); try { await post(`/clinic/students/${studentId}/consents`, f); onDone(); } catch (x: any) { setError(x.message); } };
  return (
    <Dialog title="Record media consent" onClose={onClose} testid="consent-dialog">
      <form className="ds-stack" onSubmit={save}>
        <p className="ds-small ds-muted">Consent is given by a parent or guardian, per student. Record where the signed consent is kept.</p>
        <Field label="For"><Select value={f.kind} onChange={e => setF({ ...f, kind: e.target.value })}><option value="photo">Photos</option><option value="video">Video</option></Select></Field>
        <Field label="Given by (parent or guardian)"><Input required value={f.granted_by} onChange={e => setF({ ...f, granted_by: e.target.value })} testid="consent-by" /></Field>
        <Field label="Source"><Input required value={f.source} onChange={e => setF({ ...f, source: e.target.value })} /></Field>
        <Field label="Date"><Input type="date" required value={f.granted_on} onChange={e => setF({ ...f, granted_on: e.target.value })} /></Field>
        {error && <div className="err">{error}</div>}
        <div className="actions"><Button onClick={onClose}>Cancel</Button><Button type="submit" variant="primary" testid="consent-save">Save</Button></div>
      </form>
    </Dialog>
  );
}
