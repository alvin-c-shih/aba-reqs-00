# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records (ADRs) documenting significant technical decisions made during the development of the ABA system.

## What is an ADR?

An ADR is a document that captures an important architectural decision along with its context and consequences. ADRs help teams:
- Understand why decisions were made
- Onboard new team members quickly
- Revisit decisions when circumstances change
- Avoid rehashing old debates

## ADR Format

Each ADR follows this template:

```markdown
# ADR-XXX: Title

## Status
[Proposed | Accepted | Deprecated | Superseded by ADR-YYY]

## Context
What is the issue we're trying to solve? What constraints exist?

## Decision
What did we decide to do?

## Consequences
What are the positive and negative outcomes of this decision?

## Alternatives Considered
What other options did we evaluate and why were they rejected?
```

## ADR Index

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [001](./001-offline-first-architecture.md) | Offline-First Architecture | Accepted | 2025-12-10 |
| [002](./002-react-native-for-mobile.md) | React Native for Mobile App | Accepted | 2025-12-10 |
| [003](./003-postgresql-timescaledb.md) | PostgreSQL with TimescaleDB | Accepted | 2025-12-10 |
| [004](./004-optimistic-ui-updates.md) | Optimistic UI Updates | Accepted | 2025-12-10 |

## How to Create a New ADR

1. Copy the template: `cp adr-template.md adr-XXX-title.md`
2. Fill in the sections
3. Submit for review via pull request
4. Update this index when accepted
5. Link from relevant code or docs

## When to Create an ADR

Create an ADR for decisions that:
- Are architecturally significant
- Affect multiple components
- Are difficult to reverse
- Have trade-offs worth documenting
- May be questioned in the future

**Examples**:
- Choice of database or framework
- API design patterns
- Security approach
- Data synchronization strategy

**Don't create ADRs for**:
- Routine implementation details
- Obvious or uncontroversial choices
- Decisions easily reversed

---

See [ADR-001](./001-offline-first-architecture.md) for the foundational architectural decision.
