import os

os.environ["APP_ENV"] = "dev"
os.environ["APP_DB"] = "aba_test"

import pytest
from fastapi.testclient import TestClient

from aba.config import settings
from aba.db import migrate, reset_demo
from aba.main import app
from aba.security import login_throttle

H = {"x-aba-csrf": "1"}
EMAILS = {"sys": "sam.okafor@aba-platform.example", "admin": "priya.raman@bridgeway.example",
          "bcba": "anita.nair@bridgeway.example", "rbt": "marcus.rivera@bridgeway.example",
          "rbt2": "jo.chen@bridgeway.example", "other_bcba": "omar.haddad@lakeshore.example"}
AVA, BEN, NOA = (f"d0000000-0000-4000-8000-00000000000{i}" for i in (1, 2, 6))


@pytest.fixture(autouse=True)
def fresh_db():
    migrate()
    reset_demo()
    login_throttle.hits.clear()


def client(who: str | None = None) -> TestClient:
    c = TestClient(app, headers=H)
    if who:
        r = c.post("/api/v1/auth/login", json={"email": EMAILS[who], "password": settings.demo_password})
        assert r.status_code == 200, r.text
    return c


@pytest.fixture
def as_():
    return client

EMAILS.update({"parent": "linh.tran@family.example", "teacher": "grace.adeyemi@bridgeway.example", "other_admin": "lena.fischer@lakeshore.example"})
