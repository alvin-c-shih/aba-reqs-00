"""Database access: pooled connections as aba_app, one transaction per request,
request context (role / school / user) pushed into Postgres so RLS can enforce tenancy."""
from __future__ import annotations

from contextlib import contextmanager
from typing import Iterator

import psycopg
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

from .config import ROOT, settings

_pool: ConnectionPool | None = None


def pool() -> ConnectionPool:
    global _pool
    if _pool is None:
        _pool = ConnectionPool(settings.database_url, min_size=1, max_size=10,
                               kwargs={"row_factory": dict_row}, open=True)
    return _pool


def close_pool() -> None:
    global _pool
    if _pool is not None:
        _pool.close()
        _pool = None


@contextmanager
def tx(role: str = "none", school_id=None, user_id=None) -> Iterator[psycopg.Connection]:
    """One transaction. The three settings are transaction-local, so they can never
    leak to the next request that reuses the pooled connection."""
    with pool().connection() as conn:
        conn.execute(
            "select set_config('app.role', %s, true), set_config('app.school_id', %s, true),"
            " set_config('app.user_id', %s, true)",
            (role, str(school_id or ""), str(user_id or "")),
        )
        yield conn


@contextmanager
def owner() -> Iterator[psycopg.Connection]:
    """Owner connection — migrations and demo reset only."""
    if not settings.admin_database_url:
        raise RuntimeError("no owner connection configured in this environment")
    with psycopg.connect(settings.admin_database_url, row_factory=dict_row) as conn:
        yield conn


def migrate() -> list[str]:
    applied = []
    with owner() as conn:
        conn.execute("create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())")
        conn.execute("do $$ begin if exists (select from pg_roles where rolname = 'aba_app') then grant select on schema_migrations to aba_app; end if; end $$")
        done = {r["name"] for r in conn.execute("select name from schema_migrations")}
        for f in sorted((ROOT / "db" / "migrations").glob("*.sql")):
            if f.name not in done:
                conn.execute(f.read_text())  # type: ignore[arg-type]
                conn.execute("insert into schema_migrations (name) values (%s)", (f.name,))
                applied.append(f.name)
        conn.execute("grant select on schema_migrations to aba_app")
    return applied


def reset_demo() -> None:
    """Wipe and reinstall the demo dataset. Refused outside demo/dev/qa."""
    if not settings.resettable:
        raise PermissionError("demo reset is not available in this environment")
    from .security import hash_password

    with owner() as conn:
        conn.execute("select set_config('seed.password_hash', %s, false)", (hash_password(settings.demo_password),))
        conn.execute((ROOT / "db" / "seeds" / "demo.sql").read_text())  # type: ignore[arg-type]
