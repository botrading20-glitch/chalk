# Project state

## Project
- **Name:** Setward (formerly Chalk), live since 2026-10-05.
- **Purpose:** a free, offline-first workout logger with its own identity, live as a public web app since 2026-10-17 (Play Store later, groundwork in `PLAY_STORE.md`)
- **Version:** 1.1.0 (`package.json`), live since 2026-10-18. The live app at https://botrading20-glitch.github.io/chalk/ runs `main` @ 5d93525 (Setward 1.1, merge of `training-tools`), deployed by Pages run 39141053406. Setward 1.0 (c3da695, 2026-10-17) was the release before. The live app at https://botrading20-glitch.github.io/chalk/ runs `main` @ c3da695 (Setward 1.0, merge of `launch`), deployed 2026-10-17 (Pages run 39056196923). Earlier releases: the data check 2026-10-16 (e7ad7fe), the stopwatch, routine reordering and orange warm-up badge 2026-10-05 (c232c2d).
- **Stack:** React 19, TypeScript 7, Vite 8, vite-plugin-pwa (Workbox), Dexie 4 (IndexedDB), Vitest 5 (+ fake-indexeddb in tests). No backend.

## Current status
- **Released (2026-10-18):** Setward 1.1.0 (branch `training-tools`, merged as 5d93525 and pushed at the owner's choice): warm-up sets, live record alerts and Workout toggles, the muscle map, the monthly report and the Reps / range chart, Help guides, set videos kept on the phone, CSV formula escaping, exact pound, half-point RPE, What's new. Verified in `TEST_STATUS.md`, release record REL-105, live page checked.
- **Phase:** released. Setward 1.1.0 (REL-105, 2026-10-18) is live, on top of 1.0 (REL-104), the data check (REL-103), REL-102, REL-101 and the quality pass (REL-100). Waiting on the owner's phone checks. Setward 1.0 (REL-104, 2026-10-17) is live, on top of the quality pass (REL-100), Setward with UX-002, UX-003, A11Y-002 and DOC-002 (REL-101), REL-102 and the data check (REL-103). Waiting on the owner's phone checks.
- **Branches:** `main` = live (5d93525; the notes commit after it is local until the owner asks for a push). `training-tools` and `launch` are merged (kept locally, with `quality-pass`, `setward`, `features` and `data-check`). `google-sync` is parked (FEAT-001).
- **Completion:** all product requirements work. Quality requirements REQ-Q01–Q05 are done, apart from screen-reader and real-device checks.
- **Release decision:** READY WITH DOCUMENTED LIMITATIONS, released 2026-10-17 (`RELEASE_CHECKLIST.md`, REL-104).

## Architecture
A static PWA. Pages read everything through `DataProvider` (`useData()`), which loads all exercises and workouts and computes records once. Writes go straight to Dexie, and live queries re-render. The in-progress workout, editor drafts and other per-device state live in the `kv` table. Optional sync merges three ways against a private GitHub repo. An error boundary wraps the app, and backups are checked before restore. Full notes are in `CLAUDE.md`.

## Design direction
Dark-first, violet-tinted charcoal greys with a purple accent. Big Shoulders Display for titles and Archivo for body text, both self-hosted. Bumper-plate set badge colours. Tokens are in `src/styles.css`. `--text-3` is the dimmest text allowed (AA). The unused `--google-*` tokens are for the parked Google sync branch.

Setward identity: an angular split-S mark and “Forward, one set at a time.” tagline. Shared geometry: `src/lib/brand.ts`. App icons: `public/`. Reusable artwork and preview: `branding/`. Storage, backup/sync identifiers and the `/chalk/` address remain unchanged.

## Important constraints
- Free to build and host (NN-01). No secrets in the repo; the owner enters tokens in the app.
- Merging to `main` deploys (NN-15).

## Protected invariants
See `NON_NEGOTIABLES.md` (NN-01 to NN-19). NN-17 (every language has every message) and NN-18 (the privacy promise) were added for 1.0, NN-19 (set videos stay on the device) for 1.1; NN-16 was amended for the Forward look.

## Current problems
None known at medium or high severity. Low-severity items left in the roadmap "Discovered" table: UX-004 (DATA-002 is done and live). Deploy runners pinned to Ubuntu 24.04 (ENV-002). No linter by the owner's choice (DX-002 cancelled).

## Current risks
- 1.1 is live but the first real-device exercise of it is still the owner's: camera capture, video playback and sharing, and the Dexie upgrade to version 3 on an installed copy (`RELEASE_CHECKLIST.md`, REL-105).
- Neither release has been checked on the owner's Android phone yet (`RELEASE_CHECKLIST.md`).
- iPhone is untested (no device).
- Sync is shipped but unused by the owner. A Google Drive replacement is parked on the local-only branch `google-sync`; merging it needs its origins added to the CSP `connect-src`.

## Immediate next steps
0. The owner opens the app on the phone (back up first: Settings → Your data → Back up now) and runs the REL-105 phone checks.
1. The owner runs the phone checks in `RELEASE_CHECKLIST.md` (REL-101 to REL-104) and, if wanted, the sharing-tool checks for the link preview.
2. Owner decisions that are open: the copyright holder in `LICENSE`, the Google Play steps in `PLAY_STORE.md` (account fee, closed test, package name, contact email), a native-speaker look at the ten translations.
3. Retake the Play screenshots on a phone (1080 × 1920) before any Play submission.

## Last verified

2026-10-18 (`main` @ 5d93525, live): typecheck clean, 217 tests passed (2 skipped), contrast 732 pairs 0 failing, `/chalk/` build (39 precache entries). Live page checked after the deploy (Pages run 39141053406): bundle `index-kTaETHx-.js`, CSP, service worker, About 1.1.0, Help group, report, schema 3, 0 violations, no console errors. Phone, iPhone, screen reader and native speakers not run. See `TEST_STATUS.md` (live check after the 1.1 release).

2026-10-18 (branch `training-tools`, Setward 1.1.0): typecheck clean, 217 tests passed (2 skipped), contrast 732 pairs 0 failing, `/chalk/` build (index chunk 112.6 kB gzip, 39 precache entries); the report's same-days comparison rechecked after the sweep. Browser: every route in all eleven languages at 320 px (385 loads) against `clientWidth`, one fix; the What's new sheet in all eleven; every set-video path with a generated clip; the upgrade from 1.0 data; a blob video under the production CSP. Phone, iPhone, screen reader and native speakers not run. See `TEST_STATUS.md` (Training tools).

2026-10-17 (`main` @ c3da695, live): typecheck clean, 163 tests passed (2 skipped), contrast 732 pairs 0 failing, `/chalk/` build main chunk 168.55 kB gzip. Browser: smoke S-01 to S-16 on dev and on the empty-storage preview, offline reload in French, every route in ten languages and in English across setting combinations at 320 to 412 px against `clientWidth`, keyboard and reduced motion. Live page checked after the deploy (Pages run 39056196923). Phone, iPhone, screen reader and native speakers not run. See `TEST_STATUS.md` (LAUNCH-M8).

2026-10-16 (`main` @ e7ad7fe, live): typecheck clean, 88 tests passed (2 skipped), `/chalk/` build (main chunk 153.77 kB gzip). Browser: DATA-002 on dev with the sample data and on the `/chalk/` preview: crash screen → check → backup → delete → reload works, repairs verified, 320 px dark and light, 0 CSP violations. Phone and screen reader not run. Live after the push (Pages run 38953196792): bundle `index-D2GzHZz1.js`, CSP, service worker, Check data opens, 0 CSP violations, no console errors.

2026-10-04: typecheck, 59 tests, build, and smoke S-01 to S-11 on dev and the `/chalk/` preview; the live deploy loads cleanly.

2026-10-05: 59 tests passed (2 live-sync checks skipped), `/chalk/` production build passed. Dark/light 360 px home/header, settings, icons and sample share card verified locally. No console warnings/errors in the inspected preview. Phone branding refresh not run.

2026-10-05 (afternoon, branch `setward` @ 4ae76c3): 62 tests passed (2 skipped), `/chalk/` build passed (main chunk 149.04 kB gzip). Browser: UX-002, UX-003, A11Y-002, DOC-002 checks; 320 px header fits; preview S-01/S-02/S-08 with no CSP violations or console messages.

2026-10-05 (release, `main` @ 34d025d): same checks on `main`, then live: Pages run 37297499084 succeeded; Setward title/manifest, CSP, service worker, photos, 0 violations, no console messages.

2026-10-05 (branch `features` @ 44c6840): 67 tests, `/chalk/` build (main chunk 150.96 kB gzip), browser QA of FEAT-002/004/006 at 375 and 320 px in both themes, preview S-01/S-02/S-08 with no CSP violations.
