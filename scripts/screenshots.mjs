// End-to-end walkthrough that doubles as the screenshot source for the slide pack.
// Usage: make demo (in another terminal), then: make screenshots
// It drives the real app through every role, saves PNGs to docs/screenshots/, and fails loudly
// if a step can't be completed — so it is also a smoke test. It resets demo data before and after.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.ABA_URL ?? "http://localhost:5173";
const OUT = new URL("../docs/screenshots/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const BEN_MANDING = "f0000000-0000-4000-8000-000000000003", BEN_ELOPE = "f0000000-0000-4000-8000-000000000004";
const BEN = "d0000000-0000-4000-8000-000000000002";

let browser;
// A spoken fixture stands in for the microphone, so dictation can be exercised without a person talking.
const args = ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", `--use-file-for-fake-audio-capture=${new URL("./fixtures/voice-note.wav", import.meta.url).pathname}`];
try { browser = await chromium.launch({ channel: "chrome", args }); } catch { browser = await chromium.launch({ args }); }
// Voice notes are optional: the step runs only when the local speech server (make speech) is up.
const SPEECH = await fetch(process.env.WHISPER_URL ?? "http://127.0.0.1:8178").then(() => true, () => false);
const t = id => `[data-testid="${id}"]`;
let n = 0;
const pages = new Set();
process.on('uncaughtException', async e => { console.error(String(e).split('\n').slice(0, 4).join('\n')); let i = 0; for (const p of pages) if (!p.isClosed()) await p.screenshot({ path: `/tmp/aba-fail-${i++}.png` }).catch(() => {}); process.exit(1); });

async function open(persona, { phone = false, dark = false } = {}) {
  const ctx = await browser.newContext({
    viewport: phone ? { width: 420, height: 860 } : { width: 1440, height: 980 },
    deviceScaleFactor: 2, colorScheme: dark ? "dark" : "light",
  });
  const page = await ctx.newPage();
  page.setDefaultTimeout(8000);
  pages.add(page);
  page.on("pageerror", e => { console.error("PAGE ERROR:", e.message); process.exitCode = 1; });
  await page.goto(BASE);
  if (persona) { await page.click(t(`persona-${persona}`)); await page.waitForSelector(t("env-role")); }
  return page;
}
async function shot(page, name, opts = {}) {
  await page.waitForTimeout(opts.wait ?? 450);
  const file = `${String(++n).padStart(2, "0")}-${name}.png`;
  await page.screenshot({ path: OUT + file, ...(opts.full ? { fullPage: true } : {}) });
  console.log("✓", file);
}
const dismissNudge = async page => { const b = page.locator(t("tour-dismiss")); if (await b.count()) await b.click(); };

// known starting state
{
  const page = await open("bcba-nair");
  await page.click(t("reset-demo")); await page.click(t("reset-confirm"));
  await page.waitForSelector(t("student-card-Ava")); await page.context().close();
}

/* ───────── sign-in ───────── */
{ const page = await open(null); await shot(page, "sign-in"); await page.context().close(); }

/* ───────── BCBA ───────── */
{
  const page = await open("bcba-nair");
  await page.waitForSelector(t("tour-nudge"));
  await shot(page, "bcba-caseload");
  await page.click(t("tour-start")); await page.click(t("tour-next")); await shot(page, "bcba-tour", { wait: 700 });
  await page.click(t("tour-next")); await page.click(t("tour-next")); await page.click(t("tour-next")); await page.click(t("tour-next"));
  await page.click(t("filter-regression")); await shot(page, "bcba-caseload-filter");
  await page.click(t("filter-regression"));

  await page.goto(`${BASE}/clinic/programs/${BEN_MANDING}`); await page.waitForSelector(t("session-chart")); await dismissNudge(page);
  await page.hover(t("chart-session-14")); await shot(page, "bcba-graph-phases");
  await page.hover(t("chart-session-16")); await page.click(t("chart-add-note"));
  await page.fill(t("composer-text"), "Parent reports using picture cards at home");
  await page.click(t("composer-kind-context")); await shot(page, "bcba-annotate");
  await page.keyboard.press("Enter"); await page.waitForSelector(t("toast")); await shot(page, "bcba-annotate-saved", { wait: 300 });
  await page.locator(t("chart-note")).last().hover(); await shot(page, "bcba-note-hover");
  // phase change from the same gesture
  await page.locator(t("chart-session-17")).focus(); await page.keyboard.press("n");
  await page.fill(t("composer-text"), "Added peer model during snack"); await page.check(t("composer-phase"));
  await page.fill(t("composer-phase-label"), "Peer modelling"); await shot(page, "bcba-new-phase");
  await page.click(t("composer-save")); await page.waitForSelector(t("toast")); await page.mouse.move(5, 300); await shot(page, "bcba-new-phase-saved", { wait: 600 });

  await page.click(t("chart-session-12")); await page.waitForSelector(t("obs-row"));
  await page.locator(t("obs-fix")).nth(2).click(); await page.fill(t("fix-reason"), "Scored from video review"); await shot(page, "bcba-session-correct");
  await page.click(t("fix-incorrect")); await page.waitForTimeout(400); await shot(page, "bcba-session-corrected");
  await page.keyboard.press("Escape");

  await page.click(t("edit-program")); await page.fill(t("mastery-value"), "90"); await page.fill(t("program-name"), "Manding for preferred items (PECS)");
  await page.fill(t("target-input"), "bubbles"); await page.keyboard.press("Enter"); await shot(page, "bcba-program-form-undo");
  await page.click(t("form-undo")); await page.click(t("form-undo")); await page.keyboard.press("Escape");

  await page.goto(`${BASE}/clinic/programs/${BEN_ELOPE}`); await page.waitForSelector(t("session-chart"));
  await page.click(t("chart-mode-bar")); await page.hover(t("chart-session-10")); await shot(page, "bcba-graph-bar");
  await page.click(t("chart-mode-line"));

  await page.goto(`${BASE}/clinic/students/${BEN}`); await page.waitForSelector(t("add-program")); await shot(page, "bcba-student");
  await page.click(t("edit-team")); await shot(page, "bcba-team"); await page.keyboard.press("Escape");
  await page.click(t("add-program")); await page.fill(t("program-name"), "Waiting for a turn"); await page.selectOption(t("program-kind"), "interval"); await shot(page, "bcba-new-program");
  await page.keyboard.press("Escape");

  await page.goto(`${BASE}/clinic/review`); await page.waitForSelector(t("review-item")); await shot(page, "bcba-review");
  await page.keyboard.press("Meta+k"); await page.fill(t("command-input"), "dee"); await shot(page, "command-palette");
  await page.keyboard.press("Escape"); await page.keyboard.press("?"); await shot(page, "shortcuts");
  await page.context().close();
}

/* ───────── RBT (phone) ───────── */
{
  const page = await open("rbt-rivera", { phone: true });
  await page.waitForSelector(t("collect-Ben")); await page.waitForSelector(t("tour-nudge")); await shot(page, "rbt-today");
  await page.click(t("tour-start")); await page.click(t("tour-next")); await shot(page, "rbt-tour", { wait: 700 }); await page.click(t("tour-skip"));
  await page.click(t("collect-Ben")); await page.waitForSelector(t("start-session")); await shot(page, "rbt-start");
  await page.click(t("start-session")); await page.waitForSelector(t("recorder")); await dismissNudge(page);
  for (const o of ["correct", "correct", "prompted", "correct", "incorrect", "correct", "correct", "no_response", "correct"]) { await page.click(t(`outcome-${o}`)); await page.waitForTimeout(60); }
  await shot(page, "rbt-trials");
  await page.click(t("undo-last")); await shot(page, "rbt-undo", { wait: 250 });
  await page.locator(t("tab-frequency")).first().click(); for (let i = 0; i < 3; i++) await page.click(t("tally")); await shot(page, "rbt-frequency");

  // go offline, keep recording, see it queue, come back
  await page.click(t("sync-pill")); await page.check(t("simulate-offline")); await page.keyboard.press("Escape");
  await page.locator(t("tab-trial")).first().click(); for (const o of ["correct", "correct", "prompted"]) await page.click(t(`outcome-${o}`));
  await shot(page, "rbt-offline");
  await page.click(t("sync-pill")); await shot(page, "rbt-sync-offline");
  await page.uncheck(t("simulate-offline")); await page.waitForSelector(`${t("sync-pill")}[data-state="synced"]`); await shot(page, "rbt-sync-receipt", { wait: 700 });
  await page.keyboard.press("Escape");

  // a second RBT tries to start the same student → lock conflict → takeover → first device is told
  const jo = await open("rbt-chen", { phone: true });
  await jo.click(t("collect-Ben")); await jo.click(t("start-session")); await jo.waitForSelector(t("lock-dialog")); await shot(jo, "rbt-lock-conflict");
  await jo.click(t("takeover")); await jo.waitForSelector(t("recorder")); await dismissNudge(jo);
  await jo.click(t("outcome-correct")); await jo.click(t("outcome-correct"));
  await page.reload(); await page.waitForSelector(t("lock-lost")); await shot(page, "rbt-lock-lost");
  await page.click(t("end-session")); await page.fill(t("session-note"), "Good session; tablet was the strongest reinforcer."); await shot(page, "rbt-end");
  if (SPEECH) {
    await page.click(t("dictate")); await page.waitForTimeout(8000); await page.click(t("dictate"));
    await page.waitForFunction(sel => /asked for a break/i.test(document.querySelector(sel)?.value ?? ""), t("session-note"), { timeout: 30000 });
    await page.waitForTimeout(450); await page.screenshot({ path: OUT + "voice-note.png" }); console.log("✓ voice-note.png (dictated on the local speech model)");
  } else console.log("– voice note skipped: no local speech server");
  await page.click(t("end-confirm")); await page.waitForSelector(t("collect-Ben"));
  await jo.click(t("end-session")); await jo.click(t("end-confirm")); await jo.waitForSelector(t("collect-Ben"));
  await jo.context().close(); await page.context().close();
}

/* ───────── BCBA sees the displaced session in review ───────── */
{
  const page = await open("bcba-nair"); await dismissNudge(page);
  await page.goto(`${BASE}/clinic/review`); await page.waitForSelector(t("review-item")); await shot(page, "bcba-review-takeover");
  await page.locator(t("review-accept")).first().click(); await page.waitForSelector(t("toast")); await shot(page, "bcba-review-accepted", { wait: 300 });
  await page.context().close();
}

/* ───────── school admin ───────── */
{
  const page = await open("school_admin-raman");
  await page.waitForSelector(t("site-East Harlem")); await page.waitForSelector(t("tour-nudge")); await dismissNudge(page); await shot(page, "school-overview");
  await page.click(t("nav-school-people")); await page.waitForSelector(t("users-table")); await shot(page, "school-people");
  await page.click(t("add-user")); await page.fill(t("user-name"), "Riley Park"); await page.fill(t("user-email"), "riley.park@bridgeway.example"); await shot(page, "school-add-person");
  await page.click(t("user-save")); await page.waitForSelector(t("temp-password")); await shot(page, "school-temp-password");
  await page.click(t("temp-password-done"));
  await page.click(t("nav-school-students")); await page.waitForSelector(t("students-table")); await shot(page, "school-students");
  await page.click(t("add-student")); await page.fill(t("student-first"), "Mia"); await page.fill(t("student-last"), "Okoye"); await shot(page, "school-enrol"); await page.keyboard.press("Escape");
  await page.click(t("nav-school-audit")); await page.waitForSelector(t("audit-table")); await shot(page, "school-audit");
  await page.context().close();
}

/* ───────── new staff member: forced password change ───────── */
// (covered by API tests; the temp password is shown once and never stored, so no screenshot login here)

/* ───────── system admin ───────── */
{
  const page = await open("system_admin-okafor");
  await page.waitForSelector(t("school-bridgeway")); await page.waitForSelector(t("tour-nudge")); await dismissNudge(page); await shot(page, "system-schools");
  await page.click(t("add-school")); await page.fill(t("school-name"), "Riverside Day School"); await page.fill(t("school-admin-name"), "Dana Whitfield"); await page.fill(t("school-admin-email"), "dana@riverside.example");
  await shot(page, "system-add-school"); await page.keyboard.press("Escape");
  await page.click(t("nav-system-health")); await page.waitForSelector(t("row-counts")); await shot(page, "system-health", { full: true });
  await page.click(t("nav-system-audit")); await page.waitForSelector(t("audit-table")); await shot(page, "system-audit");
  await page.goto(`${BASE}/design`); await page.waitForSelector(t("session-chart")); await shot(page, "design-system", { full: true });
  await page.click(t("reset-demo")); await shot(page, "demo-reset");
  await page.keyboard.press("Escape");
  await page.context().close();
}

/* ═════════ Phase 2–4 ═════════ */
const P = n => `f0000000-0000-4000-8000-0000000000${n}`;
const DEE = "d0000000-0000-4000-8000-000000000003";

/* analytics suggestions, new recording methods, reports (BCBA) */
{
  const page = await open("bcba-nair"); await dismissNudge(page);
  await page.goto(`${BASE}/clinic/programs/${P(12)}`); await page.waitForSelector(t("insights")); await dismissNudge(page); await shot(page, "insights-change-point");
  await page.click(t("insight-add-phase")); await page.fill(t("composer-phase-label"), "New classroom aide"); await shot(page, "insights-accept-phase");
  await page.keyboard.press("Escape");
  await page.goto(`${BASE}/clinic/programs/${P("06")}`); await page.waitForSelector(t("chart-unusual")); await shot(page, "insights-unusual");
  await page.goto(`${BASE}/clinic/programs/${P(13)}`); await page.waitForSelector(t("insight-prompt_dependence")); await shot(page, "insights-prompt-dependence");
  await page.goto(`${BASE}/clinic/programs/${P(15)}`); await page.waitForSelector(t("abc-patterns")); await shot(page, "abc-patterns", { full: true });
  await page.click(t("chart-mode-cumulative")); await shot(page, "graph-cumulative");
  await page.click(t("chart-mode-table")); await page.waitForSelector(t("data-table")); await shot(page, "graph-table"); await page.click(t("chart-mode-line"));
  await page.goto(`${BASE}/clinic/programs/${P(14)}`); await page.waitForSelector(t("session-chart")); await shot(page, "graph-interval");
  await page.goto(`${BASE}/clinic/programs/${P(16)}`); await page.waitForSelector(t("session-chart")); await page.click(t("chart-session-8")); await page.waitForSelector(t("obs-row")); await shot(page, "graph-task-analysis");
  await page.keyboard.press("Escape");
  await page.goto(`${BASE}/clinic/students/${DEE}`); await page.click(t("add-program")); await page.selectOption(t("program-template"), { index: 2 }); await shot(page, "program-from-template");
  await page.keyboard.press("Escape");
  await page.goto(`${BASE}/clinic/students/${BEN}`); await page.waitForSelector(t("contacts-card")); await page.click(t("thread-family")); await shot(page, "student-messages-family");
  await page.goto(`${BASE}/clinic/students/${BEN}/report`); await page.waitForSelector(t("report-program"));
  await page.locator(t("report-program")).first().evaluate(el => el.scrollIntoView({ block: "start" }));   // the family card sits above; this shot is about the report itself
  await shot(page, "progress-report");
  await page.locator(t("family-summary")).scrollIntoViewIfNeeded();
  await page.click(t("summary-draft")); await page.waitForFunction(() => document.querySelector('[data-testid="summary-body"]').value.length > 80, null, { timeout: 180000 });
  await shot(page, "family-summary-ai-draft");
  await page.click(t("summary-publish")); await page.waitForSelector(t("toast"));
  await page.goto(`${BASE}/clinic/service-log`); await page.waitForSelector(t("service-log")); await shot(page, "service-log");
  await page.goto(`${BASE}/clinic`); await page.click(t("ask-open")); await page.fill(t("ask-input"), "Which programs need a decision this week?"); await page.click(t("ask-send"));
  await page.waitForSelector(t("ask-answer"), { timeout: 180000 }); await shot(page, "ask-caseload");
  await page.keyboard.press("Escape");
  await page.click(t("user-menu")); await page.click(t("open-security")); await page.click(t("totp-start")); await page.waitForSelector(t("totp-secret")); await shot(page, "two-factor-setup");
  await page.context().close();
}

/* new recorders (RBT phone) */
{
  const page = await open("rbt-rivera", { phone: true }); await page.waitForSelector(t("collect-Dee")); await dismissNudge(page);
  await page.click(t("collect-Dee")); await page.click(t("start-session")); await page.waitForSelector(t("recorder")); await dismissNudge(page);
  await page.click(t("tab-abc")); await page.click(t("abc-a-1")); await page.click(t("abc-c-0")); await page.click(t("abc-log"));
  await page.click(t("abc-a-0")); await page.click(t("abc-c-2")); await shot(page, "rbt-abc");
  await page.click(t("abc-log"));
  await page.click(t("tab-interval")); await page.click(t("interval-start")); await page.click(t("interval-yes")); await shot(page, "rbt-interval", { wait: 900 });
  await page.click(t("end-session")); await page.click(t("end-confirm")); await page.waitForSelector(t("collect-Ava"));
  await page.click(t("collect-Ava")); await page.click(t("start-session")); await page.waitForSelector(t("recorder"));
  await page.click(t("tab-task")); for (const o of ["correct", "correct", "correct", "prompted", "correct"]) await page.click(t(`step-${o}`));
  await shot(page, "rbt-task-analysis");
  await page.click(t("end-session")); await page.click(t("end-confirm")); await page.waitForSelector(t("collect-Ava"));
  await page.context().close();
}

/* family and classroom portal */
{
  const page = await open("parent-tran"); await page.waitForSelector(t("child-Ben")); await page.waitForSelector(t("tour-nudge")); await shot(page, "parent-home");
  await dismissNudge(page);
  await page.click(t("bell")); await shot(page, "parent-notifications"); await page.keyboard.press("Escape");
  await page.click(t("child-Ben")); await page.waitForSelector(t("goals")); await shot(page, "parent-child", { full: true });
  await page.locator(t("home-data")).scrollIntoViewIfNeeded();
  for (let i = 0; i < 4; i++) await page.click(t("home-plus")); await page.fill(t("home-note"), "Mostly at dinner, once getting dressed"); await shot(page, "parent-home-count");
  await page.click(t("home-send")); await page.waitForSelector(t("toast"));
  await page.fill(t("thread-input"), "He asked for help with his zip this morning!"); await page.click(t("thread-send")); await page.waitForTimeout(500);
  await page.context().close();
  const phone = await open("parent-tran", { phone: true }); await dismissNudge(phone); await phone.click(t("child-Ben")); await phone.waitForSelector(t("goals")); await shot(phone, "parent-phone");
  await phone.context().close();
  const teach = await open("teacher-adeyemi"); await teach.waitForSelector(t("child-Ben")); await dismissNudge(teach); await teach.click(t("child-Ben")); await teach.waitForSelector(t("goals")); await shot(teach, "teacher-student");
  await teach.context().close();
  const b = await open("bcba-nair"); await dismissNudge(b); await b.goto(`${BASE}/clinic/review`); await b.waitForSelector(t("review-item")); await shot(b, "review-home-data");
  await b.context().close();
}

/* school admin: invitations, import, feature switches */
{
  const page = await open("school_admin-raman"); await page.waitForSelector(t("features")); await dismissNudge(page);
  await page.locator(t("features")).scrollIntoViewIfNeeded(); await shot(page, "school-features");
  await page.click(t("nav-school-people")); await page.click(t("invite-contact")); await page.fill(t("invite-name"), "Rosa Morales"); await page.fill(t("invite-email"), "rosa.morales@family.example");
  await page.check(t("invite-student-Ava")); await shot(page, "school-invite-parent"); await page.keyboard.press("Escape");
  await page.click(t("nav-school-students")); await page.click(t("import-students"));
  await page.fill(t("import-text"), "first_name,last_name,birth_date,site\nMia,Okoye,2019-04-02,Bronx\nLeo,Park,2018-11-20,East Harlem\nAva,Morales,,East Harlem\nZed,Quinn,2019-01-01,Queens");
  await page.click(t("import-check")); await page.waitForSelector(t("import-report")); await shot(page, "school-import");
  await page.keyboard.press("Escape");
  await page.click(t("nav-school-service-log")); await page.waitForSelector(t("service-log")); await shot(page, "school-service-log");
  await page.context().close();
}

/* ───────── dark mode ───────── */
{
  const page = await open("bcba-nair", { dark: true }); await dismissNudge(page);
  await page.goto(`${BASE}/clinic/programs/f0000000-0000-4000-8000-000000000005`); await page.waitForSelector(t("session-chart")); await dismissNudge(page);
  await page.hover(t("chart-session-15")); await shot(page, "dark-graph");
  // leave the demo clean for the next person
  await page.click(t("reset-demo")); await page.click(t("reset-confirm")); await page.waitForSelector(t("student-card-Ava"));
  await page.context().close();
}

await browser.close();
console.log(`\n${n} screenshots in docs/screenshots/`);
