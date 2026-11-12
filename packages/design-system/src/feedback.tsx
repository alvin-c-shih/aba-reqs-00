import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Button, Icon, Kbd } from "./primitives";

/* ── toasts (with optional Undo) ────────────────────────────────────── */
type Toast = { id: number; text: string; tone?: "bad"; action?: { label: string; run: () => void } };
const ToastCtx = createContext<(t: Omit<Toast, "id">) => void>(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setItems(x => [...x.slice(-2), { ...t, id }]);
    setTimeout(() => setItems(x => x.filter(i => i.id !== id)), t.action ? 7000 : 3500);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="ds-toasts" aria-live="polite">
        {items.map(t => (
          <div key={t.id} className={"ds-toast" + (t.tone ? " " + t.tone : "")} data-testid="toast">
            <span>{t.text}</span>
            {t.action && <button onClick={() => { t.action!.run(); setItems(x => x.filter(i => i.id !== t.id)); }}>{t.action.label}</button>}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ── hotkeys ────────────────────────────────────────────────────────── */
const typing = (e: KeyboardEvent) => {
  const t = e.target as HTMLElement;
  return t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName);
};
/** combo: "mod+k", "?", "z" … `mod` is ⌘ on macOS and Ctrl elsewhere. Plain keys are ignored while typing. */
export function useHotkey(combo: string, fn: (e: KeyboardEvent) => void, enabled = true) {
  const ref = useRef(fn); ref.current = fn;
  useEffect(() => {
    if (!enabled) return;
    const parts = combo.toLowerCase().split("+");
    const key = parts[parts.length - 1];
    const mod = parts.includes("mod"), shift = parts.includes("shift");
    const h = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== key) return;
      if (mod !== (e.metaKey || e.ctrlKey)) return;
      if (parts.length > 1 && shift !== e.shiftKey) return;
      if (!mod && typing(e)) return;
      ref.current(e);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [combo, enabled]);
}

/* ── undo / redo for forms ──────────────────────────────────────────── */
export function useUndoable<T>(initial: T) {
  const [state, setState] = useState({ past: [] as T[], present: initial, future: [] as T[] });
  const last = useRef({ at: 0, key: "" });
  /** `key` names what is being edited: consecutive changes to the same key within a second (typing) are one undo step. */
  const set = useCallback((next: T | ((p: T) => T), key = "") => setState(s => {
    const value = typeof next === "function" ? (next as (p: T) => T)(s.present) : next;
    const now = Date.now();
    const merge = !!key && key === last.current.key && now - last.current.at < 1000 && s.past.length > 0;
    last.current = { at: now, key };
    return { past: merge ? s.past : [...s.past, s.present].slice(-100), present: value, future: [] };
  }), []);
  const undo = useCallback(() => setState(s => s.past.length ? { past: s.past.slice(0, -1), present: s.past[s.past.length - 1], future: [s.present, ...s.future] } : s), []);
  const redo = useCallback(() => setState(s => s.future.length ? { past: [...s.past, s.present], present: s.future[0], future: s.future.slice(1) } : s), []);
  const reset = useCallback((v: T) => setState({ past: [], present: v, future: [] }), []);
  return { value: state.present, set, undo, redo, reset, canUndo: state.past.length > 0, canRedo: state.future.length > 0, dirty: state.past.length > 0 };
}

/* ── command palette ────────────────────────────────────────────────── */
export type Command = { id: string; label: string; group?: string; icon?: string; keywords?: string; run: () => void };
export function CommandPalette({ commands, onClose }: { commands: Command[]; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const list = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    return commands.filter(c => words.every(w => (c.label + " " + (c.group ?? "") + " " + (c.keywords ?? "")).toLowerCase().includes(w)));
  }, [q, commands]);
  useEffect(() => setSel(0), [q]);
  const run = (c?: Command) => { if (c) { onClose(); c.run(); } };
  return (
    <div className="ds-scrim" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="ds-cmd" role="dialog" aria-label="Command palette" data-testid="command-palette">
        <input autoFocus placeholder="Search pages, students and actions…" value={q} onChange={e => setQ(e.target.value)} data-testid="command-input"
          onKeyDown={e => {
            if (e.key === "ArrowDown") { e.preventDefault(); setSel(s => Math.min(s + 1, list.length - 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setSel(s => Math.max(s - 1, 0)); }
            else if (e.key === "Enter") run(list[sel]);
            else if (e.key === "Escape") onClose();
          }} />
        <ul role="listbox">
          {list.slice(0, 40).map((c, i) => (
            <li key={c.id} role="option" aria-selected={i === sel} onMouseEnter={() => setSel(i)} onClick={() => run(c)}>
              <Icon name={c.icon ?? "arrowRight"} size={16} /><span>{c.label}</span><span className="grp">{c.group}</span>
            </li>
          ))}
          {!list.length && <li className="ds-muted">Nothing matches “{q}”</li>}
        </ul>
        <div className="foot"><span><Kbd>↑</Kbd> <Kbd>↓</Kbd> move</span><span><Kbd>↵</Kbd> open</span><span><Kbd>esc</Kbd> close</span></div>
      </div>
    </div>
  );
}

/* ── guided tour ────────────────────────────────────────────────────── */
export type TourStep = { target?: string; title: string; body: ReactNode; route?: string };
export type TourDef = { id: string; name: string; steps: TourStep[] };
type TourApi = { start: (t: TourDef) => void; active: string | null };
const TourCtx = createContext<TourApi>({ start: () => {}, active: null });
export const useTour = () => useContext(TourCtx);

export function TourProvider({ children, navigate, onFinish }: { children: ReactNode; navigate: (to: string) => void; onFinish: (id: string, completed: boolean) => void }) {
  const [tour, setTour] = useState<TourDef | null>(null);
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const step = tour?.steps[i];

  const end = useCallback((completed: boolean) => { if (tour) onFinish(tour.id, completed); setTour(null); setRect(null); }, [tour, onFinish]);

  // locate the target (waiting briefly for route changes / data to render)
  useLayoutEffect(() => {
    if (!step) return;
    if (step.route) navigate(step.route);
    let tries = 0, raf = 0, stop = false;
    const find = () => {
      if (stop) return;
      const el = step.target ? document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`) : null;
      if (el) { el.scrollIntoView({ block: "center", behavior: "smooth" }); setTimeout(() => !stop && setRect(el.getBoundingClientRect()), 260); }
      else if (step.target && tries++ < 40) raf = window.setTimeout(find, 60);
      else setRect(null);
    };
    setRect(null); find();
    const re = () => { const el = step.target && document.querySelector(`[data-tour="${step.target}"]`); if (el) setRect(el.getBoundingClientRect()); };
    window.addEventListener("resize", re); window.addEventListener("scroll", re, true);
    return () => { stop = true; clearTimeout(raf); window.removeEventListener("resize", re); window.removeEventListener("scroll", re, true); };
  }, [step]);  // eslint-disable-line

  useEffect(() => {
    if (!tour) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") end(false);
      else if (e.key === "ArrowRight" || e.key === "Enter") { e.preventDefault(); i < tour.steps.length - 1 ? setI(i + 1) : end(true); }
      else if (e.key === "ArrowLeft" && i > 0) setI(i - 1);
    };
    window.addEventListener("keydown", h, true);
    return () => window.removeEventListener("keydown", h, true);
  }, [tour, i, end]);

  const api = useMemo(() => ({ start: (t: TourDef) => { setI(0); setTour(t); }, active: tour?.id ?? null }), [tour]);
  const pad = 6, W = 340;
  let card: React.CSSProperties = { top: "50%", left: "50%", transform: "translate(-50%,-50%)" };
  if (rect) {
    const below = rect.bottom + 190 < window.innerHeight || rect.top < 200;
    card = { left: Math.max(12, Math.min(rect.left, window.innerWidth - W - 12)), ...(below ? { top: rect.bottom + pad + 10 } : { top: Math.max(12, rect.top - pad - 10), transform: "translateY(-100%)" }) };
  }
  return (
    <TourCtx.Provider value={api}>
      {children}
      {tour && step && (
        <>
          {rect ? <div className="ds-tour-hole" style={{ top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }} />
                : <div className="ds-scrim" style={{ zIndex: 80 }} />}
          <div className="ds-tour-card" style={card} role="dialog" aria-label={`Tour: ${tour.name}`} data-testid="tour-card">
            <div className="ds-eyebrow" style={{ marginBottom: 6 }}>{tour.name} · {i + 1} of {tour.steps.length}</div>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
            <div className="foot">
              <div className="ds-tour-dots">{tour.steps.map((_, k) => <i key={k} className={k === i ? "on" : ""} />)}</div>
              <Button size="sm" variant="ghost" onClick={() => end(false)} testid="tour-skip">Skip</Button>
              {i > 0 && <Button size="sm" onClick={() => setI(i - 1)}>Back</Button>}
              <Button size="sm" variant="primary" testid="tour-next" onClick={() => i < tour.steps.length - 1 ? setI(i + 1) : end(true)}>
                {i < tour.steps.length - 1 ? "Next" : "Done"}
              </Button>
            </div>
          </div>
        </>
      )}
    </TourCtx.Provider>
  );
}
