"""Clinical analytics — pure functions over per-session points, so every rule is unit-testable.

A point is {"value": float, "trials": int, "at": datetime, ...}. Value is:
  trial     → % independent correct  (correct ÷ all non-voided trials; prompted is NOT independent)
  frequency → count in the session
  duration  → total seconds in the session
Flags are evaluated on the CURRENT phase only: a phase change resets the question "is this working?".
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from statistics import mean, pstdev

STALE_DAYS = 7
SERIES_SQL = """
select o.program_id, s.id as session_id, s.started_at as at, s.kind as session_kind, s.review_state, u.name as recorder,
       count(*) filter (where o.kind = 'trial') as trials,
       count(*) filter (where o.outcome = 'correct') as correct,
       count(*) filter (where o.outcome = 'prompted') as prompted,
       count(*) filter (where o.outcome = 'incorrect') as incorrect,
       count(*) filter (where o.outcome = 'no_response') as no_response,
       count(*) filter (where o.kind = 'event') as events,
       coalesce(sum(o.seconds) filter (where o.kind = 'duration'), 0) as seconds,
       count(*) filter (where o.kind = 'interval') as intervals,
       count(*) filter (where o.kind = 'interval' and o.hit) as hits,
       count(*) filter (where o.kind = 'abc') as incidents,
       count(*) filter (where o.kind = 'step') as steps,
       count(*) filter (where o.kind = 'step' and o.outcome = 'correct') as steps_correct,
       coalesce(max(o.seconds) filter (where o.kind = 'window'), 0) as window_s
from observations o
join sessions s on s.id = o.session_id
join users u on u.id = s.user_id
where o.program_id = any(%s) and o.kind <> 'void'
  and not exists (select 1 from observations v where v.voids = o.id)
  and s.review_state in ('live', 'accepted')
group by o.program_id, s.id, u.name
order by s.started_at
"""


PERCENT_KINDS = ("trial", "interval", "task")


def point_value(kind: str, row: dict) -> float | None:
    """One number per session. Percent kinds return None when nothing was scored (no point on the graph)."""
    if kind == "trial":
        return round(100 * row["correct"] / row["trials"], 1) if row["trials"] else None
    if kind == "interval":      # % of intervals in which the behaviour was scored
        return round(100 * row["hits"] / row["intervals"], 1) if row.get("intervals") else None
    if kind == "task":          # % of steps completed independently
        return round(100 * row["steps_correct"] / row["steps"], 1) if row.get("steps") else None
    if kind == "abc":
        return float(row.get("incidents", 0))
    if kind == "frequency":
        return float(row["events"])
    return float(row["seconds"])


def build_points(kind: str, rows: list[dict]) -> list[dict]:
    pts = []
    for r in rows:
        v = point_value(kind, r)
        if v is not None:
            pts.append({**r, "value": v})
    return pts


def slope(values: list[float]) -> float:
    """Ordinary least-squares slope per session."""
    n = len(values)
    if n < 2:
        return 0.0
    mx, my = (n - 1) / 2, mean(values)
    den = sum((i - mx) ** 2 for i in range(n))
    return sum((i - mx) * (v - my) for i, v in enumerate(values)) / den


def meets(value: float, rule: dict, goal: str) -> bool:
    return value >= rule["value"] if goal == "increase" else value <= rule["value"]


def mastery_met(points: list[dict], rule: dict, goal: str) -> bool:
    m, n = int(rule.get("m", 3)), int(rule.get("n", 3))
    last = points[-m:]
    if len(last) < n:
        return False
    ok = [p for p in last if meets(p["value"], rule, goal)
          and (not p.get("trials") or p["trials"] >= int(rule.get("min_trials", 0)))]   # min_trials applies to trial data only
    return len(ok) >= n


def current_phase_points(points: list[dict], phases: list[dict]) -> list[dict]:
    if not phases:
        return points
    start = max(p["started_at"] for p in phases)
    return [p for p in points if p["at"] >= start]


def evaluate(kind: str, goal: str, rule: dict, points: list[dict], phases: list[dict],
             status: str = "active", now: datetime | None = None) -> dict:
    """Return {"flag": primary flag, "flags": [...], "why": plain-language reason, stats}."""
    now = now or datetime.now(timezone.utc)
    cur = current_phase_points(points, phases)
    vals = [p["value"] for p in cur]
    flags: list[str] = []
    why = ""
    scale = 100.0 if kind in PERCENT_KINDS else max(abs(float(rule.get("value", 1))), mean(vals) if vals else 1.0, 1.0)
    sl = slope(vals)
    good = sl / scale if goal == "increase" else -sl / scale   # >0 means moving the right way
    last_phase = max(phases, key=lambda p: p["started_at"]) if phases else None

    if vals and mastery_met(cur, rule, goal):
        flags.append("mastered")
        why = f"Criterion met in {rule.get('n', 3)} of the last {rule.get('m', 3)} sessions"
    elif last_phase and last_phase["kind"] == "baseline":
        flags.append("baseline")
        why = f"Baseline — {len(vals)} session{'s' if len(vals) != 1 else ''} so far"
    else:
        # Variability is judged around the trend line, so steady improvement is not "variable".
        recent = vals[-6:]
        noisy = False
        if len(recent) >= 6 and mean(recent) >= 3:
            rs = slope(recent)
            resid = [v - (mean(recent) + rs * (i - (len(recent) - 1) / 2)) for i, v in enumerate(recent)]
            noisy = pstdev(resid) / mean(recent) > 0.22
        if len(vals) >= 5 and good <= -0.025:
            flags.append("regression")
            why = f"Trending the wrong way for {len(vals)} sessions in this phase"
        elif noisy:
            flags.append("variable")
            why = "Results swing widely from session to session — check consistency before judging progress"
        elif len(vals) >= 6 and abs(good) < 0.012:
            flags.append("no_progress")
            why = f"Flat for {len(vals)} sessions in this phase — consider a change"
    if status == "active" and points and now - points[-1]["at"] > timedelta(days=STALE_DAYS):
        flags.append("stale")
        why = why or f"No data for {(now - points[-1]['at']).days} days"
    if not points:
        flags.append("no_data")
        why = "No sessions recorded yet"
    order = ["mastered", "regression", "no_progress", "variable", "stale", "baseline", "no_data"]
    primary = next((f for f in order if f in flags), "on_track")
    if primary == "on_track":
        why = "Moving toward criterion"
    return {
        "flag": primary, "flags": flags, "why": why,
        "sessions_in_phase": len(vals),
        "mean": round(mean(vals), 1) if vals else None,
        "slope": round(sl, 2),
        "last": vals[-1] if vals else None,
    }


# ───────────────────────── insights: suggestions a BCBA accepts or dismisses ─────────────────────────
# Plain statistics on purpose (ADR-0013): a program has 10–30 sessions, far too few to train on,
# and every suggestion must be explainable in one sentence. Nothing here changes data by itself.

def _scale(kind: str, rule: dict, vals: list[float]) -> float:
    return 100.0 if kind in PERCENT_KINDS else max(abs(float(rule.get("value", 1))), mean(vals) if vals else 1.0, 1.0)


def _linfit(vals: list[float]) -> tuple[float, float, float, float]:
    """slope, fitted value at the last point, residual sum of squares, Sxx."""
    n = len(vals)
    mx, my = (n - 1) / 2, mean(vals)
    sxx = sum((i - mx) ** 2 for i in range(n))
    sl = sum((i - mx) * (v - my) for i, v in enumerate(vals)) / sxx if sxx else 0.0
    sse = sum((v - (my + sl * (i - mx))) ** 2 for i, v in enumerate(vals))
    return sl, my + sl * mx, sse, sxx


def _segments(points: list[dict], phases: list[dict]) -> list[tuple[int, int]]:
    if not phases:
        return [(0, len(points))]
    starts = sorted(p["started_at"] for p in phases)
    idx = [0] + [next((i for i, p in enumerate(points) if p["at"] >= s), len(points)) for s in starts[1:]]
    return [(a, b) for a, b in zip(idx, idx[1:] + [len(points)]) if b > a]


def change_points(kind: str, rule: dict, points: list[dict], phases: list[dict]) -> list[dict]:
    """Where, inside a phase, did the level jump? Best two-level split, kept only if it explains
    the data much better than both 'no change' and 'steady trend' (so a ramp is not a change point)."""
    out = []
    for a, b in _segments(points, phases):
        vals = [p["value"] for p in points[a:b]]
        n = len(vals)
        if n < 8:
            continue
        sse0 = sum((v - mean(vals)) ** 2 for v in vals)
        best = min(range(3, n - 2), key=lambda k: sum((v - mean(vals[:k])) ** 2 for v in vals[:k]) + sum((v - mean(vals[k:])) ** 2 for v in vals[k:]))
        left, right = vals[:best], vals[best:]
        sse = sum((v - mean(left)) ** 2 for v in left) + sum((v - mean(right)) ** 2 for v in right)
        shift, scale = mean(right) - mean(left), _scale(kind, rule, vals)
        sd = max((sse / (n - 2)) ** 0.5, 0.03 * scale)
        if sse <= 0.45 * sse0 and sse <= 0.6 * _linfit(vals)[2] and abs(shift) / sd >= 2.0 and abs(shift) >= 0.12 * scale:
            p = points[a + best]
            out.append({"kind": "change_point", "key": str(p["session_id"]), "index": a + best, "at": p["at"],
                        "before": round(mean(left), 1), "after": round(mean(right), 1),
                        "text": f"The level shifts here: about {mean(left):.0f} before, {mean(right):.0f} after. Mark a phase change?"})
    return out


def forecast(kind: str, goal: str, rule: dict, cur: list[dict]) -> dict | None:
    """Sessions until the current trend reaches criterion, as a range from the slope's uncertainty."""
    vals = [p["value"] for p in cur]
    if len(vals) < 4:
        return None
    sl, last, sse, sxx = _linfit(vals)
    gap = float(rule["value"]) - last
    toward = sl if goal == "increase" else -sl
    need = gap if goal == "increase" else -gap
    if toward <= 0 or need <= 0:
        return None
    se = (sse / (len(vals) - 2) / sxx) ** 0.5 if sxx else 0.0
    mid = need / toward
    low, high = need / (toward + se), need / max(toward - se, toward / 4)
    if mid > 20:
        return None
    lo, hi = max(1, round(low)), max(1, round(high))
    span = f"{lo}" if lo == hi else f"{lo}–{min(hi, 40)}"
    return {"kind": "forecast", "key": "", "sessions": max(1, round(mid)), "low": lo, "high": min(hi, 40), "from": round(last, 1),
            "text": f"At the current rate, criterion in about {span} more session{'s' if hi != 1 else ''}."}


def unusual_sessions(kind: str, rule: dict, cur: list[dict]) -> list[dict]:
    """Sessions far from the phase's own pattern (robust z-score on residuals from the trend)."""
    vals = [p["value"] for p in cur]
    if len(vals) < 6:
        return []
    sl, last, _, _ = _linfit(vals)
    resid = [v - (last - sl * (len(vals) - 1 - i)) for i, v in enumerate(vals)]
    srt = sorted(resid)
    med = srt[len(srt) // 2]
    dev = sorted(abs(r - med) for r in resid)
    scale = _scale(kind, rule, vals)
    mad = max(dev[len(dev) // 2], 0.02 * scale)
    out = []
    for p, r in zip(cur, resid):
        if abs(0.6745 * (r - med) / mad) > 3.5 and abs(r - med) > 0.2 * scale:
            out.append({"kind": "unusual", "key": str(p["session_id"]), "at": p["at"],
                        "text": f"This session is far from the recent pattern ({'higher' if r > med else 'lower'} than expected). Worth a context note?"})
    return out


def recorder_gap(kind: str, rule: dict, cur: list[dict], fmt) -> dict | None:
    """Two people recording the same program in the same phase, with consistently different results."""
    by: dict[str, list[float]] = {}
    for p in cur:
        by.setdefault(p.get("recorder") or "?", []).append(p["value"])
    groups = sorted(((k, v) for k, v in by.items() if len(v) >= 3), key=lambda kv: -len(kv[1]))[:2]
    if len(groups) < 2:
        return None
    (na, a), (nb, b) = groups
    scale = _scale(kind, rule, a + b)
    pooled = ((sum((v - mean(a)) ** 2 for v in a) + sum((v - mean(b)) ** 2 for v in b)) / (len(a) + len(b) - 2)) ** 0.5
    diff = abs(mean(a) - mean(b))
    if diff < max(0.15 * scale, 1.5 * pooled):
        return None
    hi, lo = ((na, a), (nb, b)) if mean(a) > mean(b) else ((nb, b), (na, a))
    return {"kind": "recorder_gap", "text": f"{hi[0]}’s sessions average {fmt(mean(hi[1]))}; {lo[0]}’s average {fmt(mean(lo[1]))}. Check that both score the same way."}


def prompt_dependence(goal: str, cur: list[dict]) -> dict | None:
    """Independent responding flat while the prompted share climbs or stays high."""
    pts = [p for p in cur if p.get("trials")]
    if len(pts) < 5 or goal != "increase":
        return None
    indep = [p["value"] for p in pts]
    share = [100 * p["prompted"] / p["trials"] for p in pts]
    recent = mean(share[-3:])
    if abs(slope(indep)) / 100 < 0.012 and (slope(share) >= 2.0 or recent >= 45) and recent >= 30:
        return {"kind": "prompt_dependence",
                "text": f"Prompted responses now make up {recent:.0f}% of trials while independent responding is flat. Consider a prompt-fading step."}
    return None


def insights(kind: str, goal: str, rule: dict, points: list[dict], phases: list[dict], flag: str,
             dismissed: set[tuple[str, str]] = frozenset(), fmt=lambda v: f"{v:.0f}") -> list[dict]:
    cur = current_phase_points(points, phases)
    phase_key = str(max((p["started_at"] for p in phases), default=""))
    found: list[dict] = change_points(kind, rule, points, phases)
    if flag not in ("baseline", "mastered", "no_data"):
        if flag == "on_track" and (f := forecast(kind, goal, rule, cur)):
            found.append(f)
        found += unusual_sessions(kind, rule, cur)
        for item in (recorder_gap(kind, rule, cur, fmt), prompt_dependence(goal, cur) if kind == "trial" else None):
            if item:
                found.append({**item, "key": phase_key})
    return [i for i in found if (i["kind"], i["key"]) not in dismissed]
