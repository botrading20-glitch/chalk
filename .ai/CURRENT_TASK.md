# Current task

## Task
Post-release: on-phone checks of the deployed quality pass

## Objective
Confirm on the owner's Android phone that the live app (main @ 6d15c2e) behaves as tested in the browser.

## Status
BLOCKED: needs the owner and their phone

## Work completed
- REL-100: merged `quality-pass` into `main` (6d15c2e), pushed, deployed and verified on the live URL (see `DEVELOPMENT_ROADMAP.md` → REL-100).

## Work in progress
None. The working tree is clean.

## Files modified
None since the merge, apart from these docs.

## Important details
- Installed copies update themselves on the next open (`registerType: 'autoUpdate'`). Expect one automatic reload.
- `quality-pass` still exists locally, fully merged; delete it with `git branch -d quality-pass` whenever.
- After `git switch`, files come back with CRLF endings (autocrlf). Scripted edits that match on `\n` miss; use the edit tool or normalise first.

## Known issues
Low-severity items are in the roadmap "Discovered" table, plus ENV-002 (Ubuntu 26 runner from 2026-10-19).

## Verification
Live page: new bundle, CSP present, renders, no console errors. Real-device behaviour: NOT RUN.

## Next exact action
Ask the owner for the results of the four checks under "After deploy" in `RELEASE_CHECKLIST.md`. Fix anything they report, then pick the next item with them.

## Last updated
2026-10-04 21:35
