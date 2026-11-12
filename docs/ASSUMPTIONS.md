# Assumptions

Decisions made without asking, because best practice was clear enough (≥ 90 % confidence) or the owner had said "you decide". **Future agents: read this before changing behaviour; if you overturn one, update this file and add an ADR.**

Confidence: ●●● settled practice · ●●○ strong default, owner may prefer otherwise · ●○○ placeholder that needs a real answer before pilot.

## Confirmed by the owner (2026-11-11)
| | Answer |
|---|---|
| RBT client | Installable web app instead of React Native → [ADR-0005](adr/0005-offline-first-web-app.md) |
| Database | PostgreSQL, started locally |
| Admin roles | System admin manages across schools; a school admin may administer several sites of one school → [ADR-0003](adr/0003-tenancy-and-row-level-security.md) |
| Old docs | Archived and rewritten → [ADR-0001](adr/0001-single-source-of-truth.md) |
| Analytics | Build all five suggestions (change point, forecast, unusual session, recorder differences, prompt dependence) → [ADR-0013](adr/0013-statistical-insights.md) |
| Later phases | "Try designing / implementing all desired phases" — Phases 2–4 built as first working versions |
| AI and voice | "Prototype using local models to start" → [ADR-0014](adr/0014-local-models-only.md) |
| Billing report | Generic service log, no payer codes → [ADR-0017](adr/0017-reports-and-service-log.md) |

## Scope
| # | Assumption | Conf. |
|---|---|---|
| S1 | Phase 1 = sign-in, 4 roles, schools/sites, roster, programs, trial / frequency / duration recording, offline sync, line + bar graphs, phases, annotations, status flags, review queue, audit, tours, demo mode, health page, undo/redo. | ●●● (owner's Phase 1 answers + this request) |
| S2 | Graph annotations and phase lines are in Phase 1 (the owner asked for them now), although the 2025 plan had them in Phase 2. | ●●● |
| S3 | Phases 2–4 are built as first working versions (owner's request 2026-11-11): interval / ABC / task-analysis recording, cumulative and table views, reports, parent and teacher access, messaging, in-app notifications, two-factor sign-in, consent and media, templates, CSV import/export, local-model drafts. Each is covered by the walkthrough and API tests; none has had user testing. | ●●○ |
| S6 | "School staff" in the roadmap = classroom **teacher**. Paraprofessionals use the same role. | ●●○ |
| S7 | Notifications are in-app only. Email, SMS and push need a delivery service and a privacy decision. | ●●○ |
| S8 | Celeration charts are not built; a cumulative record and a data table cover Phase 2's "more graph types". | ●○○ |
| S4 | A person belongs to one school. Working at two schools means two accounts. | ●●○ |
| S5 | A school admin administers the sites they are linked to, and automatically the sites they create. | ●●○ |

## Domain
| # | Assumption | Conf. |
|---|---|---|
| D1 | Regulation: build to the stricter of HIPAA and FERPA (encryption in transit, access audit, minimum necessary). **Counsel must confirm which applies.** | ●○○ |
| D2 | One session lock per **student** (not per program). | ●●● |
| D3 | Data recorded without a confirmed lock is kept and reviewed, never dropped. | ●●● |
| D4 | % correct = independent correct ÷ all non-voided trials. Prompted counts as not independent. | ●●○ |
| D5 | Mastery rule is structured: value in N of the last M sessions (+ minimum trials). | ●●● |
| D6 | Status thresholds in [ADR-0010](adr/0010-clinical-decision-rules.md) are engineering defaults. **A BCBA must review them before pilot.** | ●○○ |
| D7 | Session types: Teaching (`direct`) and Probe (hides "Prompted"). | ●●○ |
| D8 | Students are shown as first name + last initial on clinical screens; full names only on the school admin roster. No photos. | ●●● |
| D9 | Frequency is reported as count per session; the observation window is the session length for every frequency/duration program. | ●●○ |
| D10 | Hierarchy Student → Plan → Program → Target is modelled, but Phase 1 analyses at program level; targets rotate automatically while recording. | ●●○ |
| D11 | Only BCBAs correct recorded data after the fact; a reason is required; the original is kept. | ●●● |
| D12 | BCBAs can also record sessions for their own students. | ●●○ |
| D13 | A BCBA sees the students they supervise (not every student in the school). | ●●○ |
| D14 | Interval recording offers partial, whole and momentary; the BCBA picks per program (owner: "whatever yields the most useful analysis"). Value = % of intervals scored yes. | ●●○ |
| D15 | Task analysis value = % of steps independent per session; chaining type is recorded but does not change scoring. | ●●○ |
| D16 | ABC data is one row per incident with antecedent and consequence picked from per-program lists; "function" is left to the BCBA, the system only shows the most common pairs. | ●●○ |
| D17 | Parents see a plain status vocabulary and family-friendly program names, never clinical labels. | ●●● |
| D18 | Home data: frequency programs only, per-guardian and per-program permission, always reviewed. | ●●○ |
| D20 | Family-facing goal names say **what is counted**. For a behaviour to reduce, name the behaviour ("Leaving the work area"), not its opposite; the family page adds what is counted, "lower/higher is better", from–to values and whether it is moving toward the goal. Judged against the goal's direction, so a falling count reads as progress. | ●●○ |
| D19 | Service units use the 8-minute rule (8–22 min = 1 unit). | ●●○ |
| D20 | Insight thresholds ([ADR-0013](adr/0013-statistical-insights.md)) are engineering defaults. **A BCBA must review them before pilot.** | ●○○ |

## Security
| # | Assumption | Conf. |
|---|---|---|
| X1 | No forced 90-day password rotation; 12+ characters and lockout instead (NIST SP 800-63B). | ●●● |
| X2 | Temporary passwords are handed over out-of-band by the admin; no email delivery in a local install. | ●●○ |
| X3 | System admins must not be able to read student data. | ●●● |
| X4 | School admins do not see session data or graphs. | ●●○ |
| X5 | Viewing a student or a graph is itself audited. | ●●● |
| X6 | Offline token expiry → sign in again when online; the encrypted outbox survives. No offline PIN. | ●●○ |
| X7 | TLS, disk encryption, backups and log shipping belong to deployment and are not in this repo yet. **Required before real data.** | ●○○ |
| X8 | Audit retention: keep everything for now; purge policy (6 vs 10 years) to be set with the school. | ●○○ |
| X9 | Models are called only on localhost; the code refuses other hosts. A hosted model is a future decision, not a config tweak. | ●●● |
| X10 | Two-factor sign-in is optional per person. **Enforce for admins and BCBAs before real data.** | ●○○ |
| X11 | Media files sit unencrypted on the application host's disk (same trust boundary as the database). | ●○○ |
| X12 | Parents and teachers cannot see media, sessions or the team thread. | ●●● |

## Engineering
| # | Assumption | Conf. |
|---|---|---|
| E1 | Vite + React (not Next.js): the app is a signed-in SPA with no public pages to render on a server. | ●●● |
| E2 | No ORM, plain SQL migrations ([ADR-0002](adr/0002-modular-monolith-sql-first.md)). | ●●○ |
| E3 | API on port 8010, web dev server on 5173 (port 8000 was unavailable on the build machine). | ●●● |
| E6 | Local speech server on port 8178 (8080 was in use); model file in `data/models/whisper/` (git-ignored, 488 MB, from `ggerganov/whisper.cpp` on Hugging Face); `WHISPER_URL` in `.env`. Text models: `LLM_URL=http://127.0.0.1:8080` in `.env` points at the owner's llama.cpp server (tried first); Ollama on 11434 is the fallback. `/auth/me` reports voice as on only when the school switch is on and a local speech server is configured. | ●●● |
| E4 | Demo cast and data are fictional; `.example` email domains. | ●●● |
| E5 | The service worker caches the app shell only in production builds; in `make demo` use "Simulate being offline". | ●●● |

## Known gaps
Moved to [GAPS.md](GAPS.md), the single list of what is missing, unverified or knowingly weak.
