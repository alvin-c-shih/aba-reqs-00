"""Application assembly: routers, security headers, error shape, static web app."""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from .config import settings
from .db import close_pool, pool
from .routers import auth, clinic, collect, extras, family, platform, reports, school, testing


@asynccontextmanager
async def lifespan(app: FastAPI):
    pool()
    yield
    close_pool()


# Interactive API docs are a development aid; they do not exist in prod.
app = FastAPI(title="ABA API", version="2.0.0", lifespan=lifespan,
              docs_url=None if settings.is_prod else "/api/docs", redoc_url=None,
              openapi_url=None if settings.is_prod else "/api/openapi.json")

for r in (auth.router, platform.router, platform.demo, school.router, clinic.router, collect.router,
          reports.router, family.router, extras.clinic, extras.school):
    app.include_router(r)
if not settings.is_prod:
    app.include_router(testing.router)   # test hooks are not even registered in prod


@app.middleware("http")
async def security_headers(request: Request, call_next):
    resp = await call_next(request)
    resp.headers["X-Content-Type-Options"] = "nosniff"
    resp.headers["X-Frame-Options"] = "DENY"
    resp.headers["Referrer-Policy"] = "no-referrer"
    resp.headers["X-ABA-Env"] = settings.env
    if request.url.path.startswith("/api/"):
        resp.headers["Cache-Control"] = "no-store"          # PHI must not sit in shared caches
    elif not request.url.path.startswith("/api/docs"):
        resp.headers["Content-Security-Policy"] = (
            "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; "
            "connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'")
    if settings.cookie_secure:
        resp.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return resp


@app.exception_handler(HTTPException)
async def http_error(_: Request, exc: HTTPException):
    d = exc.detail
    body = d if isinstance(d, dict) else {"message": str(d)}
    return JSONResponse(body, status_code=exc.status_code)


@app.exception_handler(Exception)
async def unhandled(_: Request, exc: Exception):
    # No stack traces or internals to the client, in any environment.
    import logging
    logging.getLogger("aba").exception("unhandled error")
    return JSONResponse({"message": "Something went wrong on the server"}, status_code=500)


@app.get("/api/v1/healthz")
def healthz():
    return {"ok": True, "env": settings.env}


# Serve the built web app (single process, single origin — no CORS needed).
if settings.web_dist.exists():
    app.mount("/assets", StaticFiles(directory=settings.web_dist / "assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    def spa(path: str):
        if path.startswith("api/"):
            raise HTTPException(404, "Not found")
        f = (settings.web_dist / path).resolve()
        if path and f.is_file() and settings.web_dist.resolve() in f.parents:
            return FileResponse(f)
        return FileResponse(settings.web_dist / "index.html")
