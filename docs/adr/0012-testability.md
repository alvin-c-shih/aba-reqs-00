# 0012 — Test ids, a scripted walkthrough, and health evidence

**Status:** Accepted · 2026-11-11

## Context
The owner wants coding agents to do most of the testing, and wants proof the system "is not cheating by not writing to the database".

## Decision
- **`data-testid`** on every interactive element; tests never select by text or CSS class.
- **API tests** (`apps/api/tests`, pytest against the `aba_test` database, reseeded per test): analytics rules, lockout, CSRF, role separation, tenant isolation at API *and* database level, append-only privileges, refresh-token reuse, sync idempotency, lock takeover → review, corrections.
- **Scripted walkthrough** (`scripts/screenshots.mjs`, Playwright): drives the real app through all six roles — including offline recording, a two-device lock takeover, home data from a parent and drafts from the local model — and saves the screenshots used by the slide pack. It fails loudly, so it is also the end-to-end smoke test, and it resets the demo before and after.
- **Platform health page** (system admin): `count(*)` per table, rows written in the last 5 minutes, database name and role, and a **canary** that writes a row and reads it back on a second connection.
- **Write receipts**: each sync response reports how many rows the server holds per session; the phone shows "Server confirmed n/n".
- **`POST /api/v1/_test/reset`** (non-prod) puts the database in the known fixture in one call.

## Commands
`make test` · `make screenshots` (app running) · `make reset`

## Revisit when
CI exists (run both suites there) or the walkthrough exceeds ~2 minutes (split by role).
