# System Architecture

## High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        WebApp[Web Application<br/>React/Next.js]
        MobileApp[Mobile Apps<br/>React Native]
    end
    
    subgraph "API Gateway Layer"
        Gateway[API Gateway<br/>Authentication/Rate Limiting]
    end
    
    subgraph "Application Layer"
        AuthService[Auth Service<br/>JWT/OAuth]
        DataCollectionAPI[Data Collection API<br/>Real-time + Batch]
        AnalyticsAPI[Analytics API<br/>Trend Analysis]
        ReportingAPI[Reporting API<br/>PDF Generation]
        NotificationService[Notification Service<br/>Push/Email]
    end
    
    subgraph "Data Layer"
        PrimaryDB[(Primary Database<br/>PostgreSQL)]
        CacheDB[(Cache<br/>Redis)]
        FileStorage[File Storage<br/>S3/Azure Blob<br/>Encrypted]
        AnalyticsDB[(Analytics DB<br/>ClickHouse/TimescaleDB)]
    end
    
    subgraph "Background Jobs"
        SyncWorker[Offline Sync Worker]
        AnalyticsWorker[Analytics Worker<br/>Trend Detection]
        ReportWorker[Report Generation Worker]
        NotificationWorker[Notification Worker]
    end
    
    subgraph "External Services"
        Email[Email Service<br/>SendGrid]
        SMS[SMS Service<br/>Twilio]
        Storage[Cloud Storage]
    end
    
    WebApp --> Gateway
    MobileApp --> Gateway
    Gateway --> AuthService
    Gateway --> DataCollectionAPI
    Gateway --> AnalyticsAPI
    Gateway --> ReportingAPI
    
    AuthService --> PrimaryDB
    AuthService --> CacheDB
    
    DataCollectionAPI --> PrimaryDB
    DataCollectionAPI --> CacheDB
    DataCollectionAPI --> SyncWorker
    
    AnalyticsAPI --> AnalyticsDB
    AnalyticsAPI --> AnalyticsWorker
    
    ReportingAPI --> PrimaryDB
    ReportingAPI --> FileStorage
    ReportingAPI --> ReportWorker
    
    NotificationService --> NotificationWorker
    NotificationWorker --> Email
    NotificationWorker --> SMS
    
    SyncWorker --> PrimaryDB
    AnalyticsWorker --> AnalyticsDB
    ReportWorker --> FileStorage
    
    PrimaryDB -.Replicate.-> AnalyticsDB
```

## System Components

### Client Applications

#### Web Application
- **Technology**: React with Next.js (SSR/SSG)
- **Purpose**: Full-featured interface for BCBAs, Admins, Parents
- **Key Features**:
  - Rich data visualization (graphs, reports)
  - Program management interface
  - User administration
  - Report generation and export

#### Mobile Applications
- **Technology**: React Native (iOS/Android)
- **Purpose**: Field data collection for RBTs
- **Key Features**:
  - Offline-first data collection
  - Voice-to-text input
  - Camera integration
  - Timer/stopwatch functionality
  - Haptic feedback

### Backend Services

#### Authentication Service
- User authentication (JWT tokens)
- Role-based access control (RBAC)
- Two-factor authentication (2FA)
- Session management
- Audit logging

#### Data Collection API
- Real-time data ingestion
- Batch data processing
- Data validation
- Conflict resolution for offline sync
- Version control for concurrent edits

#### Analytics API
- Statistical analysis
- Trend detection (regression, no progress, mastery)
- Phase change detection
- Predictive analytics
- Aggregation and summarization

#### Reporting API
- Progress report generation
- Insurance report formatting
- Parent summary generation
- Custom report builder
- PDF/Excel export

#### Notification Service
- Push notifications (mobile)
- Email notifications
- SMS notifications (optional)
- In-app notifications
- Notification preferences management

### Data Storage

#### Primary Database (PostgreSQL)
- **Purpose**: Transactional data
- **Data**:
  - User accounts and profiles
  - Student records (PHI)
  - Treatment plans and programs
  - Data collection records
  - Session information
- **Features**:
  - ACID compliance
  - Row-level security
  - Encryption at rest
  - Point-in-time recovery
  - Automated backups

#### Cache Layer (Redis)
- **Purpose**: Performance optimization
- **Data**:
  - Session tokens
  - Frequently accessed student data
  - Real-time counters
  - Rate limiting data
- **Features**:
  - Sub-millisecond latency
  - Pub/sub for real-time updates
  - TTL-based expiration

#### Analytics Database (TimescaleDB/ClickHouse)
- **Purpose**: Time-series data analysis
- **Data**:
  - Historical data points
  - Aggregated metrics
  - Trend analysis results
- **Features**:
  - Optimized for time-series queries
  - Automatic data retention policies
  - Materialized views for performance

#### File Storage (S3/Azure Blob)
- **Purpose**: Large file storage
- **Data**:
  - Session videos
  - Photos
  - Generated reports (PDFs)
  - Data exports
- **Features**:
  - Encryption at rest and in transit
  - Versioning
  - Lifecycle policies
  - CDN integration

### Background Workers

#### Offline Sync Worker
- Processes offline data uploads
- Resolves conflicts
- Validates data integrity
- Updates cache and analytics

#### Analytics Worker
- Runs statistical analyses
- Detects trends and anomalies
- Generates alerts
- Updates dashboards

#### Report Generation Worker
- Generates scheduled reports
- Processes bulk exports
- Creates visualizations
- Sends notifications

#### Notification Worker
- Queues and dispatches notifications
- Handles retry logic
- Tracks delivery status
- Manages user preferences

## Data Flow Patterns

### Real-Time Data Collection Flow

```mermaid
sequenceDiagram
    participant RBT as RBT Mobile App
    participant Gateway as API Gateway
    participant API as Data Collection API
    participant Cache as Redis Cache
    participant DB as PostgreSQL
    participant Analytics as Analytics Worker
    
    RBT->>Gateway: POST /sessions/{id}/trials (with auth token)
    Gateway->>Gateway: Validate JWT & permissions
    Gateway->>API: Forward request
    API->>API: Validate data schema
    API->>DB: Write trial data
    DB-->>API: Confirm write
    API->>Cache: Update session cache
    API->>Analytics: Trigger real-time analysis
    API-->>Gateway: 201 Created
    Gateway-->>RBT: Success response
    
    Note over RBT: Display immediate feedback
    
    Analytics->>Analytics: Calculate session metrics
    Analytics->>Cache: Update live dashboard data
```

### Offline Sync Flow

```mermaid
sequenceDiagram
    participant RBT as RBT Mobile App
    participant Local as Local Storage
    participant Gateway as API Gateway
    participant Sync as Sync Worker
    participant DB as PostgreSQL
    
    Note over RBT: Working offline
    RBT->>Local: Save trial data locally
    Local-->>RBT: Queued (timestamp)
    
    Note over RBT: Internet connection restored
    RBT->>Gateway: POST /sync/batch (with queued data)
    Gateway->>Sync: Process batch
    
    loop For each record
        Sync->>DB: Check for conflicts
        alt No conflict
            Sync->>DB: Insert record
        else Conflict detected
            Sync->>Sync: Apply resolution rules
            Sync->>DB: Merge or create conflict record
        end
    end
    
    Sync-->>Gateway: Sync results (success/conflicts)
    Gateway-->>RBT: Sync report
    RBT->>Local: Clear synced items
    
    alt Has conflicts
        RBT->>RBT: Show conflict resolution UI
    end
```

### Report Generation Flow

```mermaid
sequenceDiagram
    participant BCBA as BCBA Web App
    participant API as Reporting API
    participant Worker as Report Worker
    participant DB as PostgreSQL
    participant Storage as File Storage
    participant Notify as Notification Service
    
    BCBA->>API: POST /reports/progress (student_id, date_range)
    API->>Worker: Queue report job
    API-->>BCBA: 202 Accepted (job_id)
    
    BCBA->>API: GET /reports/jobs/{job_id}
    API-->>BCBA: Status: processing
    
    Worker->>DB: Query student data
    DB-->>Worker: Data rows
    Worker->>Worker: Generate graphs
    Worker->>Worker: Format report (PDF)
    Worker->>Storage: Upload PDF
    Storage-->>Worker: file_url
    Worker->>DB: Update job status (completed)
    Worker->>Notify: Send completion notification
    
    Notify->>BCBA: Push notification
    BCBA->>API: GET /reports/jobs/{job_id}
    API-->>BCBA: Status: completed, download_url
    BCBA->>Storage: Download PDF
```

## Security Architecture

### Authentication & Authorization Flow

```mermaid
graph LR
    subgraph "Client"
        User[User Login]
    end
    
    subgraph "Auth Service"
        Login[Login Handler]
        JWT[JWT Generator]
        2FA[2FA Validator]
        RBAC[RBAC Engine]
    end
    
    subgraph "Storage"
        UserDB[(User DB)]
        SessionCache[(Session Cache)]
        AuditLog[(Audit Log)]
    end
    
    User --> Login
    Login --> UserDB
    Login --> 2FA
    2FA --> JWT
    JWT --> SessionCache
    JWT --> User
    
    User --> RBAC
    RBAC --> SessionCache
    RBAC --> AuditLog
```

### Data Encryption

```mermaid
graph TB
    subgraph "Encryption Layers"
        App[Application Layer<br/>Field-level encryption for sensitive data]
        Transport[Transport Layer<br/>TLS 1.3]
        Storage[Storage Layer<br/>AES-256 encryption at rest]
    end
    
    subgraph "Key Management"
        KMS[Key Management Service<br/>AWS KMS / Azure Key Vault]
        Keys[Encryption Keys<br/>Rotated every 90 days]
    end
    
    App --> Transport
    Transport --> Storage
    KMS --> App
    KMS --> Storage
    Keys --> KMS
```

## Scalability Strategy

### Horizontal Scaling

- **API Services**: Stateless, can scale horizontally behind load balancer
- **Background Workers**: Queue-based, can add workers as needed
- **Database**: Read replicas for analytics queries
- **Cache**: Redis Cluster for distributed caching

### Vertical Scaling

- **Database**: Scale up for transaction throughput
- **Analytics DB**: Scale up for complex queries

### Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| API Response Time (p95) | < 200ms | Cached endpoints |
| API Response Time (p95) | < 500ms | Database queries |
| Data Collection Write | < 100ms | Critical path |
| Offline Sync Processing | < 5s per 100 records | Background |
| Report Generation | < 30s | Small reports (< 1 month) |
| Report Generation | < 2min | Large reports (> 3 months) |
| Mobile App Launch | < 2s | Cold start |
| Graph Rendering | < 1s | Up to 1000 data points |

## Deployment Architecture

### Environment Structure

```mermaid
graph LR
    subgraph "Environments"
        Demo[Demo<br/>Fake data, Public]
        Dev[Development<br/>Latest code, Unstable]
        QA[QA/Staging<br/>Release candidates]
        Prod[Production<br/>Live system]
    end
    
    Demo -.->|Manual promotion| Dev
    Dev -->|Auto deploy on commit| QA
    QA -->|Manual approval| Prod
```

### Infrastructure Components

- **Container Orchestration**: Kubernetes / ECS
- **Load Balancer**: Application Load Balancer (ALB)
- **CDN**: CloudFront / Azure CDN
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack / CloudWatch
- **Secrets Management**: AWS Secrets Manager / Azure Key Vault

## Technology Stack Recommendations

### Frontend
- **Web**: React 18+, Next.js 14+, TypeScript, TailwindCSS
- **Mobile**: React Native, TypeScript, Expo
- **State Management**: Zustand / Jotai (lightweight)
- **Forms**: React Hook Form
- **Graphs**: Recharts / Victory Native

### Backend
- **API Framework**: Node.js (Fastify) or Python (FastAPI)
- **Language**: TypeScript (Node.js) or Python 3.11+
- **Validation**: Zod (TS) or Pydantic (Python)
- **ORM**: Prisma (TS) or SQLAlchemy (Python)

### Database
- **Primary**: PostgreSQL 15+ with TimescaleDB extension
- **Cache**: Redis 7+
- **File Storage**: AWS S3 / Azure Blob Storage

### Infrastructure
- **Cloud Provider**: AWS or Azure
- **IaC**: Terraform
- **CI/CD**: GitHub Actions
- **Containers**: Docker

### Rationale for Stack

**React Native for Mobile**:
- Single codebase for iOS/Android
- Direct access to native APIs (camera, voice, haptics)
- Rich ecosystem for offline-first apps
- Expo for easier deployment and OTA updates

**PostgreSQL with TimescaleDB**:
- Robust ACID guarantees for PHI
- Excellent support for time-series data
- Powerful JSON support for flexible schemas
- Strong security features (RLS, encryption)

**Node.js/TypeScript OR Python**:
- Node.js: Better for real-time features, shared code with frontend
- Python: Better for data analysis, ML capabilities
- Both have excellent HIPAA-compliant libraries

---

**Next**: See [ADR Index](./adr/README.md) for detailed architectural decisions.
