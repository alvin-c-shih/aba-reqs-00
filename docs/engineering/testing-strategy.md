# Testing Strategy

Comprehensive testing approach for the ABA system with special focus on offline capability, HIPAA compliance, and data integrity.

## Testing Philosophy

1. **Confidence over Coverage**: Aim for meaningful tests, not just high percentage
2. **Test User Workflows**: Focus on end-to-end scenarios that users actually perform
3. **Automated by Default**: Manual testing only for visual/UX validation
4. **Test in Production**: Synthetic monitoring and feature flags for safe rollout
5. **Performance Matters**: Test performance in CI, not just functionality

## Test Pyramid

```
              ┌──────────────┐
              │   E2E Tests  │  <- 10% (Critical user flows)
              └──────────────┘
          ┌────────────────────┐
          │ Integration Tests  │  <- 30% (Component + API)
          └────────────────────┘
      ┌──────────────────────────┐
      │      Unit Tests          │  <- 60% (Pure functions, utils)
      └──────────────────────────┘
```

## Test Types

### Unit Tests (60% of tests)

**Purpose**: Test individual functions, components, and utilities in isolation

**Tools**:
- Jest (JavaScript/TypeScript)
- React Testing Library (UI components)
- pytest (if backend is Python)

**Coverage Targets**:
- Utilities: 95%
- Business logic: 90%
- Components: 80%
- Overall: 85%

**Example Unit Test**:
```typescript
// src/utils/calculations.test.ts
import { calculatePercentCorrect, calculateRate } from './calculations';

describe('calculatePercentCorrect', () => {
  it('should calculate percent correct for mixed responses', () => {
    const trials = [
      { response: 'correct' },
      { response: 'correct' },
      { response: 'incorrect' },
      { response: 'prompted' },
    ];
    expect(calculatePercentCorrect(trials)).toBe(50); // 2/4
  });

  it('should return 0 for empty array', () => {
    expect(calculatePercentCorrect([])).toBe(0);
  });

  it('should exclude prompted from calculation', () => {
    const trials = [
      { response: 'correct' },
      { response: 'prompted' },
    ];
    expect(calculatePercentCorrect(trials)).toBe(100);
  });
});
```

**What to Test**:
- Pure functions with various inputs
- Component rendering with different props
- Component user interactions (clicks, inputs)
- Edge cases (empty, null, undefined)
- Error states
- Accessibility (ARIA, keyboard navigation)

---

### Integration Tests (30% of tests)

**Purpose**: Test components working with API, state management, and other components

**Tools**:
- React Testing Library + MSW (Mock Service Worker)
- Supertest (API testing if backend is Node.js)
- Playwright Component Testing

**Example Integration Test**:
```typescript
// src/components/TrialRecorder/TrialRecorder.integration.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import TrialRecorder from './TrialRecorder';

const server = setupServer(
  rest.post('/api/v1/sessions/:id/trials', (req, res, ctx) => {
    return res(ctx.json({ id: 'trial-123', created_at: new Date() }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('TrialRecorder Integration', () => {
  it('should record a correct trial and update UI', async () => {
    render(<TrialRecorder sessionId="session-1" programId="prog-1" {...props} />);
    
    const correctButton = screen.getByRole('button', { name: /correct/i });
    fireEvent.click(correctButton);
    
    await waitFor(() => {
      expect(screen.getByText('✓')).toBeInTheDocument();
      expect(screen.getByText(/1\/1.*100%/)).toBeInTheDocument();
    });
  });

  it('should queue trial offline and show indicator', async () => {
    server.use(
      rest.post('/api/v1/sessions/:id/trials', (req, res, ctx) => {
        return res.networkError('Network error');
      })
    );

    render(<TrialRecorder sessionId="session-1" programId="prog-1" {...props} />);
    
    const correctButton = screen.getByRole('button', { name: /correct/i });
    fireEvent.click(correctButton);
    
    await waitFor(() => {
      expect(screen.getByText(/saved offline/i)).toBeInTheDocument();
      expect(screen.getByText(/1 item to sync/i)).toBeInTheDocument();
    });
  });
});
```

**What to Test**:
- API success and error responses
- Loading states
- Optimistic UI updates
- State management integration
- Form submissions
- Data transformations
- Offline queueing
- Sync conflict resolution

---

### End-to-End Tests (10% of tests)

**Purpose**: Test complete user workflows across the entire application

**Tools**:
- Playwright (web and mobile web)
- Detox (React Native)
- Maestro (alternative for mobile)

**Example E2E Test**:
```typescript
// e2e/rbt-session-workflow.spec.ts
import { test, expect } from '@playwright/test';

test('RBT can complete a full data collection session', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('input[name="email"]', 'rbt@test.com');
  await page.fill('input[name="password"]', 'testpass');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/students');

  // Select student
  await page.click('text=Student A');
  await expect(page).toHaveURL(/\/students\/.*\/programs/);

  // Start session
  await page.check('input[value="receptive-id"]');
  await page.click('text=START SESSION');
  await expect(page.locator('.session-timer')).toBeVisible();

  // Record 5 trials
  for (let i = 0; i < 5; i++) {
    await page.click('button:has-text("✓ CORRECT")');
    await page.waitForTimeout(100); // Brief pause between trials
  }

  // Verify trial history
  const historyBar = page.locator('.trial-history-bar');
  await expect(historyBar).toContainText('✓✓✓✓✓');

  // End session
  await page.click('button:has-text("End Session")');
  await page.fill('textarea[name="notes"]', 'Great session, student was engaged');
  await page.click('button:has-text("END SESSION")');

  // Verify back at student list
  await expect(page).toHaveURL('/students');
  await expect(page.locator('text=Last session: Just now')).toBeVisible();
});

test('Offline data collection and sync', async ({ page, context }) => {
  // Login
  await page.goto('/login');
  await page.fill('input[name="email"]', 'rbt@test.com');
  await page.fill('input[name="password"]', 'testpass');
  await page.click('button[type="submit"]');

  // Go offline
  await context.setOffline(true);
  await expect(page.locator('text=OFFLINE MODE')).toBeVisible();

  // Collect data offline
  await page.click('text=Student A');
  await page.check('input[value="receptive-id"]');
  await page.click('text=START SESSION');
  
  for (let i = 0; i < 3; i++) {
    await page.click('button:has-text("✓ CORRECT")');
  }

  // Verify offline indicator
  await expect(page.locator('text=3 items to sync')).toBeVisible();

  // Go back online
  await context.setOffline(false);
  await page.click('button:has-text("RETRY SYNC NOW")');

  // Verify sync success
  await expect(page.locator('text=✓ Synced')).toBeVisible();
});
```

**Critical Workflows to Test**:
1. RBT login → select student → start session → collect data → end session
2. RBT offline data collection → sync when online
3. BCBA create program → assign RBT → RBT collects data → BCBA views graph
4. BCBA generate report → download PDF
5. Parent login → view child progress
6. Admin create user → assign role → user has correct permissions
7. Conflict resolution when same data edited offline and online

---

### Performance Tests

**Purpose**: Ensure the app meets performance requirements

**Tools**:
- Lighthouse CI
- k6 (load testing)
- React DevTools Profiler
- Web Vitals

**Performance Targets**:
| Metric | Target | Measurement |
|--------|--------|-------------|
| API Response (p95) | < 500ms | Load testing |
| Data Entry Latency | < 100ms | User timing API |
| Mobile App Launch | < 2s | Detox perf |
| Graph Rendering | < 1s | React Profiler |
| Lighthouse Score | > 90 | CI check |
| Bundle Size (web) | < 500KB | Bundle analyzer |
| App Size (mobile) | < 50MB | Build output |

**Example Load Test**:
```javascript
// load-tests/trial-recording.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 50 }, // Ramp up to 50 concurrent users
    { duration: '5m', target: 50 }, // Stay at 50 users for 5 min
    { duration: '1m', target: 100 }, // Spike to 100 users
    { duration: '1m', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests < 500ms
    http_req_failed: ['rate<0.01'], // <1% failure rate
  },
};

export default function () {
  const sessionId = 'test-session-1';
  const payload = JSON.stringify({
    program_id: 'prog-1',
    target_id: 'target-1',
    response: 'correct',
    timestamp: new Date().toISOString(),
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${__ENV.TEST_TOKEN}`,
    },
  };

  const res = http.post(
    `http://test.example.com/api/v1/sessions/${sessionId}/trials`,
    payload,
    params
  );

  check(res, {
    'status is 201': (r) => r.status === 201,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1); // 1 second between trials (realistic pace)
}
```

---

### Security Tests

**Purpose**: Verify HIPAA compliance and security controls

**Tools**:
- OWASP ZAP (automated security scanning)
- npm audit / Snyk (dependency vulnerabilities)
- Custom security test suites

**Security Test Areas**:

1. **Authentication & Authorization**
```typescript
describe('Security: Authentication', () => {
  it('should not allow access to student data without auth', async () => {
    const res = await request(app).get('/api/v1/students/123');
    expect(res.status).toBe(401);
  });

  it('should not allow RBT to access other RBT students', async () => {
    const token = generateRBTToken({ id: 'rbt-1', students: ['student-1'] });
    const res = await request(app)
      .get('/api/v1/students/student-2')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('should enforce 2FA for sensitive operations', async () => {
    const token = generateTokenWithout2FA();
    const res = await request(app)
      .post('/api/v1/admin/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'new@test.com' });
    expect(res.status).toBe(403);
    expect(res.body.error).toContain('2FA required');
  });
});
```

2. **Data Privacy**
```typescript
describe('Security: Data Privacy', () => {
  it('should not leak PHI in error messages', async () => {
    const res = await request(app).get('/api/v1/students/invalid-id');
    expect(res.body.error).not.toMatch(/Student.*name/);
  });

  it('should log all PHI access', async () => {
    await request(app)
      .get('/api/v1/students/123')
      .set('Authorization', validToken);
    
    const auditLog = await db.auditLogs.findRecent();
    expect(auditLog).toContainEqual({
      user_id: 'user-1',
      action: 'view_student',
      resource_id: '123',
      timestamp: expect.any(Date),
    });
  });
});
```

3. **Input Validation**
```typescript
describe('Security: Input Validation', () => {
  it('should reject SQL injection attempts', async () => {
    const res = await request(app)
      .get('/api/v1/students/1; DROP TABLE students;--')
      .set('Authorization', validToken);
    expect(res.status).toBe(400);
  });

  it('should sanitize XSS in session notes', async () => {
    const malicious = '<script>alert("xss")</script>';
    const res = await request(app)
      .post('/api/v1/sessions/123/notes')
      .set('Authorization', validToken)
      .send({ notes: malicious });
    
    const session = await db.sessions.findById('123');
    expect(session.notes).not.toContain('<script>');
  });
});
```

**Automated Security Checks in CI**:
- OWASP ZAP baseline scan
- Dependency vulnerability scan (npm audit)
- Secret scanning (no API keys in code)
- HTTPS enforcement check
- CORS configuration validation
- Content Security Policy validation

---

### Accessibility Tests

**Purpose**: Ensure app is usable by people with disabilities (legal requirement)

**Tools**:
- axe-core (automated a11y testing)
- Pa11y (CI integration)
- Screen reader manual testing (NVDA, VoiceOver)

**Example Accessibility Test**:
```typescript
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Accessibility: TrialRecorder', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<TrialRecorder {...props} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should be keyboard navigable', () => {
    const { getByRole } = render(<TrialRecorder {...props} />);
    const correctButton = getByRole('button', { name: /correct/i });
    
    correctButton.focus();
    expect(document.activeElement).toBe(correctButton);
    
    userEvent.keyboard('{Enter}');
    // Verify trial recorded
  });

  it('should announce trial recording to screen readers', () => {
    const { getByRole } = render(<TrialRecorder {...props} />);
    const liveRegion = getByRole('status');
    
    userEvent.click(getByRole('button', { name: /correct/i }));
    
    expect(liveRegion).toHaveTextContent('Correct response recorded');
  });
});
```

---

## Test Data Management

### Test Database

**Approach**: Separate test database with fixtures

**Setup**:
```bash
# Create test database
npm run db:test:create

# Seed with fixtures
npm run db:test:seed

# Reset between test suites
npm run db:test:reset
```

**Fixtures**:
```typescript
// fixtures/users.ts
export const testUsers = {
  admin: {
    id: 'admin-1',
    email: 'admin@test.com',
    role: 'admin',
    password_hash: bcrypt.hashSync('testpass', 10),
  },
  bcba: {
    id: 'bcba-1',
    email: 'bcba@test.com',
    role: 'bcba',
  },
  rbt: {
    id: 'rbt-1',
    email: 'rbt@test.com',
    role: 'rbt',
    assigned_students: ['student-1', 'student-2'],
  },
};

// fixtures/students.ts
export const testStudents = {
  studentA: {
    id: 'student-1',
    name: 'Test Student A',
    dob: '2015-05-15',
    programs: ['prog-1', 'prog-2'],
  },
};
```

### Demo Database

**Purpose**: Realistic fake data for demo mode and user training

**Requirements**:
- Not hardcoded in app
- Stored in separate demo database
- Clearly labeled as fake
- Covers all major use cases
- Includes various data patterns (mastered skills, no progress, etc.)

**Demo Data Script**:
```typescript
// scripts/seed-demo-data.ts
import { faker } from '@faker-js/faker';

async function seedDemoData() {
  // Create 20 fake students
  const students = Array.from({ length: 20 }, (_, i) => ({
    id: `demo-student-${i}`,
    name: `Demo ${faker.name.firstName()}`,
    dob: faker.date.birthdate({ min: 3, max: 18, mode: 'age' }),
  }));

  // Create programs for each student
  for (const student of students) {
    await createPrograms(student, {
      mastered: 2, // 2 mastered programs
      progressing: 3, // 3 showing progress
      plateau: 1, // 1 with no progress (needs attention)
    });
  }

  // Generate historical data
  for (const student of students) {
    await generateSessionHistory(student, {
      sessions_per_week: 5,
      weeks: 12,
    });
  }
}
```

---

## CI/CD Integration

### Pre-Commit Hooks

```bash
# .husky/pre-commit
npm run lint
npm run type-check
npm test -- --onlyChanged --passWithNoTests
```

### Pull Request Checks

```yaml
# .github/workflows/pr-checks.yml
name: PR Checks
on: pull_request

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm test -- --coverage
      - run: npm run test:integration
      
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm audit --audit-level=moderate
      - run: npm run security:scan
  
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm run build
      - run: npm run lighthouse:ci
      - run: npm run bundle:analyze
```

### Deployment Pipeline

```
┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────┐
│   Commit    │───>│  Unit Tests  │───>│ Integration  │───>│   E2E    │
│   to main   │    │  (< 5 min)   │    │    Tests     │    │  Tests   │
└─────────────┘    └──────────────┘    └──────────────┘    └──────────┘
                                                                   │
                                                                   ▼
                                                           ┌──────────────┐
                                                           │  Deploy to   │
                                                           │     QA       │
                                                           └──────────────┘
                                                                   │
                                                                   ▼
                                                           ┌──────────────┐
                                                           │   Smoke      │
                                                           │   Tests      │
                                                           └──────────────┘
                                                                   │
                                                                   ▼
                                                           ┌──────────────┐
                                                           │   Manual     │
                                                           │  Approval    │
                                                           └──────────────┘
                                                                   │
                                                                   ▼
                                                           ┌──────────────┐
                                                           │  Deploy to   │
                                                           │   Prod       │
                                                           └──────────────┘
                                                                   │
                                                                   ▼
                                                           ┌──────────────┐
                                                           │  Synthetic   │
                                                           │  Monitoring  │
                                                           └──────────────┘
```

---

## Test Maintenance

### Test Code Quality

- Tests are code: apply same standards (linting, review)
- DRY principle: Extract test helpers and fixtures
- Clear test names: `it('should X when Y')`
- Arrange-Act-Assert pattern
- One assertion concept per test

### Flaky Test Policy

1. **Quarantine**: Mark flaky tests with `.skip()` and file issue
2. **Fix within 48 hours**: Or delete the test
3. **Root cause**: Usually timing issues, race conditions, or test pollution
4. **Never ignore**: Flaky tests erode confidence

### Test Coverage Goals

```
Overall:           85%
New Code:          90% (enforced in CI)
Critical Paths:   100% (auth, data collection, sync)
```

**Coverage exclusions**:
- Generated code
- Config files
- Test utilities
- Type definitions

---

## Testing Checklist for AI Agents

When implementing a feature, ensure:

- [ ] Unit tests for all business logic
- [ ] Component tests for UI interactions
- [ ] Integration tests with mocked API
- [ ] E2E test for critical user workflow
- [ ] Offline behavior tested
- [ ] Error states tested
- [ ] Loading states tested
- [ ] Accessibility checked (axe-core)
- [ ] Security validated (if touching auth/PHI)
- [ ] Performance measured (if potentially slow)
- [ ] Tests added to traceability matrix
- [ ] All tests pass locally
- [ ] Coverage threshold met (85%+)

---

**Last Updated**: 2025-12-10  
**Maintained By**: Engineering Team
