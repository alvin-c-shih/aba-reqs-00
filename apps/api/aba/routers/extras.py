"""Phase 3–4 features around a student: messaging, family & classroom contacts, consent and media,
program templates, roster import, school feature switches, and local-model drafts."""
from __future__ import annotations

import json
import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from .. import ai, security
from ..config import ROOT, settings
from ..deps import Ctx, require
from .reports import program_facts

clinic = APIRouter(prefix="/api/v1/clinic", tags=["clinic+"])
school = APIRouter(prefix="/api/v1/school", tags=["school+"])
bcba = require("bcba")
team = require("bcba", "rbt")
admin = require("school_admin")
EMAIL = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
MEDIA_DIR = ROOT / "data" / "media" / settings.env
MEDIA_TYPES = {"image/jpeg": ("photo", "jpg"), "image/png": ("photo", "png"), "image/webp": ("photo", "webp"),
               "video/mp4": ("video", "mp4"), "video/webm": ("video", "webm"), "video/quicktime": ("video", "mov")}
MAX_MEDIA = 25 * 1024 * 1024


# ───────────────────────── messaging ─────────────────────────
class MessageIn(BaseModel):
    audience: str = Field(pattern="^(team|family|classroom)$")
    body: str = Field(min_length=1, max_length=2000)


@clinic.get("/students/{student_id}/messages")
def messages(student_id: uuid.UUID, c: Ctx = Depends(team)):
    c.student(student_id)
    allowed = ["team", "family", "classroom"] if c.role == "bcba" else ["team"]     # RBTs see the team thread only
    return c.all("select m.id, m.audience, m.body, m.created_at, u.name as author, u.role as author_role, m.author_id = %s as mine"
                 " from messages m join users u on u.id = m.author_id where m.student_id = %s and m.audience = any(%s) order by m.created_at",
                 c.user["id"], student_id, allowed)


@clinic.post("/students/{student_id}/messages", status_code=201)
def send_message(student_id: uuid.UUID, body: MessageIn, c: Ctx = Depends(team)):
    st = c.student(student_id)
    if c.role == "rbt" and body.audience != "team":
        raise HTTPException(403, "Messages to families and teachers go through the BCBA")
    c.db.execute("insert into messages (school_id, student_id, author_id, audience, body) values (%s, %s, %s, %s, %s)",
                 (c.school_id, student_id, c.user["id"], body.audience, body.body.strip()))
    if body.audience == "team":
        to = [st["bcba_id"]] + [r["user_id"] for r in c.all("select user_id from staff_assignments where student_id = %s and ended_at is null", student_id)]
        link = f"/clinic/students/{student_id}"
    else:
        kind = "guardian" if body.audience == "family" else "teacher"
        to = [r["user_id"] for r in c.all("select user_id from student_contacts where student_id = %s and kind = %s and ended_at is null", student_id, kind)]
        link = f"/family/{student_id}"
    c.notify(to, "message", f"New message from {c.user['name']} about {st['first_name']}", link)
    c.audit("message.sent", "student", student_id, audience=body.audience)
    return {"ok": True}


# ───────────────────────── family & classroom contacts ─────────────────────────
class ContactPatch(BaseModel):
    home_data: bool


@clinic.get("/students/{student_id}/contacts")
def contacts(student_id: uuid.UUID, c: Ctx = Depends(bcba)):
    c.student(student_id)
    return {"contacts": c.all("select sc.id, sc.kind, sc.relation, sc.home_data, u.name, u.email, u.last_login_at from student_contacts sc"
                              " join users u on u.id = sc.user_id where sc.student_id = %s and sc.ended_at is null order by sc.kind, u.name", student_id),
            "consents": c.all("select id, kind, granted_by, source, granted_on, revoked_at from consents where student_id = %s order by created_at desc", student_id),
            "media": c.all("select m.id, m.kind, m.caption, m.created_at, u.name as by from media m left join users u on u.id = m.uploaded_by"
                           " where m.student_id = %s and m.removed_at is null order by m.created_at desc limit 24", student_id)}


@clinic.patch("/contacts/{contact_id}")
def patch_contact(contact_id: uuid.UUID, body: ContactPatch, c: Ctx = Depends(bcba)):
    row = c.one("select student_id from student_contacts where id = %s and kind = 'guardian'", contact_id)
    if not row:
        raise HTTPException(404, "Contact not found")
    c.student(row["student_id"])
    c.db.execute("update student_contacts set home_data = %s where id = %s", (body.home_data, contact_id))
    c.audit("contact.home_data", "student", row["student_id"], allowed=body.home_data)
    return {"ok": True}


class HomeOk(BaseModel):
    home_ok: bool


@clinic.put("/programs/{program_id}/home")
def program_home(program_id: uuid.UUID, body: HomeOk, c: Ctx = Depends(bcba)):
    p = c.program(program_id)
    if body.home_ok and p["kind"] != "frequency":
        raise HTTPException(422, "Only frequency programs can be recorded at home for now")
    c.db.execute("update programs set home_ok = %s, updated_at = now() where id = %s", (body.home_ok, program_id))
    c.audit("program.home_ok", "program", program_id, allowed=body.home_ok)
    return {"ok": True}


# ───────────────────────── consent & media ─────────────────────────
class ConsentIn(BaseModel):
    kind: str = Field(pattern="^(photo|video)$")
    granted_by: str = Field(min_length=2, max_length=120)
    source: str = Field(min_length=2, max_length=200)
    granted_on: date


@clinic.post("/students/{student_id}/consents", status_code=201)
def add_consent(student_id: uuid.UUID, body: ConsentIn, c: Ctx = Depends(bcba)):
    c.student(student_id)
    c.db.execute("update consents set revoked_at = now() where student_id = %s and kind = %s and revoked_at is null", (student_id, body.kind))
    row = c.one("insert into consents (school_id, student_id, kind, granted_by, source, granted_on, recorded_by) values (%s, %s, %s, %s, %s, %s, %s) returning id",
                c.school_id, student_id, body.kind, body.granted_by.strip(), body.source.strip(), body.granted_on, c.user["id"])
    c.audit("consent.recorded", "student", student_id, kind=body.kind)
    return row


@clinic.delete("/consents/{consent_id}")
def revoke_consent(consent_id: uuid.UUID, c: Ctx = Depends(bcba)):
    row = c.one("select student_id, kind from consents where id = %s and revoked_at is null", consent_id)
    if not row:
        raise HTTPException(404, "Consent not found")
    c.student(row["student_id"])
    c.db.execute("update consents set revoked_at = now() where id = %s", (consent_id,))
    c.audit("consent.revoked", "student", row["student_id"], kind=row["kind"])
    return {"ok": True}


@clinic.post("/students/{student_id}/media", status_code=201)
async def upload_media(student_id: uuid.UUID, request: Request, caption: str = "", session_id: uuid.UUID | None = None, c: Ctx = Depends(team)):
    """Raw upload (the file is the request body). Refused unless the student has current consent for that kind."""
    c.student(student_id)
    mime = (request.headers.get("content-type") or "").split(";")[0].strip().lower()
    if mime not in MEDIA_TYPES:
        raise HTTPException(415, "Photos (JPEG, PNG, WebP) and videos (MP4, WebM, MOV) only")
    kind, ext = MEDIA_TYPES[mime]
    if not c.one("select 1 from consents where student_id = %s and kind = %s and revoked_at is null", student_id, kind):
        raise HTTPException(403, f"No {kind} consent is on record for this student")
    if int(request.headers.get("content-length") or 0) > MAX_MEDIA:
        raise HTTPException(413, "File is larger than 25 MB")
    data = await request.body()
    if not data or len(data) > MAX_MEDIA:
        raise HTTPException(413, "File is empty or larger than 25 MB")
    mid = uuid.uuid4()
    rel = f"{c.school_id}/{mid}.{ext}"                       # server-chosen name: nothing from the client reaches the path
    (MEDIA_DIR / str(c.school_id)).mkdir(parents=True, exist_ok=True)
    (MEDIA_DIR / rel).write_bytes(data)
    c.db.execute("insert into media (id, school_id, student_id, session_id, kind, mime, bytes, path, caption, uploaded_by)"
                 " values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                 (mid, c.school_id, student_id, session_id, kind, mime, len(data), rel, caption[:200], c.user["id"]))
    c.audit("media.uploaded", "student", student_id, kind=kind, bytes=len(data))
    return {"id": mid, "kind": kind}


def _media(c: Ctx, media_id) -> dict:
    m = c.one("select * from media where id = %s and removed_at is null", media_id)
    if not m:
        raise HTTPException(404, "Not found")
    c.student(m["student_id"])
    return m


@clinic.get("/media/{media_id}")
def get_media(media_id: uuid.UUID, c: Ctx = Depends(team)):
    m = _media(c, media_id)
    c.audit("media.viewed", "student", m["student_id"])
    return FileResponse(MEDIA_DIR / m["path"], media_type=m["mime"], headers={"Cache-Control": "no-store"})


@clinic.delete("/media/{media_id}")
def remove_media(media_id: uuid.UUID, c: Ctx = Depends(bcba)):
    m = _media(c, media_id)
    c.db.execute("update media set removed_at = now() where id = %s", (media_id,))
    c.audit("media.removed", "student", m["student_id"])
    return {"ok": True}


# ───────────────────────── program templates ─────────────────────────
@clinic.get("/templates")
def templates(c: Ctx = Depends(bcba)):
    return c.all("select t.*, u.name as author from program_templates t left join users u on u.id = t.created_by order by t.name")


@clinic.post("/programs/{program_id}/template", status_code=201)
def save_template(program_id: uuid.UUID, c: Ctx = Depends(bcba)):
    """Save a program's design (never its data or the student) for reuse across the school."""
    p = c.program(program_id)
    targets = [t["label"] for t in c.all("select label from targets where program_id = %s and status <> 'retired' order by position", program_id)]
    row = c.one("insert into program_templates (school_id, name, kind, goal, domain, instruction, mastery, config, targets, created_by)"
                " values (%s, %s, %s, %s, %s, %s, %s::jsonb, %s::jsonb, %s::jsonb, %s) returning id",
                c.school_id, p["name"], p["kind"], p["goal"], p["domain"], p["instruction"], json.dumps(p["mastery"]), json.dumps(p["config"]),
                json.dumps(targets), c.user["id"])
    c.audit("template.saved", "program", program_id)
    return row


@clinic.delete("/templates/{template_id}")
def delete_template(template_id: uuid.UUID, c: Ctx = Depends(bcba)):
    c.db.execute("delete from program_templates where id = %s", (template_id,))
    return {"ok": True}


# ───────────────────────── local-model drafts (prototype) ─────────────────────────
def _ai_on(c: Ctx) -> str:
    on = (c.one("select settings from schools where id = %s", c.school_id)["settings"] or {}).get("ai")
    if not on:
        raise HTTPException(403, "AI drafts are switched off for this school")
    model = ai.text_model()
    if not model:
        raise HTTPException(503, "No local model is running on this machine")
    return model


@clinic.get("/ai/status")
def ai_status(c: Ctx = Depends(team)):
    s = c.one("select settings from schools where id = %s", c.school_id)["settings"] or {}
    return {"ai": bool(s.get("ai")), "model": ai.text_model() if s.get("ai") else None,
            "voice": bool(s.get("voice")) and ai.speech_available()}


class Draft(BaseModel):
    days: int = Field(default=30, ge=7, le=365)


@clinic.post("/students/{student_id}/ai/summary")
def ai_summary(student_id: uuid.UUID, body: Draft, c: Ctx = Depends(bcba)):
    st = c.student(student_id)
    _ai_on(c)
    facts = [{"goal": f["plain_name"], "status": f["plain"], "sessions_this_period": f["sessions"], "value_at_start_of_period": f["first_text"],
              "value_in_latest_session": f["last_text"], "target": f["criterion_text"], "the_number_counts": f["measure"], "better_means": f["better"], "change_this_period": f["trend"],
              "team_notes": [n["body"] for n in f["notes"]][:3]} for f in program_facts(c, student_id, body.days) if f["sessions"]]
    try:
        text, model = ai.generate(ai.SUMMARY_SYSTEM, f"Child's first name: {st['first_name']}\nPeriod: last {body.days} days\nFacts:\n{json.dumps(facts, indent=1)}", 420)
    except RuntimeError as e:
        raise HTTPException(503, str(e))
    c.audit("ai.summary_drafted", "student", student_id, model=model)
    return {"text": text, "model": model}


class Ask(BaseModel):
    question: str = Field(min_length=3, max_length=400)


@clinic.post("/ai/ask")
def ai_ask(body: Ask, c: Ctx = Depends(bcba)):
    _ai_on(c)
    where, args = c.student_filter()
    facts = []
    for st in c.all(f"select st.id, st.first_name from students st where {where} and st.status = 'active' order by st.first_name", *args):
        facts.append({"student": st["first_name"], "programs": [
            {"program": f["name"], "status": f["flag"], "reason": f["why"], "latest": f["last_text"], "target": f["criterion_text"],
             "sessions_last_30_days": f["sessions"], "forecast": f["forecast"]} for f in program_facts(c, st["id"], 30)]})
    try:
        text, model = ai.generate(ai.ASK_SYSTEM, f"Facts:\n{json.dumps(facts)}\n\nQuestion: {body.question}", 350)
    except RuntimeError as e:
        raise HTTPException(503, str(e))
    c.audit("ai.asked", "school", c.school_id, model=model)
    return {"text": text, "model": model}


@clinic.post("/transcribe")
async def transcribe(request: Request, c: Ctx = Depends(team)):
    """Dictation for notes, through a local speech model. The audio is not stored."""
    s = c.one("select settings from schools where id = %s", c.school_id)["settings"] or {}
    if not s.get("voice"):
        raise HTTPException(403, "Voice notes are switched off for this school")
    data = await request.body()
    if not data or len(data) > 8 * 1024 * 1024:
        raise HTTPException(413, "Recording is empty or too long")
    try:
        return {"text": ai.transcribe(data, request.headers.get("content-type", "audio/webm"))}
    except RuntimeError as e:
        raise HTTPException(503, str(e))


# ───────────────────────── school admin: family & teacher accounts, import, switches ─────────────────────────
class OutsideUser(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: str = Field(pattern=EMAIL, max_length=200)
    role: str = Field(pattern="^(parent|teacher)$")
    relation: str = Field(default="", max_length=60)
    student_ids: list[uuid.UUID] = Field(min_length=1, max_length=40)


@school.post("/contacts", status_code=201)
def invite_contact(body: OutsideUser, c: Ctx = Depends(admin)):
    """Invite a parent or teacher: an account with a one-time password, linked only to the named students."""
    students = [c.student(s) for s in body.student_ids]      # 404 unless every student is at one of the admin's sites
    temp = security.temp_password()
    try:
        with c.db.transaction():
            u = c.one("insert into users (school_id, email, name, role, password_hash, must_change_password) values (%s, %s, %s, %s, %s, true) returning id",
                      c.school_id, body.email.strip(), body.name.strip(), body.role, security.hash_password(temp))
    except Exception:
        raise HTTPException(409, "That email address is already in use")
    for site in {s["site_id"] for s in students}:
        c.db.execute("insert into user_sites (user_id, site_id, school_id) values (%s, %s, %s)", (u["id"], site, c.school_id))
    for s in students:
        c.db.execute("insert into student_contacts (school_id, student_id, user_id, kind, relation) values (%s, %s, %s, %s, %s)",
                     (c.school_id, s["id"], u["id"], "guardian" if body.role == "parent" else "teacher", body.relation.strip()))
    c.audit("contact.invited", "user", u["id"], role=body.role, students=len(students))
    return {"id": u["id"], "temp_password": temp}


class ImportRow(BaseModel):
    first_name: str = Field(min_length=1, max_length=60)
    last_name: str = Field(min_length=1, max_length=60)
    birth_date: date | None = None
    site: str = Field(min_length=1, max_length=120)


class ImportIn(BaseModel):
    rows: list[ImportRow] = Field(min_length=1, max_length=500)
    dry_run: bool = True


@school.post("/students/import")
def import_students(body: ImportIn, c: Ctx = Depends(admin)):
    """Bulk enrolment from a CSV the browser has parsed. Always validate first (dry_run), then commit all or nothing."""
    sites = {r["name"].lower(): r["id"] for r in c.all(
        "select s.id, s.name from sites s where s.id in (select site_id from user_sites where user_id = %s)", c.user["id"])}
    existing = {(r["first_name"].lower(), r["last_name"].lower(), r["birth_date"]) for r in c.all("select first_name, last_name, birth_date from students")}
    report, ok = [], []
    for i, r in enumerate(body.rows, start=1):
        key = (r.first_name.strip().lower(), r.last_name.strip().lower(), r.birth_date)
        if r.site.strip().lower() not in sites:
            report.append({"row": i, "status": "error", "message": f"Unknown site “{r.site}”"})
        elif key in existing:
            report.append({"row": i, "status": "skip", "message": "Already enrolled"})
        else:
            existing.add(key); ok.append(r)
            report.append({"row": i, "status": "ok", "message": "Will be enrolled" if body.dry_run else "Enrolled"})
    errors = sum(1 for x in report if x["status"] == "error")
    if not body.dry_run:
        if errors:
            raise HTTPException(422, "Fix the errors first; nothing was imported")
        for r in ok:
            st = c.one("insert into students (school_id, site_id, first_name, last_name, birth_date) values (%s, %s, %s, %s, %s) returning id",
                       c.school_id, sites[r.site.strip().lower()], r.first_name.strip(), r.last_name.strip(), r.birth_date)
            c.db.execute("insert into plans (school_id, student_id, name) values (%s, %s, %s)", (c.school_id, st["id"], f"{date.today().year} Treatment Plan"))
        c.audit("students.imported", "school", c.school_id, count=len(ok))
    return {"rows": report, "ok": len(ok), "errors": errors, "skipped": sum(1 for x in report if x["status"] == "skip"), "committed": not body.dry_run}


class Features(BaseModel):
    ai: bool = False
    voice: bool = False


@school.get("/features")
def features(c: Ctx = Depends(admin)):
    s = c.one("select settings from schools where id = %s", c.school_id)["settings"] or {}
    return {"ai": bool(s.get("ai")), "voice": bool(s.get("voice")), "model": ai.text_model(), "speech": ai.speech_available()}


@school.put("/features")
def set_features(body: Features, c: Ctx = Depends(admin)):
    c.db.execute("update schools set settings = settings || %s::jsonb where id = %s", (body.model_dump_json(), c.school_id))
    c.audit("school.features", "school", c.school_id, **body.model_dump())
    return {"ok": True}
