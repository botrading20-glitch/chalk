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
- **Status:** VERIFIED at 320, 360, 375 and 1280 px, dark and light, with sample data. Defects found and fixed: (1) charts drew at a placeholder 320 px and, as grid items, never shrank, so they overflowed every phone narrower than about 386 px, including 375 px (`.chart { min-width: 0 }`, plus a synchronous measurement before first paint); (2) the charts' screen-reader table widened the page, because a table ignores `width: 1px` (it's now wrapped in the `.sr-only` div); (3) the 17-week calendar overflowed at 360 px (minmax(0, 1fr) columns); (4) the Back up / Restore button pair overflowed Settings (labels now wrap); (5) Previous values such as "48.75 kg × 10" were cut off, hiding reps (units dropped in that column; inputs narrower below 380 px; below 340 px values wrap onto two lines under a "Last" header). Sweeps: no page-level overflow on 12 routes at 360 px and 10 at 320 px; no clipped Previous value at 320, 360 or 375; charts 254 / 294 / 309 px at 320 / 360 / 375. Note: the browser pane was sometimes hidden, so it rendered no frames and the resize observer couldn't fire; the 320 px chart result comes after the layout-effect change, which doesn't depend on frames.

### DOC-001: Project memory
- **Objective:** `.ai/` files plus a pointer and new architecture notes in `CLAUDE.md`.
- **Status:** DONE. `.ai/` holds the state, current task, requirements, invariants, roadmap, progress, decisions and ADR-001, test status, session log, smoke tests and release checklist. `CLAUDE.md` gained a pointer to `.ai/`, the test and sample commands, the Git Bash build note, and architecture notes on crash recovery, restore checks, drafts and the CSP. `README.md` lists the sample script.

## Phase 15: Release

### REL-100: Merge and deploy
- **Objective:** merge `quality-pass` into `main` and push, which deploys to https://botrading20-glitch.github.io/chalk/.
- **Risk:** MEDIUM. It changes the live app the owner trains with. Rollback is `git revert` of the merge, then push; the service worker picks up the reverted build on the next visit.
- **Before merging:** smoke tests S-01 to S-11 pass (see `TEST_STATUS.md`). After deploy, open the live URL on the phone and run S-03, S-04 and S-06 in a real workout.
- **Status:** DONE (2026-10-04, owner approved). Merged as 6d15c2e (`--no-ff`); on `main` before the push, 59 tests passed, the build passed and the lockfile passed `npm ci --dry-run`. Pushed 0698dc1..6d15c2e; the Pages run 37229036212 succeeded. The live page serves `index-Cd64usJi.js` (474 kB) with the CSP meta, and `sw.js` returns 200. Loaded in the built-in browser: renders, exercise photos load, no CSP violations, no console errors. Still to do: the owner's on-phone checks (`RELEASE_CHECKLIST.md`).

## Setward identity (session 2026-10-05)

### BRAND-001: New app name and logo
- **Objective:** create and apply the Setward name, angular split-S logo and “Forward, one set at a time.” tagline, with reusable assets saved locally.
- **Affected:** Workout header, browser/install metadata, public icons, share card, visible copy, export filenames, README, `branding/` and `src/lib/brand.ts`.
- **Compatibility:** retain the `chalk` database/backup identifiers, `chalk-sync/1`, manifest start URL/scope and `/chalk/` address. No dependencies added.
- **Validation:** 59 tests passed; 2 opt-in live-sync tests skipped; `/chalk/` production build passed. Dark/light 360 px header, settings, icons and sample share card checked locally (`TEST_STATUS.md`).
- **Status:** DONE locally, uncommitted and not deployed. Live remains Chalk at `main` @ 6d15c2e. Publishing needs the owner's authorization (NN-15); then check installed name/icon refresh and the remaining phone checks in `RELEASE_CHECKLIST.md`.

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
| PERF-001 | Route-level code splitting | Main chunk is 149 kB gzip and everything is precached for offline. No measured problem; revisit if startup is slow on the phone. |

## Discovered during the 2026-10-04 pass (valid, not yet done)

| ID | Item | Severity | Why it remains |
|----|------|----------|----------------|
| DATA-002 | Records arriving through sync aren't shape-checked. A damaged one would show the crash screen (with a backup button) rather than be skipped. | Low | Filtering sync input would turn into a cloud deletion (see `DECISIONS.md`). A safe fix is a "data check" in Settings that lists damaged records for the user to delete. |
| UX-002 | Deleting a custom exercise checks workouts but not routines, so routines then show "Deleted exercise". | Low | Small; needs a decision: block, or remove it from routines. |
| UX-003 | "Best session volume" also shows for assisted-bodyweight exercises, where it multiplies assistance by reps. | Low | Cosmetic. Use `COUNTS_VOLUME` in `ExerciseDetail`. |
| UX-004 | The new and edit exercise form has no draft or discard prompt. | Low | Short form; ADR-001 leaves it out on purpose. |
| A11Y-002 | `Segmented` uses `role="radio"` buttons without arrow-key movement (each option is a tab stop). | Low | Works with Tab and Enter; arrow keys would match the radio pattern. |
| DX-002 | No linter is configured (only strict `tsc`). | Low | Adding ESLint means new dev dependencies and a style decision for the owner. |
| ENV-002 | GitHub moves the `ubuntu-latest` runner to Ubuntu 26 from 2026-10-19 (deploy annotation). | Low | Nothing to change now; if a deploy fails after that date, pin `runs-on: ubuntu-24.04` in `.github/workflows/deploy.yml`. |

## Traceability

| Requirement | Tasks | Evidence |
|-------------|-------|----------|
| REQ-Q01 | REL-001, REL-002, DATA-001, UX-001 | `TEST_STATUS.md` |
| REQ-Q02 | TEST-001 | `npm test` |
| REQ-Q03 | A11Y-001, QA-001 | contrast script, screenshots |
| REQ-Q04 | SEC-001 | preview build console |
| REQ-Q05 | DOC-001 | this folder |
