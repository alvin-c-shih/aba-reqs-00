# ABA System - Clarifying Questions

## Technical Stack & Infrastructure Questions

### 1. Backend Language
The architecture doc mentions Node.js/TypeScript OR Python. Which do you prefer? 
- **Node.js/TypeScript**: Better for real-time features and shared code with frontend
- **Python**: Better for data analysis and ML capabilities

Python

### 2. Cloud Provider
AWS or Azure? This affects specific services:
- AWS: S3, KMS, Cognito, CloudWatch
- Azure: Blob Storage, Key Vault, AD B2C, Application Insights

Assume local for now.

### 3. Authentication System
Should we build custom auth or use a service?
- Custom built (more control, more work)
- Auth0 (feature-rich, paid)
- AWS Cognito (integrated with AWS)
- Firebase Auth (easy to use)

Custom

### 4. Mobile Framework
Pure React Native or Expo managed workflow?
- **Pure React Native**: More flexibility, full native module access
- **Expo**: Easier development, OTA updates, some limitations on native modules

Pure React

### 5. Deployment Strategy
How should we deploy the system?
- Kubernetes (flexible, complex)
- AWS ECS (AWS-native container orchestration)
- Vercel (web) + AWS Amplify (mobile backend)
- Other simpler options

Local for now

## Project Scope Questions

### 6. Initial Build Scope
Are we building the full system now, or starting with Phase 1 MVP?
- **Phase 1 MVP**: Basic data collection, mobile app, simple graphs, user auth
- **Full System**: All phases at once
- **Custom scope**: Specify which features to prioritize

Phase 1

### 7. Demo Data
How should demo data be generated and managed?
- SQL seed scripts
- Programmatically generated with library like Faker
- Manually curated realistic scenarios
- Combination of above

SQL seed scripts with data that exercises the visualizations

### 8. Design System
Do you have existing brand guidelines/design system?
- Use existing design system (please provide)
- Create from scratch
- Use a template (Material UI, Ant Design, Chakra, etc.)

From scratch

## Domain-Specific Questions

### 9. Interval Recording Types
Please confirm the definitions:
- **Partial interval**: Behavior occurred at ANY point during the interval?
- **Whole interval**: Behavior occurred throughout the ENTIRE interval?
- **Momentary time sampling**: Check behavior only at the END of each interval?

Whatever will yield most useful analysis later

### 10. Treatment Plan Hierarchy
Confirm the data structure:
```
Student 
  → Treatment Plan
    → Program
      → Target/Goal
        → Trials/Data Points
```
Is this correct, or should it be organized differently?

Correct

### 11. Mastery Criteria Format
How should mastery criteria be defined? Examples:
- "80% accuracy across 3 consecutive sessions"
- "90% accuracy for 5 out of 6 sessions"
- Custom formula per program?
- Free-text with manual evaluation?

Custom

### 12. Offline Sync Conflicts
What are the priority rules when conflicts occur?
- Last write wins (timestamp-based)
- RBT data always wins over older data
- Flag all conflicts for BCBA review
- Smart merge based on data type
- Other strategy?

User grabs a lock for a session for a given student.
Lock can be grabbed away from a device that has lost connectivity.

Priority to the last user holding the lock.

## User Workflows Questions

### 13. User Onboarding
How are new users added to the system?
- Admin creates accounts and sends invitation emails
- Self-registration with approval workflow
- SSO/SAML integration with school systems
- Combination of methods based on role

Admin.

### 14. Student Assignment
How are students assigned to RBTs/BCBAs?
- Admin assigns explicitly
- BCBA assigns RBTs to their students
- Dynamic based on schedule (future phase)
- Other workflow?

BCBA

### 15. Parent Access Setup
How do parents gain access to the portal?
- Invitation email with temporary password
- Unique registration code provided by school
- BCBA/Admin creates accounts directly
- Self-registration with student ID verification

Invitation

## Compliance & Data Questions

### 16. Data Retention
How long should different types of data be retained?
- Active students: Indefinitely?
- Discharged students: 7 years (HIPAA minimum)? Longer?
- User audit logs: 6 years?
- Deleted/soft-deleted data: Purge after X days?
- Videos/photos: Same as other data or different?

These look fine.

### 17. Video/Photo Consent
How should consent be managed?
- Per-student consent (applies to all sessions)
- Per-session consent (check each time)
- Consent form workflow in the system or external?
- Who can grant consent (parent only, or BCBA can document verbal consent)?

Per student

### 18. Session Types
Are there different session types that need separate data collection flows?
- Direct therapy sessions
- Observation sessions
- Probe/assessment sessions
- Parent training sessions
- Other types?

You decide

## UI/UX Specifics

### 19. Undo/Redo Scope
What should undo/redo apply to?
- Individual data points only
- Entire forms before submission
- Any action in the system
- Within current session only (cleared on navigation)
- Configurable per user role

Forms

### 20. Environment Banner
How should the environment banner work?
- Always visible (persistent header bar)
- Dismissible but returns on page reload
- Show environment + current user role + timestamp
- Different colors per environment (Demo=blue, Dev=green, QA=yellow, Prod=red)

Show env / role / timestamp

---

## Priority Guidance

**Which questions are most important for you to answer before implementation begins?**

Please mark priorities:
- 🔴 Critical (need answer before starting)
- 🟡 Important (need answer before Phase 1 complete)
- 🟢 Nice to know (can decide during implementation)

---

**Document Created**: 2025-12-10
**Status**: Awaiting responses
