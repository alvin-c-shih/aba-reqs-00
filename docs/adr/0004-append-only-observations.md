# 0004 — Observations are an append-only log with client-generated ids

**Status:** Accepted · 2026-11-11

## Context
Observations of a child are clinical records created on devices that may be offline. The old spec used mutable rows, `DELETE` for undo and timestamp-based `UPDATE` on sync — any of which can silently lose or double-count data.

## Decision
- `observations` rows are immutable. The API role has **no UPDATE or DELETE privilege** on `observations` or `audit_log`.
- Kinds: `trial`, `event` (one occurrence), `duration`, `window` (how long a program was observed in a session — makes "zero today" real data and gives rate a denominator), `void`.
- **Undo while recording** and **retroactive correction** are both new rows: a `void` pointing at the original (+ an optional replacement with `corrects`). A reason is required for BCBA corrections.
- Ids for sessions and observations are UUIDs generated **on the device**. Sync is `INSERT … ON CONFLICT (id) DO NOTHING`, so re-sending is harmless.
- `ON DELETE RESTRICT` everywhere under students. Discharge is a status.

## Consequences
- History is complete by construction; the session drawer shows voided items struck through with who/why.
- Every read must exclude voided rows — done once, in `analytics.SERIES_SQL`.
- % independent correct = correct ÷ all non-voided trials (prompted is *not* independent).

## Revisit when
Retention rules require purging (needs an owner-run, audited job — never the API role).
