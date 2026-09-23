# Chalk: notes for working on this repo

Free, offline-first workout logger (Hevy alternative). React 19 + TypeScript + Vite 8 PWA, Dexie (IndexedDB), no backend. The owner wants development and hosting to stay free, so don't add paid services or dependencies that need them.

## Commands
- `npm run dev`: dev server on :5173 (also `.claude/launch.json` → `chalk-dev`)
- `npm run build`: `tsc --noEmit` + production build with service worker
- `npm run exercises`: re-downloads free-exercise-db and rewrites `src/data/exercises.json`. Bump `LIBRARY_VERSION` in `src/db.ts` afterwards so installed apps re-seed.

## Architecture
- **Storage units:** weight in kg, distance in km, duration in seconds. Converting to lbs/mi only happens at display and input time (`src/lib/format.ts`).
- **Workouts** are documents with nested exercises and sets. `exerciseIds` is denormalised for a multi-entry index.
- **The in-progress workout** lives in the `kv` table under `active`. The editor writes through `updateActive()` on every change, so a closed tab loses nothing. Text inputs bound to the DB must use `BufferedText`/`NumberField` (`src/components/fields.tsx`); otherwise the async round trip makes the caret jump.
- **`WorkoutEditor`** has three modes: `live` (checkboxes + rest timer), `edit` (past workout) and `routine` (template).
- **`DataProvider`** (`src/lib/data.tsx`) loads every exercise and workout and computes personal records once. Pages read them through `useData()`.
- **Routing** is a tiny hash router (`src/lib/router.tsx`) so the app works from any static path, like GitHub Pages `/<repo>/`.
- **Records:** `computeRecords()` walks workouts oldest to newest. The first session of an exercise sets the baseline and doesn't count as a record.

## Design
- **Tokens** are in `src/styles.css` (dark default, light via `[data-theme]`).
- **Fonts:** Big Shoulders Display for titles, clocks and badges; Archivo for everything else. Both are self-hosted through Fontsource so they work offline.
- **Set badges** use bumper-plate colours: W yellow, F red, D blue. A done row is green.
- **Chart colour** is `--viz`: brass #b98600 dark / #a87a00 light, checked with the dataviz palette validator.
