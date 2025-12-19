# Component Registry

Catalog of all reusable UI components with their APIs, props, and usage guidelines.

## Purpose

This registry serves as:
1. **Component documentation** for developers
2. **Reusability guide** to avoid duplicate components
3. **API reference** for AI coding agents
4. **Design system** foundation

## Component Categories

### Form Controls
- [Button](#button)
- [Input](#input)
- [Textarea](#textarea)
- [Checkbox](#checkbox)
- [Select](#select)
- [Switch](#switch)

### Data Display
- [Card](#card)
- [Table](#table)
- [List](#list)
- [Badge](#badge)
- [Stats](#stats)
- [ProgressBar](#progressbar)

### Data Collection Specific
- [TrialRecorder](#trialrecorder)
- [FrequencyCounter](#frequencycounter)
- [DurationTimer](#durationtimer)
- [IntervalTimer](#intervaltimer)
- [ABCForm](#abcform)
- [TaskAnalysisGrid](#taskanalysisgrid)

### Visualization
- [LineGraph](#linegraph)
- [BarChart](#barchart)
- [TrialHistoryBar](#trialhistorybar)
- [TrendIndicator](#trendindicator)

### Navigation
- [Header](#header)
- [TabBar](#tabbar)
- [Drawer](#drawer)
- [Breadcrumb](#breadcrumb)

### Feedback
- [Alert](#alert)
- [Toast](#toast)
- [Modal](#modal)
- [Spinner](#spinner)
- [Skeleton](#skeleton)

### Utilities
- [EnvironmentBanner](#environmentbanner)
- [OfflineIndicator](#offlineindicator)
- [SyncStatus](#syncstatus)
- [PermissionGate](#permissiongate)

---

## Component Details

### Button

**Purpose**: Clickable action trigger with variants for different contexts

**Props**:
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'warning';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  haptic?: boolean; // Mobile only
  hotkey?: string; // Keyboard shortcut
  onClick: () => void;
  children: React.ReactNode;
}
```

**Usage**:
```tsx
<Button 
  variant="success" 
  size="large" 
  haptic 
  onClick={handleRecordTrial}
>
  ✓ CORRECT
</Button>
```

**Accessibility**:
- ARIA labels
- Keyboard navigation
- Focus indicators
- Minimum 44x44px touch target

**Related Files**:
- Component: `src/components/Button/Button.tsx`
- Tests: `src/components/Button/Button.test.tsx`
- Styles: `src/components/Button/Button.styles.ts`

**Used In**: All screens

---

### TrialRecorder

**Purpose**: Specialized interface for discrete trial training data collection

**Props**:
```typescript
interface TrialRecorderProps {
  sessionId: string;
  programId: string;
  currentTarget: Target;
  trialHistory: Trial[];
  onRecordTrial: (response: TrialResponse) => Promise<void>;
  onUndo: () => Promise<void>;
  onAddNote: (note: string) => Promise<void>;
  offline?: boolean;
  loading?: boolean;
}

interface Target {
  id: string;
  sd_text: string; // Discriminative stimulus
  materials?: string;
  prompt_hierarchy?: string[];
}

interface Trial {
  id: string;
  response: 'correct' | 'prompted' | 'incorrect';
  timestamp: Date;
  notes?: string;
}

type TrialResponse = 'correct' | 'prompted' | 'incorrect';
```

**Usage**:
```tsx
<TrialRecorder
  sessionId={session.id}
  programId={program.id}
  currentTarget={currentTarget}
  trialHistory={trials}
  onRecordTrial={handleRecordTrial}
  onUndo={handleUndo}
  offline={!isOnline}
/>
```

**State Management**:
- Uses local state for immediate UI updates
- Optimistic updates for perceived performance
- Queues offline actions in IndexedDB

**Performance Considerations**:
- Debounced API calls (100ms)
- Virtual list for trial history (>100 trials)
- Memoized statistics calculations

**Related Files**:
- Component: `src/components/TrialRecorder/TrialRecorder.tsx`
- Hook: `src/hooks/useTrialRecorder.ts`
- Store: `src/stores/trialStore.ts`
- Tests: `src/components/TrialRecorder/TrialRecorder.test.tsx`

**Screen Spec**: [rbt/trial-recording.yaml](./screen-states/rbt/trial-recording.yaml)

---

### FrequencyCounter

**Purpose**: Simple counter interface for frequency/event recording

**Props**:
```typescript
interface FrequencyCounterProps {
  sessionId: string;
  programId: string;
  behaviorName: string;
  currentCount: number;
  sessionDuration: number; // seconds
  onIncrement: () => Promise<void>;
  onDecrement: () => Promise<void>;
  onAddNote: (note: string, timestamp: Date) => Promise<void>;
  recentEvents?: Event[];
  offline?: boolean;
}

interface Event {
  id: string;
  timestamp: Date;
  notes?: string;
}
```

**Usage**:
```tsx
<FrequencyCounter
  sessionId={session.id}
  programId={program.id}
  behaviorName="Spontaneous Mands"
  currentCount={count}
  sessionDuration={elapsed}
  onIncrement={handleIncrement}
  onDecrement={handleDecrement}
  recentEvents={events}
/>
```

**Features**:
- Large + button for quick tapping
- Auto-calculates rate per minute
- Optional timestamped notes per event
- Visual recent event log

**Related Files**:
- Component: `src/components/FrequencyCounter/FrequencyCounter.tsx`
- Tests: `src/components/FrequencyCounter/FrequencyCounter.test.tsx`

**Screen Spec**: [rbt/frequency-recording.yaml](./screen-states/rbt/frequency-recording.yaml)

---

### DurationTimer

**Purpose**: Stopwatch interface for recording behavior duration

**Props**:
```typescript
interface DurationTimerProps {
  sessionId: string;
  programId: string;
  behaviorName: string;
  isRunning: boolean;
  currentDuration: number; // seconds
  totalDuration: number; // sum of all episodes today
  episodeCount: number;
  onStart: () => Promise<void>;
  onStop: () => Promise<void>;
  onPause: () => Promise<void>;
  onResume: () => Promise<void>;
  alertThreshold?: number; // seconds
  offline?: boolean;
}
```

**Usage**:
```tsx
<DurationTimer
  sessionId={session.id}
  programId={program.id}
  behaviorName="On-Task Behavior"
  isRunning={isRunning}
  currentDuration={elapsed}
  totalDuration={totalToday}
  episodeCount={episodes}
  onStart={handleStart}
  onStop={handleStop}
  alertThreshold={300} // 5 minutes
/>
```

**Features**:
- Large, readable timer display
- Pause/resume capability
- Haptic/audio alert at threshold
- Summary statistics (avg, longest)

**Related Files**:
- Component: `src/components/DurationTimer/DurationTimer.tsx`
- Hook: `src/hooks/useDurationTimer.ts`

**Screen Spec**: [rbt/duration-recording.yaml](./screen-states/rbt/duration-recording.yaml)

---

### LineGraph

**Purpose**: Time-series data visualization with annotations

**Props**:
```typescript
interface LineGraphProps {
  data: DataPoint[];
  xAxis: AxisConfig;
  yAxis: AxisConfig;
  annotations?: Annotation[];
  trendLine?: boolean;
  showPoints?: boolean;
  interactive?: boolean;
  height?: number;
  width?: number | '100%';
}

interface DataPoint {
  x: Date | number;
  y: number;
  label?: string;
  metadata?: Record<string, any>;
}

interface AxisConfig {
  label: string;
  min?: number;
  max?: number;
  format?: (value: any) => string;
}

interface Annotation {
  id: string;
  type: 'phase_change' | 'note' | 'alert';
  position: Date | number;
  label: string;
  color?: string;
}
```

**Usage**:
```tsx
<LineGraph
  data={progressData}
  xAxis={{ label: 'Date', format: formatDate }}
  yAxis={{ label: '% Correct', min: 0, max: 100 }}
  annotations={phaseChanges}
  trendLine
  showPoints
/>
```

**Features**:
- Responsive sizing
- Touch/mouse zoom and pan
- Tooltip on hover/tap
- Export as PNG/SVG

**Related Files**:
- Component: `src/components/LineGraph/LineGraph.tsx`
- Utilities: `src/utils/graphing.ts`

---

### TrialHistoryBar

**Purpose**: Compact visual representation of recent trial outcomes

**Props**:
```typescript
interface TrialHistoryBarProps {
  trials: Trial[];
  maxDisplay?: number; // default 20
  showLabels?: boolean;
  onClick?: (trial: Trial) => void;
}

interface Trial {
  id: string;
  response: 'correct' | 'prompted' | 'incorrect';
  timestamp: Date;
}
```

**Usage**:
```tsx
<TrialHistoryBar
  trials={recentTrials}
  maxDisplay={20}
  onClick={handleTrialClick}
/>
```

**Rendering**:
```
✓✓◐✓✗✓✓✓◐✓✓✓✓✗✓✓✓✓✓✓
```

- ✓ = Correct (green)
- ◐ = Prompted (yellow)
- ✗ = Incorrect (red)

**Related Files**:
- Component: `src/components/TrialHistoryBar/TrialHistoryBar.tsx`

---

### EnvironmentBanner

**Purpose**: Visual indicator of current environment to prevent confusion

**Props**:
```typescript
interface EnvironmentBannerProps {
  environment: 'demo' | 'dev' | 'qa' | 'prod';
  position?: 'top' | 'bottom';
  dismissible?: boolean;
}
```

**Usage**:
```tsx
<EnvironmentBanner environment="demo" />
```

**Display**:
- **Demo**: Purple banner "🎭 DEMO MODE - Using fake data"
- **Dev**: Orange banner "🔧 DEVELOPMENT"
- **QA**: Yellow banner "🧪 QA/STAGING"
- **Prod**: No banner (or minimal "✓ Production")

**Related Files**:
- Component: `src/components/EnvironmentBanner/EnvironmentBanner.tsx`
- Config: `src/config/environment.ts`

---

### OfflineIndicator

**Purpose**: Show network status and pending sync items

**Props**:
```typescript
interface OfflineIndicatorProps {
  isOnline: boolean;
  pendingCount: number;
  lastSyncTime?: Date;
  onSyncNow?: () => Promise<void>;
}
```

**Usage**:
```tsx
<OfflineIndicator
  isOnline={navigator.onLine}
  pendingCount={offlineQueue.length}
  lastSyncTime={lastSync}
  onSyncNow={triggerSync}
/>
```

**States**:
- Online + synced: ✓ icon, no banner
- Online + syncing: Spinner + "Syncing..."
- Offline: ⚠️ icon, yellow banner with pending count

**Related Files**:
- Component: `src/components/OfflineIndicator/OfflineIndicator.tsx`
- Service: `src/services/offlineSync.ts`

---

### PermissionGate

**Purpose**: Conditionally render content based on user role/permissions

**Props**:
```typescript
interface PermissionGateProps {
  require: Permission | Permission[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

type Permission = 
  | 'view_student'
  | 'edit_student'
  | 'create_program'
  | 'edit_program'
  | 'view_all_students'
  | 'manage_users'
  | 'view_reports'
  | 'export_data'
  | 'manage_system';
```

**Usage**:
```tsx
<PermissionGate require="edit_program">
  <Button onClick={handleEdit}>Edit Program</Button>
</PermissionGate>

<PermissionGate 
  require={['view_reports', 'export_data']}
  fallback={<Alert>You don't have permission to export</Alert>}
>
  <ExportButton />
</PermissionGate>
```

**Related Files**:
- Component: `src/components/PermissionGate/PermissionGate.tsx`
- Hook: `src/hooks/usePermissions.ts`
- Context: `src/contexts/AuthContext.tsx`

---

## Component Development Guidelines

### Creating New Components

1. **Check this registry first** - Don't duplicate existing components
2. **Follow naming conventions**: PascalCase, descriptive names
3. **TypeScript required**: All props must be typed
4. **Include tests**: Minimum 80% coverage
5. **Add to Storybook**: For visual documentation
6. **Update this registry**: Add entry when component is stable

### Component Structure

```
src/components/ComponentName/
├── ComponentName.tsx          # Main component
├── ComponentName.test.tsx     # Unit tests
├── ComponentName.stories.tsx  # Storybook stories
├── ComponentName.styles.ts    # Styled components or CSS modules
├── index.ts                   # Export barrel
└── README.md                  # Component-specific docs (if complex)
```

### Testing Requirements

Each component must have:
- Unit tests for all props variations
- Accessibility tests (screen reader, keyboard navigation)
- Integration tests if component manages state
- Mobile-specific tests for touch/haptic if applicable

### Performance Checklist

- [ ] Memoization for expensive calculations
- [ ] Virtual scrolling for lists >100 items
- [ ] Lazy loading for heavy components
- [ ] Optimistic UI updates where appropriate
- [ ] Debounced API calls
- [ ] Image optimization
- [ ] Bundle size consideration

### Accessibility Checklist

- [ ] ARIA labels and roles
- [ ] Keyboard navigation support
- [ ] Focus management
- [ ] Color contrast WCAG AA
- [ ] Screen reader tested
- [ ] Touch target minimum 44x44px (mobile)
- [ ] Motion reduction support

---

## Component Metrics

| Category | Count | Test Coverage | Documented |
|----------|-------|---------------|------------|
| Form Controls | 6 | 85% | ✓ |
| Data Display | 6 | 78% | ✓ |
| Data Collection | 6 | 92% | ✓ |
| Visualization | 4 | 70% | ✓ |
| Navigation | 4 | 80% | ✓ |
| Feedback | 5 | 88% | ✓ |
| Utilities | 4 | 95% | ✓ |
| **Total** | **35** | **84%** | **100%** |

---

**Last Updated**: 2025-12-10  
**Maintained By**: Engineering Team
