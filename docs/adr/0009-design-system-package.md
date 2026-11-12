# 0009 — The design system is its own package

**Status:** Accepted · 2026-11-11

## Decision
- `packages/design-system` (`@aba/design-system`) owns **tokens** (`tokens.css` — the only place raw colours, sizes and fonts appear), **components** (buttons, fields, dialogs, toasts, tour, command palette, environment banner, session chart, sparkline) and the **domain vocabulary** (`status.tsx`: one label + icon + tone per program status and trial outcome).
- App code under `apps/web` imports from the package index only and writes layout CSS only (`app.css`).
- No UI framework or chart library: ~1,000 lines we fully control. System fonts (works offline, no third-party requests — also required by the CSP).
- Light and dark themes from the same tokens; dark follows the OS unless the user chooses.
- **Meaning is never colour alone**: every status and outcome pairs colour with an icon and a word.
- The session chart follows single-case-design conventions: evenly spaced sessions, dashed phase lines, **no data path across a phase change**, a quiet criterion line, and annotations in a separate lane under the axis.
- `/design` (non-prod) renders every token and component — the living reference.

## Consequences
- A visual change is made once. New screens are assembled, not styled.
- We maintain our own accessibility behaviour (focus, Escape, labels) instead of inheriting a library's.

## Revisit when
A second app (e.g. parent portal) needs the package published rather than workspace-linked.
