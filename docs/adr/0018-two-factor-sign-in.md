# 0018 — Two-factor sign-in with authenticator apps

**Status:** Accepted · 2026-11-11 · extends ADR-0007

## Decision
- **TOTP (RFC 6238)**, implemented with the standard library and checked against the RFC test vector. Works with any authenticator app; no SMS (weaker, and needs a paid gateway).
- Enrolment from the account menu: a setup key is shown, the user confirms a code, and receives **eight single-use recovery codes** (stored hashed, shown once).
- Sign-in asks for the code after the password; a wrong code counts toward the same lockout as a wrong password.
- Demo persona sign-in bypasses it (Demo environment only, ADR-0008).

## Not built
A QR code for enrolment (the key is typed), school-wide enforcement, "remember this device", admin reset of a lost second factor.

## Revisit when
Before real student data: enforcement for admins and BCBAs should be switched on by policy.
