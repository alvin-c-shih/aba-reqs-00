"""Data collection: offline bundle, per-student session lock, idempotent sync.

Rules (ADR-0004, ADR-0005):
  • every observation is stored — nothing a device recorded is ever dropped;
  • ids come from the device, so re-sending a batch is harmless;
  • when two people recorded the same student at the same time, the session of the
    latest lock holder counts and the other waits for BCBA review.
"""
from __future__ import annotations

import json
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from .. import analytics
from ..config import settings
from ..deps import Ctx, require
from .clinic import _summaries

router = APIRouter(prefix="/api/v1/collect", tags=["collect"])
collector = require("rbt", "bcba")


class LockIn(BaseModel):
    device_id: str = Field(min_length=4, max_length=80)
    takeover: bool = False


class Beat(BaseModel):
    device_id: str = Field(min_length=4, max_length=80)


class SessionIn(BaseModel):
    id: uuid.UUID
    student_id: uuid.UUID
    kind: str = Field(default="direct", pattern="^(direct|probe)$")
    setting: str = Field(default="school", pattern="^(school|home|community)$")
    started_at: datetime
    ended_at: datetime | None = None
    lock_epoch: int | None = None
    note: str = Field(default="", max_length=2000)


class ObservationIn(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    program_id: uuid.UUID
    target_id: uuid.UUID | None = None
    kind: str = Field(pattern="^(trial|event|duration|window|void|interval|abc|step)$")
    hit: bool | None = None
    data: dict[str, str] | None = None
    outcome: str | None = Field(default=None, pattern="^(correct|prompted|incorrect|no_response)$")
    seconds: int | None = Field(default=None, ge=0, le=86400)
    voids: uuid.UUID | None = None
    recorded_at: datetime


class SyncIn(BaseModel):
    device_id: str = Field(min_length=4, max_length=80)
    sessions: list[SessionIn] = Field(default_factory=list, max_length=50)
    observations: list[ObservationIn] = Field(default_factory=list, max_length=5000)


def _lock_view(c: Ctx, student_id) -> dict | None:
    """Current live lock (not released, heartbeat fresh), or None."""
    return c.one(
        "select l.*, u.name as holder from session_locks l join users u on u.id = l.holder_id"
        " where l.student_id = %s and l.released_at is null and l.heartbeat_at > now() - make_interval(mins => %s)",
        student_id, settings.lock_stale_minutes)


@router.get("/bundle")
def bundle(c: Ctx = Depends(collector)):
    """Everything the collection screen needs, in one response the device caches for offline use."""
    where, args = c.student_filter()
    students = c.all(
        f"select st.id, st.first_name, st.last_name, s.name as site from students st join sites s on s.id = st.site_id"
        f" where {where} and st.status = 'active' order by st.first_name", *args)
    ids = [s["id"] for s in students]
    progs = c.all("select id, student_id, name, kind, goal, domain, instruction, mastery, config, status from programs"
                  " where student_id = any(%s) and status = 'active' order by position, created_at", ids)
    summ = _summaries(c, progs)
    targets = c.all("select id, program_id, label from targets where program_id = any(%s) and status = 'active' order by position",
                    [p["id"] for p in progs])
    locks = {l["student_id"]: l for l in c.all(
        "select l.student_id, l.holder_id, l.device_id, l.epoch, l.acquired_at, u.name as holder from session_locks l"
        " join users u on u.id = l.holder_id where l.student_id = any(%s) and l.released_at is null"
        " and l.heartbeat_at > now() - make_interval(mins => %s)", ids, settings.lock_stale_minutes)}
    today = {r["student_id"] for r in c.all(
        "select distinct student_id from sessions where student_id = any(%s) and started_at::date = current_date"
        " and review_state in ('live','accepted')", ids)}
    for s in students:
        s["programs"] = [{**p, "targets": [t for t in targets if t["program_id"] == p["id"]],
                          "spark": summ[p["id"]]["spark"], "flag": summ[p["id"]]["flag"],
                          "last": summ[p["id"]]["last"]} for p in progs if p["student_id"] == s["id"]]
        s["lock"] = locks.get(s["id"])
        s["seen_today"] = s["id"] in today
    return {"students": students, "server_time": datetime.now(timezone.utc), "user_id": c.user["id"]}


@router.post("/students/{student_id}/lock")
def take_lock(student_id: uuid.UUID, body: LockIn, c: Ctx = Depends(collector)):
    c.student(student_id)
    c.db.execute("select pg_advisory_xact_lock(hashtext(%s))", (str(student_id),))   # serialise competing grabs
    live = _lock_view(c, student_id)
    mine = live and live["holder_id"] == c.user["id"] and live["device_id"] == body.device_id
    if live and not mine and not body.takeover:
        raise HTTPException(409, detail={"code": "locked", "holder": live["holder"], "since": live["acquired_at"].isoformat(),
                                         "message": f"{live['holder']} is running a session with this student"})
    prev = c.one("select epoch from session_locks where student_id = %s", student_id)
    epoch = live["epoch"] if mine else (prev["epoch"] + 1 if prev else 1)
    c.db.execute(
        "insert into session_locks (student_id, school_id, holder_id, device_id, epoch) values (%s, %s, %s, %s, %s)"
        " on conflict (student_id) do update set holder_id = excluded.holder_id, device_id = excluded.device_id,"
        " epoch = excluded.epoch, acquired_at = case when session_locks.epoch = excluded.epoch then session_locks.acquired_at else now() end,"
        " heartbeat_at = now(), released_at = null",
        (student_id, c.school_id, c.user["id"], body.device_id, epoch))
    if live and not mine:
        c.audit("lock.taken_over", "student", student_id, from_user=live["holder"], epoch=epoch)
    return {"epoch": epoch, "took_over_from": live["holder"] if live and not mine else None}


@router.post("/students/{student_id}/heartbeat")
def heartbeat(student_id: uuid.UUID, body: Beat, c: Ctx = Depends(collector)):
    c.student(student_id)
    row = c.one(
        "update session_locks set heartbeat_at = now() where student_id = %s and holder_id = %s and device_id = %s"
        " and released_at is null returning epoch", student_id, c.user["id"], body.device_id)
    if row:
        return {"held": True, "epoch": row["epoch"]}
    live = _lock_view(c, student_id)
    return {"held": False, "holder": live["holder"] if live else None,
            "since": live["acquired_at"] if live else None}


@router.delete("/students/{student_id}/lock")
def release(student_id: uuid.UUID, device_id: str, c: Ctx = Depends(collector)):
    c.student(student_id)
    c.db.execute("update session_locks set released_at = now() where student_id = %s and holder_id = %s and device_id = %s",
                 (student_id, c.user["id"], device_id))
    return {"ok": True}


def _place(c: Ctx, s: SessionIn) -> tuple[str, str]:
    """Decide whether a newly arrived session counts immediately or waits for review."""
    end = s.ended_at or datetime.now(timezone.utc)
    rival = c.one(
        "select x.id, x.lock_epoch, x.review_state, u.name from sessions x join users u on u.id = x.user_id"
        " where x.student_id = %s and x.user_id <> %s and x.id <> %s and x.started_at < %s"
        " and coalesce(x.ended_at, x.started_at + interval '2 hours') > %s and x.review_state in ('live', 'pending')"
        " order by x.lock_epoch desc nulls last limit 1",
        s.student_id, c.user["id"], s.id, end, s.started_at)
    if rival:
        if (s.lock_epoch or -1) > (rival["lock_epoch"] or -1):
            # we are the later lock holder: our data counts, the earlier overlapping session goes to review
            if rival["review_state"] == "live":
                c.db.execute("update sessions set review_state = 'pending', review_why = %s where id = %s",
                             (f"Overlaps a session by {c.user['name']}, who took over the lock", rival["id"]))
            return "live", ""
        return "pending", f"Overlaps a session by {rival['name']}" + (
            "; started offline without a confirmed lock" if s.lock_epoch is None else ", who held the lock")
    if s.ended_at is None:
        live = _lock_view(c, s.student_id)
        if live and live["holder_id"] != c.user["id"]:
            return "pending", f"{live['holder']} holds the session lock"
    return "live", ""


@router.post("/sync")
def sync(body: SyncIn, c: Ctx = Depends(collector)):
    receipts: dict[str, dict] = {}
    allowed_programs: dict = {}
    for s in body.sessions:
        c.student(s.student_id)                      # 404 if not assigned
        existing = c.one("select user_id, review_state from sessions where id = %s", s.id)
        if existing:
            if existing["user_id"] != c.user["id"]:
                raise HTTPException(409, "Session id belongs to someone else")
            c.db.execute("update sessions set ended_at = coalesce(%s, ended_at), note = %s where id = %s", (s.ended_at, s.note, s.id))
        else:
            if s.started_at > datetime.now(timezone.utc) + timedelta(minutes=10):   # tolerate small clock skew
                raise HTTPException(422, "Session start time is in the future")
            state, why = _place(c, s)
            c.db.execute(
                "insert into sessions (id, school_id, student_id, user_id, device_id, kind, setting, started_at, ended_at,"
                " lock_epoch, review_state, review_why, note) values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                (s.id, c.school_id, s.student_id, c.user["id"], body.device_id, s.kind, s.setting, s.started_at, s.ended_at,
                 s.lock_epoch, state, why, s.note))
            c.audit("session.received", "session", s.id, review_state=state)

    stored = dup = 0
    for o in body.observations:
        sess = c.one("select id, student_id, user_id from sessions where id = %s", o.session_id)
        if not sess or sess["user_id"] != c.user["id"]:
            raise HTTPException(422, f"Observation {o.id} refers to a session you did not record")
        if o.program_id not in allowed_programs:
            allowed_programs[o.program_id] = c.one("select student_id, kind from programs where id = %s", o.program_id)
        prog = allowed_programs[o.program_id]
        if not prog or prog["student_id"] != sess["student_id"]:
            raise HTTPException(422, f"Observation {o.id} refers to a program of a different student")
        fits = {"trial": "trial", "event": "frequency", "duration": "duration", "interval": "interval", "abc": "abc", "step": "task"}.get(o.kind)
        if o.data and (len(o.data) > 6 or any(len(v) > 300 for v in o.data.values())):
            raise HTTPException(422, f"Observation {o.id}: ABC entry is too long")
        if fits and fits != prog["kind"]:
            raise HTTPException(422, f"Observation {o.id}: a {o.kind} cannot be recorded on a {prog['kind']} program")
        cur = c.db.execute(
            "insert into observations (id, school_id, session_id, program_id, target_id, kind, outcome, seconds, voids, hit, data, user_id, recorded_at)"
            " values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb, %s, %s) on conflict (id) do nothing",
            (o.id, c.school_id, o.session_id, o.program_id, o.target_id, o.kind, o.outcome, o.seconds, o.voids, o.hit,
             json.dumps(o.data) if o.data is not None else None, c.user["id"], o.recorded_at))
        if cur.rowcount:
            stored += 1
        else:
            dup += 1

    # write receipt: what the server now holds, so the device can show "Server confirmed 37/37"
    for sid in {s.id for s in body.sessions} | {o.session_id for o in body.observations}:
        r = c.one("select x.review_state, x.review_why, (select count(*) from observations o where o.session_id = x.id) as stored"
                  " from sessions x where x.id = %s", sid)
        receipts[str(sid)] = r
    return {"stored": stored, "duplicates": dup, "sessions": receipts, "server_time": datetime.now(timezone.utc)}


@router.get("/programs/{program_id}/recent")
def recent(program_id: uuid.UUID, c: Ctx = Depends(collector)):
    p = c.program(program_id)
    pts = analytics.build_points(p["kind"], c.all(analytics.SERIES_SQL, [program_id]))
    return {"points": [{"at": x["at"], "value": x["value"]} for x in pts[-12:]]}
