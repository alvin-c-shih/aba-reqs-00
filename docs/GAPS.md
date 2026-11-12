# Known gaps

What is missing, unverified or knowingly weak, as of 2026-11-11. This is the single list: other documents link here instead of repeating it. Decisions already made are in [ASSUMPTIONS.md](ASSUMPTIONS.md) and the [ADRs](adr/README.md).

**How to use this file:** when you close a gap, delete its row and say so in the commit. When you find one, add a row. Do not leave a gap only in a slide, a diagram or a chat message.

Severity: **A** = must be settled before any real student data · **B** = should be settled before a pilot · **C** = known limit, acceptable for a demo.

## 1 · Before real student data (A)

| Gap | Why it matters | Owner / where |
|---|---|---|
| No ruling on whether HIPAA or FERPA governs the data | Sets hosting, retention, breach and agreement requirements. The system is built to the stricter of the two as a guess (ASSUMPTIONS D1). | Counsel |
| No production deployment exists | No TLS, no encrypted disk, no process supervision. [View 13](architecture/README.md#13--deployment--proposed-not-built) is a proposal only. | Owner decides on-site or cloud and who operates it |
| No backups and no restore drill | PostgreSQL and `data/media/` are the only copies. | Deployment |
| Secrets live in a `.env` file | Fine for a laptop; a server needs a secret store and rotation. | Deployment |
| No monitoring or alerting | The health page exists but nobody is told when it fails. | Deployment |
| Two-factor sign-in is optional | Should be enforced for admins and BCBAs. | [ADR-0018](adr/0018-two-factor-sign-in.md) |
| Audit-log retention is undecided | The log grows forever and is never pruned. | Owner, after counsel |
| Status and suggestion thresholds are the developer's defaults | They decide what a BCBA is told needs attention; no clinician has reviewed them. | A BCBA · [ADR-0010](adr/0010-clinical-decision-rules.md), [ADR-0013](adr/0013-statistical-insights.md) |

## 2 · Security and privacy (B)

| Gap | Why it matters | Where |
|---|---|---|
| The authenticator (TOTP) secret is stored unencrypted in the database | Anyone who can read the `users` table can generate codes. Relies on disk encryption, which does not exist yet. | `routers/auth.py`, `users.totp_secret` |
| Two-factor enrolment has no QR code | The key is typed by hand, which invites mistakes and discourages use. | `shell/Account.tsx` |
| No password reset by email | An admin must issue a temporary password. | `routers/auth.py` |
| No IP allow-listing | Requested in the 2025 answers as an option; not built. | — |
| The sign-in throttle is in the API process's memory | It resets on restart and would not be shared across more than one API process. | `security.Throttle` |
| Removing a photo or video hides the row but leaves the file on disk | "Removed" media is still recoverable from `data/media/<env>/`. | `routers/extras.py` `remove_media` |
| `make reset` clears media rows, not files | Old demo uploads accumulate on disk. | `db.reset_demo` |
| Revoking consent stops new uploads but keeps existing files | A family that withdraws consent would expect earlier media to go too. Needs a policy decision. | [ADR-0016](adr/0016-consent-and-media.md) |
| Uploaded files are not scanned and not encrypted individually | Type and size are checked; content is not. | `routers/extras.py` `upload_media` |

## 3 · Clinical logic (B)

| Gap | Why it matters | Where |
|---|---|---|
| Suggestions are unvalidated on real data | Change points, forecasts, unusual sessions, recorder differences and prompt dependence were tuned on seeded demo data only. | `aba/analytics.py` |
| Status flags include unusual sessions when computing trends | One outlier can hide "no progress" or fake a regression. | `analytics.evaluate` |
| Analysis is per program, not per target | Targets are modelled and rotate while recording, but graphs and status are at program level (ASSUMPTIONS D10). | `analytics.SERIES_SQL` |
| No inter-observer agreement | The recorder-difference suggestion hints at disagreement but there is no IOA session type or score. | — |
| No celeration charts | Asked for by some ABA practices; only equal-interval and cumulative graphs exist. | design system `chart.tsx` |
| Phases 2 to 4 have had no user testing | Interval, ABC and task-analysis recording, reports, the family portal and imports work in the walkthrough but no RBT, BCBA, parent or teacher has tried them. | — |

## 4 · Local models (B)

| Gap | Why it matters | Where |
|---|---|---|
| No text model was chosen by comparison | Gemma 4 26B (llama.cpp) and mistral-nemo 12B (Ollama) are used because they were already on the machine. | [ADR-0014](adr/0014-local-models-only.md) |
| Drafts can still misread or overstate | An earlier draft described a count falling from 7 to 0 as not going smoothly. Cause: the family name said "Staying in the work area" while the number counted leaving, and the prompt told the model to say the team was adjusting its approach. Both are fixed (the facts now state what is counted and which way is better; the prompt no longer asserts team actions), and the next draft read the fall as good news. One good draft is not proof; the BCBA's review remains the only safeguard, and the prose is now stiffer ("Regarding Asking for things he wants…"). | `ai.SUMMARY_SYSTEM` |
| The app does not manage the llama.cpp server | It is the owner's own process; model, context size and parallelism are whatever it was started with. If it is down, text silently falls back to Ollama, which is slower (about 50 s for a first answer). | `ai.text_runtime` |
| "Thinking off" is a llama.cpp-specific request field | Another OpenAI-compatible server may ignore it; a thinking model would then return an empty answer. | `ai.generate` |
| Voice notes were tested with synthetic speech only | Not a real voice, a noisy classroom or a real phone microphone. | `scripts/fixtures/voice-note.wav` |
| Voice notes are narrow | Session-end note only, online only, English only (Whisper `small.en`), at most 60 seconds. Not on graph notes or messages. | `areas/shared/Dictate.tsx` |
| `make setup` does not install the speech server or model | Both were installed by hand; the steps are in the README only. | `scripts/setup.sh` |
| Timings come from one machine | Apple M1 Max, 64 GB. A school server will differ. | — |

## 5 · Not built (C)

| Gap | Note |
|---|---|
| Email, SMS and push notifications | Notifications are in-app only; the bell asks the server once a minute, so a parent learns of a new summary only after opening the app. |
| Parents and teachers cannot see photos or videos | Media is limited to the clinical team. |
| Voice commands; in-app video recording; offline queue for media | Uploads need a connection and an existing file. |
| Payer-specific billing formats | Only a generic service log in 15-minute units, with CSV export (owner's choice). |
| Integration API | No import or export other than CSV. |

## 6 · Not verified (B)

| Gap | Note |
|---|---|
| Browsers other than Chromium | Safari on iPad and iPhone matters most for RBTs. |
| Screen-reader use | Keyboard paths and labels are in place; no assistive-technology test has been run. |
| Load | Target was 100 students with two years of data; never measured. |
| Offline start of the installed app | The walkthrough uses the "simulate offline" switch; the service worker runs only in a production build. |
| A real phone | Everything was driven in desktop Chrome at phone size. |
| The published slide deck's rendering | Slides were written and published but not opened and checked. |

## 7 · Usability (B)

Found while driving the app through every role for the walkthrough. A script clicks named elements, so these are about flow, wording and layout; nobody has judged speed, reach or one-handed use.

| Gap | Why it matters | Where |
|---|---|---|
| No real user has tried it | The single biggest unknown. One real session with an RBT on a phone, and one BCBA reading a week of graphs, would re-order this whole list. | — |
| The tour prompt appears on nearly every first screen for every role | The walkthrough has to dismiss it each time; a new user will feel the same interruption. Consider one prompt per person, not per page. | `shell/tours.ts`, `usePageTour` |
| Two sessions on the same day share one axis label | Both read "Nov 11", so they cannot be told apart on the graph. | design system `chart.tsx` |
| The model name is shown raw to a school admin | "unsloth/gemma-4-26B-A4B-it-GGUF:Q5_K_M" means nothing to them. Shortened on the BCBA's draft label only. | `school/SchoolExtras.tsx` |
| Family goal names are free text | The form now coaches the BCBA to name what is counted, but nothing stops "Staying in the work area" being typed for a count of leaving. The page states "lower is better", which limits the damage. | `clinic/ProgramForm.tsx` |
| Existing family-facing names are not migrated | Only the demo seed was renamed. A real school's earlier names would need a BCBA to review them. | — |
| Program tabs take two rows on a phone with four programs | All programs are now visible and names wrap, at the cost of about 60 px of height; with seven or more programs the recorder is pushed down. Untested beyond four. | `app.css` `.progtabs` |
| Dictation appends without showing where | New text is added to the end of the note with no highlight, so a repeated dictation is easy to miss. | `areas/shared/Dictate.tsx` |
| Parents see every goal as one long list | Fine for four goals; no grouping or "what changed since last time" for a child with many. | `family/Family.tsx` |

Fixed on 2026-11-11 and removed from this list: family goals did not say which direction was good; "Share a summary with the family" and the feature switches sat at the bottom of their pages; phone program tabs were clipped and hid other programs; the session note box showed only three lines.

## 8 · Housekeeping (C)

| Gap | Note |
|---|---|
| Most slide images have no recorded source | `docs/slides/images.json` now maps each slide image to its screenshot or diagram, but only for the 27 uploaded since 2026-11-11 evening; the other 40 are identified by their description only. |
| The work is committed locally but not pushed or reviewed | One large commit on `rework/v2`; no pull request yet. |
| Superseded images remain in the slide deck's asset store | About two dozen older diagram and screenshot uploads are no longer referenced by any slide. |
| Three views have no ADR of their own | Notifications, the runtime layout and the proposed deployment are documented in the architecture guide only. |
