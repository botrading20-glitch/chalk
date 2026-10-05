# Current task

## Task
No task is active. FEAT-002/004/006 are done on the local branch `features`; publishing them (REL-102) waits for the owner. REL-101 is live; its phone checks are still open.

## Last release (2026-10-05)
- `setward` merged into `main` as 34d025d and pushed (owner: "merge and push it"). Pages run 37297499084 succeeded.
- Live at https://botrading20-glitch.github.io/chalk/: Setward title, manifest and header; bundle `index-z9IrtRPz.js`; CSP present with 0 violations; service worker in control; exercise photos load; no console messages.
- Contents: the Setward rebrand (6ce6fb4), UX-002 + UX-003 (83fd874), A11Y-002 (436c05f), DOC-002 (4ae76c3), notes. Evidence: `TEST_STATUS.md`; readiness: `RELEASE_CHECKLIST.md`.

## Open for the owner
- REL-102: merge and push `features` (stopwatch 44c6840, reorder 905ac95, orange warm-up 9567eca)? Then the phone checks in `RELEASE_CHECKLIST.md` (REL-102).
- Phone checks in `RELEASE_CHECKLIST.md` → After deploy (both releases), including the installed name/icon refresh to Setward.
- Decided 2026-10-05: keep blocking the delete of a used custom exercise (UX-002); no ESLint (DX-002 cancelled). See `DECISIONS.md`.

## Environment notes
- The dev server on :5173 (`vite --host 127.0.0.1`) was already running and was left running. Its browser storage on 127.0.0.1:5173 holds the QA sample (65 workouts).
- Local branches `quality-pass` and `setward` are merged and kept; `google-sync` is parked.
- ENV-002: deploy jobs are pinned to `ubuntu-24.04` (2026-10-05) because `ubuntu-latest` moves to Ubuntu 26 from 2026-10-19. Revisit when GitHub retires that image.

## Next exact action
Ask the owner whether to publish `features` (REL-102). If yes: on `main`, `git merge --no-ff features` with a message file, `npm test`, `MSYS_NO_PATHCONV=1 BASE_PATH=/chalk/ npm run build`, push with `GH_TOKEN` for botrading20-glitch, confirm the Pages run and the live page. Then the phone checks. Every push to `main` deploys (NN-15), so push only with the owner's go-ahead.

## Last updated
2026-10-05
