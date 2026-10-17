# Development roadmap

The single master plan. Task states: TODO · IN_PROGRESS · IMPLEMENTED · BLOCKED · DONE · DEFERRED · CANCELLED. Checks are recorded separately as PASS · FAIL · PARTIAL · NOT_RUN · BLOCKED · NOT_APPLICABLE (`TEST_STATUS.md`).
Legacy labels from 2026-10-04 are kept as written: **VERIFIED** means DONE with its checks PASS; **PARTIALLY_VERIFIED** means IMPLEMENTED with some checks still pending.
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
- **Status:** DONE. Committed unchanged on the local branch `setward` as 6ce6fb4 (code and assets) and e40a906 (notes) on 2026-10-05; not merged or deployed. Live remains Chalk at `main` @ 6d15c2e. Publishing is REL-101.

## Handoff reconciliation and backlog (session 2026-10-05, afternoon)

### ENV-003: Resume, reconcile and protect the uncommitted rebrand
- **Objective:** apply the master prompt (v2) at session start: read instructions and memory, compare them with the working tree, record a baseline, and keep the rebrand separate from new work.
- **Findings:** the handoff matched the tree. Two mismatches: `AGENTS.md` pointed to a non-existent `.Codex/launch.json`, and the share card still drew dim text in the pre-A11Y-001 grey (#76747f). The roadmap used status labels the v2 prompt doesn't (mapped in the header).
- **Baseline (uncommitted tree):** typecheck and `/chalk/` build pass (main chunk 148.77 kB gzip); 59 tests pass, 2 opt-in skipped; Node 24.19.0, npm 11.17.0.
- **Action:** branch `setward` from `main` @ 047c53f; rebrand committed unchanged in two commits; `AGENTS.md` path fixed.
- **Task state:** DONE.

### UX-002: Deleting a custom exercise checks routines and the live workout
- **Decision (CONFIRMED by the owner, 2026-10-05):** block the delete, as the app already did for workouts, instead of silently removing the exercise from routines. Nothing changes the user's data without them doing it.
- **Affected:** `src/lib/exercises.ts` (`exerciseUses`), `src/pages/ExerciseDetail.tsx`, `src/lib/exercises.test.ts` (new).
- **Acceptance:** an exercise used by a workout, routine or the workout in progress can't be deleted, and the toast says where it's used; an unused one still asks and then deletes.
- **Validation:** 3 unit tests; browser: a routine-only exercise → "Used in 1 routine — remove it there first"; the sample's custom exercise → "Used in 13 workouts and 1 routine…"; after removing the routine, the delete confirm appeared and deleted it.
- **Task state:** DONE (83fd874).

### UX-003: No session volume for assisted bodyweight
- **Affected:** `src/pages/ExerciseDetail.tsx` (gated on `COUNTS_VOLUME`, as the charts already are via `metricsFor`).
- **Validation:** browser: an assisted pull-up with two sessions shows only Most reps and Logged (before: a 490 kg "Best session volume"); Chest Press (Machine) still shows it.
- **Task state:** DONE (83fd874).

### A11Y-002: Arrow keys in segmented controls
- **Affected:** `src/components/ui.tsx` (`Segmented`): roving tab index; arrows (wrapping), Home and End move focus and select.
- **Validation:** browser with real key presses: exercise tabs (2 options) and Settings → Theme (3): right/left/up/down wrap, Home/End, Enter still activates, one Tab leaves the group, and the focus ring shows (`:focus-visible`, 2 px accent). No unit test (no React testing library; see UX-001).
- **Task state:** DONE (436c05f).

### DOC-002: Share card grey matches the token
- **Affected:** `src/lib/shareCard.ts` (`text3` → #888692).
- **Validation:** rendered card: 2,898 pixels in #888692 across labels and footer, 1 stray old-grey pixel (antialiasing); visual check.
- **Task state:** DONE (4ae76c3).

### REL-101: Publish the `setward` branch
- **Objective:** merge `setward` into `main` and push, which deploys the rebrand and the fixes above.
- **Risk:** MEDIUM. It changes the installed app's name and icon on the owner's phone. App identity is unchanged (`start_url`/`scope` stay `/chalk/`, checked in `dist/manifest.webmanifest`), so Android treats it as an update of the same app and the data stays. Rollback: `git revert -m 1 <merge>` and push.
- **Before merging:** done 2026-10-05: 62 tests, `/chalk/` build, preview smoke S-01/S-02/S-08.
- **Task state:** DONE (2026-10-05, owner said "merge and push it"). Merged as 34d025d (`--no-ff`); on `main` before the push: 62 tests, `/chalk/` build (same bundle `index-z9IrtRPz.js` as the branch), `npm ci --dry-run`, and a secret scan of the merged diff. Pushed 047c53f..34d025d; Pages run 37297499084 succeeded (build and deploy). Live: title, apple title and manifest say Setward; `start_url`/`scope` `/chalk/`; CSP meta present; service worker in control; 6 routes render without overflow; exercise photos load; 0 CSP violations; no console messages. Still to do: the owner's phone checks (`RELEASE_CHECKLIST.md`).

---

## Owner-requested features (session 2026-10-05, branch `features`)

### FEAT-006: Orange warm-up badge (9567eca)
- **Source:** owner, 2026-10-05 ("a different warm-up badge colour"). Changes NN-16; recorded in `DECISIONS.md`.
- **Design:** new token `--warmup` #f2994a (dark) / #964400 (light). Chosen as "warm" and distinct from red F, blue D, green done rows and the purple accent. The yellow `--warm` stays for the 15 kg plate.
- **Acceptance:** text on the badge's own 14% tint is at least 4.5:1 over `--surface` and in a done row, in both themes.
- **Validation:** contrast script: dark 6.03 (surface) / 4.91 (done row); light 5.42 / 4.71 (the old light yellow was 3.85 on white). Computed colours in the browser: rgb(242,153,74) dark, rgb(150,68,0) light; `--warm` unchanged. Screenshot of the live editor.
- **Task state:** DONE.

### FEAT-004: Reorder routines by dragging (905ac95)
- **Source:** owner, 2026-10-05 ("drag to reorder routines").
- **Design:** a "Reorder routines" sheet from a routine's or folder's menu (hidden when the group has one routine), not drag on the home cards: the cards are tall, so dragging them would need auto-scroll and would compete with page scrolling. Compact rows with a grip handle (`touch-action: none`), plus up/down buttons and arrow keys as the non-drag alternative (WCAG 2.2 2.5.7). Moves save immediately; a polite live region announces the new position. Scope: within one folder, or within the routines in no folder; moving between folders stays in "Move to a folder"; folders stay A-Z. No dependency added.
- **Data:** `reorderedRoutines` reuses the group's own `order` values, nudging equal values apart, and writes only the routines whose order changed (sync uploads only the routines file). No schema change.
- **Validation:** `folders.test.ts` (4 tests). Browser: a real mouse drag moved Leg day to the top (orders 1-5 saved, the routine outside folders stayed 6); a scripted mid-drag showed the lifted row and the others making room, and the drop saved; arrow keys on the handle and real clicks on the arrows moved rows, with focus kept and the announcement correct; no option for a group of one; 320 px light theme fits, 44 px handles.
- **Limitation:** no auto-scroll while dragging; a very long folder can still be ordered with the arrows.
- **Task state:** DONE.

### FEAT-002: Stopwatch for timed sets (44c6840)
- **Source:** owner, 2026-10-05 ("a stopwatch for timed sets like planks").
- **Design:** live mode only, for exercise types with a duration field (duration, weight + duration, distance + duration). "Time set N" next to "Add set" times the next set that isn't done; one stopwatch at a time. The panel shows a 64 px clock, the target (the set's own time = "Target", else last session's = "Last time", else the set before = "Previous set") with a progress bar, Cancel and Stop and save. It rings once (beep if sound is on, vibration if on) when the target passes and keeps counting. Stop, or the set's check button, saves the rounded seconds, fills empty fields like a normal check and starts the rest. Starting it ends a running rest, so the rest beep can't go off mid-set.
- **Data:** `ActiveWorkout.stopwatch = { setId, startedAt }` (kv, not synced); `workoutFromDraft` never copies it (test). A stopwatch whose set was removed is ignored.
- **Validation:** browser on dev with the sample data: the rest cleared on start; panel and highlighted row; survives a reload; the target alert fired once (vibration spy) and the label changed to "reached"; Stop and save stored 94 s, checked the set and started the 90 s rest; checking the set while timing saved it; Cancel left the set untouched; removing the timed set freed the stopwatch; 320 px light theme fits. Production preview: picker, Plank, time, save works. The beep itself wasn't heard (no audio here; same path as the rest beep).
- **Limitation:** with the screen locked the alert may be late (no lock-screen keep-alive for the stopwatch; "Keep screen on" covers normal use).
- **Task state:** DONE.

### REL-102: Publish the `features` branch
- **Task state:** DONE (2026-10-05, owner: "merge and push it"). Merged as c232c2d (`--no-ff`); on `main`: 67 tests, `/chalk/` build (same bundle `index-D7zhvP27.js` as the branch), `npm ci --dry-run` and a secret scan passed. Pushed 9c06bea..c232c2d; Pages run 37302757241 succeeded with 0 annotations. Live: the new bundle, `--warmup` #f2994a, the stopwatch and reorder styles present, 5 routes without overflow, 0 CSP violations, no console messages; the cached older version updated itself with one reload. Still to do: the owner's phone checks.

## Data check (session 2026-10-16, branch `data-check`)

### DATA-002: Check data for problems
- **Source:** the backlog entry in "Discovered" below ("a safe fix is a data check in Settings"). The owner picked it as this session's workflow when the master prompt (v2) asked for "the first complete, usable workflow"; the core logging workflow already existed and is live.
- **Problem:** records that arrive through sync, or that a bug wrote, are not shape-checked. One workout with `exercises: null` makes `computeRecords` throw inside `DataProvider`, so the whole app shows the crash screen, and Reload crashes again. The only way out was Erase all data. Filtering sync input automatically is ruled out: a filtered record looks deleted locally and the deletion would sync to the cloud.
- **Design:** Settings → Your data → "Check data for problems" (a sheet) and, on the crash screen, "Check for damaged data". It runs the Restore-backup cleaners (`validate.ts`, unchanged) over workouts, routines, the user's own exercises, weigh-ins and the settings row. A cleaner returning `null` = damaged (delete only). A cleaned copy that differs from the stored record = repairable (Repair writes it, keeps unknown fields, bumps `updatedAt` where the record has one). The comparison is canonical JSON with `exerciseIds` compared as a set, so records the app writes itself never flag. A backup button comes first. Delete asks once, with focus on Keep. Every action re-reads the record inside a transaction and does nothing if it changed since the check (a sync may have landed). Nothing changes until the user taps. Fixes sync like any edit. No schema change, no new dependency.
- **Affected:** `src/lib/dataCheck.ts` (no React and no DataProvider, so the crash screen can use it), `src/lib/dataCheck.test.ts`, `src/components/DataCheck.tsx` (all new); `src/components/ErrorBoundary.tsx`, `src/pages/Settings.tsx`, `src/lib/format.ts` (`listJoin` moved here from Settings), `src/styles.css`.
- **Validation:** 21 new tests (88 pass, 2 opt-in skipped). Two deliberate mutations (stop normalising `exerciseIds`; let delete take a repairable record) each fail one test. Browser, dev server with the sample data: healthy data reads "No problems found" (65 workouts, 6 routines, 1 exercise, 16 weigh-ins); a workout with `exercises: null` crashed the app, the crash-screen check named it, the downloaded backup contained it, Keep left it alone, Delete removed only it, and Reload Setward opened the app with History intact; a workout without `exerciseIds`, a routine with a bad `order` and a bad setting were each repaired (unknown fields kept, valid settings kept). 320 px: no overflow, a long unbreakable title wraps; dark and light checked. Production preview at `/chalk/`: 0 CSP violations; the whole crash → check → backup → delete → reload flow works on the built bundle; S-02 on 5 routes; S-03 start-and-reload. Main chunk 153.77 kB gzip (+2.8 kB).
- **Limitations:** the workout in progress is not checked (not synced, no validator). A custom exercise with a missing `source` is checked but is left out of backups (they read the `source` index). Two same-day weigh-ins from different devices are not flagged (consistency, not shape). The check repairs shape, never meaning. Not tried on a phone; no screen-reader pass.
- **Task state:** DONE and released as REL-103 (code and tests ce3daae, notes e991ab7, merged as e7ad7fe).

### REL-103: Publish the `data-check` branch
- **Task state:** DONE (2026-10-16, owner: "Merge data-check into main and push it"). Merged as e7ad7fe (`--no-ff`); on `main`: typecheck, 88 tests, `/chalk/` build (same bundle `index-D2GzHZz1.js` as the branch), `npm ci --dry-run` and a secret scan of the merged diff passed. Pushed 663cb56..e7ad7fe; Pages run 38953196792 succeeded (build 21 s, deploy 11 s, 0 annotations on both jobs). Live: bundle `index-D2GzHZz1.js`, Setward manifest with the `/chalk/` scope, CSP meta, service worker in control, 5 routes without overflow, Settings → Check data opens and reads "No problems found" on empty storage, 0 CSP violations, no console errors. Still to do: the owner's phone checks. Rollback: `git revert -m 1 e7ad7fe` and push; no data migration or schema change is involved.

## Deferred and product decisions (owner's call)

| ID | Item | Why deferred |
|----|------|--------------|
| FEAT-001 | Google sign-in / Drive sync (local branch `google-sync`, ac225bb) | Needs the owner's Google Cloud OAuth client and a Cloudflare Worker. When merged, carry `bodyweight` into its sync kinds. |
| FEAT-002 | ~~Stopwatch for timed sets~~ | DONE 2026-10-05 (see "Owner-requested features" above). |
| FEAT-003 | Sync the in-progress workout | Product idea; would change NN-05. |
| FEAT-004 | ~~Drag to reorder routines~~ (folders stay A-Z) | DONE 2026-10-05 (see above). Reordering the folders themselves isn't built: they'd need a stored order. |
| FEAT-005 | In-app "delete cloud copy" | Product idea. |
| FEAT-006 | ~~Warm-up badge colour other than yellow~~ | DONE 2026-10-05 (see above). |
| QA-002 | iPhone testing | No device. Expected caveats: no vibration, separate Safari and home-screen storage, locked-screen beep uncertain. |
| QA-003 | Lock-screen ±15 s / pause buttons on Android | Needs the owner's phone; never reported on. |
| PERF-001 | Route-level code splitting | Main chunk is 149 kB gzip and everything is precached for offline. No measured problem; revisit if startup is slow on the phone. |

## Discovered during the 2026-10-04 pass (valid, not yet done)

| ID | Item | Severity | Why it remains |
|----|------|----------|----------------|
| DATA-002 | ~~Records arriving through sync are not shape-checked; a damaged one shows the crash screen.~~ | Low | DONE 2026-10-16, released as REL-103 (see "Data check" above). |
| UX-002 | ~~Deleting a custom exercise checks workouts but not routines.~~ | Low | DONE 2026-10-05 (see above). |
| UX-003 | ~~"Best session volume" shows for assisted-bodyweight exercises.~~ | Low | DONE 2026-10-05 (see above). |
| UX-004 | The new and edit exercise form has no draft or discard prompt. | Low | Short form; ADR-001 leaves it out on purpose. |
| A11Y-002 | ~~`Segmented` radios have no arrow-key movement.~~ | Low | DONE 2026-10-05 (see above). |
| DX-002 | ~~No linter is configured (only strict `tsc`).~~ | Low | CANCELLED 2026-10-05: the owner chose to skip ESLint; strict `tsc` stays the only static check. |
| ENV-002 | GitHub moves the `ubuntu-latest` runner to Ubuntu 26 from 2026-10-19 (deploy annotation). | Low | DONE 2026-10-05 at the owner's request (1585231): both jobs in `.github/workflows/deploy.yml` pinned to `ubuntu-24.04`. Pages run 37298887657: build and deploy succeeded on image ubuntu-24.04 (20260927.320), 0 annotations (the migration warning is gone); live bundle unchanged. Revisit when GitHub retires the 24.04 image. |

## Traceability

| Requirement | Tasks | Evidence |
|-------------|-------|----------|
| REQ-Q01 | REL-001, REL-002, DATA-001, UX-001 | `TEST_STATUS.md` |
| REQ-Q02 | TEST-001 | `npm test` |
| REQ-Q03 | A11Y-001, QA-001 | contrast script, screenshots |
| REQ-Q04 | SEC-001 | preview build console |
| REQ-Q05 | DOC-001 | this folder |

## Setward 1.0 launch (session 2026-10-16, branch `launch`)

Plan: `C:\Users\ousse\.claude\plans\c-users-ousse-downloads-ultimate-projec-steady-bird.md` (owner-approved). Owner decisions: public web launch now with Play Store later; refine and boldly refresh the look together; all four settings groups plus language, accessibility and comfort; French, Arabic (right-to-left), Spanish, German and more; remove Hevy completely; welcome with starter programs, log a past workout, recent records, import from Strong. Merging to `main` deploys (NN-15): ask the owner first.

| ID | Milestone | Status |
|----|-----------|--------|
| LAUNCH-M1 | Retire Hevy; Strong import; Setward's own CSV | DONE (see below) |
| LAUNCH-M2 | i18n core, settings model, design tokens | DONE (see below) |
| LAUNCH-M3 | Visual refresh | DONE 2026-10-17 (owner approved the direction at checkpoint 1; see below) |
| LAUNCH-M4 | Settings home and sub-pages | DONE 2026-10-17 (see below) |
| LAUNCH-M5 | Welcome, starter programs, log a past workout, recent records | DONE 2026-10-17 (see below) |
| LAUNCH-M6 | Ten translations and Arabic right-to-left | DONE 2026-10-17 (see below) |
| LAUNCH-M7 | Link previews, privacy page, licence, README, store groundwork | DONE 2026-10-17 (see below) |
| LAUNCH-M8 | Verify, record, ask to release (REL-104) | DONE and RELEASED 2026-10-17 (`main` @ c3da695; see below and `RELEASE_CHECKLIST.md`) |

### LAUNCH-M1: Retire Hevy, add Strong import and Setward's own CSV
- **Done:** `hevy.ts` became the format-neutral `importer.ts` (`planImport`, `applyImport`, `readWorkoutCsv`; duplicates matched by start second and title). New `strong.ts` (Strong's CSV: W/D/F set orders, rest-timer rows skipped, units from a column, the header or the user's choice, semicolons and decimal commas, durations like "1h 3m", distance in meters) and `exportCsv.ts` (Setward's own CSV, units in column names, local dates; reads itself back). Settings: "Import workouts (CSV)" with a kg/lbs question when the file has no unit, and "Export workouts as CSV" in the new format. Hevy wording removed from the UI, source, README, CLAUDE.md/AGENTS.md and the notes (history entries kept as written). NN-06 retired, NN-14 generalised, REQ-009 and S-10 rewritten.
- **Evidence:** typecheck clean; 93 tests pass (2 skipped), including Strong fixtures (units, W/D/F, rest rows, semicolons), duplicate skipping and a Setward CSV round trip.
- **Limit:** Strong does not publish its export format; the parser follows user reports. Test against a real export before release.

### LAUNCH-M2: Foundations (i18n, settings model, rem and logical CSS)
- **Done:** `src/i18n/` (typed English catalog in `en/*.ts` is the source of truth; `t`, `tRich`, `count`, `listJoin`, plural forms by `Intl.PluralRules`; non-English catalogs load lazily and `LOADERS` is filled when they land in M6; `labelMap` keeps `MUSCLE_LABEL` and the other label maps reading like constants). Every screen, dialog, error and canvas string moved into the catalog except `Settings.tsx`, which M4 rebuilds. New `Settings` fields (language, time format, week start, 1RM formula, name, weekly goal, warm-up rest, auto rest, previous values, new-exercise sets, RPE, sound, volume, countdown, vibrate on check, black theme, accent, compact cards, text size, contrast, reduce motion, large controls, backup reminder) with defaults in `db.ts` and enums and ranges in `cleanSettings`. Device-only state in `kv` through `src/lib/prefs.ts`. `src/lib/context.ts` holds the settings plain functions need; `format.ts` is locale-aware (dates, times, numbers, week start); `e1rm` has Brzycki. `normalize()` and search now work for any script and match the English muscle and equipment words. CSS: font sizes in rem (computed sizes unchanged at the default), logical properties, right-to-left overrides, and `data-*` variants for text size, black theme, contrast, accent and motion (`src/lib/appearance.ts`). The app root is keyed by language and format settings, so a change redraws everything.
- **Evidence:** typecheck clean; 104 tests pass (2 skipped); `/chalk/` build (main chunk 163.56 kB gzip, up 8.7 kB for the English catalog). Browser on dev with the sample data: default computed sizes identical (body 15 px, title 40 px, tab 11 px); extra-large text, black theme, teal accent, high contrast and 12-hour time applied; no horizontal overflow on 10 routes at 320 px with extra-large text.
- **Decisions:** existing installs keep English (the `language` default is `en`); the welcome screen offers the phone's language to new ones. Arabic uses Western digits (`ar-u-nu-latn`). Strings are written once in English; the machine translations come in M6.

### LAUNCH-M3: Visual refresh ("Forward")
- **Checkpoint 1 done (2026-10-17):**
  - Tokens in `styles.css`: `--surface-hi`, `--lift`, `--elev-1/2` (layered surfaces), `--hero-grad` / `--accent-deep` (white text stays above 4.5:1 because the gradient only gets darker than `--accent`), `--glow`, `--wash`, `--slant` with `--slant-clip` / `--slant-end` (mirrored under `[dir='rtl']`), `--radius-lg`, and the motion tokens `--ease-out`, `--dur-fast`, `--dur`, `--dur-slow`. Reduced motion (system or setting) still turns every animation and transition off.
  - Shared components: `.card` layered, `.btn-glow` (the only glowing button; Start workout and Finish), segmented control and toggle with a lift and a springier thumb, sheet grab handle (phones only), slanted glowing pill behind the active tab, stat numbers in Big Shoulders (`.stat-value`, 2.25 rem in `.stat-grid`), sentence-case labels instead of all-caps eyebrows, an empty state with the faded brand mark (`BrandMark` in `Brand.tsx`).
  - Home: `WeekCard` (`src/components/WeekCard.tsx`): greeting from `profileName` by time of day, this week's workouts against `weeklyGoal` with a slanted bar (`SlantBar`, also exported), seven day dots from the first day of the week, the week streak as a slanted chip. With no goal it links to Settings. The install banner moved below it.
  - Live workout: the header shows `done of total sets` with a slanted progress bar; the clock is larger; Finish glows; a checked set pops (only the set just checked) and vibrates for 12 ms when `vibrateOnCheck` is on (Android only; no-op elsewhere).
  - `scripts/contrast.mjs`: reads the tokens from `styles.css` with the browser's cascade and checks 708 text (4.5:1) and indicator (3:1) pairs across dark, pure black and light, normal and high contrast, and all four accents. It found F/D badge text at 3.8–4.4:1 (new `--fail-ink` / `--drop-ink`) and the dark high-contrast `--line` at 2.4:1 (now #75738c). **0 failing.** The indigo, teal and pink accent tokens are no longer provisional.
- **Evidence:** typecheck clean; 104 tests pass (2 skipped); `/chalk/` build, main chunk 164.55 kB gzip (was 163.56); dev server with the sample data at 375 px, dark and light: Home, live workout and the rest bar; no horizontal overflow on 7 routes at 320 px.
- **Checkpoint 2 done (2026-10-17), after the owner approved the direction:**
  - Celebration (`src/components/Celebration.tsx`, used by `WorkoutDetail` when `?saved=1`): the hero gradient with glow, a sheen that crosses once, the record count in 6.5 rem Big Shoulders counting up from 0 (jumps straight to the number when motion is off), a burst of fourteen slanted shards (only when there are records), "Logged" in big type when there are none. Screen readers get the final text once through a visually hidden status line, not the counting digits. Replaced the old `.saved-banner`.
  - History and workout detail: card titles in the display face, the two headline numbers of a session in Big Shoulders, the record pill and tags in the slanted chip shape, a slanted accent tick opening every section and month heading.
  - Exercises: records as two-across number tiles (value in Big Shoulders 1.75 rem), the use count in the display face, press states, a lifted demo photo.
  - Progress: the calendar is a heat map (levels 1 to 4 are the quartiles of sets done on the busy days; the top level glows) with a Less/More legend and sets in each day's tooltip; bar charts fade from the chart colour (1 to 0.5), line charts fade the area (0.38 to 0), horizontal bars run left to right in a gradient with a slanted end (mirrored in RTL). Gradient ids come from `useId`.
  - Body weight: the latest weight at 3 rem, list values in the display face.
  - Share card (`shareCard.ts`): a violet glow from the top corner, the mark very faint bottom right, the records banner as the slanted gradient with the count at 124 px, sentence-case stat labels, a slanted accent rule.
  - Large text on 320 px phones: the live set table's badge and check columns are variables (`--badge-w`, `--check-w`) and shrink with the fields, so Previous stays readable at 125 % text instead of squeezing to nothing.
- **Evidence:** typecheck clean; 104 tests pass (2 skipped); contrast script 732 pairs, 0 failing; `/chalk/` build main chunk 165.73 kB gzip (was 163.56 at the start of M3); overflow sweep (page width and every element's right edge) over 13 routes including a live workout with checked sets and the saved celebration, at 375, 320, 360 and a 1280 emulation, in dark, light, pure black, high contrast, large and extra-large text and three accents: no overflow; production preview with sample data restored: 0 CSP violations, service worker in control, gradients applied.
- **Left for later, on purpose:** toasts with an Undo action (no screen needs one yet; add it with the first feature that does), compact routine cards (`compactRoutines`, wired in M4), the Settings home (first screen of M4). Heat-map level 1 against an empty square is about 2:1, so the "trained or not" signal leans on hue and on the tooltip and the summary label; this is a limit of any intensity scale.

### LAUNCH-M4: Settings experience
- **Done (2026-10-17):**
  - `#/settings` is a grouped list (icon, label, one-line current value, chevron); each row opens `#/settings/<id>`: `workout`, `timer`, `plates`, `goals`, `units`, `appearance`, `access`, `language`, `sync`, `data`, `about`. Code in `src/pages/settings/` (`Home.tsx`, `Section.tsx` as the router, `sections.tsx`, `DataSection.tsx`, `AboutSection.tsx`, `controls.tsx`); `src/pages/Settings.tsx` only picks home or section. The whole Settings tree is a lazy chunk (10.3 kB gzip, precached), so the main chunk stays at 164.82 kB. Every string is in the catalog (`src/i18n/en/settingsPages.ts`); `RadioGroup` in `ui.tsx` is the shared arrow-key radio pattern (sounds, accents, languages).
  - Wired, with tests where logic is pure: warm-up rest (own time or Off, `restAfter` in `WorkoutEditor`), start rest automatically, previous values "Same routine first" (`src/lib/previous.ts`, `previous.test.ts`; `usePreviousSets` and new-exercise blocks use it, routine id passed from live, edit and routine editors), sets for a new exercise, show RPE (badge and set sheet; history still shows RPE already logged), four rest sounds and three volumes (`src/lib/sounds.ts`, used by the in-app beep and by the lock-screen track), 3-2-1 countdown ticks (`tick()`), vibrate on set check, compact routine cards, larger workout controls (CSS on `data-controls`), backup reminder (`backupDue` in `src/lib/backupReminder.ts`, `BackupReminder` card on Home, snooze 3 days), last backup date (`saveBackupFile` in `lib/backup.ts`; `saveFile` now returns false when the share sheet is dismissed), reset settings (writes `{}` to the settings record; data and the sync connection are kept).
  - About: version, privacy, help and FAQ, credits and licences, source code, feedback (the repo's issues), share. What's new and the standalone privacy page come in M7.
  - Fixes found by the sweep: the Segmented control wraps long labels instead of overflowing at extra-large text; the week card's children can shrink; at 320 px with large or extra-large text the live set table's badge and check columns shrink (`--badge-w`, `--check-w`) and, only with larger controls on top, the Previous column is hidden (the grey placeholders still show last time).
- **Evidence:** typecheck clean; 113 tests pass (2 skipped; new: previous, backupReminder, sounds); contrast 0 of 732 failing; `/chalk/` build main chunk 164.82 kB gzip, Settings chunk 10.29 kB; overflow sweep over 22 routes (all 11 settings pages, Home, live workout, History, the celebration, exercises, Progress, body weight, routine editors) at 375 and 320 px in dark, light + high contrast + extra-large + larger controls + teal, and black + large + pink: no overflow after the two fixes above; browser checks: warm-up rest 30 s and working rest 90 s, auto-rest off starts nothing, warm-up rest Off starts nothing, a 5 s rest with the countdown plays 3 ticks and the 3 end tones, reminder card shows when a backup is 10 days old and Later hides it for 3 days, Back up now stamps the date, Reset settings returns to defaults and keeps data; production preview: all pages render, 0 CSP violations, service worker in control, the lazy chunk is in the cache.
- **Limits:** the Language page lists all 11 languages, but only English exists until M6, so choosing another one shows English with `lang` and `dir` set for it (Arabic would flip the layout). Nothing ships before M6. Rest sounds were checked by counting oscillators, not by ear. Not run: phone, screen reader, reduced motion.

### LAUNCH-M5: Welcome, starter programs, past workouts, recent records
- **Done (2026-10-17):**
  - **Welcome** (`#/welcome`, `src/pages/Welcome.tsx`): one scrolling page, not four steps: language and units (pre-set from the phone: a new install gets `language: 'auto'`, and pounds and miles for US, LR and MM, miles for GB; only what was never chosen is written), then four ways to start (starter program, scratch, import from Strong, restore a backup; the last two open Settings → Your data), an install card (with the iPhone warning that Safari can erase the data of sites that aren't on the home screen) when installing is on offer, and Skip. Everything is optional. Home sends a visitor there only when `shouldWelcome` is true: no workouts, no routines, no running workout and `welcomeSeen` unset (`src/lib/welcome.ts`); any way out sets `welcomeSeen`. The tab bar is hidden on it.
  - **Starter programs** (`src/data/programs.ts`, `src/lib/programs.ts`, `src/pages/Programs.tsx`, route `#/programs`): Full body (3 sessions), Upper / Lower (4), Push / Pull / Legs (3), Body-part split (5), Machines and cables (3, for beginners), Dumbbells at home (3). Each session becomes a routine in a folder named after the program (`saveRoutine`), with sets and rep targets (none for timed or max-rep work). Titles are catalog keys, so they follow the language; exercise names stay English library data. A preview sheet lists every exercise before adding; adding twice asks first. Reachable from Home (empty state and a button under the routines) and the welcome page. A test checks that every exercise id exists in `exercises.json`.
  - **Log a past workout** (`#/history/new`): the past-workout editor with a blank workout and its own draft slot (`workout:new`, so leaving and returning keeps it); the date can't be in the future; saving needs at least one set with numbers; it ends on the saved celebration. Entry points: a + in the History header and the History empty state.
  - **Recent records** on Progress (`src/lib/records.ts`): the latest six exercise-sessions that set records, each with its headline record (heaviest weight, then estimated 1RM, volume, reps, time, distance) and a "+N more" count, linking to the workout. Record formatting moved to `src/lib/recordFormat.ts`, shared with the exercise page.
  - The Welcome, Programs and Settings pages are lazy chunks (1.2, 2.0 and 10.2 kB gzip).
  - Fixes found by the sweep: `.setting` rows wrap at the largest text on 320 px, so the welcome's language and unit rows no longer push the page 7 px sideways.
- **Evidence:** typecheck clean; 125 tests pass (2 skipped; new: welcome gate and unit suggestion, program ids and routines, recent records); contrast 0 of 732 failing; `/chalk/` build main chunk 166.85 kB gzip; overflow sweep over 14 routes (welcome, programs, past-workout editor, Progress and the rest) at 375 and 320 px in dark, light + high contrast + extra-large + larger controls, and black + large + pink: no overflow after the one fix; production preview with storage wiped: a new install lands on `#/welcome`, language set to auto and units to lbs and mi (the pane is en-US), picking a starter program and adding Push / Pull / Legs shows the folder with three routines on Home, reload stays on Home; a second wipe and Skip lands on an empty Home with "Browse starter programs", reload stays on Home; 0 CSP violations; dev server: adding a program, the past-workout draft restore, an empty save refused, a real save to the celebration.
- **Limits:** units follow the first language tag that names a region, so a phone set to plain "en" gets kilograms. The Strong import and restore from the welcome page go through Settings → Your data rather than their own file pickers. Not run: phone, screen reader.

### LAUNCH-M6: Ten translations and Arabic right-to-left
- **Done (2026-10-17):**
  - **Translations:** French, Arabic, Spanish, German, Brazilian Portuguese, Italian, Turkish, Dutch, Polish and Indonesian, every key of the English catalog (about 910). Each language is `src/i18n/<code>/{base,screens,settings}.ts` merged by `src/i18n/<code>.ts` into a `Catalog`, so TypeScript fails on a missing key; `LOADERS` in `index.ts` lazy-loads each chunk and the service worker precaches them. All are machine translations, as the Language page says ("Translations other than English were made by machine…", with a link to report wording). Indonesian has only the `other` plural form, so its counts are plain strings. Glossary kept per language (set, rep, routine, rest, warm-up, plate, bar, record) so the same word is used everywhere; exercise names and instructions stay English library data.
  - **`i18n.test.ts`** (now 38 tests): every non-English locale has a loader; for each of the ten, every key and no extras, the same `{placeholders}` and `<tags>`, plain-text messages stay strings, and every plural form `Intl.PluralRules` can return for 0 to 1000 exists (Arabic six, Polish four, the rest two, Indonesian one). Also covers `isolate()` / `plain()`.
  - **Arabic right-to-left:** `html[lang='ar']` sets `dir="rtl"`; logical CSS and the mirrored `--slant-clip` flip the layout, `.flip-rtl` flips arrows and chevrons, toggles and growing bars were already mirrored in M2. Charts, the calendar's grid and month labels stay left to right (tooltips read right to left). Digits stay Western (`ar-u-nu-latn`). Letter-spacing is forced to 0 (it breaks Arabic joining), line heights are looser for Arabic display titles so dots are not clipped, and the font is Noto Sans Arabic Variable (`@fontsource-variable/noto-sans-arabic`, OFL) behind an Arabic-only `unicode-range`, so no other language downloads it; it is left out of the precache and cached on first use (`arabic-font` runtime cache, CacheFirst). The About page credits it.
  - **Mixed text:** `isolate()` (`src/lib/format.ts`) wraps number-and-unit strings in LRI/PDI marks only when the language is right to left ("66 kg × 15", "−15", "549.7 lbs", "−0.7 lbs"), `plain()` strips them for the share-card canvas. Used by `fmtWeight`, `fmtVolume`, `fmtDistance`, `fmtSet`, `recordFormat`, body weight and plate calculator strings, chart tooltip formats and the rest bar's ±15.
  - **Fixes found while checking languages:** the Progress weekly chart's date labels thin out when a language's month names are long; the body-weight chart no longer hard-codes `en-GB` month names; German "Skip" is "Weiter" (the rest bar had no room for "Überspringen"); the set table's reps header is a new short key `head.reps` ("Wdh.", "rép.", "rip.", "herh.", "powt."…) and the narrow-phone Previous header (`editor.last`) is a 4 to 6 letter word per language; Arabic's Set header is "رقم". Layout: `.btn-block` wraps long labels; `.pr-pill` wraps inside its row; `.field` and `.form` grid tracks can shrink below a select's widest option; `.section-head`, `.resume-card`, `.chart-head`, `.sync-head` and `.form-actions` wrap; the rest bar tightens under 340 px.
- **Share card:** in Arabic each canvas line takes the direction of its own script (`ctx.fillText` is wrapped when `isRtl()`), so "1 س 23 د" reads correctly while exercise names and "121.3 lbs × 10" stay left to right; the layout is not mirrored; the Arabic face is loaded for the canvas before drawing.
- **Evidence:** typecheck clean; 158 tests pass (2 skipped); contrast 0 of 732 failing; `/chalk/` build main chunk 167.24 kB gzip, language chunks 13.9 to 16.9 kB gzip each, Arabic font not precached; overflow sweeps over 27 routes in all ten languages at 320 px (default text) and 375 px, and German, French, Dutch, Polish, Turkish and Arabic at 320 px with extra-large text and larger controls: no overflow; production preview with a language switch through all eleven: 0 CSP violations. Details: `TEST_STATUS.md` (LAUNCH-M6).
- **Limits:** machine translation only: no native speaker has read any language, Arabic least of all. German, French and Arabic were read for gender and agreement in the strings with names or counts in them (the data check, records, week card), the rest were not. A few translated words are shorter than natural to fit 320 px (German "Weiter" for the rest skip, the abbreviated reps and previous headers). Not run: phone, screen reader, a real offline start in a non-English language, the earlier milestones' sweeps re-measured against `clientWidth` (do this in M8).

### LAUNCH-M7: Public and store readiness
- **Done (2026-10-17):**
  - **Link previews:** Open Graph and Twitter tags in `index.html` (`summary_large_image`, title, description, canonical, image with width, height and alt). `__SITE_URL__` is filled in by a small Vite plugin from `SITE_URL` (default `https://botrading20-glitch.github.io/chalk/`) because previews need absolute URLs. `public/og-image.jpg` is 1200 × 630, drawn in the dev browser with Big Shoulders and Archivo and a week card in the app's style (a local receiver script saved the canvas output). It is a JPEG (69 kB) rather than the planned PNG (628 kB): WhatsApp-style previews drop images over about 300 kB.
  - **Manifest:** `categories` (health, fitness, sports), `shortcuts` (Start workout `#/?action=start`, Log body weight `#/?action=weigh`) and `screenshots` (four narrow, one wide, in `public/store/`). `start_url`, `scope` and the missing `id` are unchanged (NN-12). The screenshots and og image are excluded from the precache (`globIgnores`), and `navigateFallbackDenylist` keeps the offline shell from answering for `privacy.html`.
  - **Shortcuts:** `src/lib/launch.ts` (`useLaunchAction`): `start` begins an empty workout (or returns to the running one) and opens it; `weigh` opens the body-weight screen with its sheet; anything else drops the query. `WorkoutHome` skips the welcome redirect while an `action` is pending, so a shortcut on a new install still works.
  - **Privacy, licence, README:** `public/privacy.html` (static, light and dark, English only, same text as About → Privacy in more detail, dated), linked from About, the wide panel and the README; `LICENSE` (MIT, "The Setward authors"); the README rewritten for users (what it does, screenshots, languages, privacy, install, licences) with the developer section kept under "For developers".
  - **Wide screens:** `WidePanel` (`src/components/WidePanel.tsx`): from 1240 px up, a card beside the phone-width column with the mark, name, tagline, three points, the "best on your phone" hint and the privacy link; it sits on the inline-start side, so it mirrors in Arabic. Below 1240 px nothing changes.
  - **Version 1.0.0 and What's new:** `package.json` and the lockfile root are 1.0.0 (`__APP_VERSION__` shows it in About). `src/lib/whatsNew.ts`: `WHATS_NEW` lists catalog keys per version; `whatsNewAction` decides `show` (an update with news, including a device with data and no recorded version), `remember` (a new empty install, or a version with nothing to say: the version is recorded silently) or `none`; `lastSeenVersion` is the existing pref. `WhatsNewSheet` shows once, never over the welcome screen or a running workout; About has a "What's new" entry with the same list. Twenty new catalog keys (`new.*`, `panel.*`, `about.whatsNew`, `about.privacyPage`) in all eleven languages.
  - **Store groundwork (nothing submitted):** `.ai/PLAY_STORE.md` (Trusted Web Activity route; Digital Asset Links need a file at the origin root, which the `/chalk/` project site cannot serve, but a free user-site repository named `botrading20-glitch.github.io` can; the US$25 fee, the closed-test rule, package name, data-safety and content-rating answers as owner decisions, each outside fact marked *check*); `branding/store/feature-graphic.png` (1024 × 500) and `branding/store/listing.md` (name, 80-character and full descriptions, what's new).
- **Evidence:** typecheck clean; 163 tests pass (2 skipped; new: `whatsNew.test.ts`, and the i18n tests now cover the 20 new keys in ten languages); contrast 0 of 732 failing; `/chalk/` build main chunk 168.55 kB gzip (167.24 at M6), 37 precache entries; production preview on :4173: new bundle and og tags served, the service worker answers `privacy.html` with the privacy page, a new empty install records `lastSeenVersion` silently, `#/?action=start` on an empty install starts a workout and opens it, `#/?action=weigh` opens the weigh-in sheet, no console errors; dev: the What's new sheet shows once for an existing install and not again, About lists What's new and the privacy link, and at 1280 px the panel sits beside the column (inline-start, mirrored in Arabic).
- **Limits:** the Play phone screenshots are not ready (2.2:1, Play allows 2:1; retake on a phone). The privacy page is English only. The og image and screenshots were not checked in a real link-preview tool (Facebook debugger, WhatsApp) because that needs the deployed URL. The shortcuts were exercised by URL, not from a launcher long-press. `LICENSE` has no personal name (owner decision). Not run: phone, screen reader.

### LAUNCH-M8: Verify, record, ask to release
- **Done (2026-10-17):** the full verification of the plan (automated checks; smoke tests S-01 to S-16 on dev and on the `/chalk/` preview; first run on empty storage; backup, erase, restore; Strong and Setward CSV; data check and the crash screen on the production build; offline reload in French; every route in all ten languages and in English across four setting combinations at 320, 360, 375 and 412 px, measured against `clientWidth`; keyboard and reduced-motion checks; bundle; secret scan). Its sweeps found and fixed the last layout problems, all in the live workout's set table at large text:
  - at large text on phones under 380 px the Previous column header takes its short title and its values wrap onto two lines (they ended in "35 ×…");
  - at the largest text the column is under 50 px up to 460 px wide, so there it takes the short title too, and it is hidden under 390 px (and, with larger controls, under 460 px); the grey placeholders in the boxes still show last time.
- **Also recorded:** `REQUIREMENTS.md` REQ-019 to REQ-023; `NON_NEGOTIABLES.md` NN-17 and NN-18; `RELEASE_CHECKLIST.md` REL-104 with the after-deploy checks; the "sweeps must use `clientWidth`" lesson in `CURRENT_TASK.md`.
- **Release:** the owner approved; `launch` was merged into `main` as c3da695 and pushed, Pages run 39056196923 succeeded and the live page was checked (`TEST_STATUS.md`). Rollback: `git revert -m 1 c3da695` and push.
- **Limits:** see REL-104. Not run: a real phone, an iPhone, a screen reader, a native speaker for any translation, real link previews, launcher shortcuts.

## Training tools (session 2026-10-17, branch `training-tools`)

Plan: `~/.claude/plans/c-users-ousse-downloads-fitness-app-imp-iridescent-hickey.md` (owner-approved). Inspiration: Hevy's settings screens (screenshots) and `FITNESS_APP_IMPLEMENTATION_SPEC_HARDENED.md`; choices in `DECISIONS.md`. Merging to `main` deploys (NN-15): ask the owner first.

| ID | Item | Status |
|----|------|--------|
| FEAT-007 | Contact page (feature request, bug report, help) | Deferred by the owner until Google sign-in (FEAT-001) exists |

### TT-M1: Foundations and spec hardening
- **Done (2026-10-17):**
  - **Settings model:** `Settings` gains `warmupSteps`, `warmupEmptyBar`, `warmupRoundKg`, `warmupRoundLbs`, `liveRecords`, `inlineStopwatch`, `supersetScroll`, `plateShortcut`, `setVideos`, `monthlyReport` (`src/types.ts`, `DEFAULT_SETTINGS` in `src/db.ts`). `cleanSettings` checks the steps as a whole list (`cleanWarmupSteps`: 1 to 6 steps, whole percent 5 to 95, whole reps 1 to 30) and the rounding steps as fractions in a range, so a zero or a typo can't reach the calculator.
  - **SEC-002:** `escapeCell` / `unescapeCell` in `src/lib/csv.ts`; `toCsv` escapes text cells, `parseSetwardCsv` reads them back (title, notes, exercise, exercise notes).
  - **DATA-003:** `KG_PER_LB = 0.45359237` in `src/lib/format.ts` replaces the 8-digit factor in `kgTo`/`toKg` and in the Strong importer.
  - **UX-005:** the RPE chips now run 6, 6.5 ... 10 and a one-line guide sits under them (`editor.rpeGuide`).
  - **i18n:** new catalog part `src/i18n/<code>/training.ts` for all eleven languages, merged in each `<code>.ts`; every training key is added to all eleven in the same change (NN-17).
- **Evidence:** typecheck clean; 166 tests pass (2 skipped; new: CSV escaping round trip, exact pound, settings checks).
- **Limits:** none known. The new settings have no screen yet (they arrive with the features that use them).

### TT-M2: Warm-ups and workout toggles (FEAT-008, FEAT-009)
- **Done (2026-10-17):**
  - **Warm-up calculator** (`src/lib/warmup.ts`, pure): from a working weight, the steps in settings (default 50% x 10, 70% x 5, 85% x 3) and an optional empty-bar set. Barbell, EZ bar and Smith machine loads go through `calculatePlates`, so every load is one the owner's plates can make (nearest, halfway goes lower, never under the bar); other equipment rounds to a step (2.5 kg / 5 lb by default). Steps at or above the working weight, below the bar, or repeating the previous load are dropped; a missing or too-light weight returns a reason instead of sets. `barInUnit` moved to `src/lib/plates.ts` so the plate sheet and the calculator snap the remembered bar the same way.
  - **Insert from the exercise menu** ("Warm-up sets", weight and reps exercises only): the working weight is the first work set's weight, else last session's; existing warm-ups are replaced only after a confirmation; new W sets go first, unchecked. Works in live, edit and routine modes.
  - **Settings:** new page `#/settings/warmup` (steps with share and reps, add up to six, back to defaults, empty bar, rounding step per unit, a preview for a barbell and a machine) and a row on Settings home. The Workout page gets four toggles: live record alerts, stopwatch button on timed sets, scroll to the next exercise in a superset, plate button on barbell exercises.
  - **Live records** (`liveRecordSets` / `newLiveRecords` in `src/lib/records.ts`): the same rules as `computeRecords` (NN-09), so the trophies add up to the saved total; a toast names the headline record ("New record! Seated Dip (Machine): Heaviest weight 83 kg") and a trophy sits on the set badge while the set holds the record. Off while editing a saved workout.
  - **Plate button** in the header of barbell, EZ bar and Smith exercises; **superset scroll** brings the next exercise with sets left into view (instant under reduced motion, `src/lib/motion.ts`); the stopwatch button hides when its toggle is off.
- **Evidence:** typecheck clean; 185 tests pass (2 skipped; new: `warmup.test.ts` 14, live records 5); contrast 0 of 732 failing; production build main chunk 170.86 kB gzip. Browser (dev, sample data): warm-ups inserted for a 100 kg barbell (20 x 10, 50 x 10, 70 x 5, 85 x 3), toast and trophy on a record set, superset scroll 0 to 500 px, the new pages at 320 px in dark and light, German and Arabic (right to left) with no overflow against `clientWidth`.
- **Limits:** nothing run on a phone. The default steps and the 10-rep empty bar are provisional product choices (editable), not training guidance.

### TT-M3: Muscle map (FEAT-010)
- **Done (2026-10-17):**
  - **Counting** (`src/lib/muscles.ts`, pure): `muscleSets` counts a whole set for the primary muscle and half a set for each secondary one (a muscle listed twice counts once); warm-ups never count; `completedOnly` for the live workout. `mergeMuscleSets`, `rankedMuscles` and `muscleLevel` (shade 0 to 4 by share of the most worked muscle) support the views.
  - **Figure** (`src/components/MuscleMap.tsx`): an original front and back figure in SVG (NN-14), straight-edged panels in the Forward look, the left half drawn once and mirrored. One panel set per muscle (neck, traps, shoulders, chest, biceps, triceps, forearms, abdominals, upper back, lats, lower back, glutes, abductors, adductors, quads, hamstrings, calves); cardio, full body and other have no panel and show only in the table. Shading uses `--viz` in four steps; the figure and its labels stay left to right in Arabic. `role="img"` with a spoken summary, and a Muscle / Sets table (ranked, half sets as 0.5) is the non-colour alternative.
  - **Where:** a small figure button at the end of the live workout's numbers opens a "Muscles" sheet (completed sets so far); a "Muscles worked" card on the workout detail page; the 30-day muscles card on Progress shows the figure above its bars (the bars still count primary-muscle sets only).
- **Checkpoint:** dark and light 375 px screenshots of the live workout sheet were sent to the owner.
- **Evidence:** typecheck clean; 191 tests pass (2 skipped; new: `muscles.test.ts` 6); browser: sheet, detail page and Progress at 320 px in dark and light with no overflow against `clientWidth`.
- **Limits:** the panels are a stylised figure, not anatomy; no panel for the neck on its own beyond a small one, and abductors and adductors are thin strips. Arabic and German were checked for overflow only on the pages built earlier; the all-routes sweep is in M7.
