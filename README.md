# Chalk

A free workout logger inspired by Hevy. It runs in the browser, installs to your phone's home screen, and works offline. Your data stays on your device.

- **Log workouts.** Sets with weight/reps/time/distance, warm-up, failure and drop sets, RPE, notes and supersets. Your previous numbers show next to every set, and a rest timer starts when you check a set off.
- **Routines.** Build them yourself, save one from any past workout, or create them from your history in one tap.
- **1,000+ exercises**, most with pictures and instructions. Add your own in seconds and pick what you log: weight & reps, bodyweight, assisted, time, distance…
- **Progress.** Personal records, a chart for each exercise (heaviest weight, est. 1RM, volume…), weekly time/volume/sets, sets per muscle and a consistency calendar.
- **Hevy import.** Brings in your whole Hevy history from its CSV export. You can also export to the same CSV format, and back up or restore everything as JSON.
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

Workouts are stored in the browser's IndexedDB on the device you log them on. There's no account and no server. Because of that:

- Use **Settings → Back up data** now and then, and save the file somewhere safe (Files, Drive, email…). **Restore backup** brings everything back on a new phone.
- Data belongs to the address you opened the app from. Workouts logged on `localhost` won't appear on your GitHub Pages address. Move them with a backup.

To import from Hevy: in Hevy go to **Profile → Settings → Export & import data → Export workouts**, then in Chalk go to **Progress → ⚙ Settings → Import from Hevy**.

## Project layout

```
scripts/build-exercises.mjs   regenerates src/data/exercises.json (npm run exercises)
src/db.ts                     IndexedDB schema (Dexie) and exercise library seeding
src/lib/                      stats & records, Hevy CSV import/export, backups, routing, formatting
src/components/               workout editor, exercise picker, charts, sheets
src/pages/                    one file per screen
```

Exercise library: [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (public domain), plus a curated list of machine and cable exercises.
