# Decisions

Current decisions in brief. Detailed records are in `decisions/`. Earlier architecture decisions (hash routing, Dexie, three-way sync, the rest-alert design) are explained in `CLAUDE.md` and are not repeated here.

| Date | Decision | Why | Record |
|------|----------|-----|--------|
| 2026-10-05 | DX-002: no linter. Keep strict `tsc` (with `noUnused*`) as the only static check. | Owner's choice ("skip ESLint"). Don't propose it again unless the owner asks. | Roadmap DX-002 |
| 2026-10-05 | Commit the finished rebrand unchanged on a local branch `setward`, and put new work in separate commits after it. | The rebrand was saved but uncommitted; a branch protects it and lets the owner take the fixes with or without it. Same branch-then-review workflow as `quality-pass`; nothing pushed (NN-15). | `CURRENT_TASK.md` |
| 2026-10-05 | UX-002: block deleting a custom exercise while a workout, routine or the workout in progress uses it. **CONFIRMED by the owner** ("keep blocking the delete"). | Matches the existing rule for workouts and never edits the user's routines behind their back (REQ-Q01). | Roadmap UX-002 |
| 2026-10-05 | Map the roadmap to the v2 prompt's task states; keep legacy VERIFIED/PARTIALLY_VERIFIED labels as history. | The prompt separates task state from check results; rewriting old entries would lose history. | Roadmap header |
| 2026-10-05 | Rename the visible product to Setward with shared split-S vector geometry. | Owner requested a new name and logo. NN-16 palette and existing fonts retained. | `branding/README.md` |
| 2026-10-05 | Keep `chalk` database/backup identifiers, `chalk-sync/1`, and `/chalk/` hosting/PWA scope unchanged. | Protect NN-03/05/07/10/12: visual renaming must not detach saved data, invalidate backups or change installed-app identity. Tests and sub-path preview pass. No invariant changed. | `CURRENT_TASK.md` |
| 2026-10-04 | Treat Chalk as EXISTING_PROJECT at repair/refactor depth. No framework or architecture migration. | The stack is current, the build is clean and the audit shows 0 vulnerabilities. Value comes from data safety, not rewrites. | — |
| 2026-10-04 | Work on branch `quality-pass` with logical commits. Merging to `main` waits for the owner. | Pushing `main` deploys to the live app (NN-15). | — |
| 2026-10-04 | Add `fake-indexeddb` (dev only) so tests can run the real Dexie code for backups, the live workout and weigh-ins. | It's free, Apache-2.0, has no dependencies and isn't shipped. The alternative was to test only pure functions and leave the data writes unchecked. | — |
| 2026-10-04 | A backup restore skips damaged records and reports how many, instead of rejecting the file. Repairs are limited to fields Chalk can derive: `exerciseIds`, unknown labels become "other", and JSON `null` numbers are treated as empty. | The crash screen's backup can contain the very record that crashed the app. Rejecting the file would make that backup useless. | — |
| 2026-10-04 | Validation happens at the restore boundary only, not on sync input or when data is read. | Filtering in sync would turn "missing locally" into a deletion pushed to the cloud (NN-05). Filtering on read would hide records silently. The crash screen covers anything that still slips through. | — |
| 2026-10-04 | Skip `CHANGELOG.md` and `CHANGE_IMPACT.md`. Git history and `PROGRESS.md` cover the changelog, and impact notes go inside the roadmap task. | Avoids documentation that duplicates itself. | — |
