# 0013 — Analytic suggestions are plain statistics a BCBA accepts or dismisses

**Status:** Accepted · 2026-11-11

## Context
The original requirements asked for automated phase-change detection and trend analysis. Phase 1 shipped status flags only; the owner then asked for change-point detection and "other reasonable ML features". A program has 10–30 sessions — far too few to train a model on, and a clinician must be able to see why a suggestion was made.

## Decision
Five **insights**, all computed on read by pure functions in `aba/analytics.py`, none of which changes data:

| Insight | Method | Shown as |
|---|---|---|
| Possible change point | Best two-level split inside a phase; kept only if it beats both "no change" and "steady trend" (so a ramp is not a change point) and the shift is ≥ 2 SD and ≥ 12 % of scale | Dotted line with **?** on the graph → "Mark phase here…" |
| Forecast | Linear trend of the current phase extended to criterion; range from the slope's standard error; only when on track and ≤ 20 sessions away | Dashed projection + "≈ N sessions" |
| Unusual session | Robust z-score (median/MAD) of residuals from the phase trend > 3.5 and > 20 % of scale | Dashed ring on the point → "Add context…" |
| Recorders differ | Two recorders with ≥ 3 sessions each in the phase; mean gap > max(15 % of scale, 1.5 pooled SD) | Caseload badge + suggestion |
| Prompt-dependent | Trials: independent responding flat while the prompted share is ≥ 30 % and rising (or ≥ 45 %) | Caseload badge + suggestion |

- Suggestions sit in their own card ("nothing changes unless you act") and as secondary badges; the primary status (ADR-0010) is unchanged.
- **Dismiss** is remembered per program (`dismissals` table) with Undo. **Accepting** a change point is simply adding a phase.
- The demo seed contains one program for each insight.

## Consequences
- Every suggestion can be explained in one sentence and unit-tested (`tests/test_analytics.py`).
- These are heuristics with engineering thresholds, not validated clinical instruments — same caveat as ADR-0010.
- Statuses are still computed with unusual sessions included; an outlier can tip a flat series into "on track".

## Revisit when
A BCBA has reviewed thresholds against real data; or enough history exists across students to justify learned models.
