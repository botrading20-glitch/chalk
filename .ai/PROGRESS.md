# Progress

Completed roadmap work, newest first. Evidence is in `TEST_STATUS.md` and on each task in `DEVELOPMENT_ROADMAP.md`.

## 2026-10-05 (afternoon): backlog fixes on branch `setward` (local, not deployed)

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
