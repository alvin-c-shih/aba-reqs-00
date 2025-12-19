# ABA System - Screen Flow Diagrams

## Document Overview

This document contains screen flow diagrams showing navigation paths through the system for each user role. Diagrams use Mermaid syntax for rendering.

---

## Authentication Flow

```mermaid
stateDiagram-v2
    [*] --> LoginScreen
    LoginScreen --> FirstLoginPasswordChange: First login with temp password
    LoginScreen --> RoleDashboard: Successful login (not first time)
    LoginScreen --> LoginScreen: Invalid credentials (show error)
    
    FirstLoginPasswordChange --> RoleDashboard: Password changed successfully
    
    RoleDashboard --> AdminDashboard: if role = Admin
    RoleDashboard --> BCBADashboard: if role = BCBA
    RoleDashboard --> RBTMobileHome: if role = RBT
    
    AdminDashboard --> LoginScreen: Logout
    BCBADashboard --> LoginScreen: Logout
    RBTMobileHome --> LoginScreen: Logout
    
    note right of LoginScreen
        UI Elements:
        - #login-email
        - #login-password
        - #login-submit
        - #login-error
    end note
    
    note right of FirstLoginPasswordChange
        UI Elements:
        - #change-password-modal
        - #current-password
        - #new-password
        - #confirm-password
        - #password-strength
    end note
```

---

## Admin User Flow

```mermaid
stateDiagram-v2
    [*] --> AdminDashboard
    
    AdminDashboard --> UserManagement: Click "Users"
    AdminDashboard --> SystemHealth: Click "System Health"
    AdminDashboard --> LoginScreen: Logout
    
    UserManagement --> CreateUserModal: Click "Create User" button (#create-user-btn)
    UserManagement --> EditUserModal: Click user row
    UserManagement --> UserManagement: Filter/Search/Sort users
    
    CreateUserModal --> UserManagement: User created successfully
    CreateUserModal --> UserManagement: Cancel
    
    EditUserModal --> UserManagement: Changes saved
    EditUserModal --> UserManagement: Cancel
    EditUserModal --> ConfirmDeactivateModal: Click "Deactivate" (#deactivate-user-btn)
    
    ConfirmDeactivateModal --> UserManagement: Confirmed (user deactivated)
    ConfirmDeactivateModal --> EditUserModal: Cancelled
    
    SystemHealth --> SystemHealth: Click "Refresh Metrics" (#refresh-metrics-btn)
    SystemHealth --> InstallDemoData: Click "Install Demo Data" (#install-demo-btn)
    SystemHealth --> ClearDemoData: Click "Clear Demo Data" (#clear-demo-btn)
    SystemHealth --> AdminDashboard: Back
    
    InstallDemoData --> SystemHealth: Demo data installed
    ClearDemoData --> SystemHealth: Demo data cleared
    
    note right of AdminDashboard
        UI Elements:
        - #env-banner
        - #users-nav-btn
        - #system-health-nav-btn
    end note
    
    note right of UserManagement
        UI Elements:
        - #users-table
        - #users-search
        - #users-role-filter
        - #users-status-filter
        - #create-user-btn
        - #users-count
    end note
    
    note right of SystemHealth
        UI Elements:
        - #db-row-counts
        - #users-row-count
        - #students-row-count
        - #programs-row-count
        - #sessions-row-count
        - #trials-row-count
        - #demo-data-status
    end note
```

---

## BCBA User Flow

```mermaid
stateDiagram-v2
    [*] --> BCBADashboard
    
    BCBADashboard --> StudentDetail: Click student card
    BCBADashboard --> CreateStudentModal: Click "Add Student" (#add-student-btn)
    BCBADashboard --> BCBADashboard: Search students (#student-search)
    BCBADashboard --> LoginScreen: Logout
    
    CreateStudentModal --> StudentDetail: Student created
    CreateStudentModal --> BCBADashboard: Cancel
    
    StudentDetail --> CreateTreatmentPlan: Click "Create Plan"
    StudentDetail --> EditStudent: Click "Edit Student"
    StudentDetail --> AssignRBTs: Click "Assign RBTs"
    StudentDetail --> ViewGraphs: Click "View Data"
    StudentDetail --> AddPastSession: Click "Add Past Session" (#add-past-session-btn)
    StudentDetail --> GenerateReport: Click "Generate Report" (#generate-report-btn)
    StudentDetail --> BCBADashboard: Back
    
    CreateTreatmentPlan --> CreateProgram: Click "Add Program"
    CreateTreatmentPlan --> StudentDetail: Plan saved
    CreateTreatmentPlan --> StudentDetail: Cancel
    
    CreateProgram --> AddTarget: Click "Add Target" (#add-target-btn)
    CreateProgram --> PreviewProgram: Click "Preview" (#preview-program-btn)
    CreateProgram --> CreateTreatmentPlan: Program saved
    
    AddTarget --> CreateProgram: Target added
    
    PreviewProgram --> CreateProgram: Back
    
    AssignRBTs --> StudentDetail: RBTs assigned
    
    ViewGraphs --> AddPhaseMarker: Click "Add Phase Marker" (#add-phase-marker-btn)
    ViewGraphs --> EditMarker: Click existing marker
    ViewGraphs --> ExportGraph: Click "Export" (#export-graph-btn)
    ViewGraphs --> StudentDetail: Back
    
    AddPhaseMarker --> ViewGraphs: Marker added
    AddPhaseMarker --> ViewGraphs: Cancel
    
    EditMarker --> ViewGraphs: Marker updated
    EditMarker --> DeleteMarker: Click "Delete" (#delete-marker-btn)
    
    DeleteMarker --> ViewGraphs: Marker deleted
    
    ExportGraph --> ViewGraphs: Export complete
    
    AddPastSession --> DataEntryForm: Session date selected
    
    DataEntryForm --> StudentDetail: Data saved
    DataEntryForm --> StudentDetail: Cancel
    
    GenerateReport --> ReportConfig: Configure report
    
    ReportConfig --> ReportProgress: Click "Generate" (#generate-pdf-btn)
    
    ReportProgress --> DownloadReport: Report ready
    
    DownloadReport --> StudentDetail: Download complete
    
    EditStudent --> StudentDetail: Changes saved
    EditStudent --> StudentDetail: Cancel
    
    note right of BCBADashboard
        UI Elements:
        - #env-banner
        - #bcba-student-list
        - #student-alert-badge
        - #add-student-btn
        - #student-search
    end note
    
    note right of ViewGraphs
        UI Elements:
        - #graph-program-select
        - #graph-date-range
        - #line-graph
        - #bar-chart
        - #phase-markers
        - #graph-legend
        - #export-graph-btn
    end note
```

---

## RBT Mobile User Flow

```mermaid
stateDiagram-v2
    [*] --> RBTMobileHome
    
    RBTMobileHome --> ProgramSelect: Tap student card
    RBTMobileHome --> RBTMobileHome: Pull to refresh (#pull-to-refresh)
    RBTMobileHome --> RBTMobileHome: Toggle offline mode (#offline-hide-students-toggle)
    RBTMobileHome --> SyncData: Tap sync icon (#sync-icon)
    RBTMobileHome --> LoginScreen: Logout
    
    ProgramSelect --> CheckSessionLock: Tap program card
    ProgramSelect --> RBTMobileHome: Back (#back-btn)
    
    CheckSessionLock --> ShowLockWarning: Session locked by another user
    CheckSessionLock --> StartSession: Session available
    
    ShowLockWarning --> StealLock: Click "Steal Lock" (#steal-lock-btn)
    ShowLockWarning --> ProgramSelect: Cancel
    
    StealLock --> StartSession: Lock stolen
    
    StartSession --> DataCollectionScreen: Based on program method
    
    DataCollectionScreen --> FrequencyDataEntry: if method = Frequency
    DataCollectionScreen --> DurationDataEntry: if method = Duration
    DataCollectionScreen --> TrialDataEntry: if method = Trial-by-Trial
    
    FrequencyDataEntry --> AddSessionNotes: Click "Notes" (#add-notes-btn)
    FrequencyDataEntry --> EndSession: Click "End Session" (#end-session-btn)
    FrequencyDataEntry --> FrequencyDataEntry: Tap to count (#frequency-tap-area)
    FrequencyDataEntry --> FrequencyDataEntry: Undo (#undo-tap-btn)
    FrequencyDataEntry --> FrequencyDataEntry: Redo (#redo-tap-btn)
    
    DurationDataEntry --> AddSessionNotes: Click "Notes"
    DurationDataEntry --> EndSession: Click "End Session"
    DurationDataEntry --> DurationDataEntry: Start/Stop timer
    DurationDataEntry --> DurationDataEntry: Undo (#undo-duration-btn)
    DurationDataEntry --> DurationDataEntry: Redo (#redo-duration-btn)
    
    TrialDataEntry --> AddSessionNotes: Click "Notes"
    TrialDataEntry --> EndSession: Click "End Session"
    TrialDataEntry --> TrialDataEntry: Record trial outcome
    TrialDataEntry --> TrialDataEntry: Undo (#undo-trial-btn)
    TrialDataEntry --> TrialDataEntry: Redo (#redo-trial-btn)
    
    AddSessionNotes --> FrequencyDataEntry: if from Frequency
    AddSessionNotes --> DurationDataEntry: if from Duration
    AddSessionNotes --> TrialDataEntry: if from Trial
    
    EndSession --> SessionSummary: Show summary
    
    SessionSummary --> QuickGraph: Click "View Graph" (#view-graph-btn)
    SessionSummary --> QueueForSync: Click "Confirm & Save" (#confirm-save-btn)
    SessionSummary --> DataCollectionScreen: Cancel
    
    QueueForSync --> SyncNow: if online
    QueueForSync --> ProgramSelect: if offline (queued)
    
    SyncNow --> ProgramSelect: Sync successful
    SyncNow --> ShowSyncError: Sync failed
    
    ShowSyncError --> ProgramSelect: Retry later
    
    QuickGraph --> ProgramSelect: Back
    
    SyncData --> SyncProgress: Start sync
    
    SyncProgress --> SyncSuccess: All data synced
    SyncProgress --> SyncError: Sync failed
    SyncProgress --> LockConflict: Session locked during sync
    
    SyncSuccess --> RBTMobileHome: Show success message
    
    SyncError --> RBTMobileHome: Show error with retry option
    
    LockConflict --> HandleLockConflict: Show conflict modal
    
    HandleLockConflict --> ReclaimLock: Click "Continue Working" (#reclaim-lock-btn)
    HandleLockConflict --> DiscardChanges: Click "Discard Changes" (#discard-changes-btn)
    
    ReclaimLock --> RBTMobileHome: Lock reclaimed or failed
    
    DiscardChanges --> RBTMobileHome: Changes moved to drafts
    
    note right of RBTMobileHome
        UI Elements:
        - #env-banner
        - #mobile-student-list
        - #offline-banner
        - #offline-hide-students-toggle
        - #sync-status
        - #sync-icon
        - #sync-count-badge
    end note
    
    note right of DataCollectionScreen
        Frequency UI:
        - #frequency-tap-area
        - #frequency-counter
        - #undo-tap-btn
        - #redo-tap-btn
        
        Duration UI:
        - #start-duration-btn
        - #stop-duration-btn
        - #duration-timer
        - #duration-list
        
        Trial UI:
        - #trial-correct-btn
        - #trial-incorrect-btn
        - #trial-prompted-btn
        - #trial-no-response-btn
        - #trial-progress
    end note
```

---

## Guided Tour Flow

```mermaid
stateDiagram-v2
    [*] --> CheckFirstLogin
    
    CheckFirstLogin --> StartTour: First login = true
    CheckFirstLogin --> Dashboard: First login = false
    
    StartTour --> ShowWelcome: Display welcome message
    
    ShowWelcome --> RoleTour: Click "Start Tour"
    ShowWelcome --> Dashboard: Click "Skip Tour" (#tour-skip)
    
    RoleTour --> AdminTour: if role = Admin
    RoleTour --> BCBATour: if role = BCBA
    RoleTour --> RBTTour: if role = RBT
    
    AdminTour --> TourStep1: Highlight navigation
    BCBATour --> TourStep1: Highlight student list
    RBTTour --> TourStep1: Highlight student cards
    
    TourStep1 --> TourStep2: Click "Next" (#tour-next)
    TourStep1 --> Dashboard: Click "Skip" (#tour-skip)
    
    TourStep2 --> TourStep3: Click "Next"
    TourStep2 --> TourStep1: Click "Previous" (#tour-prev)
    TourStep2 --> Dashboard: Click "Skip"
    
    TourStep3 --> TourStepN: Continue through steps
    TourStep3 --> TourStep2: Click "Previous"
    TourStep3 --> Dashboard: Click "Skip"
    
    TourStepN --> TourComplete: Last step reached
    TourStepN --> Dashboard: Click "Skip"
    
    TourComplete --> Dashboard: Click "Finish"
    
    Dashboard --> RestartTour: Click "Restart Tour" in settings
    
    RestartTour --> StartTour: Restart confirmed
    
    note right of TourStep1
        UI Elements:
        - #tour-overlay
        - #tour-tooltip
        - #tour-step-counter
        - #tour-next
        - #tour-prev
        - #tour-skip
    end note
```

---

## Session Lock Management Flow

```mermaid
sequenceDiagram
    participant RBT1 as RBT #1 Mobile
    participant Server as Backend Server
    participant Lock as Lock Manager
    participant RBT2 as RBT #2 Mobile
    
    Note over RBT1: Starts session for Student A, Program X
    RBT1->>Server: POST /sessions/start {student_id, program_id}
    Server->>Lock: Check if session locked
    Lock-->>Server: No active lock
    Server->>Lock: Create lock (RBT1, expires in 15 min)
    Lock-->>Server: Lock created
    Server-->>RBT1: 200 OK {session_id, lock_token}
    
    Note over RBT1: Collecting data...
    
    Note over RBT1: Every 10 minutes
    RBT1->>Server: POST /sessions/{id}/renew-lock
    Server->>Lock: Extend lock expiration
    Lock-->>Server: Lock extended
    Server-->>RBT1: 200 OK
    
    Note over RBT1: Connection lost (15+ minutes)
    
    Note over RBT2: Tries to start same session
    RBT2->>Server: POST /sessions/start {student_id, program_id}
    Server->>Lock: Check if session locked
    Lock-->>Server: Locked by RBT1 (expired)
    Server->>Lock: Remove expired lock
    Server->>Lock: Create lock (RBT2)
    Lock-->>Server: Lock created
    Server-->>RBT2: 200 OK {session_id, lock_token, warning: "Previous session was abandoned"}
    
    Note over RBT1: Connection restored, tries to save
    RBT1->>Server: POST /sessions/{id}/trials {lock_token}
    Server->>Lock: Verify lock token
    Lock-->>Server: Token invalid (RBT2 has lock)
    Server-->>RBT1: 409 Conflict {message: "Session locked by RBT2", locked_by: "Jane Doe"}
    
    Note over RBT1: Shows lock conflict banner
    RBT1->>RBT1: User decides to reclaim lock
    RBT1->>Server: POST /sessions/{id}/steal-lock
    Server->>Lock: Remove RBT2's lock
    Server->>Lock: Create lock (RBT1)
    Lock-->>Server: Lock stolen
    Server->>RBT2: WebSocket notification (lock stolen)
    Server-->>RBT1: 200 OK {lock_token}
    
    Note over RBT2: Shows lock stolen banner
    Note over RBT2: User's unsaved data moved to drafts
```

---

## Offline Sync Flow

```mermaid
sequenceDiagram
    participant RBT as RBT Mobile App
    participant LocalDB as Local Storage
    participant Server as Backend Server
    participant DB as PostgreSQL
    
    Note over RBT: Working offline
    RBT->>LocalDB: Save session data with timestamp
    LocalDB-->>RBT: Queued (shown in #sync-count-badge)
    
    Note over RBT: More offline sessions...
    RBT->>LocalDB: Save session 2
    RBT->>LocalDB: Save session 3
    
    Note over RBT: WiFi restored
    RBT->>RBT: Auto-detect connection
    RBT->>LocalDB: Get pending sync items
    LocalDB-->>RBT: [session1, session2, session3]
    
    RBT->>Server: POST /sync/batch {sessions: [...]}
    Server->>Server: Validate JWT token
    
    loop For each session
        Server->>DB: Check if session exists
        alt Session doesn't exist
            Server->>DB: INSERT session
            Server->>DB: INSERT trials/data points
        else Session exists (conflict)
            Server->>DB: Compare timestamps
            alt RBT data is newer
                Server->>DB: UPDATE session
            else Server data is newer
                Server->>Server: Mark as conflict
            end
        end
    end
    
    Server-->>RBT: 200 OK {synced: [1,2], conflicts: [3]}
    
    RBT->>LocalDB: Mark sessions 1,2 as synced
    RBT->>LocalDB: Keep session 3 for manual resolution
    
    alt Has conflicts
        RBT->>RBT: Show notification (#sync-error)
        Note over RBT: User can review conflicts later
    else No conflicts
        RBT->>RBT: Show success (#sync-success)
        RBT->>LocalDB: Clear synced items
    end
```

---

## Undo/Redo State Management

```mermaid
stateDiagram-v2
    [*] --> EmptyStack
    
    EmptyStack --> StackWithHistory: User makes change
    
    StackWithHistory --> StackWithHistory: User makes another change (push to undo stack)
    StackWithHistory --> StackAfterUndo: User clicks Undo (#undo-btn)
    StackWithHistory --> EmptyStack: User submits form (clear stacks)
    StackWithHistory --> EmptyStack: User navigates away (clear stacks)
    
    StackAfterUndo --> StackWithHistory: User makes new change (clear redo stack)
    StackAfterUndo --> StackAfterUndo: User clicks Undo again
    StackAfterUndo --> StackAfterRedo: User clicks Redo (#redo-btn)
    
    StackAfterRedo --> StackWithHistory: Redo complete
    StackAfterRedo --> StackAfterRedo: User clicks Redo again (if multiple redos available)
    
    note right of EmptyStack
        Undo button: disabled
        Redo button: disabled
    end note
    
    note right of StackWithHistory
        Undo button: enabled
        Redo button: disabled
        Undo stack: [change1, change2, ...]
        Redo stack: []
    end note
    
    note right of StackAfterUndo
        Undo button: enabled (if more history)
        Redo button: enabled
        Undo stack: [change1]
        Redo stack: [change2]
    end note
```

---

## JWT Token Refresh Flow

```mermaid
sequenceDiagram
    participant User as User Browser/Mobile
    participant Frontend as Frontend App
    participant API as Backend API
    participant Auth as Auth Service
    
    Note over User: User logs in
    User->>API: POST /auth/login {email, password}
    API->>Auth: Validate credentials
    Auth-->>API: Valid
    API->>Auth: Generate tokens
    Auth-->>API: {access_token (15 min), refresh_token (7 days)}
    API-->>User: 200 OK {access_token, refresh_token}
    
    Note over Frontend: Store tokens securely
    Frontend->>Frontend: localStorage.setItem('access_token')
    Frontend->>Frontend: localStorage.setItem('refresh_token')
    
    Note over Frontend: Making API requests
    Frontend->>API: GET /students (Authorization: Bearer {access_token})
    API-->>Frontend: 200 OK {students: [...]}
    
    Note over Frontend: 13 minutes later (2 min before expiry)
    Frontend->>Frontend: Check token expiration
    Frontend->>API: POST /auth/refresh {refresh_token}
    API->>Auth: Validate refresh token
    Auth-->>API: Valid
    API->>Auth: Generate new access token
    Auth-->>API: {access_token (15 min)}
    API-->>Frontend: 200 OK {access_token}
    Frontend->>Frontend: Update stored access_token
    
    Note over Frontend: Continue working...
    
    Note over Frontend: Access token expired (didn't refresh)
    Frontend->>API: GET /students (Authorization: Bearer {expired_token})
    API-->>Frontend: 401 Unauthorized
    Frontend->>Frontend: Attempt token refresh
    Frontend->>API: POST /auth/refresh {refresh_token}
    
    alt Refresh token valid
        API-->>Frontend: 200 OK {access_token}
        Frontend->>API: Retry GET /students
        API-->>Frontend: 200 OK {students}
    else Refresh token expired
        API-->>Frontend: 401 Unauthorized
        Frontend->>Frontend: Show session expired modal (#session-expired-modal)
        Frontend->>User: Redirect to login
    end
    
    Note over Frontend: Offline scenario (mobile)
    Frontend->>API: GET /students (no connection)
    Frontend->>Frontend: Check if token expired
    
    alt Token expired but less than 7 days offline
        Frontend->>Frontend: Extend token lifetime locally
        Frontend->>Frontend: Serve from cache
    else More than 7 days offline
        Frontend->>Frontend: Force re-login when online
    end
```

---

**Next Steps:**
1. Review and approve screen flows
2. Create detailed UI mockups for each screen
3. Create data model/schema diagrams

---

**Document Version:** 1.0  
**Last Updated:** 2025-12-10  
**Status:** Draft - Awaiting Review
