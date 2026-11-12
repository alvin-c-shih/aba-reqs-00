"""Generate the architecture diagrams (docs/architecture/diagrams/*.svg).
Run: python3 scripts/diagrams.py   — edit the data below, never the SVGs."""
from html import escape as e
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "docs" / "architecture" / "diagrams"
C = dict(paper="#f6f5f1", card="#ffffff", ink="#1b1f23", ink2="#454c54", muted="#6a717a", line="#d9d5cb",
         accent="#2b4acb", accent_soft="#e8edfc", ok="#1d7a4b", ok_soft="#e2f3e9", warn="#96590a", warn_soft="#fbf0db",
         bad="#b3312b", bad_soft="#fae5e3", violet="#6b46b0", violet_soft="#efe9fa", slate="#59636b", slate_soft="#eceef0")
TONES = {"card": ("card", "line", "ink"), "accent": ("accent_soft", "accent", "accent"), "ok": ("ok_soft", "ok", "ok"),
         "warn": ("warn_soft", "warn", "warn"), "bad": ("bad_soft", "bad", "bad"), "violet": ("violet_soft", "violet", "violet"),
         "slate": ("slate_soft", "slate", "slate"), "solid": ("accent", "accent", "card")}
FONT = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"


class D:
    def __init__(self, w, h, title, sub):
        self.w, self.h, self.o = w, h, []
        self.o.append(f'<rect width="{w}" height="{h}" rx="18" fill="{C["paper"]}"/>')
        self.text(36, 46, title, 22, "ink", 700)
        self.text(36, 70, sub, 13.5, "muted")

    def text(self, x, y, s, size=13, color="ink", weight=400, anchor="start", mono=False, ls=0):
        fam = "ui-monospace, Menlo, monospace" if mono else FONT
        self.o.append(f'<text x="{x}" y="{y}" font-family="{fam}" font-size="{size}" font-weight="{weight}" fill="{C.get(color, color)}" '
                      f'text-anchor="{anchor}"{f" letter-spacing=\"{ls}\"" if ls else ""}>{e(s)}</text>')

    def box(self, x, y, w, h, title, lines=(), tone="card", sub=None, r=12, center=False, tsize=14.5):
        fill, stroke, tcol = (C[k] for k in TONES[tone])
        self.o.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" stroke="{stroke}" stroke-width="1.2"/>')
        ax, anchor = (x + w / 2, "middle") if center else (x + 14, "start")
        ty = y + 24
        self.text(ax, ty, title, tsize, tcol, 680, anchor)
        if sub:
            ty += 16; self.text(ax, ty, sub, 11.5, "muted" if tone != "solid" else "card", 500, anchor)
        for ln in lines:
            ty += 17; self.text(ax, ty, ln, 12, "ink2" if tone != "solid" else "card", 400, anchor)

    def frame(self, x, y, w, h, label, color="muted"):
        self.o.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="16" fill="none" stroke="{C[color]}" stroke-width="1.2" stroke-dasharray="5 5"/>')
        self.text(x + 14, y - 8, label.upper(), 10.5, color, 700, ls=1.1)

    def arrow(self, x1, y1, x2, y2, label=None, color="ink2", dash=False, both=False, lx=None, ly=None, anchor="middle"):
        d = ' stroke-dasharray="5 4"' if dash else ""
        ms = ' marker-start="url(#as)"' if both else ""
        self.o.append(f'<path d="M{x1} {y1} L{x2} {y2}" stroke="{C[color]}" stroke-width="1.5" fill="none"{d} marker-end="url(#a-{color})"{ms}/>')
        if label:
            mx, my = (lx if lx is not None else (x1 + x2) / 2), (ly if ly is not None else (y1 + y2) / 2 - 6)
            wpx = len(label) * 6.1 + 10
            ox = mx - wpx / 2 if anchor == "middle" else mx - 5
            self.o.append(f'<rect x="{ox}" y="{my - 12}" width="{wpx}" height="17" rx="5" fill="{C["paper"]}"/>')
            self.text(mx, my, label, 11.5, color, 600, anchor)

    def pill(self, x, y, s, tone="slate"):
        fill, stroke, tcol = (C[k] for k in TONES[tone])
        w = len(s) * 6.3 + 18
        self.o.append(f'<rect x="{x}" y="{y}" width="{w}" height="22" rx="11" fill="{fill}"/>')
        self.text(x + w / 2, y + 15, s, 11.5, tcol, 650, "middle")
        return w

    def save(self, name):
        cols = {TONES[t][1] for t in TONES} | {"ink2", "muted"}
        defs = "".join(f'<marker id="a-{c}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
                       f'<path d="M0 0L10 5L0 10z" fill="{C[c]}"/></marker>' for c in cols)
        defs += f'<marker id="as" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M10 0L0 5L10 10z" fill="{C["ink2"]}"/></marker>'
        svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.w} {self.h}" width="{self.w}" height="{self.h}" role="img">'
               f'<defs>{defs}</defs>{"".join(self.o)}</svg>')
        OUT.mkdir(parents=True, exist_ok=True)
        (OUT / name).write_text(svg)
        print("wrote", name)


# ── 1. context ───────────────────────────────────────────────────────────────
d = D(1100, 560, "1 · System context", "Who uses the system and what it depends on. Everything inside the dashed line is this repository.")
people = [("RBT", "Records sessions,", "online or offline", "ok"), ("BCBA", "Reads graphs,", "decides what changes", "accent"),
          ("Parent", "Sees what the team", "shares; counts at home", "slate"), ("Teacher", "Sees goals; sends", "classroom notes", "slate"),
          ("School admin", "Sites, accounts,", "enrolment", "warn"), ("System admin", "Runs the platform;", "no student data", "violet")]
for i, (t, a, b, tone) in enumerate(people):
    x = 40 + i * 172
    d.box(x, 110, 160, 86, t, [a, b], tone)
    d.arrow(x + 80, 196, 320 + i * 92, 258, color=TONES[tone][1])
d.frame(250, 262, 600, 262, "", "accent")
d.text(550, 512, "ABA SYSTEM — THIS REPOSITORY", 10.5, "accent", 700, "middle", ls=1.1)
d.box(290, 286, 520, 78, "Web app  ·  one installable React app", ["Role areas: system · school · clinic · collect · family — phone-first for recording"], "card")
d.arrow(550, 364, 550, 398, "HTTPS  /api/v1  (same origin, cookies)", both=True)
d.box(290, 400, 250, 88, "API", ["FastAPI, one process", "auth · access rules · analytics · sync"], "card")
d.box(580, 400, 230, 88, "PostgreSQL", ["one database per environment", "row-level security per school"], "card")
d.arrow(540, 444, 578, 444, both=True)
d.box(880, 290, 190, 88, "Local models (optional)", ["Ollama · Whisper on this", "machine; off by default"], "violet")
d.box(880, 400, 190, 70, "Not built", ["email · SMS · push", "payer formats"], "slate")
d.box(40, 300, 170, 70, "No integrations", ["Greenfield: no EHR,", "billing or SSO"], "slate")
d.save("1-context.svg")

# ── 2. containers ────────────────────────────────────────────────────────────
d = D(1100, 640, "2 · Containers", "What runs where. One origin, one API process, one database per environment — nothing else to operate.")
d.frame(40, 110, 470, 490, "Browser / installed app (device)")
d.box(64, 132, 422, 104, "App shell", ["sign-in · navigation · environment banner", "help, page tours, command palette (⌘K)", "15-minute idle sign-out"], "card", sub="apps/web/src/shell")
for i, (t, s, tone) in enumerate([("system", "platform", "violet"), ("school", "roster", "warn"), ("clinic", "graphs", "accent"), ("collect", "recording", "ok")]):
    d.box(64 + i * 107, 250, 101, 70, t, [s], tone, tsize=13.5)
d.text(64, 340, "apps/web/src/areas/*  — one folder per role area", 11.5, "muted")
d.box(64, 354, 205, 96, "Design system", ["tokens · components", "session chart · tour engine"], "card", sub="packages/design-system")
d.box(281, 354, 205, 96, "Local store", ["encrypted outbox (AES-GCM)", "cached bundle for offline"], "ok", sub="IndexedDB")
d.box(64, 464, 422, 62, "Service worker", ["caches the app shell only — never API responses"], "card")
d.text(64, 560, "Clinical data on the device lives only in the encrypted store,", 12, "ink2")
d.text(64, 577, "and is forgotten a day after the server confirms it.", 12, "ink2")
d.arrow(512, 300, 598, 300, "JSON over HTTPS", both=True, ly=288)
d.text(555, 322, "httpOnly cookies", 11, "muted", anchor="middle"); d.text(555, 337, "+ CSRF header", 11, "muted", anchor="middle")
d.frame(600, 110, 220, 490, "API process (FastAPI)")
for i, (t, s) in enumerate([("auth", "sign-in, tokens, tours"), ("platform", "schools, health, reset"), ("school", "sites, staff, students"), ("clinic", "programs, graphs, review"), ("collect", "bundle, lock, sync")]):
    d.box(618, 130 + i * 62, 184, 52, t, [s], "card", tsize=13.5)
d.box(618, 446, 184, 62, "deps.py", ["who may see which student"], "accent", tsize=13.5)
d.box(618, 520, 184, 62, "analytics.py", ["mastery + status rules"], "accent", tsize=13.5)
d.arrow(822, 300, 878, 300, "SQL", both=True, ly=288)
d.frame(880, 110, 180, 490, "PostgreSQL")
for i, (n, tone) in enumerate([("aba_demo", "violet"), ("aba_dev", "ok"), ("aba_qa", "warn"), ("aba_prod", "slate")]):
    d.box(898, 130 + i * 62, 144, 50, n, [], tone, center=True, tsize=13.5)
d.box(898, 392, 144, 86, "role aba_app", ["RLS applies", "no UPDATE/DELETE", "on observations"], "card", tsize=13)
d.box(898, 490, 144, 92, "owner role", ["migrations and", "demo reset only;", "absent in prod"], "card", tsize=13)
d.save("2-containers.svg")

# ── 3. responsibilities ──────────────────────────────────────────────────────
d = D(1100, 600, "3 · Responsibility map", "Each responsibility has one home in the web app, one in the API and one set of tables. Read a column to see everything a role touches.")
cols = [("Design system", "slate", "packages/ · design-system", "—", "—", "everyone"),
        ("Shell & identity", "slate", "web/src/shell · lib", "routers/ · auth.py", "users · refresh_tokens", "everyone"),
        ("Platform", "violet", "areas/system", "routers/ · platform.py", "schools · audit_log (all)", "System admin"),
        ("School", "warn", "areas/school", "routers/ · school.py", "sites · users · students", "School admin"),
        ("Clinical", "accent", "areas/clinic", "routers/clinic.py · analytics.py", "programs · phases · notes", "BCBA"),
        ("Collection", "ok", "areas/collect", "routers/ · collect.py", "sessions · observations · locks", "RBT (and BCBA)"),
        ("Family", "slate", "areas/family", "routers/ · family.py", "contacts · summaries · messages", "Parent · Teacher")]
rows = ["Web", "API", "Data", "Role"]
x0, cw = 96, 136
for r, lab in enumerate(rows):
    d.text(84, 232 + r * 86, lab.upper(), 10.5, "muted", 700, "end", ls=1.1)
for i, (t, tone, *cells) in enumerate(cols):
    x = x0 + i * (cw + 5)
    d.box(x, 110, cw, 60, t, [], tone, center=True, tsize=14)
    d.o[-1] = d.o[-1].replace(f'y="{110 + 24}"', f'y="{110 + 36}"')
    for r, cell in enumerate(cells):
        d.box(x, 190 + r * 86, cw, 72, "", [], "card")
        parts = cell.split(" · ")
        for k, p in enumerate(parts):
            d.text(x + cw / 2, 190 + r * 86 + 36 - (len(parts) - 1) * 9 + k * 18 + 5, p, 12, "ink" if r == 3 else "ink2", 650 if r == 3 else 450, "middle", mono=r in (0, 1) and p != "—")
d.box(96, 544, 982, 36, "Cross-cutting, one place each:  access rules → api/aba/deps.py  ·  tenant isolation → db/migrations (RLS)  ·  audit → Ctx.audit()  ·  tours → shell/tours.ts", [], "card", tsize=12, center=True)
d.o[-1] = d.o[-1].replace('y="568"', 'y="567"')
d.save("3-responsibilities.svg")

# ── 4. data model ────────────────────────────────────────────────────────────
d = D(1100, 660, "4 · Data model", "Every table below a school carries school_id and is protected by row-level security. Observations and the audit log are append-only.")
T = {}
def tbl(key, x, y, title, cols, tone="card", w=170):
    h = 34 + 16 * len(cols)
    d.box(x, y, w, h, title, cols, tone, tsize=13.5); T[key] = (x, y, w, h)
def link(a, b, label=None, sa="b", sb="t", **k):
    def pt(key, side):
        x, y, w, h = T[key]
        return {"t": (x + w / 2, y), "b": (x + w / 2, y + h), "l": (x, y + h / 2), "r": (x + w, y + h / 2)}[side]
    (x1, y1), (x2, y2) = pt(a, sa), pt(b, sb)
    d.arrow(x1, y1, x2, y2, label, color="muted", **k)
d.frame(40, 110, 400, 220, "Platform & people", "violet")
tbl("schools", 60, 130, "schools", ["name · slug · status"], "violet")
tbl("sites", 60, 230, "sites", ["name · status"], "violet")
tbl("users", 250, 130, "users", ["role · password_hash", "status · lockout", "tours_done"], "violet")
tbl("user_sites", 250, 256, "user_sites", ["user ↔ site"], "violet")
link("schools", "sites"); link("schools", "users", sa="r", sb="l"); link("users", "user_sites")
d.frame(470, 110, 590, 220, "Clinical design (BCBA)", "accent")
tbl("students", 490, 130, "students", ["site · supervising BCBA", "status (never deleted)"], "accent")
tbl("assign", 490, 246, "staff_assignments", ["RBT ↔ student, with history"], "accent", 190)
tbl("plans", 690, 130, "plans", ["one active per student"], "accent", 160)
tbl("programs", 690, 220, "programs", ["kind · goal · mastery rule", "instruction · status"], "accent", 175)
tbl("targets", 885, 130, "targets", ["label · status"], "accent", 150)
tbl("phases", 885, 205, "phases", ["label · started_at"], "accent", 150)
tbl("annotations", 885, 268, "annotations", ["at · kind · body"], "accent", 150)
link("students", "assign"); link("students", "plans", sa="r", sb="l"); link("plans", "programs")
link("programs", "targets", sa="r", sb="l"); link("programs", "phases", sa="r", sb="l"); link("programs", "annotations", sa="r", sb="l")
d.frame(40, 380, 700, 240, "Collection (RBT devices)", "ok")
tbl("locks", 60, 400, "session_locks", ["one row per student", "holder · device · epoch", "heartbeat_at"], "ok")
tbl("sessions", 270, 400, "sessions", ["id from device · lock_epoch", "review_state: live | pending", "| accepted | rejected"], "ok", 200)
tbl("obs", 510, 400, "observations  (append-only)", ["id from device · recorded_at", "trial | event | duration | interval", "| abc | step | window | void", "voids → earlier row", "corrects → earlier row"], "ok", 210)
link("sessions", "obs", sa="r", sb="l")
d.text(60, 520, "A mistake is fixed by adding a void row —", 12, "ink2"); d.text(60, 537, "the API role cannot UPDATE or DELETE here.", 12, "ink2")
d.text(60, 566, "Graphs are computed from this log on read;", 12, "ink2"); d.text(60, 583, "pending and rejected sessions are excluded.", 12, "ink2")
d.frame(770, 380, 290, 240, "Accountability and sharing", "slate")
tbl("audit", 790, 400, "audit_log  (append-only)", ["who · role · action · entity · at"], "slate", 250)
tbl("tokens", 790, 462, "refresh_tokens · dismissals", ["rotating sessions; dismissed suggestions"], "slate", 250)
tbl("family", 790, 524, "Phase 3–4 tables", ["student_contacts · family_summaries", "messages · notifications · consents", "media · program_templates"], "slate", 250)
d.arrow(575, 330, 575, 398, "sessions and observations", color="muted", lx=590, ly=362, anchor="start")
d.save("4-data-model.svg")

# ── 5. sync & lock sequence ──────────────────────────────────────────────────
d = D(1100, 700, "5 · Offline sync and the session lock", "One student, two devices. The latest lock holder's data counts; the other is kept and reviewed — nothing is dropped.")
lanes = [("Marcus's phone", 150, "ok"), ("API + database", 480, "accent"), ("Jo's tablet", 800, "warn"), ("BCBA", 1000, "violet")]
for t, x, tone in lanes:
    d.box(x - 85, 100, 170, 40, t, [], tone, center=True, tsize=13.5)
    d.o.append(f'<path d="M{x} 140 V 670" stroke="{C["line"]}" stroke-width="1.5"/>')
def msg(y, a, b, label, tone="ink2", dash=False):
    xa, xb = lanes[a][1], lanes[b][1]
    d.arrow(xa + (6 if xb > xa else -6), y, xb - (6 if xb > xa else -6), y, label, color=tone, dash=dash)
def note(y, lane, s, tone="card", w=250, h=30):
    x = lanes[lane][1]
    d.box(x - w / 2, y, w, h, "", [], tone, r=8)
    d.text(x, y + 20, s, 12, "ink2", 500, "middle")
msg(180, 0, 1, "take lock for Ben");  msg(206, 1, 0, "granted · epoch 1", dash=True)
note(222, 0, "taps saved on device first (encrypted)", "ok", 268)
msg(280, 0, 1, "sync: session + observations (device ids)"); msg(306, 1, 0, "receipt: server holds 9", dash=True)
note(322, 0, "WiFi drops — recording continues", "slate", 250)
msg(380, 2, 1, "take lock for Ben"); msg(406, 1, 2, "409: Marcus is recording", "bad", dash=True)
msg(440, 2, 1, "take over (after warning)", "warn"); msg(466, 1, 2, "granted · epoch 2  (audited)", dash=True)
note(482, 2, "Jo records; syncs live", "warn", 200)
note(532, 0, "back online", "slate", 120)
msg(590, 0, 1, "heartbeat"); msg(616, 1, 0, "not held — Jo took over", "bad", dash=True)
note(630, 0, "banner; may keep recording", "warn_" if False else "warn", 220)
msg(590, 1, 3, "", "ink2")
d.o.pop()
d.box(385, 530, 190, 52, "", [], "accent", r=8)
d.text(480, 551, "overlap → lower epoch", 12, "accent", 650, "middle"); d.text(480, 568, "becomes “pending”", 12, "accent", 650, "middle")
d.arrow(575, 556, 915, 556, "review queue", color="violet")
d.box(915, 536, 170, 76, "Accept → counts", ["Exclude → kept,", "hidden, reason logged"], "violet", tsize=12.5)
d.save("5-sync-and-lock.svg")

# ── 6. security layers ───────────────────────────────────────────────────────
d = D(1100, 620, "6 · Security in depth", "A request passes four independent layers. Each one still holds if the layer before it has a bug.")
layers = [("1  Browser", "accent", ["httpOnly + SameSite=Strict cookies — no token readable by scripts", "Content-Security-Policy: default-src 'self' · no third-party requests",
                                    "CSRF header on every change · 15-minute idle sign-out", "Device store encrypted (AES-GCM, non-extractable key)"]),
          ("2  API", "ok", ["Argon2id passwords · 5 failures → 15-minute lock · sign-in throttle", "15-minute access token + rotating refresh; reuse revokes the chain",
                            "Optional two-factor sign-in (authenticator app, recovery codes)", "One access module (deps.py): out-of-scope ids answer 404"]),
          ("3  Database", "violet", ["API connects as aba_app, never as owner", "Row-level security: a query without WHERE still sees one school",
                                     "System admins: counts only, zero student rows", "observations + audit_log: INSERT and SELECT only"]),
          ("4  Accountability", "warn", ["Audit log: sign-ins, record views, every change, takeovers", "Corrections keep the original and the reason",
                                         "Health page: row counts + write/read canary", "Tests assert each layer separately"])]
for i, (t, tone, items) in enumerate(layers):
    y = 104 + i * 104
    d.box(60, y, 760, 92, t, [], tone, tsize=15)
    for k, it in enumerate(items):
        d.text(250 + (k % 2) * 0, y + 24 + k * 17 - 0, "•  " + it, 12, "ink2")
    if i < 3:
        d.arrow(40, y + 46, 40, y + 150, color="muted")
d.text(40, 96, "request", 11, "muted", 600, "middle")
d.frame(850, 104, 215, 404, "Environment gates", "bad")
for i, (t, s1, s2) in enumerate([("Persona sign-in", "Demo only;", "404 elsewhere"), ("Demo reset", "Demo / Dev / QA;", "routes absent in prod"), ("Test hooks, API docs", "not registered", "in prod"), ("AI and voice", "off per school; models", "on this machine only")]):
    d.box(868, 124 + i * 94, 180, 80, t, [s1, s2], "card", tsize=13)
d.box(60, 528, 1005, 62, "Still required before real student data (deployment, not in this repo)", ["TLS termination · disk encryption · backups and restore drill · enforced two-factor sign-in · counsel's ruling on HIPAA vs FERPA"], "bad", tsize=13.5)
d.save("6-security.svg")

# ── 7. local models ──────────────────────────────────────────────────────────
d = D(1100, 640, "7 · Local models", "Optional helper processes on the same machine as the API. Student data never crosses the dashed line.")
d.frame(36, 104, 1028, 396, "This machine only — ai.py refuses any other host", "violet")
d.box(56, 124, 240, 108, "Draft a family summary", ["BCBA · Progress report", "in: program_facts, first name,", "family-friendly goal names"], "accent", tsize=13.5)
d.box(56, 246, 240, 92, "Ask about my caseload", ["BCBA · Caseload", "in: status facts already on screen"], "accent", tsize=13.5)
d.box(56, 352, 240, 108, "Dictate a session note", ["RBT or BCBA · End session", "in: up to 60 s of audio (8 MB cap),", "transcribed, then discarded"], "ok", tsize=13.5)
d.box(380, 124, 250, 336, "API · aba/ai.py", [], "card", tsize=15)
for i, (a, b) in enumerate([("1  School switch", "off by default, per school"), ("2  Role check", "clinical team only (deps.py)"), ("3  Host check", "localhost / 127.0.0.1 / ::1"),
                            ("4  Fixed prompts", "facts only, no advice"), ("5  Audit row", "who asked, which model"), ("6  Draft, never sent", "a person edits and publishes")]):
    d.text(396, 176 + i * 47, a, 12.5, "ink", 650); d.text(396, 193 + i * 47, b, 11.5, "muted")
d.box(720, 118, 324, 92, "llama.cpp llama-server  ·  :8080", ["text, tried first when LLM_URL is set", "POST /v1/chat/completions · thinking off", "model: Gemma 4 26B (Q5_K_M) · draft ≈ 7 s"], "violet", tsize=13.5)
d.box(720, 218, 324, 76, "Ollama 0.11.7  ·  :11434", ["text, fallback · POST /api/generate", "mistral-nemo:12b (7.1 GB) · first answer ≈ 50 s"], "violet", tsize=13.5)
d.box(720, 300, 324, 160, "whisper.cpp server 1.9.5  ·  :8178", ["speech to text · POST /v1/audio/transcriptions", "model: Whisper small.en (ggml, 488 MB)", "file: data/models/whisper/ (git-ignored)",
                                                               "ffmpeg converts browser audio to WAV", "≈ 1 s for a 7 s note · start: make speech"], "ok", tsize=14)
d.arrow(296, 178, 380, 178, color="accent"); d.arrow(296, 292, 380, 292, color="accent"); d.arrow(296, 406, 380, 406, color="ok")
d.arrow(630, 164, 720, 164, "facts + prompt", color="violet"); d.arrow(630, 256, 720, 256, "if :8080 is down", color="violet", dash=True); d.arrow(630, 380, 720, 380, "audio", color="ok")
d.box(56, 524, 320, 86, "Out: always a draft", ["Summary → editable box → BCBA publishes", "Answer → labelled “may be wrong”", "Dictation → text in the note field"], "card", tsize=13.5)
d.box(400, 524, 320, 86, "Not used by the app", ["Nemotron ASR package on disk (needs", "Foundry Local) · gemma3:27b in Ollama", "(installed, selectable with AI_MODEL)"], "slate", tsize=13.5)
d.box(744, 524, 320, 86, "Refused", ["Any model URL that is not this machine", "Any request when the school switch is off", "A hosted model needs a new ADR"], "bad", tsize=13.5)
d.save("7-local-models.svg")

# ── 8. derived facts ─────────────────────────────────────────────────────────
d = D(1100, 600, "8 · From a tap to what people read", "Everything shown is computed from the append-only log. One fact source feeds reports, family summaries and model drafts.")
d.box(40, 110, 200, 120, "observations", ["append-only log", "trial · event · duration", "interval · abc · step", "void / correct = new rows"], "ok", tsize=14.5)
d.box(40, 262, 200, 92, "sessions, phases,", ["programs + mastery rules", "(BCBA-authored context)"], "card", tsize=14)
d.box(300, 110, 210, 120, "Series", ["analytics.SERIES_SQL", "one value per session", "% correct, count, rate,", "duration"], "accent", tsize=14.5)
d.box(300, 262, 210, 92, "Status flag", ["analytics.evaluate()", "mastered · regression ·", "variable · stale · on track"], "accent", tsize=14.5)
d.box(300, 386, 210, 110, "Suggestions", ["plain statistics (ADR-0013)", "change point · forecast ·", "unusual session · recorder", "gap · prompt dependence"], "warn", tsize=14.5)
d.box(570, 110, 220, 120, "reports.program_facts", ["the one fact source", "name, plain name, latest,", "target, status, reason,", "forecast"], "solid", tsize=14.5)
d.box(570, 262, 220, 92, "Graph + caseload", ["BCBA (RBT: read-only)", "accept or dismiss a suggestion"], "card", tsize=14)
d.box(570, 386, 220, 110, "Service log", ["from sessions, not observations", "15-minute units (8-minute rule)", "BCBA, school admin · CSV"], "card", tsize=14)
d.box(850, 96, 214, 70, "Progress report", ["print / PDF · BCBA"], "card", tsize=14)
d.box(850, 180, 214, 86, "Local-model draft", ["optional · same facts", "edited before use"], "violet", tsize=14)
d.box(850, 280, 214, 86, "Family summary", ["frozen snapshot,", "published by the BCBA"], "ok", tsize=14)
d.frame(836, 396, 242, 110, "Family & classroom portal", "ok")
d.box(850, 410, 214, 82, "Parent · teacher", ["read published snapshots", "and program_facts only"], "ok", tsize=14)
d.arrow(240, 170, 300, 170); d.arrow(240, 308, 300, 308); d.arrow(405, 230, 405, 262); d.arrow(405, 354, 405, 386)
d.arrow(510, 170, 570, 170); d.arrow(510, 308, 570, 308); d.arrow(510, 300, 570, 190, color="muted", dash=True); d.arrow(510, 440, 570, 330, color="warn")
d.o.append(f'<path d="M140 354 L140 512 L680 512" stroke="{C["muted"]}" stroke-width="1.5" fill="none" stroke-dasharray="5 4"/>')
d.arrow(680, 512, 680, 498, color="muted", dash=True)
d.arrow(790, 140, 850, 130); d.arrow(790, 170, 850, 220, color="violet"); d.arrow(790, 200, 850, 320, color="ok")
d.arrow(957, 266, 957, 280, color="violet", dash=True); d.arrow(957, 366, 957, 410, color="ok")
d.box(40, 528, 1024, 46, "Rule 12–13 (AGENTS.md): families never read raw sessions or observations; extend program_facts instead of writing a second query.", [], "slate", tsize=13)
d.save("8-derived-facts.svg")

# ── 9. runtime ───────────────────────────────────────────────────────────────
d = D(1100, 620, "9 · Runtime — processes, ports and files", "What is running on the machine during `make demo`, what each process listens on, and where state lives.")
d.box(40, 110, 220, 150, "Browser", ["http://localhost:5173", "IndexedDB: encrypted outbox", "(AES-GCM, key not extractable)", "service worker: built app only", "cookies: httpOnly, SameSite"], "accent", tsize=14.5)
d.box(320, 110, 220, 70, "Vite dev server  ·  :5173", ["dev only · proxies /api"], "slate", tsize=13.5)
d.box(320, 196, 220, 64, "API (uvicorn)  ·  :8010", ["serves the built app in prod"], "solid", tsize=13.5)
d.box(600, 110, 220, 150, "PostgreSQL 14", ["socket /tmp · one db per env:", "aba_demo · aba_dev · aba_qa", "aba_test (pytest)", "role aba_app: API, no DDL", "owner: migrate + reset only"], "violet", tsize=14.5)
d.frame(866, 110, 198, 150, "Optional · localhost", "violet")
d.box(878, 118, 174, 42, "llama-server  ·  :8080", [], "violet", tsize=12.5)
d.box(878, 164, 174, 42, "Ollama  ·  :11434", [], "violet", tsize=12.5)
d.box(878, 210, 174, 42, "whisper-server  ·  :8178", [], "ok", tsize=12.5)
d.arrow(260, 145, 320, 145); d.arrow(430, 180, 430, 196, "/api"); d.arrow(540, 228, 600, 228, "SQL + RLS", color="violet")
d.o.append(f'<path d="M430 260 L430 280 L965 280" stroke="{C["muted"]}" stroke-width="1.5" fill="none" stroke-dasharray="5 4"/>')
d.arrow(965, 280, 965, 262, color="muted", dash=True)
d.text(700, 275, "HTTP on localhost · only when a school has the feature on", 11.5, "muted", 600, "middle")
d.box(40, 300, 330, 190, "Configuration  ·  .env (git-ignored)", ["APP_ENV — demo | dev | qa | prod", "JWT_SECRET — generated by make setup", "DEMO_PASSWORD — seeded accounts", "WHISPER_URL — http://127.0.0.1:8178", "LLM_URL — http://127.0.0.1:8080 (optional)", "OLLAMA_URL — default 127.0.0.1:11434", "AI_MODEL — default: first installed",
                                                                          "DATABASE_URL — default from APP_ENV", "per school: schools.settings {ai, voice}"], "card", tsize=14)
d.box(400, 300, 320, 190, "State on disk", ["PostgreSQL data — the system of record", "data/media/<env>/ — photos, short videos", "data/models/whisper/ — speech model", "data/tmp/ — audio being converted; emptied", "docs/screenshots/ — walkthrough output", "Nothing else: no cache, queue or search index"], "card", tsize=14)
d.box(750, 300, 314, 190, "Commands", ["make setup — secrets, dbs, schema, seed", "make demo — API + web, Demo env", "make speech — optional speech server", "make reset — restore demo data", "make test — 39 API tests + typecheck", "make screenshots — 78-step walkthrough", "make diagrams — these pictures"], "card", tsize=14)
d.box(40, 520, 1024, 66, "Environment gates (server-side, by APP_ENV)", ["Persona sign-in: demo only · Reset: demo, dev, qa · Test hooks and API docs: never in prod · prod has no owner connection unless ADMIN_DATABASE_URL is set"], "bad", tsize=13.5)
d.save("9-runtime.svg")


def chain(d, x, y, w, steps, gap=14, h=58):
    """A vertical chain of checks; each step is (title, detail, tone, refusal-or-None). Returns the y after the last box."""
    for i, (t, s, tone, no) in enumerate(steps):
        d.box(x, y, w, h, t, [s], tone, tsize=13.5)
        if no:
            d.arrow(x + w, y + h / 2, x + w + 46, y + h / 2, color="bad")
            d.text(x + w + 54, y + h / 2 + 4, no, 12, "bad", 600)
        if i < len(steps) - 1:
            d.arrow(x + w / 2, y + h, x + w / 2, y + h + gap, color="muted")
        y += h + gap
    return y - gap


# ── 10. sign-in and two-factor ───────────────────────────────────────────────
d = D(1100, 660, "10 · Sign-in and two-factor", "Every sign-in passes the same chain. A wrong second factor counts toward the lock exactly like a wrong password.")
d.text(60, 104, "SIGN-IN", 10.5, "muted", 700, ls=1.1)
end = chain(d, 60, 114, 380, [
    ("1  Throttle", "per address, in the API process", "card", "429 slow down"),
    ("2  Locked?", "5 failures lock the account for 15 minutes", "card", "423 locked"),
    ("3  Password", "Argon2id · same error for unknown email or wrong password", "accent", "401 generic · failure counted"),
    ("4  Second factor, if enrolled", "6-digit code (±30 s drift) or a one-use recovery code", "violet", "401 · failure counted"),
    ("5  Issue session", "15-min access token + rotating refresh, httpOnly cookies", "ok", None),
    ("6  Audit row", "login · login.failed · login.2fa_failed · login.locked", "warn", None)])
d.box(60, end + 20, 380, 62, "Later requests", ["A reused refresh token revokes the whole chain"], "slate", tsize=13.5)
d.frame(720, 114, 344, 300, "Enrolment — Account → Security", "violet")
for i, (t, s) in enumerate([("Start", "server makes a secret; shown as a key to type"), ("Confirm", "enter one code from the app to switch it on"),
                            ("Recovery codes", "8 codes, shown once, stored only as hashes"), ("Switch off", "needs a current code or a recovery code")]):
    d.box(736, 130 + i * 68, 312, 56, t, [s], "card", tsize=13)
d.box(720, 438, 344, 150, "Known gaps", ["Not enforced for any role yet", "No QR code: the key is typed by hand", "The secret is stored unencrypted in the", "database; relies on disk encryption", "No password reset by email"], "bad", tsize=13.5)
d.save("10-sign-in.svg")

# ── 11. consent and media ────────────────────────────────────────────────────
d = D(1100, 640, "11 · Consent and media", "A photo or video is stored only while a recorded consent of that kind is current. Viewing is limited to the clinical team.")
d.text(60, 104, "UPLOAD  ·  RBT OR BCBA", 10.5, "muted", 700, ls=1.1)
end = chain(d, 60, 114, 380, [
    ("1  Student in scope", "deps.py: caseload or assignment", "card", "404 not found"),
    ("2  Type allow-list", "JPEG, PNG, WebP · MP4, WebM, MOV", "card", "415 unsupported"),
    ("3  Current consent of that kind", "photo and video are consented separately", "violet", "403 no consent on record"),
    ("4  Size", "25 MB at most", "card", "413 too large"),
    ("5  Store · file name chosen by the server", "data/media/<env>/<school>/<uuid>.<ext>", "ok", None),
    ("6  Row + audit", "media row (RLS) · media.uploaded", "warn", None)])
d.frame(720, 114, 344, 190, "Consent — BCBA only", "violet")
d.box(736, 130, 312, 74, "Record", ["who gave it, how (form, email…), date", "a new record replaces the old one"], "card", tsize=13)
d.box(736, 214, 312, 74, "Revoke", ["new uploads are refused at step 3", "existing files stay until removed"], "card", tsize=13)
d.frame(720, 334, 344, 152, "After upload", "ok")
d.box(736, 350, 312, 56, "View", ["clinical team only · audited · never cached"], "card", tsize=13)
d.box(736, 416, 312, 56, "Remove", ["BCBA · row hidden, action audited"], "card", tsize=13)
d.box(720, 508, 344, 102, "Known gaps", ["Parents and teachers cannot see media", "Removed and reset files stay on disk", "No virus scan; no in-app video capture"], "bad", tsize=13.5)
d.save("11-consent-media.svg")

# ── 12. notifications ────────────────────────────────────────────────────────
d = D(1100, 560, "12 · Notifications", "Five events write in-app notifications in the same transaction as the event. Nothing leaves the system.")
ev = [("Team message", "RBT or BCBA", "BCBA + assigned staff", "accent"), ("Message to family or teacher", "BCBA only", "guardians or teachers", "accent"),
      ("Summary published", "BCBA", "guardians", "ok"), ("Message from home or class", "parent or teacher", "the student's BCBA", "violet"), ("Home count recorded", "parent", "BCBA → review queue", "violet")]
for i, (t, by, to, tone) in enumerate(ev):
    y = 110 + i * 76
    d.box(40, y, 290, 62, t, ["by: " + by], tone, tsize=13.5)
    d.arrow(330, y + 31, 420, 110 + 2 * 76 + 31 if False else y + 31, color="muted")
    d.text(436, y + 28, "to", 11, "muted", 600); d.text(456, y + 28, to, 12.5, "ink", 600)
d.box(700, 110, 364, 128, "Ctx.notify  ·  deps.py", ["one place; same transaction as the event", "never notifies the sender", "text carries first names only", "link opens the right page for that role"], "solid", tsize=14.5)
d.box(700, 262, 364, 92, "notifications table", ["school_id + user_id · row-level security", "read_at set when the bell is opened"], "violet", tsize=14.5)
d.box(700, 378, 364, 92, "Bell in the app shell", ["asks every 60 s while the app is open", "unread count · click a row to go there"], "accent", tsize=14.5)
d.arrow(882, 238, 882, 262); d.arrow(882, 354, 882, 378)
d.arrow(676, 174, 700, 174, color="muted")
d.o.append(f'<path d="M676 141 L676 445" stroke="{C["muted"]}" stroke-width="1.5" fill="none"/>')
d.box(40, 494, 1024, 44, "Not built: email, SMS and push. A parent sees a notification only after opening the app.", [], "bad", tsize=13)
d.save("12-notifications.svg")

# ── 13. deployment (proposed) ────────────────────────────────────────────────
d = D(1100, 620, "13 · Deployment — proposed, not built", "A starting point for discussion. The server setup shown here does not exist yet; each red item is an open decision for the owner.")
d.box(40, 120, 170, 96, "Devices", ["phones, tablets,", "laptops · installed", "web app"], "accent", tsize=14)
d.frame(250, 104, 814, 330, "One school-controlled server (or one cloud VM)", "slate")
d.box(270, 120, 190, 96, "Reverse proxy", ["TLS certificate", "HTTPS only · HSTS", "request size limits"], "bad", tsize=14)
d.box(500, 120, 220, 96, "API  ·  APP_ENV=prod", ["serves the built web app", "run by a supervisor", "no demo or test routes"], "solid", tsize=14)
d.box(760, 120, 284, 96, "PostgreSQL", ["aba_app role for the API", "owner role for migrations only", "encrypted volume"], "violet", tsize=14)
d.box(270, 250, 190, 96, "Secrets", ["JWT_SECRET and db", "passwords from a", "secret store, not a file"], "bad", tsize=14)
d.box(500, 250, 220, 96, "Local models (optional)", ["text + speech helpers", "localhost only", "needs a capable machine"], "violet", tsize=14)
d.box(760, 250, 284, 96, "Backups", ["nightly dump + media folder", "stored off the server, encrypted", "restore drill on a schedule"], "bad", tsize=14)
d.box(270, 366, 774, 52, "Monitoring: health endpoint, disk space, failed sign-ins, backup age — alert a named person", [], "bad", tsize=13)
d.arrow(210, 168, 270, 168, "HTTPS"); d.arrow(460, 168, 500, 168); d.arrow(720, 168, 760, 168, color="violet")
d.arrow(610, 216, 610, 250, color="muted", dash=True); d.arrow(902, 216, 902, 250, color="bad", dash=True)
d.box(40, 462, 500, 128, "Decisions needed first", ["Counsel: HIPAA or FERPA, and what that requires of hosting", "On-site server or cloud; who operates and patches it", "Recovery targets: how much data loss and downtime is acceptable", "Audit-log retention; enforced two-factor for staff"], "bad", tsize=14)
d.box(564, 462, 500, 128, "Already in the repository", ["APP_ENV=prod removes persona sign-in, reset, test hooks and API docs", "The API serves the production web build (make build)", "Unprivileged database role; migrations as numbered SQL files", "Health page with row counts and a write/read canary"], "ok", tsize=14)
d.save("13-deployment-proposed.svg")
