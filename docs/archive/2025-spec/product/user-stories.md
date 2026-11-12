# ABA System - User Stories (Phase 1 MVP)

## Document Overview

This document contains user stories for Phase 1 MVP, organized by user role. Each story follows the format:

**As a** [role]  
**I want to** [action]  
**So that** [benefit]

**Acceptance Criteria:**
- Testable conditions that must be met
- UI elements referenced with IDs for testing

**UI References:** Links to mockup files

---

## Admin User Stories

### AUTH-001: Admin Login
**As an** Administrator  
**I want to** log in securely with my credentials  
**So that** I can access the system administration features

**Acceptance Criteria:**
- [ ] Login form displays with email and password fields (`#login-email`, `#login-password`)
- [ ] Submit button is disabled until both fields are filled (`#login-submit`)
- [ ] Invalid credentials show error message (`#login-error`)
- [ ] Successful login redirects to Admin Dashboard
- [ ] JWT token is stored securely
- [ ] Environment banner shows current environment, role (Admin), and timestamp (`#env-banner`)

**UI Reference:** [AUTH-Login.md](#)

---

### ADMIN-001: View User List
**As an** Administrator  
**I want to** view a list of all users in the system  
**So that** I can manage the user base

**Acceptance Criteria:**
- [ ] Users table displays with columns: Name, Email, Role, Status, Last Active (`#users-table`)
- [ ] Table is sortable by each column
- [ ] Table shows 25 users per page with pagination (`#users-pagination`)
- [ ] Search box filters users by name or email (`#users-search`)
- [ ] Role filter dropdown filters by Admin/BCBA/RBT (`#users-role-filter`)
- [ ] Status filter shows Active/Inactive users (`#users-status-filter`)
- [ ] Testability: Row count badge shows total users (`#users-count`)

**UI Reference:** [ADMIN-UserList.md](#)

---

### ADMIN-002: Create New User
**As an** Administrator  
**I want to** create a new user account  
**So that** staff members can access the system

**Acceptance Criteria:**
- [ ] "Create User" button opens creation modal (`#create-user-btn`, `#create-user-modal`)
- [ ] Form includes: First Name, Last Name, Email, Role dropdown (`#user-first-name`, `#user-last-name`, `#user-email`, `#user-role`)
- [ ] Email validation prevents duplicate emails
- [ ] Role dropdown shows: Admin, BCBA, RBT (`#user-role`)
- [ ] Temporary password is auto-generated and displayed once (`#user-temp-password`)
- [ ] "Copy Password" button copies to clipboard (`#copy-password-btn`)
- [ ] Success message shows after creation (`#user-create-success`)
- [ ] Undo/Redo buttons are available (`#undo-btn`, `#redo-btn`)
- [ ] User appears in user list immediately

**UI Reference:** [ADMIN-CreateUser.md](#)

---

### ADMIN-003: Edit User
**As an** Administrator  
**I want to** edit user details  
**So that** I can update information or change roles

**Acceptance Criteria:**
- [ ] Click user row opens edit modal (`#edit-user-modal`)
- [ ] Form pre-fills with current user data
- [ ] Can update: First Name, Last Name, Role
- [ ] Cannot edit: Email (identifier)
- [ ] "Reset Password" button generates new temp password (`#reset-password-btn`)
- [ ] Changes save immediately with success message
- [ ] Undo/Redo available for changes
- [ ] Audit log records the change

**UI Reference:** [ADMIN-EditUser.md](#)

---

### ADMIN-004: Deactivate/Reactivate User
**As an** Administrator  
**I want to** deactivate or reactivate user accounts  
**So that** I can manage access for staff who leave or return

**Acceptance Criteria:**
- [ ] Active users show "Deactivate" button (`#deactivate-user-btn`)
- [ ] Inactive users show "Reactivate" button (`#reactivate-user-btn`)
- [ ] Confirmation modal prevents accidental deactivation (`#confirm-deactivate-modal`)
- [ ] Deactivated users cannot log in
- [ ] Reactivated users receive email notification
- [ ] Status change is logged in audit trail

**UI Reference:** [ADMIN-UserStatus.md](#)

---

### ADMIN-005: View System Health Dashboard
**As an** Administrator  
**I want to** view system health metrics  
**So that** I can verify the system is working correctly and troubleshoot issues

**Acceptance Criteria:**
- [ ] Dashboard shows database table row counts (`#db-row-counts`)
  - Users count (`#users-row-count`)
  - Students count (`#students-row-count`)
  - Programs count (`#programs-row-count`)
  - Sessions count (`#sessions-row-count`)
  - Trials count (`#trials-row-count`)
- [ ] Shows demo data status (installed/not installed) (`#demo-data-status`)
- [ ] "Install Demo Data" button available if not installed (`#install-demo-btn`)
- [ ] "Clear Demo Data" button available if installed (`#clear-demo-btn`)
- [ ] Refresh button updates metrics (`#refresh-metrics-btn`)
- [ ] Last sync timestamp for mobile devices (`#last-sync-timestamp`)

**UI Reference:** [ADMIN-SystemHealth.md](#)

---

## BCBA User Stories

### BCBA-001: View Dashboard
**As a** BCBA  
**I want to** see an overview of my assigned students  
**So that** I can quickly identify who needs attention

**Acceptance Criteria:**
- [ ] Dashboard shows list of assigned students (`#bcba-student-list`)
- [ ] Each student card shows: Name, Photo, Active Programs Count, Last Session Date
- [ ] Alert badges show students flagged for attention (`#student-alert-badge`)
- [ ] "Add Student" button opens student creation form (`#add-student-btn`)
- [ ] Search box filters students by name (`#student-search`)
- [ ] Click student card navigates to student detail page

**UI Reference:** [BCBA-Dashboard.md](#)

---

### BCBA-002: Create Student Profile
**As a** BCBA  
**I want to** create a new student profile  
**So that** I can begin treatment planning

**Acceptance Criteria:**
- [ ] Form includes: First Name, Last Name, Date of Birth, Student ID (`#student-first-name`, `#student-last-name`, `#student-dob`, `#student-id`)
- [ ] Photo upload is optional (`#student-photo-upload`)
- [ ] Video/photo consent checkbox (`#student-media-consent`)
- [ ] Notes field for additional information (`#student-notes`)
- [ ] Undo/Redo available during form entry
- [ ] Success message after creation (`#student-create-success`)
- [ ] Redirects to student detail page

**UI Reference:** [BCBA-CreateStudent.md](#)

---

### BCBA-003: Create Treatment Plan
**As a** BCBA  
**I want to** create a treatment plan for a student  
**So that** I can define their therapy goals

**Acceptance Criteria:**
- [ ] Form includes: Plan Name, Start Date, End Date (optional), Goals/Objectives textarea (`#plan-name`, `#plan-start-date`, `#plan-end-date`, `#plan-goals`)
- [ ] Can add multiple programs within the plan
- [ ] Each program has: Name, Description, Data Collection Method (`#program-name`, `#program-description`, `#program-method`)
- [ ] Data collection method dropdown: Frequency, Duration, Trial-by-Trial (`#program-method`)
- [ ] Undo/Redo available
- [ ] Save as draft or publish (`#save-draft-btn`, `#publish-plan-btn`)

**UI Reference:** [BCBA-CreatePlan.md](#)

---

### BCBA-004: Create Program with Targets
**As a** BCBA  
**I want to** create a program with specific targets/goals  
**So that** RBTs know what skills to teach

**Acceptance Criteria:**
- [ ] Program form includes: Name, Description, Instructions, Mastery Criteria (`#program-name`, `#program-desc`, `#program-instructions`, `#program-mastery`)
- [ ] Can add multiple targets to a program (`#add-target-btn`)
- [ ] Each target has: Name, Description, Correct Response Definition (`#target-name`, `#target-desc`, `#target-correct-response`)
- [ ] Mastery criteria uses custom formula per program
- [ ] Preview how program appears to RBTs (`#preview-program-btn`)
- [ ] Undo/Redo available

**UI Reference:** [BCBA-CreateProgram.md](#)

---

### BCBA-005: Assign RBTs to Students
**As a** BCBA  
**I want to** assign RBTs to specific students  
**So that** RBTs can collect data for those students

**Acceptance Criteria:**
- [ ] Student detail page shows "Assign RBTs" section (`#assign-rbts-section`)
- [ ] Multi-select dropdown shows available RBTs (`#rbt-select`)
- [ ] Currently assigned RBTs show with "Remove" button (`#assigned-rbt-list`, `#remove-rbt-btn`)
- [ ] Changes save immediately
- [ ] RBTs receive notification of assignment
- [ ] Assigned RBTs can immediately see student in their mobile app

**UI Reference:** [BCBA-AssignRBT.md](#)

---

### BCBA-006: View Student Data Graphs
**As a** BCBA  
**I want to** view graphs of student progress  
**So that** I can analyze trends and make treatment decisions

**Acceptance Criteria:**
- [ ] Graph page shows program selector dropdown (`#graph-program-select`)
- [ ] Date range picker allows custom ranges (`#graph-date-range`)
- [ ] Line graph displays data over time with dates on X-axis, performance on Y-axis (`#line-graph`)
- [ ] Bar chart shows performance by session (`#bar-chart`)
- [ ] Can add treatment phase annotations/markers (`#add-phase-marker-btn`)
- [ ] Phase markers show on graph with labels (`#phase-markers`)
- [ ] Export graph as image or PDF (`#export-graph-btn`)
- [ ] Legend explains graph elements (`#graph-legend`)

**UI Reference:** [BCBA-DataGraphs.md](#)

---

### BCBA-007: Add Treatment Phase Annotation
**As a** BCBA  
**I want to** annotate graphs with treatment phase changes  
**So that** I can track which interventions were effective

**Acceptance Criteria:**
- [ ] "Add Phase Marker" button opens annotation modal (`#add-phase-marker-btn`, `#phase-marker-modal`)
- [ ] Form includes: Date, Phase Name, Description, Color (`#phase-date`, `#phase-name`, `#phase-description`, `#phase-color`)
- [ ] Color picker for marker line (`#phase-color`)
- [ ] Marker appears as vertical line on graph
- [ ] Hover shows phase details in tooltip
- [ ] Can edit or delete existing markers (`#edit-marker-btn`, `#delete-marker-btn`)

**UI Reference:** [BCBA-PhaseAnnotation.md](#)

---

### BCBA-008: Generate Progress Report
**As a** BCBA  
**I want to** generate a progress report for a student  
**So that** I can share results with stakeholders

**Acceptance Criteria:**
- [ ] "Generate Report" button opens report configuration modal (`#generate-report-btn`)
- [ ] Select report type: Progress Report (`#report-type`)
- [ ] Select date range (`#report-date-range`)
- [ ] Select which programs to include (multi-select) (`#report-programs`)
- [ ] Include graphs checkbox (`#report-include-graphs`)
- [ ] Generate button creates PDF (`#generate-pdf-btn`)
- [ ] Progress indicator during generation (`#report-progress`)
- [ ] Download link appears when ready (`#download-report-link`)
- [ ] Report includes: Student info, graphs, summary statistics

**UI Reference:** [BCBA-GenerateReport.md](#)

---

### BCBA-009: Edit Retrospective Data
**As a** BCBA  
**I want to** edit or add historical data  
**So that** I can correct errors or fill in missing sessions

**Acceptance Criteria:**
- [ ] "Add Past Session" button on student detail page (`#add-past-session-btn`)
- [ ] Date/time picker allows selecting any past date (`#session-datetime`)
- [ ] Data entry interface same as RBT real-time collection
- [ ] Edit existing sessions by clicking data point on graph
- [ ] Changes logged in audit trail
- [ ] Undo/Redo available

**UI Reference:** [BCBA-EditData.md](#)

---

## RBT User Stories

### RBT-001: View Assigned Students (Mobile)
**As an** RBT  
**I want to** see my assigned students on mobile  
**So that** I can select who I'm working with

**Acceptance Criteria:**
- [ ] Mobile home screen shows list of assigned students (`#mobile-student-list`)
- [ ] Each student card shows: Photo, Name, Active Programs count
- [ ] Offline mode banner shows when not connected (`#offline-banner`)
- [ ] Offline mode option to hide unrelated students (`#offline-hide-students-toggle`)
- [ ] Tap student card navigates to program selection
- [ ] Pull-to-refresh syncs latest data (`#pull-to-refresh`)
- [ ] Sync status indicator shows last sync time (`#sync-status`)

**UI Reference:** [RBT-Mobile-StudentList.md](#)

---

### RBT-002: Select Program for Session (Mobile)
**As an** RBT  
**I want to** select a program to work on  
**So that** I can begin data collection

**Acceptance Criteria:**
- [ ] Program selection screen shows available programs for student (`#program-list`)
- [ ] Each program card shows: Name, Description, Last session date
- [ ] Tap program opens data collection method screen
- [ ] Back button returns to student list (`#back-btn`)
- [ ] Programs cached for offline access (last 30 days)

**UI Reference:** [RBT-Mobile-ProgramSelect.md](#)

---

### RBT-003: Start Data Collection Session (Mobile)
**As an** RBT  
**I want to** start a data collection session  
**So that** I can record trials during therapy

**Acceptance Criteria:**
- [ ] "Start Session" button begins session and timer (`#start-session-btn`, `#session-timer`)
- [ ] Attempt to start checks for existing session lock
- [ ] If locked by another user, show banner with user name and "Steal Lock" option (`#lock-warning-banner`, `#steal-lock-btn`)
- [ ] Session lock acquired for 15 minutes
- [ ] Lock auto-renews every 10 minutes while active
- [ ] Timer displays elapsed time in MM:SS format (`#session-timer`)
- [ ] Session data stored locally until synced

**UI Reference:** [RBT-Mobile-StartSession.md](#)

---

### RBT-004: Collect Frequency Data (Mobile)
**As an** RBT  
**I want to** record frequency/event data with simple taps  
**So that** I can quickly count behaviors without interrupting therapy

**Acceptance Criteria:**
- [ ] Large tap area for recording event (`#frequency-tap-area`)
- [ ] Counter displays current count prominently (`#frequency-counter`)
- [ ] Haptic feedback on each tap (if device supports)
- [ ] Undo last tap button (`#undo-tap-btn`)
- [ ] Redo tap button if undo was used (`#redo-tap-btn`)
- [ ] Undo/Redo icons visible and easily accessible
- [ ] Reset counter button with confirmation (`#reset-counter-btn`)
- [ ] Session timer visible at top
- [ ] End session button saves data (`#end-session-btn`)

**UI Reference:** [RBT-Mobile-FrequencyData.md](#)

---

### RBT-005: Collect Duration Data (Mobile)
**As an** RBT  
**I want to** record duration of behaviors  
**So that** I can track how long behaviors last

**Acceptance Criteria:**
- [ ] "Start Timer" button begins duration tracking (`#start-duration-btn`)
- [ ] Timer shows elapsed time for current instance (`#duration-timer`)
- [ ] "Stop Timer" button ends current instance (`#stop-duration-btn`)
- [ ] List shows all recorded durations for session (`#duration-list`)
- [ ] Can undo last duration entry (`#undo-duration-btn`)
- [ ] Can redo if undo was used (`#redo-duration-btn`)
- [ ] Total session duration displayed (`#total-duration`)
- [ ] End session button saves all durations

**UI Reference:** [RBT-Mobile-DurationData.md](#)

---

### RBT-006: Collect Trial-by-Trial Data (Mobile)
**As an** RBT  
**I want to** record discrete trial outcomes  
**So that** I can track skill acquisition

**Acceptance Criteria:**
- [ ] Current target/trial number displayed (`#current-trial`)
- [ ] Large buttons for: Correct, Incorrect, Prompted, No Response (`#trial-correct-btn`, `#trial-incorrect-btn`, `#trial-prompted-btn`, `#trial-no-response-btn`)
- [ ] Buttons are color-coded (green, red, yellow, gray)
- [ ] Haptic feedback on button press
- [ ] Trial auto-advances to next after selection
- [ ] Undo last trial button (`#undo-trial-btn`)
- [ ] Redo trial if undo was used (`#redo-trial-btn`)
- [ ] Progress bar shows trials completed (`#trial-progress`)
- [ ] Summary stats show % correct in session (`#trial-summary`)
- [ ] End session button saves all trials

**UI Reference:** [RBT-Mobile-TrialData.md](#)

---

### RBT-007: Add Session Notes (Mobile)
**As an** RBT  
**I want to** add notes during or after a session  
**So that** I can document important observations

**Acceptance Criteria:**
- [ ] Notes button opens notes modal (`#add-notes-btn`, `#notes-modal`)
- [ ] Text area for typing notes (`#session-notes`)
- [ ] Notes saved with session
- [ ] Undo/Redo available in notes field
- [ ] Can add notes before ending session
- [ ] Notes visible to BCBA when reviewing data

**UI Reference:** [RBT-Mobile-SessionNotes.md](#)

---

### RBT-008: End Session and Review (Mobile)
**As an** RBT  
**I want to** end the session and see a summary  
**So that** I can confirm data before syncing

**Acceptance Criteria:**
- [ ] "End Session" button shows summary modal (`#end-session-btn`, `#session-summary-modal`)
- [ ] Summary shows: Duration, Total trials/events, Performance summary
- [ ] Option to add final notes (`#final-notes`)
- [ ] "Confirm & Save" button saves session (`#confirm-save-btn`)
- [ ] Session lock is released
- [ ] Data queued for sync if offline
- [ ] Data syncs immediately if online
- [ ] Success message shows (`#session-save-success`)

**UI Reference:** [RBT-Mobile-EndSession.md](#)

---

### RBT-009: View Quick Feedback Graph (Mobile)
**As an** RBT  
**I want to** see immediate visual feedback after a session  
**So that** I can gauge student progress

**Acceptance Criteria:**
- [ ] After ending session, "View Graph" button appears (`#view-graph-btn`)
- [ ] Simple line graph shows last 10 sessions (`#quick-feedback-graph`)
- [ ] Current session highlighted on graph
- [ ] X-axis shows dates, Y-axis shows performance metric
- [ ] Swipe between programs if multiple
- [ ] Back button returns to student list (`#back-btn`)

**UI Reference:** [RBT-Mobile-QuickGraph.md](#)

---

### RBT-010: Sync Offline Data (Mobile)
**As an** RBT  
**I want to** sync my offline data when connection is restored  
**So that** BCBAs can see the latest data

**Acceptance Criteria:**
- [ ] Sync icon shows pending items count (`#sync-icon`, `#sync-count-badge`)
- [ ] Tap sync icon triggers manual sync (`#manual-sync-btn`)
- [ ] Progress indicator during sync (`#sync-progress`)
- [ ] Success message when complete (`#sync-success`)
- [ ] Error message if sync fails with retry option (`#sync-error`, `#retry-sync-btn`)
- [ ] Auto-sync occurs when WiFi connection detected
- [ ] Conflict resolution: If session locked by another user during sync, show warning

**UI Reference:** [RBT-Mobile-Sync.md](#)

---

### RBT-011: Handle Session Lock Conflict (Mobile)
**As an** RBT  
**I want to** be notified if someone takes over my session  
**So that** I don't lose data

**Acceptance Criteria:**
- [ ] Banner notification appears when lock is stolen (`#lock-stolen-banner`)
- [ ] Banner shows who took the lock
- [ ] Options: "Continue Working" (try to reclaim lock) or "Discard Changes" (`#reclaim-lock-btn`, `#discard-changes-btn`)
- [ ] If continue, attempts to steal lock back
- [ ] If discard, local unsaved data is moved to draft folder
- [ ] Drafts can be reviewed later and manually merged

**UI Reference:** [RBT-Mobile-LockConflict.md](#)

---

## Cross-Role Stories

### COMMON-001: First-Time Login & Password Change
**As a** new user  
**I want to** change my temporary password on first login  
**So that** my account is secure

**Acceptance Criteria:**
- [ ] After first login with temp password, forced password change modal appears (`#change-password-modal`)
- [ ] Form requires: Current Password, New Password, Confirm Password (`#current-password`, `#new-password`, `#confirm-password`)
- [ ] Password strength indicator (`#password-strength`)
- [ ] Minimum requirements shown: 8 chars, 1 uppercase, 1 number, 1 special char
- [ ] Cannot proceed until password changed
- [ ] Success message after change (`#password-change-success`)

**UI Reference:** [COMMON-FirstLogin.md](#)

---

### COMMON-002: Guided Tour/Onboarding
**As a** new user  
**I want to** see a guided tour of the interface  
**So that** I can quickly learn how to use the system

**Acceptance Criteria:**
- [ ] Tour starts automatically for first-time users (can skip)
- [ ] Tour highlights key UI elements with overlay arrows/tooltips (`#tour-overlay`, `#tour-tooltip`)
- [ ] Different tours for each role (Admin, BCBA, RBT)
- [ ] Step counter shows progress (e.g., "Step 3 of 8") (`#tour-step-counter`)
- [ ] Next/Previous/Skip buttons (`#tour-next`, `#tour-prev`, `#tour-skip`)
- [ ] Tour can be restarted from settings menu (`#restart-tour-btn`)
- [ ] Tour uses demo data if available

**UI Reference:** [COMMON-GuidedTour.md](#)

---

### COMMON-003: View Environment Banner
**As a** user  
**I want to** always see which environment I'm in  
**So that** I don't confuse demo/dev/QA/production data

**Acceptance Criteria:**
- [ ] Banner always visible at top of screen (`#env-banner`)
- [ ] Shows: Environment name, Current role, Current timestamp (`#env-name`, `#user-role`, `#current-time`)
- [ ] Different colors per environment:
  - Demo: Blue background
  - Dev: Green background
  - QA: Yellow background
  - Prod: Red background
- [ ] Timestamp updates every second
- [ ] Banner is sticky (stays visible when scrolling)

**UI Reference:** [COMMON-EnvBanner.md](#)

---

### COMMON-004: Undo/Redo Actions in Forms
**As a** user  
**I want to** undo and redo my changes in forms  
**So that** I can correct mistakes without retyping

**Acceptance Criteria:**
- [ ] Undo button visible on all forms (`#undo-btn`)
- [ ] Redo button visible on all forms (`#redo-btn`)
- [ ] Keyboard shortcuts: Ctrl+Z (undo), Ctrl+Y or Ctrl+Shift+Z (redo)
- [ ] Undo stack persists within form session
- [ ] Stack cleared on form submit or navigation away
- [ ] Undo/Redo works for: Text fields, dropdowns, checkboxes, radio buttons
- [ ] Disabled state when no undo/redo available
- [ ] Toast notification shows "Undone" or "Redone" (`#undo-toast`)

**UI Reference:** [COMMON-UndoRedo.md](#)

---

### COMMON-005: JWT Token Refresh
**As a** user  
**I want to** stay logged in without interruption  
**So that** I don't lose work due to session expiration

**Acceptance Criteria:**
- [ ] Access token expires after 15 minutes
- [ ] Refresh token expires after 7 days
- [ ] System auto-refreshes access token 2 minutes before expiry (when online)
- [ ] If refresh fails, show "Session Expired" modal (`#session-expired-modal`)
- [ ] Modal offers "Login Again" button (`#relogin-btn`)
- [ ] On mobile, if offline during refresh window, token lifetime extended until next online sync
- [ ] After 7 days offline, force re-login

**UI Reference:** [COMMON-TokenRefresh.md](#)

---

## Demo Mode Stories

### DEMO-001: View Demo Environment
**As a** potential customer  
**I want to** explore the system with demo data  
**So that** I can evaluate features without affecting real data

**Acceptance Criteria:**
- [ ] Demo environment clearly labeled with blue banner
- [ ] Demo data includes:
  - 5 students with realistic profiles
  - 1 Admin, 1 BCBA, 1 RBT user
  - Historical data for last 90 days
  - Examples of: mastery, no progress, regression, baseline, multiple change points
- [ ] Demo mode fully functional (all features work)
- [ ] Data resets daily at midnight
- [ ] "Reset Demo Data" button in admin panel (`#reset-demo-btn`)

**UI Reference:** [DEMO-Overview.md](#)

---

**Next Steps:**
1. Review and approve user stories
2. Create screen flow diagrams
3. Create detailed UI mockups for each screen
4. Create architectural diagrams for session locking and offline sync

---

**Document Version:** 1.0  
**Last Updated:** 2025-12-10  
**Status:** Draft - Awaiting Review
