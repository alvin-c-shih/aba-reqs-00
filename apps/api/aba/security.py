"""Passwords, tokens, cookies, CSRF and login throttling."""
from __future__ import annotations

import base64
import hashlib
import hmac
import secrets
import struct
import time
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from fastapi import HTTPException, Request, Response

from .config import settings

_ph = PasswordHasher()
ACCESS_COOKIE, REFRESH_COOKIE = "aba_at", "aba_rt"
CSRF_HEADER = "x-aba-csrf"
COMMON = {"password1234", "123456789012", "qwertyuiopas", "letmein12345", "passwordpassword"}


def hash_password(pw: str) -> str:
    return _ph.hash(pw)


def verify_password(hash_: str, pw: str) -> bool:
    try:
        return _ph.verify(hash_, pw)
    except (VerifyMismatchError, Exception):
        return False


def check_password_policy(pw: str, email: str = "") -> None:
    problems = []
    if len(pw) < 12:
        problems.append("at least 12 characters")
    if pw.lower() in COMMON or len(set(pw)) < 5:
        problems.append("not a common or repetitive password")
    if email and email.split("@")[0].lower() in pw.lower():
        problems.append("must not contain your email name")
    if problems:
        raise HTTPException(422, "Password needs: " + "; ".join(problems))


def temp_password() -> str:
    return "-".join(secrets.token_hex(2) for _ in range(4))  # e.g. 3fa1-9c0d-77be-12aa


# ── two-factor sign-in: RFC 6238 time-based codes, standard library only ──
def totp_new_secret() -> str:
    return base64.b32encode(secrets.token_bytes(20)).decode().rstrip("=")


def _totp_at(secret: str, counter: int) -> str:
    key = base64.b32decode(secret + "=" * (-len(secret) % 8), casefold=True)
    digest = hmac.new(key, struct.pack(">Q", counter), "sha1").digest()
    o = digest[-1] & 0x0F
    return f"{(struct.unpack('>I', digest[o:o + 4])[0] & 0x7FFFFFFF) % 1_000_000:06d}"


def totp_now(secret: str, at: float | None = None) -> str:
    return _totp_at(secret, int((at or time.time()) // 30))


def totp_verify(secret: str | None, code: str, at: float | None = None) -> bool:
    """Accept the current 30-second step and one either side (clock drift)."""
    if not secret or not code.isdigit() or len(code) != 6:
        return False
    step = int((at or time.time()) // 30)
    return any(hmac.compare_digest(_totp_at(secret, step + d), code) for d in (-1, 0, 1))


def make_access(user: dict) -> str:
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {"sub": str(user["id"]), "role": user["role"], "sid": str(user["school_id"] or ""),
         "iat": now, "exp": now + timedelta(minutes=settings.access_minutes)},
        settings.jwt_secret, algorithm="HS256")


def read_access(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except jwt.PyJWTError:
        return None


def new_refresh() -> tuple[str, str]:
    raw = secrets.token_urlsafe(32)
    return raw, token_hash(raw)


def token_hash(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


def set_cookies(resp: Response, access: str, refresh: str | None) -> None:
    common = dict(httponly=True, samesite="strict", secure=settings.cookie_secure)
    resp.set_cookie(ACCESS_COOKIE, access, max_age=settings.access_minutes * 60, path="/", **common)
    if refresh is not None:
        resp.set_cookie(REFRESH_COOKIE, refresh, max_age=settings.refresh_absolute_hours * 3600,
                        path="/api/v1/auth", **common)


def clear_cookies(resp: Response) -> None:
    resp.delete_cookie(ACCESS_COOKIE, path="/")
    resp.delete_cookie(REFRESH_COOKIE, path="/api/v1/auth")


def require_csrf(request: Request) -> None:
    """Cookies are SameSite=Strict; state-changing calls must also carry a custom header,
    which a cross-site form cannot send and a cross-site fetch cannot send without CORS (we allow none)."""
    if request.method not in ("GET", "HEAD", "OPTIONS") and request.headers.get(CSRF_HEADER) != "1":
        raise HTTPException(403, "Missing CSRF header")


class Throttle:
    """Tiny in-process sliding-window limiter (single-process deployment; see ADR-0007)."""

    def __init__(self, limit: int, window_s: int) -> None:
        self.limit, self.window = limit, window_s
        self.hits: dict[str, deque[float]] = defaultdict(deque)

    def check(self, key: str) -> None:
        now = time.monotonic()
        q = self.hits[key]
        while q and now - q[0] > self.window:
            q.popleft()
        if len(q) >= self.limit:
            raise HTTPException(429, "Too many attempts — wait a minute and try again")
        q.append(now)


login_throttle = Throttle(limit=10, window_s=60)
