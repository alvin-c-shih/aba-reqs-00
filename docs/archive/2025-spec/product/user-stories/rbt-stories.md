# RBT User Stories

RBTs are direct service providers who spend their day working 1:1 with students, collecting data in real-time. Their interface must be fast, intuitive, and work offline.

---

## 🔴 US-001: Login and Authenticate {#us-001}

**As an** RBT  
**I want to** log in securely with my credentials  
**So that** I can access student data while maintaining HIPAA compliance

### Acceptance Criteria
- [ ] Login screen accepts username/email and password
- [ ] Optional 2FA code entry
- [ ] "Remember me" option for 7 days (biometric on mobile)
- [ ] Failed login attempts are logged (max 5 attempts)
- [ ] Session expires after 15 minutes of inactivity
- [ ] Clear error messages for authentication failures
- [ ] Offline: Can authenticate with cached credentials

### UI Mockup (Mobile)

```
┌────────────────────────────────────┐
│                                    │
│      [ABA App Logo]                │
│                                    │
│  ┌──────────────────────────────┐ │
│  │ Email or Username            │ │
│  │ jane.doe@school.edu          │ │
│  └──────────────────────────────┘ │
│                                    │
│  ┌──────────────────────────────┐ │
│  │ Password                     │ │
│  │ ••••••••••                   │ │
│  └──────────────────────────────┘ │
│                                    │
│  ┌──────────────────────────────┐ │
│  │ ☐ Remember me (7 days)       │ │
│  └──────────────────────────────┘ │
│                                    │
│  ┌──────────────────────────────┐ │
│  │       LOG IN                 │ │
│  └──────────────────────────────┘ │
│                                    │
│         Forgot Password?           │
│                                    │
│  ────────────────────────────────  │
│  Environment: PROD                 │
│  Version: 1.0.0                    │
└────────────────────────────────────┘
```

### Screen State Spec
See: [screen-states/auth/login.yaml](../../engineering/screen-states/auth/login.yaml)

### Related Components
- `LoginForm` - Authentication form
- `EnvironmentBanner` - Visual environment indicator
- `BiometricPrompt` - Touch ID / Face ID

### API Endpoints
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/2fa/verify`
- `POST /api/v1/auth/refresh`

### Test Scenarios
- Valid credentials → Successful login
- Invalid credentials → Error message
- 2FA enabled → Prompt for code
- Offline mode → Use cached credentials
- Max failed attempts → Account lockout

---

## 🔴 US-002: View Assigned Students {#us-002}

**As an** RBT  
**I want to** see a list of my assigned students  
**So that** I can quickly select who I'm working with

### Acceptance Criteria
- [ ] Shows only students assigned to me
- [ ] Displays student name (or ID if name hidden for privacy)
- [ ] Shows active programs count
- [ ] Indicates if student has pending data to sync
- [ ] Search/filter functionality
- [ ] Sorted by most recent session (default)
- [ ] Offline: Shows cached student list

### UI Mockup (Mobile)

```
┌────────────────────────────────────┐
│  ← My Students              ☰      │
├────────────────────────────────────┤
│  🔍 Search students...             │
├────────────────────────────────────┤
│                                    │
│  ┌──────────────────────────────┐ │
│  │ 👤 Student A                 │ │
│  │    5 active programs         │ │
│  │    Last session: 2h ago      │ │
│  │    ✓ Synced                  │ │
│  └──────────────────────────────┘ │
│                                    │
│  ┌──────────────────────────────┐ │
│  │ 👤 Student B                 │ │
│  │    3 active programs         │ │
│  │    Last session: Yesterday   │ │
│  │    ⏳ 15 items to sync       │ │
│  └──────────────────────────────┘ │
│                                    │
│  ┌──────────────────────────────┐ │
│  │ 👤 Student C                 │ │
│  │    2 active programs         │ │
│  │    Last session: 3 days ago  │ │
│  │    ✓ Synced                  │ │
│  └──────────────────────────────┘ │
│                                    │
│                                    │
└────────────────────────────────────┘
```

### Screen State Spec
See: [screen-states/rbt/student-list.yaml](../../engineering/screen-states/rbt/student-list.yaml)

### Related Components
- `StudentList` - List container
- `StudentCard` - Individual student item
- `SyncStatusIndicator` - Shows sync status
- `SearchBar` - Filter students

### API Endpoints
- `GET /api/v1/rbt/students` (returns assigned students)

---

## 🔴 US-003: Start a Session {#us-003}

**As an** RBT  
**I want to** start a data collection session for a student  
**So that** all data is grouped together with timestamp and duration

### Acceptance Criteria
- [ ] Select student from list
- [ ] View available programs for that student
- [ ] Select one or more programs to work on
- [ ] Session timer starts automatically
- [ ] Can add session notes at any time
- [ ] Visual indicator that session is active
- [ ] Offline: Session starts locally, syncs later

### UI Mockup (Mobile)

```
┌────────────────────────────────────┐
│  ← Student A                ⏱ 0:00│
├────────────────────────────────────┤
│  Select Programs:                  │
│                                    │
│  ┌──────────────────────────────┐ │
│  │ ☑ Receptive Identification   │ │
│  │   Trial by Trial             │ │
│  │   10 targets • Last: 80%     │ │
│  └──────────────────────────────┘ │
│                                    │
│  ┌──────────────────────────────┐ │
│  │ ☑ Requesting (Mand Training) │ │
│  │   Frequency Count            │ │
│  │   Last session: 12 mands     │ │
│  └──────────────────────────────┘ │
│                                    │
│  ┌──────────────────────────────┐ │
│  │ ☐ Aggression (Reduction)     │ │
│  │   Frequency + ABC            │ │
│  │   Last session: 3 instances  │ │
│  └──────────────────────────────┘ │
│                                    │
│  ┌──────────────────────────────┐ │
│  │ ☐ Task Analysis: Hand Wash   │ │
│  │   Task Analysis (8 steps)    │ │
│  │   Last: 6/8 independent      │ │
│  └──────────────────────────────┘ │
│                                    │
│  ┌──────────────────────────────┐ │
│  │     START SESSION            │ │
│  └──────────────────────────────┘ │
└────────────────────────────────────┘
```

### Screen State Spec
See: [screen-states/rbt/session-start.yaml](../../engineering/screen-states/rbt/session-start.yaml)

### Related Components
- `ProgramSelector` - Checkbox list of programs
- `SessionTimer` - Elapsed time display
- `ProgramCard` - Shows program details

### API Endpoints
- `GET /api/v1/students/{id}/programs`
- `POST /api/v1/sessions` (create session)

---

## 🔴 US-004: Record Trial Data (Discrete Trial) {#us-004}

**As an** RBT  
**I want to** quickly record correct/incorrect/prompted responses for each trial  
**So that** I can capture learning data without disrupting instruction

### Acceptance Criteria
- [ ] Large tap targets for correct/incorrect/prompted
- [ ] Haptic feedback on each tap
- [ ] Running count of responses visible
- [ ] Can undo last trial (with undo button)
- [ ] Supports rapid successive trials (< 1 second per entry)
- [ ] Can add notes to specific trials
- [ ] Shows current target/SD (discriminative stimulus)
- [ ] Offline: All trials saved locally

### UI Mockup (Mobile - Active Trial Recording)

```
┌────────────────────────────────────┐
│  ← Session: Student A      ⏱ 12:34│
├────────────────────────────────────┤
│  Receptive Identification          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                    │
│  Current Target:                   │
│  ┌──────────────────────────────┐ │
│  │                              │ │
│  │     "Touch the BALL"         │ │
│  │                              │ │
│  │   Field: 🏀 🚗 ✈️             │ │
│  │                              │ │
│  └──────────────────────────────┘ │
│                                    │
│  Trial Responses:                  │
│                                    │
│  ┌──────────────────────────────┐ │
│  │                              │ │
│  │         ✓                    │ │
│  │      CORRECT                 │ │
│  │                              │ │
│  │  Tap for independent correct │ │
│  └──────────────────────────────┘ │
│                                    │
│  ┌──────────────┐  ┌─────────────┐│
│  │      ◐       │  │      ✗      ││
│  │   PROMPTED   │  │  INCORRECT  ││
│  └──────────────┘  └─────────────┘│
│                                    │
│  ────────────────────────────────  │
│  Today: ✓✓◐✓✗✓✓✓ (6/8 = 75%)     │
│  [⎌ Undo Last] [+ Add Note]       │
└────────────────────────────────────┘
```

### Screen State Spec
See: [screen-states/rbt/trial-recording.yaml](../../engineering/screen-states/rbt/trial-recording.yaml)

### Related Components
- `TrialRecorder` - Main recording interface
- `TargetDisplay` - Shows current SD and materials
- `ResponseButton` - Large tap target (Correct/Prompted/Incorrect)
- `TrialHistory` - Visual history of responses
- `UndoButton` - Undo last entry

### API Endpoints
- `POST /api/v1/sessions/{id}/trials`
- `DELETE /api/v1/trials/{id}` (for undo)
- `PATCH /api/v1/trials/{id}` (for editing)

### Test Scenarios
- Rapid tapping (10 trials in 10 seconds) → All recorded
- Tap Undo → Last trial removed
- Offline mode → Trials queued for sync
- Add note to trial → Note associated with correct trial

---

## 🔴 US-005: Record Frequency/Event Data {#us-005}

**As an** RBT  
**I want to** count behavior occurrences with a simple counter  
**So that** I can track frequency of behaviors or spontaneous skills

### Acceptance Criteria
- [ ] Large + button to increment count
- [ ] Shows current count prominently
- [ ] Optional - button to decrement (undo)
- [ ] Can add timestamp note for each occurrence (optional)
- [ ] Shows rate per minute if session timer active
- [ ] Can reset counter for new observation period
- [ ] Offline: Counts saved locally

### UI Mockup (Mobile)

```
┌────────────────────────────────────┐
│  ← Session: Student A      ⏱ 18:22│
├────────────────────────────────────┤
│  Requesting (Mand Training)        │
│  Frequency Count                   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                    │
│                                    │
│           ┌──────────┐             │
│           │          │             │
│           │    15    │             │
│           │          │             │
│           │  mands   │             │
│           │          │             │
│           └──────────┘             │
│                                    │
│        Rate: 0.82 per minute       │
│                                    │
│                                    │
│  ┌──────────────────────────────┐ │
│  │                              │ │
│  │           +                  │ │
│  │                              │ │
│  │      ADD OCCURRENCE          │ │
│  │                              │ │
│  └──────────────────────────────┘ │
│                                    │
│  ┌──────────────┐  ┌─────────────┐│
│  │  - Remove    │  │ 📝 Add Note ││
│  └──────────────┘  └─────────────┘│
│                                    │
│  Recent:                           │
│  • 18:21 - Mand for "juice"        │
│  • 18:15 - Mand for "help"         │
│  • 18:12 - Mand for "break"        │
│                                    │
└────────────────────────────────────┘
```

### Screen State Spec
See: [screen-states/rbt/frequency-recording.yaml](../../engineering/screen-states/rbt/frequency-recording.yaml)

### Related Components
- `FrequencyCounter` - Main counter display and controls
- `EventLog` - List of recent occurrences with timestamps
- `RateCalculator` - Shows events per unit time

### API Endpoints
- `POST /api/v1/sessions/{id}/events`
- `DELETE /api/v1/events/{id}` (for remove)

---

## 🔴 US-006: Record Duration Data {#us-006}

**As an** RBT  
**I want to** time how long a behavior lasts  
**So that** I can track duration of behaviors or on-task time

### Acceptance Criteria
- [ ] Start/Stop button to time behavior
- [ ] Shows elapsed time during recording
- [ ] Can record multiple durations in one session
- [ ] Shows total duration and count
- [ ] Can add notes to each duration event
- [ ] Haptic/audio alert if behavior exceeds threshold (optional)
- [ ] Offline: Durations saved locally

### UI Mockup (Mobile - Timer Running)

```
┌────────────────────────────────────┐
│  ← Session: Student B      ⏱ 25:10│
├────────────────────────────────────┤
│  On-Task Behavior                  │
│  Duration Recording                │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                    │
│  Behavior In Progress:             │
│                                    │
│        ┌──────────────────┐        │
│        │                  │        │
│        │    00:03:42      │        │
│        │                  │        │
│        │    ⏸ Pause       │        │
│        │                  │        │
│        └──────────────────┘        │
│                                    │
│  ┌──────────────────────────────┐ │
│  │                              │ │
│  │      ■ STOP & SAVE          │ │
│  │                              │ │
│  └──────────────────────────────┘ │
│                                    │
│  ────────────────────────────────  │
│                                    │
│  Today's Summary:                  │
│  • Total: 28m 15s                  │
│  • Episodes: 5                     │
│  • Average: 5m 39s                 │
│  • Longest: 8m 22s                 │
│                                    │
│  Previous Durations:               │
│  • 8m 22s - 24:45                  │
│  • 5m 10s - 24:30                  │
└────────────────────────────────────┘
```

### Screen State Spec
See: [screen-states/rbt/duration-recording.yaml](../../engineering/screen-states/rbt/duration-recording.yaml)

### Related Components
- `DurationTimer` - Stopwatch interface
- `DurationSummary` - Aggregate statistics
- `DurationHistory` - Past duration events

### API Endpoints
- `POST /api/v1/sessions/{id}/durations/start`
- `POST /api/v1/sessions/{id}/durations/stop`

---

## 🔴 US-009: End Session and Add Notes {#us-009}

**As an** RBT  
**I want to** end my session and add summary notes  
**So that** the session is properly documented

### Acceptance Criteria
- [ ] Obvious "End Session" button
- [ ] Prompts for session notes if none added
- [ ] Shows session summary (duration, data collected)
- [ ] Option to use voice-to-text for notes
- [ ] Auto-saves session data
- [ ] Offline: Session ends locally, syncs when online
- [ ] Can add photos/videos (if feature enabled)

### UI Mockup (Mobile)

```
┌────────────────────────────────────┐
│  ← Session: Student A      ⏱ 32:15│
├────────────────────────────────────┤
│  End Session?                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                    │
│  Session Summary:                  │
│  • Duration: 32 minutes            │
│  • Programs: 2                     │
│    - Receptive ID: 24 trials       │
│    - Mand Training: 15 events      │
│                                    │
│  Session Notes:                    │
│  ┌──────────────────────────────┐ │
│  │ Student was engaged and      │ │
│  │ motivated. High success on   │ │
│  │ receptive ID program. Tried  │ │
│  │ new reinforcer (bubbles) -   │ │
│  │ worked well!                 │ │
│  │                              │ │
│  │ [🎤 Voice Input]              │ │
│  └──────────────────────────────┘ │
│                                    │
│  Additional:                       │
│  ┌──────────────┐  ┌─────────────┐│
│  │ 📷 Add Photo │  │ 🎥 Add Video││
│  └──────────────┘  └─────────────┘│
│                                    │
│  ┌──────────────────────────────┐ │
│  │      END SESSION             │ │
│  └──────────────────────────────┘ │
│                                    │
│  ┌──────────────────────────────┐ │
│  │      Cancel                  │ │
│  └──────────────────────────────┘ │
└────────────────────────────────────┘
```

### Screen State Spec
See: [screen-states/rbt/session-end.yaml](../../engineering/screen-states/rbt/session-end.yaml)

### Related Components
- `SessionSummary` - Recap of data collected
- `SessionNotesInput` - Text area with voice option
- `MediaUpload` - Photo/video capture

### API Endpoints
- `POST /api/v1/sessions/{id}/end`
- `POST /api/v1/sessions/{id}/notes`
- `POST /api/v1/sessions/{id}/media`

---

## 🔴 US-010: View Basic Progress Graphs {#us-010}

**As an** RBT  
**I want to** see simple graphs of student progress  
**So that** I get immediate feedback on effectiveness

### Acceptance Criteria
- [ ] Line graph of % correct over time (trial data)
- [ ] Bar chart of frequency counts by session
- [ ] Shows last 10 sessions by default
- [ ] Can zoom into today only
- [ ] Visual indicator if student is making progress
- [ ] Loads quickly (<1 second)
- [ ] Offline: Shows cached graph data

### UI Mockup (Mobile)

```
┌────────────────────────────────────┐
│  ← Student A: Receptive ID    [⋮] │
├────────────────────────────────────┤
│  Progress Graph                    │
│  [Last 10 Sessions ▼]              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                    │
│  100% ┤                       ●    │
│       │                    ●  │    │
│   80% ┤                 ●     │    │
│       │              ●        │    │
│   60% ┤           ●           │    │
│       │        ●              │    │
│   40% ┤     ●                 │    │
│       │  ●                    │    │
│   20% ┤                       │    │
│       │                       │    │
│    0% └───────────────────────┘    │
│       12/1  12/3  12/5  12/7 12/9  │
│                                    │
│  ✓ Progress: +15% over 10 sessions │
│                                    │
│  Latest Session (Today):           │
│  • Correct: 18/24 (75%)            │
│  • Prompted: 4/24 (17%)            │
│  • Incorrect: 2/24 (8%)            │
│                                    │
│  ────────────────────────────────  │
│                                    │
│  View Detailed Analysis →          │
│  (BCBA Only)                       │
│                                    │
└────────────────────────────────────┘
```

### Screen State Spec
See: [screen-states/rbt/progress-graph.yaml](../../engineering/screen-states/rbt/progress-graph.yaml)

### Related Components
- `LineGraph` - Chart visualization
- `ProgressIndicator` - Trend arrow/status
- `SessionStats` - Latest session breakdown

### API Endpoints
- `GET /api/v1/programs/{id}/graph-data?sessions=10`

---

## 🔴 US-011: Work Offline and Sync Later {#us-011}

**As an** RBT  
**I want to** collect data without internet connection  
**So that** I can work anywhere without worrying about WiFi

### Acceptance Criteria
- [ ] All data collection works offline
- [ ] Visual indicator showing offline status
- [ ] Data automatically syncs when connection restored
- [ ] Shows pending sync count
- [ ] Can manually trigger sync
- [ ] Conflict resolution if data changed on server
- [ ] No data loss during offline period
- [ ] Persistent local storage (not just memory)

### UI Mockup (Mobile - Offline Mode)

```
┌────────────────────────────────────┐
│  ⚠️ OFFLINE MODE            [⟳] Sync│
├────────────────────────────────────┤
│  45 items waiting to sync          │
├────────────────────────────────────┤
│                                    │
│  ← My Students                     │
│                                    │
│  ┌──────────────────────────────┐ │
│  │ 👤 Student A           📶❌  │ │
│  │    5 active programs         │ │
│  │    ⏳ 12 items to sync       │ │
│  └──────────────────────────────┘ │
│                                    │
│  ┌──────────────────────────────┐ │
│  │ 👤 Student B           📶❌  │ │
│  │    3 active programs         │ │
│  │    ⏳ 8 items to sync        │ │
│  └──────────────────────────────┘ │
│                                    │
│  ────────────────────────────────  │
│                                    │
│  💡 Tip: Data will sync            │
│     automatically when connected   │
│                                    │
│  ┌──────────────────────────────┐ │
│  │   🔄 RETRY SYNC NOW          │ │
│  └──────────────────────────────┘ │
│                                    │
│  Last successful sync:             │
│  12:34 PM (2 hours ago)            │
│                                    │
└────────────────────────────────────┘
```

### Screen State Spec
See: [screen-states/rbt/offline-sync.yaml](../../engineering/screen-states/rbt/offline-sync.yaml)

### Related Components
- `OfflineBanner` - Status indicator
- `SyncButton` - Manual sync trigger
- `SyncQueue` - Pending items list
- `ConflictResolver` - Handle data conflicts

### API Endpoints
- `POST /api/v1/sync/batch` (uploads queued data)
- `GET /api/v1/sync/status`

### Test Scenarios
- Airplane mode ON → All features work, data queued
- Connection restored → Auto-sync triggered
- Conflict: Same session edited on web → Show conflict UI
- Force quit app → Data persists, syncs on reopen

---

*More RBT stories (US-007, US-008, US-012, US-013, US-014) continued in extended documentation...*

---

**Summary**: RBT stories focus on speed, offline capability, and ease of use during direct instruction. The UI prioritizes large tap targets, minimal navigation, and instant feedback.
