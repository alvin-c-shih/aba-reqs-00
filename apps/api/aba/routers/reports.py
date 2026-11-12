"""Reports and exports: progress report, family summaries, service log (billing), CSV exports."""
from __future__ import annotations

import csv
import io
import json
import uuid
from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field

from .. import analytics
from ..deps import Ctx, require
from .clinic import _dismissed, _fmt

router = APIRouter(prefix="/api/v1/reports", tags=["reports"])
bcba = require("bcba")
PLAIN = {"mastered": "Goal met", "on_track": "Making progress", "no_progress": "Working on it", "regression": "Needs a new approach",
         "variable": "Up and down", "stale": "Not practised recently", "baseline": "Just started", "no_data": "Just started"}


# What the number on a family page counts, in plain words (one phrase per recording method).
MEASURE = {"trial": "tries done correctly", "interval": "check-ins where it was seen", "task": "steps done without help",
           "frequency": "times in a session", "duration": "time in a session", "abc": "incidents written down"}


def _trend(kind: str, goal: str, first, last) -> str | None:
    """Which way the number moved over the period, judged against the goal's direction — so a falling
    count of a behaviour to reduce reads as good news."""
    if first is None or last is None:
        return None
    tol = 5 if kind in analytics.PERCENT_KINDS else max(0.5, 0.1 * max(abs(first), abs(last)))
    toward = (last - first) if goal == "increase" else (first - last)
    return "About the same" if abs(toward) < tol else "Moving toward the goal" if toward > 0 else "Moving away from the goal"


def family_goal(f: dict, name: str | None = None) -> dict:
    """The only shape of a goal that a parent or teacher ever receives (also frozen into published summaries)."""
    return {"id": f["id"], "name": name or f["plain_name"], "domain": f["domain"], "plain": f["plain"], "kind": f["kind"], "criterion": f["criterion"],
            "values": [x["value"] for x in f["points"]][-12:], "measure": f["measure"], "better": f["better"], "trend": f["trend"],
            "first_text": f["first_text"], "last_text": f["last_text"], "target_text": f["criterion_text"], "sessions": f["sessions"]}


def _csv(rows: list[list], name: str) -> Response:
    buf = io.StringIO()
    csv.writer(buf).writerows(rows)
    return Response(buf.getvalue(), media_type="text/csv",
                    headers={"Content-Disposition": f'attachment; filename="{name}"'})


def program_facts(c: Ctx, student_id, days: int) -> list[dict]:
    """Per-program facts for a period — the single source for reports, family summaries and AI drafts."""
    since = datetime.now(timezone.utc) - timedelta(days=days)
    progs = c.all("select * from programs where student_id = %s and status in ('active','mastered') order by position, created_at", student_id)
    ids = [p["id"] for p in progs]
    rows = c.all(analytics.SERIES_SQL, ids) if ids else []
    phases = c.all("select * from phases where program_id = any(%s) order by started_at", ids) if ids else []
    notes = c.all("select program_id, at, kind, body from annotations where program_id = any(%s) and removed_at is null and at >= %s order by at",
                  ids, since) if ids else []
    gone = _dismissed(c, ids)
    out = []
    for p in progs:
        pts = analytics.build_points(p["kind"], [r for r in rows if r["program_id"] == p["id"]])
        ph = [x for x in phases if x["program_id"] == p["id"]]
        ev = analytics.evaluate(p["kind"], p["goal"], p["mastery"], pts, ph, p["status"])
        period = [x for x in pts if x["at"] >= since]
        fmt = _fmt(p["kind"])
        ins = analytics.insights(p["kind"], p["goal"], p["mastery"], pts, ph, ev["flag"], gone[p["id"]], fmt) if p["status"] == "active" else []
        out.append({
            "id": p["id"], "name": p["name"], "plain_name": p["plain_name"] or p["name"], "kind": p["kind"], "goal": p["goal"], "domain": p["domain"], "status": p["status"],
            "criterion": p["mastery"]["value"], "criterion_text": fmt(p["mastery"]["value"]),
            "flag": "mastered" if p["status"] == "mastered" else ev["flag"], "why": ev["why"], "plain": PLAIN["mastered" if p["status"] == "mastered" else ev["flag"]],
            "sessions": len(period), "first": period[0]["value"] if period else None, "last": period[-1]["value"] if period else None,
            "first_text": fmt(period[0]["value"]) if period else "–", "last_text": fmt(period[-1]["value"]) if period else "–",
            "points": [{"session_id": x["session_id"], "at": x["at"], "value": x["value"]} for x in period],
            "phases": [{"id": x["id"], "label": x["label"], "kind": x["kind"], "started_at": x["started_at"], "note": x["note"]} for x in ph],
            "notes": [n for n in notes if n["program_id"] == p["id"]],
            "forecast": next((i["text"] for i in ins if i["kind"] == "forecast"), None),
            "measure": MEASURE.get(p["kind"], "value"), "better": "higher" if p["goal"] == "increase" else "lower",
            "trend": _trend(p["kind"], p["goal"], period[0]["value"], period[-1]["value"]) if len(period) > 1 else None,
        })
    return out


@router.get("/students/{student_id}/progress")
def progress(student_id: uuid.UUID, days: int = 30, c: Ctx = Depends(bcba)):
    st = c.student(student_id)
    days = max(7, min(days, 365))
    sessions = c.one("select count(*) as n, coalesce(sum(extract(epoch from (coalesce(ended_at, started_at) - started_at))) / 60, 0)::int as minutes"
                     " from sessions where student_id = %s and started_at > now() - make_interval(days => %s) and review_state in ('live','accepted')",
                     student_id, days)
    c.audit("report.progress", "student", student_id, days=days)
    return {"student": {"id": st["id"], "first_name": st["first_name"], "last_name": st["last_name"]},
            "days": days, "from": date.today() - timedelta(days=days), "to": date.today(),
            "sessions": sessions["n"], "minutes": sessions["minutes"],
            "bcba": c.user["name"], "school": c.one("select name from schools where id = %s", c.school_id)["name"],
            "programs": program_facts(c, student_id, days),
            "summaries": c.all("select id, title, body, period_days, published_at, withdrawn_at from family_summaries where student_id = %s"
                               " order by published_at desc limit 10", student_id)}


class SummaryIn(BaseModel):
    title: str = Field(min_length=3, max_length=120)
    body: str = Field(min_length=10, max_length=6000)
    days: int = Field(default=30, ge=7, le=365)


@router.post("/students/{student_id}/summaries", status_code=201)
def publish_summary(student_id: uuid.UUID, body: SummaryIn, c: Ctx = Depends(bcba)):
    """Publish a summary to the family. They see this frozen text and goal list — not live clinical data."""
    st = c.student(student_id)
    snap = [family_goal(f) for f in program_facts(c, student_id, body.days)]
    row = c.one("insert into family_summaries (school_id, student_id, title, body, period_days, snapshot, published_by)"
                " values (%s, %s, %s, %s, %s, %s::jsonb, %s) returning id",
                c.school_id, student_id, body.title.strip(), body.body.strip(), body.days, json.dumps(snap, default=str), c.user["id"])
    guardians = [r["user_id"] for r in c.all("select user_id from student_contacts where student_id = %s and kind = 'guardian' and ended_at is null", student_id)]
    c.notify(guardians, "summary", f"A new progress summary for {st['first_name']} is ready", f"/family/{student_id}")
    c.audit("summary.published", "student", student_id, title=body.title)
    return row


@router.delete("/summaries/{summary_id}")
def withdraw_summary(summary_id: uuid.UUID, c: Ctx = Depends(bcba)):
    s = c.one("select student_id from family_summaries where id = %s", summary_id)
    if not s:
        raise HTTPException(404, "Summary not found")
    c.student(s["student_id"])
    c.db.execute("update family_summaries set withdrawn_at = now() where id = %s", (summary_id,))
    c.audit("summary.withdrawn", "student", s["student_id"])
    return {"ok": True}


def units(minutes: int) -> int:
    """15-minute billing units by the common '8-minute rule': 8–22 min = 1, 23–37 = 2, …"""
    return (minutes + 7) // 15


@router.get("/service-log")
def service_log(start: date | None = None, end: date | None = None, student_id: uuid.UUID | None = None,
                format: str = "json", c: Ctx = Depends(require("bcba", "school_admin"))):
    """Who delivered how many minutes to whom — a generic service log, not payer-specific."""
    end = end or date.today()
    start = start or end - timedelta(days=30)
    where, args = c.student_filter()
    rows = c.all(
        "select x.id, x.started_at, x.ended_at, x.kind, x.setting, x.review_state, u.name as staff, u.role as staff_role,"
        " st.id as student_id, st.first_name, st.last_name, s.name as site,"
        " greatest(0, round(extract(epoch from (coalesce(x.ended_at, x.started_at) - x.started_at)) / 60))::int as minutes"
        " from sessions x join users u on u.id = x.user_id join students st on st.id = x.student_id join sites s on s.id = st.site_id"
        f" where {where} and x.started_at::date between %s and %s and x.review_state in ('live','accepted')"
        " and (%s::uuid is null or st.id = %s) order by x.started_at", *args, start, end, student_id, student_id)
    for r in rows:
        r["units"] = units(r["minutes"])
        r["type"] = {"direct": "Direct teaching", "probe": "Probe / assessment"}[r["kind"]]
    c.audit("report.service_log", "school", c.school_id, rows=len(rows))
    if format == "csv":
        head = ["Date", "Start", "End", "Student", "Site", "Staff", "Role", "Service", "Setting", "Minutes", "Units (15 min)"]
        body = [[r["started_at"].date(), r["started_at"].strftime("%H:%M"), r["ended_at"].strftime("%H:%M") if r["ended_at"] else "",
                 f"{r['first_name']} {r['last_name']}", r["site"], r["staff"], r["staff_role"].upper(), r["type"], r["setting"], r["minutes"], r["units"]] for r in rows]
        return _csv([head] + body, f"service-log-{start}-to-{end}.csv")
    return {"start": start, "end": end, "rows": rows, "minutes": sum(r["minutes"] for r in rows), "units": sum(r["units"] for r in rows)}


@router.get("/students/{student_id}/export.csv")
def export_student(student_id: uuid.UUID, c: Ctx = Depends(bcba)):
    """Every counted session value for a student — for continuity of care or outside analysis."""
    st = c.student(student_id)
    progs = c.all("select * from programs where student_id = %s order by position, created_at", student_id)
    rows = c.all(analytics.SERIES_SQL, [p["id"] for p in progs]) if progs else []
    out = [["Program", "Method", "Session date", "Value", "Unit", "Recorded by", "Session type"]]
    unit = {"trial": "% independent", "interval": "% of intervals", "task": "% of steps", "frequency": "count", "abc": "incidents", "duration": "seconds"}
    for p in progs:
        for x in analytics.build_points(p["kind"], [r for r in rows if r["program_id"] == p["id"]]):
            out.append([p["name"], p["kind"], x["at"].date(), x["value"], unit[p["kind"]], x["recorder"], x["session_kind"]])
    c.audit("export.student", "student", student_id, rows=len(out) - 1)
    return _csv(out, f"{st['first_name'].lower()}-{st['last_name'][0].lower()}-data.csv")
