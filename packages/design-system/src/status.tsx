/* Domain vocabulary shared by every screen: one word, one icon, one tone per meaning.
   Colour is never the only signal — each status has its own icon and label. */
import { Badge, Icon, type Tone } from "./primitives";

export type Flag = "mastered" | "on_track" | "no_progress" | "regression" | "variable" | "stale" | "baseline" | "no_data";
export const FLAGS: Record<Flag, { label: string; tone: Tone; icon: string; hint: string }> = {
  mastered:    { label: "Criterion met", tone: "ok",      icon: "check",      hint: "The mastery rule is satisfied in the current phase." },
  on_track:    { label: "On track",      tone: "info",    icon: "arrowRight", hint: "Moving toward criterion at a healthy rate." },
  no_progress: { label: "No progress",   tone: "warn",    icon: "minus",      hint: "Six or more sessions in this phase with a flat trend." },
  regression:  { label: "Regression",    tone: "bad",     icon: "flag",       hint: "Trending the wrong way in the current phase." },
  variable:    { label: "Variable",      tone: "violet",  icon: "pulse",      hint: "Results swing widely between sessions." },
  stale:       { label: "No recent data", tone: "neutral", icon: "clock",     hint: "Active program with no data for 7+ days." },
  baseline:    { label: "Baseline",      tone: "neutral", icon: "circle",     hint: "Still collecting baseline data." },
  no_data:     { label: "No data yet",   tone: "neutral", icon: "circle",     hint: "Nothing recorded for this program." },
};
export function FlagBadge({ flag }: { flag: Flag }) {
  const f = FLAGS[flag] ?? FLAGS.no_data;
  return <span data-testid={`flag-${flag}`}><Badge tone={f.tone} icon={f.icon} title={f.hint}>{f.label}</Badge></span>;
}

/** Secondary signals: suggestions from the statistics, shown next to the status, never instead of it. */
export const SIGNALS: Record<string, { label: string; icon: string; tone: Tone }> = {
  change_point:      { label: "Possible change point", icon: "sparkle", tone: "accent" },
  forecast:          { label: "Forecast",              icon: "arrowRight", tone: "info" },
  unusual:           { label: "Unusual session",       icon: "flag", tone: "warn" },
  recorder_gap:      { label: "Recorders differ",      icon: "users", tone: "violet" },
  prompt_dependence: { label: "Prompt-dependent",      icon: "half", tone: "warn" },
};
export function SignalBadge({ kind, title, short }: { kind: string; title?: string; short?: boolean }) {
  const s = SIGNALS[kind];
  if (!s) return null;
  return <span data-testid={`signal-${kind}`}><Badge tone={s.tone} icon={s.icon} title={title ?? s.label}>{short ? "" : s.label}</Badge></span>;
}

export type Outcome = "correct" | "prompted" | "incorrect" | "no_response";
export const OUTCOMES: Record<Outcome, { label: string; short: string; icon: string; color: string; soft: string; key: string }> = {
  correct:     { label: "Correct",     short: "✓", icon: "check",  color: "var(--ok)",    soft: "var(--ok-soft)",    key: "1" },
  prompted:    { label: "Prompted",    short: "P", icon: "half",   color: "var(--warn)",  soft: "var(--warn-soft)",  key: "2" },
  incorrect:   { label: "Incorrect",   short: "✗", icon: "x",      color: "var(--bad)",   soft: "var(--bad-soft)",   key: "3" },
  no_response: { label: "No response", short: "–", icon: "minus",  color: "var(--slate)", soft: "var(--slate-soft)", key: "4" },
};
export function OutcomeDot({ outcome, voided }: { outcome: Outcome; voided?: boolean }) {
  const o = OUTCOMES[outcome];
  return (
    <span title={o.label + (voided ? " (voided)" : "")} style={{ display: "inline-grid", placeItems: "center", width: 22, height: 22, borderRadius: 6,
      background: o.soft, color: o.color, opacity: voided ? 0.35 : 1, textDecoration: voided ? "line-through" : undefined }}>
      <Icon name={o.icon} size={13} />
    </span>
  );
}

export const ROLE_LABEL: Record<string, string> = { system_admin: "System admin", school_admin: "School admin", bcba: "BCBA", rbt: "RBT", parent: "Parent", teacher: "Teacher" };
/** Plain-language status used with families: no clinical vocabulary. */
export const PLAIN_TONE: Record<string, Tone> = { "Goal met": "ok", "Making progress": "info", "Working on it": "warn", "Needs a new approach": "warn",
  "Up and down": "violet", "Not practised recently": "neutral", "Just started": "neutral" };
export const KIND_LABEL: Record<string, string> = { trial: "Discrete trials", frequency: "Frequency", duration: "Duration",
  interval: "Interval recording", abc: "ABC data", task: "Task analysis" };
export const KIND_ICON: Record<string, string> = { trial: "list", frequency: "bars", duration: "clock", interval: "pulse", abc: "note", task: "check" };
export const KIND_HINT: Record<string, string> = {
  trial: "Score each teaching trial: correct, prompted, incorrect or no response.",
  frequency: "Count each time the behaviour happens.",
  duration: "Time how long the behaviour lasts.",
  interval: "Split the observation into equal intervals and score each one yes or no.",
  abc: "Log each incident with what came before (antecedent) and after (consequence).",
  task: "Score every step of a multi-step skill, in order.",
};
