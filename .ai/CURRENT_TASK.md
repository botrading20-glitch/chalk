# Current task

## Task
DX-001: sample data script for QA

## Objective
`node scripts/sample-backup.mjs` writes a realistic Chalk backup to `tmp-import/` that restores through Settings.

## Status
IN_PROGRESS

## Work completed
- Discovery, baseline and the `.ai/` plan (ENV-001, DISC-001, REQ-001)

## Work in progress
- Writing `scripts/sample-backup.mjs`

## Files modified
- `.ai/*` (new)

## Important details
- Branch `quality-pass` was created from `main` @ 0698dc1.
- The dev database at localhost:5173 is empty, so it's safe to seed.

## Known issues
See `TEST_STATUS.md`.

## Verification
None yet for this task.

## Next exact action
Write `scripts/sample-backup.mjs` using library ids such as `lib-x-chest-fly-machine` and `lib-x-lat-pulldown-machine`. Run it, then restore the file in the dev app through Settings → Restore backup.

## Last updated
2026-10-04 20:35
