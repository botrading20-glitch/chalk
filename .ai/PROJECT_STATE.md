# Project state

## Project
- **Name:** Setward (formerly Chalk), live since 2026-10-05.
- **Purpose:** a free, offline-first workout logger that replaces Hevy for its owner, possibly published to app stores later
- **Version:** 0.1.0 (`package.json`). The live app at https://botrading20-glitch.github.io/chalk/ runs `main` @ 34d025d, the Setward merge, deployed 2026-10-05 (Pages run 37297499084).
- **Stack:** React 19, TypeScript 7, Vite 8, vite-plugin-pwa (Workbox), Dexie 4 (IndexedDB), Vitest 5 (+ fake-indexeddb in tests). No backend.

## Current status
- **Phase:** released. The quality pass (REL-100, 2026-10-04) and Setward with UX-002, UX-003, A11Y-002 and DOC-002 (REL-101, 2026-10-05) are live. Waiting on the owner's phone checks.
- **Branches:** `main` = live. `quality-pass` and `setward` are merged (kept locally). `google-sync` is parked (FEAT-001).
- **Completion:** all product requirements work. Quality requirements REQ-Q01–Q05 are done, apart from screen-reader and real-device checks.
- **Release decision:** READY WITH DOCUMENTED LIMITATIONS, released 2026-10-05 (`RELEASE_CHECKLIST.md`, REL-101).

## Architecture
A static PWA. Pages read everything through `DataProvider` (`useData()`), which loads all exercises and workouts and computes records once. Writes go straight to Dexie, and live queries re-render. The in-progress workout, editor drafts and other per-device state live in the `kv` table. Optional sync merges three ways against a private GitHub repo. An error boundary wraps the app, and backups are checked before restore. Full notes are in `CLAUDE.md`.

## Design direction
Dark-first, violet-tinted charcoal greys with a purple accent. Big Shoulders Display for titles and Archivo for body text, both self-hosted. Bumper-plate set badge colours. Tokens are in `src/styles.css`. `--text-3` is the dimmest text allowed (AA). The unused `--google-*` tokens are for the parked Google sync branch.

Setward identity: an angular split-S mark and “Forward, one set at a time.” tagline. Shared geometry: `src/lib/brand.ts`. App icons: `public/`. Reusable artwork and preview: `branding/`. Storage, backup/sync identifiers and the `/chalk/` address remain unchanged.

## Important constraints
- Free to build and host (NN-01). No secrets in the repo; the owner enters tokens in the app.
- Merging to `main` deploys (NN-15).

## Protected invariants
See `NON_NEGOTIABLES.md` (NN-01 to NN-16). None were changed this session.

## Current problems
None known at medium or high severity. Low-severity items left in the roadmap "Discovered" table: DATA-002, UX-004, ENV-002. No linter by the owner's choice (DX-002 cancelled).

## Current risks
- Neither release has been checked on the owner's Android phone yet (`RELEASE_CHECKLIST.md`).
- iPhone is untested (no device).
- Sync is shipped but unused by the owner. A Google Drive replacement is parked on the local-only branch `google-sync`; merging it needs its origins added to the CSP `connect-src`.

## Immediate next steps
1. The owner runs the phone checks in `RELEASE_CHECKLIST.md`, including the installed name/icon refresh.

## Last verified
2026-10-04: typecheck, 59 tests, build, and smoke S-01 to S-11 on dev and the `/chalk/` preview; the live deploy loads cleanly.

2026-10-05: 59 tests passed (2 live-sync checks skipped), `/chalk/` production build passed. Dark/light 360 px home/header, settings, icons and sample share card verified locally. No console warnings/errors in the inspected preview. Phone branding refresh not run.

2026-10-05 (afternoon, branch `setward` @ 4ae76c3): 62 tests passed (2 skipped), `/chalk/` build passed (main chunk 149.04 kB gzip). Browser: UX-002, UX-003, A11Y-002, DOC-002 checks; 320 px header fits; preview S-01/S-02/S-08 with no CSP violations or console messages.

2026-10-05 (release, `main` @ 34d025d): same checks on `main`, then live: Pages run 37297499084 succeeded; Setward title/manifest, CSP, service worker, photos, 0 violations, no console messages.
