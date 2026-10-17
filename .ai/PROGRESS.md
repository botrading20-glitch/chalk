# Progress

Completed roadmap work, newest first. Evidence is in `TEST_STATUS.md` and on each task in `DEVELOPMENT_ROADMAP.md`.

## 2026-10-17: Setward 1.0 (merged as c3da695 and deployed)

| Task | Result | Notes |
|------|--------|-------|
| LAUNCH-M1 | Hevy retired; Strong import and Setward CSV | roadmap LAUNCH-M1 |
| LAUNCH-M2 | i18n layer, settings model, rem and logical CSS | roadmap LAUNCH-M2 |
| LAUNCH-M3 | The Forward look on every screen | roadmap LAUNCH-M3 |
| LAUNCH-M4 | Grouped Settings, every new setting wired | roadmap LAUNCH-M4 |
| LAUNCH-M5 | Welcome, starter programs, past workouts, recent records | roadmap LAUNCH-M5 |
| LAUNCH-M6 | Ten translations and Arabic right to left | roadmap LAUNCH-M6 |
| LAUNCH-M7 | Link previews, privacy page, licence, README, wide-screen panel, 1.0.0 and What's new, Play notes | roadmap LAUNCH-M7 |
| LAUNCH-M8 | Full verification and REL-104 | roadmap LAUNCH-M8; released and checked live |

## 2026-10-16: data check (merged as e7ad7fe and deployed)

| Task | Result | Commit |
|------|--------|--------|
| DATA-002 | Check data for problems: a Settings sheet and a crash-screen entry point; repair or delete each damaged record after a backup | ce3daae |

## 2026-10-05: owner-requested features (merged as c232c2d and deployed)

| Task | Result | Commit |
|------|--------|--------|
| FEAT-002 | Stopwatch for timed sets | 44c6840 |
| FEAT-004 | Reorder routines by dragging (sheet, within a folder) | 905ac95 |
| FEAT-006 | Orange warm-up badge (NN-16 changed) | 9567eca |

## 2026-10-05: Setward and backlog fixes (merged as 34d025d and deployed)

| Task | Result | Commit |
|------|--------|--------|
| DOC-002 | Share card dim text uses the current `--text-3` grey | 4ae76c3 |
| A11Y-002 | Arrow keys, Home and End in segmented controls | 436c05f |
| UX-002, UX-003 | Deleting a custom exercise checks routines and the live workout; no session volume for assisted bodyweight | 83fd874 |
| ENV-003 | Handoff reconciled; rebrand committed unchanged on `setward`; `AGENTS.md` path fixed | 6ce6fb4, e40a906 |

## 2026-10-05: Setward identity (complete locally, uncommitted)

- Renamed the visible app to **Setward** with an angular split-S logo and “Forward, one set at a time.” tagline. Updated the Workout header, install/browser metadata, icons, share card, visible copy, export filenames and README.
- Reusable artwork, identity preview and usage notes are saved in `branding/`; shared logo geometry is in `src/lib/brand.ts`.
- Preserved the `chalk` database/backup identifiers, `chalk-sync/1`, manifest start URL/scope and `/chalk/` address. No dependencies added.
- Verification recorded in `TEST_STATUS.md`: 59 tests passed, 2 opt-in live-sync tests skipped, and the `/chalk/` production build passed. Dark/light 360 px header, settings, icons and sample share card were checked locally.
- No commit, merge, push or deployment performed. The live app remains Chalk at `main` @ 6d15c2e. Publishing requires the owner's authorization (NN-15); installed-phone name/icon refresh and earlier phone checks remain open.

## 2026-10-04: quality pass (merged and deployed as 6d15c2e)

| Task | Result | Commit |
|------|--------|--------|
| DATA-001 (follow-up) | Restore keeps fields from newer Chalk versions | 506c14f |
| QA-001 (2) | Set table and charts fit 320 px; charts measure before first paint | 2258c5c |
| SEC-001 | CSP meta in production builds | 47e7e44 |
| A11Y-001, QA-001 (1) | Contrast, search focus, narrow-phone layout fixes | b7037da |
| UX-001 | Routine and past-workout edits survive leaving the editor (ADR-001) | f4a4ce1, 7629c07 |
| DATA-001 | Backup restore is checked, reported and confirmed | c0aad3a, e8bc6de |
| REL-003 | Plate calculator no longer freezes on huge targets | 22aaf33 |
| REL-001, REL-002 | Crash recovery screen; failed saves are visible | 8626f3d |
| TEST-001 | 34 new tests (records, stats, Hevy CSV, parsing, backups, live workout); 40 new by the end of the session (19 → 59) | a42d9b4 |
| DX-001 | Sample-backup script for QA | 0f1137a |
| ENV/DISC/REQ-001 | Discovery, baseline, requirements, invariants, roadmap | 862af48 |

The session's last commit holds this file, `CLAUDE.md` and `README.md` (DOC-001).

## Before 2026-10-04
See `git log` on `main` (up to 0698dc1): the app was built 2026-09-23/24, including sync, body weight, share card, rest alert, plate calculator, folders and the theme.
