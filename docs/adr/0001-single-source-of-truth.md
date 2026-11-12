# 0001 — One current doc per concern; the 2025 spec is archived

**Status:** Accepted · 2026-11-11

## Context
The original spec (2025-12) and its Q&A files disagreed with each other in ~15 places (backend language, mobile framework, databases, conflict model, phase scope, banner colours). `docs/archive/REVIEW-2026-10.md` lists them. A reader — human or agent — could build the wrong system from any single file.

## Decision
- The old spec, mockups and Q&A live under `docs/archive/` and are **not** authoritative.
- Current truth, in order of precedence: **code and tests → ADRs → `docs/ASSUMPTIONS.md` → `docs/product/capabilities.md`**.
- The owner's answers in `docs/archive/qa/` remain the record of *intent*; where an ADR departs from an answer it says so explicitly (see 0005).

## Consequences
- One place to look per question. Archive files keep their history in git.
- Anything not yet decided must be written into `ASSUMPTIONS.md`, not left implicit.

## Revisit when
Never — add ADRs instead.
