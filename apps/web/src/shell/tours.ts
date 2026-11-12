/* Guided tours — one per page, so a tour never needs data that isn't on screen.
   Targets are [data-tour="…"] attributes placed next to the elements they explain. */
import type { TourDef } from "@aba/design-system";

const banner = { target: "env-banner", title: "You always know where you are",
  body: "This bar shows the environment, your role and school. In Demo everything is fictional — and one click on “Reset demo” puts it all back." };
const help = { target: "help", title: "Help is always here",
  body: "Replay this tour, see keyboard shortcuts, or press ⌘K / Ctrl+K to jump to any page, student or action." };

export const TOURS: Record<string, TourDef> = {
  caseload: { id: "caseload", name: "Caseload", steps: [
    banner,
    { target: "attention", title: "What needs you today", body: "Programs are checked after every session. Regression, no progress and criterion-met rise to the top so you don't have to hunt through graphs." },
    { target: "student-card", title: "One card per student", body: "Each row is a program: a sparkline of recent sessions, the dashed criterion line, and a plain-language status. Click a program to open its graph." },
    { target: "nav-review", title: "Review queue", body: "Data recorded without a confirmed session lock is never dropped — it waits here until you accept or exclude it." },
    help,
  ] },
  graph: { id: "graph", name: "Program graph", steps: [
    { target: "chart", title: "A graph that reads like a single-case design", body: "Sessions run left to right. Dashed vertical lines are phase changes — the data path never connects across them. The green dashed line is the mastery criterion." },
    { target: "chart", title: "Annotate without leaving the graph", body: "Hover a session and click the ＋ in the notes lane (or focus a session and press N). Type, press Enter. Tick “start a new phase” to mark a treatment change." },
    { target: "status", title: "Why this status?", body: "The status is computed from the current phase only, with the reason spelled out. A phase change resets the question “is this working?”." },
    { target: "insights", title: "Suggestions, never surprises", body: "The statistics propose possible change points, flag unusual sessions and forecast when criterion will be reached. Each one is yours to accept or dismiss — nothing changes on its own." },
    { target: "chart-mode", title: "Line or bar", body: "Switch views any time. Click any session to see every trial, and correct a mistake with a reason — the original is kept." },
    { target: "edit-program", title: "Forgiving forms", body: "Editing a program supports undo and redo (⌘Z / ⇧⌘Z), so you can experiment with criteria and targets safely." },
  ] },
  today: { id: "today", name: "Today", steps: [
    banner,
    { target: "sync", title: "Works without WiFi", body: "Everything you record is saved on this device first, then sent. This pill shows what is waiting and confirms what the server has received." },
    { target: "student-row", title: "Start a session", body: "Tap a student to begin. Starting a session takes a lock so two people don't record the same student by accident." },
    help,
  ] },
  session: { id: "session", name: "Recording a session", steps: [
    { target: "programs", title: "Switch programs with one tap", body: "All of the student's active programs are here. The number is what you've recorded this session." },
    { target: "recorder", title: "Big targets, instant feedback", body: "One tap records. On a keyboard, use 1–4 for trial outcomes or Space to count. Every tap is saved immediately." },
    { target: "undo", title: "Made a mistake?", body: "“Undo last” voids the most recent entry. Nothing is ever deleted — the correction is recorded too." },
    { target: "end", title: "End the session", body: "Ending releases the lock and syncs. If you are offline, it syncs by itself when the connection returns." },
  ] },
  family: { id: "family", name: "Family portal", steps: [
    banner,
    { target: "children", title: "Start here", body: "Open a child to read what their team has shared, see the goals they are working on in plain words, and send the team a message." },
    { target: "bell", title: "You will be told", body: "A dot appears here when the team shares a new summary or answers your message." },
    help,
  ] },
  school: { id: "school", name: "School admin", steps: [
    banner,
    { target: "sites", title: "Your sites", body: "A school can have several locations. You see and manage only the sites you administer." },
    { target: "nav-people", title: "People", body: "Create accounts for BCBAs and RBTs. New accounts get a one-time temporary password that must be changed at first sign-in." },
    { target: "nav-students", title: "Students", body: "Enrol students, place them at a site and assign a supervising BCBA. The BCBA then builds the team and programs. You don't see session data — that stays with the clinical team." },
    help,
  ] },
  system: { id: "system", name: "System admin", steps: [
    banner,
    { target: "schools", title: "Schools are isolated tenants", body: "Each school's data is separated inside the database itself. You manage schools and their first admin — you cannot open student records." },
    { target: "nav-health", title: "Proof that it works", body: "Live row counts, rows changed in the last 5 minutes and a write-read canary show the system is really writing to the database." },
    { target: "nav-audit", title: "Audit log", body: "Sign-ins, record views and every change are logged, append-only." },
    help,
  ] },
};
