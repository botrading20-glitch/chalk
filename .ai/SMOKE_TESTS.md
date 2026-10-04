# Smoke tests

The smallest checks that prove Chalk works. Run them after major changes, before merging to `main`, and when resuming long work.

## Setup

```bash
npm run dev            # http://localhost:5173 (launch config: chalk-dev)
node scripts/sample-backup.mjs   # writes tmp-import/chalk-sample-backup.json
```

The data in the dev browser belongs to `localhost:5173` only. Restore the sample through **Progress → ⚙ Settings → Restore backup**. To start clean, use **Settings → Erase all data** (dev browser only, never the owner's phone).

## Automated

| ID | Check | Command | Pass |
|----|-------|---------|------|
| A-01 | Types | `npm run typecheck` | exit 0 |
| A-02 | Unit tests | `npm test` | all pass (the GitHub smoke test is skipped without env vars) |
| A-03 | Production build + service worker | `npm run build` | exit 0, `dist/sw.js` exists |

## Manual (browser, phone-sized viewport 375×812)

| ID | Flow | Pass |
|----|------|------|
| S-01 | App loads | Workout tab renders with no console errors. |
| S-02 | Navigation | All four tabs open; back arrows return to the previous screen. |
| S-03 | Live workout survives reload | Start an empty workout, add an exercise, type weight and reps, reload: the values are still there. |
| S-04 | Set check and rest timer | Check a set: the row turns green and the rest bar counts down; −15/+15/Skip work. |
| S-05 | Routine round trip | Create a routine with 2 exercises, save, start it: sets are pre-filled. |
| S-06 | Finish and history | Finish the workout: the detail page shows "Workout N saved"; it appears in History; edit it and save. |
| S-07 | Offline | On the preview build (S-08), load once, go offline in devtools, reload: the app works. |
| S-08 | Sub-path build | `npm run build` with `BASE_PATH=/chalk/` (in Git Bash prefix `MSYS_NO_PATHCONV=1`, or it rewrites the path to `/Program Files/Git/chalk/` and the page loads blank), then `npx vite preview --base /chalk/ --port 4173` (launch config `chalk-preview`); open `/chalk/`: loads with no CSP violations in the console. |
| S-09 | Backup round trip | Settings → Back up data; Erase all data; Restore the file: counts match. |
| S-10 | Hevy import | Import a Hevy `workout_data.csv`; the preview shows workouts and exercises; import; records appear. |
| S-11 | Crash screen | (dev only) throw inside a page render: the recovery screen shows, and *Download backup* works. |
