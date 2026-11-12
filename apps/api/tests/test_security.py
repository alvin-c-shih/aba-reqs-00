import psycopg
import pytest

from aba.config import settings
from aba.db import tx

from .conftest import AVA, EMAILS, NOA, client


def test_requires_login_and_csrf():
    c = client()
    assert c.get("/api/v1/clinic/caseload").status_code == 401
    r = c.post("/api/v1/auth/login", json={"email": "x@y.z", "password": "nope"}, headers={"x-aba-csrf": ""})
    assert r.status_code == 403


def test_lockout_after_five_failures():
    c = client()
    for _ in range(5):
        assert c.post("/api/v1/auth/login", json={"email": EMAILS["rbt"], "password": "wrong"}).status_code == 401
    r = c.post("/api/v1/auth/login", json={"email": EMAILS["rbt"], "password": settings.demo_password})
    assert r.status_code == 423


def test_demo_login_refused_outside_demo():
    r = client().post("/api/v1/auth/demo-login", json={"user_id": "c0000000-0000-4000-8000-000000000003"})
    assert r.status_code == 404


def test_roles_are_separated():
    assert client("rbt").get("/api/v1/school/users").status_code == 403
    assert client("bcba").get("/api/v1/platform/health").status_code == 403
    assert client("admin").get("/api/v1/clinic/caseload").status_code == 403
    assert client("sys").get("/api/v1/clinic/caseload").status_code == 403


def test_tenant_isolation_in_api():
    other = client("other_bcba")
    assert other.get(f"/api/v1/clinic/students/{AVA}").status_code == 404
    assert other.get(f"/api/v1/clinic/students/{NOA}").status_code == 200
    names = [s["first_name"] for s in other.get("/api/v1/clinic/caseload").json()["students"]]
    assert names == ["Noa"]


def test_tenant_isolation_in_database():
    """Even a query with no WHERE clause cannot cross schools, and system admins see no students."""
    with tx("bcba", "a0000000-0000-4000-8000-000000000002") as db:
        assert db.execute("select count(*) as n from students").fetchone()["n"] == 1
    with tx("system_admin") as db:
        assert db.execute("select count(*) as n from students").fetchone()["n"] == 0
        assert db.execute("select count(*) as n from schools").fetchone()["n"] == 2
    with tx() as db:
        assert db.execute("select count(*) as n from users").fetchone()["n"] == 0


def test_observations_and_audit_are_append_only():
    for sql in ("update observations set outcome = 'correct'", "delete from observations", "delete from audit_log"):
        with pytest.raises(psycopg.errors.InsufficientPrivilege):
            with tx("bcba", "a0000000-0000-4000-8000-000000000001") as db:
                db.execute(sql)


def test_refresh_rotation_detects_reuse():
    c = client("bcba")
    old = c.cookies.get("aba_rt")
    assert c.post("/api/v1/auth/refresh").status_code == 200
    c.cookies.set("aba_rt", old, path="/api/v1/auth")
    assert c.post("/api/v1/auth/refresh").status_code == 401


def test_new_user_gets_temp_password_and_must_change_it():
    a = client("admin")
    site = a.get("/api/v1/school/overview").json()["sites"][0]["id"]
    r = a.post("/api/v1/school/users", json={"name": "New Tech", "email": "new.tech@bridgeway.example", "role": "rbt", "site_ids": [site]})
    assert r.status_code == 201
    temp = r.json()["temp_password"]
    n = client()
    assert n.post("/api/v1/auth/login", json={"email": "new.tech@bridgeway.example", "password": temp}).json()["must_change_password"]
    assert n.get("/api/v1/collect/bundle").status_code == 403
    assert n.post("/api/v1/auth/password", json={"current": temp, "new": "short"}).status_code == 422
    assert n.post("/api/v1/auth/password", json={"current": temp, "new": "a-long-Passphrase-42"}).status_code == 200


def test_health_shows_counts_without_exposing_rows():
    h = client("sys").get("/api/v1/platform/health")
    assert h.status_code == 200
    body = h.json()
    counts = {t["tbl"]: t["total"] for t in body["tables"]}
    assert counts["students"] == 6 and counts["observations"] > 500
    assert body["canary"]["ok"] is True
