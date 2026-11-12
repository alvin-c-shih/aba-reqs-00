# Guide for coding agents (and new developers)

Read in this order: this file → `docs/ASSUMPTIONS.md` → `docs/GAPS.md` → `docs/adr/README.md`. `docs/archive/` is history, **not** a spec.

## Map — who owns what
| Responsibility | Code | API prefix | Role |
|---|---|---|---|
| Design system (tokens, components, chart, tour) | `packages/design-system/src` | — | — |
| App shell (sign-in, nav, help, palette, tours) | `apps/web/src/shell`, `apps/web/src/lib` | `/auth`, `/meta`, `/me` | all |
| Platform operations | `apps/web/src/areas/system`, `apps/api/aba/routers/platform.py` | `/platform`, `/demo` | system_admin |
| School administration | `apps/web/src/areas/school`, `routers/school.py` | `/school` | school_admin |
| Clinical work | `apps/web/src/areas/clinic`, `routers/clinic.py`, `aba/analytics.py` | `/clinic` | bcba (rbt read-only graphs) |
| Data collection (offline) | `apps/web/src/areas/collect`, `routers/collect.py` | `/collect` | rbt, bcba |
| Reports & exports | `areas/clinic/Report.tsx`, `areas/shared/ServiceLog.tsx`, `routers/reports.py` | `/reports` | bcba, school_admin |
| Family & classroom portal | `apps/web/src/areas/family`, `routers/family.py` | `/family` | parent, teacher |
| Messaging, contacts, consent & media, templates, import, feature switches | `routers/extras.py`, `areas/clinic/StudentExtras.tsx`, `areas/school/SchoolExtras.tsx` | `/clinic`, `/school` | bcba, rbt, school_admin |
| Local models (text, speech) | `apps/api/aba/ai.py` | `/clinic/ai`, `/clinic/transcribe` | bcba (off per school by default) |
| Access rules (single place) | `apps/api/aba/deps.py` | | |
| Architecture diagrams (13 views, SVG + PNG) | `scripts/diagrams.py` → `docs/architecture/diagrams/` (`make diagrams`); explained in `docs/architecture/README.md` | | |
| Schema & demo data | `db/migrations/*.sql`, `db/seeds/demo.sql` | | |

## Commands
`make setup` once · `make demo` run · `make test` · `make reset` · `make screenshots` (with the app running).

## Rules that keep the system honest
1. **Never** give the API role UPDATE/DELETE on `observations` or `audit_log`. Corrections are new rows (ADR-0004).
2. Every new school-owned table needs `school_id`, RLS enabled + forced, and a tenant policy (copy the block in `001_init.sql`). Add a test like `test_tenant_isolation_in_database`.
3. Authorize through `Ctx.student()` / `Ctx.program()` / `require(...)` in `deps.py`. Don't write ad-hoc role checks in routers.
4. Demo/test conveniences are gated **on the server** by `settings.env`, and must not be registered in prod.
5. Colours, sizes and fonts come from design tokens. If a screen needs a new visual idea, add it to the design system first.
6. Every interactive element gets a `data-testid`; every explainable element a `data-tour`.
7. Prefer act-then-Undo over confirmation dialogs (ADR-0011).
8. A schema change = a new numbered file in `db/migrations/` (never edit an applied one) + seed update + `make reset`.
9. When you make a judgment call, record it in `docs/ASSUMPTIONS.md`. When you change a decision, add an ADR. When you find or close a gap, update `docs/GAPS.md` — never leave a gap only in a slide or a diagram.
10. Before saying "done": `make test` and `make screenshots` both pass.
11. Models are called on localhost only (`ai._local`). Never add a hosted model without a new ADR and the owner's decision.
12. Anything a parent or teacher can read comes from `reports.program_facts` or a published snapshot — never from raw sessions or observations.
13. One fact source for reports, family summaries and AI drafts: extend `program_facts`, don't write a second query.

## Gotchas
- The API must run with the repo's `.env` (`JWT_SECRET`, `DEMO_PASSWORD`); `make setup` creates it. Never commit it.
- Seeded ids are stable (`a…` schools, `b…` sites, `c…` users, `d…` students, `f…` programs); tours, tests and the walkthrough rely on them.
- `platform_row_counts()` is `SECURITY DEFINER` — keep it returning counts only.
- Port 8010 for the API (see ASSUMPTIONS E3).
- The walkthrough's AI steps need a local text model: either an OpenAI-compatible server at `LLM_URL` (e.g. llama.cpp `llama-server`) or Ollama with any model (`ollama list`). First Ollama response can take a minute.
- Voice notes need `make speech` (whisper-cpp + `data/models/whisper/ggml-small.en.bin`) and `WHISPER_URL=http://127.0.0.1:8178` in `.env`; without them the Dictate button is hidden and the walkthrough skips that step.
- Uploaded media goes to `data/media/<env>/` (git-ignored). `make reset` clears the rows, not the files.
