# Traceability Matrix

Maps user stories → mockups → screens → components → APIs → tests to ensure complete implementation.

## Purpose

This matrix enables:
1. **Requirement tracking** - Verify all features are implemented
2. **Impact analysis** - Understand what changes when requirements change
3. **Test coverage** - Ensure all features have tests
4. **Code generation** - AI agents can trace from story to implementation

## How to Read

Each row represents a user story and traces through:
- **Story ID**: User story identifier
- **Mockup**: ASCII mockup or design reference
- **Screen Spec**: Machine-readable screen state spec
- **Components**: UI components used
- **API Endpoints**: Backend endpoints required
- **Tests**: Test files covering this feature
- **Status**: Implementation status

## Legend

- 🟢 **Implemented & Tested**
- 🟡 **In Progress**
- 🔴 **Not Started**
- ⚪ **Blocked**

---

## RBT Stories

| Story ID | Title | Mockup | Screen Spec | Components | API Endpoints | Tests | Status |
|----------|-------|--------|-------------|------------|---------------|-------|--------|
| US-001 | Login and authenticate | [rbt-stories#us-001](../product/user-stories/rbt-stories.md#us-001) | [auth/login.yaml](./screen-states/auth/login.yaml) | `LoginForm`<br/>`EnvironmentBanner`<br/>`BiometricPrompt` | `POST /api/v1/auth/login`<br/>`POST /api/v1/auth/2fa/verify`<br/>`POST /api/v1/auth/refresh` | `auth.test.ts`<br/>`LoginForm.test.tsx` | 🔴 |
| US-002 | View assigned students | [rbt-stories#us-002](../product/user-stories/rbt-stories.md#us-002) | [rbt/student-list.yaml](./screen-states/rbt/student-list.yaml) | `StudentList`<br/>`StudentCard`<br/>`SyncStatusIndicator`<br/>`SearchBar` | `GET /api/v1/rbt/students` | `StudentList.test.tsx` | 🔴 |
| US-003 | Start a session | [rbt-stories#us-003](../product/user-stories/rbt-stories.md#us-003) | [rbt/session-start.yaml](./screen-states/rbt/session-start.yaml) | `ProgramSelector`<br/>`SessionTimer`<br/>`ProgramCard` | `GET /api/v1/students/{id}/programs`<br/>`POST /api/v1/sessions` | `SessionStart.test.tsx` | 🔴 |
| US-004 | Record trial data | [rbt-stories#us-004](../product/user-stories/rbt-stories.md#us-004) | [rbt/trial-recording.yaml](./screen-states/rbt/trial-recording.yaml) | `TrialRecorder`<br/>`TargetDisplay`<br/>`ResponseButton`<br/>`TrialHistoryBar`<br/>`UndoButton` | `POST /api/v1/sessions/{id}/trials`<br/>`DELETE /api/v1/trials/{id}`<br/>`PATCH /api/v1/trials/{id}` | `TrialRecorder.test.tsx`<br/>`trial-api.test.ts` | 🔴 |
| US-005 | Record frequency data | [rbt-stories#us-005](../product/user-stories/rbt-stories.md#us-005) | [rbt/frequency-recording.yaml](./screen-states/rbt/frequency-recording.yaml) | `FrequencyCounter`<br/>`EventLog`<br/>`RateCalculator` | `POST /api/v1/sessions/{id}/events`<br/>`DELETE /api/v1/events/{id}` | `FrequencyCounter.test.tsx` | 🔴 |
| US-006 | Record duration data | [rbt-stories#us-006](../product/user-stories/rbt-stories.md#us-006) | [rbt/duration-recording.yaml](./screen-states/rbt/duration-recording.yaml) | `DurationTimer`<br/>`DurationSummary`<br/>`DurationHistory` | `POST /api/v1/sessions/{id}/durations/start`<br/>`POST /api/v1/sessions/{id}/durations/stop` | `DurationTimer.test.tsx` | 🔴 |
| US-009 | End session | [rbt-stories#us-009](../product/user-stories/rbt-stories.md#us-009) | [rbt/session-end.yaml](./screen-states/rbt/session-end.yaml) | `SessionSummary`<br/>`SessionNotesInput`<br/>`MediaUpload` | `POST /api/v1/sessions/{id}/end`<br/>`POST /api/v1/sessions/{id}/notes`<br/>`POST /api/v1/sessions/{id}/media` | `SessionEnd.test.tsx` | 🔴 |
| US-010 | View progress graphs | [rbt-stories#us-010](../product/user-stories/rbt-stories.md#us-010) | [rbt/progress-graph.yaml](./screen-states/rbt/progress-graph.yaml) | `LineGraph`<br/>`ProgressIndicator`<br/>`SessionStats` | `GET /api/v1/programs/{id}/graph-data` | `ProgressGraph.test.tsx` | 🔴 |
| US-011 | Offline sync | [rbt-stories#us-011](../product/user-stories/rbt-stories.md#us-011) | [rbt/offline-sync.yaml](./screen-states/rbt/offline-sync.yaml) | `OfflineBanner`<br/>`SyncButton`<br/>`SyncQueue`<br/>`ConflictResolver` | `POST /api/v1/sync/batch`<br/>`GET /api/v1/sync/status` | `offlineSync.test.ts`<br/>`conflictResolution.test.ts` | 🔴 |

## BCBA Stories

| Story ID | Title | Mockup | Screen Spec | Components | API Endpoints | Tests | Status |
|----------|-------|--------|-------------|------------|---------------|-------|--------|
| US-101 | Create student profile | TBD | bcba/student-profile.yaml | `StudentForm`<br/>`FileUpload` | `POST /api/v1/students`<br/>`PATCH /api/v1/students/{id}` | TBD | 🔴 |
| US-102 | Create treatment plan | TBD | bcba/treatment-plan.yaml | `TreatmentPlanForm`<br/>`GoalEditor` | `POST /api/v1/treatment-plans`<br/>`GET /api/v1/treatment-plans/{id}` | TBD | 🔴 |
| US-103 | Create program | TBD | bcba/program-editor.yaml | `ProgramEditor`<br/>`TargetBuilder`<br/>`MasteryCriteriaForm` | `POST /api/v1/programs`<br/>`PATCH /api/v1/programs/{id}` | TBD | 🔴 |
| US-104 | Assign RBTs | TBD | bcba/staff-assignment.yaml | `StaffSelector`<br/>`AssignmentList` | `POST /api/v1/students/{id}/assignments`<br/>`DELETE /api/v1/assignments/{id}` | TBD | 🔴 |
| US-105 | View comprehensive graphs | TBD | bcba/data-analysis.yaml | `LineGraph`<br/>`BarChart`<br/>`CelerationChart`<br/>`GraphControls` | `GET /api/v1/programs/{id}/detailed-data` | TBD | 🔴 |
| US-106 | Annotate graphs | TBD | bcba/data-analysis.yaml | `AnnotationEditor`<br/>`PhaseChangeMarker` | `POST /api/v1/programs/{id}/annotations`<br/>`DELETE /api/v1/annotations/{id}` | TBD | 🔴 |
| US-107 | Trend alerts | TBD | bcba/dashboard.yaml | `AlertList`<br/>`TrendCard`<br/>`AlertDetails` | `GET /api/v1/bcba/alerts`<br/>`PATCH /api/v1/alerts/{id}/acknowledge` | TBD | 🔴 |
| US-108 | Generate report | TBD | bcba/report-generator.yaml | `ReportBuilder`<br/>`ReportTemplate`<br/>`ReportPreview` | `POST /api/v1/reports/generate`<br/>`GET /api/v1/reports/{id}/download` | TBD | 🔴 |

## Parent Stories

| Story ID | Title | Mockup | Screen Spec | Components | API Endpoints | Tests | Status |
|----------|-------|--------|-------------|------------|---------------|-------|--------|
| US-201 | View progress dashboard | TBD | parent/dashboard.yaml | `ParentDashboard`<br/>`ProgressSummary`<br/>`MilestoneList` | `GET /api/v1/parent/children/{id}/progress` | TBD | 🔴 |
| US-202 | Read reports | TBD | parent/reports.yaml | `ReportViewer`<br/>`ReportList` | `GET /api/v1/parent/children/{id}/reports` | TBD | 🔴 |
| US-203 | Milestone notifications | TBD | parent/notifications.yaml | `NotificationList`<br/>`NotificationDetail` | `GET /api/v1/parent/notifications`<br/>`PATCH /api/v1/notifications/{id}/read` | TBD | 🔴 |

## Admin Stories

| Story ID | Title | Mockup | Screen Spec | Components | API Endpoints | Tests | Status |
|----------|-------|--------|-------------|------------|---------------|-------|--------|
| US-301 | User management | TBD | admin/user-management.yaml | `UserTable`<br/>`UserForm`<br/>`RoleSelector` | `GET /api/v1/admin/users`<br/>`POST /api/v1/admin/users`<br/>`PATCH /api/v1/admin/users/{id}` | TBD | 🔴 |
| US-302 | Role assignment | TBD | admin/user-management.yaml | `RoleEditor`<br/>`PermissionMatrix` | `GET /api/v1/admin/roles`<br/>`POST /api/v1/admin/users/{id}/roles` | TBD | 🔴 |
| US-303 | Audit logs | TBD | admin/audit-logs.yaml | `AuditLogTable`<br/>`AuditFilter`<br/>`AuditDetail` | `GET /api/v1/admin/audit-logs` | TBD | 🔴 |
| US-304 | Debug dashboard | TBD | admin/debug-dashboard.yaml | `DatabaseMetrics`<br/>`TableRowCount`<br/>`SyncStatus`<br/>`ErrorLog` | `GET /api/v1/admin/metrics`<br/>`GET /api/v1/admin/db-stats` | TBD | 🔴 |

---

## Coverage Summary

### By Phase

| Phase | Stories | Mockups | Screen Specs | Components | APIs | Tests | Complete |
|-------|---------|---------|--------------|------------|------|-------|----------|
| **P0 (MVP)** | 11 | 11 | 8 | 25 | 22 | 8 | 0% |
| **P1 (Phase 2)** | 9 | 0 | 0 | 0 | 0 | 0 | 0% |
| **P2 (Phase 3)** | 9 | 0 | 0 | 0 | 0 | 0 | 0% |
| **P3 (Phase 4)** | 4 | 0 | 0 | 0 | 0 | 0 | 0% |
| **Total** | **33** | **11** | **8** | **25** | **22** | **8** | **0%** |

### By Artifact Type

| Artifact | Complete | In Progress | Not Started | % Complete |
|----------|----------|-------------|-------------|------------|
| User Stories | 33 | 0 | 0 | 100% |
| Mockups | 11 | 0 | 22 | 33% |
| Screen Specs | 8 | 0 | 25 | 24% |
| Components | 0 | 0 | 35 | 0% |
| API Endpoints | 0 | 0 | 60+ | 0% |
| Tests | 0 | 0 | 35 | 0% |

---

## Usage for AI Coding Agents

### Implementing a Feature

1. **Start with Story ID**: Find the story you're implementing (e.g., US-004)
2. **Review Mockup**: Understand the UI layout and flow
3. **Read Screen Spec**: Get exact data requirements and API contracts
4. **Identify Components**: Find which components exist vs. need creation
5. **Check API Endpoints**: Verify API contracts match screen needs
6. **Write Tests**: Use test scenarios from screen spec
7. **Update Status**: Change status to 🟡 when starting, 🟢 when complete

### Example Workflow for US-004 (Record Trial Data)

```bash
# 1. Read the story
docs/product/user-stories/rbt-stories.md#us-004

# 2. Review UI layout
docs/product/user-stories/rbt-stories.md#us-004 (see mockup)

# 3. Get implementation details
docs/engineering/screen-states/rbt/trial-recording.yaml

# 4. Check component APIs
docs/engineering/component-registry.md#trialrecorder

# 5. Implement components
src/components/TrialRecorder/TrialRecorder.tsx
src/components/TrialHistoryBar/TrialHistoryBar.tsx
src/components/ResponseButton/ResponseButton.tsx

# 6. Implement API client
src/api/trials.ts

# 7. Write tests
src/components/TrialRecorder/TrialRecorder.test.tsx
src/api/trials.test.ts

# 8. Update traceability matrix
docs/engineering/traceability-matrix.md (change US-004 status to 🟢)
```

---

## Maintenance

This matrix should be updated when:
- New user stories are added
- Features are implemented
- Tests are written
- Components are created or refactored
- API endpoints change

**Last Updated**: 2025-12-10  
**Maintained By**: Engineering Team
