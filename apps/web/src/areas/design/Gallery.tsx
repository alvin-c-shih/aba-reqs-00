import { useState } from "react";
import { Avatar, Badge, Button, Card, EmptyState, EnvBanner, FLAGS, Field, FlagBadge, Icon, Input, Kbd, OUTCOMES, OutcomeDot, Segmented, Select, SessionChart, Sparkline, Stat, useToast, type Flag, type Outcome } from "@aba/design-system";
import { PageHead } from "../../shell/Shell";

const TOKENS = ["paper", "surface", "ink", "muted", "line", "accent", "accent-soft", "ok", "warn", "bad", "info", "violet", "slate"];
const ICONS = ["check", "x", "half", "minus", "plus", "users", "user", "building", "chart", "bars", "shield", "pulse", "list", "clock", "lock", "help", "search", "undo", "redo", "refresh", "play", "stop", "wifi", "wifiOff", "flag", "note", "inbox", "pin", "edit", "trash", "sparkle", "keyboard"];
const day = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
const DEMO = [20, 30, 20, 40, 50, 45, 60, 70, 65, 80, 90, 90].map((v, i) => ({ session_id: String(i), at: day(24 - i * 2), value: v, trials: 10, correct: v / 10, prompted: 1, incorrect: 0, no_response: 0 }));

/* Living reference for the design system (non-prod only). One place to see every token and component. */
export function Gallery() {
  const [seg, setSeg] = useState("line");
  const toast = useToast();
  return (
    <div className="page">
      <PageHead title="Design system" sub="@aba/design-system — tokens, components and domain vocabulary shared by every screen." />
      <div className="ds-stack lg">
        <Card><h2 style={{ marginBottom: 12 }}>Colour tokens</h2>
          <div className="ds-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 10 }}>
            {TOKENS.map(t => <div key={t}><div className="swatch" style={{ background: `var(--${t})` }} /><div className="ds-tiny ds-mono" style={{ marginTop: 4 }}>--{t}</div></div>)}</div>
        </Card>
        <Card><h2 style={{ marginBottom: 12 }}>Environment banners</h2>
          <div className="ds-stack" style={{ gap: 6 }}>{["demo", "dev", "qa", "prod"].map(e => <EnvBanner key={e} env={e} role="BCBA" school="Bridgeway Academy" />)}</div>
          <p className="ds-small ds-muted" style={{ marginTop: 8 }}>Always visible, never dismissible. Prod is deliberately calm: a red bar in the real system would read as an error.</p>
        </Card>
        <div className="ds-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
          <Card><h2 style={{ marginBottom: 12 }}>Buttons</h2>
            <div className="ds-row wrap"><Button variant="primary">Primary</Button><Button>Default</Button><Button variant="ghost">Ghost</Button><Button variant="danger">Danger</Button><Button icon="plus">With icon</Button><Button size="sm">Small</Button><Button disabled>Disabled</Button></div>
            <h2 style={{ margin: "20px 0 12px" }}>Form</h2>
            <div className="ds-stack"><Field label="Label" hint="Hints sit under the control."><Input placeholder="Text input" /></Field>
              <Field label="Select"><Select><option>Option</option></Select></Field>
              <Segmented value={seg} onChange={setSeg} options={[{ value: "line", label: "Line", icon: "chart" }, { value: "bar", label: "Bar", icon: "bars" }]} /></div>
          </Card>
          <Card><h2 style={{ marginBottom: 12 }}>Status vocabulary</h2>
            <p className="ds-small ds-muted" style={{ marginBottom: 10 }}>One word, one icon, one tone per meaning — colour is never the only signal.</p>
            <div className="ds-stack" style={{ gap: 8 }}>{(Object.keys(FLAGS) as Flag[]).map(f => <div key={f} className="ds-row"><span style={{ width: 150 }}><FlagBadge flag={f} /></span><span className="ds-small ds-muted">{FLAGS[f].hint}</span></div>)}</div>
            <h2 style={{ margin: "20px 0 12px" }}>Trial outcomes</h2>
            <div className="ds-row wrap">{(Object.keys(OUTCOMES) as Outcome[]).map(o => <span key={o} className="ds-row"><OutcomeDot outcome={o} /><span className="ds-small">{OUTCOMES[o].label}</span></span>)}</div>
          </Card>
        </div>
        <Card><h2 style={{ marginBottom: 12 }}>Session chart</h2>
          <SessionChart kind="trial" goal="increase" criterion={80} points={DEMO} mode={seg as any} height={260}
            phases={[{ id: "a", label: "Baseline", kind: "baseline", started_at: day(30) }, { id: "b", label: "Intervention", kind: "intervention", started_at: day(19) }]}
            notes={[{ id: "n", at: day(12), kind: "treatment", body: "Example treatment note" }]} />
        </Card>
        <div className="ds-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          <Card><h2 style={{ marginBottom: 12 }}>Display</h2><div className="ds-row wrap"><Avatar name="Anita Nair" /><Avatar name="Marcus Rivera" size="lg" /><Badge tone="ok" icon="check">Badge</Badge><Badge tone="warn">Warn</Badge><Kbd>⌘K</Kbd><span style={{ color: "var(--accent)" }}><Sparkline values={[2, 4, 3, 6, 7, 9]} criterion={8} /></span></div>
            <div style={{ marginTop: 14 }}><Stat value="82%" label="Stat" /></div></Card>
          <Card><h2 style={{ marginBottom: 12 }}>Feedback</h2><div className="ds-row wrap"><Button onClick={() => toast({ text: "Saved" })}>Toast</Button><Button onClick={() => toast({ text: "Note removed", action: { label: "Undo", run: () => {} } })}>Toast with Undo</Button></div>
            <p className="ds-small ds-muted" style={{ marginTop: 10 }}>Destructive actions don't ask “are you sure?” — they act and offer Undo.</p></Card>
          <Card><EmptyState icon="inbox" title="Empty state">Says what belongs here and how to add it.</EmptyState></Card>
        </div>
        <Card><h2 style={{ marginBottom: 12 }}>Icons</h2><div className="ds-row wrap" style={{ gap: 14 }}>{ICONS.map(i => <span key={i} title={i} className="ds-muted"><Icon name={i} size={20} /></span>)}</div></Card>
      </div>
    </div>
  );
}
