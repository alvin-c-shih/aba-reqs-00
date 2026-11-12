"""Test hooks for coding agents and CI. Registered only outside prod (see main.py)."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request

from .. import security
from ..config import settings
from ..db import reset_demo

router = APIRouter(prefix="/api/v1/_test", tags=["test hooks"])


@router.post("/reset")
def reset(request: Request):
    """Put the database into the known demo fixture in one call."""
    security.require_csrf(request)
    if not settings.resettable:
        raise HTTPException(404, "Not found")
    reset_demo()
    return {"ok": True, "fixture": "demo"}
