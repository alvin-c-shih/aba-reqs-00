# User Stories

User stories are organized by persona to reflect the different workflows and needs of each user type.

## Stories by Persona

### [RBT (Registered Behavior Technician)](./rbt-stories.md)
Primary field users collecting data during sessions with students.

**Key Workflows**:
- Session data collection
- Quick trial recording
- Timer-based duration recording
- ABC data capture
- Session notes and observations

### [BCBA (Board Certified Behavior Analyst)](./bcba-stories.md)
Clinical supervisors who design programs and analyze data.

**Key Workflows**:
- Treatment plan creation
- Program management
- Data analysis and graphing
- Report generation
- Team collaboration

### [Parent/Guardian](./parent-stories.md)
Family members who monitor progress and may enter home data.

**Key Workflows**:
- View child's progress
- Read reports
- Receive notifications
- Optional: Enter home data

### [Administrator](./admin-stories.md)
System managers who handle users and configuration.

**Key Workflows**:
- User management
- System configuration
- Reporting and analytics
- Debugging and monitoring

### [School Staff](./school-staff-stories.md)
Teachers and paraprofessionals who collaborate on student support.

**Key Workflows**:
- View classroom student progress
- Add observations
- Coordinate with ABA team

## Story Format

Each user story follows this structure:

```markdown
## [US-XXX] Story Title

**As a** [persona]
**I want to** [action/goal]
**So that** [benefit/outcome]

### Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

### UI Mockup
[ASCII mockup or description]

### Screen State Spec
[Link to machine-readable spec]

### Related Components
[Links to component registry]

### API Endpoints
[Links to API docs]

### Test Scenarios
[Link to testing strategy]
```

## Priority Legend

- 🔴 **P0**: MVP blocker (Phase 1)
- 🟠 **P1**: Critical (Phase 2)
- 🟡 **P2**: Important (Phase 3)
- 🟢 **P3**: Nice to have (Phase 4)

## Story Index

### RBT Stories
- 🔴 [US-001](./rbt-stories.md#us-001) Login and authenticate
- 🔴 [US-002](./rbt-stories.md#us-002) View assigned students
- 🔴 [US-003](./rbt-stories.md#us-003) Start a session
- 🔴 [US-004](./rbt-stories.md#us-004) Record trial data (discrete trial)
- 🔴 [US-005](./rbt-stories.md#us-005) Record frequency/event data
- 🔴 [US-006](./rbt-stories.md#us-006) Record duration data
- 🟠 [US-007](./rbt-stories.md#us-007) Record interval data
- 🟠 [US-008](./rbt-stories.md#us-008) Record ABC data
- 🔴 [US-009](./rbt-stories.md#us-009) End session and add notes
- 🔴 [US-010](./rbt-stories.md#us-010) View basic progress graphs
- 🔴 [US-011](./rbt-stories.md#us-011) Work offline and sync later
- 🟡 [US-012](./rbt-stories.md#us-012) Use voice-to-text for notes
- 🟢 [US-013](./rbt-stories.md#us-013) Use voice commands for data entry
- 🟢 [US-014](./rbt-stories.md#us-014) Take photos/videos during session

### BCBA Stories
- 🔴 [US-101](./bcba-stories.md#us-101) Create student profile
- 🔴 [US-102](./bcba-stories.md#us-102) Create treatment plan
- 🔴 [US-103](./bcba-stories.md#us-103) Create program with targets
- 🔴 [US-104](./bcba-stories.md#us-104) Assign RBTs to students
- 🟠 [US-105](./bcba-stories.md#us-105) View comprehensive data graphs
- 🟠 [US-106](./bcba-stories.md#us-106) Annotate graphs with phase changes
- 🟠 [US-107](./bcba-stories.md#us-107) Receive automated trend alerts
- 🟠 [US-108](./bcba-stories.md#us-108) Generate progress report
- 🟠 [US-109](./bcba-stories.md#us-109) Modify program based on data
- 🟠 [US-110](./bcba-stories.md#us-110) Export data to Excel/PDF
- 🟡 [US-111](./bcba-stories.md#us-111) Use program templates
- 🟡 [US-112](./bcba-stories.md#us-112) Clone program from another student
- 🟢 [US-113](./bcba-stories.md#us-113) Run predictive analysis

### Parent Stories
- 🟡 [US-201](./parent-stories.md#us-201) View child's progress dashboard
- 🟡 [US-202](./parent-stories.md#us-202) Read progress reports
- 🟡 [US-203](./parent-stories.md#us-203) Receive milestone notifications
- 🟢 [US-204](./parent-stories.md#us-204) Enter home practice data
- 🟡 [US-205](./parent-stories.md#us-205) View session notes

### Administrator Stories
- 🔴 [US-301](./admin-stories.md#us-301) Create and manage users
- 🔴 [US-302](./admin-stories.md#us-302) Assign roles and permissions
- 🟡 [US-303](./admin-stories.md#us-303) View audit logs
- 🟡 [US-304](./admin-stories.md#us-304) Access debugging dashboards
- 🟡 [US-305](./admin-stories.md#us-305) Manage demo/test data
- 🟡 [US-306](./admin-stories.md#us-306) Configure system settings
- 🟢 [US-307](./admin-stories.md#us-307) Generate system-wide analytics

### School Staff Stories
- 🟡 [US-401](./school-staff-stories.md#us-401) View classroom students
- 🟡 [US-402](./school-staff-stories.md#us-402) Add classroom observations
- 🟡 [US-403](./school-staff-stories.md#us-403) View simplified progress

---

**Total Stories**: 33 (P0: 11, P1: 9, P2: 9, P3: 4)
