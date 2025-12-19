# BCBA Interface UI Mockups

## BCBA Dashboard

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [#env-banner] DEMO MODE | Role: BCBA | 2025-12-10 14:30:45 | Dr. Jane Smith | [Logout]│
└────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                        │
│  ┌──────────────────┐  ┌──────────────────────────────────────────────────────────┐  │
│  │                  │  │                                                          │  │
│  │  📊 Dashboard    │  │  My Students                     [#add-student-btn] +   │  │
│  │     ← →          │  │                                                          │  │
│  │  👥 All Students │  │  [#student-search] 🔍 Search students...                │  │
│  │                  │  │                                                          │  │
│  │  📈 Reports      │  │  [#bcba-student-list]                                   │  │
│  │                  │  │  ┌──────────────────┐  ┌──────────────────┐            │  │
│  │  ⚙️ Settings     │  │  │  [Student Card]  │  │  [Student Card]  │            │  │
│  │                  │  │  │  ┌────────────┐  │  │  ┌────────────┐  │            │  │
│  │                  │  │  │  │   [Photo]  │  │  │  │   [Photo]  │  │            │  │
│  └──────────────────┘  │  │  └────────────┘  │  │  └────────────┘  │            │  │
│                        │  │  John Smith      │  │  Mary Johnson    │            │  │
│                        │  │  Age: 8          │  │  Age: 10 [#student-alert-badge]│  │
│                        │  │  5 Active Prog.  │  │  4 Active Prog. ⚠️            │  │
│                        │  │  Last: 2h ago    │  │  Last: 1 day ago │            │  │
│                        │  └──────────────────┘  └──────────────────┘            │  │
│                        │                                                          │  │
│                        │  ┌──────────────────┐  ┌──────────────────┐            │  │
│                        │  │  Tommy Lee       │  │  Sarah Williams  │            │  │
│                        │  │  Age: 7          │  │  Age: 9          │            │  │
│                        │  │  3 Active Prog.  │  │  6 Active Prog.  │            │  │
│                        │  │  Last: 30 min    │  │  Last: 3 hours   │            │  │
│                        │  └──────────────────┘  └──────────────────┘            │  │
│                        │                                                          │  │
│                        │  Showing 4 of 12 students                                │  │
│                        │                                                          │  │
│                        └──────────────────────────────────────────────────────────┘  │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

**Student Card Features:**
- Click anywhere on card to view student details
- Alert badge (⚠️) shows if: No data in 3 days, program needs attention, or flagged by RBT
- Hover effect: slight elevation, cursor pointer
- Photo placeholder if no photo uploaded

**Testing IDs:**
- `#bcba-student-list` - Student cards container
- `#student-alert-badge` - Alert indicator
- `#add-student-btn` - Add new student button
- `#student-search` - Search input

---

## Create Student Profile

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                        │
│  ╔══════════════════════════════════════════════════════════════════════════════════╗ │
│  ║  [#create-student-modal]                                         [#undo-btn]     ║ │
│  ║                                                                  [#redo-btn]     ║ │
│  ║  Create New Student Profile                                                      ║ │
│  ║                                                                                   ║ │
│  ║  ┌──────────────────────┐  ┌──────────────────────┐                             ║ │
│  ║  │  First Name [#student-first-name]│  Last Name  [#student-last-name]          ║ │
│  ║  │  ┌────────────────┐  │  │  ┌────────────────┐  │                             ║ │
│  ║  │  │  John          │  │  │  │  Smith         │  │                             ║ │
│  ║  │  └────────────────┘  │  │  └────────────────┘  │                             ║ │
│  ║  └──────────────────────┘  └──────────────────────┘                             ║ │
│  ║                                                                                   ║ │
│  ║  ┌────────────────────────────────────────────────────────────────────────────┐  ║ │
│  ║  │  Date of Birth                                    [#student-dob]           │  ║ │
│  ║  │  ┌──────────────────────────────────────────────────────────────────────┐  │  ║ │
│  ║  │  │  2017-03-15                                          [📅]            │  │  ║ │
│  ║  │  └──────────────────────────────────────────────────────────────────────┘  │  ║ │
│  ║  │  Age: 8 years old                                                          │  ║ │
│  ║  └────────────────────────────────────────────────────────────────────────────┘  ║ │
│  ║                                                                                   ║ │
│  ║  ┌────────────────────────────────────────────────────────────────────────────┐  ║ │
│  ║  │  Student ID (optional)                            [#student-id]            │  ║ │
│  ║  │  ┌──────────────────────────────────────────────────────────────────────┐  │  ║ │
│  ║  │  │  STU-2025-001                                                        │  │  ║ │
│  ║  │  └──────────────────────────────────────────────────────────────────────┘  │  ║ │
│  ║  └────────────────────────────────────────────────────────────────────────────┘  ║ │
│  ║                                                                                   ║ │
│  ║  ┌────────────────────────────────────────────────────────────────────────────┐  ║ │
│  ║  │  Photo (optional)                                 [#student-photo-upload]  │  ║ │
│  ║  │  ┌────────────┐                                                           │  ║ │
│  ║  │  │            │  [Upload Photo] [Remove]                                  │  ║ │
│  ║  │  │  Preview   │                                                           │  ║ │
│  ║  │  │            │  Recommended: Square image, max 5MB                       │  ║ │
│  ║  │  └────────────┘                                                           │  ║ │
│  ║  └────────────────────────────────────────────────────────────────────────────┘  ║ │
│  ║                                                                                   ║ │
│  ║  ┌────────────────────────────────────────────────────────────────────────────┐  ║ │
│  ║  │  [#student-media-consent]                                                  │  ║ │
│  ║  │  ☑ Video/Photo consent obtained from parent/guardian                      │  ║ │
│  ║  └────────────────────────────────────────────────────────────────────────────┘  ║ │
│  ║                                                                                   ║ │
│  ║  ┌────────────────────────────────────────────────────────────────────────────┐  ║ │
│  ║  │  Additional Notes (optional)                      [#student-notes]         │  ║ │
│  ║  │  ┌──────────────────────────────────────────────────────────────────────┐  │  ║ │
│  ║  │  │  Diagnosis: ASD Level 2                                              │  │  ║ │
│  ║  │  │  Allergies: None                                                     │  │  ║ │
│  ║  │  │  Preferred reinforcers: iPad time, stickers                          │  │  ║ │
│  ║  │  │                                                                      │  │  ║ │
│  ║  │  └──────────────────────────────────────────────────────────────────────┘  │  ║ │
│  ║  └────────────────────────────────────────────────────────────────────────────┘  ║ │
│  ║                                                                                   ║ │
│  ║  [#student-create-success] - Hidden until creation                               ║ │
│  ║                                                                                   ║ │
│  ║  ┌──────────────────────────┐  ┌────────────────────────┐                       ║ │
│  ║  │   Create Student         │  │        Cancel          │                       ║ │
│  ║  └──────────────────────────┘  └────────────────────────┘                       ║ │
│  ║                                                                                   ║ │
│  ╚══════════════════════════════════════════════════════════════════════════════════╝ │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

**After Creation:**
- Success message: "✓ Student created successfully!"
- Redirects to Student Detail page
- Auto-assigns current BCBA to student

**Testing IDs:**
- `#create-student-modal` - Modal container
- `#student-first-name` - First name input
- `#student-last-name` - Last name input
- `#student-dob` - Date of birth picker
- `#student-id` - Student ID input
- `#student-photo-upload` - Photo upload control
- `#student-media-consent` - Consent checkbox
- `#student-notes` - Notes textarea
- `#student-create-success` - Success message

---

## Student Detail Page

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [#env-banner] DEMO MODE | Role: BCBA | 2025-12-10 14:30:45 | Dr. Jane Smith | [Logout]│
└────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                        │
│  [← Back to Students]                                                                  │
│                                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                 │  │
│  │  ┌────────────┐  John Smith, Age 8                                            │  │
│  │  │            │  Student ID: STU-2025-001                                      │  │
│  │  │   Photo    │  DOB: 2017-03-15                                               │  │
│  │  │            │  Media Consent: ✓ Yes                                          │  │
│  │  └────────────┘                                                                │  │
│  │                                                                                 │  │
│  │  [Edit Profile] [Generate Report] [Add Past Session]                           │  │
│  │                                                                                 │  │
│  └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│  │  📋 Tabs:  [Programs ←]  [Data & Graphs]  [Sessions]  [RBT Assignment]        │  │
│  └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│  │  Programs Tab [Active]                                                          │  │
│  │                                                                                 │  │
│  │  ┌────────────────────────────────────────┐  [+ Create New Program]            │  │
│  │  │ Treatment Plan: Winter 2025            │                                    │  │
│  │  │ Start Date: 2024-12-01                 │                                    │  │
│  │  │ Status: Active                         │                                    │  │
│  │  └────────────────────────────────────────┘                                    │  │
│  │                                                                                 │  │
│  │  Active Programs (5):                                                           │  │
│  │                                                                                 │  │
│  │  ┌───────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │  1. Receptive Labels - Objects                                            │ │  │
│  │  │     Method: Trial-by-Trial | Mastery: 80% across 3 sessions               │ │  │
│  │  │     Current: 75% (2 sessions) | Status: In Progress                       │ │  │
│  │  │     Assigned to: RBT John Doe                                             │ │  │
│  │  │     [View Data] [Edit] [Pause]                                            │ │  │
│  │  └───────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                 │  │
│  │  ┌───────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │  2. Manding for Preferred Items                                           │ │  │
│  │  │     Method: Frequency | Mastery: 10 mands per session for 5 sessions      │ │  │
│  │  │     Current: 15 mands (last session) | Status: Mastered ✓                 │ │  │
│  │  │     Assigned to: RBT Jane Smith                                           │ │  │
│  │  │     [View Data] [Edit] [Archive]                                          │ │  │
│  │  └───────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                 │  │
│  │  ┌───────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │  3. Matching Colors ⚠️ Needs Attention                                    │ │  │
│  │  │     Method: Trial-by-Trial | Mastery: 90% for 3 sessions                  │ │  │
│  │  │     Current: 45% (No progress in 10 sessions)                             │ │  │
│  │  │     Assigned to: RBT John Doe                                             │ │  │
│  │  │     [View Data] [Edit] [Modify Plan]                                      │ │  │
│  │  └───────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                 │  │
│  │  [Show more...] (2 more programs)                                              │  │
│  │                                                                                 │  │
│  └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

**Tab Navigation:**
- **Programs**: List all active/paused/archived programs
- **Data & Graphs**: View all data visualizations
- **Sessions**: History of all data collection sessions
- **RBT Assignment**: Manage which RBTs work with this student

**Program Status Indicators:**
- In Progress: Normal
- Mastered: Green checkmark ✓
- Needs Attention: Orange warning ⚠️ (no progress, regression)

**Testing IDs:**
- `#student-detail-tabs` - Tab navigation
- `#programs-tab` - Programs tab content
- `#program-list` - List of programs
- `#create-program-btn` - Create new program button

---

## Create Program with Targets

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                        │
│  ╔══════════════════════════════════════════════════════════════════════════════════╗ │
│  ║  [#create-program-modal]                                        [#undo-btn]      ║ │
│  ║                                                                 [#redo-btn]      ║ │
│  ║  Create New Program                                                              ║ │
│  ║                                                                                   ║ │
│  ║  ┌────────────────────────────────────────────────────────────────────────────┐  ║ │
│  ║  │  Program Name                                     [#program-name]          │  ║ │
│  ║  │  ┌──────────────────────────────────────────────────────────────────────┐  │  ║ │
│  ║  │  │  Receptive Labels - Animals                                          │  │  ║ │
│  ║  │  └──────────────────────────────────────────────────────────────────────┘  │  ║ │
│  ║  └────────────────────────────────────────────────────────────────────────────┘  ║ │
│  ║                                                                                   ║ │
│  ║  ┌────────────────────────────────────────────────────────────────────────────┐  ║ │
│  ║  │  Description                                      [#program-desc]          │  ║ │
│  ║  │  ┌──────────────────────────────────────────────────────────────────────┐  │  ║ │
│  ║  │  │  Student will identify animal pictures when named.                  │  │  ║ │
│  ║  │  │  Target animals: dog, cat, bird, fish, horse                        │  │  ║ │
│  ║  │  └──────────────────────────────────────────────────────────────────────┘  │  ║ │
│  ║  └────────────────────────────────────────────────────────────────────────────┘  ║ │
│  ║                                                                                   ║ │
│  ║  ┌────────────────────────────────────────────────────────────────────────────┐  ║ │
│  ║  │  Data Collection Method                           [#program-method]       │  ║ │
│  ║  │  ┌──────────────────────────────────────────────────────────────────────┐  │  ║ │
│  ║  │  │  Trial-by-Trial ▼                                                    │  │  ║ │
│  ║  │  ├──────────────────────────────────────────────────────────────────────┤  │  ║ │
│  ║  │  │  • Frequency/Event Recording                                         │  │  ║ │
│  ║  │  │  • Duration Recording                                                │  │  ║ │
│  ║  │  │  • Trial-by-Trial (Discrete Trial)     ← selected                   │  │  ║ │
│  ║  │  └──────────────────────────────────────────────────────────────────────┘  │  ║ │
│  ║  └────────────────────────────────────────────────────────────────────────────┘  ║ │
│  ║                                                                                   ║ │
│  ║  ┌────────────────────────────────────────────────────────────────────────────┐  ║ │
│  ║  │  Instructions for RBT                             [#program-instructions] │  ║ │
│  ║  │  ┌──────────────────────────────────────────────────────────────────────┐  │  ║ │
│  ║  │  │  1. Place 3 animal cards on table                                   │  │  ║ │
│  ║  │  │  2. Say "Touch [animal name]"                                       │  │  ║ │
│  ║  │  │  3. Wait 3 seconds for response                                     │  │  ║ │
│  ║  │  │  4. If correct, provide praise + token                              │  │  ║ │
│  ║  │  │  5. If incorrect, model correct response                            │  │  ║ │
│  ║  │  └──────────────────────────────────────────────────────────────────────┘  │  ║ │
│  ║  └────────────────────────────────────────────────────────────────────────────┘  ║ │
│  ║                                                                                   ║ │
│  ║  ┌────────────────────────────────────────────────────────────────────────────┐  ║ │
│  ║  │  Mastery Criteria                                 [#program-mastery]      │  ║ │
│  ║  │  ┌──────────────────────────────────────────────────────────────────────┐  │  ║ │
│  ║  │  │  80% accuracy across 3 consecutive sessions                          │  │  ║ │
│  ║  │  └──────────────────────────────────────────────────────────────────────┘  │  ║ │
│  ║  │  (Custom formula - can be any text)                                       │  ║ │
│  ║  └────────────────────────────────────────────────────────────────────────────┘  ║ │
│  ║                                                                                   ║ │
│  ║  ───────────────────────────────────────────────────────────────────────────────  ║ │
│  ║                                                                                   ║ │
│  ║  Targets                                              [#add-target-btn] + Add    ║ │
│  ║                                                                                   ║ │
│  ║  ┌────────────────────────────────────────────────────────────────────────────┐  ║ │
│  ║  │  Target 1: Dog                                    [#target-name]    [Remove]│  ║ │
│  ║  │  ┌──────────────────────────────────────────────────────────────────────┐  │  ║ │
│  ║  │  │  Description: [#target-desc]                                         │  │  ║ │
│  ║  │  │  Student touches picture of dog when asked "Touch dog"              │  │  ║ │
│  ║  │  │                                                                      │  │  ║ │
│  ║  │  │  Correct Response: [#target-correct-response]                       │  │  ║ │
│  ║  │  │  Touches dog picture within 3 seconds, no prompts                   │  │  ║ │
│  ║  │  └──────────────────────────────────────────────────────────────────────┘  │  ║ │
│  ║  └────────────────────────────────────────────────────────────────────────────┘  ║ │
│  ║                                                                                   ║ │
│  ║  ┌────────────────────────────────────────────────────────────────────────────┐  ║ │
│  ║  │  Target 2: Cat                                                        [Remove]│  ║ │
│  ║  │  ┌──────────────────────────────────────────────────────────────────────┐  │  ║ │
│  ║  │  │  Description: Student touches picture of cat when asked             │  │  ║ │
│  ║  │  │  Correct Response: Touches cat picture within 3 seconds             │  │  ║ │
│  ║  │  └──────────────────────────────────────────────────────────────────────┘  │  ║ │
│  ║  └────────────────────────────────────────────────────────────────────────────┘  ║ │
│  ║                                                                                   ║ │
│  ║  [+ Add Another Target]                                                          ║ │
│  ║                                                                                   ║ │
│  ║  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐          ║ │
│  ║  │ Preview for  │  │ Save as Draft│  │Create Program│  │   Cancel   │          ║ │
│  ║  │     RBT      │  │              │  │              │  │            │          ║ │
│  ║  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘          ║ │
│  ║  [#preview-       [#save-draft-btn] (Primary)                                   ║ │
│  ║   program-btn]                                                                   ║ │
│  ║                                                                                   ║ │
│  ╚══════════════════════════════════════════════════════════════════════════════════╝ │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

**Target Management:**
- Click "+ Add Another Target" to add unlimited targets
- Each target can be collapsed/expanded
- Targets can be reordered by dragging
- Remove button deletes target (with confirmation)

**Preview for RBT:**
- Shows how the program will appear in RBT mobile app
- Helps BCBA verify clarity of instructions

**Testing IDs:**
- `#create-program-modal` - Modal container
- `#program-name` - Program name input
- `#program-desc` - Description textarea
- `#program-method` - Data collection method dropdown
- `#program-instructions` - Instructions textarea
- `#program-mastery` - Mastery criteria input
- `#add-target-btn` - Add target button
- `#target-name` - Target name input
- `#target-desc` - Target description
- `#target-correct-response` - Correct response definition
- `#preview-program-btn` - Preview button
- `#save-draft-btn` - Save draft button

---

## Assign RBTs to Student

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [#env-banner] DEMO MODE | Role: BCBA | 2025-12-10 14:30:45 | Dr. Jane Smith | [Logout]│
└────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                        │
│  [← Back to Student Detail]                                                            │
│                                                                                        │
│  Student: John Smith                                                                   │
│                                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│  │  📋 Tabs:  [Programs]  [Data & Graphs]  [Sessions]  [RBT Assignment ←]        │  │
│  └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│  │  RBT Assignment [Active Tab]                          [#assign-rbts-section]    │  │
│  │                                                                                 │  │
│  │  Assign RBTs                                                                    │  │
│  │  ┌────────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │  [#rbt-select] Select RBTs to assign...              ▼                     │ │  │
│  │  ├────────────────────────────────────────────────────────────────────────────┤ │  │
│  │  │  ☐  John Doe (RBT) - Currently assigned to 8 students                     │ │  │
│  │  │  ☐  Jane Smith (RBT) - Currently assigned to 12 students                  │ │  │
│  │  │  ☐  Bob Wilson (RBT) - Currently assigned to 5 students                   │ │  │
│  │  │  ☑  Mary Johnson (RBT) - Currently assigned to 10 students                │ │  │
│  │  └────────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                 │  │
│  │  Currently Assigned RBTs (3):                          [#assigned-rbt-list]    │  │
│  │                                                                                 │  │
│  │  ┌───────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │  👤  Mary Johnson                                    [#remove-rbt-btn] ✕   │ │  │
│  │  │      Assigned: 2024-11-15                                                  │ │  │
│  │  │      Last Session: 2 hours ago                                             │ │  │
│  │  │      Total Sessions: 47                                                    │ │  │
│  │  └───────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                 │  │
│  │  ┌───────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │  👤  John Doe                                                         ✕   │ │  │
│  │  │      Assigned: 2024-12-01                                                  │ │  │
│  │  │      Last Session: Yesterday                                               │ │  │
│  │  │      Total Sessions: 12                                                    │ │  │
│  │  └───────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                 │  │
│  │  ┌───────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │  👤  Sarah Williams                                                    ✕   │ │  │
│  │  │      Assigned: 2024-11-20                                                  │ │  │
│  │  │      Last Session: 3 days ago                                              │ │  │
│  │  │      Total Sessions: 28                                                    │ │  │
│  │  └───────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                 │  │
│  │  Changes save automatically                                                    │  │
│  │                                                                                 │  │
│  └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

**Behavior:**
- Multi-select dropdown adds RBTs immediately
- Remove button (✕) removes RBT with confirmation
- Auto-saves all changes
- Notifications sent to RBTs when assigned/removed
- RBTs can immediately see student in their mobile app

**Testing IDs:**
- `#assign-rbts-section` - Assignment section container
- `#rbt-select` - Multi-select dropdown
- `#assigned-rbt-list` - List of assigned RBTs
- `#remove-rbt-btn` - Remove RBT button

---

**Related User Stories:**
- BCBA-001: View Dashboard
- BCBA-002: Create Student Profile
- BCBA-003: Create Treatment Plan
- BCBA-004: Create Program with Targets
- BCBA-005: Assign RBTs to Students

**Next Mockups:**
- Data visualization mockups (graphs, phase markers)
- RBT mobile interface mockups
- Guided tour mockups
