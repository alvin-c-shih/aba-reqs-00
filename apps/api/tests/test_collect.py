import uuid
from datetime import datetime, timedelta, timezone

from .conftest import BEN, client

AVA = 'd0000000-0000-4000-8000-000000000003'   # Dee: has an active trial program; Jo is not on her team


def now(**kw):
    return (datetime.now(timezone.utc) + timedelta(**kw)).isoformat()


def program(c, student, kind="trial"):
    s = next(s for s in c.get("/api/v1/collect/bundle").json()["students"] if s["id"] == student)
    return next(p for p in s["programs"] if p["kind"] == kind)


def batch(student, prog, epoch, n=3, start=-10, end=None, sid=None):
    sid = sid or str(uuid.uuid4())
    return sid, {"device_id": "test-device", "sessions": [
        {"id": sid, "student_id": student, "started_at": now(minutes=start), "ended_at": end, "lock_epoch": epoch}],
        "observations": [{"id": str(uuid.uuid4()), "session_id": sid, "program_id": prog["id"], "kind": "trial",
                          "outcome": "correct", "recorded_at": now(minutes=start + i)} for i in range(n)]}


def test_sync_is_idempotent_and_returns_a_receipt():
    c = client("rbt")
    p = program(c, AVA)
    epoch = c.post(f"/api/v1/collect/students/{AVA}/lock", json={"device_id": "test-device"}).json()["epoch"]
    sid, body = batch(AVA, p, epoch)
    r1 = c.post("/api/v1/collect/sync", json=body).json()
    r2 = c.post("/api/v1/collect/sync", json=body).json()
    assert (r1["stored"], r1["duplicates"]) == (3, 0)
    assert (r2["stored"], r2["duplicates"]) == (0, 3)
    assert r2["sessions"][sid] == {"review_state": "live", "review_why": "", "stored": 3}


def test_lock_conflict_then_takeover_sends_displaced_data_to_review():
    marcus, jo = client("rbt"), client("rbt2")
    p = program(marcus, BEN)
    e1 = marcus.post(f"/api/v1/collect/students/{BEN}/lock", json={"device_id": "marcus-phone"}).json()["epoch"]
    blocked = jo.post(f"/api/v1/collect/students/{BEN}/lock", json={"device_id": "jo-tablet"})
    assert blocked.status_code == 409 and blocked.json()["holder"] == "Marcus Rivera"
    e2 = jo.post(f"/api/v1/collect/students/{BEN}/lock", json={"device_id": "jo-tablet", "takeover": True}).json()["epoch"]
    assert e2 == e1 + 1
    assert marcus.post(f"/api/v1/collect/students/{BEN}/heartbeat", json={"device_id": "marcus-phone"}).json()["held"] is False

    sid_m, bm = batch(BEN, p, e1)
    sid_j, bj = batch(BEN, p, e2, start=-5)
    # Marcus lost the lock: his data is stored but waits for review; Jo (latest holder) counts immediately
    assert marcus.post("/api/v1/collect/sync", json=bm).json()["sessions"][sid_m]["review_state"] == "pending"
    assert jo.post("/api/v1/collect/sync", json=bj).json()["sessions"][sid_j]["review_state"] == "live"
    b = client("bcba")
    pending = [r for r in b.get("/api/v1/clinic/review").json() if r["review_state"] == "pending"]
    assert sid_m in [r["id"] for r in pending]
    before = len(b.get(f"/api/v1/clinic/programs/{p['id']}/series").json()["points"])
    assert b.post(f"/api/v1/clinic/review/{sid_m}", json={"decision": "rejected", "note": ""}).status_code == 422
    assert b.post(f"/api/v1/clinic/review/{sid_m}", json={"decision": "accepted"}).status_code == 200
    assert len(b.get(f"/api/v1/clinic/programs/{p['id']}/series").json()["points"]) == before + 1


def test_rbt_cannot_sync_for_unassigned_student():
    jo = client("rbt2")
    marcus = client("rbt")
    p = program(marcus, AVA)
    _, body = batch(AVA, p, None)
    assert jo.post("/api/v1/collect/sync", json=body).status_code == 404


def test_void_and_correction_keep_history():
    c, b = client("rbt"), client("bcba")
    p = program(c, AVA)
    sid, body = batch(AVA, p, None, n=4, start=-200, end=now(minutes=-190))
    c.post("/api/v1/collect/sync", json=body)
    series = lambda: next(x for x in b.get(f"/api/v1/clinic/programs/{p['id']}/series").json()["points"] if x["session_id"] == sid)
    assert series()["value"] == 100
    first = body["observations"][0]["id"]
    assert b.post(f"/api/v1/clinic/observations/{first}/correct", json={"outcome": "incorrect", "reason": "Scored from video review"}).status_code == 200
    assert series()["value"] == 75 and series()["trials"] == 4
    detail = b.get(f"/api/v1/clinic/sessions/{sid}").json()["observations"]
    assert sum(o["voided"] for o in detail) == 1 and len(detail) == 5
