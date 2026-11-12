# ADR-001: Offline-First Architecture

## Status
**Accepted** - 2025-12-10

## Context

The ABA data collection system will be used in a school environment where:
- WiFi reliability is inconsistent (dead zones, congestion during school hours)
- RBTs collect data in real-time during 1:1 therapy sessions
- Data collection cannot be interrupted by connectivity issues
- Users may work in different locations (classrooms, hallways, playground, home visits)
- School network can experience high load during busy times

### Requirements
- RBTs must be able to collect data without interruption
- No data loss even if device loses power or app crashes
- Seamless experience whether online or offline
- Automatic synchronization when connection restored
- Conflict resolution when same data edited offline and online

### Constraints
- Mobile devices (iOS/Android) are primary data collection interface
- Users expect native app performance (<100ms data entry latency)
- Battery life must not be severely impacted
- Storage space on devices is limited

## Decision

We will implement an **offline-first architecture** where:

1. **All data writes go to local storage first**
   - IndexedDB on web
   - WatermelonDB or SQLite on React Native
   - Immediate UI updates (optimistic)

2. **Background sync worker handles server synchronization**
   - Automatic sync when online
   - FIFO queue for pending operations
   - Exponential backoff retry strategy
   - Batch operations where possible

3. **Conflict resolution strategy**
   - Timestamp-based (last-write-wins by default)
   - Server wins for critical data (with user notification)
   - Manual resolution UI for unresolvable conflicts

4. **Visual indicators for sync status**
   - Clear offline/online mode indicator
   - Pending sync item count
   - Per-item sync status (synced, pending, failed)

## Consequences

### Positive

1. **Reliability**: Data collection never blocked by network issues
2. **Performance**: <100ms data entry latency achieved (local writes)
3. **User Experience**: Seamless experience regardless of connectivity
4. **Data Integrity**: Persistent local storage prevents data loss
5. **Battery Efficient**: Only sync when connection available

### Negative

1. **Complexity**: More complex than purely online system
   - State management across local and remote stores
   - Sync worker implementation
   - Conflict resolution logic
   - Testing offline scenarios

2. **Storage Requirements**: Local database required on all devices
   - Mobile app size increased (~5-10MB)
   - Storage cleanup needed for old data

3. **Consistency Challenges**: Eventual consistency model
   - Data may not be immediately visible to other users
   - Potential for conflicts that need resolution
   - Must educate users about sync status

4. **Development Cost**: Higher initial development effort
   - Two data layers (local + remote)
   - Sync worker infrastructure
   - Conflict resolution UI
   - Additional testing complexity

## Implementation Details

### Data Flow

```
User Action (e.g., record trial)
    ↓
Local Database Write (immediate)
    ↓
UI Update (optimistic)
    ↓
Queue for Sync
    ↓
Background Worker
    ↓
[When Online] POST to API
    ↓
[Success] Mark as synced
[Failure] Keep in queue, retry later
[Conflict] Trigger conflict resolution
```

### Sync Strategy

- **Automatic triggers**:
  - Network connection restored
  - App brought to foreground
  - Every 30 seconds if online and queue not empty
  
- **Manual trigger**:
  - User can force sync via button

- **Retry policy**:
  - Exponential backoff: 5s, 10s, 20s, 40s, 60s (max)
  - After 5 failures, flag for manual review

### Conflict Resolution Rules

1. **Session data** (trials, events, durations):
   - Timestamp wins (earlier recorded_at timestamp)
   - If timestamps equal, server wins
   - Log conflict for audit

2. **Program modifications**:
   - Server wins (BCBA changes take precedence)
   - Notify RBT that program was updated
   - Require explicit acknowledgment

3. **Student/User data**:
   - Server wins always
   - Refresh local cache

## Alternatives Considered

### 1. Always-Online Architecture
**Rejected** because:
- Unacceptable user experience during network issues
- Would require constant network access
- Higher latency for every action
- Risk of data loss if network fails mid-action

### 2. Offline-Only (No Server)
**Rejected** because:
- No data sharing between users
- No BCBA dashboard or analytics
- No parent portal
- Difficult backup and compliance
- Can't generate reports with multiple students

### 3. Pessimistic Sync (Manual Resolution for All Conflicts)
**Rejected** because:
- Poor user experience (constant conflict dialogs)
- Would slow down workflow
- Most conflicts can be resolved automatically
- Only 1-2% of writes expected to conflict

## Validation

### Metrics to Track
- Sync success rate (target: >95%)
- Sync latency (target: <5s for 100 items)
- Conflict rate (target: <2% of writes)
- Offline data loss incidents (target: 0)
- User-reported connectivity issues (target: <5 per month)

### Testing Strategy
- Unit tests for sync worker logic
- Integration tests for conflict scenarios
- E2E tests with network interruption
- Load testing for sync queue processing
- Manual testing in school environment

## Related Decisions
- **ADR-002**: React Native chosen for native offline storage access
- **ADR-004**: Optimistic UI updates complement offline-first approach

## References
- [Offline First Principles](https://offlinefirst.org/)
- [Google's Offline-First Guide](https://web.dev/offline-cookbook/)
- [PouchDB Conflict Resolution](https://pouchdb.com/guides/conflicts.html)

---

**Author**: Engineering Team  
**Reviewers**: Product, BCBA Lead, RBT Representative  
**Last Updated**: 2025-12-10
