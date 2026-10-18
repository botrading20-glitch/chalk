# Test status

## Training tools, Setward 1.1: evidence ledgers and full verification, 2026-10-18, branch `training-tools`

Environment: Windows 11, the built-in Chromium of the Claude app. Dev server on :5173 with the sample backup (65 workouts, 6 routines) and the production preview on :4173/chalk/ for the CSP check; phone emulation at 320, 360 and 375 px. A video cannot be picked in this browser, so clips were made in the page (`canvas.captureStream` and `MediaRecorder`) and attached through `attachVideo`. Not run: a phone, an iPhone, a screen reader, native speakers.

### Full verification (TT-M7)

| Check | Result | Evidence |
|-------|--------|----------|
| Types / tests / contrast / lockfile / secrets | PASS | `tsc` exit 0; 214 passed, 2 skipped (163 at 1.0: +51); 732 pairs, 0 failing (no token was added); `npm ci --dry-run` exit 0; 257 tracked files, the only pattern hit is the `github_pat_…` input placeholder |
| Production build | PASS | `/chalk/`: index chunk 112.6 kB gzip, Settings 12.7, Report 1.7; 39 precache entries, 2.22 MB (37 and 2.07 MB at 1.0); `dist/sw.js` present |
| Overflow, every route in every language | PASS after one fix | 35 routes (Home, live workout, history, new past workout, workout page and its editor, exercises, new / detail / edit exercise, new and existing routine, programs, welcome, Progress, body weight, the monthly report for two months, Settings home and all 15 pages, an unknown address) by 11 languages = 385 loads at 320 px, dark, default text, against `clientWidth` and every element's rectangle. One finding: on the French Home the backup card's two buttons did not wrap and made the page 327 px wide; `.backup-actions` now wraps (re-checked clean). 0 window errors during the run |
| What's new | PASS | with `lastSeenVersion` set back to 1.0.0 the sheet opens on Home with six entries and the 1.1.0 title in all eleven languages, no overflow at 320 px; Done records the version |
| Upgrade | PASS | the dev origin held 1.0 data (the sample backup): it opened at Dexie version 3 with the new `media` table and its existing workouts and routines, and the sweep and the video checks ran on that data |
| Rollback of the schema | PASS (simulated) | older code declaring version 2 opens a database already at version 3 and reads its data (Dexie 4.4, `fake-indexeddb`); the `media` table is then ignored. Not tried in a real browser |
| CSP / console | PASS | a blob video loads in the `/chalk/` build under `media-src 'self' blob:` with no violation; no console errors in the dev runs |
| New screens at other widths | PARTIAL | by eye at 360 and 375 px in English, German and Arabic; not at extra-large text or larger controls (done for 1.0 in LAUNCH-M8) |
| Phone / iPhone / screen reader / native speakers / real share sheet / camera capture | NOT_RUN | listed in `RELEASE_CHECKLIST.md` REL-105 |

### Evidence ledgers, one per milestone (HARD-21 shape, condensed)

| Slice and IDs | Revision | Files and contracts changed | Tests and browser evidence | Not verified |
|---------------|----------|-----------------------------|----------------------------|--------------|
| **TT-M1** foundations: SEC-002, DATA-003, UX-005 (REQ-030) | c6e8ba3, e55f6ce | `Settings` and `DEFAULT_SETTINGS` gain ten fields, `cleanSettings` checks the warm-up steps and rounding; `csv.ts` `escapeCell` / `unescapeCell`; `KG_PER_LB`; RPE chips by halves; catalog part `training.ts` in 11 languages | typecheck; 166 tests (CSV round trip with `=SUM(A1)` and `-5 kg drop`, 100 lb = 45.359237 kg, settings checks) | a spreadsheet opening the CSV |
| **TT-M2** warm-ups and live tools: FEAT-008, FEAT-009 (REQ-024, REQ-025) | 2c85ed2 | `warmup.ts`, `liveRecordSets` / `newLiveRecords`, `WarmupSection`, four Workout toggles, plate button, superset scroll, stopwatch toggle | 185 tests (`warmup.test.ts` 14, live records 5); browser: 100 kg barbell gives 20x10, 50x10, 70x5, 85x3, toast and trophy on a record set, superset scroll, pages at 320 px in dark, light, German and Arabic | the default steps as training advice; touch use on a phone |
| **TT-M3** muscle map: FEAT-010 (REQ-026) | ecfa27e | `muscles.ts`, `MuscleMap.tsx`, the live sheet, the workout page, Progress | 191 tests (`muscles.test.ts` 6); browser: sheet, page and Progress at 320 px dark and light; dark and light screenshots sent to the owner | the owner's view of the figure (no reply) |
| **TT-M4** monthly report, weekly chart: FEAT-011 (REQ-027) | b34fb99, daa4c63 | `report.ts`, `Report.tsx` (lazy), `ReportCard`, `reportSeenMonth` pref, Goals toggle, Reps and 3 / 6 / 12 months on the chart, `RecordList` extracted | 199 tests (`report.test.ts` 8); browser: the report in English, German and Arabic, Progress with 52 bars, Home's card with a faked date, "See report" and the pref | the comparison rule mid-month (open question); a real month change |
| **TT-M5** help: FEAT-012 (REQ-028) | 71cb1d0 | `HelpSections.tsx`, Help group on Settings home, FAQ moved out of About, `about.help` removed, 28 strings | 199 tests (`i18n.test.ts` covers the keys); browser: three pages and the two buttons at 320 px in all languages | a native speaker reading the guides |
| **TT-M6** set videos: FEAT-013 (REQ-029, NN-19) | e1dafee | `db.version(3)` `media`; `media.ts`; `SetVideo.tsx`; lifecycle in `workouts.ts`, `EditWorkout.tsx`, `WorkoutDetail.tsx`, `backup.ts`; `VideosCard`; `setVideos` toggle; privacy text, `privacy.html`, `PLAY_STORE.md`; 37 strings | 214 tests (`media.test.ts` 15: attach, replace, refuse, space, remove, orphans, finish, discard, edit-discard, erase); browser: every path in `RELEASE_CHECKLIST.md` REL-105; CSP in the production build | camera capture, real playback, the share sheet, the free-space check, iPhone |
| **TT-M7** release prep | this commit | version 1.1.0, `WHATS_NEW` 1.1.0 (12 strings in 11 languages), `.backup-actions` wrap, notes | the table above | merging and deploying |

Shared by every ledger:
- **Existing behavior preserved:** nothing existing was removed except the FAQ's place in About (now a Settings page). 1.0 backups restore; the sync format, the `chalk` database name, `/chalk/` scope and backup `app: 'chalk'` are untouched; routines, settings and the workout in progress keep working across the schema upgrade.
- **Data migration and rollback:** one append-only Dexie version (3, NN-10) and new settings fields with defaults. Rolling the code back leaves the `media` table in place and unused (see Upgrade and Rollback above); videos are not in backups or sync, so a rollback loses nothing else.
- **Real-device validation scope:** none. Every check was in the Claude app's Chromium.
- **Known failures:** none open. Introduced and fixed: the French Home backup card overflow (M7). Pre-existing and untouched: UX-004, no screen-reader pass, machine translations.
- **Release status:** READY WITH DOCUMENTED LIMITATIONS, not merged (REL-105). No feature flag; each tool has its own setting (the video, record-alert and report settings default on).
- **Exact next action:** the owner decides on the merge (and the open month-comparison question), then phone checks.

## Live check after the 1.0 release (REL-104): 2026-10-17, `main` @ c3da695

Environment: the built-in browser on https://botrading20-glitch.github.io/chalk/ (a fresh origin, so a new install), phone emulation 375 px. Pages run 39056196923: build and deploy jobs succeeded.

| Check | Result | Evidence |
|-------|--------|----------|
| Served build | PASS | `index-DXCdjz-F.js`, identical to the verified local build; service worker activated and in control |
| Link previews | PASS | `og:image` and `twitter:image` are `https://botrading20-glitch.github.io/chalk/og-image.jpg` (200, image/jpeg, 69 kB); canonical and `og:url` the live address; `twitter:card` summary_large_image |
| Manifest | PASS | `start_url` and `scope` `/chalk/`; shortcuts `/chalk/#/?action=start` and `#/?action=weigh`; 5 screenshots (the home one answers 200); categories health, fitness, sports |
| Privacy page | PASS | `/chalk/privacy.html` opens as the privacy page with the service worker in control (not the app shell) |
| First run, shortcut, languages | PASS | a new install lands on the welcome page; Push / Pull / Legs adds 3 routines; `#/?action=weigh` opens "Log body weight"; French, Arabic and English set `lang` and `dir` (fr/ltr, ar/rtl, en/ltr) |
| CSP / console | PASS | 0 violations, no console errors |
| Not run | NOT_RUN | the owner's installed copy updating, a phone, real link previews in Facebook's debugger or WhatsApp |

The pane's test data on the live origin (a starter program) was deleted afterwards; nothing of the owner's was touched.

## Full verification for 1.0 (LAUNCH-M8): 2026-10-17, branch `launch` after M7, with the M8 fixes

Environment: Windows 11, built-in Chromium; dev server on :5173 with the sample backup (65 workouts, 6 routines) and the production preview on :4173/chalk/ (empty storage); phone emulation 320, 360, 375 and 412 px.

| Check | Result | Evidence |
|-------|--------|----------|
| Types / tests / contrast / lockfile / secrets | PASS | `tsc` exit 0; 163 passed, 2 skipped; 732 pairs, 0 failing; `npm ci --dry-run` exit 0; no key patterns in the 223 tracked files; tree clean |
| Production build | PASS | main chunk 168.55 kB gzip (153.77 at the 2026-10 baseline); CSS 12.40; Settings 10.25, Welcome 1.18, Programs 2.01; languages 14.39 (id) to 17.46 (ar) kB, all lazy; 37 precache entries, 2.07 MB |
| S-01 existing user | PASS | no welcome screen, no What's new (already seen), counts intact: 65 / 6 / 1,004 / 16 |
| S-02 to S-06 live workout | PASS | four tabs and back; routine started; two sets checked, rest bar, +15 / −15 (90, 105, 89), Skip; a typed 77.5 and 2 checked sets survive a reload; Finish, Save, celebration "Workout 66 saved, 2 new records"; Save as routine, then start it with pre-filled sets; edit the title and save ("Workout updated"); delete (data restored to 65 / 6) |
| S-07 / S-08 offline and sub-path | PASS | preview at `/chalk/`; server stopped, page reloaded from the service worker in French with data intact |
| S-09 backup round trip | PASS | Back up now (app `chalk`, version 1), Erase all data, welcome, Restore a backup: 2 workouts and 3 routines back |
| S-10 CSV | PASS | the export has units in the column names; re-importing it says "2 workouts already here will be skipped"; a Strong CSV previews 2 new workouts and 1 new exercise and imports ("Imported 2 workouts") |
| S-11 / S-12 crash and data check | PASS | a damaged workout in IndexedDB shows the recovery screen (French); *Check for damaged data* lists it; Delete then confirm removes it ("Plus aucun problème"); Reload opens the app; a healthy database reads "No problems found" |
| S-13 / S-14 first run, past workout | PASS | empty storage lands on the welcome page; Full body adds a folder with 3 routines; a workout is saved (100 lb stored as 45.36 kg); reload stays on Home; an empty past-workout save is refused, the draft is restored after leaving, save leads to the celebration |
| S-15 / S-16 | PASS | languages (M6); What's new, shortcuts and privacy page (M7) |
| Overflow, English, `clientWidth` | PASS after fixes | 27 routes in default, light + high contrast, black + large + teal, extra-large, extra-large + larger controls and extra-large + light + high contrast + larger controls, at 320 / 360 / 375 / 412 px. Found and fixed: the live workout's Previous header and values at large text (see roadmap LAUNCH-M8) |
| Overflow, other languages | PASS | M6 sweeps (ten languages at 320 and 375 px, six at extra-large) plus German, Polish and Arabic at extra-large and 360 px after the M8 CSS |
| Keyboard | PASS | no unnamed button, link, input or summary on 27 routes, no positive `tabindex`; ArrowRight in the accent radio group moves Purple to Indigo, applies it and moves focus |
| Reduced motion | PASS | setting "Always": `data-motion="reduce"`, button transition 0 s (was 0.12 s), the pulse animation none |
| CSP / console | PASS | 0 violations through first run, restore, import and language switches; no console errors from the final bundle |
| Phone / iPhone / screen reader / native speakers / real link previews | NOT_RUN | listed in `RELEASE_CHECKLIST.md` REL-104 for the owner |

Dev-browser state after the run: sample data restored, default settings, no running workout.

## Public and store readiness (LAUNCH-M7): 2026-10-17, branch `launch`

Environment: Windows 11, built-in Chromium, dev server on localhost:5173 (sample backup) and production preview on localhost:4173/chalk/ (a new, empty origin), phone emulation at 412 px, desktop at 1280 px.

| Check | Result | Evidence |
|-------|--------|----------|
| Types / tests | PASS | `tsc --noEmit` exit 0; 163 passed, 2 skipped (new: `whatsNew.test.ts`; `i18n.test.ts` covers the 20 new keys in all ten languages) |
| Contrast | PASS | 732 pairs, 0 failing |
| Production build | PASS | main chunk 168.55 kB gzip (167.24 at M6); 37 precache entries; `og-image.jpg` and `store/*` are not precached, `privacy.html` is; built `index.html` has absolute og and canonical URLs; the manifest has `categories`, 2 shortcuts, 5 screenshots; the service worker has `denylist:[/privacy\.html$/]` |
| Link-preview image | PASS | `public/og-image.jpg` 1200 × 630, 69 kB, read on screen; text and week card clear, no overlap |
| Privacy page under the service worker | PASS | Preview: `/chalk/privacy.html` opens the privacy page (title "Setward privacy policy"), not the app shell; readable at 375 px |
| What's new | PASS | Dev, existing data and no recorded version: the sheet opens on Home once, Done records `1.0.0`, it does not return; preview, new empty install: no sheet, the version is recorded silently; About lists "What's new" (6 entries) and the privacy link |
| Home-screen shortcuts | PASS | Preview, empty install: `#/?action=start` starts "Evening workout" and lands on `#/workout` (the welcome redirect did not steal it); `#/?action=weigh` lands on the body-weight screen with the "Log body weight" sheet open |
| Wide-screen panel | PASS | 1280 px: the panel sits left of the column (LTR) and right of it in Arabic; below 1240 px it is hidden. The pane scaled the capture, so spacing was judged from positions, not pixels |
| Console / CSP | PASS | No console errors in the preview; the CSP is unchanged |
| Store assets | PARTIAL | Feature graphic 1024 × 500 and listing text done. Phone screenshots are 824 × 1830 (2.2:1): Play allows 2:1, so they must be retaken before submitting. Nothing submitted |
| Real link previews, launcher long-press shortcuts | NOT_RUN | Need the deployed URL and a phone |
| Phone / screen reader | NOT_RUN | Needs the owner's phone |

## Ten translations and Arabic right-to-left (LAUNCH-M6): 2026-10-17, branch `launch`

Environment: Windows 11, built-in Chromium, dev server on localhost:5173 (sample backup, an unfinished Chest day in progress), phone emulation at 375 and 320 px. Every language was switched on the Language page, then each route was visited.

| Check | Result | Evidence |
|-------|--------|----------|
| Types / tests | PASS | `tsc --noEmit` exit 0; 158 passed, 2 skipped (`i18n.test.ts` is now 38 tests: every non-English locale has a loader; for each of ten languages, same keys and no extras, same placeholders and tags, plain messages stay strings, every plural form `Intl.PluralRules` returns for 0 to 1000; `isolate()` / `plain()` in Arabic only) |
| Contrast | PASS | 732 pairs, 0 failing (`node scripts/contrast.mjs`) |
| Production build | PASS | `MSYS_NO_PATHCONV=1 BASE_PATH=/chalk/ npm run build`: main chunk 167.24 kB gzip (166.85 at M5); each language is its own lazy chunk of 13.9 to 16.9 kB gzip (id smallest, ar largest), all ten in the precache (36 entries, 2.1 MB); the 166 kB Arabic font file is not precached (service worker has an `arabic-font` CacheFirst route) |
| Arabic first look | PASS | Settings home at 375 px sent to the owner next to French: mirrored layout, chevrons and back arrow flipped, tab pill slant mirrored, Noto Sans Arabic rendering |
| Arabic screen pass | PASS after fixes | Home, live workout (rest bar, set table, exercise menu, plate calculator), History detail, exercise detail with chart, Progress (calendar, charts, horizontal bars, recent records), body weight. Found and fixed: clipped dots on display titles, "549.7 lbs" and "−0.7 lbs" reordered (now isolated), `.stat-value` forced left to right (wrong for "1 س 23 د"; removed), date labels on the weekly chart colliding, English month names on the body-weight chart, "Set" header touching "Previous", ±15 signs on the wrong side |
| Overflow sweep, 320 px, default text | PASS | 27 routes (all pages, all settings pages, live workout, both editors, welcome, programs, body weight, exercise detail and new) in all ten languages: no page overflow, no clipped or spilling text, set-table headers fit their columns, rest bar fits (checked while a rest ran) |
| Overflow sweep, 320 px, extra-large text + larger controls | PASS | German, French, Dutch, Polish, Turkish, Arabic over the same 27 routes |
| Overflow sweep, 375 px | PASS | Live workout and both editors in all ten languages (headers, rest bar); all 27 routes in German, Arabic and Polish |
| Measure bug in earlier sweeps | FOUND | A phone-sized browser widens `window.innerWidth` to fit an overflowing page, so checks against it pass. The first M6 pass with `innerWidth` reported clean; redone against `clientWidth` it found 8 real overflows (Settings → Your data buttons in six languages, a Polish record pill, German reps header on the editors, several wraps at extra-large text). All fixed. M3 to M5 sweeps may have used `innerWidth`: re-run in M8 |
| Language switching | PASS | Language page: each of the ten switches `lang` and `dir`, lazy chunk loads in about a second, the app root redraws; switching back to English works |
| Share card in Arabic | PASS after fix | The canvas drew every line left to right, which garbled "1 س 23 د"; each line now takes the direction of its script (`shareCard.ts`), the Arabic face is loaded for it, and the layout is unchanged. Read on screen at 375 px |
| Production preview | PASS | `/chalk/` on :4173: service worker active and in control; all 10 language chunks in the precache cache, the Arabic font not; switching through all eleven languages sets `lang` and `dir` correctly (Turkish capitals keep the dotted İ); 0 CSP violations; on a fresh load in Arabic the font is requested once and stored in the `arabic-font` cache |
| Offline start in a non-English language | NOT_RUN | No offline emulation in this browser; the chunk and font routes are checked through the cache contents only |
| Native-speaker review | NOT_RUN | All ten are machine translations |
| Phone / screen reader | NOT_RUN | Needs the owner's phone |

## Welcome, programs, past workouts, recent records (LAUNCH-M5): 2026-10-17, branch `launch`

Environment: Windows 11, built-in Chromium, dev server on localhost:5173 (sample backup) and production preview on localhost:4173/chalk/ (storage wiped for the first-run tests), 375 and 320 px.

| Check | Result | Evidence |
|-------|--------|----------|
| Types / tests | PASS | `tsc --noEmit` exit 0; 125 passed, 2 skipped (new: `welcome.test.ts`, `programs.test.ts` incl. every exercise id in the library and `addProgram` through IndexedDB, `records.test.ts`) |
| Contrast | PASS | 732 pairs, 0 failing |
| Production build | PASS | main chunk 166.85 kB gzip; Welcome 1.18, Programs 2.00, Settings 10.19 kB (lazy) |
| First run | PASS | Wiped storage: lands on `#/welcome` (no tab bar), `language: auto`, units from the region; starter program → Push / Pull / Legs → 3 routines in a folder, `welcomeSeen` true, reload stays on Home. Second wipe: Skip → empty Home with "Browse starter programs", reload stays on Home |
| Existing user | PASS | The dev browser (65 workouts, 6 routines) opens Home, never the welcome page |
| Programs | PASS | Preview sheet lists the exercises with sets × reps; Add creates the routines; a second add asks first (code path; the prompt itself not clicked) |
| Past workout | PASS | Empty save refused with a message; a draft survives leaving the page; Save writes the workout (sets marked done), clears the draft and opens the celebration |
| Recent records | PASS | Progress lists 6 entries with the headline record and "+N more" |
| Overflow sweep | PASS | 14 routes at 375 and 320 px, three setting combinations; one fix (`.setting` wraps) |
| CSP / service worker | PASS | 0 violations through the whole first-run flow; service worker in control |
| Phone / screen reader | NOT_RUN | Needs the owner's phone |

## Settings experience (LAUNCH-M4): 2026-10-17, branch `launch`

Environment: Windows 11, built-in Chromium, dev server on localhost:5173 and production preview on localhost:4173/chalk/ (sample backup), 375 and 320 px.

| Check | Result | Evidence |
|-------|--------|----------|
| Types / tests | PASS | `tsc --noEmit` exit 0; 113 passed, 2 skipped (new: `previous.test.ts`, `backupReminder.test.ts`, `sounds.test.ts`) |
| Contrast | PASS | 732 pairs, 0 failing |
| Production build | PASS | `/chalk/` build; main chunk 164.82 kB gzip, `Settings-*.js` 10.29 kB gzip (lazy, in the service worker's precache) |
| Overflow sweep | PASS | 22 routes at 375 and 320 px, three setting combinations each (see roadmap). Found and fixed: Segmented at extra-large text on the Accessibility page (377 px), the week card's greeting and streak chip (404 px) |
| Rest settings | PASS | Warm-up rest 30 s, working 90 s; auto-rest off leaves the rest alone; warm-up rest Off starts none |
| Countdown and sounds | PASS | A 5 s rest with the countdown created 6 oscillators (3 ticks, 3 end tones). Sounds not judged by ear |
| Backup reminder and data page | PASS | Card at 10 days; Later hides it (snooze 3 days); Back up now stamps the date; Reset settings writes `{}` and the accent returns to purple |
| Narrowest combination | PASS | 320 px, extra-large text, larger controls: boxes and checks readable, Previous column hidden by design |
| Production preview | PASS | All Settings pages render from the lazy chunk, 0 CSP violations, service worker in control |
| Language switching | NOT_RUN | Only English exists until M6 |
| Phone / screen reader / reduced motion | NOT_RUN | Needs the owner's phone |

## Visual refresh, checkpoint 2 and M3 checks (LAUNCH-M3): 2026-10-17, branch `launch`

Environment: Windows 11, built-in Chromium, dev server on localhost:5173 and production preview on localhost:4173/chalk/, both with the sample backup; 320, 360, 375 and a 1280 emulation.

| Check | Result | Evidence |
|-------|--------|----------|
| Types / tests | PASS | `tsc --noEmit` exit 0; 104 passed, 2 skipped (unchanged) |
| Production build | PASS | `/chalk/` build; main chunk 165.73 kB gzip |
| Contrast | PASS | `node scripts/contrast.mjs`: 732 pairs, 0 failing (adds the record pill) |
| Overflow sweep | PASS | 13 routes (Home, live workout with 4 checked sets, History, a workout detail, the saved celebration, workout edit, Exercises, an exercise, Progress, Body weight, Settings, new routine, routine edit) checked for page width and every element's right edge: dark default, light + high contrast + extra-large, pure black + large; at 375, 320, 360 and 1280 |
| Celebration | PASS | `?saved=1` on a workout with 8 records: the number counts up to 8, shards play once, Share opens the sheet; a workout with none shows "Logged" |
| Large text, 320 px | PASS | Live set table at 125 % text: Previous values readable ("35 × 10" on two lines), headers no longer touch (found by the sweep's screenshot, not by its overflow check) |
| Share card | PASS | Preview renders at 1080×1350 with the new banner; the stat values were reduced to 72 px after "17,320 kg" crowded the next column |
| CSP / production | PASS | Preview with data restored through IndexedDB: 0 violations across Progress, Body weight, an exercise, the celebration and Home; gradients applied (computed stop colour rgb(139, 108, 240) at 0.38) |
| Reduced motion | NOT_RUN | Covered by the existing global rules; the count-up checks the media query and `data-motion` itself. Not exercised in the browser |
| Phone / screen reader | NOT_RUN | Needs the owner's phone; the celebration's status line is untested with a screen reader |

## Visual refresh, checkpoint 1 (LAUNCH-M3): 2026-10-17, branch `launch`

Environment: Windows 11, built-in Chromium, dev server on localhost:5173 with the sample backup restored, 375 and 320 px emulation.

| Check | Result | Evidence |
|-------|--------|----------|
| Types / tests | PASS | `tsc --noEmit` exit 0; 104 passed, 2 skipped (unchanged) |
| Production build | PASS | `/chalk/` build; main chunk 164.55 kB gzip (was 163.56) |
| Contrast | PASS | `node scripts/contrast.mjs`: 708 pairs (dark, pure black, light × normal, high contrast × purple, indigo, teal, pink), 0 failing. Before the fixes it reported 48 failing: F and D badge text and the dark high-contrast line |
| Home, live workout | PASS | 375 px dark and light: week card (name, goal 4, 3 done, streak 17), glowing Start button, slanted tab pill, live header `5 of 12 sets` with the bar, checked sets, rest bar |
| Overflow | PASS | `scrollWidth` equals `clientWidth` (320) on `/`, `/workout`, `/history`, `/exercises`, `/profile`, `/settings`, `/routines/new` at 320 px |
| Console | PASS | Only "Blocked call to navigator.vibrate": the browser refuses it for clicks made by a script rather than a finger. Not a defect, but not verified on a phone |
| Reduced motion | NOT_RUN | The rules are the existing ones (`prefers-reduced-motion` and `data-motion`); the new animations are covered by them but were not checked in the browser |
| Phone / screen reader | NOT_RUN | Needs the owner's phone |

## Data check (DATA-002): 2026-10-16, branch `data-check` (@ ce3daae, off `main` @ 663cb56)

Environment: Windows 11, Node 24.19.0, npm 11.17.0; the desktop app's built-in Chromium (dev server on localhost:5173, preview on localhost:4173/chalk/), 375 and 320 px emulation. Baseline before the change: typecheck clean, 67 passed, 2 skipped.

| Check | Result | Evidence |
|-------|--------|----------|
| Types / tests | PASS | `tsc` exit 0; 88 passed, 2 skipped (new: `dataCheck.test.ts`, 21) |
| Tests can fail | PASS | Dropping the `exerciseIds` normalisation fails the "another order" test; letting delete take a repairable record fails the delete-safety test; both changes reverted (file identical to the original) |
| The crash is real | PASS | A workout with `exercises: null` throws `w.exercises is not iterable` at `computeRecords` and shows the crash screen (unit test and dev console) |
| No false positives | PASS | Sample data (65 workouts, 6 routines, 1 custom exercise, 16 weigh-ins): "No problems found". Unit tests cover `workoutFromDraft`, `saveRoutine` + `templateFrom`, a Hevy import, `logBodyWeight` and an exercise-form record, all through IndexedDB |
| Crash → check → delete → reload | PASS | Dev and production preview: listed with label and date; the backup file contained the raw record; Delete then Keep (Enter on the focused Keep) left it; Delete then Delete removed only it; "No problems left"; Reload Setward opened the app; History intact |
| Repair | PASS | A workout without `exerciseIds` got its 6 ids back (and is found through the exercise index) with an unknown field kept; a routine with `order: "first"` was reset to 0 with `updatedAt` bumped, title and exercises kept; settings dropped only `platesKg` and kept `weightUnit` and an unknown key |
| Narrow / themes | PASS | 320 px, dark and light, on the crash screen: page width 320, no element past the viewport, a 70-character unbreakable title wraps, the expanded record wraps, the page scrolls to the last card; light text #52505e on #f3f3f6. Screenshots in the pane were drawn at a reduced scale, so the layout was confirmed by measuring |
| Production build | PASS | `/chalk/` build; main chunk 153.77 kB gzip (was 150.96), CSS 8.42 kB gzip (was 8.18) |
| S-08 / CSP | PASS | `/chalk/` preview: CSP meta present, service worker in control, 0 violations through open, backup and delete |
| S-01 / S-02 / S-03 | PASS / PASS / PARTIAL | App opens after the repair; 5 routes render without overflow; a started workout survives a reload (no sets or exercises were typed) |
| Console | PASS | Only the two deliberate crash errors; none after the repair |
| Screen reader | NOT_RUN | None here. The buttons carry names ("Repair workout …"), a polite live region announces results, and focus moves to the summary after an action |
| Release on `main` (REL-103) | PASS | Merged as e7ad7fe; typecheck, 88 tests, `/chalk/` build (same bundle `index-D2GzHZz1.js`), `npm ci --dry-run`, secret scan; pushed 663cb56..e7ad7fe; Pages run 38953196792: build and deploy succeeded, 0 annotations |
| Live site | PASS | New bundle, Setward manifest with `/chalk/` scope, CSP meta, service worker in control, 5 routes without overflow, Settings → Check data opens ("No problems found", no data yet), backup button present, 0 CSP violations, no console errors. Checked on empty storage; the damaged-record flow was not repeated on the live site |
| Phone | NOT_RUN | Needs the owner's phone |

Notes: a raw IndexedDB write does not notify Dexie, so on the production preview the page was reloaded to trigger the crash. The dev database was returned to the clean sample afterwards (65 workouts, 6 routines, 1 custom exercise, no settings row).

## Features - 2026-10-05, branch `features` @ 44c6840

| Check | Result | Evidence |
|-------|--------|----------|
| Types / tests / build | PASS | `tsc` exit 0; 67 passed, 2 skipped (new: `folders.test.ts` 4, `workouts.test.ts` +1); `/chalk/` build, main chunk 150.96 kB gzip (+1.9 kB), CSS 8.18 kB gzip |
| FEAT-006 contrast | PASS | Badge text on its tint: dark 6.03 / 4.91 (done row), light 5.42 / 4.71 |
| FEAT-006 rendering | PASS | Computed rgb(242,153,74) dark and rgb(150,68,0) light; `--warm` still #f4c430 |
| FEAT-004 drag | PASS | A real mouse drag and a scripted touch drag reorder and save; other folders untouched |
| FEAT-004 non-drag | PASS | Arrow keys on the handle and the arrow buttons; focus kept; live-region announcement |
| FEAT-002 flow | PASS | Start ends the rest; a reload keeps it; one alert at the target (vibration spy); save fills the time, checks the set and starts the rest; check-while-timing, Cancel and a removed set behave |
| Narrow / themes | PASS | 320 px light: stopwatch and reorder sheet fit, no page overflow |
| S-01/S-02/S-08 | PASS | `/chalk/` preview: 4 routes, 0 CSP violations, no console messages; stopwatch on the production build |
| Beep sound | NOT_RUN | No audio output here; same code path as the rest beep |
| Phone | NOT_RUN | Needs a deploy (REL-102) |

## ENV-002 — 2026-10-05

| Check | Result | Evidence |
|-------|--------|----------|
| Deploy runs on the pinned runner | PASS | Run 37298887657 (`main` @ 1585231): build and deploy logs show `Image: ubuntu-24.04` (20260927.320); both jobs success; 0 annotations |
| Live app unchanged | PASS | Live page still serves `index-z9IrtRPz.js` |

## Session 2026-10-05 afternoon: branch `setward` @ 4ae76c3

Environment: Windows 11, Node 24.19.0, npm 11.17.0; the desktop app's built-in Chromium (dev server on 127.0.0.1:5173, preview on localhost:4173/chalk/), 375 and 320 px emulation.

| Check | Claim | Result | Evidence |
|-------|-------|--------|----------|
| Baseline | The uncommitted rebrand builds and passes tests before any change | PASS | 59 passed, 2 skipped; `/chalk/` build, main chunk 148.77 kB gzip |
| A-01/A-02/A-03 | Types, tests and build after the fixes | PASS | `tsc` exit 0; 62 passed, 2 skipped (new `exercises.test.ts`: 3); main chunk 149.04 kB gzip, precache 22 entries |
| UX-002 | A used custom exercise can't be deleted; an unused one can | PASS | Browser: routine-only exercise → "Used in 1 routine — remove it there first", still stored; sample custom → "Used in 13 workouts and 1 routine…"; routine removed → confirm dialog → deleted, back on Exercises |
| UX-003 | No session volume for assisted bodyweight; weight × reps keeps it | PASS | Assisted pull-up fixture: Most reps, Logged only; Chest Press (Machine): Heaviest, e1RM, set volume, session volume, Logged |
| A11Y-002 | Radio-group keyboard pattern | PASS | Real key presses: wrap both ways (2 and 3 options), Up/Down, Home/End, Enter, one Tab exits; focused option matches `:focus-visible` with a 2 px accent outline |
| DOC-002 | Share card dim text uses #888692 | PASS | Pixel scan of the 1080×1350 card: 2,898 px #888692, 1 px old grey; screenshot |
| Header 320 px | Setward header fits the narrowest phone | PASS | Title 16–178 px, brand 184–304 px, no page overflow |
| S-01/S-02/S-08 | Preview at `/chalk/` loads, routes work, CSP holds | PASS | 6 routes, no overflow, service worker in control, 0 CSP violations, no console messages |
| Manifest | Installed-app identity unchanged | PASS | `dist/manifest.webmanifest`: name/short name Setward, `start_url` and `scope` `/chalk/` |
| Screen reader | — | NOT_RUN | No screen reader here |
| Phone | Name/icon refresh, fixes on device | NOT_RUN | Needs a deploy (REL-101) and the owner's phone |

## Setward branding verification — 2026-10-05

- `npm test`: 59 passed, 2 opt-in live GitHub checks skipped.
- `BASE_PATH=/chalk/ npm run build`: passed (typecheck, production assets, service worker).
- `/chalk/` preview: new browser title; Workout header at 360 px with no overflow in dark/light themes; Settings shows Setward. No console warnings/errors in the inspected page.
- Sample 1080×1350 share card: matching split-S logo and Setward name/footer; date remains clear of the longer name.
- SVG/PNG geometry checked, including opaque Apple/maskable backgrounds and the maskable safe circle. Palette and fonts unchanged.
- Brand text stays in the accessibility tree; only the decorative SVG is hidden.
- Database, backup discriminator, sync format and deployment/PWA scope unchanged; existing backup/sync tests pass.
- Not run: installed phone name/icon refresh (requires deployment and the owner's phone). Earlier real-device checks remain outstanding.

States: PASS · FAIL · PARTIAL · NOT RUN · BLOCKED · UNKNOWN.

## Baseline (2026-10-04 20:29, `main` @ 0698dc1, before any change)

| Check | State | Evidence |
|-------|-------|----------|
| Typecheck (`tsc --noEmit`, TS 7.0.2) | PASS | exit 0 |
| Unit tests (vitest 5.0.1) | PASS | 2 files, 19 passed, 2 skipped (`github.smoke`, opt-in) |
| Build (`vite build`, Vite 8.3.0) | PASS | main chunk 465 kB (145 kB gzip), lazy exercises chunk 844 kB (165 kB gzip), CSS 33 kB, precache 22 entries / 1.56 MB |
| `npm audit` | PASS | 0 vulnerabilities (prod and dev) |
| Lint | NOT RUN | No linter is configured. `tsc` runs strict with `noUnused*`. |
| Dev server UI | PASS | Workout tab renders at 375×812, empty database, no console errors |
| Runtime: Node 24.19.0, npm 11.17.0, Windows 11 | — | — |

**Pre-existing defects found by reading the code** (not regressions):
1. A render error blanks the whole app and leaves no way to export data. → REL-001
2. The "Save workout" button stays disabled for good if saving throws. → REL-002
3. Backup restore writes records without validation, can crash rendering and can create two weigh-ins on one day. → DATA-001
4. The routine and past-workout editors lose changes on the back gesture or on tapping an exercise name. → UX-001
5. `--text-3` contrast is 4.06:1 (dark) and 3.90:1 (light) on the page background, below AA 4.5:1. → A11Y-001
6. The search field shows no focus indicator. → A11Y-001

## Current (2026-10-04 ~21:20, branch `quality-pass` @ 506c14f)

| Check | State | Evidence |
|-------|-------|----------|
| A-01 Typecheck | PASS | `tsc --noEmit` exit 0 |
| A-02 Unit tests | PASS | 8 files: 59 passed, 2 skipped (opt-in GitHub smoke). New: `stats`, `format` (with CSV and `fmtSet`), `hevy`, `workouts`, `backup` tests. Mutation check: breaking the warm-up rule and 12-hour parsing each failed a test. |
| A-03 Build | PASS | Main chunk 474 kB (148.6 kB gzip), up from 465/145.4: +3.2 kB gzip for the crash screen, restore checks, drafts and CSP. Precache 22 entries / 1.57 MB. |
| `npm audit` | PASS | 0 vulnerabilities after adding `fake-indexeddb` |
| Lint | NOT RUN | none configured (DX-002) |
| S-01 App loads | PASS | dev and preview builds, no console errors |
| S-02 Navigation | PASS | tabs and back buttons used throughout the QA sweeps |
| S-03 Live workout survives reload | PASS | in-progress workout intact after reloads, an offline reload and a service-worker update |
| S-04 Set check + rest timer | PASS | rest bar counted down after checking sets (dev and preview) |
| S-05 Routine round trip | PASS | started routines pre-fill sets; routine editor save verified (UX-001) |
| S-06 Finish and history | PASS | "Workout 66 saved" detail page after finishing (REL-002 run); past-workout edit and save (UX-001) |
| S-07 Offline | PASS | preview server stopped → reload served by the service worker, app and workout intact |
| S-08 Sub-path build + CSP | PASS | `/chalk/` preview: zero CSP violations across restore, photos, fonts, share image, rest timer, blob audio, Progress calendar, body weight and plate calculator; a foreign fetch was blocked |
| S-09 Backup round trip | PASS | unit test (export → wipe → restore equal) and browser (confirm sheet → restore; stored records unchanged by cleaning) |
| S-10 Hevy import | PASS | browser: exported the 65 sample workouts as Hevy CSV, wiped, imported through Settings: 65 workouts, 937 sets before and after, 23 matched, 1 created, 5 routines from history |
| S-11 Crash screen | PASS | a malformed workout showed the recovery screen; its backup (save stubbed) held 66 workouts |
| Responsive | PASS | 320 / 360 / 375 / 1280 px: no page overflow on the swept routes; no clipped Previous values |
| Themes | PASS | dark and light screenshots of History, Progress and the live workout |
| Contrast | PASS | `--text-3` 5.21:1 (dark) and 5.30:1 (light) on the background |
| Keyboard focus | PARTIAL | global `:focus-visible` ring plus the new search ring; not swept screen by screen |
| Screen reader | NOT RUN | no screen reader in this environment; the charts keep their hidden data tables |
| Real phone (Android) | NOT RUN | needs the owner's device after deploy (see REL-100) |
| iPhone | BLOCKED | no device (QA-002) |
| Live GitHub sync | NOT RUN | needs the owner's token; sync code is unchanged and `syncCore` tests pass |

## Pre-existing defects found during QA (all fixed)
7. Charts drew at 320 px and overflowed phones narrower than about 386 px, including 375 px.
8. The charts' screen-reader table widened the page on phones.
9. The consistency calendar overflowed at 360 px.
10. The Back up / Restore buttons overflowed Settings on phones.
11. The Previous column cut off values, hiding last time's reps.
12. A mistyped huge weight froze the plate calculator (2 s at 1,000,000 kg; 117 s at 10,000,000 kg).

## Environment limitations
- No physical phone. The Android lock-screen behaviour (NN-13) and iPhone can't be verified here.
- Browser QA uses the desktop app's built-in Chromium with mobile emulation. Touch gestures are simulated as clicks.
- The GitHub sync live test needs the owner's token. It is not run, and AI sessions must not handle the token.
- When the desktop app's browser pane is hidden, the page renders no frames, so `requestAnimationFrame` and `ResizeObserver` never fire. Check `document.visibilityState` before trusting size or animation results.
- In Git Bash, `BASE_PATH=/chalk/` is rewritten to a Windows path; prefix `MSYS_NO_PATHCONV=1`.
