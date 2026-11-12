import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, Card, Dialog, Icon, KIND_ICON, Kbd, OUTCOMES, OutcomeDot, Segmented, Sparkline, Textarea, formatValue, isPercent, useHotkey, useToast, type Outcome } from "@aba/design-system";
import { useAuth } from "../../lib/auth";
import { upload } from "../../lib/api";
import { usePageTour } from "../../shell/Shell";
import { TOURS } from "../../shell/tours";
import { Dictate } from "../shared/Dictate";
import { SyncPill } from "./SyncPill";
import { AbcRecorder, IntervalRecorder, TaskRecorder } from "./Recorders";
import { activeSession, checkLock, endSession, init, liveObs, online, pendingCount, record, setTimer, startSession, undoLast, useCollect, type LocalSession } from "./store";

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
function useNow(active: boolean) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { if (!active) return; const t = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(t); }, [active]);
  return now;
}

export function SessionScreen() {
  const { studentId } = useParams();
  const { me } = useAuth();
  const st = useCollect();
  useEffect(() => { init(me!.id); }, [me]);
  const student = st.bundle?.students.find((s: any) => s.id === studentId);
  const session = activeSession(studentId!, st);
  if (!st.ready) return null;
  if (!student) return <div className="phone"><SyncPill /><Card><p>This student isn't on your list. <Link to="/collect">Back to today</Link></p></Card></div>;
  return <div className="phone"><SyncPill />{session ? <Recorder student={student} session={session} /> : <Start student={student} />}</div>;
}

function Start({ student }: { student: any }) {
  const [kind, setKind] = useState<"direct" | "probe">("direct"), [setting, setSetting] = useState("school");
  const [conflict, setConflict] = useState<any>(null), [busy, setBusy] = useState(false);
  const toast = useToast();
  const go = async (takeover = false) => {
    setBusy(true);
    try { await startSession(student.id, kind, setting, takeover); setConflict(null); }
    catch (e: any) { if (e.status === 409 && e.data?.code === "locked") setConflict(e.data); else toast({ text: e.message, tone: "bad" }); }
    finally { setBusy(false); }
  };
  return (
    <>
      <Link to="/collect" className="ds-small ds-row" style={{ margin: "6px 0 10px" }}><Icon name="arrowLeft" size={14} /> Today</Link>
      <h1>{student.first_name} {student.last_name[0]}.</h1>
      <p className="ds-muted ds-small" style={{ marginBottom: 16 }}>{student.site} · {student.programs.length} active programs</p>
      <Card>
        <div className="ds-stack">
          <div><div className="ds-label" style={{ marginBottom: 6 }}>Session type</div>
            <Segmented value={kind} onChange={setKind} testid="session-kind" options={[{ value: "direct", label: "Teaching" }, { value: "probe", label: "Probe (no prompts)" }]} /></div>
          <div><div className="ds-label" style={{ marginBottom: 6 }}>Where</div>
            <Segmented value={setting} onChange={setSetting} options={[{ value: "school", label: "School" }, { value: "home", label: "Home" }, { value: "community", label: "Community" }]} /></div>
          <Button variant="primary" size="lg" block icon="play" disabled={busy || !student.programs.length} onClick={() => go()} testid="start-session">Start session</Button>
          {!online() && <p className="ds-tiny ds-muted">Offline: the session starts with a provisional lock. If someone else was recording {student.first_name} at the same time, your BCBA reviews which data counts — nothing is lost.</p>}
          {!student.programs.length && <p className="ds-small ds-muted">No active programs yet — ask the BCBA to add one.</p>}
        </div>
      </Card>
      <div className="ds-eyebrow" style={{ margin: "20px 0 8px" }}>Programs</div>
      <div className="ds-stack" style={{ gap: 8 }}>
        {student.programs.map((p: any) => (
          <Card key={p.id}><div className="ds-row"><span className="ds-muted"><Icon name={KIND_ICON[p.kind]} /></span>
            <div className="ds-grow"><b className="ds-small">{p.name}</b><div className="ds-tiny ds-muted">last {formatValue(p.kind, p.last)} · criterion {formatValue(p.kind, p.mastery.value)}</div></div>
            <span className="ds-muted"><Sparkline values={p.spark} criterion={p.mastery.value} max={isPercent(p.kind) ? 100 : undefined} width={72} /></span></div></Card>))}
      </div>
      {conflict && (
        <Dialog title={`${conflict.holder} is recording ${student.first_name}`} onClose={() => setConflict(null)} testid="lock-dialog">
          <p>They started at {new Date(conflict.since).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}. Only one person records a student at a time.</p>
          <div className="callout warn" style={{ marginTop: 12 }}><Icon name="lock" /><span><b>Taking over</b> makes your data the one that counts. {conflict.holder} is told, and anything they record afterwards goes to the BCBA for review.</span></div>
          <div className="actions"><Button onClick={() => setConflict(null)}>Cancel</Button><Button variant="danger" disabled={busy} onClick={() => go(true)} testid="takeover">Take over session</Button></div>
        </Dialog>
      )}
    </>
  );
}

function Recorder({ student, session }: { student: any; session: LocalSession }) {
  const st = useCollect();
  const nav = useNavigate(), toast = useToast();
  const programs: any[] = student.programs;
  const [pid, setPid] = useState(programs[0]?.id);
  const [ending, setEnding] = useState(false), [note, setNote] = useState(""), [flash, setFlash] = useState<string | null>(null);
  const noteBox = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { const el = noteBox.current; if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + 2 + "px"; } }, [note, ending]);   // the note box grows with its text
  const [targetIx, setTargetIx] = useState(0);
  const now = useNow(true);
  const p = programs.find(x => x.id === pid) ?? programs[0];
  const live = useMemo(() => liveObs(session.id, p.id, st), [st.obs, session.id, p.id]);  // eslint-disable-line
  const lost = st.lockLost[student.id];
  usePageTour(TOURS.session);
  useEffect(() => { checkLock(); }, []);
  useEffect(() => setTargetIx(0), [pid]);

  const target = p.targets[targetIx % Math.max(p.targets.length, 1)];
  const trial = (o: Outcome) => {
    record(session, { program_id: p.id, kind: "trial", outcome: o, target_id: target?.id ?? null });
    setFlash(o); setTimeout(() => setFlash(null), 350);
    if (p.targets.length > 1) setTargetIx(i => i + 1);   // rotate targets automatically
  };
  const running = st.timers[p.id];
  const toggleTimer = () => {
    if (running) { record(session, { program_id: p.id, kind: "duration", seconds: Math.max(1, Math.round((Date.now() - running) / 1000)) }); setTimer(p.id, null); }
    else setTimer(p.id, Date.now());
  };
  const undo = () => {
    const u = undoLast(session, p.id);
    toast({ text: u ? `Undid last ${u.kind === "trial" || u.kind === "step" ? OUTCOMES[u.outcome as Outcome].label.toLowerCase() : ({ event: "count", duration: "timing", interval: "interval", abc: "incident" } as any)[u.kind]}` : "Nothing to undo in this program" });
  };
  const outcomes = (Object.keys(OUTCOMES) as Outcome[]).filter(o => !(session.kind === "probe" && o === "prompted"));
  useHotkey("1", () => p.kind === "trial" && trial("correct"), !ending);
  useHotkey("2", () => p.kind === "trial" && session.kind !== "probe" && trial("prompted"), !ending);
  useHotkey("3", () => p.kind === "trial" && trial("incorrect"), !ending);
  useHotkey("4", () => p.kind === "trial" && trial("no_response"), !ending);
  useHotkey(" ", e => { if (p.kind === "frequency") { e.preventDefault(); record(session, { program_id: p.id, kind: "event" }); } else if (p.kind === "duration") { e.preventDefault(); toggleTimer(); } }, !ending);
  useHotkey("u", undo, !ending);

  const finish = async () => {
    Object.keys(st.timers).forEach(id => { if (programs.some(x => x.id === id && x.kind === "interval")) setTimer(id, null); else if (programs.some(x => x.id === id)) { record(session, { program_id: id, kind: "duration", seconds: Math.max(1, Math.round((Date.now() - st.timers[id]) / 1000)) }); setTimer(id, null); } });
    const count = st.obs.filter(o => o.session_id === session.id).length;
    await endSession(session, note, programs);
    toast({ text: pendingCount() ? `Session saved on this device (${count} items) — will sync when online` : "Session saved · server confirmed" });
    nav("/collect");
  };
  const correct = live.filter(o => o.outcome === "correct").length;
  const elapsed = (now - +new Date(session.started_at)) / 1000;
  const total = live.reduce((a, o) => a + (o.seconds ?? 0), 0);

  return (
    <>
      <div className="ds-row between" style={{ margin: "6px 0 10px" }}>
        <div><h1 style={{ fontSize: 22 }}>{student.first_name} {student.last_name[0]}.</h1>
          <div className="ds-small ds-muted">{session.kind === "probe" ? "Probe" : "Teaching"} session · <span className="ds-num" data-testid="elapsed">{clock(elapsed)}</span>
            {session.lock_epoch == null && " · started offline"}</div></div>
      </div>
      {lost && <div className="lockbar" data-testid="lock-lost"><Icon name="lock" /><span>{lost} took over this session. You can keep recording — your data is saved and goes to the BCBA for review.</span></div>}

      <div className={"progtabs" + (programs.length === 1 ? " one" : "")} data-tour="programs">
        {programs.map(x => (
          <button key={x.id} className="progtab" aria-pressed={x.id === p.id} onClick={() => setPid(x.id)} title={x.name} data-testid={`tab-${x.kind}`}>
            <Icon name={KIND_ICON[x.kind]} size={14} /><span className="name">{x.name}</span><span className="n">{liveObs(session.id, x.id, st).length || ""}</span>{st.timers[x.id] && <span style={{ color: "var(--bad)" }}>●</span>}
          </button>))}
      </div>

      <Card data-tour="recorder" data-testid="recorder">
        {p.instruction && <p className="ds-small ds-muted" style={{ marginBottom: 12 }}>{p.instruction}</p>}
        {p.kind === "trial" && <>
          {p.targets.length > 0 && <div className="chips" style={{ marginBottom: 12 }}>{p.targets.map((t: any, i: number) => (
            <button key={t.id} className="chip" aria-pressed={t.id === target?.id} onClick={() => setTargetIx(i)}>{t.label}</button>))}</div>}
          <div className="outcomes">
            {outcomes.map(o => (
              <button key={o} className={`outcome${flash === o ? " flash" : ""}`} style={{ background: OUTCOMES[o].soft, color: OUTCOMES[o].color, borderColor: flash === o ? OUTCOMES[o].color : "transparent" }}
                onClick={() => trial(o)} data-testid={`outcome-${o}`}>
                <span className="k">{OUTCOMES[o].key}</span><Icon name={OUTCOMES[o].icon} size={26} />{OUTCOMES[o].label}
              </button>))}
          </div>
          <div className="ds-row between" style={{ margin: "14px 0 8px" }}>
            <span className="ds-small"><b className="ds-num" data-testid="trial-count">{live.length}</b> trials</span>
            <span className="ds-small"><b className="ds-num" data-testid="trial-pct">{live.length ? Math.round((100 * correct) / live.length) : 0}%</b> independent <span className="ds-muted">({correct}/{live.length})</span></span>
          </div>
          <div className="tape" data-testid="tape">{live.map(o => <OutcomeDot key={o.id} outcome={o.outcome as Outcome} />)}</div>
        </>}
        {p.kind === "frequency" && <div className="ds-stack" style={{ alignItems: "center", textAlign: "center" }}>
          <div className="bigcount" data-testid="freq-count">{live.length}</div>
          <div className="ds-small ds-muted">this session · {elapsed > 60 ? `${(live.length / (elapsed / 3600)).toFixed(1)} per hour` : "rate appears after a minute"}</div>
          <button className="tally" onClick={() => record(session, { program_id: p.id, kind: "event" })} data-testid="tally">＋1 &nbsp;<span style={{ opacity: .7, fontSize: 13 }}>tap or Space</span></button>
        </div>}
        {p.kind === "duration" && <div className="ds-stack" style={{ alignItems: "center", textAlign: "center" }}>
          <div className="bigcount" data-testid="timer">{clock(running ? (now - running) / 1000 : 0)}</div>
          <div className="ds-small ds-muted">{live.length} timed · total {formatValue("duration", total)}</div>
          <button className={`tally${running ? " running" : ""}`} onClick={toggleTimer} data-testid="timer-toggle">{running ? "Stop" : "Start timer"}</button>
        </div>}
        {p.kind === "interval" && <IntervalRecorder key={p.id} p={p} session={session} active={!ending} />}
        {p.kind === "abc" && <AbcRecorder key={p.id} p={p} session={session} />}
        {p.kind === "task" && <TaskRecorder key={p.id} p={p} session={session} active={!ending} />}
      </Card>
      <p className="ds-tiny ds-muted" style={{ textAlign: "center", marginTop: 10 }}>
        {p.kind === "trial" ? <>Keys <Kbd>1</Kbd>–<Kbd>4</Kbd> record · </> : p.kind === "task" ? <>Keys <Kbd>1</Kbd>–<Kbd>3</Kbd> record · </> : p.kind === "interval" ? <><Kbd>Y</Kbd> / <Kbd>N</Kbd> score · </> : p.kind === "abc" ? null : <><Kbd>Space</Kbd> records · </>}<Kbd>U</Kbd> undoes · last {formatValue(p.kind, p.last)} · criterion {formatValue(p.kind, p.mastery.value)}
        {online() && <> · <Link to={`/clinic/programs/${p.id}`}>graph</Link></>}
      </p>

      {online() && <div style={{ textAlign: "center", marginTop: 8 }}>
        <label className="ds-btn sm ghost" style={{ cursor: "pointer" }}><Icon name="camera" size={14} />Add a photo
          <input type="file" accept="image/*" capture="environment" hidden data-testid="photo-input" onChange={async e => {
            const f = e.target.files?.[0]; if (!f) return;
            try { await upload(`/clinic/students/${student.id}/media?session_id=${session.id}&caption=${encodeURIComponent("Session photo")}`, f); toast({ text: "Photo added to the student’s record" }); }
            catch (err: any) { toast({ text: err.message, tone: "bad" }); }
            e.target.value = "";
          }} /></label>
      </div>}

      <div className="dock"><div>
        <span data-tour="undo" className="ds-grow"><Button size="lg" block icon="undo" onClick={undo} disabled={!live.length} testid="undo-last">Undo last</Button></span>
        <span data-tour="end" className="ds-grow"><Button size="lg" block variant="primary" icon="stop" onClick={() => setEnding(true)} testid="end-session">End session</Button></span>
      </div></div>

      {ending && (
        <Dialog title="End this session?" onClose={() => setEnding(false)} testid="end-dialog">
          <div className="ds-stack">
            <div className="ds-small">{programs.map(x => { const n = liveObs(session.id, x.id, st).length; return <div key={x.id} className="ds-row between"><span>{x.name}</span><b className="ds-num">{n} {({ trial: "trials", frequency: "counted", duration: "timed", interval: "intervals", abc: "incidents", task: "steps" } as any)[x.kind]}</b></div>; })}</div>
            <Textarea ref={noteBox} rows={4} style={{ maxHeight: "40vh" }} placeholder="Session note (optional)" value={note} onChange={e => setNote(e.target.value)} data-testid="session-note" />
            {online() && <div className="ds-row"><Dictate onText={text => setNote(n => (n ? n.trimEnd() + " " : "") + text)} /></div>}
            {!online() && <div className="callout"><Icon name="wifiOff" />You're offline. The session is saved on this device and syncs automatically.</div>}
          </div>
          <div className="actions"><Button onClick={() => setEnding(false)}>Keep recording</Button><Button variant="primary" onClick={finish} testid="end-confirm">End &amp; save</Button></div>
        </Dialog>
      )}
    </>
  );
}
