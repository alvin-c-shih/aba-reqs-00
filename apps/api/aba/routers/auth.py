"""Sign-in, token rotation, password change, demo personas, tour progress."""
from __future__ import annotations

import json
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, Field

from .. import ai, security
from ..config import settings
from ..db import tx
from ..deps import Ctx, audit, client_ip, ctx

router = APIRouter(prefix="/api/v1", tags=["auth"])

ROLE_LABEL = {"system_admin": "System admin", "school_admin": "School admin", "bcba": "BCBA", "rbt": "RBT",
              "parent": "Parent", "teacher": "Teacher"}


class Login(BaseModel):
    email: str = Field(max_length=200)
    password: str = Field(max_length=200)
    code: str = Field(default="", max_length=20)      # 6-digit authenticator code, or a recovery code


class DemoLogin(BaseModel):
    user_id: uuid.UUID


class PasswordChange(BaseModel):
    current: str = Field(max_length=200)
    new: str = Field(max_length=200)


def _issue(db, user: dict, resp: Response, family: uuid.UUID | None = None) -> None:
    raw, hashed = security.new_refresh()
    now = datetime.now(timezone.utc)
    db.execute(
        "insert into refresh_tokens (user_id, family, token_hash, expires_at) values (%s, %s, %s, %s)",
        (user["id"], family or uuid.uuid4(), hashed, now + timedelta(minutes=settings.refresh_idle_minutes)))
    security.set_cookies(resp, security.make_access(user), raw)


def _public(user: dict, db) -> dict:
    # switch from the pre-login 'auth' context to the user's own tenant context
    db.execute("select set_config('app.role', %s, true), set_config('app.school_id', %s, true),"
               " set_config('app.user_id', %s, true)", (user["role"], str(user["school_id"] or ""), str(user["id"])))
    school = None
    if user["school_id"]:
        school = db.execute("select id, name from schools where id = %s", (user["school_id"],)).fetchone()
    sites = db.execute(
        "select s.id, s.name from user_sites us join sites s on s.id = us.site_id where us.user_id = %s order by s.name",
        (user["id"],)).fetchall()
    return {"id": user["id"], "name": user["name"], "email": user["email"], "role": user["role"],
            "role_label": ROLE_LABEL[user["role"]], "school": school, "sites": sites,
            "must_change_password": user["must_change_password"], "tours_done": user["tours_done"],
            "two_factor": bool(user.get("totp_enabled_at")),
            "features": _features(db, user["school_id"])}



def _features(db, school_id) -> dict:
    """Optional features as this person can use them now: the school's switch AND a model ready on this machine."""
    if not school_id:
        return {}
    s = (db.execute("select settings from schools where id = %s", (school_id,)).fetchone() or {}).get("settings") or {}
    return {**s, "voice": bool(s.get("voice")) and ai.speech_available()}

@router.get("/meta")
def meta():
    """Public: which environment this is, and (demo only) who you can sign in as."""
    out = {"env": settings.env, "resettable": settings.resettable, "personas": [], "version": "2.0.0"}
    if settings.env == "demo":
        with tx("system_admin") as db:
            out["personas"] = db.execute(
                "select u.id, u.name, u.role, s.name as school from users u left join schools s on s.id = u.school_id"
                " where u.status = 'active' order by array_position(array['system_admin','school_admin','bcba','rbt','teacher','parent'], u.role),"
                " s.name, u.name").fetchall()
        for p in out["personas"]:
            p["role_label"] = ROLE_LABEL[p["role"]]
    return out


@router.post("/auth/login")
def login(body: Login, request: Request, resp: Response):
    security.require_csrf(request)
    ip = client_ip(request)
    security.login_throttle.check(ip)
    generic = HTTPException(401, "Email or password is incorrect")
    with tx("auth") as db:
        user = db.execute("select * from users where lower(email) = lower(%s)", (body.email.strip(),)).fetchone()
        if not user:
            security.verify_password(security.hash_password("x"), body.password)  # equalise timing
            audit(db, "login.failed", "user", "", ip=ip, reason="unknown email")
            db.commit()
            raise generic
        now = datetime.now(timezone.utc)
        if user["locked_until"] and user["locked_until"] > now:
            audit(db, "login.blocked", "user", user["id"], actor=user, ip=ip)
            db.commit()
            raise HTTPException(423, "Account is locked after too many attempts. Try again in 15 minutes or ask an admin.")
        if user["status"] != "active" or not security.verify_password(user["password_hash"], body.password):
            fails = user["failed_attempts"] + 1
            lock = now + timedelta(minutes=settings.lockout_minutes) if fails >= settings.max_failed_logins else None
            db.execute("update users set failed_attempts = %s, locked_until = %s where id = %s",
                       (0 if lock else fails, lock, user["id"]))
            audit(db, "login.locked" if lock else "login.failed", "user", user["id"], actor=user, ip=ip)
            db.commit()
            raise generic
        if user["totp_enabled_at"]:
            if not body.code:
                raise HTTPException(401, detail={"code": "totp_required", "message": "Enter the 6-digit code from your authenticator app"})
            if not _second_factor_ok(db, user, body.code):     # counts toward lockout like a wrong password
                fails = user["failed_attempts"] + 1
                lock = now + timedelta(minutes=settings.lockout_minutes) if fails >= settings.max_failed_logins else None
                db.execute("update users set failed_attempts = %s, locked_until = %s where id = %s", (0 if lock else fails, lock, user["id"]))
                audit(db, "login.2fa_failed", "user", user["id"], actor=user, ip=ip)
                db.commit()
                raise HTTPException(401, detail={"code": "totp_required", "message": "That code is not valid"})
        db.execute("update users set failed_attempts = 0, locked_until = null, last_login_at = now() where id = %s", (user["id"],))
        audit(db, "login", "user", user["id"], actor=user, ip=ip)
        _issue(db, user, resp)
        return _public(user, db)


def _second_factor_ok(db, user: dict, code: str) -> bool:
    code = code.strip().replace(" ", "")
    if security.totp_verify(user["totp_secret"], code):
        return True
    hashed = security.token_hash(code.lower())
    if hashed in (user["recovery_codes"] or []):               # recovery codes work once
        db.execute("update users set recovery_codes = recovery_codes - %s where id = %s", (hashed, user["id"]))
        return True
    return False


class Code(BaseModel):
    code: str = Field(min_length=6, max_length=20)


@router.post("/auth/2fa/setup")
def two_factor_setup(c: Ctx = Depends(ctx)):
    """Start enrolment: a new secret, not active until a code from it is confirmed."""
    secret = security.totp_new_secret()
    c.db.execute("update users set totp_secret = %s, totp_enabled_at = null where id = %s", (secret, c.user["id"]))
    return {"secret": secret, "uri": f"otpauth://totp/ABA:{c.user['email']}?secret={secret}&issuer=ABA&digits=6&period=30"}


@router.post("/auth/2fa/enable")
def two_factor_enable(body: Code, c: Ctx = Depends(ctx)):
    row = c.one("select totp_secret from users where id = %s", c.user["id"])
    if not row["totp_secret"] or not security.totp_verify(row["totp_secret"], body.code):
        raise HTTPException(422, "That code is not valid. Check the time on your phone and try again.")
    codes = [security.temp_password() for _ in range(8)]
    c.db.execute("update users set totp_enabled_at = now(), recovery_codes = %s::jsonb where id = %s",
                 (json.dumps([security.token_hash(x) for x in codes]), c.user["id"]))
    c.audit("2fa.enabled", "user", c.user["id"])
    return {"recovery_codes": codes}     # shown once


@router.post("/auth/2fa/disable")
def two_factor_disable(body: Code, c: Ctx = Depends(ctx)):
    row = c.one("select * from users where id = %s", c.user["id"])
    if not row["totp_enabled_at"] or not _second_factor_ok(c.db, row, body.code):
        raise HTTPException(422, "That code is not valid")
    c.db.execute("update users set totp_secret = null, totp_enabled_at = null, recovery_codes = '[]' where id = %s", (c.user["id"],))
    c.audit("2fa.disabled", "user", c.user["id"])
    return {"ok": True}


@router.get("/me/notifications")
def notifications(c: Ctx = Depends(ctx)):
    rows = c.all("select id, kind, text, link, created_at, read_at from notifications where user_id = %s"
                 " order by created_at desc limit 30", c.user["id"])
    return {"items": rows, "unread": sum(1 for r in rows if not r["read_at"])}


@router.post("/me/notifications/read")
def notifications_read(c: Ctx = Depends(ctx)):
    c.db.execute("update notifications set read_at = now() where user_id = %s and read_at is null", (c.user["id"],))
    return {"ok": True}


@router.post("/auth/demo-login")
def demo_login(body: DemoLogin, request: Request, resp: Response):
    """One-click persona sign-in. The server refuses this anywhere but the demo environment."""
    security.require_csrf(request)
    if settings.env != "demo":
        raise HTTPException(404, "Not found")
    with tx("auth") as db:
        user = db.execute("select * from users where id = %s and status = 'active'", (body.user_id,)).fetchone()
        if not user:
            raise HTTPException(404, "Persona not found")
        db.execute("update users set last_login_at = now() where id = %s", (user["id"],))
        audit(db, "login.demo", "user", user["id"], actor=user, ip=client_ip(request))
        _issue(db, user, resp)
        return _public(user, db)


@router.post("/auth/refresh")
def refresh(request: Request, resp: Response):
    security.require_csrf(request)
    raw = request.cookies.get(security.REFRESH_COOKIE, "")
    with tx("auth") as db:
        tok = db.execute("select * from refresh_tokens where token_hash = %s", (security.token_hash(raw),)).fetchone()
        now = datetime.now(timezone.utc)
        if not tok:
            raise HTTPException(401, "Not signed in")
        if tok["revoked_at"]:
            # A rotated token was presented again: assume theft, kill the whole chain.
            db.execute("update refresh_tokens set revoked_at = now() where family = %s and revoked_at is null", (tok["family"],))
            audit(db, "token.reuse_detected", "user", tok["user_id"], ip=client_ip(request))
            db.commit()
            raise HTTPException(401, "Session ended")
        first = db.execute("select min(created_at) as t from refresh_tokens where family = %s", (tok["family"],)).fetchone()["t"]
        if tok["expires_at"] < now or now - first > timedelta(hours=settings.refresh_absolute_hours):
            raise HTTPException(401, "Session expired")
        user = db.execute("select * from users where id = %s and status = 'active'", (tok["user_id"],)).fetchone()
        if not user:
            raise HTTPException(401, "Session ended")
        db.execute("update refresh_tokens set revoked_at = now() where id = %s", (tok["id"],))
        _issue(db, user, resp, family=tok["family"])
        return {"ok": True}


@router.post("/auth/logout")
def logout(request: Request, resp: Response):
    security.require_csrf(request)
    raw = request.cookies.get(security.REFRESH_COOKIE, "")
    if raw:
        with tx("auth") as db:
            tok = db.execute("select family, user_id from refresh_tokens where token_hash = %s", (security.token_hash(raw),)).fetchone()
            if tok:
                db.execute("update refresh_tokens set revoked_at = now() where family = %s and revoked_at is null", (tok["family"],))
                audit(db, "logout", "user", tok["user_id"], ip=client_ip(request))
    security.clear_cookies(resp)
    return {"ok": True}


@router.get("/auth/me")
def me(c: Ctx = Depends(ctx)):
    return _public(c.user, c.db)


@router.post("/auth/password")
def change_password(body: PasswordChange, c: Ctx = Depends(ctx)):
    row = c.one("select password_hash from users where id = %s", c.user["id"])
    if not security.verify_password(row["password_hash"], body.current):
        raise HTTPException(403, "Current password is incorrect")
    security.check_password_policy(body.new, c.user["email"])
    c.db.execute("update users set password_hash = %s, must_change_password = false where id = %s",
                 (security.hash_password(body.new), c.user["id"]))
    c.db.execute("update refresh_tokens set revoked_at = now() where user_id = %s and revoked_at is null", (c.user["id"],))
    c.audit("password.changed", "user", c.user["id"])
    return {"ok": True}


@router.put("/me/tours/{tour_id}")
def tour_done(tour_id: str, c: Ctx = Depends(ctx)):
    if not tour_id.replace("-", "").isalnum() or len(tour_id) > 40:
        raise HTTPException(422, "Bad tour id")
    c.db.execute("update users set tours_done = tours_done || %s::jsonb where id = %s",
                 (json.dumps({tour_id: datetime.now(timezone.utc).isoformat()}), c.user["id"]))
    return {"ok": True}


@router.delete("/me/tours")
def tours_reset(c: Ctx = Depends(ctx)):
    c.db.execute("update users set tours_done = '{}' where id = %s", (c.user["id"],))
    return {"ok": True}
