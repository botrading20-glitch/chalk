# Requirements

Sources: **R** = README feature list, **C** = `CLAUDE.md`, **O** = owner's statements recorded in agent memory, **Q** = quality requirement from the 2026-10-04 engineering pass.

Status: DONE (built and verified) · PARTIAL · TODO · DEFERRED.

## Product

| ID | Requirement | Src | Pri | Status | Verified by |
|----|-------------|-----|-----|--------|-------------|
| REQ-001 | Log a workout live: weight/reps/time/distance sets, warm-up, failure and drop sets, RPE, notes, supersets. Previous numbers sit next to every set. A rest timer starts when a set is checked. | R | P0 | DONE | Smoke S-03, S-04 |
| REQ-002 | Routines: create, edit, duplicate, start, save from a workout, create from history. Folders. | R, C | P0 | DONE | Smoke S-05 |
| REQ-003 | Exercise library (1,003 entries) with search and filters. Custom exercises. Editing a library exercise saves the user's own version and moves history onto it. | R, C | P0 | DONE | Manual |
| REQ-004 | History: list grouped by month, workout detail, edit or delete a past workout. | R | P0 | DONE | Smoke S-06 |
| REQ-005 | Progress: personal records, per-exercise charts, weekly time/volume/sets, sets per muscle, consistency calendar. | R | P1 | DONE | `stats.test.ts`, manual |
| REQ-006 | Body-weight log: one weigh-in per day, trend chart. | R, C | P2 | DONE | Manual |
| REQ-007 | Workout share image (1080×1350 PNG). | R, C | P2 | DONE | Manual |
| REQ-008 | Plate calculator using the plates the gym owns (kg or lb). | R, C | P2 | DONE | `plates.test.ts` |
| REQ-009 | Hevy CSV import (metric and imperial) and export in the same format. | R, O | P0 | DONE | `hevy.test.ts` |
| REQ-010 | JSON backup and restore of everything the user created. | R | P0 | DONE | `backup.test.ts` |
| REQ-011 | Optional cloud sync to a private GitHub repo with a fine-grained token. | R, C | P1 | DONE | `syncCore.test.ts`, opt-in `github.smoke` |
| REQ-012 | Installable PWA that works offline. | R | P0 | DONE | Smoke S-07 |
| REQ-013 | kg/lbs, km/mi, dark/light/auto theme. | R | P1 | DONE | Manual |
| REQ-014 | Rest alert that works with the screen off without pausing other apps' music. | C, O | P1 | DONE | Owner's Android test (2026-09-24) |
| REQ-015 | Everything stays free to build and host. | O | P0 | DONE | NN-01 |

## Quality (added 2026-10-04)

| ID | Requirement | Pri | Status | Tasks |
|----|-------------|-----|--------|-------|
| REQ-Q01 | Never lose or hide user data silently. A crash shows a recovery screen that can still export a backup. A restore validates its input. Edits in the routine and workout editors survive leaving the screen by accident. | P0 | DONE | REL-001, REL-002, DATA-001, UX-001 |
| REQ-Q02 | Critical calculations and formats are covered by automated tests: records, weekly stats, Hevy CSV, backup, parsing. | P1 | DONE | TEST-001 |
| REQ-Q03 | Text meets WCAG AA contrast (4.5:1) in both themes, and every control shows keyboard focus. | P1 | PARTIAL (no screen-reader pass) | A11Y-001 |
| REQ-Q04 | Defence in depth for the stored GitHub token: a Content Security Policy in production builds. | P2 | DONE | SEC-001 |
| REQ-Q05 | A new session can rebuild the project's state from the repo (`CLAUDE.md` + `.ai/`). | P1 | DONE | DOC-001 |

## Acceptance notes

- **REQ-Q01, crash recovery:** any render error shows a screen with *Reload* and *Download backup*. The backup download works without React.
- **REQ-Q01, restore:** a file that isn't a Chalk backup is rejected with a plain message and nothing is written. Damaged records inside a backup are left out and counted. Valid records are summarised and the user confirms first. Fields from newer versions are kept. A restore never leaves two weigh-ins on one day.
- **REQ-Q01, drafts:** after leaving the routine or past-workout editor any way other than Save or an explicit Discard, reopening it shows the unsaved changes with a way to discard them.
