# Guided Tour / Onboarding UI Mockups

## Welcome Screen (All Roles)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                        │
│  ╔══════════════════════════════════════════════════════════════════════════════════╗ │
│  ║                                                                                   ║ │
│  ║                          Welcome to ABA System! 👋                               ║ │
│  ║                                                                                   ║ │
│  ║                              [Logo/Icon]                                          ║ │
│  ║                                                                                   ║ │
│  ║  This is your first time logging in. Would you like a quick tour                 ║ │
│  ║  of the system? It only takes 2-3 minutes.                                       ║ │
│  ║                                                                                   ║ │
│  ║  You can always restart the tour later from Settings.                            ║ │
│  ║                                                                                   ║ │
│  ║  ┌────────────────────────────────────────────────────────────────────────────┐  ║ │
│  ║  │                      Start Tour (Recommended)                              │  ║ │
│  ║  └────────────────────────────────────────────────────────────────────────────┘  ║ │
│  ║                            (Primary button)                                       ║ │
│  ║                                                                                   ║ │
│  ║  [Skip Tour - Go to Dashboard]                                                   ║ │
│  ║                                                                                   ║ │
│  ╚══════════════════════════════════════════════════════════════════════════════════╝ │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

**Behavior:**
- Shows only on first login
- Different tour content per role
- Can be skipped
- Can be restarted from settings

---

## Tour Overlay Components

### Tour Tooltip Structure
```
┌────────────────────────────────────────┐
│ [#tour-tooltip]                        │
│                                        │
│  [#tour-step-counter] Step 2 of 8     │
│                                        │
│  This is the Users section where you   │
│  can manage all system users.          │
│                                        │
│  Click "Create User" to add new staff  │
│  members to the system.                │
│                                        │
│  [#tour-prev] ← Previous               │
│  [#tour-next] Next → [#tour-skip] Skip │
│                                        │
└────────────────────────────────────────┘
            │ (Arrow pointing to element)
            ▼
       [Highlighted UI Element]
```

### Tour Overlay Appearance
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [#tour-overlay] (Semi-transparent dark overlay - 80% opacity)                          │
│                                                                                        │
│    ┌──────────────────┐    ← Dimmed                                                   │
│    │   Sidebar        │                                                                │
│    │   Navigation     │                                                                │
│    └──────────────────┘                                                                │
│                                                                                        │
│                   ┌──────────────────────────────┐  ← HIGHLIGHTED (Full brightness)   │
│                   │  [Create User Button]        │                                     │
│                   └──────────────────────────────┘                                     │
│                                  │                                                     │
│                                  │ Arrow from tooltip                                  │
│                   ┌──────────────────────────────┐                                     │
│                   │  [Tour Tooltip - Step 3/8]   │                                     │
│                   │  Create new users here...    │                                     │
│                   │  [← Prev] [Next →] [Skip]    │                                     │
│                   └──────────────────────────────┘                                     │
│                                                                                        │
│    Rest of screen dimmed...                                                            │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

**Testing IDs:**
- `#tour-overlay` - Dark overlay
- `#tour-tooltip` - Tooltip container
- `#tour-step-counter` - Step counter
- `#tour-prev` - Previous button
- `#tour-next` - Next button
- `#tour-skip` - Skip tour button

---

## Admin Tour - Step by Step

### Admin Tour - Step 1: Environment Banner
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [HIGHLIGHTED] DEMO MODE | Role: Admin | 14:30:45 | [Logout] [⚙]                       │
└────────────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │ Step 1 of 8                   │
                    │                               │
                    │ This banner shows:            │
                    │ • Current environment         │
                    │ • Your role                   │
                    │ • Current time                │
                    │                               │
                    │ Always check you're in the    │
                    │ right environment!            │
                    │                               │
                    │ Colors:                       │
                    │ • Blue = Demo                 │
                    │ • Green = Dev                 │
                    │ • Yellow = QA                 │
                    │ • Red = Production            │
                    │                               │
                    │           [Next →] [Skip]     │
                    └───────────────────────────────┘
```

### Admin Tour - Step 2: Navigation
```
┌──────────────────┐
│ [HIGHLIGHTED]    │
│ 📋 Dashboard     │
│ 👥 Users  ←      │
│ 🏥 System Health │
│ 📊 Reports       │
│ ⚙️ Settings      │
└──────────────────┘
        │
        ▼
┌───────────────────────────────┐
│ Step 2 of 8                   │
│                               │
│ Use this sidebar to navigate  │
│ between sections.             │
│                               │
│ As an Admin, you have access  │
│ to all system areas.          │
│                               │
│ [← Prev] [Next →] [Skip]      │
└───────────────────────────────┘
```

### Admin Tour - Step 3: User Management
```
[HIGHLIGHTED]
┌──────────────────────────────┐
│ [+ Create New User]          │
└──────────────────────────────┘
        │
        ▼
┌───────────────────────────────┐
│ Step 3 of 8                   │
│                               │
│ Click here to create new      │
│ users. You'll assign them a   │
│ role (Admin, BCBA, or RBT)    │
│ and they'll receive a         │
│ temporary password.           │
│                               │
│ [← Prev] [Next →] [Skip]      │
└───────────────────────────────┘
```

### Admin Tour - Step 4: User List
```
[HIGHLIGHTED]
┌─────────────────────────────────────────────┐
│ Name ▲│ Email         │ Role  │Status│...   │
├─────────────────────────────────────────────┤
│ Smith │admin@sch.edu  │Admin  │●Act │...   │
│ Jane  │jane.d@sch.edu │BCBA   │●Act │...   │
└─────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────┐
│ Step 4 of 8                   │
│                               │
│ This table shows all users.   │
│ Click any row to edit user    │
│ details or manage their       │
│ status.                       │
│                               │
│ Use filters and search to     │
│ find specific users quickly.  │
│                               │
│ [← Prev] [Next →] [Skip]      │
└───────────────────────────────┘
```

### Admin Tour - Step 5: System Health
```
[HIGHLIGHTED]
┌──────────────────┐
│ 🏥 System Health │
└──────────────────┘
        │
        ▼
┌───────────────────────────────┐
│ Step 5 of 8                   │
│                               │
│ The System Health dashboard   │
│ helps you:                    │
│ • Verify demo data installed  │
│ • Check database row counts   │
│ • Debug data collection       │
│ • Monitor mobile sync         │
│                               │
│ Use this for troubleshooting! │
│                               │
│ [← Prev] [Next →] [Skip]      │
└───────────────────────────────┘
```

### Admin Tour - Step 6: Demo Data
```
[HIGHLIGHTED]
┌───────────────────────────────┐
│ Demo Data Status              │
│ ✓ Demo data installed         │
│ [Clear Demo Data]             │
└───────────────────────────────┘
        │
        ▼
┌───────────────────────────────┐
│ Step 6 of 8                   │
│                               │
│ Demo data includes realistic  │
│ examples for training.        │
│                               │
│ You can clear it when ready   │
│ for real data, or reinstall   │
│ it anytime.                   │
│                               │
│ [← Prev] [Next →] [Skip]      │
└───────────────────────────────┘
```

### Admin Tour - Step 7: Undo/Redo
```
[HIGHLIGHTED]
┌──────────┐  ┌──────────┐
│ ↶ Undo   │  │ ↷ Redo   │
└──────────┘  └──────────┘
        │
        ▼
┌───────────────────────────────┐
│ Step 7 of 8                   │
│                               │
│ All forms support Undo/Redo!  │
│                               │
│ • Click buttons or use:       │
│   - Ctrl+Z to undo            │
│   - Ctrl+Y to redo            │
│                               │
│ Changes are tracked until you │
│ save or navigate away.        │
│                               │
│ [← Prev] [Next →] [Skip]      │
└───────────────────────────────┘
```

### Admin Tour - Step 8: Complete
```
┌────────────────────────────────────────────┐
│                                            │
│  Tour Complete! 🎉                         │
│                                            │
│  You're ready to use the Admin dashboard.  │
│                                            │
│  Quick tips:                               │
│  • Start by creating users                 │
│  • Check System Health regularly           │
│  • Use demo data for training              │
│                                            │
│  You can restart this tour anytime from    │
│  Settings → Help → Restart Tour            │
│                                            │
│  [Go to Dashboard]                         │
│                                            │
└────────────────────────────────────────────┘
```

---

## BCBA Tour - Key Steps

### BCBA Tour - Step 1: Dashboard Overview
```
[HIGHLIGHTED - Student Cards Area]
┌──────────────────┐  ┌──────────────────┐
│  John Smith      │  │  Mary Johnson ⚠  │
│  5 Programs      │  │  4 Programs      │
└──────────────────┘  └──────────────────┘
        │
        ▼
┌───────────────────────────────┐
│ Step 1 of 10                  │
│                               │
│ Your dashboard shows all      │
│ students assigned to you.     │
│                               │
│ Alert badges (⚠) indicate     │
│ students needing attention:   │
│ • No data in 3 days           │
│ • No progress                 │
│ • RBT concerns                │
│                               │
│ [Next →] [Skip]               │
└───────────────────────────────┘
```

### BCBA Tour - Step 3: Creating Students
```
[HIGHLIGHTED]
┌──────────────────────────────┐
│ [+ Add Student]              │
└──────────────────────────────┘
        │
        ▼
┌───────────────────────────────┐
│ Step 3 of 10                  │
│                               │
│ Click here to create a new    │
│ student profile.              │
│                               │
│ You'll enter their info and   │
│ manage their media consent.   │
│                               │
│ [← Prev] [Next →] [Skip]      │
└───────────────────────────────┘
```

### BCBA Tour - Step 5: Creating Programs
```
[HIGHLIGHTED - Program creation interface]
        │
        ▼
┌───────────────────────────────┐
│ Step 5 of 10                  │
│                               │
│ Programs define:              │
│ • Teaching procedures         │
│ • Data collection method      │
│ • Mastery criteria            │
│ • Specific targets/goals      │
│                               │
│ RBTs will see your            │
│ instructions when collecting  │
│ data.                         │
│                               │
│ [← Prev] [Next →] [Skip]      │
└───────────────────────────────┘
```

### BCBA Tour - Step 7: Viewing Graphs
```
[HIGHLIGHTED - Graph display]
        │
        ▼
┌───────────────────────────────┐
│ Step 7 of 10                  │
│                               │
│ Graphs show student progress  │
│ over time.                    │
│                               │
│ You can:                      │
│ • Add phase markers           │
│ • Annotate interventions      │
│ • Export to PDF               │
│ • Compare time periods        │
│                               │
│ [← Prev] [Next →] [Skip]      │
└───────────────────────────────┘
```

### BCBA Tour - Step 9: Assigning RBTs
```
[HIGHLIGHTED - RBT assignment section]
        │
        ▼
┌───────────────────────────────┐
│ Step 9 of 10                  │
│                               │
│ Assign RBTs to students so    │
│ they can collect data.        │
│                               │
│ RBTs will only see students   │
│ assigned to them on their     │
│ mobile devices.               │
│                               │
│ Changes sync immediately!     │
│                               │
│ [← Prev] [Next →] [Skip]      │
└───────────────────────────────┘
```

---

## RBT Mobile Tour - Key Steps

### RBT Tour - Step 1: Home Screen
```
┌─────────────────────────────────┐
│ [HIGHLIGHTED - Student cards]   │
│ ┌───────────────────────────┐   │
│ │  John Smith               │   │
│ │  5 Programs               │   │
│ └───────────────────────────┘   │
└─────────────────────────────────┘
               │
               ▼
      ┌───────────────────┐
      │ Step 1 of 8       │
      │                   │
      │ These are students│
      │ assigned to you.  │
      │                   │
      │ Tap a student to  │
      │ view their        │
      │ programs.         │
      │                   │
      │ [Next →] [Skip]   │
      └───────────────────┘
```

### RBT Tour - Step 2: Offline Mode
```
┌─────────────────────────────────┐
│ [HIGHLIGHTED]                   │
│ ⚠️ Offline Mode                 │
│ Last synced: Now                │
│ [ ] Hide unrelated students     │
│                                 │
│ [⟳ Sync]                        │
└─────────────────────────────────┘
               │
               ▼
      ┌───────────────────┐
      │ Step 2 of 8       │
      │                   │
      │ The app works     │
      │ offline!          │
      │                   │
      │ Data saves locally│
      │ and syncs when    │
      │ WiFi is available.│
      │                   │
      │ [← Prev] [Next →] │
      └───────────────────┘
```

### RBT Tour - Step 3: Starting Sessions
```
[HIGHLIGHTED - Start Session button]
               │
               ▼
      ┌───────────────────┐
      │ Step 3 of 8       │
      │                   │
      │ Read instructions │
      │ first, then tap   │
      │ Start Session.    │
      │                   │
      │ The session timer │
      │ will begin.       │
      │                   │
      │ [← Prev] [Next →] │
      └───────────────────┘
```

### RBT Tour - Step 4: Data Collection
```
[HIGHLIGHTED - Large data collection button]
               │
               ▼
      ┌───────────────────┐
      │ Step 4 of 8       │
      │                   │
      │ Tap here to       │
      │ record data.      │
      │                   │
      │ • Frequency: Tap  │
      │   to count        │
      │ • Duration: Start/│
      │   stop timer      │
      │ • Trials: Select  │
      │   outcome         │
      │                   │
      │ [← Prev] [Next →] │
      └───────────────────┘
```

### RBT Tour - Step 5: Undo/Redo
```
[HIGHLIGHTED - Undo/Redo buttons]
               │
               ▼
      ┌───────────────────┐
      │ Step 5 of 8       │
      │                   │
      │ Made a mistake?   │
      │ Use Undo!         │
      │                   │
      │ You can undo and  │
      │ redo any actions  │
      │ before ending the │
      │ session.          │
      │                   │
      │ [← Prev] [Next →] │
      └───────────────────┘
```

### RBT Tour - Step 6: Session Notes
```
[HIGHLIGHTED - Add Notes button]
               │
               ▼
      ┌───────────────────┐
      │ Step 6 of 8       │
      │                   │
      │ Add notes about:  │
      │ • Student mood    │
      │ • Challenges      │
      │ • Successes       │
      │ • Materials used  │
      │                   │
      │ BCBAs will see    │
      │ your notes.       │
      │                   │
      │ [← Prev] [Next →] │
      └───────────────────┘
```

### RBT Tour - Step 7: Ending Sessions
```
[HIGHLIGHTED - End Session button]
               │
               ▼
      ┌───────────────────┐
      │ Step 7 of 8       │
      │                   │
      │ When done, tap    │
      │ End Session.      │
      │                   │
      │ You'll see a      │
      │ summary to review │
      │ before saving.    │
      │                   │
      │ [← Prev] [Next →] │
      └───────────────────┘
```

### RBT Tour - Step 8: Quick Feedback
```
[HIGHLIGHTED - View Graph button]
               │
               ▼
      ┌───────────────────┐
      │ Step 8 of 8       │
      │                   │
      │ After saving, you │
      │ can view a quick  │
      │ graph to see the  │
      │ student's         │
      │ progress!         │
      │                   │
      │ [← Prev] [Finish] │
      └───────────────────┘
```

---

## Tour Progress Indicator (Bottom of screen)

```
┌────────────────────────────────────────────┐
│                                            │
│  [#tour-progress-indicator]                │
│                                            │
│  ●●●●○○○○  Step 4 of 8                     │
│                                            │
└────────────────────────────────────────────┘
```

- Filled circles = completed steps
- Empty circles = remaining steps
- Always shows current step number

---

## Restart Tour from Settings

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  Settings                                                      │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Help & Support                                          │ │
│  ├──────────────────────────────────────────────────────────┤ │
│  │  Documentation                                         → │ │
│  │  Video Tutorials                                       → │ │
│  │  [#restart-tour-btn] Restart Guided Tour               → │ │
│  │  Contact Support                                       → │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Clicking Restart Tour:**
```
┌────────────────────────────────────────────┐
│                                            │
│  Restart Guided Tour?                      │
│                                            │
│  This will take you through the system     │
│  features again. You can skip at any time. │
│                                            │
│  [Start Tour]  [Cancel]                    │
│                                            │
└────────────────────────────────────────────┘
```

**Testing IDs:**
- `#restart-tour-btn` - Restart tour button
- `#tour-progress-indicator` - Progress dots

---

## Tour Content Summary

### Admin Tour (8 steps)
1. Environment banner explanation
2. Navigation sidebar
3. Creating users
4. User list management
5. System health dashboard
6. Demo data management
7. Undo/redo functionality
8. Tour complete

### BCBA Tour (10 steps)
1. Dashboard overview
2. Student cards and alerts
3. Creating students
4. Student detail page
5. Creating programs
6. Adding targets
7. Viewing graphs
8. Adding phase markers
9. Assigning RBTs
10. Tour complete

### RBT Mobile Tour (8 steps)
1. Home screen / student list
2. Offline mode
3. Starting sessions
4. Data collection methods
5. Undo/redo
6. Adding session notes
7. Ending sessions
8. Quick feedback graphs

---

**Related User Stories:**
- COMMON-002: Guided Tour/Onboarding
- All role-specific user stories

**Implementation Notes:**
- Use a library like Intro.js, Shepherd.js, or React Joyride
- Store tour completion status in user preferences
- Allow skipping at any time
- Tour content stored in configuration for easy updates
- Different tours per role automatically selected
- Works with demo data to show realistic examples
