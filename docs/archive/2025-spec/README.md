# ABA Data Collection & Analysis System - Documentation

## Navigation Hub

Welcome to the ABA system documentation. This guide is organized by audience to help you find what you need quickly.

## Quick Links by Role

### 👥 Product & Business Stakeholders
- [System Overview](./product/overview.md) - High-level system description
- [User Stories](./product/user-stories/README.md) - Features organized by persona
- [UI Mockups](./product/mockups/README.md) - Screen designs and flows
- [Requirements](./product/requirements.md) - Consolidated requirements

### 👨‍💻 Engineering Team
- [Technical Specification](./engineering/technical-spec.md) - System architecture and tech stack
- [API Documentation](./engineering/api/README.md) - REST API endpoints
- [Data Models](./engineering/data-models.md) - Database schemas
- [Component Registry](./engineering/component-registry.md) - UI component catalog
- [Screen State Specifications](./engineering/screen-states/README.md) - Machine-readable UI states
- [Testing Strategy](./engineering/testing-strategy.md) - Test approach and scenarios
- [Security Specifications](./engineering/security-spec.md) - HIPAA compliance details

### 🏗️ Architecture & Design
- [System Architecture](./architecture/system-architecture.md) - High-level system design
- [Architecture Decision Records (ADRs)](./architecture/adr/README.md) - Key technical decisions
- [Data Flow Diagrams](./architecture/data-flows.md) - How data moves through the system
- [Deployment Architecture](./architecture/deployment.md) - Infrastructure and scaling

### 📚 User Guides
- [Admin Guide](./user-guides/admin-guide.md)
- [BCBA Guide](./user-guides/bcba-guide.md)
- [RBT Quick Start](./user-guides/rbt-quickstart.md)
- [Parent Portal Guide](./user-guides/parent-guide.md)

## Development Workflow

### For AI Coding Assistants
Each major feature directory contains a `.context.md` file that provides:
- Feature purpose and scope
- Related files and dependencies
- Key implementation notes
- Testing requirements

### Traceability
See [Traceability Matrix](./engineering/traceability-matrix.md) for connections between:
- User Stories → UI Mockups → Components → API Endpoints → Tests

## Glossary

### ABA-Specific Terms
- **BCBA**: Board Certified Behavior Analyst
- **RBT**: Registered Behavior Technician
- **ABC Data**: Antecedent-Behavior-Consequence recording
- **DTT**: Discrete Trial Training
- **Mastery Criteria**: Conditions that indicate a skill is learned
- **Probe**: Assessment to check skill retention
- **Task Analysis**: Breaking complex skills into steps

### System Terms
- **Session**: Time period during which data is collected
- **Program**: A teaching procedure targeting a specific skill
- **Target**: A specific behavior or skill being addressed
- **Trial**: Single instance of presenting an instructional opportunity

## Document Status Legend

🟢 Complete | 🟡 In Progress | 🔴 Not Started

## Current Status

### Product Documentation
- 🟡 System Overview
- 🟡 User Stories
- 🟡 UI Mockups
- 🟢 Requirements

### Engineering Documentation
- 🟡 Technical Specification
- 🟡 API Documentation
- 🟡 Data Models
- 🟡 Component Registry
- 🟡 Screen State Specs
- 🟡 Testing Strategy
- 🟡 Security Specifications

### Architecture Documentation
- 🟡 System Architecture
- 🟡 ADRs
- 🟡 Data Flow Diagrams
- 🔴 Deployment Architecture

---

**Last Updated**: 2025-12-10
**Version**: 0.1.0 (Specification Phase)
