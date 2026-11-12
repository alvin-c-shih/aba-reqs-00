"""Family and classroom portal (Phase 3).

Parents see what the BCBA has published plus a plain-language goal list; teachers see goals and how to
support them. Neither sees sessions, recorders, notes or other students. Anything they add is reviewed."""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ..deps import Ctx, require
from .reports import family_goal, program_facts

router = APIRouter(prefix="/api/v1/family", tags=["family"])
outside = require("parent", "teacher")


class MessageIn(BaseModel):
    body: str = Field(min_length=1, max_length=2000)


class HomeIn(BaseModel):
    program_id: uuid.UUID
    count: int = Field(ge=0, le=200)
    note: str = Field(default="", max_length=500)


def _contact(c: Ctx, student_id) -> dict:
    row = c.one("select * from student_contacts where student_id = %s and user_id = %s and ended_at is null", student_id, c.user["id"])
    if not row:
        raise HTTPException(404, "Student not found")
    return row


def _thread(c: Ctx) -> str:
    return "family" if c.role == "parent" else "classroom"


@router.get("/children")
def children(c: Ctx = Depends(outside)):
    where, args = c.student_filter()
    rows = c.all(f"select st.id, st.first_name, st.last_name, s.name as site, b.name as bcba from students st"
                 f" join sites s on s.id = st.site_id left join users b on b.id = st.bcba_id where {where} order by st.first_name", *args)
    for r in rows:
        r["latest_summary"] = c.one("select title, published_at from family_summaries where student_id = %s and withdrawn_at is null"
                                    " order by published_at desc limit 1", r["id"]) if c.role == "parent" else None
    return rows


@router.get("/children/{student_id}")
def child(student_id: uuid.UUID, c: Ctx = Depends(outside)):
    st = c.student(student_id)
    contact = _contact(c, student_id)
    c.audit("family.viewed", "student", student_id)
    parent = c.role == "parent"       # families get the plain name; teachers get the staff name
    goals = [family_goal(f, None if parent else f["name"]) for f in program_facts(c, student_id, 90)]
    out = {
        "student": {"id": st["id"], "first_name": st["first_name"], "last_name": st["last_name"]},
        "bcba": c.one("select name from users where id = %s", st["bcba_id"]) if st["bcba_id"] else None,
        "goals": goals,
        "messages": c.all("select m.id, m.body, m.created_at, u.name as author, u.role as author_role, m.author_id = %s as mine"
                          " from messages m join users u on u.id = m.author_id where m.student_id = %s and m.audience = %s order by m.created_at",
                          c.user["id"], student_id, _thread(c)),
    }
    if c.role == "parent":
        out["summaries"] = c.all("select s.id, s.title, s.body, s.snapshot, s.period_days, s.published_at, u.name as author from family_summaries s"
                                 " left join users u on u.id = s.published_by where s.student_id = %s and s.withdrawn_at is null"
                                 " order by s.published_at desc limit 12", student_id)
        out["home"] = c.all("select id, coalesce(nullif(plain_name, ''), name) as name, instruction from programs where student_id = %s and home_ok and status = 'active'"
                            " and kind = 'frequency' order by position", student_id) if contact["home_data"] else []
    else:   # teachers also get the "how to support this" text, which is written for staff
        support = {r["id"]: r["instruction"] for r in c.all("select id, instruction from programs where student_id = %s", student_id)}
        for g in goals:
            g["support"] = support.get(g["id"], "")
    return out


@router.post("/children/{student_id}/messages", status_code=201)
def send(student_id: uuid.UUID, body: MessageIn, c: Ctx = Depends(outside)):
    st = c.student(student_id)
    _contact(c, student_id)
    c.db.execute("insert into messages (school_id, student_id, author_id, audience, body) values (%s, %s, %s, %s, %s)",
                 (c.school_id, student_id, c.user["id"], _thread(c), body.body.strip()))
    c.notify([st["bcba_id"]], "message", f"New message from {c.user['name']} about {st['first_name']}", f"/clinic/students/{student_id}")
    c.audit("message.sent", "student", student_id, audience=_thread(c))
    return {"ok": True}


@router.post("/children/{student_id}/home", status_code=201)
def home_data(student_id: uuid.UUID, body: HomeIn, c: Ctx = Depends(require("parent"))):
    """A parent's count from home. Stored like any session, but always waits for BCBA review."""
    st = c.student(student_id)
    if not _contact(c, student_id)["home_data"]:
        raise HTTPException(403, "Home data is not switched on for you")
    prog = c.one("select id from programs where id = %s and student_id = %s and home_ok and status = 'active' and kind = 'frequency'",
                 body.program_id, student_id)
    if not prog:
        raise HTTPException(404, "Program not found")
    now = datetime.now(timezone.utc)
    sid = uuid.uuid4()
    c.db.execute("insert into sessions (id, school_id, student_id, user_id, device_id, kind, setting, started_at, ended_at, review_state, review_why, note)"
                 " values (%s, %s, %s, %s, 'family-portal', 'direct', 'home', %s, %s, 'pending', %s, %s)",
                 (sid, c.school_id, student_id, c.user["id"], now - timedelta(minutes=30), now,
                  f"Home data entered by {c.user['name']} (parent)", body.note.strip()))
    for i in range(body.count):
        c.db.execute("insert into observations (id, school_id, session_id, program_id, kind, user_id, recorded_at) values (%s, %s, %s, %s, 'event', %s, %s)",
                     (uuid.uuid4(), c.school_id, sid, prog["id"], c.user["id"], now - timedelta(minutes=30) + timedelta(seconds=i)))
    c.db.execute("insert into observations (id, school_id, session_id, program_id, kind, seconds, user_id, recorded_at) values (%s, %s, %s, %s, 'window', 1800, %s, %s)",
                 (uuid.uuid4(), c.school_id, sid, prog["id"], c.user["id"], now))
    c.notify([st["bcba_id"]], "review", f"Home data for {st['first_name']} is waiting for your review", "/clinic/review")
    c.audit("home_data.submitted", "student", student_id, count=body.count)
    return {"ok": True}
