import { useEffect, useState } from "react";
import { Button, Dialog, Field, Input, KIND_HINT, KIND_LABEL, Kbd, Segmented, Select, Textarea, formatValue, isPercent, useHotkey, useUndoable } from "@aba/design-system";
import { patch, post } from "../../lib/api";
import { useData } from "../../lib/hooks";

type Kind = "trial" | "frequency" | "duration" | "interval" | "abc" | "task";
type Config = { method: string; seconds: number; count: number; antecedents: string[]; consequences: string[]; chaining: string };
type Form = { plain_name: string; name: string; kind: Kind; goal: "increase" | "decrease"; domain: string; instruction: string;
  mastery: { value: number; n: number; m: number; min_trials: number }; targets: string[]; config: Config };
const CONFIG: Config = { method: "partial", seconds: 30, count: 20, chaining: "forward",
  antecedents: ["Task demand", "Asked to stop a preferred activity", "Transition", "Waiting", "Peer took an item"],
  consequences: ["Adult attention", "Task removed", "Activity continued", "Redirected", "Ignored"] };
const BLANK: Form = { plain_name: "", name: "", kind: "trial", goal: "increase", domain: "", instruction: "", mastery: { value: 80, n: 3, m: 3, min_trials: 8 }, targets: [], config: CONFIG };
const DEFAULTS: Record<string, Partial<Form>> = {
  trial: { goal: "increase", mastery: { value: 80, n: 3, m: 3, min_trials: 8 } },
  frequency: { goal: "decrease", mastery: { value: 1, n: 3, m: 3, min_trials: 0 } },
  duration: { goal: "decrease", mastery: { value: 60, n: 3, m: 3, min_trials: 0 } },
  interval: { goal: "decrease", mastery: { value: 10, n: 3, m: 3, min_trials: 0 } },
  abc: { goal: "decrease", mastery: { value: 1, n: 3, m: 3, min_trials: 0 } },
  task: { goal: "increase", mastery: { value: 80, n: 3, m: 3, min_trials: 0 } },
};

/* A forgiving form: every change is one undo step (typing bursts collapse), ⌘Z / ⇧⌘Z work
   anywhere in the dialog, and nothing is saved until you press Save. */
export function ProgramForm({ studentId, program, onClose, onSaved }: { studentId?: string; program?: any; onClose: () => void; onSaved: () => void }) {
  const init: Form = program ? { plain_name: program.plain_name ?? "", name: program.name, kind: program.kind, goal: program.goal, domain: program.domain, instruction: program.instruction,
    mastery: { min_trials: 0, ...program.mastery }, targets: (program.targets ?? []).map((t: any) => t.label), config: { ...CONFIG, ...(program.config ?? {}) } } : BLANK;
  const u = useUndoable<Form>(init);
  const templates = useData<any[]>(program ? null : "/clinic/templates");
  const f = u.value;
  const [draft, setDraft] = useState(""), [error, setError] = useState<string | null>(null), [busy, setBusy] = useState(false);
  const set = (p: Partial<Form>) => u.set(v => ({ ...v, ...p }), Object.keys(p).join());
  const setM = (p: Partial<Form["mastery"]>) => u.set(v => ({ ...v, mastery: { ...v.mastery, ...p } }), "mastery." + Object.keys(p).join());
  useHotkey("mod+z", e => { e.preventDefault(); e.shiftKey ? u.redo() : u.undo(); });
  useHotkey("mod+shift+z", e => { e.preventDefault(); u.redo(); });
  useEffect(() => { setError(null); }, [f]);

  const addTarget = () => { const t = draft.trim(); if (t && !f.targets.includes(t)) set({ targets: [...f.targets, t] }); setDraft(""); };
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      if (program) await patch(`/clinic/programs/${program.id}`, { name: f.name, plain_name: f.plain_name, goal: f.goal, domain: f.domain, instruction: f.instruction, mastery: f.mastery, targets: f.targets, config: f.config });
      else await post(`/clinic/students/${studentId}/programs`, f);
      onSaved();
    } catch (x: any) { setError(x.message); setBusy(false); }
  };
  const unit = isPercent(f.kind) ? "%" : f.kind === "duration" ? "seconds" : "per session";
  const setC = (p: Partial<Config>) => u.set(v => ({ ...v, config: { ...v.config, ...p } }), "config." + Object.keys(p).join());
  const listField = (label: string, key: "antecedents" | "consequences") => (
    <Field label={label} hint="One per line. Shown as tap targets on the recording screen.">
      <Textarea value={f.config[key].join("\n")} onChange={e => setC({ [key]: e.target.value.split("\n").map(x => x.trimStart()).slice(0, 12) } as any)}
        onBlur={() => setC({ [key]: f.config[key].map(x => x.trim()).filter(Boolean) } as any)} />
    </Field>);
  return (
    <Dialog title={program ? "Edit program" : "New program"} onClose={onClose} wide testid="program-dialog">
      <form className="ds-stack" onSubmit={save}>
        <div className="ds-row between" style={{ marginTop: -44, marginBottom: 8, justifyContent: "flex-end" }}>
          <Button size="sm" variant="ghost" icon="undo" disabled={!u.canUndo} onClick={u.undo} testid="form-undo" title="Undo (⌘Z)">Undo</Button>
          <Button size="sm" variant="ghost" icon="redo" disabled={!u.canRedo} onClick={u.redo} testid="form-redo" title="Redo (⇧⌘Z)">Redo</Button>
        </div>
        {!program && (templates.data?.length ?? 0) > 0 && (
          <Field label="Start from a template" hint="Templates carry the design only — never a student or their data. You can change anything below.">
            <Select value="" testid="program-template" onChange={e => { const t = templates.data!.find(x => x.id === e.target.value); if (t) u.set(v => ({ ...v, name: t.name, kind: t.kind, goal: t.goal, domain: t.domain,
              instruction: t.instruction, mastery: { min_trials: 0, ...t.mastery }, targets: t.targets, config: { ...CONFIG, ...t.config } })); }}>
              <option value="">Choose a template…</option>{templates.data!.map(t => <option key={t.id} value={t.id}>{t.name} · {KIND_LABEL[t.kind]}</option>)}</Select>
          </Field>)}
        <Field label="Program name"><Input required value={f.name} onChange={e => set({ name: e.target.value })} placeholder="e.g. Manding for preferred items" testid="program-name" /></Field>
        <Field label="Name shown to families" hint={f.goal === "decrease" ? "Name what is counted, in a parent’s words: “Leaving the work area”, not “Staying in the work area”. Families see the number with “lower is better”." : "Plain words a parent would use for what is counted. Leave empty to show the program name."}><Input value={f.plain_name} onChange={e => set({ plain_name: e.target.value })} placeholder="e.g. Asking for things he wants" testid="program-plain" /></Field>
        <div className="ds-row wrap" style={{ alignItems: "flex-start", gap: 16 }}>
          <div style={{ flex: "0 0 auto" }}>
            <Field label="How is it measured?" hint={program ? "The measurement type can't change once data exists." : KIND_HINT[f.kind]}>
              {program ? <Input disabled value={KIND_LABEL[f.kind]} /> :
                <Select value={f.kind} onChange={e => set({ kind: e.target.value as Kind, ...DEFAULTS[e.target.value] })} testid="program-kind" style={{ minWidth: 200 }}>
                  {Object.entries(KIND_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </Select>}
            </Field>
          </div>
          <div className="ds-grow" style={{ minWidth: 180 }}>
            <Field label="Goal"><Segmented value={f.goal} onChange={g => set({ goal: g })} testid="program-goal" options={[{ value: "increase", label: "Increase" }, { value: "decrease", label: "Decrease" }]} /></Field>
          </div>
          <div className="ds-grow" style={{ minWidth: 160 }}><Field label="Domain"><Input value={f.domain} onChange={e => set({ domain: e.target.value })} placeholder="e.g. Communication" /></Field></div>
        </div>
        {f.kind === "interval" && (
          <Field label="Intervals" hint={{ partial: "Partial: score yes if the behaviour happened at any point. Best for behaviours to reduce (it over-estimates).", whole: "Whole: score yes only if it lasted the entire interval. Best for behaviours to increase (it under-estimates).", momentary: "Momentary: look only at the instant the interval ends. Least effort; good for long observations." }[f.config.method]}>
            <div className="ds-row wrap">
              <Select value={f.config.method} onChange={e => setC({ method: e.target.value })} style={{ width: "auto" }} testid="interval-method">
                <option value="partial">Partial interval</option><option value="whole">Whole interval</option><option value="momentary">Momentary time sampling</option></Select>
              <Input type="number" min={5} max={600} style={{ width: 80 }} value={f.config.seconds} onChange={e => setC({ seconds: +e.target.value })} /><span>seconds ×</span>
              <Input type="number" min={1} max={120} style={{ width: 80 }} value={f.config.count} onChange={e => setC({ count: +e.target.value })} /><span>intervals = {Math.round((f.config.seconds * f.config.count) / 60)} min</span>
            </div>
          </Field>)}
        {f.kind === "abc" && <div className="ds-row wrap" style={{ alignItems: "flex-start", gap: 16 }}>
          <div className="ds-grow" style={{ minWidth: 240 }}>{listField("Antecedent choices", "antecedents")}</div>
          <div className="ds-grow" style={{ minWidth: 240 }}>{listField("Consequence choices", "consequences")}</div></div>}
        {f.kind === "task" && (
          <Field label="Chaining"><Segmented value={f.config.chaining} onChange={c => setC({ chaining: c })}
            options={[{ value: "forward", label: "Forward" }, { value: "backward", label: "Backward" }, { value: "total", label: "Total task" }]} /></Field>)}
        <Field label={f.kind === "trial" || f.kind === "task" ? "Instruction (SD) for the RBT" : "Operational definition for the RBT"} hint="Shown on the recording screen.">
          <Textarea value={f.instruction} onChange={e => set({ instruction: e.target.value })} testid="program-instruction" />
        </Field>
        <Field label="Mastery rule" hint={`Reads: ${f.goal === "increase" ? "at least" : "at most"} ${formatValue(f.kind, f.mastery.value)} in ${f.mastery.n} of the last ${f.mastery.m} sessions${f.kind === "trial" && f.mastery.min_trials ? `, each with ${f.mastery.min_trials}+ trials` : ""}. The system checks this after every session.`}>
          <div className="ds-row wrap">
            <span>{f.goal === "increase" ? "At least" : "At most"}</span>
            <Input type="number" min={0} max={isPercent(f.kind) ? 100 : 100000} style={{ width: 86 }} value={f.mastery.value} onChange={e => setM({ value: +e.target.value })} testid="mastery-value" />
            <span>{unit} in</span>
            <Input type="number" min={1} max={10} style={{ width: 64 }} value={f.mastery.n} onChange={e => setM({ n: +e.target.value })} testid="mastery-n" />
            <span>of the last</span>
            <Input type="number" min={1} max={10} style={{ width: 64 }} value={f.mastery.m} onChange={e => setM({ m: +e.target.value })} testid="mastery-m" />
            <span>sessions</span>
            {f.kind === "trial" && <><span>· min</span><Input type="number" min={0} max={100} style={{ width: 64 }} value={f.mastery.min_trials} onChange={e => setM({ min_trials: +e.target.value })} /><span>trials</span></>}
          </div>
        </Field>
        {(f.kind === "trial" || f.kind === "task") && (
          <Field label={f.kind === "task" ? "Steps, in order" : "Targets"} hint={f.kind === "task" ? "Press Enter to add each step. Removed steps keep their history." : "Press Enter to add. Removed targets keep their history."}>
            <div className="chips" style={{ marginBottom: 6 }}>{f.targets.map(t => (
              <button type="button" key={t} className="chip" aria-pressed="true" onClick={() => set({ targets: f.targets.filter(x => x !== t) })} title="Remove">{t} ×</button>))}</div>
            <Input value={draft} onChange={e => setDraft(e.target.value)} placeholder="Add a target…" testid="target-input"
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTarget(); } }} onBlur={addTarget} />
          </Field>
        )}
        {error && <div className="err">{error}</div>}
        <div className="actions" style={{ alignItems: "center" }}>
          <span className="ds-tiny ds-muted ds-grow"><Kbd>⌘Z</Kbd> undo · <Kbd>⇧⌘Z</Kbd> redo</span>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={busy || f.mastery.n > f.mastery.m || (f.kind === "task" && f.targets.length < 2)} testid="program-save">{program ? "Save changes" : "Create program"}</Button>
        </div>
      </form>
    </Dialog>
  );
}
