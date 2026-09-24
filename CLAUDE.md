# Chalk: notes for working on this repo

Free, offline-first workout logger (Hevy alternative). React 19 + TypeScript + Vite 8 PWA, Dexie (IndexedDB), no backend. The owner wants development and hosting to stay free, so don't add paid services or dependencies that need them.

## Commands
- `npm run dev`: dev server on :5173 (also `.claude/launch.json` → `chalk-dev`)
- `npm run build`: `tsc --noEmit` + production build with service worker
- `npm test`: vitest (sync engine). The live GitHub check is opt-in: `CHALK_SMOKE_REPO=owner/name CHALK_SMOKE_TOKEN=… npx vitest run github.smoke`. It writes to `data/` in that repo and then deletes it.
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
- **Share card:** `src/lib/shareCard.ts` draws the workout summary PNG (1080×1350) on a canvas. Change its colours if the tokens change.
- **Records:** `computeRecords()` walks workouts oldest to newest. The first session of an exercise sets the baseline and doesn't count as a record.

## Design
- **Tokens** are in `src/styles.css` (dark default, light via `[data-theme]`).
- **Fonts:** Big Shoulders Display for titles, clocks and badges; Archivo for everything else. Both are self-hosted through Fontsource so they work offline.
- **Set badges** use bumper-plate colours: W yellow, F red, D blue. A done row is green.
- **Chart colour** is `--viz`: brass #b98600 dark / #a87a00 light, checked with the dataviz palette validator.
