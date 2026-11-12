# 0002 — One FastAPI process + PostgreSQL, SQL-first

**Status:** Accepted · 2026-11-11

## Context
Scale is ~100 students per school, a few million observation rows over years. The 2025 architecture drew an API gateway, five services, Redis, TimescaleDB and ClickHouse. The owner chose Python/FastAPI, PostgreSQL alone, local direct install.

## Decision
- **One process**: FastAPI app with one router per responsibility (`auth`, `platform`, `school`, `clinic`, `collect`, `testing`). It also serves the built web app, so there is one origin and no CORS.
- **PostgreSQL only.** No cache, no broker, no time-series extension.
- **SQL-first, no ORM**: psycopg 3 with plain SQL. Queries are short, and security (ADR-0003) lives in the database, where SQL is the native language.
- **Migrations are numbered `.sql` files** applied by a 15-line runner (`aba.db.migrate`), recorded in `schema_migrations`.
- Analytics are computed on read from the observation log (pure functions in `aba/analytics.py`). No stored aggregates.

## Consequences
- Few moving parts; a new developer or agent can hold the whole backend in their head (~2,800 lines).
- No ORM means no generated migrations; schema changes are hand-written SQL (reviewable, but manual).
- Computing series on read is fine at this scale (one indexed query per program page; two per caseload).

## Revisit when
A caseload request exceeds ~200 ms at realistic volume → add a per-session summary table maintained on sync. Background jobs (PDF reports) arrive → a `jobs` table polled with `FOR UPDATE SKIP LOCKED`, still no broker.
