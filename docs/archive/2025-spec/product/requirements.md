# Product Requirements Document

## Document Control

| | |
|---|---|
| **Version** | 0.1.0 |
| **Status** | Draft - Specification Phase |
| **Last Updated** | 2025-12-10 |
| **Owner** | Product Team |
| **Stakeholders** | School Administration, BCBAs, RBTs, Parents |

## Executive Summary

The ABA Data Collection & Analysis System is a comprehensive, HIPAA-compliant platform designed to streamline behavioral data collection, analysis, and reporting for schools providing Applied Behavior Analysis services. The system will serve approximately 100 students with 1:1 therapy ratios, supporting BCBAs, RBTs, parents, school staff, and administrators.

**Key Differentiators**:
- Offline-first mobile data collection
- Voice-enabled data entry
- Automated trend analysis with proactive alerts
- Forgiving UX with undo/redo
- Developer-friendly with testability hooks

## Business Objectives

### Primary Goals
1. **Reduce administrative burden** by 50% through automation of graphing and reporting
2. **Improve data quality** with real-time validation and offline-capable mobile collection
3. **Enhance clinical decision-making** through automated trend analysis and alerts
4. **Increase transparency** with parent portal and real-time progress tracking
5. **Ensure compliance** with HIPAA regulations and audit requirements

### Success Metrics
- 90% user adoption within 60 days of rollout
- 50% reduction in time spent on manual data processing
- 95% of data entered within 24 hours of session
- 99.5% uptime during school hours
- <5% data entry error rate

## Target Users

### Primary Users

#### 1. RBT (Registered Behavior Technician)
**Count**: ~100 staff members  
**Tech Proficiency**: Low to Medium  
**Primary Device**: Mobile phone/tablet  
**Use Case**: Real-time data collection during 1:1 therapy sessions

**Needs**:
- Fast, intuitive data entry
- Offline capability
- Minimal navigation/clicks
- Large tap targets for accuracy
- Immediate visual feedback

#### 2. BCBA (Board Certified Behavior Analyst)
**Count**: ~20 staff members  
**Tech Proficiency**: Medium to High  
**Primary Device**: Laptop/desktop  
**Use Case**: Treatment planning, data analysis, reporting

**Needs**:
- Comprehensive data visualization
- Flexible analysis tools
- Quick report generation
- Treatment plan version control
- Team collaboration features

#### 3. Parent/Guardian
**Count**: ~100 families  
**Tech Proficiency**: Low to Medium  
**Primary Device**: Mobile phone  
**Use Case**: Monitor child's progress, communicate with team

**Needs**:
- Simple, clear progress displays
- Milestone notifications
- Easy-to-understand reports
- Secure messaging

#### 4. Administrator
**Count**: 5-10 staff members  
**Tech Proficiency**: High  
**Primary Device**: Desktop  
**Use Case**: User management, system oversight, reporting

**Needs**:
- User/role management
- System health monitoring
- Audit logs
- Debug capabilities
- Analytics dashboards

#### 5. School Staff (Teachers, Paraprofessionals)
**Count**: 30-40 staff members  
**Tech Proficiency**: Medium  
**Primary Device**: Desktop/tablet  
**Use Case**: View student progress, coordinate with ABA team

**Needs**:
- Read-only student views
- Simple observation entry
- Integration with classroom activities

## Functional Requirements

### 1. Authentication & Authorization

#### FR-1.1: User Authentication
- Users must authenticate with email/username and password
- Optional two-factor authentication via SMS or authenticator app
- "Remember me" functionality for 7 days
- Biometric authentication on mobile (Touch ID, Face ID)
- Session timeout after 15 minutes of inactivity
- Maximum 5 failed login attempts before account lockout

#### FR-1.2: Role-Based Access Control
System shall support five user roles with distinct permissions:

**Administrator**:
- Full system access
- Create/edit/deactivate users
- Configure system settings
- View all students and data
- Access audit logs
- Manage demo data

**BCBA**:
- Create/modify treatment plans
- Assign programs to students
- Assign RBTs to students
- View data for assigned students only
- Generate reports
- Export data
- Approve/reject data entries (if needed)

**RBT**:
- Collect data for assigned students only
- View programs for assigned students
- Add session notes
- View basic progress graphs
- Cannot modify treatment plans

**Parent**:
- View own child's data only
- View progress and reports
- Receive notifications
- Add home data (if enabled by BCBA)

**School Staff**:
- View students in assigned classrooms
- Add observations/notes (if permitted)
- Read-only access to treatment plans

#### FR-1.3: Audit Logging
All PHI access and modifications must be logged:
- User ID and role
- Action performed (view, create, update, delete)
- Resource accessed (student ID, session ID, etc.)
- Timestamp
- IP address
- Before/after values (for modifications)

### 2. Student Management

#### FR-2.1: Student Profiles
- Create student profile with:
  - Name, Date of Birth, Student ID
  - Demographics (optional)
  - Medical/behavioral alerts
  - Emergency contacts
  - Consent forms (photos, videos)
- Search and filter students
- View active programs for each student
- View session history
- View assigned staff

#### FR-2.2: Assignment Management
- BCBAs can assign RBTs to students
- BCBAs can assign programs to students
- Students can have multiple assigned RBTs
- Assignment history tracked for audit

### 3. Treatment Planning

#### FR-3.1: Program Creation
- BCBAs create programs with:
  - Program name and description
  - Category (skill acquisition vs. behavior reduction)
  - Data collection method (trial, frequency, duration, etc.)
  - Mastery criteria
  - Prompt hierarchy (if applicable)
  - Reinforcement schedule
  - Error correction procedure

#### FR-3.2: Target Management
- Programs contain multiple targets
- Each target has:
  - Discriminative stimulus (SD)
  - Materials needed
  - Correct response definition
  - Prompt levels
- Targets can be active or inactive
- Target rotation settings

#### FR-3.3: Program Templates
- BCBAs can save programs as templates
- Clone programs from templates
- Share templates within organization
- Standard templates library (common ABA programs)

#### FR-3.4: Version Control
- Track all program modifications
- View version history
- Document reason for changes
- Revert to previous version if needed

### 4. Data Collection

#### FR-4.1: Session Management
- RBT starts session by selecting student
- Select one or more programs to work on
- Session timer starts automatically
- Can pause/resume session
- End session with summary notes

#### FR-4.2: Discrete Trial Training (DTT)
- Display current target/SD
- Large buttons for Correct, Prompted, Incorrect
- Haptic feedback on response recording
- Running tally of responses
- Undo last trial
- Add notes to specific trials
- <100ms latency from tap to save

#### FR-4.3: Frequency/Event Recording
- Large increment (+) button
- Display current count
- Calculate rate per minute
- Timestamp each occurrence
- Optional notes per event
- Decrement button for corrections

#### FR-4.4: Duration Recording
- Start/stop timer for behavior episodes
- Pause/resume capability
- Display current duration
- Total duration for session
- Episode count
- Average and longest durations
- Alert at threshold (optional)

#### FR-4.5: Interval Recording
- Partial interval
- Whole interval
- Momentary time sampling
- Configurable interval length
- Audio/vibration cues at interval end
- Visual indicator of current interval
- Grid view of completed intervals

#### FR-4.6: ABC Data Collection
- Capture Antecedent, Behavior, Consequence
- Timestamp each incident
- Voice-to-text support
- Photo/video documentation (optional)
- Pre-defined ABC options with custom text

#### FR-4.7: Task Analysis
- Display steps in sequence
- Record level of independence per step:
  - Independent
  - Verbal prompt
  - Model prompt
  - Physical prompt
  - Not attempted
- Show completion percentage
- Track across sessions

#### FR-4.8: Probe Data
- Periodic assessment mode
- No prompting allowed
- Clear visual indicator (probe vs. teaching)
- Used to assess maintenance/generalization

### 5. Offline Functionality

#### FR-5.1: Offline Data Collection
- All data collection features work offline
- Data stored locally in IndexedDB
- Visual indicator showing offline status
- Pending sync counter visible

#### FR-5.2: Automatic Sync
- Sync triggers:
  - Network connection restored
  - App brought to foreground
  - Manual sync button
  - Periodic background sync (if permitted)
- FIFO queue processing
- Retry logic with exponential backoff

#### FR-5.3: Conflict Resolution
- Detect when same data edited offline and online
- Conflict resolution strategies:
  - Server wins (notify user)
  - User chooses (show diff)
  - Merge if possible
- Maintain both versions for audit

### 6. Data Analysis & Visualization

#### FR-6.1: Graph Types
- Line graph (% correct over time)
- Bar chart (frequency counts)
- Cumulative record
- Celeration chart (semi-log paper)
- Scatter plot (time of day analysis)

#### FR-6.2: Graph Controls
- Date range selection
- Session count filter (last N sessions)
- Zoom and pan
- Show/hide data points
- Trend line overlay
- Phase change lines

#### FR-6.3: Annotations
- Add phase change markers
- Label interventions
- Add text notes at specific dates
- Color-coded annotation types
- Visible on all graphs for that program

#### FR-6.4: Trend Analysis
- Automated trend detection:
  - Accelerating (positive progress)
  - Decelerating (regression)
  - Stable/plateau (no progress)
  - Variable (inconsistent performance)
- Statistical methods (linear regression, split-middle)
- Mastery criteria check
- Generate alerts for BCBA review

### 7. Reporting

#### FR-7.1: Progress Reports
- Narrative summary of progress
- Graphs for each program
- Session attendance
- Data summary tables
- BCBA comments section
- Generate as PDF

#### FR-7.2: Insurance Reports
- Formatted for insurance requirements
- CPT codes and units
- Date range and total hours
- Progress toward goals
- Medical necessity documentation

#### FR-7.3: Parent Reports
- Simplified language (no jargon)
- Visual progress indicators
- Highlights and achievements
- Home practice recommendations
- Next steps

#### FR-7.4: Custom Reports
- Report builder interface
- Select students, programs, date range
- Choose sections to include
- Save report templates
- Export to PDF, Excel, CSV

### 8. Notifications

#### FR-8.1: Notification Types
- Milestone achieved (e.g., mastery)
- Trend alert (no progress, regression)
- Session reminder
- Data entry reminder (if not entered in 24h)
- System updates
- New message from team member

#### FR-8.2: Notification Channels
- In-app notifications
- Push notifications (mobile)
- Email notifications
- SMS (optional)

#### FR-8.3: Notification Preferences
- Users can configure per notification type
- Quiet hours setting
- Frequency limits (digest vs. immediate)

### 9. Communication

#### FR-9.1: Secure Messaging
- In-system messaging (no PHI via SMS/email)
- Thread by student or topic
- Attach files (within system)
- Read receipts
- Notification on new message

#### FR-9.2: Comments
- Comment on sessions, programs, graphs
- @mention team members
- Resolve/close comments

### 10. Media Management

#### FR-10.1: Photo Capture
- Take photos during sessions
- Attach to session or specific trial
- Auto-redact identifying information (optional)
- Consent check before capture

#### FR-10.2: Video Recording
- Record session videos
- Timestamp synchronization with data
- Storage in encrypted bucket
- Consent management
- Retention policy enforcement

### 11. Developer & Admin Features

#### FR-11.1: Environment Banners
- Visual indicator of environment:
  - Demo: Purple banner
  - Dev: Orange banner
  - QA: Yellow banner
  - Prod: No banner or minimal
- Always visible, cannot be dismissed

#### FR-11.2: Debug Dashboards
- Database metrics:
  - Table row counts
  - Database size
  - Query performance
  - Index usage
- Sync queue status:
  - Pending items
  - Failed items
  - Conflict count
- Error logs:
  - Recent errors
  - Error frequency
  - Stack traces

#### FR-11.3: Demo Mode
- Separate demo database with fake data
- Clearly labeled as demo throughout UI
- Realistic data scenarios:
  - Mastered programs
  - Progressing programs
  - Plateau/regression scenarios
- Cannot accidentally affect production data

#### FR-11.4: Testability Hooks
- Data-testid attributes on interactive elements
- Exposed state for integration tests
- API mocking support
- Test user accounts with known state

### 12. Onboarding & Help

#### FR-12.1: Guided Tours
- Interactive walkthroughs for each role
- Can skip or replay
- Contextual help (tour specific features)
- Tooltips on first use

#### FR-12.2: Help Center
- Searchable knowledge base
- Video tutorials
- FAQs by role
- Contact support

### 13. Undo/Redo

#### FR-13.1: Undo Capability
- Undo last action for:
  - Data entry (trial, event, duration)
  - Form edits
  - Program modifications
- Undo stack (multiple levels)
- Keyboard shortcut (Ctrl/Cmd+Z)

#### FR-13.2: Redo Capability
- Redo undone action
- Redo stack
- Keyboard shortcut (Ctrl/Cmd+Shift+Z)

## Non-Functional Requirements

### Performance

| Requirement | Target | Priority |
|-------------|--------|----------|
| API response time (p95) | < 500ms | P0 |
| Data entry latency | < 100ms | P0 |
| Mobile app launch | < 2s | P1 |
| Graph rendering | < 1s (1000 points) | P1 |
| Report generation | < 30s (small), < 2min (large) | P2 |
| Offline sync | < 5s per 100 records | P1 |

### Scalability

- Support 100 concurrent users
- Handle 1000+ data points per student
- Store 2+ years of historical data
- Process 10,000 sync queue items/hour

### Security

- TLS 1.3 for all data in transit
- AES-256 encryption at rest
- No PHI in logs or error messages
- Password complexity requirements
- 2FA for admin and sensitive operations
- Session token rotation
- IP whitelisting (optional)
- Automated security scanning in CI

### Availability

- 99.5% uptime during school hours (7am-7pm local)
- Scheduled maintenance windows communicated 72h in advance
- <1 minute downtime for deployments
- Disaster recovery: RPO 1 hour, RTO 4 hours

### Compliance

- **HIPAA**: 
  - Business Associate Agreement required
  - Encryption at rest and in transit
  - Audit logging of all PHI access
  - Access controls and authentication
  - Incident response plan
- **FERPA** (if applicable to schools)
- **WCAG 2.1 AA**: Accessibility compliance

### Usability

- Mobile app works offline completely
- <3 taps to start data collection
- Consistent UI patterns across platforms
- Dark mode support
- Responsive design (tablet, phone, desktop)
- Touch targets minimum 44x44px

### Maintainability

- Code coverage >85%
- Automated test suite runs in <10 minutes
- TypeScript for type safety
- Documented component library
- ADRs for major technical decisions
- API versioning strategy

## Technical Requirements

### Frontend

**Web Application**:
- React 18+ with Next.js 14+
- TypeScript
- TailwindCSS for styling
- Zustand or Jotai for state management
- React Query for server state
- Recharts for visualizations

**Mobile Application**:
- React Native with Expo
- TypeScript
- Native UI components
- WatermelonDB or similar for offline storage
- React Navigation

### Backend

**Option A: Node.js**
- Fastify or Express
- TypeScript
- Prisma ORM
- Jest for testing

**Option B: Python**
- FastAPI
- Python 3.11+
- SQLAlchemy ORM
- Pydantic for validation
- pytest for testing

### Database

- PostgreSQL 15+ (primary database)
- TimescaleDB extension (time-series data)
- Redis 7+ (caching, session storage)
- S3 or Azure Blob (file storage)

### Infrastructure

- Container orchestration (Kubernetes or ECS)
- CI/CD with GitHub Actions
- Infrastructure as Code (Terraform)
- Monitoring (Prometheus + Grafana)
- Logging (ELK stack or CloudWatch)
- CDN for static assets

## Implementation Phases

### Phase 1: MVP (Months 1-3) - Core Data Collection
**Goal**: Enable basic data collection for RBTs

**Features**:
- User authentication (basic)
- Student list view
- Session start/end
- Discrete trial recording
- Frequency recording
- Duration recording
- Basic line graphs
- Offline sync
- Mobile app (iOS/Android)

**Success Criteria**:
- 10 students, 5 RBTs successfully collecting data for 4 weeks
- <5% data entry errors
- 95% offline sync success rate

### Phase 2: Analysis & Reporting (Months 4-6)
**Goal**: Enable BCBAs to analyze data and make decisions

**Features**:
- All data collection methods (intervals, ABC, task analysis)
- Multiple graph types
- Annotations and phase lines
- Automated trend analysis
- Basic reports (progress, parent summary)
- BCBA web dashboard
- Program templates

**Success Criteria**:
- BCBAs using system as primary analysis tool
- 50% reduction in time spent graphing
- Automated trend detection accuracy >80%

### Phase 3: Collaboration & Compliance (Months 7-9)
**Goal**: Full system rollout with compliance features

**Features**:
- Parent portal
- Notifications (in-app, push, email)
- Secure messaging
- Full audit logging
- 2FA implementation
- Advanced reports (insurance)
- Guided tours and demo mode
- Undo/redo

**Success Criteria**:
- 100 students, 100+ staff using system
- 90% user satisfaction
- HIPAA compliance audit passed
- 70% parent portal adoption

### Phase 4: Advanced Features (Months 10-12)
**Goal**: Differentiation and advanced capabilities

**Features**:
- Photo/video capture and analysis
- Voice-to-text and voice commands
- Predictive analytics
- Treatment plan libraries
- Bulk operations
- Custom report builder
- Integration APIs

**Success Criteria**:
- System handling full load without performance degradation
- 30% reduction in session documentation time (voice features)
- Positive ROI demonstrated

## Out of Scope (Future Considerations)

- Scheduling and calendar management
- Billing and insurance claim submission
- EHR integration
- Telehealth capabilities
- Staff payroll and time tracking
- Medication tracking
- Complete electronic health record system

## Dependencies & Assumptions

### Dependencies
- School provides WiFi in building (even if unreliable)
- Staff have smartphones (iOS 14+ or Android 10+)
- School IT approves app installation
- HIPAA Business Associate Agreement signed

### Assumptions
- Users have basic smartphone competency
- School has existing student management system
- Students are already enrolled and assigned to therapists
- Existing paper-based system can be referenced during transition

## Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Data loss during offline sync | Critical | Medium | Robust conflict resolution, persistent local storage, comprehensive testing |
| HIPAA violation | Critical | Low | Security audit, penetration testing, compliance training |
| Poor user adoption (RBTs) | High | Medium | User testing, iterative design, excellent onboarding, training program |
| Performance issues at scale | High | Medium | Load testing, query optimization, caching, monitoring |
| High staff turnover requires constant retraining | Medium | High | Guided tours, intuitive design, demo mode, documentation |

## Acceptance Criteria

System will be considered ready for production when:

1. **Functional Completeness**:
   - All P0 (MVP) features implemented and tested
   - All critical user workflows function end-to-end

2. **Performance**:
   - All performance targets met under load testing
   - Mobile app launches in <2s
   - Data entry latency <100ms

3. **Quality**:
   - >85% code coverage
   - Zero critical bugs
   - <5 medium bugs
   - All security scan findings addressed

4. **Compliance**:
   - HIPAA compliance audit passed
   - Accessibility WCAG AA compliance verified
   - Penetration test findings remediated

5. **User Validation**:
   - Pilot program completed successfully (4 weeks, 10 students, 5 RBTs)
   - User satisfaction >80%
   - <5% data entry error rate
   - 95% offline sync success

6. **Documentation**:
   - User guides for all roles
   - API documentation complete
   - System architecture documented
   - Runbooks for operations

---

**Approval**:

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | | | |
| School Administrator | | | |
| Lead BCBA | | | |
| Engineering Lead | | | |

**Last Updated**: 2025-12-10  
**Version**: 0.1.0
