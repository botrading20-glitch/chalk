# Project state

## Project
- **Name:** Setward (formerly Chalk). The rebrand is committed on the local branch `setward`, not deployed.
- **Purpose:** a free, offline-first workout logger that replaces Hevy for its owner, possibly published to app stores later
- **Version:** 0.1.0 (`package.json`). The live app at https://botrading20-glitch.github.io/chalk/ runs `main` @ 6d15c2e, the quality-pass merge, deployed 2026-10-04.
- **Stack:** React 19, TypeScript 7, Vite 8, vite-plugin-pwa (Workbox), Dexie 4 (IndexedDB), Vitest 5 (+ fake-indexeddb in tests). No backend.

## Current status
- **Phase:** the quality pass is live (REL-100). The local branch `setward` holds the rebrand plus UX-002, UX-003, A11Y-002 and DOC-002, all verified locally. Publishing it (REL-101) is blocked on the owner's go-ahead.
- **Branches:** `main` @ 047c53f = what's live (plus notes). `setward` = main + 6 commits, local only. `quality-pass` is merged. `google-sync` is parked (FEAT-001).
- **Completion:** all product requirements work. Quality requirements REQ-Q01–Q05 are done, apart from screen-reader and real-device checks.
- **Release decision:** live app: READY WITH DOCUMENTED LIMITATIONS, released 2026-10-04. Branch `setward`: READY WITH DOCUMENTED LIMITATIONS for GitHub Pages, not authorized (`RELEASE_CHECKLIST.md`).

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
None known at medium or high severity. Low-severity items left in the roadmap "Discovered" table: DATA-002, UX-004, DX-002, ENV-002.

## Current risks
- The changes haven't run on the owner's Android phone yet. Check right after deploy (`RELEASE_CHECKLIST.md`).
- iPhone is untested (no device).
- Sync is shipped but unused by the owner. A Google Drive replacement is parked on the local-only branch `google-sync`; merging it needs its origins added to the CSP `connect-src`.

## Immediate next steps
1. Ask the owner about REL-101 (publish `setward`). Steps are in `CURRENT_TASK.md`.
2. After a deploy, the owner runs the phone checks in `RELEASE_CHECKLIST.md`, including the installed name/icon refresh.
3. Open owner decisions: keep the UX-002 default (block the delete)? ESLint (DX-002)?

## Last verified
2026-10-04: typecheck, 59 tests, build, and smoke S-01 to S-11 on dev and the `/chalk/` preview; the live deploy loads cleanly.

2026-10-05: 59 tests passed (2 live-sync checks skipped), `/chalk/` production build passed. Dark/light 360 px home/header, settings, icons and sample share card verified locally. No console warnings/errors in the inspected preview. Phone branding refresh not run.

2026-10-05 (afternoon, branch `setward` @ 4ae76c3): 62 tests passed (2 skipped), `/chalk/` build passed (main chunk 149.04 kB gzip). Browser: UX-002, UX-003, A11Y-002, DOC-002 checks; 320 px header fits; preview S-01/S-02/S-08 with no CSP violations or console messages.
