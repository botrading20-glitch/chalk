# Setward 1.0: own identity, full settings, refreshed look, 11 languages, launch-ready

## Context

Setward is live and works well for the owner, but a stranger opening the link today gets:
- no welcome and no starter routines;
- about ten settings on one long page;
- an app that still leans on Hevy (Hevy import, Hevy-format export, wording, docs);
- English only, and a competent but plain look;
- no About, privacy page, licence, link preview or store groundwork.

The goal is a public web launch now, with the Play Store later. The launched app has its own identity, many more settings (including language, accessibility and comfort), a look that is both refined and bolder, and the missing launch pieces. Google sign-in stays out (parked on the `google-sync` branch).

Baseline on 2026-10-16 (`main` @ 2473881, clean tree): 88 tests pass (2 skipped), main chunk 153.77 kB gzip, live at botrading20-glitch.github.io/chalk/.

## Owner decisions (Q&A, 2026-10-16)

| Topic | Decision | Consequence |
|---|---|---|
| Posting | Web link now, Play Store later | Link previews, About/privacy, welcome flow, store groundwork. No packaging or fees now. |
| Look | Refine and do the bolder refresh together | Amend NN-16. Same palette and fonts; add gradients and glow on hero elements, bigger numbers, and a slanted "forward" motif. |
| Settings | All four groups, plus language, accessibility and comfort | Settings becomes a grouped home screen with sub-pages. |
| Languages | French, Arabic (right-to-left), Spanish, German, "and more" | Extra set: Brazilian Portuguese, Italian, Turkish, Dutch, Polish, Indonesian (all Latin script). |
| Hevy | Remove completely | Delete the Hevy import, the Hevy-format export and all Hevy wording and docs. Retire NN-06. Strong import and Setward's own CSV replace them. |
| Extras | Welcome + starter programs, log a past workout, recent records, import from Strong | All in scope. |

Defaults unless the owner says otherwise:
- MIT licence.
- Version 1.0.0.
- I write the translations by machine and label them that way.
- Existing installs stay in English until changed; new installs follow the phone's language.
- The address stays /chalk/ for now.
- Feedback goes to the public repo's GitHub issues.

## How the work runs

- Branch `launch` from `main`.
- One milestone at a time. Each is committed and recorded in `.ai/` with roadmap IDs, so any session can resume.
- Nothing merges or pushes to `main` without the owner's go-ahead (NN-15).

### M1: Retire Hevy, add Strong import and Setward's own CSV

**Split `src/lib/hevy.ts`.** Its format-agnostic part becomes `src/lib/importer.ts`:
- `ParsedWorkout` → `ImportPlan` → `applyImport`;
- name matching through `normalize` (`search.ts`);
- custom-exercise creation and duplicate skipping.

Delete the Hevy parser, the Hevy exporter and `hevy.test.ts`.

**New `src/lib/strong.ts`: a tolerant parser for Strong's CSV.**
- Columns as users report them: Date, Workout Name, Duration, Exercise Name, Set Order, Weight, Reps, Distance, Seconds, Notes, Workout Notes, RPE.
- Comma or semicolon delimiters.
- Units from the header text or a unit column. Otherwise the import sheet asks kg or lbs.
- Strong doesn't publish its format, so test against a real export before release.
- After import, the existing `createRoutinesFromHistory` offer still runs.

**New `src/lib/exportCsv.ts`: Setward's own CSV.** One row per set. Headers name the stored units (`weight_kg`, `distance_km`, `duration_s`, `set_type`, `rpe`, notes…). It replaces "Export workouts as CSV".

**Remove Hevy wording everywhere:**
- UI copy in Settings, History, Profile and SyncSettings;
- comments in `sets.ts`, `stats.ts`, `syncCore.ts` and `scripts/build-exercises.mjs`;
- README, CLAUDE.md and AGENTS.md;
- `.ai/`: NN-06 retired in DECISIONS, REQ-009 replaced, smoke test S-10 switched to Strong;
- memory notes.

`dataCheck.test.ts` switches to the Strong importer. Sync merge logic is untouched (NN-05).

**Check:** tests pass; `grep -i hevy dist/` returns nothing; a Strong fixture imports with the right sets, units and warm-ups; the export opens cleanly in a spreadsheet.

### M2: Foundations (nothing visible changes at default settings)

**i18n core in `src/i18n/`, with no new dependency.**
- A typed English catalog is the source of truth, read through `t(key, vars)` and `useT()`.
- Plurals use `Intl.PluralRules`; lists use `Intl.ListFormat`.
- Other catalogs load lazily and are precached for offline use.
- `<html lang>` and `dir` follow the chosen language.

**Locale-aware `format.ts`.** `fmtDate`, `fmtTime`, `fmtMonth`, `fmtNum`, `plural`, `listJoin` and `defaultWorkoutTitle` follow the language, the time format and the first day of the week. `parseNum` also accepts Arabic-Indic digits.

**Move every existing UI string into the English catalog:**
- visible text, aria-labels, toasts and confirm dialogs;
- the labels in `meta.ts` and `stats.ts`;
- the share-card text.

Exercise names and instructions stay English, because they are library data.

**Settings model.**
- New fields go in `Settings` (`types.ts`) and `DEFAULT_SETTINGS` (`db.ts`), with enum lists in `cleanSettings` (`validate.ts`), so restore and Check data validate them.
- Device-only state lives in `kv`, through a small `src/lib/prefs.ts` hook that follows the `collapsedFolders`/`installDismissed` pattern: last backup, snoozes, whether the welcome was seen, last version seen.
- No Dexie schema change (NN-10).

**Design tokens in `styles.css`.**
- Spacing, radius, elevation, gradient, glow and motion tokens.
- Font sizes converted from px to rem, which makes a text-size setting possible.
- Left/right properties converted to logical ones, for right-to-left.
- Theme variants as attribute-scoped token sets: `data-theme`, `data-black`, `data-contrast`, `data-accent`, `data-motion`.

**Check:** before/after screenshots match at default settings; typecheck and tests pass.

### M3: Visual refresh (refine + bolder)

The direction, "Forward", keeps the violet-charcoal palette, the purple accent, Big Shoulders and Archivo, and adds:
- a violet gradient and soft glow, on hero elements only: Start workout, Finish, the week card, the celebration;
- Big Shoulders for every big number: stats, clocks, rest, records;
- a slanted motif taken from the split-S angle, for progress bars, goal and streak chips, and section accents;
- layered surfaces (subtle gradient and top highlight) instead of flat cards;
- consistent motion: route fade-in, a pop on set check, sheet handles. All of it turns off under reduced motion.

**Shared components:** buttons, cards, chips, segmented controls, toggles, sheets (with a grab handle), toasts (with an optional Undo action), the tab bar (active glow pill), empty states (large faded mark from `brand.ts`), page headers.

**Screens:**
- Home: greeting and a "this week" card with day dots, goal progress and streak; tighter routine cards.
- Live workout: header showing sets done; set rows; check animation and haptic; stopwatch; rest bar.
- After saving: a celebration with the records count rising and a burst.
- History and workout detail.
- Exercise list and exercise detail.
- Progress: a heatmap with intensity, gradient charts.
- Body weight.
- The share card (`shareCard.ts`), in the new style.

**Checkpoint:** once the tokens, Home, Live workout and the Settings home are done, I send the owner screenshots (dark and light, 375 px) and keep going. The owner can redirect if the direction is off.

**Check:**
- widths 320, 360, 375 and desktop;
- dark, light and black themes, normal and high contrast;
- contrast script: text 4.5:1 or more, indicators 3:1 or more;
- no-overflow sweep on every route.

### M4: Settings experience

The Settings home is a set of grouped rows: icon, label, current value, chevron. Each row opens a sub-page at `#/settings/<section>` (routes in `App.tsx`). Existing controls move without changing what they do. The full list is in the catalogue below.

Pieces reused:
- `Segmented`, `Toggle`, `PageHeader` (`ui.tsx`);
- `Sheet` and `ActionSheet`;
- `confirmDialog` and `toast`;
- `SyncSettings`, `InstallSettings`, `DataCheck`;
- `PlateSheet` logic (`PlateCalculator.tsx`, `plates.ts`).

**About** holds the version, What's new, Help & FAQ, Privacy, Credits & licences, Source code, Send feedback and Share Setward.

### M5: New features

**Welcome screen (`#/welcome`).** It shows only when there are no workouts, no routines and the welcome hasn't been seen, so existing users never get it. Every step can be skipped:
1. Language, detected automatically.
2. Units, suggested from the phone's region.
3. Choose: pick a starter program, start from scratch, import from Strong, or restore a backup.
4. Install hint. On iPhone, a warning that Safari may erase the data of sites not added to the home screen (`install.ts` → `installPlatform`).

**Starter programs (`src/data/programs.ts`).** Full body 3-day, Upper/Lower, Push/Pull/Legs, Body-part split, Machines & cables beginner, and Dumbbells at home.
- Each becomes routines in a folder named after the program, through `saveRoutine` and `cloneExercises`.
- Titles use the current language.
- Also reachable from Home ("Browse programs").
- A test checks every exercise id exists in `exercises.json`.

**Log a past workout (`#/history/new`).** It reuses `EditWorkout`: the date, time and duration fields, and `useDraft` drafts, with a new id. Entry points: the History header and the History empty state.

**Recent records on Progress.** A new `src/lib/records.ts` lists the latest records from `computeRecords`: exercise, kind, value and date, linking to the workout. Record formatting moves out of `ExerciseDetail.tsx` so both places share it.

### M6: Languages

**Translations.** Translate the final English catalog into French, Arabic, Spanish, German, Brazilian Portuguese, Italian, Turkish, Dutch, Polish and Indonesian, with every plural form each language needs.

**Arabic:**
- a right-to-left pass on every screen;
- directional icons flipped;
- charts and numbers kept left-to-right;
- an Arabic font from Fontsource (OFL, free), whose unicode-range means only Arabic text loads it;
- no uppercase styling.

**Long strings:** a German pass at 320 px.

**Test `i18n.test.ts`:** every locale has the same keys, the plural forms `Intl.PluralRules` requires, and the same `{placeholders}`.

The Language page says the translations are machine-made and invites corrections.

### M7: Public and store readiness

**`index.html` and `vite.config.ts`.**
- Open Graph and Twitter tags with a 1200×630 `og-image.png`, drawn in the dev browser with the app's fonts, like the share card.
- Manifest additions: `screenshots`, `shortcuts` (Start workout, Log body weight) and `categories`.
- `start_url` and `scope` stay as they are (NN-12), and there is no `id` change.
- The CSP is unchanged, since there are no new origins.

**Static files and docs:**
- `public/privacy.html`, a static page for the store listing with the same text as About → Privacy;
- a `LICENSE`;
- the README rewritten for users (what it is, screenshots, privacy, install, languages), keeping the developer section.

**Wide screens:** a side panel with the name, tagline, features and a "best on your phone" install hint, instead of an empty dark page.

**Version:** 1.0.0, with What's new shown once after updating.

**Store groundwork; nothing is submitted:**
- `.ai/PLAY_STORE.md`:
  - the Trusted Web Activity route;
  - Digital Asset Links must sit at the domain root, which the /chalk/ address doesn't give;
  - the $25 fee and the closed-test rules, as owner decisions;
  - the data-safety answers.
- `branding/store/`: a 1024×500 feature graphic, phone screenshots and listing text.

### M8: Verify, record, release

- Run the full verification below.
- Update `.ai/`: PROJECT_STATE, CURRENT_TASK, roadmap, REQUIREMENTS, NON_NEGOTIABLES, DECISIONS, SMOKE_TESTS, TEST_STATUS, and RELEASE_CHECKLIST (REL-104).
- Add architecture notes to CLAUDE.md and AGENTS.md: i18n, settings, prefs, programs, importer.
- Ask the owner before merging `launch` into `main` and pushing, which deploys. Rollback is reverting the merge.

## Settings catalogue

Default values are in brackets.

| Section | Setting | Values [default] | Where it acts |
|---|---|---|---|
| Workout | Default rest, Keep screen on | existing | unchanged |
| | Warm-up rest | Same as working, Off, 30 s – 2 min [Same] | `restAfter` (`WorkoutEditor.tsx`) |
| | Start rest timer automatically | on/off [on] | `onRest` (`ActiveWorkout.tsx`) |
| | Previous values from | Any workout / Same routine first [Any] | `usePreviousSets` (`data.tsx`), `lastBlocks` |
| | Sets for a new exercise | Auto (1 in a workout, 3 in a routine) or 1–5 [Auto] | `newBlock` |
| | Show RPE | on/off [on] | set sheet and set badge |
| Timer & sounds | Sound when rest ends, Rest alert with the screen off, Vibrate when rest ends | existing | unchanged |
| | Sound | Classic, Chime, Bell, Pulse, with a preview [Classic] | `beep()` (`timer.ts`); the lock-screen fallback track in `restAlert.ts` matches |
| | Volume | Low / Medium / High [Medium] | beep gain and track amplitude |
| | 3-2-1 countdown beeps | on/off [off] | `RestTimer` (`Dock.tsx`) |
| | Vibrate on set check | on/off [on, Android only] | set check and stopwatch start |
| Units & formats | Weight, Distance | existing | unchanged |
| | Time format | Auto / 24-hour / 12-hour [Auto] | `format.ts` |
| | First day of the week | Auto / Mon / Sun / Sat [Auto, from the locale] | `startOfWeek`, which drives weekly charts, streak, calendar and the week card |
| | 1RM formula | Epley / Brzycki [Epley] | `e1rm` (`stats.ts`), which drives records and charts |
| Goals & profile | Your name | text | Home greeting |
| | Weekly goal | Off, 1–7 workouts [Off] | week card, Progress |
| Appearance | Theme | existing | unchanged |
| | Pure black (OLED) | on/off [off] | dark surfaces |
| | Accent colour | Purple, plus 3–4 presets kept away from the set-type colours, each contrast-checked in both themes [Purple] | accent tokens, logo mark, charts, share card |
| | Compact routine cards | on/off [off] | Home |
| Accessibility & comfort | Text size | Small / Default / Large / Extra large [Default] | root font size (rem) |
| | High contrast | on/off [off] | stronger text, lines and focus |
| | Reduce motion | Follow system / Always [Follow system] | `data-motion` |
| | Larger workout controls | on/off [off] | bigger set inputs and check buttons |
| Language | Language | Auto, plus 11 languages [Auto] | whole interface |
| Plate calculator | Plates you have, default bar | existing data (kg and lb) | also editable here, not only in the sheet |
| Your data | Back up now, with the last backup date | – | kv `lastBackupAt` |
| | Backup reminder | Off / Weekly / Monthly [Weekly; silent while cloud sync is healthy] | reminder card on Home |
| | Restore, Import from Strong, Export CSV, Check data, storage status | existing or new | |
| | Reset settings | confirm first | back to defaults; data and the sync connection are kept |
| | Erase all data | existing | unchanged |
| Cloud sync | existing | | unchanged |

Left out on purpose:
- workout reminders and push notifications, which need a server (NN-01);
- a spoken countdown, which takes audio focus (breaks NN-13);
- a left-handed layout;
- Google sign-in.

## Compatibility and data

- **Storage:** no Dexie schema change. New settings are plain JSON fields in the synced settings record, and older clients keep fields they don't know. Device-only state lives in `kv`.
- **Derived numbers:** records, weekly charts and the streak recalculate when the 1RM formula or the first day of the week changes. No stored data changes.
- **Identity:** the `chalk` database and backup ids, `chalk-sync/1` and the `/chalk/` scope stay unchanged, and old backups still restore (NN-07 test).
- **Hevy removal:** it deletes no user data. Workouts imported from Hevy earlier stay ordinary workouts.
- **Invariants:** NN-06 is retired and NN-16 amended, both recorded in DECISIONS.md. A new invariant: every UI string goes through `t()`, and every locale stays complete (enforced by a test).

## Verification

1. **Automated checks:** `npm run typecheck`, `npm test` and `MSYS_NO_PATHCONV=1 BASE_PATH=/chalk/ npm run build`. New tests cover:
   - the importer and Strong parser, and the CSV export;
   - i18n completeness and settings cleaning;
   - first day of the week, time format and the 1RM formulas;
   - warm-up rest and previous values from the same routine;
   - backup-reminder timing and the welcome-screen gate;
   - program exercise ids and recent records.
2. **Dev server (`chalk-dev`) with the sample data:**
   - an existing user sees no welcome screen, and the data is intact;
   - every settings page opens, and each setting's effect is checked in the browser;
   - smoke tests S-01 to S-12 pass, with S-10 now covering Strong.
3. **Preview build (`chalk-preview` on :4173, which starts with empty storage):**
   - welcome → starter program → first workout → save → celebration;
   - 0 CSP violations and an offline reload;
   - the manifest and Open Graph tags are present in `dist/`.
4. **Languages:** the main screens in every language; Arabic right-to-left on every route at 320 and 375 px; German at 320 px.
5. **Looks and accessibility:**
   - the contrast script across themes, accents and high contrast;
   - Extra-large text at 320 px with the no-overflow sweep;
   - a keyboard pass on Settings and the welcome screen;
   - reduced motion.
6. **Bundle:** main chunk compared with the 153.77 kB gzip baseline; locale chunks load lazily.
7. **Not possible here, so listed in the release checklist for the owner:** a real phone, an iPhone, a screen reader.
