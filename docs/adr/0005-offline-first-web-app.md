# 0005 — The RBT client is an installable, offline-first web app

**Status:** Accepted · 2026-11-11 · **Departs from** the 2025 answer "pure React Native" (owner approved 2026-11-11)

## Context
RBTs record in classrooms and homes with unreliable WiFi. The earlier answer chose React Native; the build machine has no Xcode, and a second codebase doubles the surface an agent must keep consistent. The owner's stated goal was "easy to maintain while allowing access to camera, voice, etc.".

## Decision
- **One React + TypeScript codebase** (Vite). The collection area (`apps/web/src/areas/collect`) is phone-first and installable (manifest + service worker caching the app shell).
- **Local-first writes**: every tap goes to an in-memory store that is persisted to IndexedDB, **encrypted with AES-GCM** using a non-extractable WebCrypto key; then an outbox pushes to `/collect/sync`.
- The device caches one **bundle** (assigned students, active programs, targets, recent values) so sessions can start and run with no network.
- Starting offline takes a **provisional lock** (`lock_epoch = null`); the server decides at sync (ADR-0006).
- The sync pill is always visible and shows the server's **write receipt** ("Server confirmed 16/16").
- Non-prod builds include a "Simulate being offline" switch so the behaviour can be demonstrated and tested.

## Consequences
- Demo, tests and screenshots run in any browser. Camera and microphone remain reachable through web APIs when needed.
- No native push notifications or background sync on iOS; data syncs when the app is next opened online.
- If the access token expires while offline, the user signs in again when back online; the encrypted outbox is kept and syncs after sign-in (replaces the old "72-hour PIN" idea).

## Revisit when
A required capability is not available to web apps on the school's devices (e.g. background location, reliable push). Then wrap this same app (Capacitor) before considering a rewrite.
