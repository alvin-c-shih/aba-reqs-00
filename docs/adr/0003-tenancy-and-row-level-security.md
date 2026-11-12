# 0003 — Schools → sites; tenant isolation by row-level security

**Status:** Accepted · 2026-11-11

## Context
The owner clarified (2026-11-11): a **system admin** manages across schools; a **school admin** may administer several **sites** of the same school (e.g. East Harlem and Bronx). Student records are sensitive; a forgotten `WHERE school_id = …` must not become a data breach.

## Decision
- Every school-owned table has `school_id`. Students belong to a site; staff are linked to sites through `user_sites`.
- The API connects as the unprivileged role **`aba_app`**. Each request runs in one transaction that sets `app.role`, `app.school_id`, `app.user_id` (transaction-local). **Row-level security policies** compare `school_id` with `app.school_id`.
- **System admins have no policy on clinical tables**: they can create schools and read platform health, but `select * from students` returns zero rows. Row counts for the health page come from a `SECURITY DEFINER` function that returns counts only.
- Inside a school, scope is enforced in one place (`aba/deps.py`): school admin → their sites; BCBA → students they supervise; RBT → current assignments. Out-of-scope ids return **404**, not 403.
- School admins manage people and enrolment but **do not see session data** (minimum necessary).

## Consequences
- Two independent layers: application scope + database policy. Tests assert both (`test_tenant_isolation_in_database`).
- RLS protects against application bugs, **not** SQL injection by someone who can set the session variables — parameterised queries remain mandatory.
- Migrations and demo reset need the owner role; that connection string is absent in prod.

## Revisit when
A person must work at two schools (today: one account per school). A district-level role is needed.
