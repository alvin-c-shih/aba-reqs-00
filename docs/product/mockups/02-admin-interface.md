# Admin Interface UI Mockups

## Admin Dashboard

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [#env-banner] DEMO MODE | Role: Admin | 2025-12-10 14:30:45 | Admin User | [Logout][⚙] │
└────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                        │
│  ┌──────────────────┐  ┌──────────────────────────────────────────────────────────┐  │
│  │                  │  │                                                          │  │
│  │  📋 Dashboard    │  │  Admin Dashboard                                         │  │
│  │                  │  │                                                          │  │
│  │  👥 Users ← →    │  │  System Overview                                         │  │
│  │                  │  │                                                          │  │
│  │  🏥 System       │  │  ┌─────────────────┐  ┌─────────────────┐              │  │
│  │     Health       │  │  │  Total Users    │  │  Active Sessions │              │  │
│  │                  │  │  │      147        │  │       23         │              │  │
│  │                  │  │  └─────────────────┘  └─────────────────┘              │  │
│  │  📊 Reports      │  │                                                          │  │
│  │                  │  │  ┌─────────────────┐  ┌─────────────────┐              │  │
│  │                  │  │  │  Total Students │  │  Data Collection │              │  │
│  │  ⚙️ Settings     │  │  │      100        │  │   Sessions Today │              │  │
│  │                  │  │  └─────────────────┘  │       45         │              │  │
│  │                  │  │                        └─────────────────┘              │  │
│  └──────────────────┘  │                                                          │  │
│                        │  Recent Activity                                         │  │
│                        │  ┌──────────────────────────────────────────────────┐   │  │
│                        │  │  • User "Jane Doe" created - 2 min ago           │   │  │
│                        │  │  • Student "John S." assigned to RBT - 15 min    │   │  │
│                        │  │  • System health check passed - 1 hour           │   │  │
│                        │  └──────────────────────────────────────────────────┘   │  │
│                        │                                                          │  │
│                        │  Quick Actions                                           │  │
│                        │  ┌──────────────┐  ┌──────────────┐                    │  │
│                        │  │ + Create User│  │ 🏥 View Health│                    │  │
│                        │  └──────────────┘  └──────────────┘                    │  │
│                        │                                                          │  │
│                        └──────────────────────────────────────────────────────────┘  │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## User Management - User List

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [#env-banner] DEMO MODE | Role: Admin | 2025-12-10 14:30:45 | Admin User | [Logout][⚙] │
└────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                        │
│  ┌──────────────────┐  ┌──────────────────────────────────────────────────────────┐  │
│  │                  │  │                                                          │  │
│  │  📋 Dashboard    │  │  User Management                    [#users-count] 147   │  │
│  │                  │  │                                                          │  │
│  │  👥 Users ← →    │  │  ┌─────────────────────────────────────────────────┐   │  │
│  │                  │  │  │  [#users-search]                                │   │  │
│  │  🏥 System       │  │  │  🔍 Search by name or email...                 │   │  │
│  │     Health       │  │  └─────────────────────────────────────────────────┘   │  │
│  │                  │  │                                                          │  │
│  │  📊 Reports      │  │  Filters:                                                │  │
│  │                  │  │  ┌──────────────┐  ┌──────────────┐                    │  │
│  │                  │  │  │[#users-role-filter]│[#users-status-filter]         │  │
│  │  ⚙️ Settings     │  │  │ All Roles ▼  │  │ All Status ▼ │                    │  │
│  │                  │  │  └──────────────┘  └──────────────┘                    │  │
│  │                  │  │                                                          │  │
│  └──────────────────┘  │  ┌──────────────────────────────────────────────────┐   │  │
│                        │  │  [#create-user-btn] + Create New User             │   │  │
│                        │  └──────────────────────────────────────────────────┘   │  │
│                        │                                                          │  │
│                        │  [#users-table]                                          │  │
│                        │  ┌───────────────────────────────────────────────────┐  │  │
│                        │  │ Name ▲│ Email         │ Role  │Status│Last Active│  │  │
│                        │  ├───────────────────────────────────────────────────┤  │  │
│                        │  │ Smith │admin@sch.edu  │Admin  │●Act │2 min ago  │  │  │
│                        │  │ Dr.Jane│jane.d@sch.edu│BCBA   │●Act │15 min ago │  │  │
│                        │  │ John D.│john.d@sch.edu│RBT    │●Act │1 hour ago │  │  │
│                        │  │ Mary K.│mary.k@sch.edu│RBT    │●Act │3 hours ago│  │  │
│                        │  │ Bob W. │bob.w@sch.edu │BCBA   │○Inact│2 days ago│  │  │
│                        │  │ ...                                               │  │  │
│                        │  └───────────────────────────────────────────────────┘  │  │
│                        │                                                          │  │
│                        │  [#users-pagination]                                     │  │
│                        │  ← Previous  1 2 3 ... 6  Next →     25 per page ▼      │  │
│                        │                                                          │  │
│                        └──────────────────────────────────────────────────────────┘  │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

**Table Interactions:**
- Click column header to sort
- Click row to open Edit User modal
- Hover row highlights entire row
- Active status: Green dot (●)
- Inactive status: Gray dot (○)

**Testing IDs:**
- `#users-count` - Total user count badge
- `#users-search` - Search input field
- `#users-role-filter` - Role filter dropdown
- `#users-status-filter` - Status filter dropdown
- `#create-user-btn` - Create user button
- `#users-table` - User table container
- `#users-pagination` - Pagination controls

---

## Create User Modal

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                        │
│  ╔══════════════════════════════════════════════════════════════════════════════════╗ │
│  ║  [#create-user-modal]                                                 [#undo-btn] ║ │
│  ║                                                                       [#redo-btn] ║ │
│  ║  Create New User                                                                  ║ │
│  ║                                                                                   ║ │
│  ║  ┌────────────────────────────────────────────────────────────────────────────┐  ║ │
│  ║  │  First Name                                       [#user-first-name]       │  ║ │
│  ║  │  ┌──────────────────────────────────────────────────────────────────────┐  │  ║ │
│  ║  │  │  Jane                                                                │  │  ║ │
│  ║  │  └──────────────────────────────────────────────────────────────────────┘  │  ║ │
│  ║  └────────────────────────────────────────────────────────────────────────────┘  ║ │
│  ║                                                                                   ║ │
│  ║  ┌────────────────────────────────────────────────────────────────────────────┐  ║ │
│  ║  │  Last Name                                        [#user-last-name]        │  ║ │
│  ║  │  ┌──────────────────────────────────────────────────────────────────────┐  │  ║ │
│  ║  │  │  Doe                                                                 │  │  ║ │
│  ║  │  └──────────────────────────────────────────────────────────────────────┘  │  ║ │
│  ║  └────────────────────────────────────────────────────────────────────────────┘  ║ │
│  ║                                                                                   ║ │
│  ║  ┌────────────────────────────────────────────────────────────────────────────┐  ║ │
│  ║  │  Email Address                                    [#user-email]            │  ║ │
│  ║  │  ┌──────────────────────────────────────────────────────────────────────┐  │  ║ │
│  ║  │  │  jane.doe@school.edu                                                 │  │  ║ │
│  ║  │  └──────────────────────────────────────────────────────────────────────┘  │  ║ │
│  ║  │  ✓ Email is available                                                     │  ║ │
│  ║  └────────────────────────────────────────────────────────────────────────────┘  ║ │
│  ║                                                                                   ║ │
│  ║  ┌────────────────────────────────────────────────────────────────────────────┐  ║ │
│  ║  │  Role                                             [#user-role]             │  ║ │
│  ║  │  ┌──────────────────────────────────────────────────────────────────────┐  │  ║ │
│  ║  │  │  BCBA ▼                                                              │  │  ║ │
│  ║  │  ├──────────────────────────────────────────────────────────────────────┤  │  ║ │
│  ║  │  │  Admin                                                               │  │  ║ │
│  ║  │  │  BCBA                                                    ←selected   │  │  ║ │
│  ║  │  │  RBT                                                                 │  │  ║ │
│  ║  │  └──────────────────────────────────────────────────────────────────────┘  │  ║ │
│  ║  └────────────────────────────────────────────────────────────────────────────┘  ║ │
│  ║                                                                                   ║ │
│  ║  [#user-create-success] - Hidden until creation                                  ║ │
│  ║                                                                                   ║ │
│  ║  Temporary Password (copy and send to user):                                     ║ │
│  ║  ┌────────────────────────────────────────────────────────────────────────────┐  ║ │
│  ║  │  [#user-temp-password]                                                     │  ║ │
│  ║  │  TempPass2024!Xy7                         [#copy-password-btn] 📋 Copy     │  ║ │
│  ║  └────────────────────────────────────────────────────────────────────────────┘  ║ │
│  ║  ⚠️  This password will only be shown once. Make sure to copy it.               ║ │
│  ║                                                                                   ║ │
│  ║  ┌──────────────────────────┐  ┌────────────────────────┐                       ║ │
│  ║  │      Create User         │  │        Cancel          │                       ║ │
│  ║  └──────────────────────────┘  └────────────────────────┘                       ║ │
│  ║                                                                                   ║ │
│  ╚══════════════════════════════════════════════════════════════════════════════════╝ │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

**Validation:**
- First Name: Required, 2-50 characters
- Last Name: Required, 2-50 characters
- Email: Required, valid format, unique (check on blur)
- Role: Required, dropdown selection

**After Successful Creation:**
- Temp password section becomes visible
- "Create User" button changes to "Done"
- Success message appears: "✓ User created successfully!"
- Audit log entry created

**Testing IDs:**
- `#create-user-modal` - Modal container
- `#user-first-name` - First name input
- `#user-last-name` - Last name input
- `#user-email` - Email input
- `#user-role` - Role dropdown
- `#user-temp-password` - Temp password display
- `#copy-password-btn` - Copy to clipboard button
- `#user-create-success` - Success message

---

## Edit User Modal

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                        │
│  ╔══════════════════════════════════════════════════════════════════════════════════╗ │
│  ║  [#edit-user-modal]                                               [#undo-btn]    ║ │
│  ║                                                                   [#redo-btn]    ║ │
│  ║  Edit User: jane.doe@school.edu                                                  ║ │
│  ║                                                                                   ║ │
│  ║  ┌────────────────────────────────────────────────────────────────────────────┐  ║ │
│  ║  │  First Name                                       [#user-first-name]       │  ║ │
│  ║  │  ┌──────────────────────────────────────────────────────────────────────┐  │  ║ │
│  ║  │  │  Jane                                                                │  │  ║ │
│  ║  │  └──────────────────────────────────────────────────────────────────────┘  │  ║ │
│  ║  └────────────────────────────────────────────────────────────────────────────┘  ║ │
│  ║                                                                                   ║ │
│  ║  ┌────────────────────────────────────────────────────────────────────────────┐  ║ │
│  ║  │  Last Name                                        [#user-last-name]        │  ║ │
│  ║  │  ┌──────────────────────────────────────────────────────────────────────┐  │  ║ │
│  ║  │  │  Doe                                                                 │  │  ║ │
│  ║  │  └──────────────────────────────────────────────────────────────────────┘  │  ║ │
│  ║  └────────────────────────────────────────────────────────────────────────────┘  ║ │
│  ║                                                                                   ║ │
│  ║  ┌────────────────────────────────────────────────────────────────────────────┐  ║ │
│  ║  │  Email Address (cannot be changed)                                         │  ║ │
│  ║  │  ┌──────────────────────────────────────────────────────────────────────┐  │  ║ │
│  ║  │  │  jane.doe@school.edu                                (disabled)       │  │  ║ │
│  ║  │  └──────────────────────────────────────────────────────────────────────┘  │  ║ │
│  ║  └────────────────────────────────────────────────────────────────────────────┘  ║ │
│  ║                                                                                   ║ │
│  ║  ┌────────────────────────────────────────────────────────────────────────────┐  ║ │
│  ║  │  Role                                             [#user-role]             │  ║ │
│  ║  │  ┌──────────────────────────────────────────────────────────────────────┐  │  ║ │
│  ║  │  │  BCBA ▼                                                              │  │  ║ │
│  ║  │  └──────────────────────────────────────────────────────────────────────┘  │  ║ │
│  ║  └────────────────────────────────────────────────────────────────────────────┘  ║ │
│  ║                                                                                   ║ │
│  ║  ┌────────────────────────────────────────────────────────────────────────────┐  ║ │
│  ║  │  Status                                                                    │  ║ │
│  ║  │  ● Active        Last Active: 15 minutes ago                              │  ║ │
│  ║  └────────────────────────────────────────────────────────────────────────────┘  ║ │
│  ║                                                                                   ║ │
│  ║  ┌────────────────────────────────────────────────────────────────────────────┐  ║ │
│  ║  │  [#reset-password-btn] 🔒 Reset Password                                   │  ║ │
│  ║  └────────────────────────────────────────────────────────────────────────────┘  ║ │
│  ║                                                                                   ║ │
│  ║  ┌──────────────┐  ┌────────────┐  ┌─────────────────┐  ┌────────────┐         ║ │
│  ║  │  Save Changes│  │ Deactivate │  │  Delete User    │  │   Cancel   │         ║ │
│  ║  └──────────────┘  └────────────┘  └─────────────────┘  └────────────┘         ║ │
│  ║   (Primary)       [#deactivate-    [#delete-user-btn]                           ║ │
│  ║                    user-btn]        (Destructive, red)                           ║ │
│  ╚══════════════════════════════════════════════════════════════════════════════════╝ │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

**Actions:**
- **Save Changes**: Updates user info, shows success message
- **Reset Password**: Generates new temp password, shows in modal
- **Deactivate**: Opens confirmation modal
- **Delete User**: Opens confirmation modal (only if no associated data)
- **Cancel**: Closes modal without saving

**Testing IDs:**
- `#edit-user-modal` - Modal container
- `#user-first-name` - First name input
- `#user-last-name` - Last name input
- `#user-role` - Role dropdown
- `#reset-password-btn` - Reset password button
- `#deactivate-user-btn` - Deactivate button
- `#delete-user-btn` - Delete button

---

## Deactivate User Confirmation Modal

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                        │
│  ╔══════════════════════════════════════════════════════════════════════════════════╗ │
│  ║  [#confirm-deactivate-modal]                                                     ║ │
│  ║                                                                                   ║ │
│  ║  ⚠️  Deactivate User?                                                            ║ │
│  ║                                                                                   ║ │
│  ║  Are you sure you want to deactivate jane.doe@school.edu?                        ║ │
│  ║                                                                                   ║ │
│  ║  This user will no longer be able to log in. You can reactivate                  ║ │
│  ║  them later if needed.                                                            ║ │
│  ║                                                                                   ║ │
│  ║  ┌──────────────────────────┐  ┌────────────────────────┐                       ║ │
│  ║  │  Yes, Deactivate         │  │        Cancel          │                       ║ │
│  ║  └──────────────────────────┘  └────────────────────────┘                       ║ │
│  ║   (Destructive action)                                                            ║ │
│  ║                                                                                   ║ │
│  ╚══════════════════════════════════════════════════════════════════════════════════╝ │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

**Testing IDs:**
- `#confirm-deactivate-modal` - Modal container
- `#confirm-deactivate-btn` - Confirm button
- `#cancel-deactivate-btn` - Cancel button

---

## System Health Dashboard

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [#env-banner] DEMO MODE | Role: Admin | 2025-12-10 14:30:45 | Admin User | [Logout][⚙] │
└────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                        │
│  ┌──────────────────┐  ┌──────────────────────────────────────────────────────────┐  │
│  │                  │  │                                                          │  │
│  │  📋 Dashboard    │  │  System Health Dashboard      [#refresh-metrics-btn] 🔄 │  │
│  │                  │  │                                                          │  │
│  │  👥 Users        │  │  [#db-row-counts] Database Statistics                   │  │
│  │                  │  │                                                          │  │
│  │  🏥 System       │  │  ┌───────────────────────────────────────────────────┐  │  │
│  │     Health ← →   │  │  │  Table              Row Count          Status     │  │  │
│  │                  │  │  ├───────────────────────────────────────────────────┤  │  │
│  │  📊 Reports      │  │  │  [#users-row-count]                                │  │  │
│  │                  │  │  │  users              147                ✓          │  │  │
│  │                  │  │  │  [#students-row-count]                             │  │  │
│  │  ⚙️ Settings     │  │  │  students           100                ✓          │  │  │
│  │                  │  │  │  [#programs-row-count]                             │  │  │
│  │                  │  │  │  programs           250                ✓          │  │  │
│  └──────────────────┘  │  │  [#sessions-row-count]                             │  │  │
│                        │  │  sessions           1,247              ✓          │  │  │
│                        │  │  [#trials-row-count]                               │  │  │
│                        │  │  trials             15,823             ✓          │  │  │
│                        │  │  treatment_plans    95                 ✓          │  │  │
│                        │  │  targets            450                ✓          │  │  │
│                        │  └───────────────────────────────────────────────────┘  │  │
│                        │                                                          │  │
│                        │  [#demo-data-status] Demo Data Status                    │  │
│                        │  ┌───────────────────────────────────────────────────┐  │  │
│                        │  │  Status: ✓ Demo data installed                    │  │  │
│                        │  │  Last Install: 2025-12-10 08:00:00                │  │  │
│                        │  │  Demo Students: 5                                 │  │  │
│                        │  │  Demo Sessions: 120 (last 90 days)                │  │  │
│                        │  │                                                   │  │  │
│                        │  │  [#clear-demo-btn] Clear Demo Data                │  │  │
│                        │  └───────────────────────────────────────────────────┘  │  │
│                        │                                                          │  │
│                        │  Mobile Sync Status                                      │  │
│                        │  ┌───────────────────────────────────────────────────┐  │  │
│                        │  │  [#last-sync-timestamp]                           │  │  │
│                        │  │  • RBT Device #1: Synced 5 min ago               │  │  │
│                        │  │  • RBT Device #2: Synced 2 hours ago             │  │  │
│                        │  │  • RBT Device #3: ⚠️  Last seen 1 day ago        │  │  │
│                        │  │  • RBT Device #4: Synced 10 min ago              │  │  │
│                        │  └───────────────────────────────────────────────────┘  │  │
│                        │                                                          │  │
│                        │  System Information                                      │  │
│                        │  ┌───────────────────────────────────────────────────┐  │  │
│                        │  │  Backend Version: 1.0.0                           │  │  │
│                        │  │  Database: PostgreSQL 15.3                        │  │  │
│                        │  │  Python: 3.14.0                                   │  │  │
│                        │  │  Uptime: 7 days, 14 hours                         │  │  │
│                        │  └───────────────────────────────────────────────────┘  │  │
│                        │                                                          │  │
│                        └──────────────────────────────────────────────────────────┘  │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

**Purpose:**
- Verify demo data installed correctly
- Debug data collection issues (check if trials being written)
- Monitor system health
- Track mobile device sync status

**Refresh Behavior:**
- Click refresh button to update all metrics
- Auto-refreshes every 60 seconds
- Shows loading spinner during refresh

**Testing IDs:**
- `#db-row-counts` - Database statistics container
- `#users-row-count` - Users row count
- `#students-row-count` - Students row count
- `#programs-row-count` - Programs row count
- `#sessions-row-count` - Sessions row count
- `#trials-row-count` - Trials row count
- `#demo-data-status` - Demo data status container
- `#install-demo-btn` - Install demo data button
- `#clear-demo-btn` - Clear demo data button
- `#refresh-metrics-btn` - Refresh button
- `#last-sync-timestamp` - Mobile sync timestamps

---

**Related User Stories:**
- ADMIN-001: View User List
- ADMIN-002: Create New User
- ADMIN-003: Edit User
- ADMIN-004: Deactivate/Reactivate User
- ADMIN-005: View System Health Dashboard

**Next Mockups:**
- BCBA web interface mockups
- RBT mobile interface mockups
- Data visualization mockups
