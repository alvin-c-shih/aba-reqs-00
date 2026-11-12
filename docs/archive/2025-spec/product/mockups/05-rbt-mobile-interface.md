# RBT Mobile Interface UI Mockups

## Mobile Home Screen - Student List

```
┌─────────────────────────────────┐
│ [#env-banner]                   │
│ DEMO │ RBT │ 14:30:45           │
│ John Doe                  [⚙]   │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│                                 │
│  My Students                    │
│                                 │
│  [#mobile-student-list]         │
│                                 │
│  ┌───────────────────────────┐  │
│  │  ┌──────┐                 │  │
│  │  │Photo │  John Smith     │  │
│  │  │      │  Age: 8         │  │
│  │  └──────┘  5 Programs     │  │
│  │            Last: 2h ago   │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │  ┌──────┐                 │  │
│  │  │Photo │  Mary Johnson ⚠│  │
│  │  │      │  Age: 10        │  │
│  │  └──────┘  4 Programs     │  │
│  │            Last: 1 day    │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │  ┌──────┐                 │  │
│  │  │Photo │  Tommy Lee      │  │
│  │  │      │  Age: 7         │  │
│  │  └──────┘  3 Programs     │  │
│  │            Last: 30 min   │  │
│  └───────────────────────────┘  │
│                                 │
│  [Pull down to refresh]         │
│  [#pull-to-refresh]             │
│                                 │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ [#sync-status]                  │
│ [#offline-banner - if offline]  │
│ ⚠️ Offline Mode                 │
│ Last synced: 15 min ago         │
│ [#offline-hide-students-toggle] │
│ [ ] Hide unrelated students     │
│                                 │
│ [#sync-icon] ⟳ Sync (2)        │
│ [#sync-count-badge]             │
└─────────────────────────────────┘

Bottom Navigation:
┌─────────────────────────────────┐
│ [👥]     [📊]      [⚙️]        │
│Students  Graphs   Settings      │
└─────────────────────────────────┘
```

**Interactions:**
- Tap student card to view programs
- Pull down to refresh syncs data
- Alert badge (⚠) shows flagged students
- Offline toggle hides students not in cache
- Sync badge shows pending uploads

**Testing IDs:**
- `#mobile-student-list` - Student list container
- `#offline-banner` - Offline mode banner
- `#offline-hide-students-toggle` - Hide students toggle
- `#pull-to-refresh` - Pull to refresh gesture
- `#sync-status` - Sync status indicator
- `#sync-icon` - Sync icon button
- `#sync-count-badge` - Pending sync count

---

## Program Selection Screen

```
┌─────────────────────────────────┐
│ [#env-banner]                   │
│ DEMO │ RBT │ 14:32:18           │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│                                 │
│  [← Back] [#back-btn]           │
│                                 │
│  John Smith, Age 8              │
│                                 │
│  Select Program                 │
│                                 │
│  [#program-list]                │
│                                 │
│  ┌───────────────────────────┐  │
│  │ Receptive Labels          │  │
│  │ Animals                   │  │
│  │                           │  │
│  │ Method: Trial-by-Trial    │  │
│  │ Mastery: 80% × 3 sessions │  │
│  │ Last: Yesterday           │  │
│  │ Status: In Progress       │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ Manding for Preferred     │  │
│  │ Items                     │  │
│  │                           │  │
│  │ Method: Frequency         │  │
│  │ Mastery: 10 mands × 5     │  │
│  │ Last: 2 hours ago         │  │
│  │ Status: Mastered ✓        │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ Matching Colors     ⚠️     │  │
│  │                           │  │
│  │ Method: Trial-by-Trial    │  │
│  │ Mastery: 90% × 3 sessions │  │
│  │ Last: 3 days ago          │  │
│  │ Status: Needs Attention   │  │
│  └───────────────────────────┘  │
│                                 │
│  [Show archived programs]       │
│                                 │
└─────────────────────────────────┘
```

**Status Indicators:**
- In Progress: Normal styling
- Mastered: Green checkmark ✓
- Needs Attention: Orange warning ⚠️
- Paused: Gray text

**Testing IDs:**
- `#back-btn` - Back button
- `#program-list` - Programs list container
- `#program-card` - Individual program cards

---

## Session Lock Warning

```
┌─────────────────────────────────┐
│ [#env-banner]                   │
│ DEMO │ RBT │ 14:35:22           │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│                                 │
│  [#lock-warning-banner]         │
│  ┌───────────────────────────┐  │
│  │ ⚠️ Session In Use          │  │
│  │                           │  │
│  │ Mary Johnson is currently │  │
│  │ collecting data for this  │  │
│  │ program.                  │  │
│  │                           │  │
│  │ Started: 10 minutes ago   │  │
│  │                           │  │
│  │ You can take over, but    │  │
│  │ their unsaved work may be │  │
│  │ affected.                 │  │
│  │                           │  │
│  │ ┌───────────────────────┐ │  │
│  │ │ [#steal-lock-btn]     │ │  │
│  │ │ Take Over Session     │ │  │
│  │ └───────────────────────┘ │  │
│  │                           │  │
│  │ [Cancel]                  │  │
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

**Warning Behavior:**
- Shows who has the lock
- Shows how long they've had it
- Warning about affecting their work
- Requires explicit confirmation

**Testing IDs:**
- `#lock-warning-banner` - Warning banner
- `#steal-lock-btn` - Steal lock button
- `#cancel-lock-btn` - Cancel button

---

## Start Session Screen

```
┌─────────────────────────────────┐
│ [#env-banner]                   │
│ DEMO │ RBT │ 14:36:15           │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│                                 │
│  [← Back]                       │
│                                 │
│  John Smith                     │
│  Receptive Labels - Animals     │
│                                 │
│  ┌───────────────────────────┐  │
│  │ Program Instructions      │  │
│  │                           │  │
│  │ 1. Place 3 animal cards   │  │
│  │    on table               │  │
│  │ 2. Say "Touch [animal]"   │  │
│  │ 3. Wait 3 seconds         │  │
│  │ 4. If correct: praise +   │  │
│  │    token                  │  │
│  │ 5. If incorrect: model    │  │
│  │    correct response       │  │
│  │                           │  │
│  │ Mastery Criteria:         │  │
│  │ 80% accuracy across 3     │  │
│  │ consecutive sessions      │  │
│  └───────────────────────────┘  │
│                                 │
│  Current Progress:              │
│  75% (Last 2 sessions)          │
│                                 │
│  Materials Needed:              │
│  • Animal picture cards         │
│  • Token board                  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ [#start-session-btn]      │  │
│  │                           │  │
│  │    Start Session          │  │
│  │                           │  │
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

**Testing IDs:**
- `#start-session-btn` - Start session button
- `#program-instructions` - Instructions display

---

## Frequency Data Collection

```
┌─────────────────────────────────┐
│ [#env-banner]                   │
│ DEMO │ RBT │ 14:38:42           │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│                                 │
│  [← End] John Smith             │
│                                 │
│  Manding for Preferred Items    │
│                                 │
│  [#session-timer]               │
│  ⏱ 08:42 (elapsed)              │
│                                 │
│  ┌───────────────────────────┐  │
│  │                           │  │
│  │                           │  │
│  │   [#frequency-counter]    │  │
│  │                           │  │
│  │         15                │  │
│  │                           │  │
│  │      (Tap to count)       │  │
│  │  [#frequency-tap-area]    │  │
│  │                           │  │
│  │                           │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌──────────┐  ┌──────────┐    │
│  │ [#undo-  │  │ [#redo-  │    │
│  │  btn]    │  │  btn]    │    │
│  │  ↶ Undo  │  │  ↷ Redo  │    │
│  └──────────┘  └──────────┘    │
│                                 │
│  ┌───────────────────────────┐  │
│  │ [#reset-counter-btn]      │  │
│  │ Reset Counter             │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ [#add-notes-btn]          │  │
│  │ 📝 Add Notes              │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ [#end-session-btn]        │  │
│  │                           │  │
│  │    End Session            │  │
│  │                           │  │
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

**Haptic Feedback:**
- Tap counter: Light haptic
- Undo/Redo: Medium haptic
- End session: Success haptic

**Testing IDs:**
- `#session-timer` - Session timer
- `#frequency-tap-area` - Tap area for counting
- `#frequency-counter` - Counter display
- `#undo-btn` - Undo button
- `#redo-btn` - Redo button
- `#reset-counter-btn` - Reset button
- `#add-notes-btn` - Add notes button
- `#end-session-btn` - End session button

---

## Duration Data Collection

```
┌─────────────────────────────────┐
│ [#env-banner]                   │
│ DEMO │ RBT │ 14:42:18           │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│                                 │
│  [← End] John Smith             │
│                                 │
│  On-Task Behavior Duration      │
│                                 │
│  [#session-timer]               │
│  ⏱ 12:18 (session)              │
│                                 │
│  Current Instance:              │
│  [#duration-timer]              │
│  ┌───────────────────────────┐  │
│  │                           │  │
│  │       02:34               │  │
│  │                           │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ [#start-duration-btn]     │  │
│  │    ▶ Start Timer          │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ [#stop-duration-btn]      │  │
│  │    ■ Stop Timer           │  │
│  └───────────────────────────┘  │
│  (Disabled when not running)    │
│                                 │
│  ┌──────────┐  ┌──────────┐    │
│  │ ↶ Undo   │  │ ↷ Redo   │    │
│  │ [#undo-  │  │ [#redo-  │    │
│  │duration- │  │duration- │    │
│  │btn]      │  │btn]      │    │
│  └──────────┘  └──────────┘    │
│                                 │
│  Recorded Durations:            │
│  [#duration-list]               │
│  ┌───────────────────────────┐  │
│  │ 1. 03:45  [✕]             │  │
│  │ 2. 02:12  [✕]             │  │
│  │ 3. 04:01  [✕]             │  │
│  │ 4. 02:34  (current)       │  │
│  └───────────────────────────┘  │
│                                 │
│  [#total-duration]              │
│  Total: 12:32                   │
│                                 │
│  [📝 Add Notes]                 │
│  [End Session]                  │
│                                 │
└─────────────────────────────────┘
```

**Timer Behavior:**
- Start button begins new instance
- Stop button ends current instance
- Timer continues in background if app minimized
- Undo removes last recorded duration

**Testing IDs:**
- `#duration-timer` - Current instance timer
- `#start-duration-btn` - Start timer button
- `#stop-duration-btn` - Stop timer button
- `#undo-duration-btn` - Undo button
- `#redo-duration-btn` - Redo button
- `#duration-list` - List of recorded durations
- `#total-duration` - Total duration display

---

## Trial-by-Trial Data Collection

```
┌─────────────────────────────────┐
│ [#env-banner]                   │
│ DEMO │ RBT │ 14:45:33           │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│                                 │
│  [← End] John Smith             │
│                                 │
│  Receptive Labels - Animals     │
│                                 │
│  [#session-timer]               │
│  ⏱ 04:33                        │
│                                 │
│  [#current-trial]               │
│  Trial 8 of 10                  │
│  Target: Cat                    │
│                                 │
│  [#trial-progress]              │
│  ████████████████░░░░  80%      │
│  6 Correct, 1 Prompted, 0 Inc.  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ [#trial-correct-btn]      │  │
│  │                           │  │
│  │      ✓  CORRECT           │  │
│  │                           │  │
│  └───────────────────────────┘  │
│  (Green, large touch target)    │
│                                 │
│  ┌───────────────────────────┐  │
│  │ [#trial-incorrect-btn]    │  │
│  │      ✗  INCORRECT         │  │
│  └───────────────────────────┘  │
│  (Red)                          │
│                                 │
│  ┌───────────────────────────┐  │
│  │ [#trial-prompted-btn]     │  │
│  │      ⚠  PROMPTED          │  │
│  └───────────────────────────┘  │
│  (Yellow)                       │
│                                 │
│  ┌───────────────────────────┐  │
│  │ [#trial-no-response-btn]  │  │
│  │      ○  NO RESPONSE       │  │
│  └───────────────────────────┘  │
│  (Gray)                         │
│                                 │
│  ┌──────────┐  ┌──────────┐    │
│  │ ↶ Undo   │  │ [#trial- │    │
│  │ [#undo-  │  │ summary] │    │
│  │trial-btn]│  │ Summary  │    │
│  └──────────┘  └──────────┘    │
│                                 │
│  [📝 Add Notes]                 │
│  [End Session]                  │
│                                 │
└─────────────────────────────────┘
```

**Button Behavior:**
- Large touch targets for quick tapping
- Haptic feedback on tap
- Auto-advances to next trial after selection
- Color coded for quick identification
- Shows which target is current

**Trial Summary Modal:**
```
┌─────────────────────────────────┐
│ [#trial-summary]                │
│                                 │
│  Session Summary                │
│                                 │
│  ┌───────────────────────────┐  │
│  │ Target  │ Correct │ %     │  │
│  ├─────────┼─────────┼───────┤  │
│  │ Dog     │ 8/10    │ 80%   │  │
│  │ Cat     │ 7/10    │ 70%   │  │
│  │ Bird    │ 9/10    │ 90%   │  │
│  └───────────────────────────┘  │
│                                 │
│  Overall: 24/30 (80%)           │
│  Prompted: 4                    │
│  Incorrect: 2                   │
│                                 │
│  [Close]                        │
│                                 │
└─────────────────────────────────┘
```

**Testing IDs:**
- `#current-trial` - Trial counter
- `#trial-progress` - Progress bar
- `#trial-correct-btn` - Correct button
- `#trial-incorrect-btn` - Incorrect button
- `#trial-prompted-btn` - Prompted button
- `#trial-no-response-btn` - No response button
- `#undo-trial-btn` - Undo button
- `#trial-summary` - Summary display

---

## Add Session Notes Modal

```
┌─────────────────────────────────┐
│                                 │
│  [#notes-modal]                 │
│  ┌───────────────────────────┐  │
│  │ Session Notes         [✕] │  │
│  │                           │  │
│  │ [#session-notes]          │  │
│  │ ┌───────────────────────┐ │  │
│  │ │ John was very engaged │ │  │
│  │ │ today. He responded   │ │  │
│  │ │ quickly to all trials.│ │  │
│  │ │                       │ │  │
│  │ │ Note: Had to fade     │ │  │
│  │ │ prompts earlier than  │ │  │
│  │ │ expected due to high  │ │  │
│  │ │ accuracy.             │ │  │
│  │ │                       │ │  │
│  │ │                       │ │  │
│  │ └───────────────────────┘ │  │
│  │ 125 characters            │  │
│  │                           │  │
│  │ ┌──────────┐ ┌──────────┐│  │
│  │ │  Save    │ │  Cancel  ││  │
│  │ └──────────┘ └──────────┘│  │
│  │                           │  │
│  │ Undo/Redo available       │  │
│  │ [↶]  [↷]                  │  │
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

**Notes Features:**
- Character counter
- Undo/Redo in text field
- Auto-saves draft locally
- Optional voice-to-text (future)

**Testing IDs:**
- `#notes-modal` - Notes modal
- `#session-notes` - Notes textarea
- `#save-notes-btn` - Save button
- `#cancel-notes-btn` - Cancel button

---

## End Session Summary

```
┌─────────────────────────────────┐
│ [#env-banner]                   │
│ DEMO │ RBT │ 14:52:08           │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│                                 │
│  [#session-summary-modal]       │
│  ┌───────────────────────────┐  │
│  │ Session Complete      [✕] │  │
│  │                           │  │
│  │ John Smith                │  │
│  │ Receptive Labels          │  │
│  │                           │  │
│  │ Duration: 15:42           │  │
│  │ Total Trials: 30          │  │
│  │                           │  │
│  │ Performance:              │  │
│  │ • Correct: 24 (80%)       │  │
│  │ • Prompted: 4 (13%)       │  │
│  │ • Incorrect: 2 (7%)       │  │
│  │ • No Response: 0          │  │
│  │                           │  │
│  │ Progress:                 │  │
│  │ ████████████████░░  80%   │  │
│  │                           │  │
│  │ Status: On track for      │  │
│  │ mastery (need 80% × 3)    │  │
│  │                           │  │
│  │ [#final-notes]            │  │
│  │ ┌───────────────────────┐ │  │
│  │ │ Add final notes...    │ │  │
│  │ └───────────────────────┘ │  │
│  │                           │  │
│  │ ┌───────────────────────┐ │  │
│  │ │ [#view-graph-btn]     │ │  │
│  │ │ 📊 View Graph         │ │  │
│  │ └───────────────────────┘ │  │
│  │                           │  │
│  │ ┌───────────────────────┐ │  │
│  │ │ [#confirm-save-btn]   │ │  │
│  │ │                       │ │  │
│  │ │   Confirm & Save      │ │  │
│  │ │                       │ │  │
│  │ └───────────────────────┘ │  │
│  │                           │  │
│  │ [Cancel (continue)]       │  │
│  │                           │  │
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

**After Confirm & Save:**
```
┌─────────────────────────────────┐
│                                 │
│  [#session-save-success]        │
│  ┌───────────────────────────┐  │
│  │ ✓ Session Saved           │  │
│  │                           │  │
│  │ Data has been saved       │  │
│  │ locally and queued for    │  │
│  │ sync.                     │  │
│  │                           │  │
│  │ [OK]                      │  │
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

**Testing IDs:**
- `#session-summary-modal` - Summary modal
- `#final-notes` - Final notes input
- `#view-graph-btn` - View graph button
- `#confirm-save-btn` - Confirm and save button
- `#session-save-success` - Success message

---

## Quick Feedback Graph

```
┌─────────────────────────────────┐
│ [#env-banner]                   │
│ DEMO │ RBT │ 14:53:45           │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│                                 │
│  [← Back]                       │
│                                 │
│  John Smith                     │
│  Receptive Labels - Animals     │
│                                 │
│  [#quick-feedback-graph]        │
│  Last 10 Sessions               │
│                                 │
│  Accuracy (%)                   │
│  100│                           │
│     │              ●            │
│   90│         ●─────────●       │
│     │    ●────┘         └──●    │
│   80│ ●──┘               ┘ └─●  │
│     │                       ↑   │
│   70│                     Today │
│     │                           │
│   60│                           │
│     ├───────────────────────────>
│     12/1    12/4    12/7  12/10 │
│                                 │
│  Current Session: 80%           │
│  Previous Avg: 77%              │
│  Trend: ↗ Improving             │
│                                 │
│  Mastery Progress:              │
│  [████████████░░░░] 2 of 3      │
│  Need 1 more session at 80%+    │
│                                 │
│  [Done]                         │
│                                 │
└─────────────────────────────────┘
```

**Graph Features:**
- Simple line graph
- Highlights current session
- Shows trend indicator
- Progress toward mastery
- Swipe left/right for other programs

**Testing IDs:**
- `#quick-feedback-graph` - Graph container
- `#back-btn` - Back button

---

## Sync Status Screen

```
┌─────────────────────────────────┐
│ [#env-banner]                   │
│ DEMO │ RBT │ 14:55:12           │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│                                 │
│  Sync Status                    │
│                                 │
│  [#manual-sync-btn]             │
│  ┌───────────────────────────┐  │
│  │  ⟳  Sync Now              │  │
│  └───────────────────────────┘  │
│                                 │
│  Last Synced: 15 minutes ago    │
│                                 │
│  Pending Items (2):             │
│                                 │
│  [#pending-sync-list]           │
│  ┌───────────────────────────┐  │
│  │ Session: John Smith       │  │
│  │ Program: Receptive Labels │  │
│  │ Date: 2024-12-10 14:52    │  │
│  │ Size: 2.3 KB              │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ Session: Mary Johnson     │  │
│  │ Program: Manding          │  │
│  │ Date: 2024-12-10 13:45    │  │
│  │ Size: 1.8 KB              │  │
│  └───────────────────────────┘  │
│                                 │
│  Network Status: ✓ Connected    │
│  Wi-Fi: School_Network          │
│                                 │
│  Auto-sync: On                  │
│  Sync on Wi-Fi only: On         │
│                                 │
└─────────────────────────────────┘
```

**During Sync:**
```
┌─────────────────────────────────┐
│                                 │
│  [#sync-progress]               │
│  ┌───────────────────────────┐  │
│  │ Syncing...                │  │
│  │                           │  │
│  │ ████████████░░░░  1 of 2  │  │
│  │                           │  │
│  │ Uploading session data... │  │
│  │                           │  │
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

**Sync Success:**
```
┌─────────────────────────────────┐
│                                 │
│  [#sync-success]                │
│  ┌───────────────────────────┐  │
│  │ ✓ Sync Complete           │  │
│  │                           │  │
│  │ 2 sessions uploaded       │  │
│  │ All data is up to date    │  │
│  │                           │  │
│  │ [OK]                      │  │
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

**Sync Error:**
```
┌─────────────────────────────────┐
│                                 │
│  [#sync-error]                  │
│  ┌───────────────────────────┐  │
│  │ ⚠️ Sync Failed             │  │
│  │                           │  │
│  │ Could not connect to      │  │
│  │ server. Your data is      │  │
│  │ safe and will sync        │  │
│  │ automatically when        │  │
│  │ connection is restored.   │  │
│  │                           │  │
│  │ [#retry-sync-btn]         │  │
│  │ [Retry Now]               │  │
│  │                           │  │
│  │ [OK]                      │  │
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

**Testing IDs:**
- `#manual-sync-btn` - Manual sync button
- `#pending-sync-list` - Pending items list
- `#sync-progress` - Sync progress indicator
- `#sync-success` - Success message
- `#sync-error` - Error message
- `#retry-sync-btn` - Retry button

---

## Lock Stolen Banner

```
┌─────────────────────────────────┐
│ [#env-banner]                   │
│ DEMO │ RBT │ 14:58:33           │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│                                 │
│  [#lock-stolen-banner]          │
│  ┌───────────────────────────┐  │
│  │ ⚠️ Session Taken Over      │  │
│  │                           │  │
│  │ Mary Johnson has taken    │  │
│  │ over this session.        │  │
│  │                           │  │
│  │ Your work has been saved  │  │
│  │ as a draft.               │  │
│  │                           │  │
│  │ ┌───────────────────────┐ │  │
│  │ │ [#reclaim-lock-btn]   │ │  │
│  │ │ Take Back Session     │ │  │
│  │ └───────────────────────┘ │  │
│  │                           │  │
│  │ ┌───────────────────────┐ │  │
│  │ │ [#discard-changes-btn]│ │  │
│  │ │ Discard My Changes    │ │  │
│  │ └───────────────────────┘ │  │
│  │                           │  │
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

**Banner Behavior:**
- Appears immediately when lock stolen
- Blocks further data entry
- Preserves local data in drafts
- Allows reclaiming lock
- Shows who took the lock

**Testing IDs:**
- `#lock-stolen-banner` - Lock stolen banner
- `#reclaim-lock-btn` - Reclaim lock button
- `#discard-changes-btn` - Discard changes button

---

**Related User Stories:**
- RBT-001 through RBT-011: All RBT mobile workflows

**Next Mockups:**
- Guided tour mockups for all roles
