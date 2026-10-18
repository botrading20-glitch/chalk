# Smoke tests

The smallest checks that prove Chalk works. Run them after major changes, before merging to `main`, and when resuming long work.

## Setup

```bash
npm run dev            # http://localhost:5173 (launch config: chalk-dev)
node scripts/sample-backup.mjs   # writes tmp-import/chalk-sample-backup.json
```

The data in the dev browser belongs to `localhost:5173` only. Restore the sample through **Progress → ⚙ Settings → Your data → Restore backup**. To start clean, use **Settings → Your data → Erase all data** (dev browser only, never the owner's phone).

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
| S-09 | Backup round trip | Settings → Your data → Back up now (the page then says "Backed up today"); Erase all data; Restore the file: counts match. |
| S-10 | CSV import | Import a Strong CSV (or an export from Setward itself); the preview shows workouts and exercises, and asks for kg or lbs when the file has no unit; import; records appear. |
| S-11 | Crash screen | (dev only) throw inside a page render: the recovery screen shows, and *Download backup* works. |
| S-13 | First run | On the preview build with the site's data cleared: the app opens on the welcome page (no tab bar). Pick a starter program, open one, Add: Home shows its folder; reload stays on Home. Clear the data again and tap Skip for now: Home is empty and reload stays on Home. A browser that already has workouts or routines never shows the welcome page. |
| S-14 | Past workout and records | History → + → add an exercise and a set, Save: the saved celebration shows and the workout sits at its date in History; Progress → *Recent records* lists exercises that set records. |
| S-15 | Languages | Settings → Language: pick each language in turn. The title bar, tabs and Settings change at once, `<html lang>` follows, and Arabic flips the layout (`dir="rtl"`). At 320 px, open Home, the live workout with a running rest, a routine editor and Settings → Your data in German and Arabic: nothing runs off the edge. Measure with `document.documentElement.clientWidth`, not `window.innerWidth` (a phone-sized browser widens `innerWidth` to fit an overflowing page). |
| S-16 | Update, shortcuts, privacy | On a device that has data and no recorded version (or after clearing the `pref:lastSeenVersion` row in `kv`), the What's new sheet opens once on Home and does not return; on a new empty install it never opens. On the preview build, `#/?action=start` starts a workout and opens it, `#/?action=weigh` opens the weigh-in sheet, and `/chalk/privacy.html` shows the privacy page (not the app) even after the service worker is in control. At 1280 px or wider a side panel sits beside the column. |
| S-12 | Data check | Settings → Your data → *Check data for problems* reads "No problems found" on healthy data. (dev only) Put a workout with `exercises: null` into IndexedDB and reload: the crash screen shows; *Check for damaged data* lists it; *Download a backup* works; Delete then Keep leaves it; Delete then Delete removes it; *Reload Setward* opens the app. |
| S-17 | Warm-ups and live tools | Start a routine, open a barbell exercise's ⋯ menu → *Warm-up sets*: W sets appear first with loads the plates can make; run it again: it asks before replacing. Check a set heavier than last time: a trophy shows on the badge and a toast names the record. Settings → Workout: turn *live record alerts* off and the toast stops. |
| S-18 | Muscle map, report, help | In a live workout the figure button opens *Muscles*; a saved workout shows *Muscles worked*; Progress has *Monthly report* (arrows move between months, a bad month in the address falls back to the current one) and the weekly chart offers Reps and 3, 6 and 12 months. With the date set to the 3rd of a month, Home offers last month's report once (*See report* or *Not now* clears it). Settings → Help has Getting started, Routines and Questions; the two guides end with working buttons; About no longer holds the questions. |
| S-19 | Set videos | Tap a set's number: *Video* offers *Record video* and *Choose video*. Attach a clip (in the dev browser, make one with `canvas.captureStream` + `MediaRecorder` and call `attachVideo` from the page console): a camera shows on the badge, *Watch video* plays it muted with 0.25x, 0.5x and 1x chips. *Remove set* on that set asks first. Finish: the video stays on its saved set, and its camera shows on the workout page. Discard a workout: its videos go. Settings → Your data → *Set videos* shows the count and size, and clears unlinked or all videos after a confirmation. With *Videos on sets* off, the add buttons are gone but *Watch* still works. On the `/chalk/` build a blob video plays with no CSP violation. |
