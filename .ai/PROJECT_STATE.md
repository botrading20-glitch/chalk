# Project state

## Project
- **Name:** Chalk
- **Purpose:** a free, offline-first workout logger that replaces Hevy for its owner, possibly published to app stores later
- **Version:** 0.1.0 (`package.json`), live at https://botrading20-glitch.github.io/chalk/ from `main`
- **Stack:** React 19, TypeScript 7, Vite 8, vite-plugin-pwa (Workbox), Dexie 4 (IndexedDB), Vitest 5. No backend.

## Current status
- **Phase:** quality pass on branch `quality-pass` (see `DEVELOPMENT_ROADMAP.md`)
- **Completion:** all product features in `REQUIREMENTS.md` work. The quality requirements REQ-Q01–Q05 are in progress.
- **Current priority:** data safety (REL-001, DATA-001, UX-001) backed by tests (TEST-001)

## Architecture
A static PWA. Pages read everything through `DataProvider` (`useData()`), which loads all exercises and workouts and computes records once. Writes go straight to Dexie, and live queries re-render. The in-progress workout and other per-device state live in the `kv` table. Optional sync merges three ways against a private GitHub repo. Full notes are in `CLAUDE.md`.

## Design direction
Dark-first, violet-tinted charcoal greys with a purple accent. Big Shoulders Display for titles and Archivo for body text, both self-hosted. Bumper-plate set badge colours. Tokens are in `src/styles.css`.

## Important constraints
- Free to build and host (NN-01). No secrets in the repo; the owner enters tokens in the app.
- Merging to `main` deploys (NN-15).

## Protected invariants
See `NON_NEGOTIABLES.md` (NN-01 to NN-16).

## Current problems
Pre-existing defects 1–6 are listed in `TEST_STATUS.md`, each mapped to a roadmap task.

## Current risks
- Sync is shipped but unused by the owner. A Google Drive replacement is parked on the local-only branch `google-sync`.
- The behaviour of the phone lock screen and iPhone can only be checked on real devices.

## Immediate next steps
1. DX-001 sample data script
2. TEST-001 tests for records, Hevy CSV, parsing and backup
3. REL-001 crash recovery screen

## Last verified
2026-10-04 20:34 (baseline: typecheck, tests, build and audit all pass)
