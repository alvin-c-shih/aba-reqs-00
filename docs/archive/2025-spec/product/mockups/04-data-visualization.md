# Data Visualization UI Mockups

## Graph View - Line Graph with Phase Markers

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [#env-banner] DEMO MODE | Role: BCBA | 2025-12-10 14:30:45 | Dr. Jane Smith | [Logout]│
└────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                        │
│  [← Back to Student Detail]                                                            │
│                                                                                        │
│  Student: John Smith  |  Program: Receptive Labels - Animals                          │
│                                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│  │  Controls                                                                       │  │
│  │                                                                                 │  │
│  │  [#graph-program-select] Program: Receptive Labels - Animals ▼                 │  │
│  │                                                                                 │  │
│  │  [#graph-date-range] Date Range: Last 30 Days ▼                                │  │
│  │  ┌─────────────────┐  ┌─────────────────┐                                     │  │
│  │  │ From: 2024-11-10│  │ To: 2024-12-10  │  [Apply]                            │  │
│  │  └─────────────────┘  └─────────────────┘                                     │  │
│  │                                                                                 │  │
│  │  [#add-phase-marker-btn] + Add Phase Marker    [#export-graph-btn] 📥 Export  │  │
│  │                                                                                 │  │
│  └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│  │  [#line-graph]                                                                  │  │
│  │                                                                                 │  │
│  │  Accuracy (%)                         Line Graph                                │  │
│  │  100 │                                                                          │  │
│  │      │                                                                          │  │
│  │   90 │                                          ●─────●                         │  │
│  │      │                                    ●─────┘     └──●                      │  │
│  │   80 │                              ●─────┘               │                     │  │
│  │      │                         ●────┘                     └──●                  │  │
│  │   70 │                    ●────┘           │[Phase 2]        └──●              │  │
│  │      │               ●────┘                │                    │              │  │
│  │   60 │          ●────┘                     │                    └──●           │  │
│  │      │     ●────┘   │[Phase 1]             │                        └──●       │  │
│  │   50 │ ●───┘        │                      │                            │      │  │
│  │      │              │                      │                            │      │  │
│  │   40 │              ▼                      ▼                            ▼      │  │
│  │      ├──────────────┬──────────────────────┬────────────────────────────────> │  │
│  │      11/10      11/17  Baseline        11/24  Prompts Added         12/10     │  │
│  │                                                                                 │  │
│  │  [#phase-markers]                                                               │  │
│  │  ● Data Points    ──── Trend Line    │ Phase Change Marker                    │  │
│  │                                                                                 │  │
│  └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│  │  [#graph-legend]  Legend & Summary Statistics                                  │  │
│  │                                                                                 │  │
│  │  Phase 1: Baseline (11/10 - 11/16)                                             │  │
│  │    • Mean: 55%  • Trend: Ascending  • Sessions: 5                              │  │
│  │                                                                                 │  │
│  │  Phase 2: Prompts Added (11/17 - 11/23)                                        │  │
│  │    • Mean: 70%  • Trend: Ascending  • Sessions: 5                              │  │
│  │    • Change from Phase 1: +15% (significant)                                   │  │
│  │                                                                                 │  │
│  │  Current Phase: Fading Prompts (11/24 - Present)                               │  │
│  │    • Mean: 85%  • Trend: Stable  • Sessions: 8                                 │  │
│  │    • Progress toward mastery: 85% (Need: 80% for 3 sessions) ✓                │  │
│  │    • Status: On track for mastery                                              │  │
│  │                                                                                 │  │
│  └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│  │  Phase Markers                                              [Edit] [Delete]     │  │
│  │                                                                                 │  │
│  │  ┌───────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │  📍 Phase 1: Baseline                                [#edit-marker-btn]   │ │  │
│  │  │     Date: 2024-11-10                                                       │ │  │
│  │  │     Description: Initial baseline with no prompts                         │ │  │
│  │  │     Color: █ Blue                                                          │ │  │
│  │  └───────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                 │  │
│  │  ┌───────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │  📍 Phase 2: Prompts Added                                                │ │  │
│  │  │     Date: 2024-11-17                                                       │ │  │
│  │  │     Description: Added gestural prompts, token reinforcement              │ │  │
│  │  │     Color: █ Green                                                         │ │  │
│  │  └───────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                 │  │
│  └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

**Graph Interactions:**
- Hover over data point shows tooltip with exact values
- Click data point opens session detail
- Zoom in/out with mouse wheel or pinch gesture
- Pan by dragging
- Click phase marker line to edit marker

**Testing IDs:**
- `#line-graph` - Line graph container
- `#graph-program-select` - Program selector dropdown
- `#graph-date-range` - Date range picker
- `#add-phase-marker-btn` - Add phase marker button
- `#export-graph-btn` - Export graph button
- `#phase-markers` - Phase markers container
- `#graph-legend` - Legend and statistics
- `#edit-marker-btn` - Edit marker button

---

## Bar Chart View

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                        │
│  Student: John Smith  |  Program: Manding for Preferred Items                         │
│                                                                                        │
│  [Line Graph] [Bar Chart ←] [Data Table]                                              │
│                                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│  │  [#bar-chart]                                                                   │  │
│  │                                                                                 │  │
│  │  Frequency (Count per Session)              Bar Chart                           │  │
│  │  20 │                                                                           │  │
│  │     │                                                                           │  │
│  │  18 │                                                         ████              │  │
│  │     │                                                         ████              │  │
│  │  16 │                                              ████       ████              │  │
│  │     │                                   ████       ████       ████              │  │
│  │  14 │                        ████       ████       ████       ████   ████       │  │
│  │     │                        ████       ████       ████       ████   ████       │  │
│  │  12 │             ████       ████       ████       ████       ████   ████       │  │
│  │     │             ████       ████       ████       ████       ████   ████       │  │
│  │  10 │  ────────   ████       ████       ████       ████       ████   ████       │  │
│  │     │  Target:    ████       ████       ████       ████       ████   ████       │  │
│  │   8 │  10 mands   ████       ████       ████       ████       ████   ████       │  │
│  │     │             ████       ████       ████       ████       ████   ████       │  │
│  │   6 │  ████       ████       ████       ████       ████       ████   ████       │  │
│  │     │  ████       ████       ████       ████       ████       ████   ████       │  │
│  │   4 │  ████       ████       ████       ████       ████       ████   ████       │  │
│  │     │  ████       ████       ████       ████       ████       ████   ████       │  │
│  │   2 │  ████       ████       ████       ████       ████       ████   ████       │  │
│  │     │  ████       ████       ████       ████       ████       ████   ████       │  │
│  │   0 ├─────────────────────────────────────────────────────────────────────────> │  │
│  │     11/15    11/18    11/22    11/25    11/29    12/03    12/06    12/10       │  │
│  │                                                                                 │  │
│  │  █ Below Target    █ Met/Exceeded Target (10+)                                 │  │
│  │                                                                                 │  │
│  └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│  │  Summary Statistics                                                             │  │
│  │                                                                                 │  │
│  │  Total Sessions: 8                                                              │  │
│  │  Average Mands per Session: 13.4                                                │  │
│  │  Sessions Meeting Criterion (10+): 7 of 8 (87.5%)                              │  │
│  │  Trend: ↗ Increasing (slope: +0.8 per session)                                 │  │
│  │                                                                                 │  │
│  │  Mastery Status: ✓ MASTERED                                                    │  │
│  │  Criteria: 10 mands per session for 5 consecutive sessions                     │  │
│  │  Met on: 2024-12-06 (maintained for 5 sessions)                                │  │
│  │                                                                                 │  │
│  └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

**Bar Chart Features:**
- Horizontal reference line shows mastery criterion
- Color coding: Below target = Orange, Met target = Green
- Hover shows exact count and date
- Click bar to view session details

**Testing IDs:**
- `#bar-chart` - Bar chart container
- `#bar-chart-legend` - Chart legend

---

## Add Phase Marker Modal

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                        │
│  ╔══════════════════════════════════════════════════════════════════════════════════╗ │
│  ║  [#phase-marker-modal]                                          [#undo-btn]      ║ │
│  ║                                                                 [#redo-btn]      ║ │
│  ║  Add Phase Change Marker                                                         ║ │
│  ║                                                                                   ║ │
│  ║  ┌────────────────────────────────────────────────────────────────────────────┐  ║ │
│  ║  │  Date of Phase Change                             [#phase-date]            │  ║ │
│  ║  │  ┌──────────────────────────────────────────────────────────────────────┐  │  ║ │
│  ║  │  │  2024-11-17                                          [📅]            │  │  ║ │
│  ║  │  └──────────────────────────────────────────────────────────────────────┘  │  ║ │
│  ║  └────────────────────────────────────────────────────────────────────────────┘  ║ │
│  ║                                                                                   ║ │
│  ║  ┌────────────────────────────────────────────────────────────────────────────┐  ║ │
│  ║  │  Phase Name                                       [#phase-name]            │  ║ │
│  ║  │  ┌──────────────────────────────────────────────────────────────────────┐  │  ║ │
│  ║  │  │  Phase 2: Prompts Added                                              │  │  ║ │
│  ║  │  └──────────────────────────────────────────────────────────────────────┘  │  ║ │
│  ║  └────────────────────────────────────────────────────────────────────────────┘  ║ │
│  ║                                                                                   ║ │
│  ║  ┌────────────────────────────────────────────────────────────────────────────┐  ║ │
│  ║  │  Description of Changes                           [#phase-description]     │  ║ │
│  ║  │  ┌──────────────────────────────────────────────────────────────────────┐  │  ║ │
│  ║  │  │  • Added gestural prompts (pointing to correct card)                │  │  ║ │
│  ║  │  │  • Introduced token reinforcement system                            │  │  ║ │
│  ║  │  │  • Increased number of trials per session from 10 to 15            │  │  ║ │
│  ║  │  │  • Reduced field of options from 4 to 3 cards                      │  │  ║ │
│  ║  │  │                                                                      │  │  ║ │
│  ║  │  └──────────────────────────────────────────────────────────────────────┘  │  ║ │
│  ║  │  (Describe what intervention changed and why)                             │  ║ │
│  ║  └────────────────────────────────────────────────────────────────────────────┘  ║ │
│  ║                                                                                   ║ │
│  ║  ┌────────────────────────────────────────────────────────────────────────────┐  ║ │
│  ║  │  Marker Color                                     [#phase-color]           │  ║ │
│  ║  │  ┌──────────────────────────────────────────────────────────────────────┐  │  ║ │
│  ║  │  │  █ Blue    █ Green    █ Orange   █ Red    █ Purple   █ Gray        │  │  ║ │
│  ║  │  │                        ← selected                                    │  │  ║ │
│  ║  │  └──────────────────────────────────────────────────────────────────────┘  │  ║ │
│  ║  └────────────────────────────────────────────────────────────────────────────┘  ║ │
│  ║                                                                                   ║ │
│  ║  Preview on Graph:                                                               ║ │
│  ║  ┌────────────────────────────────────────────────────────────────────────────┐  ║ │
│  ║  │     ●────●────●  │  ●────●────●                                           │  ║ │
│  ║  │                  │                                                         │  ║ │
│  ║  │                  ▼ Phase 2: Prompts Added                                  │  ║ │
│  ║  └────────────────────────────────────────────────────────────────────────────┘  ║ │
│  ║                                                                                   ║ │
│  ║  ┌──────────────────────────┐  ┌────────────────────────┐                       ║ │
│  ║  │      Add Marker          │  │        Cancel          │                       ║ │
│  ║  └──────────────────────────┘  └────────────────────────┘                       ║ │
│  ║                                                                                   ║ │
│  ╚══════════════════════════════════════════════════════════════════════════════════╝ │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

**Validation:**
- Date must be within graph's date range
- Phase name required
- Description required (min 10 characters)
- Color selection required

**After Adding:**
- Marker appears on graph immediately
- Graph auto-scrolls to show new marker
- Success message: "✓ Phase marker added"

**Testing IDs:**
- `#phase-marker-modal` - Modal container
- `#phase-date` - Date picker
- `#phase-name` - Phase name input
- `#phase-description` - Description textarea
- `#phase-color` - Color picker

---

## Data Table View

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                        │
│  Student: John Smith  |  Program: Receptive Labels - Animals                          │
│                                                                                        │
│  [Line Graph] [Bar Chart] [Data Table ←]                                              │
│                                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│  │  Session Data                                                                   │  │
│  │                                                                                 │  │
│  │  Filters:  [All Targets ▼]  [All RBTs ▼]  [Last 30 Days ▼]                    │  │
│  │                                                                                 │  │
│  │  ┌───────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │ Date ▼│Target│Trials│Correct│Prompted│Incorrect│No Resp│Accuracy│RBT    │ │  │
│  │  ├───────────────────────────────────────────────────────────────────────────┤ │  │
│  │  │12/10  │Dog   │  10  │   9   │   1    │    0    │   0   │  90%   │John D.│ │  │
│  │  │12/10  │Cat   │  10  │   8   │   1    │    1    │   0   │  80%   │John D.│ │  │
│  │  │12/09  │Dog   │  10  │   9   │   0    │    1    │   0   │  90%   │Mary J.│ │  │
│  │  │12/09  │Cat   │  10  │   7   │   2    │    1    │   0   │  70%   │Mary J.│ │  │
│  │  │12/08  │Dog   │  10  │  10   │   0    │    0    │   0   │ 100%   │John D.│ │  │
│  │  │12/08  │Cat   │  10  │   8   │   1    │    1    │   0   │  80%   │John D.│ │  │
│  │  │12/06  │Dog   │  10  │   8   │   2    │    0    │   0   │  80%   │Mary J.│ │  │
│  │  │12/06  │Cat   │  10  │   6   │   3    │    1    │   0   │  60%   │Mary J.│ │  │
│  │  │...                                                                         │ │  │
│  │  └───────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                 │  │
│  │  Showing 8 of 45 sessions  |  ← Previous  1 2 3 ... 6  Next →                 │  │
│  │                                                                                 │  │
│  │  [📥 Export to CSV]  [📥 Export to Excel]                                      │  │
│  │                                                                                 │  │
│  └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

**Table Features:**
- Click column header to sort
- Click row to view session details
- Multi-select rows for bulk export
- Filter by target, RBT, date range
- Export to CSV or Excel

**Testing IDs:**
- `#data-table` - Data table container
- `#data-table-filters` - Filter controls
- `#export-csv-btn` - Export CSV button
- `#export-excel-btn` - Export Excel button

---

## Generate Report Modal

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                        │
│  ╔══════════════════════════════════════════════════════════════════════════════════╗ │
│  ║  [#report-config-modal]                                                          ║ │
│  ║                                                                                   ║ │
│  ║  Generate Progress Report                                                        ║ │
│  ║                                                                                   ║ │
│  ║  ┌────────────────────────────────────────────────────────────────────────────┐  ║ │
│  ║  │  Report Type                                      [#report-type]            │  ║ │
│  ║  │  ┌──────────────────────────────────────────────────────────────────────┐  │  ║ │
│  ║  │  │  Progress Report ▼                                                   │  │  ║ │
│  ║  │  ├──────────────────────────────────────────────────────────────────────┤  │  ║ │
│  ║  │  │  • Progress Report (for team/parents)        ← selected              │  │  ║ │
│  ║  │  │  • Insurance Report                                                  │  │  ║ │
│  ║  │  │  • Parent Summary                                                    │  │  ║ │
│  ║  │  └──────────────────────────────────────────────────────────────────────┘  │  ║ │
│  ║  └────────────────────────────────────────────────────────────────────────────┘  ║ │
│  ║                                                                                   ║ │
│  ║  ┌────────────────────────────────────────────────────────────────────────────┐  ║ │
│  ║  │  Date Range                                       [#report-date-range]     │  ║ │
│  ║  │  ┌─────────────────┐  ┌─────────────────┐                                │  ║ │
│  ║  │  │ From: 2024-11-10│  │ To: 2024-12-10  │                                │  ║ │
│  ║  │  └─────────────────┘  └─────────────────┘                                │  ║ │
│  ║  └────────────────────────────────────────────────────────────────────────────┘  ║ │
│  ║                                                                                   ║ │
│  ║  ┌────────────────────────────────────────────────────────────────────────────┐  ║ │
│  ║  │  Programs to Include                              [#report-programs]       │  ║ │
│  ║  │  ┌──────────────────────────────────────────────────────────────────────┐  │  ║ │
│  ║  │  │  ☑ Receptive Labels - Animals                                        │  │  ║ │
│  ║  │  │  ☑ Manding for Preferred Items                                       │  │  ║ │
│  ║  │  │  ☑ Matching Colors                                                   │  │  ║ │
│  ║  │  │  ☐ Expressive Labels - Objects (Paused)                             │  │  ║ │
│  ║  │  │  ☐ Following 1-Step Instructions (Archived)                          │  │  ║ │
│  ║  │  └──────────────────────────────────────────────────────────────────────┘  │  ║ │
│  ║  │  [Select All]  [Select None]  [Select Active Only]                        │  ║ │
│  ║  └────────────────────────────────────────────────────────────────────────────┘  ║ │
│  ║                                                                                   ║ │
│  ║  ┌────────────────────────────────────────────────────────────────────────────┐  ║ │
│  ║  │  Options                                                                   │  ║ │
│  ║  │  ☑ [#report-include-graphs] Include graphs for each program               │  ║ │
│  ║  │  ☑ Include summary statistics                                             │  ║ │
│  ║  │  ☑ Include session notes                                                  │  ║ │
│  ║  │  ☐ Include raw data tables                                                │  ║ │
│  ║  └────────────────────────────────────────────────────────────────────────────┘  ║ │
│  ║                                                                                   ║ │
│  ║  ┌──────────────────────────┐  ┌────────────────────────┐                       ║ │
│  ║  │ [#generate-pdf-btn]      │  │        Cancel          │                       ║ │
│  ║  │    Generate Report       │  │                        │                       ║ │
│  ║  └──────────────────────────┘  └────────────────────────┘                       ║ │
│  ║                                                                                   ║ │
│  ╚══════════════════════════════════════════════════════════════════════════════════╝ │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

**After Clicking Generate:**
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                        │
│  ╔══════════════════════════════════════════════════════════════════════════════════╗ │
│  ║  [#report-progress-modal]                                                        ║ │
│  ║                                                                                   ║ │
│  ║  Generating Report...                                                            ║ │
│  ║                                                                                   ║ │
│  ║  [#report-progress]                                                              ║ │
│  ║  ████████████████████████████████████████████░░░░░░░░  75%                       ║ │
│  ║                                                                                   ║ │
│  ║  Current step: Generating graphs... (3 of 4)                                     ║ │
│  ║                                                                                   ║ │
│  ║  [Cancel Generation]                                                             ║ │
│  ║                                                                                   ║ │
│  ╚══════════════════════════════════════════════════════════════════════════════════╝ │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

**When Complete:**
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                        │
│  ╔══════════════════════════════════════════════════════════════════════════════════╗ │
│  ║  Report Generated Successfully! ✓                                                ║ │
│  ║                                                                                   ║ │
│  ║  📄 Progress Report for John Smith                                               ║ │
│  ║     Date Range: 2024-11-10 to 2024-12-10                                         ║ │
│  ║     Generated: 2025-12-10 14:45:32                                               ║ │
│  ║     File Size: 2.4 MB                                                            ║ │
│  ║                                                                                   ║ │
│  ║  ┌────────────────────────────────────────────────────────────────────────────┐  ║ │
│  ║  │  [#download-report-link] 📥 Download PDF                                   │  ║ │
│  ║  └────────────────────────────────────────────────────────────────────────────┘  ║ │
│  ║                                                                                   ║ │
│  ║  ┌────────────────────────────────────────────────────────────────────────────┐  ║ │
│  ║  │  📧 Email Report                                                           │  ║ │
│  ║  └────────────────────────────────────────────────────────────────────────────┘  ║ │
│  ║                                                                                   ║ │
│  ║  [Close]                                                                         ║ │
│  ║                                                                                   ║ │
│  ╚══════════════════════════════════════════════════════════════════════════════════╝ │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

**Testing IDs:**
- `#report-config-modal` - Configuration modal
- `#report-type` - Report type dropdown
- `#report-date-range` - Date range picker
- `#report-programs` - Programs multi-select
- `#report-include-graphs` - Include graphs checkbox
- `#generate-pdf-btn` - Generate button
- `#report-progress-modal` - Progress modal
- `#report-progress` - Progress bar
- `#download-report-link` - Download link

---

**Related User Stories:**
- BCBA-006: View Student Data Graphs
- BCBA-007: Add Treatment Phase Annotation
- BCBA-008: Generate Progress Report

**Next Mockups:**
- RBT mobile interface mockups
- Guided tour mockups
