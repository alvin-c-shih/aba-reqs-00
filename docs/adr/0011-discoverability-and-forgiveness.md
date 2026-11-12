# 0011 — Page tours, command palette, undo instead of confirm

**Status:** Accepted · 2026-11-11

## Context
High staff turnover: new people must become productive without a trainer. The owner asked for a guided tour, discoverable features and a forgiving UX with undo/redo.

## Decision
- **One short tour per page** (`shell/tours.ts`), anchored to `data-tour` attributes, so a tour never depends on data that is not on screen. Offered once by a quiet card; always available from **Help → Tour this page**; completion stored per user.
- **Command palette** (⌘K / Ctrl+K): every page, every student and program on your caseload, and every action (reset demo, theme, shortcuts, sign out).
- **Keyboard shortcuts** listed under `?`; recording works from the keyboard (1–4, Space, U).
- **Undo over confirmation**: reversible actions happen immediately with an **Undo** toast (notes, phases, team, status, deactivation). Confirmation dialogs are reserved for the few irreversible ones (reset demo, lock takeover, excluding a session).
- **Forms** (program editor) keep an undo/redo history (⌘Z / ⇧⌘Z); consecutive typing in one field is one step.
- **Recorded data** is corrected by voiding, never deleting (ADR-0004) — "Undo last" on the phone, "Fix" with a reason for BCBAs.
- Empty states say what belongs there and how to add it. Every status shows *why*.

## Revisit when
Tours need to branch by role within one page, or usage data shows people skipping them.
