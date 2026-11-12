# 0008 — One database per environment; demo aids never exist in prod

**Status:** Accepted · 2026-11-11

## Context
The owner wants Demo, Dev, QA and Prod with unmistakable banners, demo data that lives in a database (not hard-wired), and a system that is "stateful, but easy to reset".

## Decision
- `APP_ENV` ∈ `demo | dev | qa | prod` selects the database `aba_<env>`. Demo data is never installed next to real data.
- **Banner**: always visible, not dismissible, shows environment · role · school · time. Demo purple, Dev green, QA amber, **Prod neutral** (a red bar in the real system reads as an error).
- **Demo dataset** = `db/seeds/demo.sql`: pure SQL, deterministic (`setseed`), dates relative to `now()`, stable ids. 2 schools, 3 sites, 7 staff, 6 students, one program per clinical scenario.
- **Reset** = re-run the seed through the owner connection: `make reset`, the banner's "Reset demo" button, or `POST /api/v1/_test/reset`. Demo: any signed-in user. Dev/QA: system admin. **Prod: the routes are not registered and the owner connection is not configured.**
- **Persona sign-in** (one click, no password) exists only when `APP_ENV=demo`; the server returns 404 elsewhere.
- Seeded accounts share a generated password stored in `.env` (git-ignored) for Dev/QA sign-in and tests.

## Consequences
- A demo can be handed to anyone: nothing they do is permanent, and a reset takes about a second while keeping them signed in.
- Demo-only code paths are gated on the server by environment, never by hiding UI.

## Revisit when
Hosted demos need per-visitor isolation (then: one schema or database per visitor).
