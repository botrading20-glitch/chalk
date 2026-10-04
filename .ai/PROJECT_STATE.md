# Project state

## Project
- **Name:** Chalk
- **Purpose:** a free, offline-first workout logger that replaces Hevy for its owner, possibly published to app stores later
- **Version:** 0.1.0 (`package.json`). The live app at https://botrading20-glitch.github.io/chalk/ runs `main` @ 6d15c2e, the quality-pass merge, deployed 2026-10-04.
- **Stack:** React 19, TypeScript 7, Vite 8, vite-plugin-pwa (Workbox), Dexie 4 (IndexedDB), Vitest 5 (+ fake-indexeddb in tests). No backend.

## Current status
- **Phase:** the quality pass is merged and live (REL-100 done). Next: the owner checks it on the phone.
- **Completion:** all product requirements work. Quality requirements REQ-Q01–Q05 are done, apart from screen-reader and real-device checks.
- **Release decision:** READY WITH DOCUMENTED LIMITATIONS, released 2026-10-04 (`RELEASE_CHECKLIST.md`)

## Architecture
A static PWA. Pages read everything through `DataProvider` (`useData()`), which loads all exercises and workouts and computes records once. Writes go straight to Dexie, and live queries re-render. The in-progress workout, editor drafts and other per-device state live in the `kv` table. Optional sync merges three ways against a private GitHub repo. An error boundary wraps the app, and backups are checked before restore. Full notes are in `CLAUDE.md`.

## Design direction
Dark-first, violet-tinted charcoal greys with a purple accent. Big Shoulders Display for titles and Archivo for body text, both self-hosted. Bumper-plate set badge colours. Tokens are in `src/styles.css`. `--text-3` is the dimmest text allowed (AA). The unused `--google-*` tokens are for the parked Google sync branch.

## Important constraints
- Free to build and host (NN-01). No secrets in the repo; the owner enters tokens in the app.
- Merging to `main` deploys (NN-15).

## Protected invariants
See `NON_NEGOTIABLES.md` (NN-01 to NN-16). None were changed this session.

## Current problems
None known at medium or high severity. Low-severity items are in the roadmap "Discovered" table (DATA-002, UX-002–004, A11Y-002, DX-002).

## Current risks
- The changes haven't run on the owner's Android phone yet. Check right after deploy (`RELEASE_CHECKLIST.md`).
- iPhone is untested (no device).
- Sync is shipped but unused by the owner. A Google Drive replacement is parked on the local-only branch `google-sync`; merging it needs its origins added to the CSP `connect-src`.

## Immediate next steps
1. The owner runs the on-phone checks in `RELEASE_CHECKLIST.md` at the next workout and reports anything odd.
2. Then pick from the deferred list or the owner's own requests.

## Last verified
2026-10-04: typecheck, 59 tests, build, and smoke S-01 to S-11 on dev and the `/chalk/` preview; the live deploy loads cleanly.
