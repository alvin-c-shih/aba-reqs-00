# Authentication UI Mockups

## Login Screen

```
┌────────────────────────────────────────────────────────────┐
│ [#env-banner]                                              │
│ DEMO MODE | 2025-12-10 14:30:45                           │
│ (Blue background)                                          │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                                                            │
│                    ABA Data Collection                     │
│                        & Analysis                          │
│                                                            │
│                     [Logo/Icon Here]                       │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Email Address                     [#login-email]     │ │
│  │ ┌──────────────────────────────────────────────────┐ │ │
│  │ │ user@example.com                                 │ │ │
│  │ └──────────────────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Password                          [#login-password]  │ │
│  │ ┌──────────────────────────────────────────────────┐ │ │
│  │ │ ••••••••••                        [👁]           │ │ │
│  │ └──────────────────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  [#login-error - Hidden by default]                       │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ ❌ Invalid email or password. Please try again.     │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │                  [#login-submit]                     │ │
│  │                    Sign In                           │ │
│  └──────────────────────────────────────────────────────┘ │
│                  (Disabled if fields empty)                │
│                                                            │
│                  Forgot Password?                          │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**States:**
- Default: Both fields empty, button disabled
- Typing: Button enables when both fields have values
- Error: Show #login-error banner with red background
- Loading: Button shows spinner, disabled during auth

**Keyboard Support:**
- Tab: Move between fields
- Enter: Submit form (if enabled)

**Testing IDs:**
- `#login-email` - Email input field
- `#login-password` - Password input field
- `#login-submit` - Sign in button
- `#login-error` - Error message container
- `#env-banner` - Environment banner at top

---

## First Login - Password Change Modal

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  ╔════════════════════════════════════════════════════╗   │
│  ║  [#change-password-modal]                          ║   │
│  ║                                                     ║   │
│  ║  🔒 Change Your Password                           ║   │
│  ║                                                     ║   │
│  ║  For security, please change your temporary        ║   │
│  ║  password before continuing.                       ║   │
│  ║                                                     ║   │
│  ║  ┌───────────────────────────────────────────────┐ ║   │
│  ║  │ Current Password      [#current-password]     │ ║   │
│  ║  │ ┌───────────────────────────────────────────┐ │ ║   │
│  ║  │ │ ••••••••••                      [👁]      │ │ ║   │
│  ║  │ └───────────────────────────────────────────┘ │ ║   │
│  ║  └───────────────────────────────────────────────┘ ║   │
│  ║                                                     ║   │
│  ║  ┌───────────────────────────────────────────────┐ ║   │
│  ║  │ New Password          [#new-password]         │ ║   │
│  ║  │ ┌───────────────────────────────────────────┐ │ ║   │
│  ║  │ │                               [👁]        │ │ ║   │
│  ║  │ └───────────────────────────────────────────┘ │ ║   │
│  ║  │                                               │ ║   │
│  ║  │ [#password-strength]                          │ ║   │
│  ║  │ Password Strength: ████████░░ Strong          │ ║   │
│  ║  └───────────────────────────────────────────────┘ ║   │
│  ║                                                     ║   │
│  ║  Requirements:                                      ║   │
│  ║  ✓ At least 8 characters                           ║   │
│  ║  ✓ Contains uppercase letter                       ║   │
│  ║  ✓ Contains number                                 ║   │
│  ║  ✗ Contains special character (!@#$%^&*)           ║   │
│  ║                                                     ║   │
│  ║  ┌───────────────────────────────────────────────┐ ║   │
│  ║  │ Confirm New Password  [#confirm-password]     │ ║   │
│  ║  │ ┌───────────────────────────────────────────┐ │ ║   │
│  ║  │ │                               [👁]        │ │ ║   │
│  ║  │ └───────────────────────────────────────────┘ │ ║   │
│  ║  └───────────────────────────────────────────────┘ ║   │
│  ║                                                     ║   │
│  ║  ┌───────────────────────────────────────────────┐ ║   │
│  ║  │           Change Password                     │ ║   │
│  ║  └───────────────────────────────────────────────┘ ║   │
│  ║            (Disabled until all valid)              ║   │
│  ║                                                     ║   │
│  ╚════════════════════════════════════════════════════╝   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Validation:**
- Current password must match temporary password
- New password must meet all 4 requirements
- Confirm password must match new password
- Real-time password strength indicator

**Password Strength Colors:**
- Weak: Red
- Fair: Yellow
- Strong: Green

**Testing IDs:**
- `#change-password-modal` - Modal container
- `#current-password` - Current password input
- `#new-password` - New password input
- `#confirm-password` - Confirm password input
- `#password-strength` - Strength indicator bar

---

## Session Expired Modal

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  ╔════════════════════════════════════════════════════╗   │
│  ║  [#session-expired-modal]                          ║   │
│  ║                                                     ║   │
│  ║  ⏰ Session Expired                                ║   │
│  ║                                                     ║   │
│  ║  Your session has expired for security reasons.    ║   │
│  ║  Please log in again to continue.                  ║   │
│  ║                                                     ║   │
│  ║  Any unsaved changes have been preserved and       ║   │
│  ║  will be available after you log in.               ║   │
│  ║                                                     ║   │
│  ║  ┌───────────────────────────────────────────────┐ ║   │
│  ║  │  [#relogin-btn]      Log In Again             │ ║   │
│  ║  └───────────────────────────────────────────────┘ ║   │
│  ║                                                     ║   │
│  ╚════════════════════════════════════════════════════╝   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Behavior:**
- Modal cannot be dismissed (no X button, no click outside)
- Must click "Log In Again" to proceed
- Redirects to login screen
- After successful login, returns to previous page

**Testing IDs:**
- `#session-expired-modal` - Modal container
- `#relogin-btn` - Log in again button

---

## Environment Banner (Persistent Header)

```
┌────────────────────────────────────────────────────────────┐
│ [#env-banner]                                              │
│                                                            │
│ [#env-name] DEMO MODE                                      │
│ [#user-role] Role: BCBA                                    │
│ [#current-time] 2025-12-10 14:30:45                       │
│ [#user-name] Logged in as: Dr. Jane Smith                 │
│                                             [Logout] [⚙️]   │
└────────────────────────────────────────────────────────────┘
```

**Environment Colors:**
- **Demo**: `background: #3B82F6` (Blue)
- **Dev**: `background: #10B981` (Green)
- **QA**: `background: #F59E0B` (Yellow/Amber)
- **Prod**: `background: #EF4444` (Red)

**Layout:**
- Fixed position at top of all screens
- Sticky (stays visible when scrolling)
- Text color: White for all environments
- Height: 60px

**Dynamic Elements:**
- `#current-time` updates every second
- `#env-name` set via environment variable
- `#user-role` from current user session
- `#user-name` from current user session

**Testing IDs:**
- `#env-banner` - Banner container
- `#env-name` - Environment name text
- `#user-role` - User role text
- `#current-time` - Timestamp text
- `#user-name` - User name text
- `#logout-btn` - Logout button
- `#settings-btn` - Settings icon button

---

## Undo/Redo Controls (Standard for all forms)

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  Form Title                                                │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  [#undo-btn]  ↶  Undo                               │  │
│  │                                                      │  │
│  │  [#redo-btn]  ↷  Redo                               │  │
│  │                                 (Keyboard: Ctrl+Z/Y) │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  [Form fields here...]                                     │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Positioning:**
- Top-right of form area
- Always visible while form is active
- Buttons grouped together

**Button States:**
- **Enabled**: Full opacity, clickable, blue color
- **Disabled**: 50% opacity, not clickable, gray color
- **Hover** (enabled): Darker blue, slight scale
- **Active** (clicked): Slight scale down

**Keyboard Shortcuts:**
- Ctrl+Z: Undo
- Ctrl+Y or Ctrl+Shift+Z: Redo

**Undo/Redo Stack:**
- Maximum 50 actions stored
- Cleared on form submit or navigation
- Persists within current form session

**Toast Notification:**
```
┌──────────────────────────┐
│  #undo-toast             │
│  ↶ Action undone         │
└──────────────────────────┘

or

┌──────────────────────────┐
│  #undo-toast             │
│  ↷ Action redone         │
└──────────────────────────┘
```
(Appears bottom-center, fades after 2 seconds)

**Testing IDs:**
- `#undo-btn` - Undo button
- `#redo-btn` - Redo button
- `#undo-toast` - Undo/redo notification

---

**Related User Stories:**
- AUTH-001: Admin Login
- COMMON-001: First-Time Login & Password Change
- COMMON-003: View Environment Banner
- COMMON-004: Undo/Redo Actions in Forms
- COMMON-005: JWT Token Refresh

**Next Mockups:**
- Admin interface mockups
- BCBA web interface mockups
- RBT mobile interface mockups
