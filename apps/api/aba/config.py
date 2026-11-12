"""Settings. Everything environment-specific comes from env vars (or the repo-root .env)."""
from __future__ import annotations

import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
ENVS = ("demo", "dev", "qa", "prod")


def _load_dotenv() -> None:
    f = ROOT / ".env"
    if not f.exists():
        return
    for line in f.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())


_load_dotenv()


class Settings:
    def __init__(self) -> None:
        self.env = os.environ.get("APP_ENV", "demo")
        if self.env not in ENVS:
            raise RuntimeError(f"APP_ENV must be one of {ENVS}")
        db = os.environ.get("APP_DB", f"aba_{self.env}")
        self.db_name = db
        # The API connects as the unprivileged aba_app role (RLS applies, append-only tables enforced).
        self.database_url = os.environ.get("DATABASE_URL", f"dbname={db} user=aba_app host=/tmp")
        # Owner connection: migrations and demo reset only. Leave unset in prod.
        self.admin_database_url = os.environ.get("ADMIN_DATABASE_URL", "" if self.env == "prod" else f"dbname={db} host=/tmp")
        self.jwt_secret = os.environ.get("JWT_SECRET", "")
        self.demo_password = os.environ.get("DEMO_PASSWORD", "")
        self.cookie_secure = os.environ.get("COOKIE_SECURE", "1" if self.env == "prod" else "0") == "1"
        self.access_minutes = 15
        self.refresh_idle_minutes = 15       # sliding: unused refresh tokens die after this
        self.refresh_absolute_hours = 12
        self.lock_stale_minutes = 15
        self.max_failed_logins = 5
        self.lockout_minutes = 15
        self.web_dist = ROOT / "apps" / "web" / "dist"
        if len(self.jwt_secret) < 32:
            raise RuntimeError("JWT_SECRET missing or too short — run `make setup`")
        if self.env == "prod" and not self.cookie_secure:
            raise RuntimeError("COOKIE_SECURE must be on in prod")

    @property
    def is_prod(self) -> bool:
        return self.env == "prod"

    @property
    def resettable(self) -> bool:
        """Demo data can be installed/reset here. Never true in prod."""
        return self.env in ("demo", "dev", "qa") and bool(self.admin_database_url)


settings = Settings()
