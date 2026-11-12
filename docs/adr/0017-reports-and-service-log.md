# 0017 — Reports are views of the same facts; billing is a generic service log

**Status:** Accepted · 2026-11-11 · owner chose "generic service log"

## Decision
- One function, `reports.program_facts`, produces per-program facts for a period. The **progress report**, the **family summary snapshot** and the **AI draft input** all use it, so they cannot disagree.
- **Progress report**: a printable page (browser print → PDF) with period totals, each program's status, change in the period, a small phase-aware graph, notes and forecast. No server-side PDF library.
- **Family summary**: written (or drafted, ADR-0014) by the BCBA, published as a frozen snapshot, can be withdrawn.
- **Service log** (BCBA for their students, school admin for their sites): date, times, student, site, staff and role, service type, setting, minutes, and **15-minute units by the 8-minute rule**. Sessions awaiting review are excluded. Screen, print and CSV.
- **Exports**: per-student CSV of every counted session value (continuity of care); roster **import** from CSV validates every row first, then commits all or nothing.
- Every report and export writes an audit row.

## Not built
Payer-specific formats and CPT codes (a biller must define the mapping), insurance authorisation tracking, scheduled reports.

## Revisit when
A payer or district requires a specific format.
