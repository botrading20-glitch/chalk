# Chalk

A free workout logger inspired by Hevy. It runs in the browser, installs to your phone's home screen, and works offline. Your data stays on your device, plus an optional synced copy in your own private GitHub repository.

- **Log workouts.** Sets with weight/reps/time/distance, warm-up, failure and drop sets, RPE, notes and supersets. Your previous numbers show next to every set, and a rest timer starts when you check a set off.
- **Routines.** Build them yourself, save one from any past workout, or create them from your history in one tap.
- **1,000+ exercises**, most with pictures and instructions. Add your own in seconds and pick what you log: weight & reps, bodyweight, assisted, time, distance… Edit any library exercise and your history moves to your version.
- **Progress.** Personal records, a chart for each exercise (heaviest weight, est. 1RM, volume…), weekly time/volume/sets, sets per muscle, a consistency calendar and body-weight tracking.
- **Share.** Turn any workout into a summary image with your records, ready for the share sheet.
- **Hevy import.** Brings in your whole Hevy history from its CSV export. You can also export to the same CSV format, and back up or restore everything as JSON.
- **Cloud sync (optional).** Keeps your data in a private GitHub repository and syncs it between your phone and computer, with the full history of every change.
- kg/lbs, km/mi, dark/light theme.

## Run it on your computer

Requires [Node.js](https://nodejs.org) 20.19+ (free).

```bash
npm install
npm run dev
```

Open http://localhost:5173. To try it on your phone, connect it to the same Wi-Fi and open the "Network" address Vite prints. Installing to the home screen and offline mode only work over HTTPS, so use the deployed version for real training (see below).

## Put it on your phone (free)

The app is a set of static files, so any free static host works. GitHub Pages is the simplest:

1. Create a free GitHub account and a **public** repository (on the free plan, Pages only serves public repos; the code has no personal data in it).
2. Push this folder to the repository's `main` branch.
3. In the repository, go to **Settings → Pages** and set **Source** to **GitHub Actions**. The included workflow builds and publishes the app on every push.
4. On your phone, open `https://<your-username>.github.io/<repo-name>/`:
   - **iPhone (Safari):** Share → Add to Home Screen
   - **Android (Chrome):** ⋮ → Install app / Add to Home screen

Cloudflare Pages, Netlify and Vercel are free alternatives that also allow private repositories. Use build command `npm run build` and output folder `dist`.

## Your data

Workouts are stored in the browser's IndexedDB on the device you log them on. The app works fully offline and needs no account.

To keep a copy off the device, turn on **cloud sync**, or use **Settings → Back up data** now and then. **Restore backup** brings a backup file back on any device.

### Cloud sync (free)

Chalk syncs to a **private GitHub repository** that you own. There's no Chalk server in between.

1. Create a private repository, for example `chalk-data`: [github.com/new](https://github.com/new?name=chalk-data&visibility=private).
2. Create a fine-grained access token at [github.com/settings/personal-access-tokens/new](https://github.com/settings/personal-access-tokens/new):
   - **Repository access:** Only select repositories → your data repository
   - **Permissions → Contents:** Read and write
   - **Expiration:** as long as you like. When it expires, Chalk asks for a new one.
3. In Chalk, open **Progress → ⚙ Settings → Cloud sync → Set up sync** and paste the repository (`yourname/chalk-data`) and the token. Do this on each device.

When a second device already has data, Chalk asks whether to replace it with the cloud copy or merge the two. Merging recognises workouts imported from Hevy on both devices and keeps them once.

After that, sync runs by itself:
- when the app opens or comes back to the foreground
- a few seconds after you save or edit anything
- when you go back online

**Settings → Sync now** forces one.

- **How it syncs:** changes are merged record by record. If the same workout was edited on two devices before they synced, the newest edit wins. If it was edited on one and deleted on the other, the edit is kept.
- **History:** every sync is a commit, so the repository's history holds every earlier version of your data.
- **The token:** it's stored in the app's storage on each device and only sent to `api.github.com`. Keep the repository private; Chalk refuses to connect to a public one.
- **Different addresses:** data belongs to the address you opened the app from, so `localhost` and your GitHub Pages address are separate. Sync or a backup moves data between them.

To import from Hevy: in Hevy go to **Profile → Settings → Export & import data → Export workouts**, then in Chalk go to **Progress → ⚙ Settings → Import from Hevy**.

## Project layout

```
scripts/build-exercises.mjs   regenerates src/data/exercises.json (npm run exercises)
src/db.ts                     IndexedDB schema (Dexie) and exercise library seeding
src/lib/                      stats & records, Hevy CSV import/export, backups, cloud sync, routing, formatting
src/components/               workout editor, exercise picker, charts, sheets
src/pages/                    one file per screen
```

Exercise library: [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (public domain), plus a curated list of machine and cable exercises.
