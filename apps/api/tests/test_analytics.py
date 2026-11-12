from datetime import datetime, timedelta, timezone

from aba.analytics import evaluate, mastery_met, point_value, slope

NOW = datetime(2026, 6, 1, tzinfo=timezone.utc)
RULE = {"value": 80, "n": 3, "m": 3, "min_trials": 8}


def pts(values, trials=10, end=NOW):
    return [{"value": float(v), "trials": trials, "at": end - timedelta(days=len(values) - i)} for i, v in enumerate(values)]


def phase(kind="intervention", days_ago=60):
    return [{"kind": kind, "started_at": NOW - timedelta(days=days_ago), "label": "x"}]


def test_percent_counts_prompted_as_not_independent():
    row = {"trials": 4, "correct": 2, "prompted": 1}
    assert point_value("trial", row) == 50.0          # 2 / 4, prompted stays in the denominator
    assert point_value("trial", {"trials": 0, "correct": 0}) is None


def test_slope():
    assert slope([1, 2, 3, 4]) == 1
    assert slope([5]) == 0


def test_mastery_needs_n_of_m_and_min_trials():
    assert mastery_met(pts([50, 80, 90, 100]), RULE, "increase")
    assert not mastery_met(pts([80, 90, 70]), RULE, "increase")
    assert not mastery_met(pts([80, 90, 100], trials=5), RULE, "increase")
    assert mastery_met(pts([3, 1, 0, 1], trials=0), {"value": 1, "n": 3, "m": 3}, "decrease")


def test_flags():
    ev = lambda v, **k: evaluate(k.get("kind", "trial"), k.get("goal", "increase"), RULE, pts(v), k.get("phases", phase()), now=NOW)["flag"]
    assert ev([50, 60, 80, 90, 90]) == "mastered"
    assert ev([70, 65, 60, 50, 45, 40]) == "regression"
    assert ev([30, 30, 40, 30, 30, 40, 30]) == "no_progress"
    assert ev([20, 90, 30, 80, 20, 70]) == "variable"
    assert ev([20, 30, 40, 50, 60, 70]) == "on_track"       # steady gain is not "variable"
    assert ev([20, 30], phases=phase("baseline")) == "baseline"
    assert ev([]) == "no_data"


def test_only_current_phase_is_judged():
    old_flat = pts([30] * 8, end=NOW - timedelta(days=10))
    new_up = pts([40, 50, 60, 70, 75, 78])
    phases = phase(days_ago=60) + phase(days_ago=8)
    assert evaluate("trial", "increase", RULE, old_flat + new_up, phases, now=NOW)["flag"] == "on_track"


def test_stale():
    r = evaluate("trial", "increase", RULE, pts([40, 50, 60], end=NOW - timedelta(days=9)), phase(), now=NOW)
    assert "stale" in r["flags"]


# ── insights ────────────────────────────────────────────────────────────────
from aba import analytics as A


def spts(values, recorders=None, prompted=None):
    return [{"value": float(v), "trials": 10, "prompted": (prompted[i] if prompted else 1), "session_id": f"s{i}",
             "recorder": (recorders[i] if recorders else "A"), "at": NOW - timedelta(days=len(values) - i)} for i, v in enumerate(values)]


def test_change_point_finds_a_jump_but_not_a_ramp():
    jump = spts([30, 35, 30, 35, 30, 35, 65, 60, 65, 60, 65, 60])
    found = A.change_points("trial", RULE, jump, phase())
    assert [f["index"] for f in found] == [6] and found[0]["key"] == "s6"
    ramp = spts([10, 16, 22, 28, 34, 40, 46, 52, 58, 64, 70, 76])
    assert A.change_points("trial", RULE, ramp, phase()) == []
    assert A.change_points("trial", RULE, spts([30, 35, 30, 35, 31, 34, 30, 35]), phase()) == []


def test_forecast_gives_a_range_only_when_moving_toward_criterion():
    f = A.forecast("trial", "increase", RULE, spts([40, 45, 50, 55, 60]))
    assert f and f["sessions"] == 4 and "criterion" in f["text"]
    assert A.forecast("trial", "increase", RULE, spts([60, 55, 50, 45])) is None
    assert A.forecast("frequency", "decrease", {"value": 1}, spts([6, 5, 4, 3]))["sessions"] == 2


def test_unusual_session_is_flagged_once():
    odd = A.unusual_sessions("frequency", {"value": 1}, spts([4, 5, 4, 12, 4, 5, 4, 4]))
    assert [o["key"] for o in odd] == ["s3"]
    assert A.unusual_sessions("frequency", {"value": 1}, spts([4, 5, 4, 5, 4, 5, 4, 4])) == []


def test_recorder_gap_and_prompt_dependence():
    pts = spts([50, 80, 55, 85, 50, 80], recorders=["Ma", "Jo"] * 3)
    assert "Jo" in A.recorder_gap("trial", RULE, pts, lambda v: f"{v:.0f}%")["text"]
    assert A.recorder_gap("trial", RULE, spts([50, 55, 50, 55, 50, 55], recorders=["Ma", "Jo"] * 3), str) is None
    dep = spts([40, 40, 40, 40, 40, 40], prompted=[1, 2, 3, 4, 5, 6])
    assert A.prompt_dependence("increase", dep)
    assert A.prompt_dependence("increase", spts([40, 50, 60, 70, 75, 80], prompted=[1, 2, 3, 4, 5, 6])) is None


def test_dismissed_insights_are_not_offered_again():
    jump = spts([30, 35, 30, 35, 30, 35, 65, 60, 65, 60, 65, 60])
    kinds = lambda d: [i["kind"] for i in A.insights("trial", "increase", RULE, jump, phase(), "on_track", d)]
    assert "change_point" in kinds(frozenset())
    assert "change_point" not in kinds({("change_point", "s6")})
