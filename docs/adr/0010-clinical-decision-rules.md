# 0010 — Structured mastery rule; status judged on the current phase

**Status:** Accepted · 2026-11-11 · *Clinical thresholds need BCBA sign-off before pilot*

## Context
The core ask: "identify when some change is required in curriculum / intervention". Free-text mastery criteria cannot be evaluated.

## Decision
- **Mastery rule** per program: `value` compared per session (≥ for increase goals, ≤ for decrease) in **N of the last M sessions**, with a minimum trial count for trial programs. Stored as JSON, edited as a sentence.
- **Per-session value**: trials → % independent correct; frequency → count; duration → total seconds.
- **Status** is computed on read from the **current phase only** (a phase change resets the question "is this working?"). First match wins:

| Status | Rule |
|---|---|
| Criterion met | mastery rule satisfied |
| Baseline | current phase is a baseline |
| Regression | ≥5 sessions and trend ≤ −2.5 % of scale per session in the wrong direction |
| Variable | last 6 sessions: scatter around the trend line > 22 % of their mean (mean ≥ 3) |
| No progress | ≥6 sessions and trend within ±1.2 % of scale per session |
| No recent data | active program, last session > 7 days ago |
| On track | none of the above |

  Scale = 100 for percentages, otherwise max(criterion, phase mean).
- Every status carries a plain-language reason shown beside it. The system **flags**; only a BCBA changes a program's state ("Mark mastered").
- The demo seed contains one program for each status.

## Consequences
- Rules are pure functions with unit tests (`tests/test_analytics.py`) and can be tuned in one file.
- Thresholds are engineering defaults, not clinical standards.

## Revisit when
BCBAs want per-program thresholds, or celeration / split-middle methods (Phase 2).
