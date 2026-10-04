# Current task

## Task
REL-100: merge `quality-pass` into `main` and deploy

## Objective
Ship the quality pass to the live app once the owner agrees.

## Status
BLOCKED: waiting for the owner's go-ahead (pushing `main` deploys; NN-15)

## Work completed
- Every task in phases 0–14 of `DEVELOPMENT_ROADMAP.md` is DONE or VERIFIED (DX-001, TEST-001, REL-001/002/003, DATA-001, UX-001, A11Y-001, SEC-001, QA-001, DOC-001).

## Work in progress
None. The working tree is clean after the final docs commit.

## Files modified
See `PROGRESS.md` for the commit list. `git diff main..quality-pass --stat` shows the whole change.

## Important details
- The dev browser at localhost:5173 holds the sample data (65 workouts). The preview origin (4173) holds a copy too. Both are test data only.
- `tmp-import/chalk-sample-backup.json` is git-ignored; regenerate it with `node scripts/sample-backup.mjs`.

## Known issues
Low-severity items in the roadmap "Discovered" table.

## Verification
All automated checks and smoke tests pass (`TEST_STATUS.md`). Real-device checks are pending until after deploy.

## Next exact action
If the owner approves: `git switch main`, `git merge --no-ff quality-pass`, `npm test`, `npm run build`, then push `main` with `$env:GH_TOKEN = gh auth token --user botrading20-glitch` set for the push. Watch the Pages workflow, then run the on-phone checks in `RELEASE_CHECKLIST.md`.

## Last updated
2026-10-04 21:25
