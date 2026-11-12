import { useEffect, useRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

/* ── icons: one stroke style, 20px grid ─────────────────────────────── */
const PATHS: Record<string, string> = {
  check: "M4 10.5l4 4 8-9",
  x: "M5 5l10 10M15 5L5 15",
  minus: "M5 10h10",
  plus: "M10 4v12M4 10h12",
  half: "M10 3a7 7 0 100 14V3z M10 3a7 7 0 010 14",
  circle: "M10 3a7 7 0 100 14 7 7 0 000-14z",
  users: "M7.5 9a3 3 0 100-6 3 3 0 000 6zM2 17c0-3 2.5-5 5.5-5s5.5 2 5.5 5M13 3.3a3 3 0 010 5.4M15 12.3c1.8.6 3 2.3 3 4.7",
  user: "M10 9a3 3 0 100-6 3 3 0 000 6zM4 17c0-3 2.7-5 6-5s6 2 6 5",
  home: "M3 9l7-6 7 6v8H3V9zM8 17v-5h4v5",
  building: "M4 17V4h8v13M12 8h4v9M2 17h16M7 7h2M7 10h2M7 13h2",
  chart: "M3 17h14M5 13l3-4 3 2 4-6",
  bars: "M4 17V9M8 17V5M12 17v-6M16 17V8",
  shield: "M10 2.5l6 2.5v4.5c0 4-2.7 6.7-6 8-3.3-1.3-6-4-6-8V5l6-2.5z",
  pulse: "M2 10h4l2-5 3 10 2-5h5",
  list: "M7 5h10M7 10h10M7 15h10M3.5 5h.01M3.5 10h.01M3.5 15h.01",
  clock: "M10 3a7 7 0 100 14 7 7 0 000-14zM10 6v4l3 2",
  lock: "M5 9h10v8H5V9zM7 9V6.5a3 3 0 016 0V9",
  help: "M10 3a7 7 0 100 14 7 7 0 000-14zM8 8a2 2 0 113 1.7c-.6.4-1 .8-1 1.6M10 14h.01",
  search: "M9 3a6 6 0 100 12A6 6 0 009 3zM13.5 13.5L17 17",
  undo: "M7 5L3 9l4 4M3 9h8a5 5 0 010 10H9",
  redo: "M13 5l4 4-4 4M17 9H9a5 5 0 000 10h2",
  refresh: "M16 10a6 6 0 11-2-4.5M16 3v3.5h-3.5",
  play: "M6 4l10 6-10 6V4z",
  stop: "M5 5h10v10H5z",
  wifi: "M2.5 8a11 11 0 0115 0M5 11a7 7 0 0110 0M7.7 13.8a3.2 3.2 0 014.6 0M10 16.5h.01",
  wifiOff: "M3 3l14 14M5 11a7 7 0 013-1.8M12 9.2A7 7 0 0115 11M2.5 8a11 11 0 013-2.2M9 5a11 11 0 018.5 3M7.7 13.8a3.2 3.2 0 014.6 0M10 16.5h.01",
  flag: "M5 17V3M5 4h9l-1.5 3L14 10H5",
  note: "M4 4h12v9l-4 4H4V4zM12 17v-4h4",
  arrowRight: "M4 10h12M11 5l5 5-5 5",
  arrowLeft: "M16 10H4M9 5l-5 5 5 5",
  chevron: "M7 5l5 5-5 5",
  logout: "M8 4H4v12h4M13 6l4 4-4 4M17 10H8",
  sparkle: "M10 3l1.6 4.4L16 9l-4.4 1.6L10 15l-1.6-4.4L4 9l4.4-1.6L10 3z",
  database: "M4 5.5C4 4 6.7 3 10 3s6 1 6 2.5S13.3 8 10 8 4 7 4 5.5zM4 5.5v9C4 16 6.7 17 10 17s6-1 6-2.5v-9M4 10c0 1.5 2.7 2.5 6 2.5s6-1 6-2.5",
  pin: "M10 17s5-4.5 5-8.5a5 5 0 00-10 0c0 4 5 8.5 5 8.5zM10 10.2a1.7 1.7 0 100-3.4 1.7 1.7 0 000 3.4z",
  palette: "M10 3a7 7 0 000 14c1 0 1.5-.6 1.5-1.4 0-1 .2-1.6 1.5-1.6h1.5A2.5 2.5 0 0017 11.5C17 6.8 13.900 3 10 3zM6.500 10h.01M8 6.500h.01M12 6.500h.01",
  edit: "M4 16l1-4 8.5-8.5 3 3L8 15l-4 1zM12 5l3 3",
  trash: "M4 6h12M8 6V4h4v2M6 6l1 11h6l1-11",
  sun: "M10 6.5a3.500 3.500 0 100 7 3.500 3.500 0 000-7zM10 2v1.5M10 16.500V18M2 10h1.500M16.500 10H18M4.300 4.300l1.100 1.100M14.600 14.600l1.100 1.100M4.300 15.700l1.100-1.100M14.600 5.400l1.100-1.100",
  inbox: "M3 11l2.500-7h9L17 11v5H3v-5zM3 11h4l1 2h4l1-2h4",
  keyboard: "M2 6h16v9H2V6zM5 9h.01M8 9h.01M11 9h.01M14 9h.01M6 12h8",
  bell: "M5 14V9a5 5 0 0110 0v5l1.5 2h-13L5 14zM8.5 17.5a1.5 1.5 0 003 0",
  chat: "M3 4h14v10H9l-4 3v-3H3V4z",
  print: "M6 7V3h8v4M6 14H4V8h12v6h-2M6 12h8v5H6v-5z",
  download: "M10 3v10M6 9l4 4 4-4M4 17h12",
  camera: "M3 6h3l1.5-2h5L14 6h3v10H3V6zM10 13.5a3 3 0 100-6 3 3 0 000 6z",
  mic: "M10 3a2 2 0 00-2 2v5a2 2 0 004 0V5a2 2 0 00-2-2zM5 10a5 5 0 0010 0M10 15v2.5",
  heart: "M10 16.5S3.5 12.5 3.5 7.8A3.3 3.3 0 0110 6a3.3 3.3 0 016.5 1.8c0 4.700-6.500 8.700-6.500 8.700z",
  upload: "M10 13V3M6 7l4-4 4 4M4 17h12",
  file: "M5 3h7l3 3v11H5V3zM12 3v3h3",
};
export type IconName = keyof typeof PATHS;
export function Icon({ name, size = 18, className }: { name: IconName | string; size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name] ?? PATHS.circle} />
    </svg>
  );
}

/* ── buttons & form controls ────────────────────────────────────────── */
type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "primary" | "danger" | "ghost"; size?: "sm" | "md" | "lg"; icon?: string; block?: boolean; testid?: string;
};
export function Button({ variant = "default", size = "md", icon, block, testid, className, children, ...rest }: BtnProps) {
  return (
    <button type="button" data-testid={testid} {...rest}
      className={cx("ds-btn", variant !== "default" && variant, size !== "md" && size, !children && "icon", block && "block", className)}>
      {icon && <Icon name={icon} size={size === "sm" ? 14 : 16} />}
      {children}
    </button>
  );
}

export function Field({ label, hint, error, children }: { label: string; hint?: ReactNode; error?: string | null; children: ReactNode }) {
  return (
    <div className="ds-field">
      <label>{label}</label>
      {children}
      {error ? <span className="error" role="alert">{error}</span> : hint ? <span className="hint">{hint}</span> : null}
    </div>
  );
}
export const Input = ({ testid, className, ...p }: InputHTMLAttributes<HTMLInputElement> & { testid?: string }) =>
  <input data-testid={testid} className={cx("ds-input", className)} {...p} />;
export const Select = ({ testid, className, ...p }: SelectHTMLAttributes<HTMLSelectElement> & { testid?: string }) =>
  <select data-testid={testid} className={cx("ds-select", className)} {...p} />;
export const Textarea = ({ testid, className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement> & { testid?: string; ref?: import("react").Ref<HTMLTextAreaElement> }) =>
  <textarea data-testid={testid} className={cx("ds-textarea", className)} {...p} />;

export function Segmented<T extends string>({ value, onChange, options, testid }: {
  value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode; icon?: string }[]; testid?: string;
}) {
  return (
    <div className="ds-seg" role="group" data-testid={testid}>
      {options.map(o => (
        <button key={o.value} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)} data-testid={testid && `${testid}-${o.value}`}>
          {o.icon && <Icon name={o.icon} size={14} />}{o.label}
        </button>
      ))}
    </div>
  );
}

/* ── display ────────────────────────────────────────────────────────── */
export function Card({ pad, flush, className, children, ...rest }: { pad?: "lg"; flush?: boolean; className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("ds-card", pad === "lg" && "pad-lg", flush && "flush", className)} {...rest}>{children}</div>;
}
export type Tone = "neutral" | "ok" | "warn" | "bad" | "info" | "violet" | "accent";
export function Badge({ tone = "neutral", icon, children, title }: { tone?: Tone; icon?: string; children: ReactNode; title?: string }) {
  return <span className={cx("ds-badge", tone !== "neutral" && tone)} title={title}>{icon && <Icon name={icon} size={12} />}{children}</span>;
}
export function Avatar({ name, size }: { name: string; size?: "sm" | "lg" }) {
  const initials = name.replace(/^Dr\.\s*/, "").split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return <span className={cx("ds-avatar", size)} aria-hidden="true">{initials}</span>;
}
export const Kbd = ({ children }: { children: ReactNode }) => <kbd className="ds-kbd">{children}</kbd>;
export function Stat({ value, label, testid }: { value: ReactNode; label: string; testid?: string }) {
  return <div className="ds-stat"><div className="v" data-testid={testid}>{value}</div><div className="l">{label}</div></div>;
}
export function EmptyState({ icon = "sparkle", title, children, action }: { icon?: string; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="ds-empty">
      <div className="ico"><Icon name={icon} size={22} /></div>
      <h3>{title}</h3>
      {children && <p className="ds-small">{children}</p>}
      {action && <div style={{ marginTop: 14 }}>{action}</div>}
    </div>
  );
}
export const Skeleton = ({ h = 16, w = "100%" }: { h?: number; w?: number | string }) => <div className="ds-skel" style={{ height: h, width: w }} />;

/* ── overlays ───────────────────────────────────────────────────────── */
function useEscape(onClose: () => void) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); onClose(); } };
    window.addEventListener("keydown", h, true);
    return () => window.removeEventListener("keydown", h, true);
  }, [onClose]);
}
export function Dialog({ title, onClose, wide, children, testid }: { title: string; onClose: () => void; wide?: boolean; children: ReactNode; testid?: string }) {
  useEscape(onClose);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { (ref.current?.querySelector("input,select,textarea,button") as HTMLElement | null)?.focus(); }, []);
  return (
    <div className="ds-scrim" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div ref={ref} className={cx("ds-dialog", wide && "wide")} role="dialog" aria-modal="true" aria-label={title} data-testid={testid}>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}
export function Drawer({ title, onClose, children, testid }: { title: ReactNode; onClose: () => void; children: ReactNode; testid?: string }) {
  useEscape(onClose);
  return (
    <>
      <div className="ds-scrim" style={{ background: "rgba(15,18,22,.25)" }} onMouseDown={onClose} />
      <aside className="ds-drawer" role="dialog" aria-modal="true" data-testid={testid}>
        <div className="ds-row between" style={{ marginBottom: 16 }}>
          <h2>{title}</h2>
          <Button variant="ghost" icon="x" aria-label="Close" onClick={onClose} />
        </div>
        {children}
      </aside>
    </>
  );
}
export function Menu({ trigger, children, align = "right", up }: { trigger: (open: () => void) => ReactNode; children: (close: () => void) => ReactNode; align?: "left" | "right"; up?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", h); document.addEventListener("keydown", k);
    return () => { document.removeEventListener("mousedown", h); document.removeEventListener("keydown", k); };
  }, [open]);
  return (
    <div ref={ref} style={{ position: "relative", display: up ? "block" : "inline-block" }}>
      {trigger(() => setOpen(o => !o))}
      {open && <div className="ds-menu" role="menu" style={{ [up ? "bottom" : "top"]: "calc(100% + 6px)", [align]: 0 }}>{children(() => setOpen(false))}</div>}
    </div>
  );
}

/* ── environment banner: always visible, never dismissible ──────────── */
export function EnvBanner({ env, role, school, children }: { env: string; role?: string; school?: string; children?: ReactNode }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 20_000); return () => clearInterval(t); }, []);
  return (
    <div className={cx("ds-env", env)} role="status" data-testid="env-banner" data-env={env}>
      <span className="tag">{env}</span>
      {env === "demo" && <span>Fictional data — safe to explore</span>}
      {role && <><span className="dot">•</span><span data-testid="env-role">{role}</span></>}
      {school && <><span className="dot">•</span><span className="ds-truncate">{school}</span></>}
      <span className="sp" />
      {children}
      <span className="ds-num">{now.toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" })}</span>
    </div>
  );
}
