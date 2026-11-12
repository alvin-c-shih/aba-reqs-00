# 0006 — One lock per student; takeover allowed; displaced data goes to review

**Status:** Accepted · 2026-11-11

## Context
Owner's rule: a user grabs a lock for a session with a student; a lock can be taken from a device that lost connectivity (with a warning); priority goes to the last holder; the displaced user sees a banner. The old docs resolved "what happens to the displaced device's data" three different ways, two of which destroyed data.

## Decision
- **One lock row per student** (`session_locks`): holder, device, `epoch`, heartbeat. Stale after 15 minutes without heartbeat. A session covers all of the student's programs.
- **Takeover**: anyone with access to the student may take a live lock after an explicit warning. The epoch increments and the event is audited.
- **Heartbeat** (60 s) tells the displaced device; it shows a banner and may keep recording.
- **Placement at sync** (`collect._place`): if two people's sessions for the same student overlap in time, the one with the **higher lock epoch is live**; the other becomes `pending` with a plain-language reason. An open session whose lock is held by someone else is also `pending`.
- **Nothing is dropped.** Pending sessions are excluded from graphs until a BCBA **accepts** or **excludes** them (reason required to exclude). Both are audited.

## Consequences
- The owner's priority rule decides what counts *automatically*; a human decides the rest.
- Review is per session, not per observation (simple; a BCBA can still void single items after accepting).

## Revisit when
Inter-observer agreement is added — a second, deliberate observer needs a non-conflicting "IOA" session type.
