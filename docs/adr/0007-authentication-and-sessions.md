# 0007 — Authentication and session security

**Status:** Accepted · 2026-11-11

## Decision
- **Custom auth** (owner's choice). Passwords hashed with **Argon2id**; minimum 12 characters; no forced rotation (current NIST guidance prefers length and breach response over 90-day rotation — this departs from the 2025 suggestion).
- **Tokens**: 15-minute JWT access token + opaque **rotating refresh token** (stored hashed; 15-minute idle, 12-hour absolute). Reusing a rotated token revokes the whole chain.
- Both in **httpOnly, SameSite=Strict cookies** (`Secure` outside local http). Nothing token-like is readable by JavaScript.
- **CSRF**: state-changing requests must carry `X-ABA-CSRF: 1`; no CORS is configured, so another origin cannot send it.
- The JWT carries identity only. **Role, status and assignments are re-read from the database on every request**, so deactivation and reassignment take effect immediately.
- **Lockout**: 5 failed sign-ins → 15-minute lock; sign-in is throttled per IP (in-process — correct for the single-process deployment of ADR-0002).
- Accounts are created by admins with a **one-time temporary password** (shown once, must be changed at first sign-in). No email service is required locally.
- The web app signs out after **15 minutes without input**, except while a session is being recorded.
- Headers: CSP (`default-src 'self'`), `X-Frame-Options: DENY`, `nosniff`, `no-store` on API responses, HSTS when Secure.
- Unhandled errors return a generic message in every environment; interactive API docs and test hooks are not registered in prod.

## Not yet built (tracked in ASSUMPTIONS.md)
Two-factor sign-in is now built ([ADR-0018](0018-two-factor-sign-in.md)) but not enforced. Still open: IP allow-listing for admins, TLS termination and at-rest disk encryption (deployment concerns), per-user audit export.

## Revisit when
More than one API process runs (move throttling to Postgres) or SSO is required.
