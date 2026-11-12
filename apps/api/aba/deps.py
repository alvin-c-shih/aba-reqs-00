"""Request context: who is calling, a tenant-scoped transaction, and the access rules
every router shares. All authorization decisions live here so they can be read in one place."""
from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Iterator

import psycopg
from fastapi import Depends, HTTPException, Request

from . import security
from .db import tx


@dataclass
class Ctx:
    db: psycopg.Connection
    user: dict
    ip: str

    @property
    def role(self) -> str:
        return self.user["role"]

    @property
    def school_id(self):
        return self.user["school_id"]

    def one(self, sql: str, *args):
        return self.db.execute(sql, args).fetchone()

    def all(self, sql: str, *args) -> list[dict]:
        return self.db.execute(sql, args).fetchall()

    def audit(self, action: str, entity: str = "", entity_id="", **detail) -> None:
        audit(self.db, action, entity, entity_id, actor=self.user, ip=self.ip, **detail)

    # ── student-level scope ───────────────────────────────────────────────
    def student_filter(self) -> tuple[str, tuple]:
        """SQL predicate on alias `st` (students) for the rows this user may see."""
        uid = self.user["id"]
        if self.role == "school_admin":
            return "st.site_id in (select site_id from user_sites where user_id = %s)", (uid,)
        if self.role == "bcba":
            return "st.bcba_id = %s", (uid,)
        if self.role == "rbt":
            return ("st.id in (select student_id from staff_assignments where user_id = %s and ended_at is null)"
                    " and st.status = 'active'"), (uid,)
        if self.role in ("parent", "teacher"):     # family and classroom staff: only students they are linked to
            return ("st.id in (select student_id from student_contacts where user_id = %s and ended_at is null)"
                    " and st.status = 'active'"), (uid,)
        return "false", ()

    def notify(self, user_ids, kind: str, text: str, link: str = "") -> None:
        """In-app notification. Never to yourself; text carries first names only."""
        for uid in {u for u in user_ids if u and u != self.user["id"]}:
            self.db.execute("insert into notifications (school_id, user_id, kind, text, link) values (%s, %s, %s, %s, %s)",
                            (self.school_id, uid, kind, text, link))

    def student(self, student_id) -> dict:
        where, args = self.student_filter()
        row = self.one(f"select st.* from students st where st.id = %s and {where}", student_id, *args)
        if not row:
            raise HTTPException(404, "Student not found")  # 404, not 403: don't confirm existence
        return row

    def program(self, program_id) -> dict:
        where, args = self.student_filter()
        row = self.one(
            f"select p.* from programs p join students st on st.id = p.student_id where p.id = %s and {where}",
            program_id, *args)
        if not row:
            raise HTTPException(404, "Program not found")
        return row


def audit(db, action: str, entity: str = "", entity_id="", actor: dict | None = None, ip: str = "",
          school_id=None, **detail) -> None:
    db.execute(
        "insert into audit_log (school_id, actor_id, actor_role, action, entity, entity_id, detail, ip)"
        " values (%s, %s, %s, %s, %s, %s, %s, %s)",
        (school_id or (actor or {}).get("school_id"), (actor or {}).get("id"), (actor or {}).get("role", ""),
         action, entity, str(entity_id or ""), json.dumps(detail, default=str), ip))


def client_ip(request: Request) -> str:
    return request.client.host if request.client else ""


def ctx(request: Request) -> Iterator[Ctx]:
    security.require_csrf(request)
    claims = security.read_access(request.cookies.get(security.ACCESS_COOKIE, ""))
    if not claims:
        raise HTTPException(401, "Not signed in")
    with tx(claims["role"], claims["sid"] or None, claims["sub"]) as db:
        # Never trust the token for anything but identity: role and status are re-read every request.
        user = db.execute(
            "select id, school_id, email, name, role, status, must_change_password, tours_done, totp_enabled_at"
            " from users where id = %s", (claims["sub"],)).fetchone()
        if not user or user["status"] != "active" or user["role"] != claims["role"]:
            raise HTTPException(401, "Session is no longer valid")
        yield Ctx(db, user, client_ip(request))


def require(*roles: str):
    def dep(c: Ctx = Depends(ctx)) -> Ctx:
        if c.role not in roles:
            raise HTTPException(403, "Your role does not allow this")
        if c.user["must_change_password"]:
            raise HTTPException(403, "Change your temporary password first")
        return c
    return dep
