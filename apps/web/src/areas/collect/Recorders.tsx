/* Phase 2 recording methods. Each recorder writes through the same local-first store as trials. */
import { useEffect, useRef, useState } from "react";
import { Badge, Button, Icon, Input, OUTCOMES, OutcomeDot, useHotkey, type Outcome } from "@aba/design-system";
import { liveObs, record, setTimer, useCollect, type LocalSession } from "./store";

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.max(0, Math.floor(s % 60))).padStart(2, "0")}`;
const QUESTION: Record<string, string> = {
  partial: "Did it happen at any point in this interval?",
  whole: "Did it last for the whole interval?",
  momentary: "Is it happening right now?",
};

/** Interval recording: a countdown per interval, a cue when it ends, then one tap (Yes / No). */
export function IntervalRecorder({ p, session, active }: { p: any; session: LocalSession; active: boolean }) {
  const st = useCollect();
  const cfg = { method: "partial", seconds: 30, count: 20, ...p.config };
  const live = liveObs(session.id, p.id, st);
  const started = st.timers[p.id];
  const [now, setNow] = useState(Date.now());
  const [early, setEarly] = useState(false);          // partial interval: "yes" can be noted before the interval ends
  const cued = useRef(0);
  useEffect(() => { if (!started) return; const t = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(t); }, [started]);
  const left = started ? cfg.seconds - (now - started) / 1000 : cfg.seconds;
  const done = live.length >= cfg.count, due = !!started && left <= 0;

  const score = (hit: boolean) => {
    record(session, { program_id: p.id, kind: "interval", hit });
    setEarly(false);
    setTimer(p.id, live.length + 1 >= cfg.count ? null : Date.now());
  };
  useEffect(() => {
    if (!due || cued.current === started) return;
    cued.current = started!; navigator.vibrate?.([120, 60, 120]);
    if (early) score(true);
  }, [due]);  // eslint-disable-line
  useHotkey("y", () => due && score(true), active && !done);
  useHotkey("n", () => due && score(false), active && !done);
  useHotkey(" ", e => { if (!started && !done) { e.preventDefault(); setTimer(p.id, Date.now()); } }, active);

  const hits = live.filter(o => o.hit).length;
  return (
    <div className="ds-stack" style={{ alignItems: "center", textAlign: "center" }} data-testid="interval-recorder">
      <div className="ds-small ds-muted">{cfg.method} interval · {cfg.seconds}s × {cfg.count}</div>
      <div className="bigcount" data-testid="interval-clock" style={{ color: due ? "var(--accent)" : undefined }}>{done ? "Done" : clock(Math.ceil(Math.max(left, 0)))}</div>
      <div className="ds-small"><b className="ds-num" data-testid="interval-count">{live.length}</b> of {cfg.count} scored · <b className="ds-num">{live.length ? Math.round((100 * hits) / live.length) : 0}%</b> with behaviour</div>
      {!started && !done && <button className="tally" onClick={() => setTimer(p.id, Date.now())} data-testid="interval-start">{live.length ? "Resume" : "Start intervals"}</button>}
      {started && !done && <>
        <div style={{ fontWeight: 650, minHeight: 24 }}>{due ? QUESTION[cfg.method] : early ? "Noted — recording at the end of the interval" : `Observe… interval ${live.length + 1}`}</div>
        <div className="outcomes" style={{ width: "100%" }}>
          <button className="outcome" disabled={!due && (cfg.method !== "partial" || early)} style={{ background: "var(--bad-soft)", color: "var(--bad)", opacity: !due && (cfg.method !== "partial" || early) ? 0.45 : 1 }}
            onClick={() => (due ? score(true) : setEarly(true))} data-testid="interval-yes"><span className="k">Y</span><Icon name="check" size={26} />Yes</button>
          <button className="outcome" disabled={!due} style={{ background: "var(--slate-soft)", color: "var(--slate)", opacity: due ? 1 : 0.45 }} onClick={() => score(false)} data-testid="interval-no">
            <span className="k">N</span><Icon name="minus" size={26} />No</button>
        </div>
        <Button variant="ghost" size="sm" onClick={() => { setTimer(p.id, null); setEarly(false); }}>Pause</Button>
      </>}
      <div className="tape" style={{ justifyContent: "center" }}>{live.map(o => <span key={o.id} title={o.hit ? "Yes" : "No"} style={{ width: 14, height: 14, borderRadius: 4, background: o.hit ? "var(--bad)" : "var(--line-strong)" }} />)}</div>
    </div>
  );
}

/** ABC data: what happened before and after each incident. Two taps and an optional note. */
export function AbcRecorder({ p, session }: { p: any; session: LocalSession }) {
  const st = useCollect();
  const live = liveObs(session.id, p.id, st);
  const [a, setA] = useState(""), [c, setC] = useState(""), [note, setNote] = useState("");
  const ants: string[] = p.config?.antecedents ?? [], cons: string[] = p.config?.consequences ?? [];
  const log = () => {
    record(session, { program_id: p.id, kind: "abc", data: { antecedent: a, behavior: p.name, consequence: c, ...(note.trim() ? { note: note.trim() } : {}) } });
    setA(""); setC(""); setNote("");
  };
  const group = (label: string, items: string[], value: string, set: (v: string) => void, id: string) => (
    <div>
      <div className="ds-label" style={{ marginBottom: 6 }}>{label}</div>
      <div className="chips">{items.map(x => <button key={x} className="chip" style={{ padding: "8px 12px", fontSize: 13 }} aria-pressed={value === x} onClick={() => set(value === x ? "" : x)} data-testid={`${id}-${items.indexOf(x)}`}>{x}</button>)}</div>
    </div>
  );
  return (
    <div className="ds-stack" data-testid="abc-recorder">
      {group("Antecedent — what happened just before?", ants, a, setA, "abc-a")}
      {group("Consequence — what happened right after?", cons, c, setC, "abc-c")}
      <Input placeholder="Note (optional)" value={note} onChange={e => setNote(e.target.value)} maxLength={280} testid="abc-note" />
      <Button variant="primary" size="lg" block icon="plus" disabled={!a || !c} onClick={log} testid="abc-log">Log incident</Button>
      <div className="ds-small"><b className="ds-num" data-testid="abc-count">{live.length}</b> incident{live.length === 1 ? "" : "s"} this session</div>
      {live.slice(-3).reverse().map(o => <div key={o.id} className="ds-tiny ds-muted">{o.data?.antecedent} → <b>behaviour</b> → {o.data?.consequence}</div>)}
    </div>
  );
}

/** Task analysis: score each step of the chain in order; start another run when the chain is complete. */
export function TaskRecorder({ p, session, active }: { p: any; session: LocalSession; active: boolean }) {
  const st = useCollect();
  const steps: any[] = p.targets;
  const live = liveObs(session.id, p.id, st);
  const n = Math.max(steps.length, 1), run = Math.floor(live.length / n), at = live.length % n;
  const complete = live.length > 0 && at === 0;
  const [again, setAgain] = useState(false);
  const current = complete && !again ? live.slice(-n) : live.slice(run * n);
  const showDone = complete && !again;
  const score = (o: Outcome) => { record(session, { program_id: p.id, kind: "step", outcome: o, target_id: steps[at]?.id ?? null }); setAgain(false); };
  useHotkey("1", () => !showDone && score("correct"), active);
  useHotkey("2", () => !showDone && score("prompted"), active);
  useHotkey("3", () => !showDone && score("incorrect"), active);
  const independent = current.filter(o => o.outcome === "correct").length;
  return (
    <div className="ds-stack" data-testid="task-recorder">
      <div className="ds-row between"><span className="ds-small ds-muted">{p.config?.chaining ?? "forward"} chaining · run {showDone ? run : run + 1}</span>
        <span className="ds-small"><b className="ds-num" data-testid="task-pct">{current.length ? Math.round((100 * independent) / current.length) : 0}%</b> independent</span></div>
      <div className="ds-stack" style={{ gap: 4 }}>
        {steps.map((s, i) => {
          const o = current[i];
          return (
            <div key={s.id} className="ds-row" style={{ padding: "7px 10px", borderRadius: 10, background: !showDone && i === at ? "var(--accent-soft)" : "transparent", fontWeight: !showDone && i === at ? 650 : 400 }}>
              <span className="ds-num ds-muted" style={{ width: 18 }}>{i + 1}</span><span className="ds-grow ds-small">{s.label}</span>
              {o ? <OutcomeDot outcome={o.outcome as Outcome} /> : <span style={{ width: 22 }} />}
            </div>
          );
        })}
      </div>
      {showDone
        ? <><Badge tone="ok" icon="check">Chain complete — {independent} of {n} steps independent</Badge><Button size="lg" block onClick={() => setAgain(true)} testid="task-again">Run the chain again</Button></>
        : <div className="outcomes" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
          {(["correct", "prompted", "incorrect"] as Outcome[]).map(o => (
            <button key={o} className="outcome" style={{ height: 76, fontSize: 14, background: OUTCOMES[o].soft, color: OUTCOMES[o].color }} onClick={() => score(o)} data-testid={`step-${o}`}>
              <span className="k">{OUTCOMES[o].key}</span><Icon name={OUTCOMES[o].icon} size={22} />{o === "correct" ? "Independent" : OUTCOMES[o].label}
            </button>))}
        </div>}
    </div>
  );
}
