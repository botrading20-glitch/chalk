# Current task

## Task
DATA-002 (Check data for problems) is built and verified on the local branch `data-check`, cut from `main` @ 663cb56. It is committed locally (code in ce3daae, then the notes) and not merged, pushed or deployed (REL-103 waits for the owner). REL-102 (stopwatch, reordering, orange warm-up badge) is live as `main` @ c232c2d; the owner's phone checks for REL-101 and REL-102 are still open.

## This session (2026-10-16)
- The owner gave the master prompt (v2) and "implement the first complete, usable workflow". The core logging workflow already exists and is live, so the owner chose DATA-002 from the backlog.
- Built `src/lib/dataCheck.ts`, `src/components/DataCheck.tsx` and `src/lib/dataCheck.test.ts`, with entry points in Settings and on the crash screen. Design, limits and evidence: roadmap DATA-002 and `TEST_STATUS.md` (Data check).
- Committed on `data-check` at the owner's request: code and tests in ce3daae, then the notes. Nothing was pushed.

## Last release (2026-10-05)
- `setward` merged into `main` as 34d025d and pushed (owner: "merge and push it"). Pages run 37297499084 succeeded.
- Live at https://botrading20-glitch.github.io/chalk/: Setward title, manifest and header; bundle `index-z9IrtRPz.js`; CSP present with 0 violations; service worker in control; exercise photos load; no console messages.
- Contents: the Setward rebrand (6ce6fb4), UX-002 + UX-003 (83fd874), A11Y-002 (436c05f), DOC-002 (4ae76c3), notes. Evidence: `TEST_STATUS.md`; readiness: `RELEASE_CHECKLIST.md`.

## Open for the owner
- Phone checks for REL-102 in `RELEASE_CHECKLIST.md`: the stopwatch beep and buzz at the target, finger-dragging in the reorder sheet, orange W badges.
- Phone checks in `RELEASE_CHECKLIST.md` → After deploy (both releases), including the installed name/icon refresh to Setward.
- Decided 2026-10-05: keep blocking the delete of a used custom exercise (UX-002); no ESLint (DX-002 cancelled). See `DECISIONS.md`.

## Environment notes
- No dev server or preview is left running (the ones started on 2026-10-16 were stopped). A fresh browser origin starts empty: restore `tmp-import/chalk-sample-backup.json` from Settings → Restore backup.
- Local branches `quality-pass` and `setward` are merged and kept; `google-sync` is parked.
- ENV-002: deploy jobs are pinned to `ubuntu-24.04` (2026-10-05) because `ubuntu-latest` moves to Ubuntu 26 from 2026-10-19. Revisit when GitHub retires that image.

## Next exact action
Ask the owner whether to merge `data-check` and publish it (REL-103), and how REL-101 and REL-102 behave on the phone (`RELEASE_CHECKLIST.md`). Every push to `main` deploys (NN-15), so push only with the owner's go-ahead.

## Last updated
2026-10-16
