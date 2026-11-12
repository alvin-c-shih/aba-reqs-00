"""System admin: schools (tenants), platform health, demo reset, cross-school audit.
System admins operate the platform; row-level security gives them no access to student data."""
from __future__ import annotations

import time
import uuid

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, EmailStr, Field

from .. import security
from ..config import settings
from ..db import reset_demo, tx
from ..deps import Ctx, ctx, require

router = APIRouter(prefix="/api/v1/platform", tags=["platform"])
sysadmin = require("system_admin")


class NewSchool(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    slug: str = Field(pattern=r"^[a-z0-9-]{2,40}$")
    site_name: str = Field(min_length=2, max_length=120)
    admin_name: str = Field(min_length=2, max_length=120)
    admin_email: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$", max_length=200)


class SchoolPatch(BaseModel):
    status: str = Field(pattern="^(active|suspended)$")


@router.get("/schools")
def schools(c: Ctx = Depends(sysadmin)):
    return c.all(
        "select s.id, s.name, s.slug, s.status, s.created_at,"
        " (select count(*) from sites x where x.school_id = s.id) as sites,"
        " (select count(*) from users u where u.school_id = s.id and u.status = 'active') as users,"
        " (select json_agg(json_build_object('name', u.name, 'email', u.email) order by u.name)"
        "    from users u where u.school_id = s.id and u.role = 'school_admin' and u.status = 'active') as admins,"
        " (select json_agg(x.name order by x.name) from sites x where x.school_id = s.id) as site_names"
        " from schools s order by s.name")


@router.post("/schools", status_code=201)
def create_school(body: NewSchool, c: Ctx = Depends(sysadmin)):
    if c.one("select 1 from schools where slug = %s", body.slug):
        raise HTTPException(409, "That short name is already used")
    if c.one("select 1 from users where lower(email) = lower(%s)", body.admin_email):
        raise HTTPException(409, "A user with that email already exists")
    school = c.one("insert into schools (name, slug) values (%s, %s) returning id, name", body.name, body.slug)
    site = c.one("insert into sites (school_id, name) values (%s, %s) returning id", school["id"], body.site_name)
    temp = security.temp_password()
    admin = c.one(
        "insert into users (school_id, email, name, role, password_hash, must_change_password)"
        " values (%s, %s, %s, 'school_admin', %s, true) returning id",
        school["id"], body.admin_email, body.admin_name, security.hash_password(temp))
    c.db.execute("insert into user_sites (user_id, site_id, school_id) values (%s, %s, %s)", (admin["id"], site["id"], school["id"]))
    c.audit("school.created", "school", school["id"], name=body.name, first_admin=body.admin_email)
    return {"id": school["id"], "temp_password": temp}  # shown once; the admin must change it at first sign-in


@router.patch("/schools/{school_id}")
def patch_school(school_id: uuid.UUID, body: SchoolPatch, c: Ctx = Depends(sysadmin)):
    row = c.one("update schools set status = %s where id = %s returning id", body.status, school_id)
    if not row:
        raise HTTPException(404, "School not found")
    c.audit("school." + body.status, "school", school_id)
    return {"ok": True}


@router.get("/health")
def health(c: Ctx = Depends(sysadmin)):
    """Evidence that the system really writes: live row counts, rows changed in the last
    5 minutes, and a canary that writes a row and reads it back on a second connection."""
    counts = c.all("select * from platform_row_counts()")
    info = c.one("select current_database() as db, current_user as db_user, version() as version, now() as now")
    migs = c.all("select name, applied_at from schema_migrations order by name") if _can_read_migrations(c) else []
    return {"env": settings.env, "db": info["db"], "db_user": info["db_user"],
            "pg_version": info["version"].split(" on ")[0], "server_time": info["now"],
            "tables": counts, "migrations": migs, "canary": _canary(),
            "resettable": settings.resettable,
            "security": {
                "session": f"{settings.access_minutes}-min access token + rotating refresh (idle {settings.refresh_idle_minutes} min, max {settings.refresh_absolute_hours} h)",
                "cookies": "httpOnly, SameSite=Strict" + (", Secure" if settings.cookie_secure else " (Secure off: local http)"),
                "lockout": f"{settings.max_failed_logins} failed sign-ins → {settings.lockout_minutes} min lock",
                "tenancy": "Postgres row-level security on every school-owned table",
                "append_only": "observations and audit_log: API role has no UPDATE/DELETE privilege",
                "passwords": "Argon2id, 12+ characters",
            }}


def _can_read_migrations(c: Ctx) -> bool:
    return bool(c.one("select has_table_privilege(current_user, 'schema_migrations', 'select') as ok")["ok"])


def _canary() -> dict:
    marker = f"canary-{uuid.uuid4()}"
    t0 = time.perf_counter()
    try:
        with tx("system_admin") as a:
            a.execute("insert into audit_log (actor_role, action, entity_id) values ('system', 'canary', %s)", (marker,))
        with tx("system_admin") as b:
            ok = b.execute("select 1 from audit_log where action = 'canary' and entity_id = %s", (marker,)).fetchone() is not None
        return {"ok": ok, "ms": round((time.perf_counter() - t0) * 1000, 1)}
    except Exception as e:  # surfaced on the dashboard, never swallowed
        return {"ok": False, "error": type(e).__name__}


@router.get("/audit")
def audit_log(limit: int = 200, c: Ctx = Depends(sysadmin)):
    return c.all(
        "select a.id, a.at, a.action, a.entity, a.entity_id, a.actor_role, a.ip, a.detail,"
        " u.name as actor, s.name as school from audit_log a"
        " left join users u on u.id = a.actor_id left join schools s on s.id = a.school_id"
        " where a.action <> 'canary' order by a.id desc limit %s", min(limit, 500))


demo = APIRouter(prefix="/api/v1/demo", tags=["demo"])


@demo.post("/reset")
def reset(resp: Response, c: Ctx = Depends(ctx)):
    """Restore the demo dataset. Demo: anyone signed in. Dev/QA: system admin. Prod: does not exist."""
    if not settings.resettable:
        raise HTTPException(404, "Not found")
    if settings.env != "demo" and c.role != "system_admin":
        raise HTTPException(403, "Only a system admin can reset this environment")
    user = dict(c.user)
    c.db.rollback()          # release our transaction before the owner connection truncates
    reset_demo()
    with tx("auth") as db:
        still = db.execute("select * from users where id = %s", (user["id"],)).fetchone()
        if still:            # seeded ids are stable, so the caller stays signed in
            from .auth import _issue
            _issue(db, still, resp)
        db.execute("insert into audit_log (actor_id, actor_role, action, entity) values (%s, %s, 'demo.reset.requested', 'database')",
                   (user["id"], user["role"]))
    return {"ok": True, "signed_in": bool(still)}
