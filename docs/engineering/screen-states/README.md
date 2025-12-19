# Screen State Specifications

Machine-readable specifications for all application screens. These specs drive both the UI implementation and automated testing.

## Purpose

Screen state specifications provide:
1. **Single source of truth** for screen behavior
2. **Test generation** inputs for automated testing
3. **AI coding context** for implementation
4. **API contract** validation

## Format

Each screen spec is a YAML file with this structure:

```yaml
screen_id: unique-identifier
name: Human-readable name
route: /path/to/screen
platform: [web, mobile, both]
roles: [admin, bcba, rbt, parent]

states:
  - state_id: default
    description: Initial screen load
    data_requirements:
      - entity: student
        fields: [id, name, programs]
    ui_elements:
      - id: student_name
        type: text
        source: student.name
        required: true
      - id: program_list
        type: list
        source: student.programs
        required: true
    actions:
      - id: start_session
        type: button
        enabled_when: programs.selected.length > 0
        api_call: POST /api/v1/sessions
        
  - state_id: loading
    description: While fetching data
    ui_elements:
      - id: loader
        type: spinner
        
  - state_id: error
    description: Error loading data
    ui_elements:
      - id: error_message
        type: alert
        source: error.message

transitions:
  - from: default
    to: loading
    trigger: user_action.start_session
  - from: loading
    to: success
    trigger: api_response.success
  - from: loading
    to: error
    trigger: api_response.error

api_endpoints:
  - method: GET
    path: /api/v1/students/{id}
    response_schema: StudentWithPrograms
  - method: POST
    path: /api/v1/sessions
    request_schema: SessionCreate
    response_schema: Session

test_scenarios:
  - scenario: successful_load
    given:
      - user_role: rbt
      - student_id: test-123
    when:
      - navigate_to: /students/test-123
    then:
      - element_visible: student_name
      - element_text: student_name == "Test Student A"
```

## Directory Structure

```
screen-states/
├── README.md (this file)
├── auth/
│   ├── login.yaml
│   └── 2fa-verify.yaml
├── rbt/
│   ├── student-list.yaml
│   ├── session-start.yaml
│   ├── trial-recording.yaml
│   ├── frequency-recording.yaml
│   ├── duration-recording.yaml
│   ├── session-end.yaml
│   ├── progress-graph.yaml
│   └── offline-sync.yaml
├── bcba/
│   ├── dashboard.yaml
│   ├── student-profile.yaml
│   ├── program-editor.yaml
│   ├── data-analysis.yaml
│   └── report-generator.yaml
├── parent/
│   ├── dashboard.yaml
│   └── progress-view.yaml
└── admin/
    ├── user-management.yaml
    ├── system-settings.yaml
    └── debug-dashboard.yaml
```

## Usage

### For Frontend Developers
Reference these specs when implementing screens to ensure all states and transitions are handled.

### For Backend Developers
Validate that API endpoints match the contracts defined in screen specs.

### For QA/Testing
Generate test cases directly from `test_scenarios` sections.

### For AI Coding Agents
Use as context when implementing or modifying screen functionality. The spec provides:
- Required data structure
- UI element relationships
- State transitions
- API dependencies

## Example: Using Spec for Code Generation

Given `screen-states/rbt/trial-recording.yaml`, an AI agent can generate:

1. **React Component Structure**
```typescript
interface TrialRecordingState {
  currentTarget: Target;
  trialHistory: Trial[];
  sessionStats: SessionStats;
}

const TrialRecording: React.FC = () => {
  // State derived from screen spec
  // Actions mapped to API endpoints
  // UI elements from ui_elements list
};
```

2. **API Client Methods**
```typescript
async function recordTrial(sessionId: string, response: TrialResponse) {
  return api.post(`/api/v1/sessions/${sessionId}/trials`, response);
}
```

3. **Test Cases**
```typescript
describe('Trial Recording Screen', () => {
  it('should record correct response', async () => {
    // Test scenario from spec
  });
});
```

## Validation

All screen spec files must pass schema validation:

```bash
npm run validate-screen-specs
```

Schema: `screen-states/schema.json`

---

**Key Screens by Priority:**

🔴 **P0 (MVP)**:
- auth/login.yaml
- rbt/student-list.yaml
- rbt/session-start.yaml
- rbt/trial-recording.yaml
- rbt/frequency-recording.yaml
- rbt/duration-recording.yaml
- rbt/session-end.yaml
- rbt/offline-sync.yaml

🟠 **P1 (Phase 2)**:
- bcba/dashboard.yaml
- bcba/program-editor.yaml
- bcba/data-analysis.yaml
- rbt/interval-recording.yaml
- rbt/abc-recording.yaml

🟡 **P2 (Phase 3)**:
- parent/dashboard.yaml
- admin/user-management.yaml
- bcba/report-generator.yaml

---

See example specs in their respective directories.
