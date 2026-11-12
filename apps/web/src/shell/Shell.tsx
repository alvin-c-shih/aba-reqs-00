import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Avatar, Button, CommandPalette, Dialog, EnvBanner, Icon, Kbd, Menu, TourProvider, useHotkey, useToast, useTour, type Command, type TourDef } from "@aba/design-system";
import { del, get, post, put } from "../lib/api";
import { HOME, useAuth } from "../lib/auth";
import { studentName } from "../lib/hooks";
import { clearLocal, isBusy } from "../areas/collect/store";
import { Bell, SecurityDialog } from "./Account";

type Nav = { to: string; label: string; icon: string; tour?: string; end?: boolean };
const NAV: Record<string, Nav[]> = {
  system_admin: [
    { to: "/system", label: "Schools", icon: "building", end: true },
    { to: "/system/health", label: "Platform health", icon: "pulse", tour: "nav-health" },
    { to: "/system/audit", label: "Audit log", icon: "shield", tour: "nav-audit" },
  ],
  school_admin: [
    { to: "/school", label: "Overview", icon: "home", end: true },
    { to: "/school/people", label: "People", icon: "users", tour: "nav-people" },
    { to: "/school/students", label: "Students", icon: "user", tour: "nav-students" },
    { to: "/school/service-log", label: "Service log", icon: "list" },
    { to: "/school/audit", label: "Audit log", icon: "shield" },
  ],
  bcba: [
    { to: "/clinic", label: "Caseload", icon: "chart", end: true },
    { to: "/clinic/review", label: "Review queue", icon: "inbox", tour: "nav-review" },
    { to: "/clinic/service-log", label: "Service log", icon: "list" },
    { to: "/collect", label: "Collect data", icon: "play" },
  ],
  rbt: [{ to: "/collect", label: "Today", icon: "play" }],
  parent: [{ to: "/family", label: "Your family", icon: "heart" }],
  teacher: [{ to: "/family", label: "Your students", icon: "users" }],
};
const SHORTCUTS: [string, string][] = [
  ["⌘K / Ctrl+K", "Search pages, students and actions"], ["?", "Show this list"], ["⌘Z / ⇧⌘Z", "Undo / redo in forms"],
  ["← →", "Move between sessions on a graph"], ["N", "Add a note at the focused session"], ["Enter", "Open the focused session"],
  ["1 2 3 4", "Record correct / prompted / incorrect / no response"], ["Space", "Count a behaviour, or start/stop the timer"], ["U", "Undo last entry while recording"],
];

type ShellApi = { setPageTour: (t: TourDef | null) => void; pendingReviews: number; refreshCounts: () => void };
const ShellCtx = createContext<ShellApi>({ setPageTour: () => {}, pendingReviews: 0, refreshCounts: () => {} });
export const useShell = () => useContext(ShellCtx);
/** A page declares its tour; the shell offers it once and keeps it in the Help menu. */
export function usePageTour(t: TourDef, ready = true) {
  const { setPageTour } = useShell();
  useEffect(() => { if (ready) setPageTour(t); return () => setPageTour(null); }, [t, ready, setPageTour]);
}

export function Shell({ children }: { children: ReactNode }) {
  const { me, refresh } = useAuth();
  const nav = useNavigate();
  const onFinish = useCallback((id: string) => { put(`/me/tours/${id}`).then(refresh).catch(() => {}); }, [refresh]);
  if (!me) return null;
  return <TourProvider navigate={nav} onFinish={onFinish}><Frame>{children}</Frame></TourProvider>;
}

function Frame({ children }: { children: ReactNode }) {
  const { me, meta, signOut, refresh } = useAuth();
  const nav = useNavigate(), loc = useLocation(), toast = useToast(), tour = useTour();
  const [palette, setPalette] = useState(false);
  const [dialog, setDialog] = useState<null | "keys" | "reset" | "security">(null);
  const [pageTour, setPageTour] = useState<TourDef | null>(null);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [pending, setPending] = useState(0);
  const [people, setPeople] = useState<Command[]>([]);
  const [busy, setBusy] = useState(false);
  const role = me!.role, env = meta?.env ?? "prod";
  const phone = role === "rbt" || loc.pathname.startsWith("/collect");
  const canReset = !!meta?.resettable && (env === "demo" || role === "system_admin");

  const refreshCounts = useCallback(() => {
    if (role === "bcba") get("/clinic/caseload").then(d => {
      setPending(d.pending_reviews);
      setPeople(d.students.flatMap((s: any) => [
        { id: s.id, label: studentName(s), group: "Student", icon: "user", run: () => nav(`/clinic/students/${s.id}`) },
        ...s.programs.map((p: any) => ({ id: p.id, label: `${studentName(s)} — ${p.name}`, group: "Graph", icon: "chart", keywords: p.status, run: () => nav(`/clinic/programs/${p.id}`) })),
      ]));
    }).catch(() => {});
  }, [role, nav]);
  useEffect(refreshCounts, [refreshCounts, loc.pathname]);

  // 15 minutes without input signs you out — except while a session is being recorded (ADR-0006)
  const last = useRef(Date.now());
  useEffect(() => {
    const mark = () => { last.current = Date.now(); };
    const evs = ["pointerdown", "keydown", "scroll"] as const;
    evs.forEach(e => window.addEventListener(e, mark, { passive: true, capture: true }));
    const t = setInterval(() => {
      if (isBusy()) last.current = Date.now();
      else if (Date.now() - last.current > 15 * 60_000) signOut("You were signed out after 15 minutes of inactivity.");
    }, 20_000);
    return () => { evs.forEach(e => window.removeEventListener(e, mark, true)); clearInterval(t); };
  }, [signOut]);

  const setTheme = () => {
    const cur = document.documentElement.dataset.theme;
    const next = cur === "dark" ? "light" : cur === "light" ? "" : "dark";
    if (next) { document.documentElement.dataset.theme = next; localStorage.setItem("aba.theme", next); }
    else { delete document.documentElement.dataset.theme; localStorage.removeItem("aba.theme"); }
    toast({ text: `Theme: ${next || "match system"}` });
  };
  const startTour = () => pageTour ? tour.start(pageTour) : toast({ text: "This page has no tour — try the home page" });
  const reset = async () => {
    setBusy(true);
    try { await post("/demo/reset"); await clearLocal(); window.location.assign(HOME[role]); }
    catch (e: any) { toast({ text: e.message, tone: "bad" }); setBusy(false); setDialog(null); }
  };

  const commands = useMemo<Command[]>(() => [
    ...NAV[role].map(n => ({ id: n.to, label: n.label, group: "Go to", icon: n.icon, run: () => nav(n.to) })),
    ...people,
    { id: "tour", label: "Tour this page", group: "Help", icon: "sparkle", keywords: "guide onboarding learn", run: startTour },
    { id: "keys", label: "Keyboard shortcuts", group: "Help", icon: "keyboard", run: () => setDialog("keys") },
    ...(env !== "prod" ? [{ id: "design", label: "Design system", group: "Go to", icon: "palette", keywords: "components tokens", run: () => nav("/design") }] : []),
    { id: "theme", label: "Switch theme (light / dark / system)", group: "Action", icon: "sun", run: setTheme },
    { id: "security", label: "Sign-in security (two-factor)", group: "Action", icon: "shield", keywords: "2fa totp authenticator", run: () => setDialog("security") },
    ...(canReset ? [{ id: "reset", label: "Reset demo data", group: "Action", icon: "refresh", keywords: "restore seed", run: () => setDialog("reset") }] : []),
    { id: "replay", label: "Show all tours again", group: "Help", icon: "refresh", run: () => del("/me/tours").then(refresh).then(() => { setDismissed([]); toast({ text: "Tours will be offered again" }); }) },
    { id: "out", label: "Sign out", group: "Action", icon: "logout", run: () => signOut() },
  ], [role, people, env, canReset, pageTour]);  // eslint-disable-line

  useHotkey("mod+k", e => { e.preventDefault(); setPalette(true); });
  useHotkey("?", () => setDialog("keys"));

  const offer = pageTour && !me!.tours_done[pageTour.id] && !dismissed.includes(pageTour.id) && !tour.active;
  const helpMenu = (
    <Menu trigger={open => <span data-tour="help"><Button variant="ghost" icon="help" onClick={open} aria-label="Help" testid="help-button" /></span>}>
      {close => <>
        <button onClick={() => { close(); startTour(); }} data-testid="help-tour"><Icon name="sparkle" />Tour this page</button>
        <button onClick={() => { close(); setDialog("keys"); }}><Icon name="keyboard" />Keyboard shortcuts <span style={{ marginLeft: "auto" }}><Kbd>?</Kbd></span></button>
        <button onClick={() => { close(); setPalette(true); }}><Icon name="search" />Search everything <span style={{ marginLeft: "auto" }}><Kbd>⌘K</Kbd></span></button>
        {env !== "prod" && <button onClick={() => { close(); nav("/design"); }}><Icon name="palette" />Design system</button>}
      </>}
    </Menu>
  );
  const userMenu = (compact: boolean) => (
    <Menu align={compact ? "right" : "left"} up={!compact} trigger={open => compact
      ? <button className="userbtn" style={{ width: "auto", padding: 2 }} onClick={open} aria-label="Account" data-testid="user-menu"><Avatar name={me!.name} size="sm" /></button>
      : <button className="userbtn" onClick={open} data-testid="user-menu"><Avatar name={me!.name} /><span className="ds-grow"><span className="ds-truncate" style={{ display: "block", fontWeight: 600, fontSize: 14 }}>{me!.name}</span><span className="ds-tiny ds-muted">{me!.role_label}</span></span></button>}>
      {close => <div>
        <div className="head"><b>{me!.name}</b><div className="ds-tiny ds-muted">{me!.email}</div>
          {me!.sites.length > 0 && <div className="ds-tiny ds-muted">{me!.sites.map(s => s.name).join(" · ")}</div>}</div>
        <div className="sep" />
        <button onClick={() => { close(); setDialog("security"); }} data-testid="open-security"><Icon name="shield" />Sign-in security{me!.two_factor ? " · 2-step on" : ""}</button>
        <button onClick={() => { close(); setTheme(); }}><Icon name="sun" />Switch theme</button>
        <button onClick={() => { close(); signOut(); }} data-testid="sign-out"><Icon name="logout" />Sign out</button>
      </div>}
    </Menu>
  );

  return (
    <ShellCtx.Provider value={{ setPageTour, pendingReviews: pending, refreshCounts }}>
      <div className="app">
        <div data-tour="env-banner">
          <EnvBanner env={env} role={me!.role_label} school={me!.school?.name ?? "Platform"}>
            {canReset && <button onClick={() => setDialog("reset")} data-testid="reset-demo">Reset demo</button>}
          </EnvBanner>
        </div>
        {phone ? (
          <div className="main">
            <div className="phone-bar">
              <img src="/icon.svg" width={24} height={24} style={{ borderRadius: 6 }} alt="" />
              {role === "bcba" ? <NavLink to="/clinic" className="ds-small"><Icon name="arrowLeft" size={14} /> Caseload</NavLink> : <b>ABA</b>}
              <span className="ds-grow" />
              <span id="phone-bar-slot" />
              <Bell />{helpMenu}{userMenu(true)}
            </div>
            {children}
          </div>
        ) : (
          <div className="app-body">
            <nav className="side nav" aria-label="Main">
              <div className="brand"><img src="/icon.svg" alt="" /><span>ABA<small>{me!.school?.name ?? "Platform"}</small></span></div>
              {NAV[role].map(n => (
                <NavLink key={n.to} to={n.to} end={n.end} data-tour={n.tour} data-testid={`nav-${n.to.replace(/\//g, "-").slice(1)}`}>
                  <Icon name={n.icon} />{n.label}
                  {n.to === "/clinic/review" && pending > 0 && <span className="count" data-testid="review-count">{pending}</span>}
                </NavLink>
              ))}
              <span className="sp" />
              {userMenu(false)}
            </nav>
            <div className="main">
              <div className="topbar">
                <button className="search" onClick={() => setPalette(true)} data-testid="search-button"><Icon name="search" size={16} />Search or jump to…<Kbd>⌘K</Kbd></button>
                <span className="ds-grow" />
                {role !== "system_admin" && <Bell />}{helpMenu}<span className="mobonly">{userMenu(true)}</span>
              </div>
              <nav className="mobnav nav" aria-label="Main">{NAV[role].map(n => <NavLink key={n.to} to={n.to} end={n.end}><Icon name={n.icon} size={16} />{n.label}</NavLink>)}</nav>
              {children}
            </div>
          </div>
        )}
      </div>

      {offer && (
        <div className="ds-nudge" data-testid="tour-nudge">
          <div className="ds-row" style={{ alignItems: "flex-start", gap: 12 }}>
            <span style={{ color: "var(--accent)" }}><Icon name="sparkle" size={22} /></span>
            <div className="ds-grow"><b>New here?</b><div className="ds-small ds-muted">Take the 1-minute “{pageTour!.name}” tour.</div></div>
          </div>
          <div className="ds-row" style={{ justifyContent: "flex-end", marginTop: 12 }}>
            <Button size="sm" variant="ghost" onClick={() => { setDismissed(d => [...d, pageTour!.id]); put(`/me/tours/${pageTour!.id}`).then(refresh); }} testid="tour-dismiss">Not now</Button>
            <Button size="sm" variant="primary" onClick={() => tour.start(pageTour!)} testid="tour-start">Start tour</Button>
          </div>
        </div>
      )}
      {palette && <CommandPalette commands={commands} onClose={() => setPalette(false)} />}
      {dialog === "keys" && (
        <Dialog title="Keyboard shortcuts" onClose={() => setDialog(null)} testid="shortcuts">
          <table className="ds-table"><tbody>{SHORTCUTS.map(([k, d]) => <tr key={k}><td style={{ whiteSpace: "nowrap" }}><Kbd>{k}</Kbd></td><td>{d}</td></tr>)}</tbody></table>
          <div className="actions"><Button onClick={() => setDialog(null)}>Close</Button></div>
        </Dialog>
      )}
      {dialog === "security" && <SecurityDialog onClose={() => setDialog(null)} />}
      {dialog === "reset" && (
        <Dialog title="Reset demo data?" onClose={() => setDialog(null)} testid="reset-dialog">
          <p>Everything goes back to the starting state: 2 schools, 6 students and about 12 weeks of sessions, with dates recalculated from today. Changes made since the last reset are discarded.</p>
          <p className="ds-small ds-muted" style={{ marginTop: 8 }}>Only available in Demo, Dev and QA. The server refuses this in Prod.</p>
          <div className="actions"><Button onClick={() => setDialog(null)}>Cancel</Button><Button variant="primary" disabled={busy} onClick={reset} testid="reset-confirm">{busy ? "Resetting…" : "Reset demo data"}</Button></div>
        </Dialog>
      )}
    </ShellCtx.Provider>
  );
}

export function PageHead({ title, sub, crumbs, children }: { title: ReactNode; sub?: ReactNode; crumbs?: ReactNode; children?: ReactNode }) {
  return (
    <div className="page-head">
      <div className="ds-grow">{crumbs && <div className="crumbs">{crumbs}</div>}<h1>{title}</h1>{sub && <div className="sub">{sub}</div>}</div>
      {children}
    </div>
  );
}
