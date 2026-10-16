# Current task

## Task
Setward 1.0 launch work on branch `launch` (not merged, not deployed). The owner approved the plan in `C:\Users\ousse\.claude\plans\c-users-ousse-downloads-ultimate-projec-steady-bird.md`; milestones and status are in the roadmap ("Setward 1.0 launch"). M1 (Hevy retired, Strong import, own CSV) is done and committed; next is M2. REL-101 to REL-103 are live and still wait on the owner's phone checks.

## This session (2026-10-16)
- The owner gave the master prompt (v2) and "implement the first complete, usable workflow". The core logging workflow already exists and is live, so the owner chose DATA-002 from the backlog.
- Built `src/lib/dataCheck.ts`, `src/components/DataCheck.tsx` and `src/lib/dataCheck.test.ts`, with entry points in Settings and on the crash screen. Design, limits and evidence: roadmap DATA-002 and `TEST_STATUS.md` (Data check).
- Committed on `data-check` (code and tests ce3daae, notes e991ab7), then merged into `main` as e7ad7fe and pushed at the owner's request ("Merge data-check into main and push it"). The live page was verified.
- The commit recording this release in these notes was pushed afterwards at the owner's request ("Push the notes commit"), which deployed the same bundle a second time.

## Last release (2026-10-16)
- `data-check` merged into `main` as e7ad7fe and pushed (owner: "Merge data-check into main and push it"). Pages run 38953196792 succeeded, 0 annotations.
- Live at https://botrading20-glitch.github.io/chalk/: bundle `index-D2GzHZz1.js`, Check data opens, 0 CSP violations, no console errors. Evidence: `TEST_STATUS.md`; readiness: `RELEASE_CHECKLIST.md`.

## Earlier release (2026-10-05)
- `setward` merged into `main` as 34d025d and pushed (owner: "merge and push it"). Pages run 37297499084 succeeded.
- Live at https://botrading20-glitch.github.io/chalk/: Setward title, manifest and header; bundle `index-z9IrtRPz.js`; CSP present with 0 violations; service worker in control; exercise photos load; no console messages.
- Contents: the Setward rebrand (6ce6fb4), UX-002 + UX-003 (83fd874), A11Y-002 (436c05f), DOC-002 (4ae76c3), notes. Evidence: `TEST_STATUS.md`; readiness: `RELEASE_CHECKLIST.md`.

## Open for the owner
- Phone check for REL-103 in `RELEASE_CHECKLIST.md`: Settings → Your data → Check data for problems.
- Phone checks for REL-102 in `RELEASE_CHECKLIST.md`: the stopwatch beep and buzz at the target, finger-dragging in the reorder sheet, orange W badges.
- Phone checks in `RELEASE_CHECKLIST.md` → After deploy (both releases), including the installed name/icon refresh to Setward.
- Decided 2026-10-05: keep blocking the delete of a used custom exercise (UX-002); no ESLint (DX-002 cancelled). See `DECISIONS.md`.

## Environment notes
- No dev server or preview is left running (the ones started on 2026-10-16 were stopped). A fresh browser origin starts empty: restore `tmp-import/chalk-sample-backup.json` from Settings → Restore backup.
- Local branches `quality-pass`, `setward`, `features` and `data-check` are merged and kept; `google-sync` is parked.
- ENV-002: deploy jobs are pinned to `ubuntu-24.04` (2026-10-05) because `ubuntu-latest` moves to Ubuntu 26 from 2026-10-19. Revisit when GitHub retires that image.

## Next exact action
Continue the `launch` branch at the first TODO milestone in the roadmap (M2). Merge and push only with the owner's go-ahead.

Older next action:
Ask the owner how REL-101, REL-102 and REL-103 behave on the phone (`RELEASE_CHECKLIST.md`), fix what fails, then pick the next work with them. Every push to `main` deploys (NN-15), so push only with the owner's go-ahead.

## Last updated
2026-10-16
