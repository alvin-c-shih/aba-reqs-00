"""BCBA workspace: caseload, programs, graphs with phases and annotations, review queue,
corrections. RBTs get read-only access to graphs for their assigned students."""
from __future__ import annotations

import uuid
from collections import defaultdict
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from .. import analytics
from ..deps import Ctx, require

router = APIRouter(prefix="/api/v1/clinic", tags=["clinic"])
bcba = require("bcba")
clinical = require("bcba", "rbt")


class Mastery(BaseModel):
    value: float = Field(ge=0, le=100000)
    n: int = Field(ge=1, le=10)
    m: int = Field(ge=1, le=10)
    min_trials: int = Field(default=0, ge=0, le=100)


class Config(BaseModel):
    """Per-method settings. Only the keys that belong to the program's kind are kept."""
    method: str = Field(default="partial", pattern="^(partial|whole|momentary)$")
    seconds: int = Field(default=30, ge=5, le=600)
    count: int = Field(default=20, ge=1, le=120)
    antecedents: list[str] = Field(default_factory=list, max_length=12)
    consequences: list[str] = Field(default_factory=list, max_length=12)
    chaining: str = Field(default="forward", pattern="^(forward|backward|total)$")

    def for_kind(self, kind: str) -> str:
        keys = {"interval": ("method", "seconds", "count"), "abc": ("antecedents", "consequences"), "task": ("chaining",)}.get(kind, ())
        return self.model_dump_json(include=set(keys))


class ProgramIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    kind: str = Field(pattern="^(trial|frequency|duration|interval|abc|task)$")
    config: Config = Field(default_factory=Config)
    goal: str = Field(pattern="^(increase|decrease)$")
    domain: str = Field(default="", max_length=60)
    instruction: str = Field(default="", max_length=1000)
    plain_name: str = Field(default="", max_length=120)
    mastery: Mastery
    targets: list[str] = Field(default_factory=list, max_length=20)


class ProgramPatch(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    goal: str | None = Field(default=None, pattern="^(increase|decrease)$")
    domain: str | None = Field(default=None, max_length=60)
    instruction: str | None = Field(default=None, max_length=1000)
    plain_name: str | None = Field(default=None, max_length=120)
    mastery: Mastery | None = None
    config: Config | None = None
    targets: list[str] | None = Field(default=None, max_length=20)
    status: str | None = Field(default=None, pattern="^(active|paused|mastered|archived)$")


class PhaseIn(BaseModel):
    label: str = Field(min_length=1, max_length=60)
    kind: str = Field(default="intervention", pattern="^(baseline|intervention|maintenance)$")
    started_at: datetime
    note: str = Field(default="", max_length=500)


class AnnotationIn(BaseModel):
    at: datetime
    kind: str = Field(default="note", pattern="^(note|treatment|context)$")
    body: str = Field(min_length=1, max_length=500)


class TeamIn(BaseModel):
    rbt_ids: list[uuid.UUID]


class ReviewIn(BaseModel):
    decision: str = Field(pattern="^(accepted|rejected)$")
    note: str = Field(default="", max_length=500)


class CorrectionIn(BaseModel):
    outcome: str | None = Field(default=None, pattern="^(correct|prompted|incorrect|no_response)$")
    reason: str = Field(min_length=3, max_length=300)


def _mastery_ok(m: Mastery) -> None:
    if m.n > m.m:
        raise HTTPException(422, "“N of M sessions”: N cannot be larger than M")


def _fmt(kind: str):
    if kind in analytics.PERCENT_KINDS:
        return lambda v: f"{v:.0f}%"
    if kind == "duration":
        return lambda v: f"{int(v // 60)}m {int(v % 60):02d}s"
    return lambda v: f"{v:.1f}".removesuffix(".0")


def _dismissed(c: Ctx, program_ids: list) -> dict:
    out: dict = defaultdict(set)
    for d in (c.all("select program_id, kind, key from dismissals where program_id = any(%s)", program_ids) if program_ids else []):
        out[d["program_id"]].add((d["kind"], d["key"]))
    return out


def _summaries(c: Ctx, programs: list[dict]) -> dict:
    """program_id → {flag evaluation, spark values, last_at} in two queries."""
    ids = [p["id"] for p in programs]
    rows = c.all(analytics.SERIES_SQL, ids) if ids else []
    by_prog: dict = defaultdict(list)
    for r in rows:
        by_prog[r["program_id"]].append(r)
    phases: dict = defaultdict(list)
    for ph in (c.all("select * from phases where program_id = any(%s) order by started_at", ids) if ids else []):
        phases[ph["program_id"]].append(ph)
    gone = _dismissed(c, ids)
    out = {}
    for p in programs:
        pts = analytics.build_points(p["kind"], by_prog[p["id"]])
        ev = analytics.evaluate(p["kind"], p["goal"], p["mastery"], pts, phases[p["id"]], p["status"])
        ins = analytics.insights(p["kind"], p["goal"], p["mastery"], pts, phases[p["id"]], ev["flag"], gone[p["id"]], _fmt(p["kind"])) if p["status"] == "active" else []
        ev["signals"] = [{"kind": i["kind"], "text": i["text"]} for i in ins if i["kind"] != "forecast"]
        out[p["id"]] = {**ev, "spark": [x["value"] for x in pts[-12:]], "last_at": pts[-1]["at"] if pts else None,
                        "phase": phases[p["id"]][-1]["label"] if phases[p["id"]] else None}
    return out


@router.get("/caseload")
def caseload(c: Ctx = Depends(clinical)):
    where, args = c.student_filter()
    students = c.all(
        "select st.id, st.first_name, st.last_name, st.status, s.name as site,"
        " coalesce((select json_agg(u.name order by u.name) from staff_assignments a join users u on u.id = a.user_id"
        "   where a.student_id = st.id and a.ended_at is null), '[]') as rbts,"
        " (select max(started_at) from sessions x where x.student_id = st.id) as last_session_at"
        f" from students st join sites s on s.id = st.site_id where {where} and st.status = 'active'"
        " order by st.first_name", *args)
    progs = c.all("select * from programs where student_id = any(%s) and status <> 'archived' order by position, created_at",
                  [s["id"] for s in students])
    summ = _summaries(c, progs)
    by_student = defaultdict(list)
    for p in progs:
        by_student[p["student_id"]].append({"id": p["id"], "name": p["name"], "kind": p["kind"], "goal": p["goal"],
                                            "status": p["status"], "criterion": p["mastery"]["value"], **summ[p["id"]]})
    for s in students:
        s["programs"] = by_student[s["id"]]
    pending = c.one(
        f"select count(*) as n from sessions x join students st on st.id = x.student_id where x.review_state = 'pending' and {where}",
        *args)["n"] if c.role == "bcba" else 0
    return {"students": students, "pending_reviews": pending}


@router.get("/students/{student_id}")
def student(student_id: uuid.UUID, c: Ctx = Depends(clinical)):
    st = c.student(student_id)
    c.audit("student.viewed", "student", student_id)
    progs = c.all("select * from programs where student_id = %s order by (status = 'archived'), position, created_at", student_id)
    summ = _summaries(c, progs)
    targets = defaultdict(list)
    for t in c.all("select id, program_id, label, status from targets where program_id = any(%s) and status <> 'retired' order by position",
                   [p["id"] for p in progs]):
        targets[t["program_id"]].append(t)
    return {
        "student": {"id": st["id"], "first_name": st["first_name"], "last_name": st["last_name"], "status": st["status"],
                    "site": c.one("select name from sites where id = %s", st["site_id"])["name"]},
        "plan": c.one("select id, name from plans where student_id = %s and status = 'active' order by created_at desc limit 1", student_id),
        "team": c.all("select u.id, u.name, a.started_at from staff_assignments a join users u on u.id = a.user_id"
                      " where a.student_id = %s and a.ended_at is null order by u.name", student_id),
        "programs": [{**p, "targets": targets[p["id"]], "summary": summ[p["id"]]} for p in progs],
    }


@router.get("/staff")
def staff(c: Ctx = Depends(bcba)):
    return c.all("select id, name from users where role = 'rbt' and status = 'active' order by name")


@router.put("/students/{student_id}/team")
def set_team(student_id: uuid.UUID, body: TeamIn, c: Ctx = Depends(bcba)):
    c.student(student_id)
    valid = {r["id"] for r in c.all("select id from users where role = 'rbt' and status = 'active' and id = any(%s)", body.rbt_ids)}
    if valid != set(body.rbt_ids):
        raise HTTPException(422, "Team members must be active RBTs at this school")
    current = {r["user_id"] for r in c.all("select user_id from staff_assignments where student_id = %s and ended_at is null", student_id)}
    for uid in current - valid:   # history is kept: assignments end, they are never deleted
        c.db.execute("update staff_assignments set ended_at = now() where student_id = %s and user_id = %s and ended_at is null", (student_id, uid))
    for uid in valid - current:
        c.db.execute("insert into staff_assignments (school_id, student_id, user_id, created_by) values (%s, %s, %s, %s)",
                     (c.school_id, student_id, uid, c.user["id"]))
    c.audit("team.updated", "student", student_id, added=len(valid - current), removed=len(current - valid))
    return {"ok": True}


def _set_targets(c: Ctx, program_id, labels: list[str]) -> None:
    labels = [l.strip() for l in labels if l.strip()]
    existing = {t["label"]: t for t in c.all("select * from targets where program_id = %s", program_id)}
    for i, label in enumerate(labels):
        if label in existing:
            c.db.execute("update targets set status = 'active', position = %s where id = %s", (i, existing[label]["id"]))
        else:
            c.db.execute("insert into targets (school_id, program_id, label, position) values (%s, %s, %s, %s)",
                         (c.school_id, program_id, label, i))
    for label, t in existing.items():      # targets with data are retired, never deleted
        if label not in labels:
            c.db.execute("update targets set status = 'retired' where id = %s", (t["id"],))


@router.post("/students/{student_id}/programs", status_code=201)
def create_program(student_id: uuid.UUID, body: ProgramIn, c: Ctx = Depends(bcba)):
    c.student(student_id)
    _mastery_ok(body.mastery)
    plan = c.one("select id from plans where student_id = %s and status = 'active' order by created_at desc limit 1", student_id)
    if not plan:
        plan = c.one("insert into plans (school_id, student_id, name) values (%s, %s, 'Treatment Plan') returning id", c.school_id, student_id)
    p = c.one(
        "insert into programs (school_id, student_id, plan_id, name, kind, goal, domain, instruction, mastery, config, created_by, position)"
        " values (%s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb, %s::jsonb, %s, (select coalesce(max(position), 0) + 1 from programs where student_id = %s))"
        " returning id",
        c.school_id, student_id, plan["id"], body.name.strip(), body.kind, body.goal, body.domain, body.instruction,
        body.mastery.model_dump_json(), body.config.for_kind(body.kind), c.user["id"], student_id)
    _set_targets(c, p["id"], body.targets)
    c.db.execute("update programs set plain_name = %s where id = %s", (body.plain_name.strip(), p["id"]))
    c.db.execute("insert into phases (school_id, program_id, label, kind, started_at, created_by) values (%s, %s, 'Baseline', 'baseline', now(), %s)",
                 (c.school_id, p["id"], c.user["id"]))
    c.audit("program.created", "program", p["id"], name=body.name, kind=body.kind)
    return p


@router.patch("/programs/{program_id}")
def patch_program(program_id: uuid.UUID, body: ProgramPatch, c: Ctx = Depends(bcba)):
    prog = c.program(program_id)
    data = body.model_dump(exclude_unset=True)
    if body.config:
        c.db.execute("update programs set config = %s::jsonb where id = %s", (body.config.for_kind(prog["kind"]), program_id))
    if body.mastery:
        _mastery_ok(body.mastery)
        c.db.execute("update programs set mastery = %s::jsonb where id = %s", (body.mastery.model_dump_json(), program_id))
    for col in ("name", "goal", "domain", "instruction", "status", "plain_name"):
        if data.get(col) is not None:
            c.db.execute(f"update programs set {col} = %s where id = %s", (data[col], program_id))  # col is from a fixed list
    if body.targets is not None:
        _set_targets(c, program_id, body.targets)
    c.db.execute("update programs set updated_at = now() where id = %s", (program_id,))
    c.audit("program.updated", "program", program_id, fields=sorted(data))
    return {"ok": True}


@router.get("/programs/{program_id}/series")
def series(program_id: uuid.UUID, c: Ctx = Depends(clinical)):
    p = c.program(program_id)
    st = c.one("select id, first_name, last_name from students where id = %s", p["student_id"])
    rows = c.all(analytics.SERIES_SQL, [program_id])
    pts = analytics.build_points(p["kind"], rows)
    phases = c.all("select id, label, kind, started_at, note from phases where program_id = %s order by started_at", program_id)
    notes = c.all("select a.id, a.at, a.kind, a.body, u.name as author from annotations a left join users u on u.id = a.created_by"
                  " where a.program_id = %s and a.removed_at is null order by a.at", program_id)
    targets = c.all("select id, label, status from targets where program_id = %s and status <> 'retired' order by position", program_id)
    c.audit("program.viewed", "program", program_id)
    summary = analytics.evaluate(p["kind"], p["goal"], p["mastery"], pts, phases, p["status"])
    ins = analytics.insights(p["kind"], p["goal"], p["mastery"], pts, phases, summary["flag"],
                             _dismissed(c, [program_id])[program_id], _fmt(p["kind"])) if p["status"] == "active" else []
    patterns = None
    if p["kind"] == "abc":      # what tends to come before and after the behaviour (last 60 days, non-voided)
        def top(field: str) -> list[dict]:
            return c.all(
                f"select o.data->>'{field}' as label, count(*) as n from observations o join sessions s on s.id = o.session_id"
                " where o.program_id = %s and o.kind = 'abc' and s.review_state in ('live','accepted')"
                " and o.recorded_at > now() - interval '60 days' and not exists (select 1 from observations v where v.voids = o.id)"
                f" and coalesce(o.data->>'{field}', '') <> '' group by 1 order by n desc, 1 limit 6", program_id)
        patterns = {"antecedents": top("antecedent"), "consequences": top("consequence")}
    return {"program": {**p, "targets": targets}, "student": st, "points": pts, "phases": phases, "annotations": notes,
            "summary": summary, "insights": ins, "patterns": patterns}


class DismissIn(BaseModel):
    kind: str = Field(pattern="^(change_point|unusual|recorder_gap|prompt_dependence)$")
    key: str = Field(max_length=80)


@router.post("/programs/{program_id}/insights/dismiss")
def dismiss_insight(program_id: uuid.UUID, body: DismissIn, c: Ctx = Depends(bcba)):
    c.program(program_id)
    c.db.execute("insert into dismissals (school_id, program_id, kind, key, dismissed_by) values (%s, %s, %s, %s, %s)"
                 " on conflict do nothing", (c.school_id, program_id, body.kind, body.key, c.user["id"]))
    c.audit("insight.dismissed", "program", program_id, kind=body.kind)
    return {"ok": True}


@router.post("/programs/{program_id}/insights/restore")
def restore_insight(program_id: uuid.UUID, body: DismissIn, c: Ctx = Depends(bcba)):
    c.program(program_id)
    c.db.execute("delete from dismissals where program_id = %s and kind = %s and key = %s", (program_id, body.kind, body.key))
    return {"ok": True}


@router.post("/programs/{program_id}/phases", status_code=201)
def add_phase(program_id: uuid.UUID, body: PhaseIn, c: Ctx = Depends(bcba)):
    c.program(program_id)
    ph = c.one("insert into phases (school_id, program_id, label, kind, started_at, note, created_by)"
               " values (%s, %s, %s, %s, %s, %s, %s) returning id",
               c.school_id, program_id, body.label.strip(), body.kind, body.started_at, body.note, c.user["id"])
    c.audit("phase.added", "program", program_id, label=body.label)
    return ph


@router.delete("/phases/{phase_id}")
def remove_phase(phase_id: uuid.UUID, c: Ctx = Depends(bcba)):
    ph = c.one("select * from phases where id = %s", phase_id)
    if not ph:
        raise HTTPException(404, "Phase not found")
    c.program(ph["program_id"])
    if c.one("select count(*) as n from phases where program_id = %s", ph["program_id"])["n"] <= 1:
        raise HTTPException(422, "A program keeps at least one phase")
    c.db.execute("delete from phases where id = %s", (phase_id,))
    c.audit("phase.removed", "program", ph["program_id"], label=ph["label"])
    return {"ok": True}


@router.post("/programs/{program_id}/annotations", status_code=201)
def add_annotation(program_id: uuid.UUID, body: AnnotationIn, c: Ctx = Depends(bcba)):
    c.program(program_id)
    a = c.one("insert into annotations (school_id, program_id, at, kind, body, created_by) values (%s, %s, %s, %s, %s, %s) returning id",
              c.school_id, program_id, body.at, body.kind, body.body.strip(), c.user["id"])
    c.audit("annotation.added", "program", program_id, kind=body.kind)
    return a


@router.delete("/annotations/{annotation_id}")
def remove_annotation(annotation_id: uuid.UUID, c: Ctx = Depends(bcba)):
    a = c.one("select * from annotations where id = %s and removed_at is null", annotation_id)
    if not a:
        raise HTTPException(404, "Annotation not found")
    c.program(a["program_id"])
    c.db.execute("update annotations set removed_at = now() where id = %s", (annotation_id,))
    c.audit("annotation.removed", "program", a["program_id"])
    return {"ok": True}


@router.post("/annotations/{annotation_id}/restore")
def restore_annotation(annotation_id: uuid.UUID, c: Ctx = Depends(bcba)):
    a = c.one("select * from annotations where id = %s", annotation_id)
    if not a:
        raise HTTPException(404, "Annotation not found")
    c.program(a["program_id"])
    c.db.execute("update annotations set removed_at = null where id = %s", (annotation_id,))
    return {"ok": True}


def _session(c: Ctx, session_id) -> dict:
    s = c.one("select x.*, u.name as recorder from sessions x join users u on u.id = x.user_id where x.id = %s", session_id)
    if not s:
        raise HTTPException(404, "Session not found")
    c.student(s["student_id"])
    return s


@router.get("/sessions/{session_id}")
def session_detail(session_id: uuid.UUID, program_id: uuid.UUID | None = None, c: Ctx = Depends(clinical)):
    s = _session(c, session_id)
    obs = c.all(
        "select o.id, o.program_id, o.kind, o.outcome, o.seconds, o.hit, o.data, o.recorded_at, o.corrects, o.reason, t.label as target,"
        " v.reason as void_reason, v.id is not null as voided, vu.name as voided_by"
        " from observations o left join targets t on t.id = o.target_id"
        " left join observations v on v.voids = o.id left join users vu on vu.id = v.user_id"
        " where o.session_id = %s and o.kind not in ('void', 'window') and (%s::uuid is null or o.program_id = %s)"
        " order by o.recorded_at, o.received_at", session_id, program_id, program_id)
    return {"session": s, "observations": obs}


@router.post("/observations/{observation_id}/correct")
def correct(observation_id: uuid.UUID, body: CorrectionIn, c: Ctx = Depends(bcba)):
    """Retroactive edit without rewriting history: void the original, optionally append a replacement."""
    o = c.one("select * from observations where id = %s and kind <> 'void'", observation_id)
    if not o:
        raise HTTPException(404, "Observation not found")
    c.program(o["program_id"])
    if c.one("select 1 from observations where voids = %s", observation_id):
        raise HTTPException(409, "Already voided")
    c.db.execute(
        "insert into observations (id, school_id, session_id, program_id, target_id, kind, voids, reason, user_id, recorded_at)"
        " values (%s, %s, %s, %s, %s, 'void', %s, %s, %s, now())",
        (uuid.uuid4(), o["school_id"], o["session_id"], o["program_id"], o["target_id"], o["id"], body.reason, c.user["id"]))
    if body.outcome and o["kind"] in ("trial", "step"):
        c.db.execute(
            "insert into observations (id, school_id, session_id, program_id, target_id, kind, outcome, corrects, reason, user_id, recorded_at)"
            " values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
            (uuid.uuid4(), o["school_id"], o["session_id"], o["program_id"], o["target_id"], o["kind"], body.outcome, o["id"],
             body.reason, c.user["id"], o["recorded_at"]))
    c.audit("observation.corrected" if body.outcome else "observation.voided", "observation", observation_id,
            reason=body.reason, was=o["outcome"], now=body.outcome)
    return {"ok": True}


@router.get("/review")
def review_queue(c: Ctx = Depends(bcba)):
    where, args = c.student_filter()
    rows = c.all(
        "select x.id, x.started_at, x.ended_at, x.review_state, x.review_why, x.review_note, x.reviewed_at, x.received_at,"
        " u.name as recorder, st.id as student_id, st.first_name, st.last_name,"
        " (select count(*) from observations o where o.session_id = x.id and o.kind not in ('void','window')) as observations,"
        " (select json_agg(distinct p.name) from observations o join programs p on p.id = o.program_id where o.session_id = x.id) as programs"
        f" from sessions x join users u on u.id = x.user_id join students st on st.id = x.student_id"
        f" where {where} and (x.review_state = 'pending' or x.reviewed_at > now() - interval '14 days')"
        " order by (x.review_state = 'pending') desc, x.started_at desc", *args)
    return rows


@router.post("/review/{session_id}")
def decide(session_id: uuid.UUID, body: ReviewIn, c: Ctx = Depends(bcba)):
    s = _session(c, session_id)
    if s["review_state"] == "live":
        raise HTTPException(409, "This session is not in the review queue")
    if body.decision == "rejected" and len(body.note.strip()) < 3:
        raise HTTPException(422, "Say why this data is being excluded")
    c.db.execute("update sessions set review_state = %s, review_note = %s, reviewed_by = %s, reviewed_at = now() where id = %s",
                 (body.decision, body.note.strip(), c.user["id"], session_id))
    c.audit("session." + body.decision, "session", session_id, note=body.note)
    return {"ok": True}
