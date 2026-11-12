# ABA — one-command workflows. `make help` lists them.
.PHONY: help setup demo dev api web reset test build screenshots diagrams speech
ENV ?= demo

help:          ## list commands
	@grep -E '^[a-z]+:.*##' Makefile | sed 's/:.*##/ —/'
setup:         ## first-time setup: secrets, databases, schema, demo data, dependencies
	./scripts/setup.sh
demo:          ## run the app in the Demo environment (http://localhost:5173)
	@$(MAKE) -j2 api web ENV=demo
dev:           ## run the app in the Dev environment
	@$(MAKE) -j2 api web ENV=dev
api:
	cd apps/api && APP_ENV=$(ENV) uv run uvicorn aba.main:app --port 8010 --reload
web:
	npm run dev:web
speech:        ## optional: local speech-to-text for voice notes (needs whisper-cpp and data/models/whisper/ggml-small.en.bin)
	whisper-server -m data/models/whisper/ggml-small.en.bin --host 127.0.0.1 --port 8178 --inference-path /v1/audio/transcriptions --convert --tmp-dir data/tmp
reset:         ## restore demo data in ENV (demo | dev | qa) — refused for prod
	cd apps/api && APP_ENV=$(ENV) uv run python -m aba.cli reset
test:          ## API tests (uses the aba_test database) + web typecheck
	cd apps/api && uv run pytest -q
	npm run typecheck
build:         ## production web build, served by the API on :8010
	npm run build
screenshots:   ## re-capture every screenshot used by the slide pack (app must be running)
	node scripts/screenshots.mjs
diagrams:      ## regenerate docs/architecture/diagrams from scripts/diagrams.py
	python3 scripts/diagrams.py && node scripts/render-diagrams.mjs
