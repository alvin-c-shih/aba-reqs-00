# ABA System - Phase 1 MVP Specific Questions

Based on your initial responses, these questions will finalize the Phase 1 MVP scope and technical approach.

---

## Phase 1 MVP Scope - Critical Details

### 1. Platform Priority
Phase 1 includes "mobile app" but the system overview mentions web + mobile. For Phase 1 MVP, should I build:
- **Mobile app only** (RBT data collection)
- **Web app only** (BCBA dashboard)
- **Both mobile + web** (full flow from RBT collection to BCBA analysis)

**Your Answer:**

Both

---

### 2. Python Backend Framework
Which framework should I use?
- **FastAPI** (modern, async, auto API docs, lightweight)
- **Django + DRF** (batteries included, ORM, admin panel, more opinionated)
- **Flask** (lightweight, flexible, minimal)

**Your Answer:**

FastAPI

---

### 3. Local Deployment Details
When you say "local," do you mean:
- **Docker Compose** setup (recommended - easy to run anywhere, production-like)
- **Direct installation** (python venv, npm, postgresql running on host machine)
- **Both** (Docker for production-like testing, direct for active development)

**Your Answer:**

Direct
---

### 4. Database Setup
Should I use:
- **PostgreSQL alone** (simpler for MVP, sufficient for Phase 1)
- **PostgreSQL + TimescaleDB extension** (better for time-series data from day 1)
- **PostgreSQL + Redis** (add caching layer in Phase 1)
- **PostgreSQL + TimescaleDB + Redis** (full stack from start)

**Your Answer:**

PostgesSQL alone
---

### 5. Data Collection Methods in Phase 1
The requirements mention "All" methods, but for Phase 1 MVP, which ones are critical?

| Method | Include in Phase 1? |
|--------|-------------------|
| Frequency/event recording | ✓ (assumed yes) |
| Duration recording | ✓ (assumed yes) |
| Trial-by-trial (discrete trial) | ✓ (assumed yes) |
| ABC data (Antecedent-Behavior-Consequence) | ? |
| Interval recording (partial/whole/momentary) | ? |
| Task analysis / chaining | ? |
| Probe data | ? |

**Your Answer:**

Just "assumed yes" for now
---

### 6. Graph Types in Phase 1
Which visualizations are needed for MVP?

| Graph Type | Include in Phase 1? |
|-----------|-------------------|
| Line graphs (progress over time) | ? |
| Bar charts | ? |
| Cumulative records | ? |
| Celeration charts | ? |
| Simple data tables | ? |

**Your Answer:**

Line and bar

---

### 7. Session Locking Details
For the session lock system you described:

**a) Lock Duration:**
- How long does a lock last?
  - Until user explicitly ends session?
  - 15 minutes of inactivity?
  - Other timeout?

**b) Lock Stealing:**
- Who can steal a lock?
  - Any user with access to that student?
  - Only BCBA and Admin?
  - Anyone, but with confirmation?

**c) Auto-Steal from Offline Users:**
- Does the system auto-steal from disconnected users?
  - After 5 minutes offline?
  - After 15 minutes offline?
  - Manual steal only?

**d) Notification:**
- UI notification when someone steals your lock?
  - Alert modal forcing acknowledgment?
  - Banner notification?
  - Silent (user discovers on save attempt)?

**Your Answers:**
- Lock duration: 15 minutes
- Who can steal: anyone with access to session
- Auto-steal: warn that they're stealing a session
- Notification: Banner

---

### 8. Authentication Token Strategy
For mobile offline capability with custom auth:

- **JWT tokens** with refresh tokens (standard approach)?
- **Long-lived session tokens** (30 days expiration)?
- How to handle token expiration when offline?
  - Extended token lifetime for mobile?
  - Grace period for offline devices?
  - Force re-login after X days offline?

**Your Answer:**

JWT
---

### 9. Phase 1 User Roles
Should all 5 roles exist in Phase 1, or a subset?

| Role | Include in Phase 1? | Permissions Needed |
|------|-------------------|-------------------|
| Admin | ✓ (assumed yes) | User management, system config |
| BCBA | ✓ (assumed yes) | Create programs, view all data, analyze |
| RBT | ✓ (assumed yes) | Collect data for assigned students |
| Parent | ? | View-only for their child |
| School Staff | ? | Limited view/notes |

**Your Answer:**

First 3 is fine to start.

---

### 10. Offline Mobile Capabilities
For Phase 1 offline sync:

**a) Data Caching:**
- How much data should mobile cache locally?
  - Last 30 days of sessions?
  - All data for assigned students (unlimited)?
  - Configurable per device?

**b) Local Storage Technology:**
- SQLite (full relational DB)?
- AsyncStorage (simple key-value)?
- Realm (mobile-first DB)?
- WatermelonDB (offline-first React Native DB)?

**c) Offline Duration:**
- Should app work 100% offline for days/weeks?
- Or just handle brief disconnections (minutes/hours)?
- Any features disabled when offline?

**Your Answers:**
- Data caching: 30 days
- Local storage: key-value
- Offline duration: browsing sensitive information

---

## Additional Clarifications

### 11. Demo Mode Data Volume
For the demo database with SQL seed scripts:
- How many demo students? (10? 50? 100?)
- How many RBTs/BCBAs? (5 RBTs, 2 BCBAs?)
- How much historical data? (Last 30 days? 90 days? 6 months?)
- Variety of data scenarios:
  - Student showing mastery
  - Student showing no progress
  - Student with regression
  - New student (baseline only)

**Your Answer:**

---

5 demo students, 1 RBT, 1 BCBA, all suggested scenarios with an emphasis on different change points

### 12. Guided Tour in Phase 1?
Should the guided tour/onboarding feature be included in Phase 1, or deferred to Phase 3 (as per original timeline)?

**Your Answer:**

Phase 1 as it's valuable for demo mode

---

### 13. Testability Dashboards in Phase 1?
Should debugging dashboards (row counts, system health) be in Phase 1 or later?

**Your Answer:**
Phase 1 to allow the AI coding agent to do more of the testing.

---

### 14. Environment Handling
For local deployment, do you still need environment banners (Demo/Dev/QA/Prod)?
- Just Demo vs Production?
- Full 4 environments from start?
- Configure via environment variable?

**Your Answer:**
Yes, 4 environments

---

### 15. Undo/Redo Implementation
Undo/redo for forms - should this be:
- Built into Phase 1?
- Deferred to later phase?
- Browser-level (Ctrl+Z in text fields) or app-level (custom stack)?

**Your Answer:**
Phase 1 to ensure the AI coder can cope with the added complexity

---

## Technical Stack Summary

Based on answers above, I'll be using:

**Backend:**
- Python (your choice)
- Framework: [TBD based on Q2]
- Database: [TBD based on Q4]

**Frontend:**
- Web: React + TypeScript + Next.js
- Mobile: React Native (pure) + TypeScript

**Infrastructure:**
- Local deployment: [TBD based on Q3]
- File storage: Local filesystem (Phase 1)
- Future: Cloud migration path documented

---

**Document Created**: 2025-12-10
**Status**: Awaiting responses for Phase 1 MVP specification
