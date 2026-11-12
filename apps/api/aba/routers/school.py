"""School admin: sites, staff accounts, student roster. Scoped to the sites the admin administers.
School admins manage people and enrolment — they do not see session data or graphs."""
from __future__ import annotations

import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from .. import security
from ..deps import Ctx, require

router = APIRouter(prefix="/api/v1/school", tags=["school"])
admin = require("school_admin")
EMAIL = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"


class SiteIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)


class UserIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: str = Field(pattern=EMAIL, max_length=200)
    role: str = Field(pattern="^(school_admin|bcba|rbt)$")
    site_ids: list[uuid.UUID] = Field(min_length=1)


class UserPatch(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    status: str | None = Field(default=None, pattern="^(active|deactivated)$")
    site_ids: list[uuid.UUID] | None = None


class StudentIn(BaseModel):
    first_name: str = Field(min_length=1, max_length=60)
    last_name: str = Field(min_length=1, max_length=60)
    birth_date: date | None = None
    site_id: uuid.UUID
    bcba_id: uuid.UUID | None = None


class StudentPatch(BaseModel):
    site_id: uuid.UUID | None = None
    bcba_id: uuid.UUID | None = None
    status: str | None = Field(default=None, pattern="^(active|discharged)$")


def _my_sites(c: Ctx) -> set:
    return {r["site_id"] for r in c.all("select site_id from user_sites where user_id = %s", c.user["id"])}


def _check_sites(c: Ctx, site_ids) -> None:
    if not set(site_ids) <= _my_sites(c):
        raise HTTPException(403, "You do not administer one of those sites")


@router.get("/overview")
def overview(c: Ctx = Depends(admin)):
    sites = c.all(
        "select s.id, s.name, s.status,"
        " (select count(*) from students st where st.site_id = s.id and st.status = 'active') as students,"
        " (select count(*) from user_sites us join users u on u.id = us.user_id where us.site_id = s.id and u.status = 'active' and u.role <> 'school_admin') as staff"
        " from sites s where s.id in (select site_id from user_sites where user_id = %s) order by s.name", c.user["id"])
    unassigned = c.one(
        "select count(*) as n from students st where st.status = 'active' and st.site_id = any(%s)"
        " and (st.bcba_id is null or not exists (select 1 from staff_assignments a where a.student_id = st.id and a.ended_at is null))",
        list(_my_sites(c)))["n"]
    return {"sites": sites, "needs_team": unassigned}


@router.post("/sites", status_code=201)
def create_site(body: SiteIn, c: Ctx = Depends(admin)):
    if c.one("select 1 from sites where school_id = %s and lower(name) = lower(%s)", c.school_id, body.name):
        raise HTTPException(409, "A site with that name already exists")
    site = c.one("insert into sites (school_id, name) values (%s, %s) returning id", c.school_id, body.name)
    c.db.execute("insert into user_sites (user_id, site_id, school_id) values (%s, %s, %s)", (c.user["id"], site["id"], c.school_id))
    c.audit("site.created", "site", site["id"], name=body.name)
    return site


@router.get("/users")
def users(c: Ctx = Depends(admin)):
    return c.all(
        "select u.id, u.name, u.email, u.role, u.status, u.last_login_at, u.must_change_password,"
        " (u.locked_until is not null and u.locked_until > now()) as locked,"
        " coalesce((select json_agg(json_build_object('id', s.id, 'name', s.name) order by s.name)"
        "   from user_sites us join sites s on s.id = us.site_id where us.user_id = u.id), '[]') as sites"
        " from users u where exists (select 1 from user_sites us where us.user_id = u.id and us.site_id = any(%s))"
        " order by array_position(array['school_admin','bcba','rbt'], u.role), u.name", list(_my_sites(c)))


@router.post("/users", status_code=201)
def create_user(body: UserIn, c: Ctx = Depends(admin)):
    _check_sites(c, body.site_ids)
    # email uniqueness is global; check outside our tenant view via the unique index
    temp = security.temp_password()
    try:
        with c.db.transaction():
            u = c.one(
                "insert into users (school_id, email, name, role, password_hash, must_change_password)"
                " values (%s, %s, %s, %s, %s, true) returning id",
                c.school_id, body.email.strip(), body.name.strip(), body.role, security.hash_password(temp))
    except Exception:
        raise HTTPException(409, "That email address is already in use")
    for sid in body.site_ids:
        c.db.execute("insert into user_sites (user_id, site_id, school_id) values (%s, %s, %s)", (u["id"], sid, c.school_id))
    c.audit("user.created", "user", u["id"], role=body.role, email=body.email)
    return {"id": u["id"], "temp_password": temp}


def _managed_user(c: Ctx, user_id) -> dict:
    u = c.one("select u.* from users u where u.id = %s and exists"
              " (select 1 from user_sites us where us.user_id = u.id and us.site_id = any(%s))", user_id, list(_my_sites(c)))
    if not u:
        raise HTTPException(404, "User not found")
    return u


@router.patch("/users/{user_id}")
def patch_user(user_id: uuid.UUID, body: UserPatch, c: Ctx = Depends(admin)):
    u = _managed_user(c, user_id)
    if body.status == "deactivated" and u["id"] == c.user["id"]:
        raise HTTPException(422, "You cannot deactivate your own account")
    if body.name:
        c.db.execute("update users set name = %s where id = %s", (body.name.strip(), user_id))
    if body.status:
        c.db.execute("update users set status = %s where id = %s", (body.status, user_id))
        if body.status == "deactivated":   # cut access immediately
            c.db.execute("update refresh_tokens set revoked_at = now() where user_id = %s and revoked_at is null", (user_id,))
    if body.site_ids is not None:
        _check_sites(c, body.site_ids)
        if not body.site_ids:
            raise HTTPException(422, "Keep at least one site")
        c.db.execute("delete from user_sites where user_id = %s and site_id = any(%s)", (user_id, list(_my_sites(c))))
        for sid in body.site_ids:
            c.db.execute("insert into user_sites (user_id, site_id, school_id) values (%s, %s, %s)", (user_id, sid, c.school_id))
    c.audit("user.updated", "user", user_id, **body.model_dump(exclude_none=True, mode="json"))
    return {"ok": True}


@router.post("/users/{user_id}/reset-password")
def reset_password(user_id: uuid.UUID, c: Ctx = Depends(admin)):
    _managed_user(c, user_id)
    temp = security.temp_password()
    c.db.execute("update users set password_hash = %s, must_change_password = true, failed_attempts = 0, locked_until = null where id = %s",
                 (security.hash_password(temp), user_id))
    c.db.execute("update refresh_tokens set revoked_at = now() where user_id = %s and revoked_at is null", (user_id,))
    c.audit("user.password_reset", "user", user_id)
    return {"temp_password": temp}


@router.get("/students")
def students(c: Ctx = Depends(admin)):
    where, args = c.student_filter()
    return c.all(
        "select st.id, st.first_name, st.last_name, st.birth_date, st.status, st.site_id, st.bcba_id,"
        " s.name as site, b.name as bcba,"
        " coalesce((select json_agg(u.name order by u.name) from staff_assignments a join users u on u.id = a.user_id"
        "   where a.student_id = st.id and a.ended_at is null), '[]') as rbts"
        f" from students st join sites s on s.id = st.site_id left join users b on b.id = st.bcba_id where {where}"
        " order by st.status, st.last_name, st.first_name", *args)


def _check_bcba(c: Ctx, bcba_id) -> None:
    if bcba_id and not c.one("select 1 from users where id = %s and role = 'bcba' and status = 'active'", bcba_id):
        raise HTTPException(422, "Supervisor must be an active BCBA at this school")


@router.post("/students", status_code=201)
def create_student(body: StudentIn, c: Ctx = Depends(admin)):
    _check_sites(c, [body.site_id])
    _check_bcba(c, body.bcba_id)
    st = c.one(
        "insert into students (school_id, site_id, first_name, last_name, birth_date, bcba_id)"
        " values (%s, %s, %s, %s, %s, %s) returning id",
        c.school_id, body.site_id, body.first_name.strip(), body.last_name.strip(), body.birth_date, body.bcba_id)
    c.db.execute("insert into plans (school_id, student_id, name) values (%s, %s, %s)",
                 (c.school_id, st["id"], f"{date.today().year} Treatment Plan"))
    c.audit("student.enrolled", "student", st["id"])
    return st


@router.patch("/students/{student_id}")
def patch_student(student_id: uuid.UUID, body: StudentPatch, c: Ctx = Depends(admin)):
    c.student(student_id)
    data = body.model_dump(exclude_unset=True)
    if "site_id" in data and data["site_id"]:
        _check_sites(c, [data["site_id"]])
        c.db.execute("update students set site_id = %s where id = %s", (data["site_id"], student_id))
    if "bcba_id" in data:
        _check_bcba(c, data["bcba_id"])
        c.db.execute("update students set bcba_id = %s where id = %s", (data["bcba_id"], student_id))
    if data.get("status"):
        c.db.execute("update students set status = %s where id = %s", (data["status"], student_id))  # discharge ≠ delete
    c.audit("student.updated", "student", student_id, **body.model_dump(exclude_unset=True, mode="json"))
    return {"ok": True}


@router.get("/audit")
def audit_log(limit: int = 200, c: Ctx = Depends(admin)):
    return c.all(
        "select a.id, a.at, a.action, a.entity, a.entity_id, a.actor_role, a.ip, a.detail, u.name as actor"
        " from audit_log a left join users u on u.id = a.actor_id where a.school_id = %s"
        " order by a.id desc limit %s", c.school_id, min(limit, 500))
