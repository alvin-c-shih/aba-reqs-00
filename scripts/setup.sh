#!/usr/bin/env bash
# One-time local setup: secrets, databases, schema, demo data, dependencies.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  {
    echo "APP_ENV=demo"
    echo "JWT_SECRET=$(openssl rand -hex 32)"
    echo "# Password of every seeded demo/dev/QA account (generated, local only)."
    echo "DEMO_PASSWORD=$(openssl rand -hex 4)-$(openssl rand -hex 4)-$(openssl rand -hex 4)"
  } > .env
  chmod 600 .env
  echo "created .env"
fi

pg_isready -q || { echo "PostgreSQL is not running (brew services start postgresql@14)"; exit 1; }
psql -qtA postgres -c "select 1 from pg_roles where rolname='aba_app'" | grep -q 1 || createuser aba_app
for env in demo dev qa test; do
  psql -qtA postgres -c "select 1 from pg_database where datname='aba_$env'" | grep -q 1 || createdb "aba_$env"
  (cd apps/api && APP_ENV=$([ "$env" = test ] && echo dev || echo "$env") APP_DB="aba_$env" uv run -q python -m aba.cli setup)
done
npm install --silent
echo "done — run: make demo"
