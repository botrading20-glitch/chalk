# Setward (formerly Chalk): notes for working on this repo

Free, offline-first workout logger (Hevy alternative). React 19 + TypeScript + Vite 8 PWA, Dexie (IndexedDB), no backend. The owner wants development and hosting to stay free, so don't add paid services or dependencies that need them.

**Project memory** is in `.ai/`: start with `PROJECT_STATE.md` and `CURRENT_TASK.md`. The roadmap, requirements, protected invariants (`NON_NEGOTIABLES.md`), test evidence and smoke tests live there too. Update it as you work.

**Branding and continuity:** the visible app is now **Setward**. Its split-S geometry is in `src/lib/brand.ts`, rendered by `src/components/Brand.tsx` and `src/lib/shareCard.ts`; install icons are in `public/`, and reusable artwork/usage notes are in `branding/`. Keep the legacy `chalk` database name, backup `app: 'chalk'`, `chalk-sync/1` format, existing sync repository and `/chalk/` hosting/PWA scope unchanged for compatibility. Remaining internal `chalk` names are intentional; do not globally replace them.

**Handoff:** check the working tree as well as `.ai/` before making changes. Completed work may be saved locally but uncommitted. Preserve it, read the recorded validation and outstanding steps, and do not treat a completed local change as deployed. As of 2026-10-05, the Setward rebrand and the UX-002/UX-003/A11Y-002/DOC-002 fixes are merged and live (`main` @ 34d025d); the owner's phone checks are still open.

## Commands
- `npm run dev`: dev server on :5173 (also `.claude/launch.json` → `chalk-dev`)
- `npm run build`: `tsc --noEmit` + production build with service worker. In Git Bash, a sub-path build needs `MSYS_NO_PATHCONV=1 BASE_PATH=/chalk/ npm run build`; otherwise MSYS rewrites the path and the page loads blank.
- `npm test`: vitest. It covers the sync engine, records and weekly stats, Hevy CSV, parsing, backups, the live workout and the plate solver. Dexie code runs on `fake-indexeddb` (dev only). The live GitHub check is opt-in: `CHALK_SMOKE_REPO=owner/name CHALK_SMOKE_TOKEN=… npx vitest run github.smoke`. It writes to `data/` in that repo and then deletes it.
- `node scripts/sample-backup.mjs`: writes `tmp-import/chalk-sample-backup.json`, about four months of the owner's style of training, for QA. Restore it in a dev browser only.
- `npm run exercises`: re-downloads free-exercise-db and rewrites `src/data/exercises.json`. Bump `LIBRARY_VERSION` in `src/db.ts` afterwards so installed apps re-seed.

## Architecture
- **Storage units:** weight in kg, distance in km, duration in seconds. Converting to lbs/mi only happens at display and input time (`src/lib/format.ts`).
- **Workouts** are documents with nested exercises and sets. `exerciseIds` is denormalised for a multi-entry index.
- **The in-progress workout** lives in the `kv` table under `active`. The editor writes through `updateActive()` on every change, so a closed tab loses nothing. Text inputs bound to the DB must use `BufferedText`/`NumberField` (`src/components/fields.tsx`); otherwise the async round trip makes the caret jump.
- **`WorkoutEditor`** has three modes: `live` (checkboxes + rest timer), `edit` (past workout) and `routine` (template).
- **`DataProvider`** (`src/lib/data.tsx`) loads every exercise and workout and computes personal records once. Pages read them through `useData()`.
- **Routing** is a tiny hash router (`src/lib/router.tsx`) so the app works from any static path, like GitHub Pages `/<repo>/`.
- **Cloud sync** writes to a private GitHub repo of the user's choosing through a fine-grained PAT (the owner uses `botrading20-glitch/chalk-data`).
  - `syncCore.ts` is a pure three-way merge against a per-device base snapshot (hashes of records at the last sync), so deletions need no tombstones.
  - Workouts are split into 16 shard files by id hash; routines, custom exercises and settings each get one file under `data/`.
  - `github.ts` uses the Contents API with sha-based optimistic concurrency (409/422 → `SyncConflict` → retry).
  - `sync.ts` is the IndexedDB adapter plus triggers: Dexie `storagemutated`, `visibilitychange`, `online`, and `updateSettings`.
  - Synced records must stay plain JSON. The active workout and the exercise library are not synced.
- **Library exercises** are re-seeded with `bulkPut` whenever `LIBRARY_VERSION` changes, so they're never edited in place. Editing one saves a custom copy with `replaces: <library id>` and moves history onto it (`reassignExercise` in `src/lib/exercises.ts`). `useData().exercises` hides replaced originals, but `exerciseMap` keeps them so old references still resolve.
- **Body weight** has its own `bodyweight` table: one weigh-in per day, in kg, with `date` at local midnight. It syncs and backs up like workouts.
- **Rest alert with the screen off** (`src/lib/restAlert.ts`, setting `timerLockScreen`, on by default). While resting, Chalk plays a generated near-silent WAV. It keeps the app alive on a locked phone and shows the rest as a lock-screen player (Media Session: ±15 s, and pause ends the rest). The beep is the Web Audio one from `timer.ts`, fired by a timer, because Web Audio doesn't take audio focus. Tested on Android: an audible `<audio>` beep paused Spotify for good. With the current design, Spotify keeps playing and the beep is on time while locked. The track only beeps itself `FALLBACK` seconds late, as a backup when the app was frozen and the in-app beep couldn't play.
- **Routine folders** are only a `folder` name on each routine (`src/lib/folders.ts`), so they sync with routines and vanish when empty. Which folders are collapsed is per device, kept in `kv` under `collapsedFolders`. `saveRoutine` merges over the stored routine so editors that don't know about `folder` keep it.
- **Plate calculator** (exercise ⋯ menu in the workout editor): `src/lib/plates.ts` finds the fewest plates per side with a small DP, not greedy, so a gym without some plate sizes still gets exact loads. It works in the user's unit (kg or lb plates). Plate sizes owned and the bar per exercise (`plateBars`, in kg, snapped to 20 kg ↔ 45 lb) live in settings.
- **`useSettings()`** caches the last read, so sheets and forms that mount later start with the real settings instead of the defaults. Initial `useState` values computed from settings rely on this.
- **Exercise demo** (`ExerciseDemo`, top of the exercise page): free-exercise-db has a start and an end photo for most exercises (873 of 1,003), which a CSS keyframe flips between like a short clip. Hevy's 3D animations are a licensed commercial library, so don't copy them. Real animations would mean a paid licence, which conflicts with keeping Chalk free.
- **Share card:** `src/lib/shareCard.ts` draws the workout summary PNG (1080×1350) on a canvas. Change its colours if the tokens change.
- **Records:** `computeRecords()` walks workouts oldest to newest. The first session of an exercise sets the baseline and doesn't count as a record.
- **Crash recovery:** `ErrorBoundary` wraps the app in `main.tsx`. Its `RecoveryScreen`, also shown when boot fails, offers Reload and a backup download that reads IndexedDB directly, so it works however broken the React state is. Unhandled promise rejections show a toast.
- **Backup restore** is check, then confirm, then write: `parseBackup()` (pure) → confirm sheet with counts → `restoreBackup()`. `src/lib/validate.ts` drops damaged records and counts them, and repairs only what Chalk can derive (`exerciseIds`, unknown labels, JSON `null` numbers). Don't validate sync input the same way: a filtered record would look deleted locally and the deletion would sync to the cloud.
- **Editor drafts:** the routine and past-workout editors write their state to `kv` under `draft:<kind>:<id>` (`useDraft` in `src/lib/drafts.ts`), so the back gesture or a link doesn't lose edits. The Back button asks before discarding. See `.ai/decisions/ADR-001-editor-drafts.md`.
- **Content Security Policy:** production builds get a CSP meta tag from `vite.config.ts` (not the dev server). A new network origin, such as Google sync, must be added to its `connect-src`.

## Design
- **Tokens** are in `src/styles.css` (dark default, light via `[data-theme]`). The palette is violet-tinted charcoal greys with a purple accent: `--accent` #7a55e6 dark / #5b3cc4 light for fills (white text) and indicators, and `--accent-ink` for purple text. The app icons in `public/` are drawn in the same colours.
- **Fonts:** Big Shoulders Display for titles, clocks and badges; Archivo for everything else. Both are self-hosted through Fontsource so they work offline.
- **Set badges** keep bumper-plate colours: W yellow, F red, D blue. A done row is green. Toggles use the accent.
- **Chart colour** is `--viz`: #8b6cf0 dark / #6a4bd6 light, checked with the dataviz palette validator against `--surface`.
- **Grey text** `--text-3` (#888692 dark / #656371 light) is the dimmest text allowed: 4.5:1 or more on `--bg` and `--surface`.
- **Narrow phones:** check new screens at 360 px. Grid and flex children that hold wide content (charts, scrollers, tables) need `min-width: 0`, or they push the page sideways.
