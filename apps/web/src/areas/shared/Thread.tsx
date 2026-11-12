import { useEffect, useRef, useState } from "react";
import { Button, ROLE_LABEL, Textarea, useToast } from "@aba/design-system";
import { post } from "../../lib/api";

/* One conversation about one student. The same component serves the clinical team, the family and the classroom thread. */
export function Thread({ messages, sendTo, audience, onSent, placeholder, testid = "thread" }: {
  messages: any[]; sendTo: string; audience?: string; onSent: () => void; placeholder: string; testid?: string;
}) {
  const [body, setBody] = useState(""), [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null), toast = useToast();
  useEffect(() => { end.current?.scrollIntoView({ block: "nearest" }); }, [messages.length]);
  const send = async () => {
    if (!body.trim()) return;
    setBusy(true);
    try { await post(sendTo, { body, ...(audience ? { audience } : {}) }); setBody(""); onSent(); }
    catch (e: any) { toast({ text: e.message, tone: "bad" }); } finally { setBusy(false); }
  };
  return (
    <div data-testid={testid}>
      <div style={{ maxHeight: 300, overflow: "auto", display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
        {messages.map(m => (
          <div key={m.id} style={{ alignSelf: m.mine ? "flex-end" : "flex-start", maxWidth: "82%" }} data-testid="message">
            <div className="ds-tiny ds-muted" style={{ textAlign: m.mine ? "right" : "left" }}>{m.mine ? "You" : `${m.author} · ${ROLE_LABEL[m.author_role] ?? ""}`} · {new Date(m.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}</div>
            <div style={{ padding: "8px 12px", borderRadius: 14, background: m.mine ? "var(--accent-soft)" : "var(--surface-2)", border: "1px solid var(--line)", fontSize: 14, whiteSpace: "pre-wrap" }}>{m.body}</div>
          </div>))}
        {!messages.length && <p className="ds-small ds-muted">No messages yet.</p>}
        <div ref={end} />
      </div>
      <div className="ds-row" style={{ alignItems: "flex-end" }}>
        <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder={placeholder} style={{ minHeight: 44 }} maxLength={2000} data-testid={`${testid}-input`}
          onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send(); }} />
        <Button variant="primary" disabled={busy || !body.trim()} onClick={send} testid={`${testid}-send`}>Send</Button>
      </div>
    </div>
  );
}
