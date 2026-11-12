# Capabilities by role

Screens are in `docs/screenshots/` (regenerate with `make screenshots`). Everything listed is built and exercised by the walkthrough; "P1–P4" is the roadmap phase it came from.

## Everyone
| Capability | Phase | Screen |
|---|---|---|
| Sign in, lockout, forced change of temporary password | P1 | 01 |
| Two-factor sign-in with an authenticator app, recovery codes | P3 | 63 |
| Environment banner (env · role · school · time) | P1 | all |
| Page tour, Help menu, shortcuts, command palette (⌘K) | P1 | 03, 19, 20, 22 |
| In-app notifications (bell) | P3 | 68 |
| Light / dark theme; reset demo (non-prod) | P1 | 78, 47 |

## RBT — records sessions (phone-first, offline-capable)
| Capability | Phase | Screen |
|---|---|---|
| Today list; start a Teaching or Probe session; student lock | P1 | 21, 23 |
| Discrete trials, frequency, duration; undo last | P1 | 24–26 |
| **Interval recording** (partial / whole / momentary) with countdown and cue | P2 | 65 |
| **ABC data**: antecedent → behaviour → consequence in two taps | P2 | 64 |
| **Task analysis**: score each step of a chain | P2 | 66 |
| Offline recording, automatic sync, server receipt | P1 | 27–29 |
| Lock conflict, takeover, displaced-device banner; end with note | P1 | 30–32 |
| Add a photo to the session (needs consent, online) | P4 | — |
| Team message thread per student; read-only graphs | P3 / P1 | — |

## BCBA — designs programs, reads graphs, decides
| Capability | Phase | Screen |
|---|---|---|
| Caseload with status flags, filters and suggestion badges | P1 / P2 | 02, 04 |
| Graph: line / bar, phases, criterion, trend; annotate in place; new phase | P1 | 05–10, 14 |
| **Suggested change points**, accept as a phase or dismiss | P2 | 48, 49 |
| **Forecast** to criterion; **unusual session**; **recorders differ**; **prompt-dependent** | P2 / P4 | 48, 50, 51 |
| **Cumulative record** and **data table** views | P2 | 53, 54 |
| **ABC pattern analysis**: most common antecedents and consequences | P2 | 52 |
| Interval and task-analysis graphs; step-level session detail | P2 | 55, 56 |
| Session detail; correct or void an item with a reason | P1 | 11, 12 |
| Programs with undo/redo, structured mastery rule, six measurement types | P1 / P2 | 13, 17 |
| **Program templates**: save a design, start from one | P4 | 57 |
| Team assignment; review queue (displaced sessions and home data) | P1 / P3 | 15, 16, 18, 33, 34, 73 |
| **Messages** with the team, the family and the classroom | P3 | 58 |
| **Progress report** (print / PDF) and per-student **CSV export** | P2 / P4 | 59 |
| **Family summary**: write or draft with the local model, publish, withdraw | P3 / P4 | 60 |
| **Ask about your caseload** (local model) | P4 | 62 |
| **Service log** in minutes and 15-minute units | P3 | 61 |
| Family & classroom permissions; **consent and media** | P3 / P4 | 58 |

## Parent — sees what the team shares
| Capability | Phase | Screen |
|---|---|---|
| Children list; published summaries; goals in plain words with a trend | P3 | 67, 69, 71 |
| Messages with the behaviour analyst; notifications | P3 | 68, 69 |
| Count a behaviour at home (if allowed; always reviewed) | P3 | 70, 73 |
| ✘ by design: sessions, staff names on data, clinical notes, media, other students | | |

## Teacher — supports goals in class
| Capability | Phase | Screen |
|---|---|---|
| Linked students; goals with status and how to support them | P3 | 72 |
| Observation notes to the behaviour analyst | P3 | 72 |

## School admin — sites, people, enrolment
| Capability | Phase | Screen |
|---|---|---|
| Sites; staff accounts; students; school audit log | P1 | 35–41 |
| **Invite a parent or teacher**, linked to named students | P3 | 75 |
| **Import students from CSV** (validate, then all or nothing) | P4 | 76 |
| **Service log** for their sites | P3 | 77 |
| **Optional features**: switch local-model drafts and voice notes on or off | P4 | 74 |
| ✘ by design: session data and graphs | | |

## System admin — the platform across schools
| Capability | Phase | Screen |
|---|---|---|
| Schools; platform health; platform audit log; design system reference | P1 | 42–46 |
| ✘ by design: any student data | | |

## Not built
Voice commands · in-app video recording · push / email / SMS · celeration charts · payer-specific billing · inter-observer agreement · integration API. Voice notes: dictating the session-end note works on a local Whisper model (`make speech`, screenshot `voice-note.png`), tested with synthetic speech only.
