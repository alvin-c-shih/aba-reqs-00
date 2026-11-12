# 0015 — Families and teachers see what the BCBA shares, in plain language

**Status:** Accepted · 2026-11-11

## Decision
- Two new roles, **parent** and **teacher**, linked to specific students through `student_contacts`. The school admin invites them (one-time password, as for staff); the BCBA decides what each may do.
- **Parents** see: summaries the BCBA has **published** (a frozen text + goal snapshot), a goal list with a family-friendly name (`programs.plain_name`), a sparkline and a plain status ("Making progress", "Working on it"…), and the family message thread. They never see sessions, staff names on data, clinical notes, domains or other students.
- **Teachers** see: goals with the staff name and the "how to support" text, plain status, and a classroom thread for observations. No summaries, no family thread.
- **Home data**: if the BCBA allows it per guardian *and* per program (frequency programs only), a parent can send a count. It is stored as a session with setting `home` and **always enters the review queue** (ADR-0006) — it never counts until a BCBA accepts it.
- **Messages** are per student with an audience: `team` (BCBA + RBTs), `family`, `classroom`. RBTs read and write the team thread only; messages to families go through the BCBA.
- **Notifications** are in-app only (bell): new message, summary shared, review waiting. No email, SMS or push.
- Access uses the same single scope function (`Ctx.student_filter`) and the same RLS as everyone else; out-of-scope ids answer 404.

## Consequences
- What a family sees is a deliberate publication, not a window onto live clinical data.
- Parents must open the app to learn of news; nothing reaches them outside it.
- A parent of two children at different schools needs two accounts (ASSUMPTIONS S4).

## Revisit when
FERPA access-on-request obligations are confirmed (may require an export of the full record to parents), or email delivery exists.
