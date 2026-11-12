# Architecture decision records

One decision per file. Status is **Accepted** unless stated. To change a decision, add a new ADR that supersedes the old one — don't edit history.

| # | Decision | Area |
|---|---|---|
| [0001](0001-single-source-of-truth.md) | One current doc per concern; the 2025 spec is archived | Process |
| [0002](0002-modular-monolith-sql-first.md) | One FastAPI process + PostgreSQL, SQL-first, plain SQL migrations | Backend |
| [0003](0003-tenancy-and-row-level-security.md) | Schools → sites; tenant isolation by Postgres row-level security | Security / data |
| [0004](0004-append-only-observations.md) | Observations are an append-only log with client-generated ids | Data |
| [0005](0005-offline-first-web-app.md) | RBT client is an installable, offline-first web app (not React Native) | Frontend |
| [0006](0006-session-lock-and-review-queue.md) | One lock per student; takeover allowed; displaced data goes to review | Sync |
| [0007](0007-authentication-and-sessions.md) | JWT in httpOnly cookies, rotating refresh, CSRF header, lockout | Security |
| [0008](0008-environments-and-demo-reset.md) | One database per environment; demo personas and reset never exist in prod | Operations |
| [0009](0009-design-system-package.md) | Design system is its own package: tokens, components, domain vocabulary | Frontend |
| [0010](0010-clinical-decision-rules.md) | Structured mastery rule; status flags judged on the current phase | Domain |
| [0011](0011-discoverability-and-forgiveness.md) | Page tours, command palette, undo instead of confirm | UX |
| [0012](0012-testability.md) | Test ids, scripted walkthrough, health evidence | Quality |
| [0013](0013-statistical-insights.md) | Change points, forecasts and other suggestions are plain statistics, accepted or dismissed | Domain |
| [0014](0014-local-models-only.md) | AI drafts and voice use models on the school's own machine; off by default | Privacy |
| [0015](0015-family-and-classroom-access.md) | Parents and teachers see what the BCBA shares, in plain language; home data is reviewed | Access |
| [0016](0016-consent-and-media.md) | Photos and video need recorded consent and stay on local disk | Privacy |
| [0017](0017-reports-and-service-log.md) | Reports share one fact source; billing is a generic service log | Reporting |
| [0018](0018-two-factor-sign-in.md) | Two-factor sign-in with authenticator apps | Security |

Template: **Context** (what forced a choice) → **Decision** → **Consequences** (what gets easier, what gets harder) → **Revisit when**.
