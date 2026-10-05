# Non-negotiables

Protected invariants. Before changing anything listed here: name the invariant, check the impact, add or run a check that protects it, then record any intentional change in `DECISIONS.md`.

| ID | Invariant | Why | Guarded by |
|----|-----------|-----|------------|
| NN-01 | Development and hosting stay free. No paid services, APIs or dependencies that need them. | Owner's hard constraint. | Review of every new dependency. |
| NN-02 | Stored units are kg, km and seconds. Conversion to lbs/mi happens only at display and input (`src/lib/format.ts`). | Mixed units would corrupt history and records. | `format.test.ts`, code review. |
| NN-03 | Local-first. The app works fully offline with no account. Data lives in IndexedDB on the device. | Core product promise. | Smoke test S-07 (offline reload). |
| NN-04 | The in-progress workout survives a closed tab. The editor writes through `updateActive()` on every change. | Losing a live workout is the worst failure a logger can have. | Smoke test S-03. |
| NN-05 | Sync format and semantics. The remote layout is `data/*.json` with format `chalk-sync/1`, 16 workout shards by FNV hash, and a three-way merge against a per-device base with no tombstones. Synced records stay plain JSON. The active workout and the exercise library are not synced. | Devices already in the field read and write this format. | `syncCore.test.ts`. |
| NN-06 | Hevy CSV compatibility for import (metric and imperial columns) and export (same columns). | The owner's history came from Hevy's `workout_data.csv`. | `hevy.test.ts`. |
| NN-07 | Backups (`{ app: 'chalk', version: 1 }`) made by any earlier version must still restore. | Backups are the recovery path when there's no sync. | `backup.test.ts`. |
| NN-08 | Library exercises are re-seeded with `bulkPut` when `LIBRARY_VERSION` changes and are never edited in place. Editing one saves a custom copy with `replaces`. | Re-seeding would overwrite edits. | Code review. |
| NN-09 | Records: the first session of an exercise is the baseline and doesn't count. Warm-ups and unchecked sets never count. | Matches how users read their PRs. | `stats.test.ts`. |
| NN-10 | Dexie schema versions are append-only. Never edit an existing `db.version(n)` block; add a new version. | Editing one breaks upgrades on installed devices. | Code review. |
| NN-11 | The GitHub token stays on the device and is only sent to `api.github.com`. Public repositories are refused. AI sessions never handle the owner's secrets. | Privacy of training data and the token. | `github.ts`, CSP `connect-src`. |
| NN-12 | Hash routing. The app works from a sub-path such as GitHub Pages `/chalk/`. | Static hosting without rewrites. | Smoke test S-08 (preview build at `/chalk/`). |
| NN-13 | The rest alert never takes audio focus. It uses a Web Audio beep plus a near-silent keep-alive track (`restAlert.ts`). | Tested on Android: an audible `<audio>` beep paused Spotify for good. | Manual phone test only. |
| NN-14 | Don't copy Hevy's licensed assets (3D animations, images). | Copyright. | Review. |
| NN-15 | Pushing to `main` deploys to the live app (GitHub Pages). Only merge or push with the owner's go-ahead. | Production for real use. | Process. |
| NN-16 | Design language: violet-tinted charcoal greys with a purple accent. Set badges are W orange, F red, D blue; a done row is green. | Owner's chosen look (2026-09-24). W changed from yellow to orange at the owner's request (2026-10-05, FEAT-006; `DECISIONS.md`). | Visual QA; contrast checks in `TEST_STATUS.md`. |
