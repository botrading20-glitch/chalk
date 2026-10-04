# Development roadmap

The single master plan. Status values: TODO · IN_PROGRESS · BLOCKED · PARTIALLY_VERIFIED · VERIFIED · DONE · DEFERRED.
Task IDs are stable; never renumber. Architecture lives in `CLAUDE.md`; this file only holds the work.

**Mode:** EXISTING_PROJECT. **Depth:** level 1–2 (repair and refactor). No rebuild or migration is justified: the stack is current (React 19, Vite 8, TS 7, Dexie 4), the build is clean and there are 0 audit findings.

Phases from the template that don't apply: backend/API (there is none) and framework migration (not needed).

---

## Phase 0–2: Environment, discovery, baseline, requirements: DONE

| ID | Task | Status |
|----|------|--------|
| ENV-001 | Read `CLAUDE.md`, agent memory, git state; classify project mode | DONE |
| DISC-001 | Read all of `src/`; record baseline (typecheck, tests, build, audit, UI) in `TEST_STATUS.md` | DONE |
| REQ-001 | Write `REQUIREMENTS.md` and `NON_NEGOTIABLES.md` | DONE |

## Phase 3–8: Reliability, data integrity, UX (session 2026-10-04)

Order follows the priority rule: data integrity → reliability → UX → accessibility → security hardening.

### DX-001: Sample data for QA
- **Objective:** a reproducible, realistic data set (the owner's style: body-part split on machines and cables, kg) for visual QA and smoke tests.
- **Why:** the dev database is empty, so charts, history and records can't be checked without it.
- **Priority / risk:** P1 / LOW (dev-only script, never shipped).
- **Affected:** `scripts/sample-backup.mjs` (new). Output is git-ignored (`tmp-import/`).
- **Approach:** a Node script writes a Chalk backup JSON from library exercise ids, restorable via Settings → Restore backup.
- **Acceptance:** restoring the file gives about 40 workouts over 4 months, routines in a folder, weigh-ins, and records on the Progress page.
- **Validation:** restore in the dev app; History, Progress and exercise pages render with data.
- **Status:** DONE. Restored in the dev app: 65 workouts, 6 routines, 16 weigh-ins (2026-10-04).

### TEST-001: Tests for critical calculations and formats
- **Objective:** lock in current behaviour before changing anything. Covers records (NN-09), weekly buckets and streak, e1RM, Hevy CSV parse/export round trip (NN-06), the CSV parser, number and clock parsing, and `workoutFromDraft`.
- **Why:** only sync and plates have tests. Records and Hevy import are the most user-visible calculations.
- **Priority / risk:** P1 / LOW (tests only).
- **Dependencies:** none.
- **Affected:** `src/lib/*.test.ts` (new).
- **Acceptance:** the tests pass against the current code, so behaviour is unchanged.
- **Validation:** `npm test`.
- **Status:** DONE. 53 tests pass; mutation check: breaking the warm-up rule and 12-hour parsing each fails a test. Added dev dependency fake-indexeddb 6.2.5 (Apache-2.0, no deps) so Dexie code runs in tests.

### REL-001: Crash recovery screen
- **Objective:** a render error shows a recovery screen with the error, *Reload*, and *Download backup* instead of a blank page.
- **Why:** all data is local. Today one malformed record (from a restore, a sync or a bug) blanks the app and offers no way to export the data.
- **Priority / risk:** P0 / LOW.
- **Dependencies:** none.
- **Affected:** `src/components/ErrorBoundary.tsx` (new), `src/main.tsx`.
- **Approach:** a class error boundary around `<App/>` inside `DataProvider`. The backup uses `exportBackup()` and `saveFile()`, plain Dexie with no React. The boot failure path in `main.tsx` gets the same backup button.
- **Acceptance:** a thrown render error shows the screen; *Download backup* produces a valid backup; *Reload* recovers.
- **Validation:** inject a throw in dev and screenshot; restore the downloaded backup.
- **Status:** VERIFIED. Browser: a malformed workout (exercises: null) showed the recovery screen; Download a backup produced a valid file (66 workouts) with the file save stubbed; Go to Workout recovered once the record was removed. The boot-failure path renders the same screen (not forced).

### REL-002: Failures in async actions are visible
- **Objective:** a failed save shows a message and doesn't leave buttons stuck.
- **Why:** `FinishForm` sets `saving` and never resets it if `finishActive` throws, which locks the save button. Most `onClick` async handlers have no catch, so failures (quota, IndexedDB errors) are silent.
- **Priority / risk:** P1 / LOW.
- **Affected:** `src/main.tsx` (global `unhandledrejection` → toast), `src/pages/ActiveWorkout.tsx`.
- **Acceptance:** a forced rejection in a click handler shows a toast. A finish failure re-enables the button and keeps the workout.
- **Validation:** inject a failure in dev.
- **Status:** VERIFIED. Browser: rejected promises show one deduplicated toast and AbortError is ignored. A forced write failure on Save workout showed the message, re-enabled the button and kept the workout; the retry saved it.

### REL-003: Plate calculator freezes on huge targets
- **Objective:** an absurd target (a typo such as 1000000) shows a message instead of freezing the page.
- **Why:** measured in `calculatePlates`: 1,000,000 kg takes 2.2 s and 10,000,000 kg takes 117 s on the main thread. It reruns on every keystroke.
- **Priority / risk:** P1 / LOW.
- **Affected:** `src/lib/plates.ts` (`MAX_LOAD`), `src/components/PlateCalculator.tsx`.
- **Acceptance:** targets above 1,000 kg (2,200 lb) return `tooHeavy` immediately; the sheet says so.
- **Validation:** `plates.test.ts` timing case.
- **Status:** VERIFIED. Unit test (10,000,000 kg returns tooHeavy in under 50 ms). Browser: typing 1 → 10,000,000 in the sheet took 271 ms in total and showed the message; 145 kg still loads 25+25+20+2.5 per side.

### DATA-001: Validated, confirmed backup restore
- **Objective:** `importBackup` checks every record's shape before writing. Damaged records are left out and counted, and the rest restores (changed from "reject the whole file" after REL-001 showed a crash-screen backup can contain the record that caused the crash). The user sees what will be restored and confirms. Restored weigh-ins keep one per day.
- **Why:** restore writes whatever the file holds. A wrong or corrupted file can write records that crash rendering (see REL-001) or create duplicate weigh-ins.
- **Priority / risk:** P0 / MEDIUM (writes user data; NN-07 must hold).
- **Dependencies:** TEST-001 (backup round-trip test first).
- **Affected:** `src/lib/backup.ts`, `src/lib/validate.ts` (new), `src/pages/Settings.tsx`.
- **Approach:** add pure validators (`isWorkout`, `isRoutine`, `isExercise`, `isBodyWeight`). Parse, validate, then confirm with counts, then write in one transaction. Same-day weigh-ins from the file replace the local ones.
- **Acceptance:** a backup from any earlier version restores unchanged. Malformed JSON or a wrong app id is rejected with nothing written; damaged records are skipped and reported. The confirm sheet shows the counts.
- **Validation:** `backup.test.ts` (fake-indexeddb is not installed, so the pure parse/validate step is tested and the write path is checked in the browser).
- **Status:** VERIFIED. 56 tests pass (damaged/repairable records, settings cleaning, one weigh-in per day). Browser: the confirm sheet listed 65 workouts, 6 routines, 1 exercise, 16 weigh-ins and "1 damaged record … left out"; Restore wrote them; cleaning every stored record left all of them byte-identical (canonical JSON), so a restore causes no sync churn.

### UX-001: Editor drafts survive leaving the screen
- **Objective:** changes in the routine editor and the past-workout editor survive the back gesture, tapping an exercise link, closing the tab or the app being killed. The visible Back button asks before discarding changes.
- **Why:** both editors keep changes in React state only. On Android the system back gesture, which the owner uses, discards edits silently. So does tapping an exercise name inside the editor.
- **Priority / risk:** P1 / MEDIUM (touches two editors and routing behaviour).
- **Dependencies:** REL-002.
- **Affected:** `src/lib/drafts.ts` (new), `src/pages/RoutineEdit.tsx`, `src/pages/EditWorkout.tsx`, `src/components/ui.tsx` (PageHeader `onBack`), CSS.
- **Approach:** see ADR-001. Drafts live in `kv` under `draft:<kind>:<id>`, matching how the live workout is stored, and are not synced. Opening an editor that has a draft restores it and shows a "Restored unsaved changes · Discard" bar. Save or Discard deletes the draft.
- **Acceptance:** edit a routine, go back with the gesture, reopen: the edits are there with the bar. Discard restores the saved version. Save clears the draft. The Back button on a dirty editor asks to discard or keep editing.
- **Validation:** browser test of each path; `drafts.test.ts` for the pure helpers.
- **Status:** VERIFIED (browser, scripted). Routine editor: back gesture → reopen restores the edits with the bar; Back button → Keep editing stays, Discard changes leaves, deletes the draft and leaves the routine unchanged; Back with no changes doesn't ask; adding a set, tapping the exercise link and coming back restores it; Save writes and clears the draft. New-routine draft survives the gesture; the bar's Discard empties it. Past-workout editor: gesture, reopen and Save all work; typing then clearing notes leaves no draft. No unit test for the hook (no React testing library; not worth adding for one hook).

### A11Y-001: Contrast and focus
- **Objective:** `--text-3` meets 4.5:1 on `--bg` and `--surface` in both themes, and the search field shows focus.
- **Why:** measured 4.06:1 dark and 3.90:1 light. The token is used for tab labels, set headers, previous values, stat labels and chart axes.
- **Priority / risk:** P2 / LOW (token change within NN-16's palette).
- **Affected:** `src/styles.css`.
- **Acceptance:** dark #888692 (5.21 on bg) and light #656371 (5.30 on bg); `.search:focus-within` ring.
- **Validation:** contrast script; screenshots in both themes.
- **Status:** VERIFIED. Inactive tabs compute to rgb(136,134,146) (#888692) in dark, and the token reads #656371 in light; the contrast script gives 5.21 and 5.30 on the background. The search field outlines when its input has focus-visible. Screenshots of History and the live workout in both themes look right.

### SEC-001: Content Security Policy in production
- **Objective:** a CSP meta tag in production builds limits scripts to the app's origin and network to GitHub's API and the exercise image host.
- **Why:** the GitHub token is stored in IndexedDB, so any script injection would expose it. CSP is free defence in depth.
- **Priority / risk:** P2 / MEDIUM (a wrong policy breaks images, audio, fonts or sync).
- **Affected:** `vite.config.ts` (build-only `transformIndexHtml` plugin).
- **Acceptance:** with the preview build at `/chalk/`: no CSP violations in the console while using images, fonts, the share image (blob), the rest-alert audio (blob), install and the service worker. The policy allows `https://api.github.com`.
- **Validation:** smoke S-08 on `vite preview` plus the console.
- **Status:** VERIFIED on the preview build at `/chalk/` (375 px): the meta tag is first in `<head>`; zero violations while restoring a backup, loading exercise photos from raw.githubusercontent.com, both fonts, the share image (blob, 1080 px), the rest timer, and a blob WAV (loads). A fetch to https://example.com was blocked and reported (connect-src), so the policy is enforced. `https://api.github.com` matches `API` in `github.ts` by inspection; the live sync wasn't run (needs the owner's token). Offline: with the preview server stopped, a reload was served by the service worker and the in-progress workout was intact.

### QA-001: Visual and responsive pass
- **Objective:** check the main screens at 375 px, 768 px and desktop in both themes with sample data, and fix real defects.
- **Priority / risk:** P2 / LOW.
- **Dependencies:** DX-001, A11Y-001.
- **Status:** VERIFIED at 375, 360 and 1280 px, dark and light, with sample data. Defects found and fixed: (1) charts kept their 320 px first-render width and overflowed phones narrower than about 386 px (`.chart { min-width: 0 }`); (2) the charts' screen-reader table widened the page, because a table ignores `width: 1px` (it's now wrapped in the `.sr-only` div); (3) the 17-week calendar overflowed at 360 px (minmax(0, 1fr) columns); (4) the Back up / Restore button pair overflowed Settings (labels now wrap); (5) Previous values such as "48.75 kg × 10" were cut off, hiding reps (units dropped in that column, inputs narrower below 380 px). Sweep: no page-level overflow on 12 routes at 360 px, and no clipped Previous value.

### DOC-001: Project memory
- **Objective:** `.ai/` files plus a pointer and new architecture notes in `CLAUDE.md`.
- **Status:** IN_PROGRESS

## Phase 15: Release

### REL-100: Merge and deploy
- **Objective:** merge `quality-pass` into `main` and push, which deploys.
- **Status:** BLOCKED. Needs the owner's go-ahead (NN-15).

---

## Deferred and product decisions (owner's call)

| ID | Item | Why deferred |
|----|------|--------------|
| FEAT-001 | Google sign-in / Drive sync (local branch `google-sync`, ac225bb) | Needs the owner's Google Cloud OAuth client and a Cloudflare Worker. When merged, carry `bodyweight` into its sync kinds. |
| FEAT-002 | Stopwatch for timed sets | Product idea, not requested yet. |
| FEAT-003 | Sync the in-progress workout | Product idea; would change NN-05. |
| FEAT-004 | Drag to reorder routines and folders | Product idea. |
| FEAT-005 | In-app "delete cloud copy" | Product idea. |
| FEAT-006 | Warm-up badge colour other than yellow | Offered to the owner, no answer yet. |
| QA-002 | iPhone testing | No device. Expected caveats: no vibration, separate Safari and home-screen storage, locked-screen beep uncertain. |
| QA-003 | Lock-screen ±15 s / pause buttons on Android | Needs the owner's phone; never reported on. |
| PERF-001 | Route-level code splitting | Main chunk is 145 kB gzip and everything is precached for offline. No measured problem; revisit if startup is slow on the phone. |

## Traceability

| Requirement | Tasks | Evidence |
|-------------|-------|----------|
| REQ-Q01 | REL-001, REL-002, DATA-001, UX-001 | `TEST_STATUS.md` |
| REQ-Q02 | TEST-001 | `npm test` |
| REQ-Q03 | A11Y-001, QA-001 | contrast script, screenshots |
| REQ-Q04 | SEC-001 | preview build console |
| REQ-Q05 | DOC-001 | this folder |
