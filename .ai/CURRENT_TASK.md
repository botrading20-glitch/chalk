# Current task

## Task
No task is active. Waiting on the owner for REL-101 (publish the `setward` branch) and the on-phone checks.

## Last session (2026-10-05, afternoon)
Applied the master prompt (v2) at session start: reconciled `.ai/` with the working tree, kept the uncommitted rebrand safe, and did the low-severity backlog items that didn't need an owner decision.

- **Branch `setward`** (local only, from `main` @ 047c53f), 5 commits plus the notes commit:
  - 6ce6fb4 Rename the app to Setward (the earlier rebrand session's work, committed unchanged)
  - e40a906 Rebrand notes and `AGENTS.md`
  - 83fd874 UX-002 (delete checks routines and the live workout) and UX-003 (no session volume for assisted bodyweight)
  - 436c05f A11Y-002 (arrow keys in segmented controls)
  - 4ae76c3 DOC-002 (share card grey matches `--text-3`)
- `AGENTS.md` now points to `.claude/launch.json` and matches `CLAUDE.md`.
- `main` is untouched; nothing pushed. The live app is still Chalk @ 6d15c2e.

## Verification
62 tests pass (2 opt-in skipped); `/chalk/` build passes; each fix checked in the dev browser with the sample data; preview S-01/S-02/S-08 pass with no CSP violations. Details: `TEST_STATUS.md`.

## Open decisions for the owner
- **REL-101:** publish? It renames the installed app and changes its icon; data and app identity stay.
- **UX-002 default:** blocking the delete was chosen. Say if routines should drop the exercise automatically instead.
- **DX-002:** add ESLint (free, dev-only), or keep strict `tsc` only.

## Environment notes
- The dev server on :5173 (`vite --host 127.0.0.1`, PID 13440) was already running and was left running. Its browser storage on 127.0.0.1:5173 now holds the QA sample (65 workouts); QA fixtures were removed.
- `tmp-import/` (ignored) holds the sample backup and the rebrand session's render aids.

## Next exact action
Ask the owner whether to publish. If yes: on `main`, `git merge --no-ff setward` with a message file, run `npm test` and `MSYS_NO_PATHCONV=1 BASE_PATH=/chalk/ npm run build`, push with `GH_TOKEN` from `gh auth token --user botrading20-glitch`, confirm the Pages run, load the live URL, then hand the owner the phone checks in `RELEASE_CHECKLIST.md`.

## Last updated
2026-10-05
